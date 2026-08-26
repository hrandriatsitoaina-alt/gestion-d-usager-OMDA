const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const config = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authMiddleware, 
        requireSuperAdmin,
        requireAdminOrDaf 
      } = require('../middleware/auth');


// ============================================================

// INSCRIPTION (POST /auth/register)
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

    const hashedPassword = await bcrypt.hash(mot_de_passe, 12); // ← hachage
    const result = await pool.query(
      `INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, doit_changer_mdp)
       VALUES ($1, $2, $3, 'user', 'inactif', FALSE)
       RETURNING id, nom, email, role, statut`,

       [nom, email, hashedPassword]
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
// LOGIN (POST /auth/login)
// ============================================================
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`🔐 Tentative: ${username}`);

  try {
    // 1. Récupérer l'utilisateur SANS comparer le mot de passe en SQL
    const result = await pool.query(
      `SELECT id, nom, email, role, statut, mot_de_passe, doit_changer_mdp
       FROM utilisateurs 
       WHERE (email = $1 OR nom = $1) AND statut = 'actif'`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const user = result.rows[0];

    // 2. Comparer avec bcrypt
    const valid = await bcrypt.compare(password, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    await pool.query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1', [user.id]);

    const prefix = user.nom.substring(0, 3).toUpperCase();

    // 3. Générer un vrai token JWT (remplace les tokens statiques)
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const responseData = {
      success: true,
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        prefix
      },
      doitChangerMdp: user.doit_changer_mdp,
      message: `Bienvenue ${user.nom} !`
    };

    res.json(responseData);
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// CHANGEMENT DE MOT DE PASSE (protégé, POST /auth/change-password)
// ============================================================
router.post('/auth/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Les mots de passe ne correspondent pas.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
  }

  try {
    const result = await pool.query('SELECT * FROM utilisateurs WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const valid = await bcrypt.compare(oldPassword, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Ancien mot de passe incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE utilisateurs SET mot_de_passe = $1, doit_changer_mdp = FALSE WHERE id = $2',
      [newHash, user.id]
    );

    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    console.error('Erreur change-password:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// VÉRIFICATION ADMIN (POST /admin/verify)
// ============================================================
router.post('/admin/verify', async (req, res) => {
  const { password } = req.body;
  try {
    const superAdminResult = await pool.query(
      "SELECT mot_de_passe FROM utilisateurs WHERE role = 'super_admin' LIMIT 1"
    );

    if (superAdminResult.rows.length > 0) {
      const validSuperAdmin = await bcrypt.compare(password, superAdminResult.rows[0].mot_de_passe);
      if (validSuperAdmin) {
        return res.json({
          success: true,
          token: config.ADMIN_SECRET_TOKEN,
          message: 'Accès Super Admin autorisé',
          role: 'super_admin'
        });
      }
    }

    const dafResult = await pool.query(
      "SELECT mot_de_passe FROM utilisateurs WHERE role = 'daf' LIMIT 1"
    );
    if (dafResult.rows.length > 0) {
      const validDaf = await bcrypt.compare(password, dafResult.rows[0].mot_de_passe);
      if (validDaf) {
        return res.json({
          success: true,
          token: config.DAF_SECRET_TOKEN,
          message: 'Accès DAF autorisé',
          role: 'daf'
        });
      }
    }

    res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
  } catch (error) {
    console.error('Erreur verify admin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// LISTE DES UTILISATEURS (protégée)
// ============================================================
router.get('/auth/users', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, email, role, statut, created_at, derniere_connexion FROM utilisateurs ORDER BY id'
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// UTILISATEUR COURANT (protégé — remplace l'ancienne version non sécurisée)
// ============================================================
router.get('/auth/current-user', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, email, role FROM utilisateurs WHERE id = $1 AND statut = 'actif'`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const user = result.rows[0];
    const prefix = user.nom.substring(0, 3).toUpperCase();
    res.json({ success: true, user: { ...user, prefix } });
  } catch (error) {
    console.error('Erreur current-user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// STATISTIQUES UTILISATEURS (protégée)
// ============================================================
router.get('/users/stats', authMiddleware, async (req, res) => {
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