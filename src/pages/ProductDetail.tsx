import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../contexts/ProductsContext';
import { useCart } from '../contexts/CartContext';
import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl text-white">Product not found.</h2>
      </div>
    );
  }

  const handleAdd = () => {
    setIsAdding(true);
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image
    });
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors mb-10"
      >
        <ArrowLeft size={16} className="mr-2" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-square bg-[#111] border border-white/5 relative items-center justify-center flex overflow-hidden"
        >
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <p className="text-primary font-bold uppercase tracking-widest text-xs mb-4">{product.category}</p>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-white italic uppercase tracking-tighter mb-4">
            {product.name}
          </h1>
          <div className="text-3xl font-display font-bold text-white mb-8">₹{product.price.toLocaleString()}</div>
          
          <p className="text-gray-300 leading-relaxed mb-10">
            {product.description}
          </p>

          <div className="border-t border-white/10 pt-8 mb-8">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quantity</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center border border-white/20 bg-[#111]">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-white font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className={`w-full py-5 px-8 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 ${
              isAdding 
                ? 'bg-green-500 text-black' 
                : 'bg-primary hover:bg-primary-hover text-black'
            }`}
          >
            <ShoppingCart size={20} />
            {isAdding ? 'Added to Cart!' : 'Add to Cart'}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
