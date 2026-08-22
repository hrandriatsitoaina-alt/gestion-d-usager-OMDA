import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Key, Calendar, FileText, 
  Building, Users, Bus, Radio, Coffee, Music, 
  ArrowLeft, Edit2, Save, X, CheckCircle,
  UserCircle, Clock, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profil.css';

const Profil = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    confirm_mot_de_passe: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [stats, setStats] = useState({
    totalDossiers: 0,
    dossiers: {}
  });

  const usagerTypes = {
    'Hôtel': { icon: Building, color: '#4CAF50' },
    'Grand Surface': { icon: Users, color: '#2196F3' },
    'Télé/Radio': { icon: Radio, color: '#9C27B0' },
    'OCC': { icon: Coffee, color: '#FF9800' },
    'Bus': { icon: Bus, color: '#F44336' },
    'Night club': { icon: Music, color: '#E91E63' }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      let userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      if (!userId) {
        try {
          const currentUserRes = await axios.get('http://localhost:3001/api/auth/current-user');
          if (currentUserRes.data.success) {
            const user = currentUserRes.data.user;
            userId = user.id;
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', user.nom);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userRole', user.role);
          }
        } catch (err) {
          console.error('Erreur current-user:', err);
        }
      }

      if (!userId) {
        setMessage({ text: 'Utilisateur non identifié. Veuillez vous reconnecter.', type: 'error' });
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:3001/api/profile/${userId}`);
      console.log('📦 Profil reçu:', response.data);
      
      if (response.data.success) {
        const user = response.data.user;
        setUserData(user);
        setFormData({
          nom: user.nom || '',
          email: user.email || '',
          mot_de_passe: '',
          confirm_mot_de_passe: ''
        });
        setStats({
          totalDossiers: user.totalDossiers || 0,
          dossiers: user.dossiers || {}
        });
      } else {
        setMessage({ text: response.data.message || 'Erreur lors du chargement', type: 'error' });
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Erreur lors du chargement du profil', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (formData.mot_de_passe && formData.mot_de_passe !== formData.confirm_mot_de_passe) {
      setMessage({ text: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }

    if (formData.mot_de_passe && formData.mot_de_passe.length < 4) {
      setMessage({ text: 'Le mot de passe doit contenir au moins 4 caractères', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!userId) {
        setMessage({ text: 'Utilisateur non identifié', type: 'error' });
        setSaving(false);
        return;
      }

      const updateData = {
        nom: formData.nom,
        email: formData.email
      };
      
      if (formData.mot_de_passe) {
        updateData.mot_de_passe = formData.mot_de_passe;
      }

      const response = await axios.put(`http://localhost:3001/api/profile/${userId}`, updateData);
      
      if (response.data.success) {
        setMessage({ text: 'Profil mis à jour avec succès !', type: 'success' });
        setEditMode(false);
        const updatedUser = response.data.user;
        setUserData(prev => ({
          ...prev,
          nom: updatedUser.nom,
          email: updatedUser.email
        }));
        localStorage.setItem('userName', updatedUser.nom);
        localStorage.setItem('userEmail', updatedUser.email);
        setFormData(prev => ({
          ...prev,
          mot_de_passe: '',
          confirm_mot_de_passe: ''
        }));
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Erreur lors de la mise à jour', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      nom: userData?.nom || '',
      email: userData?.email || '',
      mot_de_passe: '',
      confirm_mot_de_passe: ''
    });
    setMessage({ text: '', type: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role) => {
    const roles = {
      'super_admin': 'Super Administrateur',
      'admin': 'Administrateur',
      'daf': 'Directeur Administratif et Financier',
      'user': 'Utilisateur'
    };
    return roles[role] || role;
  };

  const getStatusBadge = (statut) => {
    const statusMap = {
      'actif': { label: 'Actif', class: 'status-active' },
      'inactif': { label: 'Inactif', class: 'status-inactive' },
      'suspendu': { label: 'Suspendu', class: 'status-suspended' }
    };
    return statusMap[statut] || { label: statut, class: 'status-default' };
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            <ArrowLeft size={20} /> Retour
          </button>
          <h1>Mon Profil</h1>
        </div>
        <div className="profile-message error">
          <X size={20} />
          <span>{message.text || 'Impossible de charger le profil'}</span>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <button onClick={() => navigate('/')} className="btn-edit">
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusBadge(userData.statut);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <ArrowLeft size={20} /> Retour
        </button>
        <h1>Mon Profil</h1>
        {!editMode && (
          <button onClick={() => setEditMode(true)} className="btn-edit">
            <Edit2 size={18} /> Modifier
          </button>
        )}
      </div>

      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="profile-content">
        <div className="profile-card profile-avatar-card">
          <div className="avatar-container">
            <div className="avatar-circle">
              <UserCircle size={80} />
              <span className="avatar-prefix">{userData.prefix || userData.nom?.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="avatar-status">
              <span className={`status-badge ${statusInfo.class}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          <div className="avatar-info">
            <h2>{userData.nom}</h2>
            <p className="user-email">{userData.email}</p>
            <p className="user-role">
              <Award size={16} />
              {getRoleLabel(userData.role)}
            </p>
          </div>
        </div>

        <div className="profile-card">
          <h3 className="card-title">
            <User size={20} />
            Informations personnelles
          </h3>
          <div className="card-content">
            <div className="info-row">
              <label>Nom complet</label>
              {editMode ? (
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Votre nom"
                />
              ) : (
                <p className="info-value">{userData.nom}</p>
              )}
            </div>

            <div className="info-row">
              <label>Adresse email</label>
              {editMode ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Votre email"
                />
              ) : (
                <p className="info-value"><Mail size={16} /> {userData.email}</p>
              )}
            </div>

            <div className="info-row">
              <label>Rôle</label>
              <p className="info-value role-badge">{getRoleLabel(userData.role)}</p>
            </div>

            <div className="info-row">
              <label>Statut</label>
              <p className="info-value">
                <span className={`status-badge ${statusInfo.class}`}>
                  {statusInfo.label}
                </span>
              </p>
            </div>
          </div>
        </div>

        {editMode && (
          <div className="profile-card">
            <h3 className="card-title">
              <Key size={20} />
              Changer le mot de passe
            </h3>
            <div className="card-content">
              <div className="info-row">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  name="mot_de_passe"
                  value={formData.mot_de_passe}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Minimum 4 caractères"
                />
              </div>
              <div className="info-row">
                <label>Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="confirm_mot_de_passe"
                  value={formData.confirm_mot_de_passe}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Confirmer le mot de passe"
                />
              </div>
              <p className="password-hint">
                * Laissez vide pour conserver le mot de passe actuel
              </p>
            </div>

            <div className="edit-actions">
              <button onClick={handleCancel} className="btn-cancel" disabled={saving}>
                <X size={18} /> Annuler
              </button>
              <button onClick={handleSave} className="btn-save" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-small"></span> Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="profile-card stats-card">
          <h3 className="card-title">
            <FileText size={20} />
            Statistiques des dossiers ({new Date().getFullYear()})
          </h3>
          <div className="stats-grid">
            {Object.entries(usagerTypes).map(([type, { icon: Icon, color }]) => (
              <div key={type} className="stat-item" style={{ borderColor: color }}>
                <div className="stat-icon" style={{ backgroundColor: color + '20', color: color }}>
                  <Icon size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">{type}</span>
                  <span className="stat-value">{stats.dossiers[type] || 0}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="stat-total">
            <div className="total-label">Total des dossiers</div>
            <div className="total-value">{stats.totalDossiers}</div>
          </div>
        </div>

        <div className="profile-card">
          <h3 className="card-title">
            <Calendar size={20} />
            Informations du compte
          </h3>
          <div className="card-content account-info">
            <div className="info-row">
              <label>Date de création</label>
              <p className="info-value">
                <Calendar size={16} /> {formatDate(userData.created_at)}
              </p>
            </div>
            <div className="info-row">
              <label>Dernière connexion</label>
              <p className="info-value">
                <Clock size={16} /> {formatDate(userData.derniere_connexion)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;