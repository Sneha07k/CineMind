from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.routes import router
from app.ml.data_loader import load_ratings, load_movies, load_links, build_genre_matrix
from app.ml.hybrid import HybridRecommender
from app.ml import state

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once on startup — trains the models and stores them globally
    print("⏳ Loading dataset...")
    ratings_df = load_ratings()
    movies_df  = load_movies()
    links_df   = load_links()
    genre_df   = build_genre_matrix(movies_df)

    print("⏳ Training hybrid recommender...")
    recommender = HybridRecommender(collab_weight=0.6)
    recommender.fit(ratings_df, genre_df)

    # Store on the state module so routes can access them
    state.recommender = recommender
    state.movies_df   = movies_df
    state.ratings_df  = ratings_df
    state.links_df    = links_df
    state.genre_df    = genre_df

    print("✅ Models ready!")
    yield
    # Cleanup on shutdown (nothing needed here)

app = FastAPI(title="CineMind API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"status": "CineMind API running"}
