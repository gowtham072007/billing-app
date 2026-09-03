import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  Receipt,
  Package,
  AlertTriangle,
  Users,
  ShoppingBag,
  ArrowUpRight,
  TrendingUp,
  Printer,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ThermalReceiptModal } from '../../components/thermal/ThermalReceiptModal';
import { DashboardStats, Bill, BillItem } from '../../types';
import { api } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';

const COLORS = ['#16a34a', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899'];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Receipt Modal state for instant reprint
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedItems, setSelectedItems] = useState<BillItem[]>([]);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<DashboardStats>('/dashboard/stats');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBill = async (billId: number) => {
    try {
      const res = await api.get<{ bill: Bill; items: BillItem[] }>(`/bills/${billId}`);
      setSelectedBill(res.bill);
      setSelectedItems(res.items);
      setIsReceiptOpen(true);
    } catch (err) {
      alert('Could not load bill details');
    }
  };

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const { summary, recent_bills, recent_orders, low_stock_products, charts } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Store performance, live sales analytics & inventory updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/billing')}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Open POS Billing</span>
          </button>
        </div>
      </div>

      {/* 6 Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="Today's Sales"
          value={`₹${summary.today_sales.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Today's Bills"
          value={summary.today_bills}
          icon={Receipt}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          onClick={() => navigate('/admin/bills')}
        />
        <StatCard
          title="Total Products"
          value={summary.total_products}
          icon={Package}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          onClick={() => navigate('/admin/products')}
        />
        <StatCard
          title="Low Stock"
          value={summary.low_stock_products}
          icon={AlertTriangle}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          onClick={() => navigate('/admin/stock')}
        />
        <StatCard
          title="Customers"
          value={summary.total_customers}
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          onClick={() => navigate('/admin/customers')}
        />
        <StatCard
          title="Pending Orders"
          value={summary.pending_orders}
          icon={ShoppingBag}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          onClick={() => navigate('/admin/orders')}
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Line Chart (Last 7 days) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Sales Revenue Trend</h3>
              <p className="text-xs text-slate-400">Daily store revenue performance</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Live Data
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.sales_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="display_date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sales by Payment Mode</h3>
            <p className="text-xs text-slate-400">Cash, UPI, and Card breakdown</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.payment_breakdown}
                  dataKey="total_amount"
                  nameKey="payment_method"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {charts.payment_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {charts.payment_breakdown.map((pm, i) => (
              <div key={pm.payment_method} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="font-bold text-slate-700 capitalize">{pm.payment_method}</span>
                </div>
                <p className="font-bold text-slate-900 font-mono">₹{pm.total_amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Grids: Recent Bills, Recent Customer Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Bills</h3>
              <p className="text-xs text-slate-400">Latest completed POS invoices</p>
            </div>
            <button
              onClick={() => navigate('/admin/bills')}
              className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-80">
            {recent_bills.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No bills recorded yet.</p>
            ) : (
              recent_bills.map(b => (
                <div key={b.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{b.bill_number}</span>
                      <span className="text-[10px] px-1.5 py-0.2 uppercase font-bold rounded bg-slate-100 text-slate-600">
                        {b.payment_method}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{b.customer_name || 'Walk-in'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">₹{b.grand_total}</span>
                    <button
                      onClick={() => handleViewBill(b.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 transition-colors"
                      title="Reprint Thermal Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Customer Incoming Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Orders</h3>
              <p className="text-xs text-slate-400">Incoming pickup & store requests</p>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-80">
            {recent_orders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent customer orders.</p>
            ) : (
              recent_orders.map(o => (
                <div
                  key={o.id}
                  onClick={() => navigate('/admin/orders')}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/60 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{o.order_number}</span>
                      <Badge
                        size="sm"
                        variant={
                          o.status === 'pending'
                            ? 'warning'
                            : o.status === 'ready'
                            ? 'info'
                            : o.status === 'completed'
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {o.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {o.customer_name} • {o.item_count} items
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-slate-900">₹{o.total_amount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Low Stock Alerts</span>
              </h3>
              <p className="text-xs text-slate-400">Items needing restock</p>
            </div>
            <button
              onClick={() => navigate('/admin/stock')}
              className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-0.5"
            >
              <span>Restock</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-80">
            {low_stock_products.length === 0 ? (
              <p className="text-xs text-emerald-600 py-6 text-center font-medium">
                ✓ All inventory items are adequately stocked.
              </p>
            ) : (
              low_stock_products.map(p => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.sku} • Min: {p.minimum_stock}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        p.stock <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.stock <= 0 ? 'Out of Stock' : `${p.stock} ${p.unit}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Thermal Receipt Preview Modal */}
      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={selectedBill}
        items={selectedItems}
        settings={settings}
      />
    </div>
  );
};
