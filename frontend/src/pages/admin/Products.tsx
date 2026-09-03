import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Barcode,
  Layers,
  Sparkles,
  Tag,
  Languages,
} from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useLanguage } from '../../context/LanguageContext';

export const Products: React.FC = () => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [nameTamil, setNameTamil] = useState<string>('');
  const [category, setCategory] = useState<string>('Grocery');
  const [sku, setSku] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [wRate, setWRate] = useState<number | ''>('');
  const [cRate, setCRate] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minimumStock, setMinimumStock] = useState<number | ''>(5);
  const [unit, setUnit] = useState<string>('pcs');
  const [image, setImage] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState<string>('');

  // Clear All Modal
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ products: Product[]; categories: string[] }>('/products', {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        stock_status: stockStatusFilter !== 'all' ? stockStatusFilter : undefined,
      });
      setProducts(res.products || []);
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, stockStatusFilter]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setNameTamil('');
    setCategory(categories[0] || 'Grocery');
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setBarcode('');
    setPurchasePrice('');
    setWRate('');
    setCRate('');
    setStock(10);
    setMinimumStock(5);
    setUnit('pcs');
    setImage('');
    setStatus('active');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setIsEditing(true);
    setCurrentId(p.id);
    setName(p.name);
    setNameTamil(p.name_tamil || '');
    setCategory(p.category);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setPurchasePrice(p.purchase_price);
    setWRate(p.w_rate || p.selling_price);
    setCRate(p.c_rate || p.selling_price);
    setStock(p.stock);
    setMinimumStock(p.minimum_stock);
    setUnit(p.unit);
    setImage(p.image || '');
    setStatus(p.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !sku.trim()) {
      setFormError('Product Name (English) and SKU are required.');
      return;
    }

    const customerPrice = cRate !== '' ? Number(cRate) : (wRate !== '' ? Number(wRate) : 0);
    const wholesalePrice = wRate !== '' ? Number(wRate) : customerPrice;

    if (customerPrice <= 0 && wholesalePrice <= 0) {
      setFormError('Please enter a valid C-Rate (Customer Rate) or W-Rate (Wholesale Rate).');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        name_tamil: nameTamil.trim() || null,
        category: category.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || null,
        purchase_price: Number(purchasePrice) || 0,
        c_rate: customerPrice,
        w_rate: wholesalePrice,
        selling_price: customerPrice,
        stock: Number(stock) || 0,
        minimum_stock: Number(minimumStock) || 5,
        unit: unit.trim(),
        image: image.trim() || null,
        status,
      };

      if (isEditing && currentId) {
        await api.put(`/products/${currentId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Error saving product.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleClearAllProducts = async () => {
    setIsClearing(true);
    try {
      await api.post('/products/clear-all', { force: true });
      setIsClearAllModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to remove all products.');
    } finally {
      setIsClearing(false);
    }
  };

  // Filtered list with English and Tamil search
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(term) ||
      (p.name_tamil && p.name_tamil.toLowerCase().includes(term)) ||
      p.sku.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term));

    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('nav_products')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            English & Tamil Names • <span className="font-bold text-brand-600">C-Rate</span> (Retail) & <span className="font-bold text-indigo-600">W-Rate</span> (Wholesale)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {products.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Remove / Delete all products from catalog"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('remove_all_products')}</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_new_product')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by English, தமிழ் பெயர், SKU, Barcode..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">{t('all')} Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={e => setStockStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">{t('all')} Stock Status</option>
            <option value="available">{t('available')}</option>
            <option value="low_stock">{t('low_stock')}</option>
            <option value="out_of_stock">{t('out_of_stock')}</option>
          </select>

          <button
            onClick={fetchProducts}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Products Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                {products.length === 0 ? 'No products in catalog' : 'No matching products found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {products.length === 0
                  ? 'Your store catalog is empty. Click below to add your first product with English and Tamil names.'
                  : 'Try changing your search terms or filter selections.'}
              </p>
            </div>
            {products.length === 0 && (
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-brand-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ {t('add_new_product')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-4">Product Name (English / தமிழ்)</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">
                    <span className="text-indigo-600 font-extrabold">W-Rate</span>
                    <span className="block text-[9px] text-slate-400 font-normal">Wholesale</span>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <span className="text-brand-600 font-extrabold">C-Rate</span>
                    <span className="block text-[9px] text-slate-400 font-normal">Retail</span>
                  </th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => {
                  const isLow = p.stock <= p.minimum_stock && p.stock > 0;
                  const isOut = p.stock <= 0;
                  const displayCrate = p.c_rate || p.selling_price || 0;
                  const displayWrate = p.w_rate || p.selling_price || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                            {p.name_tamil ? (
                              <p className="text-xs font-extrabold text-emerald-800 bg-emerald-50/80 px-1.5 py-0.2 rounded inline-block">
                                {p.name_tamil}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">No Tamil name</p>
                            )}
                            <p className="text-[10px] text-slate-400">Unit: {p.unit}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-600">{p.category}</td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">{p.sku}</span>
                        {p.barcode && (
                          <span className="block font-mono text-[10px] text-slate-400">
                            {p.barcode}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        ₹{Number(p.purchase_price || 0).toFixed(2)}
                      </td>

                      {/* W-Rate (Wholesale) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">
                        ₹{Number(displayWrate).toFixed(2)}
                      </td>

                      {/* C-Rate (Customer) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                        ₹{Number(displayCrate).toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                        {isLow && (
                          <span className="block text-[9px] text-amber-600 font-semibold mt-0.5">
                            Min: {p.minimum_stock}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant={p.status === 'active' ? 'success' : 'neutral'} size="sm">
                          {p.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit Product, Tamil Name, W-Rate & C-Rate"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal with English and Tamil Name */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Product & Tamil Name' : 'Add New Product'}
        subtitle="Enter English name, Tamil name (தமிழ் பெயர்), and rates"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* English Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Name (English / ஆங்கிலம்) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aashirvaad Atta 5kg / Ponni Rice"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none font-medium"
                autoFocus
              />
            </div>

            {/* Tamil Name */}
            <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
              <label className="block text-xs font-extrabold text-emerald-900 mb-1 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-emerald-600" />
                <span>பொருளின் பெயர் (Tamil / தமிழ் பெயர்)</span>
              </label>
              <input
                type="text"
                value={nameTamil}
                onChange={e => setNameTamil(e.target.value)}
                placeholder="எ.கா: ஆசீர்வாத் ஆட்டா 5கிலோ / பொன்னி அரிசி"
                className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-sm font-bold text-emerald-900 focus:border-emerald-500 outline-none"
              />
              <span className="text-[10px] text-emerald-600 mt-1 block">
                This Tamil name will be printed on the 4-inch thermal receipt.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                list="category-suggestions"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Grocery, Dairy, Beverages"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
              />
              <datalist id="category-suggestions">
                {categories.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure *</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="L">Liter (L)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="packet">Packet</option>
                <option value="Bag">Bag</option>
                <option value="bottle">Bottle</option>
                <option value="box">Box</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. ATTA005"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-brand-500 outline-none uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Barcode (Optional)</label>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="e.g. 8901001005"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price / Purchase Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-brand-500 outline-none"
              />
            </div>

            {/* W-Rate (Wholesale Rate) */}
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
              <label className="block text-xs font-extrabold text-indigo-900 mb-1">
                W-Rate / Wholesale Rate (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={wRate}
                onChange={e => setWRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Wholesale Rate"
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-mono font-bold text-indigo-700 focus:border-indigo-500 outline-none"
              />
              <span className="text-[10px] text-indigo-500 mt-1 block">For B2B wholesale billing</span>
            </div>

            {/* C-Rate (Customer Rate) */}
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
              <label className="block text-xs font-extrabold text-emerald-900 mb-1">
                C-Rate / Customer Rate (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={cRate}
                onChange={e => setCRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Retail Rate"
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-mono font-bold text-emerald-700 focus:border-emerald-500 outline-none"
              />
              <span className="text-[10px] text-emerald-600 mt-1 block">Standard retail / consumer price</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isEditing ? 'Current Stock Quantity' : 'Initial Stock Quantity'}
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Stock Alert Level</label>
              <input
                type="number"
                min="0"
                value={minimumStock}
                onChange={e => setMinimumStock(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="5"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-brand-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Image URL (Optional)</label>
              <input
                type="url"
                value={image}
                onChange={e => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none font-medium"
              >
                <option value="active">Active (Visible in POS & Store)</option>
                <option value="inactive">Inactive / Hidden</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 cursor-pointer"
            >
              {isEditing ? t('save') : '+ Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove All Products Confirmation Modal */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        title="⚠️ Delete All Products"
        subtitle="This action will permanently delete all products in your store"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Warning: This will permanently remove all {products.length} products.</span>
            </p>
            <p>
              Your product catalog will be completely empty. You can then add your custom shop products with English & Tamil names.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              disabled={isClearing}
              onClick={handleClearAllProducts}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Deleting...' : 'Yes, Delete All Products'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
