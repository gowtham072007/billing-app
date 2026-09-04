import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Store,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../api/client';
import { getAutoProductImage } from '../../utils/productImageHelper';

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState<string>(user?.address || '');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Order Placed Success State
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isAuthenticated) {
      // Prompt user to login before placing order
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
        delivery_address: deliveryAddress.trim() || undefined,
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
          Review your items, provide pickup or delivery details, and confirm order
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
              <div key={item.product.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.image || getAutoProductImage(item.product.name, item.product.name_tamil, item.product.category)}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-white p-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAutoProductImage(item.product.name, item.product.name_tamil, item.product.category);
                    }}
                  />

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {item.product.name_tamil || item.product.name}
                    </h4>
                    {item.product.name_tamil && (
                      <p className="text-[11px] text-slate-500 font-medium">{item.product.name}</p>
                    )}
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      ₹{item.product.selling_price} / {item.product.unit}
                    </p>
                  </div>
                </div>

                {/* Stepper & Total */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors shadow-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs font-mono">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-mono font-bold text-slate-900 text-sm w-16 text-right">
                    ₹{(item.product.selling_price * item.quantity).toFixed(0)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Checkout & Delivery Form (5 cols on lg) */}
          <form onSubmit={handleCheckout} className="lg:col-span-5 space-y-4">
            {/* Delivery Info Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>Delivery / Pickup Instructions</span>
              </h3>

              {!isAuthenticated ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <p className="font-bold">Sign in required to place order</p>
                  <p className="text-[11px] text-amber-700">
                    You can review your items now, and we'll take you to a 10-second login on checkout.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                  Ordering as <strong className="text-slate-900">{user?.name}</strong> ({user?.phone})
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Delivery Address / Location Notes
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. 12/4, Gandhi Street, Near Temple, Chennai"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Special Order Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Please pack in separate bags, pickup at 6 PM"
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
                <div className="flex justify-between">
                  <span>Estimated Delivery / Service:</span>
                  <span className="font-semibold text-emerald-400">FREE</span>
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
