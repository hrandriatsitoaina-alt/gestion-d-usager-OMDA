// src/pages/GestionCrud.jsx
import React, { useState, useEffect } from 'react';
import '../styles/gestion_crud.css';
import { Edit, Trash2, ArrowLeft, Search, X, FolderOpen } from 'lucide-react';

const GestionCrud = ({ onBack }) => {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [regions, setRegions] = useState([]);
  const [deleteError, setDeleteError] = useState(null); // NOUVEAU : pour afficher l'erreur réelle dans la modale

  const usagerTypes = ['OCC', 'Grand Surface', 'Bus', 'Night club', 'Télé/Radio', 'Hôtel'];

  useEffect(() => {
    let storedToken = localStorage.getItem('adminToken');
    if (!storedToken) {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          storedToken = 'user_' + userData.id + '_' + Date.now();
          localStorage.setItem('adminToken', storedToken);
        } catch (e) {}
      } else {
        storedToken = 'temp_' + Date.now();
        localStorage.setItem('adminToken', storedToken);
      }
    }
    setToken(storedToken);
    fetchCurrentUser(storedToken);
    fetchUsagers(storedToken);
    fetchRegions();
  }, []);

  // ============================================================
  // CORRIGÉ : on lit d'abord le rôle depuis le localStorage (fiable),
  // puis on tente de le rafraîchir via l'API. Si l'API échoue, on NE
  // rétrograde PLUS silencieusement l'utilisateur en simple 'user' —
  // c'est ce qui faisait disparaître le bouton Supprimer pour de vrais
  // Super Admins quand /api/auth/current-user était indisponible.
  // ============================================================
  const fetchCurrentUser = async (currentToken) => {
    // 1) Valeur de secours fiable : ce que l'utilisateur a stocké au login
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData && userData.id) {
          setCurrentUserId(userData.id);
          setCurrentUserRole(userData.role || 'user');
        }
      }
    } catch (e) {
      console.error('Erreur lecture user localStorage:', e);
    }

    // 2) Tentative de rafraîchissement via l'API (source la plus à jour)
    try {
      const response = await fetch('http://localhost:3001/api/auth/current-user', {
        headers: { 'Authorization': `Bearer ${currentToken}`, 'adminToken': currentToken }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && data.user) {
        setCurrentUserId(data.user.id);
        setCurrentUserRole(data.user.role || 'user');
      }
    } catch (error) {
      // On garde le rôle lu depuis le localStorage au lieu d'écraser avec 'user'
      console.error('Erreur fetchCurrentUser (rôle localStorage conservé si disponible):', error);
    }
  };

  const fetchUsagers = async (currentToken) => {
    setLoading(true);
    setError(null);
    try {
      const headers = currentToken ? { 'adminToken': currentToken } : {};
      const response = await fetch('http://localhost:3001/api/usagers', { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      let usagersData = [];
      if (Array.isArray(data)) usagersData = data;
      else if (data && typeof data === 'object') {
        if (Array.isArray(data.usagers)) usagersData = data.usagers;
        else if (Array.isArray(data.data)) usagersData = data.data;
        else usagersData = Object.values(data).filter(item => typeof item === 'object' && item !== null && item.id);
      }
      usagersData = usagersData.map(u => {
        if (u.type_usager === 'Media' || u.type_usager === 'Télé/Radio' || u.type_usager === 'tele-radio') {
          u.type_usager = 'Télé/Radio';
        }
        u._uniqueKey = `${u.id}_${u.type_usager}`;
        return u;
      });
      const uniqueMap = new Map();
      for (const u of usagersData) if (!uniqueMap.has(u._uniqueKey)) uniqueMap.set(u._uniqueKey, u);
      usagersData = Array.from(uniqueMap.values());
      setUsagers(usagersData);
      updateStats(usagersData);
      filterByType(selectedType, usagersData, searchTerm);
    } catch (error) {
      console.error('Erreur fetchUsagers:', error);
      setError(error.message || 'Impossible de charger les usagers');
      setUsagers([]);
      setFilteredUsagers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/regions');
      const data = await response.json();
      if (data.success) setRegions(data.regions || []);
    } catch (error) {
      console.error('Erreur fetchRegions:', error);
    }
  };

  const updateStats = (data) => {
    const newStats = {};
    usagerTypes.forEach(type => { newStats[type] = data.filter(u => u.type_usager === type).length; });
    newStats.total = data.length;
    setStats(newStats);
  };

  const filterByType = (type, data = usagers, search = searchTerm) => {
    setSelectedType(type);
    let filtered = [...data];
    if (type && type !== 'tous') filtered = filtered.filter(u => u.type_usager === type);
    if (search.trim() !== '') {
      const s = search.toLowerCase().trim();
      filtered = filtered.filter(u =>
        (u.denomination && u.denomination.toLowerCase().includes(s)) ||
        (u.demandeur && u.demandeur.toLowerCase().includes(s)) ||
        (u.telephone && u.telephone.includes(search.trim())) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.region && u.region.toLowerCase().includes(s))
      );
    }
    setFilteredUsagers(filtered);
  };

  const handleTypeSelect = (type) => filterByType(type);
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    filterByType(selectedType);
  };
  const clearSearch = () => {
    setSearchTerm('');
    filterByType(selectedType);
  };

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
    const updateData = { ...editingData, type_usager: editingData.type_usager || selectedUsager.type_usager };
    try {
      const response = await fetch(`http://localhost:3001/api/usagers/${selectedUsager.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'adminToken': token },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
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
      console.error('Erreur handleUpdate:', error);
      alert('❌ Erreur lors de la modification');
    }
  };

  // ============================================================
  // CORRIGÉ : comparaison de rôle insensible à la casse/espaces
  // ============================================================
  const initiateDelete = (usager) => {
    const role = (currentUserRole || '').toString().trim().toLowerCase();
    if (role !== 'super_admin') {
      alert('⚠️ Seul le Super Admin peut supprimer des usagers.');
      return;
    }
    setDeleteError(null);
    setUsagerToDelete(usager);
    setShowDeleteModal(true);
  };

// Seule la partie confirmDelete est modifiée
// Le reste du fichier reste identique

// ============================================================
// CORRIGÉ : suppression avec le type d'usager dans l'URL
// ============================================================
const confirmDelete = async () => {
  if (!usagerToDelete) return;
  setDeleteError(null);
  
  // Convertir le type en format URL pour la route prioritaire
  const typeMap = {
    'Hôtel': 'hotel',
    'Grand Surface': 'grand-surface',
    'Télé/Radio': 'media',
    'OCC': 'occ',
    'Bus': 'bus',
    'Night club': 'nightclub'
  };
  
  const typeParam = typeMap[usagerToDelete.type_usager] || usagerToDelete.type_usager;
  
  try {
    // Utiliser la route par type (prioritaire)
    const response = await fetch(
      `http://localhost:3001/api/usagers/${typeParam}/${usagerToDelete.id}`,
      {
        method: 'DELETE',
        headers: { 
          'adminToken': token, 
          'Content-Type': 'application/json' 
        }
      }
    );

    let data = null;
    try {
      data = await response.json();
    } catch (parseErr) {
      const text = await response.text();
      throw new Error(`Réponse serveur: ${text || `HTTP ${response.status}`}`);
    }

    if (!response.ok) {
      throw new Error(data?.message || `Erreur HTTP ${response.status}`);
    }

    if (data.success) {
      setSuccessMsg(`✅ Usager supprimé avec succès`);
      setShowDeleteModal(false);
      setUsagerToDelete(null);
      await fetchUsagers(token);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setDeleteError(data.message || 'Erreur inconnue');
    }
  } catch (error) {
    console.error('Erreur confirmDelete:', error);
    setDeleteError(error.message || 'Erreur lors de la suppression');
  }
};

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
        <button onClick={() => fetchUsagers(token)} className="retry-btn">🔄 Réessayer</button>
      </div>
    );
  }

  const isSuperAdmin = (currentUserRole || '').toString().trim().toLowerCase() === 'super_admin';

  return (
    <div className="gestion-crud-container">
      {successMsg && (
        <div className="success-banner">
          <span>✓</span> {successMsg}
        </div>
      )}

      {/* En-tête avec bouton retour */}
      <div className="gestion-header">
        <div className="gestion-header-left">
          <h2><FolderOpen size={24} /> Gestion des Usagers</h2>
          <p className="gestion-subtitle">
            {isSuperAdmin
              ? '👑 Super Admin - Vous pouvez modifier et supprimer tous les usagers'
              : '👤 Vous pouvez modifier les usagers mais seul le Super Admin peut supprimer'}
          </p>
        </div>
        <div className="gestion-header-right">
          {onBack && (
            <button className="btn-back-admin" onClick={onBack}>
              <ArrowLeft size={18} /> Retour à l'administration
            </button>
          )}
        </div>
      </div>

      {/* Statistiques */}
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

      {/* Barre de recherche */}
      <div className="search-filter-container">
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input-crud"
            placeholder="🔍 Rechercher par nom, demandeur, téléphone, email, région..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button className="clear-search" onClick={clearSearch}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filtres rapides */}
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

      {/* Tableau */}
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
                  <td><span className="type-badge">{usager.type_usager || '-'}</span></td>
                  <td><strong>{usager.denomination || 'N/A'}</strong></td>
                  <td>{usager.demandeur || 'N/A'}</td>
                  <td>{usager.region || '-'}</td>
                  <td>{usager.telephone || '-'}</td>
                  <td className="actions-cell">
                    <button className="btn-edit" onClick={() => handleEdit(usager)} title="Modifier">
                      <Edit size={16} /> Modifier
                    </button>
                    {isSuperAdmin && (
                      <button className="btn-delete" onClick={() => initiateDelete(usager)} title="Supprimer">
                        <Trash2 size={16} /> Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Modification */}
      {showEditModal && selectedUsager && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Edit size={20} /> Modifier {selectedUsager.denomination}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-row">
                <div className="form-group">
                  <label>Dénomination *</label>
                  <input type="text" value={editingData.denomination} onChange={(e) => setEditingData({...editingData, denomination: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Demandeur *</label>
                  <input type="text" value={editingData.demandeur} onChange={(e) => setEditingData({...editingData, demandeur: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input type="text" value={editingData.telephone} onChange={(e) => setEditingData({...editingData, telephone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={editingData.email} onChange={(e) => setEditingData({...editingData, email: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Région</label>
                  <select value={editingData.region || ''} onChange={(e) => setEditingData({...editingData, region: e.target.value})}>
                    <option value="">-- Sélectionner --</option>
                    {regions.map(r => <option key={r.id} value={r.nom}>{r.nom}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Adresse</label>
                  <input type="text" value={editingData.adresse || ''} onChange={(e) => setEditingData({...editingData, adresse: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Type d'usager</label>
                <select value={editingData.type_usager || selectedUsager.type_usager} onChange={(e) => setEditingData({...editingData, type_usager: e.target.value})}>
                  {usagerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">💾 Enregistrer</button>
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>❌ Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
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
              </div>
              <div className="delete-confirmation-info">
                <p className="delete-warning">⚠️ Cette action est irréversible !</p>
              </div>
              {/* NOUVEAU : affichage du message d'erreur réel si la suppression échoue */}
              {deleteError && (
                <p className="delete-warning" style={{ color: '#c0392b', fontWeight: 'bold' }}>
                  ❌ {deleteError}
                </p>
              )}
              <div className="delete-actions">
                <button className="btn-confirm-delete" onClick={confirmDelete}>🗑️ Confirmer</button>
                <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>❌ Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCrud;
