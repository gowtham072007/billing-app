import React, { useState } from 'react';
import { Printer, Copy, Check, Usb, Cpu, HelpCircle, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { Bill, BillItem, ShopSettings } from '../../types';
import { ThermalReceipt } from './ThermalReceipt';
import { Modal } from '../common/Modal';
import {
  connectWebUsbPrinter,
  connectWebSerialPrinter,
  printDirectRaw,
  getSavedPrinterName,
  savePrinterName,
} from '../../utils/thermalPrinter';

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
  const [copied, setCopied] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string>(() => getSavedPrinterName());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState(connectedDeviceName);
  const [isDirectPrinting, setIsDirectPrinting] = useState(false);
  const [showDirectGuide, setShowDirectGuide] = useState(false);

  if (!bill) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleSavePrinterName = () => {
    if (editNameInput.trim()) {
      savePrinterName(editNameInput.trim());
      setConnectedDeviceName(editNameInput.trim());
    }
    setIsEditingName(false);
  };

  const handleConnectUsb = async () => {
    const res = await connectWebUsbPrinter();
    if (res.success && res.name) {
      setConnectedDeviceName(res.name);
      setEditNameInput(res.name);
      alert(`✅ Connected to USB Thermal Printer: ${res.name}`);
    } else if (res.error) {
      alert(`USB Connection: ${res.error}`);
    }
  };

  const handleConnectSerial = async () => {
    const res = await connectWebSerialPrinter();
    if (res.success && res.name) {
      setConnectedDeviceName(res.name);
      setEditNameInput(res.name);
      alert(`✅ Connected to Serial/COM Thermal Printer!`);
    } else if (res.error) {
      alert(`Serial Connection: ${res.error}`);
    }
  };

  const handleDirectEscPosPrint = async () => {
    setIsDirectPrinting(true);
    try {
      const printed = await printDirectRaw(bill, items, settings);
      if (printed) {
        alert('✅ Receipt sent directly to thermal printer!');
      } else {
        // Fallback to browser print if no USB/Serial device claimed yet
        window.print();
      }
    } catch (err: any) {
      alert('Error printing directly: ' + err.message);
      window.print();
    } finally {
      setIsDirectPrinting(false);
    }
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
      `${(i.product_name || 'Item').slice(0, 14).padEnd(14)} ${String(i.quantity).padStart(3)} ${Number(
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
      subtitle={`Bill #${bill.bill_number} • ${connectedDeviceName}`}
      maxWidth="md"
    >
      <div className="space-y-3.5">
        {/* Direct Thermal Machine Banner & Connection */}
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-sm print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">Device Name:</span>
                  {isEditingName ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editNameInput}
                        onChange={e => setEditNameInput(e.target.value)}
                        className="px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-brand-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSavePrinterName}
                        className="px-2 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold font-mono truncate max-w-[180px] sm:max-w-[260px]">
                        {connectedDeviceName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditNameInput(connectedDeviceName);
                          setIsEditingName(true);
                        }}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Edit Printer Name"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ready to print to your TVS / POS Thermal Billing Machine.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleConnectUsb}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Connect USB Thermal Printer"
              >
                <Usb className="w-3.5 h-3.5 text-brand-400" />
                <span>USB Connect</span>
              </button>
              <button
                type="button"
                onClick={handleConnectSerial}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Connect Serial / COM Thermal Printer"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>COM Connect</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Direct Print Configuration Tip */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 print:hidden">
          <button
            type="button"
            onClick={() => setShowDirectGuide(!showDirectGuide)}
            className="w-full p-2.5 flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
              <span>How to stop browser "Save as PDF" and print directly to {connectedDeviceName}?</span>
            </span>
            {showDirectGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showDirectGuide && (
            <div className="p-3 text-[11px] text-slate-600 space-y-2 border-t border-slate-200 bg-white">
              <p>
                <strong>Step 1 (One-Time Setup):</strong> When you click <em>Print Bill ({connectedDeviceName})</em>, in the browser print window:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-[10.5px] text-slate-700">
                <li>Change <strong>Destination</strong>: Select <strong>{connectedDeviceName}</strong> instead of <em>"Save as PDF"</em>.</li>
                <li>Set <strong>Paper size</strong>: <em>80mm / 4-inch Roll</em>.</li>
                <li>Set <strong>Margins</strong>: <em>None</em>.</li>
                <li>Uncheck <strong>Headers and Footers</strong>.</li>
              </ul>
              <p className="text-emerald-700 bg-emerald-50 p-2 rounded-lg font-medium">
                💡 <strong>Instant Silent Printing (No Dialog):</strong> Run Chrome in Kiosk Mode with <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-mono">--kiosk-printing</code> to print instantly with zero popups!
              </p>
            </div>
          )}
        </div>

        {/* Receipt Visual Paper Mockup */}
        <div className="bg-slate-100 p-3.5 rounded-xl flex justify-center overflow-x-auto shadow-inner max-h-72 print:bg-transparent print:p-0 print:m-0 print:max-h-none print:shadow-none print:overflow-visible">
          <div className="bg-white p-3 shadow-md rounded-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0">
            <ThermalReceipt bill={bill} items={items} settings={settings} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100 print:hidden">
          <button
            onClick={handleCopyText}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Receipt Text!' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleBrowserPrint}
              disabled={isDirectPrinting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>
                {isDirectPrinting
                  ? 'Sending to Printer...'
                  : `Print Bill (${connectedDeviceName.slice(0, 16)}) →`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
