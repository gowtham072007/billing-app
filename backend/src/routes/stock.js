const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/stock (Admin only)
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { status, category, q } = req.query;

    let query = `
      SELECT 
        id, name, category, sku, purchase_price, selling_price,
        stock, minimum_stock, unit, status as product_status,
        CASE 
          WHEN stock <= 0 THEN 'Out of Stock'
          WHEN stock <= minimum_stock THEN 'Low Stock'
          ELSE 'Available'
        END as stock_status,
        (SELECT MAX(created_at) FROM stock_transactions WHERE product_id = products.id) as last_stock_update
      FROM products
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all' && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (q) {
      const searchTerm = `%${q.trim()}%`;
      query += ' AND (name LIKE ? OR sku LIKE ?)';
      params.push(searchTerm, searchTerm);
    }

    if (status && status !== 'all') {
      if (status === 'out_of_stock' || status === 'Out of Stock') {
        query += ' AND stock <= 0';
      } else if (status === 'low_stock' || status === 'Low Stock') {
        query += ' AND stock > 0 AND stock <= minimum_stock';
      } else if (status === 'available' || status === 'Available') {
        query += ' AND stock > minimum_stock';
      }
    }

    query += ' ORDER BY CASE WHEN stock <= 0 THEN 1 WHEN stock <= minimum_stock THEN 2 ELSE 3 END, name ASC';

    const stockList = db.prepare(query).all(...params);

    // Summary counts
    const summary = db.prepare(`
      SELECT
        COUNT(*) as total_products,
        SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(CASE WHEN stock > 0 AND stock <= minimum_stock THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock > minimum_stock THEN 1 ELSE 0 END) as available_count,
        SUM(stock * purchase_price) as total_inventory_cost_value,
        SUM(stock * selling_price) as total_inventory_sales_value
      FROM products WHERE status = 'active'
    `).get();

    res.json({ stock: stockList, summary });
  } catch (err) {
    next(err);
  }
});

// POST /api/stock/adjust (Admin only)
router.post('/adjust', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { product_id, adjustment_type, quantity, notes } = req.body;

    if (!product_id || !adjustment_type || quantity === undefined) {
      return res.status(400).json({ error: 'Product ID, adjustment type, and quantity are required.' });
    }

    const product = db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: 'Please enter a valid positive quantity number.' });
    }

    const prevStock = Number(product.stock);
    let newStock = prevStock;
    let txType = 'RESTOCK';

    if (adjustment_type === 'add' || adjustment_type === 'restock') {
      newStock = prevStock + qty;
      txType = 'RESTOCK';
    } else if (adjustment_type === 'remove' || adjustment_type === 'reduction') {
      if (qty > prevStock) {
        return res.status(400).json({ error: `Cannot remove ${qty} units. Current stock is only ${prevStock}.` });
      }
      newStock = prevStock - qty;
      txType = 'REDUCTION';
    } else if (adjustment_type === 'set' || adjustment_type === 'correction') {
      newStock = qty;
      txType = 'CORRECTION';
    } else {
      return res.status(400).json({ error: 'Invalid adjustment type. Must be "add", "remove", or "set".' });
    }

    const tx = db.transaction(() => {
      // Update product stock
      db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, product_id);

      // Record transaction history
      const logStmt = db.prepare(`
        INSERT INTO stock_transactions (
          product_id, product_name, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, admin_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const refId = `ADJ-${Date.now().toString().slice(-6)}`;
      logStmt.run(
        product.id,
        product.name,
        txType,
        qty,
        prevStock,
        newStock,
        refId,
        notes ? notes.trim() : `Manual adjustment (${adjustment_type})`,
        req.user.name || 'Admin'
      );

      return { newStock, refId };
    });

    const result = tx();

    res.json({
      message: `Stock for "${product.name}" successfully updated to ${result.newStock}.`,
      product_id,
      previous_stock: prevStock,
      new_stock: result.newStock,
      reference_id: result.refId
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stock/history (Admin only)
router.get('/history', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { product_id, transaction_type, limit = 100 } = req.query;

    let query = `
      SELECT 
        st.id, st.product_id, st.product_name, st.transaction_type,
        st.quantity, st.previous_stock, st.new_stock, st.reference_id,
        st.notes, st.admin_name, st.created_at,
        p.sku, p.unit
      FROM stock_transactions st
      LEFT JOIN products p ON p.id = st.product_id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      query += ' AND st.product_id = ?';
      params.push(product_id);
    }

    if (transaction_type && transaction_type !== 'all') {
      query += ' AND st.transaction_type = ?';
      params.push(transaction_type);
    }

    query += ' ORDER BY st.created_at DESC, st.id DESC LIMIT ?';
    params.push(Number(limit) || 100);

    const history = db.prepare(query).all(...params);

    res.json({ history });
  } catch (err) {
    next(err);
  }
});

// POST /api/stock/clear-all (Admin only - Reset all inventory stock levels to 0)
router.post('/clear-all', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { reason = 'Admin cleared all stock' } = req.body;

    const products = db.prepare('SELECT id, name, stock FROM products WHERE status = "active"').all();

    const tx = db.transaction(() => {
      const updateStmt = db.prepare('UPDATE products SET stock = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const logStmt = db.prepare(`
        INSERT INTO stock_transactions (
          product_id, product_name, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, admin_name
        ) VALUES (?, ?, 'REDUCTION', ?, ?, 0, ?, ?, ?)
      `);

      const refId = `CLR-${Date.now().toString().slice(-6)}`;

      for (const p of products) {
        if (p.stock > 0) {
          updateStmt.run(p.id);
          logStmt.run(p.id, p.name, p.stock, p.stock, refId, reason, req.user.name || 'Admin');
        }
      }

      return { totalCleared: products.length, refId };
    });

    const result = tx();

    res.json({
      message: `Successfully cleared stock for all ${result.totalCleared} products. All stock levels reset to 0.`,
      reference_id: result.refId
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/stock/bulk-add (Admin only - Bulk add/set stock for multiple products)
router.post('/bulk-add', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { items, reason = 'Bulk stock addition' } = req.body; // items: [{ product_id, quantity }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please provide a list of products and quantities to adjust.' });
    }

    const tx = db.transaction(() => {
      const updateStmt = db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const logStmt = db.prepare(`
        INSERT INTO stock_transactions (
          product_id, product_name, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, admin_name
        ) VALUES (?, ?, 'RESTOCK', ?, ?, ?, ?, ?, ?)
      `);

      const refId = `BULK-${Date.now().toString().slice(-6)}`;

      for (const item of items) {
        const prod = db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(item.product_id);
        if (prod) {
          const qty = Number(item.quantity) || 0;
          if (qty > 0) {
            const prevStock = prod.stock;
            const newStock = prevStock + qty;
            updateStmt.run(qty, prod.id);
            logStmt.run(prod.id, prod.name, qty, prevStock, newStock, refId, reason, req.user.name || 'Admin');
          }
        }
      }

      return { updatedCount: items.length, refId };
    });

    const result = tx();

    res.json({
      message: `Successfully added stock for ${result.updatedCount} items.`,
      reference_id: result.refId
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
