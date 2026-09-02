import React, { useState, useEffect } from 'react';
import '../styles/gestion_crud.css';
import { Edit, Trash2, ArrowLeft, Plus, MapPin } from 'lucide-react';

const GestionRegionCrud = ({ onBack }) => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [token, setToken] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRegion, setNewRegion] = useState({ nom: '', telephone: '' });

  const [editingRegion, setEditingRegion] = useState(null);
  const [editData, setEditData] = useState({ nom: '', telephone: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [regionToDelete, setRegionToDelete] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
      fetchCurrentUserRole(storedToken);
      fetchRegions(storedToken);
    } else {
      setError('Token d\'administration manquant. Veuillez vous reconnecter.');
      setLoading(false);
    }
  }, []);

  const fetchCurrentUserRole = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/current-user', {
        headers: { 'Authorization': `Bearer ${currentToken}`, 'adminToken': currentToken }
      });
      const data = await response.json();
      if (data.success && data.user) {
        setCurrentUserRole(data.user.role || 'user');
      } else {
        setCurrentUserRole('user');
      }
    } catch (error) {
      console.error('Erreur fetchCurrentUserRole:', error);
      setCurrentUserRole('user');
    }
  };

  const fetchRegions = async (currentToken) => {
    setLoading(true);
    setError(null);
    try {
      const headers = currentToken ? { 'adminToken': currentToken } : {};
      const response = await fetch('http://localhost:3001/api/regions', { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setRegions(data.regions || []);
      } else {
        setError(data.message || 'Erreur lors du chargement des régions');
        setRegions([]);
      }
    } catch (error) {
      console.error('fetchRegions error:', error);
      setError(error.message || 'Erreur de connexion');
      setRegions([]);
    } finally {
      setLoading(false);
    }
  };

  // AJOUT
  const handleAddRegion = async (e) => {
    e.preventDefault();
    const trimmedNom = newRegion.nom.trim();
    if (!trimmedNom) {
      setError('Le nom de la région est obligatoire.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!token) {
      setError('Token manquant, veuillez vous reconnecter.');
      return;
    }
    try {
      console.log('📤 Envoi POST /regions avec token:', token);
      const response = await fetch('http://localhost:3001/api/regions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'adminToken': token
        },
        body: JSON.stringify({
          nom: trimmedNom,
          telephone: newRegion.telephone.trim() || null
        })
      });
      const data = await response.json();
      console.log('📥 Réponse POST:', data);
      if (response.ok && data.success) {
        setSuccessMsg(`✅ Région "${trimmedNom}" ajoutée avec succès`);
        setShowAddModal(false);
        setNewRegion({ nom: '', telephone: '' });
        await fetchRegions(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.message || 'Erreur lors de l\'ajout');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('handleAddRegion error:', error);
      setError('Erreur de connexion : ' + error.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  // ÉDITION
  const handleEditClick = (region) => {
    setEditingRegion(region);
    setEditData({
      nom: region.nom || '',
      telephone: region.telephone || ''
    });
  };

  const handleUpdateRegion = async (e) => {
    e.preventDefault();
    const trimmedNom = editData.nom.trim();
    if (!trimmedNom) {
      setError('Le nom de la région est obligatoire.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!token) {
      setError('Token manquant');
      return;
    }
    try {
      console.log(`📤 Envoi PUT /regions/${editingRegion.id}`);
      const response = await fetch(`http://localhost:3001/api/regions/${editingRegion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'adminToken': token
        },
        body: JSON.stringify({
          nom: trimmedNom,
          telephone: editData.telephone.trim() || null
        })
      });
      const data = await response.json();
      console.log('📥 Réponse PUT:', data);
      if (response.ok && data.success) {
        setSuccessMsg(`✅ Région "${trimmedNom}" mise à jour`);
        setEditingRegion(null);
        setEditData({ nom: '', telephone: '' });
        await fetchRegions(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.message || 'Erreur lors de la mise à jour');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('handleUpdateRegion error:', error);
      setError('Erreur de connexion : ' + error.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  // SUPPRESSION
  const confirmDelete = (region) => {
    console.log('confirmDelete appelé avec :', region);
    if (currentUserRole !== 'super_admin') {
      setError('⚠️ Seul le Super Admin peut supprimer des régions.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setRegionToDelete(region);
    setShowDeleteModal(true);
  };

  const handleDeleteRegion = async () => {
    console.log('🔥 handleDeleteRegion appelée');
    console.log('regionToDelete :', regionToDelete);
    console.log('token :', token);

    if (!regionToDelete) {
      console.warn('regionToDelete est null');
      setError('Aucune région sélectionnée');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!token) {
      console.warn('token manquant');
      setError('Token manquant, veuillez vous reconnecter');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      console.log(`📤 Envoi DELETE /regions/${regionToDelete.id}`);
      const response = await fetch(`http://localhost:3001/api/regions/${regionToDelete.id}`, {
        method: 'DELETE',
        headers: { 'adminToken': token }
      });
      const data = await response.json();
      console.log('📥 Réponse DELETE:', data);
      if (response.ok && data.success) {
        setSuccessMsg(`✅ Région "${regionToDelete.nom}" supprimée`);
        setShowDeleteModal(false);
        setRegionToDelete(null);
        await fetchRegions(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.message || 'Erreur lors de la suppression');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('❌ handleDeleteRegion error:', error);
      setError('Erreur de connexion : ' + error.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0,3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0,3)} ${cleaned.slice(3,5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0,3)} ${cleaned.slice(3,5)} ${cleaned.slice(5,8)} ${cleaned.slice(8,10)}`;
  };

  if (loading) {
    return (
      <div className="gestion-crud-loading">
        <div className="spinner"></div>
        <p>Chargement des régions...</p>
      </div>
    );
  }

  if (error && !successMsg) {
    return (
      <div className="gestion-crud-error">
        <p>❌ {error}</p>
        <button onClick={() => fetchRegions(token)} className="retry-btn">🔄 Réessayer</button>
      </div>
    );
  }

  return (
    <div className="gestion-crud-container">
      {successMsg && (
        <div className="success-banner">
          <span>✓</span> {successMsg}
        </div>
      )}
      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="gestion-header">
        <div className="gestion-header-left">
          <h2><MapPin size={24} /> Gestion des Régions</h2>
          <p className="gestion-subtitle">
            {currentUserRole === 'super_admin'
              ? '👑 Super Admin - Vous pouvez ajouter, modifier et supprimer les régions'
              : '👤 Vous pouvez consulter, ajouter et modifier les régions (suppression réservée au Super Admin)'}
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

      <div className="search-filter-container" style={{ justifyContent: 'space-between' }}>
        <div></div>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Ajouter une région
        </button>
      </div>

      <div className="table-wrapper">
        <table className="usager-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {regions.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">📭 Aucune région enregistrée</td>
              </tr>
            ) : (
              regions.map(region => (
                <tr key={region.id}>
                  <td>{region.id}</td>
                  <td><strong>{region.nom}</strong></td>
                  <td>{formatPhone(region.telephone) || '—'}</td>
                  <td className="actions-cell">
                    <button className="btn-edit" onClick={() => handleEditClick(region)} title="Modifier">
                      <Edit size={16} /> Modifier
                    </button>
                    {currentUserRole === 'super_admin' && (
                      <button className="btn-delete" onClick={() => confirmDelete(region)} title="Supprimer">
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

      {/* Modal Ajout */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Plus size={20} /> Ajouter une région</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddRegion}>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={newRegion.nom}
                  onChange={(e) => setNewRegion({...newRegion, nom: e.target.value})}
                  placeholder="Ex: Analamanga"
                  required
                />
              </div>
              <div className="form-group">
                <label>Téléphone (optionnel)</label>
                <input
                  type="text"
                  value={newRegion.telephone}
                  onChange={(e) => setNewRegion({...newRegion, telephone: e.target.value})}
                  placeholder="Ex: 0341234567"
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">✅ Ajouter</button>
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>❌ Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Édition */}
      {editingRegion && (
        <div className="modal-overlay" onClick={() => setEditingRegion(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Edit size={20} /> Modifier la région</h3>
              <button className="modal-close" onClick={() => setEditingRegion(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateRegion}>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={editData.nom}
                  onChange={(e) => setEditData({...editData, nom: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="text"
                  value={editData.telephone}
                  onChange={(e) => setEditData({...editData, telephone: e.target.value})}
                  placeholder="Ex: 0341234567"
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">💾 Enregistrer</button>
                <button type="button" className="btn-cancel" onClick={() => setEditingRegion(null)}>❌ Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && regionToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirmation de suppression</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="delete-info">
                <p><strong>👑 Super Admin</strong></p>
                <p><strong>Région :</strong> {regionToDelete.nom}</p>
                <p><strong>Téléphone :</strong> {formatPhone(regionToDelete.telephone) || '—'}</p>
              </div>
              <div className="delete-confirmation-info">
                <p className="delete-warning">⚠️ Cette action est irréversible !</p>
              </div>
              <div className="delete-actions">
                <button className="btn-confirm-delete" onClick={handleDeleteRegion}>🗑️ Confirmer</button>
                <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>❌ Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionRegionCrud;