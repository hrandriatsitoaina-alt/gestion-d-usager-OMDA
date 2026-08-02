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
        const totalResult = await pool.query(`SELECT COUNT(*) as count FROM ${type.table}`);
        stats[type.name].total = parseInt(totalResult.rows[0].count) || 0;
        
        const payesResult = await pool.query(
          `SELECT COUNT(DISTINCT usager_id) as count, COALESCE(SUM(montant), 0) as total_montant 
           FROM paiements 
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
// POST - Enregistrer un paiement (AVEC RENOUVELLEMENT COMPLET)
// ============================================================
router.post('/paiements/enregistrer', verifyAnyUser, async (req, res) => {
  const { usagerId, usagerType, montant, datePaiement, nombreMois, anneeDebut } = req.body;
  
  console.log('📝 Données reçues:', { usagerId, usagerType, montant, datePaiement, nombreMois, anneeDebut });
  console.log('🔑 Token reçu:', req.headers.adminToken || req.headers['admintoken']);
  
  if (!usagerId || !usagerType || !montant) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
  }
  
  if (montant <= 0) {
    return res.status(400).json({ success: false, message: 'Le montant doit être supérieur à 0' });
  }
  
  try {
    const typeMapping = {
      'hotel': 'usagers_hotel',
      'grand-surface': 'usagers_magasin',
      'media': 'usagers_media',
      'occ': 'usagers_occasionnel',
      'bus': 'usagers_bus',
      'nightclub': 'usagers_nightclub'
    };
    
    const tableName = typeMapping[usagerType];
    if (!tableName) {
      return res.status(400).json({ success: false, message: 'Type d\'usager invalide' });
    }
    
    const existing = await pool.query(
      `SELECT id, denomination FROM ${tableName} WHERE id = $1`,
      [usagerId]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usager non trouvé' });
    }
    
    console.log(`✅ Usager trouvé: ${existing.rows[0].denomination}`);
    
    // ============================================================
    // CAS OCC - Paiement unique (UNE SEULE FOIS)
    // ============================================================
    if (usagerType === 'occ') {
      const occCheck = await pool.query(
        `SELECT id FROM paiements WHERE usager_id = $1 AND usager_type = 'occ' AND statut = 'paye'`,
        [usagerId]
      );
      
      if (occCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Ce paiement OCC a déjà été effectué' });
      }
      
      await pool.query(
        `INSERT INTO paiements (usager_id, usager_type, type_paiement, montant, date_paiement, statut)
         VALUES ($1, $2, 'unique', $3, $4, 'paye')`,
        [usagerId, usagerType, montant, datePaiement]
      );
      
      console.log(`✅ Paiement OCC enregistré avec succès`);
      
      return res.json({ 
        success: true, 
        message: `Paiement occasionnel enregistré avec succès`,
        montant
      });
    }
    
    // ============================================================
    // CAS MENSUEL - AVEC RENOUVELLEMENT COMPLET
    // ============================================================
    
    const datePaiementObj = new Date(datePaiement);
    const moisDepart = datePaiementObj.getMonth() + 1;
    const anneeDepart = anneeDebut || datePaiementObj.getFullYear();
    const nbMois = nombreMois || 1;
    const montantParMois = montant / nbMois;
    
    // ⭐ Récupérer TOUS les mois déjà payés (toutes années confondues)
    const paiementsExistants = await pool.query(
      `SELECT mois, annee FROM paiements 
       WHERE usager_id = $1 AND usager_type = $2 AND type_paiement = 'mensuel' AND statut = 'paye'
       ORDER BY annee, mois`,
      [usagerId, usagerType]
    );
    
    // Créer un Set des mois déjà payés
    const moisPayes = new Set();
    for (const p of paiementsExistants.rows) {
      moisPayes.add(`${p.annee}-${p.mois}`);
    }
    
    console.log(`📅 Mois déjà payés (${moisPayes.size}):`, Array.from(moisPayes));
    
    // ⭐ TROUVER LE PROCHAIN MOIS DISPONIBLE
    // On commence par l'année de départ et le mois de départ
    let anneeActuelle = anneeDepart;
    let moisActuel = moisDepart;
    let moisTrouves = 0;
    let detailsMois = [];
    let maxRecherche = 36; // Limite de sécurité pour éviter une boucle infinie
    
    // ⭐ LOGIQUE DE RENOUVELLEMENT : Chercher les mois disponibles
    while (moisTrouves < nbMois && maxRecherche > 0) {
      // Si on dépasse décembre, passer à l'année suivante
      if (moisActuel > 12) {
        moisActuel = 1;
        anneeActuelle++;
      }
      
      const key = `${anneeActuelle}-${moisActuel}`;
      
      // Vérifier si le mois est disponible (non payé)
      if (!moisPayes.has(key)) {
        // Enregistrer le paiement
        await pool.query(
          `INSERT INTO paiements (usager_id, usager_type, type_paiement, annee, mois, montant, date_paiement, statut)
           VALUES ($1, $2, 'mensuel', $3, $4, $5, $6, 'paye')`,
          [usagerId, usagerType, anneeActuelle, moisActuel, montantParMois, datePaiement]
        );
        
        moisTrouves++;
        detailsMois.push({ mois: moisActuel, annee: anneeActuelle, montant: montantParMois });
        console.log(`✅ Mois ${moisActuel}/${anneeActuelle} enregistré`);
        
        // Ajouter au Set pour éviter les doublons dans la même session
        moisPayes.add(key);
      } else {
        console.log(`⚠️ Mois ${moisActuel}/${anneeActuelle} déjà payé - ignoré`);
      }
      
      // Passer au mois suivant
      moisActuel++;
      maxRecherche--;
    }
    
    // Si aucun mois n'a été enregistré
    if (moisTrouves === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les mois demandés sont déjà payés' 
      });
    }
    
    console.log(`✅ ${moisTrouves} mois enregistrés sur ${nbMois} demandés`);
    console.log(`📊 Total mois payés maintenant: ${moisPayes.size}`);
    
    res.json({ 
      success: true, 
      message: `${moisTrouves} mois enregistrés avec succès`,
      details: {
        moisEnregistres: moisTrouves,
        detailsMois: detailsMois,
        totalMoisPayes: moisPayes.size
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur paiement enregistrer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET - Historique des paiements
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
        p.statut,
        p.created_at
      FROM paiements p
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    
    for (const row of result.rows) {
      let usagerNom = 'Inconnu';
      let region = 'N/A';
      
      if (row.usager_type === 'hotel') {
        const u = await pool.query(`SELECT denomination, region FROM usagers_hotel WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'grand-surface') {
        const u = await pool.query(`SELECT denomination, region FROM usagers_magasin WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'bus') {
        const u = await pool.query(`SELECT denomination, region FROM usagers_bus WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'nightclub') {
        const u = await pool.query(`SELECT denomination, region FROM usagers_nightclub WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'media') {
        const u = await pool.query(`SELECT denomination, region FROM usagers_media WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      } else if (row.usager_type === 'occ') {
        const u = await pool.query(`SELECT denomination, region FROM usagers_occasionnel WHERE id = $1`, [row.usager_id]);
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
      `SELECT DISTINCT annee FROM paiements WHERE annee IS NOT NULL ORDER BY annee DESC`
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
        p.reference,
        p.statut,
        p.created_at,
        CASE 
          WHEN p.usager_type = 'hotel' THEN (SELECT denomination FROM usagers_hotel WHERE id = p.usager_id)
          WHEN p.usager_type = 'grand-surface' THEN (SELECT denomination FROM usagers_magasin WHERE id = p.usager_id)
          WHEN p.usager_type = 'bus' THEN (SELECT denomination FROM usagers_bus WHERE id = p.usager_id)
          WHEN p.usager_type = 'nightclub' THEN (SELECT denomination FROM usagers_nightclub WHERE id = p.usager_id)
          WHEN p.usager_type = 'media' THEN (SELECT denomination FROM usagers_media WHERE id = p.usager_id)
          WHEN p.usager_type = 'occ' THEN (SELECT denomination FROM usagers_occasionnel WHERE id = p.usager_id)
          ELSE NULL
        END AS usager_nom,
        CASE 
          WHEN p.usager_type = 'hotel' THEN (SELECT region FROM usagers_hotel WHERE id = p.usager_id)
          WHEN p.usager_type = 'grand-surface' THEN (SELECT region FROM usagers_magasin WHERE id = p.usager_id)
          WHEN p.usager_type = 'bus' THEN (SELECT region FROM usagers_bus WHERE id = p.usager_id)
          WHEN p.usager_type = 'nightclub' THEN (SELECT region FROM usagers_nightclub WHERE id = p.usager_id)
          WHEN p.usager_type = 'media' THEN (SELECT region FROM usagers_media WHERE id = p.usager_id)
          WHEN p.usager_type = 'occ' THEN (SELECT region FROM usagers_occasionnel WHERE id = p.usager_id)
          ELSE NULL
        END AS region
      FROM paiements p
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
        p.reference,
        p.statut,
        p.created_at,
        CASE 
          WHEN p.usager_type = 'hotel' THEN (SELECT denomination FROM usagers_hotel WHERE id = p.usager_id)
          WHEN p.usager_type = 'grand-surface' THEN (SELECT denomination FROM usagers_magasin WHERE id = p.usager_id)
          WHEN p.usager_type = 'bus' THEN (SELECT denomination FROM usagers_bus WHERE id = p.usager_id)
          WHEN p.usager_type = 'nightclub' THEN (SELECT denomination FROM usagers_nightclub WHERE id = p.usager_id)
          WHEN p.usager_type = 'media' THEN (SELECT denomination FROM usagers_media WHERE id = p.usager_id)
          WHEN p.usager_type = 'occ' THEN (SELECT denomination FROM usagers_occasionnel WHERE id = p.usager_id)
          ELSE NULL
        END AS usager_nom,
        CASE 
          WHEN p.usager_type = 'hotel' THEN (SELECT region FROM usagers_hotel WHERE id = p.usager_id)
          WHEN p.usager_type = 'grand-surface' THEN (SELECT region FROM usagers_magasin WHERE id = p.usager_id)
          WHEN p.usager_type = 'bus' THEN (SELECT region FROM usagers_bus WHERE id = p.usager_id)
          WHEN p.usager_type = 'nightclub' THEN (SELECT region FROM usagers_nightclub WHERE id = p.usager_id)
          WHEN p.usager_type = 'media' THEN (SELECT region FROM usagers_media WHERE id = p.usager_id)
          WHEN p.usager_type = 'occ' THEN (SELECT region FROM usagers_occasionnel WHERE id = p.usager_id)
          ELSE NULL
        END AS region
      FROM paiements p
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
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${type.table}`);
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