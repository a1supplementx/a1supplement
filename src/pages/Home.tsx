import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProducts } from '../contexts/ProductsContext';
import ProductCard from '../components/ProductCard';
import { ArrowRight, Zap, Target, Award } from 'lucide-react';

const Home = () => {
  const { products } = useProducts();
  const trendingProducts = products.filter(p => p.isTrending).slice(0, 4);

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-32">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero background" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-block bg-primary text-black font-black uppercase text-xs tracking-widest px-3 py-1 mb-6">
              A1 Curator's Choice
            </div>
            <h1 className="text-6xl sm:text-8xl font-display font-black text-white italic leading-none tracking-tighter mb-6">
              THE<br/>
              <span className="text-primary">PERFORMANCE</span><br/>
              EDIT 2024
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-xl leading-relaxed">
              Beyond the generic shelf. We've curated the most potent formulas from the world's elite brands. High-purity, science-backed, and athlete-tested.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="bg-primary hover:bg-primary-hover text-black px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors text-center inline-flex justify-center items-center gap-2">
                Shop All New Arrivals <ArrowRight size={16} />
              </Link>
              <Link to="/products" className="bg-transparent border border-white/20 hover:border-white hover:bg-white/5 text-white px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors text-center inline-flex justify-center items-center">
                View Brands
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="bg-[#111] border-y border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {[
               { i: <Award/>, t: 'Authorized Retailer' },
               { i: <Zap/>, t: 'Fast Shipping' },
               { i: <Target/>, t: 'Science-Backed' },
               { i: <User/>, t: 'Expert Guidance', comp: User }
            ].map((prop, idx) => (
              <div key={idx} className="flex flex-col items-center text-center px-4 first:pl-0 last:pr-0">
                <div className="text-primary mb-3">
                  {React.cloneElement(prop.i as React.ReactElement, { size: 24 })}
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400">{prop.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING NOW */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <div className="w-12 h-1 bg-primary mb-4" />
              <h2 className="text-3xl font-display font-black text-white italic tracking-tight">TRENDING NOW</h2>
            </div>
            <Link to="/products" className="text-xs font-bold text-gray-400 hover:text-primary uppercase tracking-widest hidden sm:block transition-colors">
              View Entire Collection →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trendingProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="h-full"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
// Quick inline User fallback because we imported it in previous file
import { User } from 'lucide-react';
export default Home;
