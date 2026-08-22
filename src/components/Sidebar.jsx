import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, UserPlus, Search, CreditCard,
  FileText, BarChart, CalendarPlus, Download, Share2, Upload,
  Users, DollarSign, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const navItems = [
    { icon: LayoutDashboard, label: 'Accueil', path: '/dashboard' },
    { icon: FolderOpen, label: 'Catégories', path: '/autre-usager' },
  ];

  const usagerItems = [
    { icon: UserPlus, label: 'Ajouter un usager', path: '/ajout-usager' },
    { icon: Search, label: 'Vérifier le statut', path: '/verification-usager' },
  ];

  const paiementItems = [
    { icon: CreditCard, label: 'Gestion des paiements', path: '/gestion-paiement' },
    { icon: FileText, label: 'Factures', path: '/factures' },
  ];

  const outilsItems = [
    { icon: BarChart, label: 'Statistiques', path: '/statistiques' },
    { icon: CalendarPlus, label: 'Ajouter un événement', path: '/ajout-evenement' },
  ];

  const bdItems = [
    { icon: Download, label: 'Collecter', path: '#' },
    { icon: Share2, label: 'Partager', path: '#' },
    { icon: Upload, label: 'Recevoir', path: '#' },
  ];

  const handleMouseEnter = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 12
    });
    setHoveredItem(index);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const renderNavItem = (item, index) => (
    <li key={index}>
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); navigate(item.path); }}
        className={`nav-item ${item.path === '/dashboard' ? 'active' : ''}`}
        onMouseEnter={(e) => handleMouseEnter(e, index)}
        onMouseLeave={handleMouseLeave}
      >
        <span className="nav-icon-wrapper">
          <item.icon size={isCollapsed ? 22 : 20} />
        </span>
        {!isCollapsed && <span className="nav-label">{item.label}</span>}
      </a>
    </li>
  );

  const renderSection = (title, icon, items) => (
    <div className="nav-section">
      <div className="section-title">
        <span className="section-icon-wrapper">{icon}</span>
        {!isCollapsed && <span className="section-label">{title}</span>}
      </div>
      <ul className="nav-list">
        {items.map((item, idx) => renderNavItem(item, idx + 100))}
      </ul>
    </div>
  );

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>
        {/* En-tête avec OMDA */}
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <span className="brand">{!isCollapsed ? 'OMDA' : 'O'}</span>
            {!isCollapsed && <span className="brand-dot">•</span>}
          </div>
          {!isCollapsed && (
            <div className="sub-brand">Office Malagasy du Droit d'Auteur</div>
          )}
          {/* Bouton de collapse */}
          <button className="collapse-btn" onClick={toggleCollapse} title={isCollapsed ? 'Agrandir' : 'Réduire'}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Accueil et Catégories */}
          <ul className="nav-list nav-list-main">
            {navItems.map((item, idx) => renderNavItem(item, idx))}
          </ul>

          {/* Usagers */}
          {renderSection('Usagers', <Users size={16} />, usagerItems)}

          {/* Paiements */}
          {renderSection('Paiements', <DollarSign size={16} />, paiementItems)}

          {/* Outils */}
          {renderSection('Outils', <Settings size={16} />, outilsItems)}

          {/* Gestion BD */}
          {renderSection('Gestion de bd', <Download size={16} />, bdItems)}
        </nav>

        <footer className="sidebar-footer">
          {!isCollapsed ? (
            <>
              <span className="footer-email">Omda</span>
            </>
          ) : (
            <span className="footer-icon">©</span>
          )}
        </footer>
      </aside>

      {/* Tooltip flottant pour le mode réduit */}
      {isCollapsed && hoveredItem !== null && (
        <div 
          className="sidebar-tooltip"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: 'translateY(-50%)'
          }}
        >
          {hoveredItem < 100 
            ? navItems[hoveredItem]?.label 
            : [...usagerItems, ...paiementItems, ...outilsItems, ...bdItems][hoveredItem - 100]?.label
          }
        </div>
      )}
    </>
  );
};

export default Sidebar;