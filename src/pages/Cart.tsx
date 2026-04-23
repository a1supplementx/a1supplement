import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { usePromos } from '../contexts/PromoContext';
import { Minus, Plus, Trash2, ArrowRight, Tag, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal, appliedPromos, addPromoCode, removePromoCode } = useCart();
  const { validatePromo, getActivePromos } = usePromos();
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const activePromos = getActivePromos(appliedPromos, cartTotal);
  
  let discountAmount = 0;
  let hasFreeShippingPromo = false;

  activePromos.forEach(p => {
     if (p.type === 'percentage') {
       discountAmount += cartTotal * (p.value / 100);
     } else if (p.type === 'fixed') {
       discountAmount += p.value;
     } else if (p.type === 'free_shipping') {
       hasFreeShippingPromo = true;
     }
  });
  
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const handleApplyPromo = () => {
    setPromoError('');
    if (!promoInput.trim()) return;
    
    const result = validatePromo(promoInput.trim(), cartTotal, appliedPromos);
    if (result.isValid && result.promo) {
      addPromoCode(result.promo.code);
      setPromoInput('');
    } else {
      setPromoError(result.error || 'Invalid code');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-7xl mx-auto px-4">
        <div className="w-24 h-24 bg-[#111] rounded-full flex items-center justify-center mb-6">
          <Trash2 size={32} className="text-gray-600" />
        </div>
        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-4">Your Cart is Empty</h2>
        <p className="text-gray-400 mb-8 max-w-md text-center">Looks like you haven't added any premium supplements to your cart yet.</p>
        <Link to="/products" className="bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  const invalidCodesCount = appliedPromos.length - activePromos.length;

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
      <h1 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter mb-12 border-b border-white/10 pb-6">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={item.id} 
              className="flex flex-col sm:flex-row items-center gap-6 bg-[#111] border border-white/5 p-4"
            >
              <img src={item.image} alt={item.name} className="w-24 h-24 object-cover bg-black" />
              
              <div className="flex-grow text-center sm:text-left">
                <Link to={`/product/${item.id}`} className="text-lg font-bold text-white uppercase hover:text-primary transition-colors">
                  {item.name}
                </Link>
                <div className="text-primary font-bold mt-1">₹{item.price.toLocaleString()}</div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center border border-white/20 bg-black">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-white font-bold text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#111] border border-white/5 p-8 sticky top-28">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-6 pb-6 border-b border-white/10">Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white">₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px] self-center">
                   {hasFreeShippingPromo ? <span className="text-primary">FREE</span> : 'Calculated at Checkout'}
                </span>
              </div>
              
              {invalidCodesCount > 0 && (
                 <div className="bg-red-500/10 text-red-500 p-3 text-xs font-bold tracking-widest uppercase flex items-start gap-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{invalidCodesCount} code(s) applied are no longer valid for this cart total.</span>
                 </div>
              )}

              {activePromos.map(promo => (
                <div key={promo.id} className="flex justify-between text-primary font-bold">
                  <span className="flex items-center gap-2">
                    <Tag size={14} /> Code: {promo.code}
                    <button onClick={() => removePromoCode(promo.code)} className="text-red-500 hover:text-red-400 ml-1"><X size={14}/></button>
                  </span>
                  <span>
                     {promo.type === 'free_shipping' ? 'FREE DELIVERY' : 
                      `-₹${(promo.type === 'percentage' ? cartTotal * (promo.value/100) : promo.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-6 pt-6 border-t border-white/10">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="PROMO CODE"
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors placeholder:uppercase placeholder:text-xs tracking-widest uppercase"
                />
                <button onClick={handleApplyPromo} className="bg-white hover:bg-gray-200 text-black px-4 py-2 font-bold uppercase text-xs transition-colors tracking-widest">
                  Apply
                </button>
              </div>
              {promoError && <p className="text-red-500 text-xs mt-2 font-bold uppercase tracking-widest">{promoError}</p>}
            </div>

            <div className="border-t border-white/10 pt-6 mb-8 flex justify-between items-center bg-[#0a0a0a]/50 p-4 rounded mt-4">
              <span className="text-white font-bold uppercase tracking-wider">Total</span>
              <span className="text-3xl font-display font-black text-white italic tracking-tighter shadow-primary">
                ₹{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>

            <button 
              onClick={() => navigate('/checkout-auth')}
              className="w-full bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)]"
            >
              Proceed to Delivery <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
