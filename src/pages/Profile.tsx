import React, { useState, useEffect } from 'react';
import { User, LogOut, Package, Clock, Truck, CheckCircle, ChevronDown, ChevronUp, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrders } from '../contexts/OrdersContext';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const [supaUser, setSupaUser] = useState<any>(undefined); // undefined = still checking
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { orders } = useOrders();
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        setSupaUser(user ?? null);
        if (user) {
          // maybeSingle() returns null (not an error) when no row exists
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          if (mounted) {
            setProfile(profileData ?? null);
            if (profileData) {
              setFirstName(profileData.first_name || '');
              setLastName(profileData.last_name || '');
              setUsername(profileData.username || '');
              setPhone(profileData.phone || '');
            }
          }
        }
      } catch (err) {
        console.error('Profile init error:', err);
        if (mounted) setSupaUser(null);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });
      if (signInError) throw signInError;
      // Re-fetch user + profile after sign in
      const { data: { user } } = await supabase.auth.getUser();
      setSupaUser(user ?? null);
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        setProfile(profileData ?? null);
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
      });
      if (signUpError) throw signUpError;
      if (data.session && data.user) {
        // Save profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          username: username.trim() || firstName || signUpEmail.split('@')[0],
          phone,
        });
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        setProfile(profileData ?? null);
        setSupaUser(data.user);
      } else {
        setError('Account created! Please check your email to confirm your account, then sign in.');
        setIsSignUp(false);
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSupaUser(null);
    setProfile(null);
    setIsEditing(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supaUser) return;
    
    setUpdateLoading(true);
    setUpdateSuccess(false);
    setError('');
    
    try {
      console.log('Attempting to update profile for user:', supaUser.id);
      const profileToUpdate = {
        id: supaUser.id,
        first_name: firstName,
        last_name: lastName,
        username: username || firstName || supaUser.email?.split('@')[0],
        phone,
      };
      console.log('Profile data:', profileToUpdate);

      const { error: updateError } = await supabase.from('profiles').upsert(profileToUpdate);
      
      if (updateError) {
        console.error('Supabase Update Error:', updateError);
        throw updateError;
      }
      
      console.log('Profile updated successfully, fetching new data...');
      const { data: profileData, error: fetchError } = await supabase.from('profiles').select('*').eq('id', supaUser.id).maybeSingle();
      
      if (fetchError) {
        console.error('Supabase Fetch Error:', fetchError);
        throw fetchError;
      }

      setProfile(profileData);
      setUpdateSuccess(true);
      setIsEditing(false);
      console.log('Profile state updated:', profileData);
      
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err: any) {
      console.error('Caught error in handleUpdateProfile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    setUpdateSuccess(false);
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(signInEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setUpdateSuccess(true);
      setError('Password reset link sent! Please check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="text-yellow-500" size={16} />;
      case 'Shipped': return <Truck className="text-blue-500" size={16} />;
      case 'Delivered': return <CheckCircle className="text-green-500" size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Shipped': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Still checking session
  if (supaUser === undefined) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-primary font-bold animate-pulse uppercase tracking-widest text-sm">Loading Profile...</div>
      </div>
    );
  }

  // Logged in
  if (supaUser) {
    // Priority: chosen username → first name → email prefix
    const displayUsername = profile?.username || profile?.first_name || supaUser.email?.split('@')[0];
    const displayName =
      profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || displayUsername : displayUsername;

    // Show orders that belong to this user (RLS already filters, but also email-match as fallback)
    const myOrders = orders.filter(o =>
      o.customerData?.email?.toLowerCase() === supaUser.email?.toLowerCase()
    );

    return (
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
        <h1 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter mb-12">
          My Account
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-[#111] border border-white/5 p-8 sticky top-32">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <User size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1 break-words">{displayName}</h2>
              <p className="text-primary font-bold uppercase tracking-widest text-xs mb-1">@{displayUsername}</p>
              <p className="text-gray-500 text-xs mb-2 break-all">{supaUser.email}</p>
              {profile?.phone && !isEditing && <p className="text-gray-400 text-sm mb-2">{profile.phone}</p>}

              {!profile && !isEditing && (
                <div className="bg-primary/10 border border-primary/20 p-3 mb-4 text-xs text-primary font-bold uppercase tracking-widest">
                  Profile not set up — complete your details below
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">First Name</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full bg-black border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Last Name</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full bg-black border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-black border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full bg-black border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email (Read-only)</label>
                    <input type="email" value={supaUser.email} disabled className="w-full bg-white/5 border border-white/5 text-gray-500 px-3 py-2 text-sm cursor-not-allowed" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="border border-white/10 text-white px-4 py-2 font-bold uppercase tracking-wider text-[10px] hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={updateLoading} className="bg-primary text-black px-4 py-2 font-bold uppercase tracking-wider text-[10px] hover:bg-primary-hover transition-colors">
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 mt-6">
                  {updateSuccess && (
                    <div className="bg-green-500/10 border border-green-500/20 p-2 text-[10px] text-green-500 font-bold uppercase tracking-widest text-center">
                      Profile Updated!
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-2 text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">
                      {error}
                    </div>
                  )}
                  <button onClick={() => setIsEditing(true)} className="block text-center w-full border border-white/10 hover:border-primary/50 text-white hover:text-primary px-6 py-3 font-bold uppercase tracking-wider text-sm transition-all">
                    Edit Profile
                  </button>
                  <Link to="/products" className="block text-center w-full bg-primary hover:bg-primary-hover text-black px-6 py-3 font-bold uppercase tracking-wider text-sm transition-colors">
                    Continue Shopping
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full border border-white/10 hover:border-red-500/50 text-red-500 px-6 py-3 font-bold uppercase tracking-wider text-sm transition-colors">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Orders */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <Package /> Order History ({myOrders.length})
            </h2>
            {myOrders.length === 0 ? (
              <div className="text-center py-16 bg-[#111] border border-white/5">
                <p className="text-gray-400 mb-6">You haven't placed any orders yet.</p>
                <Link to="/products" className="text-primary hover:text-white uppercase tracking-widest font-bold underline text-sm transition-colors">Start Shopping</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => {
                  const isExpanded = expandedOrders.includes(order.id);
                  const itemCount = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
                  return (
                    <div key={order.id} className="bg-[#111] border border-white/5">
                      <div onClick={() => toggleOrder(order.id)} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer hover:bg-white/5">
                        <div className="flex-grow">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Order #{order.id}</span>
                          <span className="text-sm text-gray-300">{new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span className="text-xs text-gray-500 mt-1 block">{itemCount} item(s) • ₹{order.total.toLocaleString()}</span>
                          {order.paymentMethod === 'cod' && <span className="text-xs text-primary font-bold mt-1 block">Cash on Delivery</span>}
                          {order.fulfillmentType === 'pickup' && <span className="text-xs text-purple-400 font-bold mt-0.5 block">🏪 Store Pickup</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-3 sm:mt-0">
                          <div className={`flex items-center gap-2 px-3 py-1.5 border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="text-xs font-bold uppercase tracking-wider">{order.status}</span>
                          </div>
                          <button className="text-gray-400 hover:text-white p-2">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="p-6 pt-0 border-t border-white/5 space-y-3">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-4 bg-[#0a0a0a] p-4 border border-white/5">
                              <img src={item.image} alt="" className="w-12 h-12 object-cover bg-black" />
                              <div className="flex-grow">
                                <Link to={`/product/${item.id}`} className="text-white font-bold hover:text-primary transition-colors text-sm">{item.name}</Link>
                                <div className="text-xs text-primary font-bold uppercase tracking-widest mt-1">{item.category}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-400 text-xs uppercase font-bold">Qty: {item.quantity}</div>
                                <div className="text-white font-bold">₹{(item.price * item.quantity).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                          {order.fulfillmentType === 'pickup' && order.customerData?.pickupLocation && (
                            <div className="bg-purple-500/10 border border-purple-500/20 p-3">
                              <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-1">Pickup Location</p>
                              <p className="text-white text-sm">{order.customerData.pickupLocation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="bg-[#111] border border-white/5 p-8 sm:p-12 max-w-md mx-auto mt-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-2">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-sm text-gray-400">
            {isSignUp ? 'Join the A1 Supplements community.' : 'Welcome back to A1 Supplements.'}
          </p>
        </div>

        {error && <div className="bg-red-500/10 text-red-400 p-3 mb-6 text-xs font-bold uppercase tracking-widest text-center">{error}</div>}

        {isSignUp ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username / Nickname</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Optional" className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <input type="password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required minLength={6} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <button type="submit" disabled={authLoading} className="w-full bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors mt-4 flex items-center justify-center gap-2">
              {authLoading ? 'Creating...' : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>
        ) : showForgot ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-gray-400 text-xs mb-4">Enter your email and we'll send you a link to reset your password.</p>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <button type="submit" disabled={authLoading} className="w-full bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors mt-4">
              {authLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type="button" onClick={() => setShowForgot(false)} className="w-full text-gray-400 hover:text-white font-bold uppercase tracking-widest text-[10px] mt-2">
              ← Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-widest underline transition-colors">Forgot Password?</button>
              </div>
              <input type="password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} required className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <button type="submit" disabled={authLoading} className="w-full bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors mt-4 flex items-center justify-center gap-2">
              {authLoading ? 'Signing In...' : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-400">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-primary hover:text-white font-bold uppercase tracking-widest underline transition-colors">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
