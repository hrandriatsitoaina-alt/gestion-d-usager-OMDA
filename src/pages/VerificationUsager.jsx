import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/VerificationUsager.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const VerificationUsager = () => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState('IVENCO');
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    { id: 1, initials: 'JY', name: 'IVENCO', type: 'Organisateur d\'événements', artists: 79, events: 34, status: 'active', color: '#6db5ff', rep: 'RAHERILANTO Jean Yves', duration: '2 ans', capital: '200 000 Ar', nif: '4000123456', stat: '5012345678', phone: '+261 34 12 345 67', email: 'ivenco@organisation.mg', address: 'Lot IVK 123, Antanimena', city: 'Antananarivo', memberSince: '2020' },
    { id: 2, initials: 'TR', name: 'TAKARIVA', type: 'Producteur', artists: 45, events: 12, status: 'active', color: '#ff9800', rep: 'RAKOTOARIMANANA Tahiry', duration: '3 ans', capital: '350 000 Ar', nif: '4000789456', stat: '5012789456', phone: '+261 33 45 678 90', email: 'takariva@producteur.mg', address: 'Lot III 45, Analakely', city: 'Antananarivo', memberSince: '2021' },
    { id: 3, initials: 'MS', name: 'MASOANDRO', type: 'Association culturelle', artists: 62, events: 28, status: 'active', color: '#4CAF50', rep: 'ANDRIAMANALINA Mamy', duration: '5 ans', capital: '150 000 Ar', nif: '4000321654', stat: '5012321654', phone: '+261 32 56 789 01', email: 'masoandro@asso.mg', address: 'Lot II 78, Isotry', city: 'Antananarivo', memberSince: '2019' },
    { id: 4, initials: 'AS', name: 'AS 456', type: 'Espace culturel', artists: 23, events: 8, status: 'inactive', color: '#9C27B0', rep: 'RAZAFIMANDIMBY Solofo', duration: '1 an', capital: '75 000 Ar', nif: '4000543210', stat: '5012543210', phone: '+261 34 78 901 23', email: 'as456@espace.mg', address: 'Lot I 12, Mahamasina', city: 'Antananarivo', memberSince: '2023' },
    { id: 5, initials: 'FM', name: 'FALY MANANTSOA', type: 'Promoteur', artists: 34, events: 15, status: 'active', color: '#E91E63', rep: 'RAKOTONDRAMANANA Faly', duration: '4 ans', capital: '280 000 Ar', nif: '4000765432', stat: '5012765432', phone: '+261 33 12 345 67', email: 'faly@promoteur.mg', address: 'Lot V 56, Andravoahangy', city: 'Antananarivo', memberSince: '2020' },
    { id: 6, initials: 'MR', name: 'MADAGASCAR RYTHME', type: 'Agence artistique', artists: 51, events: 22, status: 'active', color: '#00BCD4', rep: 'RANDRIANARISOA Miora', duration: '6 ans', capital: '450 000 Ar', nif: '4000987654', stat: '5012987654', phone: '+261 32 98 765 43', email: 'contact@madrythme.mg', address: 'Lot VI 89, Ankorondrano', city: 'Antananarivo', memberSince: '2018' },
  ];

  const currentUser = users.find(user => user.name === selectedUser) || users[0];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      
      <main className="contenu">
        {/* En-tête du contenu */}

        
        <section>
          <div className="OM15T"></div>
        </section>

        {/* Section principale améliorée */}
        <section>
          <fieldset>
            <legend>📋 Gestion des usagers occasionnels</legend>

  {/* selection */}

  <div class="cont">
         <div class="cont1">
                 <div class="cont11">
                    <select class="form-select">
                        <option value="">Sélectionnez votre usage</option>
                        <option value="OCC">OCC</option>
                        <option value="Bus">Bus</option>
                        <option value="Grand Surface">Grand Surface</option>
                        <option value="Night club">Night club</option>
                        <option value="Télé/Radio">Télé/Radio</option>
                        <option value="Hôtel">Hôtel</option>
                    </select>
                 </div>

                 <div class="cont12">
                      <div class="btn"><button> ➕ Ajout Nouveau</button></div>
                      <div class="btn"><button> ✔ Valider</button></div>
                 </div>
         </div>
         <div class="cont2">
           <div class="cont21"><h3>Éléments sélectionnés : <span>OCC</span></h3></div>
           <div class="cont22">
                <div class="izr">
                     <div><h3>Usg : <span>Occ</span></h3></div>
                     <div><h4>Ins: <span>30</span> |  Fonct : <span>40</span> | Ret : <span>300</span></h4></div>
                </div>
          </div>
         </div><br/>
   </div><br />
  {/* selection */}


            <div className="stat_occ_ameliore">
              <br />
              
              {/* Conteneur principal à 2 colonnes */}
              <div className="two-column-container">
                {/* COLONNE GAUCHE - Liste des usagers */}
                <div className="users-list-column fixed-list">
                  <div className="list-header-modern">
                    <h2><span className="icon">👥</span> Liste des usagers</h2>
                    <div className="search-box-modern">
                      <input 
                        type="text" 
                        placeholder="Rechercher un usager..." 
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {/* <button className="search-btn">🔍</button> */}
                    </div>
                    <span className="user-count">{filteredUsers.length} usagers</span>
                  </div>
                  
                  {/* Conteneur des usagers */}
                  <div className="users-container">
                    {filteredUsers.map((user) => (
                      <div 
                        key={user.id} 
                        className={`user-card ${selectedUser === user.name ? 'selected' : ''}`}
                        onClick={() => setSelectedUser(user.name)}
                      >
                        <div className="user-avatar" style={{background: user.color}}>{user.initials}</div>
                        <div className="user-info">
                          <h3 className="user-name">{user.name}</h3>
                          <p className="user-type">{user.type}</p>
                          <div className="user-stats-mini">
                            <span className="stat-badge">🎤 {user.artists} artistes</span>
                            <span className="stat-badge">📅 {user.events} events</span>
                          </div>
                        </div>
                        <div className="user-status">
                          <span className={`status-badge ${user.status}`}>
                            {user.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <div className="pagination-modern">
                    <button className="page-prev">◀</button>
                    <button className="page-number active">1</button>
                    <button className="page-number">2</button>
                    <button className="page-number">3</button>
                    <button className="page-number">4</button>
                    <button className="page-next">▶</button>
                  </div>
                </div>
                
                {/* COLONNE DROITE - Détail d'un usager */}
                <div className="user-detail-column">
                  {/* En-tête de la fiche */}
                  <div className="detail-header-modern">
                    <h2><span className="icon">📄</span> Fiche détaillée</h2>
                    <div className="detail-actions">
                      <button className="icon-btn" title="Modifier">✏️</button>
                      <button className="icon-btn" title="Imprimer">🖨️</button>
                      <button className="icon-btn" title="Exporter">📤</button>
                    </div>
                  </div>
                  
                  {/* Carte principale de l'usager */}
                  <div className="user-profile-card">
                    <div className="profile-header">
                      <div className="profile-avatar-large" style={{background: currentUser.color}}>{currentUser.initials}</div>
                      <div className="profile-title-section">
                        <h1 className="profile-name">{currentUser.name}</h1>
                        <p className="profile-category">{currentUser.type}</p>
                        <div className="profile-badges">
                          <span className="badge-blue">Membre depuis {currentUser.memberSince}</span>
                          <span className={`badge-${currentUser.status}`}>
                            {currentUser.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="profile-details-grid">
                      {/* Informations principales */}
                      <div className="detail-card">
                        <h3 className="detail-card-title">
                          <span>👤 Informations générales</span>
                          <button className="edit-small">✏️</button>
                        </h3>
                        <div className="detail-content">
                          <div className="detail-row">
                            <span className="detail-label">Représentant :</span>
                            <span className="detail-value">{currentUser.rep}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Durée d'action :</span>
                            <span className="detail-value">{currentUser.duration}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Capital :</span>
                            <span className="detail-value highlight">{currentUser.capital}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">NIF :</span>
                            <span className="detail-value">{currentUser.nif}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">STAT :</span>
                            <span className="detail-value">{currentUser.stat}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Coordonnées */}
                      <div className="detail-card">
                        <h3 className="detail-card-title">
                          <span>📍 Coordonnées</span>
                          <button className="edit-small">✏️</button>
                        </h3>
                        <div className="detail-content">
                          <div className="detail-row">
                            <span className="detail-label">Téléphone :</span>
                            <span className="detail-value">{currentUser.phone}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Mail : </span>
                            <span className="detail-value">{currentUser.email}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Adresse :</span>
                            <span className="detail-value">{currentUser.address}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Ville :</span>
                            <span className="detail-value">{currentUser.city}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Événements récents */}
                      <div className="detail-card full-width">
                        <h3 className="detail-card-title">
                          <span>📋 Événements organisés</span>
                          <button className="btn-small">Voir tout</button>
                        </h3>
                        <div className="events-list">
                          <div className="event-item">
                            <span className="event-date">15 Mars 2026</span>
                            <span className="event-name">Festival des arts</span>
                            <span className="event-artists">25 artistes</span>
                            <span className="event-status done">Terminé</span>
                          </div>
                          <div className="event-item">
                            <span className="event-date">28 Fév 2026</span>
                            <span className="event-name">Concert live</span>
                            <span className="event-artists">12 artistes</span>
                            <span className="event-status done">Terminé</span>
                          </div>
                          <div className="event-item">
                            <span className="event-date">10 Jan 2026</span>
                            <span className="event-name">Exposition</span>
                            <span className="event-artists">8 artistes</span>
                            <span className="event-status done">Terminé</span>
                          </div>
                          <div className="event-item">
                            <span className="event-date">05 Avr 2026</span>
                            <span className="event-name">Gala de musique</span>
                            <span className="event-artists">34 artistes</span>
                            <span className="event-status upcoming">À venir</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Boutons d'action en bas */}
                    <div className="profile-footer-actions">
                      <button className="btn-modern primary" onClick={() => navigate('/historique')}>📋 Historique complet</button>
                      <button className="btn-modern secondary" onClick={() => navigate('/paiement')}>💰 Gestion paiements</button>
                      <button className="btn-modern outline">📄 Générer rapport</button>
                      <button className="btn-modern outline" onClick={() => navigate('/dashboard')}>← Retour</button>



                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </section>
      </main>
    </>
  );
};

export default VerificationUsager;