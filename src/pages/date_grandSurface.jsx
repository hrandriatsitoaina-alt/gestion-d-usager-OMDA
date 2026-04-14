import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/date_grandSurface.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const DateGrandSurface = () => {
  const navigate = useNavigate();

  return (
    <>
        <Header />
      <Sidebar />
      <MiniSidebar />
    <main class="contenu">
    <section>
        {/* <!-- Cartes statistiques --> */}
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-icon">🏛️</div>
                <div class="stat-info">
                    <h3 class="stat-number">10</h3>
                    <p class="stat-label">Mini Market</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🌍</div>
                <div class="stat-info">
                    <h3 class="stat-number">500</h3>
                    <p class="stat-label">Moyen</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏙️</div>
                <div class="stat-info">
                    <h3 class="stat-number">900</h3>
                    <p class="stat-label">Grand surface</p>
                </div>
            </div>
        </div>

        {/* <!-- Filtres de recherche --> */}
        <div class="filters-container">
            <div class="filter-group">
                <label>Bilan mensuel :</label>
                <select class="custom-select">
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
                <select class="custom-select">
                    <option>Année</option>
                    <option>2026</option>
                    <option>2025</option>
                    <option>2024</option>
                    <option>2023</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label>Bilan global :</label>
                <select class="custom-select">
                    <option>Année début</option>
                    <option>2030</option>
                    <option>2029</option>
                    <option>2028</option>
                    <option>2027</option>
                </select>
                <select class="custom-select">
                    <option>Année fin</option>
                    <option>2030</option>
                    <option>2029</option>
                    <option>2028</option>
                    <option>2027</option>
                </select>
                <a href="#" class="graph-link">📊 Voir graphique</a>
            </div>
        </div>

        {/* <!-- Barre de recherche --> */}
        <div class="search-container">
            <div class="search-wrapper">
                <input type="text" placeholder="Rechercher par nom, ville ou catégorie..." class="search-input"/>
                <button class="search-button">🔍 Rechercher</button>
            </div>
        </div>

        {/* <!-- Tableau avec lignes verticales et horizontales bien définies --> */}
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Nom</th>
                        <th>Type</th>
                        <th>Lieux</th>
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
                        <td class="text-center">001</td>
                        <td class="text-center">Ilay Nosy be</td>
                        <td>Nini Market</td>
                        <td>Antananarivo</td>
                        <td class="text-right">5 000</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">60 000</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">20 000</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">50 000</td>
                        <td><span class="badge badge-primary">Ponctuel</span></td>
                        <td class="text-right amount">70 000</td>
                        <td><span class="badge badge-warning">6/12</span></td>
                    </tr>
                    <tr>
                        <td class="text-center">002</td>
                        <td class="text-center">Liantsoa</td>
                        <td>Moyen</td>
                        <td>Mahajanga</td>
                        <td class="text-right">12 000</td>
                        <td class="text-right">12 000</td>
                        <td class="text-right">12 000</td>
                        <td class="text-right">12 000</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td class="text-right">---</td>
                        <td><span class="badge badge-success">Mensuel</span></td>
                        <td class="text-right amount">0</td>
                        <td><span class="badge badge-success">Payé</span></td>
                    </tr>

                </tbody>
            </table>
        </div>

        {/* <!-- Pagination --> */}
        <div class="pagination-container">
            <div class="table-info">
                Affichage de <strong>1</strong> à <strong>6</strong> sur <strong>24</strong> résultats
            </div>
            <div class="pagination">
                <button class="page-btn" disabled>« Précédent</button>
                <button class="page-btn active">1</button>
                <button class="page-btn">2</button>
                <button class="page-btn">3</button>
                <button class="page-btn">4</button>
                <button class="page-btn">Suivant »</button>
                <button className="btn-modern outline" onClick={() => navigate('/autre-usager')}>← Retour</button>

            </div>
        </div>
    </section>
</main>
</>
  );
};

export default DateGrandSurface;