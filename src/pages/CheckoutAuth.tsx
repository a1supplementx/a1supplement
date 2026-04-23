import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRight, UserPlus, LogIn, User } from 'lucide-react';
import { motion } from 'framer-motion';

const CheckoutAuth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // checking existing session
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // On mount, do a server-side check for an existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/checkout', { replace: true });
      } else {
        setChecking(false);
      }
    };
    checkSession();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-primary font-bold animate-pulse uppercase tracking-widest text-sm">Checking session...</div>
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.session) {
          navigate('/checkout', { replace: true });
        } else {
          setError('Check your email to confirm your account, then sign in below.');
          setIsSignUp(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/checkout', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter mb-4">
          Almost There
        </h1>
        <p className="text-gray-400">Choose how you'd like to complete your order.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Left Side: Create Account / Login */}
        <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="bg-[#111] border border-white/5 p-8 flex flex-col justify-between"
        >
          <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                <User className="text-primary" /> {isSignUp ? 'Create Profile' : 'Sign In'}
              </h2>
              
              {error && <div className="bg-red-500/10 text-red-500 p-3 mb-6 text-xs font-bold uppercase tracking-widest">{error}</div>}

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <input 
                    type="email" 
                    placeholder="EMAIL ADDRESS" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm font-bold tracking-widest placeholder:text-gray-600" 
                  />
                </div>
                <div>
                  <input 
                    type="password" 
                    placeholder="PASSWORD" 
                    required 
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm font-bold tracking-widest placeholder:text-gray-600" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-200 text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors flex justify-center items-center gap-2"
                >
                  {loading ? 'Authenticating...' : (isSignUp ? <><UserPlus size={18}/> Create Account</> : <><LogIn size={18}/> Secure Login</>)}
                </button>
              </form>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
             <button 
               type="button" 
               onClick={() => { setIsSignUp(!isSignUp); setError(''); }} 
               className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
             >
               {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
             </button>
          </div>
        </motion.div>

        {/* Right Side: Guest Checkout */}
        <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="bg-primary/5 border border-primary/20 p-8 flex flex-col justify-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black uppercase tracking-widest px-3 py-1">Fastest</div>
          
          <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-4">
            Guest Checkout
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            Skip the sign-up process. You can optionally create an account later to track your delivery.
          </p>
          
          <button 
             onClick={() => navigate('/checkout', { replace: true })}
             className="w-full bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)]"
          >
            Continue as Guest <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutAuth;
