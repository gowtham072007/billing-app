import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Store,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../api/client';
import { CartItem } from '../../types';
import { getAutoProductImage } from '../../utils/productImageHelper';
import {
  getQtyPresets,
  getStepIncrement,
  formatCustomerQtyDisplay,
  formatQtyNumber,
  isDecimalUnit,
} from '../../utils/qtyHelper';

const CartItemRow: React.FC<{
  item: CartItem;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}> = ({ item, onUpdateQuantity, onRemove }) => {
  const [inputVal, setInputVal] = useState<string>(formatQtyNumber(item.quantity));
  const presets = getQtyPresets(item.product.unit);
  const isDec = isDecimalUnit(item.product.unit);

  useEffect(() => {
    setInputVal(formatQtyNumber(item.quantity));
  }, [item.quantity]);

  const handleStep = (delta: number) => {
    const step = getStepIncrement(item.product.unit);
    const newQ = Math.max(0, Math.round((item.quantity + delta * step) * 1000) / 1000);
    onUpdateQuantity(item.product.id, newQ);
  };

  const handleInputBlur = () => {
    const parsed = parseFloat(inputVal);
    if (isNaN(parsed) || parsed <= 0) {
      setInputVal(formatQtyNumber(item.quantity));
    } else {
      const clean = Math.min(item.product.stock, Math.round(parsed * 1000) / 1000);
      onUpdateQuantity(item.product.id, clean);
      setInputVal(formatQtyNumber(clean));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const lineTotal = (item.product.selling_price * item.quantity).toFixed(2).replace(/\.00$/, '');

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        {/* Product Image & Info */}
        <div className="flex items-start gap-3 min-w-0">
          <img
            src={item.product.image || getAutoProductImage(item.product.name, item.product.name_tamil, item.product.category)}
            alt={item.product.name}
            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 bg-white p-0.5 shadow-xs"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getAutoProductImage(item.product.name, item.product.name_tamil, item.product.category);
            }}
          />

          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {item.product.name_tamil || item.product.name}
            </h4>
            {item.product.name_tamil && (
              <p className="text-xs text-slate-500 font-medium truncate">{item.product.name}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                ₹{item.product.selling_price} / {item.product.unit || 'pcs'}
              </span>
              <span className="text-xs text-slate-500">
                Selected: <strong className="text-slate-900">{formatCustomerQtyDisplay(item.quantity, item.product.unit)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Line Price & Remove */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-black text-slate-900 text-base">
              ₹{lineTotal}
            </span>
            <button
              onClick={() => onRemove(item.product.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            ₹{item.product.selling_price} × {formatQtyNumber(item.quantity)} {item.product.unit || 'pcs'}
          </span>
        </div>
      </div>

      {/* Quantity Selector & Quick Presets */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        {/* Stepper with unit and editable input */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qty:</span>
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors"
              title="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center px-1">
              <input
                type="number"
                step={isDec ? '0.25' : '1'}
                min="0.01"
                max={item.product.stock}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                className="w-14 text-center font-bold text-xs font-mono bg-transparent border-none outline-none text-slate-900 p-0"
              />
              <span className="text-[11px] text-slate-500 font-medium ml-0.5 select-none">
                {item.product.unit || 'pcs'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStep(1)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors"
              title="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Quantity Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto select-none">
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Presets:</span>
          {presets.slice(0, 5).map((p) => {
            const isSelected = Math.abs(item.quantity - p.value) < 0.001;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onUpdateQuantity(item.product.id, p.value)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Order Placed Success State
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isAuthenticated) {
      navigate('/login?redirect=/customer/cart');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items to checkout.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        notes: notes.trim() || undefined,
        items: items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
        })),
      };

      const res = await api.post<{ message: string; order: any }>('/orders', payload);

      setPlacedOrder(res.order);
      clearCart();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order Success Screen
  if (placedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Order Transmitted to Admin
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Order #{placedOrder.order_number} Placed!
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            The store admin has received your order request and will begin preparing it shortly.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-left text-xs space-y-3">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Order Reference:</span>
            <span className="font-mono font-bold text-slate-900">{placedOrder.order_number}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Total Amount:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">₹{placedOrder.total_amount}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Status:</span>
            <span className="font-bold text-amber-600 uppercase">Pending Store Acceptance</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Store Contact:</span>
            <span className="font-bold text-slate-900">{settings.shop_phone}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/customer/orders')}
            className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Track Order Status</span>
          </button>
          <button
            onClick={() => navigate('/customer/products')}
            className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Review Cart & Checkout</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your items and confirm your order for quick store pickup
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-16 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Cart is Empty</h3>
            <p className="text-xs text-slate-400 mt-1">Add fresh groceries and items from the store catalog</p>
          </div>
          <Link
            to="/customer/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Cart Items List (7 cols on lg) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 p-4">
            <div className="pb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cart Items ({totalItems})
              </span>
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
              >
                Clear Cart
              </button>
            </div>

            {items.map(item => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          {/* Right: Checkout & Instructions Form (5 cols on lg) */}
          <form onSubmit={handleCheckout} className="lg:col-span-5 space-y-4">
            {/* Pickup & Order Instructions Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-4 h-4 text-brand-600" />
                <span>Store Pickup & Instructions</span>
              </h3>

              {!isAuthenticated ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <p className="font-bold">Sign in required to place order</p>
                  <p className="text-[11px] text-amber-700">
                    You can review your items now, and we'll take you to a quick login on checkout.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                  Ordering as <strong className="text-slate-900">{user?.name}</strong> ({user?.phone})
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Special Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Please pack items in separate bags, pickup at 6 PM"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
              <div className="space-y-2 text-xs text-slate-300 border-b border-slate-800 pb-3">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} items):</span>
                  <span className="font-mono font-semibold text-white">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-bold">
                <span className="uppercase tracking-wider">Total Payable:</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isAuthenticated ? 'Place Order & Send to Shop' : 'Login to Confirm Order'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

