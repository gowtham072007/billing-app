import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, Copy, Download, AlertCircle, Building2, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ShopSettings } from '../../types';
import { buildUpiPaymentUri, generateUpiQrDataUrl, isValidUpiId } from '../../utils/upiHelper';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [upiUri, setUpiUri] = useState<string>('');

  const upiId = (settings?.upi_id || '').trim();
  const payeeName = (settings?.upi_payee_name || settings?.shop_name || 'VILMANI TRADERS').trim();
  const bankName = settings?.bank_name || '';

  const isValid = isValidUpiId(upiId);

  useEffect(() => {
    let isCancelled = false;

    async function loadQr() {
      if (isValid && amount > 0) {
        const uri = buildUpiPaymentUri({
          upiId,
          payeeName,
          amount,
          billNumber,
          note: billNumber ? `Invoice ${billNumber}` : 'POS Bill Payment',
        });
        setUpiUri(uri);

        try {
          const url = await generateUpiQrDataUrl(uri, { width: 340 });
          if (!isCancelled) {
            setQrDataUrl(url);
          }
        } catch (err) {
          console.error('Failed to generate POS UPI QR Code:', err);
          if (!isCancelled) setQrDataUrl('');
        }
      } else {
        setUpiUri('');
        setQrDataUrl('');
      }
    }

    if (isOpen) {
      loadQr();
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, upiId, payeeName, amount, billNumber, isValid]);

  const handleCopyVpa = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `UPI_Bill_${billNumber || Date.now()}_₹${amount.toFixed(2)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan & Pay"
      subtitle="Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI App"
      maxWidth="sm"
    >
      <div className="text-center space-y-3.5">
        {/* Total Amount Card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 shadow-2xs">
          <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Amount</p>
          <p className="text-3xl font-black text-emerald-950 font-mono mt-0.5">
            ₹{amount.toFixed(2)}
          </p>
        </div>

        {isValid && qrDataUrl ? (
          <>
            {/* Dynamic QR Code Box */}
            <div className="inline-block p-3 bg-white rounded-2xl border-2 border-slate-900/15 shadow-md">
              <img
                src={qrDataUrl}
                alt="UPI Dynamic Payment QR Code"
                className="w-52 h-52 mx-auto rounded-lg object-contain"
                loading="eager"
              />
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] font-bold text-blue-700">
                <span>Google Pay • PhonePe • Paytm • BHIM</span>
              </div>
            </div>

            {/* Merchant / Payee Details */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <span>Amount:</span>
                </span>
                <span className="font-mono font-bold text-slate-900">₹{amount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Payee:</span>
                </span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{payeeName}</span>
              </div>

              {bankName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Bank:</span>
                  </span>
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]">{bankName}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80">
                <span className="text-slate-500 font-semibold">UPI ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-blue-800 text-[11px] truncate max-w-[180px]">
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyVpa}
                    className="px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-2 text-left">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Please enter a valid UPI ID in Settings to generate QR code.</span>
            </div>
            <p className="text-[11px] text-amber-700">
              Configure your merchant UPI VPA in <strong>Admin → Settings → UPI & QR Payment Details</strong>.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {isValid && qrDataUrl && (
            <button
              type="button"
              onClick={handleDownloadQr}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Payment QR</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onPaid();
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Payment Received & Complete</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
