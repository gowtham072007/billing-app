import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Printer,
  CheckCircle2,
  Store,
  QrCode,
  Download,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { ThermalReceipt } from '../../components/thermal/ThermalReceipt';
import { InstallAppButton } from '../../components/common/InstallAppButton';
import { Bill, BillItem } from '../../types';
import { buildUpiPaymentUri, generateUpiQrDataUrl, isValidUpiId } from '../../utils/upiHelper';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const [formData, setFormData] = useState({
    shop_name: settings.shop_name || 'வில்மணி ஸ்டோர்',
    shop_address: settings.shop_address || 'முருகன் கோவில் தெரு ஸ்ரீவெங்கடேஸ்வரபுரம்',
    shop_phone: settings.shop_phone || '+91 94862 85112',
    shop_email: settings.shop_email || '',
    shop_gstin: settings.shop_gstin || '33CKNPA2440R1ZZ',
    receipt_footer: settings.receipt_footer || 'நன்றி! மீண்டும் வருக.\nTHANK YOU! VISIT AGAIN.',
    default_tax_rate: settings.default_tax_rate || '0',
    currency_symbol: settings.currency_symbol || '₹',
    thermal_paper_width: settings.thermal_paper_width || '100mm',
    upi_id: settings.upi_id || 'vilmanitraders1386@iob',
    upi_payee_name: settings.upi_payee_name || 'VILMANI TRADERS',
    bank_name: settings.bank_name || 'Indian Overseas Bank',
    print_upi_qr: settings.print_upi_qr || 'true',
    enable_print_size_adjustment: settings.enable_print_size_adjustment || 'true',
  });

  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [upiUriString, setUpiUriString] = useState<string>('');

  const isValidUpi = isValidUpiId(formData.upi_id);

  // Generate QR code whenever UPI ID or Payee Name changes
  useEffect(() => {
    let isCancelled = false;

    async function updateQr() {
      if (isValidUpiId(formData.upi_id)) {
        const uri = buildUpiPaymentUri({
          upiId: formData.upi_id,
          payeeName: formData.upi_payee_name || formData.shop_name,
        });
        setUpiUriString(uri);

        try {
          const dataUrl = await generateUpiQrDataUrl(uri, { width: 320 });
          if (!isCancelled) {
            setQrPreviewUrl(dataUrl);
          }
        } catch (err) {
          console.error('Failed to generate UPI QR data URL:', err);
          if (!isCancelled) {
            setQrPreviewUrl('');
          }
        }
      } else {
        setUpiUriString('');
        setQrPreviewUrl('');
      }
    }

    updateQr();

    return () => {
      isCancelled = true;
    };
  }, [formData.upi_id, formData.upi_payee_name, formData.shop_name]);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData(prev => ({
        ...prev,
        shop_name: settings.shop_name ?? prev.shop_name,
        shop_address: settings.shop_address ?? prev.shop_address,
        shop_phone: settings.shop_phone ?? prev.shop_phone,
        shop_email: settings.shop_email ?? prev.shop_email,
        shop_gstin: settings.shop_gstin ?? prev.shop_gstin,
        receipt_footer: settings.receipt_footer ?? prev.receipt_footer,
        default_tax_rate: settings.default_tax_rate ?? prev.default_tax_rate,
        currency_symbol: settings.currency_symbol ?? prev.currency_symbol,
        thermal_paper_width: settings.thermal_paper_width ?? prev.thermal_paper_width,
        upi_id: settings.upi_id ?? prev.upi_id,
        upi_payee_name: settings.upi_payee_name ?? prev.upi_payee_name,
        bank_name: settings.bank_name ?? prev.bank_name,
        print_upi_qr: settings.print_upi_qr ?? prev.print_upi_qr,
        enable_print_size_adjustment: settings.enable_print_size_adjustment ?? prev.enable_print_size_adjustment,
      }));
    }
  }, [settings]);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setIsSaved(false);
  };

  const handleDownloadQr = () => {
    if (!qrPreviewUrl) return;
    const a = document.createElement('a');
    a.href = qrPreviewUrl;
    a.download = `UPI_QR_${formData.upi_id.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintQr = () => {
    if (!qrPreviewUrl) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>UPI Payment QR - ${formData.upi_payee_name || formData.shop_name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px; margin: 0; background: #fafafa; }
            .card { background: #fff; border: 3px solid #000; border-radius: 24px; padding: 32px 24px; max-width: 360px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            h2 { margin: 0 0 6px 0; font-size: 22px; font-weight: 900; }
            p { margin: 4px 0; color: #555; font-size: 13px; }
            .qr { width: 240px; height: 240px; margin: 16px auto; display: block; border: 1px solid #ddd; border-radius: 12px; }
            .vpa { font-family: monospace; font-size: 15px; font-weight: 800; background: #f0fdf4; color: #166534; padding: 8px 14px; border-radius: 8px; display: inline-block; margin-top: 10px; border: 1px solid #bbf7d0; }
            .apps { font-size: 12px; font-weight: bold; color: #1e40af; margin-top: 16px; line-height: 1.4; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <h2>${formData.upi_payee_name || formData.shop_name}</h2>
            <p>${formData.shop_address || ''}</p>
            <p style="font-size: 11px; font-weight: bold; color: #666; margin-top: 8px;">SCAN & PAY USING ANY UPI APP</p>
            <img class="qr" src="${qrPreviewUrl}" alt="UPI QR" />
            <div class="vpa">${formData.upi_id}</div>
            <p class="apps">Accepted on Google Pay • PhonePe • Paytm • BHIM • Cred • All UPI Apps</p>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
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
    { product_id: 1, product_name: 'Rice Ponni 5kg', product_name_tamil: 'பொன்னி அரிசி 5kg', sku: 'RICE005', unit: 'Bag', quantity: 1, price: 290, total: 290 },
    { product_id: 2, product_name: 'Sugar 1kg', product_name_tamil: 'சர்க்கரை 1kg', sku: 'SUGR001', unit: 'kg', quantity: 2, price: 50, total: 100 },
    { product_id: 3, product_name: 'Refined Cooking Oil 1L', product_name_tamil: 'சமையல் எண்ணெய் 1L', sku: 'OIL001', unit: 'L', quantity: 1, price: 150, total: 150 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shop & Receipt Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Store metadata, UPI payment QR details, default tax rates, and receipt footer customization
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
                placeholder="e.g. VILMANI TRADERS"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none font-bold"
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
                  placeholder="contact@vilmanitraders.com"
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

          {/* UPI & QR Payment Configuration Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>UPI & QR Payment Details</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                ⚡ Real-time Dynamic QR
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (VPA) *</label>
                <input
                  type="text"
                  required
                  value={formData.upi_id}
                  onChange={e => handleChange('upi_id', e.target.value)}
                  placeholder="e.g. vilmanitraders1386@iob"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-brand-500 outline-none font-bold text-blue-900 bg-blue-50/40"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Customer scans this to pay directly</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payee Name on UPI</label>
                <input
                  type="text"
                  value={formData.upi_payee_name}
                  onChange={e => handleChange('upi_payee_name', e.target.value)}
                  placeholder="e.g. VILMANI TRADERS"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Name shown on customer's payment app</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name (Optional)</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={e => handleChange('bank_name', e.target.value)}
                  placeholder="e.g. Indian Overseas Bank"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Print UPI QR on Thermal Bill</label>
                <select
                  value={formData.print_upi_qr}
                  onChange={e => handleChange('print_upi_qr', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none font-semibold text-slate-800"
                >
                  <option value="true">Yes — Print QR Code on Thermal Receipts</option>
                  <option value="false">No — Do not print QR on receipts</option>
                </select>
              </div>
            </div>

            {/* Live QR Code Preview & Actions Area */}
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>UPI Payment QR Preview</span>
                </span>
                {isValidUpi && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Valid UPI Format
                  </span>
                )}
              </div>

              {isValidUpi && qrPreviewUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                  {/* QR Image */}
                  <div className="p-2 bg-white rounded-xl border-2 border-slate-900/10 shadow-sm shrink-0">
                    <img
                      src={qrPreviewUrl}
                      alt="UPI Payment QR Code"
                      className="w-36 h-36 mx-auto rounded-lg object-contain"
                    />
                  </div>

                  {/* QR Meta & Action Buttons */}
                  <div className="flex-1 space-y-2.5 text-left w-full">
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {formData.upi_payee_name || formData.shop_name || 'Merchant'}
                      </p>
                      <p className="text-[11px] font-mono font-bold text-blue-700 truncate">
                        {formData.upi_id}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Scannable by Google Pay, PhonePe, Paytm, BHIM & all UPI apps.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[9.5px] text-slate-600 break-all select-all">
                      {upiUriString}
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Download QR code as PNG image"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PNG</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintQr}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Print Standee for Store Counter"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Print Store Standee</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold">Please enter a valid UPI ID to generate QR code.</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Example: <span className="font-mono font-bold">vilmanitraders1386@iob</span> or <span className="font-mono font-bold">9876543210@paytm</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Print / Billing Settings Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Print / Billing Settings</span>
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Receipt Footer Message (Multilingual / Multi-line)
                </label>
                <span className="text-[10px] text-slate-400">
                  Each new line prints on a separate line • Center-aligned
                </span>
              </div>
              <textarea
                rows={4}
                value={formData.receipt_footer}
                onChange={e => handleChange('receipt_footer', e.target.value)}
                placeholder={`நன்றி! மீண்டும் வருக.\nTHANK YOU! VISIT AGAIN.\nGoods once sold cannot be returned.`}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none font-medium leading-relaxed resize-y"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Supports English & Tamil text. Line breaks are preserved exactly on printed thermal receipts.
              </p>
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

            {/* Enable Print Bill Size Adjustment Setting */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Enable Print Bill Size Adjustment
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Allow users to increase or decrease the bill print size before printing.
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.enable_print_size_adjustment !== 'false'}
                  onClick={() =>
                    handleChange(
                      'enable_print_size_adjustment',
                      formData.enable_print_size_adjustment === 'false' ? 'true' : 'false'
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    formData.enable_print_size_adjustment !== 'false' ? 'bg-brand-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.enable_print_size_adjustment !== 'false' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    formData.enable_print_size_adjustment !== 'false'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {formData.enable_print_size_adjustment !== 'false' ? 'ON' : 'OFF'}
                </span>
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
              className="ml-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02] cursor-pointer"
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

          {/* Install Desktop & Mobile App Card */}
          <InstallAppButton variant="card" />
        </div>
      </div>
    </div>
  );
};
