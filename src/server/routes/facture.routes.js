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
// 0.1 RÉCUPÉRER LE DERNIER NUMÉRO DE QUITTANCE (PERSISTANT)
// ============================================================
const getLastQuittanceNumber = async () => {
  try {
    // Récupérer le MAX de quittance dans la table facture_usager
    const result = await pool.query(`
      SELECT MAX(CAST(quittance AS INTEGER)) as max_quittance 
      FROM facture_usager 
      WHERE quittance IS NOT NULL AND quittance != '' AND quittance ~ '^[0-9]+$'
    `);
    
    if (result.rows.length > 0 && result.rows[0].max_quittance !== null) {
      return parseInt(result.rows[0].max_quittance);
    }
    
    // Si aucun quittance trouvé, chercher dans paiements
    const paiementResult = await pool.query(`
      SELECT MAX(CAST(quittance AS INTEGER)) as max_quittance 
      FROM paiements 
      WHERE quittance IS NOT NULL AND quittance != '' AND quittance ~ '^[0-9]+$'
    `);
    
    if (paiementResult.rows.length > 0 && paiementResult.rows[0].max_quittance !== null) {
      return parseInt(paiementResult.rows[0].max_quittance);
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
// ============================================================
const extractMontantDepuisBase = (usagerData) => {
  const candidats = [
    usagerData.montant_mensuel,
    usagerData.montant_total,
    usagerData.montant,
    usagerData.taux
  ];
  for (const val of candidats) {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) return num;
  }
  return 0;
};

// ============================================================
// 1. CRÉER UNE FACTURE SIMPLE (ROUTE PRINCIPALE)
// ============================================================
router.post('/factures/creer', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('📥 ROUTE /factures/creer appelée');
    console.log('📦 Body reçu:', req.body);
    
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

    // Déterminer la table selon le type
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

    let montantMensuel = frontMontantMensuel || extractMontantDepuisBase(usagerData) || 0;
    let fraisDossier = frontFraisDossier || parseFloat(usagerData.frais_dossier) || 0;
    let montantRetard = frontMontantRetard || parseFloat(usagerData.montant_retard) || 0;
    let isRetard = frontIsRetard !== undefined ? frontIsRetard : (usagerData.is_retard || false);
    let uniter = frontUniter || parseInt(usagerData.uniter) || 1;
    let soitTotal = frontSoitTotal || (montantMensuel * uniter + fraisDossier + (isRetard ? montantRetard : 0));

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

    // Récupérer le prochain numéro de quittance (PERSISTANT)
    const lastQuittanceNum = await getLastQuittanceNumber();
    const nextQuittanceNum = lastQuittanceNum + 1;
    const quittanceValue = nextQuittanceNum; // Stocker en nombre

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
        statut, created_by, mois_facture, annee_facture
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
        $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46,
        $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57,
        $58, $59, $60, $61, $62, $63, $64, $65
      ) RETURNING id
    `;

    const values = [
      newRefOmda,
      String(newRefOmda).padStart(4, '0'),
      'A',
      refClientType,
      usagerId,
      typeFacture || 'DAFC',
      regionUsager || usagerData.region || '',
      new Date().toISOString().split('T')[0],
      usagerData.denomination || usagerData.nom_evenement || usagerData.genre_manifestation || '',
      usagerData.demandeur || usagerData.proprietaire_nom || usagerData.organisateurs || '',
      usagerData.telephone || '',
      usagerData.email || '',
      usagerData.adresse_siege || usagerData.siege || usagerData.adresse || '',
      usagerData.representant_nom || usagerData.representant_par || '',
      usagerData.representant_adresse || usagerData.proprietaire_adresse || '',
      usagerData.representant_tel || usagerData.proprietaire_tel || '',
      usagerData.representant_cin || usagerData.proprietaire_cin || '',
      usagerData.representant_cin_delivree || usagerData.proprietaire_cin_delivree || null,
      usagerData.representant_cin_lieu || usagerData.proprietaire_cin_lieu || '',
      usagerData.representant_fonction || usagerData.proprietaire_fonction || '',
      usagerData.activite || '',
      usagerData.etoiles || '',
      usagerData.ravinala || false,
      usagerData.nombre_magasins || 0,
      usagerData.nombre_vehicules || 0,
      usagerData.lignes || '',
      usagerData.type_bus || '',
      usagerData.trajet || '',
      usagerData.horaires || '',
      usagerData.zones_desservies || '',
      usagerData.jauge_max || 0,
      usagerData.frequence || '',
      usagerData.canal || '',
      usagerData.siege || '',
      usagerData.nif || '',
      usagerData.stat || '',
      usagerData.taux || 0,
      usagerData.organisateurs || '',
      usagerData.representant_par || '',
      usagerData.genre_manifestation || '',
      usagerData.artistes || '',
      usagerData.date_evenement || null,
      usagerData.lieu_evenement || '',
      usagerData.domicile || usagerData.adresse || '',
      usagerData.lieu_ajout || usagerData.lieu_signature || 'Antananarivo',
      usagerData.date_signature || null,
      usagerData.confirmation_nom || usagerData.demandeur || '',
      personneRecu || '',
      quittanceValue,
      false,
      usagerData.moyens_communication || null,
      null,
      null,
      montantMensuel,
      fraisDossier,
      montantRetard,
      isRetard,
      soitTotal,
      uniter,
      usagerData.numero_dossier_utilisateur || '',
      usagerData.numero_dossier_global || '',
      'validee',
      userId,
      new Date().getMonth() + 1,
      new Date().getFullYear()
    ];

    const result = await client.query(query, values);
    
    const dafName = await getDAFName();
    
    await client.query('COMMIT');
    
    console.log('✅ Facture créée avec succès, ID:', result.rows[0].id);
    console.log('📝 Quittance attribuée:', quittanceValue);

    res.json({
      success: true,
      message: 'Facture créée avec succès',
      factureId: result.rows[0].id,
      refOmda: newRefOmda,
      numFacture: String(newRefOmda).padStart(4, '0'),
      dafName: dafName,
      quittance: formatQuittance(quittanceValue),
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
// 2. CRÉER UNE FACTURE AVEC PAIEMENT (Type B)
// ============================================================
router.post('/factures/creer-avec-paiement', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('📥 ROUTE /factures/creer-avec-paiement appelée');
    console.log('📦 Body reçu:', req.body);
    
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
      soitTotal: frontSoitTotal,
      mois,
      annee,
      datePaiement,
      numFactureType,
      suffixe,
      descriptionPersonnalisee
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

    let montantMensuel = frontMontantMensuel || extractMontantDepuisBase(usagerData) || 0;
    let fraisDossier = frontFraisDossier || parseFloat(usagerData.frais_dossier) || 0;
    let montantRetard = frontMontantRetard || parseFloat(usagerData.montant_retard) || 0;
    let isRetard = frontIsRetard !== undefined ? frontIsRetard : (usagerData.is_retard || false);
    let uniter = frontUniter || parseInt(usagerData.uniter) || 1;
    let soitTotal = frontSoitTotal || (montantMensuel * uniter + fraisDossier + (isRetard ? montantRetard : 0));

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

    // Récupérer le prochain numéro de quittance (PERSISTANT)
    const lastQuittanceNum = await getLastQuittanceNumber();
    const nextQuittanceNum = lastQuittanceNum + 1;
    const quittanceValue = nextQuittanceNum;

    let numFactureDisplay = String(newRefOmda).padStart(4, '0');
    if (suffixe) {
      numFactureDisplay = `${numFactureDisplay}-${suffixe}`;
    }

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
        statut, created_by, mois_facture, annee_facture,
        suffixe, description_personnalisee
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
        $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46,
        $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57,
        $58, $59, $60, $61, $62, $63, $64, $65, $66, $67
      ) RETURNING id
    `;

    const values = [
      newRefOmda,
      numFactureDisplay,
      numFactureType || 'B',
      refClientType,
      usagerId,
      typeFacture || 'DAFC',
      regionUsager || usagerData.region || '',
      new Date().toISOString().split('T')[0],
      usagerData.denomination || usagerData.nom_evenement || usagerData.genre_manifestation || '',
      usagerData.demandeur || usagerData.proprietaire_nom || usagerData.organisateurs || '',
      usagerData.telephone || '',
      usagerData.email || '',
      usagerData.adresse_siege || usagerData.siege || usagerData.adresse || '',
      usagerData.representant_nom || usagerData.representant_par || '',
      usagerData.representant_adresse || usagerData.proprietaire_adresse || '',
      usagerData.representant_tel || usagerData.proprietaire_tel || '',
      usagerData.representant_cin || usagerData.proprietaire_cin || '',
      usagerData.representant_cin_delivree || usagerData.proprietaire_cin_delivree || null,
      usagerData.representant_cin_lieu || usagerData.proprietaire_cin_lieu || '',
      usagerData.representant_fonction || usagerData.proprietaire_fonction || '',
      usagerData.activite || '',
      usagerData.etoiles || '',
      usagerData.ravinala || false,
      usagerData.nombre_magasins || 0,
      usagerData.nombre_vehicules || 0,
      usagerData.lignes || '',
      usagerData.type_bus || '',
      usagerData.trajet || '',
      usagerData.horaires || '',
      usagerData.zones_desservies || '',
      usagerData.jauge_max || 0,
      usagerData.frequence || '',
      usagerData.canal || '',
      usagerData.siege || '',
      usagerData.nif || '',
      usagerData.stat || '',
      usagerData.taux || 0,
      usagerData.organisateurs || '',
      usagerData.representant_par || '',
      usagerData.genre_manifestation || '',
      usagerData.artistes || '',
      usagerData.date_evenement || null,
      usagerData.lieu_evenement || '',
      usagerData.domicile || usagerData.adresse || '',
      usagerData.lieu_ajout || usagerData.lieu_signature || 'Antananarivo',
      usagerData.date_signature || null,
      usagerData.confirmation_nom || usagerData.demandeur || '',
      personneRecu || '',
      quittanceValue,
      false,
      usagerData.moyens_communication || null,
      datePaiement || new Date().toISOString().split('T')[0],
      null,
      montantMensuel,
      fraisDossier,
      montantRetard,
      isRetard,
      soitTotal,
      uniter,
      usagerData.numero_dossier_utilisateur || '',
      usagerData.numero_dossier_global || '',
      'validee',
      userId,
      mois,
      annee,
      suffixe || '',
      descriptionPersonnalisee || null // 🔥 null si pas de description personnalisée
    ];

    const result = await client.query(query, values);
    
    const dafName = await getDAFName();
    
    await client.query('COMMIT');
    
    console.log('✅ Facture avec paiement créée avec succès, ID:', result.rows[0].id);
    console.log('📝 Quittance attribuée:', quittanceValue);

    res.json({
      success: true,
      message: 'Facture avec paiement créée avec succès',
      factureId: result.rows[0].id,
      refOmda: newRefOmda,
      numFacture: numFactureDisplay,
      dafName: dafName,
      quittance: formatQuittance(quittanceValue),
      mois: mois,
      annee: annee,
      soitTotal: soitTotal
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur création facture avec paiement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la facture avec paiement'
    });
  } finally {
    client.release();
  }
});

// ============================================================
// 3. CRÉER UNE FACTURE GROUPÉE (TYPE A)
// ============================================================
router.post('/factures/creer-avec-paiement-groupe', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('📥 ROUTE /factures/creer-avec-paiement-groupe appelée');
    console.log('📦 Body reçu:', req.body);
    
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
      soitTotal: frontSoitTotal,
      mois: moisGroupes,
      annee,
      datePaiement,
      numFactureType,
      typeGroupe,
      descriptionPersonnalisee
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

    let montantMensuel = frontMontantMensuel || extractMontantDepuisBase(usagerData) || 0;
    let fraisDossier = frontFraisDossier || parseFloat(usagerData.frais_dossier) || 0;
    let montantRetard = frontMontantRetard || parseFloat(usagerData.montant_retard) || 0;
    let isRetard = frontIsRetard !== undefined ? frontIsRetard : (usagerData.is_retard || false);
    let uniter = frontUniter || parseInt(usagerData.uniter) || 1;
    const nbMois = moisGroupes ? moisGroupes.length : 1;
    let soitTotal = frontSoitTotal || (montantMensuel * uniter * nbMois + fraisDossier + (isRetard ? montantRetard : 0));

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

    // Récupérer le prochain numéro de quittance (PERSISTANT)
    const lastQuittanceNum = await getLastQuittanceNumber();
    const nextQuittanceNum = lastQuittanceNum + 1;
    const quittanceValue = nextQuittanceNum;

    const moisGroupesStr = moisGroupes ? moisGroupes.join(',') : null;
    const premierMois = moisGroupes && moisGroupes.length > 0 ? moisGroupes[0] : 1;

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
        statut, created_by, annee_facture, mois_facture,
        mois_groupes, type_groupe, description_personnalisee
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
        $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46,
        $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57,
        $58, $59, $60, $61, $62, $63, $64, $65, $66, $67, $68
      ) RETURNING id
    `;

    const values = [
      newRefOmda,
      String(newRefOmda).padStart(4, '0'),
      numFactureType || 'A',
      refClientType,
      usagerId,
      typeFacture || 'DAFC',
      regionUsager || usagerData.region || '',
      new Date().toISOString().split('T')[0],
      usagerData.denomination || usagerData.nom_evenement || usagerData.genre_manifestation || '',
      usagerData.demandeur || usagerData.proprietaire_nom || usagerData.organisateurs || '',
      usagerData.telephone || '',
      usagerData.email || '',
      usagerData.adresse_siege || usagerData.siege || usagerData.adresse || '',
      usagerData.representant_nom || usagerData.representant_par || '',
      usagerData.representant_adresse || usagerData.proprietaire_adresse || '',
      usagerData.representant_tel || usagerData.proprietaire_tel || '',
      usagerData.representant_cin || usagerData.proprietaire_cin || '',
      usagerData.representant_cin_delivree || usagerData.proprietaire_cin_delivree || null,
      usagerData.representant_cin_lieu || usagerData.proprietaire_cin_lieu || '',
      usagerData.representant_fonction || usagerData.proprietaire_fonction || '',
      usagerData.activite || '',
      usagerData.etoiles || '',
      usagerData.ravinala || false,
      usagerData.nombre_magasins || 0,
      usagerData.nombre_vehicules || 0,
      usagerData.lignes || '',
      usagerData.type_bus || '',
      usagerData.trajet || '',
      usagerData.horaires || '',
      usagerData.zones_desservies || '',
      usagerData.jauge_max || 0,
      usagerData.frequence || '',
      usagerData.canal || '',
      usagerData.siege || '',
      usagerData.nif || '',
      usagerData.stat || '',
      usagerData.taux || 0,
      usagerData.organisateurs || '',
      usagerData.representant_par || '',
      usagerData.genre_manifestation || '',
      usagerData.artistes || '',
      usagerData.date_evenement || null,
      usagerData.lieu_evenement || '',
      usagerData.domicile || usagerData.adresse || '',
      usagerData.lieu_ajout || usagerData.lieu_signature || 'Antananarivo',
      usagerData.date_signature || null,
      usagerData.confirmation_nom || usagerData.demandeur || '',
      personneRecu || '',
      quittanceValue,
      false,
      usagerData.moyens_communication || null,
      datePaiement || new Date().toISOString().split('T')[0],
      null,
      montantMensuel,
      fraisDossier,
      montantRetard,
      isRetard,
      soitTotal,
      uniter,
      usagerData.numero_dossier_utilisateur || '',
      usagerData.numero_dossier_global || '',
      'validee',
      userId,
      annee,
      premierMois,
      moisGroupesStr,
      typeGroupe || 'A',
      descriptionPersonnalisee || null // 🔥 null si pas de description personnalisée
    ];

    const result = await client.query(query, values);
    
    const dafName = await getDAFName();
    
    await client.query('COMMIT');
    
    console.log('✅ Facture groupée créée avec succès, ID:', result.rows[0].id);
    console.log('📝 Quittance attribuée:', quittanceValue);

    res.json({
      success: true,
      message: 'Facture groupée créée avec succès',
      factureId: result.rows[0].id,
      refOmda: newRefOmda,
      numFacture: String(newRefOmda).padStart(4, '0'),
      dafName: dafName,
      quittance: formatQuittance(quittanceValue),
      moisGroupes: moisGroupes,
      soitTotal: soitTotal
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur création facture groupée:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la facture groupée'
    });
  } finally {
    client.release();
  }
});

// ============================================================
// 4. RÉCUPÉRER LE NOM DU DAF
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
// 5. RÉCUPÉRER LE DERNIER NUMÉRO DE QUITTANCE
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
// 6. RÉCUPÉRER UNE FACTURE PAR ID
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
    
    // Formater le quittance
    if (result.rows[0].quittance) {
      result.rows[0].quittance = formatQuittance(result.rows[0].quittance);
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
// 7. RÉCUPÉRER TOUTES LES FACTURES
// ============================================================
router.get('/factures', async (req, res) => {
  try {
    console.log('📄 Récupération de toutes les factures...');
    
    const result = await pool.query(`
      SELECT 
        id, ref_omda, num_facture, num_facture_type,
        ref_client_type, ref_usager, type_facture,
        region_usager, date_ajout, denomination,
        demandeur, telephone, montant_mensuel,
        frais_dossier, montant_retard, is_retard,
        soit_total, uniter, statut, personne_recu,
        quittance, quittance_validee,
        mois_facture, annee_facture, mois_groupes, type_groupe,
        suffixe, description_personnalisee,
        created_at, created_by
      FROM facture_usager 
      ORDER BY created_at DESC
    `);
    
    const dafName = await getDAFName();
    const factures = result.rows.map(f => ({
      ...f,
      daf_nom: dafName,
      quittance: f.quittance ? formatQuittance(f.quittance) : ''
    }));
    
    res.json({
      success: true,
      factures: factures,
      total: factures.length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération factures:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      factures: []
    });
  }
});

// ============================================================
// 8. METTRE À JOUR UNE FACTURE
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
      'quittance', 'quittance_validee',
      'description_personnalisee', 'suffixe'
    ];
    
    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }
    
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
// 9. VALIDER UNE FACTURE
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
// 10. SUPPRIMER UNE FACTURE
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