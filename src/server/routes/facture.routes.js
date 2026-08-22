// src/server/routes/facture.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// ============================================================
// 1. CRÉER UNE FACTURE À PARTIR D'UN USAGER
// ============================================================
router.post('/factures/creer', async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      usagerId, 
      usagerType, 
      userId,
      typeFacture,
      regionUsager
    } = req.body;

    let tableName = '';
    
    switch(usagerType) {
      case 'hotel': tableName = 'usagers_hotel'; break;
      case 'grand-surface': tableName = 'usagers_magasin'; break;
      case 'media': tableName = 'usagers_media'; break;
      case 'bus': tableName = 'usagers_bus'; break;
      case 'nightclub': tableName = 'usagers_nightclub'; break;
      case 'occ': tableName = 'usagers_occasionnel'; break;
      default: throw new Error('Type d\'usager non reconnu');
    }

    const usagerResult = await client.query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [usagerId]
    );
    
    if (usagerResult.rows.length === 0) {
      throw new Error('Usager non trouvé');
    }
    const usagerData = usagerResult.rows[0];

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
        $58, $59, $60
      ) RETURNING id
    `;

    const values = [
      newRefOmda,                                           // 1
      String(newRefOmda),                                   // 2
      'A',                                                  // 3
      refClientType,                                        // 4
      usagerId,                                             // 5
      typeFacture || 'Redevances',                         // 6
      regionUsager || usagerData.region || '',             // 7
      new Date().toISOString().split('T')[0],              // 8
      usagerData.denomination || usagerData.nom_evenement || '', // 9
      usagerData.demandeur || usagerData.proprietaire_nom || usagerData.organisateurs || '', // 10
      usagerData.telephone || '',                          // 11
      usagerData.email || '',                              // 12
      usagerData.adresse_siege || usagerData.siege || usagerData.adresse || '', // 13
      usagerData.representant_nom || usagerData.representant_par || '', // 14
      usagerData.representant_adresse || usagerData.proprietaire_adresse || '', // 15
      usagerData.representant_tel || usagerData.proprietaire_tel || '', // 16
      usagerData.representant_cin || usagerData.proprietaire_cin || '', // 17
      usagerData.representant_cin_delivree || usagerData.proprietaire_cin_delivree || '', // 18
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
      usagerData.lieu_ajout || usagerData.lieu_signature || '', // 45
      usagerData.date_signature || null,                   // 46
      usagerData.confirmation_nom || usagerData.demandeur || '', // 47
      usagerData.moyens_communication || null,             // 48
      usagerData.a_compter_du || null,                     // 49
      usagerData.echeance || null,                         // 50
      usagerData.montant_mensuel || 0,                     // 51
      usagerData.frais_dossier || 0,                       // 52
      usagerData.montant_retard || 0,                      // 53
      usagerData.is_retard || false,                       // 54
      usagerData.soit_total || 0,                          // 55
      usagerData.uniter || 1,                              // 56
      usagerData.numero_dossier_utilisateur || '',         // 57
      usagerData.numero_dossier_global || '',              // 58
      'brouillon',                                          // 59
      userId                                               // 60
    ];

    const result = await client.query(query, values);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Facture créée avec succès',
      factureId: result.rows[0].id,
      refOmda: newRefOmda,
      numFacture: String(newRefOmda)
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
// 2. RÉCUPÉRER UNE FACTURE PAR ID
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
// 3. RÉCUPÉRER TOUTES LES FACTURES
// ============================================================
router.get('/factures', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, ref_omda, num_facture, num_facture_type,
        ref_client_type, ref_usager, type_facture,
        region_usager, date_ajout, denomination,
        demandeur, telephone, montant_mensuel,
        frais_dossier, soit_total, statut,
        created_at, created_by
      FROM facture_usager 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      factures: result.rows
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
// 4. METTRE À JOUR UNE FACTURE - CORRIGÉ
// ============================================================
router.put('/factures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // ✅ Supprimer les champs protégés
    delete updates.id;
    delete updates.ref_omda;
    delete updates.num_facture;
    delete updates.created_at;
    delete updates.created_by;
    delete updates.updated_at; // ✅ Évite double affectation
    
    const keys = Object.keys(updates);
    if (keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }
    
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    // ✅ updated_at est défini une seule fois dans la requête
    await pool.query(
      `UPDATE facture_usager 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      values
    );
    
    res.json({
      success: true,
      message: 'Facture mise à jour avec succès'
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
// 5. VALIDER UNE FACTURE
// ============================================================
router.patch('/factures/:id/valider', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    await pool.query(
      `UPDATE facture_usager 
       SET statut = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [statut || 'validee', id]
    );
    
    res.json({
      success: true,
      message: 'Statut de la facture mis à jour'
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
// 6. GÉNÉRER LE PDF DE LA FACTURE - CORRIGÉ
// ============================================================
router.post('/factures/generate-pdf', async (req, res) => {
  try {
    const { factureId } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM facture_usager WHERE id = $1',
      [factureId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    // ✅ Chemin corrigé : depuis server/routes/ vers pages/pdf/
    const { generateFacturePDF } = require('../pdf/facture_pdf');
    const factureData = result.rows[0];
    
    const pdfBlob = await generateFacturePDF(factureData, true);
    
    const buffer = await pdfBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    res.json({
      success: true,
      pdfData: base64,
      message: 'PDF généré avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;