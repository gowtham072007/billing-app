const { Server } = require('socket.io');
const db = require('./db/database');

let ioInstance = null;

// Map of connected sockets with device metadata
// Key: socketId, Value: { deviceId, deviceLabel, cashierName, role, connectedAt }
const connectedDevices = new Map();

// Helper: Format raw database draft row into clean section object
function formatDraftRow(row) {
  if (!row) return null;
  let items = [];
  let selectedCustomer = null;

  try {
    items = JSON.parse(row.items_json || '[]');
  } catch (e) {
    items = [];
  }

  try {
    selectedCustomer = row.selected_customer ? JSON.parse(row.selected_customer) : null;
  } catch (e) {
    selectedCustomer = null;
  }

  return {
    id: row.section_id,
    cashierName: row.cashier_name || 'Cashier',
    items,
    selectedCustomer,
    rateMode: row.rate_mode || 'c_rate',
    discount: Number(row.discount) || 0,
    discountType: row.discount_type || 'flat',
    taxPercentage: Number(row.tax_percentage) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    paymentMethod: row.payment_method || 'cash',
    paymentReference: row.payment_reference || '',
    subtotal: Number(row.subtotal) || 0,
    grandTotal: Number(row.grand_total) || 0,
    updatedByDevice: row.updated_by_device || 'Unknown',
    updatedAt: row.updated_at
  };
}

// Helper: Fetch all active draft sessions from SQLite database
function getDbDraftSessions() {
  try {
    const rows = db.prepare('SELECT * FROM pos_draft_bills ORDER BY section_id ASC').all();
    return rows.map(formatDraftRow);
  } catch (err) {
    console.error('Failed to load POS draft sessions from DB:', err);
    return [];
  }
}

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

      const allDrafts = getDbDraftSessions();

      // Send initial state to newly connected client: database-backed active drafts & online device count
      socket.emit('sync:initial_state', {
        activeSessions: allDrafts,
        onlineDeviceCount: connectedDevices.size
      });

      // Broadcast device list count update
      io.emit('devices:count', {
        count: connectedDevices.size,
        devices: Array.from(connectedDevices.values())
      });
    });

    // 2. Real-Time POS Cart Update (Persistent in SQLite & Broadcast to all devices)
    socket.on('pos:cart_update', (cartData) => {
      if (!cartData || !cartData.deviceId) return;

      const sectionId = Number(cartData.sectionId) || 1;
      const cashierName = cartData.cashierName || 'Cashier';
      const items = Array.isArray(cartData.items) ? cartData.items : [];
      const selectedCustomer = cartData.selectedCustomer || null;
      const rateMode = cartData.rateMode || 'c_rate';
      const discount = Number(cartData.discount) || 0;
      const discountType = cartData.discountType || 'flat';
      const taxPercentage = Number(cartData.taxPercentage) || 0;
      const taxAmount = Number(cartData.taxAmount) || 0;
      const subtotal = Number(cartData.subtotal) || 0;
      const grandTotal = Number(cartData.grandTotal) || 0;
      const paymentMethod = cartData.paymentMethod || 'cash';
      const paymentReference = cartData.paymentReference || '';
      const deviceId = cartData.deviceId;

      try {
        if (items.length > 0) {
          const itemsJson = JSON.stringify(items);
          const customerJson = selectedCustomer ? JSON.stringify(selectedCustomer) : null;

          const stmt = db.prepare(`
            INSERT INTO pos_draft_bills (
              section_id, cashier_name, selected_customer, rate_mode,
              discount, discount_type, tax_percentage, tax_amount,
              payment_method, payment_reference, subtotal, grand_total,
              items_json, updated_by_device, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(section_id) DO UPDATE SET
              cashier_name = excluded.cashier_name,
              selected_customer = excluded.selected_customer,
              rate_mode = excluded.rate_mode,
              discount = excluded.discount,
              discount_type = excluded.discount_type,
              tax_percentage = excluded.tax_percentage,
              tax_amount = excluded.tax_amount,
              payment_method = excluded.payment_method,
              payment_reference = excluded.payment_reference,
              subtotal = excluded.subtotal,
              grand_total = excluded.grand_total,
              items_json = excluded.items_json,
              updated_by_device = excluded.updated_by_device,
              updated_at = CURRENT_TIMESTAMP
          `);

          stmt.run(
            sectionId,
            cashierName,
            customerJson,
            rateMode,
            discount,
            discountType,
            taxPercentage,
            taxAmount,
            paymentMethod,
            paymentReference,
            subtotal,
            grandTotal,
            itemsJson,
            deviceId
          );
        } else {
          db.prepare('DELETE FROM pos_draft_bills WHERE section_id = ?').run(sectionId);
        }
      } catch (err) {
        console.error('Error persisting POS draft cart in DB:', err);
      }

      const allDrafts = getDbDraftSessions();
      const updatedSection = allDrafts.find(d => d.id === sectionId) || {
        id: sectionId,
        cashierName,
        items,
        selectedCustomer,
        rateMode,
        discount,
        discountType,
        taxPercentage,
        taxAmount,
        subtotal,
        grandTotal,
        paymentMethod,
        paymentReference,
        updatedByDevice: deviceId,
        updatedAt: new Date().toISOString()
      };

      // 1. Broadcast section sync to other POS Billing instances (Mobile / Laptop / Desktop)
      io.emit('pos:section_synced', {
        section: updatedSection,
        updatedByDevice: deviceId,
        timestamp: new Date().toISOString()
      });

      // 2. Broadcast live monitor update for Admin Dashboard
      io.emit('pos:live_activity_updated', {
        session: {
          deviceId,
          deviceLabel: cartData.deviceLabel || 'POS Terminal',
          cashierName,
          sectionId,
          items,
          itemCount: items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0),
          subtotal,
          discount,
          discountType,
          taxPercentage,
          taxAmount,
          grandTotal,
          selectedCustomer,
          paymentMethod,
          rateMode,
          status: items.length > 0 ? 'active' : 'empty',
          updatedAt: new Date().toISOString()
        },
        activeSessions: allDrafts
      });
    });

    // 3. Real-Time POS Clear Cart
    socket.on('pos:cart_clear', ({ deviceId, sectionId }) => {
      const secId = Number(sectionId) || 1;
      try {
        db.prepare('DELETE FROM pos_draft_bills WHERE section_id = ?').run(secId);
      } catch (err) {
        console.error('Error clearing POS draft cart from DB:', err);
      }

      const allDrafts = getDbDraftSessions();

      // Broadcast section cleared to all POS billing pages
      io.emit('pos:section_cleared', {
        sectionId: secId,
        clearedByDevice: deviceId,
        timestamp: new Date().toISOString()
      });

      // Broadcast live monitor cleared for Admin Dashboard
      io.emit('pos:live_activity_cleared', {
        deviceId,
        sectionId: secId,
        activeSessions: allDrafts
      });
    });

    // 4. Disconnect Handler
    socket.on('disconnect', () => {
      connectedDevices.delete(socket.id);

      io.emit('devices:count', {
        count: connectedDevices.size,
        devices: Array.from(connectedDevices.values())
      });
    });
  });

  console.log('⚡ Socket.IO Real-Time Server initialized successfully with Shared SQLite Draft Persistence.');
  return io;
}

// Helpers for broadcasting from REST API controllers
function getIO() {
  return ioInstance;
}

function broadcastBillCompleted(payload) {
  if (!ioInstance) return;

  // If sectionId is provided, clear that draft from SQLite
  if (payload.sectionId) {
    try {
      db.prepare('DELETE FROM pos_draft_bills WHERE section_id = ?').run(Number(payload.sectionId));
    } catch (e) {}
  }

  const allDrafts = getDbDraftSessions();

  if (payload.sectionId) {
    ioInstance.emit('pos:section_cleared', {
      sectionId: Number(payload.sectionId),
      clearedByDevice: payload.deviceId || 'POS-Terminal',
      timestamp: new Date().toISOString()
    });
  }

  ioInstance.emit('bill:completed', {
    ...payload,
    activeSessions: allDrafts,
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
  getDbDraftSessions
};

