import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const Navbar = () => {
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-display font-black text-white italic tracking-tighter hover:text-primary transition-colors">
              A1<span className="text-primary uppercase">Supplement</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8">
            <Link to="/products" className="text-sm font-semibold text-gray-300 hover:text-primary uppercase tracking-wider transition-colors">Shop All</Link>
            <Link to="/products?category=Protein" className="text-sm font-semibold text-gray-300 hover:text-primary uppercase tracking-wider transition-colors">Proteins</Link>
            <Link to="/products?category=Pre-Workout" className="text-sm font-semibold text-gray-300 hover:text-primary uppercase tracking-wider transition-colors">Pre-Workout</Link>
            <Link to="/contact" className="text-sm font-semibold text-gray-300 hover:text-primary uppercase tracking-wider transition-colors">Contact</Link>
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-6">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  placeholder="Search products..."
                  className="bg-[#111] border border-white/10 text-white px-3 py-1 text-sm focus:outline-none focus:border-primary transition-colors w-48"
                  onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                />
              </form>
            ) : (
              <button onClick={() => setIsSearchOpen(true)} className="text-gray-300 hover:text-primary transition-colors">
                <Search size={20} />
              </button>
            )}
            <Link to="/profile" className="text-gray-300 hover:text-primary transition-colors"><User size={20} /></Link>
            <Link to="/cart" className="relative text-gray-300 hover:text-primary transition-colors group">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-black text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  placeholder="Search..."
                  className="bg-[#111] border border-white/10 text-white px-2 py-1 text-xs focus:outline-none focus:border-primary transition-colors w-24 sm:w-32"
                  onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                />
              </form>
            ) : (
              <button onClick={() => setIsSearchOpen(true)} className="text-gray-300 hover:text-primary transition-colors">
                <Search size={20} />
              </button>
            )}
            <Link to="/profile" className="text-gray-300 hover:text-primary transition-colors">
              <User size={20} />
            </Link>
            <Link to="/cart" className="relative text-gray-300 hover:text-primary transition-colors group">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-black text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#111] border-t border-white/10 absolute w-full left-0 shadow-2xl pb-6">
          <div className="px-4 pt-4 pb-3 space-y-2">
            <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-bold uppercase tracking-wide text-white hover:bg-white/5 rounded-md">Shop All</Link>
            <Link to="/products?category=Protein" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-bold uppercase tracking-wide text-gray-300 hover:bg-white/5 rounded-md">Proteins</Link>
            <Link to="/products?category=Pre-Workout" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-bold uppercase tracking-wide text-gray-300 hover:bg-white/5 rounded-md">Pre-Workout</Link>
            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-bold uppercase tracking-wide text-gray-300 hover:bg-white/5 rounded-md">Contact</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
