const bcrypt = require('bcryptjs');
const db = require('./database');
const { initSchema } = require('./schema');

async function seedDatabase() {
  await db.init();
  initSchema();

  console.log('Seeding initial data...');

  // Check if users already seeded
  const userRow = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const userCount = userRow ? userRow.count : 0;
  if (userCount > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const customerHash = bcrypt.hashSync('customer123', salt);

  // 1. Insert Default Settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const defaultSettings = [
    ['shop_name', 'Sri Krishna Supermarket'],
    ['shop_address', 'No. 42, Bazaar Main Road, Near Bus Stand, Tamil Nadu - 600001'],
    ['shop_phone', '+91 98765 43210'],
    ['shop_email', 'contact@srikrishnastore.com'],
    ['shop_gstin', '33AAAAA0000A1Z5'],
    ['receipt_footer', 'Thank You! Visit Again.'],
    ['default_tax_rate', '0'],
    ['currency_symbol', '₹'],
    ['thermal_paper_width', '100mm'] // 4-inch standard
  ];

  for (const [k, v] of defaultSettings) {
    insertSetting.run(k, v);
  }

  // 2. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminResult = insertUser.run('Shop Admin', 'admin@shop.com', '9876543200', adminHash, 'admin', 'active');
  const cust1Result = insertUser.run('Arun Kumar', 'customer@gmail.com', '9876543210', customerHash, 'customer', 'active');
  const cust2Result = insertUser.run('Priya Sharma', 'priya@gmail.com', '9876543220', customerHash, 'customer', 'active');
  const cust3Result = insertUser.run('Karthik Raja', 'karthik@gmail.com', '9876543230', customerHash, 'customer', 'active');

  // 3. Insert Customers table
  const insertCust = db.prepare(`
    INSERT INTO customers (user_id, name, phone, email, address)
    VALUES (?, ?, ?, ?, ?)
  `);

  const cust1 = insertCust.run(cust1Result.lastInsertRowid, 'Arun Kumar', '9876543210', 'customer@gmail.com', '12/4, Gandhi Street, Chennai');
  const cust2 = insertCust.run(cust2Result.lastInsertRowid, 'Priya Sharma', '9876543220', 'priya@gmail.com', '45, Cross Cut Road, Coimbatore');
  const cust3 = insertCust.run(cust3Result.lastInsertRowid, 'Karthik Raja', '9876543230', 'karthik@gmail.com', '88, Bazaar Street, Madurai');
  const cust4 = insertCust.run(null, 'Senthil Nathan', '9876543240', 'senthil@gmail.com', 'Anna Nagar, Chennai');

  // 4. Insert Products
  const products = [
    { name: 'Rice Ponni 5kg', category: 'Grocery', sku: 'RICE005', barcode: '8901001005', purchase_price: 250, selling_price: 290, stock: 25, minimum_stock: 5, unit: 'Bag', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80' },
    { name: 'Sugar 1kg', category: 'Grocery', sku: 'SUGR001', barcode: '8901002001', purchase_price: 40, selling_price: 48, stock: 35, minimum_stock: 10, unit: 'kg', image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300&q=80' },
    { name: 'Refined Cooking Oil 1L', category: 'Grocery', sku: 'OIL001', barcode: '8901003001', purchase_price: 120, selling_price: 145, stock: 18, minimum_stock: 6, unit: 'L', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80' },
    { name: 'Chakra Gold Tea 250g', category: 'Beverages', sku: 'TEA025', barcode: '8901004025', purchase_price: 75, selling_price: 95, stock: 4, minimum_stock: 8, unit: 'packet', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&q=80' },
    { name: 'Filter Coffee Powder 200g', category: 'Beverages', sku: 'COF020', barcode: '8901005020', purchase_price: 110, selling_price: 140, stock: 15, minimum_stock: 5, unit: 'packet', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&q=80' },
    { name: 'Marie Gold Biscuits', category: 'Snacks', sku: 'BISC001', barcode: '8901006001', purchase_price: 20, selling_price: 30, stock: 50, minimum_stock: 10, unit: 'packet', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80' },
    { name: 'Sandalwood Bath Soap 125g', category: 'Personal Care', sku: 'SOAP001', barcode: '8901007001', purchase_price: 32, selling_price: 42, stock: 22, minimum_stock: 8, unit: 'pcs', image: 'https://images.unsplash.com/photo-1607006314358-00a454d67396?w=300&q=80' },
    { name: 'Herbal Shampoo 200ml', category: 'Personal Care', sku: 'SHMP002', barcode: '8901008002', purchase_price: 110, selling_price: 155, stock: 0, minimum_stock: 5, unit: 'bottle', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300&q=80' },
    { name: 'Arokya Full Cream Milk 500ml', category: 'Dairy', sku: 'MILK005', barcode: '8901009005', purchase_price: 24, selling_price: 28, stock: 30, minimum_stock: 10, unit: 'packet', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80' },
    { name: 'Fresh Curd 500g', category: 'Dairy', sku: 'CURD005', barcode: '8901010005', purchase_price: 30, selling_price: 36, stock: 12, minimum_stock: 5, unit: 'packet', image: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=300&q=80' },
    { name: 'Aashirvaad Atta 5kg', category: 'Grocery', sku: 'ATTA005', barcode: '8901011005', purchase_price: 210, selling_price: 245, stock: 20, minimum_stock: 5, unit: 'Bag', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80' },
    { name: 'Premium Toor Dal 1kg', category: 'Grocery', sku: 'DAL001', barcode: '8901012001', purchase_price: 130, selling_price: 160, stock: 3, minimum_stock: 6, unit: 'kg', image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=300&q=80' },
    { name: 'Moong Dal 1kg', category: 'Grocery', sku: 'DAL002', barcode: '8901013001', purchase_price: 115, selling_price: 140, stock: 14, minimum_stock: 5, unit: 'kg', image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=300&q=80' },
    { name: 'Tata Iodized Salt 1kg', category: 'Grocery', sku: 'SALT001', barcode: '8901014001', purchase_price: 15, selling_price: 22, stock: 40, minimum_stock: 10, unit: 'packet', image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=300&q=80' },
    { name: 'Turmeric Powder 100g', category: 'Spices', sku: 'TURM001', barcode: '8901015001', purchase_price: 28, selling_price: 38, stock: 25, minimum_stock: 5, unit: 'packet', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&q=80' },
    { name: 'Red Chilli Powder 200g', category: 'Spices', sku: 'CHIL001', barcode: '8901016001', purchase_price: 45, selling_price: 60, stock: 18, minimum_stock: 5, unit: 'packet', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80' },
    { name: 'Surf Excel Detergent 1kg', category: 'Household', sku: 'DET001', barcode: '8901017001', purchase_price: 90, selling_price: 115, stock: 16, minimum_stock: 5, unit: 'packet', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80' },
    { name: 'Vim Dishwash Gel 500ml', category: 'Household', sku: 'DISH001', barcode: '8901018001', purchase_price: 65, selling_price: 85, stock: 10, minimum_stock: 4, unit: 'bottle', image: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=300&q=80' }
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (name, category, sku, barcode, purchase_price, selling_price, stock, minimum_stock, unit, image, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  const insertStockTx = db.prepare(`
    INSERT INTO stock_transactions (product_id, product_name, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, admin_name)
    VALUES (?, ?, 'INITIAL', ?, 0, ?, 'INIT-SEED', 'Initial Stock Setup', 'System')
  `);

  const productMap = {};
  for (const p of products) {
    const res = insertProd.run(p.name, p.category, p.sku, p.barcode, p.purchase_price, p.selling_price, p.stock, p.minimum_stock, p.unit, p.image);
    productMap[p.sku] = { id: res.lastInsertRowid, ...p };
    insertStockTx.run(res.lastInsertRowid, p.name, p.stock, p.stock);
  }

  // 5. Insert Sample Customer Orders
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, customer_id, customer_name, customer_phone, delivery_address, notes, subtotal, tax, total_amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit, price, total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = new Date().toISOString().split('T')[0];

  // Order 1: Pending
  const ord1 = insertOrder.run(
    'ORD-1001',
    cust1.lastInsertRowid,
    'Arun Kumar',
    '9876543210',
    '12/4, Gandhi Street, Chennai',
    'Please pack neatly. Call before delivery.',
    525, 0, 525,
    'pending',
    `${todayStr} 10:15:00`
  );
  insertOrderItem.run(ord1.lastInsertRowid, productMap['RICE005'].id, 'Rice Ponni 5kg', 1, 'Bag', 290, 290);
  insertOrderItem.run(ord1.lastInsertRowid, productMap['TEA025'].id, 'Chakra Gold Tea 250g', 1, 'packet', 95, 95);
  insertOrderItem.run(ord1.lastInsertRowid, productMap['COF020'].id, 'Filter Coffee Powder 200g', 1, 'packet', 140, 140);

  // Order 2: Preparing
  const ord2 = insertOrder.run(
    'ORD-1002',
    cust2.lastInsertRowid,
    'Priya Sharma',
    '9876543220',
    '45, Cross Cut Road, Coimbatore',
    'Will pick up in evening',
    444, 0, 444,
    'preparing',
    `${todayStr} 11:30:00`
  );
  insertOrderItem.run(ord2.lastInsertRowid, productMap['ATTA005'].id, 'Aashirvaad Atta 5kg', 1, 'Bag', 245, 245);
  insertOrderItem.run(ord2.lastInsertRowid, productMap['DAL002'].id, 'Moong Dal 1kg', 1, 'kg', 140, 140);
  insertOrderItem.run(ord2.lastInsertRowid, productMap['BISC001'].id, 'Marie Gold Biscuits', 2, 'packet', 30, 60);

  // Order 3: Ready
  const ord3 = insertOrder.run(
    'ORD-1003',
    cust3.lastInsertRowid,
    'Karthik Raja',
    '9876543230',
    '88, Bazaar Street, Madurai',
    'Ready for pickup',
    342, 0, 342,
    'ready',
    `${todayStr} 12:45:00`
  );
  insertOrderItem.run(ord3.lastInsertRowid, productMap['SUGR001'].id, 'Sugar 1kg', 2, 'kg', 48, 96);
  insertOrderItem.run(ord3.lastInsertRowid, productMap['OIL001'].id, 'Refined Cooking Oil 1L', 1, 'L', 145, 145);
  insertOrderItem.run(ord3.lastInsertRowid, productMap['DET001'].id, 'Surf Excel Detergent 1kg', 1, 'packet', 115, 115);

  // 6. Insert Sample Bills
  const insertBill = db.prepare(`
    INSERT INTO bills (bill_number, customer_id, customer_name, customer_phone, subtotal, discount, discount_type, tax, tax_percentage, grand_total, payment_method, payment_reference, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBillItem = db.prepare(`
    INSERT INTO bill_items (bill_id, product_id, product_name, sku, unit, quantity, price, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Bill 1 - Cash
  const bill1Date = `${todayStr} 09:30:00`;
  const b1 = insertBill.run(
    `INV-${todayStr.replace(/-/g, '')}-001`,
    cust1.lastInsertRowid,
    'Arun Kumar',
    '9876543210',
    540, 20, 'flat', 0, 0, 520,
    'cash', 'CASH-REC',
    bill1Date
  );
  insertBillItem.run(b1.lastInsertRowid, productMap['RICE005'].id, 'Rice Ponni 5kg', 'RICE005', 'Bag', 1, 290, 290);
  insertBillItem.run(b1.lastInsertRowid, productMap['SUGR001'].id, 'Sugar 1kg', 'SUGR001', 'kg', 2, 50, 100);
  insertBillItem.run(b1.lastInsertRowid, productMap['OIL001'].id, 'Refined Cooking Oil 1L', 'OIL001', 'L', 1, 150, 150);

  // Bill 2 - UPI
  const bill2Date = `${todayStr} 11:00:00`;
  const b2 = insertBill.run(
    `INV-${todayStr.replace(/-/g, '')}-002`,
    cust4.lastInsertRowid,
    'Senthil Nathan',
    '9876543240',
    780, 30, 'flat', 0, 0, 750,
    'upi', 'UPI/983726154@okaxis',
    bill2Date
  );
  insertBillItem.run(b2.lastInsertRowid, productMap['ATTA005'].id, 'Aashirvaad Atta 5kg', 'ATTA005', 'Bag', 2, 245, 490);
  insertBillItem.run(b2.lastInsertRowid, productMap['DAL001'].id, 'Premium Toor Dal 1kg', 'DAL001', 'kg', 1, 160, 160);
  insertBillItem.run(b2.lastInsertRowid, productMap['COF020'].id, 'Filter Coffee Powder 200g', 'COF020', 'packet', 1, 140, 140);

  // Bill 3 - Card
  const bill3Date = `${todayStr} 14:15:00`;
  const b3 = insertBill.run(
    `INV-${todayStr.replace(/-/g, '')}-003`,
    cust2.lastInsertRowid,
    'Priya Sharma',
    '9876543220',
    315, 0, 'flat', 0, 0, 315,
    'card', 'TXN-CARD-9912',
    bill3Date
  );
  insertBillItem.run(b3.lastInsertRowid, productMap['TEA025'].id, 'Chakra Gold Tea 250g', 'TEA025', 'packet', 1, 95, 95);
  insertBillItem.run(b3.lastInsertRowid, productMap['SOAP001'].id, 'Sandalwood Bath Soap 125g', 'SOAP001', 'pcs', 2, 42, 84);
  insertBillItem.run(b3.lastInsertRowid, productMap['SALT001'].id, 'Tata Iodized Salt 1kg', 'SALT001', 'packet', 1, 22, 22);
  insertBillItem.run(b3.lastInsertRowid, productMap['DISH001'].id, 'Vim Dishwash Gel 500ml', 'DISH001', 'bottle', 1, 85, 85);

  console.log('Seed completed successfully!');
}

if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };
