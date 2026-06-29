from fastapi import APIRouter
from app.models.schemas import RecommendRequest

router = APIRouter()

@router.get("/movies/popular")
async def get_popular():
    """Popular movies for onboarding screen (before user rates anything)."""
    pass

@router.get("/movies/{movie_id}")
async def get_movie(movie_id: int):
    """Single movie with full TMDB metadata."""
    pass

@router.post("/recommend")
async def recommend(req: RecommendRequest):
    """
    Core endpoint. Takes rated movies, returns recommendations.
    Body: {"ratings": [{"movie_id": 1, "rating": 4.5}], "n": 10}
    """
    pass

@router.post("/taste-profile")
async def taste_profile(req: RecommendRequest):
    """Genre breakdown and stats derived from user's ratings."""
    pass

@router.get("/movies/{movie_id}/similar")
async def similar_movies(movie_id: int, n: int = 10):
    """Content-based: movies most similar to a given film."""
    pass
