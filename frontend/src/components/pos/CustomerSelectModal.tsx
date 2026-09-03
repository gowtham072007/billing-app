import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck, Phone, MapPin } from 'lucide-react';
import { Customer } from '../../types';
import { api } from '../../api/client';
import { Modal } from '../common/Modal';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer | null) => void;
  selectedCustomerId?: number | null;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  selectedCustomerId,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'new'>('search');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ customers: Customer[] }>('/customers');
      setCustomers(res.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !phone.trim()) {
      setFormError('Customer Name and Mobile Phone are required.');
      return;
    }

    try {
      const res = await api.post<{ customer: Customer; message: string }>('/customers', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
      });

      onSelectCustomer(res.customer);
      onClose();
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer profile.');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select or Add Customer"
      subtitle="Link billing invoice to a customer [F4]"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Walk-in Anonymous Option & Tabs */}
        <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 rounded-xl">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'search'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Search Existing
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'new'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Quick Add</span>
            </button>
          </div>

          <button
            onClick={() => {
              onSelectCustomer(null);
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Walk-in Anonymous
          </button>
        </div>

        {activeTab === 'search' ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by customer mobile number or name..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none shadow-sm"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No customers found. Click "+ Quick Add" to create.
                </div>
              ) : (
                filteredCustomers.map(c => {
                  const isSelected = selectedCustomerId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectCustomer(c);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50'
                          : 'border-slate-100 hover:border-brand-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{c.name}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {c.phone}
                          </span>
                          {c.address && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {c.address}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateCustomer} className="space-y-3">
            {formError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Arun Kumar"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="arun@gmail.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address / Street
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 12/4, Gandhi Street, Chennai"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
            >
              Save Customer & Apply to Bill
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
