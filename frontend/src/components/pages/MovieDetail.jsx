// Full movie page: poster, overview, cast, similar movies, rate it
// TODO: fetch /api/movies/:id and /api/movies/:id/similar
import { useParams } from 'react-router-dom'

export default function MovieDetail() {
  const { id } = useParams()
  return <div style={{ padding: '2rem' }}>Movie {id} — detail page</div>
}
