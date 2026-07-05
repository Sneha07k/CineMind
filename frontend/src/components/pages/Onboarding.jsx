import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPopularMovies, searchMovies } from '../../services/api'
import useStore from '../../store/useStore'

const MIN_RATINGS = 5

// ── Star Rating ───────────────────────────────────────────
function StarRating({ movieId, currentRating }) {
  const [hovered, setHovered] = useState(0)
  const rate         = useStore(s => s.rate)
  const removeRating = useStore(s => s.removeRating)

  return (
    <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginTop: '8px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => currentRating === star ? removeRating(movieId) : rate(movieId, star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', padding: '2px', fontSize: '16px', lineHeight: 1,
            color: star <= (hovered || currentRating || 0) ? 'var(--accent)' : 'var(--border)',
            transition: 'color 0.1s',
          }}
        >★</button>
      ))}
    </div>
  )
}

// ── Movie Card ────────────────────────────────────────────
function MovieCard({ movie }) {
  // Subscribe directly to ratings object so card re-renders when rated
  const ratings  = useStore(s => s.ratings)
  const myRating = ratings[movie.movie_id]
  const rated    = myRating !== undefined

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden',
      border: `1px solid ${rated ? 'var(--accent)' : 'var(--border)'}`,
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ position: 'relative', aspectRatio: '2/3', background: 'var(--surface-2)' }}>
        {movie.poster_path ? (
          <img src={movie.poster_path} alt={movie.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem'
          }}>{movie.title}</div>
        )}
        {rated && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'var(--accent)', color: '#000',
            borderRadius: '999px', padding: '2px 8px',
            fontSize: '0.7rem', fontWeight: 600,
          }}>{myRating}★</div>
        )}
      </div>
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{
          fontSize: '0.8rem', fontWeight: 500, marginBottom: '2px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{movie.title.replace(/\s*\(\d{4}\)$/, '')}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '6px' }}>
          {movie.release_year || ''}
          {movie.genres?.length > 0 && ` · ${movie.genres.slice(0, 2).join(', ')}`}
        </div>
        <StarRating movieId={movie.movie_id} currentRating={myRating} />
      </div>
    </div>
  )
}

// ── Search Bar ────────────────────────────────────────────
function SearchBar({ onResults, onClear }) {
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const debounceRef             = useRef(null)

  const handleChange = useCallback((e) => {
    const val = e.target.value
    setQuery(val)

    // Clear previous debounce timer
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.trim().length < 2) {
      onClear()
      return
    }

    // Wait 350ms after user stops typing before hitting the API
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchMovies(val.trim())
        onResults(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [onResults, onClear])

  const handleClear = () => {
    setQuery('')
    onClear()
  }

  return (
    <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto 2.5rem' }}>
      <div style={{ position: 'relative' }}>
        {/* Search icon */}
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--muted)', fontSize: '1rem', pointerEvents: 'none'
        }}>🔍</span>

        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search for a movie you've seen..."
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '0.75rem 2.5rem 0.75rem 2.75rem',
            color: 'var(--text)',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e  => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e   => e.target.style.borderColor = 'var(--border)'}
        />

        {/* Clear button */}
        {query && (
          <button onClick={handleClear} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', color: 'var(--muted)', fontSize: '1.1rem', padding: 2,
          }}>×</button>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute', right: query ? 36 : 12, top: '50%',
          transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.75rem'
        }}>
          searching...
        </div>
      )}
    </div>
  )
}

// ── Main Onboarding Page ──────────────────────────────────
export default function Onboarding() {
  const [popularMovies, setPopularMovies] = useState([])
  const [searchResults, setSearchResults] = useState(null)  // null = not searching
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const navigate                          = useNavigate()

  // FIX: subscribe to `ratings` object directly, not totalRated()
  // This ensures the header re-renders whenever a rating changes
  const ratings = useStore(s => s.ratings)
  const rated   = Object.keys(ratings).length
  const ready   = rated >= MIN_RATINGS

  useEffect(() => {
    getPopularMovies()
      .then(r => setPopularMovies(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const displayedMovies = searchResults ?? popularMovies
  const isSearching     = searchResults !== null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '0.75rem' }}>
          What have you watched?
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: 460, margin: '0 auto 1.5rem' }}>
          Rate at least {MIN_RATINGS} movies and we'll build your personal taste profile.
        </p>

        {/* Progress bar */}
        <div style={{ maxWidth: 320, margin: '0 auto 1.5rem' }}>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((rated / MIN_RATINGS) * 100, 100)}%`,
              background: ready ? '#5ce2a0' : 'var(--accent)',
              borderRadius: 999,
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          </div>
          <div style={{ marginTop: 8, fontSize: '0.82rem', color: ready ? '#5ce2a0' : 'var(--muted)',
            transition: 'color 0.3s', fontWeight: ready ? 600 : 400 }}>
            {rated < MIN_RATINGS
              ? `${rated} / ${MIN_RATINGS} rated — ${MIN_RATINGS - rated} more to go`
              : `✓ ${rated} movies rated — you're ready!`}
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={() => navigate('/home')}
          disabled={!ready}
          style={{
            background: ready ? 'var(--accent)' : 'var(--surface-2)',
            color: ready ? '#000' : 'var(--muted)',
            border: ready ? 'none' : '1px solid var(--border)',
            borderRadius: 8, padding: '0.65rem 2rem',
            fontSize: '0.95rem', fontWeight: 600,
            cursor: ready ? 'pointer' : 'not-allowed',
            transition: 'all 0.25s',
            transform: ready ? 'scale(1.03)' : 'scale(1)',
          }}
        >
          {ready ? 'Get my recommendations →' : `Rate ${MIN_RATINGS - rated} more to continue`}
        </button>
      </div>

      {/* Search bar */}
      <SearchBar
        onResults={results => setSearchResults(results)}
        onClear={() => setSearchResults(null)}
      />

      {/* Section label */}
      <div style={{ marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
        {isSearching
          ? `${displayedMovies.length} result${displayedMovies.length !== 1 ? 's' : ''} found`
          : 'Popular movies — rate what you\'ve seen'}
      </div>

      {/* Grid */}
      {loading && !isSearching && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem' }}>
          Loading movies...
        </div>
      )}

      {error && !isSearching && (
        <div style={{
          textAlign: 'center', color: '#e25c5c', padding: '2rem',
          background: '#e25c5c11', borderRadius: 'var(--radius)'
        }}>
          Could not load movies. Is your backend running?<br />
          <small>{error}</small>
        </div>
      )}

      {isSearching && displayedMovies.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>
          No movies found. Try a different title.
        </div>
      )}

      {(!loading || isSearching) && displayedMovies.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '1rem',
        }}>
          {displayedMovies.map(movie => (
            <MovieCard key={movie.movie_id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  )
}
