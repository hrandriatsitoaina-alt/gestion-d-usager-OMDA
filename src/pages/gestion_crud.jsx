import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/gestion_crud.css';

const GestionCrud = () => {
  const navigate = useNavigate();
  const [usagers, setUsagers] = useState([]);
  const [filteredUsagers, setFilteredUsagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [selectedType, setSelectedType] = useState('tous');
  const [selectedUsager, setSelectedUsager] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usagerToDelete, setUsagerToDelete] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [stats, setStats] = useState({});
  const [deleteHistory, setDeleteHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [regions, setRegions] = useState([]);

  const usagerTypes = [
    'OCC',
    'Grand Surface', 
    'Bus',
    'Night club',
    'Télé/Radio',
    'Hôtel'
  ];

  useEffect(() => {
    let storedToken = localStorage.getItem('adminToken');
    
    console.log('🔑 Token récupéré:', storedToken ? 'Présent' : 'Absent');
    
    if (!storedToken) {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          storedToken = 'user_' + userData.id + '_' + Date.now();
          localStorage.setItem('adminToken', storedToken);
          console.log('✅ Token utilisateur créé:', storedToken);
        } catch (e) {
          console.error('❌ Erreur création token:', e);
        }
      } else {
        storedToken = 'temp_' + Date.now();
        localStorage.setItem('adminToken', storedToken);
        console.log('⚠️ Token temporaire créé:', storedToken);
      }
    }
    
    setToken(storedToken);
    fetchCurrentUser(storedToken);
    fetchUsagers(storedToken);
    fetchDeleteHistory(storedToken);
    fetchRegions();
  }, []);

  const fetchCurrentUser = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/current-user', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${currentToken}`,
          'adminToken': currentToken
        }
      });
      const data = await response.json();
      if (data.success && data.user) {
        setCurrentUserId(data.user.id);
        setCurrentUserRole(data.user.role || 'user');
        console.log('✅ Utilisateur connecté:', data.user.nom, 'Rôle:', data.user.role);
      } else {
        console.error('❌ Erreur current-user:', data);
        setCurrentUserId(1);
        setCurrentUserRole('user');
      }
    } catch (error) {
      console.error('Erreur fetchCurrentUser:', error);
      setCurrentUserId(1);
      setCurrentUserRole('user');
    }
  };

  const fetchUsagers = async (currentToken) => {
    setLoading(true);
    setError(null);
    try {
      const headers = {};
      if (currentToken) {
        headers['adminToken'] = currentToken;
      }
      
      console.log('📡 Envoi requête /api/usagers avec token:', currentToken);
      
      const response = await fetch('http://localhost:3001/api/usagers', {
        headers: headers
      });
      
      console.log('📡 Statut réponse:', response.status);
      
      if (response.status === 500) {
        throw new Error('Erreur serveur (500) - Vérifiez la base de données');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 Données reçues:', data);
      
      let usagersData = [];
      if (Array.isArray(data)) {
        usagersData = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.usagers)) {
          usagersData = data.usagers;
        } else if (Array.isArray(data.data)) {
          usagersData = data.data;
        } else if (data.success === false) {
          throw new Error(data.error || data.message || 'Erreur serveur');
        } else {
          usagersData = Object.values(data).filter(item => typeof item === 'object' && item !== null && item.id);
        }
      }
      
      console.log('✅ Usagers chargés:', usagersData.length);
      
      // Normaliser les types
      usagersData = usagersData.map(u => {
        if (u.type_usager === 'Media' || u.type_usager === 'Télé/Radio' || u.type_usager === 'tele-radio') {
          u.type_usager = 'Télé/Radio';
        }
        u._uniqueKey = `${u.id}_${u.type_usager}`;
        return u;
      });
      
      // Supprimer les doublons
      const uniqueMap = new Map();
      for (const u of usagersData) {
        if (!uniqueMap.has(u._uniqueKey)) {
          uniqueMap.set(u._uniqueKey, u);
        }
      }
      usagersData = Array.from(uniqueMap.values());
      console.log('✅ Après dédoublonnage:', usagersData.length);
      
      setUsagers(usagersData);
      updateStats(usagersData);
      setFilteredUsagers(usagersData);
      
    } catch (error) {
      console.error('❌ Erreur fetchUsagers:', error);
      setError(error.message || 'Impossible de charger les usagers');
      setUsagers([]);
      setFilteredUsagers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeleteHistory = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/usagers/delete-history', {
        headers: { 'adminToken': currentToken }
      });
      const data = await response.json();
      if (data.success) {
        setDeleteHistory(data.history || []);
      }
    } catch (error) {
      console.error('Erreur fetch delete history:', error);
    }
  };

  // ============================================
  // RÉCUPÉRER LES RÉGIONS
  // ============================================
  const fetchRegions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/regions');
      const data = await response.json();
      if (data.success) {
        setRegions(data.regions || []);
        console.log('✅ Régions chargées:', data.regions.length);
      }
    } catch (error) {
      console.error('❌ Erreur fetch regions:', error);
    }
  };

  const updateStats = (data) => {
    const newStats = {};
    usagerTypes.forEach(type => {
      newStats[type] = data.filter(u => u.type_usager === type).length;
    });
    newStats.total = data.length;
    setStats(newStats);
  };

  // ============================================
  // FONCTION DE FILTRAGE
  // ============================================
  const filterByType = (type) => {
    console.log('🔍 Filtrage par type:', type);
    console.log('📊 Nombre total d\'usagers:', usagers.length);
    
    setSelectedType(type);
    
    let filtered = [...usagers];
    
    if (type && type !== 'tous') {
      filtered = filtered.filter(u => u.type_usager === type);
      console.log(`📊 Usagers de type ${type}:`, filtered.length);
    } else {
      console.log('📊 Tous les usagers:', filtered.length);
    }
    
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(u => 
        (u.denomination && u.denomination.toLowerCase().includes(searchLower)) ||
        (u.demandeur && u.demandeur.toLowerCase().includes(searchLower)) ||
        (u.telephone && u.telephone && u.telephone.includes(searchTerm.trim())) ||
        (u.email && u.email.toLowerCase().includes(searchLower)) ||
        (u.region && u.region.toLowerCase().includes(searchLower))
      );
      console.log('📊 Après recherche:', filtered.length);
    }
    
    setFilteredUsagers(filtered);
  };

  const handleTypeSelect = (type) => {
    filterByType(type);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterByType(selectedType);
  };

  const clearSearch = () => {
    setSearchTerm('');
    filterByType(selectedType);
  };

  // ============================================
  // MODIFICATION
  // ============================================
  const handleEdit = (usager) => {
    setSelectedUsager(usager);
    setEditingData({
      denomination: usager.denomination || '',
      demandeur: usager.demandeur || '',
      telephone: usager.telephone || '',
      email: usager.email || '',
      adresse: usager.adresse || '',
      region: usager.region || '',
      confirmation_nom: usager.confirmation_nom || '',
      representant_cin: usager.representant_cin || '',
      representant_cin_delivree: usager.representant_cin_delivree || '',
      representant_cin_lieu: usager.representant_cin_lieu || '',
      representant_par: usager.representant_par || '',
      domicile: usager.domicile || '',
      frais_dossier: usager.frais_dossier || 0,
      montant_mensuel: usager.montant_mensuel || 0,
      type_usager: usager.type_usager || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUsager) return;

    const updateData = {
      ...editingData,
      type_usager: editingData.type_usager || selectedUsager.type_usager
    };

    try {
      console.log('📤 Envoi mise à jour:', updateData);
      
      const response = await fetch(`http://localhost:3001/api/usagers/${selectedUsager.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'adminToken': token
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      console.log('📥 Réponse mise à jour:', data);
      
      if (data.success) {
        setSuccessMsg('✅ Usager modifié avec succès');
        setShowEditModal(false);
        setSelectedUsager(null);
        fetchUsagers(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('❌ Erreur: ' + (data.message || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la modification: ' + error.message);
    }
  };

  // ============================================
  // SUPPRESSION
  // ============================================
  const initiateDelete = (usager) => {
    if (currentUserRole !== 'super_admin') {
      alert('⚠️ Seul le Super Admin peut supprimer des usagers.');
      return;
    }
    setUsagerToDelete(usager);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!usagerToDelete) return;

    try {
      const response = await fetch(`http://localhost:3001/api/usagers/${usagerToDelete.id}`, {
        method: 'DELETE',
        headers: { 
          'adminToken': token,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();

      if (data.success) {
        setSuccessMsg(`✅ Usager "${usagerToDelete.denomination}" supprimé avec succès par Super Admin`);
        setShowDeleteModal(false);
        setUsagerToDelete(null);
        fetchUsagers(token);
        fetchDeleteHistory(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('❌ Erreur: ' + (data.message || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  // ============================================
  // RETOUR VERS LE DASHBOARD
  // ============================================
  const handleGoBack = () => {
    navigate('/');
  };

  // ============================================
  // RENDU
  // ============================================

  if (loading) {
    return (
      <div className="gestion-crud-loading">
        <div className="spinner"></div>
        <p>Chargement des usagers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestion-crud-error">
        <p>❌ {error}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => {
              const newToken = 'temp_' + Date.now();
              localStorage.setItem('adminToken', newToken);
              setToken(newToken);
              fetchUsagers(newToken);
            }} 
            className="retry-btn"
          >
            🔄 Réessayer
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="retry-btn" 
            style={{ background: '#6c757d' }}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              navigate('/');
            }} 
            className="retry-btn" 
            style={{ background: '#dc3545' }}
          >
            🔓 Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUserRole === 'super_admin';

  return (
    <div className="gestion-crud-container">
      {successMsg && (
        <div className="success-banner">
          <span>✓</span> {successMsg}
        </div>
      )}

      <div className="gestion-header">
        <div className="gestion-header-left">
          <h2>📂 Gestion des Usagers</h2>
          <p className="gestion-subtitle">
            {isSuperAdmin 
              ? '👑 Super Admin - Vous pouvez modifier et supprimer tous les usagers'
              : `👤 Vous pouvez modifier les usagers mais seule le Super Admin peut supprimer`}
          </p>
        </div>
        <div className="gestion-header-right">
          <button className="btn-back-dashboard" onClick={handleGoBack}>
            ← Retour au connexion 
          </button>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="stats-cards">
        <div className="stat-card-total">
          <span className="stat-number">{stats.total || 0}</span>
          <span className="stat-label">Total Usagers</span>
        </div>
        {usagerTypes.map(type => (
          <div 
            key={type} 
            className={`stat-card-type ${selectedType === type ? 'active' : ''}`} 
            onClick={() => handleTypeSelect(type)}
          >
            <span className="stat-number">{stats[type] || 0}</span>
            <span className="stat-label">{type}</span>
          </div>
        ))}
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="search-filter-container">
        <div className="search-bar-wrapper">
          <input 
            type="text" 
            className="search-input-crud" 
            placeholder="🔍 Rechercher par nom, demandeur, téléphone, email, région..." 
            value={searchTerm} 
            onChange={handleSearch} 
          />
          {searchTerm && (
            <button className="clear-search" onClick={clearSearch}>✕</button>
          )}
        </div>
      </div>

      {/* FILTRES */}
      <div className="filter-bar">
        <button 
          className={`filter-btn ${selectedType === 'tous' ? 'active' : ''}`}
          onClick={() => handleTypeSelect('tous')}
        >
          📊 Tous
        </button>
        {usagerTypes.map(type => (
          <button 
            key={type}
            className={`filter-btn ${selectedType === type ? 'active' : ''}`}
            onClick={() => handleTypeSelect(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* TABLEAU */}
      <div className="table-wrapper">
        <table className="usager-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Dénomination</th>
              <th>Demandeur</th>
              <th>Région</th>
              <th>Téléphone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsagers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  📭 Aucun usager trouvé
                  {searchTerm && ` pour "${searchTerm}"`}
                </td>
              </tr>
            ) : (
              filteredUsagers.map(usager => (
                <tr key={usager._uniqueKey || usager.id}>
                  <td>{usager.id}</td>
                  <td>
                    <span className="type-badge">{usager.type_usager || '-'}</span>
                  </td>
                  <td><strong>{usager.denomination || 'N/A'}</strong></td>
                  <td>{usager.demandeur || 'N/A'}</td>
                  <td>{usager.region || '-'}</td>
                  <td>{usager.telephone || '-'}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(usager)}
                      title="Modifier"
                    >
                      ✏️ Modifier
                    </button>
                    {isSuperAdmin && (
                      <button 
                        className="btn-delete"
                        onClick={() => initiateDelete(usager)}
                        title="Supprimer"
                      >
                        🗑️ Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL MODIFICATION */}
      {showEditModal && selectedUsager && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Modifier {selectedUsager.denomination}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-row">
                <div className="form-group">
                  <label>Dénomination *</label>
                  <input 
                    type="text" 
                    value={editingData.denomination} 
                    onChange={(e) => setEditingData({...editingData, denomination: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Demandeur *</label>
                  <input 
                    type="text" 
                    value={editingData.demandeur} 
                    onChange={(e) => setEditingData({...editingData, demandeur: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input 
                    type="text" 
                    value={editingData.telephone} 
                    onChange={(e) => setEditingData({...editingData, telephone: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={editingData.email} 
                    onChange={(e) => setEditingData({...editingData, email: e.target.value})} 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Région</label>
                  <select 
                    value={editingData.region || ''} 
                    onChange={(e) => setEditingData({...editingData, region: e.target.value})}
                  >
                    <option value="">-- Sélectionner une région --</option>
                    {regions.map(region => (
                      <option key={region.id} value={region.nom}>
                        {region.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Adresse</label>
                  <input 
                    type="text" 
                    value={editingData.adresse || ''} 
                    onChange={(e) => setEditingData({...editingData, adresse: e.target.value})} 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Domicile</label>
                  <input 
                    type="text" 
                    value={editingData.domicile || ''} 
                    onChange={(e) => setEditingData({...editingData, domicile: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Confirmation Nom</label>
                  <input 
                    type="text" 
                    value={editingData.confirmation_nom || ''} 
                    onChange={(e) => setEditingData({...editingData, confirmation_nom: e.target.value})} 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Représentant CIN</label>
                  <input 
                    type="text" 
                    value={editingData.representant_cin || ''} 
                    onChange={(e) => setEditingData({...editingData, representant_cin: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Représentant Par</label>
                  <input 
                    type="text" 
                    value={editingData.representant_par || ''} 
                    onChange={(e) => setEditingData({...editingData, representant_par: e.target.value})} 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Frais Dossier</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingData.frais_dossier || 0} 
                    onChange={(e) => setEditingData({...editingData, frais_dossier: parseFloat(e.target.value) || 0})} 
                  />
                </div>
                <div className="form-group">
                  <label>Montant Mensuel</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingData.montant_mensuel || 0} 
                    onChange={(e) => setEditingData({...editingData, montant_mensuel: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Type d'usager</label>
                <select 
                  value={editingData.type_usager || selectedUsager.type_usager} 
                  onChange={(e) => setEditingData({...editingData, type_usager: e.target.value})}
                >
                  {usagerTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer-info">
                <p className="info-note">ℹ️ Le montant n'est pas modifiable dans cette interface.</p>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">💾 Enregistrer</button>
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>❌ Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && usagerToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirmation de suppression</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="delete-info">
                <p><strong>👑 Super Admin</strong></p>
                <p><strong>Usager :</strong> {usagerToDelete.denomination}</p>
                <p><strong>Type :</strong> {usagerToDelete.type_usager}</p>
                <p><strong>Demandeur :</strong> {usagerToDelete.demandeur}</p>
                <p><strong>Région :</strong> {usagerToDelete.region || 'Non spécifiée'}</p>
                <p><strong>Téléphone :</strong> {usagerToDelete.telephone || 'Non spécifié'}</p>
              </div>
              <div className="delete-confirmation-info">
                <div className="super-admin-confirm">
                  <p>👑 Vous êtes Super Admin - Suppression immédiate</p>
                  <p className="delete-warning">⚠️ Cette action est irréversible !</p>
                  <p className="delete-warning">🗑️ Tous les éléments liés seront supprimés</p>
                </div>
              </div>
              <div className="delete-actions">
                <button 
                  className="btn-confirm-delete"
                  onClick={confirmDelete}
                >
                  🗑️ Confirmer la suppression
                </button>
                <button 
                  className="btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  ❌ Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCrud;