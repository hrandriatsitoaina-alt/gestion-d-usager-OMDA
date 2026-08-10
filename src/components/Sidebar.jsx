import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, UserPlus, Search, CreditCard,
  FileText, BarChart, CalendarPlus, Download, Share2, Upload,
  Users, DollarSign, Settings
} from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">OMDA</div>
        <div className="sub-brand">Office Malagasy du Droit d'Auteur</div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="nav-item active">
              <LayoutDashboard size={20} /> Accueil
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/autre-usager'); }} className="nav-item">
              <FolderOpen size={20} /> Catégories
            </a>
          </li>
        </ul>

        <div className="nav-section">
          <div className="section-title"><Users size={18} /> Usagers</div>
          <ul className="nav-list">
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/ajout-usager'); }} className="nav-item">
                <UserPlus size={20} /> Ajouter un usager
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/verification-usager'); }} className="nav-item">
                <Search size={20} /> Vérifier le statut
              </a>
            </li>
          </ul>
        </div>

        <div className="nav-section">
          <div className="section-title"><DollarSign size={18} /> Paiements</div>
          <ul className="nav-list">
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/gestion-paiement'); }} className="nav-item">
                <CreditCard size={20} /> Gestion des paiements
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/factures'); }} className="nav-item">
                <FileText size={20} /> Factures
              </a>
            </li>
          </ul>
        </div>

        <div className="nav-section">
          <div className="section-title"><Settings size={18} /> Outils</div>
          <ul className="nav-list">
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/statistiques'); }} className="nav-item">
                <BarChart size={20} /> Statistiques
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/ajout-evenement'); }} className="nav-item">
                <CalendarPlus size={20} /> Ajouter un événement
              </a>
            </li>
          </ul>
        </div>

        <div className="nav-section">
          <div className="section-title"><Download size={18} /> Gestion de bd</div>
          <ul className="nav-list">
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); }} className="nav-item">
                <Download size={20} /> Collecter
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); }} className="nav-item">
                <Share2 size={20} /> Partager
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); }} className="nav-item">
                <Upload size={20} /> Recevoir
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <footer className="sidebar-footer">
        <span>omda@moov.mg</span>
        {/* <span className="version">v2.0</span> */}
      </footer>
    </aside>
  );
};

export default Sidebar;