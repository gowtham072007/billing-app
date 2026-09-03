import React from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'F1', label: 'New / Clear Bill', desc: 'Resets the current POS cart to a fresh bill' },
    { key: 'F2', label: 'Focus Barcode / SKU Scanner', desc: 'Instantly focuses the scanner input field' },
    { key: 'F4', label: 'Select / Add Customer', desc: 'Opens the customer lookup & quick-create modal' },
    { key: 'F8', label: 'Complete Bill', desc: 'Saves the bill and decrements stock' },
    { key: 'F9', label: 'Complete & Print Bill', desc: 'Saves bill and immediately opens the 4-inch thermal print dialog' },
    { key: 'Esc', label: 'Close / Cancel', desc: 'Closes any active modal or drops focus' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="POS Keyboard Shortcuts"
      subtitle="Speed up billing at counter checkout"
      maxWidth="md"
    >
      <div className="space-y-3">
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
          <Keyboard className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Press these keys directly from anywhere on the Billing screen for lightning-fast checkout.</span>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {shortcuts.map(s => (
            <div key={s.key} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
              <div>
                <p className="text-xs font-bold text-slate-800">{s.label}</p>
                <p className="text-[11px] text-slate-500">{s.desc}</p>
              </div>
              <kbd className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg shadow-sm border border-slate-700">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </Modal>
  );
};
