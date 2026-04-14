import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import MiniSidebar from '../components/MiniSidebar'
import ParamCards from '../components/ParamCards'
import MainCards from '../components/MainCards'
import PaymentSection from '../components/PaymentSection'
import BilanCards from '../components/BilanCards'

function Dashboard () {
  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      
      <main className="contenu">
        <section>
          <div className="OM15">
            <div className="OM15A"></div>
            <div className="OM15B">
              <h1>OMDA</h1>
              <h3>OFFICE MALAGASY DU DROIT D'AUTEURSSSS</h3>
            </div>
            <div className="OM15C"></div>
          </div>
        </section>
        
        <section>
          <div className="OM15T"></div>
        </section>
        
        <section>
          <fieldset>
            <legend>Tableau de bord OMDA</legend>
            
            <div className="omd16">
              {/* 1. PARAMÈTRES DU DROIT PUBLIC */}

              <ParamCards />
              
              {/* BARRE D'ACTIONS RAPIDES */}

              
              {/* 2. SECTION AJOUT ET VÉRIFICATION */}
              <h2 className="section-title">
                <span>✏️</span> Ajout et vérification
              </h2>
              <MainCards />
              
              {/* 3. SECTION GESTION DES PAIEMENTS */}
              <h2 className="section-title">
                <span>💰</span> Gestion des paiements
              </h2>

              <PaymentSection />
              
              {/* 4. SECTION BILAN ET DIAGNOSTIC */}
              <h2 className="section-title">
                <span>📊</span> Bilan et diagnostic
              </h2>
              <BilanCards />
            </div>
          </fieldset>
        </section>
      </main>
    </>
  )
}

export default Dashboard