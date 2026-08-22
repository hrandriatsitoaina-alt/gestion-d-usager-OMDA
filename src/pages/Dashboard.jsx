import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Users, DollarSign, BarChart, User, MapPin, Menu, X,
  Award, Shield, Clock, CheckCircle, TrendingUp, 
  CreditCard, Settings, Bell, Search,
  FileText, Calendar, Mail, Phone, Globe, Star,
  Activity, Zap, BookOpen
} from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';
import ParamCards from '../components/ParamCards';
import MainCards from '../components/MainCards';
import PaymentSection from '../components/PaymentSection';
import BilanCards from '../components/BilanCards';
import RegionListe from '../components/regionListe';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 994);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 994;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timer);
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn || !userData) {
      navigate('/authentification');
      return;
    }
    try {
      const user = JSON.parse(userData);
      setUserName(user.nom || 'Utilisateur');
      setUserRole(user.role || 'user');
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/authentification');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const formattedDate = currentDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (loading) {
    return (
      <>
        <Header />
        <Sidebar isOpen={false} isCollapsed={false} />
        <main className={`contenu ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div className="loading-spinner"></div>
            <p style={{ color: '#2196F3', fontSize: '16px' }}>
              <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <MiniSidebar/>
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />
      
      <main className={`contenu ${isCollapsed ? 'sidebar-collapsed' : ''} ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Bouton hamburger */}
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* En-tête OMDA unifié */}
        <section className="dashboard-header-section">
          <div className="dashboard-header-unified">
            <div className="header-left">
              <div className="omda-brand">
                <div className="omda-icon">
                  <BookOpen size={32} color="#FFFF" />
                </div>
                <div className="omda-brand-text">
                <h1 className="omda-title" style={{ color: '#fff' }}>OMDA</h1>
                  <span className="omda-subtitle">OFFICE MALAGASY DU DROIT D'AUTEUR</span>
                </div>
              </div>
            </div>

            <div className="header-right">
              <div className="user-info-card">
                <div className="user-avatar">
                  <User size={20} />
                </div>
                <div className="user-details">
                  <div className="user-name">{userName}</div>
                  <div className="user-status">
                    <Shield size={12} />
                    <span>{userRole === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
                    <span className="status-dot"></span>
                    <span className="status-text">En ligne</span>
                  </div>
                </div>
              </div>

              <div className="date-time-card">
                <Calendar size={18} />
                <span className="date-text">{formattedDate}</span>
              </div>
              <div className="date-time-card">
                <Clock size={18} />
                <span className="time-text">{formattedTime}</span>
              </div>


            </div>
          </div>
        </section>
        
        {/* Contenu principal */}
        <section>
          <fieldset className="dashboard-fieldset">
            <legend className="dashboard-legend">
              <User size={18} strokeWidth={2} />
              Perception OMDA : {userName}
              <span className="legend-badge">
                <Activity size={14} />
                Actif
              </span>
            </legend>
            
            <div className="dashboard-content">
              {/* ParamCards avec données réelles */}
              <ParamCards />
              
              <h2 className="section-title-compact section-title-blue">
                <Users size={18} strokeWidth={2} />
                Ajout et vérification
                <span className="section-badge">
                  <Search size={13} />
                  Rechercher
                </span>
              </h2>
              <MainCards />
              
              <h2 className="section-title-compact section-title-green">
                <DollarSign size={18} strokeWidth={2} />
                Gestion des paiements
                <span className="section-badge">
                  <CreditCard size={13} />
                  Transactions
                </span>
              </h2>
              <PaymentSection />
              
              <h2 className="section-title-compact section-title-orange">
                <MapPin size={18} strokeWidth={2} />
                Gestion des régions
                <span className="section-badge">
                  <Globe size={13} />
                  5 régions
                </span>
              </h2>
              <RegionListe />
              
              <h2 className="section-title-compact section-title-pink">
                <BarChart size={18} strokeWidth={2} />
                Bilan et diagnostic
                <span className="section-badge">
                  <TrendingUp size={13} />
                  Analyse
                </span>
              </h2>
              <BilanCards />
            </div>
          </fieldset>
        </section>

        {/* Pied de page */}
        <footer className="dashboard-footer">
          <span>
            <Mail size={14} />
            contact@omda.mg
          </span>
          <span>
            <Phone size={14} />
            +261 34 00 000 00
          </span>
          <span>
            <Globe size={14} />
            www.omda.mg
          </span>
          <span>
            © {new Date().getFullYear()} OMDA - Tous droits réservés
          </span>
        </footer>
      </main>
    </>
  );
}

export default Dashboard;