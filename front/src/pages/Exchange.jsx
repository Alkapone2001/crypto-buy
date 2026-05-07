import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import api from '../api'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')
const FIAT = { CHF: { name: 'Swiss Franc', rateToUsd: 1.1 }, USD: { name: 'US Dollar', rateToUsd: 1 }, EUR: { name: 'Euro', rateToUsd: 1.08 } }
const CRYPTO = { BTC: { name: 'Bitcoin', color: '#f7931a' }, USDT: { name: 'Tether', color: '#26a17b' }, TRX: { name: 'TRON', color: '#ef4444' } }

function Header() {
  return (
    <header className="cx-header">
      <Link to="/buy/btc" className="cx-brand"><div className="cx-logo">D</div><span>Digital<span>Vault</span></span></Link>
      <nav className="cx-nav"><Link to="/buy/btc">Home</Link></nav>
    </header>
  )
}

function StripeStep({ fiatAmount, displayCurrency, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const pay = async event => {
    event.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setError('')
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/buy/btc' },
      redirect: 'if_required',
    })
    if (stripeError) {
      setError(stripeError.message)
      setProcessing(false)
      return
    }
    await onSuccess()
    setProcessing(false)
  }

  return (
    <form className="cx-payment-form" onSubmit={pay}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="cx-error">{error}</p>}
      <button className="cx-next" disabled={!stripe || processing}>{processing ? 'Processing payment...' : `Pay ${displayCurrency} ${fiatAmount}`}</button>
    </form>
  )
}

export default function BuyCheckout() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'sell' ? 'sell' : 'buy'
  const fiat = params.get('fiat') || 'CHF'
  const crypto = params.get('crypto') || 'BTC'
  const fiatAmount = params.get('amount') || '450'
  const cryptoAmount = params.get('cryptoAmount') || '0.00697869'
  const feeRate = parseFloat(params.get('feeRate') || '0.08')
  const commissionUsd = params.get('commissionUsd') || '0.00'
  const usdAmount = useMemo(() => (parseFloat(fiatAmount) * (FIAT[fiat]?.rateToUsd || 1)).toFixed(2), [fiat, fiatAmount])

  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [bankDetails, setBankDetails] = useState('')
  const [step, setStep] = useState(2)
  const [clientSecret, setClientSecret] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const validAddress = mode === 'sell' || address.trim().length >= 12
  const validBank = mode === 'buy' || bankDetails.trim().length >= 8

  const next = async () => {
    if (!validEmail) return setError('Enter your email for confirmation')
    if (!validAddress) return setError('Enter a valid destination address')
    if (!validBank) return setError('Enter your payout bank details')
    setLoading(true)
    setError('')
    try {
      if (mode === 'sell') {
        const res = await api.post('/orders/sell', {
          crypto,
          network: crypto === 'BTC' ? 'BTC' : crypto === 'USDT' ? 'ERC20' : 'TRX',
          crypto_amount: cryptoAmount,
          bank_details: bankDetails,
          email,
          fiat_amount: fiatAmount,
          commission_rate: feeRate,
          commission_amount: commissionUsd,
        })
        setOrder(res.data)
        setStep(4)
      } else {
        const res = await api.post('/payments/create-intent', { amount_usd: usdAmount })
        setClientSecret(res.data.clientSecret)
        setStep(3)
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Could not continue')
    } finally {
      setLoading(false)
    }
  }

  const createBuyOrder = async () => {
    const res = await api.post('/orders/buy', {
      crypto,
      network: crypto === 'BTC' ? 'BTC' : crypto === 'USDT' ? 'ERC20' : 'TRX',
      crypto_amount: cryptoAmount,
      wallet_address: address,
      email,
      fiat_amount: fiatAmount,
      commission_rate: feeRate,
      commission_amount: commissionUsd,
    })
    setOrder(res.data)
    setStep(4)
  }

  return (
    <div className="cx-page">
      <Header />
      <main className="cx-center">
        <section className="cx-card">
          <div className="cx-tabs cx-two-tabs">
            <button className={mode === 'buy' ? 'active' : ''}>Buy</button>
            <button className={mode === 'sell' ? 'active' : ''}>Sell</button>
          </div>
          <div className="cx-card-body">
            {step === 2 && (
              <>
                <div className="cx-step-head">
                  <h1><Link to="/buy/btc" className="cx-back">←</Link><span>2/3</span> {mode === 'buy' ? 'Enter address' : 'Payout details'}</h1>
                  <div className="cx-help">?</div>
                </div>
                <div className="cx-progress"><span className="filled" /><span className="filled" /><span /></div>
                <div className="cx-summary">
                  <div><label>{mode === 'buy' ? `You send ${fiat}` : `You receive ${fiat}`}</label><strong>{fiatAmount}</strong><small>{FIAT[fiat]?.name || fiat}</small></div>
                  <b>→</b>
                  <div><label>{mode === 'buy' ? `You get ${crypto}` : `You sell ${crypto}`}</label><strong>~ {cryptoAmount}</strong><small>{CRYPTO[crypto]?.name || crypto} <em>{crypto}</em></small></div>
                </div>

                <div className="cx-price-note compact">
                  <div><span>Commission</span><strong>{Math.round(feeRate * 100)}%</strong></div>
                  <p>Estimated fee: ${commissionUsd}. Your confirmation will include the final order details.</p>
                </div>

                <label className={`cx-field ${error && !validEmail ? 'invalid' : ''}`}>
                  <span>Email for confirmation</span>
                  <input value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoFocus />
                </label>

                {mode === 'buy' ? (
                  <label className={`cx-address ${error && !validAddress ? 'invalid' : ''}`}>
                    <em>{crypto}</em><span>Destination address ({crypto})</span>
                    <textarea value={address} onChange={event => setAddress(event.target.value)} />
                    <i>⌗</i>
                  </label>
                ) : (
                  <label className={`cx-field cx-textarea ${error && !validBank ? 'invalid' : ''}`}>
                    <span>Payout bank details</span>
                    <textarea value={bankDetails} onChange={event => setBankDetails(event.target.value)} placeholder="Bank name, IBAN/account number, account holder..." />
                  </label>
                )}

                {error && <p className="cx-error">{error}</p>}
                <p className="cx-terms">A confirmation email will be sent after the order is created.</p>
                <button className="cx-next" disabled={loading} onClick={next}>{loading ? 'Opening...' : mode === 'buy' ? 'Continue to Stripe' : 'Create sell order'}</button>
              </>
            )}

            {step === 3 && clientSecret && (
              <>
                <div className="cx-step-head"><h1><button className="cx-back" onClick={() => setStep(2)}>←</button><span>3/3</span> Stripe checkout</h1><div className="cx-help">?</div></div>
                <div className="cx-progress"><span className="filled" /><span className="filled" /><span className="filled" /></div>
                <div className="cx-checkout-summary"><span className="cx-mini-coin" style={{ background: CRYPTO[crypto]?.color }}>{crypto[0]}</span><div><strong>{cryptoAmount} {crypto}</strong><small>{email}</small></div><span>{fiat} {fiatAmount}</span></div>
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#71f05f', borderRadius: '14px' } } }}>
                  <StripeStep fiatAmount={fiatAmount} displayCurrency={fiat} onSuccess={createBuyOrder} />
                </Elements>
              </>
            )}

            {step === 4 && (
              <div className="cx-success">
                <div>✓</div>
                <h1>{mode === 'buy' ? 'Payment complete' : 'Sell order created'}</h1>
                <p>{mode === 'buy' ? `We will send ${cryptoAmount} ${crypto} after payment review.` : `Send ${cryptoAmount} ${crypto} to the deposit address shown in your email. We will review it and process your payout.`}</p>
                {order?.deposit_address && <small>Deposit: {order.deposit_address}</small>}
                <small>Confirmation sent to {email}</small>
                <small>Order #{order?.id?.slice(0, 8).toUpperCase()}</small>
                <Link to="/buy/btc" className="cx-next as-link">Start another order</Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
