// server/routes/facture.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// ============================================================
// 0. RÉCUPÉRER LE NOM DU DAF ACTIF
// ============================================================
const getDAFName = async () => {
  try {
    const result = await pool.query(
      `SELECT nom FROM utilisateurs WHERE role = 'daf' AND statut = 'actif' LIMIT 1`
    );
    if (result.rows.length > 0) {
      return result.rows[0].nom;
    }
    const fallbackResult = await pool.query(
      `SELECT nom FROM utilisateurs WHERE role = 'super_admin' AND statut = 'actif' LIMIT 1`
    );
    if (fallbackResult.rows.length > 0) {
      return fallbackResult.rows[0].nom;
    }
    return 'Directeur Financier';
  } catch (error) {
    console.error('❌ Erreur récupération DAF:', error);
    return 'Directeur Financier';
  }
};

// ============================================================
// 0.1 RÉCUPÉRER LE DERNIER NUMÉRO DE QUITTANCE
// ============================================================
const getLastQuittanceNumber = async () => {
  try {
    const result = await pool.query(`
      SELECT quittance FROM facture_usager 
      WHERE quittance IS NOT NULL AND quittance != ''
      ORDER BY id DESC LIMIT 1
    `);
    if (result.rows.length > 0 && result.rows[0].quittance) {
      const quittanceStr = result.rows[0].quittance;
      const num = parseInt(quittanceStr.replace(/\D/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  } catch (error) {
    console.error('❌ Erreur récupération dernier quittance:', error);
    return 0;
  }
};

// ============================================================
// 0.2 FORMATER LE NUMÉRO DE QUITTANCE SUR 7 CHIFFRES
// ============================================================
const formatQuittance = (num) => {
  return String(num).padStart(7, '0');
};

// ============================================================
// 0.3 EXTRACTION GÉNÉRIQUE DU MONTANT DEPUIS LA BASE
// Teste TOUTES les colonnes possibles, quel que soit le type d'usager.
// ============================================================
const extractMontantDepuisBase = (usagerData) => {
  const candidats = [
    usagerData.montant_mensuel,
    usagerData.montant_total,
    usagerData.montant,   // ✅ utilisé par OCC
    usagerData.taux       // ✅ utilisé par Média (Radio/TV)
  ];
  for (const val of candidats) {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) return num;
  }
  return 0;
};

// ============================================================
// 1. CRÉER UNE FACTURE À PARTIR D'UN USAGER
// ============================================================
router.post('/factures/creer', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { 
      usagerId, 
      usagerType, 
      userId,
      typeFacture,
      regionUsager,
      personneRecu,
      montantMensuel: frontMontantMensuel,
      fraisDossier: frontFraisDossier,
      montantRetard: frontMontantRetard,
      isRetard: frontIsRetard,
      uniter: frontUniter,
      soitTotal: frontSoitTotal
    } = req.body;

    console.log('📥 Données reçues du frontend:', {
      usagerId,
      usagerType,
      userId,
      frontMontantMensuel,
      frontFraisDossier,
      frontMontantRetard,
      frontIsRetard,
      frontUniter,
      frontSoitTotal
    });

    // ✅ Déterminer la table selon le type
    let tableName = '';
    
    switch(usagerType) {
      case 'hotel': 
        tableName = 'usagers_hotel'; 
        break;
      case 'grand-surface': 
        tableName = 'usagers_magasin'; 
        break;
      case 'media': 
        tableName = 'usagers_media'; 
        break;
      case 'bus': 
        tableName = 'usagers_bus'; 
        break;
      case 'nightclub': 
        tableName = 'usagers_nightclub'; 
        break;
      case 'occ': 
        tableName = 'usagers_occasionnel'; 
        break;
      default: 
        throw new Error('Type d\'usager non reconnu');
    }

    console.log(`📋 Table: ${tableName}`);

    // ✅ Récupérer les données de l'usager
    const usagerResult = await client.query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [usagerId]
    );
    
    if (usagerResult.rows.length === 0) {
      throw new Error('Usager non trouvé');
    }
    const usagerData = usagerResult.rows[0];

    console.log('📊 Données de l\'usager (colonnes montants disponibles):', {
      id: usagerData.id,
      denomination: usagerData.denomination,
      montant_mensuel: usagerData.montant_mensuel,
      montant_total: usagerData.montant_total,
      montant: usagerData.montant,
      taux: usagerData.taux,
      frais_dossier: usagerData.frais_dossier,
      uniter: usagerData.uniter,
      region: usagerData.region,
      soit_total: usagerData.soit_total,
      is_retard: usagerData.is_retard,
      montant_retard: usagerData.montant_retard
    });

    // ✅ RÉCUPÉRER LES MONTANTS - VERSION CORRIGÉE ET GÉNÉRIQUE
    let montantMensuel = 0;
    let fraisDossier = 5000;
    let montantRetard = 0;
    let isRetard = false;
    let uniter = 1;
    let soitTotal = 0;

    // 🔥 1. PRIORITÉ ABSOLUE aux valeurs du frontend
    if (frontMontantMensuel !== undefined && frontMontantMensuel > 0) {
      montantMensuel = frontMontantMensuel;
      console.log('📊 Montant du frontend:', montantMensuel);
    }
    
    if (frontFraisDossier !== undefined && frontFraisDossier > 0) {
      fraisDossier = frontFraisDossier;
    }
    
    if (frontUniter !== undefined && frontUniter > 0) {
      uniter = frontUniter;
    }
    
    if (frontMontantRetard !== undefined && frontMontantRetard > 0) {
      montantRetard = frontMontantRetard;
    }
    if (frontIsRetard !== undefined) {
      isRetard = frontIsRetard;
    }
    
    if (frontSoitTotal !== undefined && frontSoitTotal > 0) {
      soitTotal = frontSoitTotal;
    }

    // 🔥 2. SI LES VALEURS DU FRONTEND SONT À 0, RÉCUPÉRER DE LA BASE
    if (montantMensuel === 0) {
      console.log('⚠️ Montant frontend à 0, récupération depuis la base...');
      montantMensuel = extractMontantDepuisBase(usagerData);
      console.log(`📊 [${usagerType}] Montant récupéré depuis la base:`, montantMensuel);

      // Cas spécifique OCC : retard éventuel stocké en base
      if (usagerType === 'occ') {
        montantRetard = parseFloat(usagerData.montant_retard) || montantRetard;
        isRetard = usagerData.is_retard !== undefined && usagerData.is_retard !== null
          ? usagerData.is_retard
          : isRetard;
      }
    }

    // 🔥 3. SI FRAIS DOSSIER À 0, PRENDRE DE LA BASE OU 5000
    if (fraisDossier === 0) {
      fraisDossier = parseFloat(usagerData.frais_dossier) || 5000;
    }

    // 🔥 4. SI UNITER À 0, PRENDRE DE LA BASE OU 1
    if (uniter === 0) {
      uniter = parseInt(usagerData.uniter) || 1;
    }

    // 🔥 5. SI SOIT TOTAL À 0, LE CALCULER
    if (soitTotal === 0 && montantMensuel > 0) {
      const baseTotal = montantMensuel * uniter;
      const retard = isRetard ? montantRetard : 0;
      soitTotal = baseTotal + fraisDossier + retard;
      console.log('🔄 Soit_total recalculé:', soitTotal);
    }

    // 🔥 6. DERNIER SECOURS - SI TOUJOURS 0, PRENDRE DEPUIS LA BASE
    if (soitTotal === 0) {
      soitTotal = parseFloat(usagerData.soit_total) || parseFloat(usagerData.montant_total) || 0;
      console.log('🔄 Soit_total depuis base:', soitTotal);
    }

    console.log('📊 MONTANTS FINAUX:', {
      usagerType,
      montantMensuel,
      fraisDossier,
      montantRetard,
      isRetard,
      uniter,
      soitTotal
    });

    // Générer les références
    const lastRefResult = await client.query(
      `SELECT MAX(ref_omda) as max_ref FROM facture_usager`
    );
    const newRefOmda = (lastRefResult.rows[0].max_ref || 0) + 1;

    const typeMapping = {
      'hotel': 'HTL',
      'grand-surface': 'MGS',
      'media': 'RDP',
      'bus': 'TRP',
      'nightclub': 'NGT',
      'occ': 'OCC'
    };
    const refClientType = typeMapping[usagerType] || 'AUT';

    // ✅ Récupérer le prochain numéro de quittance
    const lastQuittanceNum = await getLastQuittanceNumber();
    const nextQuittanceNum = lastQuittanceNum + 1;
    const quittanceValue = formatQuittance(nextQuittanceNum);

    console.log(`📋 Prochain numéro de quittance: ${quittanceValue}`);

    // ✅ Construction de la requête d'insertion
    const query = `
      INSERT INTO facture_usager (
        ref_omda, num_facture, num_facture_type, ref_client_type,
        ref_usager, type_facture, region_usager, date_ajout,
        denomination, demandeur, telephone, email, adresse,
        representant_nom, representant_adresse, representant_tel,
        representant_cin, representant_cin_delivree, representant_cin_lieu,
        representant_fonction, activite, etoiles, ravinala,
        nombre_magasins, nombre_vehicules, lignes, type_bus,
        trajet, horaires, zones_desservies, jauge_max,
        frequence, canal, siege, nif, stat, taux,
        organisateurs, representant_par, genre_manifestation,
        artistes, date_evenement, lieu_evenement, domicile,
        lieu_ajout, date_signature, confirmation_nom,
        personne_recu, quittance, quittance_validee,
        moyens_communication, a_compter_du, echeance,
        montant_mensuel, frais_dossier, montant_retard,
        is_retard, soit_total, uniter,
        numero_dossier_utilisateur, numero_dossier_global,
        statut, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
        $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46,
        $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57,
        $58, $59, $60, $61, $62, $63
      ) RETURNING id
    `;

    const values = [
      newRefOmda,                                           // 1
      String(newRefOmda).padStart(4, '0'),                  // 2
      'A',                                                  // 3
      refClientType,                                        // 4
      usagerId,                                             // 5
      typeFacture || 'DAFC',                                // 6
      regionUsager || usagerData.region || '',             // 7
      new Date().toISOString().split('T')[0],              // 8
      usagerData.denomination || usagerData.nom_evenement || usagerData.genre_manifestation || '', // 9
      usagerData.demandeur || usagerData.proprietaire_nom || usagerData.organisateurs || '', // 10
      usagerData.telephone || '',                          // 11
      usagerData.email || '',                              // 12
      usagerData.adresse_siege || usagerData.siege || usagerData.adresse || '', // 13
      usagerData.representant_nom || usagerData.representant_par || '', // 14
      usagerData.representant_adresse || usagerData.proprietaire_adresse || '', // 15
      usagerData.representant_tel || usagerData.proprietaire_tel || '', // 16
      usagerData.representant_cin || usagerData.proprietaire_cin || '', // 17
      usagerData.representant_cin_delivree || usagerData.proprietaire_cin_delivree || null, // 18
      usagerData.representant_cin_lieu || usagerData.proprietaire_cin_lieu || '', // 19
      usagerData.representant_fonction || usagerData.proprietaire_fonction || '', // 20
      usagerData.activite || '',                           // 21
      usagerData.etoiles || '',                            // 22
      usagerData.ravinala || false,                        // 23
      usagerData.nombre_magasins || 0,                     // 24
      usagerData.nombre_vehicules || 0,                    // 25
      usagerData.lignes || '',                             // 26
      usagerData.type_bus || '',                           // 27
      usagerData.trajet || '',                             // 28
      usagerData.horaires || '',                           // 29
      usagerData.zones_desservies || '',                   // 30
      usagerData.jauge_max || 0,                           // 31
      usagerData.frequence || '',                          // 32
      usagerData.canal || '',                              // 33
      usagerData.siege || '',                              // 34
      usagerData.nif || '',                                // 35
      usagerData.stat || '',                               // 36
      usagerData.taux || 0,                                // 37
      usagerData.organisateurs || '',                      // 38
      usagerData.representant_par || '',                   // 39
      usagerData.genre_manifestation || '',                // 40
      usagerData.artistes || '',                           // 41
      usagerData.date_evenement || null,                   // 42
      usagerData.lieu_evenement || '',                     // 43
      usagerData.domicile || usagerData.adresse || '',     // 44
      usagerData.lieu_ajout || usagerData.lieu_signature || 'Antananarivo', // 45
      usagerData.date_signature || null,                   // 46
      usagerData.confirmation_nom || usagerData.demandeur || '', // 47
      personneRecu || '',                                  // 48
      quittanceValue,                                      // 49
      false,                                               // 50
      usagerData.moyens_communication || null,             // 51
      usagerData.a_compter_du || null,                     // 52
      usagerData.echeance || null,                         // 53
      montantMensuel,                                      // 54 ✅
      fraisDossier,                                        // 55 ✅
      montantRetard,                                       // 56 ✅
      isRetard,                                            // 57 ✅
      soitTotal,                                           // 58 ✅
      uniter,                                              // 59 ✅
      usagerData.numero_dossier_utilisateur || '',         // 60
      usagerData.numero_dossier_global || '',              // 61
      'brouillon',                                          // 62
      userId                                               // 63
    ];

    const result = await client.query(query, values);
    
    const dafName = await getDAFName();
    
    await client.query('COMMIT');
    
    console.log('✅ Facture créée avec succès, ID:', result.rows[0].id);
    console.log('📊 Montants STOCKÉS dans facture_usager:', { 
      montantMensuel, 
      fraisDossier, 
      montantRetard, 
      isRetard, 
      uniter, 
      soitTotal 
    });

    res.json({
      success: true,
      message: 'Facture créée avec succès',
      factureId: result.rows[0].id,
      refOmda: newRefOmda,
      numFacture: String(newRefOmda).padStart(4, '0'),
      dafName: dafName,
      quittance: quittanceValue,
      montantMensuel: montantMensuel,
      fraisDossier: fraisDossier,
      montantRetard: montantRetard,
      isRetard: isRetard,
      uniter: uniter,
      soitTotal: soitTotal
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur création facture:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la facture'
    });
  } finally {
    client.release();
  }
});

// ============================================================
// 2. RÉCUPÉRER LE NOM DU DAF (ROUTE API)
// ============================================================
router.get('/daf/name', async (req, res) => {
  try {
    const dafName = await getDAFName();
    res.json({
      success: true,
      dafName: dafName
    });
  } catch (error) {
    console.error('❌ Erreur récupération DAF:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// 2.1 RÉCUPÉRER LE DERNIER NUMÉRO DE QUITTANCE
// ============================================================
router.get('/quittance/last', async (req, res) => {
  try {
    const lastNum = await getLastQuittanceNumber();
    const nextNum = lastNum + 1;
    res.json({
      success: true,
      lastQuittance: lastNum,
      nextQuittance: formatQuittance(nextNum)
    });
  } catch (error) {
    console.error('❌ Erreur récupération quittance:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// 3. RÉCUPÉRER UNE FACTURE PAR ID
// ============================================================
router.get('/factures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM facture_usager WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    const dafName = await getDAFName();
    result.rows[0].daf_nom = dafName;
    
    // ✅ S'assurer que la quittance est sur 7 chiffres
    if (!result.rows[0].quittance || result.rows[0].quittance === '') {
      const lastNum = await getLastQuittanceNumber();
      const nextNum = lastNum + 1;
      result.rows[0].quittance = formatQuittance(nextNum);
    } else {
      const num = parseInt(result.rows[0].quittance.replace(/\D/g, ''));
      if (!isNaN(num)) {
        result.rows[0].quittance = formatQuittance(num);
      }
    }
    
    console.log('📊 Facture récupérée avec montants:', {
      id: result.rows[0].id,
      montantMensuel: result.rows[0].montant_mensuel,
      fraisDossier: result.rows[0].frais_dossier,
      soitTotal: result.rows[0].soit_total,
      uniter: result.rows[0].uniter,
      montantRetard: result.rows[0].montant_retard,
      isRetard: result.rows[0].is_retard
    });
    
    res.json({
      success: true,
      facture: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur récupération facture:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// 4. RÉCUPÉRER TOUTES LES FACTURES
// ============================================================
router.get('/factures', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, ref_omda, num_facture, num_facture_type,
        ref_client_type, ref_usager, type_facture,
        region_usager, date_ajout, denomination,
        demandeur, telephone, montant_mensuel,
        frais_dossier, montant_retard, is_retard,
        soit_total, uniter, statut, personne_recu,
        quittance, quittance_validee,
        created_at, created_by
      FROM facture_usager 
      ORDER BY created_at DESC
    `);
    
    const dafName = await getDAFName();
    const factures = result.rows.map(f => ({
      ...f,
      daf_nom: dafName,
      quittance: f.quittance ? String(f.quittance).padStart(7, '0') : ''
    }));
    
    res.json({
      success: true,
      factures: factures
    });
  } catch (error) {
    console.error('❌ Erreur récupération factures:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// 5. METTRE À JOUR UNE FACTURE
// ============================================================
router.put('/factures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = [
      'type_facture', 'personne_recu',
      'denomination', 'demandeur', 'telephone', 'email', 'adresse',
      'region_usager',
      'representant_nom', 'representant_adresse', 'representant_tel',
      'representant_cin', 'representant_cin_delivree', 'representant_cin_lieu',
      'representant_fonction',
      'activite', 'etoiles', 'ravinala',
      'nombre_magasins', 'nombre_vehicules', 'lignes', 'type_bus',
      'trajet', 'horaires', 'zones_desservies', 'jauge_max',
      'frequence', 'canal', 'siege', 'nif', 'stat', 'taux',
      'organisateurs', 'representant_par', 'genre_manifestation',
      'artistes', 'date_evenement', 'lieu_evenement', 'domicile',
      'lieu_ajout', 'date_signature', 'confirmation_nom',
      'moyens_communication', 'a_compter_du', 'echeance',
      'montant_mensuel', 'frais_dossier', 'montant_retard',
      'is_retard', 'soit_total', 'uniter',
      'quittance', 'quittance_validee'
    ];
    
    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === 'quittance' && updates[key]) {
          const num = parseInt(updates[key].replace(/\D/g, ''));
          if (!isNaN(num)) {
            filteredUpdates[key] = formatQuittance(num);
          } else {
            filteredUpdates[key] = updates[key];
          }
        } else {
          filteredUpdates[key] = updates[key];
        }
      }
    }
    
    // ✅ Recalcul automatique de soit_total
    if (filteredUpdates.montant_mensuel !== undefined || 
        filteredUpdates.frais_dossier !== undefined || 
        filteredUpdates.uniter !== undefined) {
      
      const currentResult = await pool.query(
        'SELECT montant_mensuel, frais_dossier, montant_retard, is_retard, uniter FROM facture_usager WHERE id = $1',
        [id]
      );
      
      if (currentResult.rows.length > 0) {
        const current = currentResult.rows[0];
        const montantMensuel = filteredUpdates.montant_mensuel !== undefined ? filteredUpdates.montant_mensuel : current.montant_mensuel;
        const fraisDossier = filteredUpdates.frais_dossier !== undefined ? filteredUpdates.frais_dossier : current.frais_dossier;
        const montantRetard = filteredUpdates.montant_retard !== undefined ? filteredUpdates.montant_retard : current.montant_retard;
        const isRetard = filteredUpdates.is_retard !== undefined ? filteredUpdates.is_retard : current.is_retard;
        const uniter = filteredUpdates.uniter !== undefined ? filteredUpdates.uniter : current.uniter;
        
        const baseTotal = (parseFloat(montantMensuel) || 0) * (parseInt(uniter) || 1);
        const total = baseTotal + (parseFloat(fraisDossier) || 0) + (isRetard ? (parseFloat(montantRetard) || 0) : 0);
        filteredUpdates.soit_total = total;
      }
    }
    
    const keys = Object.keys(filteredUpdates);
    if (keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }
    
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(filteredUpdates)];
    
    const result = await pool.query(
      `UPDATE facture_usager 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    const dafName = await getDAFName();
    result.rows[0].daf_nom = dafName;
    
    res.json({
      success: true,
      message: 'Facture mise à jour avec succès',
      facture: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour facture:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// 6. VALIDER UNE FACTURE
// ============================================================
router.patch('/factures/:id/valider', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    const result = await pool.query(
      `UPDATE facture_usager 
       SET statut = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [statut || 'validee', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    const dafName = await getDAFName();
    result.rows[0].daf_nom = dafName;
    
    res.json({
      success: true,
      message: 'Statut de la facture mis à jour',
      facture: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur validation facture:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// 7. SUPPRIMER UNE FACTURE
// ============================================================
router.delete('/factures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM facture_usager WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Facture supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression facture:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;