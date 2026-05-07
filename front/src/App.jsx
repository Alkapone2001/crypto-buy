import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BuyStart from './pages/Home'
import BuyCheckout from './pages/Exchange'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/buy/btc" replace />} />
        <Route path="/buy/btc" element={<BuyStart />} />
        <Route path="/buy" element={<BuyCheckout />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
