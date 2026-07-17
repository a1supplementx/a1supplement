import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

const Footer = () => {
  const { settings, updateSettings } = useSettings();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && !settings.subscribedEmails?.includes(email)) {
      updateSettings({
        subscribedEmails: [...(settings.subscribedEmails || []), email]
      });
    }
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-8">
          
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-display font-black text-white italic tracking-tighter">
              A1<span className="text-primary uppercase">Supplement</span>
            </Link>
            <p className="text-sm text-gray-400 mt-4 leading-relaxed">
              The premium destination for the elite athlete. Authorized retailer for Ghost, ON, C4, and more.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold uppercase tracking-wider mb-4">Marketplace</h3>
            <ul className="space-y-3">
              <li><Link to="/products" className="text-sm text-gray-400 hover:text-primary transition-colors">Shop All</Link></li>
              <li><Link to="/products?category=Protein" className="text-sm text-gray-400 hover:text-primary transition-colors">Proteins</Link></li>
              <li><Link to="/products?category=Recovery" className="text-sm text-gray-400 hover:text-primary transition-colors">Recovery</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold uppercase tracking-wider mb-4">Support & Info</h3>
            <ul className="space-y-3">
              <li><Link to="/track-order" className="text-sm text-gray-400 hover:text-primary transition-colors">Track Your Order</Link></li>
              <li><Link to="/contact" className="text-sm text-gray-400 hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-sm text-gray-400 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-gray-400 hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>{settings.address}</li>
              <li><a href={`mailto:${settings.email}`} className="hover:text-primary transition-colors">{settings.email}</a></li>
              <li><a href={`tel:${settings.phone}`} className="hover:text-primary transition-colors">{settings.phone}</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="text-white font-bold uppercase tracking-wider mb-4">Stay Elite</h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed tracking-wide">
              {subscribed ? "Welcome to the VIP club. Keep an eye on your inbox." : "Want to be the first to know when a new product drops? Subscribe to our newsletter for exclusive updates and zero spam."}
            </p>
            {!subscribed && (
              <form className="flex" onSubmit={handleSubscribe}>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address" 
                  required
                  className="bg-[#111] text-white border border-r-0 border-white/10 px-3 py-2 focus:outline-none focus:border-primary w-full text-sm"
                />
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover text-black px-4 py-2 font-bold uppercase tracking-widest text-[10px] transition-colors"
                 >
                  Join
                </button>
              </form>
            )}
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} A1 SUPPLEMENT PERFORMANCE. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
