# Collaborative filtering — "users like you also liked..."
# Core algorithm: SVD (Singular Value Decomposition)
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds

class CollaborativeFilter:
    def __init__(self, n_factors: int = 50):
        self.n_factors = n_factors
        self.item_factors = None
        self.movie_ids = None

    def fit(self, ratings_df: pd.DataFrame):
        """
        Build user-item matrix and decompose with SVD.
        U = user factors, sigma = importance weights, Vt = item factors.
        We only keep item_factors (Vt.T) to score new users.
        """
        matrix = ratings_df.pivot_table(
            index="userId", columns="movieId", values="rating"
        ).fillna(0)

        self.movie_ids = matrix.columns.tolist()
        U, sigma, Vt = svds(csr_matrix(matrix.values), k=self.n_factors)
        self.item_factors = Vt.T  # shape: (n_movies, n_factors)

    def recommend_for_new_user(self, rated_movies: dict, n: int = 10) -> list[dict]:
        """
        Project user's ratings into latent space, score all movies.
        rated_movies: {movie_id: rating}
        """
        user_vec = np.zeros(len(self.movie_ids))
        for mid, rating in rated_movies.items():
            if mid in self.movie_ids:
                user_vec[self.movie_ids.index(mid)] = rating

        # Project into latent space then reconstruct scores
        scores = (user_vec @ self.item_factors) @ self.item_factors.T

        # Zero out already-rated movies
        for mid in rated_movies:
            if mid in self.movie_ids:
                scores[self.movie_ids.index(mid)] = -999

        top = np.argsort(scores)[::-1][:n]
        return [{"movie_id": self.movie_ids[i], "score": float(scores[i])} for i in top]
