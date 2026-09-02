const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database');
const { verifyAdminToken } = require('../middleware');

// ============================================
// GET /api/profile/:userId
// ============================================
router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log('📡 Récupération profil pour userId:', userId);
    
    const userResult = await pool.query(
      `SELECT id, nom, email, role, statut, created_at, derniere_connexion
       FROM utilisateurs 
       WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    const user = userResult.rows[0];
    console.log('✅ Utilisateur trouvé:', user.nom);
    
    // ❌ SUPPRIMÉ : Statistiques qui utilisaient created_by
    // Pour éviter l'erreur, on renvoie des statistiques vides
    
    res.json({
      success: true,
      user: {
        ...user,
        totalDossiers: 0,
        dossiers: {}
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ============================================
// PUT /api/profile/:userId
// ============================================
router.put('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { nom, email, mot_de_passe } = req.body;
  
  try {
    console.log('📝 Mise à jour profil pour userId:', userId);
    
    const userCheck = await pool.query(
      'SELECT id FROM utilisateurs WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM utilisateurs WHERE email = $1 AND id != $2',
        [email, userId]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cet email est déjà utilisé par un autre compte' 
        });
      }
    }
    
    let query = 'UPDATE utilisateurs SET ';
    const params = [];
    let paramIndex = 1;
    
    if (nom) {
      query += `nom = $${paramIndex}, `;
      params.push(nom);
      paramIndex++;
    }
    
    if (email) {
      query += `email = $${paramIndex}, `;
      params.push(email);
      paramIndex++;
    }
    
    if (mot_de_passe && mot_de_passe.length >= 4) {
      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
      query += `mot_de_passe = $${paramIndex}, `;
      params.push(hashedPassword);
      paramIndex++;
    }
    
    query = query.slice(0, -2);
    query += ` WHERE id = $${paramIndex} RETURNING id, nom, email, role, statut`;
    params.push(userId);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    console.log('✅ Profil mis à jour pour:', result.rows[0].nom);
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ============================================
// GET /api/profile/me
// ============================================
router.get('/profile/me', verifyAdminToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log('📡 Récupération profil courant, userId:', userId);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
    }
    
    const userResult = await pool.query(
      `SELECT id, nom, email, role, statut, created_at, derniere_connexion
       FROM utilisateurs 
       WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      success: true,
      user: {
        ...user,
        totalDossiers: 0,
        dossiers: {}
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération profil courant:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;