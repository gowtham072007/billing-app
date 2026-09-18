import React, { useState } from 'react';
import {
  Activity,
  Receipt,
  ShoppingCart,
  User,
  Clock,
  Printer,
  X,
  CheckCircle2,
  Radio,
  Laptop,
  Smartphone,
  Tablet,
  Sparkles,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { useSocket, BillCompletedEvent } from '../../context/SocketContext';
import { LiveBillingSession } from '../../types';

interface LiveBillingMonitorProps {
  onReprintBill?: (billId: number) => void;
}

export const LiveBillingMonitor: React.FC<LiveBillingMonitorProps> = ({ onReprintBill }) => {
  const {
    isConnected,
    onlineDeviceCount,
    activeSessions,
    deviceId: currentDeviceId,
    lastCompletedBill,
    clearCompletedBillNotification
  } = useSocket();

  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);

  // Filter out empty sessions
  const validSessions = activeSessions.filter(s => s.items && s.items.length > 0);
  const activeSession: LiveBillingSession | undefined = validSessions[selectedSessionIndex] || validSessions[0];

  const getDeviceIcon = (label: string) => {
    const l = (label || '').toLowerCase();
    if (l.includes('phone') || l.includes('mobile')) return <Smartphone className="w-4 h-4" />;
    if (l.includes('tablet') || l.includes('ipad')) return <Tablet className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />;
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'upi': return <QrCode className="w-3.5 h-3.5 text-indigo-500" />;
      case 'card': return <CreditCard className="w-3.5 h-3.5 text-sky-500" />;
      default: return <Banknote className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Completed Bill Real-Time Notification Banner */}
      {lastCompletedBill && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-4 rounded-2xl shadow-lg shadow-emerald-900/10 border border-emerald-500/30 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  {lastCompletedBill.bill.bill_number}
                </span>
                <span className="text-xs font-semibold text-emerald-100">
                  Paid via <strong className="uppercase text-white">{lastCompletedBill.bill.payment_method}</strong>
                </span>
                <span className="text-[11px] text-emerald-200 bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Cashier: {lastCompletedBill.cashierName}
                </span>
              </div>
              <p className="text-sm font-bold mt-0.5">
                Transaction Completed: <span className="font-mono text-base font-black text-amber-300">₹{lastCompletedBill.bill.grand_total.toLocaleString('en-IN')}</span>
                <span className="text-xs font-normal text-emerald-100 ml-2">
                  ({lastCompletedBill.items.length} items • {lastCompletedBill.bill.customer_name || 'Walk-in'})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onReprintBill && (
              <button
                onClick={() => onReprintBill(lastCompletedBill.bill.id)}
                className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View Invoice</span>
              </button>
            )}
            <button
              onClick={clearCompletedBillNotification}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Real-Time POS Activity Monitor Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header with Connection Pulse */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              {isConnected && (
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute opacity-75"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wide flex items-center gap-1.5 text-white">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time POS Terminal Activity</span>
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live WebSocket
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instant cross-device synchronization between Cashier POS and Admin Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span>
                {isConnected ? `${onlineDeviceCount} Device${onlineDeviceCount > 1 ? 's' : ''} Online` : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Device / Terminal Selector Tabs (if multiple POS terminals are active) */}
        {validSessions.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Active Terminals:</span>
            {validSessions.map((sess, idx) => (
              <button
                key={sess.deviceId}
                onClick={() => setSelectedSessionIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                  (selectedSessionIndex === idx || (!validSessions[selectedSessionIndex] && idx === 0))
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {getDeviceIcon(sess.deviceLabel)}
                <span>{sess.deviceLabel}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-black">
                  ₹{sess.grandTotal}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Live Content Section */}
        {activeSession ? (
          <div className="p-5 space-y-4">
            {/* Active Session Meta Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  {getDeviceIcon(activeSession.deviceLabel)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900">
                      {activeSession.deviceLabel}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      Section #{activeSession.sectionId}
                    </span>
                    {activeSession.deviceId === currentDeviceId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700">
                        This Device
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Cashier: <strong className="text-slate-700">{activeSession.cashierName}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      Customer: <strong className="text-slate-700">{activeSession.selectedCustomer ? activeSession.selectedCustomer.name : 'Walk-in'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Mode & Rate Mode Badges */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                  {getPaymentIcon(activeSession.paymentMethod)}
                  <span className="capitalize">{activeSession.paymentMethod}</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 uppercase">
                  {activeSession.rateMode === 'w_rate' ? 'W-Rate (Wholesale)' : 'C-Rate (Retail)'}
                </div>
              </div>
            </div>

            {/* Live Cart Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeSession.items.map((item, idx) => (
                    <tr key={`${item.product_id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900">{item.product_name}</div>
                        {item.product_name_tamil && (
                          <div className="text-[11px] text-brand-600 font-medium">{item.product_name_tamil}</div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-900">
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        ₹{item.price}
                        <span className="text-[10px] text-slate-400 ml-1">/{item.unit}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Live Totals Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Subtotal ({activeSession.itemCount} items)</span>
                <p className="text-base font-bold font-mono text-slate-800 mt-0.5">₹{activeSession.subtotal.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Discount ({activeSession.discountType === 'percentage' ? `${activeSession.discount}%` : 'Flat'})</span>
                <p className="text-base font-bold font-mono text-rose-600 mt-0.5">- ₹{activeSession.discount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tax / GST ({activeSession.taxPercentage}%)</span>
                <p className="text-base font-bold font-mono text-slate-800 mt-0.5">+ ₹{activeSession.taxAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 border border-emerald-500">
                <span className="text-[10px] uppercase font-bold text-emerald-100 flex items-center justify-between">
                  <span>Live Grand Total</span>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                </span>
                <p className="text-xl font-black font-mono mt-0.5">₹{activeSession.grandTotal.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Idle Standby State */
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">POS Terminal Standby</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                No active billing cart at this moment. When a cashier scans barcodes or adds products on any connected device, live billing details will appear here automatically in real time.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All connected devices synced via centralized WebSocket backend</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
