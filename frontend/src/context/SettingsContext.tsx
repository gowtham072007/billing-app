import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ShopSettings } from '../types';
import { api } from '../api/client';

interface SettingsContextType {
  settings: ShopSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<ShopSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: ShopSettings = {
  shop_name: 'Sri Krishna Supermarket',
  shop_address: 'No. 42, Bazaar Main Road, Near Bus Stand, Tamil Nadu - 600001',
  shop_phone: '+91 98765 43210',
  shop_email: 'contact@srikrishnastore.com',
  shop_gstin: '33AAAAA0000A1Z5',
  receipt_footer: 'Thank You! Visit Again.',
  default_tax_rate: '0',
  currency_symbol: '₹',
  thermal_paper_width: '100mm',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get<{ settings: ShopSettings }>('/settings');
      if (res.settings && Object.keys(res.settings).length > 0) {
        setSettings(prev => ({ ...prev, ...res.settings }));
      }
    } catch (err) {
      console.warn('Could not fetch settings from server, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<ShopSettings>) => {
    const res = await api.put<{ settings: ShopSettings }>('/settings', newSettings);
    setSettings(prev => ({ ...prev, ...res.settings }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
