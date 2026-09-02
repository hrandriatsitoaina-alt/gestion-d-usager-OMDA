const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const bcrypt = require('bcryptjs');
const { requireSuperAdmin } = require('../middleware');

// GET /api/admin/users
router.get('/admin/users', requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, email, role, statut, created_at, derniere_connexion FROM utilisateurs ORDER BY id'
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Erreur admin users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/users
router.post('/admin/users', requireSuperAdmin, async (req, res) => {
  const { nom, email, mot_de_passe, role, statut } = req.body;
  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
  }
  if (mot_de_passe.length < 4) {
    return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 4 caractères' });
  }
  try {
    const existing = await pool.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet email existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 12);

    const result = await pool.query(
      `INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, doit_changer_mdp) 
       VALUES ($1, $2, $3, $4, $5, TRUE) 
       RETURNING id, nom, email, role, statut`,
      [nom, email, hashedPassword, role || 'user', statut || 'actif']
    );

    const newUserId = result.rows[0].id;
    const currentYear = new Date().getFullYear();
    const typesUsager = ['Hôtel', 'Grand Surface', 'Télé/Radio', 'OCC', 'Bus', 'Night club'];

    for (const type of typesUsager) {
      await pool.query(
        `INSERT INTO compteurs_dossiers_utilisateurs (utilisateur_id, annee, compteur, type_usager) 
         VALUES ($1, $2, 0, $3)
         ON CONFLICT (utilisateur_id, annee, type_usager) DO NOTHING`,
        [newUserId, currentYear, type]
      );
    }

    res.json({ success: true, user: result.rows[0], message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur admin add user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id
router.put('/admin/users/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { nom, email, role, statut, mot_de_passe } = req.body;
  try {
    const userResult = await pool.query('SELECT role FROM utilisateurs WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    const currentUser = userResult.rows[0];
    if (currentUser.role === 'super_admin' && role && role !== 'super_admin') {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas changer le rôle du Super Admin' });
    }
    if (role === 'super_admin' && currentUser.role !== 'super_admin') {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas créer un autre Super Admin' });
    }

    let query, params;
    if (mot_de_passe && mot_de_passe.trim() !== '') {
      const hashedPassword = await bcrypt.hash(mot_de_passe, 12);
      query = `UPDATE utilisateurs SET nom = $1, email = $2, role = $3, statut = $4, mot_de_passe = $5, doit_changer_mdp = TRUE WHERE id = $6`;
      params = [nom, email, role || currentUser.role, statut || 'actif', hashedPassword, id];
    } else {
      query = `UPDATE utilisateurs SET nom = $1, email = $2, role = $3, statut = $4 WHERE id = $5`;
      params = [nom, email, role || currentUser.role, statut || 'actif', id];
    }
    await pool.query(query, params);
    res.json({ success: true, message: 'Utilisateur modifié avec succès' });
  } catch (error) {
    console.error('Erreur admin edit user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const superAdmin = await pool.query("SELECT id FROM utilisateurs WHERE role = 'super_admin' LIMIT 1");
    if (superAdmin.rows.length > 0 && superAdmin.rows[0].id === parseInt(id)) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer le Super Admin' });
    }
    const result = await pool.query('DELETE FROM utilisateurs WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur admin delete user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/activities
router.get('/admin/activities', requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.action,
        a.details,
        a.created_at,
        u.nom as user_nom
      FROM activites a
      LEFT JOIN utilisateurs u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, activities: result.rows });
  } catch (error) {
    console.error('Erreur activities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/activities
router.post('/admin/activities', requireSuperAdmin, async (req, res) => {
  const { action, details, user_id } = req.body;
  try {
    await pool.query(
      `INSERT INTO activites (action, details, user_id) VALUES ($1, $2, $3)`,
      [action, details, user_id || 1]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur create activity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ POST /api/admin/verify - Vérifier les accès (CRUCIAL pour Super Admin)
router.post('/admin/verify', async (req, res) => {
  const { password } = req.body;
  try {
    const superAdminResult = await pool.query(
      "SELECT mot_de_passe FROM utilisateurs WHERE role = 'super_admin' LIMIT 1"
    );
    let adminPassword = superAdminResult.rows.length > 0 ? superAdminResult.rows[0].mot_de_passe : '1234';
    
    if (password === adminPassword) {
      return res.json({ 
        success: true, 
        token: config.ADMIN_SECRET_TOKEN, 
        message: 'Accès Super Admin autorisé',
        role: 'super_admin'
      });
    }
    
    const dafResult = await pool.query(
      "SELECT mot_de_passe FROM utilisateurs WHERE role = 'daf' LIMIT 1"
    );
    if (dafResult.rows.length > 0) {
      const dafPassword = dafResult.rows[0].mot_de_passe;
      if (password === dafPassword) {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;