import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Product, CartItem } from '../types';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { emitCartUpdate, emitCartClear, isConnected } = useSocket();
  const { user } = useAuth();
  const isInitialMountRef = useRef<boolean>(true);

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('customer_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('customer_cart', JSON.stringify(items));
  }, [items]);

  // Synchronize cart with Laptop POS Draft Bill & Admin Dashboard in real time
  useEffect(() => {
    if (!isConnected) return;

    if (items.length > 0) {
      const sectionItems = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_name_tamil: item.product.name_tamil || null,
        sku: item.product.sku || '',
        unit: item.product.unit || 'pcs',
        quantity: item.quantity,
        price: item.product.selling_price,
        rate_type: 'c_rate' as const,
        c_rate: item.product.c_rate || item.product.selling_price,
        w_rate: item.product.w_rate || item.product.selling_price,
        total: Math.round(item.product.selling_price * item.quantity * 100) / 100,
        available_stock: item.product.stock
      }));

      const currentSubtotal = sectionItems.reduce((s, i) => s + i.total, 0);
      const currentGrandTotal = Math.round(currentSubtotal);

      emitCartUpdate({
        sectionId: 1,
        items: sectionItems,
        subtotal: currentSubtotal,
        discount: 0,
        discountType: 'flat',
        taxPercentage: 0,
        taxAmount: 0,
        grandTotal: currentGrandTotal,
        selectedCustomer: user
          ? { id: user.id, name: user.name, phone: user.phone || '' }
          : null,
        cashierName: user?.name ? `${user.name} (Mobile)` : 'Mobile Phone',
        paymentMethod: 'cash',
        rateMode: 'c_rate',
      });
    } else {
      if (!isInitialMountRef.current) {
        emitCartClear(1);
      }
    }

    isInitialMountRef.current = false;
  }, [items, isConnected, user, emitCartUpdate, emitCartClear]);

  const addToCart = (product: Product, quantity: number = 1): boolean => {
    if (product.stock <= 0) {
      alert(`Sorry, "${product.name}" is currently out of stock.`);
      return false;
    }

    let success = true;

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.product.id === product.id);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > product.stock) {
          alert(`Cannot add more than available stock (${product.stock} ${product.unit}).`);
          success = false;
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        if (quantity > product.stock) {
          alert(`Requested quantity exceeds available stock (${product.stock} ${product.unit}).`);
          success = false;
          return prevItems;
        }
        return [...prevItems, { product, quantity }];
      }
    });

    return success;
  };

  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock;
          const safeQty = Math.min(quantity, maxStock);
          if (quantity > maxStock) {
            alert(`Maximum available stock is ${maxStock} ${item.product.unit}.`);
          }
          return { ...item, quantity: safeQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('customer_cart');
  };

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalQuantity,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
