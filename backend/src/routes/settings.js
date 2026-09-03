const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings (Public or Authenticated)
router.get('/', (req, res, next) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings (Admin only)
router.put('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload.' });
    }

    const insertOrUpdate = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const tx = db.transaction(() => {
      for (const [key, val] of Object.entries(updates)) {
        insertOrUpdate.run(key, String(val !== undefined && val !== null ? val : ''));
      }
    });

    tx();

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    res.json({
      message: 'Shop settings updated successfully.',
      settings
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
