const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getIO } = require('../socket');

const router = express.Router();

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

// GET /api/pos/drafts - Fetch all 10 active POS section drafts
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM pos_draft_bills ORDER BY section_id ASC').all();
    const drafts = rows.map(formatDraftRow);
    res.json({ drafts });
  } catch (err) {
    next(err);
  }
});

// GET /api/pos/drafts/:sectionId - Fetch single section draft
router.get('/:sectionId', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    const row = db.prepare('SELECT * FROM pos_draft_bills WHERE section_id = ?').get(sectionId);
    if (!row) {
      return res.json({ draft: null });
    }
    res.json({ draft: formatDraftRow(row) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/pos/drafts/:sectionId - Save / Update section draft and sync across devices
router.put('/:sectionId', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    const {
      items = [],
      selectedCustomer = null,
      rateMode = 'c_rate',
      discount = 0,
      discountType = 'flat',
      taxPercentage = 0,
      taxAmount = 0,
      paymentMethod = 'cash',
      paymentReference = '',
      subtotal = 0,
      grandTotal = 0,
      deviceId = 'POS-Terminal',
      cashierName = req.user.name || 'Cashier'
    } = req.body;

    const itemsJson = JSON.stringify(Array.isArray(items) ? items : []);
    const customerJson = selectedCustomer ? JSON.stringify(selectedCustomer) : null;

    if (items.length === 0 && !selectedCustomer && discount === 0) {
      // If empty, remove draft
      db.prepare('DELETE FROM pos_draft_bills WHERE section_id = ?').run(sectionId);

      const io = getIO();
      if (io) {
        io.emit('pos:section_cleared', {
          sectionId,
          clearedByDevice: deviceId,
          timestamp: new Date().toISOString()
        });
      }

      return res.json({ message: 'Draft cleared', sectionId });
    }

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
      Number(discount) || 0,
      discountType,
      Number(taxPercentage) || 0,
      Number(taxAmount) || 0,
      paymentMethod,
      paymentReference || '',
      Number(subtotal) || 0,
      Number(grandTotal) || 0,
      itemsJson,
      deviceId
    );

    const updatedRow = db.prepare('SELECT * FROM pos_draft_bills WHERE section_id = ?').get(sectionId);
    const formatted = formatDraftRow(updatedRow);

    // Broadcast real-time sync event to all connected devices (mobiles, laptops, desktop)
    const io = getIO();
    if (io) {
      io.emit('pos:section_synced', {
        section: formatted,
        updatedByDevice: deviceId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ draft: formatted });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/pos/drafts/:sectionId - Clear section draft
router.delete('/:sectionId', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    const { deviceId = 'POS-Terminal' } = req.query;

    db.prepare('DELETE FROM pos_draft_bills WHERE section_id = ?').run(sectionId);

    const io = getIO();
    if (io) {
      io.emit('pos:section_cleared', {
        sectionId,
        clearedByDevice: deviceId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Draft cleared', sectionId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
