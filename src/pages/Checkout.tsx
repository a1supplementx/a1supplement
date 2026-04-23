import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrdersContext';
import { usePromos } from '../contexts/PromoContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, Tag, X, CreditCard, AlertCircle, Truck, Store, Banknote, CreditCard as CardIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Checkout = () => {
  const { cart, cartTotal, clearCart, appliedPromos, addPromoCode, removePromoCode } = useCart();
  const { addOrder } = useOrders();
  const { validatePromo, getActivePromos, incrementPromoUsage } = usePromos();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment' | 'confirmed'>('shipping');
  const [shippingData, setShippingData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fulfillment & Payment options
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedPickupId, setSelectedPickupId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  // Auto-fill
  const [fFirstName, setFFirstName] = useState('');
  const [fLastName, setFLastName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  useEffect(() => {
    const autofill = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFEmail(user.email || '');
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setFFirstName(profile.first_name || '');
          setFLastName(profile.last_name || '');
          setFPhone(profile.phone || '');
        }
      }
    };
    autofill();
  }, []);

  if (cart.length === 0 && checkoutStep !== 'confirmed') {
    navigate('/cart');
    return null;
  }

  const activePromos = getActivePromos(appliedPromos, cartTotal);
  let discountAmount = 0;
  let hasFreeShippingPromo = false;
  activePromos.forEach(p => {
    if (p.type === 'percentage') discountAmount += cartTotal * (p.value / 100);
    else if (p.type === 'fixed') discountAmount += p.value;
    else if (p.type === 'free_shipping') hasFreeShippingPromo = true;
  });

  const shippingRegionSetting = settings.deliveryZones.find(z => z.region === selectedRegion);
  const baseDeliveryFee = shippingRegionSetting ? shippingRegionSetting.fee : settings.defaultDeliveryFee;
  let deliveryFee = fulfillmentType === 'pickup' ? 0 :
    (settings.freeDeliveryThreshold !== null && cartTotal >= settings.freeDeliveryThreshold) ? 0 : baseDeliveryFee;
  if (hasFreeShippingPromo) deliveryFee = 0;

  const finalTotal = Math.max(0, cartTotal + deliveryFee - discountAmount);
  const invalidCodesCount = appliedPromos.length - activePromos.length;

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

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    if (fulfillmentType === 'pickup') {
      const loc = settings.pickupLocations.find(l => l.id === selectedPickupId);
      setShippingData({
        firstName: fFirstName, lastName: fLastName, email: fEmail, phone: fPhone,
        pickupLocation: loc ? `${loc.name} — ${loc.address}, ${loc.city}` : 'Self Pickup',
        address: '', city: '', region: '', zipCode: '',
      });
    } else {
      setShippingData({
        firstName: fFirstName, lastName: fLastName, email: fEmail, phone: fPhone,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        region: selectedRegion,
        zipCode: formData.get('zipCode') as string,
      });
    }
    setCheckoutStep('payment');
  };

  const placeOrder = (method: 'online' | 'cod') => {
    setIsProcessing(true);
    setTimeout(() => {
      const orderPromosArray = activePromos.map(p => ({
        code: p.code,
        isFreeShipping: p.type === 'free_shipping',
        discountValue: p.type === 'free_shipping' ? 0 : (p.type === 'percentage' ? cartTotal * (p.value / 100) : p.value)
      }));

      addOrder({
        customerData: shippingData,
        items: cart,
        subtotal: cartTotal,
        deliveryFee,
        promos: orderPromosArray,
        total: finalTotal,
        status: 'Pending',
        paymentMethod: method,
        fulfillmentType,
      });

      activePromos.forEach(p => incrementPromoUsage(p.code));
      clearCart();
      setIsProcessing(false);
      setCheckoutStep('confirmed');
    }, 1200);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    placeOrder('online');
  };

  if (checkoutStep === 'confirmed') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-3xl mx-auto px-4 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-primary mb-6">
          <CheckCircle size={80} />
        </motion.div>
        <h2 className="text-5xl font-display font-black text-white italic uppercase tracking-tighter mb-4">
          Order Confirmed!
        </h2>
        <p className="text-gray-400 mb-3 text-lg">
          {paymentMethod === 'cod' ? 'Pay on delivery. Your order is being prepared.' : 'Payment successful! Your supplements are on the way.'}
        </p>
        {fulfillmentType === 'pickup' && shippingData?.pickupLocation && (
          <div className="bg-primary/10 border border-primary/30 px-6 py-4 mb-8 text-left max-w-md w-full">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-1">Pickup Location</p>
            <p className="text-white text-sm">{shippingData.pickupLocation}</p>
          </div>
        )}
        <button onClick={() => navigate('/profile')} className="bg-white hover:bg-gray-200 text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors mt-6">
          Track My Order
        </button>
      </div>
    );
  }

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">Checkout</h1>
        <div className="flex items-center text-gray-500 font-bold text-xs tracking-widest uppercase ml-auto">
          <span className={checkoutStep === 'shipping' ? 'text-primary' : 'text-white'}>Details</span>
          <span className="mx-2">/</span>
          <span className={checkoutStep === 'payment' ? 'text-primary' : 'text-gray-500'}>Payment</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          {checkoutStep === 'shipping' ? (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6">Your Details</h2>

              {/* Fulfillment Selector */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('delivery')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 font-bold uppercase tracking-wider text-sm transition-all ${fulfillmentType === 'delivery' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                >
                  <Truck size={24} />
                  Home Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType('pickup')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 font-bold uppercase tracking-wider text-sm transition-all ${fulfillmentType === 'pickup' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-400 hover:border-white/30'} ${settings.pickupLocations.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={settings.pickupLocations.length === 0}
                  title={settings.pickupLocations.length === 0 ? 'No pickup locations configured' : ''}
                >
                  <Store size={24} />
                  Store Pickup
                  {settings.pickupLocations.length === 0 && <span className="text-[10px] normal-case font-normal">Not available</span>}
                </button>
              </div>

              <form id="shipping-form" onSubmit={handleShippingSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                    <input value={fFirstName} onChange={e => setFFirstName(e.target.value)} required type="text" className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                    <input value={fLastName} onChange={e => setFLastName(e.target.value)} required type="text" className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input value={fEmail} onChange={e => setFEmail(e.target.value)} required type="email" className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input value={fPhone} onChange={e => setFPhone(e.target.value)} required type="tel" placeholder="e.g. +91 98765 43210" className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                </div>

                <AnimatePresence mode="wait">
                  {fulfillmentType === 'pickup' ? (
                    <motion.div key="pickup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Pickup Location</label>
                      <select
                        required
                        value={selectedPickupId}
                        onChange={e => setSelectedPickupId(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 text-gray-300 px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                      >
                        <option value="" disabled>Choose a location</option>
                        {settings.pickupLocations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name} — {loc.address}, {loc.city}</option>
                        ))}
                      </select>
                    </motion.div>
                  ) : (
                    <motion.div key="delivery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Shipping Address</label>
                        <input name="address" required type="text" className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">City</label>
                          <input name="city" required type="text" className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">State / Region</label>
                          <select required value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} className="w-full bg-[#111] border border-white/10 text-gray-300 px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm">
                            <option value="" disabled>Select State</option>
                            {settings.deliveryZones.map(z => (<option key={z.id} value={z.region}>{z.region}</option>))}
                            <option value="Other">Other Region</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ZIP Code</label>
                          <input name="zipCode" required type="text" className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6">Choose Payment</h2>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 font-bold uppercase tracking-wider text-sm transition-all ${paymentMethod === 'online' ? 'border-[#3395FF] bg-[#3395FF]/10 text-[#3395FF]' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                >
                  <CardIcon size={24} />
                  Card / UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 font-bold uppercase tracking-wider text-sm transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                >
                  <Banknote size={24} />
                  Cash on Delivery
                </button>
              </div>

              <AnimatePresence mode="wait">
                {paymentMethod === 'online' ? (
                  <motion.div key="online" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="bg-white p-6 rounded relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={80} /></div>
                      <div className="mb-6 flex justify-between items-center text-black">
                        <span className="font-bold uppercase tracking-widest text-sm">Cards, UPI, NetBanking</span>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Razorpay_logo.svg/1024px-Razorpay_logo.svg.png" className="h-6 object-contain" alt="Razorpay" />
                      </div>
                      <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-4 relative z-10">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Card Number</label>
                          <div className="relative">
                            <input required type="text" pattern="\d{16}" maxLength={16} placeholder="XXXX XXXX XXXX XXXX" className="w-full bg-gray-50 border border-gray-300 text-black px-4 py-3 focus:outline-none focus:border-[#3395FF] transition-colors" />
                            <CreditCard size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Expiry</label>
                            <input required type="text" pattern="\d\d/\d\d" maxLength={5} placeholder="MM/YY" className="w-full bg-gray-50 border border-gray-300 text-black px-4 py-3 focus:outline-none focus:border-[#3395FF] transition-colors" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">CVV</label>
                            <input required type="password" pattern="\d{3}" maxLength={3} placeholder="123" className="w-full bg-gray-50 border border-gray-300 text-black px-4 py-3 focus:outline-none focus:border-[#3395FF] transition-colors" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Cardholder Name</label>
                          <input required type="text" defaultValue={`${shippingData?.firstName || ''} ${shippingData?.lastName || ''}`} className="w-full bg-gray-50 border border-gray-300 text-black px-4 py-3 focus:outline-none focus:border-[#3395FF] transition-colors" />
                        </div>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="cod" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="bg-primary/5 border-2 border-primary/30 p-8 text-center">
                      <Banknote size={48} className="text-primary mx-auto mb-4" />
                      <h3 className="text-white font-bold uppercase tracking-wider text-lg mb-2">Pay When You Receive</h3>
                      <p className="text-gray-400 text-sm mb-4">Have cash or card ready for the delivery agent. No online payment required now.</p>
                      <div className="bg-black/30 p-4 text-left space-y-1">
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Order Summary</p>
                        <p className="text-white font-bold">Total Due on Delivery: <span className="text-primary">₹{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={() => setCheckoutStep('shipping')} className="text-gray-500 hover:text-white uppercase font-bold tracking-widest text-xs mt-6 underline">
                ← Back to Details
              </button>
            </motion.div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-[#111] border border-white/5 p-8 sticky top-28">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6 pb-6 border-b border-white/10">Order Summary</h2>
            <div className="space-y-4 mb-4">
              {cart.map(item => (
                <div key={item.id} className="flex flex-col text-sm border-b border-white/5 pb-2">
                  <div className="flex justify-between items-start">
                    <span className="text-white max-w-[75%] font-bold">{item.name}</span>
                    <span className="text-white">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                  <span className="text-gray-500 uppercase text-xs font-bold tracking-widest mt-1">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-b border-white/10 py-4 mb-4 space-y-3">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Subtotal</span>
                <span className="text-white">₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                <span>{fulfillmentType === 'pickup' ? 'Store Pickup' : `Delivery ${selectedRegion ? `(${selectedRegion})` : ''}`}</span>
                {deliveryFee === 0 ? (
                  <span className="text-primary font-bold uppercase tracking-widest text-xs self-center">Free</span>
                ) : (
                  <span className="text-white">₹{deliveryFee.toLocaleString()}</span>
                )}
              </div>

              {invalidCodesCount > 0 && (
                <div className="bg-red-500/10 text-red-500 p-2 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                  <AlertCircle size={12} /><span>{invalidCodesCount} code(s) no longer valid.</span>
                </div>
              )}

              {activePromos.map(promo => (
                <div key={promo.id} className="flex justify-between text-primary font-bold text-sm items-center">
                  <span className="flex items-center gap-2">
                    <Tag size={14} /> {promo.code}
                    <button onClick={() => removePromoCode(promo.code)} className="text-red-500 hover:text-red-400 ml-1"><X size={12} /></button>
                  </span>
                  <span>{promo.type === 'free_shipping' ? 'FREE DELIVERY' : `-₹${(promo.type === 'percentage' ? cartTotal * (promo.value / 100) : promo.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</span>
                </div>
              ))}
            </div>

            <div className="mb-6 pt-2">
              <div className="flex gap-2">
                <input type="text" value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())} placeholder="PROMO CODE" className="w-full bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors placeholder:uppercase placeholder:text-xs tracking-widest uppercase" />
                <button onClick={handleApplyPromo} className="bg-white hover:bg-gray-200 text-black px-4 py-2 font-bold uppercase text-xs transition-colors tracking-widest">Apply</button>
              </div>
              {promoError && <p className="text-red-500 text-xs mt-2 font-bold uppercase tracking-widest">{promoError}</p>}
            </div>

            <div className="flex justify-between items-center text-xl bg-[#0a0a0a]/50 p-4 mb-8">
              <span className="text-white font-bold uppercase tracking-wider text-sm">Final Total</span>
              <span className="font-display font-black text-white italic text-2xl">₹{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>

            {checkoutStep === 'shipping' ? (
              <button type="submit" form="shipping-form" className="w-full bg-white hover:bg-gray-200 text-black px-8 py-5 font-bold uppercase tracking-wider text-sm transition-colors">
                Continue to Payment →
              </button>
            ) : paymentMethod === 'cod' ? (
              <button
                onClick={() => placeOrder('cod')}
                disabled={isProcessing}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-black px-8 py-5 font-bold uppercase tracking-wider text-sm transition-colors flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
              >
                {isProcessing ? 'Placing Order...' : <><Banknote size={18} /> Confirm — Pay on Delivery</>}
              </button>
            ) : (
              <button
                type="submit" form="payment-form"
                disabled={isProcessing}
                className="w-full bg-[#3395FF] hover:bg-[#2878CC] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-5 font-bold uppercase tracking-wider text-sm transition-colors flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(51,149,255,0.4)]"
              >
                {isProcessing ? 'Processing...' : `Pay ₹${finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
