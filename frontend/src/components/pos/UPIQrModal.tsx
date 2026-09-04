import React from 'react';
import { QrCode, CheckCircle2, Copy } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ShopSettings } from '../../types';

interface UPIQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  billNumber?: string;
  settings?: Partial<ShopSettings>;
  onPaid: () => void;
}

export const UPIQrModal: React.FC<UPIQrModalProps> = ({
  isOpen,
  onClose,
  amount,
  billNumber,
  settings,
  onPaid,
}) => {
  const [copied, setCopied] = React.useState(false);

  const vpa = (settings?.shop_name || 'shop')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') + '@okaxis';

  const upiPayload = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(
    settings?.shop_name || 'Store'
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(billNumber || 'Store Purchase')}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiPayload
  )}`;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(vpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="UPI Dynamic Payment QR"
      subtitle="Customer can scan with Google Pay, PhonePe, Paytm, or BHIM"
      maxWidth="sm"
    >
      <div className="text-center space-y-4">
        {/* Amount Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <p className="text-xs text-emerald-700 font-semibold uppercase">Total Payable</p>
          <p className="text-3xl font-extrabold text-emerald-900 font-mono mt-0.5">
            ₹{amount.toFixed(2)}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="inline-block p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
          <img
            src={qrImageUrl}
            alt="UPI QR Code"
            className="w-48 h-48 mx-auto rounded-lg"
            loading="eager"
          />
        </div>

        {/* VPA Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-600 bg-slate-50 py-2 px-3 rounded-lg border border-slate-200">
          <span className="font-mono font-semibold">{vpa}</span>
          <button
            onClick={handleCopyVpa}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            title="Copy UPI ID"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
        </div>

        {/* Confirmation Button */}
        <button
          onClick={() => {
            onPaid();
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirm Payment Received & Complete</span>
        </button>
      </div>
    </Modal>
  );
};
