import React, { useState, useEffect, useCallback } from 'react';
import { ProductSearchGrid } from '../../components/pos/ProductSearchGrid';
import { BillCartTable, PosBillItem } from '../../components/pos/BillCartTable';
import { BillSectionTabs, BillSectionData } from '../../components/pos/BillSectionTabs';
import { CustomerSelectModal } from '../../components/pos/CustomerSelectModal';
import { ShortcutHelpModal } from '../../components/pos/ShortcutHelpModal';
import { UPIQrModal } from '../../components/pos/UPIQrModal';
import { ThermalReceiptModal } from '../../components/thermal/ThermalReceiptModal';
import { CameraBarcodeScannerModal } from '../../components/pos/CameraBarcodeScannerModal';
import { useGlobalBarcodeScanner } from '../../hooks/useGlobalBarcodeScanner';
import { posSounds } from '../../utils/soundEffects';
import { Product, Customer, Bill, BillItem } from '../../types';
import { api } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';

const createEmptySection = (id: number, defaultTax: number = 0): BillSectionData => ({
  id,
  items: [],
  selectedCustomer: null,
  rateMode: 'c_rate',
  discount: 0,
  discountType: 'flat',
  taxPercentage: defaultTax,
  paymentMethod: 'cash',
  paymentReference: '',
});

export const Billing: React.FC = () => {
  const { settings } = useSettings();

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // 10 Section Billing State
  const [sections, setSections] = useState<BillSectionData[]>(() =>
    Array.from({ length: 10 }, (_, i) =>
      createEmptySection(i + 1, Number(settings.default_tax_rate) || 0)
    )
  );
  const [activeSectionId, setActiveSectionId] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isUpiQrModalOpen, setIsUpiQrModalOpen] = useState<boolean>(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [barcodeToast, setBarcodeToast] = useState<{ text: string; isError?: boolean } | null>(null);

  // Receipt Modal State
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  const [completedBillItems, setCompletedBillItems] = useState<BillItem[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Active Section Pointer
  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];

  // Helper to update active section state
  const updateActiveSection = useCallback(
    (updater: (prevSec: BillSectionData) => BillSectionData) => {
      setSections(prev =>
        prev.map(s => (s.id === activeSectionId ? updater(s) : s))
      );
    },
    [activeSectionId]
  );

  // Fetch Catalog
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const res = await api.get<{ products: Product[]; categories: string[] }>('/products', {
        status: 'active',
      });
      setProducts(res.products || []);
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load products for POS:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Update default tax when settings load
  useEffect(() => {
    if (settings.default_tax_rate !== undefined) {
      const defaultTax = Number(settings.default_tax_rate) || 0;
      setSections(prev =>
        prev.map(s =>
          s.items.length === 0 && s.taxPercentage === 0
            ? { ...s, taxPercentage: defaultTax }
            : s
        )
      );
    }
  }, [settings.default_tax_rate]);

  // Handle Global Rate Mode Change for Active Section
  const handleRateModeChange = (mode: 'c_rate' | 'w_rate') => {
    updateActiveSection(prev => ({
      ...prev,
      rateMode: mode,
      items: prev.items.map(item => {
        const prod = products.find(p => p.id === item.product_id);
        const cPrice = item.c_rate || (prod ? prod.c_rate || prod.selling_price : item.price);
        const wPrice = item.w_rate || (prod ? prod.w_rate || prod.selling_price : item.price);
        const newPrice = mode === 'w_rate' ? wPrice : cPrice;

        return {
          ...item,
          rate_type: mode,
          price: newPrice,
          total: item.quantity * newPrice,
        };
      }),
    }));
  };

  // Toggle Rate for an individual item between C-Rate and W-Rate in Active Section
  const handleToggleItemRate = (productId: number) => {
    updateActiveSection(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.product_id !== productId) return item;

        const nextRateType = item.rate_type === 'w_rate' ? 'c_rate' : 'w_rate';
        const prod = products.find(p => p.id === productId);
        const cPrice = item.c_rate || (prod ? prod.c_rate || prod.selling_price : item.price);
        const wPrice = item.w_rate || (prod ? prod.w_rate || prod.selling_price : item.price);
        const newPrice = nextRateType === 'w_rate' ? wPrice : cPrice;

        return {
          ...item,
          rate_type: nextRateType,
          price: newPrice,
          total: item.quantity * newPrice,
        };
      }),
    }));
  };

  // Add Product to Active Section Bill Cart
  const handleAddProduct = (
    product: Product,
    quantity: number = 1,
    customPrice?: number,
    itemRateType: 'c_rate' | 'w_rate' = activeSection.rateMode
  ) => {
    if (product.stock <= 0) {
      setBarcodeToast({ text: `⚠️ "${product.name}" is OUT OF STOCK!`, isError: true });
      setTimeout(() => setBarcodeToast(null), 3500);
      return;
    }

    const cPrice = Number(product.c_rate || product.selling_price || 0);
    const wPrice = Number(product.w_rate || product.selling_price || 0);
    const appliedPrice = customPrice !== undefined ? customPrice : (itemRateType === 'w_rate' ? wPrice : cPrice);

    updateActiveSection(prev => {
      const existing = prev.items.find(item => item.product_id === product.id);

      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          setBarcodeToast({ text: `Cannot add more than available stock (${product.stock} ${product.unit}).`, isError: true });
          setTimeout(() => setBarcodeToast(null), 3500);
          return prev;
        }
        return {
          ...prev,
          items: prev.items.map(item =>
            item.product_id === product.id
              ? { ...item, quantity: newQty, total: newQty * item.price }
              : item
          ),
        };
      } else {
        if (quantity > product.stock) {
          setBarcodeToast({ text: `Quantity exceeds available stock (${product.stock} ${product.unit}).`, isError: true });
          setTimeout(() => setBarcodeToast(null), 3500);
          return prev;
        }

        return {
          ...prev,
          items: [
            ...prev.items,
            {
              product_id: product.id,
              product_name: product.name,
              product_name_tamil: product.name_tamil || null,
              sku: product.sku,
              unit: product.unit,
              quantity,
              price: appliedPrice,
              rate_type: itemRateType,
              c_rate: cPrice,
              w_rate: wPrice,
              total: quantity * appliedPrice,
              available_stock: product.stock,
            },
          ],
        };
      }
    });
  };

  // Barcode / SKU Scan Handler with POS Sound feedback & non-blocking toast
  const handleBarcodeScan = async (code: string): Promise<boolean> => {
    if (!code || !code.trim()) return false;
    const cleanCode = code.trim().toUpperCase();
    const cleanNumeric = cleanCode.replace(/^0+/, '');

    // 1. Check local product cache
    const localMatch = products.find(p => {
      const pSku = (p.sku || '').trim().toUpperCase();
      const pBarcode = (p.barcode || '').trim().toUpperCase();
      return (
        pSku === cleanCode ||
        pBarcode === cleanCode ||
        (cleanNumeric && pBarcode === cleanNumeric) ||
        (cleanNumeric && pSku === cleanNumeric)
      );
    });

    if (localMatch) {
      if (localMatch.stock <= 0) {
        posSounds.playBeepError();
        setBarcodeToast({ text: `⚠️ "${localMatch.name}" is OUT OF STOCK!`, isError: true });
        setTimeout(() => setBarcodeToast(null), 3500);
        return false;
      }
      posSounds.playBeepSuccess();
      handleAddProduct(localMatch, 1);
      setBarcodeToast({ text: `✓ Added: ${localMatch.name}` });
      setTimeout(() => setBarcodeToast(null), 2500);
      return true;
    }

    // 2. Try server lookup
    try {
      const res = await api.get<{ product: Product }>(`/products/lookup/${encodeURIComponent(cleanCode)}`);
      if (res.product) {
        if (res.product.stock <= 0) {
          posSounds.playBeepError();
          setBarcodeToast({ text: `⚠️ "${res.product.name}" is OUT OF STOCK!`, isError: true });
          setTimeout(() => setBarcodeToast(null), 3500);
          return false;
        }
        posSounds.playBeepSuccess();
        handleAddProduct(res.product, 1);
        setBarcodeToast({ text: `✓ Added: ${res.product.name}` });
        setTimeout(() => setBarcodeToast(null), 2500);
        return true;
      }
    } catch {}

    posSounds.playBeepError();
    setBarcodeToast({ text: `✕ No product found for Barcode / SKU "${cleanCode}"`, isError: true });
    setTimeout(() => setBarcodeToast(null), 3500);
    return false;
  };

  // Global Hardware USB / Bluetooth Barcode Gun Scanner
  useGlobalBarcodeScanner({
    onScan: async (scannedCode) => {
      await handleBarcodeScan(scannedCode);
    },
    enabled: !isCustomerModalOpen && !isReceiptModalOpen && !isCameraScannerOpen,
  });

  const handleUpdateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    updateActiveSection(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.product_id === productId) {
          if (qty > item.available_stock) {
            setBarcodeToast({ text: `Maximum available stock is ${item.available_stock} ${item.unit}.`, isError: true });
            setTimeout(() => setBarcodeToast(null), 3500);
            return item;
          }
          return {
            ...item,
            quantity: qty,
            total: qty * item.price,
          };
        }
        return item;
      }),
    }));
  };

  const handleRemoveItem = (productId: number) => {
    updateActiveSection(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product_id !== productId),
    }));
  };

  const handleClearBill = useCallback(() => {
    if (activeSection.items.length === 0) return;
    if (window.confirm(`Are you sure you want to clear Section ${activeSectionId}?`)) {
      setSections(prev =>
        prev.map(s =>
          s.id === activeSectionId
            ? createEmptySection(activeSectionId, Number(settings.default_tax_rate) || 0)
            : s
        )
      );
    }
  }, [activeSection.items.length, activeSectionId, settings.default_tax_rate]);

  const handleClearSection = (id: number) => {
    setSections(prev =>
      prev.map(s =>
        s.id === id
          ? createEmptySection(id, Number(settings.default_tax_rate) || 0)
          : s
      )
    );
  };

  // Complete and Submit Bill for Active Section
  const handleCompleteBill = async (printImmediate: boolean = false) => {
    if (activeSection.items.length === 0) {
      setBarcodeToast({ text: 'Please add at least one product to the bill.', isError: true });
      setTimeout(() => setBarcodeToast(null), 3500);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_id: activeSection.selectedCustomer ? activeSection.selectedCustomer.id : null,
        customer_name: activeSection.selectedCustomer ? activeSection.selectedCustomer.name : 'Walk-in Customer',
        customer_phone: activeSection.selectedCustomer ? activeSection.selectedCustomer.phone : null,
        items: activeSection.items.map(item => ({
          product_id: item.product_id,
          product_name_tamil: item.product_name_tamil || null,
          quantity: item.quantity,
          price: item.price,
          rate_type: item.rate_type,
        })),
        discount: Number(activeSection.discount) || 0,
        discount_type: activeSection.discountType,
        tax_percentage: Number(activeSection.taxPercentage) || 0,
        payment_method: activeSection.paymentMethod,
        payment_reference: activeSection.paymentReference.trim() || undefined,
      };

      const res = await api.post<{
        message: string;
        bill: Bill;
        items: BillItem[];
        settings: any;
      }>('/bills', payload);

      posSounds.playBillComplete();
      setCompletedBill(res.bill);
      setCompletedBillItems(res.items);
      setIsReceiptModalOpen(true);

      // Reset Active Section Form only
      setSections(prev =>
        prev.map(s =>
          s.id === activeSectionId
            ? createEmptySection(activeSectionId, Number(settings.default_tax_rate) || 0)
            : s
        )
      );

      // Refresh product stock counts
      fetchProducts();

      // Trigger instant browser print if F9 pressed
      if (printImmediate) {
        setTimeout(() => {
          window.print();
        }, 400);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Global POS Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + 1..9 or Alt + 0: Switch Section
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key >= '1' && e.key <= '9') {
          e.preventDefault();
          const targetSection = parseInt(e.key, 10);
          setActiveSectionId(targetSection);
          return;
        }
        if (e.key === '0' || e.code === 'Digit0') {
          e.preventDefault();
          setActiveSectionId(10);
          return;
        }
      }

      // F1: Clear Current Active Section Bill
      if (e.key === 'F1') {
        e.preventDefault();
        handleClearBill();
      }

      // F3: Camera Barcode Scanner
      if (e.key === 'F3') {
        e.preventDefault();
        setIsCameraScannerOpen(true);
      }

      // F4: Customer Select
      if (e.key === 'F4') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      }

      // F8: Complete Bill
      if (e.key === 'F8') {
        e.preventDefault();
        if (activeSection.items.length > 0 && !isSubmitting) {
          handleCompleteBill(false);
        }
      }

      // F9: Complete & Print
      if (e.key === 'F9') {
        e.preventDefault();
        if (activeSection.items.length > 0 && !isSubmitting) {
          handleCompleteBill(true);
        }
      }

      // Esc: Close open modals
      if (e.key === 'Escape') {
        setIsCustomerModalOpen(false);
        setIsShortcutsModalOpen(false);
        setIsUpiQrModalOpen(false);
        setIsReceiptModalOpen(false);
        setIsCameraScannerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, isSubmitting, handleClearBill]);

  // Calculate current grand total for UPI QR
  const currentSubtotal = activeSection.items.reduce((s, i) => s + i.total, 0);
  const currentDiscount =
    activeSection.discountType === 'percentage'
      ? (currentSubtotal * (activeSection.discount || 0)) / 100
      : activeSection.discount || 0;
  const currentTaxable = Math.max(0, currentSubtotal - currentDiscount);
  const currentTax = (currentTaxable * (activeSection.taxPercentage || 0)) / 100;
  const currentGrandTotal = Math.round(currentTaxable + currentTax);

  return (
    <div className="h-[calc(100vh-2rem)] p-3 sm:p-4 max-w-7xl mx-auto flex flex-col space-y-2.5">
      {/* 10 Section Billing Tabs Switcher Header */}
      <BillSectionTabs
        sections={sections}
        activeSectionId={activeSectionId}
        onSelectSection={setActiveSectionId}
        onClearSection={handleClearSection}
      />

      {/* Barcode Scanner Floating Alert / Toast */}
      {barcodeToast && (
        <div
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-between shadow-lg animate-fade-in ${
            barcodeToast.isError
              ? 'bg-rose-600 border border-rose-700 shadow-rose-600/20'
              : 'bg-emerald-600 border border-emerald-700 shadow-emerald-600/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${barcodeToast.isError ? 'bg-white' : 'bg-emerald-200 animate-ping'}`} />
            <span>{barcodeToast.text}</span>
          </div>
          <button
            onClick={() => setBarcodeToast(null)}
            className="text-white/80 hover:text-white text-xs font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* POS Billing Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left: Product Catalog Grid & Barcode Scanner */}
        <div className="lg:col-span-7 h-full flex flex-col min-h-0">
          <ProductSearchGrid
            products={products}
            categories={categories}
            rateMode={activeSection.rateMode}
            onAddProduct={handleAddProduct}
            onBarcodeScan={handleBarcodeScan}
            onOpenScanner={() => setIsCameraScannerOpen(true)}
          />
        </div>

        {/* Right: Bill Cart Table, Calculations & Payment for Active Section */}
        <div className="lg:col-span-5 h-full flex flex-col min-h-0">
          <BillCartTable
            items={activeSection.items}
            customer={activeSection.selectedCustomer}
            rateMode={activeSection.rateMode}
            discount={activeSection.discount}
            discountType={activeSection.discountType}
            taxPercentage={activeSection.taxPercentage}
            paymentMethod={activeSection.paymentMethod}
            paymentReference={activeSection.paymentReference}
            isSubmitting={isSubmitting}
            settings={settings}
            onRateModeChange={handleRateModeChange}
            onUpdateQuantity={handleUpdateQuantity}
            onToggleItemRate={handleToggleItemRate}
            onRemoveItem={handleRemoveItem}
            onSelectCustomerClick={() => setIsCustomerModalOpen(true)}
            onClearBill={handleClearBill}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
            onDiscountChange={val => updateActiveSection(s => ({ ...s, discount: val }))}
            onDiscountTypeChange={type => updateActiveSection(s => ({ ...s, discountType: type }))}
            onTaxPercentageChange={val => updateActiveSection(s => ({ ...s, taxPercentage: val }))}
            onPaymentMethodChange={method => updateActiveSection(s => ({ ...s, paymentMethod: method }))}
            onPaymentReferenceChange={ref => updateActiveSection(s => ({ ...s, paymentReference: ref }))}
            onCompleteBill={handleCompleteBill}
            onOpenUpiQr={() => setIsUpiQrModalOpen(true)}
          />
        </div>
      </div>

      {/* Customer Selector Modal */}
      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        selectedCustomerId={activeSection.selectedCustomer?.id}
        onSelectCustomer={cust => {
          updateActiveSection(s => ({ ...s, selectedCustomer: cust }));
          setIsCustomerModalOpen(false);
        }}
      />

      {/* Shortcuts Helper Modal */}
      <ShortcutHelpModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* UPI Dynamic QR Modal */}
      <UPIQrModal
        isOpen={isUpiQrModalOpen}
        onClose={() => setIsUpiQrModalOpen(false)}
        amount={currentGrandTotal}
        settings={settings}
        onPaid={() => setIsUpiQrModalOpen(false)}
      />

      {/* Live Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      {/* 4-inch Thermal Receipt Modal */}
      {completedBill && (
        <ThermalReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          bill={completedBill}
          items={completedBillItems}
          settings={settings}
        />
      )}
    </div>
  );
};
