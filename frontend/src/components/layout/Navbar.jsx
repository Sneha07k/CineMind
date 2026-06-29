import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 2rem', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100
    }}>
      <Link to="/home" style={{
        fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--accent)'
      }}>
        CineMind
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
        <Link to="/home">Discover</Link>
        <Link to="/profile">My Taste</Link>
      </div>
    </nav>
  )
}
