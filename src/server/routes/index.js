// server/routes/index.js
const express = require('express');
const router = express.Router();

// Importer toutes les routes
const authRoutes = require('./auth.routes');
const usagersRoutes = require('./usagers.routes');
const regionsRoutes = require('./regions.routes');
const adminRoutes = require('./admin.routes');
const paiementsRoutes = require('./paiements.routes');
const financeRoutes = require('./finance.routes');
const backupRoutes = require('./backup.routes');
const notificationsRoutes = require('./notifications.routes');

// Enregistrer les routes
router.use(authRoutes);
router.use(usagersRoutes);
router.use(regionsRoutes);
router.use(adminRoutes);
router.use(paiementsRoutes);  
router.use(financeRoutes);
router.use(backupRoutes);
router.use(notificationsRoutes);

module.exports = router;