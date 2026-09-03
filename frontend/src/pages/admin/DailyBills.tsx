import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Printer,
  FileText,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw,
  IndianRupee,
  Eye,
} from 'lucide-react';
import { Bill, BillItem } from '../../types';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { ThermalReceiptModal } from '../../components/thermal/ThermalReceiptModal';
import { useSettings } from '../../context/SettingsContext';

export const DailyBills: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { settings } = useSettings();

  // Receipt Modal
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedItems, setSelectedItems] = useState<BillItem[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const fetchBills = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ bills: Bill[]; summary: any }>('/bills', {
        date: selectedDate || undefined,
        payment_method: paymentMethod !== 'all' ? paymentMethod : undefined,
        q: searchTerm || undefined,
      });
      setBills(res.bills || []);
      setSummary(res.summary || null);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [selectedDate, paymentMethod]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBills();
  };

  const handleViewAndPrint = async (billId: number) => {
    try {
      const res = await api.get<{ bill: Bill; items: BillItem[] }>(`/bills/${billId}`);
      setSelectedBill(res.bill);
      setSelectedItems(res.items);
      setIsReceiptModalOpen(true);
    } catch (err) {
      alert('Could not load bill receipt details');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Bills & Sales</h1>
          <p className="text-xs text-slate-500 mt-1">
            Filter by date, review daily revenue breakdown, and reprint thermal invoices
          </p>
        </div>

        {/* Date Selector Shortcuts */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs outline-none focus:border-brand-500"
          />
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => {
              const y = new Date();
              y.setDate(y.getDate() - 1);
              setSelectedDate(y.toISOString().split('T')[0]);
            }}
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            Yesterday
          </button>
          <button
            onClick={() => setSelectedDate('')}
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            All Dates
          </button>
        </div>
      </div>

      {/* Daily Summary Metric Bar */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Invoices</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{summary.total_bills || 0}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-xs">
            <p className="text-[10px] font-bold uppercase text-emerald-700">Gross Sales</p>
            <p className="text-2xl font-black text-emerald-900 font-mono mt-0.5">
              ₹{Number(summary.total_sales || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Banknote className="w-3 h-3 text-emerald-600" />
              <span>Cash Total</span>
            </p>
            <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
              ₹{Number(summary.cash_sales || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-sky-600" />
              <span>UPI Total</span>
            </p>
            <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
              ₹{Number(summary.upi_sales || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-purple-600" />
              <span>Card Total</span>
            </p>
            <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
              ₹{Number(summary.card_sales || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[10px] font-bold uppercase text-slate-500">Discounts Given</p>
            <p className="text-xl font-extrabold text-rose-600 font-mono mt-0.5">
              ₹{Number(summary.total_discount || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Bill No or Customer Name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-500 outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash Only</option>
            <option value="upi">UPI Only</option>
            <option value="card">Card Only</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={fetchBills}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-4">Bill Number</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No bills found for the selected filter.
                  </td>
                </tr>
              ) : (
                bills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      {b.bill_number}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono">
                      <div>
                        {new Date(b.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(b.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{b.customer_name || 'Walk-in'}</p>
                      {b.customer_phone && (
                        <span className="text-[10px] text-slate-400 font-mono">{b.customer_phone}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="text-slate-700 font-medium line-clamp-1">{b.items_summary}</span>
                      <span className="text-[10px] text-slate-400">{b.item_count} items</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {b.payment_method}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                      ₹{b.grand_total}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewAndPrint(b.id)}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          title="View and Print 4-inch Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reprint (F9)</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Preview Modal */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        bill={selectedBill}
        items={selectedItems}
        settings={settings}
      />
    </div>
  );
};
