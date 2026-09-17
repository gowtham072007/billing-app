const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers (Admin only)
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { q } = req.query;

    let query = `
      SELECT 
        c.id, c.user_id, c.name, c.phone, c.email, c.address, c.created_at,
        COALESCE(u.status, 'active') as account_status,
        (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as total_orders,
        (SELECT COALESCE(SUM(grand_total), 0) FROM bills WHERE customer_id = c.id) as total_spent,
        (SELECT MAX(created_at) FROM bills WHERE customer_id = c.id) as last_bill_date,
        (SELECT MAX(created_at) FROM orders WHERE customer_id = c.id) as last_order_date
      FROM customers c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      const term = `%${q.trim()}%`;
      query += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      params.push(term, term, term);
    }

    query += ' ORDER BY c.created_at DESC';

    const customers = db.prepare(query).all(...params);

    res.json({ customers });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/me/dashboard (Logged-in Customer Dashboard)
router.get('/me/dashboard', authenticateToken, (req, res, next) => {
  try {
    const userId = req.user.id;
    const userPhone = req.user.phone;

    // Find customer record by user_id or phone
    let customer = db.prepare('SELECT * FROM customers WHERE user_id = ?').get(userId);
    if (!customer && userPhone) {
      customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(userPhone);
      if (customer && !customer.user_id) {
        db.prepare('UPDATE customers SET user_id = ? WHERE id = ?').run(userId, customer.id);
      }
    }

    if (!customer) {
      // Auto-create customer entry if user registered but customer record not created yet
      const ins = db.prepare(`
        INSERT INTO customers (user_id, name, phone, email)
        VALUES (?, ?, ?, ?)
      `).run(userId, req.user.name, req.user.phone, req.user.email || null);
      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(ins.lastInsertRowid);
    }

    const customerId = customer.id;

    // 1. Calculate Customer Stats
    const statsQuery = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE customer_id = ?) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE customer_id = ? AND status IN ('pending', 'accepted', 'preparing', 'ready')) as active_orders,
        (SELECT COUNT(*) FROM orders WHERE customer_id = ? AND status = 'completed') as completed_orders,
        (SELECT COUNT(*) FROM bills WHERE customer_id = ?) as total_bills,
        (SELECT COALESCE(SUM(grand_total), 0) FROM bills WHERE customer_id = ?) as total_spent
    `).get(customerId, customerId, customerId, customerId, customerId);

    // 2. Recent Orders (with items count & summary)
    const recentOrders = db.prepare(`
      SELECT 
        o.id, o.order_number, o.total_amount, o.status, o.created_at, o.notes,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
        (SELECT GROUP_CONCAT(COALESCE(NULLIF(oi.product_name_tamil, ''), oi.product_name) || ' (' || oi.quantity || ' ' || oi.unit || ')', ', ')
         FROM order_items oi WHERE oi.order_id = o.id) as items_summary
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 5
    `).all(customerId);

    // 3. Recent Bills / Invoices (with items count & summary)
    const recentBills = db.prepare(`
      SELECT 
        b.id, b.bill_number, b.grand_total, b.subtotal, b.discount, b.tax, b.payment_method, b.created_at,
        (SELECT COUNT(*) FROM bill_items WHERE bill_id = b.id) as item_count,
        (SELECT GROUP_CONCAT(COALESCE(NULLIF(bi.product_name_tamil, ''), bi.product_name) || ' (' || bi.quantity || ' ' || bi.unit || ')', ', ')
         FROM bill_items bi WHERE bi.bill_id = b.id) as items_summary
      FROM bills b
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
      LIMIT 5
    `).all(customerId);

    // 4. Frequently Purchased or Featured Products for Quick Re-Order
    const popularProducts = db.prepare(`
      SELECT 
        p.id, p.name, p.name_tamil, p.category, p.sku, p.selling_price, p.stock, p.unit, p.image,
        COALESCE(
          (SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id AND o.customer_id = ?),
          0
        ) as times_ordered
      FROM products p
      WHERE p.status = 'active'
      ORDER BY times_ordered DESC, p.stock DESC
      LIMIT 6
    `).all(customerId);

    res.json({
      customer,
      stats: {
        total_orders: statsQuery.total_orders || 0,
        active_orders: statsQuery.active_orders || 0,
        completed_orders: statsQuery.completed_orders || 0,
        total_bills: statsQuery.total_bills || 0,
        total_spent: statsQuery.total_spent || 0,
      },
      recent_orders: recentOrders,
      recent_bills: recentBills,
      popular_products: popularProducts,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/me/profile (Customer update own profile & address)
router.put('/me/profile', authenticateToken, (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, address, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const cleanName = name.trim();
    const cleanAddress = address ? address.trim() : null;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Update users table
    db.prepare(`
      UPDATE users SET
        name = ?,
        email = COALESCE(?, email)
      WHERE id = ?
    `).run(cleanName, cleanEmail, userId);

    // Update customers table
    db.prepare(`
      UPDATE customers SET
        name = ?,
        address = ?,
        email = COALESCE(?, email)
      WHERE user_id = ?
    `).run(cleanName, cleanAddress, cleanEmail, userId);

    const updated = db.prepare('SELECT * FROM customers WHERE user_id = ?').get(userId);

    res.json({
      message: 'Profile updated successfully.',
      customer: updated,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id (Admin or Owner)
router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const id = req.params.id;

    // Check customer access
    if (req.user.role === 'customer') {
      const ownCustomer = db.prepare('SELECT id FROM customers WHERE user_id = ?').get(req.user.id);
      if (!ownCustomer || ownCustomer.id != id) {
        return res.status(403).json({ error: 'Access denied to this customer profile.' });
      }
    }

    const customer = db.prepare(`
      SELECT 
        c.id, c.user_id, c.name, c.phone, c.email, c.address, c.created_at,
        COALESCE(u.status, 'active') as account_status,
        (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as total_orders,
        (SELECT COALESCE(SUM(grand_total), 0) FROM bills WHERE customer_id = c.id) as total_spent,
        (SELECT MAX(created_at) FROM bills WHERE customer_id = c.id) as last_bill_date
      FROM customers c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
    `).get(id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Customer orders
    const orders = db.prepare(`
      SELECT id, order_number, total_amount, status, created_at
      FROM orders
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `).all(id);

    // Customer bills
    const bills = db.prepare(`
      SELECT id, bill_number, grand_total, payment_method, created_at
      FROM bills
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `).all(id);

    res.json({ customer, orders, bills });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers (Admin quick-add or POS customer create)
router.post('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and mobile phone are required.' });
    }

    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Check if customer already exists with this phone
    const existing = db.prepare('SELECT id, name, phone FROM customers WHERE phone = ?').get(cleanPhone);
    if (existing) {
      return res.status(400).json({
        error: `Customer "${existing.name}" with phone number ${cleanPhone} already exists.`,
        existing_customer: existing
      });
    }

    const stmt = db.prepare(`
      INSERT INTO customers (name, phone, email, address)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(cleanName, cleanPhone, cleanEmail, address ? address.trim() : null);

    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Customer added successfully.',
      customer: newCustomer
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const id = req.params.id;
    const { name, phone, email, address } = req.body;

    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const cleanPhone = phone ? phone.trim() : existing.phone;
    const cleanName = name ? name.trim() : existing.name;
    const cleanEmail = email !== undefined ? (email ? email.trim().toLowerCase() : null) : existing.email;
    const cleanAddress = address !== undefined ? (address ? address.trim() : null) : existing.address;

    db.prepare(`
      UPDATE customers SET
        name = ?,
        phone = ?,
        email = ?,
        address = ?
      WHERE id = ?
    `).run(cleanName, cleanPhone, cleanEmail, cleanAddress, id);

    // If linked to user table, update user name/phone/email too
    if (existing.user_id) {
      db.prepare(`
        UPDATE users SET
          name = ?,
          phone = ?,
          email = ?
        WHERE id = ?
      `).run(cleanName, cleanPhone, cleanEmail, existing.user_id);
    }

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    res.json({
      message: 'Customer profile updated successfully.',
      customer: updated
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/customers/:id/status (Admin disable/enable)
router.patch('/:id/status', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "active" or "disabled".' });
    }

    const customer = db.prepare('SELECT user_id FROM customers WHERE id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    if (customer.user_id) {
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, customer.user_id);
    }

    res.json({ message: `Customer account status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
