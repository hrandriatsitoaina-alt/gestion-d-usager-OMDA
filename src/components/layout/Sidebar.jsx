import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <nav className="sidebar">
      <header>
        <h2>OMDA</h2>
      </header>
      <div className="scrollbox">
        <div className="scrollbox-inner">
          <div className="OmdCont">
            <div className="promd">
              <h1 align="center">Paramètrage 🔧</h1>
        <button className="btn-modern outline" onClick={() => navigate('/dashboard')}>← Retour</button>

            </div>
            <div className="souligne"></div>
            

            <h1><a href=""  onClick={handleReturn}>Acceuil</a></h1>








            <div className="promd">
              <h2><Link to="/categories">📋 Catégorie 📋</Link></h2>
              <h2><Link to="/paiements">💰 Paiement 💰</Link></h2>
            </div>
            <div className="souligne"></div>
            
            <div className="stit">
              <h2>Actions diverses :</h2>
            </div>
            
            <div className="actd">
              <div>
                <div className="mod"><h1>✏️</h1></div>
                <div className="mod"><h1>❓</h1></div>
                <div className="mod"><h1>💰</h1></div>
                <div className="mod"><h1>📄</h1></div>
                <div className="mod"><h1>📈</h1></div>
                <div className="mod"><h1>📍</h1></div>
              </div>
              <div>
                <div className="mof"><h2><Link to="/parametre/ajout-categorie">Ajout catégorie</Link></h2></div>
                <div className="mof"><h2><Link to="/parametre/verification-statut">Vérifier statut</Link></h2></div>
                <div className="mof"><h2><Link to="/parametre/gestion-paiement">Gestion paiement</Link></h2></div>
                <div className="mof"><h2><Link to="/parametre/gestion-facture">Gestion facture</Link></h2></div>
                <div className="mof"><h2><Link to="/parametre/bilan">Bilan</Link></h2></div>
                <div className="mof"><h2><Link to="/parametre/liste-usagers">Liste d'usagers</Link></h2></div>
              </div>
            </div>
            
            <div className="souligne"></div>
            
            <div className="stit">
              <h2>Gestion BD :</h2>
            </div>
            
            <div className="actd">
              <div>
                <div className="mod"><h1>📥</h1></div>
                <div className="mod"><h1>📤</h1></div>
                <div className="mod"><h1>📲</h1></div>
              </div>
              <div>
                <div className="mof"><h2><Link to="/collecter">Collecter</Link></h2></div>
                <div className="mof"><h2><Link to="/partager">Partager</Link></h2></div>
                <div className="mof"><h2><Link to="/recevoir">Recevoir</Link></h2></div>
              </div>
            </div>
            
            <div className="souligne"></div>
          </div>
        </div>
      </div>
      <footer>
        <h2>omda@moov.mg</h2>
      </footer>
    </nav>
  );
};

export default Sidebar;