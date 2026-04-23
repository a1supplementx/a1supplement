import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  appliedPromos: string[];
  addPromoCode: (code: string) => void;
  removePromoCode: (code: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('a1_cart_v2');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [appliedPromos, setAppliedPromos] = useState<string[]>(() => {
    const saved = localStorage.getItem('a1_cart_promos_array');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('a1_cart_v2', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('a1_cart_promos_array', JSON.stringify(appliedPromos));
  }, [appliedPromos]);

  const addToCart = (newItem: CartItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === newItem.id);
      if (existing) {
        return prev.map(item => 
          item.id === newItem.id ? { ...item, quantity: item.quantity + newItem.quantity } : item
        );
      }
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromos([]);
  };

  const addPromoCode = (code: string) => {
      setAppliedPromos(prev => [...prev, code]);
  };

  const removePromoCode = (code: string) => {
      setAppliedPromos(prev => prev.filter(c => c.toLowerCase() !== code.toLowerCase()));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, appliedPromos, addPromoCode, removePromoCode }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};
