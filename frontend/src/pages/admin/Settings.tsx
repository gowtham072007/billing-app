import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Printer, CheckCircle2, Store } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { ThermalReceipt } from '../../components/thermal/ThermalReceipt';
import { Bill, BillItem } from '../../types';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const [formData, setFormData] = useState({
    shop_name: settings.shop_name || '',
    shop_address: settings.shop_address || '',
    shop_phone: settings.shop_phone || '',
    shop_email: settings.shop_email || '',
    shop_gstin: settings.shop_gstin || '',
    receipt_footer: settings.receipt_footer || 'Thank You! Visit Again.',
    default_tax_rate: settings.default_tax_rate || '0',
    currency_symbol: settings.currency_symbol || '₹',
    thermal_paper_width: settings.thermal_paper_width || '100mm',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setIsSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Sample Mock Bill for the Live Preview
  const sampleBill: Bill = {
    id: 999,
    bill_number: 'INV-20260903-001',
    customer_name: 'Sample Customer',
    customer_phone: '9876543210',
    subtotal: 540,
    discount: 20,
    discount_type: 'flat',
    tax: 0,
    tax_percentage: Number(formData.default_tax_rate) || 0,
    grand_total: 520,
    payment_method: 'cash',
    created_at: new Date().toISOString(),
  };

  const sampleItems: BillItem[] = [
    { product_id: 1, product_name: 'Rice Ponni 5kg', sku: 'RICE005', unit: 'Bag', quantity: 1, price: 290, total: 290 },
    { product_id: 2, product_name: 'Sugar 1kg', sku: 'SUGR001', unit: 'kg', quantity: 2, price: 50, total: 100 },
    { product_id: 3, product_name: 'Refined Cooking Oil 1L', sku: 'OIL001', unit: 'L', quantity: 1, price: 150, total: 150 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shop & Receipt Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Store metadata, default tax rates, thermal printer width, and receipt footer customization
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Settings Form (7 cols on lg) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Shop Information Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-4 h-4 text-brand-600" />
              <span>Shop Identity & Contact Details</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store / Business Name *</label>
              <input
                type="text"
                required
                value={formData.shop_name}
                onChange={e => handleChange('shop_name', e.target.value)}
                placeholder="e.g. Sri Krishna Supermarket"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Address *</label>
              <textarea
                rows={2}
                required
                value={formData.shop_address}
                onChange={e => handleChange('shop_address', e.target.value)}
                placeholder="e.g. No. 42, Bazaar Main Road, Near Bus Stand, Tamil Nadu - 600001"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.shop_phone}
                  onChange={e => handleChange('shop_phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Email (Optional)</label>
                <input
                  type="email"
                  value={formData.shop_email}
                  onChange={e => handleChange('shop_email', e.target.value)}
                  placeholder="contact@srikrishnastore.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN / Tax ID (Optional)</label>
              <input
                type="text"
                value={formData.shop_gstin}
                onChange={e => handleChange('shop_gstin', e.target.value)}
                placeholder="e.g. 33AAAAA0000A1Z5"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Thermal Receipt Settings Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>4-inch Thermal Receipt Configurations</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Footer Message</label>
              <input
                type="text"
                value={formData.receipt_footer}
                onChange={e => handleChange('receipt_footer', e.target.value)}
                placeholder="Thank You! Visit Again."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default POS Tax Rate (%)</label>
                <select
                  value={formData.default_tax_rate}
                  onChange={e => handleChange('default_tax_rate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
                >
                  <option value="0">0% (No Tax / Grocery Exempt)</option>
                  <option value="5">5% (GST)</option>
                  <option value="12">12% (GST)</option>
                  <option value="18">18% (GST)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Printer Roll Preset</label>
                <select
                  value={formData.thermal_paper_width}
                  onChange={e => handleChange('thermal_paper_width', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
                >
                  <option value="100mm">4-inch Roll (100mm) - Recommended</option>
                  <option value="80mm">3-inch Roll (80mm Standard POS)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            {isSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings saved and applied successfully!</span>
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="ml-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Apply Settings'}</span>
            </button>
          </div>
        </form>

        {/* Right Side: Live Thermal Receipt Preview (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Live Thermal Receipt Preview</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time representation of 4-inch printer output with your current settings
            </p>

            <div className="bg-slate-100 p-4 rounded-xl flex justify-center shadow-inner overflow-x-auto">
              <div className="bg-white p-3 shadow-md rounded-sm border border-slate-200">
                <ThermalReceipt bill={sampleBill} items={sampleItems} settings={formData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
