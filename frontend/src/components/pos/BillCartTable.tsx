import React from 'react';
import {
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  HelpCircle,
  RotateCcw,
  Printer,
  CheckCircle,
  Percent,
  Receipt,
  QrCode,
  Tag,
} from 'lucide-react';
import { Customer, BillItem, ShopSettings, Product } from '../../types';

export interface PosBillItem {
  product_id: number;
  product_name: string;
  product_name_tamil?: string | null;
  sku: string;
  unit: string;
  quantity: number;
  price: number;
  rate_type?: 'c_rate' | 'w_rate';
  c_rate?: number;
  w_rate?: number;
  total: number;
  available_stock: number;
}

interface BillCartTableProps {
  items: PosBillItem[];
  customer: Customer | null;
  rateMode: 'c_rate' | 'w_rate';
  discount: number;
  discountType: 'flat' | 'percentage';
  taxPercentage: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'other';
  paymentReference: string;
  isSubmitting: boolean;
  settings?: Partial<ShopSettings>;
  onRateModeChange: (mode: 'c_rate' | 'w_rate') => void;
  onUpdateQuantity: (productId: number, qty: number) => void;
  onToggleItemRate: (productId: number) => void;
  onRemoveItem: (productId: number) => void;
  onSelectCustomerClick: () => void;
  onClearBill: () => void;
  onOpenShortcuts: () => void;
  onDiscountChange: (val: number) => void;
  onDiscountTypeChange: (type: 'flat' | 'percentage') => void;
  onTaxPercentageChange: (val: number) => void;
  onPaymentMethodChange: (method: 'cash' | 'upi' | 'card' | 'other') => void;
  onPaymentReferenceChange: (ref: string) => void;
  onCompleteBill: (printImmediate?: boolean) => void;
  onOpenUpiQr: () => void;
}

export const BillCartTable: React.FC<BillCartTableProps> = ({
  items,
  customer,
  rateMode,
  discount,
  discountType,
  taxPercentage,
  paymentMethod,
  paymentReference,
  isSubmitting,
  settings,
  onRateModeChange,
  onUpdateQuantity,
  onToggleItemRate,
  onRemoveItem,
  onSelectCustomerClick,
  onClearBill,
  onOpenShortcuts,
  onDiscountChange,
  onDiscountTypeChange,
  onTaxPercentageChange,
  onPaymentMethodChange,
  onPaymentReferenceChange,
  onCompleteBill,
  onOpenUpiQr,
}) => {
  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * (discount || 0)) / 100;
  } else {
    discountAmount = discount || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (taxPercentage || 0)) / 100;
  const grandTotal = Math.round(taxableAmount + taxAmount);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Top Header: Customer Info, Rate Mode Switcher & Action Buttons */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Customer Badge / Trigger */}
          <button
            onClick={onSelectCustomerClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-brand-500 hover:bg-brand-50/30 text-xs font-semibold text-slate-800 transition-all truncate max-w-[200px]"
            title="Change Customer (F4)"
          >
            <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate">
              {customer ? `${customer.name}` : 'Walk-in Customer'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">[F4]</span>
          </button>

          {/* Action Controls: Shortcuts & Clear */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenShortcuts}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Keyboard Shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onClearBill}
              disabled={items.length === 0}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear Current Bill (F1)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear (F1)</span>
            </button>
          </div>
        </div>

        {/* Global Rate Mode Switcher: C-Rate (Retail) vs W-Rate (Wholesale) */}
        <div className="flex items-center justify-between bg-white p-1 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 pl-2 flex items-center gap-1">
            <Tag className="w-3 h-3 text-brand-600" />
            <span>Pricing Rate:</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRateModeChange('c_rate')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                rateMode === 'c_rate'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              C-Rate (Retail)
            </button>
            <button
              type="button"
              onClick={() => onRateModeChange('w_rate')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                rateMode === 'w_rate'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              W-Rate (Wholesale)
            </button>
          </div>
        </div>
      </div>

      {/* Items Table List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Receipt className="w-12 h-12 text-slate-200 mb-2" />
            <p className="text-sm font-bold text-slate-600">Bill Cart is Empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Scan barcode, enter SKU, or click items on the left catalog to add.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                <th className="pb-2 pl-2">Item & Rate</th>
                <th className="pb-2 text-center w-24">Qty</th>
                <th className="pb-2 text-right w-16">Price</th>
                <th className="pb-2 text-right pr-2 w-20">Total</th>
                <th className="pb-2 w-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {items.map(item => (
                <tr key={item.product_id} className="hover:bg-slate-50/60 group">
                  <td className="py-2.5 pl-2">
                    <p className="font-bold text-slate-900 leading-tight line-clamp-1">
                      {item.product_name}
                    </p>
                    {item.product_name_tamil && (
                      <p className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded mt-0.5 inline-block leading-none">
                        {item.product_name_tamil}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.sku} • {item.unit}
                      </span>
                      {/* Rate Switch Button per Item */}
                      <button
                        type="button"
                        onClick={() => onToggleItemRate(item.product_id)}
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded transition-colors ${
                          item.rate_type === 'w_rate'
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                        title="Click to toggle between C-Rate (Retail) and W-Rate (Wholesale)"
                      >
                        {item.rate_type === 'w_rate' ? 'W-Rate' : 'C-Rate'}
                      </button>
                    </div>
                  </td>

                  {/* Quantity Stepper */}
                  <td className="py-2.5">
                    <div className="flex items-center justify-center gap-1 bg-slate-100 rounded-lg p-0.5 max-w-[90px] mx-auto border border-slate-200/80">
                      <button
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                        className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.available_stock}
                        value={item.quantity}
                        onChange={e =>
                          onUpdateQuantity(item.product_id, parseInt(e.target.value, 10) || 1)
                        }
                        className="w-8 text-center text-xs font-bold font-mono bg-transparent outline-none p-0"
                      />
                      <button
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                        className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  <td className="py-2.5 text-right font-mono font-bold text-slate-700">
                    ₹{item.price}
                  </td>

                  <td className="py-2.5 text-right pr-2 font-mono font-black text-slate-900">
                    ₹{item.total}
                  </td>

                  <td className="py-2.5 pr-1 text-center">
                    <button
                      onClick={() => onRemoveItem(item.product_id)}
                      className="p-1 text-slate-300 hover:text-rose-600 transition-colors rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bill Calculations & Payment Options Panel */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-4 space-y-3 shrink-0">
        {/* Discount & Tax Inline Controls */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Discount Field */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold text-[11px]">Disc:</span>
            <input
              type="number"
              min="0"
              value={discount || ''}
              onChange={e => onDiscountChange(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full font-mono text-xs font-bold text-slate-800 outline-none bg-transparent"
            />
            <button
              onClick={() => onDiscountTypeChange(discountType === 'flat' ? 'percentage' : 'flat')}
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 uppercase"
            >
              {discountType === 'flat' ? '₹' : '%'}
            </button>
          </div>

          {/* Tax % Selector */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold text-[11px]">Tax:</span>
            <select
              value={taxPercentage}
              onChange={e => onTaxPercentageChange(Number(e.target.value))}
              className="w-full font-mono text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
            >
              <option value="0">0% (None)</option>
              <option value="5">5% (GST)</option>
              <option value="12">12% (GST)</option>
              <option value="18">18% (GST)</option>
            </select>
          </div>
        </div>

        {/* Subtotal & Grand Total Breakdown */}
        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items):</span>
            <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount applied:</span>
              <span className="font-mono">- ₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          {taxAmount > 0 && (
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Tax ({taxPercentage}%):</span>
              <span className="font-mono">+ ₹{taxAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-900">
            <span className="text-sm font-extrabold uppercase tracking-wide">Grand Total:</span>
            <span className="text-2xl font-black font-mono text-emerald-700">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Payment Mode
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'upi', label: 'UPI', icon: Smartphone },
              { id: 'card', label: 'Card', icon: CreditCard },
              { id: 'other', label: 'Other', icon: CheckCircle },
            ].map(pm => {
              const Icon = pm.icon;
              const isSelected = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => onPaymentMethodChange(pm.id as any)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* UPI Quick QR Trigger if UPI selected */}
          {paymentMethod === 'upi' && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-xs">
              <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                Scan to pay ₹{grandTotal}
              </span>
              <button
                type="button"
                onClick={onOpenUpiQr}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-sm transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Show QR Code</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={items.length === 0 || isSubmitting}
            onClick={() => onCompleteBill(false)}
            className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            title="Complete Sale without opening Print Preview [F8]"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Complete (F8)</span>
          </button>

          <button
            type="button"
            disabled={items.length === 0 || isSubmitting}
            onClick={() => onCompleteBill(true)}
            className="py-3 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 transition-all active:scale-[0.98] cursor-pointer"
            title="Complete Sale & Open 4-inch Thermal Receipt Print [F9]"
          >
            <Printer className="w-4 h-4" />
            <span>Complete & Print (F9)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
