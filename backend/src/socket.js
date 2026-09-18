const { Server } = require('socket.io');

let ioInstance = null;

// In-memory store of active POS billing sessions across all devices
// Key: deviceId, Value: { deviceId, deviceLabel, cashierName, sectionId, items, subtotal, discount, taxAmount, grandTotal, customer, paymentMethod, updatedAt }
const activeBillingSessions = new Map();

// Map of connected sockets with device metadata
// Key: socketId, Value: { deviceId, deviceLabel, cashierName, role, connectedAt }
const connectedDevices = new Map();

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    },
    pingInterval: 10000,
    pingTimeout: 5000
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    // 1. Device Registration Handshake
    socket.on('register_device', (deviceInfo) => {
      const deviceId = deviceInfo?.deviceId || socket.id;
      const deviceLabel = deviceInfo?.deviceLabel || 'POS Terminal';
      const cashierName = deviceInfo?.cashierName || 'Cashier';
      const role = deviceInfo?.role || 'admin';

      connectedDevices.set(socket.id, {
        socketId: socket.id,
        deviceId,
        deviceLabel,
        cashierName,
        role,
        connectedAt: new Date().toISOString()
      });

      // Send initial state to newly connected client: active billing sessions & online device count
      socket.emit('sync:initial_state', {
        activeSessions: Array.from(activeBillingSessions.values()),
        onlineDeviceCount: connectedDevices.size
      });

      // Broadcast device list count update
      io.emit('devices:count', {
        count: connectedDevices.size,
        devices: Array.from(connectedDevices.values())
      });
    });

    // 2. POS Live Cart Update from Cashier Terminal
    socket.on('pos:cart_update', (cartData) => {
      if (!cartData || !cartData.deviceId) return;

      const session = {
        deviceId: cartData.deviceId,
        deviceLabel: cartData.deviceLabel || 'POS Terminal',
        cashierName: cartData.cashierName || 'Cashier',
        sectionId: cartData.sectionId || 1,
        items: Array.isArray(cartData.items) ? cartData.items : [],
        itemCount: Array.isArray(cartData.items) ? cartData.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) : 0,
        subtotal: Number(cartData.subtotal) || 0,
        discount: Number(cartData.discount) || 0,
        discountType: cartData.discountType || 'flat',
        taxPercentage: Number(cartData.taxPercentage) || 0,
        taxAmount: Number(cartData.taxAmount) || 0,
        grandTotal: Number(cartData.grandTotal) || 0,
        selectedCustomer: cartData.selectedCustomer || null,
        paymentMethod: cartData.paymentMethod || 'cash',
        rateMode: cartData.rateMode || 'c_rate',
        status: cartData.items?.length > 0 ? 'active' : 'empty',
        updatedAt: new Date().toISOString()
      };

      if (session.items.length > 0) {
        activeBillingSessions.set(session.deviceId, session);
      } else {
        activeBillingSessions.delete(session.deviceId);
      }

      // Broadcast to all other devices (Admin Dashboards and other terminals)
      io.emit('pos:live_activity_updated', {
        session,
        activeSessions: Array.from(activeBillingSessions.values())
      });
    });

    // 3. POS Clear Cart
    socket.on('pos:cart_clear', ({ deviceId, sectionId }) => {
      if (deviceId) {
        activeBillingSessions.delete(deviceId);
      }
      io.emit('pos:live_activity_cleared', {
        deviceId,
        sectionId,
        activeSessions: Array.from(activeBillingSessions.values())
      });
    });

    // 4. Disconnect Handler
    socket.on('disconnect', () => {
      const dev = connectedDevices.get(socket.id);
      connectedDevices.delete(socket.id);

      // If this device had an active cart, remove it
      if (dev && dev.deviceId) {
        activeBillingSessions.delete(dev.deviceId);
        io.emit('pos:live_activity_cleared', {
          deviceId: dev.deviceId,
          activeSessions: Array.from(activeBillingSessions.values())
        });
      }

      io.emit('devices:count', {
        count: connectedDevices.size,
        devices: Array.from(connectedDevices.values())
      });
    });
  });

  console.log('⚡ Socket.IO Real-Time Server initialized successfully.');
  return io;
}

// Helpers for broadcasting from REST API controllers
function getIO() {
  return ioInstance;
}

function broadcastBillCompleted(payload) {
  if (!ioInstance) return;

  // Clear live cart session for the device that submitted this bill if present
  if (payload.deviceId) {
    activeBillingSessions.delete(payload.deviceId);
  }

  ioInstance.emit('bill:completed', {
    ...payload,
    activeSessions: Array.from(activeBillingSessions.values()),
    timestamp: new Date().toISOString()
  });
}

function broadcastStockUpdated(payload) {
  if (!ioInstance) return;
  ioInstance.emit('stock:updated', {
    ...payload,
    timestamp: new Date().toISOString()
  });
}

function broadcastOrderUpdated(payload) {
  if (!ioInstance) return;
  ioInstance.emit('orders:updated', {
    ...payload,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  initSocket,
  getIO,
  broadcastBillCompleted,
  broadcastStockUpdated,
  broadcastOrderUpdated,
  activeBillingSessions
};
