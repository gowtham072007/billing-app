import React, { useState, useRef, useEffect } from 'react';
import { Search, Barcode, Plus, Camera, Layers } from 'lucide-react';
import { Product } from '../../types';

interface ProductSearchGridProps {
  products: Product[];
  categories: string[];
  rateMode: 'c_rate' | 'w_rate';
  onAddProduct: (product: Product, quantity?: number, customPrice?: number, rateType?: 'c_rate' | 'w_rate') => void;
  onBarcodeScan: (code: string) => Promise<boolean>;
  onOpenScanner?: () => void;
}

export const ProductSearchGrid: React.FC<ProductSearchGridProps> = ({
  products,
  categories,
  rateMode,
  onAddProduct,
  onBarcodeScan,
  onOpenScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeFlash, setBarcodeFlash] = useState<{ text: string; isError?: boolean } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global shortcut focus [F2]
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim();
    const success = await onBarcodeScan(code);

    if (success) {
      setBarcodeFlash({ text: `✓ Added: ${code}` });
      setBarcodeInput('');
    } else {
      setBarcodeFlash({ text: `✕ Not found: ${code}`, isError: true });
    }

    setTimeout(() => setBarcodeFlash(null), 2500);
  };

  // Filter products locally by English name, Tamil name, SKU, or barcode
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(term) ||
      (p.name_tamil && p.name_tamil.toLowerCase().includes(term)) ||
      p.sku.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Search & Barcode Scanner Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        {/* Barcode / SKU Instant Scanner */}
        <form
          onSubmit={handleBarcodeSubmit}
          className="sm:col-span-6 relative flex items-center gap-1.5"
        >
          <div className="relative flex-1">
            <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
              <Barcode className="w-5 h-5 text-emerald-600" />
            </div>
            <input
              ref={barcodeInputRef}
              id="pos-barcode-input"
              data-barcode-input="true"
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode / SKU [F2]"
              className="w-full pl-10 pr-14 py-2 bg-emerald-50/60 border-2 border-emerald-500/60 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              Add
            </button>
          </div>

          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              title="Open Live Camera Scanner (F3)"
              className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera (F3)</span>
            </button>
          )}
        </form>

        {/* Product Name Search in English & Tamil */}
        <div className="sm:col-span-6 relative flex items-center">
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search English or தமிழ் பெயர்..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {barcodeFlash && (
        <div
          className={`px-3 py-1.5 text-white text-xs font-semibold rounded-lg flex items-center gap-2 animate-fade-in shadow-sm ${
            barcodeFlash.isError ? 'bg-rose-900 border border-rose-700' : 'bg-slate-900 border border-emerald-500/40'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              barcodeFlash.isError ? 'bg-rose-400' : 'bg-emerald-400 animate-ping'
            }`}
          ></span>
          <span>{barcodeFlash.text}</span>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none scrollbar-none">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'All'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Items ({products.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No products found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or add new products in Product Catalog</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredProducts.map(product => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.minimum_stock;
              
              const cPrice = Number(product.c_rate || product.selling_price || 0);
              const wPrice = Number(product.w_rate || product.selling_price || 0);
              const activePrice = rateMode === 'w_rate' ? wPrice : cPrice;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && onAddProduct(product, 1, activePrice, rateMode)}
                  className={`group relative bg-white rounded-xl p-3 border transition-all flex flex-col justify-between select-none ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                      : 'border-slate-200/80 hover:border-brand-500 hover:shadow-md cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div>
                    {/* Top Meta: Category & Stock Status Badge */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase truncate">
                        {product.category}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                          OUT
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          {product.stock} {product.unit}
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-emerald-600">
                          {product.stock} {product.unit}
                        </span>
                      )}
                    </div>

                    {/* Product Name (English) */}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 leading-snug">
                      {product.name}
                    </h4>

                    {/* Tamil Name (தமிழ் பெயர்) */}
                    {product.name_tamil && (
                      <p className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded mt-0.5 truncate leading-tight">
                        {product.name_tamil}
                      </p>
                    )}

                    <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                      {product.sku}
                    </span>
                  </div>

                  {/* Dual Rates Breakdown (W-Rate & C-Rate) */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${rateMode === 'c_rate' ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400' : 'text-slate-500'}`}>
                        C-Rate: ₹{cPrice}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${rateMode === 'w_rate' ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400' : 'text-slate-500'}`}>
                        W-Rate: ₹{wPrice}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-black font-mono text-slate-900">
                        ₹{activePrice}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                          ({rateMode === 'w_rate' ? 'W-Rate' : 'C-Rate'})
                        </span>
                      </span>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : rateMode === 'w_rate'
                            ? 'bg-indigo-600 text-white group-hover:bg-indigo-700 shadow-sm'
                            : 'bg-brand-600 text-white group-hover:bg-brand-700 shadow-sm'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
