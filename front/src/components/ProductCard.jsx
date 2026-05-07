import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const categoryColors = {
  Ebooks: '#e8f4fd',
  Courses: '#fdf4e3',
  Design: '#f3e8fd',
  Tools: '#e8fdf4',
}

const categoryEmoji = {
  Ebooks: '📖',
  Courses: '🎓',
  Design: '🎨',
  Tools: '🔧',
}

export default function ProductCard({ product }) {
  const { addItem, inCart, removeItem } = useCart()
  const isInCart = inCart(product.id)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Visual header */}
      <div style={{
        height: 160,
        background: categoryColors[product.category] || 'var(--cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 56,
        position: 'relative',
      }}>
        {categoryEmoji[product.category] || '📦'}
        <span className="badge badge-gold" style={{
          position: 'absolute', top: 12, right: 12
        }}>{product.category}</span>
      </div>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link to={`/products/${product.id}`}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.3,
            color: 'var(--ink)',
          }}>{product.name}</h3>
        </Link>

        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, flex: 1 }}>
          {product.description?.slice(0, 90)}{product.description?.length > 90 ? '…' : ''}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
          }}>${product.price.toFixed(2)}</span>

          <button
            className={isInCart ? 'btn btn-outline' : 'btn btn-gold'}
            style={{ padding: '9px 18px', fontSize: 13 }}
            onClick={() => isInCart ? removeItem(product.id) : addItem(product)}
          >
            {isInCart ? '✓ Added' : 'Add to cart'}
          </button>
        </div>

        {product.downloads > 0 && (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            ↓ {product.downloads.toLocaleString()} downloads
          </p>
        )}
      </div>
    </div>
  )
}
