# Loads and preprocesses the MovieLens dataset
# Download: https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
import pandas as pd
from app.core.config import settings

def load_ratings() -> pd.DataFrame:
    return pd.read_csv(f"{settings.MOVIELENS_PATH}/ratings.csv")

def load_movies() -> pd.DataFrame:
    return pd.read_csv(f"{settings.MOVIELENS_PATH}/movies.csv")

def load_links() -> pd.DataFrame:
    """movieId -> tmdbId bridge for TMDB API calls."""
    return pd.read_csv(f"{settings.MOVIELENS_PATH}/links.csv")

def build_genre_matrix(movies_df: pd.DataFrame) -> pd.DataFrame:
    """
    One-hot encode genres for content-based filtering.
    Each row = movie. Each column = genre (0 or 1).
    """
    genres = movies_df["genres"].str.get_dummies(sep="|")
    return pd.concat([movies_df[["movieId", "title"]], genres], axis=1)
