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
  Camera,
  Image as ImageIcon,
  Check,
  Wand2,
  Upload,
  Globe,
} from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useLanguage } from '../../context/LanguageContext';
import { CameraBarcodeScannerModal } from '../../components/pos/CameraBarcodeScannerModal';
import {
  getAutoProductImage,
  getSuggestedImages,
  ImagePreset,
} from '../../utils/productImageHelper';

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
  const [isImageManuallyEdited, setIsImageManuallyEdited] = useState<boolean>(false);
  const [isCustomUploaded, setIsCustomUploaded] = useState<boolean>(false);
  const [showCustomImageInput, setShowCustomImageInput] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [webImageResults, setWebImageResults] = useState<string[]>([]);
  const [isSearchingWebImage, setIsSearchingWebImage] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState<string>('');

  // Clear All Modal
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);

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

  // Search product images on Google / Web & OpenFoodFacts
  const fetchWebProductImage = async (
    searchTermQuery: string,
    barcodeVal?: string,
    forceAutoSet: boolean = false
  ) => {
    const q = searchTermQuery.trim();
    if (!q && !barcodeVal) return;

    setIsSearchingWebImage(true);
    try {
      const res = await api.get<{ results: string[]; bestImage: string | null }>(
        '/products/search-image',
        { q, barcode: barcodeVal || undefined }
      );

      if (res.results && res.results.length > 0) {
        setWebImageResults(res.results);
        if (res.bestImage && (!isImageManuallyEdited || forceAutoSet)) {
          setImage(res.bestImage);
          if (forceAutoSet) {
            setIsImageManuallyEdited(false);
            setIsCustomUploaded(false);
          }
        }
      }
    } catch (err) {
      console.warn('Web image search failed:', err);
    } finally {
      setIsSearchingWebImage(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setNameTamil('');
    const defaultCat = categories[0] || 'Grocery';
    setCategory(defaultCat);
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setBarcode('');
    setPurchasePrice('');
    setWRate('');
    setCRate('');
    setStock(10);
    setMinimumStock(5);
    setUnit('pcs');
    setImage(getAutoProductImage('', '', defaultCat));
    setIsImageManuallyEdited(false);
    setIsCustomUploaded(false);
    setShowCustomImageInput(false);
    setWebImageResults([]);
    setIsSearchingWebImage(false);
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
    setImage(p.image || getAutoProductImage(p.name, p.name_tamil, p.category));
    setIsImageManuallyEdited(Boolean(p.image));
    setIsCustomUploaded(Boolean(p.image?.startsWith('data:')));
    setShowCustomImageInput(false);
    setWebImageResults([]);
    setIsSearchingWebImage(false);
    setStatus(p.status);
    setFormError('');
    setIsModalOpen(true);
  };

  // Automatically update product image when typing name if not manually overridden & fetch from Google/Web
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isImageManuallyEdited) {
      setImage(getAutoProductImage(val, nameTamil, category));
    }
    // Debounced automatic Google / Web search
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchWebProductImage(val, barcode, false);
      }, 650);
    }
  };

  const handleNameTamilChange = (val: string) => {
    setNameTamil(val);
    if (!isImageManuallyEdited) {
      setImage(getAutoProductImage(name, val, category));
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchWebProductImage(name || val, barcode, false);
      }, 650);
    }
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (!isImageManuallyEdited) {
      setImage(getAutoProductImage(name, nameTamil, val));
    }
  };

  const handleSelectPreset = (imgUrl: string) => {
    setImage(imgUrl);
    setIsImageManuallyEdited(true);
    setIsCustomUploaded(false);
  };

  const handleAutoDetectImage = () => {
    const autoImg = getAutoProductImage(name, nameTamil, category);
    setImage(autoImg);
    setIsImageManuallyEdited(false);
    setIsCustomUploaded(false);
    if (name.trim() || nameTamil.trim() || barcode.trim()) {
      fetchWebProductImage(name || nameTamil, barcode, true);
    }
  };

  const handleSearchGoogleImage = () => {
    fetchWebProductImage(name || nameTamil, barcode, true);
  };

  // Upload photo from device (File picker / Phone Camera / Gallery) with automatic canvas compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WEBP, etc.)');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // High quality responsive canvas compression to max 600px for speed & lightweight payload
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImage(compressedDataUrl);
          setIsImageManuallyEdited(true);
          setIsCustomUploaded(true);
        }
        setIsUploadingImage(false);
      };
      img.onerror = () => {
        setIsUploadingImage(false);
        alert('Failed to process image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      alert('Failed to read image file.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('nav_products')}</h1>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full border border-slate-200">
              {products.length} {t('items')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage inventory catalog, C-Rate (Retail), W-Rate (Wholesale), and Barcodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('remove_all_products')}</span>
            </button>
          )}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_new_product')}</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar with Add Product in top-right */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search English name, தமிழ் பெயர், SKU or Barcode..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-semibold outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <select
              value={stockStatusFilter}
              onChange={e => setStockStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-semibold outline-none cursor-pointer"
            >
              <option value="all">All Stock Status</option>
              <option value="available">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Add Product option button in the top right of filter row */}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/20 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_new_product')}</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
            <p className="text-xs font-semibold">Loading product catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No products found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Get started by adding your store products with English names, Tamil names, and wholesale/retail rates.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold hover:bg-brand-100 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Item Details (English & Tamil)</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4 text-right">Cost (₹)</th>
                  <th className="py-3 px-4 text-right text-indigo-700 bg-indigo-50/50">W-Rate (₹)</th>
                  <th className="py-3 px-4 text-right text-emerald-700 bg-emerald-50/50">C-Rate (₹)</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => {
                  const isLow = p.stock > 0 && p.stock <= p.minimum_stock;
                  const isOut = p.stock <= 0;

                  const displayWrate = p.w_rate || p.selling_price;
                  const displayCrate = p.c_rate || p.selling_price;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || getAutoProductImage(p.name, p.name_tamil, p.category)}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs shrink-0"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getAutoProductImage(p.name, p.name_tamil, p.category);
                            }}
                          />
                          <div className="overflow-hidden">
                            <div className="font-bold text-slate-800 text-sm truncate">{p.name}</div>
                            {p.name_tamil ? (
                              <div className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 inline-block border border-emerald-200 truncate">
                                {p.name_tamil}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No Tamil name</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">{p.category}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700 block">{p.sku}</span>
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
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Aashirvaad Atta 5kg / Ponni Rice / Sugar"
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
                onChange={e => handleNameTamilChange(e.target.value)}
                placeholder="எ.கா: ஆசீர்வாத் ஆட்டா 5கிலோ / பொன்னி அரிசி"
                className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-sm font-bold text-emerald-900 focus:border-emerald-500 outline-none"
              />
              <span className="text-[10px] text-emerald-600 mt-1 block">
                This Tamil name will be printed on the 4-inch thermal receipt.
              </span>
            </div>

            {/* Product Picture Auto-Selection & Upload Box */}
            <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
              {/* Hidden File Input for Device/Camera Upload */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-600" />
                  <label className="text-xs font-extrabold text-slate-800">
                    Product Picture (கூகுள் படம் / Google & Web Auto-Set)
                  </label>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Google / Web Search Button */}
                  <button
                    type="button"
                    onClick={handleSearchGoogleImage}
                    disabled={isSearchingWebImage || (!name.trim() && !nameTamil.trim() && !barcode.trim())}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    title="Search Google & Web for real product photos"
                  >
                    {isSearchingWebImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                    <span>{isSearchingWebImage ? 'Searching...' : 'Google Image Search'}</span>
                  </button>

                  {/* Upload Photo Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-brand-600/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    title="Upload photo from your computer or phone gallery / camera"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>{isUploadingImage ? 'Uploading...' : t('upload_photo')}</span>
                  </button>

                  {/* Auto-Set Picture Button */}
                  <button
                    type="button"
                    onClick={handleAutoDetectImage}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Auto-match picture based on product name"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-brand-600" />
                    <span>Auto-Set</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Active Image Thumbnail with Click-to-Upload & Hover Overlay */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-brand-500 shadow-md bg-white shrink-0 group cursor-pointer"
                  title="Click to Upload / Change Photo"
                >
                  <img
                    src={image || getAutoProductImage(name, nameTamil, category)}
                    alt={name || 'Product Preview'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAutoProductImage(name, nameTamil, category);
                    }}
                  />

                  {/* Hover upload prompt overlay */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center backdrop-blur-2xs">
                    <Upload className="w-5 h-5 mb-1 animate-bounce" />
                    <span className="text-[10px] font-bold leading-tight">Change / Upload Photo</span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute inset-x-0 bottom-0 bg-slate-900/85 backdrop-blur-xs py-0.5 text-center pointer-events-none">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                      {isCustomUploaded
                        ? '📁 Uploaded'
                        : webImageResults.includes(image)
                        ? '🌐 Google Web'
                        : isImageManuallyEdited
                        ? 'Selected'
                        : '✨ Auto Set'}
                    </span>
                  </div>
                </div>

                {/* Suggestions & Preset / Web Image Picker */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      {isSearchingWebImage ? (
                        <span className="text-blue-600 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Searching Google & Web product images...</span>
                        </span>
                      ) : webImageResults.length > 0 ? (
                        <span className="text-blue-700 font-extrabold flex items-center gap-1">
                          <Globe className="w-3 h-3 text-blue-600" />
                          <span>Google & Web Images found for "{name || nameTamil}":</span>
                        </span>
                      ) : (
                        <span>Suggested Matching Pictures (Click to select):</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomImageInput(!showCustomImageInput)}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      {showCustomImageInput ? 'Hide URL' : 'Custom Image URL'}
                    </button>
                  </div>

                  {/* Image Thumbnails Grid (Web search results OR Preset library) */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {webImageResults.length > 0
                      ? webImageResults.slice(0, 6).map((webUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleSelectPreset(webUrl);
                              setIsCustomUploaded(false);
                            }}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-white aspect-square group cursor-pointer ${
                              image === webUrl
                                ? 'border-brand-600 ring-2 ring-brand-500/20 scale-105'
                                : 'border-slate-200 hover:border-brand-400'
                            }`}
                            title={`Web Image Result ${idx + 1}`}
                          >
                            <img
                              src={webUrl}
                              alt={`Web result ${idx + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            {image === webUrl && (
                              <div className="absolute top-1 right-1 bg-brand-600 text-white rounded-full p-0.5 shadow-xs">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </button>
                        ))
                      : getSuggestedImages(name, nameTamil, category).map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleSelectPreset(preset.imageUrl);
                              setIsCustomUploaded(false);
                            }}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-white aspect-square group cursor-pointer ${
                              image === preset.imageUrl
                                ? 'border-brand-600 ring-2 ring-brand-500/20 scale-105'
                                : 'border-slate-200 hover:border-brand-400'
                            }`}
                            title={preset.alt}
                          >
                            <img
                              src={preset.imageUrl}
                              alt={preset.alt}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            {image === preset.imageUrl && (
                              <div className="absolute top-1 right-1 bg-brand-600 text-white rounded-full p-0.5 shadow-xs">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </button>
                        ))}
                  </div>

                  {showCustomImageInput && (
                    <div className="pt-1 animate-fade-in">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => {
                          setImage(e.target.value);
                          setIsImageManuallyEdited(true);
                          setIsCustomUploaded(false);
                        }}
                        placeholder="Paste custom image URL (https://...)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:border-brand-500 outline-none"
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>💡 <strong>Google Image Search</strong> automatically collects real packshot pictures as you type. Tap <strong>Upload Photo</strong> for custom device files.</span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                list="category-suggestions"
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Barcode (Optional)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const randomCode = '890' + Math.floor(100000000 + Math.random() * 900000000).toString();
                      setBarcode(randomCode);
                    }}
                    className="text-[10px] text-brand-600 hover:text-brand-700 font-semibold"
                  >
                    Generate
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setIsCameraScannerOpen(true)}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    Scan Camera
                  </button>
                </div>
              </div>
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

      {/* Camera Barcode Scanner Modal for Product Form */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={async (scannedCode) => {
          setBarcode(scannedCode);
          setIsCameraScannerOpen(false);
          return true;
        }}
      />
    </div>
  );
};
