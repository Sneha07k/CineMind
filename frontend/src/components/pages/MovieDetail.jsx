import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMovie, getSimilarMovies } from '../../services/api'
import useStore from '../../store/useStore'

function StarRating({ movieId, currentRating }) {
  const [hovered, setHovered] = useState(0)
  const rate = useStore(s => s.rate)
  const removeRating = useStore(s => s.removeRating)

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => currentRating === star ? removeRating(movieId) : rate(movieId, star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', fontSize: '22px',
            color: star <= (hovered || currentRating || 0) ? 'var(--accent)' : 'var(--border)',
            transition: 'color 0.1s',
          }}
        >
          ★
        </button>
      ))}
      {currentRating && (
        <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: '0.85rem' }}>
          You rated {currentRating}/5
        </span>
      )}
    </div>
  )
}

function SimilarCard({ movie }) {
  return (
    <Link to={`/movie/${movie.movie_id}`}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <div style={{ aspectRatio: '2/3', background: 'var(--surface-2)' }}>
          {movie.poster_path ? (
            <img src={movie.poster_path} alt={movie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', padding: '0.5rem'
            }}>
              {movie.title}
            </div>
          )}
        </div>
        <div style={{ padding: '8px 10px' }}>
          <div style={{
            fontSize: '0.75rem', fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {movie.title.replace(/\s*\(\d{4}\)$/, '')}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
            {movie.genres?.slice(0, 2).join(', ')}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function MovieDetail() {
  const { id }                    = useParams()
  const [movie, setMovie]         = useState(null)
  const [similar, setSimilar]     = useState([])
  const [loading, setLoading]     = useState(true)
  const ratings                   = useStore(s => s.ratings)
  const myRating                  = ratings[Number(id)]

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getMovie(Number(id)),
      getSimilarMovies(Number(id), 8),
    ])
      .then(([mRes, sRes]) => {
        setMovie(mRes.data)
        setSimilar(sRes.data.map(s => s.movie))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted)' }}>
      Loading...
    </div>
  )

  if (!movie) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#e25c5c' }}>
      Movie not found.
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

      {/* Back */}
      <Link to="/home" style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'inline-block', marginBottom: '2rem' }}>
        ← Back to recommendations
      </Link>

      {/* Main section */}
      <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '3rem' }}>

        {/* Poster */}
        <div style={{
          flexShrink: 0, width: 220, borderRadius: 'var(--radius)', overflow: 'hidden',
          background: 'var(--surface-2)', alignSelf: 'flex-start',
          border: '1px solid var(--border)'
        }}>
          {movie.poster_path ? (
            <img src={movie.poster_path} alt={movie.title}
              style={{ width: '100%', display: 'block' }} />
          ) : (
            <div style={{ aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              No poster
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', marginBottom: 8 }}>
            {movie.title.replace(/\s*\(\d{4}\)$/, '')}
          </h1>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
            {movie.release_year && <span>{movie.release_year}</span>}
            {movie.tmdb_rating > 0 && <span style={{ color: 'var(--accent)' }}>★ {movie.tmdb_rating?.toFixed(1)} TMDB</span>}
            {movie.genres?.map(g => (
              <span key={g} style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 999, padding: '1px 10px', fontSize: '0.75rem'
              }}>{g}</span>
            ))}
          </div>

          {movie.overview && (
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 560 }}>
              {movie.overview}
            </p>
          )}

          {/* Rating */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '1rem 1.25rem', display: 'inline-block'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}>
              {myRating ? 'Your rating' : 'Rate this movie'}
            </div>
            <StarRating movieId={Number(id)} currentRating={myRating} />
          </div>
        </div>
      </div>

      {/* Similar movies */}
      {similar.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Similar movies</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '0.875rem'
          }}>
            {similar.map(m => <SimilarCard key={m.movie_id} movie={m} />)}
          </div>
        </>
      )}
    </div>
  )
}
