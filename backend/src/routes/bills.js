const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: Generate unique invoice number
function generateBillNumber() {
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

  if (!lastBill) {
    return `${datePrefix}-001`;
  }

  const parts = lastBill.bill_number.split('-');
  const seq = parseInt(parts[2], 10);
  const nextSeq = isNaN(seq) ? 1 : seq + 1;
  return `${datePrefix}-${String(nextSeq).padStart(3, '0')}`;
}

// GET /api/bills (Admin only)
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { date, payment_method, q, limit = 200 } = req.query;

    let query = `
      SELECT 
        b.id, b.bill_number, b.customer_id, b.customer_name, b.customer_phone,
        b.subtotal, b.discount, b.discount_type, b.tax, b.tax_percentage,
        b.grand_total, b.payment_method, b.payment_reference, b.order_id,
        b.created_at,
        (SELECT COUNT(*) FROM bill_items WHERE bill_id = b.id) as item_count,
        (SELECT GROUP_CONCAT(COALESCE(NULLIF(bi.product_name_tamil, ''), p.name_tamil, bi.product_name) || ' x' || bi.quantity, ', ') 
         FROM bill_items bi
         LEFT JOIN products p ON p.id = bi.product_id
         WHERE bi.bill_id = b.id) as items_summary
      FROM bills b
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND DATE(b.created_at) = DATE(?)';
      params.push(date);
    }

    if (payment_method && payment_method !== 'all') {
      query += ' AND b.payment_method = ?';
      params.push(payment_method);
    }

    if (q) {
      const term = `%${q.trim()}%`;
      query += ' AND (b.bill_number LIKE ? OR b.customer_name LIKE ? OR b.customer_phone LIKE ?)';
      params.push(term, term, term);
    }

    query += ' ORDER BY b.created_at DESC LIMIT ?';
    params.push(Number(limit) || 200);

    const bills = db.prepare(query).all(...params);

    // Calculate Summary metrics
    let summaryQuery = `
      SELECT 
        COUNT(*) as total_bills,
        COALESCE(SUM(grand_total), 0) as total_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN grand_total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN grand_total ELSE 0 END), 0) as upi_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN grand_total ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'other' THEN grand_total ELSE 0 END), 0) as other_sales,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(SUM(tax), 0) as total_tax
      FROM bills b
      WHERE 1=1
    `;
    const summaryParams = [];

    if (date) {
      summaryQuery += ' AND DATE(b.created_at) = DATE(?)';
      summaryParams.push(date);
    }

    if (payment_method && payment_method !== 'all') {
      summaryQuery += ' AND b.payment_method = ?';
      summaryParams.push(payment_method);
    }

    if (q) {
      const term = `%${q.trim()}%`;
      summaryQuery += ' AND (b.bill_number LIKE ? OR b.customer_name LIKE ? OR b.customer_phone LIKE ?)';
      summaryParams.push(term, term, term);
    }

    const summary = db.prepare(summaryQuery).get(...summaryParams);

    res.json({ bills, summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/bills/:id (Get complete Bill details + items with Tamil Names for thermal receipt printing)
router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const id = req.params.id;

    const bill = db.prepare(`
      SELECT 
        b.id, b.bill_number, b.customer_id, b.customer_name, b.customer_phone,
        b.subtotal, b.discount, b.discount_type, b.tax, b.tax_percentage,
        b.grand_total, b.payment_method, b.payment_reference, b.order_id,
        b.created_at
      FROM bills b
      WHERE b.id = ? OR b.bill_number = ?
    `).get(id, id);

    if (!bill) {
      return res.status(404).json({ error: 'Bill invoice not found.' });
    }

    // Role check: customer can only view own bills
    if (req.user.role === 'customer') {
      const cust = db.prepare('SELECT id FROM customers WHERE user_id = ?').get(req.user.id);
      if (!cust || bill.customer_id !== cust.id) {
        return res.status(403).json({ error: 'Access denied to this bill invoice.' });
      }
    }

    const items = db.prepare(`
      SELECT 
        bi.id, bi.product_id, bi.product_name, 
        COALESCE(NULLIF(bi.product_name_tamil, ''), p.name_tamil, bi.product_name) as product_name_tamil,
        bi.sku, bi.unit, bi.quantity, bi.price, bi.rate_type, bi.total
      FROM bill_items bi
      LEFT JOIN products p ON p.id = bi.product_id
      WHERE bi.bill_id = ?
    `).all(bill.id);

    // Fetch Shop Settings for thermal receipt header & footer
    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    settingsRows.forEach(row => { settings[row.key] = row.value; });

    res.json({ bill, items, settings });
  } catch (err) {
    next(err);
  }
});

// POST /api/bills (POS Billing - Create Bill with Tamil Names & Atomic Stock Reduction)
router.post('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const {
      customer_id,
      customer_name,
      customer_phone,
      items,
      discount = 0,
      discount_type = 'flat',
      tax_percentage = 0,
      payment_method = 'cash',
      payment_reference
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Bill must contain at least one item.' });
    }

    // Validate each item and check live stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = db.prepare('SELECT id, name, name_tamil, sku, unit, selling_price, w_rate, c_rate, stock, status FROM products WHERE id = ?').get(item.product_id);
      if (!prod) {
        return res.status(400).json({ error: `Product ID #${item.product_id} not found.` });
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: `Please enter a valid quantity for "${prod.name}".` });
      }

      if (qty > prod.stock) {
        return res.status(400).json({
          error: `Insufficient stock for "${prod.name}". Available stock is ${prod.stock} ${prod.unit}, but bill requests ${qty} ${prod.unit}.`
        });
      }

      const rateType = item.rate_type === 'w_rate' ? 'w_rate' : 'c_rate';
      const defaultPrice = rateType === 'w_rate' ? (prod.w_rate || prod.selling_price) : (prod.c_rate || prod.selling_price);
      const price = item.price !== undefined ? Number(item.price) : defaultPrice;
      const lineTotal = price * qty;
      subtotal += lineTotal;

      const resolvedTamilName = item.product_name_tamil || prod.name_tamil || prod.name;

      validatedItems.push({
        product_id: prod.id,
        product_name: prod.name,
        product_name_tamil: resolvedTamilName,
        sku: prod.sku,
        unit: prod.unit,
        quantity: qty,
        price,
        rate_type: rateType,
        total: lineTotal,
        current_stock: prod.stock
      });
    }

    // Calculations
    let discountAmount = 0;
    if (discount_type === 'percentage') {
      discountAmount = (subtotal * (Number(discount) || 0)) / 100;
    } else {
      discountAmount = Number(discount) || 0;
    }
    discountAmount = Math.min(discountAmount, subtotal);

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxRate = Number(tax_percentage) || 0;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const grandTotal = Math.round(taxableAmount + taxAmount);

    const billNumber = generateBillNumber();

    // Atomic Database Transaction
    const tx = db.transaction(() => {
      // 1. Insert Bill
      const billStmt = db.prepare(`
        INSERT INTO bills (
          bill_number, customer_id, customer_name, customer_phone,
          subtotal, discount, discount_type, tax, tax_percentage, grand_total,
          payment_method, payment_reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const billRes = billStmt.run(
        billNumber,
        customer_id || null,
        customer_name ? customer_name.trim() : 'Walk-in Customer',
        customer_phone ? customer_phone.trim() : null,
        subtotal,
        discountAmount,
        discount_type,
        taxAmount,
        taxRate,
        grandTotal,
        payment_method,
        payment_reference ? payment_reference.trim() : null
      );

      const billId = billRes.lastInsertRowid;

      // 2. Insert Bill Items with Tamil Names & Decrement Stock
      const insertItemStmt = db.prepare(`
        INSERT INTO bill_items (
          bill_id, product_id, product_name, product_name_tamil, sku, unit, quantity, price, rate_type, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE products 
        SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      const insertStockTxStmt = db.prepare(`
        INSERT INTO stock_transactions (
          product_id, product_name, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, admin_name
        ) VALUES (?, ?, 'BILL_SALE', ?, ?, ?, ?, ?, ?)
      `);

      for (const vi of validatedItems) {
        insertItemStmt.run(
          billId,
          vi.product_id,
          vi.product_name,
          vi.product_name_tamil,
          vi.sku,
          vi.unit,
          vi.quantity,
          vi.price,
          vi.rate_type,
          vi.total
        );
        updateStockStmt.run(vi.quantity, vi.product_id);

        const newStock = vi.current_stock - vi.quantity;
        insertStockTxStmt.run(
          vi.product_id,
          vi.product_name,
          vi.quantity,
          vi.current_stock,
          newStock,
          billNumber,
          `POS Bill #${billNumber}`,
          req.user.name || 'Admin'
        );
      }

      return { billId, billNumber, grandTotal };
    });

    const result = tx();

    // Fetch complete bill with items to return for instant thermal receipt generation
    const completedBill = db.prepare('SELECT * FROM bills WHERE id = ?').get(result.billId);
    const completedItems = db.prepare(`
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

    res.status(201).json({
      message: 'Bill generated successfully with Tamil product names!',
      bill: completedBill,
      items: completedItems,
      settings
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
