import re
from fastapi import APIRouter, HTTPException
from app.models.schemas import RecommendRequest, Movie, RecommendedMovie, TasteProfile
from app.ml import state
from app.services.tmdb import get_movie_details
import numpy as np

router = APIRouter()

# ── Helpers ───────────────────────────────────────────────


def get_tmdb_id(movie_id: int) -> int | None:
    """Look up TMDB id from MovieLens id via the links table."""
    row = state.links_df[state.links_df["movieId"] == movie_id]
    if row.empty:
        return None
    val = row["tmdbId"].values[0]
    return int(val) if not np.isnan(val) else None


def movie_to_schema(movie_id: int, tmdb_data: dict = None) -> Movie:
    """Convert a MovieLens row + optional TMDB data into a Movie schema."""
    row = state.movies_df[state.movies_df["movieId"] == movie_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Movie {movie_id} not found")

    row = row.iloc[0]
    genres = [g for g in row["genres"].split("|") if g != "(no genres listed)"]
    title = row["title"]

    year = None
    if "(" in title and title.endswith(")"):
        try:
            year = int(title[-5:-1])
        except ValueError:
            pass

    poster_path = None
    overview = None
    tmdb_rating = None

    if tmdb_data and tmdb_data.get("poster_path"):
        poster_path = f"https://image.tmdb.org/t/p/w500{tmdb_data['poster_path']}"
        overview = tmdb_data.get("overview")
        tmdb_rating = tmdb_data.get("vote_average")

    return Movie(
        movie_id=movie_id,
        title=title,
        genres=genres,
        poster_path=poster_path,
        overview=overview,
        release_year=year,
        tmdb_rating=tmdb_rating,
    )


def build_reason(movie_id: int, rated_movies: dict, method: str) -> str:
    """Generate a human-readable reason for the recommendation."""
    if method == "content":
        genre_row = state.genre_df[state.genre_df["movieId"] == movie_id]
        if not genre_row.empty:
            genre_cols = [
                c for c in state.genre_df.columns if c not in ["movieId", "title"]
            ]
            top_genres = [g for g in genre_cols if genre_row.iloc[0][g] == 1][:2]
            if top_genres:
                return f"Matches your taste in {' & '.join(top_genres)}"
        return "Similar to movies you enjoyed"
    elif method == "hybrid":
        return "Recommended based on your viewing profile"
    return "Popular with similar users"


def normalize_for_search(text: str) -> str:
    """
    Make a title comparable regardless of punctuation, trailing release
    year e.g. "(2008)", MovieLens's "Title, The" article-at-end
    convention, and extra whitespace/case.
    """
    text = text.strip().lower()
    text = re.sub(r"\(\d{4}\)\s*$", "", text)
    text = re.sub(r",\s*(the|a|an)\s*$", "", text)
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Routes ────────────────────────────────────────────────
#
# IMPORTANT — route ordering matters in FastAPI/Starlette.
# Routes are matched top-to-bottom against the first pattern that fits.
# Static/literal paths like "/movies/popular" and "/movies/search" MUST
# be declared BEFORE dynamic paths like "/movies/{movie_id}", otherwise
# "/movies/search" gets captured by "/movies/{movie_id}" first, with
# movie_id="search" — which then fails int validation and returns a
# confusing 422 that looks unrelated to the search logic at all.


@router.get("/movies/popular")
async def get_popular():
    """
    Return 20 popular movies for onboarding.
    Uses the most-rated movies in the dataset as a proxy for popularity.
    """
    top_ids = (
        state.movies_df.merge(state.links_df[["movieId", "tmdbId"]], on="movieId")
        .dropna(subset=["tmdbId"])
        .head(80)["movieId"]
        .tolist()
    )

    sampled = top_ids[::4][:20]

    movies = []
    for mid in sampled:
        tmdb_id = get_tmdb_id(mid)
        tmdb_data = await get_movie_details(tmdb_id) if tmdb_id else None
        movies.append(movie_to_schema(mid, tmdb_data).model_dump())

    return movies


@router.get("/movies/search")
async def search_movies(q: str = "", limit: int = 12):
    """
    Search movies by title from the local MovieLens dataset.

    NOTE: this route MUST be declared before "/movies/{movie_id}"
    below, or requests to /movies/search get swallowed by that
    dynamic route instead, with movie_id="search" — causing a
    confusing 422 int-parsing error.

    Two-pass match strategy:
      1. Fast literal substring match (handles partial typing)
      2. Normalized fallback match (handles exact pastes like
         "Dark Knight, The (2008)" or natural order "The Dark Knight")

    pandas str.contains() treats the query as regex by default, so
    literal parens/commas in a pasted title break matching unless
    escaped — handled via re.escape().
    """
    query_raw = (q or "").strip()
    if len(query_raw) < 2:
        return []

    mask = state.movies_df["title"].str.contains(
        re.escape(query_raw), case=False, na=False, regex=True
    )
    matches = state.movies_df[mask]

    if matches.empty:
        norm_query = normalize_for_search(query_raw)
        if norm_query:
            norm_titles = state.movies_df["title"].apply(normalize_for_search)
            mask = norm_titles.str.contains(re.escape(norm_query), na=False)
            matches = state.movies_df[mask]

    matches = matches.head(limit)

    results = []
    for _, row in matches.iterrows():
        mid = int(row["movieId"])
        tmdb_id = get_tmdb_id(mid)
        tmdb_data = await get_movie_details(tmdb_id) if tmdb_id else None
        results.append(movie_to_schema(mid, tmdb_data).model_dump())

    return results


@router.post("/recommend")
async def recommend(req: RecommendRequest):
    """
    Core recommendation endpoint.
    Takes user's rated movies, returns n hybrid recommendations with metadata.
    """
    if not req.ratings:
        raise HTTPException(status_code=400, detail="No ratings provided")

    rated = {r.movie_id: r.rating for r in req.ratings}
    raw = state.recommender.recommend(rated, n=req.n)

    results = []
    for item in raw:
        mid = item["movie_id"]
        method = item["method"]

        tmdb_id = get_tmdb_id(mid)
        tmdb_data = await get_movie_details(tmdb_id) if tmdb_id else None

        results.append(
            {
                "movie": movie_to_schema(mid, tmdb_data).model_dump(),
                "score": round(item["score"], 4),
                "reason": build_reason(mid, rated, method),
                "method": method,
            }
        )

    return results


@router.post("/taste-profile")
async def taste_profile(req: RecommendRequest):
    """
    Compute the user's genre fingerprint from their ratings.
    Returns top genres weighted by how much they rated those movies.
    """
    if not req.ratings:
        raise HTTPException(status_code=400, detail="No ratings provided")

    rated = {r.movie_id: r.rating for r in req.ratings}
    genre_df = state.genre_df
    genre_cols = [c for c in genre_df.columns if c not in ["movieId", "title"]]

    profile = np.zeros(len(genre_cols))
    for mid, rating in rated.items():
        row = genre_df[genre_df["movieId"] == mid]
        if not row.empty:
            profile += row[genre_cols].values[0] * rating

    total = profile.sum()
    if total > 0:
        profile = profile / total

    top_genres = sorted(
        [
            {"genre": g, "weight": round(float(w), 3)}
            for g, w in zip(genre_cols, profile)
            if w > 0
        ],
        key=lambda x: x["weight"],
        reverse=True,
    )[:8]

    ratings_list = list(rated.values())

    return TasteProfile(
        top_genres=top_genres,
        avg_rating=round(float(np.mean(ratings_list)), 2),
        total_rated=len(ratings_list),
    ).model_dump()


# ── Dynamic path-param routes go LAST ───────────────────────
# These match "/movies/<anything>" and "/movies/<anything>/similar".
# Any static route under "/movies/..." declared AFTER these would be
# incorrectly swallowed by them, so popular/search are above this line.


@router.get("/movies/{movie_id}/similar")
async def similar_movies(movie_id: int, n: int = 10):
    """
    Content-based: n movies most similar to a given film by genre.
    Used on the movie detail page.
    """
    raw = state.recommender.content.similar_to(movie_id, n=n)
    if not raw:
        raise HTTPException(
            status_code=404, detail=f"Movie {movie_id} not found in index"
        )

    results = []
    for item in raw:
        mid = item["movie_id"]
        tmdb_id = get_tmdb_id(mid)
        tmdb_data = await get_movie_details(tmdb_id) if tmdb_id else None
        results.append(
            {
                "movie": movie_to_schema(mid, tmdb_data).model_dump(),
                "score": round(item["score"], 4),
            }
        )

    return results


@router.get("/movies/{movie_id}")
async def get_movie(movie_id: int):
    """Single movie with full TMDB metadata (poster, overview, rating)."""
    tmdb_id = get_tmdb_id(movie_id)
    tmdb_data = await get_movie_details(tmdb_id) if tmdb_id else None
    return movie_to_schema(movie_id, tmdb_data).model_dump()
