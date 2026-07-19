import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Search, Clock, CheckCircle, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrackOrder = () => {
  const [emailQuery, setEmailQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailQuery.trim().toLowerCase();
    if (!cleanEmail) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_data->>email', cleanEmail)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.map(d => ({
          id: d.id,
          date: d.date,
          paymentMethod: d.payment_method || 'online',
          fulfillmentType: d.fulfillment_type || 'delivery',
          customerData: d.customer_data,
          items: d.items,
          subtotal: d.subtotal,
          deliveryFee: d.delivery_fee,
          promos: d.promos,
          total: d.total,
          status: d.status
        }));
        setMyOrders(mapped);
      }
    } catch (err) {
      console.error('Error tracking order:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Pending': return <Clock className="text-yellow-500" size={20} />;
      case 'Shipped': return <Truck className="text-blue-500" size={20} />;
      case 'Delivered': return <CheckCircle className="text-green-500" size={20} />;
      default: return <Clock size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'Shipped': return 'bg-blue-500/20 text-blue-500';
      case 'Delivered': return 'bg-green-500/20 text-green-500';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter mb-4">
          Track Your Pack
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          No sign up required. Just enter the email address you used during checkout to look up your order history and tracking status instantly.
        </p>
      </div>

      <div className="bg-[#111] border border-white/5 p-8 mb-12">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Search by Email</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="email" 
                value={emailQuery}
                onChange={(e) => {
                   setEmailQuery(e.target.value);
                   setHasSearched(false);
                }}
                placeholder="customer@example.com"
                required
                className="w-full bg-[#0a0a0a] border border-white/10 text-white pl-12 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
               />
            </div>
          </div>
          <div className="sm:self-end">
            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-black px-8 py-3 font-bold uppercase tracking-wider text-sm transition-colors h-[46px]">
              {loading ? 'Searching...' : 'Lookup'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="text-primary font-bold animate-pulse uppercase tracking-widest text-sm">
            Fetching Order details...
          </div>
        </div>
      ) : hasSearched && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
            <Package /> Order History ({myOrders.length})
          </h2>

          {myOrders.length === 0 ? (
            <div className="text-center py-16 bg-[#111] border border-white/5">
              <p className="text-gray-400 mb-6">We couldn't find any orders matching "{emailQuery}".</p>
              <Link to="/products" className="text-primary hover:text-white uppercase tracking-widest font-bold underline text-sm transition-colors">Start Shopping</Link>
            </div>
          ) : (
            myOrders.map(order => (
              <div key={order.id} className="bg-[#111] border border-white/5 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-white/5">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Order #{order.id}</span>
                    <span className="text-sm text-gray-300">{new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}</span>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-4">
                    <span className="text-xl font-display font-black text-white italic tracking-tighter">₹{order.total.toLocaleString()}</span>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="text-xs font-bold uppercase tracking-wider">{order.status}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Items Shipped</h4>
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-[#0a0a0a] p-4 border border-white/5">
                      <img src={item.image} alt="" className="w-12 h-12 object-cover bg-black" />
                      <div className="flex-grow">
                        <Link to={`/product/${item.id}`} className="text-white font-bold hover:text-primary transition-colors text-sm sm:text-base">
                          {item.name}
                        </Link>
                        <div className="text-xs font-bold text-primary tracking-widest uppercase mt-1">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-sm">Qty: {item.quantity}</div>
                        <div className="text-gray-300 font-bold mt-0.5">₹{(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-white/5 text-sm">
                    <p className="text-gray-400">Shipped To: <span className="text-white font-bold">{order.customerData.firstName} {order.customerData.lastName}</span></p>
                    <p className="text-gray-400 mt-1">{order.customerData.address}, {order.customerData.city} {order.customerData.zipCode}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
