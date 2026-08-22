const express = require('express');
const router = express.Router();
const pool = require('../database');
const config = require('../config');

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

    const result = await pool.query(
      `INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut)
       VALUES ($1, $2, $3, 'user', 'inactif')
       RETURNING id, nom, email, role, statut`,
      [nom, email, mot_de_passe]
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
      `SELECT id, nom, email, role, statut
       FROM utilisateurs 
       WHERE (email = $1 OR nom = $1) AND mot_de_passe = $2 AND statut = 'actif'`,
      [username, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      await pool.query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1', [user.id]);
      
      const prefix = user.nom.substring(0, 3).toUpperCase();
      const responseData = { 
        success: true, 
        user: { 
          id: user.id, 
          nom: user.nom, 
          email: user.email, 
          role: user.role,
          prefix: prefix
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
// ROUTES POUR LE FRONTEND (Ces routes doivent RESTER)
// ============================================================

// ✅ GET /auth/users - Liste des utilisateurs (pour le frontend)
router.get('/auth/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, email, role, statut, created_at, derniere_connexion FROM utilisateurs ORDER BY id'
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
      try { userId = parseInt(token); } catch(e) {}
    }
    let result;
    if (userId) {
      result = await pool.query(`
        SELECT id, nom, email, role FROM utilisateurs 
        WHERE id = $1 AND statut = 'actif'`, [userId]);
    } else {
      result = await pool.query(`
        SELECT id, nom, email, role FROM utilisateurs 
        WHERE statut = 'actif' ORDER BY id LIMIT 1`);
    }
    if (result.rows.length === 0) {
      const insertResult = await pool.query(`
        INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut) 
        VALUES ('Utilisateur par défaut', 'user@omda.mg', '1234', 'user', 'actif') 
        RETURNING id, nom, email, role`);
      result.rows = insertResult.rows;
    }
    const user = result.rows[0];
    const prefix = user.nom.substring(0, 3).toUpperCase();
    res.json({ success: true, user: { ...user, prefix } });
  } catch (error) {
    console.error('Erreur current-user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ GET /users/stats - Statistiques des utilisateurs
router.get('/users/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nom, SUBSTRING(u.nom, 1, 3) as prefix, u.email, u.role
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