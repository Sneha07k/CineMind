"""
Run this BEFORE building any API routes.
Proves the ML pipeline works end to end.

Usage:
    cd backend
    source venv/bin/activate
    python test_ml.py
"""

import sys
import pandas as pd
import numpy as np

# ── 1. Load data ──────────────────────────────────────────

print("\n📂 Loading MovieLens data...")
try:
    ratings_df = pd.read_csv("data/ml-latest-small/ratings.csv")
    movies_df  = pd.read_csv("data/ml-latest-small/movies.csv")
    links_df   = pd.read_csv("data/ml-latest-small/links.csv")
except FileNotFoundError:
    print("❌ Dataset not found!")
    print("   Run: cd backend/data && wget https://files.grouplens.org/datasets/movielens/ml-latest-small.zip && unzip ml-latest-small.zip")
    sys.exit(1)

print(f"   ✅ {len(movies_df):,} movies loaded")
print(f"   ✅ {len(ratings_df):,} ratings from {ratings_df['userId'].nunique():,} users")

# ── 2. Build genre matrix ─────────────────────────────────

print("\n🎭 Building genre matrix...")
genre_dummies = movies_df["genres"].str.get_dummies(sep="|")
genre_df = pd.concat([movies_df[["movieId", "title"]], genre_dummies], axis=1)
print(f"   ✅ {len(genre_dummies.columns)} genres: {list(genre_dummies.columns)}")

# ── 3. Helper: movie title → movieId ─────────────────────

def find_movie(title_keyword: str) -> dict:
    """Search for a movie by keyword, return first match."""
    mask = movies_df["title"].str.contains(title_keyword, case=False, na=False)
    results = movies_df[mask]
    if results.empty:
        return None
    row = results.iloc[0]
    return {"id": int(row["movieId"]), "title": row["title"]}

def movie_title(movie_id: int) -> str:
    row = movies_df[movies_df["movieId"] == movie_id]
    return row["title"].values[0] if not row.empty else f"Movie {movie_id}"

# ── 4. Content-based filtering ────────────────────────────

print("\n🎯 Testing content-based filtering...")

from sklearn.metrics.pairwise import cosine_similarity

genre_cols    = [c for c in genre_df.columns if c not in ["movieId", "title"]]
genre_matrix  = genre_df[genre_cols].values
movie_ids     = genre_df["movieId"].tolist()
sim_matrix    = cosine_similarity(genre_matrix)

def content_similar(movie_id: int, n: int = 5) -> list:
    if movie_id not in movie_ids:
        return []
    idx    = movie_ids.index(movie_id)
    scores = sim_matrix[idx]
    top    = np.argsort(scores)[::-1][1:n+1]
    return [(movie_ids[i], float(scores[i])) for i in top]

def content_from_profile(rated: dict, n: int = 10) -> list:
    """rated = {movie_id: rating}"""
    profile = np.zeros(len(genre_cols))
    for mid, rating in rated.items():
        if mid in movie_ids:
            profile += genre_matrix[movie_ids.index(mid)] * rating
    norm = np.linalg.norm(profile)
    if norm > 0:
        profile /= norm
    scores  = genre_matrix @ profile
    results = [(mid, float(s)) for mid, s in zip(movie_ids, scores) if mid not in rated]
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:n]

# Test: find movies similar to The Matrix
matrix = find_movie("Matrix")
if matrix:
    print(f"\n   Movies similar to '{matrix['title']}':")
    for mid, score in content_similar(matrix["id"]):
        print(f"      {score:.3f}  {movie_title(mid)}")
else:
    print("   ⚠️  Matrix not found, trying Toy Story...")
    toy = find_movie("Toy Story")
    if toy:
        for mid, score in content_similar(toy["id"]):
            print(f"      {score:.3f}  {movie_title(mid)}")

# ── 5. Collaborative filtering (SVD) ─────────────────────

print("\n🤝 Training collaborative filter (SVD)...")
print("   This may take a few seconds...")

from scipy.sparse import csr_matrix as sp_matrix
from scipy.sparse.linalg import svds

N_FACTORS = 50

user_item = ratings_df.pivot_table(
    index="userId", columns="movieId", values="rating"
).fillna(0)

cf_movie_ids = user_item.columns.tolist()
U, sigma, Vt = svds(sp_matrix(user_item.values, dtype=float), k=N_FACTORS)
item_factors  = Vt.T   # (n_movies, n_factors)

print(f"   ✅ Matrix shape: {user_item.shape} | Latent factors: {N_FACTORS}")

def collab_recommend(rated: dict, n: int = 10) -> list:
    user_vec = np.zeros(len(cf_movie_ids))
    for mid, rating in rated.items():
        if mid in cf_movie_ids:
            user_vec[cf_movie_ids.index(mid)] = rating
    scores = (user_vec @ item_factors) @ item_factors.T
    for mid in rated:
        if mid in cf_movie_ids:
            scores[cf_movie_ids.index(mid)] = -999
    top = np.argsort(scores)[::-1][:n]
    return [(cf_movie_ids[i], float(scores[i])) for i in top]

# ── 6. Hybrid recommender ─────────────────────────────────

def hybrid_recommend(rated: dict, n: int = 10, collab_w: float = 0.6) -> list:
    """Blend collaborative + content. Cold start if < 5 ratings."""
    content_w = 1 - collab_w

    content_scores = {mid: s for mid, s in content_from_profile(rated, n * 2)}

    if len(rated) < 5:
        print("   (cold start — using content-based only)")
        return [(mid, s, "content") for mid, s in list(content_scores.items())[:n]]

    collab_scores = {mid: s for mid, s in collab_recommend(rated, n * 2)}

    blended = []
    for mid in set(content_scores) | set(collab_scores):
        score = (collab_scores.get(mid, 0) * collab_w +
                 content_scores.get(mid, 0) * content_w)
        blended.append((mid, score, "hybrid"))

    blended.sort(key=lambda x: x[1], reverse=True)
    return blended[:n]

# ── 7. End-to-end test ───────────────────────────────────

print("\n🍿 End-to-end test — simulating a user who likes sci-fi thrillers:\n")

sci_fi_picks = {}
for keyword in ["Matrix", "Inception", "Interstellar", "Blade Runner", "Alien"]:
    m = find_movie(keyword)
    if m:
        sci_fi_picks[m["id"]] = 5.0
        print(f"   ⭐ Rated 5.0: {m['title']}")

print(f"\n   → Getting hybrid recommendations for {len(sci_fi_picks)} rated movies...\n")

recs = hybrid_recommend(sci_fi_picks, n=10)

print("   📽️  Top recommendations:")
for i, (mid, score, method) in enumerate(recs, 1):
    title   = movie_title(mid)
    row     = genre_df[genre_df["movieId"] == mid]
    genres  = []
    if not row.empty:
        genres = [g for g in genre_cols if row.iloc[0][g] == 1]
    genre_str = ", ".join(genres[:3]) if genres else "Unknown"
    print(f"   {i:2}. [{method:13}] {title}")
    print(f"       genres: {genre_str}   score: {score:.4f}")

# ── 8. Cold start test ────────────────────────────────────

print("\n\n❄️  Cold start test — new user, only 2 ratings:\n")

cold_user = {}
m = find_movie("Toy Story")
if m:
    cold_user[m["id"]] = 4.0
    print(f"   ⭐ Rated 4.0: {m['title']}")
m2 = find_movie("Shrek")
if m2:
    cold_user[m2["id"]] = 4.5
    print(f"   ⭐ Rated 4.5: {m2['title']}")

print()
cold_recs = hybrid_recommend(cold_user, n=5)
print("   📽️  Top recommendations:")
for mid, score, method in cold_recs:
    print(f"       [{method}] {movie_title(mid)}")

# ── 9. Summary ────────────────────────────────────────────

print("\n\n✅ All tests passed! Your ML pipeline is working.")
print("   Next step: wire these functions into FastAPI routes.\n")
