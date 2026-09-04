const { app, ensureDbInitialized } = require('../backend/src/server');

module.exports = async (req, res) => {
  await ensureDbInitialized();
  return app(req, res);
};
