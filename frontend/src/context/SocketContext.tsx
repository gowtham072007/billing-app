import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LiveBillingSession, Bill, BillItem, Product } from '../types';
import { useAuth } from './AuthContext';

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem('quickbill_pos_device_id');
    if (!id) {
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      id = `DEV-${rand}`;
      localStorage.setItem('quickbill_pos_device_id', id);
    }
    return id;
  } catch {
    return `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}

function detectDeviceLabel(): string {
  try {
    const saved = localStorage.getItem('quickbill_terminal_label');
    if (saved && saved.trim()) return saved.trim();

    const ua = navigator.userAgent || '';
    let type = 'Desktop';
    if (/tablet|ipad/i.test(ua)) {
      type = 'Tablet POS';
    } else if (/mobile|android|iphone/i.test(ua)) {
      type = 'Mobile POS';
    } else if (/macintosh|mac os/i.test(ua)) {
      type = 'Mac POS';
    } else if (/windows/i.test(ua)) {
      type = 'Windows PC';
    }

    let browser = 'Browser';
    if (/chrome|crios/i.test(ua) && !/edge|opr/i.test(ua)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/edg/i.test(ua)) browser = 'Edge';

    return `${type} (${browser})`;
  } catch {
    return 'POS Terminal';
  }
}

export interface BillCompletedEvent {
  bill: Bill;
  items: BillItem[];
  cashierName: string;
  deviceId?: string;
  sectionId?: number | null;
  today_sales: number;
  today_bills: number;
  updatedProducts?: Array<{ id: number; name: string; sku: string; stock: number }>;
  timestamp: string;
}

export interface SectionSyncedEvent {
  section: {
    id: number;
    cashierName?: string;
    items: any[];
    selectedCustomer?: any;
    rateMode?: 'c_rate' | 'w_rate';
    discount?: number;
    discountType?: 'flat' | 'percentage';
    taxPercentage?: number;
    taxAmount?: number;
    paymentMethod?: 'cash' | 'upi' | 'card' | 'other';
    paymentReference?: string;
    subtotal?: number;
    grandTotal?: number;
    updatedByDevice?: string;
    updatedAt?: string;
  };
  updatedByDevice: string;
  timestamp: string;
}

export type SyncStatus = 'live' | 'syncing' | 'offline';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  syncStatus: SyncStatus;
  onlineDeviceCount: number;
  deviceId: string;
  deviceLabel: string;
  setTerminalLabel: (label: string) => void;
  activeSessions: LiveBillingSession[];
  lastCompletedBill: BillCompletedEvent | null;
  clearCompletedBillNotification: () => void;
  emitCartUpdate: (cartData: Partial<LiveBillingSession> & { sectionId?: number; items: any[]; subtotal: number; grandTotal: number }) => void;
  emitCartClear: (sectionId?: number) => void;
  onSectionSynced?: (callback: (event: SectionSyncedEvent) => void) => () => void;
  onSectionCleared?: (callback: (data: { sectionId: number; clearedByDevice?: string }) => void) => () => void;
  onStockUpdated?: (callback: (data: any) => void) => () => void;
  onBillCompleted?: (callback: (event: BillCompletedEvent) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [onlineDeviceCount, setOnlineDeviceCount] = useState<number>(1);
  const [activeSessions, setActiveSessions] = useState<LiveBillingSession[]>([]);
  const [lastCompletedBill, setLastCompletedBill] = useState<BillCompletedEvent | null>(null);
  
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [deviceLabel, setDeviceLabelState] = useState<string>(() => detectDeviceLabel());

  const socketRef = useRef<Socket | null>(null);

  const setTerminalLabel = (label: string) => {
    const trimmed = label.trim() || detectDeviceLabel();
    try {
      localStorage.setItem('quickbill_terminal_label', trimmed);
    } catch {}
    setDeviceLabelState(trimmed);

    // If connected, update registration
    if (socketRef.current?.connected) {
      socketRef.current.emit('register_device', {
        deviceId,
        deviceLabel: trimmed,
        cashierName: user?.name || 'Cashier',
        role: user?.role || 'admin'
      });
    }
  };

  useEffect(() => {
    // Determine backend socket server URL
    let socketUrl = window.location.origin;
    if (import.meta.env.VITE_API_URL) {
      socketUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    } else if (window.location.port === '5173' || window.location.port === '3000') {
      // Local dev mode with Vite
      socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    }

    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      setSyncStatus('live');
      console.log('⚡ Connected to Real-Time WebSocket Server (ID:', s.id, ')');

      // Register device info
      s.emit('register_device', {
        deviceId,
        deviceLabel,
        cashierName: user?.name || 'Cashier',
        role: user?.role || 'admin'
      });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      setSyncStatus('offline');
      console.warn('⚠️ Disconnected from Real-Time WebSocket Server');
    });

    s.on('connect_error', () => {
      setIsConnected(false);
      setSyncStatus('offline');
    });

    s.on('devices:count', (data: { count: number }) => {
      if (typeof data?.count === 'number') {
        setOnlineDeviceCount(data.count);
      }
    });

    s.on('sync:initial_state', (data: { activeSessions: LiveBillingSession[]; onlineDeviceCount: number }) => {
      if (Array.isArray(data?.activeSessions)) {
        setActiveSessions(data.activeSessions);
      }
      if (typeof data?.onlineDeviceCount === 'number') {
        setOnlineDeviceCount(data.onlineDeviceCount);
      }
      setSyncStatus('live');
    });

    // Real-time live cart updates from any cashier/terminal
    s.on('pos:live_activity_updated', (data: { session: LiveBillingSession; activeSessions: LiveBillingSession[] }) => {
      if (Array.isArray(data?.activeSessions)) {
        setActiveSessions(data.activeSessions);
      } else if (data?.session) {
        setActiveSessions(prev => {
          const others = prev.filter(sess => sess.deviceId !== data.session.deviceId);
          return data.session.items && data.session.items.length > 0 ? [...others, data.session] : others;
        });
      }
    });

    // Real-time live cart cleared
    s.on('pos:live_activity_cleared', (data: { deviceId: string; activeSessions: LiveBillingSession[] }) => {
      if (Array.isArray(data?.activeSessions)) {
        setActiveSessions(data.activeSessions);
      } else if (data?.deviceId) {
        setActiveSessions(prev => prev.filter(sess => sess.deviceId !== data.deviceId));
      }
    });

    // Real-time bill completed across any terminal
    s.on('bill:completed', (event: BillCompletedEvent) => {
      setLastCompletedBill(event);
      // Remove any live session matching the device
      if (event.deviceId) {
        setActiveSessions(prev => prev.filter(sess => sess.deviceId !== event.deviceId));
      }
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Update device registration on user change
  useEffect(() => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('register_device', {
        deviceId,
        deviceLabel,
        cashierName: user.name || 'Cashier',
        role: user.role || 'admin'
      });
    }
  }, [user, deviceId, deviceLabel]);

  // Broadcast Cart update
  const emitCartUpdate = useCallback((cartData: Partial<LiveBillingSession> & { sectionId?: number; items: any[]; subtotal: number; grandTotal: number }) => {
    if (!socketRef.current?.connected) return;

    setSyncStatus('syncing');
    socketRef.current.emit('pos:cart_update', {
      ...cartData,
      deviceId,
      deviceLabel,
      cashierName: user?.name || 'Cashier',
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      if (socketRef.current?.connected) {
        setSyncStatus('live');
      }
    }, 300);
  }, [deviceId, deviceLabel, user?.name]);

  // Broadcast Cart clear
  const emitCartClear = useCallback((sectionId?: number) => {
    if (!socketRef.current?.connected) return;

    setSyncStatus('syncing');
    socketRef.current.emit('pos:cart_clear', {
      deviceId,
      sectionId: sectionId || 1
    });

    setTimeout(() => {
      if (socketRef.current?.connected) {
        setSyncStatus('live');
      }
    }, 300);
  }, [deviceId]);

  const onSectionSynced = useCallback((callback: (event: SectionSyncedEvent) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    const handler = (event: SectionSyncedEvent) => callback(event);
    s.on('pos:section_synced', handler);
    return () => {
      s.off('pos:section_synced', handler);
    };
  }, []);

  const onSectionCleared = useCallback((callback: (data: { sectionId: number; clearedByDevice?: string }) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    const handler = (data: { sectionId: number; clearedByDevice?: string }) => callback(data);
    s.on('pos:section_cleared', handler);
    return () => {
      s.off('pos:section_cleared', handler);
    };
  }, []);

  const onStockUpdated = useCallback((callback: (data: any) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    const handler = (data: any) => callback(data);
    s.on('stock:updated', handler);
    return () => {
      s.off('stock:updated', handler);
    };
  }, []);

  const onBillCompleted = useCallback((callback: (event: BillCompletedEvent) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    const handler = (event: BillCompletedEvent) => callback(event);
    s.on('bill:completed', handler);
    return () => {
      s.off('bill:completed', handler);
    };
  }, []);

  const clearCompletedBillNotification = () => {
    setLastCompletedBill(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        syncStatus,
        onlineDeviceCount,
        deviceId,
        deviceLabel,
        setTerminalLabel,
        activeSessions,
        lastCompletedBill,
        clearCompletedBillNotification,
        emitCartUpdate,
        emitCartClear,
        onSectionSynced,
        onSectionCleared,
        onStockUpdated,
        onBillCompleted
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
