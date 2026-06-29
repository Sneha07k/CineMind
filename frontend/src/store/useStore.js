import { create } from 'zustand'

// Global state — user ratings persist across all pages
const useStore = create((set, get) => ({
  ratings: {},  // { movieId: rating }  e.g. { 1: 4.5, 50: 3.0 }

  rate: (movieId, rating) => set(s => ({
    ratings: { ...s.ratings, [movieId]: rating }
  })),

  removeRating: (movieId) => set(s => {
    const r = { ...s.ratings }
    delete r[movieId]
    return { ratings: r }
  }),

  // Converts to array format the API expects
  ratingsAsArray: () =>
    Object.entries(get().ratings).map(([id, rating]) => ({
      movie_id: Number(id), rating
    })),

  totalRated: () => Object.keys(get().ratings).length,
}))

export default useStore
