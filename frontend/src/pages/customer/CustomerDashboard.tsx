import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Receipt,
  ShoppingCart,
  Clock,
  ArrowRight,
  TrendingUp,
  Package,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCw,
  Eye,
  Store,
  Printer,
  ChevronRight,
  User,
  Plus,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { Bill, BillItem, Order, Product } from '../../types';
import { ThermalReceiptModal } from '../../components/thermal/ThermalReceiptModal';
import { Badge } from '../../components/common/Badge';
import { getAutoProductImage } from '../../utils/productImageHelper';
import { getTamilUnit, formatQtyWithUnit } from '../../utils/qtyHelper';

interface DashboardData {
  customer: {
    id: number;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    created_at: string;
    account_status?: string;
  };
  stats: {
    total_orders: number;
    active_orders: number;
    completed_orders: number;
    total_bills: number;
    total_spent: number;
  };
  recent_orders: Array<{
    id: number;
    order_number: string;
    total_amount: number;
    status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    created_at: string;
    item_count: number;
    items_summary?: string;
    notes?: string;
  }>;
  recent_bills: Array<{
    id: number;
    bill_number: string;
    grand_total: number;
    subtotal: number;
    discount: number;
    payment_method: string;
    created_at: string;
    item_count: number;
    items_summary?: string;
  }>;
  popular_products: Product[];
}

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { totalItems, addToCart } = useCart();
  const { settings } = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Thermal Receipt Modal
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedBillItems, setSelectedBillItems] = useState<BillItem[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [addedItemToast, setAddedItemToast] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<DashboardData>('/customers/me/dashboard');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load customer dashboard data:', err);
      setError(err.message || 'Could not load your dashboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleViewBill = async (billId: number) => {
    try {
      const res = await api.get<{ bill: Bill; items: BillItem[] }>(`/bills/${billId}`);
      setSelectedBill(res.bill);
      setSelectedBillItems(res.items);
      setIsReceiptModalOpen(true);
    } catch (err) {
      alert('Could not fetch receipt details. Please try again.');
    }
  };

  const handleQuickAdd = (product: Product) => {
    const success = addToCart(product, 1);
    if (success) {
      setAddedItemToast(`Added "${product.name_tamil || product.name}" to your cart!`);
      setTimeout(() => setAddedItemToast(null), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Order Placed (Pending)</Badge>;
      case 'accepted':
        return <Badge variant="info">Accepted</Badge>;
      case 'preparing':
        return <Badge variant="purple">Preparing</Badge>;
      case 'ready':
        return <Badge variant="success">Ready for Pickup</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Find latest active order if any
  const latestActiveOrder = data?.recent_orders.find(
    o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {addedItemToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{addedItemToast}</span>
          <Link
            to="/customer/cart"
            className="ml-2 underline text-emerald-400 hover:text-emerald-300"
          >
            View Cart
          </Link>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-brand-900/40">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Portal & Order Hub</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Welcome, {data?.customer?.name || user?.name || 'Customer'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Track your live grocery orders, browse freshly updated inventory, and manage your customer profile.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Phone className="w-3.5 h-3.5 text-brand-400" />
                <span>{data?.customer?.phone || user?.phone}</span>
              </span>
              {data?.customer?.address && (
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 max-w-xs truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate">{data.customer.address}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-2.5 shrink-0">
            <Link
              to="/customer/products"
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 transition-all active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Shop Products</span>
            </Link>

            <Link
              to="/customer/profile"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-white/15 backdrop-blur-sm transition-all"
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Live Order Tracker Banner (If an order is in-progress) */}
      {latestActiveOrder && (
        <div className="bg-gradient-to-r from-emerald-50 via-white to-brand-50 border border-emerald-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Active Live Order: #{latestActiveOrder.order_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Placed on {new Date(latestActiveOrder.created_at).toLocaleDateString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getStatusBadge(latestActiveOrder.status)}
              <Link
                to="/customer/orders"
                className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1"
              >
                <span>Track Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Simple Timeline */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[11px] font-semibold">
            <div className={`p-2 rounded-xl border ${latestActiveOrder.status !== 'cancelled' ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
              1. Placed
            </div>
            <div className={`p-2 rounded-xl border ${['accepted', 'preparing', 'ready', 'completed'].includes(latestActiveOrder.status) ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
              2. Accepted
            </div>
            <div className={`p-2 rounded-xl border ${['preparing', 'ready', 'completed'].includes(latestActiveOrder.status) ? 'bg-brand-100 text-brand-900 border-brand-300 font-bold' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
              3. Preparing
            </div>
            <div className={`p-2 rounded-xl border ${['ready', 'completed'].includes(latestActiveOrder.status) ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
              4. Ready
            </div>
          </div>
        </div>
      )}

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {data?.stats?.total_orders || 0}
            </span>
            <Link to="/customer/orders" className="text-[11px] text-brand-600 font-semibold block mt-1 hover:underline">
              View History →
            </Link>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 font-mono">
              {data?.stats?.active_orders || 0}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">In progress</span>
          </div>
        </div>

        {/* Counter Bills / Invoices */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Store Invoices</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {data?.stats?.total_bills || 0}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">POS counter receipts</span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 font-mono">
              ₹{Number(data?.stats?.total_spent || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Lifetime spending</span>
          </div>
        </div>

        {/* Cart Items */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shopping Cart</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600 font-mono">
              {totalItems}
            </span>
            <Link to="/customer/cart" className="text-[11px] text-rose-600 font-semibold block mt-1 hover:underline">
              Go to Cart →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Counter Bills / Invoices (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>Store Purchase Invoices</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thermal receipts generated for your counter and offline purchases
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
              {data?.recent_bills?.length || 0} recent
            </span>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Loading your invoices...</span>
              </div>
            ) : !data?.recent_bills || data.recent_bills.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No store counter invoices found for this phone number yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                    <th className="pb-2.5">Bill #</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Payment</th>
                    <th className="pb-2.5 text-right">Amount</th>
                    <th className="pb-2.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {data.recent_bills.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-900">
                        {b.bill_number}
                        {b.items_summary && (
                          <p className="text-[10px] text-slate-400 font-sans truncate max-w-xs font-normal">
                            {b.items_summary}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-slate-500 font-mono">
                        {new Date(b.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3">
                        <span className="uppercase font-semibold text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {b.payment_method}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-black text-slate-900 text-sm">
                        ₹{b.grand_total}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewBill(b.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="View 4-inch Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Recent Online Orders (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-600" />
                <span>Recent Online Orders</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Orders placed via customer portal
              </p>
            </div>
            <Link
              to="/customer/orders"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs">Loading orders...</div>
            ) : !data?.recent_orders || data.recent_orders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No orders placed online yet.</p>
                <Link
                  to="/customer/products"
                  className="inline-block px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              data.recent_orders.map(order => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900">
                        #{order.order_number}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {order.items_summary && (
                    <p className="text-[11px] text-slate-600 line-clamp-1">
                      {order.items_summary}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-xs">
                    <span className="text-slate-500 font-mono">
                      {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                    </span>
                    <span className="font-mono font-black text-slate-900">
                      ₹{order.total_amount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Frequently Purchased / Popular Products Shelf */}
      {data?.popular_products && data.popular_products.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Quick Re-Order & Featured Items</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Popular items in store - add to your cart in 1 click
              </p>
            </div>
            <Link
              to="/customer/products"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Explore Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {data.popular_products.map(prod => (
              <div
                key={prod.id}
                className="p-3 rounded-2xl border border-slate-100 hover:border-brand-200 hover:shadow-md transition-all flex flex-col justify-between bg-slate-50/40 hover:bg-white group"
              >
                <div className="space-y-2">
                  <div className="aspect-square rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center p-1">
                    <img
                      src={prod.image || getAutoProductImage(prod.name, prod.name_tamil, prod.category)}
                      alt={prod.name}
                      className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                      onError={e => {
                        (e.target as HTMLImageElement).src = getAutoProductImage(
                          prod.name,
                          prod.name_tamil,
                          prod.category
                        );
                      }}
                    />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-tight">
                      {prod.name_tamil || prod.name}
                    </h4>
                    {prod.name_tamil && (
                      <p className="text-[10px] text-slate-500 line-clamp-1">{prod.name}</p>
                    )}
                    <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded block mt-1 w-fit border border-brand-200/60">
                      Per {prod.unit || 'pcs'} ({getTamilUnit(prod.unit)})
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black font-mono text-slate-900">
                    ₹{prod.selling_price}
                    <span className="text-[10px] text-slate-400 font-normal font-sans">/{prod.unit || 'pcs'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(prod)}
                    className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-2xs flex items-center gap-1 text-[11px] font-bold"
                    title={`Add 1 ${prod.unit || 'pcs'} to cart`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Info & WhatsApp Support Widget */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl text-white p-6 shadow-md border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              {settings.shop_name || 'Vilmani Store'}
            </h4>
            <p className="text-xs text-slate-300">
              {settings.shop_address || 'Main Road, Tamil Nadu'} • Open 7:00 AM - 10:00 PM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={`tel:${settings.shop_phone || '9876543210'}`}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call Store</span>
          </a>

          <a
            href={`https://wa.me/${(settings.shop_phone || '9876543210').replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(settings.shop_name || 'Store')},%20I%20have%20an%20order%20inquiry.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
          >
            <span>WhatsApp Support</span>
          </a>
        </div>
      </div>

      {/* Digital Receipt View Modal */}
      {isReceiptModalOpen && selectedBill && (
        <ThermalReceiptModal
          isOpen={isReceiptModalOpen}
          isCustomerView={true}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedBill(null);
            setSelectedBillItems([]);
          }}
          bill={selectedBill}
          items={selectedBillItems}
          settings={settings}
        />
      )}
    </div>
  );
};
