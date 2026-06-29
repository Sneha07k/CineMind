import { useState } from 'react'
import { getRecommendations } from '../services/api'
import useStore from '../store/useStore'

export function useRecommendations() {
  const [recs, setRecs]       = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const ratingsAsArray        = useStore(s => s.ratingsAsArray)

  const fetchRecs = async () => {
    const ratings = ratingsAsArray()
    if (!ratings.length) return
    setLoading(true)
    try {
      const { data } = await getRecommendations(ratings)
      setRecs(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { recs, loading, error, fetchRecs }
}
