import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../contexts/ProductsContext';
import { useCart } from '../contexts/CartContext';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image
    });
    // Optional: add a toast notification here
  };

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-[#141414] border border-white/5 overflow-hidden flex flex-col h-full group transition-all"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#1a1a1a]">
        <div className="absolute top-4 left-4 z-10">
          {product.isTrending && (
            <span className="bg-primary text-black text-[10px] font-black uppercase tracking-wider px-2 py-1">
              BESTSELLER
            </span>
          )}
        </div>
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
           <span className="text-white font-bold uppercase tracking-widest text-sm border-b border-white pb-1">View Details</span>
        </div>
      </Link>
      
      <div className="p-4 sm:p-6 flex flex-col flex-grow">
        <p className="text-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-2">{product.category}</p>
        <Link to={`/product/${product.id}`} className="flex-grow">
          <h3 className="text-white font-bold text-sm sm:text-lg leading-tight uppercase transition-colors group-hover:text-gray-300 mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mt-auto border-t border-white/5 pt-3 sm:pt-4 gap-3 xl:gap-0">
          <span className="text-lg sm:text-xl font-display font-bold text-white">₹{product.price.toLocaleString()}</span>
          <button 
            onClick={handleAddToCart}
            className="text-[10px] sm:text-xs font-bold text-black bg-white hover:bg-primary px-3 sm:px-4 py-2 uppercase tracking-wide transition-colors w-full xl:w-auto text-center"
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
