const bcrypt = require('bcryptjs');
const db = require('./database');
const { initSchema } = require('./schema');

async function seedDatabase() {
  await db.init();
  initSchema();

  // Check if admin already exists
  const adminUser = db.prepare('SELECT id FROM users WHERE role = "admin" LIMIT 1').get();
  if (adminUser) {
    return;
  }

  console.log('Seeding initial admin account and default settings (No dummy products)...');

  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);

  // 1. Insert Default Settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const defaultSettings = [
    ['shop_name', 'Vilmani Store'],
    ['shop_address', 'No. 42, Bazaar Main Road, Tamil Nadu - 600001'],
    ['shop_phone', '+91 98765 43210'],
    ['shop_email', 'admin@shop.com'],
    ['shop_gstin', '33AAAAA0000A1Z5'],
    ['receipt_footer', 'நன்றி! மீண்டும் வருக. / THANK YOU! VISIT AGAIN.'],
    ['default_tax_rate', '0'],
    ['currency_symbol', '₹'],
    ['thermal_paper_width', '100mm'] // 4-inch standard
  ];

  for (const [k, v] of defaultSettings) {
    insertSetting.run(k, v);
  }

  // 2. Insert Admin User Only (Products are added by Admin)
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Shop Admin', 'admin@shop.com', '9876543200', adminHash, 'admin', 'active');
  console.log('Admin user initialized successfully (admin@shop.com / admin123). Products catalog is empty.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
