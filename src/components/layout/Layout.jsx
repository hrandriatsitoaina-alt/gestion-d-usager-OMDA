import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <Sidebar />
      <nav className="sidebars"></nav> {/* Mini sidebar droite */}
      <main className="contenu">
        {/* En-tête du contenu commun */}
        <section>
          <div className="OM15">
            <div className="OM15A"></div>
            <div className="OM15B">
              <h1>OMDA</h1>
              <h3>OFFICE MALAGASY DU DROIT D'AUTEUR</h3>
            </div>
            <div className="OM15C"></div>
          </div>
        </section>
        
        <section>
          <div className="OM15T"></div>
        </section>
        
        {/* Contenu spécifique à la page */}
        {children}
      </main>
    </>
  );
};

export default Layout;