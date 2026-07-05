# CineMind 🎬

A hybrid movie recommendation system — React + FastAPI.
Combines collaborative filtering (SVD) and content-based filtering (cosine similarity on genres).

## Screenshots

<img width="1279" height="619" alt="image" src="https://github.com/user-attachments/assets/d7deb158-e7b3-44f9-a3de-49a24738b2ff" />

<br>

<img width="1279" height="619" alt="image" src="https://github.com/user-attachments/assets/70a700ff-423e-4c80-b028-1f979aa7edde" />


<br>

<img width="1279" height="628" alt="image" src="https://github.com/user-attachments/assets/d3d6dae1-4cd9-4b9f-9c53-cd4f8fe874cd" />



<img width="1279" height="625" alt="image" src="https://github.com/user-attachments/assets/5e0b80cc-7934-420d-af21-65c4e4394618" />


<br>


<img width="1279" height="625" alt="image" src="https://github.com/user-attachments/assets/eafcef2a-afb8-43e5-8af8-cd4263d416f8" />

<br>

## Quick Start

### 1. Download MovieLens dataset
```
cd backend/data
wget https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
unzip ml-latest-small.zip
```

### 2. Get a free TMDB API key
Sign up at https://www.themoviedb.org/settings/api
Then:
```
cp backend/.env.example backend/.env
# paste your key into backend/.env
```

### 3. Run the backend
```
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Run the frontend
```
cd frontend
npm install
npm run dev
```

App → http://localhost:5173
API → http://localhost:8000
API docs → http://localhost:8000/docs

## Project Structure
```
backend/
  main.py                  # FastAPI entry, trains models on startup
  app/
    ml/
      collaborative.py     # SVD-based collaborative filter
      content_based.py     # Cosine similarity on genre vectors
      hybrid.py            # Blends both, handles cold start
      data_loader.py       # Loads MovieLens CSVs
      state.py             # Global model state shared across requests
    api/routes.py          # All API endpoints
    models/schemas.py      # Pydantic request/response models
    services/tmdb.py       # TMDB poster + metadata fetching
    core/config.py         # Settings (TMDB key, dataset path)

frontend/
  src/
    components/pages/      # Onboarding, Home, MovieDetail, TasteProfile
    components/layout/     # Navbar
    store/useStore.js      # Zustand global state (user ratings)
    services/api.js        # All API calls
    hooks/                 # useRecommendations hook
    utils/genres.js        # Genre colour mapping
