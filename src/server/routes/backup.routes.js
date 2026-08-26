const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { requireSuperAdmin } = require('../middleware');

// POST /api/backup/create
router.post('/backup/create', requireSuperAdmin, async (req, res) => {
  const { annee } = req.body;
  const currentYear = parseInt(annee) || new Date().getFullYear();
  try {
    const existingBackup = await pool.query(
      `SELECT id FROM backup_annuel WHERE annee = $1`,
      [currentYear]
    );
    if (existingBackup.rows.length > 0) {
      return res.status(400).json({ success: false, message: `Un backup pour l'année ${currentYear} existe déjà` });
    }
    const compteursResult = await pool.query(
      `SELECT utilisateur_id, type_usager, compteur 
       FROM compteurs_dossiers_utilisateurs WHERE annee = $1`,
      [currentYear]
    );
    const paiementsResult = await pool.query(
      `SELECT usager_id, usager_type, mois, annee, montant, date_paiement, statut 
       FROM paiements_usagers WHERE annee = $1`,
      [currentYear]
    );
    const paiementsOccResult = await pool.query(
      `SELECT usager_id, montant, date_paiement, statut 
       FROM paiements_occasionnels 
       WHERE EXTRACT(YEAR FROM date_paiement) = $1`,
      [currentYear]
    );
    const backupData = {
      compteurs: compteursResult.rows,
      paiements: paiementsResult.rows,
      paiementsOcc: paiementsOccResult.rows,
      dateCreation: new Date()
    };
    await pool.query(
      `INSERT INTO backup_annuel (annee, data, created_at) 
       VALUES ($1, $2, NOW())`,
      [currentYear, JSON.stringify(backupData)]
    );
    res.json({ success: true, message: `Backup pour l'année ${currentYear} créé avec succès`, backup: backupData });
  } catch (error) {
    console.error('Erreur création backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/backup/reset-counters
router.post('/backup/reset-counters', requireSuperAdmin, async (req, res) => {
  const { annee } = req.body;
  const currentYear = parseInt(annee) || new Date().getFullYear();
  const nextYear = currentYear + 1;
  try {
    const existingBackup = await pool.query(
      `SELECT id FROM backup_annuel WHERE annee = $1`,
      [currentYear]
    );
    if (existingBackup.rows.length === 0) {
      return res.status(400).json({ success: false, message: `Aucun backup trouvé pour l'année ${currentYear}` });
    }
    const usersResult = await pool.query(`SELECT id FROM utilisateurs`);
    const typesUsager = ['Hôtel', 'Grand Surface', 'Télé/Radio', 'OCC', 'Bus', 'Night club'];
    for (const user of usersResult.rows) {
      for (const type of typesUsager) {
        const existingCounter = await pool.query(
          `SELECT id FROM compteurs_dossiers_utilisateurs 
           WHERE utilisateur_id = $1 AND annee = $2 AND type_usager = $3`,
          [user.id, nextYear, type]
        );
        if (existingCounter.rows.length === 0) {
          await pool.query(
            `INSERT INTO compteurs_dossiers_utilisateurs (utilisateur_id, annee, compteur, type_usager) 
             VALUES ($1, $2, 0, $3)`,
            [user.id, nextYear, type]
          );
        } else {
          await pool.query(
            `UPDATE compteurs_dossiers_utilisateurs 
             SET compteur = 0, updated_at = NOW() 
             WHERE utilisateur_id = $1 AND annee = $2 AND type_usager = $3`,
            [user.id, nextYear, type]
          );
        }
      }
    }
    res.json({ success: true, message: `Compteurs réinitialisés pour l'année ${nextYear}`, annee: nextYear });
  } catch (error) {
    console.error('Erreur reset counters:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/backup/:annee
router.get('/backup/:annee', requireSuperAdmin, async (req, res) => {
  const { annee } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, annee, data, created_at FROM backup_annuel WHERE annee = $1`,
      [annee]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Aucun backup pour l'année ${annee}` });
    }
    res.json({ success: true, backup: {
      id: result.rows[0].id,
      annee: result.rows[0].annee,
      data: result.rows[0].data,
      created_at: result.rows[0].created_at
    }});
  } catch (error) {
    console.error('Erreur récupération backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/backup/list
router.get('/backup/list', requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, annee, created_at FROM backup_annuel ORDER BY annee DESC`
    );
    res.json({ success: true, backups: result.rows });
  } catch (error) {
    console.error('Erreur liste backups:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/backup/:annee
router.delete('/backup/:annee', requireSuperAdmin, async (req, res) => {
  const { annee } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM backup_annuel WHERE annee = $1 RETURNING id`,
      [annee]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Aucun backup pour l'année ${annee}` });
    }
    res.json({ success: true, message: `Backup pour l'année ${annee} supprimé` });
  } catch (error) {
    console.error('Erreur suppression backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/backup/bilan/:annee
router.get('/backup/bilan/:annee', requireSuperAdmin, async (req, res) => {
  const { annee } = req.params;
  try {
    const backupResult = await pool.query(
      `SELECT data FROM backup_annuel WHERE annee = $1`,
      [annee]
    );
    if (backupResult.rows.length === 0) {
      const bilanTypes = {};
      const typesUsager = ['hotel', 'grand-surface', 'media', 'occ', 'bus', 'nightclub'];
      for (const type of typesUsager) {
        let totalMontant = 0, totalUsagers = 0, totalPayes = 0;
        if (type === 'occ') {
          const result = await pool.query(
            `SELECT COUNT(DISTINCT usager_id) as total_usagers, COUNT(*) as total_payes, COALESCE(SUM(montant), 0) as total_montant
             FROM paiements_occasionnels WHERE EXTRACT(YEAR FROM date_paiement) = $1`,
            [annee]
          );
          totalUsagers = parseInt(result.rows[0].total_usagers) || 0;
          totalPayes = parseInt(result.rows[0].total_payes) || 0;
          totalMontant = parseFloat(result.rows[0].total_montant) || 0;
        } else {
          const result = await pool.query(
            `SELECT COUNT(DISTINCT usager_id) as total_usagers, COUNT(*) as total_payes, COALESCE(SUM(montant), 0) as total_montant
             FROM paiements_usagers WHERE usager_type = $1 AND annee = $2`,
            [type, annee]
          );
          totalUsagers = parseInt(result.rows[0].total_usagers) || 0;
          totalPayes = parseInt(result.rows[0].total_payes) || 0;
          totalMontant = parseFloat(result.rows[0].total_montant) || 0;
        }
        bilanTypes[type] = { totalUsagers, totalPayes, totalMontant };
      }
      const totalGeneral = {
        totalMontant: Object.values(bilanTypes).reduce((sum, t) => sum + t.totalMontant, 0),
        totalPayes: Object.values(bilanTypes).reduce((sum, t) => sum + t.totalPayes, 0),
        totalUsagers: Object.values(bilanTypes).reduce((sum, t) => sum + t.totalUsagers, 0)
      };
      return res.json({ success: true, annee, bilan: bilanTypes, totalGeneral, source: 'calcul_direct' });
    }
    const backupData = backupResult.rows[0].data;
    res.json({ success: true, annee, bilan: backupData.bilan || {}, totalGeneral: backupData.totalGeneral || {}, source: 'backup' });
  } catch (error) {
    console.error('Erreur récupération bilan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/backup/yearly-reset
router.post('/backup/yearly-reset', requireSuperAdmin, async (req, res) => {
  const { annee } = req.body;
  const currentYear = parseInt(annee) || new Date().getFullYear();
  try {
    await pool.query(
      `INSERT INTO activites (action, details, user_id, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      ['YEARLY_RESET', `Réinitialisation annuelle pour l'année ${currentYear}`, 1]
    );
    res.json({ success: true, message: `Réinitialisation annuelle terminée pour ${currentYear}`, annee: currentYear, nextYear: currentYear + 1 });
  } catch (error) {
    console.error('Erreur yearly reset:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;