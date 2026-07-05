import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getPopularMovies   = ()          => api.get('/movies/popular')
export const searchMovies       = (q)         => api.get(`/movies/search?q=${encodeURIComponent(q)}`)
export const getMovie           = (id)        => api.get(`/movies/${id}`)
export const getSimilarMovies   = (id, n=10)  => api.get(`/movies/${id}/similar?n=${n}`)
export const getRecommendations = (ratings)   => api.post('/recommend',     { ratings })
export const getTasteProfile    = (ratings)   => api.post('/taste-profile', { ratings })
