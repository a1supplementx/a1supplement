import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session (the user landed here from a reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Your reset link is invalid or has expired. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[80vh] flex items-center justify-center">
      <div className="bg-[#111] border border-white/5 p-8 sm:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-gray-400">
            Enter your new secure password below.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 mb-6 text-xs font-bold uppercase tracking-widest flex items-center gap-3 border border-red-500/20">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center text-primary">
              <CheckCircle size={64} />
            </div>
            <h3 className="text-white font-bold uppercase tracking-wider">Password Updated!</h3>
            <p className="text-gray-400 text-sm">Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                minLength={6}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" 
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                minLength={6}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" 
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Updating...' : <><Lock size={18} /> Update Password</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
