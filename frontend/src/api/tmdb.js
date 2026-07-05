import axios from 'axios';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export const IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const posterUrl = (path, size = 'w500') =>
  path ? `${IMAGE_BASE}/${size}${path}` : null;
export const backdropUrl = (path, size = 'w1280') =>
  path ? `${IMAGE_BASE}/${size}${path}` : null;

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: API_KEY },
});

// A curated, genre-diverse pool of well-known films for onboarding calibration.
// Mixing eras/genres on purpose so 5-10 ratings give a real signal.
const ONBOARDING_POOL_IDS = [
  157336, // Interstellar
  27205,  // Inception
  680,    // Pulp Fiction
  238,    // The Godfather
  155,    // The Dark Knight
  13,     // Forrest Gump
  550,    // Fight Club
  578,    // Jaws
  120,    // LOTR: Fellowship
  19404,  // DDLJ
  496243, // Parasite
  10681,  // WALL-E
  37165,  // Casino Royale
  77,     // Memento
  423,    // The Pianist
  274,    // Silence of the Lambs
  346698, // Barbie
  76341,  // Mad Max: Fury Road
  872585, // Oppenheimer
  475557, // Joker
];

export async function fetchOnboardingPool() {
  const results = await Promise.all(
    ONBOARDING_POOL_IDS.map((id) =>
      tmdb.get(`/movie/${id}`, { params: { append_to_response: 'credits' } })
        .then((r) => r.data)
        .catch(() => null)
    )
  );
  return results.filter(Boolean);
}

export async function fetchTrending(timeWindow = 'week') {
  const { data } = await tmdb.get(`/trending/movie/${timeWindow}`);
  return data.results;
}

export async function fetchMovieDetail(id) {
  const { data } = await tmdb.get(`/movie/${id}`, {
    params: { append_to_response: 'credits,videos,similar' },
  });
  return data;
}

export async function searchMovies(query) {
  const { data } = await tmdb.get('/search/movie', { params: { query } });
  return data.results;
}

export default tmdb;
