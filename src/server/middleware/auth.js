// server/middleware/auth.js
const config = require('../config');
const jwt = require('jsonwebtoken'); 

// ============================================================
// Vérifie un JWT valide et pose req.user = { id, role, email }
// C'est LE middleware à utiliser pour toute route protégée
// (change-password, current-user, users, stats, etc.)
// ============================================================

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token manquant.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
  }
};

// ============================================================
// Vérifie un JWT valide ET que le rôle est super_admin
// ============================================================
const requireSuperAdmin = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Accès réservé au Super Admin.' });
    }
    next();
  });
};

// ============================================================
// Vérifie un JWT valide ET que le rôle est super_admin ou daf
// ============================================================
const requireAdminOrDaf = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'daf') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
    }
    next();
  });
};

module.exports = {
  authMiddleware,        // usage par défaut : n'importe quel utilisateur connecté
  requireSuperAdmin,      // usage : routes réservées au super admin
  requireAdminOrDaf       // usage : routes réservées à super_admin + daf
};