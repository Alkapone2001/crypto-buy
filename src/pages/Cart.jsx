import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Cart() {
  const { items, removeItem, total } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!user) { navigate('/login?redirect=/checkout'); return }
    navigate('/checkout')
  }

  if (items.length === 0) return (
    <div className="page-enter" style={{ padding: '80px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🛍️</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 12 }}>Your cart is empty</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Discover products worth adding</p>
      <Link to="/products"><button className="btn btn-primary">Browse store</button></Link>
    </div>
  )

  return (
    <div className="page-enter" style={{ padding: '48px 0' }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, marginBottom: 40 }}>
          Your cart
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '20px', background: 'var(--card-bg)',
                border: '1px solid var(--border)', borderRadius: 8,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 8,
                  background: 'var(--cream)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
                }}>
                  {item.category === 'Ebooks' ? '📖' : item.category === 'Courses' ? '🎓' : item.category === 'Design' ? '🎨' : '📦'}
                </div>
                <div style={{ flex: 1 }}>
                  <Link to={`/products/${item.id}`}>
                    <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.name}</h3>
                  </Link>
                  <span className="badge badge-muted">{item.category}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                    ${item.price.toFixed(2)}
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ color: 'var(--error)', padding: '6px 10px' }}
                    onClick={() => removeItem(item.id)}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card" style={{ padding: 28, position: 'sticky', top: 80 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
              Order summary
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--muted)' }}>
                  <span>{item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <hr className="divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
              onClick={handleCheckout}
            >
              {user ? 'Complete purchase' : 'Sign in to checkout'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
              🔒 Secure checkout · Instant delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
