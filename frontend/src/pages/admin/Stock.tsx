import React, { useState, useEffect } from 'react';
import {
  Boxes,
  PlusCircle,
  MinusCircle,
  Sliders,
  History,
  Search,
  RefreshCw,
  AlertTriangle,
  Trash2,
  PackagePlus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import { StockTransaction } from '../../types';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

interface StockItem {
  id: number;
  name: string;
  category: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  minimum_stock: number;
  unit: string;
  stock_status: string;
  last_stock_update?: string;
}

export const Stock: React.FC = () => {
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Single Item Adjust Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Bulk / Add Stock Modal
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState<boolean>(false);
  const [addStockProductId, setAddStockProductId] = useState<number | ''>('');
  const [addStockQty, setAddStockQty] = useState<number | ''>(10);
  const [addStockNotes, setAddStockNotes] = useState<string>('New stock received from supplier');

  // Clear All Stock Modal
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [clearReason, setClearReason] = useState<string>('Stock audit / seasonal reset');
  const [isClearing, setIsClearing] = useState<boolean>(false);

  const fetchStock = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ stock: StockItem[]; summary: any }>('/stock', {
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setStockList(res.stock || []);
      setSummary(res.summary || null);

      const histRes = await api.get<{ history: StockTransaction[] }>('/stock/history', { limit: 100 });
      setHistory(histRes.history || []);
    } catch (err) {
      console.error('Failed to load stock data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [statusFilter]);

  const handleOpenAdjust = (product: StockItem, defaultType: 'add' | 'remove' | 'set' = 'add') => {
    setSelectedProduct(product);
    setAdjustmentType(defaultType);
    setQuantity('');
    setNotes('');
    setFormError('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity === '') {
      setFormError('Please enter a valid quantity.');
      return;
    }

    try {
      await api.post('/stock/adjust', {
        product_id: selectedProduct.id,
        adjustment_type: adjustmentType,
        quantity: Number(quantity),
        notes: notes.trim() || undefined,
      });

      setIsAdjustModalOpen(false);
      fetchStock();
    } catch (err: any) {
      setFormError(err.message || 'Failed to adjust stock.');
    }
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStockProductId || addStockQty === '') {
      alert('Please select a product and enter a quantity.');
      return;
    }

    try {
      await api.post('/stock/adjust', {
        product_id: Number(addStockProductId),
        adjustment_type: 'add',
        quantity: Number(addStockQty),
        notes: addStockNotes.trim() || 'Restock',
      });

      setIsAddStockModalOpen(false);
      fetchStock();
    } catch (err: any) {
      alert(err.message || 'Failed to add stock.');
    }
  };

  const handleClearAllStock = async () => {
    setIsClearing(true);
    try {
      await api.post('/stock/clear-all', {
        reason: clearReason.trim() || 'Admin cleared all stock',
      });
      setIsClearAllModalOpen(false);
      fetchStock();
    } catch (err: any) {
      alert(err.message || 'Failed to clear stock.');
    } finally {
      setIsClearing(false);
    }
  };

  const filteredStock = stockList.filter(s =>
    !searchTerm ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inventory levels, stock adjustments, and full transaction audit logs
          </p>
        </div>

        {/* Action Controls: Add Stock, Clear All, Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (stockList.length > 0) {
                setAddStockProductId(stockList[0].id);
              }
              setIsAddStockModalOpen(true);
            }}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/20 transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Add / Restock</span>
          </button>

          <button
            onClick={() => setIsClearAllModalOpen(true)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Reset / Clear all inventory levels to 0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete / Clear All Stock</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total SKUs</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{summary.total_products}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Available</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{summary.available_count || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Low Stock</p>
            <p className="text-2xl font-black text-amber-700 mt-0.5">{summary.low_stock_count || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Out of Stock</p>
            <p className="text-2xl font-black text-rose-700 mt-0.5">{summary.out_of_stock_count || 0}</p>
          </div>
        </div>
      )}

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Filter Row */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search inventory items..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">All Levels</option>
                <option value="available">Available Only</option>
                <option value="low_stock">Low Stock Alerts</option>
                <option value="out_of_stock">Out of Stock Only</option>
              </select>

              <button
                onClick={fetchStock}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Min Level</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Quick Stock Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStock.map(p => {
                    const isOut = p.stock <= 0;
                    const isLow = p.stock > 0 && p.stock <= p.minimum_stock;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{p.category}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.sku}</td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-mono text-sm font-bold ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-slate-900'
                            }`}
                          >
                            {p.stock} <span className="text-xs text-slate-400 font-normal">{p.unit}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {p.minimum_stock} {p.unit}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                            size="sm"
                          >
                            {p.stock_status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAdjust(p, 'add')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Restock / Add Quantity"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>+ Add Stock</span>
                            </button>
                            <button
                              onClick={() => handleOpenAdjust(p, 'remove')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Damage / Reduce Quantity"
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                              <span>Reduce</span>
                            </button>
                            <button
                              onClick={() => handleOpenAdjust(p, 'set')}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Set Exact Stock Audit Count"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Stock Audit History Trail Tab */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Inventory Transaction History Log</h3>
            <span className="text-xs text-slate-400">Last 100 inventory movements</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Change Qty</th>
                  <th className="py-3 px-4 text-center">Prev Stock</th>
                  <th className="py-3 px-4 text-center">New Stock</th>
                  <th className="py-3 px-4">Ref / Reason</th>
                  <th className="py-3 px-4">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No stock history recorded.
                    </td>
                  </tr>
                ) : (
                  history.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {new Date(h.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{h.product_name}</td>
                      <td className="py-3 px-4">
                        <Badge
                          size="sm"
                          variant={
                            h.transaction_type === 'BILL_SALE'
                              ? 'info'
                              : h.transaction_type === 'RESTOCK'
                              ? 'success'
                              : h.transaction_type === 'REDUCTION'
                              ? 'danger'
                              : 'neutral'
                          }
                        >
                          {h.transaction_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {h.transaction_type === 'RESTOCK' || h.transaction_type === 'INITIAL' ? (
                          <span className="text-emerald-600">+{h.quantity}</span>
                        ) : h.transaction_type === 'BILL_SALE' || h.transaction_type === 'REDUCTION' ? (
                          <span className="text-rose-600">-{h.quantity}</span>
                        ) : (
                          <span>{h.quantity}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{h.previous_stock}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{h.new_stock}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{h.notes || h.reference_id}</td>
                      <td className="py-3 px-4 text-slate-500">{h.admin_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Individual Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
        subtitle={`Current Available Stock: ${selectedProduct?.stock} ${selectedProduct?.unit}`}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          {/* Action Type Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'add', label: 'Restock (+)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
              { id: 'remove', label: 'Damaged (-)', color: 'text-rose-700 bg-rose-50 border-rose-300' },
              { id: 'set', label: 'Set Count (=)', color: 'text-indigo-700 bg-indigo-50 border-indigo-300' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdjustmentType(tab.id as any)}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  adjustmentType === tab.id
                    ? `${tab.color} ring-2 ring-slate-900`
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {adjustmentType === 'add'
                ? 'Quantity to Add'
                : adjustmentType === 'remove'
                ? 'Quantity to Deduct'
                : 'Exact New Stock Count'}{' '}
              ({selectedProduct?.unit}) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={quantity}
              onChange={e => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="Enter quantity..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:border-brand-500 outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason / Reference Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received new shipment from supplier / Expired item damaged"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20"
            >
              Apply Stock Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Restock Stock for any Product Modal */}
      <Modal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        title="Add / Restock Product Inventory"
        subtitle="Quickly add units to any existing product"
        maxWidth="md"
      >
        <form onSubmit={handleAddStockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Product *</label>
            <select
              value={addStockProductId}
              onChange={e => setAddStockProductId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none font-medium"
            >
              {stockList.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (Current: {item.stock} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Add *</label>
            <input
              type="number"
              min="1"
              required
              value={addStockQty}
              onChange={e => setAddStockQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="e.g. 20"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Supplier Reference</label>
            <input
              type="text"
              value={addStockNotes}
              onChange={e => setAddStockNotes(e.target.value)}
              placeholder="e.g. Received shipment from wholesaler"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddStockModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20"
            >
              + Add Stock Now
            </button>
          </div>
        </form>
      </Modal>

      {/* Clear All Stock Confirmation Modal */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        title="⚠️ Delete / Clear All Product Stocks"
        subtitle="This action will reset current stock of ALL products to 0"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Warning: This will set stock to 0 for all {stockList.length} products.</span>
            </p>
            <p>
              Your product catalog and categories will remain saved, but all current inventory counts will be cleared to 0. You can re-add stock anytime using "+ Add / Restock".
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for clearing stock</label>
            <input
              type="text"
              value={clearReason}
              onChange={e => setClearReason(e.target.value)}
              placeholder="e.g. Physical inventory count audit reset"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isClearing}
              onClick={handleClearAllStock}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Clearing...' : 'Yes, Clear All Stock to 0'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
