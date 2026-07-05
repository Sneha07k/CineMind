import { create } from 'zustand'

// Global state — user ratings persist across all pages.
// IMPORTANT: totalRated and ratingsAsArray are derived from `ratings`,
// so components must select `ratings` itself (or use these as selectors
// that read from state) to stay reactive. Never call get().ratings inside
// a function exposed as a flat value — Zustand can't track that as a dependency.
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

  // Selector-style derived getters — components call these via
  // useStore(s => s.someGetter()) which DOES correctly subscribe,
  // because Zustand re-evaluates the selector on every state change
  // and compares the *result*. Functions are stable, but their return
  // value here depends on `ratings`, so the comparison will catch updates
  // as long as the component re-renders on store updates at all —
  // which requires subscribing to `ratings` directly.
  //
  // Simplest fix: always select `ratings` directly for anything that
  // needs to re-render on rating changes, and derive counts/arrays
  // from that local value rather than calling these store methods.
  ratingsAsArray: () =>
    Object.entries(get().ratings).map(([id, rating]) => ({
      movie_id: Number(id), rating
    })),

  totalRated: () => Object.keys(get().ratings).length,
}))

export default useStore
