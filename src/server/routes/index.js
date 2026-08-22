// src/server/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const usagersRoutes = require('./usagers.routes');
const regionsRoutes = require('./regions.routes');
const adminRoutes = require('./admin.routes');
const paiementsRoutes = require('./paiements.routes');
const financeRoutes = require('./finance.routes');
const backupRoutes = require('./backup.routes');
const notificationsRoutes = require('./notifications.routes');
const profileRoutes = require('./profile.routes');
const factureRoutes = require('./facture.routes');

router.use(authRoutes);
router.use(usagersRoutes);
router.use(regionsRoutes);
router.use(adminRoutes);
router.use(paiementsRoutes);
router.use(financeRoutes);
router.use(backupRoutes);
router.use(notificationsRoutes);
router.use(profileRoutes);
router.use(factureRoutes); // ✅ Sans préfixe, comme les autres

module.exports = router;