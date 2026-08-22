import React, { useState } from 'react';
import { 
  Home, LayoutDashboard, Users, CreditCard, Settings, 
  Bell, UserCircle, LogOut, Menu, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

const Header = ({ onLogout, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Gestionnaire pour la navigation
  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  // Gestionnaire pour la déconnexion
  const handleLogout = () => {
    // Appeler la fonction onLogout passée en prop (pour nettoyer le state/auth)
    if (onLogout) {
      onLogout();
    }
    
    // Rediriger vers la page d'accueil (racine)
    navigate('/', { replace: true });
    
    // Fermer le menu mobile
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
            <Home size={20} /> Accueil
          </a>
          <a href="/tableau-db" className="nav-link">
            <LayoutDashboard size={20} /> Tableau de bord
          </a>
          <a href="/gere-dossier" className="nav-link">
            <Users size={20} /> Gestion
          </a>
          <a href="/billan" className="nav-link">
            <CreditCard size={20} /> Paiements
          </a>
          <a href="/parametres" className="nav-link">
            <Settings size={20} /> Paramètres
          </a>
        </nav>

        {/* Actions utilisateur */}
        <div className="header-actions">
          {/* Bouton Notifications - redirige vers /notification_admin */}
          <button 
            className="icon-btn" 
            aria-label="Notifications"
            onClick={() => handleNavigation('/notification_admin')}
          >
            <Bell size={22} />
          </button>

          {/* Bouton Profil - redirige vers /profil (à créer) */}
          <button 
            className="icon-btn" 
            aria-label="Profil"
            onClick={() => handleNavigation('/profil')}
          >
            <UserCircle size={22} />
          </button>

          {/* Bouton Déconnexion - redirige vers / */}
          <button 
            className="icon-btn logout-btn" 
            onClick={handleLogout} 
            aria-label="Déconnexion"
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
            <Home size={20} /> Accueil
          </a>
          <a href="/tableau-db" className="nav-link" onClick={() => setMenuOpen(false)}>
            <LayoutDashboard size={20} /> Tableau de bord
          </a>
          <a href="/gere-dossier" className="nav-link" onClick={() => setMenuOpen(false)}>
            <Users size={20} /> Gestion
          </a>
          <a href="/billan" className="nav-link" onClick={() => setMenuOpen(false)}>
            <CreditCard size={20} /> Paiements
          </a>
          <a href="/parametres" className="nav-link" onClick={() => setMenuOpen(false)}>
            <Settings size={20} /> Paramètres
          </a>

          <hr className="mobile-divider" />

          {/* Bouton Notifications dans le menu mobile */}
          <button 
            className="mobile-logout" 
            onClick={() => handleNavigation('/notification_admin')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '12px 16px' }}
          >
            <Bell size={20} /> Notifications
          </button>

          {/* Bouton Profil dans le menu mobile */}
          <button 
            className="mobile-logout" 
            onClick={() => handleNavigation('/profil')} 
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '12px 16px' }}
          >
            <UserCircle size={20} /> Profil
          </button>

          {/* Bouton Déconnexion dans le menu mobile */}
          <button 
            className="mobile-logout" 
            onClick={handleLogout}
          >
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;