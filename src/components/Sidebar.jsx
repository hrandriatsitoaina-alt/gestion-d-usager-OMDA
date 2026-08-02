import React from 'react';
import { useNavigate } from 'react-router-dom';


const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <nav className="sidebar">
      <header>
        <h2>OMDA</h2>
      </header>
      <div className="scrollbox">
        <div className="scrollbox-inner">
          <div className="OmdCont">
          <div className="promd">
              <h2 align="center" onClick={() => navigate('/dashboard')}><a href="#">⛪ Acceuil ✨</a> </h2>
            </div>
            <div className="souligne"></div>
            
            <div className="promd">
              <h2><a href="#" onClick={(e) => {e.preventDefault(); navigate('/autre-usager');}}>📋 Catégorie 📋</a></h2>

              {/* <h2><a href="#" onClick={(e) => {e.preventDefault(); navigate('/choix-payement');}}>💰 Paiement 💰</a></h2> */}

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
                <div className="mof"><h2><h2><a href="#" onClick={(e) => {e.preventDefault(); navigate('/ajout-usager');}}>Ajout d'usager</a></h2></h2></div>
                <div className="mof"><h2><h2><a href="#" onClick={(e) => {e.preventDefault(); navigate('/verification-usager');}}>Vérifier statut</a></h2></h2></div>
                <div className="mof"><h2><h2><a href="#" onClick={(e) => {e.preventDefault(); navigate('/choix-payement');}}>Gestion paiement</a></h2></h2></div>
                <div className="mof"><h2>Gestion facture</h2></div>
                <div className="mof"><h2><h2><a href="#" onClick={(e) => {e.preventDefault(); navigate('/tableau-db');}}>Tableau de bord</a></h2></h2></div>
                <div className="mof"><h2><h2><a href="#" onClick={(e) => {e.preventDefault(); navigate('/ajout-evenement');}}>ajout-evenement</a></h2></h2></div>

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
                <div className="mof"><h2>Collecter</h2></div>
                <div className="mof"><h2>Partager</h2></div>
                <div className="mof"><h2>Recevoir</h2></div>
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