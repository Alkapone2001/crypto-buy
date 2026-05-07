import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

const STATUS = ['pending', 'processing', 'completed', 'cancelled']

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [form, setForm] = useState({ email: 'admin@exchange.com', password: 'admin123' })
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    const [statsRes, ordersRes] = await Promise.all([api.get('/admin/stats'), api.get('/admin/orders')])
    setStats(statsRes.data)
    setOrders(ordersRes.data)
  }

  useEffect(() => {
    if (!token) return
    load().catch(() => {
      localStorage.removeItem('token')
      setToken('')
    })
  }, [token])

  const login = async event => {
    event.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      if (res.data.user.role !== 'admin') throw new Error('Admin only')
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setToken(res.data.token)
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Login failed')
    }
  }

  const update = async (order, status, admin_note = order.admin_note || '') => {
    await api.patch(`/admin/orders/${order.id}`, { status, admin_note })
    setOrders(prev => prev.map(item => item.id === order.id ? { ...item, status, admin_note } : item))
    setMessage('Order updated')
    setTimeout(() => setMessage(''), 1800)
  }

  if (!token) {
    return (
      <div className="cx-page">
        <header className="cx-header">
          <Link to="/buy/btc" className="cx-brand"><div className="cx-logo">D</div><span>Digital<span>Vault</span></span></Link>
        </header>
        <main className="cx-center">
          <form className="cx-card cx-admin-login" onSubmit={login}>
            <h1>Admin dashboard</h1>
            <p>Sign in to manage your orders.</p>
            {error && <p className="cx-error">{error}</p>}
            <label className="cx-field"><span>Email</span><input value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
            <label className="cx-field"><span>Password</span><input type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
            <button className="cx-next">Sign in</button>
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="cx-page">
      <header className="cx-header">
        <Link to="/buy/btc" className="cx-brand"><div className="cx-logo">D</div><span>Digital<span>Vault</span></span></Link>
        <nav className="cx-nav">
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setToken('') }}>Sign out</button>
        </nav>
      </header>
      <main className="cx-admin">
        <div className="cx-admin-title">
          <div>
            <span className="cx-kicker">Private view</span>
            <h1>Orders dashboard</h1>
          </div>
          {message && <p>{message}</p>}
        </div>

        {stats && (
          <section className="cx-stat-grid">
            <div><span>Total</span><strong>{stats.total}</strong></div>
            <div><span>Pending</span><strong>{stats.pending}</strong></div>
            <div><span>Processing</span><strong>{stats.processing}</strong></div>
            <div><span>Completed</span><strong>{stats.completed}</strong></div>
            <div><span>Volume</span><strong>${Number(stats.volume).toFixed(0)}</strong></div>
          </section>
        )}

        <section className="cx-order-list">
          {orders.map(order => (
            <article className="cx-order" key={order.id}>
              <div className="cx-order-main">
                <span className={`cx-type ${order.type}`}>{order.type}</span>
                <h2>{order.crypto_amount} {order.crypto}</h2>
                <p>{order.user_email} · ${Number(order.fiat_amount).toFixed(2)} · {order.network}</p>
                {order.commission_rate && (
                  <p>Commission: {Math.round(Number(order.commission_rate) * 100)}% · ${Number(order.commission_amount || 0).toFixed(2)}</p>
                )}
                <small>#{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleString()}</small>
                {order.wallet_address && <code>Wallet: {order.wallet_address}</code>}
                {order.deposit_address && <code>Deposit: {order.deposit_address}</code>}
              </div>
              <div className="cx-order-actions">
                <select value={order.status} onChange={event => update(order, event.target.value)}>
                  {STATUS.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
                <textarea placeholder="Admin note" value={order.admin_note || ''} onChange={event => setOrders(prev => prev.map(item => item.id === order.id ? { ...item, admin_note: event.target.value } : item))} />
                <button onClick={() => update(order, order.status, order.admin_note || '')}>Save note</button>
              </div>
            </article>
          ))}
          {!orders.length && <div className="cx-empty">No orders yet.</div>}
        </section>
      </main>
    </div>
  )
}
