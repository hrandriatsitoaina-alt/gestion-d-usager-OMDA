import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TableauDB.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const TableauDB = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('occ'); // occ, hotel, night, bus

  // Données pour le tableau des usagers
  const usersData = [
    { id: 1342, name: 'IVENCO', responsable: 'RAKOTONIAINA', paiement: '5/12 Mois', situation: 'En retard', verse: '530 000', restant: '800 000', situationClass: 'red' },
    { id: 1142, name: 'LA MOZIKA', responsable: 'RABENJA', paiement: '8/12 Mois', situation: 'Normal', verse: '630 000', restant: '100 000', situationClass: 'bleu' },
    { id: 1392, name: 'LAC PROD', responsable: 'HERY', paiement: '6/12 Mois', situation: 'En attente', verse: '530 000', restant: '530 000', situationClass: 'jaune' },
  ];

  // Filtrage simple par recherche (nom ou ID)
  const filteredUsers = usersData.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toString().includes(searchTerm)
  );

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      
      <main className="contenu">
        <div className="contR">
          <div className="head">
            <div className="koa">
              <div>
                <h1>Gestion d'usager</h1>
                <h3>Tableau de bord</h3>
              </div>
            </div>
            <div className="koa2">
              <div className="rap1">
                <input
                  type="text"
                  placeholder="Recherche un élément                      |🔍"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="rap2">
                <div className="bordf"><span>&#128172;</span></div>
                <div className="bordf"><span>&#128736;</span></div>
                <div className="bordf1"><span>&#128276;</span></div>
              </div>
            </div>
          </div>
          <div className="omf">
            <div className="omfA"></div>
            <div className="omfB" align="center">
              Lundi 12 Mars 2026
            </div>
          </div>
        </div>

        <div className="contR2">
          <div className="soit">
            <div className="soit1"></div>
            <div className="soit2">
              <div
                className={`cho1 ${activeFilter === 'occ' ? 'active' : ''}`}
                onClick={() => setActiveFilter('occ')}
              >
                <h4>OCC</h4>
              </div>
              <div
                className={`cho ${activeFilter === 'hotel' ? 'active' : ''}`}
                onClick={() => setActiveFilter('hotel')}
              >
                <h4>Hotel</h4>
              </div>
              <div
                className={`cho ${activeFilter === 'night' ? 'active' : ''}`}
                onClick={() => setActiveFilter('night')}
              >
                <h4>Night club</h4>
              </div>
              <div
                className={`cho ${activeFilter === 'bus' ? 'active' : ''}`}
                onClick={() => setActiveFilter('bus')}
              >
                <h4>Bus</h4>
              </div>
            </div>
          </div>

          <div className="Tclas">
            <div className="cls3">
              <div className="bil">
                <div className="lil">
                  <div className="hu">
                    <div>
                      <h4>Actions</h4>
                      <h3>3 000</h3>
                      <span className="vert">&#127915; 10%</span>
                    </div>
                  </div>
                  <div className="hu1">
                    <div>
                      <h4>Paiement</h4>
                      <h3>2000 Ar</h3>
                      <span className="rouge">&#128177; 20%</span>
                    </div>
                  </div>
                </div>
                <div className="lil">
                  <div className="hu2">
                    <div>
                      <h4>Nouveaux</h4>
                      <h3>150</h3>
                      <span className="vert">&#128200; 15%</span>
                    </div>
                  </div>
                  <div className="hu3">
                    <div>
                      <h4>En attente</h4>
                      <h3>45</h3>
                      <span className="rouge">&#128268; 5%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="jim">
                <div className="bar-chart">
                  <div className="bar-item">
                    <div className="bar" style={{ height: '120px' }}></div>
                    <span className="bar-label">Lun</span>
                  </div>
                  <div className="bar-item">
                    <div className="bar" style={{ height: '90px' }}></div>
                    <span className="bar-label">Mar</span>
                  </div>
                  <div className="bar-item">
                    <div className="bar" style={{ height: '150px' }}></div>
                    <span className="bar-label">Mer</span>
                  </div>
                  <div className="bar-item">
                    <div className="bar" style={{ height: '80px' }}></div>
                    <span className="bar-label">Jeu</span>
                  </div>
                  <div className="bar-item">
                    <div className="bar" style={{ height: '110px' }}></div>
                    <span className="bar-label">Ven</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="cls4">
              <div className="semi-circle"></div>
              <div className="semi-stats">
                <div className="stat-item">
                  <div className="stat-value">75%</div>
                  <div className="stat-label">Complets</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">25%</div>
                  <div className="stat-label">Restants</div>
                </div>
              </div>
              <br />
              <div className="billanAns">
                <div className="ans"><h4>Billans d'exercice</h4></div>
                <div className="ans">
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Voir...</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="contR3">
          <div className="haut">
            <div className="ha"><h1>Détail des usagers par type</h1></div>
            <div className="ha3">
              <div>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="ha33"><h3>Filtre</h3></div>
            </div>
          </div>

          <div className="rot">
            <div><h3>ID</h3></div>
            <div><h3>Nom</h3></div>
            <div><h3>Responsable</h3></div>
            <div><h3>Paiement</h3></div>
            <div><h3>Situation</h3></div>
            <div><h3>Versé</h3></div>
            <div><h3>Restant</h3></div>
            <div><h3>Détails</h3></div>
          </div>

          {filteredUsers.map(user => (
            <div className="rot1" key={user.id}>
              <div><h3>{user.id}</h3></div>
              <div><h3>{user.name}</h3></div>
              <div><h3>{user.responsable}</h3></div>
              <div><h3>{user.paiement}</h3></div>
              <div><span className={user.situationClass}>{user.situation}</span></div>
              <div><h3>{user.verse}</h3></div>
              <div><h3>{user.restant}</h3></div>
              <div><h3>Plus...</h3></div>
            </div>
          ))}
        </div><br />
        <div class="mive">
              <div><h3>Retour au  page d'acceuille</h3> </div>
              <div><button className="btn-modern outline" onClick={() => navigate('/dashboard')}>← Retour</button></div>
        </div>

      </main>
    </>
  );
};

export default TableauDB;