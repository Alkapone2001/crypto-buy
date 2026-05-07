import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

const FIAT = {
  CHF: { name: 'Swiss Franc', symbol: 'F', rateToUsd: 1.1, color: '#ef233c' },
  USD: { name: 'US Dollar', symbol: '$', rateToUsd: 1, color: '#16a34a' },
  EUR: { name: 'Euro', symbol: 'E', rateToUsd: 1.08, color: '#2563eb' },
}

const CRYPTO = {
  BTC: { name: 'Bitcoin', badge: 'BTC', symbol: 'B', color: '#f7931a' },
  USDT: { name: 'Tether', badge: 'USDT', symbol: 'T', color: '#26a17b' },
  TRX: { name: 'TRON', badge: 'TRX', symbol: 'T', color: '#ef4444' },
}

function Header() {
  return (
    <header className="cx-header">
      <Link to="/buy/btc" className="cx-brand">
        <div className="cx-logo">D</div>
        <span>Digital<span>Vault</span></span>
      </Link>
      <nav className="cx-nav">
        <a href="#how">How it works</a>
        <a href="#pricing">Pricing</a>
        <a href="#trust">Security</a>
      </nav>
    </header>
  )
}

function CoinIcon({ item }) {
  return <div className="cx-coin" style={{ background: item.color }}>{item.symbol}</div>
}

export default function BuyStart() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('buy')
  const [fiat, setFiat] = useState('CHF')
  const [crypto, setCrypto] = useState('BTC')
  const [amount, setAmount] = useState('450')
  const [rates, setRates] = useState({})

  useEffect(() => {
    api.get('/rates').then(res => {
      const map = {}
      res.data.rates.forEach(rate => { map[rate.crypto] = rate })
      setRates(map)
    }).catch(() => {})
  }, [])

  const amountUsd = useMemo(() => {
    const parsed = parseFloat(amount)
    return Number.isFinite(parsed) ? parsed * FIAT[fiat].rateToUsd : 0
  }, [amount, fiat])
  const feeRate = amountUsd >= 500 ? 0.05 : 0.08
  const commissionUsd = mode === 'buy'
    ? amountUsd * feeRate
    : (amountUsd / Math.max(1 - feeRate, 0.01)) - amountUsd
  const rate = rates[crypto]?.[mode === 'buy' ? 'buy_rate' : 'sell_rate']
  const cryptoAmount = useMemo(() => {
    if (!rate || !amountUsd) return ''
    const quotedUsd = mode === 'buy'
      ? amountUsd * (1 - feeRate)
      : amountUsd / Math.max(1 - feeRate, 0.01)
    return (quotedUsd / rate).toFixed(8)
  }, [amountUsd, feeRate, mode, rate])

  const goNext = () => {
    const params = new URLSearchParams({
      mode,
      fiat,
      amount,
      crypto,
      cryptoAmount,
      feeRate: String(feeRate),
      commissionUsd: commissionUsd.toFixed(2),
      amountUsd: amountUsd.toFixed(2),
    })
    navigate(`/buy?${params.toString()}`)
  }

  return (
    <div className="cx-page">
      <Header />
      <main className="cx-hero">
        <section className="cx-copy">
          <span className="cx-kicker">Instant crypto desk</span>
          <h1>Buy and sell crypto with a calmer checkout.</h1>
          <p>DigitalVault helps customers move between card payments, crypto payouts, and manual desk support without the usual clutter.</p>
          <div className="cx-trust-row">
            <span>Stripe checkout</span>
            <span>Email confirmations</span>
            <span>Order review</span>
          </div>
        </section>

        <section className="cx-card cx-start-card">
          <div className="cx-tabs cx-two-tabs">
            {['buy', 'sell'].map(tab => (
              <button key={tab} className={mode === tab ? 'active' : ''} onClick={() => setMode(tab)}>
                {tab === 'buy' ? 'Buy' : 'Sell'}
              </button>
            ))}
          </div>

          <div className="cx-card-body">
            <div className="cx-step-head">
              <h1><span>1/3</span> Select pair</h1>
              <div className="cx-help">?</div>
            </div>
            <div className="cx-progress">
              <span className="filled" />
              <span />
              <span />
            </div>

            <div className="cx-amount-box">
              <label>{mode === 'buy' ? 'You spend' : 'You receive'}</label>
              <div className="cx-amount-row">
                <button className="cx-asset-button" onClick={() => setFiat(fiat === 'CHF' ? 'USD' : fiat === 'USD' ? 'EUR' : 'CHF')}>
                  <CoinIcon item={FIAT[fiat]} />
                  <span><strong>{fiat}</strong><small>{FIAT[fiat].name}</small></span>
                  <b>⌄</b>
                </button>
                <input value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" />
              </div>
            </div>

            <div className="cx-amount-box">
              <label>{mode === 'buy' ? 'You get' : 'You sell'}</label>
              <div className="cx-amount-row">
                <button className="cx-asset-button" onClick={() => setCrypto(crypto === 'BTC' ? 'USDT' : crypto === 'USDT' ? 'TRX' : 'BTC')}>
                  <CoinIcon item={CRYPTO[crypto]} />
                  <span><strong>{crypto}</strong><small>{CRYPTO[crypto].name} <em>{CRYPTO[crypto].badge}</em></small></span>
                  <b>⌄</b>
                </button>
                <output>~ {cryptoAmount || '0.00000000'}</output>
              </div>
            </div>

            <div className="cx-pay-panel">
              <div className="cx-pay-top">
                <span>{mode === 'buy' ? 'Pay with' : 'Payout method'}</span>
                <a>Best route selected →</a>
              </div>
              <div className="cx-offer">
                <span className="cx-topper">●</span>
                <strong>{mode === 'buy' ? 'Stripe' : 'Bank transfer'}</strong>
                <span>/</span>
                <b>{mode === 'buy' ? 'VISA' : 'Desk'}</b>
                <b className="mc">{mode === 'buy' ? '●●' : ''}</b>
                <em>OPTIMAL</em>
              </div>
            </div>

            <div className="cx-price-note">
              <div>
                <span>Commission</span>
                <strong>{Math.round(feeRate * 100)}%</strong>
              </div>
              <p>
                {mode === 'buy'
                  ? `Estimated fee: $${commissionUsd.toFixed(2)}. Included before the crypto quote.`
                  : `Estimated desk fee: $${commissionUsd.toFixed(2)}. Included in the crypto amount shown.`}
              </p>
            </div>

            <button className="cx-next" disabled={!cryptoAmount} onClick={goNext}>Next step</button>
          </div>
        </section>
      </main>

      <section id="how" className="cx-info">
        <div>
          <span>01</span>
          <h2>Simple orders</h2>
          <p>Choose Buy or Sell, enter the amount, and we lock the order details into your confirmation.</p>
        </div>
        <div>
          <span>02</span>
          <h2>Human review</h2>
          <p>Every order lands in your private dashboard so you can approve, process, or cancel it yourself.</p>
        </div>
        <div id="pricing">
          <span>03</span>
          <h2>Transparent pricing</h2>
          <p>Commission is 8% for $100-$500 orders, then 5% for orders above $500.</p>
        </div>
        <div id="trust">
          <span>04</span>
          <h2>Clear updates</h2>
          <p>Customers receive email confirmation when the order is created and when you complete it.</p>
        </div>
      </section>
    </div>
  )
}
