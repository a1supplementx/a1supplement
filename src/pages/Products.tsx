import React, { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../contexts/ProductsContext';
import ProductCard from '../components/ProductCard';
import { useLocation, useNavigate } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';

const Products = () => {
  const { products } = useProducts();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const urlCategory = searchParams.get('category');
  const urlSearch = searchParams.get('search');

  // Derive maximum possible price from catalog
  const highestPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    return Math.max(...products.map(p => p.price));
  }, [products]);

  const allCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats);
  }, [products]);

  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || 'All');
  const [maxPrice, setMaxPrice] = useState<number>(highestPrice);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL changes to local state
  useEffect(() => {
    if (urlCategory) setSelectedCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    // Reset max price if products load later
    if (maxPrice === 10000 && highestPrice > 10000) {
      setMaxPrice(highestPrice);
    }
  }, [highestPrice, maxPrice]);

  let filteredProducts = products.filter(p => p.price <= maxPrice);

  if (selectedCategory !== 'All') {
    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
  }
  
  if (urlSearch) {
    const q = urlSearch.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sortBy === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCategory(val);
    
    // Clear URL category if they select 'All' manually so it doesn't stick
    const params = new URLSearchParams(location.search);
    if (val === 'All') {
      params.delete('category');
    } else {
      params.set('category', val);
    }
    navigate(`${location.pathname}?${params.toString()}`);
  };

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter mb-2">
            {urlSearch 
              ? `Search: "${urlSearch}"` 
              : selectedCategory !== 'All'
                ? `${selectedCategory} Collection` 
                : 'All Products'}
          </h1>
          <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
            Browse our complete catalog of premium supplements. Highest quality ingredients, trusted by elite athletes.
          </p>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden bg-[#111] border border-white/10 px-4 py-3 flex items-center justify-center gap-2 text-white font-bold uppercase tracking-wider text-xs"
        >
          <SlidersHorizontal size={16} /> Filters & Sorting
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className={`w-full lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
           <div className="bg-[#111] border border-white/5 p-6 sticky top-28 space-y-8">
              <div>
                 <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-4">Category</h3>
                 <select 
                   value={selectedCategory}
                   onChange={handleCategoryChange}
                   className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary text-sm transition-colors"
                 >
                    <option value="All">All Categories</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                 </select>
              </div>

              <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold uppercase tracking-widest text-xs">Max Price</h3>
                    <span className="text-primary font-bold text-xs">₹{maxPrice.toLocaleString()}</span>
                 </div>
                 <input 
                   type="range" 
                   min="0" 
                   max={highestPrice} 
                   step="100"
                   value={maxPrice}
                   onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                   className="w-full accent-primary"
                 />
                 <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">
                    <span>₹0</span>
                    <span>₹{highestPrice.toLocaleString()}</span>
                 </div>
              </div>

              <div>
                 <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-4">Sort By</h3>
                 <select 
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value as any)}
                   className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-primary text-sm transition-colors"
                 >
                    <option value="featured">Featured / Default</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Product Grid */}
        <div className="flex-grow">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-[#111] border border-white/5">
              <p className="text-gray-400">No products match your current filters.</p>
              <button 
                onClick={() => {
                  setMaxPrice(highestPrice);
                  setSelectedCategory('All');
                  setSortBy('featured');
                }}
                className="mt-6 text-primary hover:text-white uppercase font-bold tracking-widest text-xs underline transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                Showing {filteredProducts.length} Results
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
