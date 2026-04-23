import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Promo {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number; // e.g. 10 (%), 500 (₹), or 0 for free_shipping
  isStackable: boolean; // Can this be used alongside other promos?
  isActive: boolean;
  expiresAt: string | null; // ISO Date string or null
  usageLimit: number | null; // Max number of redemptions system-wide
  usageCount: number; // How many times it has actually been redeemed
  minOrderAmount: number | null; // Minimum cart subtotal required
}

interface PromoContextType {
  promos: Promo[];
  addPromo: (promo: Omit<Promo, 'id' | 'usageCount'>) => void;
  updatePromo: (id: string, updates: Partial<Promo>) => void;
  deletePromo: (id: string) => void;
  validatePromo: (code: string, currentCartTotal: number, currentlyAppliedCodes?: string[]) => { isValid: boolean; promo: Promo | null; error: string | null };
  getActivePromos: (codes: string[], currentCartTotal: number) => Promo[];
  incrementPromoUsage: (code: string) => void;
}

const PromoContext = createContext<PromoContextType | undefined>(undefined);

export const PromoProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    const { data, error } = await supabase.from('promos').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching promos:', error);
    } else if (data) {
      const mapped = data.map(d => ({
        id: d.id,
        code: d.code,
        type: d.type,
        value: d.value,
        isStackable: d.is_stackable,
        isActive: d.is_active,
        expiresAt: d.expires_at,
        usageLimit: d.usage_limit,
        usageCount: d.usage_count,
        minOrderAmount: d.min_order_amount
      }));
      setPromos(mapped);
    }
  };

  const addPromo = async (promo: Omit<Promo, 'id' | 'usageCount'>) => {
    const { error } = await supabase.from('promos').insert([{
      code: promo.code,
      type: promo.type,
      value: promo.value,
      is_active: promo.isActive,
      is_stackable: promo.isStackable,
      expires_at: promo.expiresAt,
      usage_limit: promo.usageLimit,
      min_order_amount: promo.minOrderAmount
    }]);

    if (error) {
      console.error('Error creating promo:', error);
      alert('Fail to create promo code.');
    } else {
      fetchPromos();
    }
  };

  const updatePromo = async (id: string, updates: Partial<Promo>) => {
    const dbUpdates: any = {};
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.isStackable !== undefined) dbUpdates.is_stackable = updates.isStackable;
    if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
    
    // Fallbacks just in case
    if (updates.usageLimit !== undefined) dbUpdates.usage_limit = updates.usageLimit;
    if (updates.minOrderAmount !== undefined) dbUpdates.min_order_amount = updates.minOrderAmount;

    const { error } = await supabase.from('promos').update(dbUpdates).eq('id', id);
    if (!error) {
      fetchPromos();
    }
  };

  const deletePromo = async (id: string) => {
    const { error } = await supabase.from('promos').delete().eq('id', id);
    if (!error) {
       fetchPromos();
    }
  };

  const validatePromo = (code: string, currentCartTotal: number, currentlyAppliedCodes: string[] = []) => {
    const targetPromo = promos.find(p => p.code.toLowerCase() === code.toLowerCase());
    
    if (!targetPromo) return { isValid: false, promo: null, error: 'Invalid or expired code.' };
    if (!targetPromo.isActive) return { isValid: false, promo: null, error: 'This promo is inactive.' };
    
    // Check if the exact code is already applied
    if (currentlyAppliedCodes.map(c => c.toLowerCase()).includes(code.toLowerCase())) {
        return { isValid: false, promo: null, error: 'Code is already applied to cart.' };
    }

    if (targetPromo.expiresAt && new Date() > new Date(targetPromo.expiresAt)) return { isValid: false, promo: null, error: 'This promo code has expired.' };
    if (targetPromo.usageLimit !== null && targetPromo.usageCount >= targetPromo.usageLimit) return { isValid: false, promo: null, error: 'This promo code limit has been reached.' };
    if (targetPromo.minOrderAmount !== null && currentCartTotal < targetPromo.minOrderAmount) return { isValid: false, promo: null, error: `Minimum order of ₹${targetPromo.minOrderAmount.toLocaleString()} required.` };

    // Stackability Checks
    if (currentlyAppliedCodes.length > 0) {
       // if the new promo is exclusive
       if (!targetPromo.isStackable) {
           return { isValid: false, promo: null, error: `The code "${targetPromo.code}" cannot be combined with other offers. Remove other codes first.` };
       }
       
       // if any existing promo is exclusive
       const appliedPromoObjects = currentlyAppliedCodes
           .map(appliedCode => promos.find(p => p.code.toLowerCase() === appliedCode.toLowerCase()))
           .filter(Boolean) as Promo[];
       
       const hasExclusivePromo = appliedPromoObjects.some(p => !p.isStackable);
       if (hasExclusivePromo) {
           return { isValid: false, promo: null, error: 'Your cart contains an exclusive code that cannot be combiend with new offers.' };
       }
    }

    return { isValid: true, promo: targetPromo, error: null };
  };

  const getActivePromos = (codes: string[], currentCartTotal: number) => {
     return codes.map(code => {
        const targetPromo = promos.find(p => p.code.toLowerCase() === code.toLowerCase());
        if (!targetPromo || !targetPromo.isActive) return null;
        if (targetPromo.expiresAt && new Date() > new Date(targetPromo.expiresAt)) return null;
        if (targetPromo.usageLimit !== null && targetPromo.usageCount >= targetPromo.usageLimit) return null;
        if (targetPromo.minOrderAmount !== null && currentCartTotal < targetPromo.minOrderAmount) return null;
        return targetPromo;
     }).filter(Boolean) as Promo[];
  };

  const incrementPromoUsage = async (code: string) => {
    // Optimistic UI update
    setPromos(prev => prev.map(p => p.code.toLowerCase() === code.toLowerCase() ? { ...p, usageCount: p.usageCount + 1 } : p));
    
    // Call DB via RPC or just fetch current count and + 1 (For simplicity in this scale we will do standard update, but RPC is better for concurrence)
    const target = promos.find(p => p.code.toLowerCase() === code.toLowerCase());
    if (target) {
       await supabase.from('promos').update({ usage_count: target.usageCount + 1 }).eq('id', target.id);
    }
  };

  return (
    <PromoContext.Provider value={{ promos, addPromo, updatePromo, deletePromo, validatePromo, getActivePromos, incrementPromoUsage }}>
      {children}
    </PromoContext.Provider>
  );
};

export const usePromos = () => {
  const context = useContext(PromoContext);
  if (context === undefined) throw new Error('usePromos must be used within a PromoProvider');
  return context;
};
