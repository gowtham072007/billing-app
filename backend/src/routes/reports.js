const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/sales (Admin only)
router.get('/sales', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { start_date, end_date, category } = req.query;

    let dateCondition = '';
    const params = [];

    if (start_date && end_date) {
      dateCondition = ' AND DATE(b.created_at) BETWEEN DATE(?) AND DATE(?)';
      params.push(start_date, end_date);
    } else if (start_date) {
      dateCondition = ' AND DATE(b.created_at) >= DATE(?)';
      params.push(start_date);
    } else {
      // Default last 30 days
      dateCondition = ' AND DATE(b.created_at) >= DATE("now", "-30 days", "localtime")';
    }

    // 1. Overall Aggregates
    const overallQuery = `
      SELECT 
        COUNT(DISTINCT b.id) as total_bills,
        COALESCE(SUM(b.subtotal), 0) as total_subtotal,
        COALESCE(SUM(b.discount), 0) as total_discount,
        COALESCE(SUM(b.tax), 0) as total_tax,
        COALESCE(SUM(b.grand_total), 0) as total_revenue,
        COALESCE(SUM(bi.quantity * p.purchase_price), 0) as total_cost,
        COALESCE(SUM(b.grand_total) - SUM(bi.quantity * p.purchase_price), 0) as estimated_gross_profit
      FROM bills b
      LEFT JOIN bill_items bi ON bi.bill_id = b.id
      LEFT JOIN products p ON p.id = bi.product_id
      WHERE 1=1 ${dateCondition}
    `;
    const overall = db.prepare(overallQuery).get(...params);

    // 2. Sales by Payment Mode
    const paymentQuery = `
      SELECT 
        b.payment_method,
        COUNT(b.id) as count,
        COALESCE(SUM(b.grand_total), 0) as amount
      FROM bills b
      WHERE 1=1 ${dateCondition}
      GROUP BY b.payment_method
    `;
    const paymentModes = db.prepare(paymentQuery).all(...params);

    // 3. Category-wise Sales
    const categoryQuery = `
      SELECT 
        COALESCE(p.category, 'Other') as category_name,
        SUM(bi.quantity) as items_sold,
        COALESCE(SUM(bi.total), 0) as total_sales
      FROM bill_items bi
      JOIN bills b ON b.id = bi.bill_id
      LEFT JOIN products p ON p.id = bi.product_id
      WHERE 1=1 ${dateCondition}
      GROUP BY p.category
      ORDER BY total_sales DESC
    `;
    const categorySales = db.prepare(categoryQuery).all(...params);

    // 4. Top Selling Products
    const topProductsQuery = `
      SELECT 
        bi.product_name,
        bi.sku,
        SUM(bi.quantity) as units_sold,
        COALESCE(SUM(bi.total), 0) as revenue
      FROM bill_items bi
      JOIN bills b ON b.id = bi.bill_id
      WHERE 1=1 ${dateCondition}
      GROUP BY bi.product_id, bi.product_name
      ORDER BY units_sold DESC LIMIT 10
    `;
    const topProducts = db.prepare(topProductsQuery).all(...params);

    // 5. Daily Breakdown inside the range
    const dailyQuery = `
      SELECT 
        DATE(b.created_at) as bill_date,
        COUNT(b.id) as bills_count,
        COALESCE(SUM(b.grand_total), 0) as daily_revenue,
        COALESCE(SUM(b.discount), 0) as daily_discount
      FROM bills b
      WHERE 1=1 ${dateCondition}
      GROUP BY DATE(b.created_at)
      ORDER BY bill_date ASC
    `;
    const dailyTrend = db.prepare(dailyQuery).all(...params);

    res.json({
      overall: {
        total_bills: overall.total_bills || 0,
        total_revenue: overall.total_revenue || 0,
        total_discount: overall.total_discount || 0,
        total_tax: overall.total_tax || 0,
        estimated_profit: overall.estimated_gross_profit || 0
      },
      payment_breakdown: paymentModes,
      category_sales: categorySales,
      top_products: topProducts,
      daily_trend: dailyTrend
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
