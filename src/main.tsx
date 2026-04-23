import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CartProvider } from './contexts/CartContext.tsx'
import { ProductsProvider } from './contexts/ProductsContext.tsx'
import { SettingsProvider } from './contexts/SettingsContext.tsx'
import { OrdersProvider } from './contexts/OrdersContext.tsx'
import { PromoProvider } from './contexts/PromoContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <ProductsProvider>
          <OrdersProvider>
            <PromoProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </PromoProvider>
          </OrdersProvider>
        </ProductsProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>,
)
