import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'

const categoryEmoji = { Ebooks: '📖', Courses: '🎓', Design: '🎨', Tools: '🔧' }
const categoryColors = { Ebooks: '#e8f4fd', Courses: '#fdf4e3', Design: '#f3e8fd', Tools: '#e8fdf4' }

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addItem, removeItem, inCart } = useCart()

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(r => { setProduct(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  )

  if (!product) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ fontSize: 18, color: 'var(--muted)' }}>Product not found.</p>
      <Link to="/products"><button className="btn btn-primary" style={{ marginTop: 16 }}>Back to store</button></Link>
    </div>
  )

  const isInCart = inCart(product.id)

  return (
    <div className="page-enter" style={{ padding: '48px 0' }}>
      <div className="container">
        <Link to="/products">
          <button className="btn btn-ghost" style={{ marginBottom: 32, paddingLeft: 0 }}>
            ← Back to store
          </button>
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 60, alignItems: 'start' }}>
          {/* Left: info */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <span className="badge badge-gold">{product.category}</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 900, lineHeight: 1.15, marginBottom: 24 }}>
              {product.name}
            </h1>
            <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 32 }}>
              {product.description}
            </p>

            {product.downloads > 0 && (
              <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                <div style={{ padding: '16px 24px', background: 'var(--cream)', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{product.downloads.toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Downloads</div>
                </div>
              </div>
            )}

            <div style={{ padding: '24px', background: 'var(--cream)', borderRadius: 8 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 12 }}>What's included</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Instant digital download', 'Lifetime access', '30-day money-back guarantee', 'Free future updates'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--success)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: purchase card */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="card" style={{ overflow: 'visible' }}>
              {/* Visual */}
              <div style={{
                height: 200,
                background: categoryColors[product.category] || 'var(--cream)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 80, borderRadius: '8px 8px 0 0',
              }}>
                {categoryEmoji[product.category] || '📦'}
              </div>

              <div style={{ padding: 28 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, marginBottom: 8 }}>
                  ${product.price.toFixed(2)}
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
                  One-time purchase • Instant delivery
                </p>

                <button
                  className={isInCart ? 'btn btn-outline' : 'btn btn-gold'}
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, marginBottom: 12 }}
                  onClick={() => isInCart ? removeItem(product.id) : addItem(product)}
                >
                  {isInCart ? '✓ In your cart' : 'Add to cart'}
                </button>

                <Link to="/cart">
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}>
                    Go to checkout →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
