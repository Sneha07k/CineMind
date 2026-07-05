import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getRecommendations } from '../../services/api'
import useStore from '../../store/useStore'

// ── Method badge ──────────────────────────────────────────
function MethodBadge({ method }) {
  const colors = {
    hybrid:        { bg: '#5c8ae222', text: '#5c8ae2' },
    content:       { bg: '#e2b04a22', text: '#e2b04a' },
    collaborative: { bg: '#5ce2a022', text: '#5ce2a0' },
  }
  const c = colors[method] || colors.content
  return (
    <span style={{
      background: c.bg, color: c.text,
      borderRadius: 999, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      {method}
    </span>
  )
}

// ── Recommendation card ───────────────────────────────────
function RecCard({ item }) {
  const { movie, reason, method, score } = item
  const [imgErr, setImgErr] = useState(false)

  return (
    <Link to={`/movie/${movie.movie_id}`} style={{ display: 'block' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Poster */}
        <div style={{ position: 'relative', aspectRatio: '2/3', background: 'var(--surface-2)' }}>
          {movie.poster_path && !imgErr ? (
            <img
              src={movie.poster_path}
              alt={movie.title}
              onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem'
            }}>
              {movie.title}
            </div>
          )}
          {/* TMDB rating pill */}
          {movie.tmdb_rating > 0 && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
              borderRadius: 999, padding: '2px 8px',
              fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)'
            }}>
              ★ {movie.tmdb_rating?.toFixed(1)}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 14px' }}>
          <div style={{
            fontSize: '0.82rem', fontWeight: 500, marginBottom: 4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {movie.title.replace(/\s*\(\d{4}\)$/, '')}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 8 }}>
            {movie.release_year} · {movie.genres?.slice(0, 2).join(', ')}
          </div>
          <div style={{ marginBottom: 8 }}>
            <MethodBadge method={method} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontStyle: 'italic' }}>
            {reason}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main Home page ────────────────────────────────────────
export default function Home() {
  const [recs, setRecs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const navigate              = useNavigate()
  const ratingsAsArray        = useStore(s => s.ratingsAsArray)
  const totalRated            = useStore(s => s.totalRated)

  useEffect(() => {
    const ratings = ratingsAsArray()
    if (ratings.length === 0) {
      navigate('/')
      return
    }
    getRecommendations(ratings)
      .then(r => setRecs(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const hybrid   = recs.filter(r => r.method === 'hybrid')
  const content  = recs.filter(r => r.method === 'content')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 8 }}>
          Your picks
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          Based on {totalRated()} movies you rated ·{' '}
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', color: 'var(--accent)', fontSize: 'inherit', padding: 0 }}
          >
            add more ratings
          </button>
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '6rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎬</div>
          Building your recommendations...
        </div>
      )}

      {error && (
        <div style={{
          textAlign: 'center', color: '#e25c5c', padding: '2rem',
          background: '#e25c5c11', borderRadius: 'var(--radius)'
        }}>
          {error}
        </div>
      )}

      {!loading && !error && recs.length > 0 && (
        <>
          {/* Legend */}
          <div style={{
            display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
            marginBottom: '2rem', fontSize: '0.78rem', color: 'var(--muted)'
          }}>
            <span><span style={{ color: '#5c8ae2' }}>■</span> Hybrid — collab + content blend</span>
            <span><span style={{ color: '#e2b04a' }}>■</span> Content — genre match</span>
            <span><span style={{ color: '#5ce2a0' }}>■</span> Collaborative — users like you</span>
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1rem',
          }}>
            {recs.map((item, i) => (
              <RecCard key={`${item.movie.movie_id}-${i}`} item={item} />
            ))}
          </div>
        </>
      )}

      {!loading && !error && recs.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem' }}>
          No recommendations yet.{' '}
          <button onClick={() => navigate('/')} style={{ background: 'none', color: 'var(--accent)' }}>
            Rate more movies
          </button>
        </div>
      )}
    </div>
  )
}
