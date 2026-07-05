import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { getTasteProfile } from '../../services/api'
import useStore from '../../store/useStore'

const GENRE_COLORS = {
  Action: '#e25c5c', Comedy: '#e2b04a', Drama: '#5c8ae2',
  Horror: '#a05ce2', Romance: '#e25ca0', 'Sci-Fi': '#5ce2d4',
  Thriller: '#e27a5c', Animation: '#5ce27a', Documentary: '#8a8795', Fantasy: '#c45ce2',
}

function GenreBar({ genre, weight, max }) {
  const color = GENRE_COLORS[genre] || 'var(--accent)'
  const pct   = (weight / max) * 100

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.82rem' }}>
        <span>{genre}</span>
        <span style={{ color: 'var(--muted)' }}>{(weight * 100).toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 999,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem', flex: 1, minWidth: 130,
    }}>
      <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'var(--accent)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--border)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function TasteProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()
  const ratingsAsArray        = useStore(s => s.ratingsAsArray)
  const ratings               = useStore(s => s.ratings)
  const totalRated            = useStore(s => s.totalRated)

  useEffect(() => {
    const r = ratingsAsArray()
    if (r.length === 0) { navigate('/'); return }
    getTasteProfile(r)
      .then(res => setProfile(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted)' }}>
      Analysing your taste...
    </div>
  )

  if (!profile) return null

  const topGenres  = profile.top_genres || []
  const maxWeight  = topGenres[0]?.weight || 1
  const radarData  = topGenres.slice(0, 7).map(g => ({
    genre: g.genre, value: parseFloat((g.weight * 100).toFixed(1))
  }))

  // Dominant taste label
  const top2 = topGenres.slice(0, 2).map(g => g.genre)
  const tasteLabel = top2.length > 0 ? `${top2.join(' & ')} fan` : 'Eclectic taste'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

      <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 6 }}>
        Your taste profile
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2.5rem' }}>
        {tasteLabel} · built from {totalRated()} ratings
      </p>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <StatCard label="movies rated"    value={profile.total_rated} />
        <StatCard label="avg rating"      value={`${profile.avg_rating}★`} />
        <StatCard label="top genre"       value={topGenres[0]?.genre || '—'} />
        <StatCard label="taste type"      value={top2.length > 1 ? '🎭 Mixed' : '🎯 Focused'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>

        {/* Genre bars */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Genre breakdown</h2>
          {topGenres.map(g => (
            <GenreBar key={g.genre} genre={g.genre} weight={g.weight} max={maxWeight} />
          ))}
        </div>

        {/* Radar chart */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Taste radar</h2>
          {radarData.length >= 3 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="genre" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(v) => [`${v}%`, 'weight']}
                />
                <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.18} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '4rem 0', fontSize: '0.85rem' }}>
              Rate more movies across different genres to see your radar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
