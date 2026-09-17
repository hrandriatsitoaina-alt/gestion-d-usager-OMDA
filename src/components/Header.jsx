import React, { useState, useEffect } from 'react';
import { 
  Home, LayoutDashboard, Users, CreditCard, Settings, 
  Bell, UserCircle, LogOut, Menu, X,
  Bot, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

const Header = ({ onLogout, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [appLangue, setAppLangue] = useState('fr');
  const navigate = useNavigate();

  // ===== CHARGER LA LANGUE DEPUIS LOCALSTORAGE =====
  useEffect(() => {
    const langue = localStorage.getItem('app-langue') || 'fr';
    setAppLangue(langue);
    
    const handleLangueChange = (event) => {
      const { langue } = event.detail;
      setAppLangue(langue);
    };
    
    window.addEventListener('langue-change', handleLangueChange);
    
    return () => {
      window.removeEventListener('langue-change', handleLangueChange);
    };
  }, []);

  // ===== FONCTION DE TRADUCTION =====
  const t = (fr, mg, en) => {
    switch (appLangue) {
      case 'mg': return mg || fr;
      case 'en': return en || fr;
      default: return fr;
    }
  };

  // Gestionnaire pour la navigation
  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  // Gestionnaire pour la déconnexion
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/', { replace: true });
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo + Nom */}
        <div className="header-logo">
          <div className="logo-image" aria-label="Logo OMDA" />
          <span className="logo-text">OMDA</span>
        </div>

        {/* Navigation principale (desktop) */}
        <nav className="header-nav">
          <a href="/dashboard" className="nav-link active">
            <Home size={20} /> {t('Accueil', 'Fandraisana', 'Home')}
          </a>
          <a href="/tableau-db" className="nav-link">
            <LayoutDashboard size={20} /> {t('Tableau de bord', 'Tabilao', 'Dashboard')}
          </a>
          <a href="/gere-dossier" className="nav-link">
            <Users size={20} /> {t('Gestion', 'Fitandremana', 'Management')}
          </a>
          <a href="/billan" className="nav-link">
            <CreditCard size={20} /> {t('Paiements', 'Fandoavana', 'Payments')}
          </a>
          <a href="/Parametre_global" className="nav-link">
            <Settings size={20} /> {t('Paramètres', 'Fandrindrana', 'Settings')}
          </a>
        </nav>

        {/* Actions utilisateur */}
        <div className="header-actions">
          {/* Bouton Assistant IA */}
          <button 
            className="icon-btn" 
            aria-label={t('Assistant IA', 'Mpanampy IA', 'AI Assistant')}
            onClick={() => handleNavigation('/diagnostique')}
          >
            <Bot size={22} />
          </button>



          {/* Bouton Notifications */}
          <button 
            className="icon-btn" 
            aria-label={t('Notifications', 'Fampahafantarana', 'Notifications')}
            onClick={() => handleNavigation('/notification_admin')}
          >
            <Bell size={22} />
          </button>

          {/* Bouton Profil */}
          <button 
            className="icon-btn" 
            aria-label={t('Profil', 'Momba ahy', 'Profile')}
            onClick={() => handleNavigation('/profil')}
          >
            <UserCircle size={22} />
          </button>

          {/* Bouton Déconnexion */}
          <button 
            className="icon-btn logout-btn" 
            onClick={handleLogout} 
            aria-label={t('Déconnexion', 'Fivoahana', 'Logout')}
          >
            <LogOut size={22} />
          </button>

          {/* Menu hamburger pour mobile */}
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Navigation mobile */}
      {menuOpen && (
        <div className="mobile-nav">
          <a href="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>
            <Home size={20} /> {t('Accueil', 'Fandraisana', 'Home')}
          </a>
          <a href="/tableau-db" className="nav-link" onClick={() => setMenuOpen(false)}>
            <LayoutDashboard size={20} /> {t('Tableau de bord', 'Tabilao', 'Dashboard')}
          </a>
          <a href="/gere-dossier" className="nav-link" onClick={() => setMenuOpen(false)}>
            <Users size={20} /> {t('Gestion', 'Fitandremana', 'Management')}
          </a>
          <a href="/billan" className="nav-link" onClick={() => setMenuOpen(false)}>
            <CreditCard size={20} /> {t('Paiements', 'Fandoavana', 'Payments')}
          </a>
          <a href="/parametres" className="nav-link" onClick={() => setMenuOpen(false)}>
            <Settings size={20} /> {t('Paramètres', 'Fandrindrana', 'Settings')}
          </a>

          <hr className="mobile-divider" />

          {/* Bouton Assistant IA dans le menu mobile */}
          <button 
            className="mobile-logout" 
            onClick={() => handleNavigation('/assistant-ia')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '12px 16px' }}
          >
            <Bot size={20} /> {t('Assistant IA', 'Mpanampy IA', 'AI Assistant')}
          </button>

          {/* Bouton Vérification dans le menu mobile */}
          <button 
            className="mobile-logout" 
            onClick={() => handleNavigation('/verification-usager')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '12px 16px' }}
          >
            <UserCheck size={20} /> {t('Vérification', 'Fanamarinana', 'Verify')}
          </button>

          {/* Bouton Notifications dans le menu mobile */}
          <button 
            className="mobile-logout" 
            onClick={() => handleNavigation('/notification_admin')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '12px 16px' }}
          >
            <Bell size={20} /> {t('Notifications', 'Fampahafantarana', 'Notifications')}
          </button>

          {/* Bouton Profil dans le menu mobile */}
          <button 
            className="mobile-logout" 
            onClick={() => handleNavigation('/profil')} 
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '12px 16px' }}
          >
            <UserCircle size={20} /> {t('Profil', 'Momba ahy', 'Profile')}
          </button>

          {/* Bouton Déconnexion dans le menu mobile */}
          <button 
            className="mobile-logout" 
            onClick={handleLogout}
          >
            <LogOut size={20} /> {t('Déconnexion', 'Fivoahana', 'Logout')}
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;