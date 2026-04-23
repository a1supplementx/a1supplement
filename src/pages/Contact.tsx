import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Mail, MapPin, Phone } from 'lucide-react';

const Contact = () => {
  const { settings } = useSettings();
  const [status, setStatus] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Message sent successfully! We will get back to you soon.');
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setStatus(''), 5000);
  };

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[80vh]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        
        <div>
          <h1 className="text-5xl font-display font-black text-white italic uppercase tracking-tighter mb-8">
            Get In Touch
          </h1>
          <p className="text-gray-400 mb-12 text-lg">
            Questions about our products or your order? Reach out to our team of supplement experts.
          </p>

          <div className="space-y-8">
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-full mr-4 text-primary">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold uppercase tracking-wider mb-1">Headquarters</h3>
                <p className="text-gray-400">{settings.address}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-full mr-4 text-primary">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold uppercase tracking-wider mb-1">Email Us</h3>
                <p className="text-gray-400">{settings.email}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-full mr-4 text-primary">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold uppercase tracking-wider mb-1">Call Us</h3>
                <p className="text-gray-400">{settings.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 p-8">
          <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter mb-6">
            Send a Message
          </h2>
          
          {status && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 mb-6 text-sm font-bold">
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Name</label>
              <input required type="text" className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
              <input required type="email" className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
              <textarea required rows={5} className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"></textarea>
            </div>
            <button 
              type="submit"
              className="bg-white hover:bg-gray-200 text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors w-full"
            >
              Send Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Contact;
