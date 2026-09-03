const db = require('../db/database');

async function clearCustomers() {
  await db.init();

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM customers').run();
    db.prepare("DELETE FROM users WHERE role = 'customer'").run();
  });

  tx();

  console.log('All dummy customers removed successfully.');
  const users = db.prepare('SELECT id, name, email, role FROM users').all();
  console.log('Remaining Users:', users);
}

clearCustomers().catch(console.error);
