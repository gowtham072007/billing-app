const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats (Admin only)
router.get('/stats', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Summary Cards
    // Today's Sales & Bills
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as today_bills_count,
        COALESCE(SUM(grand_total), 0) as today_sales_amount
      FROM bills
      WHERE DATE(created_at) = DATE('now', 'localtime')
    `).get();

    // Total Products
    const productsCount = db.prepare(`
      SELECT COUNT(*) as total_products FROM products WHERE status = 'active'
    `).get().total_products;

    // Low Stock Products Count
    const lowStockCount = db.prepare(`
      SELECT COUNT(*) as low_stock_count 
      FROM products 
      WHERE status = 'active' AND stock <= minimum_stock
    `).get().low_stock_count;

    // Total Customers
    const customersCount = db.prepare(`
      SELECT COUNT(*) as total_customers FROM customers
    `).get().total_customers;

    // Pending Orders
    const pendingOrdersCount = db.prepare(`
      SELECT COUNT(*) as pending_orders_count FROM orders WHERE status = 'pending'
    `).get().pending_orders_count;

    // 2. Recent Bills (last 5)
    const recentBills = db.prepare(`
      SELECT 
        b.id, b.bill_number, b.customer_name, b.customer_phone,
        b.grand_total, b.payment_method, b.created_at,
        (SELECT COUNT(*) FROM bill_items WHERE bill_id = b.id) as item_count
      FROM bills b
      ORDER BY b.created_at DESC LIMIT 5
    `).all();

    // 3. Recent Customer Orders (last 5)
    const recentOrders = db.prepare(`
      SELECT 
        o.id, o.order_number, o.customer_name, o.customer_phone,
        o.total_amount, o.status, o.created_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      ORDER BY o.created_at DESC LIMIT 5
    `).all();

    // 4. Low Stock Products list (top 6 urgent)
    const lowStockProducts = db.prepare(`
      SELECT id, name, category, sku, stock, minimum_stock, unit, selling_price
      FROM products
      WHERE status = 'active' AND stock <= minimum_stock
      ORDER BY stock ASC LIMIT 6
    `).all();

    // 5. Chart 1: Daily Sales Trend (Last 7 Days)
    const salesTrend = db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT DATE('now', '-6 days', 'localtime')
        UNION ALL
        SELECT DATE(date, '+1 day')
        FROM dates
        WHERE date < DATE('now', 'localtime')
      )
      SELECT 
        strftime('%d %b', dates.date) as display_date,
        dates.date as raw_date,
        COALESCE(SUM(b.grand_total), 0) as sales,
        COUNT(b.id) as bills_count
      FROM dates
      LEFT JOIN bills b ON DATE(b.created_at) = dates.date
      GROUP BY dates.date
      ORDER BY dates.date ASC
    `).all();

    // 6. Chart 2: Sales by Payment Method (Overall or This Month)
    const paymentBreakdown = db.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        COALESCE(SUM(grand_total), 0) as total_amount
      FROM bills
      GROUP BY payment_method
    `).all();

    // 7. Chart 3: Top 5 Selling Products
    const topProducts = db.prepare(`
      SELECT 
        bi.product_name as name,
        SUM(bi.quantity) as total_quantity_sold,
        SUM(bi.total) as total_revenue
      FROM bill_items bi
      GROUP BY bi.product_name
      ORDER BY total_quantity_sold DESC LIMIT 5
    `).all();

    res.json({
      summary: {
        today_sales: todayStats.today_sales_amount,
        today_bills: todayStats.today_bills_count,
        total_products: productsCount,
        low_stock_products: lowStockCount,
        total_customers: customersCount,
        pending_orders: pendingOrdersCount
      },
      recent_bills: recentBills,
      recent_orders: recentOrders,
      low_stock_products: lowStockProducts,
      charts: {
        sales_trend: salesTrend,
        payment_breakdown: paymentBreakdown,
        top_products: topProducts
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
