import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const handleLogout = () => { logout(); navigate('/') }
  const active = (path) => location.pathname === path

  return (
    <nav style={{ borderBottom: '1px solid var(--border)', background: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 8 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>₿</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
            Crypto<span style={{ color: 'var(--primary)' }}>Exchange</span>
          </span>
        </Link>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link to="/exchange">
            <button className="btn btn-ghost" style={{ fontWeight: active('/exchange') ? 600 : 400, color: active('/exchange') ? 'var(--primary)' : 'var(--muted)' }}>
              Exchange
            </button>
          </Link>

          {user && (
            <Link to="/orders">
              <button className="btn btn-ghost" style={{ fontWeight: active('/orders') ? 600 : 400, color: active('/orders') ? 'var(--primary)' : 'var(--muted)' }}>
                My Orders
              </button>
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin">
              <button className="btn btn-ghost" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>Admin</button>
            </Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                {user.name[0].toUpperCase()}
              </div>
              <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 13 }} onClick={handleLogout}>Sign out</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
              <Link to="/login"><button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>Sign in</button></Link>
              <Link to="/register"><button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Get started</button></Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
