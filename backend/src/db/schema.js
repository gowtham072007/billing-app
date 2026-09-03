const db = require('./database');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'customer')) NOT NULL DEFAULT 'customer',
      status TEXT CHECK(status IN ('active', 'disabled')) NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      customer_type TEXT DEFAULT 'retail',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_tamil TEXT,
      category TEXT NOT NULL DEFAULT 'General',
      sku TEXT UNIQUE NOT NULL,
      barcode TEXT,
      purchase_price REAL NOT NULL DEFAULT 0.0,
      selling_price REAL NOT NULL DEFAULT 0.0,
      w_rate REAL NOT NULL DEFAULT 0.0,
      c_rate REAL NOT NULL DEFAULT 0.0,
      stock REAL NOT NULL DEFAULT 0,
      minimum_stock REAL NOT NULL DEFAULT 5,
      unit TEXT NOT NULL DEFAULT 'pcs',
      image TEXT,
      status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_address TEXT,
      notes TEXT,
      subtotal REAL NOT NULL DEFAULT 0.0,
      tax REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      status TEXT CHECK(status IN ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_name_tamil TEXT,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'pcs',
      price REAL NOT NULL,
      rate_type TEXT DEFAULT 'c_rate',
      total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
      customer_phone TEXT,
      subtotal REAL NOT NULL DEFAULT 0.0,
      discount REAL NOT NULL DEFAULT 0.0,
      discount_type TEXT DEFAULT 'flat',
      tax REAL NOT NULL DEFAULT 0.0,
      tax_percentage REAL NOT NULL DEFAULT 0.0,
      grand_total REAL NOT NULL DEFAULT 0.0,
      payment_method TEXT CHECK(payment_method IN ('cash', 'upi', 'card', 'other')) NOT NULL DEFAULT 'cash',
      payment_reference TEXT,
      order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_name_tamil TEXT,
      sku TEXT,
      unit TEXT NOT NULL DEFAULT 'pcs',
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      rate_type TEXT DEFAULT 'c_rate',
      total REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS stock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      transaction_type TEXT CHECK(transaction_type IN ('BILL_SALE', 'ORDER_FULFILL', 'RESTOCK', 'REDUCTION', 'CORRECTION', 'INITIAL')) NOT NULL,
      quantity REAL NOT NULL,
      previous_stock REAL NOT NULL,
      new_stock REAL NOT NULL,
      reference_id TEXT,
      notes TEXT,
      admin_name TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_bills_number ON bills(bill_number);
    CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_transactions(product_id);
  `);

  // Migration alters
  try { db.exec('ALTER TABLE products ADD COLUMN w_rate REAL NOT NULL DEFAULT 0.0;'); } catch (e) {}
  try { db.exec('ALTER TABLE products ADD COLUMN c_rate REAL NOT NULL DEFAULT 0.0;'); } catch (e) {}
  try { db.exec('ALTER TABLE products ADD COLUMN name_tamil TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE bill_items ADD COLUMN rate_type TEXT DEFAULT "c_rate";'); } catch (e) {}
  try { db.exec('ALTER TABLE bill_items ADD COLUMN product_name_tamil TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE order_items ADD COLUMN rate_type TEXT DEFAULT "c_rate";'); } catch (e) {}
  try { db.exec('ALTER TABLE order_items ADD COLUMN product_name_tamil TEXT;'); } catch (e) {}

  console.log('Database schema initialized with Tamil Name, W-Rate and C-Rate support.');
}

module.exports = { initSchema };
