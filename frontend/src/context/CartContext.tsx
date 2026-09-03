import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
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
