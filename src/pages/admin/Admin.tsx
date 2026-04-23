import React, { useState, useEffect } from 'react';
import { useProducts, Product } from '../../contexts/ProductsContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useOrders } from '../../contexts/OrdersContext';
import { usePromos } from '../../contexts/PromoContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Trash2, Edit3, Plus, LogOut, Settings as SettingsIcon, Package, FileText, ClipboardList, Tag, Mail } from 'lucide-react';
import { Users } from 'lucide-react'; // added Users icon

const Admin = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      if (user) {
        setIsVerifying(true);
        try {
          // Use select instead of single to prevent errors if empty
          const { data, error } = await supabase.from('store_admins').select('email').eq('email', user.email);
          
          if (!mounted) return;

          if (error) {
             if (error.message.includes('FetchError') || error.message.includes('Failed to fetch')) {
                setError('Network error syncing with security server. Please refresh.');
                setIsVerifying(false);
                return;
             }
             throw error;
          }

          if (data && data.length > 0) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            setError('ACCESS DENIED: Your email is not on the Admin Whitelist.');
          }
        } catch (err: any) {
             if (mounted) {
               setIsAuthorized(false);
               setError(`Security verification failed: ${err.message}`);
             }
        }
        if (mounted) setIsVerifying(false);
      } else {
        if (mounted) setIsAuthorized(false);
      }
    };
    
    verifyAdmin();

    return () => { mounted = false; };
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
       email,
       password
    });
    
    if (signInError) {
       // Since they might be a real employee without an Auth account yet, register them.
       // The useEffect above will instantly kick them out if their email isn't on the whitelist.
       if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({ email, password });
          if (signUpError) {
             setError(signUpError.message);
          } else {
             setError('');
          }
       } else {
         setError(signInError.message);
       }
    } else {
      setError('');
    }
    setLoading(false);
  };

  if (isVerifying) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-primary font-bold animate-pulse uppercase tracking-widest text-sm">
          Verifying Security Clearance...
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-[#111] border border-white/5 p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Admin Access</h2>
            <p className="text-gray-400 mt-2">Restricted Area (Live Env)</p>
          </div>
          
          {error && <div className="bg-red-500/10 text-red-500 p-3 mb-6 font-bold text-sm text-center">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Admin Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors">
              {loading ? 'Authenticating...' : 'Login / Register'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={() => supabase.auth.signOut()} />;
};

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'policies' | 'promos' | 'subscribers' | 'staff'>('orders');
  const { user } = useAuth();
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
     const checkMasterStatus = async () => {
         if (!user) return;
         // The Master Admin is the very first person inserted into the whitelist
         const { data } = await supabase.from('store_admins').select('email').order('created_at', { ascending: true }).limit(1).single();
         if (data && data.email === user.email) {
             setIsMaster(true);
         }
     };
     checkMasterStatus();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8 min-h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-[#111] border border-white/5 p-6 sticky top-28">
          <h2 className="text-xl font-display font-black text-white italic uppercase tracking-tighter mb-8 border-b border-white/10 pb-4">Control Panel</h2>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-start px-4 py-3 font-bold uppercase tracking-wider text-xs transition-colors ${activeTab === 'orders' ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <ClipboardList size={16} className="mr-3" /> Recent Orders
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-start px-4 py-3 font-bold uppercase tracking-wider text-xs transition-colors ${activeTab === 'products' ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Package size={16} className="mr-3" /> Products
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-start px-4 py-3 font-bold uppercase tracking-wider text-xs transition-colors ${activeTab === 'settings' ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <SettingsIcon size={16} className="mr-3" /> Site Settings
            </button>
            <button 
              onClick={() => setActiveTab('policies')}
              className={`w-full flex items-center justify-start px-4 py-3 font-bold uppercase tracking-wider text-xs transition-colors ${activeTab === 'policies' ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <FileText size={16} className="mr-3" /> Policies
            </button>
            <button 
              onClick={() => setActiveTab('promos')}
              className={`w-full flex items-center justify-start px-4 py-3 font-bold uppercase tracking-wider text-xs transition-colors ${activeTab === 'promos' ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Tag size={16} className="mr-3" /> Promo Codes
            </button>
            <button 
              onClick={() => setActiveTab('subscribers')}
              className={`w-full flex items-center justify-start px-4 py-3 font-bold uppercase tracking-wider text-xs transition-colors ${activeTab === 'subscribers' ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Mail size={16} className="mr-3" /> Subscribers
            </button>
            {isMaster && (
               <button 
                 onClick={() => setActiveTab('staff')}
                 className={`w-full flex items-center justify-start px-4 py-3 font-bold uppercase tracking-wider text-xs border-t border-white/5 mt-4 pt-4 transition-colors ${activeTab === 'staff' ? 'bg-red-500/20 text-red-500' : 'text-gray-500 hover:bg-white/5 hover:text-red-400'}`}
               >
                 <Users size={16} className="mr-3" /> Staff Management
               </button>
            )}
          </nav>
          
          <div className="mt-12 border-t border-white/10 pt-6">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-start px-4 py-3 font-bold uppercase tracking-wider text-xs text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} className="mr-3" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow bg-[#111] border border-white/5 p-8 overflow-x-hidden">
        {activeTab === 'orders' && <ManageOrders />}
        {activeTab === 'products' && <ManageProducts />}
        {activeTab === 'settings' && <ManageSettings />}
        {activeTab === 'policies' && <ManagePolicies />}
        {activeTab === 'promos' && <ManagePromos />}
        {activeTab === 'subscribers' && <ManageSubscribers />}
        {(activeTab === 'staff' && isMaster) && <ManageStaff />}
      </div>
    </div>
  );
};

const ManageStaff = () => {
    const { user } = useAuth();
    const [staff, setStaff] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        const { data } = await supabase.from('store_admins').select('*').order('created_at', { ascending: false });
        if (data) setStaff(data);
    };

    const addStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('store_admins').insert([{ email: newEmail }]);
        if (error) alert(`Error assigning admin: ${error.message}`);
        else {
            setNewEmail('');
            fetchStaff();
        }
        setLoading(false);
    };

    const removeStaff = async (id: string, email: string) => {
        if (email === user?.email) {
            alert("You cannot remove yourself!");
            return;
        }
        if (window.confirm(`Are you sure you want to revoke admin access for ${email}?`)) {
            const { error } = await supabase.from('store_admins').delete().eq('id', id);
            if (!error) fetchStaff();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold text-red-500 uppercase tracking-wider">Staff Management</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Master Security Clearances</p>
                </div>
            </div>
            
            <div className="bg-[#141414] border border-white/5 p-6 mb-8">
               <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-sm">Authorize New Admin</h3>
               <form onSubmit={addStaff} className="flex gap-4">
                  <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="employee@example.com" className="flex-grow bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-red-500 text-sm" />
                  <button type="submit" disabled={loading} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 font-bold uppercase tracking-wider text-xs transition-colors">Grant Access</button>
               </form>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-black/50 border-b border-white/5">
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Admin Email</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Granted On</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {staff.map(s => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                           <td className="p-4 text-sm text-white font-bold">{s.email} {s.email === user?.email && <span className="ml-2 text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded inline-block">YOU</span>}</td>
                           <td className="p-4 text-xs text-gray-500 uppercase tracking-widest">{new Date(s.created_at).toLocaleDateString()}</td>
                           <td className="p-4 text-right">
                              {s.email !== user?.email && (
                                 <button onClick={() => removeStaff(s.id, s.email)} className="text-gray-500 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                 </button>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
        </div>
    );
};

const ManageSubscribers = () => {
  const { settings, updateSettings } = useSettings();
  
  const removeEmail = (emailToRemove: string) => {
     updateSettings({
        subscribedEmails: (settings.subscribedEmails || []).filter(e => e !== emailToRemove)
     });
  };

  const copyToClipboard = () => {
     const list = (settings.subscribedEmails || []).join(', ');
     navigator.clipboard.writeText(list).then(() => alert('Emails copied to clipboard!'));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
         <h2 className="text-2xl font-bold text-white uppercase tracking-wider">VIP Newsletter Subscribers</h2>
         {(settings.subscribedEmails?.length || 0) > 0 && (
            <button onClick={copyToClipboard} className="bg-primary hover:bg-primary-hover text-black px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
               Copy All CSV
            </button>
         )}
      </div>
      
      {!settings.subscribedEmails || settings.subscribedEmails.length === 0 ? (
        <div className="p-8 text-center bg-[#0a0a0a] border border-white/5">
          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">No registered subscribers yet.</p>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 border-b border-white/5">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.subscribedEmails.map((email: string, idx: number) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 py-3 text-sm text-gray-300 font-bold">{email}</td>
                  <td className="p-4 py-3 text-right">
                    <button onClick={() => removeEmail(email)} className="text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ManageOrders = () => {
  const { orders, updateOrderStatus, updateOrder, deleteOrder } = useOrders();
  const { products } = useProducts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any | null>(null);

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 pb-4 border-b border-white/10">Recent Orders</h2>
        <p className="text-gray-400">No orders have been placed yet.</p>
      </div>
    );
  }

  const startEdit = (order: any) => {
    setEditingId(order.id);
    setEditFormData(JSON.parse(JSON.stringify(order))); // deep copy
  };

  const saveEdit = () => {
    if (editFormData) {
      updateOrder(editFormData.id, editFormData);
    }
    setEditingId(null);
    setEditFormData(null);
  };

  const updateCustomerField = (field: string, value: string) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, customerData: { ...editFormData.customerData, [field]: value } });
    }
  };

  const removeOrderItem = (itemId: string) => {
    if (editFormData) {
      const newItems = editFormData.items.filter((i: any) => i.id !== itemId);
      const newTotal = newItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
      setEditFormData({ ...editFormData, items: newItems, total: newTotal });
    }
  };

  const addOrderItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    if (!productId || !editFormData) return;
    
    e.target.value = "";
    
    const productToAdd = products.find(p => p.id === productId);
    if (!productToAdd) return;

    let newItems = [...editFormData.items];
    const existingIndex = newItems.findIndex((i: any) => i.id === productId);
    
    if (existingIndex >= 0) {
      newItems[existingIndex].quantity += 1;
    } else {
      newItems.push({ ...productToAdd, quantity: 1 });
    }
    
    const newTotal = newItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    setEditFormData({ ...editFormData, items: newItems, total: newTotal });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 pb-4 border-b border-white/10">Recent Orders</h2>
      <div className="space-y-6">
        {orders.map(order => {
          const isEditing = editingId === order.id;
          const displayData = isEditing && editFormData ? editFormData : order;

          return (
          <div key={order.id} className="bg-[#0a0a0a] border border-white/5 p-6 relative">
            <div className="absolute top-6 right-6 flex gap-3">
              {isEditing ? (
                <>
                  <button onClick={saveEdit} className="text-green-500 hover:text-green-400 font-bold uppercase text-xs tracking-wider">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-wider">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(order)} className="text-gray-400 hover:text-white"><Edit3 size={18} /></button>
                  <button onClick={() => deleteOrder(order.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-white/5">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Order #{displayData.id}</span>
                <span className="text-sm text-gray-300">{new Date(displayData.date).toLocaleString()}</span>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-4 mr-20">
                <span className="text-xl font-display font-black text-white italic tracking-tighter">₹{displayData.total.toLocaleString()}</span>
                <select 
                  value={displayData.status}
                  onChange={(e) => {
                    if (isEditing && editFormData) {
                      setEditFormData({...editFormData, status: e.target.value as any});
                    } else {
                      updateOrderStatus(order.id, e.target.value as any)
                    }
                  }}
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 outline-none border-none ${
                    displayData.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    displayData.status === 'Shipped' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-green-500/20 text-green-500'
                  }`}
                >
                  <option value="Pending" className="bg-[#111] text-white">Pending</option>
                  <option value="Shipped" className="bg-[#111] text-white">Shipped</option>
                  <option value="Delivered" className="bg-[#111] text-white">Delivered</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Customer Details</h4>
                {isEditing ? (
                  <div className="space-y-2">
                    <input value={displayData.customerData.firstName} onChange={(e) => updateCustomerField('firstName', e.target.value)} className="w-full bg-[#111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="First Name"/>
                    <input value={displayData.customerData.lastName} onChange={(e) => updateCustomerField('lastName', e.target.value)} className="w-full bg-[#111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Last Name"/>
                    <input value={displayData.customerData.email} onChange={(e) => updateCustomerField('email', e.target.value)} className="w-full bg-[#111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Email"/>
                    <input value={displayData.customerData.phone || ''} onChange={(e) => updateCustomerField('phone', e.target.value)} className="w-full bg-[#111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Phone"/>
                    <input value={displayData.customerData.address || ''} onChange={(e) => updateCustomerField('address', e.target.value)} className="w-full bg-[#111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Address"/>
                    <div className="flex gap-2">
                      <input value={displayData.customerData.city || ''} onChange={(e) => updateCustomerField('city', e.target.value)} className="w-1/2 bg-[#111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="City"/>
                      <input value={displayData.customerData.zipCode || ''} onChange={(e) => updateCustomerField('zipCode', e.target.value)} className="w-1/2 bg-[#111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Zip"/>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-300 space-y-1">
                    <p className="text-white font-bold">{displayData.customerData.firstName} {displayData.customerData.lastName}</p>
                    <p>{displayData.customerData.email}</p>
                    {displayData.customerData.phone && <p className="text-gray-400">{displayData.customerData.phone}</p>}
                    {displayData.customerData.pickupLocation ? (
                      <p className="pt-2 text-primary font-bold">📍 Pickup: {displayData.customerData.pickupLocation}</p>
                    ) : (
                      <>
                        <p className="pt-2">{displayData.customerData.address}</p>
                        <p>{displayData.customerData.city}{displayData.customerData.zipCode ? `, ${displayData.customerData.zipCode}` : ''}</p>
                      </>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${displayData.paymentMethod === 'cod' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'}`}>
                        {displayData.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${displayData.fulfillmentType === 'pickup' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {displayData.fulfillmentType === 'pickup' ? '🏪 Store Pickup' : '🚚 Home Delivery'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Items</h4>
                <div className="space-y-3">
                  {displayData.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        {isEditing && (
                          <button onClick={() => removeOrderItem(item.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={14}/></button>
                        )}
                        <img src={item.image} alt="" className="w-8 h-8 object-cover bg-black" />
                        <span className="text-gray-300">{item.quantity}x {item.name}</span>
                      </div>
                      <span className="text-gray-400">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  {displayData.items.length === 0 && <span className="text-gray-500 text-sm italic">No items left</span>}
                  
                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <select onChange={addOrderItem} defaultValue="" className="w-full bg-[#111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary">
                        <option value="" disabled>+ Add Product to Order</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - ₹{p.price.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!isEditing && displayData.subtotal !== undefined && (
                     <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-sm bg-black/40 p-3">
                        <div className="flex justify-between text-gray-400">
                           <span>Items Subtotal:</span>
                           <span>₹{displayData.subtotal.toLocaleString()}</span>
                        </div>
                        
                        {displayData.promos && displayData.promos.length > 0 && (
                           <div className="py-2 space-y-1">
                              <span className="text-[10px] uppercase tracking-widest text-[#3395FF] font-bold block mb-1">Promotional Discounts</span>
                              {displayData.promos.map((p: any, idx: number) => (
                                 <div key={idx} className="flex justify-between text-primary font-bold">
                                    <span className="flex items-center gap-1.5"><Tag size={12} /> {p.code}</span>
                                    <span>{p.isFreeShipping ? 'FREE DELIVERY OVERRIDE' : `-₹${p.discountValue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</span>
                                 </div>
                              ))}
                           </div>
                        )}

                        <div className="flex justify-between text-gray-400 border-t border-white/5 pt-2 mt-2">
                           <span>Delivery Fee {displayData.customerData?.region ? `(${displayData.customerData.region})` : ''}:</span>
                           {displayData.deliveryFee === 0 ? (
                              <span className="text-primary font-bold uppercase tracking-widest text-[10px] self-center">Free</span>
                           ) : (
                              <span>₹{displayData.deliveryFee?.toLocaleString()}</span>
                           )}
                        </div>

                        <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-2 mt-2">
                           <span>Total Amount Paid:</span>
                           <span className="text-primary italic font-black font-display tracking-tighter text-xl">₹{displayData.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

const ManageProducts = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `productImages/${fileName}`;

    setUploading(true);
    const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);

    if (uploadError) {
      alert(`Error uploading image: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    setFormData({ ...formData, image: data.publicUrl });
    setUploading(false);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData(p);
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setFormData({ name: '', price: 0, description: '', image: '', category: '', isTrending: false });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (isAdding) {
      if (formData.name && formData.price) {
        addProduct(formData as Omit<Product, 'id'>);
        setIsAdding(false);
      }
    } else if (editingId) {
      updateProduct(editingId, formData);
      setEditingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Product Inventory</h2>
        <button onClick={startAdd} className="bg-white hover:bg-gray-200 text-black px-4 py-2 font-bold uppercase text-xs flex items-center transition-colors">
          <Plus size={16} className="mr-2" /> Add Product
        </button>
      </div>

      {(isAdding || editingId) ? (
        <div className="bg-[#0a0a0a] p-6 mb-8 border border-white/10">
          <h3 className="text-primary font-bold uppercase mb-6">{isAdding ? 'New Product' : 'Edit Product'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Name</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111] border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Price</label>
              <input type="number" value={formData.price || 0} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full bg-[#111] border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category</label>
              <input type="text" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#111] border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Image Source</label>
              <div className="flex flex-col gap-4 p-4 border border-white/5 bg-[#141414]">
                 <div>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">Option A: Upload File</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={uploading}
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-primary file:text-black hover:file:bg-primary-hover" 
                    />
                    {uploading && <span className="text-xs text-primary animate-pulse block mt-2">Uploading to Cloud...</span>}
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <div className="h-[1px] bg-white/10 flex-grow"></div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">OR</span>
                    <div className="h-[1px] bg-white/10 flex-grow"></div>
                 </div>

                 <div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Option B: Paste Image URL</span>
                    <input 
                      type="text" 
                      value={formData.image || ''} 
                      onChange={e => setFormData({...formData, image: e.target.value})} 
                      placeholder="https://..."
                      className="w-full bg-[#111] border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-primary text-sm" 
                    />
                 </div>
                 
                 {formData.image && !uploading && (
                    <div className="flex items-center gap-3 mt-2 bg-[#1a1a1a] p-2 border border-white/5">
                        <img src={formData.image} className="w-10 h-10 object-cover" alt="Preview" />
                        <span className="text-xs text-green-500 font-bold max-w-[200px] truncate">Image Loaded Ready to Save</span>
                    </div>
                 )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
              <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-[#111] border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-primary resize-none"></textarea>
            </div>
            <div className="md:col-span-2 flex items-center">
              <input type="checkbox" id="trending" checked={formData.isTrending || false} onChange={e => setFormData({...formData, isTrending: e.target.checked})} className="mr-3 w-4 h-4 accent-primary" />
              <label htmlFor="trending" className="text-sm font-bold text-gray-300 uppercase">Mark as Trending (Shows on Homepage)</label>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-black px-6 py-2 font-bold uppercase text-xs transition-colors">Save</button>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-transparent border border-white/20 text-white px-6 py-2 font-bold uppercase text-xs hover:bg-white/5 transition-colors">Cancel</button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs font-bold uppercase text-gray-500 border-b border-white/10">
            <tr>
              <th className="px-4 py-4">Product</th>
              <th className="px-4 py-4">Price</th>
              <th className="px-4 py-4">Category</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-4 flex items-center gap-4">
                  <img src={p.image} className="w-10 h-10 object-cover bg-black" alt="" />
                  <div>
                    <div className="text-white font-bold">{p.name}</div>
                    {p.isTrending && <div className="text-[10px] text-primary font-bold uppercase py-0.5">Trending</div>}
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-300">₹{p.price.toLocaleString()}</td>
                <td className="px-4 py-4 text-gray-400 text-sm">{p.category}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(p)} className="text-gray-400 hover:text-white transition-colors"><Edit3 size={18} /></button>
                    <button onClick={() => deleteProduct(p.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ManageSettings = () => {
  const { settings, updateSettings, updateDeliveryZones, updatePickupLocations } = useSettings();
  const [formData, setFormData] = useState(settings);

  // Sync formData when settings loads from Supabase (async)
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings({
       address: formData.address,
       email: formData.email,
       phone: formData.phone,
       defaultDeliveryFee: formData.defaultDeliveryFee,
       freeDeliveryThreshold: formData.freeDeliveryThreshold
    });
    updateDeliveryZones(formData.deliveryZones);
    updatePickupLocations(formData.pickupLocations);
    alert('Settings Saved!');
  };

  const removeZone = (id: string) => {
     setFormData(prev => ({
        ...prev,
        deliveryZones: prev.deliveryZones.filter(z => z.id !== id)
     }));
  };

  const addZone = () => {
     setFormData(prev => ({
        ...prev,
        deliveryZones: [...prev.deliveryZones, { id: Math.random().toString(36).substr(2, 9), region: '', fee: 0 }]
     }));
  };

  const updateZone = (id: string, field: 'region' | 'fee', value: any) => {
     setFormData(prev => ({
        ...prev,
        deliveryZones: prev.deliveryZones.map(z => z.id === id ? { ...z, [field]: value } : z)
     }));
  };

  const addPickup = () => {
     setFormData(prev => ({
        ...prev,
        pickupLocations: [...(prev.pickupLocations || []), { id: Math.random().toString(36).substr(2, 9), name: '', address: '', city: '' }]
     }));
  };

  const updatePickup = (id: string, field: 'name' | 'address' | 'city', value: string) => {
     setFormData(prev => ({
        ...prev,
        pickupLocations: (prev.pickupLocations || []).map(l => l.id === id ? { ...l, [field]: value } : l)
     }));
  };

  const removePickup = (id: string) => {
     setFormData(prev => ({
        ...prev,
        pickupLocations: (prev.pickupLocations || []).filter(l => l.id !== id)
     }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 pb-4 border-b border-white/10">General Settings</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 text-[#3395FF]">Store Info</h3>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Store Address</label>
            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Support Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Phone Number</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 text-[#3395FF]">Delivery Engine</h3>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Default Fee (₹)</label>
                <input type="number" value={formData.defaultDeliveryFee} onChange={e => setFormData({...formData, defaultDeliveryFee: parseInt(e.target.value) || 0})} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Free Delivery Over (₹)</label>
                <input type="number" value={formData.freeDeliveryThreshold || ''} onChange={e => setFormData({...formData, freeDeliveryThreshold: parseInt(e.target.value) || null})} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="Leave empty for none" />
             </div>
          </div>
          <div className="pt-4">
             <div className="flex justify-between items-center mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase">Regional Zones</label>
                <button onClick={addZone} className="text-primary hover:text-white uppercase font-bold text-[10px] tracking-widest flex items-center gap-1"><Plus size={12}/> Add Zone</button>
             </div>
             <div className="space-y-3">
               {formData.deliveryZones.map(zone => (
                  <div key={zone.id} className="flex gap-2 items-center">
                     <input type="text" value={zone.region} onChange={e => updateZone(zone.id, 'region', e.target.value)} className="flex-grow bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="State/Region" />
                     <input type="number" value={zone.fee} onChange={e => updateZone(zone.id, 'fee', parseInt(e.target.value) || 0)} className="w-24 bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Fee" />
                     <button onClick={() => removeZone(zone.id)} className="p-2 text-gray-500 hover:text-red-500 bg-[#0a0a0a]"><Trash2 size={16}/></button>
                  </div>
               ))}
               {formData.deliveryZones.length === 0 && <p className="text-xs text-gray-500 italic">No custom zones configured.</p>}
             </div>
          </div>
        </div>
      </div>

      {/* Pickup Locations */}
      <div className="mt-12 pt-8 border-t border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider text-[#3395FF]">Store Pickup Locations</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Customers can choose to collect their order from these locations</p>
          </div>
          <button onClick={addPickup} className="text-primary hover:text-white uppercase font-bold text-[10px] tracking-widest flex items-center gap-1 border border-primary/30 hover:border-primary px-3 py-2 transition-colors"><Plus size={12}/> Add Location</button>
        </div>
        <div className="space-y-3">
          {(formData.pickupLocations || []).map(loc => (
            <div key={loc.id} className="grid grid-cols-3 gap-2 items-center">
              <input type="text" value={loc.name} onChange={e => updatePickup(loc.id, 'name', e.target.value)} placeholder="Location name (e.g. Main Store)" className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <input type="text" value={loc.address} onChange={e => updatePickup(loc.id, 'address', e.target.value)} placeholder="Street address" className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <div className="flex gap-2">
                <input type="text" value={loc.city} onChange={e => updatePickup(loc.id, 'city', e.target.value)} placeholder="City" className="flex-grow bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <button onClick={() => removePickup(loc.id)} className="p-2 text-gray-500 hover:text-red-500 bg-[#0a0a0a]"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {(formData.pickupLocations || []).length === 0 && <p className="text-xs text-gray-500 italic">No pickup locations configured. Add one above to enable store pickup at checkout.</p>}
        </div>
      </div>

      <button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase text-xs transition-colors mt-8 w-full md:w-auto">
        Save All Settings
      </button>
    </div>
  );
};

const ManagePolicies = () => {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState(settings);

  const handleSave = () => {
    updateSettings(formData);
    alert('Policies Saved!');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 pb-4 border-b border-white/10">Legal Pages</h2>
      <div className="space-y-8 max-w-3xl">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Privacy Policy</label>
          <div className="text-xs text-gray-500 mb-2">Basic markdown/text accepted.</div>
          <textarea rows={8} value={formData.privacyPolicy} onChange={e => setFormData({...formData, privacyPolicy: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-y"></textarea>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Terms of Service</label>
          <textarea rows={8} value={formData.termsOfService} onChange={e => setFormData({...formData, termsOfService: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-y"></textarea>
        </div>
        <button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase text-xs transition-colors">
          Publish Changes
        </button>
      </div>
    </div>
  );
};

export default Admin;

const ManagePromos = () => {
  const { promos, addPromo, updatePromo, deletePromo } = usePromos();
  const [isAdding, setIsAdding] = useState(false);
  const [newPromo, setNewPromo] = useState<{
     code: string; type: 'percentage' | 'fixed' | 'free_shipping'; value: number;
     usageLimit: string; minOrderAmount: string; expiresAt: string; isStackable: boolean;
  }>({
     code: '', type: 'percentage', value: 10,
     usageLimit: '', minOrderAmount: '', expiresAt: '', isStackable: true
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPromo.code) {
      addPromo({
         code: newPromo.code,
         type: newPromo.type,
         value: newPromo.type === 'free_shipping' ? 0 : newPromo.value,
         isStackable: newPromo.isStackable,
         isActive: true,
         usageLimit: newPromo.usageLimit ? parseInt(newPromo.usageLimit) : null,
         minOrderAmount: newPromo.minOrderAmount ? parseInt(newPromo.minOrderAmount) : null,
         expiresAt: newPromo.expiresAt ? new Date(newPromo.expiresAt).toISOString() : null
      });
      setIsAdding(false);
      setNewPromo({ code: '', type: 'percentage', value: 10, usageLimit: '', minOrderAmount: '', expiresAt: '', isStackable: true });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider">Promo Codes Configuration</h3>
        <button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary-hover text-black px-4 py-2 text-sm font-bold uppercase tracking-wider flex items-center transition-colors">
          <Plus size={16} className="mr-2" /> Add Code
        </button>
      </div>

      {isAdding && (
         <div className="bg-[#0a0a0a] p-6 border border-white/10 mb-8">
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleAdd}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Code</label>
                   <input required type="text" value={newPromo.code} onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary uppercase placeholder:text-xs tracking-widest text-sm" placeholder="e.g. SUMMER10" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Type</label>
                   <select value={newPromo.type} onChange={(e) => setNewPromo({...newPromo, type: e.target.value as any})} className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Flat (₹)</option>
                      <option value="free_shipping">Free Delivery Bypass</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Value</label>
                   <input required disabled={newPromo.type === 'free_shipping'} type="number" min="1" value={newPromo.value} onChange={(e) => setNewPromo({...newPromo, value: parseInt(e.target.value) || 0})} className={`w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors ${newPromo.type === 'free_shipping' ? 'opacity-30 cursor-not-allowed' : ''}`} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Usage Limit (Optional)</label>
                   <input type="number" min="1" value={newPromo.usageLimit} onChange={(e) => setNewPromo({...newPromo, usageLimit: e.target.value})} className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary" placeholder="Max redemptions" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Min Cart Total (Optional)</label>
                   <input type="number" min="1" value={newPromo.minOrderAmount} onChange={(e) => setNewPromo({...newPromo, minOrderAmount: e.target.value})} className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary" placeholder="e.g. ₹5000" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Expiry Date (Optional)</label>
                   <input type="date" value={newPromo.expiresAt} onChange={(e) => setNewPromo({...newPromo, expiresAt: e.target.value})} className="w-full bg-[#111] border border-white/10 text-gray-400 px-4 py-3 focus:outline-none focus:border-primary" />
                </div>
             </div>
             
             <div className="flex items-center gap-3 mb-6 bg-[#111] border border-white/10 p-4">
                 <input type="checkbox" id="stackable" checked={newPromo.isStackable} onChange={(e) => setNewPromo({...newPromo, isStackable: e.target.checked})} className="w-4 h-4 accent-primary" />
                 <label htmlFor="stackable" className="text-sm font-bold text-white uppercase tracking-widest cursor-pointer">Allow Stringing & Stacking</label>
                 <span className="text-xs text-gray-500 max-w-sm hidden md:block italic ml-4">Uncheck this if you want to make this code entirely exclusive. It will actively reject applying if other codes exist in the cart.</span>
             </div>

             <div className="flex justify-end gap-4 border-t border-white/10 pt-4">
               <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors">Cancel</button>
               <button type="submit" className="bg-primary hover:bg-primary-hover px-6 py-2 text-sm font-bold text-black uppercase tracking-wider transition-colors">Save Engine Rule</button>
             </div>
          </form>
         </div>
      )}

      <div className="flex flex-col gap-4">
        {promos.map(promo => {
           const isExpired = promo.expiresAt && new Date() > new Date(promo.expiresAt);
           const limitReached = promo.usageLimit !== null && promo.usageCount >= promo.usageLimit;
           
           return (
           <div key={promo.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between bg-[#0a0a0a] p-5 border border-white/10 transition-colors gap-4 ${!promo.isActive || isExpired || limitReached ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4 w-full md:w-auto">
                 <div className="bg-white/5 p-3 rounded-full hidden sm:block">
                    <Tag size={20} className={promo.isActive ? 'text-primary' : 'text-gray-500'} />
                 </div>
                 <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-1">
                       <h4 className="text-xl font-display font-black text-white italic uppercase tracking-widest leading-none">{promo.code}</h4>
                       {isExpired && <span className="bg-red-500/20 text-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">Expired</span>}
                       {limitReached && <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">Limit Reached</span>}
                    </div>
                    <div className="text-xs text-gray-400 font-bold tracking-widest uppercase flex flex-wrap gap-x-4 gap-y-2 mt-2">
                       <span className="text-primary">{promo.type === 'free_shipping' ? 'FREE DELIVERY OVERRIDE' : (promo.type === 'percentage' ? `${promo.value}% OFF` : `₹${promo.value} OFF`)}</span>
                       {promo.minOrderAmount && <span>Min: ₹{promo.minOrderAmount}</span>}
                       <span>Uses: {promo.usageCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : ''}</span>
                       <span className={promo.isStackable ? 'text-gray-500' : 'text-[#3395FF]'}>{promo.isStackable ? 'Stackable' : 'EXCLUSIVE VIP'}</span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                 <button 
                  onClick={() => updatePromo(promo.id, { isActive: !promo.isActive })}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border transition-colors ${promo.isActive ? 'text-primary border-primary hover:bg-primary/10' : 'text-gray-500 border-gray-600 hover:bg-white/5'}`}
                 >
                  {promo.isActive ? 'Active' : 'Inactive'}
                 </button>
                 <button onClick={() => deletePromo(promo.id)} className="text-gray-500 hover:text-red-500 transition-colors py-1 px-2 border border-transparent">
                    <Trash2 size={16} />
                 </button>
              </div>
           </div>
        )})}
        {promos.length === 0 && (
          <div className="p-8 text-center bg-[#0a0a0a] border border-white/5">
             <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">No promotional logic configured.</p>
          </div>
        )}
      </div>
    </div>
  );
};
