import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

const NETWORK_COLORS = { BSC: '#d97706', ERC20: '#7c3aed', TRC20: '#dc2626', TRX: '#dc2626' }
const NETWORK_BG    = { BSC: '#fef3c7', ERC20: '#ede9fe', TRC20: '#fee2e2', TRX: '#fee2e2' }

const STATUS_STYLE = {
  pending:    { bg: '#fef9c3', color: '#a16207', label: '⏳ Pending' },
  processing: { bg: '#dbeafe', color: '#1d4ed8', label: '⚙️ Processing' },
  completed:  { bg: '#dcfce7', color: '#15803d', label: '✅ Completed' },
  cancelled:  { bg: '#fee2e2', color: '#dc2626', label: '❌ Cancelled' },
}

export default function Orders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    if (authLoading || !user) return
    api.get('/orders/my')
      .then(r => { setOrders(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [authLoading, user])

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
  if (!user) return <Navigate to="/login?redirect=/orders" />

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 4 }}>My Orders</h1>
            <p style={{ color: 'var(--muted)' }}>Track all your buy and sell orders</p>
          </div>
          <Link to="/exchange"><button className="btn btn-primary">+ New Order</button></Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No orders yet</p>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Start trading to see your orders here</p>
            <Link to="/exchange"><button className="btn btn-primary">Make your first trade</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map(order => {
              const st = STATUS_STYLE[order.status] || STATUS_STYLE.pending
              return (
                <div key={order.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                          background: order.type === 'buy' ? '#dcfce7' : '#fee2e2',
                          color: order.type === 'buy' ? '#15803d' : '#dc2626',
                        }}>{order.type === 'buy' ? '↓ BUY' : '↑ SELL'}</span>
                        <span style={{ fontWeight: 700 }}>{order.crypto_amount} {order.crypto}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: NETWORK_BG[order.network], color: NETWORK_COLORS[order.network] }}>{order.network}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                        #{order.id.slice(0,8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>${parseFloat(order.fiat_amount).toFixed(2)}</div>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                  </div>

                  <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {order.type === 'buy' && order.wallet_address && (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                        Receiving wallet: <span style={{ fontFamily: 'monospace', color: 'var(--ink)' }}>{order.wallet_address.slice(0,16)}...{order.wallet_address.slice(-6)}</span>
                      </div>
                    )}
                    {order.type === 'sell' && order.deposit_address && (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                        Send to: <span style={{ fontFamily: 'monospace', color: 'var(--ink)' }}>{order.deposit_address.slice(0,16)}...{order.deposit_address.slice(-6)}</span>
                      </div>
                    )}
                    {order.tx_hash && (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                        TX: <span style={{ fontFamily: 'monospace', color: 'var(--ink)' }}>{order.tx_hash.slice(0,20)}...</span>
                      </div>
                    )}
                    {order.admin_note && (
                      <div style={{ fontSize: 13, background: '#eff6ff', borderRadius: 6, padding: '6px 10px', color: '#1d4ed8' }}>
                        ℹ️ {order.admin_note}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
