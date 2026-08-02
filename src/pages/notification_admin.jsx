import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/notification_admin.css';
import MiniSidebar from '../components/MiniSidebar';

const NotificationAdmin = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [allUsagers, setAllUsagers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    nonLues: 0,
    modifications: 0,
    suppressions: 0,
    demandes: 0
  });

  useEffect(() => {
    let storedToken = localStorage.getItem('adminToken');
    console.log('🔑 Token récupéré:', storedToken || 'Absent');
    
    if (!storedToken) {
      storedToken = 'super_admin_secret_2026';
      localStorage.setItem('adminToken', storedToken);
      console.log('✅ Token par défaut créé');
    }
    
    setToken(storedToken);
    fetchAllUsagers(storedToken);
    fetchNotifications(storedToken);
  }, []);

  const fetchAllUsagers = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/usagers', {
        headers: { 
          'adminToken': currentToken,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllUsagers(data);
        console.log('✅ Usagers chargés:', data.length);
      }
    } catch (error) {
      console.error('Erreur fetch usagers:', error);
    }
  };

  const fetchNotifications = async (currentToken) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Récupération des notifications avec token:', currentToken);
      
      const response = await fetch('http://localhost:3001/api/notifications', {
        method: 'GET',
        headers: { 
          'adminToken': currentToken,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Statut réponse:', response.status);
      
      let data;
      if (response.status === 403) {
        console.log('⚠️ Token invalide, essai sans token...');
        const retryResponse = await fetch('http://localhost:3001/api/notifications', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json'
          }
        });
        data = await retryResponse.json();
      } else {
        data = await response.json();
      }
      
      console.log('📋 Notifications reçues:', data);
      
      if (data.success) {
        const notifs = data.notifications || [];
        setNotifications(notifs);
        
        setStats({
          total: notifs.length,
          nonLues: notifs.filter(n => !n.read).length,
          modifications: notifs.filter(n => n.type === 'update').length,
          suppressions: notifs.filter(n => n.type === 'delete_completed').length,
          demandes: notifs.filter(n => n.type === 'delete_request').length
        });
        
        setError(null);
      } else {
        console.error('❌ Erreur API:', data);
        setError(data.message || 'Erreur de chargement');
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Erreur fetchNotifications:', error);
      setError('Erreur de connexion au serveur');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getUsagerDetails = (usagerId) => {
    if (!usagerId) return null;
    return allUsagers.find(u => u.id === parseInt(usagerId));
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 
          'adminToken': token || 'super_admin_secret_2026',
          'Content-Type': 'application/json'
        }
      });
      fetchNotifications(token);
    } catch (error) {
      console.error('❌ Erreur markAsRead:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    for (const notif of unreadNotifs) {
      await markAsRead(notif.id);
    }
    fetchNotifications(token);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'delete_request': return '🗑️';
      case 'delete_completed': return '🗑️';
      case 'delete_rejected': return '❌';
      case 'update': return '✏️';
      default: return '📨';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'delete_request': return 'Demande de suppression';
      case 'delete_completed': return 'Suppression effectuée';
      case 'delete_rejected': return 'Rejetée';
      case 'update': return 'Modification';
      default: return 'Information';
    }
  };

  const getTypeClass = (type) => {
    switch(type) {
      case 'delete_request': return 'badge-warning';
      case 'delete_completed': return 'badge-danger';
      case 'delete_rejected': return 'badge-secondary';
      case 'update': return 'badge-primary';
      default: return 'badge-info';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'OCC': return '#f59e0b';
      case 'Grand Surface': return '#10b981';
      case 'Bus': return '#3b82f6';
      case 'Night club': return '#8b5cf6';
      case 'Télé/Radio': return '#ec4899';
      case 'Hôtel': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'OCC': return '🎭';
      case 'Grand Surface': return '🏪';
      case 'Bus': return '🚌';
      case 'Night club': return '🎵';
      case 'Télé/Radio': return '📺';
      case 'Hôtel': return '🏨';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <>
        <MiniSidebar />
        <main className="notification-admin-container">
          <div className="notification-admin-loading">
            <div className="spinner"></div>
            <p>Chargement des notifications...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <MiniSidebar />
      <main className="notification-admin-container">
        <div className="notification-admin-header">
          <div className="header-left">
            <h1>🔔 Centre de Notifications</h1>
            <p>Historique des modifications et suppressions</p>
          </div>
          <div className="header-right">
            <button className="btn-back-dashboard" onClick={() => navigate('/dashboard')}>
              ← Retour au Dashboard
            </button>
          </div>
        </div>

        {/* STATISTIQUES */}
        <div className="notification-admin-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card stat-unread">
            <div className="stat-number">{stats.nonLues}</div>
            <div className="stat-label">Non lues</div>
          </div>
          <div className="stat-card stat-update">
            <div className="stat-number">{stats.modifications}</div>
            <div className="stat-label">Modifications</div>
          </div>
          <div className="stat-card stat-delete">
            <div className="stat-number">{stats.suppressions}</div>
            <div className="stat-label">Suppressions</div>
          </div>
          <div className="stat-card stat-request">
            <div className="stat-number">{stats.demandes}</div>
            <div className="stat-label">Demandes</div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="notification-admin-actions">
          {stats.nonLues > 0 && (
            <button className="btn-mark-all" onClick={markAllAsRead}>
              ✅ Tout marquer comme lu
            </button>
          )}
          <button className="btn-refresh" onClick={() => fetchNotifications(token || 'super_admin_secret_2026')}>
            🔄 Rafraîchir
          </button>
        </div>

        {/* LISTE DES NOTIFICATIONS */}
        {error ? (
          <div className="notification-admin-error">
            <p>❌ {error}</p>
            <button className="btn-retry" onClick={() => fetchNotifications(token || 'super_admin_secret_2026')}>
              Réessayer
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-admin-empty">
            <span className="empty-icon">📭</span>
            <p>Aucune notification</p>
            <small>Les modifications et suppressions apparaitront ici</small>
          </div>
        ) : (
          <div className="notification-admin-list">
            {notifications.map(notif => {
              const usager = getUsagerDetails(notif.usager_id);
              return (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="notif-icon">{getIcon(notif.type)}</div>
                  <div className="notif-content">
                    <div className="notif-title">{notif.message}</div>
                    <div className="notif-meta">
                      <span className={`badge ${getTypeClass(notif.type)}`}>
                        {getTypeLabel(notif.type)}
                      </span>
                      <span className="notif-date">
                        📅 {formatDate(notif.created_at)}
                      </span>
                    </div>
                    
                    {/* DÉTAILS COMPLETS DE L'USAGER */}
                    {usager && (
                      <div className="usager-details-card">
                        <div className="usager-header-info">
                          <span className="usager-type-icon">{getTypeIcon(usager.type_usager)}</span>
                          <span className="usager-type-name">{usager.type_usager}</span>
                          <span className="usager-id">ID: #{usager.id}</span>
                        </div>
                        <div className="usager-details-grid">
                          <div className="usager-detail-item">
                            <span className="detail-label">🏢 Dénomination:</span>
                            <span className="detail-value">{usager.denomination || 'N/A'}</span>
                          </div>
                          <div className="usager-detail-item">
                            <span className="detail-label">👤 Demandeur:</span>
                            <span className="detail-value">{usager.demandeur || 'N/A'}</span>
                          </div>
                          <div className="usager-detail-item">
                            <span className="detail-label">📞 Téléphone:</span>
                            <span className="detail-value">{usager.telephone || 'N/A'}</span>
                          </div>
                          <div className="usager-detail-item">
                            <span className="detail-label">📧 Email:</span>
                            <span className="detail-value">{usager.email || 'N/A'}</span>
                          </div>
                          <div className="usager-detail-item">
                            <span className="detail-label">📍 Région:</span>
                            <span className="detail-value">{usager.region || 'N/A'}</span>
                          </div>
                          <div className="usager-detail-item">
                            <span className="detail-label">🏠 Adresse:</span>
                            <span className="detail-value">{usager.adresse || usager.adresse_siege || 'N/A'}</span>
                          </div>
                          {usager.frais_dossier > 0 && (
                            <div className="usager-detail-item">
                              <span className="detail-label">💰 Frais dossier:</span>
                              <span className="detail-value">{usager.frais_dossier.toLocaleString()} Ar</span>
                            </div>
                          )}
                          {usager.montant_mensuel > 0 && (
                            <div className="usager-detail-item">
                              <span className="detail-label">📊 Montant mensuel:</span>
                              <span className="detail-value">{usager.montant_mensuel.toLocaleString()} Ar</span>
                            </div>
                          )}
                          {usager.soit_total > 0 && (
                            <div className="usager-detail-item">
                              <span className="detail-label">📈 Soit total:</span>
                              <span className="detail-value">{usager.soit_total.toLocaleString()} Ar</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!notif.read && <div className="notif-unread-dot"></div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
};

export default NotificationAdmin;