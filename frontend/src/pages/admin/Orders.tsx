import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  RefreshCw,
  Clock,
  CheckCircle,
  PackageCheck,
  Ban,
  Receipt,
  Printer,
  ChevronRight,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';
import { Order, OrderItem, OrderStatus, Bill, BillItem } from '../../types';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { ThermalReceiptModal } from '../../components/thermal/ThermalReceiptModal';
import { useSettings } from '../../context/SettingsContext';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { settings } = useSettings();

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Print Receipt Modal
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  const [completedBillItems, setCompletedBillItems] = useState<BillItem[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ orders: Order[] }>('/orders', {
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-poll for new incoming orders every 10 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const res = await api.get<{ order: Order; items: OrderItem[] }>(`/orders/${orderId}`);
      setSelectedOrder(res.order);
      setOrderItems(res.items);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      alert('Failed to load order details');
    }
  };

  const handlePrintOrderReceipt = async (orderId: number) => {
    try {
      const res = await api.get<{ bill: Bill; items: BillItem[] }>(`/orders/${orderId}/receipt`);
      setCompletedBill(res.bill);
      setCompletedBillItems(res.items);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load order bill receipt');
    }
  };

  const handleConvertToBillAndPrint = async (orderId: number) => {
    if (!window.confirm('Convert this customer order to a finalized Bill & print thermal receipt?')) {
      return;
    }

    try {
      const res = await api.post<{
        message: string;
        bill_id: number;
        bill_number: string;
        grand_total: number;
      }>(`/orders/${orderId}/convert-to-bill`, {
        payment_method: 'cash',
      });

      // Fetch newly created bill for thermal receipt print preview
      const billRes = await api.get<{ bill: Bill; items: BillItem[] }>(`/bills/${res.bill_id}`);
      setCompletedBill(billRes.bill);
      setCompletedBillItems(billRes.items);
      setIsDetailsModalOpen(false);
      setIsReceiptModalOpen(true);
      fetchOrders();

      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err: any) {
      alert(err.message || 'Failed to convert order to bill');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'accepted':
        return <Badge variant="info">Accepted</Badge>;
      case 'preparing':
        return <Badge variant="purple">Preparing</Badge>;
      case 'ready':
        return <Badge variant="success">Ready for Pickup</Badge>;
      case 'completed':
        return <Badge variant="neutral">Completed & Billed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time incoming customer orders, fulfillment lifecycle & thermal bill printing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'pending', label: 'Pending' },
          { key: 'accepted', label: 'Accepted' },
          { key: 'preparing', label: 'Preparing' },
          { key: 'ready', label: 'Ready for Pickup' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No customer orders found</h3>
            <p className="text-xs text-slate-400">Orders placed by customers will appear here in real-time</p>
          </div>
        ) : (
          orders.map(o => (
            <div
              key={o.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* Header: Order No & Status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {o.order_number}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(o.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <div>{getStatusBadge(o.status)}</div>
                </div>

                {/* Customer Details */}
                <div className="py-3 space-y-1 text-xs">
                  <p className="font-bold text-slate-900">{o.customer_name}</p>
                  {o.customer_phone && (
                    <p className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{o.customer_phone}</span>
                    </p>
                  )}
                  {o.delivery_address && (
                    <p className="text-slate-500 text-[11px] flex items-start gap-1 pt-1 line-clamp-2">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{o.delivery_address}</span>
                    </p>
                  )}
                </div>

                {/* Items Summary */}
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700">
                  <p className="font-semibold text-slate-800 mb-0.5">
                    {o.item_count} Items:
                  </p>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {o.items_summary}
                  </p>
                </div>

                {o.notes && (
                  <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <strong>Note:</strong> {o.notes}
                  </div>
                )}
              </div>

              {/* Bottom Row: Amount & Actions */}
              <div className="pt-4 mt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Total Amount:</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    ₹{o.total_amount}
                  </span>
                </div>

                {/* Status Pipeline & Print Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleViewOrder(o.id)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors text-center"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => handlePrintOrderReceipt(o.id)}
                    className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    title="Print 4-inch Thermal Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Bill</span>
                  </button>

                  {o.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'accepted')}
                      className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors text-center"
                    >
                      Accept Order
                    </button>
                  )}

                  {o.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'preparing')}
                      className="w-full py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors text-center"
                    >
                      Mark Preparing
                    </button>
                  )}

                  {o.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'ready')}
                      className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors text-center"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}

                  {(o.status === 'ready' || o.status === 'accepted' || o.status === 'preparing') && (
                    <button
                      onClick={() => handleConvertToBillAndPrint(o.id)}
                      className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-brand-600/20 transition-all"
                      title="Convert to Bill, update stock, and print 4-inch thermal receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Convert to Bill & Print Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Itemized Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Order Details #${selectedOrder?.order_number}`}
        subtitle={`Placed on ${selectedOrder?.created_at ? new Date(selectedOrder.created_at).toLocaleString('en-IN') : ''}`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Customer Contact */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{selectedOrder.customer_name}</p>
                <p className="text-slate-500 font-mono mt-0.5">{selectedOrder.customer_phone}</p>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {selectedOrder.delivery_address && (
              <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                <span className="font-bold text-slate-700 block mb-0.5">Delivery Address:</span>
                {selectedOrder.delivery_address}
              </div>
            )}

            {/* Item Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Item / பொருள்</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orderItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">
                          {item.product_name_tamil || item.product_name}
                        </p>
                        {item.product_name_tamil && (
                          <span className="text-[10px] text-slate-400 block">{item.product_name}</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">Unit: {item.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{item.price}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="flex justify-between items-center p-3 bg-slate-900 text-white rounded-xl">
              <span className="text-xs font-bold uppercase">Grand Total Amount</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                ₹{selectedOrder.total_amount}
              </span>
            </div>

            {/* Action Triggers in Modal */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handlePrintOrderReceipt(selectedOrder.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill (ரசீது அச்சிடு)</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Close
                </button>

                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => handleConvertToBillAndPrint(selectedOrder.id)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/20"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Convert to Bill & Print Receipt</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Thermal Receipt Print Preview */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        bill={completedBill}
        items={completedBillItems}
        settings={settings}
      />
    </div>
  );
};
