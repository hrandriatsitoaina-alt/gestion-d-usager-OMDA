// server/routes/usagers.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../database');

// ============================================================
// GET - Paiements par type d'usager
// ============================================================
router.get('/usagers/paiements/:type', async (req, res) => {
  const { type } = req.params;
  console.log(`📊 Récupération usagers pour ${type}...`);
  const typeMapping = {
    'hotel': 'usagers_hotel',
    'grand-surface': 'usagers_magasin',
    'media': 'usagers_media',
    'occ': 'usagers_occasionnel',
    'bus': 'usagers_bus',
    'nightclub': 'usagers_nightclub'
  };
  const tableName = typeMapping[type];
  if (!tableName) return res.status(400).json({ success: false, message: 'Type invalide' });
  try {
    const usagers = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);
    console.log(`✅ ${usagers.rows.length} usagers trouvés dans ${tableName}`);
    const result = [];
    const currentYear = new Date().getFullYear();
    for (const usager of usagers.rows) {
      const montantMensuel = parseFloat(usager.montant_mensuel) || 0;
      let moisCreation = 1, anneeCreation = currentYear;
      if (usager.created_at) {
        const creationDate = new Date(usager.created_at);
        moisCreation = creationDate.getMonth() + 1;
        anneeCreation = creationDate.getFullYear();
      }
      const paiements = await pool.query(
        `SELECT mois, annee FROM paiements 
         WHERE usager_id = $1 AND usager_type = $2 
         AND type_paiement = 'mensuel' AND statut = 'paye'
         ORDER BY annee, mois`,
        [usager.id, type]
      );
      const moisPayesParAnnee = {}, anneesPayes = {};
      for (const p of paiements.rows) {
        const annee = p.annee, mois = p.mois;
        if (!anneesPayes[annee]) anneesPayes[annee] = [];
        if (!moisPayesParAnnee[annee]) moisPayesParAnnee[annee] = [];
        anneesPayes[annee].push(mois);
        moisPayesParAnnee[annee].push(mois);
      }
      const resumeAnnees = [];
      for (let annee = currentYear - 1; annee <= currentYear + 1; annee++) {
        const moisPayes = anneesPayes[annee] || [];
        const nbMois = moisPayes.length;
        let moisDebutAnnee = 1;
        if (annee === anneeCreation) moisDebutAnnee = moisCreation;
        else if (annee > anneeCreation) moisDebutAnnee = 1;
        const moisTotalAttendus = 12 - moisDebutAnnee + 1;
        let estComplete = false;
        if (nbMois > 0 && nbMois >= moisTotalAttendus) estComplete = true;
        const moisValides = moisPayes.filter(mois => mois >= moisDebutAnnee);
        const nbMoisValides = moisValides.length;
        if (nbMoisValides >= moisTotalAttendus) estComplete = true;
        let affichage = '';
        if (estComplete) {
          const moisLabelsShort = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
          const moisTries = [...moisValides].sort((a,b)=>a-b);
          const affichageMois = moisTries.map(m=>moisLabelsShort[m-1]).join(', ');
          affichage = `✅ 12/12${affichageMois ? ` (${affichageMois})` : ''}`;
        } else if (nbMoisValides > 0) {
          const moisLabelsShort = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
          const moisTries = [...moisValides].sort((a,b)=>a-b);
          const affichageMois = moisTries.map(m=>moisLabelsShort[m-1]).join(', ');
          affichage = `${nbMoisValides}/${moisTotalAttendus}${affichageMois ? ` (${affichageMois})` : ''}`;
        } else {
          affichage = `0/${moisTotalAttendus}`;
        }
        resumeAnnees.push({ annee, nbMois: nbMoisValides, moisTotalAttendus, moisDebut: moisDebutAnnee, estComplete, affichage, moisCreation: annee===anneeCreation ? moisCreation : null, anneeCreation: annee===anneeCreation ? anneeCreation : null });
      }
      result.push({
        id: usager.id,
        denomination: usager.denomination || usager.genre_manifestation || usager.nom_evenement || 'Sans nom',
        demandeur: usager.demandeur || usager.organisateurs || '',
        telephone: usager.telephone || '',
        email: usager.email || '',
        montant_mensuel: montantMensuel,
        region: usager.region || 'N/A',
        adresse: usager.adresse || usager.adresse_siege || '',
        uniter: usager.uniter || 1,
        resumeAnnees,
        moisPayesParAnnee,
        anneePayes: anneesPayes,
        totalMoisPayes: paiements.rows.length,
        aPayeAnneeCourante: (anneesPayes[currentYear] || []).length > 0,
        moisPayesAnneeCourante: (anneesPayes[currentYear] || []).length,
        anneeCourante: currentYear,
        estNouveau: false,
        statut_paiement: usager.statut_paiement || 'en_attente',
        created_at: usager.created_at || null,
        moisCreation,
        anneeCreation,
        etoiles: usager.etoiles || null,
        nombre_magasins: usager.nombre_magasins || 0,
        nombre_vehicules: usager.nombre_vehicules || 0,
        jauge_max: usager.jauge_max || 0,
        genre_manifestation: usager.genre_manifestation || null,
        nom_evenement: usager.nom_evenement || null,
        date_evenement: usager.date_evenement || null,
        lieu_evenement: usager.lieu_evenement || null,
        artistes: usager.artistes || null,
        organisateurs: usager.organisateurs || null,
        representant_nom: usager.representant_nom || null,
        representant_par: usager.representant_par || null,
        frequence: usager.frequence || null,
        canal: usager.canal || null,
        lignes: usager.lignes || null,
        trajet: usager.trajet || null,
        horaires: usager.horaires || null,
        activite: usager.activite || null,
        ravinala: usager.ravinala || false
      });
    }
    res.json({ success: true, usagers: result });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ success: false, message: error.message, usagers: [] });
  }
});

// ============================================================
// GET - Nouveaux IDs (24h)
// ============================================================
router.get('/usagers/nouveaux-ids/:type', async (req, res) => {
  const { type } = req.params;
  let tableName = '';
  switch(type) {
    case 'hotel': tableName = 'usagers_hotel'; break;
    case 'grand-surface': tableName = 'usagers_magasin'; break;
    case 'bus': tableName = 'usagers_bus'; break;
    case 'nightclub': tableName = 'usagers_nightclub'; break;
    case 'media': tableName = 'usagers_media'; break;
    case 'occ': tableName = 'usagers_occasionnel'; break;
    default: return res.status(400).json({ success: false });
  }
  try {
    const result = await pool.query(`SELECT id FROM ${tableName} WHERE created_at > NOW() - INTERVAL '24 hours'`);
    let ids = result.rows.map(row => row.id);
    const vusResult = await pool.query(`SELECT usager_id FROM usagers_vus WHERE usager_type = $1`, [type]);
    const idsVus = vusResult.rows.map(row => row.usager_id);
    ids = ids.filter(id => !idsVus.includes(id));
    res.json({ success: true, ids });
  } catch (error) {
    console.error('❌ Erreur nouveaux ids:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET - Nouveaux compteurs
// ============================================================
router.get('/usagers/nouveaux-compteur', async (req, res) => {
  try {
    const nouveaux = { hotel: 0, 'grand-surface': 0, bus: 0, nightclub: 0, media: 0, occ: 0 };
    const types = [
      { name: 'hotel', table: 'usagers_hotel' },
      { name: 'grand-surface', table: 'usagers_magasin' },
      { name: 'bus', table: 'usagers_bus' },
      { name: 'nightclub', table: 'usagers_nightclub' },
      { name: 'media', table: 'usagers_media' },
      { name: 'occ', table: 'usagers_occasionnel' }
    ];
    for (const type of types) {
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM ${type.table} u
        WHERE u.created_at > NOW() - INTERVAL '24 hours'
        AND NOT EXISTS (SELECT 1 FROM usagers_vus v WHERE v.usager_id = u.id AND v.usager_type = $1)
      `, [type.name]);
      nouveaux[type.name] = parseInt(result.rows[0].count) || 0;
    }
    res.json({ success: true, nouveaux });
  } catch (error) {
    console.error('❌ Erreur nouveaux compteur:', error);
    res.json({ success: true, nouveaux: { hotel: 0, 'grand-surface': 0, bus: 0, nightclub: 0, media: 0, occ: 0 } });
  }
});

// ============================================================
// GET - Vérification d'existence d'un usager
// ============================================================
router.get('/usagers/check', async (req, res) => {
  const { denomination, type } = req.query;
  if (!denomination || denomination.length < 3) {
    return res.json({ success: false, exists: false, message: 'Dénomination trop courte' });
  }
  try {
    let tableName = '', query = '';
    switch(type) {
      case 'Hôtel':
        tableName = 'usagers_hotel';
        query = `SELECT demandeur, denomination, adresse_siege, nif_stat, telephone, email, etoiles, ravinala, 
                        representant_nom, representant_adresse, representant_tel, representant_cin, representant_cin_delivree, 
                        representant_cin_lieu, representant_fonction, activite, frais_dossier, montant_mensuel, region, uniter
                 FROM ${tableName} WHERE LOWER(denomination) = LOWER($1) LIMIT 1`;
        break;
      case 'Grand Surface':
        tableName = 'usagers_magasin';
        query = `SELECT demandeur, denomination, adresse_siege, nif_stat, telephone,
                        representant_nom, representant_adresse, representant_tel, representant_cin, representant_cin_delivree, 
                        representant_cin_lieu, representant_fonction, activite, nombre_magasins, frais_dossier, montant_mensuel, region, uniter
                 FROM ${tableName} WHERE LOWER(denomination) = LOWER($1) LIMIT 1`;
        break;
      case 'Bus':
        tableName = 'usagers_bus';
        query = `SELECT demandeur, denomination, adresse_siege, nif_stat, telephone, email,
                        representant_nom, representant_adresse, representant_tel, representant_cin, representant_cin_delivree, 
                        representant_cin_lieu, representant_fonction, nombre_vehicules, lignes, type_bus, trajet, horaires, 
                        frais_dossier, montant_mensuel, region, uniter
                 FROM ${tableName} WHERE LOWER(denomination) = LOWER($1) LIMIT 1`;
        break;
      case 'OCC':
        tableName = 'usagers_occasionnel';
        query = `SELECT organisateurs, representant_par, genre_manifestation, artistes, date_evenement, lieu_evenement,
                        representant_cin, representant_cin_delivree, representant_cin_lieu, adresse, telephone, domicile,
                        confirmation_nom, date_signature, lieu_ajout, region, uniter
                 FROM ${tableName} WHERE LOWER(genre_manifestation) = LOWER($1) LIMIT 1`;
        break;
      case 'Night club':
        tableName = 'usagers_nightclub';
        query = `SELECT demandeur, denomination, adresse_siege, nif_stat, telephone, email,
                        representant_nom, representant_adresse, representant_tel, representant_cin, representant_cin_delivree, 
                        representant_cin_lieu, representant_fonction, jauge_max, horaires, frais_dossier, montant_mensuel, region, uniter
                 FROM ${tableName} WHERE LOWER(denomination) = LOWER($1) LIMIT 1`;
        break;
      case 'Télé/Radio':
        tableName = 'usagers_media';
        query = `SELECT proprietaire_nom, proprietaire_adresse, proprietaire_tel, proprietaire_cin, proprietaire_cin_delivree, proprietaire_cin_lieu,
                        representant_nom, representant_adresse, representant_tel, representant_cin, representant_cin_delivree, representant_cin_lieu,
                        representant_pouvoir_date, representant_pouvoir_par, representant_fonction,
                        denomination, frequence, canal, siege, telephone, email, nif, stat, taux,
                        couverture_capitale, couverture_chef_lieu_province, couverture_chef_lieu_region, couverture_district,
                        horaires_jusqua12, horaires_13a24,
                        confirmation_nom, date_signature, lieu_signature,
                        frais_dossier, region, uniter
                 FROM ${tableName} WHERE LOWER(denomination) = LOWER($1) LIMIT 1`;
        break;
      default: return res.json({ success: false, exists: false, message: 'Type non supporté' });
    }
    const result = await pool.query(query, [denomination]);
    if (result.rows.length > 0) res.json({ success: true, exists: true, data: result.rows[0] });
    else res.json({ success: true, exists: false });
  } catch (error) {
    console.error('❌ Erreur vérification:', error);
    res.status(500).json({ success: false, exists: false, message: error.message });
  }
});

// ============================================================
// GET - Usagers OCC avec détails des artistes
// ============================================================
router.get('/usagers/occasionnels', async (req, res) => {
  try {
    const query = `
      SELECT 
        o.id, o.demandeur, o.denomination, o.nom_evenement, o.genre_manifestation, 
        o.date_evenement, o.lieu_evenement, o.created_at, o.telephone, o.email,
        o.organisateurs, o.representant_par, o.lieu_ajout, o.date_ajout,
        o.adresse, o.domicile, o.artistes,
        o.numero_dossier_global, o.numero_dossier_utilisateur,
        o.confirmation_nom, o.representant_cin, o.representant_cin_delivree,
        o.representant_cin_lieu, o.region, o.uniter,
        COALESCE(
          (SELECT json_agg(json_build_object('id', a.id, 'nom', a.nom, 'prenom', a.prenom, 'role', a.role))
           FROM event_artistes ea
           JOIN artistes a ON ea.artiste_id = a.id
           WHERE ea.event_id = o.id),
          '[]'::json
        ) as artistes_detail
      FROM usagers_occasionnel o
      ORDER BY o.date_evenement DESC, o.created_at DESC
    `;
    const result = await pool.query(query);
    const events = result.rows.map(row => ({
      id: row.id,
      demandeur: row.demandeur,
      denomination: row.denomination,
      nom_evenement: row.nom_evenement,
      genre_manifestation: row.genre_manifestation,
      date_evenement: row.date_evenement,
      lieu_evenement: row.lieu_evenement,
      telephone: row.telephone,
      email: row.email,
      organisateurs: row.organisateurs,
      representant_par: row.representant_par,
      lieu_ajout: row.lieu_ajout,
      date_ajout: row.date_ajout,
      adresse: row.adresse,
      domicile: row.domicile,
      artistes: row.artistes,
      created_at: row.created_at,
      artistesList: row.artistes_detail,
      numero_dossier_global: row.numero_dossier_global,
      numero_dossier_utilisateur: row.numero_dossier_utilisateur,
      confirmation_nom: row.confirmation_nom,
      representant_cin: row.representant_cin,
      representant_cin_delivree: row.representant_cin_delivree,
      representant_cin_lieu: row.representant_cin_lieu,
      region: row.region,
      uniter: row.uniter || 1
    }));
    res.json({ success: true, events });
  } catch (error) {
    console.error('❌ Erreur récupération occasionnels:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET - Usagers par type spécifique
// ============================================================
router.get('/usagers/type/:type', async (req, res) => {
  const { type } = req.params;
  const typeMapping = {
    'hotel': 'usagers_hotel',
    'grand-surface': 'usagers_magasin',
    'media': 'usagers_media',
    'occ': 'usagers_occasionnel',
    'bus': 'usagers_bus',
    'nightclub': 'usagers_nightclub'
  };
  const tableName = typeMapping[type];
  if (!tableName) return res.status(400).json({ success: false, message: 'Type d\'usager invalide' });
  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);
    res.json({ success: true, usagers: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération usagers par type:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET - Tous les usagers
// ============================================================
router.get('/usagers', async (req, res) => {
  try {
    console.log('📡 Requête /api/usagers reçue');
    const tables = [
      { name: 'usagers_hotel', type: 'Hôtel' },
      { name: 'usagers_magasin', type: 'Grand Surface' },
      { name: 'usagers_media', type: 'Télé/Radio' },
      { name: 'usagers_occasionnel', type: 'OCC' },
      { name: 'usagers_bus', type: 'Bus' },
      { name: 'usagers_nightclub', type: 'Night club' }
    ];
    let allUsagers = [];
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table.name}`);
        const usagers = result.rows.map(u => ({ ...u, type_usager: table.type, uniter: u.uniter || 1 }));
        allUsagers = [...allUsagers, ...usagers];
        console.log(`✅ ${table.name}: ${usagers.length} usagers chargés`);
      } catch (tableError) {
        console.error(`❌ Erreur sur ${table.name}:`, tableError.message);
      }
    }
    const uniqueMap = new Map();
    for (const usager of allUsagers) {
      const key = `${usager.id}_${usager.type_usager}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, usager);
    }
    const uniqueUsagers = Array.from(uniqueMap.values());
    uniqueUsagers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    console.log(`✅ Total usagers uniques: ${uniqueUsagers.length}`);
    res.json(uniqueUsagers);
  } catch (error) {
    console.error('❌ Erreur /api/usagers:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET - Usager par ID (ATTENTION : DOIT ÊTRE EN DERNIER)
// ============================================================
router.get('/usagers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const tables = ['usagers_hotel','usagers_magasin','usagers_media','usagers_occasionnel','usagers_bus','usagers_nightclub'];
    for (const table of tables) {
      const result = await pool.query(
        `SELECT *, '${table.replace('usagers_', '')}' as type_usager FROM ${table} WHERE id = $1`,
        [id]
      );
      if (result.rows.length > 0) return res.json(result.rows[0]);
    }
    res.status(404).json({ error: 'Usager non trouvé' });
  } catch (error) {
    console.error('❌ Erreur récupération usager:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET - Détails spécifiques par type
// ============================================================
router.get('/usagers/hotel/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM usagers_hotel WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Hôtel non trouvé' });
    res.json({ success: true, usager: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération hôtel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/usagers/magasin/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM usagers_magasin WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Magasin non trouvé' });
    res.json({ success: true, usager: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération magasin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/usagers/media/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM usagers_media WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Média non trouvé' });
    res.json({ success: true, usager: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération média:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/usagers/occasionnel/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM usagers_occasionnel WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'OCC non trouvé' });
    res.json({ success: true, usager: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération OCC:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/usagers/bus/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM usagers_bus WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Bus non trouvé' });
    res.json({ success: true, usager: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération bus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/usagers/nightclub/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM usagers_nightclub WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Night club non trouvé' });
    res.json({ success: true, usager: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération nightclub:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET - Compteurs d'un utilisateur
// ============================================================
router.get('/users/counters/:userId', async (req, res) => {
  const { userId } = req.params;
  const year = req.query.year || new Date().getFullYear();
  try {
    const result = await pool.query(
      `SELECT type_usager, compteur FROM compteurs_dossiers_utilisateurs 
       WHERE utilisateur_id = $1 AND annee = $2`,
      [parseInt(userId), parseInt(year)]
    );
    const compteurs = {};
    for (const row of result.rows) compteurs[row.type_usager] = row.compteur;
    const types = ['Hôtel','Grand Surface','Télé/Radio','OCC','Bus','Night club'];
    for (const type of types) if (!compteurs[type]) compteurs[type] = 0;
    res.json({ success: true, compteurs, year: parseInt(year) });
  } catch (error) {
    console.error('❌ Erreur récupération compteurs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET - Nombre total de dossiers OCC
// ============================================================
router.get('/occ/total-count', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const result = await pool.query(`SELECT COUNT(*) as total FROM usagers_occasionnel WHERE EXTRACT(YEAR FROM created_at) = $1`, [currentYear]);
    const total = parseInt(result.rows[0].total) || 0;
    res.json({ success: true, total, year: currentYear });
  } catch (error) {
    console.error('❌ Erreur récupération total OCC:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET - Numéro de dossier OCC
// ============================================================
router.get('/occ/dossier-number', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth()+1).padStart(2,'0');
    const currentDay = String(new Date().getDate()).padStart(2,'0');
    const countResult = await pool.query(`SELECT COUNT(*) as total FROM usagers_occasionnel WHERE EXTRACT(YEAR FROM created_at) = $1`, [currentYear]);
    const totalCount = parseInt(countResult.rows[0].total) + 1;
    const dossierNumber = `${totalCount}/${currentDay}/${currentMonth}/${currentYear}`;
    res.json({ success: true, dossierNumber, totalCount });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// POST - Ajouter un usager
// ============================================================
router.post('/usagers', async (req, res) => {
  const { type, userId, ...data } = req.body;
  console.log(`📝 Ajout usager - Type: ${type}, Utilisateur ID: ${userId}`);
  if (!type) return res.status(400).json({ success: false, message: 'Type d\'usager non spécifié' });
  try {
    let tableName = '', insertData = {}, uniter = data.uniter || 1;
    const typeMapping = {
      'Hôtel': 'usagers_hotel',
      'Grand Surface': 'usagers_magasin',
      'Bus': 'usagers_bus',
      'Night club': 'usagers_nightclub',
      'Télé/Radio': 'usagers_media',
      'OCC': 'usagers_occasionnel'
    };
    tableName = typeMapping[type];
    if (!tableName) return res.status(400).json({ success: false, message: 'Type d\'usager inconnu' });
    switch(type) {
      case 'Hôtel':
        insertData = { 
          demandeur: data.demandeur || '', denomination: data.denomination || '', 
          adresse_siege: data.adresseSiege || '', nif_stat: data.nifStat || '', 
          telephone: data.telephone || '', email: data.email || '', 
          etoiles: data.etoiles || '', ravinala: data.ravinala || false, 
          representant_nom: data.representantNom || '', representant_adresse: data.representantAdresse || '', 
          representant_tel: data.representantTel || '', representant_cin: data.representantCin || '', 
          representant_cin_delivree: data.representantCinDelivree || null, 
          representant_cin_lieu: data.representantCinLieu || '', 
          representant_fonction: data.representantFonction || '', activite: data.activite || '', 
          moyens_communication: JSON.stringify(data.moyensCommunication || {}), 
          total: data.total || '', a_compter_du: data.aCompterDu || null, 
          echeance: data.echeance || null, confirmation_nom: data.confirmationNom || '', 
          date_signature: data.dateSignature || null, lieu_signature: data.lieuSignature || '', 
          type_paiement: 'mensuel', montant_mensuel: parseFloat(data.montantMensuel) || 0, 
          frais_dossier: parseFloat(data.fraisDossier) || 0,
          region: data.region || '', uniter: uniter
        };
        break;
      case 'Grand Surface':
        insertData = { 
          demandeur: data.demandeur || '', denomination: data.denomination || '', 
          adresse_siege: data.adresseSiege || '', nif_stat: data.nifStat || '', 
          telephone: data.telephone || '', 
          representant_nom: data.representantNom || '', representant_adresse: data.representantAdresse || '', 
          representant_tel: data.representantTel || '', representant_cin: data.representantCin || '', 
          representant_cin_delivree: data.representantCinDelivree || null, 
          representant_cin_lieu: data.representantCinLieu || '', 
          representant_fonction: data.representantFonction || '', activite: data.activite || '', 
          nombre_magasins: data.nombreMagasins ? parseInt(data.nombreMagasins) : 0, 
          moyens_communication: JSON.stringify(data.moyensCommunication || {}), 
          total: data.total || '', a_compter_du: data.aCompterDu || null, 
          echeance: data.echeance || null, confirmation_nom: data.confirmationNom || '', 
          date_signature: data.dateSignature || null, lieu_signature: data.lieuSignature || '', 
          type_paiement: 'mensuel', montant_mensuel: parseFloat(data.montantMensuel) || 0, 
          frais_dossier: parseFloat(data.fraisDossier) || 0,
          region: data.region || '', uniter: uniter
        };
        break;
      case 'Bus':
        insertData = { 
          demandeur: data.demandeur || '', denomination: data.denomination || '', 
          adresse_siege: data.adresseSiege || '', nif_stat: data.nifStat || '', 
          telephone: data.telephone || '', email: data.email || '', 
          representant_nom: data.representantNom || '', representant_adresse: data.representantAdresse || '', 
          representant_tel: data.representantTel || '', representant_cin: data.representantCin || '', 
          representant_cin_delivree: data.representantCinDelivree || null, 
          representant_cin_lieu: data.representantCinLieu || '', 
          representant_fonction: data.representantFonction || '', 
          nombre_vehicules: data.nombreVehicules ? parseInt(data.nombreVehicules) : 0, 
          lignes: data.lignes || '', type_bus: data.typeBus || '', trajet: data.trajet || '', 
          horaires: data.horaires || '', zones_desservies: data.zonesDesservies || '', 
          type_paiement: 'mensuel', montant_mensuel: parseFloat(data.montantMensuel) || 0, 
          frais_dossier: parseFloat(data.fraisDossier) || 0,
          region: data.region || '', confirmation_nom: data.confirmationNom || '',
          date_signature: data.dateSignature || null, lieu_signature: data.lieuSignature || '',
          uniter: uniter
        };
        break;
      case 'Night club':
        insertData = { 
          demandeur: data.demandeur || '', denomination: data.denomination || '', 
          adresse_siege: data.adresseSiege || '', nif_stat: data.nifStat || '', 
          telephone: data.telephone || '', email: data.email || '', 
          representant_nom: data.representantNom || '', representant_adresse: data.representantAdresse || '', 
          representant_tel: data.representantTel || '', representant_cin: data.representantCin || '', 
          representant_cin_delivree: data.representantCinDelivree || null, 
          representant_cin_lieu: data.representantCinLieu || '', 
          representant_fonction: data.representantFonction || '', 
          jauge_max: data.jaugeMax ? parseInt(data.jaugeMax) : 0, 
          horaires: data.horaires || '', moyens_communication: JSON.stringify(data.moyensCommunication || {}),
          total: data.total || '', a_compter_du: data.aCompterDu || null,
          echeance: data.echeance || null, type_paiement: 'mensuel', 
          montant_mensuel: parseFloat(data.montantMensuel) || 0, frais_dossier: parseFloat(data.fraisDossier) || 0,
          region: data.region || '', confirmation_nom: data.confirmationNom || '',
          date_signature: data.dateSignature || null, lieu_signature: data.lieuSignature || '',
          uniter: uniter
        };
        break;
      case 'Télé/Radio':
        insertData = { 
          proprietaire_nom: data.proprietaireNom || '', proprietaire_adresse: data.proprietaireAdresse || '', 
          proprietaire_tel: data.proprietaireTel || '', proprietaire_cin: data.proprietaireCin || '', 
          proprietaire_cin_delivree: data.proprietaireCinDelivree || null, 
          proprietaire_cin_lieu: data.proprietaireCinLieu || '', 
          representant_nom: data.representantNom || '', representant_adresse: data.representantAdresse || '', 
          representant_tel: data.representantTel || '', representant_cin: data.representantCin || '', 
          representant_cin_delivree: data.representantCinDelivree || null, 
          representant_cin_lieu: data.representantCinLieu || '', 
          representant_pouvoir_date: data.representantPouvoirDate || null, 
          representant_pouvoir_par: data.representantPouvoirPar || '', 
          representant_fonction: data.representantFonction || '', denomination: data.denomination || '', 
          frequence: data.frequence || '', canal: data.canal || '', siege: data.siege || '', 
          telephone: data.telephone || '', email: data.email || '', nif: data.nif || '', 
          stat: data.stat || '', taux: data.taux || '', 
          couverture_capitale: data.couvertureCapitale || false, 
          couverture_chef_lieu_province: data.couvertureChefLieuProvince || false, 
          couverture_chef_lieu_region: data.couvertureChefLieuRegion || false, 
          couverture_district: data.couvertureDistrict || false, 
          horaires_jusqua12: data.horairesJusqua12 || false, horaires_13a24: data.horaires13a24 || false, 
          has_regions: data.hasRegions || false, regions_detail: JSON.stringify(data.regionsDetail || []), 
          type_paiement: 'mensuel', montant_mensuel: parseFloat(data.montantMensuel) || 0, 
          frais_dossier: parseFloat(data.fraisDossier) || 0,
          region: data.region || '', confirmation_nom: data.confirmationNom || '',
          date_signature: data.dateSignature || null, lieu_signature: data.lieuSignature || '',
          uniter: uniter
        };
        break;
      case 'OCC':
        insertData = { 
          organisateurs: data.organisateurs || '', 
          representant_par: data.representantPar || '',
          genre_manifestation: data.genreManifestation || '', 
          artistes: data.artistes || '',
          date_evenement: data.dateEvenement || null, 
          lieu_evenement: data.lieuEvenement || '',
          representant_cin: data.representantCin || '', 
          representant_cin_delivree: data.representantCinDelivree || null,
          representant_cin_lieu: data.representantCinLieu || '', 
          adresse: data.adresse || '',
          telephone: data.telephone || '', 
          domicile: data.domicile || '',
          confirmation_nom: data.confirmationNom || '', 
          date_signature: data.dateSignature || null,
          lieu_ajout: data.lieuAjout || '', 
          date_ajout: data.dateAjout || null,
          region: data.region || '', 
          demandeur: data.organisateurs || '',
          denomination: data.genreManifestation || '', 
          numero_dossier_global: data.numeroDossierGlobal || '',
          numero_dossier_utilisateur: data.numeroDossierUtilisateur || '',
          uniter: data.uniter || 1
          // ⭐ AUCUN CHAMP D'ARGENT
        };
        break;
      default: return res.status(400).json({ success: false, message: 'Type d\'usager inconnu' });
    }
    const columns = Object.keys(insertData);
    const values = Object.values(insertData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`;
    const result = await pool.query(query, values);
    const newId = result.rows[0].id;
    
    if (userId) {
      const currentYear = new Date().getFullYear();
      const userIdInt = parseInt(userId);
      let counterResult = await pool.query(
        `SELECT compteur, id FROM compteurs_dossiers_utilisateurs 
         WHERE utilisateur_id = $1 AND annee = $2 AND type_usager = $3`,
        [userIdInt, currentYear, type]
      );
      let nouveauCompteur = 0;
      if (counterResult.rows.length > 0) {
        nouveauCompteur = counterResult.rows[0].compteur + 1;
        await pool.query(`UPDATE compteurs_dossiers_utilisateurs SET compteur = $1, updated_at = NOW() WHERE id = $2`, [nouveauCompteur, counterResult.rows[0].id]);
      } else {
        await pool.query(`INSERT INTO compteurs_dossiers_utilisateurs (utilisateur_id, annee, compteur, type_usager) VALUES ($1, $2, 1, $3)`, [userIdInt, currentYear, type]);
        nouveauCompteur = 1;
      }
      const prefix = data.prefix || '';
      const trimestre = Math.ceil((new Date().getMonth()+1)/4);
      const numeroDossierUtilisateur = `${prefix} ${nouveauCompteur}/${trimestre}/${currentYear}`;
      await pool.query(`UPDATE ${tableName} SET numero_dossier_utilisateur = $1 WHERE id = $2`, [numeroDossierUtilisateur, newId]);
    }
    
    if (type === 'OCC') {
      const allArtists = [];
      if (data.artistes && data.artistes.trim() !== '') allArtists.push({ nom: data.artistes.trim(), prenom: '', role: 'Artiste principal' });
      if (data.otherArtistsDetail && data.otherArtistsDetail.length > 0) {
        for (const artist of data.otherArtistsDetail) {
          if (artist.nom && artist.nom.trim() !== '') allArtists.push({ nom: artist.nom.trim(), prenom: artist.prenom||'', role: artist.role||'Artiste participant' });
        }
      }
      for (const artist of allArtists) {
        let artisteId;
        const existingArtiste = await pool.query('SELECT id FROM artistes WHERE LOWER(nom) = LOWER($1)', [artist.nom]);
        if (existingArtiste.rows.length === 0) {
          const newArtiste = await pool.query('INSERT INTO artistes (nom, prenom, role) VALUES ($1, $2, $3) RETURNING id', [artist.nom, artist.prenom, artist.role]);
          artisteId = newArtiste.rows[0].id;
        } else artisteId = existingArtiste.rows[0].id;
        await pool.query('INSERT INTO event_artistes (event_id, artiste_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [newId, artisteId]);
      }
    }
    console.log(`✅ ${type} ajouté avec succès - ID: ${newId}`);
    res.json({ success: true, id: newId, message: `${type} ajouté avec succès` });
  } catch (error) {
    console.error('❌ Erreur ajout usager:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// PUT - Modifier un usager
// ============================================================
router.put('/usagers/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    denomination, demandeur, telephone, email, region, type_usager, adresse,
    confirmation_nom, representant_cin, representant_cin_delivree, 
    representant_cin_lieu, representant_par, domicile, 
    frais_dossier, montant_mensuel, uniter, etoiles, ravinala, activite,
    nombre_magasins, jauge_max, horaires, representant_nom, representant_adresse,
    representant_tel, representant_fonction, lieu_signature, date_signature,
    frequence, canal, siege, nif, stat, taux, nombre_vehicules,
    lignes, type_bus, trajet, organisateurs, representant_par_occ,
    genre_manifestation, artistes, date_evenement, lieu_evenement, lieu_ajout
  } = req.body;

  console.log('📝 Requête PUT reçue pour ID:', id);
  if (!denomination) return res.status(400).json({ success: false, message: 'La dénomination est obligatoire' });
  try {
    let tableName = '', typeValue = type_usager;
    if (typeValue === 'Télé/Radio' || typeValue === 'Media') typeValue = 'Télé/Radio';
    switch(typeValue) {
      case 'Hôtel': tableName = 'usagers_hotel'; break;
      case 'Grand Surface': tableName = 'usagers_magasin'; break;
      case 'Télé/Radio': tableName = 'usagers_media'; break;
      case 'OCC': tableName = 'usagers_occasionnel'; break;
      case 'Bus': tableName = 'usagers_bus'; break;
      case 'Night club': tableName = 'usagers_nightclub'; break;
      default: return res.status(400).json({ success: false, message: 'Type d\'usager invalide' });
    }
    const checkResult = await pool.query(`SELECT id FROM ${tableName} WHERE id = $1`, [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Usager non trouvé' });
    const updateFields = [], updateValues = [];
    let paramIndex = 1;
    const commonFields = {
      denomination, demandeur, telephone, email, region,
      confirmation_nom, representant_cin, representant_cin_delivree,
      representant_cin_lieu, representant_nom, representant_adresse,
      representant_tel, representant_fonction, lieu_signature, date_signature,
      frais_dossier, uniter, adresse_siege: adresse,
      etoiles, ravinala, activite, nombre_magasins, jauge_max, horaires,
      frequence, canal, siege, nif, stat, taux,
      nombre_vehicules, lignes, type_bus, trajet,
      organisateurs, representant_par: representant_par_occ,
      genre_manifestation, artistes, date_evenement, lieu_evenement, lieu_ajout,
      domicile
    };
    if (typeValue !== 'OCC') {
      commonFields.montant_mensuel = montant_mensuel;
    }
    for (const [key, value] of Object.entries(commonFields)) {
      if (value !== undefined && value !== null && value !== '') {
        updateFields.push(`${key} = $${paramIndex}`);
        if (key === 'frais_dossier' || key === 'montant_mensuel' || key === 'uniter') {
          updateValues.push(parseFloat(value) || 0);
        } else if (key === 'nombre_magasins' || key === 'jauge_max' || key === 'nombre_vehicules') {
          updateValues.push(parseInt(value) || 0);
        } else {
          updateValues.push(value);
        }
        paramIndex++;
      }
    }
    if (updateFields.length === 0) return res.status(400).json({ success: false, message: 'Aucun champ à modifier' });
    updateValues.push(id);
    const query = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    await pool.query(query, updateValues);
    try {
      const adminToken = req.headers.adminToken || req.headers['admintoken'];
      let modifiedBy = 'Administrateur';
      if (adminToken) {
        const userResult = await pool.query(`SELECT nom FROM utilisateurs WHERE role = 'super_admin' OR role = 'daf' LIMIT 1`);
        if (userResult.rows.length > 0) modifiedBy = userResult.rows[0].nom;
      }
      await pool.query(`INSERT INTO notifications (message, type, usager_id, created_at) VALUES ($1, $2, $3, NOW())`, [`MODIFICATION: Usager "${denomination}" modifié par ${modifiedBy}`, 'update', parseInt(id)]);
    } catch (notifError) { console.log('⚠️ Erreur notification:', notifError.message); }
    res.json({ success: true, message: 'Usager modifié avec succès' });
  } catch (error) {
    console.error('❌ Erreur modification usager:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// DELETE - Supprimer un usager (avec cascade paiements)
// ============================================================
router.delete('/usagers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log('🗑️ Requête DELETE reçue pour ID:', id);
    const tables = [
      { name: 'usagers_hotel', type: 'Hôtel' },
      { name: 'usagers_magasin', type: 'Grand Surface' },
      { name: 'usagers_media', type: 'Télé/Radio' },
      { name: 'usagers_occasionnel', type: 'OCC' },
      { name: 'usagers_bus', type: 'Bus' },
      { name: 'usagers_nightclub', type: 'Night club' }
    ];
    let foundTable = null, usagerData = null;
    for (const table of tables) {
      const result = await pool.query(`SELECT * FROM ${table.name} WHERE id = $1`, [id]);
      if (result.rows.length > 0) { foundTable = table; usagerData = result.rows[0]; break; }
    }
    if (!foundTable || !usagerData) return res.status(404).json({ success: false, message: 'Usager non trouvé' });
    const denomination = usagerData.denomination || 'Inconnu';
    const typeToPaiementType = {
      'Hôtel': 'hotel',
      'Grand Surface': 'grand-surface',
      'Télé/Radio': 'media',
      'OCC': 'occ',
      'Bus': 'bus',
      'Night club': 'nightclub'
    };
    const paiementType = typeToPaiementType[foundTable.type];
    if (paiementType) {
      const deleteResult = await pool.query(`DELETE FROM paiements WHERE usager_id = $1 AND usager_type = $2`, [id, paiementType]);
      console.log(`✅ ${deleteResult.rowCount} paiements supprimés pour l'usager ${id}`);
    }
    if (foundTable.type === 'OCC') await pool.query(`DELETE FROM event_artistes WHERE event_id = $1`, [id]);
    await pool.query(`DELETE FROM delete_requests WHERE usager_id = $1`, [id]);
    await pool.query(`DELETE FROM notifications WHERE usager_id = $1`, [id]);
    await pool.query(`DELETE FROM ${foundTable.name} WHERE id = $1`, [id]);
    try {
      const adminToken = req.headers.adminToken || req.headers['admintoken'];
      let deletedBy = 'Administrateur', userId = 1;
      if (adminToken) {
        const userResult = await pool.query(`SELECT id, nom FROM utilisateurs WHERE role = 'super_admin' OR role = 'daf' LIMIT 1`);
        if (userResult.rows.length > 0) { deletedBy = userResult.rows[0].nom; userId = userResult.rows[0].id; }
      }
      await pool.query(`INSERT INTO delete_history (usager_nom, usager_type, deleted_by, deleted_by_role, user_id, details, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [
        denomination, foundTable.type, deletedBy, 'admin', userId,
        JSON.stringify({ demandeur: usagerData.demandeur || 'Inconnu', region: usagerData.region || 'Non spécifiée', telephone: usagerData.telephone || 'Non spécifié', uniter: usagerData.uniter || 1 })
      ]);
    } catch (historyError) { console.error('❌ Erreur historique:', historyError.message); }
    res.json({ success: true, message: `Usager "${denomination}" et ses paiements supprimés avec succès` });
  } catch (error) {
    console.error('❌ Erreur suppression usager:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// POST - Marquer un usager comme vu
// ============================================================
router.post('/usagers/marquer-vu', async (req, res) => {
  const { usagerId, type } = req.body;
  try {
    await pool.query(`INSERT INTO usagers_vus (usager_id, usager_type, vu_le) VALUES ($1, $2, NOW()) ON CONFLICT (usager_id, usager_type) DO NOTHING`, [usagerId, type]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur marquer vu:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;