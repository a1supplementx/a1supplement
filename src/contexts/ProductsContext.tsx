import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  isTrending?: boolean;
}

interface ProductsContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching products:', error);
    } else if (data) {
      // Map database schema to frontend Product schema
      const mapped = data.map(d => ({
        id: d.id, name: d.name, price: d.price, description: d.description, 
        image: d.image, category: d.category, isTrending: d.is_featured
      }));
      setProducts(mapped);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase.from('products').insert([{
       name: product.name,
       description: product.description,
       price: product.price,
       category: product.category,
       image: product.image,
       is_featured: product.isTrending || false
    }]).select();
    
    if (error) {
       console.error('Error adding product:', error);
       alert('Error adding product to database.');
    } else if (data) {
       fetchProducts();
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.isTrending !== undefined) dbUpdates.is_featured = updates.isTrending;

    const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
    if (error) {
      console.error('Error updating product:', error);
    } else {
      fetchProducts();
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
       fetchProducts();
    }
  };

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (context === undefined) throw new Error('useProducts must be used within a ProductsProvider');
  return context;
};
