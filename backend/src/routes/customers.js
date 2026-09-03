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
