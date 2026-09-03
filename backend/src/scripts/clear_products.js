const db = require('../db/database');

async function removeAllProducts() {
  await db.init();

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM stock_transactions').run();
    console.log('All products and stock records successfully cleared.');
  });

  tx();
  console.log('Product catalog is now empty. Only Admin will add products.');
}

removeAllProducts().catch(console.error);
