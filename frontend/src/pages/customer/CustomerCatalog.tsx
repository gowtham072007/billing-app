import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { getAutoProductImage } from '../../utils/productImageHelper';

export const CustomerCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Local state for quantity counters on product cards
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [addedFlash, setAddedFlash] = useState<Record<number, boolean>>({});

  const { addToCart, totalItems, subtotal } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const fetchCatalog = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ products: Product[]; categories: string[] }>('/products', {
        status: 'active',
      });
      setProducts(res.products || []);
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load store catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleQtyChange = (productId: number, delta: number, maxStock: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(current + delta, maxStock));
      return { ...prev, [productId]: next };
    });
  };

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || 1;
    const ok = addToCart(product, qty);
    if (ok) {
      setAddedFlash(prev => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedFlash(prev => ({ ...prev, [product.id]: false }));
      }, 1500);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      (p.name_tamil && p.name_tamil.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      p.category.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast Counter Order & Pickup</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Order Fresh Groceries Directly
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Browse our in-stock items, place your order in 30 seconds, and collect at the store counter.
          </p>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="space-y-3">
        {/* Search Field */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="பொருளின் பெயர் அல்லது ஆங்கிலத்தில் தேடுங்கள் (Search in Tamil or English)..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none shadow-sm transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 select-none scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
              <div className="h-32 bg-slate-200 rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-700">No items match your search</p>
          <p className="text-xs text-slate-400 mt-1">Try another keyword or select All Products</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(p => {
            const isOut = p.stock <= 0;
            const isLow = p.stock > 0 && p.stock <= p.minimum_stock;
            const currentQty = quantities[p.id] || 1;
            const isJustAdded = addedFlash[p.id];

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col justify-between ${
                  isOut
                    ? 'border-slate-200 opacity-60 bg-slate-50'
                    : 'border-slate-200/80 hover:border-brand-500 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Image Container */}
                  <div className="relative w-full h-32 sm:h-36 rounded-xl bg-slate-100 overflow-hidden mb-3">
                    <img
                      src={p.image || getAutoProductImage(p.name, p.name_tamil, p.category)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getAutoProductImage(p.name, p.name_tamil, p.category);
                      }}
                    />

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2">
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-600 text-white shadow-xs">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500 text-white shadow-xs">
                          Only {p.stock} left
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-600 text-white shadow-xs">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category & Title */}
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">
                    {p.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1 leading-snug">
                    {p.name_tamil || p.name}
                  </h3>
                  {p.name_tamil && (
                    <span className="text-xs text-slate-500 font-medium block truncate">
                      {p.name}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 mt-0.5 block">Unit: {p.unit}</span>
                </div>

                {/* Pricing & Cart Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Price</span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        ₹{p.selling_price}
                      </span>
                    </div>

                    {/* Quantity Selector on card */}
                    {!isOut && (
                      <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button
                          onClick={() => handleQtyChange(p.id, -1, p.stock)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors shadow-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs font-mono">{currentQty}</span>
                        <button
                          onClick={() => handleQtyChange(p.id, 1, p.stock)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    disabled={isOut}
                    onClick={() => handleAdd(p)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                      isOut
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isJustAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20 active:scale-[0.98]'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Floating Cart Bar for Mobile & Desktop */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40 animate-slide-up">
          <Link
            to="/customer/cart"
            className="w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-slate-700 hover:bg-slate-800 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black">
                {totalItems}
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Shopping Cart</p>
                <p className="text-sm font-extrabold text-white">
                  {totalItems} item{totalItems > 1 ? 's' : ''} •{' '}
                  <span className="text-emerald-400 font-mono">₹{subtotal.toFixed(2)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};
