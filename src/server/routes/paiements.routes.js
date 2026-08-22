// server/routes/paiements.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../database');
const { verifyAnyUser } = require('../middleware');

// ============================================================
// ROUTE DE TEST
// ============================================================
router.get('/paiements/test', (req, res) => {
  res.json({
    success: true,
    message: 'Route paiements fonctionne !',
    token: req.headers.adminToken || 'Aucun token'
  });
});

// ============================================================
// GET - Statistiques des paiements
// ============================================================
router.get('/paiements/stats', async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques de paiements...');
    
    const stats = {
      hotel: { total: 0, totalPayes: 0, nonPayes: 0, montantTotal: 0 },
      'grand-surface': { total: 0, totalPayes: 0, nonPayes: 0, montantTotal: 0 },
      bus: { total: 0, totalPayes: 0, nonPayes: 0, montantTotal: 0 },
      nightclub: { total: 0, totalPayes: 0, nonPayes: 0, montantTotal: 0 },
      media: { total: 0, totalPayes: 0, nonPayes: 0, montantTotal: 0 },
      occ: { total: 0, totalPayes: 0, nonPayes: 0, montantTotal: 0 }
    };
    
    const types = [
      { name: 'hotel', table: 'usagers_hotel' },
      { name: 'grand-surface', table: 'usagers_magasin' },
      { name: 'bus', table: 'usagers_bus' },
      { name: 'nightclub', table: 'usagers_nightclub' },
      { name: 'media', table: 'usagers_media' },
      { name: 'occ', table: 'usagers_occasionnel' }
    ];
    
    for (const type of types) {
      try {
        const totalResult = await pool.query(`SELECT COUNT(*) as count FROM omda_app.${type.table}`);
        stats[type.name].total = parseInt(totalResult.rows[0].count) || 0;
        
        const payesResult = await pool.query(
          `SELECT COUNT(DISTINCT usager_id) as count, COALESCE(SUM(montant), 0) as total_montant 
           FROM omda_app.paiements 
           WHERE usager_type = $1 AND statut = 'paye'`,
          [type.name]
        );
        stats[type.name].totalPayes = parseInt(payesResult.rows[0].count) || 0;
        stats[type.name].montantTotal = parseFloat(payesResult.rows[0].total_montant) || 0;
        stats[type.name].nonPayes = Math.max(0, stats[type.name].total - stats[type.name].totalPayes);
        
        console.log(`✅ ${type.name}: total=${stats[type.name].total}, payes=${stats[type.name].totalPayes}, montant=${stats[type.name].montantTotal}`);
      } catch (err) {
        console.error(`❌ Erreur pour ${type.name}:`, err.message);
      }
    }
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Erreur paiements stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// POST - Enregistrer un paiement (CORRIGÉ POUR OCC)
// ============================================================
router.post('/paiements/enregistrer', async (req, res) => {
  console.log('🔥 ROUTE DIRECTE appelée');
  console.log('📦 Body reçu:', req.body);

  const { usagerId, usagerType, montant, datePaiement, fraisDossier, nombreMois, anneeDebut } = req.body;

  if (!usagerId || !montant) {
    return res.status(400).json({ success: false, message: 'usagerId et montant requis' });
  }

  try {
    const typePaiement = (usagerType === 'occ') ? 'unique' : 'mensuel';
    let annee = null;
    let mois = null;
    if (typePaiement === 'mensuel') {
      const dateObj = new Date(datePaiement || new Date());
      annee = anneeDebut || dateObj.getFullYear();
      mois = dateObj.getMonth() + 1;
    }
    // Pour 'unique', annee et mois restent NULL

    const result = await pool.query(
      `INSERT INTO omda_app.paiements 
       (usager_id, usager_type, type_paiement, annee, mois, montant, date_paiement, statut, frais_dossier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'paye', $8)
       RETURNING id`,
      [
        usagerId,
        usagerType || 'hotel',
        typePaiement,
        annee,
        mois,
        montant,
        datePaiement || new Date().toISOString().split('T')[0],
        fraisDossier || 0
      ]
    );

    console.log('✅ Insertion réussie, ID:', result.rows[0].id);
    return res.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      id: result.rows[0].id
    });

  } catch (error) {
    console.error('❌ ERREUR SQL:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET - Historique des paiements (avec noms et régions)
// ============================================================
router.get('/paiements/historique', async (req, res) => {
  try {
    console.log('📄 Récupération de l\'historique des paiements...');
    const historique = [];
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.usager_id,
        p.usager_type,
        p.type_paiement,
        p.mois,
        p.annee,
        p.montant,
        p.date_paiement,
        p.frais_dossier,
        p.montant_retard,
        p.est_retard,
        p.reference,
        p.statut,
        p.created_at
      FROM omda_app.paiements p
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    
    for (const row of result.rows) {
      let usagerNom = 'Inconnu';
      let region = 'N/A';
      
      if (row.usager_type === 'hotel') {
        const u = await pool.query(`SELECT denomination, region FROM omda_app.usagers_hotel WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'grand-surface') {
        const u = await pool.query(`SELECT denomination, region FROM omda_app.usagers_magasin WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'bus') {
        const u = await pool.query(`SELECT denomination, region FROM omda_app.usagers_bus WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'nightclub') {
        const u = await pool.query(`SELECT denomination, region FROM omda_app.usagers_nightclub WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'media') {
        const u = await pool.query(`SELECT denomination, region FROM omda_app.usagers_media WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'occ') {
        const u = await pool.query(`SELECT denomination, region FROM omda_app.usagers_occasionnel WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      }
      
      const typeLabels = {
        'hotel': 'Hôtel',
        'grand-surface': 'Grand Surface',
        'bus': 'Bus',
        'nightclub': 'Night club',
        'media': 'Télé/Radio',
        'occ': 'OCC'
      };
      
      const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      
      historique.push({
        id: row.id,
        usager: usagerNom,
        type: typeLabels[row.usager_type] || row.usager_type,
        typePaiement: row.type_paiement === 'unique' ? 'Unique (OCC)' : 'Mensuel',
        montant: parseFloat(row.montant) || 0,
        frais_dossier: parseFloat(row.frais_dossier) || 0,
        montant_retard: parseFloat(row.montant_retard) || 0,
        est_retard: row.est_retard || false,
        reference: row.reference || '-',
        date: row.date_paiement || row.created_at,
        mois: row.mois,
        moisLabel: row.mois ? moisLabels[row.mois - 1] : '-',
        annee: row.annee || '-',
        statut: row.statut || 'paye',
        region: region
      });
    }
    
    res.json({ 
      success: true, 
      historique: historique,
      total: historique.length
    });
  } catch (error) {
    console.error('❌ Erreur historique paiements:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      historique: [] 
    });
  }
});

// ============================================================
// GET - Années disponibles
// ============================================================
router.get('/paiements/annees-disponibles/:type', async (req, res) => {
  const currentYear = new Date().getFullYear();
  try {
    const result = await pool.query(
      `SELECT DISTINCT annee FROM omda_app.paiements WHERE annee IS NOT NULL ORDER BY annee DESC`
    );
    
    let annees = result.rows.map(r => r.annee);
    
    if (annees.length === 0) {
      annees = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
    }
    
    res.json({ success: true, annees });
  } catch (error) {
    console.error('❌ Erreur annees disponibles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET - Tous les paiements (pour le tableau de bord financier)
// ============================================================
router.get('/paiements/tous', async (req, res) => {
  try {
    console.log('📊 Récupération de tous les paiements...');
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.usager_id,
        p.usager_type,
        p.type_paiement,
        p.annee,
        p.mois,
        p.montant,
        p.date_paiement,
        p.frais_dossier,
        p.montant_retard,
        p.est_retard,
        p.reference,
        p.statut,
        p.created_at,
        CASE 
          WHEN p.usager_type = 'hotel' THEN (SELECT denomination FROM omda_app.usagers_hotel WHERE id = p.usager_id)
          WHEN p.usager_type = 'grand-surface' THEN (SELECT denomination FROM omda_app.usagers_magasin WHERE id = p.usager_id)
          WHEN p.usager_type = 'bus' THEN (SELECT denomination FROM omda_app.usagers_bus WHERE id = p.usager_id)
          WHEN p.usager_type = 'nightclub' THEN (SELECT denomination FROM omda_app.usagers_nightclub WHERE id = p.usager_id)
          WHEN p.usager_type = 'media' THEN (SELECT denomination FROM omda_app.usagers_media WHERE id = p.usager_id)
          WHEN p.usager_type = 'occ' THEN (SELECT denomination FROM omda_app.usagers_occasionnel WHERE id = p.usager_id)
          ELSE NULL
        END AS usager_nom,
        CASE 
          WHEN p.usager_type = 'hotel' THEN (SELECT region FROM omda_app.usagers_hotel WHERE id = p.usager_id)
          WHEN p.usager_type = 'grand-surface' THEN (SELECT region FROM omda_app.usagers_magasin WHERE id = p.usager_id)
          WHEN p.usager_type = 'bus' THEN (SELECT region FROM omda_app.usagers_bus WHERE id = p.usager_id)
          WHEN p.usager_type = 'nightclub' THEN (SELECT region FROM omda_app.usagers_nightclub WHERE id = p.usager_id)
          WHEN p.usager_type = 'media' THEN (SELECT region FROM omda_app.usagers_media WHERE id = p.usager_id)
          WHEN p.usager_type = 'occ' THEN (SELECT region FROM omda_app.usagers_occasionnel WHERE id = p.usager_id)
          ELSE NULL
        END AS region
      FROM omda_app.paiements p
      ORDER BY p.created_at DESC
    `);
    
    res.json({ 
      success: true, 
      paiements: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération tous les paiements:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      paiements: [] 
    });
  }
});

// ============================================================
// GET - Historique complet des paiements (avec noms et régions)
// ============================================================
router.get('/paiements/historique-complet', async (req, res) => {
  try {
    console.log('📄 Récupération de l\'historique complet des paiements...');
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.usager_id,
        p.usager_type,
        p.type_paiement,
        p.annee,
        p.mois,
        p.montant,
        p.date_paiement,
        p.frais_dossier,
        p.montant_retard,
        p.est_retard,
        p.reference,
        p.statut,
        p.created_at,
        CASE 
          WHEN p.usager_type = 'hotel' THEN (SELECT denomination FROM omda_app.usagers_hotel WHERE id = p.usager_id)
          WHEN p.usager_type = 'grand-surface' THEN (SELECT denomination FROM omda_app.usagers_magasin WHERE id = p.usager_id)
          WHEN p.usager_type = 'bus' THEN (SELECT denomination FROM omda_app.usagers_bus WHERE id = p.usager_id)
          WHEN p.usager_type = 'nightclub' THEN (SELECT denomination FROM omda_app.usagers_nightclub WHERE id = p.usager_id)
          WHEN p.usager_type = 'media' THEN (SELECT denomination FROM omda_app.usagers_media WHERE id = p.usager_id)
          WHEN p.usager_type = 'occ' THEN (SELECT denomination FROM omda_app.usagers_occasionnel WHERE id = p.usager_id)
          ELSE NULL
        END AS usager_nom,
        CASE 
          WHEN p.usager_type = 'hotel' THEN (SELECT region FROM omda_app.usagers_hotel WHERE id = p.usager_id)
          WHEN p.usager_type = 'grand-surface' THEN (SELECT region FROM omda_app.usagers_magasin WHERE id = p.usager_id)
          WHEN p.usager_type = 'bus' THEN (SELECT region FROM omda_app.usagers_bus WHERE id = p.usager_id)
          WHEN p.usager_type = 'nightclub' THEN (SELECT region FROM omda_app.usagers_nightclub WHERE id = p.usager_id)
          WHEN p.usager_type = 'media' THEN (SELECT region FROM omda_app.usagers_media WHERE id = p.usager_id)
          WHEN p.usager_type = 'occ' THEN (SELECT region FROM omda_app.usagers_occasionnel WHERE id = p.usager_id)
          ELSE NULL
        END AS region
      FROM omda_app.paiements p
      WHERE p.statut = 'paye'
      ORDER BY p.created_at DESC
      LIMIT 100
    `);
    
    res.json({ 
      success: true, 
      historique: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Erreur historique complet:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      historique: [] 
    });
  }
});

// ============================================================
// GET - Comptes d'usagers par type
// ============================================================
router.get('/usagers/comptes-par-type', async (req, res) => {
  try {
    console.log('📊 Comptage des usagers par type...');
    
    const types = [
      { name: 'hotel', table: 'usagers_hotel' },
      { name: 'grand-surface', table: 'usagers_magasin' },
      { name: 'bus', table: 'usagers_bus' },
      { name: 'nightclub', table: 'usagers_nightclub' },
      { name: 'media', table: 'usagers_media' },
      { name: 'occ', table: 'usagers_occasionnel' }
    ];
    
    const resultats = {};
    
    for (const type of types) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM omda_app.${type.table}`);
      resultats[type.name] = parseInt(result.rows[0].count) || 0;
    }
    
    res.json({ 
      success: true, 
      types: resultats,
      total: Object.values(resultats).reduce((a, b) => a + b, 0)
    });
    
  } catch (error) {
    console.error('❌ Erreur comptage usagers par type:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      types: {} 
    });
  }
});

module.exports = router;