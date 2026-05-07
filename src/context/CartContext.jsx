import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (product) => {
    setItems(prev => prev.find(i => i.id === product.id) ? prev : [...prev, product])
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const clearCart = () => setItems([])

  const inCart = (id) => items.some(i => i.id === id)

  const total = items.reduce((sum, i) => sum + i.price, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, inCart, total, count: items.length }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
