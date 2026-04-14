import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const Tele = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      <main className="contenu">
        <section>
          {/* Cartes statistiques pour Night Club */}
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon">🎧</div>
              <div className="stat-info">
                <h3 className="stat-number">25</h3>
                <p className="stat-label">Night Clubs</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎵</div>
              <div className="stat-info">
                <h3 className="stat-number">150</h3>
                <p className="stat-label">Artistes/Soirées</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🍾</div>
              <div className="stat-info">
                <h3 className="stat-number">8 500</h3>
                <p className="stat-label">Clients/semaine</p>
              </div>
            </div>
          </div>

          {/* Filtres de recherche */}
          <div className="filters-container">
            <div className="filter-group">
              <label>Bilan mensuel :</label>
              <select className="custom-select">
                <option>Mois</option>
                <option>Janvier</option>
                <option>Février</option>
                <option>Mars</option>
                <option>Avril</option>
                <option>Mai</option>
                <option>Juin</option>
                <option>Juillet</option>
                <option>Août</option>
                <option>Septembre</option>
                <option>Octobre</option>
                <option>Novembre</option>
                <option>Décembre</option>
              </select>
              <select className="custom-select">
                <option>Année</option>
                <option>2026</option>
                <option>2025</option>
                <option>2024</option>
                <option>2023</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Bilan global :</label>
              <select className="custom-select">
                <option>Année début</option>
                <option>2030</option>
                <option>2029</option>
                <option>2028</option>
                <option>2027</option>
              </select>
              <select className="custom-select">
                <option>Année fin</option>
                <option>2030</option>
                <option>2029</option>
                <option>2028</option>
                <option>2027</option>
              </select>
              <a href="#" className="graph-link">📊 Voir graphique</a>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="search-container">
            <div className="search-wrapper">
              <input type="text" placeholder="Rechercher par nom, DJ, ou quartier..." className="search-input"/>
              <button className="search-button">🔍 Rechercher</button>
            </div>
          </div>

          {/* Tableau des Night Clubs */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Type</th>
                  <th>Nom tele/Radio</th>
                  <th>Siege</th>
                  <th>Region</th>
                  <th>Jan</th>
                  <th>Fév</th>
                  <th>Mar</th>
                  <th>Avr</th>
                  <th>Mai</th>
                  <th>Juin</th>
                  <th>Juil</th>
                  <th>Aoû</th>
                  <th>Sep</th>
                  <th>Oct</th>
                  <th>Nov</th>
                  <th>Déc</th>
                  <th>Type paiement</th>
                  <th>Reste</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">001</td>
                  <td className="text-center">RNM</td>
                  <td>Tele</td>
                  <td>Analamanga</td>
                  <td>Analakely</td>
                  <td className="text-right">1 250 000</td>
                  <td className="text-right">1 300 000</td>
                  <td className="text-right">1 280 000</td>
                  <td className="text-right">1 400 000</td>
                  <td className="text-right">1 350 000</td>
                  <td className="text-right">1 420 000</td>
                  <td className="text-right">1 500 000</td>
                  <td className="text-right">1 450 000</td>
                  <td className="text-right">1 380 000</td>
                  <td className="text-right">1 420 000</td>
                  <td className="text-right">1 500 000</td>
                  <td className="text-right">1 600 000</td>
                  <td><span className="badge badge-primary">Mensuel</span></td>
                  <td className="text-right amount">0</td>
                  <td><span className="badge badge-success">À jour</span></td>
                </tr>
                <tr>
                  <td className="text-center">002</td>
                  <td className="text-center">RDJ</td>
                  <td>Radio</td>
                  <td>Toliara</td>
                  <td>Ivandry</td>
                  <td className="text-right">980 000</td>
                  <td className="text-right">1 020 000</td>
                  <td className="text-right">1 050 000</td>
                  <td className="text-right">1 100 000</td>
                  <td className="text-right">1 080 000</td>
                  <td className="text-right">1 120 000</td>
                  <td className="text-right">1 150 000</td>
                  <td className="text-right">1 180 000</td>
                  <td className="text-right">1 100 000</td>
                  <td className="text-right">1 050 000</td>
                  <td className="text-right">1 200 000</td>
                  <td className="text-right">1 250 000</td>
                  <td><span className="badge badge-warning">Ponctuel</span></td>
                  <td className="text-right amount">450 000</td>
                  <td><span className="badge badge-warning">6/12</span></td>
                </tr>
                <tr>
                  <td className="text-center">003</td>
                  <td className="text-center">Dream'in</td>
                  <td>Tele/Radio</td>
                  <td>Fianaratsoa</td>
                  <td>Andraharo</td>
                  <td className="text-right">2 000 000</td>
                  <td className="text-right">1 950 000</td>
                  <td className="text-right">2 100 000</td>
                  <td className="text-right">2 050 000</td>
                  <td className="text-right">1 980 000</td>
                  <td className="text-right">2 150 000</td>
                  <td className="text-right">2 200 000</td>
                  <td className="text-right">2 300 000</td>
                  <td className="text-right">2 150 000</td>
                  <td className="text-right">2 080 000</td>
                  <td className="text-right">2 200 000</td>
                  <td className="text-right">2 400 000</td>
                  <td><span className="badge badge-success">Mensuel</span></td>
                  <td className="text-right amount">0</td>
                  <td><span className="badge badge-success">Payé</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <div className="table-info">
              Affichage de <strong>1</strong> à <strong>3</strong> sur <strong>25</strong> résultats
            </div>
            <div className="pagination">
              <button className="page-btn" disabled>« Précédent</button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">4</button>
              <button className="page-btn">Suivant »</button>
              <button className="btn-modern outline" onClick={() => navigate('/autre-usager')}>← Retour</button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Tele;