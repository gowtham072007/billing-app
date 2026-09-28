const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/products (Public / Customer / Admin with filters)
router.get('/', (req, res, next) => {
  try {
    const { category, search, stock_status, status = 'active' } = req.query;

    let query = `
      SELECT 
        id, name, name_tamil, category, sku, barcode, purchase_price, selling_price,
        w_rate, c_rate, stock, minimum_stock, unit, image, status,
        created_at, updated_at,
        CASE 
          WHEN stock <= 0 THEN 'out_of_stock'
          WHEN stock <= minimum_stock THEN 'low_stock'
          ELSE 'available'
        END as stock_status
      FROM products
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (category && category !== 'all' && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      const searchTerm = `%${search.trim()}%`;
      query += ' AND (name LIKE ? OR name_tamil LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (stock_status && stock_status !== 'all') {
      if (stock_status === 'out_of_stock') {
        query += ' AND stock <= 0';
      } else if (stock_status === 'low_stock') {
        query += ' AND stock > 0 AND stock <= minimum_stock';
      } else if (stock_status === 'available') {
        query += ' AND stock > minimum_stock';
      }
    }

    query += ' ORDER BY name ASC';

    const products = db.prepare(query).all(...params);

    // Ensure w_rate and c_rate are populated if 0
    const normalizedProducts = products.map(p => ({
      ...p,
      c_rate: Number(p.c_rate) > 0 ? Number(p.c_rate) : Number(p.selling_price) || 0,
      w_rate: Number(p.w_rate) > 0 ? Number(p.w_rate) : Number(p.selling_price) || 0,
      selling_price: Number(p.c_rate) > 0 ? Number(p.c_rate) : Number(p.selling_price) || 0
    }));

    // Get unique categories
    const categoriesRows = db.prepare(`
      SELECT DISTINCT category FROM products WHERE status = 'active' ORDER BY category ASC
    `).all();
    const categories = categoriesRows.map(r => r.category).filter(Boolean);

    res.json({ products: normalizedProducts, categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/lookup/:code (Fast lookup by SKU or Barcode)
router.get('/lookup/:code', (req, res, next) => {
  try {
    const code = req.params.code.trim();

    const product = db.prepare(`
      SELECT 
        id, name, name_tamil, category, sku, barcode, purchase_price, selling_price,
        w_rate, c_rate, stock, minimum_stock, unit, image, status,
        CASE 
          WHEN stock <= 0 THEN 'out_of_stock'
          WHEN stock <= minimum_stock THEN 'low_stock'
          ELSE 'available'
        END as stock_status
      FROM products
      WHERE (sku = ? OR barcode = ?) AND status = 'active'
    `).get(code, code);

    if (!product) {
      return res.status(404).json({ error: `No active product found with code "${code}".` });
    }

    const normalized = {
      ...product,
      c_rate: Number(product.c_rate) > 0 ? Number(product.c_rate) : Number(product.selling_price) || 0,
      w_rate: Number(product.w_rate) > 0 ? Number(product.w_rate) : Number(product.selling_price) || 0,
      selling_price: Number(product.c_rate) > 0 ? Number(product.c_rate) : Number(product.selling_price) || 0
    };

    res.json({ product: normalized });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id (Get single product details)
router.get('/:id', (req, res, next) => {
  try {
    const product = db.prepare(`
      SELECT 
        id, name, name_tamil, category, sku, barcode, purchase_price, selling_price,
        w_rate, c_rate, stock, minimum_stock, unit, image, status,
        created_at, updated_at
      FROM products
      WHERE id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const normalized = {
      ...product,
      c_rate: Number(product.c_rate) > 0 ? Number(product.c_rate) : Number(product.selling_price) || 0,
      w_rate: Number(product.w_rate) > 0 ? Number(product.w_rate) : Number(product.selling_price) || 0,
    };

    res.json({ product: normalized });
  } catch (err) {
    next(err);
  }
});

// POST /api/products (Admin only - Add product with English & Tamil Name)
router.post('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const {
      name, name_tamil, category, sku, barcode, purchase_price, selling_price,
      w_rate, c_rate, stock, minimum_stock, unit, image, status
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ error: 'Product name and SKU are required.' });
    }

    const cleanSku = sku.trim().toUpperCase();

    // Check SKU duplicate
    const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(cleanSku);
    if (existing) {
      return res.status(400).json({ error: `A product with SKU "${cleanSku}" already exists.` });
    }

    const currentStock = Number(stock) || 0;
    const minStock = Number(minimum_stock) || 5;
    const costPrice = Number(purchase_price) || 0;
    
    // Calculate customer rate (C-Rate) and wholesale rate (W-Rate)
    const customerRate = c_rate !== undefined && c_rate !== '' ? Number(c_rate) : (selling_price !== undefined ? Number(selling_price) : 0);
    const wholesaleRate = w_rate !== undefined && w_rate !== '' ? Number(w_rate) : customerRate;
    const sellPrice = customerRate;

    const tx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO products (
          name, name_tamil, category, sku, barcode, purchase_price, selling_price,
          w_rate, c_rate, stock, minimum_stock, unit, image, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        name.trim(),
        name_tamil ? name_tamil.trim() : null,
        category ? category.trim() : 'General',
        cleanSku,
        barcode ? barcode.trim() : null,
        costPrice,
        sellPrice,
        wholesaleRate,
        customerRate,
        currentStock,
        minStock,
        unit ? unit.trim() : 'pcs',
        image ? image.trim() : null,
        status || 'active'
      );

      const productId = result.lastInsertRowid;

      if (currentStock > 0) {
        db.prepare(`
          INSERT INTO stock_transactions (
            product_id, product_name, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, admin_name
          ) VALUES (?, ?, 'INITIAL', ?, 0, ?, 'INITIAL-CREATE', 'Initial Product Stock', ?)
        `).run(productId, name.trim(), currentStock, currentStock, req.user.name || 'Admin');
      }

      return productId;
    });

    const productId = tx();
    const createdProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

    res.status(201).json({
      message: 'Product created successfully with English and Tamil names.',
      product: createdProduct
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id (Admin only - Update product with English & Tamil Name)
router.put('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const id = req.params.id;
    const {
      name, name_tamil, category, sku, barcode, purchase_price, selling_price,
      w_rate, c_rate, stock, minimum_stock, unit, image, status
    } = req.body;

    const existingProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const cleanSku = sku ? sku.trim().toUpperCase() : existingProduct.sku;

    // Check SKU duplicate on other products
    if (cleanSku !== existingProduct.sku) {
      const duplicate = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(cleanSku, id);
      if (duplicate) {
        return res.status(400).json({ error: `Another product with SKU "${cleanSku}" already exists.` });
      }
    }

    const newStock = stock !== undefined ? Number(stock) : existingProduct.stock;
    const prevStock = existingProduct.stock;

    const customerRate = c_rate !== undefined && c_rate !== ''
      ? Number(c_rate)
      : (selling_price !== undefined ? Number(selling_price) : existingProduct.c_rate || existingProduct.selling_price);

    const wholesaleRate = w_rate !== undefined && w_rate !== ''
      ? Number(w_rate)
      : (existingProduct.w_rate > 0 ? existingProduct.w_rate : customerRate);

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE products SET
          name = ?,
          name_tamil = ?,
          category = ?,
          sku = ?,
          barcode = ?,
          purchase_price = ?,
          selling_price = ?,
          w_rate = ?,
          c_rate = ?,
          stock = ?,
          minimum_stock = ?,
          unit = ?,
          image = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name ? name.trim() : existingProduct.name,
        name_tamil !== undefined ? (name_tamil ? name_tamil.trim() : null) : existingProduct.name_tamil,
        category ? category.trim() : existingProduct.category,
        cleanSku,
        barcode !== undefined ? (barcode ? barcode.trim() : null) : existingProduct.barcode,
        purchase_price !== undefined ? Number(purchase_price) : existingProduct.purchase_price,
        customerRate,
        wholesaleRate,
        customerRate,
        newStock,
        minimum_stock !== undefined ? Number(minimum_stock) : existingProduct.minimum_stock,
        unit ? unit.trim() : existingProduct.unit,
        image !== undefined ? (image ? image.trim() : null) : existingProduct.image,
        status || existingProduct.status,
        id
      );

      // If stock was modified directly, log an audit trail entry
      if (stock !== undefined && newStock !== prevStock) {
        db.prepare(`
          INSERT INTO stock_transactions (
            product_id, product_name, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, admin_name
          ) VALUES (?, ?, 'CORRECTION', ?, ?, ?, 'EDIT-PROD', 'Stock updated via product edit', ?)
        `).run(
          id,
          name || existingProduct.name,
          Math.abs(newStock - prevStock),
          prevStock,
          newStock,
          req.user.name || 'Admin'
        );
      }
    });

    tx();

    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    res.json({
      message: 'Product updated successfully.',
      product: updatedProduct
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const id = req.params.id;
    const existingProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/products/clear-all (Admin only - Remove all products from catalog)
router.post('/clear-all', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get();
    const totalCount = countRow ? countRow.count : 0;

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM stock_transactions').run();
      db.prepare('DELETE FROM products').run();
      return { totalDeleted: totalCount };
    });

    const result = tx();

    res.json({
      message: `Successfully removed all ${result.totalDeleted} products from the store. Catalog is now fresh and empty.`,
      deletedCount: result.totalDeleted
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
