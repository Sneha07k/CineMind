# CineMind 🎬

A hybrid movie recommendation system built with React + FastAPI.
Uses collaborative filtering (SVD) + content-based filtering (cosine similarity on genres).

## Setup

### 1. Download MovieLens dataset
```
wget https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
unzip ml-latest-small.zip -d backend/data/
```

### 2. Get a free TMDB API key
Sign up at https://www.themoviedb.org/settings/api
Copy your key into `backend/.env`

### 3. Backend
```
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your TMDB key
uvicorn main:app --reload
```

### 4. Frontend
```
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173
API runs at http://localhost:8000

## Architecture
- `backend/app/ml/`         — all ML logic (collaborative, content, hybrid)
- `backend/app/services/`   — TMDB API integration
- `frontend/src/store/`     — Zustand global state (user ratings)
- `frontend/src/hooks/`     — data fetching hooks
- `frontend/src/components/pages/` — Onboarding, Home, MovieDetail, TasteProfile
