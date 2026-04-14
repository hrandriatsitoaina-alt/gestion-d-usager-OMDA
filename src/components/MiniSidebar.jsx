import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/aide.css';

const MiniSidebar = () => {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // États pour les différents popups d'aide
  const [showDocPopup, setShowDocPopup] = useState(false);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showRaccourcisPopup, setShowRaccourcisPopup] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showParamsPopup, setShowParamsPopup] = useState(false);

  const pages = [
    { name: 'Ajout d\'usager', path: '/ajout-usager', description: 'Enregistrer un nouvel usager', details: 'Nom, prénom, contact, catégorie…' },
    { name: 'Vérification usager', path: '/verification-usager', description: 'Rechercher un usager existant', details: 'Par identifiant ou nom, modifier ses infos.' },
    { name: 'Ajout d\'événement', path: '/ajout-evenement', description: 'Créer un événement culturel', details: 'Titre, date, lieu, tarif, lié à un usager.' },
    { name: 'Choix de paiement', path: '/choix-payement', description: 'Sélectionner le mode de paiement', details: 'Espèces, carte, virement, chèque.' },
    { name: 'Tableau de bord global', path: '/tableau-db', description: 'Visualisation des données', details: 'Tableaux croisés, filtres par période/catégorie.' },
    { name: 'Facturation occasionnelle', path: '/date_occ', description: 'Factures des usagers occasionnels', details: 'Détail et échéances.' },
    { name: 'Facturation grande surface', path: '/date-grandsurface', description: 'Factures des grandes surfaces', details: 'Taux spécifiques, relevés mensuels.' },
    { name: 'Facturation transport', path: '/date-bus', description: 'Factures des sociétés de transport', details: 'Calcul basé sur le nombre de véhicules.' },
    { name: 'Facturation night club', path: '/night-club', description: 'Factures des établissements nocturnes', details: 'Tarifs selon jauge et heures.' },
    { name: 'Autre usager', path: '/autre-usager', description: 'Factures autres catégories', details: 'Paramètres personnalisables.' },
    { name: 'Facture usager', path: '/facture-usager', description: 'Liste complète des factures', details: 'Statistiques (payée/retard), tableau mensuel, export PDF/Excel.' }
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

  // Fonctions pour chaque type d'aide (reste sur la même page)
  const handleIconClick = (action) => {
    // Fermer tous les popups
    setShowDocPopup(false);
    setShowSupportPopup(false);
    setShowRaccourcisPopup(false);
    setShowNotifPopup(false);
    setShowParamsPopup(false);
    
    // Ouvrir le popup correspondant
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
        setShowNotifPopup(true);
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
                <span>❓</span>
              </div>
              <div className="sidebar-icon" title="Documentation" onClick={() => handleIconClick('doc')}>
                <span>📚</span>
              </div>
              <div className="sidebar-icon" title="Support" onClick={() => handleIconClick('support')}>
                <span>📞</span>
              </div>
            </div>
            <div className="sidebar-divider"></div>
            <div className="sidebar-vertical-text">
              <span>O</span><span>M</span><span>D</span><span>A</span>
            </div>
            <div className="sidebar-divider"></div>
            <div className="sidebar-icon-group">
              <div className="sidebar-icon" title="Raccourcis" onClick={() => handleIconClick('raccourcis')}>
                <span>⌨️</span>
              </div>
              <div className="sidebar-icon" title="Notifications" onClick={() => handleIconClick('notif')}>
                <span>🔔</span>
              </div>
              <div className="sidebar-icon" title="Paramètres" onClick={() => handleIconClick('params')}>
                <span>⚙️</span>
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
              <p>Consultez la documentation complète de l'application OMDA.</p>
              <ul style={{marginTop: '10px', paddingLeft: '20px'}}>
                <li>Manuel utilisateur</li>
                <li>Guide des fonctionnalités</li>
                <li>FAQ</li>
                <li>Vidéos tutorielles</li>
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
              <p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
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

      {/* Popup Notifications */}
      {showNotifPopup && (
        <div className="tutorial-overlay" onClick={closeAllPopups}>
          <div className="tutorial-container" onClick={(e) => e.stopPropagation()}>
            <div className="tutorial-header">
              <h2>🔔 Notifications</h2>
              <button className="tutorial-close" onClick={closeAllPopups}>✕</button>
            </div>
            <div className="tutorial-card">
              <h3>Dernières notifications</h3>
              <div style={{marginTop: '10px'}}>
                <p>✓ 3 factures en attente de paiement</p>
                <p>✓ Nouvel événement ajouté ce jour</p>
                <p>✓ Mise à jour système disponible</p>
                <p>✓ Rappel : réunion demain 10h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Paramètres */}
      {showParamsPopup && (
        <div className="tutorial-overlay" onClick={closeAllPopups}>
          <div className="tutorial-container" onClick={(e) => e.stopPropagation()}>
            <div className="tutorial-header">
              <h2>⚙️ Paramètres</h2>
              <button className="tutorial-close" onClick={closeAllPopups}>✕</button>
            </div>
            <div className="tutorial-card">
              <h3>Préférences</h3>
              <div style={{marginTop: '10px'}}>
                <label style={{display: 'block', marginBottom: '10px'}}>
                  <input type="checkbox" /> Thème sombre
                </label>
                <label style={{display: 'block', marginBottom: '10px'}}>
                  <input type="checkbox" /> Notifications par email
                </label>
                <label style={{display: 'block', marginBottom: '10px'}}>
                  Langue : 
                  <select style={{marginLeft: '10px'}}>
                    <option>Français</option>
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
              Étape {currentStep + 1} / {pages.length}
            </div>
            <div className="tutorial-card">
              <h3>{pages[currentStep].name}</h3>
              <p className="tutorial-desc">{pages[currentStep].description}</p>
              <p className="tutorial-detail">{pages[currentStep].details}</p>
              <button className="tutorial-goto" onClick={goToPage}>
                🔗 Accéder à cette page
              </button>
            </div>
            <div className="tutorial-footer">
              <button className="tutorial-btn cancel" onClick={closeTutorial}>Annuler</button>
              <div className="tutorial-nav">
                {currentStep > 0 && (
                  <button className="tutorial-btn prev" onClick={prevStep}>← Précédent</button>
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