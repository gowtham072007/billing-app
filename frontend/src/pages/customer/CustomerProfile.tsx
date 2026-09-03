import React, { useState, useEffect } from 'react';
import { User as UserIcon, Phone, Mail, MapPin, Receipt, Printer, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../api/client';
import { Bill, BillItem } from '../../types';
import { ThermalReceiptModal } from '../../components/thermal/ThermalReceiptModal';

export const CustomerProfile: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isSaved, setIsSaved] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);

  // Receipt Modal
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedItems, setSelectedItems] = useState<BillItem[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user && user.customer_id) {
      fetchCustomerHistory(user.customer_id);
    }
  }, [user]);

  const fetchCustomerHistory = async (customerId: number) => {
    try {
      const res = await api.get<{ bills: Bill[] }>(`/customers/${customerId}`);
      setBills(res.bills || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewBill = async (billId: number) => {
    try {
      const res = await api.get<{ bill: Bill; items: BillItem[] }>(`/bills/${billId}`);
      setSelectedBill(res.bill);
      setSelectedItems(res.items);
      setIsReceiptModalOpen(true);
    } catch (err) {
      alert('Could not fetch receipt details');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your contact information and review your store purchase invoices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-black text-lg">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
              <span className="text-xs text-brand-600 font-semibold font-mono">{user?.phone}</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Full Name</span>
              <span className="text-slate-800 font-bold text-sm">{user?.name}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Mobile Phone</span>
              <span className="text-slate-800 font-mono font-bold">{user?.phone}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Email Address</span>
              <span className="text-slate-800">{user?.email || 'Not provided'}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Saved Address</span>
              <span className="text-slate-800">{user?.address || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Previous Invoices / Bills Table (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Counter Invoices & Bills</span>
            </h3>
            <span className="text-xs text-slate-400">{bills.length} bills</span>
          </div>

          <div className="overflow-y-auto max-h-80 divide-y divide-slate-100 text-xs">
            {bills.length === 0 ? (
              <p className="text-center py-8 text-slate-400">No previous bills recorded yet.</p>
            ) : (
              bills.map(b => (
                <div key={b.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{b.bill_number}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(b.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })} • {b.payment_method?.toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      ₹{b.grand_total}
                    </span>
                    <button
                      onClick={() => handleViewBill(b.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-600 font-bold flex items-center gap-1 transition-colors"
                      title="View Thermal Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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
