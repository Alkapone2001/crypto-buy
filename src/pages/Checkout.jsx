import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + ' / ' + digits.slice(2)
  return digits
}

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' })

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login?redirect=/checkout'); return }
    if (!items.length) { navigate('/cart'); return }
  }, [loading])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  const handlePay = async (e) => {
    e.preventDefault()
    const digits = card.number.replace(/\s/g, '')
    if (digits.length < 16) { setError('Please enter a valid card number.'); return }
    if (card.expiry.length < 7) { setError('Please enter a valid expiry date.'); return }
    if (card.cvc.length < 3) { setError('Please enter a valid CVC.'); return }
    if (!card.name.trim()) { setError('Please enter the name on your card.'); return }

    setProcessing(true)
    setError('')
    try {
      await api.post('/orders/dev-checkout', {
        items: items.map(i => ({ productId: i.id })),
      })
      clearCart()
      navigate('/orders', { state: { newOrder: true } })
    } catch (e) {
      setError(e.response?.data?.error || 'Checkout failed.')
      setProcessing(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    fontSize: 15,
    border: '1px solid var(--border)',
    borderRadius: 6,
    background: 'var(--paper)',
    color: 'var(--ink)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div className="page-enter" style={{ padding: '48px 0' }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, marginBottom: 8 }}>
          Checkout
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: 40 }}>Complete your purchase</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>

          {/* Order summary */}
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              Order summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 6,
                      background: 'var(--cream)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {item.category === 'Ebooks' ? '📖' : item.category === 'Courses' ? '🎓' : item.category === 'Design' ? '🎨' : '📦'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{item.name}</div>
                      <span className="badge badge-muted">{item.category}</span>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600 }}>${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <hr className="divider" style={{ margin: '20px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Card form */}
          <div className="card" style={{ padding: 28, position: 'sticky', top: 80 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              Card details
            </h2>

            <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Card number</label>
                <input
                  style={inputStyle}
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
                  inputMode="numeric"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Name on card</label>
                <input
                  style={inputStyle}
                  placeholder="John Smith"
                  value={card.name}
                  onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Expiry</label>
                  <input
                    style={inputStyle}
                    placeholder="MM / YY"
                    value={card.expiry}
                    onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    inputMode="numeric"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVC</label>
                  <input
                    style={inputStyle}
                    placeholder="123"
                    value={card.cvc}
                    onChange={e => setCard(c => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    inputMode="numeric"
                  />
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button
                className="btn btn-primary"
                type="submit"
                disabled={processing}
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, marginTop: 4 }}
              >
                {processing ? <span className="spinner" /> : `Pay $${total.toFixed(2)}`}
              </button>

              <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                🔒 Secured · Instant delivery after payment
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
