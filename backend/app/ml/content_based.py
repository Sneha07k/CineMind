# Content-based filtering — "because you liked Inception..."
# Similarity measured by cosine distance on genre vectors
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

class ContentFilter:
    def __init__(self):
        self.genre_matrix = None
        self.similarity_matrix = None
        self.movie_ids = None

    def fit(self, genre_df: pd.DataFrame):
        """Precompute pairwise cosine similarity across all movies."""
        self.movie_ids = genre_df["movieId"].tolist()
        genre_cols = [c for c in genre_df.columns if c not in ["movieId", "title"]]
        self.genre_matrix = genre_df[genre_cols].values
        self.similarity_matrix = cosine_similarity(self.genre_matrix)

    def similar_to(self, movie_id: int, n: int = 10) -> list[dict]:
        """Return n most genre-similar movies to a given film."""
        if movie_id not in self.movie_ids:
            return []
        idx = self.movie_ids.index(movie_id)
        scores = self.similarity_matrix[idx]
        top = np.argsort(scores)[::-1][1:n+1]  # skip itself at index 0
        return [{"movie_id": self.movie_ids[i], "score": float(scores[i])} for i in top]

    def recommend_from_profile(self, rated_movies: dict, n: int = 10) -> list[dict]:
        """
        Build weighted genre fingerprint from user's ratings
        (higher rated movies contribute more to the profile),
        then score all movies against that fingerprint.
        """
        profile = np.zeros(self.genre_matrix.shape[1])
        for mid, rating in rated_movies.items():
            if mid in self.movie_ids:
                profile += self.genre_matrix[self.movie_ids.index(mid)] * rating

        norm = np.linalg.norm(profile)
        if norm > 0:
            profile /= norm

        scores = self.genre_matrix @ profile
        results = [(mid, s) for mid, s in zip(self.movie_ids, scores)
                   if mid not in rated_movies]
        results.sort(key=lambda x: x[1], reverse=True)
        return [{"movie_id": mid, "score": float(s)} for mid, s in results[:n]]
