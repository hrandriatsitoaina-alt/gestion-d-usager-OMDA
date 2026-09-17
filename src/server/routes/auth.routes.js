const express = require('express');
const router = express.Router();
const pool = require('../database');
const config = require('../config');

// ============================================================
// GÉNÉRATION DE PRÉFIXE UNIQUE EN 3 LETTRES (JAMAIS DE CHIFFRES)
// ============================================================

/**
 * Nettoie un nom : enlève espaces + caractères non alphabétiques + majuscules
 */
function cleanName(nom) {
  return (nom || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * Vérifie si un préfixe est déjà utilisé
 */
async function isPrefixAvailable(prefix, excludeUserId = null) {
  let query = 'SELECT id FROM utilisateurs WHERE prefix = $1';
  const params = [prefix];
  if (excludeUserId) {
    query += ' AND id != $2';
    params.push(excludeUserId);
  }
  const result = await pool.query(query, params);
  return result.rows.length === 0;
}

const VOYELLES = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);

/**
 * Construit une liste de candidats de 3 lettres à partir du nom.
 * Aucun chiffre — uniquement A-Z.
 */
function buildCandidates(cleaned) {
  const candidates = [];
  const seen = new Set();
  const push = (s) => {
    const c = (s || '').substring(0, 3).toUpperCase();
    if (c.length === 3 && /^[A-Z]{3}$/.test(c) && !seen.has(c)) {
      seen.add(c);
      candidates.push(c);
    }
  };

  const letters = cleaned.split('');
  const L1 = letters[0] || 'X';

  // Stratégie 1 : 3 premières lettres (RAKOTO → RAK)
  push(cleaned.substring(0, 3));

  // Stratégie 2 : 1ère + 2 consonnes suivantes (RAKOTROKA → RTK)
  const consonnesApres = letters.slice(1).filter(c => !VOYELLES.has(c));
  if (consonnesApres.length >= 2) {
    push(L1 + consonnesApres[0] + consonnesApres[1]);
  }

  // Stratégie 3 : 1ère + 2ème + dernière
  if (letters.length >= 3) {
    push(L1 + letters[1] + letters[letters.length - 1]);
  }

  // Stratégie 4 : 1ère + dernière + avant-dernière
  if (letters.length >= 3) {
    push(L1 + letters[letters.length - 1] + letters[letters.length - 2]);
  }

  // Stratégie 5 : 1ère + 3ème + 5ème
  if (letters.length >= 5) {
    push(L1 + letters[2] + letters[4]);
  }

  // Stratégie 6 : 1ère + 2ème + 4ème
  if (letters.length >= 4) {
    push(L1 + letters[1] + letters[3]);
  }

  // Stratégie 7 : L1 + lettres[i] + lettres[j]
  for (let i = 2; i < letters.length; i++) {
    for (let j = i + 1; j < letters.length; j++) {
      push(L1 + letters[i] + letters[j]);
    }
  }

  // Stratégie 8 : toutes combinaisons de 3 parmi les 8 premières
  const pool8 = letters.slice(0, 8);
  for (let i = 0; i < pool8.length; i++) {
    for (let j = i + 1; j < pool8.length; j++) {
      for (let k = j + 1; k < pool8.length; k++) {
        push(pool8[i] + pool8[j] + pool8[k]);
      }
    }
  }

  return candidates;
}

/**
 * En dernier recours : force brute L1 + A + A, L1 + A + B, ..., L1 + Z + Z
 */
async function bruteForcePrefix(L1, excludeUserId = null) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < alphabet.length; j++) {
      const candidate = L1 + alphabet[i] + alphabet[j];
      if (await isPrefixAvailable(candidate, excludeUserId)) {
        return candidate;
      }
    }
  }
  // Vraiment au bout : X + Y + Z
  for (let i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < alphabet.length; j++) {
      for (let k = 0; k < alphabet.length; k++) {
        const candidate = alphabet[i] + alphabet[j] + alphabet[k];
        if (await isPrefixAvailable(candidate, excludeUserId)) {
          return candidate;
        }
      }
    }
  }
  throw new Error('Impossible de générer un préfixe unique');
}

/**
 * Génère un préfixe UNIQUE de 3 LETTRES (jamais de chiffres)
 */
async function generateUniquePrefix(nom, excludeUserId = null) {
  const cleaned = cleanName(nom);
  if (!cleaned) {
    throw new Error('Nom invalide pour la génération du préfixe');
  }

  const candidates = buildCandidates(cleaned);
  for (const candidate of candidates) {
    if (await isPrefixAvailable(candidate, excludeUserId)) {
      return candidate;
    }
  }

  const L1 = cleaned[0] || 'X';
  return await bruteForcePrefix(L1, excludeUserId);
}

// ============================================================
// ROUTE PUBLIQUE D'INSCRIPTION (POST /auth/register)
// ============================================================
router.post('/auth/register', async (req, res) => {
  const { nom, email, mot_de_passe } = req.body;

  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
  }
  if (mot_de_passe.length < 4) {
    return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 4 caractères.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });
    }

    const prefix = await generateUniquePrefix(nom);

    const result = await pool.query(
      `INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, prefix)
       VALUES ($1, $2, $3, 'user', 'inactif', $4)
       RETURNING id, nom, email, role, statut, prefix`,
      [nom, email, mot_de_passe, prefix]
    );

    const newUser = result.rows[0];
    const currentYear = new Date().getFullYear();
    const typesUsager = ['Hôtel', 'Grand Surface', 'Télé/Radio', 'OCC', 'Bus', 'Night club'];
    for (const type of typesUsager) {
      await pool.query(
        `INSERT INTO compteurs_dossiers_utilisateurs (utilisateur_id, annee, compteur, type_usager)
         VALUES ($1, $2, 0, $3)
         ON CONFLICT (utilisateur_id, annee, type_usager) DO NOTHING`,
        [newUser.id, currentYear, type]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès.',
      user: newUser
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
});

// ============================================================
// ROUTE DE LOGIN (POST /auth/login)
// ============================================================
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`🔐 Tentative: ${username}`);
  try {
    const result = await pool.query(
      `SELECT id, nom, email, role, statut, prefix
       FROM utilisateurs 
       WHERE (email = $1 OR nom = $1) AND mot_de_passe = $2 AND statut = 'actif'`,
      [username, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      await pool.query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1', [user.id]);

      const responseData = {
        success: true,
        user: {
          id: user.id,
          nom: user.nom,
          email: user.email,
          role: user.role,
          prefix: user.prefix
        },
        message: `Bienvenue ${user.nom} !`
      };

      if (user.role === 'super_admin') {
        responseData.adminToken = config.ADMIN_SECRET_TOKEN;
      } else if (user.role === 'daf') {
        responseData.adminToken = config.DAF_SECRET_TOKEN;
      }

      res.json(responseData);
    } else {
      res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// ROUTES POUR LE FRONTEND
// ============================================================

// ✅ GET /auth/users - Liste des utilisateurs
router.get('/auth/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, email, role, statut, prefix, created_at, derniere_connexion FROM utilisateurs ORDER BY id'
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Erreur auth/users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ GET /auth/current-user - Récupérer l'utilisateur courant
router.get('/auth/current-user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try { userId = parseInt(token); } catch (e) { }
    }
    let result;
    if (userId) {
      result = await pool.query(`
        SELECT id, nom, email, role, prefix FROM utilisateurs 
        WHERE id = $1 AND statut = 'actif'`, [userId]);
    } else {
      result = await pool.query(`
        SELECT id, nom, email, role, prefix FROM utilisateurs 
        WHERE statut = 'actif' ORDER BY id LIMIT 1`);
    }
    if (result.rows.length === 0) {
      const defaultPrefix = await generateUniquePrefix('Utilisateur par défaut');
      const insertResult = await pool.query(`
        INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, prefix) 
        VALUES ('Utilisateur par défaut', 'user@omda.mg', '1234', 'user', 'actif', $1) 
        RETURNING id, nom, email, role, prefix`, [defaultPrefix]);
      result.rows = insertResult.rows;
    }
    const user = result.rows[0];
    res.json({ success: true, user: { ...user, prefix: user.prefix } });
  } catch (error) {
    console.error('Erreur current-user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ GET /users/stats - Statistiques des utilisateurs
router.get('/users/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nom, u.prefix, u.email, u.role
      FROM utilisateurs u WHERE u.statut = 'actif' ORDER BY u.id
    `);
    const usersWithCounts = [];
    for (const user of result.rows) {
      const userData = { ...user, dossiers: {} };
      let totalDossiers = 0;
      const typesUsager = ['Hôtel', 'Grand Surface', 'Télé/Radio', 'OCC', 'Bus', 'Night club'];
      for (const type of typesUsager) {
        const counterResult = await pool.query(
          `SELECT compteur FROM compteurs_dossiers_utilisateurs 
           WHERE utilisateur_id = $1 AND annee = $2 AND type_usager = $3`,
          [user.id, new Date().getFullYear(), type]
        );
        const count = counterResult.rows.length > 0 ? counterResult.rows[0].compteur : 0;
        userData.dossiers[type] = count;
        totalDossiers += count;
      }
      userData.totalDossiers = totalDossiers;
      usersWithCounts.push(userData);
    }
    res.json({ success: true, users: usersWithCounts });
  } catch (error) {
    console.error('Erreur stats users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;