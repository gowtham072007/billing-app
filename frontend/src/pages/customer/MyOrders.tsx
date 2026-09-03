import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Package,
  Store,
  Ban,
  ArrowRight,
  RefreshCw,
  Phone,
  Printer,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Order, OrderItem, OrderStatus, Bill, BillItem } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { ThermalReceiptModal } from '../../components/thermal/ThermalReceiptModal';

export const MyOrders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Thermal Receipt Modal
  const [selectedReceiptBill, setSelectedReceiptBill] = useState<Bill | null>(null);
  const [selectedReceiptItems, setSelectedReceiptItems] = useState<BillItem[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ orders: Order[] }>('/orders');
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load my orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();

      // Poll every 8 seconds for live status changes from Admin
      const interval = setInterval(() => {
        fetchOrders();
      }, 8000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handlePrintReceipt = async (orderId: number) => {
    try {
      const res = await api.get<{ bill: Bill; items: BillItem[] }>(`/orders/${orderId}/receipt`);
      setSelectedReceiptBill(res.bill);
      setSelectedReceiptItems(res.items);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load bill receipt');
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'cancelled' });
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'completed':
        return 4;
      default:
        return -1;
    }
  };

  const timelineSteps = [
    { label: 'Order Sent', desc: 'Awaiting shop acceptance' },
    { label: 'Accepted', desc: 'Confirmed by store' },
    { label: 'Preparing', desc: 'Packing your items' },
    { label: 'Ready', desc: 'Ready for pickup at counter' },
    { label: 'Completed', desc: 'Order fulfilled' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your orders</h2>
        <p className="text-xs text-slate-500">
          Track real-time order status updates and view past receipts.
        </p>
        <Link
          to="/login?redirect=/customer/orders"
          className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Orders & Tracking</h1>
          <p className="text-xs text-slate-500 mt-1">
            Live real-time order tracking, store fulfillment updates & thermal bill printing
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-colors shadow-xs"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-16 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No orders placed yet</h3>
          <p className="text-xs text-slate-400">Order fresh groceries directly from the catalog</p>
          <Link
            to="/customer/products"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const stepIndex = getStepIndex(order.status);
            const isCancelled = order.status === 'cancelled';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Order Top Bar */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-base">
                        #{order.order_number}
                      </span>
                      {isCancelled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
                          Cancelled
                        </span>
                      ) : order.status === 'completed' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-900 text-white">
                          Completed & Billed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-100 text-brand-700 animate-pulse">
                          In Progress ({order.status})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Placed on {new Date(order.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Grand Total</span>
                      <span className="text-xl font-black font-mono text-slate-900">
                        ₹{order.total_amount}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePrintReceipt(order.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      title="Print 4-inch Thermal Bill"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Bill (ரசீது)</span>
                    </button>
                  </div>
                </div>

                {/* Live Progress Bar or Cancellation Notice */}
                <div className="p-5">
                  {isCancelled ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-700 text-xs">
                      <Ban className="w-5 h-5 shrink-0" />
                      <p className="font-semibold">
                        This order was cancelled. If you have any questions, please contact the shop counter.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Live Order Fulfillment Timeline
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative">
                        {timelineSteps.map((step, idx) => {
                          const isDone = idx <= stepIndex;
                          const isCurrent = idx === stepIndex;

                          return (
                            <div
                              key={step.label}
                              className={`p-3 rounded-2xl border text-center space-y-1 transition-all ${
                                isCurrent
                                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                                  : isDone
                                  ? 'border-slate-200 bg-slate-50 text-slate-700'
                                  : 'border-slate-100 bg-white text-slate-400 opacity-60'
                              }`}
                            >
                              <div className="flex justify-center">
                                {isDone ? (
                                  <CheckCircle
                                    className={`w-5 h-5 ${
                                      isCurrent ? 'text-brand-600 animate-pulse' : 'text-emerald-600'
                                    }`}
                                  />
                                ) : (
                                  <Clock className="w-5 h-5 text-slate-300" />
                                )}
                              </div>
                              <p className={`text-xs font-extrabold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                                {step.label}
                              </p>
                              <p className="text-[10px] text-slate-500 hidden sm:block">{step.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Summary & Delivery Address */}
                <div className="p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs border-t border-slate-100">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-700">Items Ordered:</p>
                    <p className="text-slate-600">{order.items_summary}</p>
                    {order.delivery_address && (
                      <p className="text-slate-500 pt-1">
                        <strong>Delivery/Address:</strong> {order.delivery_address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePrintReceipt(order.id)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Receipt (ரசீது)</span>
                    </button>

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        bill={selectedReceiptBill}
        items={selectedReceiptItems}
        settings={settings}
      />
    </div>
  );
};
