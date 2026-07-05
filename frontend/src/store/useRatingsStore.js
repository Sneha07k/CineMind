import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Ratings keyed by TMDB movie id -> { rating (1-5), movie (snapshot), ratedAt }
const useRatingsStore = create(
  persist(
    (set, get) => ({
      ratings: {},

      rateMovie: (movie, rating) =>
        set((state) => ({
          ratings: {
            ...state.ratings,
            [movie.id]: { rating, movie, ratedAt: Date.now() },
          },
        })),

      unrateMovie: (movieId) =>
        set((state) => {
          const next = { ...state.ratings };
          delete next[movieId];
          return { ratings: next };
        }),

      ratingCount: () => Object.keys(get().ratings).length,

      isWarm: () => Object.keys(get().ratings).length >= 5,

      reset: () => set({ ratings: {} }),
    }),
    { name: 'cinemind-ratings' }
  )
);

export default useRatingsStore;
