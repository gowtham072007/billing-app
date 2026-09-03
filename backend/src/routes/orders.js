const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: Generate next order number
function getNextOrderNumber() {
  const lastOrder = db.prepare('SELECT order_number FROM orders ORDER BY id DESC LIMIT 1').get();
  if (!lastOrder || !lastOrder.order_number.startsWith('ORD-')) {
    return 'ORD-1001';
  }
  const currentNum = parseInt(lastOrder.order_number.replace('ORD-', ''), 10);
  return `ORD-${isNaN(currentNum) ? 1001 : currentNum + 1}`;
}

// GET /api/orders
router.get('/', authenticateToken, (req, res, next) => {
  try {
    const { status, limit = 100 } = req.query;

    let query = `
      SELECT 
        o.id, o.order_number, o.customer_id, o.customer_name, o.customer_phone,
        o.delivery_address, o.notes, o.subtotal, o.tax, o.total_amount,
        o.status, o.created_at, o.updated_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
        (SELECT GROUP_CONCAT(COALESCE(NULLIF(oi.product_name_tamil, ''), p.name_tamil, oi.product_name) || ' (' || oi.quantity || ' ' || oi.unit || ')', ', ') 
         FROM order_items oi 
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE order_id = o.id) as items_summary
      FROM orders o
      WHERE 1=1
    `;
    const params = [];

    // If customer, restrict to own orders
    if (req.user.role === 'customer') {
      const cust = db.prepare('SELECT id FROM customers WHERE user_id = ?').get(req.user.id);
      if (!cust) {
        return res.json({ orders: [] });
      }
      query += ' AND o.customer_id = ?';
      params.push(cust.id);
    }

    if (status && status !== 'all') {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ?';
    params.push(Number(limit) || 100);

    const orders = db.prepare(query).all(...params);

    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id/receipt (Printable bill receipt representation for customer orders)
router.get('/:id/receipt', authenticateToken, (req, res, next) => {
  try {
    const id = req.params.id;

    const order = db.prepare(`
      SELECT 
        o.id, o.order_number, o.customer_id, o.customer_name, o.customer_phone,
        o.delivery_address, o.notes, o.subtotal, o.tax, o.total_amount,
        o.status, o.created_at, o.updated_at
      FROM orders o
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Role check: customer can only view own order
    if (req.user.role === 'customer') {
      const cust = db.prepare('SELECT id FROM customers WHERE user_id = ?').get(req.user.id);
      if (!cust || order.customer_id !== cust.id) {
        return res.status(403).json({ error: 'Access denied to this order.' });
      }
    }

    // Check if an official bill was generated from this order
    const linkedBill = db.prepare('SELECT * FROM bills WHERE order_id = ?').get(order.id);

    const items = db.prepare(`
      SELECT 
        oi.id, oi.product_id, oi.product_name, 
        COALESCE(NULLIF(oi.product_name_tamil, ''), p.name_tamil, oi.product_name) as product_name_tamil,
        oi.quantity, oi.unit, oi.price, oi.total,
        p.sku
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(order.id);

    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    settingsRows.forEach(row => { settings[row.key] = row.value; });

    // Format as Bill object for ThermalReceipt rendering
    const receiptBill = linkedBill || {
      id: order.id,
      bill_number: order.order_number,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      subtotal: order.subtotal,
      discount: 0,
      discount_type: 'flat',
      tax: order.tax || 0,
      tax_percentage: 0,
      grand_total: order.total_amount,
      payment_method: order.status === 'completed' ? 'PAID / COMPLETED' : 'CUSTOMER ORDER',
      payment_reference: order.delivery_address ? `Delivery: ${order.delivery_address}` : 'Store Pickup',
      created_at: order.created_at
    };

    res.json({ bill: receiptBill, items, settings });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const id = req.params.id;

    const order = db.prepare(`
      SELECT 
        o.id, o.order_number, o.customer_id, o.customer_name, o.customer_phone,
        o.delivery_address, o.notes, o.subtotal, o.tax, o.total_amount,
        o.status, o.created_at, o.updated_at
      FROM orders o
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Role check: customer can only view own order
    if (req.user.role === 'customer') {
      const cust = db.prepare('SELECT id FROM customers WHERE user_id = ?').get(req.user.id);
      if (!cust || order.customer_id !== cust.id) {
        return res.status(403).json({ error: 'Access denied to this order.' });
      }
    }

    const items = db.prepare(`
      SELECT 
        oi.id, oi.product_id, oi.product_name, 
        COALESCE(NULLIF(oi.product_name_tamil, ''), p.name_tamil, oi.product_name) as product_name_tamil,
        oi.quantity, oi.unit, oi.price, oi.total,
        p.image, p.sku, p.stock as available_stock
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(id);

    res.json({ order, items });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders (Customer creates order)
router.post('/', authenticateToken, (req, res, next) => {
  try {
    const { items, delivery_address, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Please add items to place an order.' });
    }

    // Get customer profile
    let customer = null;
    if (req.user.role === 'customer') {
      customer = db.prepare('SELECT * FROM customers WHERE user_id = ?').get(req.user.id);
    }

    const customerName = customer ? customer.name : req.user.name;
    const customerPhone = customer ? customer.phone : req.user.phone;
    const customerId = customer ? customer.id : null;
    const address = delivery_address || (customer ? customer.address : null);

    // Validate products and calculate totals
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = db.prepare('SELECT id, name, name_tamil, selling_price, stock, unit, status FROM products WHERE id = ?').get(item.product_id);
      if (!prod || prod.status !== 'active') {
        return res.status(400).json({ error: `Product "${item.product_name || 'Selected item'}" is currently unavailable.` });
      }

      const qty = Number(item.quantity) || 1;
      if (qty <= 0) {
        return res.status(400).json({ error: `Invalid quantity for ${prod.name}.` });
      }

      if (qty > prod.stock) {
        return res.status(400).json({
          error: `Insufficient stock for "${prod.name}". Available stock is only ${prod.stock} ${prod.unit}.`
        });
      }

      const lineTotal = prod.selling_price * qty;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        product_id: prod.id,
        product_name: prod.name,
        product_name_tamil: prod.name_tamil || null,
        quantity: qty,
        unit: prod.unit,
        price: prod.selling_price,
        total: lineTotal
      });
    }

    const totalAmount = calculatedSubtotal;
    const orderNumber = getNextOrderNumber();

    const tx = db.transaction(() => {
      const orderStmt = db.prepare(`
        INSERT INTO orders (
          order_number, customer_id, customer_name, customer_phone, delivery_address, notes,
          subtotal, tax, total_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending')
      `);

      const result = orderStmt.run(
        orderNumber,
        customerId,
        customerName,
        customerPhone,
        address,
        notes ? notes.trim() : null,
        calculatedSubtotal,
        totalAmount
      );

      const orderId = result.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_name_tamil, quantity, unit, price, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of validatedItems) {
        itemStmt.run(
          orderId,
          item.product_id,
          item.product_name,
          item.product_name_tamil,
          item.quantity,
          item.unit,
          item.price,
          item.total
        );
      }

      return orderId;
    });

    const orderId = tx();
    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const createdItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.status(201).json({
      message: 'Order placed successfully!',
      order: createdOrder,
      items: createdItems
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status (Admin updates order status)
router.patch('/:id/status', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` });
    }

    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json({ message: `Order status updated to "${status}".`, order: updated });
  } catch (err) {
    next(err);
  }
});

// Fulfill Order logic handler
function fulfillOrderHandler(req, res, next) {
  try {
    const orderId = req.params.id;
    const { payment_method = 'cash', payment_reference } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status === 'completed') {
      // Return existing linked bill if already completed
      const existingBill = db.prepare('SELECT * FROM bills WHERE order_id = ?').get(order.id);
      if (existingBill) {
        const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(existingBill.id);
        return res.json({
          message: 'Order was already completed.',
          bill: existingBill,
          bill_id: existingBill.id,
          bill_number: existingBill.bill_number,
          items
        });
      }
    }

    const items = db.prepare(`
      SELECT oi.*, p.name_tamil, p.stock as current_stock, p.sku, p.status as prod_status
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(orderId);

    // Validate stock for all items
    for (const item of items) {
      if (item.current_stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${item.product_name}". Available: ${item.current_stock}, Required: ${item.quantity}.`
        });
      }
    }

    // Generate Invoice Number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `INV-${year}${month}${day}`;

    const lastBill = db.prepare(`
      SELECT bill_number FROM bills 
      WHERE bill_number LIKE ? 
      ORDER BY id DESC LIMIT 1
    `).get(`${datePrefix}%`);

    let billNumber = `${datePrefix}-001`;
    if (lastBill) {
      const parts = lastBill.bill_number.split('-');
      const seq = parseInt(parts[2], 10);
      const nextSeq = isNaN(seq) ? 1 : seq + 1;
      billNumber = `${datePrefix}-${String(nextSeq).padStart(3, '0')}`;
    }

    const tx = db.transaction(() => {
      // 1. Insert into Bills
      const billStmt = db.prepare(`
        INSERT INTO bills (
          bill_number, customer_id, customer_name, customer_phone,
          subtotal, discount, discount_type, tax, tax_percentage, grand_total,
          payment_method, payment_reference, order_id
        ) VALUES (?, ?, ?, ?, ?, 0, 'flat', 0, 0, ?, ?, ?, ?)
      `);

      const billRes = billStmt.run(
        billNumber,
        order.customer_id,
        order.customer_name,
        order.customer_phone,
        order.subtotal,
        order.total_amount,
        payment_method,
        payment_reference || `Fulfilled from Order #${order.order_number}`,
        order.id
      );

      const billId = billRes.lastInsertRowid;

      // 2. Insert Bill Items & Decrement Stock & Add Audit
      const billItemStmt = db.prepare(`
        INSERT INTO bill_items (
          bill_id, product_id, product_name, product_name_tamil, sku, unit, quantity, price, rate_type, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'c_rate', ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE products 
        SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      const insertStockTxStmt = db.prepare(`
        INSERT INTO stock_transactions (
          product_id, product_name, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, admin_name
        ) VALUES (?, ?, 'ORDER_FULFILL', ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const tamilName = item.product_name_tamil || item.name_tamil || null;
        billItemStmt.run(
          billId,
          item.product_id,
          item.product_name,
          tamilName,
          item.sku || 'N/A',
          item.unit,
          item.quantity,
          item.price,
          item.total
        );

        updateStockStmt.run(item.quantity, item.product_id);

        const newStock = item.current_stock - item.quantity;
        insertStockTxStmt.run(
          item.product_id,
          item.product_name,
          item.quantity,
          item.current_stock,
          newStock,
          billNumber,
          `Order #${order.order_number} -> Bill #${billNumber}`,
          req.user.name || 'Admin'
        );
      }

      // 3. Mark Order as Completed
      db.prepare(`
        UPDATE orders 
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(order.id);

      return { billId, billNumber };
    });

    const result = tx();

    const createdBill = db.prepare('SELECT * FROM bills WHERE id = ?').get(result.billId);
    const createdItems = db.prepare(`
      SELECT 
        bi.id, bi.product_id, bi.product_name,
        COALESCE(NULLIF(bi.product_name_tamil, ''), p.name_tamil, bi.product_name) as product_name_tamil,
        bi.sku, bi.unit, bi.quantity, bi.price, bi.rate_type, bi.total
      FROM bill_items bi
      LEFT JOIN products p ON p.id = bi.product_id
      WHERE bi.bill_id = ?
    `).all(result.billId);

    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    settingsRows.forEach(row => { settings[row.key] = row.value; });

    res.json({
      message: `Order #${order.order_number} successfully fulfilled into Bill #${result.billNumber}!`,
      bill: createdBill,
      bill_id: result.billId,
      bill_number: result.billNumber,
      grand_total: createdBill.grand_total,
      items: createdItems,
      settings
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/orders/:id/fulfill and POST /api/orders/:id/convert-to-bill
router.post('/:id/fulfill', authenticateToken, requireAdmin, fulfillOrderHandler);
router.post('/:id/convert-to-bill', authenticateToken, requireAdmin, fulfillOrderHandler);

module.exports = router;
