import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, BookOpen, Phone, Keyboard, Bell, Settings,
  Copyright
} from 'lucide-react';
import '../styles/aide.css';

const MiniSidebar = () => {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [showDocPopup, setShowDocPopup] = useState(false);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showRaccourcisPopup, setShowRaccourcisPopup] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showParamsPopup, setShowParamsPopup] = useState(false);

  // ============================================
  // GESTION DES NOTIFICATIONS
  // ============================================
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let storedToken = localStorage.getItem('adminToken');
    console.log('🔑 Token dans MiniSidebar:', storedToken || 'Absent');
    
    if (!storedToken) {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          storedToken = 'user_' + userData.id + '_' + Date.now();
          localStorage.setItem('adminToken', storedToken);
          console.log('✅ Token créé à partir du user:', storedToken);
        } catch (e) {
          console.error('❌ Erreur création token:', e);
        }
      }
    }
    
    if (!storedToken) {
      storedToken = 'temp_' + Date.now();
      localStorage.setItem('adminToken', storedToken);
      console.log('⚠️ Token temporaire créé:', storedToken);
    }
    
    setToken(storedToken);
    fetchNotifications(storedToken);
    
    const interval = setInterval(() => {
      if (token) {
        fetchNotifications(token);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (currentToken) => {
    if (!currentToken) {
      console.error('❌ Pas de token disponible');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Récupération des notifications...');
      
      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: { 
          'adminToken': currentToken || 'super_admin_secret_2026',
          'Content-Type': 'application/json'
        }
      });

      let data;
      if (response.status === 403) {
        console.log('⚠️ Token invalide, essai sans token...');
        const retryResponse = await fetch('http://localhost:3001/api/notifications');
        data = await retryResponse.json();
      } else {
        data = await response.json();
      }
      
      console.log('📋 Notifications reçues:', data);
      
      if (data.success) {
        const notifs = data.notifications || [];
        setNotifications(notifs);
        const unread = notifs.filter(n => !n.read).length || 0;
        setUnreadCount(unread);
        console.log(`🔔 ${unread} notification(s) non lue(s) sur ${notifs.length} total`);
        setError(null);
      } else {
        console.error('❌ Erreur API:', data);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Erreur fetchNotifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FIN GESTION NOTIFICATIONS
  // ============================================

  const pages = [
    { name: 'Ajout d\'usager', path: '/ajout-usager', description: 'Enregistrer un nouvel usager', details: 'Nom, prenom, contact, categorie…' },
    { name: 'Verification usager', path: '/verification-usager', description: 'Rechercher un usager existant', details: 'Par identifiant ou nom, modifier ses infos.' },
    { name: 'Ajout d\'evenement', path: '/ajout-evenement', description: 'Creer un evenement culturel', details: 'Titre, date, lieu, tarif, lie a un usager.' },
    { name: 'Choix de paiement', path: '/choix-payement', description: 'Selectionner le mode de paiement', details: 'Especes, carte, virement, cheque.' },
    { name: 'Tableau de bord global', path: '/tableau-db', description: 'Visualisation des donnees', details: 'Tableaux croises, filtres par periode/categorie.' },
    { name: 'Facturation occasionnelle', path: '/date_occ', description: 'Factures des usagers occasionnels', details: 'Detail et echeances.' },
    { name: 'Facturation grande surface', path: '/date-grandsurface', description: 'Factures des grandes surfaces', details: 'Taux specifiques, releves mensuels.' },
    { name: 'Facturation transport', path: '/date-bus', description: 'Factures des societes de transport', details: 'Calcul base sur le nombre de vehicules.' },
    { name: 'Facturation night club', path: '/night-club', description: 'Factures des etablissements nocturnes', details: 'Tarifs selon jauge et heures.' },
    { name: 'Autre usager', path: '/autre-usager', description: 'Factures autres categories', details: 'Parametres personnalisables.' },
    { name: 'Facture usager', path: '/facture-usager', description: 'Liste complete des factures', details: 'Statistiques (payee/retard), tableau mensuel, export PDF/Excel.' }
  ];

  const openTutorial = () => {
    setShowTutorial(true);
    setCurrentStep(0);
  };
  
  const closeTutorial = () => setShowTutorial(false);
  const nextStep = () => currentStep < pages.length - 1 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 0 && setCurrentStep(currentStep - 1);
  
  const goToPage = () => {
    navigate(pages[currentStep].path);
    closeTutorial();
  };

  const handleIconClick = (action) => {
    setShowDocPopup(false);
    setShowSupportPopup(false);
    setShowRaccourcisPopup(false);
    setShowNotifPopup(false);
    setShowParamsPopup(false);
    
    switch(action) {
      case 'aide':
        openTutorial();
        break;
      case 'doc':
        setShowDocPopup(true);
        break;
      case 'support':
        setShowSupportPopup(true);
        break;
      case 'raccourcis':
        setShowRaccourcisPopup(true);
        break;
      case 'notif':
        navigate('/notification_admin');
        break;
      case 'params':
        setShowParamsPopup(true);
        break;
      default:
        break;
    }
  };

  const closeAllPopups = () => {
    setShowDocPopup(false);
    setShowSupportPopup(false);
    setShowRaccourcisPopup(false);
    setShowNotifPopup(false);
    setShowParamsPopup(false);
  };

  return (
    <>
      <nav className="sidebars">
        <div className="sidebar-minimal">
          <div className="minimal-dot"></div>
          <div className="minimal-dot"></div>
          <div className="minimal-dot"></div>
        </div>
        <div className="sidebar-expanded">
          <div className="sidebar-content">
            <div className="sidebar-icon-group">
              <div className="sidebar-icon" title="Aide" onClick={() => handleIconClick('aide')}>
                <HelpCircle size={22} strokeWidth={2} color="white" />
              </div>
              <div className="sidebar-icon" title="Documentation" onClick={() => handleIconClick('doc')}>
                <BookOpen size={22} strokeWidth={2} color="white" />
              </div>
              <div className="sidebar-icon" title="Support" onClick={() => handleIconClick('support')}>
                <Phone size={22} strokeWidth={2} color="white" />
              </div>
            </div>
            <div className="sidebar-divider"></div>
            <div className="sidebar-vertical-text">
              <Copyright size={32} strokeWidth={2} color="white" />
            </div>
            <div className="sidebar-divider"></div>
            <div className="sidebar-icon-group">
              <div className="sidebar-icon" title="Raccourcis" onClick={() => handleIconClick('raccourcis')}>
                <Keyboard size={22} strokeWidth={2} color="white" />
              </div>
              <div 
                className="sidebar-icon" 
                title="Notifications" 
                onClick={() => handleIconClick('notif')}
              >
                <Bell size={22} strokeWidth={2} color="white" />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>
              <div className="sidebar-icon" title="Parametres" onClick={() => handleIconClick('params')}>
                <Settings size={22} strokeWidth={2} color="white" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Popup Documentation */}
      {showDocPopup && (
        <div className="tutorial-overlay" onClick={closeAllPopups}>
          <div className="tutorial-container" onClick={(e) => e.stopPropagation()}>
            <div className="tutorial-header">
              <h2>📚 Documentation</h2>
              <button className="tutorial-close" onClick={closeAllPopups}>✕</button>
            </div>
            <div className="tutorial-card">
              <h3>Guide d'utilisation</h3>
              <p>Consultez la documentation complete de l'application OMDA.</p>
              <ul style={{marginTop: '10px', paddingLeft: '20px'}}>
                <li>Manuel utilisateur</li>
                <li>Guide des fonctionnalites</li>
                <li>FAQ</li>
                <li>Videos tutorielles</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Popup Support */}
      {showSupportPopup && (
        <div className="tutorial-overlay" onClick={closeAllPopups}>
          <div className="tutorial-container" onClick={(e) => e.stopPropagation()}>
            <div className="tutorial-header">
              <h2>📞 Support technique</h2>
              <button className="tutorial-close" onClick={closeAllPopups}>✕</button>
            </div>
            <div className="tutorial-card">
              <h3>Contacter le support</h3>
              <p><strong>Email :</strong> support@omda.com</p>
              <p><strong>Telephone :</strong> +33 1 23 45 67 89</p>
              <p><strong>Horaires :</strong> Lun-Ven, 9h-18h</p>
              <button className="tutorial-goto" onClick={closeAllPopups}>
                ✉️ Envoyer un message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Raccourcis clavier */}
      {showRaccourcisPopup && (
        <div className="tutorial-overlay" onClick={closeAllPopups}>
          <div className="tutorial-container" onClick={(e) => e.stopPropagation()}>
            <div className="tutorial-header">
              <h2>⌨️ Raccourcis clavier</h2>
              <button className="tutorial-close" onClick={closeAllPopups}>✕</button>
            </div>
            <div className="tutorial-card">
              <h3>Raccourcis disponibles</h3>
              <table style={{width: '100%', marginTop: '10px'}}>
                <tbody>
                  <tr><td><kbd>Ctrl</kbd> + <kbd>N</kbd></td><td>Nouvel usager</td></tr>
                  <tr><td><kbd>Ctrl</kbd> + <kbd>F</kbd></td><td>Rechercher</td></tr>
                  <tr><td><kbd>Ctrl</kbd> + <kbd>S</kbd></td><td>Sauvegarder</td></tr>
                  <tr><td><kbd>F1</kbd></td><td>Aide</td></tr>
                  <tr><td><kbd>Esc</kbd></td><td>Fermer</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Popup Parametres */}
      {showParamsPopup && (
        <div className="tutorial-overlay" onClick={closeAllPopups}>
          <div className="tutorial-container" onClick={(e) => e.stopPropagation()}>
            <div className="tutorial-header">
              <h2>⚙️ Parametres</h2>
              <button className="tutorial-close" onClick={closeAllPopups}>✕</button>
            </div>
            <div className="tutorial-card">
              <h3>Preferences</h3>
              <div style={{marginTop: '10px'}}>
                <label style={{display: 'block', marginBottom: '10px'}}>
                  <input type="checkbox" /> Theme sombre
                </label>
                <label style={{display: 'block', marginBottom: '10px'}}>
                  <input type="checkbox" /> Notifications par email
                </label>
                <label style={{display: 'block', marginBottom: '10px'}}>
                  Langue : 
                  <select style={{marginLeft: '10px'}}>
                    <option>Francais</option>
                    <option>English</option>
                  </select>
                </label>
                <button className="tutorial-goto" onClick={closeAllPopups}>
                  💾 Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutoriel original */}
      {showTutorial && (
        <div className="tutorial-overlay" onClick={closeTutorial}>
          <div className="tutorial-container" onClick={(e) => e.stopPropagation()}>
            <div className="tutorial-header">
              <h2>📖 Tutoriel interactif</h2>
              <button className="tutorial-close" onClick={closeTutorial}>✕</button>
            </div>
            <div className="tutorial-progress">
              Etape {currentStep + 1} / {pages.length}
            </div>
            <div className="tutorial-card">
              <h3>{pages[currentStep].name}</h3>
              <p className="tutorial-desc">{pages[currentStep].description}</p>
              <p className="tutorial-detail">{pages[currentStep].details}</p>
              <button className="tutorial-goto" onClick={goToPage}>
                🔗 Acceder a cette page
              </button>
            </div>
            <div className="tutorial-footer">
              <button className="tutorial-btn cancel" onClick={closeTutorial}>Annuler</button>
              <div className="tutorial-nav">
                {currentStep > 0 && (
                  <button className="tutorial-btn prev" onClick={prevStep}>← Precedent</button>
                )}
                <button className="tutorial-btn next" onClick={nextStep}>
                  {currentStep === pages.length - 1 ? 'Terminer' : 'Suivant →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MiniSidebar;