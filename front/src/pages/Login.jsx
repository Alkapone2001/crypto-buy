import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      navigate(params.get('redirect') || '/')
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', padding: '48px 0' }}>
      <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--muted)' }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding: 36 }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 6 }}>
              {loading ? <span className="spinner" /> : 'Sign in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>Don't have an account? </span>
            <Link to="/register" style={{ color: 'var(--ink)', fontWeight: 600, fontSize: 14 }}>Sign up</Link>
          </div>

          <hr className="divider" />
          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            Demo admin: <code>admin@store.com</code> / <code>admin123</code>
          </p>
        </div>
      </div>
    </div>
  )
}
