
import React, { useState } from 'react';
import { 
  Home, LayoutDashboard, Users, CreditCard, Settings, 
  Bell, UserCircle, LogOut, Menu, X 
} from 'lucide-react';
import '../styles/App.css';

const Header = ({ onLogout, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <button className="icon-btn" aria-label="Notifications">
            <Bell size={22} />
          </button>
          <button className="icon-btn" aria-label="Profil">
            <UserCircle size={22} />
          </button>
          <button className="icon-btn logout-btn" onClick={onLogout} aria-label="Déconnexion">
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
          <a href="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>
            <LayoutDashboard size={20} /> Tableau de bord
          </a>
          <a href="/gestion" className="nav-link" onClick={() => setMenuOpen(false)}>
            <Users size={20} /> Gestion
          </a>
          <a href="/paiements" className="nav-link" onClick={() => setMenuOpen(false)}>
            <CreditCard size={20} /> Paiements
          </a>
          <a href="/parametres" className="nav-link" onClick={() => setMenuOpen(false)}>
            <Settings size={20} /> Paramètres
          </a>
          <hr className="mobile-divider" />
          <button className="mobile-logout" onClick={() => { onLogout(); setMenuOpen(false); }}>
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
