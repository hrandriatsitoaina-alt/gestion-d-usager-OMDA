// server/routes/paiements.routes.js - Ajout de la route pour récupérer les paiements d'un usager
const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { authMiddleware } = require('../middleware');

// ============================================================
// GET - Paiements d'un usager (NOUVEAU)
// ============================================================

router.get('/paiements/test', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Route paiements fonctionne !' });
});

// server/routes/paiements.routes.js - Route POST /paiements/enregistrer corrigée

// ============================================================
// POST - Enregistrer un paiement (VERSION CORRIGÉE FINALE)
// ============================================================
router.post('/paiements/enregistrer', async (req, res) => {
  console.log('🔥 ROUTE DIRECTE appelée');
  console.log('📦 Body reçu:', req.body);

  const { 
    usagerId, 
    usagerType, 
    type_paiement,
    montant, 
    date_paiement, 
    frais_dossier, 
    montant_retard,
    est_retard,
    annee,
    mois,
    mois_payes,
    nombre_mois,
    reference,
    statut
  } = req.body;

  if (!usagerId || !montant) {
    return res.status(400).json({ success: false, message: 'usagerId et montant requis' });
  }

  try {
    // Déterminer le type de paiement
    const typePaiement = type_paiement || (usagerType === 'occ' ? 'unique' : 'mensuel');
    
    console.log(`📝 Type paiement: ${typePaiement}, usagerType: ${usagerType}`);

    // ✅ Pour OCC, on enregistre un paiement unique sans année ni mois
    if (usagerType === 'occ' || typePaiement === 'unique') {
      const result = await pool.query(
        `INSERT INTO omda_app.paiements 
         (usager_id, usager_type, type_paiement, montant, date_paiement, statut, frais_dossier, montant_retard, est_retard, reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          usagerId,
          usagerType || 'hotel',
          'unique',
          montant,
          date_paiement || new Date().toISOString().split('T')[0],
          statut || 'paye',
          frais_dossier || 0,
          montant_retard || 0,
          est_retard || false,
          reference || null
        ]
      );

      console.log('✅ Paiement unique enregistré, ID:', result.rows[0].id);
      return res.json({
        success: true,
        message: 'Paiement unique enregistré avec succès',
        id: result.rows[0].id
      });
    }

    // ✅ Pour les paiements mensuels
    // Déterminer l'année et le mois
    let anneeFinale = annee || new Date().getFullYear();
    let moisFinal = mois || new Date().getMonth() + 1;
    
    // Si plusieurs mois sont envoyés, on prend le premier
    if (mois_payes && Array.isArray(mois_payes) && mois_payes.length > 0) {
      moisFinal = mois_payes[0];
    }

    console.log(`📝 Enregistrement mensuel: annee=${anneeFinale}, mois=${moisFinal}`);

    // ✅ Vérifier si le paiement existe déjà pour ce mois
    const checkResult = await pool.query(
      `SELECT id FROM omda_app.paiements 
       WHERE usager_id = $1 AND usager_type = $2 AND annee = $3 AND mois = $4 AND statut = 'paye'`,
      [usagerId, usagerType || 'hotel', anneeFinale, moisFinal]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`⚠️ Paiement déjà existant pour mois ${moisFinal}/${anneeFinale}`);
      return res.json({
        success: true,
        message: 'Paiement déjà enregistré pour ce mois',
        id: checkResult.rows[0].id,
        dejaExistant: true
      });
    }

    // ✅ Insérer le paiement mensuel
    const result = await pool.query(
      `INSERT INTO omda_app.paiements 
       (usager_id, usager_type, type_paiement, annee, mois, montant, date_paiement, statut, frais_dossier, montant_retard, est_retard, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        usagerId,
        usagerType || 'hotel',
        'mensuel',
        anneeFinale,
        moisFinal,
        montant,
        date_paiement || new Date().toISOString().split('T')[0],
        statut || 'paye',
        frais_dossier || 0,
        montant_retard || 0,
        est_retard || false,
        reference || null
      ]
    );

    console.log('✅ Paiement mensuel enregistré, ID:', result.rows[0].id);
    
    // ✅ Si plusieurs mois sont payés, enregistrer chaque mois séparément
    if (mois_payes && Array.isArray(mois_payes) && mois_payes.length > 1) {
      for (const m of mois_payes) {
        if (m === moisFinal) continue; // Déjà enregistré
        
        const checkAutre = await pool.query(
          `SELECT id FROM omda_app.paiements 
           WHERE usager_id = $1 AND usager_type = $2 AND annee = $3 AND mois = $4 AND statut = 'paye'`,
          [usagerId, usagerType || 'hotel', anneeFinale, m]
        );
        
        if (checkAutre.rows.length === 0) {
          await pool.query(
            `INSERT INTO omda_app.paiements 
             (usager_id, usager_type, type_paiement, annee, mois, montant, date_paiement, statut, frais_dossier, montant_retard, est_retard, reference)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              usagerId,
              usagerType || 'hotel',
              'mensuel',
              anneeFinale,
              m,
              montant,
              date_paiement || new Date().toISOString().split('T')[0],
              statut || 'paye',
              frais_dossier || 0,
              montant_retard || 0,
              est_retard || false,
              reference || null
            ]
          );
          console.log(`✅ Paiement mensuel supplémentaire enregistré pour mois ${m}`);
        }
      }
    }

    return res.json({
      success: true,
      message: `Paiement enregistré avec succès (${mois_payes ? mois_payes.length : 1} mois)`,
      id: result.rows[0].id
    });

  } catch (error) {
    console.error('❌ ERREUR SQL:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
// ============================================================
// GET - Statistiques des paiements
// ============================================================

router.get('/paiements/stats', authMiddleware, async (req, res) => {
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
// GET - Années disponibles
// ============================================================
router.post('/paiements/enregistrer', authMiddleware, async (req, res) => {
  const { 
    usagerId, 
    usagerType, 
    montant, 
    datePaiement, 
    nombreMois, 
    anneeDebut,
    fraisDossier,
    montantRetard,
    estRetard,
    reference
  } = req.body;

  console.log('📝 Données reçues:', { usagerId, usagerType, montant, datePaiement, nombreMois, anneeDebut, fraisDossier, montantRetard, estRetard, reference });

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

    let existing;
    let usagerFraisDossier = 0;
    let denomination = 'Inconnu';

    if (usagerType === 'occ') {
      const result = await pool.query(
        `SELECT id, denomination FROM ${tableName} WHERE id = $1`,
        [usagerId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Usager OCC non trouvé' });
      }
      existing = result.rows[0];
      denomination = existing.denomination;
      usagerFraisDossier = 0;
    } else {
      const result = await pool.query(
        `SELECT id, denomination, frais_dossier FROM ${tableName} WHERE id = $1`,
        [usagerId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Usager non trouvé' });
      }
      existing = result.rows[0];
      denomination = existing.denomination;
      usagerFraisDossier = parseFloat(existing.frais_dossier) || 0;
    }

    const fraisDossierValue = (fraisDossier !== undefined && fraisDossier !== null) 
      ? parseFloat(fraisDossier) 
      : usagerFraisDossier;

    console.log(`✅ Usager trouvé: ${denomination}`);
    console.log(`📄 Frais de dossier: ${fraisDossierValue}`);

    if (usagerType === 'occ') {
      const occCheck = await pool.query(
        `SELECT id FROM paiements WHERE usager_id = $1 AND usager_type = 'occ' AND statut = 'paye'`,
        [usagerId]
      );

      if (occCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Ce paiement OCC a déjà été effectué' });
      }

      await pool.query(
        `INSERT INTO paiements 
         (usager_id, usager_type, type_paiement, montant, date_paiement, 
          frais_dossier, montant_retard, est_retard, reference, statut)
         VALUES ($1, $2, 'unique', $3, $4, $5, $6, $7, $8, 'paye')`,
        [
          usagerId, 
          usagerType, 
          parseFloat(montant) || 0, 
          datePaiement,
          fraisDossierValue,
          parseFloat(montantRetard) || 0,
          estRetard === true || estRetard === 'true' ? true : false,
          reference || null
        ]
      );

      console.log(`✅ Paiement OCC enregistré (frais: ${fraisDossierValue}, retard: ${montantRetard})`);

      return res.json({ 
        success: true, 
        message: `Paiement occasionnel enregistré avec succès`,
        montant
      });
    }

    const datePaiementObj = new Date(datePaiement);
    const moisDepart = datePaiementObj.getMonth() + 1;
    const anneeDepart = anneeDebut || datePaiementObj.getFullYear();
    const nbMois = nombreMois || 1;
    const montantParMois = montant / nbMois;

    const paiementsExistants = await pool.query(
      `SELECT mois, annee FROM paiements 
       WHERE usager_id = $1 AND usager_type = $2 AND type_paiement = 'mensuel' AND statut = 'paye'
       ORDER BY annee, mois`,
      [usagerId, usagerType]
    );

    const moisPayes = new Set();
    for (const p of paiementsExistants.rows) {
      moisPayes.add(`${p.annee}-${p.mois}`);
    }

    console.log(`📅 Mois déjà payés (${moisPayes.size}):`, Array.from(moisPayes));

    let anneeActuelle = anneeDepart;
    let moisActuel = moisDepart;
    let moisTrouves = 0;
    let detailsMois = [];
    let maxRecherche = 36;
    let isFirstInsert = true;

    while (moisTrouves < nbMois && maxRecherche > 0) {
      if (moisActuel > 12) {
        moisActuel = 1;
        anneeActuelle++;
      }

      const key = `${anneeActuelle}-${moisActuel}`;

      if (!moisPayes.has(key)) {
        const currentFrais = isFirstInsert ? fraisDossierValue : 0;
        const currentMontantRetard = isFirstInsert ? (parseFloat(montantRetard) || 0) : 0;
        const currentEstRetard = isFirstInsert ? (estRetard === true || estRetard === 'true' ? true : false) : false;
        const currentReference = isFirstInsert ? (reference || null) : null;

        await pool.query(
          `INSERT INTO paiements 
           (usager_id, usager_type, type_paiement, annee, mois, montant, date_paiement, statut,
            frais_dossier, montant_retard, est_retard, reference)
           VALUES ($1, $2, 'mensuel', $3, $4, $5, $6, 'paye', $7, $8, $9, $10)`,
          [
            usagerId, 
            usagerType, 
            anneeActuelle, 
            moisActuel, 
            montantParMois, 
            datePaiement,
            currentFrais,
            currentMontantRetard,
            currentEstRetard,
            currentReference
          ]
        );

        moisTrouves++;
        detailsMois.push({ 
          mois: moisActuel, 
          annee: anneeActuelle, 
          montant: montantParMois,
          frais: currentFrais,
          retard: currentMontantRetard,
          estRetard: currentEstRetard
        });
        console.log(`✅ Mois ${moisActuel}/${anneeActuelle} enregistré (frais: ${currentFrais}, retard: ${currentMontantRetard})`);
        moisPayes.add(key);
        isFirstInsert = false;
      } else {
        console.log(`⚠️ Mois ${moisActuel}/${anneeActuelle} déjà payé - ignoré`);
      }

      moisActuel++;
      maxRecherche--;
    }

    if (moisTrouves === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les mois demandés sont déjà payés' 
      });
    }

    console.log(`✅ ${moisTrouves} mois enregistrés sur ${nbMois} demandés`);

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
// GET - Historique des paiements
// ============================================================
router.get('/paiements/historique', authMiddleware, async (req, res) => {
  try {
    console.log('📄 Récupération de l\'historique des paiements...');
    const historique = [];

    const result = await pool.query(`
      SELECT 
        p.id, p.usager_id, p.usager_type, p.type_paiement, p.mois, p.annee,
        p.montant, p.date_paiement, p.frais_dossier, p.montant_retard,
        p.est_retard, p.reference, p.statut, p.created_at
      FROM paiements p
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    for (const row of result.rows) {
      let usagerNom = 'Inconnu';
      let region = 'N/A';

      const tableMap = {
        'hotel': 'usagers_hotel',
        'grand-surface': 'usagers_magasin',
        'bus': 'usagers_bus',
        'nightclub': 'usagers_nightclub',
        'media': 'usagers_media',
        'occ': 'usagers_occasionnel'
      };

      const table = tableMap[row.usager_type];
      if (table) {
        const u = await pool.query(`SELECT denomination, region FROM ${table} WHERE id = $1`, [row.usager_id]);
        if (u.rows.length > 0) { usagerNom = u.rows[0].denomination; region = u.rows[0].region; }
      }

      const typeLabels = {
        'hotel': 'Hôtel', 'grand-surface': 'Grand Surface', 'bus': 'Bus',
        'nightclub': 'Night club', 'media': 'Télé/Radio', 'occ': 'OCC'
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

    res.json({ success: true, historique: historique, total: historique.length });
  } catch (error) {
    console.error('❌ Erreur historique paiements:', error);
    res.status(500).json({ success: false, message: error.message, historique: [] });
  }
});

// ============================================================
// GET - Années disponibles
// ============================================================
router.get('/paiements/annees-disponibles/:type', authMiddleware, async (req, res) => {
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
router.get('/paiements/tous', authMiddleware, async (req, res) => {
  try {
    console.log('📊 Récupération de tous les paiements...');

    const result = await pool.query(`
      SELECT 
        p.id, p.usager_id, p.usager_type, p.type_paiement, p.annee, p.mois,
        p.montant, p.date_paiement, p.frais_dossier, p.montant_retard,
        p.est_retard, p.reference, p.statut, p.created_at,
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

    res.json({ success: true, paiements: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('❌ Erreur récupération tous les paiements:', error);
    res.status(500).json({ success: false, message: error.message, paiements: [] });
  }
});

// ============================================================
// GET - Historique complet des paiements (avec noms et régions)
// ============================================================
router.get('/paiements/historique-complet', authMiddleware, async (req, res) => {
  try {
    console.log('📄 Récupération de l\'historique complet des paiements...');

    const result = await pool.query(`
      SELECT 
        p.id, p.usager_id, p.usager_type, p.type_paiement, p.annee, p.mois,
        p.montant, p.date_paiement, p.frais_dossier, p.montant_retard,
        p.est_retard, p.reference, p.statut, p.created_at,
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

    res.json({ success: true, historique: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('❌ Erreur historique complet:', error);
    res.status(500).json({ success: false, message: error.message, historique: [] });
  }
});

// ============================================================
// GET - Comptes d'usagers par type
// ============================================================
router.get('/usagers/comptes-par-type', authMiddleware, async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message, types: {} });
  }
});

module.exports = router;