import React from 'react';
import { Printer, Copy, Check, X } from 'lucide-react';
import { Bill, BillItem, ShopSettings } from '../../types';
import { ThermalReceipt } from './ThermalReceipt';
import { Modal } from '../common/Modal';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  items: BillItem[];
  settings?: Partial<ShopSettings>;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
  items,
  settings,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textReceipt = `
================================
${settings?.shop_name || 'Vilmani Store'}
${settings?.shop_address || ''}
Ph: ${settings?.shop_phone || ''}
================================
TAX INVOICE
Bill No: ${bill.bill_number}
Date: ${new Date(bill.created_at).toLocaleDateString('en-IN')}
Customer: ${bill.customer_name || 'Walk-in'}
--------------------------------
ITEM          QTY   RATE   TOTAL
--------------------------------
${items
  .map(
    i =>
      `${i.product_name.slice(0, 14).padEnd(14)} ${String(i.quantity).padStart(3)} ${Number(
        i.price
      )
        .toFixed(0)
        .padStart(6)} ${Number(i.total).toFixed(0).padStart(7)}`
  )
  .join('\n')}
--------------------------------
Subtotal:                    ₹${Number(bill.subtotal || 0).toFixed(2)}
Discount:                    ₹${Number(bill.discount || 0).toFixed(2)}
Tax:                         ₹${Number(bill.tax || 0).toFixed(2)}
--------------------------------
GRAND TOTAL:                 ₹${Number(bill.grand_total || 0).toFixed(2)}
Payment: ${bill.payment_method.toUpperCase()}
================================
${settings?.receipt_footer || 'THANK YOU! VISIT AGAIN.'}
================================
`;
    navigator.clipboard.writeText(textReceipt.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thermal Receipt Preview"
      subtitle={`Bill #${bill.bill_number} • 4-inch Thermal Roll (100mm)`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Receipt Visual Paper Mockup */}
        <div className="bg-slate-100 p-4 rounded-xl flex justify-center overflow-x-auto shadow-inner">
          <div className="bg-white p-3 shadow-md rounded-sm border border-slate-200">
            <ThermalReceipt bill={bill} items={items} settings={settings} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={handleCopyText}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Receipt Text!' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Bill (F9)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
