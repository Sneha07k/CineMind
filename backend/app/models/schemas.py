from pydantic import BaseModel
from typing import Optional

class Movie(BaseModel):
    movie_id: int
    title: str
    genres: list[str]
    poster_path: Optional[str] = None
    overview: Optional[str] = None
    release_year: Optional[int] = None
    tmdb_rating: Optional[float] = None

class RatingInput(BaseModel):
    movie_id: int
    rating: float  # 0.5 – 5.0

class RecommendRequest(BaseModel):
    ratings: list[RatingInput]
    n: int = 10

class RecommendedMovie(BaseModel):
    movie: Movie
    score: float
    reason: str   # "Because you loved Inception"
    method: str   # "collaborative" | "content" | "hybrid"

class TasteProfile(BaseModel):
    top_genres: list[dict]   # [{"genre": "Sci-Fi", "weight": 0.42}]
    avg_rating: float
    total_rated: int
