import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DeliveryZone {
  id: string;
  region: string;
  fee: number;
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface SiteSettings {
  address: string;
  email: string;
  phone: string;
  privacyPolicy: string;
  termsOfService: string;
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number | null;
  deliveryZones: DeliveryZone[];
  pickupLocations: PickupLocation[];
  subscribedEmails: string[];
}

const defaultSettings: SiteSettings = {
  address: '123 Iron Street, Muscle City, CA 90210',
  email: 'support@a1supplements-demo.com',
  phone: '1-800-PUMP-IT-UP',
  privacyPolicy: 'We value your privacy. This is a placeholder privacy policy.',
  termsOfService: 'Welcome to A1 Supplements. By using our site, you agree to our terms.',
  defaultDeliveryFee: 500,
  freeDeliveryThreshold: 5000,
  deliveryZones: [
    { id: '1', region: 'Maharashtra', fee: 200 },
    { id: '2', region: 'Delhi', fee: 300 }
  ],
  pickupLocations: [],
  subscribedEmails: []
};

interface SettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
  updateDeliveryZones: (zones: DeliveryZone[]) => void;
  updatePickupLocations: (locations: PickupLocation[]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'core').single();
    if (error) {
      console.error('Error fetching settings:', error);
    } else if (data) {
      setSettings({
        address: data.address || defaultSettings.address,
        email: data.email || defaultSettings.email,
        phone: data.phone || defaultSettings.phone,
        privacyPolicy: data.privacy_policy || defaultSettings.privacyPolicy,
        termsOfService: data.terms_of_service || defaultSettings.termsOfService,
        defaultDeliveryFee: data.default_delivery_fee !== null ? data.default_delivery_fee : defaultSettings.defaultDeliveryFee,
        freeDeliveryThreshold: data.free_delivery_threshold,
        deliveryZones: data.delivery_zones || [],
        pickupLocations: data.pickup_locations || [],
        subscribedEmails: data.subscribed_emails || []
      });
    }
  };

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    const dbUpdates: any = {};
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.privacyPolicy !== undefined) dbUpdates.privacy_policy = updates.privacyPolicy;
    if (updates.termsOfService !== undefined) dbUpdates.terms_of_service = updates.termsOfService;
    if (updates.defaultDeliveryFee !== undefined) dbUpdates.default_delivery_fee = updates.defaultDeliveryFee;
    if (updates.freeDeliveryThreshold !== undefined) dbUpdates.free_delivery_threshold = updates.freeDeliveryThreshold;
    if (updates.subscribedEmails !== undefined) dbUpdates.subscribed_emails = updates.subscribedEmails;
    await supabase.from('settings').upsert({ id: 'core', ...dbUpdates });
  };

  const updateDeliveryZones = async (zones: DeliveryZone[]) => {
    setSettings(prev => ({ ...prev, deliveryZones: zones }));
    await supabase.from('settings').upsert({ id: 'core', delivery_zones: zones });
  };

  const updatePickupLocations = async (locations: PickupLocation[]) => {
    setSettings(prev => ({ ...prev, pickupLocations: locations }));
    await supabase.from('settings').upsert({ id: 'core', pickup_locations: locations });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateDeliveryZones, updatePickupLocations }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
