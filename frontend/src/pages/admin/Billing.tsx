import React, { useState, useEffect, useCallback } from 'react';
import { ProductSearchGrid } from '../../components/pos/ProductSearchGrid';
import { BillCartTable, PosBillItem } from '../../components/pos/BillCartTable';
import { CustomerSelectModal } from '../../components/pos/CustomerSelectModal';
import { ShortcutHelpModal } from '../../components/pos/ShortcutHelpModal';
import { UPIQrModal } from '../../components/pos/UPIQrModal';
import { ThermalReceiptModal } from '../../components/thermal/ThermalReceiptModal';
import { Product, Customer, Bill, BillItem } from '../../types';
import { api } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';

export const Billing: React.FC = () => {
  const { settings } = useSettings();

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // Rate Mode State: C-Rate (Retail) vs W-Rate (Wholesale)
  const [rateMode, setRateMode] = useState<'c_rate' | 'w_rate'>('c_rate');

  // Bill Workspace State
  const [billItems, setBillItems] = useState<PosBillItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [taxPercentage, setTaxPercentage] = useState<number>(() => {
    return Number(settings.default_tax_rate) || 0;
  });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'other'>('cash');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isUpiQrModalOpen, setIsUpiQrModalOpen] = useState<boolean>(false);

  // Receipt Modal State
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  const [completedBillItems, setCompletedBillItems] = useState<BillItem[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

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
      setTaxPercentage(Number(settings.default_tax_rate) || 0);
    }
  }, [settings.default_tax_rate]);

  // Handle Global Rate Mode Change
  const handleRateModeChange = (mode: 'c_rate' | 'w_rate') => {
    setRateMode(mode);
    // Update all existing items in cart to match the new rate mode
    setBillItems(prev =>
      prev.map(item => {
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
      })
    );
  };

  // Toggle Rate for an individual item between C-Rate and W-Rate
  const handleToggleItemRate = (productId: number) => {
    setBillItems(prev =>
      prev.map(item => {
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
      })
    );
  };

  // Add Product to Current Bill Cart
  const handleAddProduct = (
    product: Product,
    quantity: number = 1,
    customPrice?: number,
    itemRateType: 'c_rate' | 'w_rate' = rateMode
  ) => {
    if (product.stock <= 0) {
      alert(`"${product.name}" is out of stock!`);
      return;
    }

    const cPrice = Number(product.c_rate || product.selling_price || 0);
    const wPrice = Number(product.w_rate || product.selling_price || 0);
    const appliedPrice = customPrice !== undefined ? customPrice : (itemRateType === 'w_rate' ? wPrice : cPrice);

    setBillItems(prev => {
      const existing = prev.find(item => item.product_id === product.id);

      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          alert(`Cannot add more than available stock (${product.stock} ${product.unit}).`);
          return prev;
        }
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: newQty, total: newQty * item.price }
            : item
        );
      } else {
        if (quantity > product.stock) {
          alert(`Quantity exceeds available stock (${product.stock} ${product.unit}).`);
          return prev;
        }
        return [
          ...prev,
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
        ];
      }
    });
  };

  // Barcode / SKU Scan Handler
  const handleBarcodeScan = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();

    // Check local product cache first
    const localMatch = products.find(
      p => p.sku.toUpperCase() === cleanCode || (p.barcode && p.barcode === cleanCode)
    );

    if (localMatch) {
      handleAddProduct(localMatch, 1);
      return true;
    }

    // Try server lookup
    try {
      const res = await api.get<{ product: Product }>(`/products/lookup/${encodeURIComponent(cleanCode)}`);
      if (res.product) {
        handleAddProduct(res.product, 1);
        return true;
      }
    } catch {
      return false;
    }

    return false;
  };

  const handleUpdateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setBillItems(prev =>
      prev.map(item => {
        if (item.product_id === productId) {
          if (qty > item.available_stock) {
            alert(`Maximum available stock is ${item.available_stock} ${item.unit}.`);
            return item;
          }
          return {
            ...item,
            quantity: qty,
            total: qty * item.price,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: number) => {
    setBillItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const handleClearBill = useCallback(() => {
    if (billItems.length === 0) return;
    if (window.confirm('Are you sure you want to clear the current bill cart?')) {
      setBillItems([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setPaymentReference('');
    }
  }, [billItems.length]);

  // Complete and Submit Bill
  const handleCompleteBill = async (printImmediate: boolean = false) => {
    if (billItems.length === 0) {
      alert('Please add at least one product to the bill.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        customer_name: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        customer_phone: selectedCustomer ? selectedCustomer.phone : null,
        items: billItems.map(item => ({
          product_id: item.product_id,
          product_name_tamil: item.product_name_tamil || null,
          quantity: item.quantity,
          price: item.price,
          rate_type: item.rate_type,
        })),
        discount: Number(discount) || 0,
        discount_type: discountType,
        tax_percentage: Number(taxPercentage) || 0,
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim() || undefined,
      };

      const res = await api.post<{
        message: string;
        bill: Bill;
        items: BillItem[];
        settings: any;
      }>('/bills', payload);

      setCompletedBill(res.bill);
      setCompletedBillItems(res.items);
      setIsReceiptModalOpen(true);

      // Reset Current Bill Form
      setBillItems([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setPaymentReference('');

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
      // F1: Clear Bill
      if (e.key === 'F1') {
        e.preventDefault();
        handleClearBill();
      }

      // F4: Customer Select
      if (e.key === 'F4') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      }

      // F8: Complete Bill
      if (e.key === 'F8') {
        e.preventDefault();
        if (billItems.length > 0 && !isSubmitting) {
          handleCompleteBill(false);
        }
      }

      // F9: Complete & Print
      if (e.key === 'F9') {
        e.preventDefault();
        if (billItems.length > 0 && !isSubmitting) {
          handleCompleteBill(true);
        }
      }

      // Esc: Close open modals
      if (e.key === 'Escape') {
        setIsCustomerModalOpen(false);
        setIsShortcutsModalOpen(false);
        setIsUpiQrModalOpen(false);
        setIsReceiptModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billItems, isSubmitting, handleClearBill]);

  // Calculate current grand total for UPI QR
  const currentSubtotal = billItems.reduce((s, i) => s + i.total, 0);
  const currentDiscount =
    discountType === 'percentage'
      ? (currentSubtotal * (discount || 0)) / 100
      : discount || 0;
  const currentTaxable = Math.max(0, currentSubtotal - currentDiscount);
  const currentTax = (currentTaxable * (taxPercentage || 0)) / 100;
  const currentGrandTotal = Math.round(currentTaxable + currentTax);

  return (
    <div className="h-[calc(100vh-2rem)] p-3 sm:p-4 max-w-7xl mx-auto flex flex-col space-y-3">
      {/* POS Billing Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* Left: Product Catalog Grid & Barcode Scanner */}
        <div className="lg:col-span-7 h-full flex flex-col min-h-0">
          <ProductSearchGrid
            products={products}
            categories={categories}
            rateMode={rateMode}
            onAddProduct={handleAddProduct}
            onBarcodeScan={handleBarcodeScan}
          />
        </div>

        {/* Right: Bill Cart Table, Calculations & Payment */}
        <div className="lg:col-span-5 h-full flex flex-col min-h-0">
          <BillCartTable
            items={billItems}
            customer={selectedCustomer}
            rateMode={rateMode}
            discount={discount}
            discountType={discountType}
            taxPercentage={taxPercentage}
            paymentMethod={paymentMethod}
            paymentReference={paymentReference}
            isSubmitting={isSubmitting}
            settings={settings}
            onRateModeChange={handleRateModeChange}
            onUpdateQuantity={handleUpdateQuantity}
            onToggleItemRate={handleToggleItemRate}
            onRemoveItem={handleRemoveItem}
            onSelectCustomerClick={() => setIsCustomerModalOpen(true)}
            onClearBill={handleClearBill}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
            onDiscountChange={setDiscount}
            onDiscountTypeChange={setDiscountType}
            onTaxPercentageChange={setTaxPercentage}
            onPaymentMethodChange={setPaymentMethod}
            onPaymentReferenceChange={setPaymentReference}
            onCompleteBill={handleCompleteBill}
            onOpenUpiQr={() => setIsUpiQrModalOpen(true)}
          />
        </div>
      </div>

      {/* Customer Selector Modal */}
      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        selectedCustomerId={selectedCustomer?.id}
        onSelectCustomer={cust => {
          setSelectedCustomer(cust);
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
