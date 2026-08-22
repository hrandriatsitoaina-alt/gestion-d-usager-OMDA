// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminPanel.css';
import GestionCrud from './gestion_crud';
import GestionRegionCrud from './gestion_region_crud'; // Import du nouveau composant
import {
  Users, FolderOpen, Activity, Settings, Bell,
  UserPlus, Edit, Trash2, CheckCircle, XCircle,
  Crown, BarChart, MapPin, Plus
} from 'lucide-react';

const AdminPanel = ({ onClose, adminToken: propToken, onLogout }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [usagers, setUsagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditSuperAdmin, setShowEditSuperAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [token, setToken] = useState(null);
  const [currentSuperAdmin, setCurrentSuperAdmin] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [superAdminData, setSuperAdminData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    confirm_mot_de_passe: ''
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUsagers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    admins: 0,
    superAdmins: 0,
    daf: 0
  });
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // États pour la Gestion des Usagers (intégrée)
  const [selectedType, setSelectedType] = useState('');
  const [filteredUsagers, setFilteredUsagers] = useState([]);
  const [selectedUsager, setSelectedUsager] = useState(null);
  const [showEditUsager, setShowEditUsager] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [usagerToDelete, setUsagerToDelete] = useState(null);
  const [editingUsagerData, setEditingUsagerData] = useState({
    denomination: '',
    demandeur: '',
    type_usager: '',
    adresse: '',
    telephone: '',
    email: '',
    region: ''
  });

  // Suppression des états liés aux régions (déplacés dans GestionRegionCrud)

  const usagerTypes = [
    'Hôtel', 'Grand Surface', 'Télé/Radio', 'OCC', 'Bus', 'Night club'
  ];

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    role: 'user',
    statut: 'actif'
  });

  // ----------------------------------------------
  // 1. CHARGEMENT INITIAL
  // ----------------------------------------------
  useEffect(() => {
    let currentToken = propToken;
    if (!currentToken) {
      currentToken = localStorage.getItem('adminToken');
    }
    if (!currentToken) {
      setError('Session expirée - Veuillez vous reconnecter');
      setLoading(false);
      return;
    }
    setToken(currentToken);
    fetchAllData(currentToken);
  }, [propToken]);

  const fetchAllData = async (currentToken) => {
    try {
      await Promise.all([
        fetchUsers(currentToken),
        fetchUsagers(currentToken),
        fetchSuperAdmin(currentToken),
        fetchActivities(currentToken),
        fetchNotifications(currentToken)
        // fetchRegions retiré
      ]);
    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------
  // 2. REQUÊTES API (sans fetchRegions)
  // ----------------------------------------------
  const fetchNotifications = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/notifications', {
        headers: { 'adminToken': currentToken }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) setNotifications(data.notifications || []);
        else setNotifications([]);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('fetchNotifications error:', error);
      setNotifications([]);
    }
  };

  const fetchSuperAdmin = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'adminToken': currentToken }
      });
      const data = await response.json();
      if (data.success) {
        const superAdmin = data.users.find(u => u.role === 'super_admin');
        if (superAdmin) {
          setCurrentSuperAdmin(superAdmin);
          setSuperAdminData({
            nom: superAdmin.nom,
            email: superAdmin.email,
            mot_de_passe: '',
            confirm_mot_de_passe: ''
          });
        }
      }
    } catch (error) {
      console.error('fetchSuperAdmin error:', error);
    }
  };

  const fetchUsers = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'adminToken': currentToken }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(data.users || []);
        const currentUser = data.users?.find(u => u.role === 'super_admin') || data.users?.[0];
        if (currentUser) {
          setCurrentUserId(currentUser.id);
        }
        const total = data.users?.length || 0;
        const active = data.users?.filter(u => u.statut === 'actif').length || 0;
        const inactive = data.users?.filter(u => u.statut === 'inactif').length || 0;
        const admins = data.users?.filter(u => u.role === 'admin').length || 0;
        const superAdmins = data.users?.filter(u => u.role === 'super_admin').length || 0;
        const daf = data.users?.filter(u => u.role === 'daf').length || 0;
        setStats({
          totalUsers: total,
          totalUsagers: stats.totalUsagers,
          activeUsers: active,
          inactiveUsers: inactive,
          admins: admins,
          superAdmins: superAdmins,
          daf: daf
        });
        setError(null);
      } else {
        setError(data.message || 'Erreur');
        if (response.status === 403) {
          localStorage.removeItem('adminToken');
          if (onLogout) onLogout();
        }
      }
    } catch (error) {
      console.error('fetchUsers error:', error);
      setError('Erreur de connexion');
    }
  };

  const fetchUsagers = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/usagers', {
        headers: { 'adminToken': currentToken }
      });
      const data = await response.json();
      let usagersData = [];
      if (Array.isArray(data)) {
        usagersData = data;
      } else if (data?.usagers) {
        usagersData = data.usagers;
      } else if (data?.data) {
        usagersData = data.data;
      } else {
        usagersData = Object.values(data).filter(item => item && item.id);
      }
      setUsagers(usagersData);
      setStats(prev => ({ ...prev, totalUsagers: usagersData.length }));
      if (selectedType) {
        handleTypeChange(selectedType);
      }
    } catch (error) {
      console.error('fetchUsagers error:', error);
      setUsagers([]);
    }
  };

  const fetchActivities = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/activities', {
        headers: { 'adminToken': currentToken }
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities || []);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('fetchActivities error:', error);
      setActivities([]);
    }
  };

  const logActivity = async (action, details) => {
    try {
      await fetch('http://localhost:3001/api/admin/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'adminToken': token
        },
        body: JSON.stringify({ action, details, user_id: currentUserId || 1 })
      });
      fetchActivities(token);
    } catch (error) {
      console.error('logActivity error:', error);
    }
  };

  // ----------------------------------------------
  // 4. GESTION DES UTILISATEURS (inchangée)
  // ----------------------------------------------
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.nom || !formData.email || !formData.mot_de_passe) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'adminToken': token },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg('Utilisateur ajouté');
        await logActivity('Ajout utilisateur', `Ajout de ${formData.nom}`);
        setFormData({ nom: '', email: '', mot_de_passe: '', role: 'user', statut: 'actif' });
        setShowAddForm(false);
        fetchUsers(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('Erreur: ' + (data.message || 'Impossible d\'ajouter l\'utilisateur'));
      }
    } catch (error) {
      console.error('handleAddUser error:', error);
      alert('Erreur de connexion');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        nom: editingUser.nom,
        email: editingUser.email,
        role: editingUser.role,
        statut: editingUser.statut
      };
      if (editingUser.mot_de_passe && editingUser.mot_de_passe.trim() !== '') {
        updateData.mot_de_passe = editingUser.mot_de_passe;
      }
      const response = await fetch(`http://localhost:3001/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'adminToken': token },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg('Utilisateur modifié');
        await logActivity('Modification utilisateur', `Modification de ${editingUser.nom}`);
        setEditingUser(null);
        fetchUsers(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('Erreur: ' + (data.message || 'Impossible de modifier l\'utilisateur'));
      }
    } catch (error) {
      console.error('handleEditUser error:', error);
      alert('Erreur de connexion');
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.role === 'super_admin') {
      alert('Vous ne pouvez pas modifier le statut du Super Admin');
      return;
    }
    const newStatus = user.statut === 'actif' ? 'inactif' : 'actif';
    const action = newStatus === 'actif' ? 'activer' : 'désactiver';
    if (!window.confirm(`Voulez-vous vraiment ${action} l'utilisateur "${user.nom}" ?`)) return;
    try {
      const updateData = {
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut: newStatus
      };
      const response = await fetch(`http://localhost:3001/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'adminToken': token },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`Utilisateur ${action}`);
        await logActivity('Modification statut', `${action} de ${user.nom}`);
        fetchUsers(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('Erreur: ' + (data.message || 'Impossible de modifier le statut'));
      }
    } catch (error) {
      console.error('handleToggleStatus error:', error);
      alert('Erreur de connexion');
    }
  };

  const handleDeleteUser = async (id, nom, role) => {
    if (role === 'super_admin') {
      alert('Impossible de supprimer le Super Admin');
      return;
    }
    if (!window.confirm(`⚠️ Supprimer définitivement "${nom}" ?`)) return;
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'adminToken': token }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`Utilisateur "${nom}" supprimé`);
        await logActivity('Suppression utilisateur', `Suppression de ${nom}`);
        fetchUsers(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('Erreur: ' + (data.message || 'Impossible de supprimer l\'utilisateur'));
      }
    } catch (error) {
      console.error('handleDeleteUser error:', error);
      alert('Erreur de connexion');
    }
  };

  const handleUpdateSuperAdmin = async (e) => {
    e.preventDefault();
    if (superAdminData.mot_de_passe !== superAdminData.confirm_mot_de_passe) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      const updateData = {
        nom: superAdminData.nom,
        email: superAdminData.email,
        role: 'super_admin',
        statut: 'actif'
      };
      if (superAdminData.mot_de_passe) {
        updateData.mot_de_passe = superAdminData.mot_de_passe;
      }
      const response = await fetch(`http://localhost:3001/api/admin/users/${currentSuperAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'adminToken': token },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg('Compte Super Admin modifié');
        await logActivity('Modification Super Admin', 'Modification du compte Super Admin');
        setShowEditSuperAdmin(false);
        setSuperAdminData({ ...superAdminData, mot_de_passe: '', confirm_mot_de_passe: '' });
        fetchUsers(token);
        fetchSuperAdmin(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('Erreur: ' + (data.message || 'Impossible de modifier le Super Admin'));
      }
    } catch (error) {
      console.error('handleUpdateSuperAdmin error:', error);
      alert('Erreur de connexion');
    }
  };

  // ----------------------------------------------
  // 5. GESTION DES USAGERS (intégrée)
  // ----------------------------------------------
  const handleTypeChange = (type) => {
    setSelectedType(type);
    const usagersArray = Array.isArray(usagers) ? usagers : [];
    if (type === 'tous') {
      setFilteredUsagers(usagersArray);
    } else if (type) {
      setFilteredUsagers(usagersArray.filter(u => u && u.type_usager === type));
    } else {
      setFilteredUsagers([]);
    }
    setSelectedUsager(null);
  };

  const handleEditUsager = (usager) => {
    if (!usager) return;
    setSelectedUsager(usager);
    setEditingUsagerData({
      denomination: usager.denomination || '',
      demandeur: usager.demandeur || '',
      type_usager: usager.type_usager || '',
      adresse: usager.adresse || '',
      telephone: usager.telephone || '',
      email: usager.email || '',
      region: usager.region || ''
    });
    setShowEditUsager(true);
  };

  const handleUpdateUsager = async (e) => {
    e.preventDefault();
    if (!selectedUsager) return;
    try {
      const response = await fetch(`http://localhost:3001/api/usagers/${selectedUsager.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'adminToken': token },
        body: JSON.stringify({
          ...editingUsagerData,
          type_usager: selectedUsager.type_usager
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg('Usager modifié');
        await logActivity('Modification usager', `Modification de ${selectedUsager.denomination}`);
        setShowEditUsager(false);
        setSelectedUsager(null);
        fetchUsagers(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('Erreur: ' + (data.message || 'Impossible de modifier l\'usager'));
      }
    } catch (error) {
      console.error('handleUpdateUsager error:', error);
      alert('Erreur de connexion');
    }
  };

  const confirmDeleteUsager = (usager) => {
    if (!usager) return;
    setUsagerToDelete(usager);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUsager = async () => {
    if (!usagerToDelete) return;
    try {
      const response = await fetch(`http://localhost:3001/api/usagers/${usagerToDelete.id}`, {
        method: 'DELETE',
        headers: { 'adminToken': token }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`Usager "${usagerToDelete.denomination}" supprimé`);
        await logActivity('Suppression usager', `Suppression de ${usagerToDelete.denomination}`);
        setShowDeleteConfirm(false);
        setUsagerToDelete(null);
        fetchUsagers(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('Erreur: ' + (data.message || 'Impossible de supprimer l\'usager'));
      }
    } catch (error) {
      console.error('handleDeleteUsager error:', error);
      alert('Erreur de connexion');
    }
  };

  // ----------------------------------------------
  // 6. RENDU
  // ----------------------------------------------
  const filteredUsers = users.filter(user =>
    user?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const roleMap = {
      'super_admin': { label: '⭐ Super Admin', className: 'role-super_admin' },
      'admin': { label: '👑 Admin', className: 'role-admin' },
      'daf': { label: '📊 DAF', className: 'role-daf' },
      'user': { label: '👤 Utilisateur', className: 'role-user' }
    };
    return roleMap[role] || roleMap['user'];
  };

  if (loading) return <div className="admin-loading"><div className="loading-spinner"></div><p>Chargement...</p></div>;
  if (error) return <div className="admin-loading"><p style={{ color: 'red' }}>{error}</p><button onClick={onClose} className="close-btn">Fermer</button></div>;

  return (
    <div className="admin-panel">
      {successMsg && <div className="success-message">✓ {successMsg}</div>}
      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="admin-header">
        <div className="header-content">
          <h1><Crown size={24} /> Administration OMDA</h1>
          <button className="close-btn" onClick={onClose}>✕ Fermer</button>
        </div>
      </div>

      <div className="stats-flex">
        <div className="stat-card"><div className="stat-value large-blue">{stats.totalUsers}</div><div className="stat-label">Utilisateurs</div></div>
        <div className="stat-card"><div className="stat-value">{stats.totalUsagers}</div><div className="stat-label">Dossiers</div></div>
        <div className="stat-card"><div className="stat-value">{stats.activeUsers}</div><div className="stat-label">Actifs</div></div>
        <div className="stat-card"><div className="stat-value">{stats.inactiveUsers}</div><div className="stat-label">Inactifs</div></div>
        <div className="stat-card"><div className="stat-value">{stats.admins}</div><div className="stat-label">Admins</div></div>
        <div className="stat-card"><div className="stat-value">{stats.daf}</div><div className="stat-label">DAF</div></div>
        <div className="stat-card"><div className="stat-value">{stats.superAdmins}</div><div className="stat-label">Super Admins</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} /> Utilisateurs
        </button>
        <button className={`tab ${activeTab === 'activities' ? 'active' : ''}`} onClick={() => setActiveTab('activities')}>
          <Activity size={16} /> Activités
        </button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={16} /> Paramètres
        </button>
        <button className={`tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
          <Bell size={16} /> Notifications
        </button>
        <button className={`tab ${activeTab === 'gestion' ? 'active' : ''}`} onClick={() => setActiveTab('gestion')}>
          <FolderOpen size={16} /> Gestion Usagers
        </button>
        {/* Nouvel onglet pour les régions */}
        <button className={`tab ${activeTab === 'regions' ? 'active' : ''}`} onClick={() => setActiveTab('regions')}>
          <MapPin size={16} /> Régions
        </button>
      </div>

      {/* ---- ONGLET UTILISATEURS ---- */}
      {activeTab === 'users' && (
        <div className="content">
          <div className="content-header">
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
            <button className="btn-add" onClick={() => setShowAddForm(true)}><UserPlus size={16} /> Ajouter</button>
          </div>
          <div className="table-wrapper">
            <table className="user-table">
              <thead><tr><th>ID</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.map(user => {
                  const roleInfo = getRoleBadge(user.role);
                  return (
                    <tr key={user.id} className={user.statut === 'inactif' ? 'inactive-row' : ''}>
                      <td>{user.id}</td>
                      <td>{user.nom}</td>
                      <td>{user.email}</td>
                      <td><span className={`role ${roleInfo.className}`}>{roleInfo.label}</span></td>
                      <td>
                        <span className={`status-badge status-${user.statut}`} onClick={() => handleToggleStatus(user)}>
                          {user.statut === 'actif' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {user.statut === 'actif' ? ' Actif' : ' Inactif'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="actions">
                        <button className="btn-edit" onClick={() => setEditingUser(user)}><Edit size={14} /></button>
                        <button className="btn-delete" onClick={() => handleDeleteUser(user.id, user.nom, user.role)} disabled={user.role === 'super_admin'}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- ONGLET ACTIVITÉS ---- */}
      {activeTab === 'activities' && (
        <div className="content">
          <h3><Activity size={18} /> Historique des activités</h3>
          {activities.length === 0 ? <p style={{ textAlign: 'center', color: '#78909c', padding: '30px' }}>Aucune activité enregistrée</p> : (
            <div className="table-wrapper">
              <table className="user-table">
                <thead><tr><th>Action</th><th>Détails</th><th>Utilisateur</th><th>Date</th></tr></thead>
                <tbody>
                  {activities.map(a => (
                    <tr key={a.id}>
                      <td><span className="activity-badge">{a.action}</span></td>
                      <td>{a.details}</td>
                      <td><strong>{a.user_nom}</strong></td>
                      <td>{new Date(a.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---- ONGLET PARAMÈTRES (sans la gestion des régions) ---- */}
      {activeTab === 'settings' && (
        <div className="content">
          <div className="settings-container">
            {/* Carte Super Admin */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Crown size={24} className="settings-icon" />
                <div>
                  <h3>Compte Super Administrateur</h3>
                  <p className="settings-subtitle">Modifiez vos informations</p>
                </div>
              </div>
              <div className="settings-card-content">
                <div className="settings-info-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '15px' }}>
                  <div className="info-item"><span className="info-label">👤 Nom :</span><span className="info-value">{currentSuperAdmin?.nom}</span></div>
                  <div className="info-item"><span className="info-label">📧 Email :</span><span className="info-value">{currentSuperAdmin?.email}</span></div>
                  <div className="info-item"><span className="info-label">⭐ Rôle :</span><span className="info-value badge-super">Super Admin</span></div>
                </div>
                <button className="settings-btn" onClick={() => setShowEditSuperAdmin(true)}><Edit size={14} /> Modifier</button>
              </div>
            </div>

            {/* Carte Statistiques */}
            <div className="settings-card">
              <div className="settings-card-header">
                <BarChart size={24} className="settings-icon" />
                <div>
                  <h3>Statistiques Générales</h3>
                  <p className="settings-subtitle">Aperçu de l'activité</p>
                </div>
              </div>
              <div className="settings-card-content">
                <div className="stats-grid">
                  <div className="stat-item"><span className="stat-number">{stats.totalUsers}</span><span className="stat-name">Utilisateurs</span></div>
                  <div className="stat-item"><span className="stat-number">{stats.totalUsagers}</span><span className="stat-name">Dossiers</span></div>
                  <div className="stat-item"><span className="stat-number">{stats.activeUsers}</span><span className="stat-name">Actifs</span></div>
                  <div className="stat-item"><span className="stat-number">{stats.inactiveUsers}</span><span className="stat-name">Inactifs</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- ONGLET NOTIFICATIONS ---- */}
      {activeTab === 'notifications' && (
        <div className="content">
          <h3><Bell size={18} /> Notifications</h3>
          {notifications.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#78909c', padding: '30px' }}>Aucune notification</p>
          ) : (
            <div className="table-wrapper">
              <table className="user-table">
                <thead><tr><th>Message</th><th>Type</th><th>Date</th></tr></thead>
                <tbody>
                  {notifications.map(n => (
                    <tr key={n.id}>
                      <td>{n.message}</td>
                      <td><span className={`badge-${n.type || 'info'}`}>{n.type || 'info'}</span></td>
                      <td>{new Date(n.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---- ONGLET GESTION USAGERS ---- */}
      {activeTab === 'gestion' && (
        <div className="content gestion-content">
          <GestionCrud onBack={() => setActiveTab('users')} />
        </div>
      )}

      {/* ---- ONGLET GESTION RÉGIONS ---- */}
      {activeTab === 'regions' && (
        <div className="content gestion-content">
          <GestionRegionCrud onBack={() => setActiveTab('users')} />
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS (utilisateurs, super admin, usagers) - inchangées */}
      {/* ============================================================ */}

      {/* Ajout utilisateur */}
      {showAddForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3><UserPlus size={20} /> Ajouter un utilisateur</h3>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="form-group"><label>Nom complet *</label><input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} required /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></div>
              <div className="form-group"><label>Mot de passe *</label><input type="password" maxLength="4" placeholder="4 chiffres" value={formData.mot_de_passe} onChange={(e) => setFormData({...formData, mot_de_passe: e.target.value})} required /><small>Le mot de passe doit contenir 4 chiffres</small></div>
              <div className="form-row">
                <div className="form-group"><label>Rôle</label><select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}><option value="user">👤 Utilisateur</option><option value="admin">👑 Administrateur</option><option value="daf">📊 DAF</option></select></div>
                <div className="form-group"><label>Statut</label><select value={formData.statut} onChange={(e) => setFormData({...formData, statut: e.target.value})}><option value="actif">🟢 Actif</option><option value="inactif">🔴 Inactif</option></select></div>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">✅ Ajouter</button>
                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>❌ Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Édition utilisateur */}
      {editingUser && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3><Edit size={20} /> Modifier {editingUser.nom}</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleEditUser}>
              <div className="form-group"><label>Nom complet</label><input type="text" value={editingUser.nom} onChange={(e) => setEditingUser({...editingUser, nom: e.target.value})} required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} required /></div>
              <div className="form-group"><label>Nouveau mot de passe</label><input type="password" maxLength="4" placeholder="4 chiffres - laisser vide" value={editingUser.mot_de_passe || ''} onChange={(e) => setEditingUser({...editingUser, mot_de_passe: e.target.value})} /><small>Le mot de passe doit contenir 4 chiffres</small></div>
              <div className="form-row">
                <div className="form-group"><label>Rôle</label><select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} disabled={editingUser.role === 'super_admin'}><option value="user">👤 Utilisateur</option><option value="admin">👑 Administrateur</option><option value="daf">📊 DAF</option></select></div>
                <div className="form-group"><label>Statut</label><select value={editingUser.statut} onChange={(e) => setEditingUser({...editingUser, statut: e.target.value})} disabled={editingUser.role === 'super_admin'}><option value="actif">🟢 Actif</option><option value="inactif">🔴 Inactif</option></select></div>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">💾 Enregistrer</button>
                <button type="button" className="btn-cancel" onClick={() => setEditingUser(null)}>❌ Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Édition Super Admin */}
      {showEditSuperAdmin && currentSuperAdmin && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3><Crown size={20} /> Modifier mon compte Super Admin</h3>
              <button className="modal-close" onClick={() => setShowEditSuperAdmin(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateSuperAdmin}>
              <div className="form-group"><label>Nom complet</label><input type="text" value={superAdminData.nom} onChange={(e) => setSuperAdminData({...superAdminData, nom: e.target.value})} required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={superAdminData.email} onChange={(e) => setSuperAdminData({...superAdminData, email: e.target.value})} required /></div>
              <div className="form-group"><label>Nouveau mot de passe</label><input type="password" maxLength="4" placeholder="4 chiffres" value={superAdminData.mot_de_passe} onChange={(e) => setSuperAdminData({...superAdminData, mot_de_passe: e.target.value})} /><small>Le mot de passe doit contenir 4 chiffres</small></div>
              <div className="form-group"><label>Confirmer le mot de passe</label><input type="password" maxLength="4" placeholder="4 chiffres" value={superAdminData.confirm_mot_de_passe} onChange={(e) => setSuperAdminData({...superAdminData, confirm_mot_de_passe: e.target.value})} /></div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">💾 Enregistrer</button>
                <button type="button" className="btn-cancel" onClick={() => setShowEditSuperAdmin(false)}>❌ Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- MODALS USAGERS (inchangées) ---- */}
      {showEditUsager && selectedUsager && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3><Edit size={20} /> Modifier {selectedUsager.denomination}</h3>
              <button className="modal-close" onClick={() => setShowEditUsager(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateUsager}>
              <div className="form-group"><label>Dénomination *</label><input type="text" value={editingUsagerData.denomination} onChange={(e) => setEditingUsagerData({...editingUsagerData, denomination: e.target.value})} required /></div>
              <div className="form-group"><label>Demandeur *</label><input type="text" value={editingUsagerData.demandeur} onChange={(e) => setEditingUsagerData({...editingUsagerData, demandeur: e.target.value})} required /></div>
              <div className="form-group"><label>Type d'usager *</label><select value={editingUsagerData.type_usager} onChange={(e) => setEditingUsagerData({...editingUsagerData, type_usager: e.target.value})} required><option value="">-- Sélectionner --</option>{usagerTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="form-group"><label>Région</label><input type="text" value={editingUsagerData.region || ''} onChange={(e) => setEditingUsagerData({...editingUsagerData, region: e.target.value})} placeholder="Ex: Analamanga" /></div>
              <div className="form-group"><label>Adresse</label><input type="text" value={editingUsagerData.adresse} onChange={(e) => setEditingUsagerData({...editingUsagerData, adresse: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Téléphone</label><input type="text" value={editingUsagerData.telephone} onChange={(e) => setEditingUsagerData({...editingUsagerData, telephone: e.target.value})} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={editingUsagerData.email} onChange={(e) => setEditingUsagerData({...editingUsagerData, email: e.target.value})} /></div>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">💾 Enregistrer</button>
                <button type="button" className="btn-cancel" onClick={() => setShowEditUsager(false)}>❌ Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && usagerToDelete && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>⚠️ Confirmer la suppression</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div style={{ padding: '20px 0' }}>
              <p style={{ fontSize: '16px', marginBottom: '10px' }}>Voulez-vous vraiment supprimer l'usager :</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#c62828' }}>"{usagerToDelete.denomination}"</p>
              <p style={{ fontSize: '14px', color: '#78909c', marginTop: '10px' }}>Type: {usagerToDelete.type_usager}<br />Demandeur: {usagerToDelete.demandeur}</p>
              <p style={{ fontSize: '14px', color: '#c62828', marginTop: '10px', fontWeight: 'bold' }}>⚠️ Cette action est irréversible !</p>
            </div>
            <div className="modal-buttons">
              <button className="btn-save" onClick={handleDeleteUsager}>✅ Confirmer</button>
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>❌ Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;