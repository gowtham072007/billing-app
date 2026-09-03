const { app } = require('../backend/src/server');
const db = require('../backend/src/db/database');
const { initSchema } = require('../backend/src/db/schema');
const { seedDatabase } = require('../backend/src/db/seed');

let isInitialized = false;

module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      await db.init();
      initSchema();
      await seedDatabase();
      isInitialized = true;
    } catch (err) {
      console.error('Error initializing serverless database:', err);
    }
  }
  return app(req, res);
};
