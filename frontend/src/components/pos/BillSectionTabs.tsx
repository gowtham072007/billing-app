import React from 'react';
import { Layers, ShoppingBag, User, CheckCircle2 } from 'lucide-react';
import { Customer } from '../../types';
import { PosBillItem } from './BillCartTable';

export interface BillSectionData {
  id: number; // 1 to 10
  items: PosBillItem[];
  selectedCustomer: Customer | null;
  rateMode: 'c_rate' | 'w_rate';
  discount: number;
  discountType: 'flat' | 'percentage';
  taxPercentage: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'other';
  paymentReference: string;
}

interface BillSectionTabsProps {
  sections: BillSectionData[];
  activeSectionId: number;
  onSelectSection: (id: number) => void;
  onClearSection?: (id: number) => void;
}

export const BillSectionTabs: React.FC<BillSectionTabsProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm">
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
            <span>10 Section Billing</span>
            <span className="text-[10px] font-semibold text-slate-400 font-mono hidden sm:inline">
              (Alt + 1..0)
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
          <span className="hidden md:inline">
            Active Sections:{' '}
            <strong className="text-slate-800">
              {sections.filter(s => s.items.length > 0).length} / 10
            </strong>
          </span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
            Switch: Alt+1..9, Alt+0
          </span>
        </div>
      </div>

      {/* 10 Section Tabs Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {sections.map(sec => {
          const isActive = sec.id === activeSectionId;
          const itemCount = sec.items.reduce((sum, item) => sum + item.quantity, 0);
          const hasItems = sec.items.length > 0;
          const sectionTotal = sec.items.reduce((sum, item) => sum + item.total, 0);
          const shortcutKey = sec.id === 10 ? '0' : sec.id.toString();

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={`relative group flex flex-col items-start justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/15 ring-2 ring-brand-500/50'
                  : hasItems
                  ? 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-300 text-slate-800'
                  : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80 text-slate-600'
              }`}
              title={`Section ${sec.id} (Alt+${shortcutKey})${
                sec.selectedCustomer ? ` • Customer: ${sec.selectedCustomer.name}` : ''
              }${hasItems ? ` • ${itemCount} items (₹${Math.round(sectionTotal)})` : ' • Empty'}`}
            >
              {/* Top Row: Section Number & Shortcut Badge */}
              <div className="w-full flex items-center justify-between gap-1">
                <span className="text-[11px] font-black tracking-tight flex items-center gap-1">
                  <span>S{sec.id}</span>
                  {hasItems && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  )}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                    isActive
                      ? 'bg-slate-800 text-brand-300'
                      : 'bg-white/80 text-slate-500 border border-slate-200/60'
                  }`}
                >
                  Alt+{shortcutKey}
                </span>
              </div>

              {/* Middle / Bottom Content: Items & Price or Empty State */}
              <div className="w-full mt-1.5 flex items-center justify-between">
                {hasItems ? (
                  <div className="min-w-0">
                    <div
                      className={`text-[11px] font-extrabold truncate ${
                        isActive ? 'text-emerald-300' : 'text-slate-900'
                      }`}
                    >
                      ₹{Math.round(sectionTotal)}
                    </div>
                    <div
                      className={`text-[9px] font-semibold truncate ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                ) : (
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    Empty
                  </span>
                )}

                {/* Quick indicator icon */}
                {isActive ? (
                  <CheckCircle2 className="w-3 h-3 text-brand-400 shrink-0" />
                ) : hasItems ? (
                  <ShoppingBag className="w-3 h-3 text-amber-600 shrink-0" />
                ) : null}
              </div>

              {/* Customer indicator if assigned */}
              {sec.selectedCustomer && (
                <div
                  className={`mt-1 text-[9px] font-medium truncate w-full flex items-center gap-0.5 ${
                    isActive ? 'text-brand-300' : 'text-brand-700'
                  }`}
                >
                  <User className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{sec.selectedCustomer.name}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
