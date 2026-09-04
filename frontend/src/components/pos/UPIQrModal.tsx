import React, { useState } from 'react';
import { QrCode, CheckCircle2, Copy, Check, Building2, Smartphone } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const vpa = (settings?.upi_id || 'vilmanitraders1386@iob').trim();
  const payeeName = (settings?.upi_payee_name || settings?.shop_name || 'VILMANI TRADERS').trim();
  const bankName = (settings?.bank_name || 'Indian Overseas Bank').trim();

  // Standard NPCI UPI URI with exact dynamic amount
  const upiPayload = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(billNumber ? `Bill ${billNumber}` : 'VILMANI TRADERS Bill')}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=4&data=${encodeURIComponent(
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
      title="Instant UPI Payment QR"
      subtitle="Scan with Google Pay, PhonePe, Paytm, or BHIM"
      maxWidth="sm"
    >
      <div className="text-center space-y-4">
        {/* Payable Amount Pill */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-3.5 shadow-md">
          <p className="text-[11px] uppercase tracking-wider text-emerald-100 font-bold">Total Amount to Pay</p>
          <p className="text-3xl sm:text-4xl font-black font-mono mt-0.5 tracking-tight">
            ₹{amount.toFixed(2)}
          </p>
          {billNumber && (
            <p className="text-[10px] text-emerald-100 font-mono mt-0.5">Ref: {billNumber}</p>
          )}
        </div>

        {/* Authentic Merchant Payment Stand Card */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xl relative overflow-hidden">
          {/* Bank Header */}
          <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-700 flex items-center justify-center text-white font-bold text-[10px]">
              IOB
            </div>
            <span className="text-xs font-black text-blue-900 tracking-wide uppercase">
              {bankName}
            </span>
          </div>

          {/* Merchant Name */}
          <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase mb-1">
            {payeeName}
          </h2>

          <div className="inline-block px-3 py-0.5 bg-blue-50 text-blue-800 rounded-full text-[11px] font-extrabold tracking-widest uppercase mb-3">
            SCAN & PAY
          </div>

          {/* QR Code with Tricolor Border Frame */}
          <div className="relative inline-block p-3 bg-white rounded-2xl border-2 border-orange-400 border-l-4 border-l-emerald-600 shadow-md my-1">
            <img
              src={qrImageUrl}
              alt={`${payeeName} UPI QR Code`}
              className="w-52 h-52 mx-auto rounded-lg"
              loading="eager"
            />
          </div>

          {/* UPI ID Display with Copy */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-800 bg-slate-100/90 py-1.5 px-3 rounded-xl border border-slate-200 font-mono">
            <span className="font-bold text-slate-500 text-[10px]">UPI ID:</span>
            <span className="font-bold text-slate-900">{vpa}</span>
            <button
              onClick={handleCopyVpa}
              className="ml-1 p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500 hover:text-slate-800"
              title="Copy UPI ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* BHIM UPI NPCI Footer */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-center gap-3">
            <div className="flex items-center gap-1 text-[10px] font-black text-slate-700 tracking-wider">
              <span className="text-blue-800">BHIM</span>
              <span className="text-orange-600 font-black">UPI</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              Unified Payments Interface
            </span>
          </div>
        </div>

        {/* Accepted Payment Apps Badges */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-600">
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">Google Pay</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">PhonePe</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">Paytm</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">BHIM</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">Any Bank App</span>
        </div>

        {/* Confirmation Button */}
        <button
          onClick={() => {
            onPaid();
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirm Payment Received & Complete Bill</span>
        </button>
      </div>
    </Modal>
  );
};
