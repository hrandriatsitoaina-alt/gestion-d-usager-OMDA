// server/routes/regions.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { requireSuperAdmin } = require('../middleware');

// GET /api/regions (public)
router.get('/regions', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nom, created_at FROM regions ORDER BY nom');
    res.json({ success: true, regions: result.rows });
  } catch (error) {
    console.error('Erreur récupération régions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/regions – plus de vérification (public)
router.post('/regions', async (req, res) => {
  const { nom } = req.body;
  if (!nom || nom.trim() === '') {
    return res.status(400).json({ success: false, message: 'Le nom de la région est obligatoire' });
  }
  try {
    const existing = await pool.query('SELECT id FROM regions WHERE LOWER(nom) = LOWER($1)', [nom.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Cette région existe déjà' });
    }
    const result = await pool.query(
      'INSERT INTO regions (nom) VALUES ($1) RETURNING id, nom, created_at',
      [nom.trim()]
    );
    res.json({ success: true, region: result.rows[0], message: 'Région ajoutée avec succès' });
  } catch (error) {
    console.error('Erreur ajout région:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/regions/:id – garde la vérification admin (si besoin)
router.delete('/regions/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM regions WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Région non trouvée' });
    }
    res.json({ success: true, message: 'Région supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression région:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;