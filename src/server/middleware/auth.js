// server/middleware/auth.js
const config = require('../config');

const verifyAdminToken = (req, res, next) => {
  const adminToken = req.headers.adminToken || req.headers['admintoken'];
  if (!adminToken) {
    return res.status(403).json({ success: false, message: 'Non autorisé - Token manquant' });
  }
  if (adminToken !== config.ADMIN_SECRET_TOKEN) {
    return res.status(403).json({ success: false, message: 'Non autorisé - Token invalide' });
  }
  next();
};

const verifyDAFToken = (req, res, next) => {
  const adminToken = req.headers.adminToken || req.headers['admintoken'];
  if (!adminToken) {
    return res.status(403).json({ success: false, message: 'Non autorisé - Token manquant' });
  }
  if (adminToken !== config.ADMIN_SECRET_TOKEN && adminToken !== config.DAF_SECRET_TOKEN) {
    return res.status(403).json({ success: false, message: 'Non autorisé - Token invalide' });
  }
  next();
};

// ⭐ MIDDLEWARE QUI AUTORISE TOUT LE MONDE
const verifyAnyUser = (req, res, next) => {
  const adminToken = req.headers.adminToken || req.headers['admintoken'];
  
  console.log('🔑 verifyAnyUser - Token reçu:', adminToken);
  console.log('🔑 verifyAnyUser - Headers:', req.headers);
  
  // Autoriser TOUJOURS - même sans token
  console.log('🔓 Paiement autorisé pour tous les utilisateurs');
  next();
};

module.exports = {
  verifyAdminToken,
  verifyDAFToken,
  verifyAnyUser
};