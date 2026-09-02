// server/middleware/index.js
// server/middleware/index.js
const auth = require('./auth');

module.exports = {
  authMiddleware: auth.authMiddleware,
  requireSuperAdmin: auth.requireSuperAdmin,
  requireAdminOrDaf: auth.requireAdminOrDaf
};