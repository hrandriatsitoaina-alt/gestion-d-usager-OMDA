// server/routes/generateursia.routes.js
// ============================================================
// MODULE IA OMDA - Version améliorée avec recherche profonde
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../database');

console.log('✅ Routeur IA (generateursia) chargé');

// ============================================================
// MOTEUR DE SECOURS (régression manuelle)
// ============================================================
function regressionManuelle(valeurs) {
  const n = valeurs.length;
  const xs = valeurs.map((_, i) => i);
  const sommeX = xs.reduce((a, b) => a + b, 0);
  const sommeY = valeurs.reduce((a, b) => a + b, 0);
  const sommeXY = xs.reduce((s, x, i) => s + x * valeurs[i], 0);
  const sommeX2 = xs.reduce((s, x) => s + x * x, 0);
  const denom = (n * sommeX2 - sommeX * sommeX) || 1;
  const slope = (n * sommeXY - sommeX * sommeY) / denom;
  const intercept = (sommeY - slope * sommeX) / n;
  return { slope, intercept };
}

function forecastManuel(valeurs, horizon) {
  const { slope, intercept } = regressionManuelle(valeurs);
  const n = valeurs.length;
  const out = [];
  for (let i = 0; i < horizon; i++) {
    out.push(Math.max(0, intercept + slope * (n + i)));
  }
  return out;
}

const calculateStandardDeviation = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
};

// ============================================================
// CONSTANTES
// ============================================================
const TYPE_LABELS = {
  hotel: 'Hôtel',
  'grand-surface': 'Grande Surface',
  media: 'Télé/Radio',
  occ: 'OCC',
  bus: 'Bus',
  nightclub: 'Night Club'
};

const USAGER_TABLES = {
  hotel: 'usagers_hotel',
  'grand-surface': 'usagers_magasin',
  media: 'usagers_media',
  occ: 'usagers_occasionnel',
  bus: 'usagers_bus',
  nightclub: 'usagers_nightclub'
};

const MOIS_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const MOIS_LABELS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// ============================================================
// COLLECTE COMPLÈTE DES DONNÉES
// ============================================================
async function collecterDonneesCompletes() {
  const data = {
    usagers: {},
    paiements: [],
    factures: [],
    quittances: [],
    regions: [],
    artistesCount: 0,
    utilisateursActifs: 0
  };

  for (const [type, table] of Object.entries(USAGER_TABLES)) {
    try {
      const r = await pool.query(`SELECT * FROM ${table}`);
      data.usagers[type] = r.rows;
    } catch (e) {
      data.usagers[type] = [];
    }
  }

  try {
    const r = await pool.query(`SELECT * FROM paiements ORDER BY created_at DESC`);
    data.paiements = r.rows;
  } catch (e) {
    try {
      const r2 = await pool.query(`SELECT * FROM omda_app.paiements ORDER BY created_at DESC`);
      data.paiements = r2.rows;
    } catch (e2) {
      console.log('⚠️ Table paiements indisponible');
    }
  }

  try {
    const r = await pool.query(`SELECT * FROM facture_usager ORDER BY created_at DESC`);
    data.factures = r.rows;
    data.quittances = r.rows.filter(f => f.quittance);
  } catch (e) {
    console.log('⚠️ Table facture_usager indisponible');
  }

  try {
    const r = await pool.query(`SELECT * FROM regions ORDER BY nom`);
    data.regions = r.rows;
  } catch (e) { /* ignore */ }

  try {
    const r = await pool.query(`SELECT COUNT(*) as total FROM artistes`);
    data.artistesCount = parseInt(r.rows[0]?.total) || 0;
  } catch (e) { /* ignore */ }

  try {
    const r = await pool.query(`SELECT COUNT(*) as total FROM utilisateurs WHERE statut = 'actif'`);
    data.utilisateursActifs = parseInt(r.rows[0]?.total) || 0;
  } catch (e) { /* ignore */ }

  return data;
}

function extraireDonneesMensuelles(paiements) {
  const mois = {};
  paiements.forEach(p => {
    const dateRef = p.date_paiement || p.created_at;
    if (!dateRef) return;
    const d = new Date(dateRef);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!mois[key]) {
      mois[key] = { key, annee: d.getFullYear(), mois: d.getMonth() + 1, montant: 0, nb: 0 };
    }
    mois[key].montant += parseFloat(p.montant) || 0;
    mois[key].nb += 1;
  });
  return Object.values(mois).sort((a, b) => a.key.localeCompare(b.key));
}

// ============================================================
// ✅ NOUVEAU : ANALYSE DÉTAILLÉE DES USAGERS
// ============================================================

/**
 * Retourne tous les usagers avec leur statut de paiement pour une année donnée
 */
async function analyserUsagersParAnnee(annee = null) {
  const anneeCible = annee || new Date().getFullYear();
  const data = await collecterDonneesCompletes();
  const usagersAvecStatut = [];

  for (const [type, usagers] of Object.entries(data.usagers)) {
    const paiementsType = data.paiements.filter(
      p => p.usager_type === type && p.statut === 'paye' && p.annee === anneeCible
    );

    for (const usager of usagers) {
      const paiementsUsager = paiementsType.filter(p => p.usager_id === usager.id);
      const moisPayes = paiementsUsager.map(p => p.mois).sort((a, b) => a - b);
      const montantPaye = paiementsUsager.reduce(
        (s, p) => s + (parseFloat(p.montant) || 0), 0
      );

      const nbMois = moisPayes.length;
      let statut = 'non-payeur';
      if (nbMois >= 12) statut = 'bon-payeur';
      else if (nbMois >= 6) statut = 'payeur-moyen';
      else if (nbMois > 0) statut = 'mauvais-payeur';

      usagersAvecStatut.push({
        id: usager.id,
        type,
        typeLabel: TYPE_LABELS[type] || type,
        denomination: usager.denomination || usager.nom_evenement || usager.genre_manifestation || 'Sans nom',
        demandeur: usager.demandeur || usager.organisateurs || usager.representant_par || '',
        telephone: usager.telephone || '',
        email: usager.email || '',
        region: usager.region || 'N/A',
        adresse: usager.adresse_siege || usager.adresse || '',
        montantMensuel: parseFloat(usager.montant_mensuel) || 0,
        moisPayes,
        nbMoisPayes: nbMois,
        moisRestants: 12 - nbMois,
        montantPaye,
        statut,
        annee: anneeCible,
        tauxPaiement: Math.round((nbMois / 12) * 100)
      });
    }
  }

  return usagersAvecStatut;
}

/**
 * Retourne les usagers en retard pour une année
 */
async function getUsagersEnRetard(annee = null, type = null) {
  const usagers = await analyserUsagersParAnnee(annee);
  let enRetard = usagers.filter(u => u.statut !== 'bon-payeur');
  if (type) enRetard = enRetard.filter(u => u.type === type);
  return enRetard.sort((a, b) => a.nbMoisPayes - b.nbMoisPayes);
}

/**
 * Retourne les meilleurs payeurs
 */
async function getMeilleursPayeurs(annee = null, limit = 10) {
  const usagers = await analyserUsagersParAnnee(annee);
  return usagers
    .filter(u => u.nbMoisPayes > 0)
    .sort((a, b) => b.nbMoisPayes - a.nbMoisPayes || b.montantPaye - a.montantPaye)
    .slice(0, limit);
}

/**
 * Retourne les pires payeurs
 */
async function getPiresPayeurs(annee = null, limit = 10) {
  const usagers = await analyserUsagersParAnnee(annee);
  return usagers
    .sort((a, b) => a.nbMoisPayes - b.nbMoisPayes || a.montantPaye - b.montantPaye)
    .slice(0, limit);
}

/**
 * Recherche un usager par nom, téléphone, email
 */
async function rechercherUsagers(critere) {
  const usagers = await analyserUsagersParAnnee();
  const terme = critere.toLowerCase().trim();

  return usagers.filter(u =>
    (u.denomination || '').toLowerCase().includes(terme) ||
    (u.demandeur || '').toLowerCase().includes(terme) ||
    (u.telephone || '').includes(terme) ||
    (u.email || '').toLowerCase().includes(terme) ||
    (u.region || '').toLowerCase().includes(terme)
  ).slice(0, 20);
}

/**
 * Analyse d'un usager spécifique (par ID et type)
 */
async function analyserUsagerSpecifique(usagerId, type) {
  const usagers = await analyserUsagersParAnnee();
  const usager = usagers.find(u => u.id === parseInt(usagerId) && u.type === type);
  if (!usager) return null;

  // Récupérer tous les paiements
  const paiements = await pool.query(
    `SELECT * FROM paiements WHERE usager_id = $1 AND usager_type = $2 ORDER BY annee, mois`,
    [usagerId, type]
  ).catch(() => ({ rows: [] }));

  // Récupérer les factures
  const factures = await pool.query(
    `SELECT * FROM facture_usager WHERE ref_usager = $1 ORDER BY created_at DESC LIMIT 10`,
    [usagerId]
  ).catch(() => ({ rows: [] }));

  return {
    ...usager,
    paiementsDetail: paiements.rows,
    factures: factures.rows
  };
}

/**
 * Top usagers par montant payé
 */
async function getTopMontants(annee = null, limit = 10) {
  const usagers = await analyserUsagersParAnnee(annee);
  return usagers
    .filter(u => u.montantPaye > 0)
    .sort((a, b) => b.montantPaye - a.montantPaye)
    .slice(0, limit);
}

// ============================================================
// CONSTRUCTION DU DIAGNOSTIC (existant + enrichi)
// ============================================================
async function construireDiagnostic() {
  const data = await collecterDonneesCompletes();

  const categories = {};
  let totalUsagers = 0;
  let totalUsagersPayes = 0;

  for (const [type, usagers] of Object.entries(data.usagers)) {
    const paiementsType = data.paiements.filter(p => p.usager_type === type && p.statut === 'paye');
    const usagersPayesIds = new Set(paiementsType.map(p => p.usager_id));
    const montantType = paiementsType.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);

    categories[type] = {
      label: TYPE_LABELS[type] || type,
      total: usagers.length,
      payes: usagersPayesIds.size,
      nonPayes: Math.max(0, usagers.length - usagersPayesIds.size),
      tauxPaiement: usagers.length > 0
        ? Number(((usagersPayesIds.size / usagers.length) * 100).toFixed(1))
        : 0,
      montantTotal: Number(montantType.toFixed(2)),
      nouveaux: usagers.filter(u => {
        if (!u.created_at) return false;
        const days = (Date.now() - new Date(u.created_at).getTime()) / 86400000;
        return days <= 30;
      }).length
    };

    totalUsagers += usagers.length;
    totalUsagersPayes += usagersPayesIds.size;
  }

  const tauxGlobal = totalUsagers > 0
    ? Number(((totalUsagersPayes / totalUsagers) * 100).toFixed(1))
    : 0;
  const montantGlobalPaye = data.paiements
    .filter(p => p.statut === 'paye')
    .reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);

  const donneesMensuelles = extraireDonneesMensuelles(data.paiements.filter(p => p.statut === 'paye'));
  let tendance = null;
  let forecast = [];
  let ecartType = 0;

  if (donneesMensuelles.length >= 3) {
    const montants = donneesMensuelles.map(d => d.montant);
    const regression = regressionManuelle(montants);
    const base = montants[0] || 1;
    tendance = {
      pente: regression.slope,
      intercept: regression.intercept,
      direction: regression.slope > 0 ? 'croissance' : (regression.slope < 0 ? 'décroissance' : 'stable'),
      pourcentage: Number(((regression.slope / base) * 100).toFixed(1))
    };
    forecast = forecastManuel(montants, 6).map(v => Math.max(0, Math.round(v)));
    ecartType = Number(calculateStandardDeviation(montants).toFixed(2));
  }

  let meilleurMois = null;
  let moyenneMensuelle = 0;
  if (donneesMensuelles.length > 0) {
    const best = donneesMensuelles.reduce((max, d) => (d.montant > max.montant ? d : max), donneesMensuelles[0]);
    meilleurMois = { periode: `${best.mois}/${best.annee}`, montant: Math.round(best.montant) };
    moyenneMensuelle = Math.round(
      donneesMensuelles.reduce((s, d) => s + d.montant, 0) / donneesMensuelles.length
    );
  }

  const anneeActuelle = new Date().getFullYear();
  const totalAnneeActuelle = donneesMensuelles
    .filter(d => d.annee === anneeActuelle)
    .reduce((s, d) => s + d.montant, 0);
  const totalAnneePrecedente = donneesMensuelles
    .filter(d => d.annee === anneeActuelle - 1)
    .reduce((s, d) => s + d.montant, 0);
  const croissanceAnnuelle = totalAnneePrecedente > 0
    ? Number((((totalAnneeActuelle - totalAnneePrecedente) / totalAnneePrecedente) * 100).toFixed(1))
    : null;

  const regionsMap = {};
  data.quittances.forEach(q => {
    const region = q.region_usager || 'Non spécifié';
    if (!regionsMap[region]) regionsMap[region] = { region, nbQuittances: 0, montant: 0 };
    regionsMap[region].nbQuittances += 1;
    regionsMap[region].montant += parseFloat(q.soit_total) || 0;
  });
  const parRegion = Object.values(regionsMap)
    .map(r => ({ ...r, montant: Number(r.montant.toFixed(2)) }))
    .sort((a, b) => b.montant - a.montant);

  const quittancesNonValidees = data.factures.filter(f => f.quittance && f.quittance_validee === false).length;

  let objectifTaux;
  if (tauxGlobal < 50) objectifTaux = 50;
  else if (tauxGlobal < 70) objectifTaux = 70;
  else if (tauxGlobal < 90) objectifTaux = 90;
  else objectifTaux = 100;

  // ✅ NOUVEAU : Statistiques de performance par usager
  const usagersStatut = await analyserUsagersParAnnee();
  const statsStatut = {
    bonPayeur: usagersStatut.filter(u => u.statut === 'bon-payeur').length,
    payeurMoyen: usagersStatut.filter(u => u.statut === 'payeur-moyen').length,
    mauvaisPayeur: usagersStatut.filter(u => u.statut === 'mauvais-payeur').length,
    nonPayeur: usagersStatut.filter(u => u.statut === 'non-payeur').length
  };

  // ============================================================
  // ALERTES
  // ============================================================
  const alertes = [];

  if (tauxGlobal < 50 && totalUsagers > 0) {
    alertes.push({
      id: 'taux-critique',
      type: 'critique',
      priorite: 1,
      titre: 'Taux de paiement global critique',
      message: `Seulement ${tauxGlobal}% des usagers (${totalUsagersPayes}/${totalUsagers}) sont à jour.`,
      plan: [
        { etape: 'Identifier les usagers en retard par catégorie et région', delai: 'Cette semaine' },
        { etape: 'Envoyer des relances (SMS/email/courrier) aux usagers en retard', delai: '3 à 5 jours' },
        { etape: 'Prioriser les visites terrain pour les gros montants impayés', delai: '2 semaines' },
        { etape: 'Mettre en place un suivi hebdomadaire du taux de paiement', delai: 'Immédiat' }
      ],
      action: 'relance-globale'
    });
  } else if (tauxGlobal < 70 && totalUsagers > 0) {
    alertes.push({
      id: 'taux-moyen',
      type: 'warning',
      priorite: 2,
      titre: 'Taux de paiement à améliorer',
      message: `${tauxGlobal}% de taux de paiement global — objectif : ${objectifTaux}%.`,
      plan: [
        { etape: 'Analyser les catégories les plus en retard', delai: '1 semaine' },
        { etape: 'Automatiser les rappels de paiement', delai: '2 semaines' }
      ],
      action: 'relance-globale'
    });
  }

  Object.entries(categories).forEach(([type, c]) => {
    if (c.total > 0 && c.tauxPaiement < 40) {
      alertes.push({
        id: `cat-${type}`,
        type: 'warning',
        priorite: 2,
        titre: `${c.label} : taux faible (${c.tauxPaiement}%)`,
        message: `${c.payes}/${c.total} usagers à jour.`,
        plan: [
          { etape: `Extraire la liste des usagers ${c.label} en retard`, delai: '2 jours' },
          { etape: `Contacter individuellement les responsables ${c.label}`, delai: '1 semaine' },
          { etape: 'Proposer un échéancier de paiement si nécessaire', delai: '2 semaines' }
        ],
        action: 'voir-usagers',
        categorie: type
      });
    }
  });

  parRegion.forEach(r => {
    if (r.nbQuittances >= 5 && r.montant < 100000) {
      alertes.push({
        id: `region-${r.region}`,
        type: 'info',
        priorite: 3,
        titre: `Région ${r.region} sous-performante`,
        message: `${r.nbQuittances} quittances pour ${Math.round(r.montant).toLocaleString()} Ar.`,
        plan: [
          { etape: `Planifier une mission de prospection à ${r.region}`, delai: '1 mois' },
          { etape: 'Vérifier la présence d\'un correspondant régional actif', delai: '1 semaine' }
        ],
        action: 'mission',
        region: r.region
      });
    }
  });

  if (tendance && tendance.pente < 0) {
    alertes.push({
      id: 'tendance-baisse',
      type: 'warning',
      priorite: 1,
      titre: 'Tendance des revenus à la baisse',
      message: `Baisse estimée de ${Math.abs(tendance.pourcentage)}% sur la période.`,
      plan: [
        { etape: 'Comparer les revenus mois par mois pour isoler la cause', delai: '3 jours' },
        { etape: 'Vérifier si la baisse est concentrée sur une région ou catégorie', delai: '1 semaine' },
        { etape: 'Ajuster la stratégie de relance en conséquence', delai: '2 semaines' }
      ],
      action: 'analyser-tendance'
    });
  }

  if (quittancesNonValidees > 0) {
    alertes.push({
      id: 'quittances-non-validees',
      type: 'warning',
      priorite: 2,
      titre: `${quittancesNonValidees} quittance(s) non validée(s)`,
      message: 'Des quittances émises n\'ont pas encore été validées.',
      plan: [
        { etape: 'Lister les quittances en attente de validation', delai: '1 jour' },
        { etape: 'Valider ou corriger chaque quittance en attente', delai: '3 jours' }
      ],
      action: 'voir-quittances'
    });
  }

  alertes.sort((a, b) => a.priorite - b.priorite);

  // ============================================================
  // SUCCÈS
  // ============================================================
  const succes = [];
  if (tauxGlobal >= 70) {
    succes.push({
      titre: 'Bon taux de paiement global',
      message: `${tauxGlobal}% des usagers sont à jour.`
    });
  }
  if (tendance && tendance.pente > 0) {
    succes.push({
      titre: 'Croissance des revenus',
      message: `Croissance estimée de ${tendance.pourcentage}% sur la période.`
    });
  }
  const meilleureCategorie = Object.entries(categories)
    .filter(([, c]) => c.total > 0)
    .sort((a, b) => b[1].tauxPaiement - a[1].tauxPaiement)[0];
  if (meilleureCategorie && meilleureCategorie[1].tauxPaiement >= 60) {
    succes.push({
      titre: `Catégorie ${meilleureCategorie[1].label} performante`,
      message: `${meilleureCategorie[1].tauxPaiement}% de taux.`
    });
  }
  if (data.artistesCount > 0) {
    succes.push({
      titre: 'Base d\'artistes enregistrée',
      message: `${data.artistesCount} artiste(s) référencé(s).`
    });
  }
  if (succes.length === 0) {
    succes.push({
      titre: 'Aucun point fort majeur détecté',
      message: 'Concentrez les efforts sur les alertes ci-dessous.'
    });
  }

  // ============================================================
  // SUGGESTIONS
  // ============================================================
  const suggestions = [];
  suggestions.push({ texte: `Atteindre ${objectifTaux}% de taux de paiement global`, priorite: 'haute' });
  if (tauxGlobal < 60) suggestions.push({ texte: 'Lancer une campagne de relance urgente', priorite: 'haute' });
  if (tendance && tendance.pente < 0) suggestions.push({ texte: 'Réviser la stratégie commerciale', priorite: 'haute' });
  Object.entries(categories).forEach(([type, c]) => {
    if (c.total > 0 && c.tauxPaiement < 40) {
      suggestions.push({
        texte: `Cibler la catégorie ${c.label} pour une relance`,
        priorite: 'moyenne',
        categorie: type
      });
    }
  });
  if (parRegion.some(r => r.nbQuittances >= 5 && r.montant < 100000)) {
    suggestions.push({ texte: 'Développer les régions sous-performantes', priorite: 'basse' });
  }
  suggestions.push({ texte: 'Automatiser les rappels de paiement par email/SMS', priorite: 'basse' });

  return {
    genereLe: new Date().toISOString(),
    global: {
      totalUsagers,
      totalUsagersPayes,
      tauxGlobal,
      objectifTaux,
      montantGlobalPaye: Number(montantGlobalPaye.toFixed(2)),
      totalFactures: data.factures.length,
      totalQuittances: data.quittances.length,
      quittancesNonValidees,
      totalRegions: data.regions.length,
      totalArtistes: data.artistesCount,
      utilisateursActifs: data.utilisateursActifs
    },
    categories,
    tendance,
    forecast,
    ecartType,
    historique: { meilleurMois, moyenneMensuelle, croissanceAnnuelle },
    parRegion,
    alertes,
    succes,
    suggestions,
    statsStatut   // ✅ NOUVEAU
  };
}

// ============================================================
// GET /api/ia/diagnostic
// ============================================================
router.get('/ia/diagnostic', async (req, res) => {
  try {
    console.log('🤖 Génération du diagnostic IA...');
    const diagnostic = await construireDiagnostic();
    console.log('✅ Diagnostic IA généré');
    res.json({ success: true, diagnostic });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// ✅ NOUVELLES ROUTES DE RECHERCHE PROFONDE
// ============================================================

/**
 * GET /api/ia/usagers/retard?annee=2026&type=hotel
 * Liste des usagers en retard
 */
router.get('/ia/usagers/retard', async (req, res) => {
  try {
    const annee = req.query.annee ? parseInt(req.query.annee) : new Date().getFullYear();
    const type = req.query.type || null;
    const usagers = await getUsagersEnRetard(annee, type);
    res.json({
      success: true,
      annee,
      type: type || 'tous',
      total: usagers.length,
      usagers
    });
  } catch (error) {
    console.error('❌ Erreur usagers en retard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/ia/usagers/meilleurs?annee=2026&limit=10
 * Top des meilleurs payeurs
 */
router.get('/ia/usagers/meilleurs', async (req, res) => {
  try {
    const annee = req.query.annee ? parseInt(req.query.annee) : new Date().getFullYear();
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const usagers = await getMeilleursPayeurs(annee, limit);
    res.json({
      success: true,
      annee,
      total: usagers.length,
      usagers
    });
  } catch (error) {
    console.error('❌ Erreur meilleurs payeurs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/ia/usagers/pires?annee=2026&limit=10
 * Top des pires payeurs
 */
router.get('/ia/usagers/pires', async (req, res) => {
  try {
    const annee = req.query.annee ? parseInt(req.query.annee) : new Date().getFullYear();
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const usagers = await getPiresPayeurs(annee, limit);
    res.json({
      success: true,
      annee,
      total: usagers.length,
      usagers
    });
  } catch (error) {
    console.error('❌ Erreur pires payeurs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/ia/usagers/recherche?q=terme
 * Recherche d'usagers par nom/tél/email/région
 */
router.get('/ia/usagers/recherche', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Terme trop court (min 2 caractères)' });
    }
    const usagers = await rechercherUsagers(q);
    res.json({
      success: true,
      terme: q,
      total: usagers.length,
      usagers
    });
  } catch (error) {
    console.error('❌ Erreur recherche:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/ia/usagers/:type/:id
 * Analyse détaillée d'un usager
 */
router.get('/ia/usagers/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const usager = await analyserUsagerSpecifique(id, type);
    if (!usager) {
      return res.status(404).json({ success: false, message: 'Usager non trouvé' });
    }
    res.json({ success: true, usager });
  } catch (error) {
    console.error('❌ Erreur analyse usager:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/ia/top-montants?annee=2026&limit=10
 * Top usagers par montant payé
 */
router.get('/ia/top-montants', async (req, res) => {
  try {
    const annee = req.query.annee ? parseInt(req.query.annee) : new Date().getFullYear();
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const usagers = await getTopMontants(annee, limit);
    res.json({ success: true, annee, total: usagers.length, usagers });
  } catch (error) {
    console.error('❌ Erreur top montants:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// DICTIONNAIRE DE RÉPONSES NATURELLES (inchangé)
// ============================================================
const dictionnaireReponses = {
  salutations: {
    matin: [
      "Bonjour ! ☀️ Heureux de vous voir. Comment puis-je vous aider aujourd'hui ?",
      "Bonjour ! 🌅 Belle journée en perspective. Que puis-je faire pour vous ?",
      "Salut ! 👋 Je suis là pour vous assister. Qu'est-ce qui vous amène ?"
    ],
    apresmidi: [
      "Bon après-midi ! ☀️ Comment puis-je vous aider ?",
      "Bonjour ! 🌤️ Que puis-je analyser pour vous aujourd'hui ?"
    ],
    soir: [
      "Bonsoir ! 🌙 Comment puis-je vous aider ce soir ?",
      "Bonsoir ! 🌟 Une dernière analyse avant la fin de la journée ?"
    ]
  },
  remerciements: [
    "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.",
    "Je vous en prie ! 🌟 Je suis là pour vous aider à tout moment.",
    "De rien ! 💪 C'était un plaisir de vous assister."
  ],
  auRevoir: [
    "Au revoir ! 👋 N'hésitez pas à revenir quand vous voulez.",
    "À bientôt ! 🌟 Je reste à votre disposition."
  ],
  nonCompris: [
    "Désolée, je n'ai pas bien saisi votre demande 😊 Pouvez-vous reformuler plus clairement ?",
    "Je ne suis pas sûre d'avoir compris 🤔 Pourriez-vous préciser votre question ?",
    "Pouvez-vous reformuler ? 🤔 Je veux bien vous aider mais je n'ai pas bien compris."
  ]
};

function reponseNaturelle(categorie, sousCategorie = null) {
  if (categorie && dictionnaireReponses[categorie]) {
    if (sousCategorie && dictionnaireReponses[categorie][sousCategorie]) {
      const items = dictionnaireReponses[categorie][sousCategorie];
      return items[Math.floor(Math.random() * items.length)];
    }
    if (Array.isArray(dictionnaireReponses[categorie])) {
      const items = dictionnaireReponses[categorie];
      return items[Math.floor(Math.random() * items.length)];
    }
  }
  return null;
}

// ============================================================
// POST /api/ia/chat
// ============================================================
router.post('/ia/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message vide' });
  }

  try {
    const diagnostic = await construireDiagnostic();
    const msg = message.toLowerCase().trim();
    const formatNumber = (n) => Math.round(n).toLocaleString();
    let reponse = '';

    // ============================================================
    // 1. SALUTATIONS
    // ============================================================
    if (msg.match(/^(bonjour|salut|coucou|hello|hey|bonsoir|bon matin|bjr|slt|yo|wesh|salutation)/i)) {
      const heure = new Date().getHours();
      let rep = heure >= 18
        ? reponseNaturelle('salutations', 'soir')
        : heure < 12
          ? reponseNaturelle('salutations', 'matin')
          : reponseNaturelle('salutations', 'apresmidi');
      if (!rep) rep = "Bonjour ! 🌟 Je suis ravi de vous voir. Comment puis-je vous aider aujourd'hui ?";
      reponse = rep + " Que voulez-vous analyser ?";
    }

    // ============================================================
    // 2. REMERCIEMENTS
    // ============================================================
    else if (msg.match(/(merci|thanks|thx|thank|grazie|danke)/i)) {
      reponse = reponseNaturelle('remerciements') ||
        "Avec plaisir ! 😊 Je suis là pour vous aider.";
    }

    // ============================================================
    // 3. AU REVOIR
    // ============================================================
    else if (msg.match(/(au revoir|aurevoir|bye|goodbye|a bientot|a plus|ciao)/i)) {
      reponse = reponseNaturelle('auRevoir') ||
        "Au revoir ! 👋 N'hésitez pas à revenir.";
    }

    // ============================================================
    // 4. ✅ RECHERCHE D'UN USAGER SPÉCIFIQUE
    // ============================================================
    else if (msg.match(/(cherche|recherche|trouve|trouver|usager|client)\s+(.+)/i)) {
      const match = message.match(/(?:cherche|recherche|trouve|trouver|usager|client)\s+(.+)/i);
      const terme = match ? match[1].replace(/["']/g, '').trim() : '';

      if (terme.length >= 2) {
        const resultats = await rechercherUsagers(terme);
        if (resultats.length === 0) {
          reponse = `🔍 **Aucun usager trouvé pour "${terme}"**\n\nEssayez avec un autre nom, un numéro de téléphone ou une région.`;
        } else {
          const liste = resultats.slice(0, 10).map(u =>
            `▪️ **${u.denomination}** (${u.typeLabel}) — ${u.nbMoisPayes}/12 mois payés, ${formatNumber(u.montantPaye)} Ar${u.region && u.region !== 'N/A' ? ` — ${u.region}` : ''}`
          ).join('\n');

          reponse = `🔍 **${resultats.length} usager(s) trouvé(s) pour "${terme}"**\n\n${liste}\n\n` +
            `💡 Pour plus de détails sur un usager, demandez "analyse usager [nom]"`;
        }
      } else {
        reponse = `🔍 Précisez votre recherche (minimum 2 caractères) : nom, téléphone, email ou région.`;
      }
    }

    // ============================================================
    // 5. ✅ ANALYSE D'UN USAGER SPÉCIFIQUE
    // ============================================================
    else if (msg.match(/(analyse|détail|detail|info|infos?)\s+(?:usager|client)?\s*(.+)/i)) {
      const match = message.match(/(?:analyse|détail|detail|info|infos?)\s+(?:usager|client)?\s*(.+)/i);
      const terme = match ? match[1].replace(/["']/g, '').trim() : '';

      if (terme.length >= 2) {
        const resultats = await rechercherUsagers(terme);
        if (resultats.length === 0) {
          reponse = `❌ Aucun usager trouvé pour "${terme}".`;
        } else if (resultats.length === 1) {
          const u = resultats[0];
          const moisTxt = u.moisPayes.length > 0
            ? u.moisPayes.map(m => MOIS_LABELS_SHORT[m - 1]).join(', ')
            : 'Aucun';

          reponse = `📋 **Analyse détaillée - ${u.denomination}**\n\n` +
            `▪️ **Type** : ${u.typeLabel}\n` +
            `▪️ **ID** : #${String(u.id).padStart(3, '0')}\n` +
            `▪️ **Région** : ${u.region}\n` +
            `▪️ **Téléphone** : ${u.telephone || '-'}\n` +
            `▪️ **Montant mensuel** : ${formatNumber(u.montantMensuel)} Ar\n\n` +
            `📊 **Paiements ${u.annee}**\n` +
            `▪️ **Mois payés** : ${u.nbMoisPayes}/12\n` +
            `▪️ **Détail** : ${moisTxt}\n` +
            `▪️ **Total payé** : ${formatNumber(u.montantPaye)} Ar\n` +
            `▪️ **Statut** : ${
              u.statut === 'bon-payeur' ? '✅ Bon payeur' :
              u.statut === 'payeur-moyen' ? '⚠️ Payeur moyen' :
              u.statut === 'mauvais-payeur' ? '🔴 Mauvais payeur' :
              '❌ Non payeur'
            }`;
        } else {
          const liste = resultats.slice(0, 5).map(u =>
            `▪️ **${u.denomination}** (${u.typeLabel}) — ${u.nbMoisPayes}/12 mois`
          ).join('\n');

          reponse = `🔍 **${resultats.length} usagers trouvés**\n\n${liste}\n\n` +
            `💡 Précisez le nom exact pour une analyse détaillée.`;
        }
      }
    }

    // ============================================================
    // 6. ✅ USAGERS EN RETARD
    // ============================================================
    else if (msg.match(/(retard|en retard|pas paye|pas payé|impay|arriéré|arriere)/i)) {
      const annee = new Date().getFullYear();
      const enRetard = await getUsagersEnRetard(annee);

      if (enRetard.length === 0) {
        reponse = `✅ **Aucun usager en retard pour ${annee}**\n\nTous les usagers sont à jour. Excellente performance !`;
      } else {
        const top15 = enRetard.slice(0, 15);
        const liste = top15.map((u, i) =>
          `${i + 1}. **${u.denomination}** (${u.typeLabel}) — ${u.nbMoisPayes}/12 mois payés — ${formatNumber(u.montantPaye)} Ar${u.region && u.region !== 'N/A' ? ` — ${u.region}` : ''}`
        ).join('\n');

        reponse = `🔴 **${enRetard.length} usager(s) en retard pour ${annee}**\n\n` +
          `📋 **Top 15 des plus en retard** :\n\n${liste}\n\n` +
          `💡 Actions recommandées :\n` +
          `1. Contacter les usagers avec le moins de mois payés\n` +
          `2. Prioriser les gros montants impayés\n` +
          `3. Envoyer des relances automatiques\n\n` +
          `👉 Pour la liste complète : \`/api/ia/usagers/retard\``;
      }
    }

    // ============================================================
    // 7. ✅ MEILLEURS PAYEURS
    // ============================================================
    else if (msg.match(/(meilleur|top|bon payeur|bons payeurs|meilleurs payeurs|exemplaire)/i)) {
      const annee = new Date().getFullYear();
      const meilleurs = await getMeilleursPayeurs(annee, 10);

      if (meilleurs.length === 0) {
        reponse = `📊 Aucun usager avec des paiements enregistrés pour ${annee}.`;
      } else {
        const liste = meilleurs.map((u, i) =>
          `${i + 1}. 🏆 **${u.denomination}** (${u.typeLabel}) — ${u.nbMoisPayes}/12 mois — ${formatNumber(u.montantPaye)} Ar`
        ).join('\n');

        reponse = `🏆 **Top 10 des meilleurs payeurs ${annee}**\n\n${liste}\n\n` +
          `💡 Félicitez ces usagers et maintenez la relation de confiance.`;
      }
    }

    // ============================================================
    // 8. ✅ PIRES PAYEURS
    // ============================================================
    else if (msg.match(/(pire|mauvais|mauvais payeur|pires payeurs|à problème|problematique)/i)) {
      const annee = new Date().getFullYear();
      const pires = await getPiresPayeurs(annee, 10);

      if (pires.length === 0) {
        reponse = `📊 Aucune donnée de paiement pour ${annee}.`;
      } else {
        const liste = pires.map((u, i) =>
          `${i + 1}. ⚠️ **${u.denomination}** (${u.typeLabel}) — ${u.nbMoisPayes}/12 mois — ${formatNumber(u.montantPaye)} Ar${u.region && u.region !== 'N/A' ? ` — ${u.region}` : ''}`
        ).join('\n');

        reponse = `⚠️ **Top 10 des pires payeurs ${annee}**\n\n${liste}\n\n` +
          `💡 Actions : relance immédiate, échéancier, visite terrain.`;
      }
    }

    // ============================================================
    // 9. ✅ TOP MONTANTS
    // ============================================================
    else if (msg.match(/(plus gros|top montant|plus grand montant|gros contributeur|gros payeur)/i)) {
      const annee = new Date().getFullYear();
      const top = await getTopMontants(annee, 10);

      if (top.length === 0) {
        reponse = `📊 Aucun paiement enregistré pour ${annee}.`;
      } else {
        const liste = top.map((u, i) =>
          `${i + 1}. 💰 **${u.denomination}** (${u.typeLabel}) — ${formatNumber(u.montantPaye)} Ar — ${u.nbMoisPayes}/12 mois`
        ).join('\n');

        reponse = `💰 **Top 10 des plus gros contributeurs ${annee}**\n\n${liste}\n\n` +
          `💡 Ces usagers représentent une part importante de vos revenus.`;
      }
    }

    // ============================================================
    // 10. PERFORMANCE GLOBALE
    // ============================================================
    else if (msg.match(/(performance|global|situation|bilan|résumé|resume)/i)) {
      const tendanceTexte = diagnostic.tendance
        ? `La tendance est à la ${diagnostic.tendance.direction} (${diagnostic.tendance.pourcentage}%).`
        : 'Tendance non disponible.';

      reponse = `📊 **Performance globale**\n\n` +
        `▪️ **Taux de paiement** : ${diagnostic.global.tauxGlobal}%\n` +
        `▪️ **Usagers à jour** : ${diagnostic.global.totalUsagersPayes}/${diagnostic.global.totalUsagers}\n` +
        `▪️ **Montant collecté** : ${formatNumber(diagnostic.global.montantGlobalPaye)} Ar\n` +
        `▪️ **Factures** : ${diagnostic.global.totalFactures}\n` +
        `▪️ **Quittances non validées** : ${diagnostic.global.quittancesNonValidees}\n` +
        `▪️ **Tendance** : ${tendanceTexte}\n\n` +
        `📈 **Répartition des payeurs** :\n` +
        `▪️ Bons payeurs : ${diagnostic.statsStatut.bonPayeur}\n` +
        `▪️ Payeurs moyens : ${diagnostic.statsStatut.payeurMoyen}\n` +
        `▪️ Mauvais payeurs : ${diagnostic.statsStatut.mauvaisPayeur}\n` +
        `▪️ Non payeurs : ${diagnostic.statsStatut.nonPayeur}`;
    }

    // ============================================================
    // 11. ALERTES
    // ============================================================
    else if (msg.match(/(alerte|alert|probleme|problème|urgent|anomalie)/i)) {
      if (diagnostic.alertes.length === 0) {
        reponse = `✅ **Aucune alerte active**\n\nTous les indicateurs sont dans les limites acceptables.`;
      } else {
        const liste = diagnostic.alertes.map((a, i) =>
          `${i + 1}. **${a.titre}**\n   ${a.message}`
        ).join('\n\n');
        reponse = `🔔 **${diagnostic.alertes.length} alerte(s)**\n\n${liste}\n\n` +
          `💡 Demandez "plan d'action" pour les résoudre.`;
      }
    }

    // ============================================================
    // 12. PLAN D'ACTION
    // ============================================================
    else if (msg.match(/(plan|action|résoudre|solution|comment faire|étapes)/i)) {
      if (diagnostic.alertes.length === 0) {
        reponse = `✅ Aucun problème à résoudre. Continuez à surveiller les indicateurs.`;
      } else {
        const plans = diagnostic.alertes.map((a, i) =>
          `**${i + 1}. ${a.titre}**\n` +
          a.plan.map((p, j) => `   ${j + 1}) ${p.etape} — *${p.delai}*`).join('\n')
        ).join('\n\n');
        reponse = `📋 **Plan d'action recommandé**\n\n${plans}`;
      }
    }

    // ============================================================
    // 13. PRÉVISIONS
    // ============================================================
    else if (msg.match(/(prevision|prévision|avenir|projection|forecast)/i)) {
      if (diagnostic.forecast.length > 0) {
        const total = diagnostic.forecast.reduce((s, v) => s + v, 0);
        const predictions = diagnostic.forecast.map((v, i) =>
          `▪️ Mois ${i + 1} : ${formatNumber(v)} Ar`
        ).join('\n');
        reponse = `🔮 **Prévisions 6 mois**\n\n${predictions}\n\n💰 **Total prévu** : ${formatNumber(total)} Ar`;
      } else {
        reponse = `📊 Données insuffisantes pour les prévisions.`;
      }
    }

    // ============================================================
    // 14. RÉGIONS
    // ============================================================
    else if (msg.match(/(region|région|regional|ville)/i)) {
      if (diagnostic.parRegion.length > 0) {
        const regions = diagnostic.parRegion.map(r =>
          `▪️ ${r.region} : ${r.nbQuittances} quittance(s), ${formatNumber(r.montant)} Ar`
        ).join('\n');
        reponse = `🗺️ **Analyse par région**\n\n${regions}`;
      } else {
        reponse = `📊 Aucune donnée régionale.`;
      }
    }

    // ============================================================
    // 15. CATÉGORIES
    // ============================================================
    else if (msg.match(/(categorie|catégorie|hotel|hôtel|bus|night|media|grande surface)/i)) {
      const categories = Object.values(diagnostic.categories).map(c =>
        `▪️ **${c.label}** : ${c.tauxPaiement}% (${c.payes}/${c.total})`
      ).join('\n');
      reponse = `📊 **Toutes les catégories**\n\n${categories}`;
    }

    // ============================================================
    // 16. SUCCÈS
    // ============================================================
    else if (msg.match(/(succes|succès|positif|point fort|félicitation)/i)) {
      const points = diagnostic.succes.map(s => `▪️ **${s.titre}** : ${s.message}`).join('\n');
      reponse = `🏆 **Points positifs**\n\n${points}`;
    }

    // ============================================================
    // 17. SUGGESTIONS
    // ============================================================
    else if (msg.match(/(suggestion|conseil|recommandation|améliorer|avis)/i)) {
      const suggestions = diagnostic.suggestions.map((s, i) =>
        `▪️ ${i + 1}. ${s.texte} ${s.priorite === 'haute' ? '🔴' : s.priorite === 'moyenne' ? '🟡' : '🟢'}`
      ).join('\n');
      reponse = `💡 **Suggestions**\n\n${suggestions}`;
    }

    // ============================================================
    // 18. QUITTANCES
    // ============================================================
    else if (msg.match(/(quittance|facture|validation|invoice)/i)) {
      reponse = `🧾 **Quittances**\n\n` +
        `▪️ Total : ${diagnostic.global.totalQuittances}\n` +
        `▪️ À valider : ${diagnostic.global.quittancesNonValidees}\n` +
        `▪️ Factures : ${diagnostic.global.totalFactures}`;
    }

    // ============================================================
    // 19. RÉPONSE PAR DÉFAUT
    // ============================================================
    else {
      reponse = `💡 **Je n'ai pas bien compris votre demande**\n\n` +
        `Voici ce que je peux faire :\n\n` +
        `🔍 **Recherche** : "cherche RAKOTO", "analyse usager DUPONT"\n` +
        `📊 **Listes** : "usagers en retard", "meilleurs payeurs", "pires payeurs"\n` +
        `💰 **Top** : "top montants", "plus gros contributeurs"\n` +
        `📈 **Analyse** : "performance globale", "alertes", "régions", "catégories"\n` +
        `🔮 **Prévisions** : "prévisions", "plan d'action", "suggestions"\n\n` +
        `💬 Reformulez ou utilisez une de ces commandes.`;
    }

    res.json({ success: true, reponse });
  } catch (error) {
    console.error('❌ Erreur chat IA:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;