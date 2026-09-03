import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Receipt,
  Eye,
  Edit2,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Customer } from '../../types';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Customer Detail View Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerBills, setCustomerBills] = useState<any[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);

  // Add / Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ customers: Customer[] }>('/customers', {
        q: searchTerm || undefined,
      });
      setCustomers(res.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setIsEditing(true);
    setCurrentId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleViewCustomer = async (id: number) => {
    try {
      const res = await api.get<{ customer: Customer; orders: any[]; bills: any[] }>(`/customers/${id}`);
      setSelectedCustomer(res.customer);
      setCustomerOrders(res.orders || []);
      setCustomerBills(res.bills || []);
      setIsViewModalOpen(true);
    } catch (err) {
      alert('Could not fetch customer history.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !phone.trim()) {
      setFormError('Customer Name and Mobile Phone are required.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
      };

      if (isEditing && currentId) {
        await api.put(`/customers/${currentId}`, payload);
      } else {
        await api.post('/customers', payload);
      }

      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer.');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await api.patch(`/customers/${id}/status`, { status: newStatus });
      fetchCustomers();
    } catch (err: any) {
      alert('Failed to update status');
    }
  };

  const filteredCustomers = customers.filter(c =>
    !searchTerm ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered customer database, purchase records, and order history
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        <button
          onClick={fetchCustomers}
          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile & Email</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Total Spent (₹)</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching search query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                      <span className="text-[10px] text-slate-400">ID: #{c.id}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 font-semibold">{c.phone}</div>
                      {c.email && <div className="text-[10px] text-slate-500">{c.email}</div>}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {c.address || '—'}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      {c.total_orders || 0}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                      ₹{Number(c.total_spent || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge variant={c.account_status === 'active' ? 'success' : 'danger'} size="sm">
                        {c.account_status || 'active'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewCustomer(c.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View Purchase History & Orders"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c.id, c.account_status || 'active')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={c.account_status === 'active' ? 'Disable Account' : 'Enable Account'}
                        >
                          {c.account_status === 'active' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
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

      {/* Customer Profile & Purchase History Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Customer Profile: ${selectedCustomer?.name}`}
        subtitle={`Contact: ${selectedCustomer?.phone} • Total Spent: ₹${selectedCustomer?.total_spent || 0}`}
        maxWidth="2xl"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            {/* Info Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Mobile</span>
                <span className="font-mono font-bold text-slate-800">{selectedCustomer.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Email</span>
                <span className="text-slate-800 truncate block">{selectedCustomer.email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Total Orders</span>
                <span className="font-bold text-slate-800">{customerOrders.length}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Total Bills</span>
                <span className="font-bold text-slate-800">{customerBills.length}</span>
              </div>
            </div>

            {/* Orders Tab Header */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-brand-600" />
                <span>Recent Online Orders</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-2 px-3">Order #</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          No online orders placed yet.
                        </td>
                      </tr>
                    ) : (
                      customerOrders.map(o => (
                        <tr key={o.id}>
                          <td className="py-2 px-3 font-mono font-bold">{o.order_number}</td>
                          <td className="py-2 px-3 text-slate-500 font-mono">
                            {new Date(o.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {o.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{o.total_amount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bills Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>POS Invoices & Bills</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-2 px-3">Bill #</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3 text-center">Payment</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerBills.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          No bills generated yet.
                        </td>
                      </tr>
                    ) : (
                      customerBills.map(b => (
                        <tr key={b.id}>
                          <td className="py-2 px-3 font-mono font-bold">{b.bill_number}</td>
                          <td className="py-2 px-3 text-slate-500 font-mono">
                            {new Date(b.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-center uppercase font-semibold text-[10px]">
                            {b.payment_method}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                            ₹{b.grand_total}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={isEditing ? 'Edit Customer' : 'Add New Customer'}
        subtitle="Customer contact & address information"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Arun Kumar"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. arun@gmail.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Street Address / City</label>
            <textarea
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 12/4, Gandhi Street, Chennai"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20"
            >
              {isEditing ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
