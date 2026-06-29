# Hybrid recommender — blends collaborative + content scores
# Cold start solution: new users (<5 ratings) get content-only
from app.ml.collaborative import CollaborativeFilter
from app.ml.content_based import ContentFilter

class HybridRecommender:
    def __init__(self, collab_weight: float = 0.6):
        self.collab = CollaborativeFilter()
        self.content = ContentFilter()
        self.collab_weight = collab_weight
        self.content_weight = 1 - collab_weight

    def fit(self, ratings_df, genre_df):
        self.collab.fit(ratings_df)
        self.content.fit(genre_df)

    def recommend(self, rated_movies: dict, n: int = 10) -> list[dict]:
        """
        Cold start: fewer than 5 ratings → content-based only.
        Warm user: blend collaborative + content scores.
        rated_movies: {movie_id: rating}
        """
        is_cold = len(rated_movies) < 5

        content_recs = {
            r["movie_id"]: r["score"]
            for r in self.content.recommend_from_profile(rated_movies, n * 2)
        }

        if is_cold:
            return [
                {"movie_id": mid, "score": s, "method": "content"}
                for mid, s in list(content_recs.items())[:n]
            ]

        collab_recs = {
            r["movie_id"]: r["score"]
            for r in self.collab.recommend_for_new_user(rated_movies, n * 2)
        }

        results = []
        for mid in set(content_recs) | set(collab_recs):
            score = (collab_recs.get(mid, 0) * self.collab_weight +
                     content_recs.get(mid, 0) * self.content_weight)
            results.append({"movie_id": mid, "score": score, "method": "hybrid"})

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:n]
