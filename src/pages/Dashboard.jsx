import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, DollarSign, BarChart, User } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';
import ParamCards from '../components/ParamCards';
import MainCards from '../components/MainCards';
import PaymentSection from '../components/PaymentSection';
import BilanCards from '../components/BilanCards';

function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

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

  const getRoleLabel = () => {
    if (userRole === 'super_admin') return 'Super Administrateur';
    if (userRole === 'admin') return 'Administrateur';
    return 'Utilisateur';
  };

  if (loading) {
    return (
      <>
        <Header />
        <Sidebar />
        <MiniSidebar />
        <main className="contenu">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Chargement...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      
      <main className="contenu">
        {/* En-tête compact */}
        <section>
          <div className="OM15">
            <div className="OM15A"></div>
            <div className="OM15B">
              <h1>OMDA</h1>
              <h3>OFFICE MALAGASY DU DROIT D'AUTEUR</h3>
            </div>
            <div className="OM15C"></div>
          </div>
          <div className="OM15T"></div>
        </section>
        
        <section>
          <fieldset className="dashboard-fieldset">
            <legend>
              <User size={18} strokeWidth={2} />
              Perception OMDA : {userName}
            </legend>
            
            <div className="dashboard-content">
              {/* 1. PARAMÈTRES DU DROIT PUBLIC */}
              <ParamCards />
              
              {/* 2. SECTION AJOUT ET VÉRIFICATION */}
              <h2 className="section-title-compact">
                <Users size={18} strokeWidth={2} />
                Ajout et vérification
              </h2>
              <MainCards />
              
              {/* 3. SECTION GESTION DES PAIEMENTS */}
              <h2 className="section-title-compact">
                <DollarSign size={18} strokeWidth={2} />
                Gestion des paiements
              </h2>
              <PaymentSection />
              
              {/* 4. SECTION BILAN ET DIAGNOSTIC */}
              <h2 className="section-title-compact">
                <BarChart size={18} strokeWidth={2} />
                Bilan et diagnostic
              </h2>
              <BilanCards />
            </div>
          </fieldset>
        </section>
      </main>
    </>
  );
}

export default Dashboard;