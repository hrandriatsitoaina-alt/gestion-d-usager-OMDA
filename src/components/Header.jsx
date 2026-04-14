import React from 'react';
import '../styles/App.css';
import omdaLogo from '../assets/imagesOMDA.png';  // ← Importer l'image

const Header = () => {
  return (
    <header>
      <div className="omd1">
        <div className="omd11">
          {/* Remplacer le div par une image */}
          <img 
            src={omdaLogo} 
            alt="OMDA Logo"
            className="omdA1"
          />
          <div>
            <h2>OMDA</h2>
          </div>
        </div>
        <div className="omd12">
          <h1>OFFICE MALAGASY DU DROIT D'AUTEUR</h1>
        </div>
        <div className="omd13">
          <div className="omd13A"><a href="#">📊</a></div>
          <div className="omd13A"><a href="#">📅</a></div>
          <div className="omd13A"><a href="#">📃</a></div>
        </div>
      </div>
    </header>
  );
};

export default Header;