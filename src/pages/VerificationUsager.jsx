import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, User, Calendar, Music, Phone, Mail, MapPin,
  Edit, Printer, Upload, Eye, ArrowLeft, Search,
  CheckCircle, XCircle, Clock, FileText, CreditCard, Home,
  ChevronLeft, ChevronRight, PlusCircle, Pin, BarChart3,
  Clipboard, UserPlus
} from 'lucide-react';
import '../styles/VerificationUsager.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const VerificationUsager = () => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('OCC');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/usagers/occasionnels');
      const data = await response.json();

      if (data.success && data.events) {
        const formattedUsers = data.events.map(event => {
          // Nom principal : organisateurs ou denomination ou nom_evenement
          const mainName = event.organisateurs || event.denomination || event.nom_evenement || 'Sans nom';
          return {
            id: event.id,
            initials: mainName.substring(0, 2).toUpperCase(),
            name: mainName,
            type: event.genre_manifestation || 'Occasionnelle',
            artists: event.artistesList ? event.artistesList.length : 0,
            eventsCount: 1, // chaque usager OCC correspond à un événement
            // On garde un statut "active" si la date de l'événement est future (pour la couleur)
            status: event.date_evenement && new Date(event.date_evenement) > new Date() ? 'active' : 'inactive',
            color: event.date_evenement && new Date(event.date_evenement) > new Date() ? '#4CAF50' : '#ff9800',
            // Représentant : on utilise demandeur ou representant_par
            representant: event.demandeur || event.representant_par || 'Non spécifié',
            // Organisateurs : on garde le champ organisateurs
            organisateurs: event.organisateurs || 'Non spécifié',
            duration: event.created_at ? `${Math.floor((new Date() - new Date(event.created_at)) / (1000 * 60 * 60 * 24 * 30))} mois` : 'Nouveau',
            phone: event.telephone || 'Non spécifié',
            email: event.email || 'Non spécifié',
            address: event.adresse || event.lieu_evenement || 'Non spécifié',
            memberSince: event.created_at ? new Date(event.created_at).getFullYear() : '2024',
            nom_evenement: event.nom_evenement,
            date_evenement: event.date_evenement,
            lieu_evenement: event.lieu_evenement,
            genre_manifestation: event.genre_manifestation,
            artistesList: event.artistesList || [],
            region: event.region || 'N/A'
          };
        });

        setUsers(formattedUsers);
        if (formattedUsers.length > 0) {
          setSelectedUser(formattedUsers[0]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement des usagers:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentUser = selectedUser || (users.length > 0 ? users[0] : null);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.representant && user.representant.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <>
        <Header />
        <Sidebar />
        <MiniSidebar />
        <main className="contenu">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div className="spinner"></div>
            <p>Chargement des usagers...</p>
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
        <section>
          <div className="OM15T"></div>
        </section>

        <section>
          <fieldset>
            <legend style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} />
              Gestion des usagers occasionnels
            </legend>

            <div className="type-selection-container">
              <div className="type-selection-header">
                <div className="type-selector-wrapper">
                  <div className="type-selector-icon">
                    <FileText size={20} />
                  </div>
                  <select
                    className="type-selector"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="OCC">🎪 Occasionnelle</option>
                    <option value="Bus">🚌 Bus</option>
                    <option value="Grand Surface">🏪 Grand Surface</option>
                    <option value="Night club">🎭 Night Club</option>
                    <option value="Télé/Radio">📺 Télé/Radio</option>
                    <option value="Hôtel">🏨 Hôtel</option>
                  </select>
                  <div className="type-selector-arrow">▼</div>
                </div>

                <button
                  className="btn-new"
                  type="button"
                  onClick={() => navigate('/date_occ')}
                >
                  <PlusCircle size={18} className="btn-new-icon" />
                  <span className="btn-new-text">Nouveau</span>
                </button>
              </div>

              <div className="type-status-bar">
                <div className="status-item">
                  <span className="status-icon">
                    <Pin size={16} />
                  </span>
                  <span className="status-label">Type sélectionné :</span>
                  <span className="status-value badge">Occasionnelle</span>
                </div>
                <div className="status-divider"></div>
                <div className="status-item">
                  <span className="status-icon">
                    <BarChart3 size={16} />
                  </span>
                  <span className="status-label">Nombre total :</span>
                  <span className="status-value step-number">{users.length} usagers</span>
                </div>
              </div>
            </div>

            <div className="stat_occ_ameliore">
              <br />

              <div className="two-column-container">
                {/* COLONNE GAUCHE - Liste des usagers */}
                <div className="users-list-column fixed-list">
                  <div className="list-header-modern">
                    <h2>
                      <Users size={20} className="icon" />
                      Liste des usagers
                    </h2>
                    <div className="search-box-modern">
                      <input
                        type="text"
                        placeholder="Rechercher un usager..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <span className="user-count">{filteredUsers.length} usagers</span>
                  </div>

                  <div className="users-container">
                    {currentUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="user-avatar" style={{ background: user.color }}>
                          {user.initials}
                        </div>
                        <div className="user-info">
                          <h3 className="user-name">{user.name}</h3>
                          <p className="user-type">{user.type}</p>
                          <div className="user-stats-mini">
                            <span className="stat-badge">
                              <Music size={12} style={{ marginRight: 4 }} />
                              {user.artists} artistes
                            </span>
                            <span className="stat-badge">
                              <Calendar size={12} style={{ marginRight: 4 }} />
                              {user.eventsCount} événement{user.eventsCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="user-status">
                          {/* Badge simplifié : juste le nombre d'événements, sans hover */}
                          <span className="status-badge event-count">
                            <Calendar size={12} style={{ marginRight: 4 }} />
                            {user.eventsCount} événement{user.eventsCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination-modern">
                      <button
                        className="page-prev"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
                          onClick={() => goToPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="page-next"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* COLONNE DROITE - Détail d'un usager */}
                <div className="user-detail-column">
                  <div className="detail-header-modern">
                    <h2>
                      <FileText size={20} className="icon" />
                      Fiche détaillée
                    </h2>
                    <div className="detail-actions">
                      <button className="icon-btn" title="Modifier">
                        <Edit size={18} />
                      </button>
                      <button className="icon-btn" title="Imprimer">
                        <Printer size={18} />
                      </button>
                      <button className="icon-btn" title="Exporter">
                        <Upload size={18} />
                      </button>
                    </div>
                  </div>

                  {currentUser ? (
                    <div className="user-profile-card">
                      <div className="profile-header">
                        <div
                          className="profile-avatar-large"
                          style={{ background: currentUser.color }}
                        >
                          {currentUser.initials}
                        </div>
                        <div className="profile-title-section">
                          <h1 className="profile-name">{currentUser.name}</h1>
                          <p className="profile-category">{currentUser.type}</p>
                          <div className="profile-badges">
                            <span className="badge-blue">
                              <Clock size={14} style={{ marginRight: 4 }} />
                              Membre depuis {currentUser.memberSince}
                            </span>
                            <span className="badge-event-count">
                              <Calendar size={14} style={{ marginRight: 4 }} />
                              {currentUser.eventsCount} événement{currentUser.eventsCount > 1 ? 's' : ''} à organiser
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="profile-details-grid">
                        <div className="detail-card">
                          <h3 className="detail-card-title">
                            <span>
                              <User size={16} style={{ marginRight: 6 }} />
                              Informations générales
                            </span>
                            <button className="edit-small">
                              <Edit size={14} />
                            </button>
                          </h3>
                          <div className="detail-content">
                            <div className="detail-row">
                              <span className="detail-label">Organisateurs :</span>
                              <span className="detail-value">{currentUser.organisateurs}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Représentant :</span>
                              <span className="detail-value">{currentUser.representant}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Événement :</span>
                              <span className="detail-value">{currentUser.nom_evenement || '-'}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Genre :</span>
                              <span className="detail-value">{currentUser.genre_manifestation || '-'}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Date événement :</span>
                              <span className="detail-value">
                                {currentUser.date_evenement
                                  ? new Date(currentUser.date_evenement).toLocaleDateString()
                                  : '-'}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Lieu :</span>
                              <span className="detail-value">{currentUser.lieu_evenement || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="detail-card">
                          <h3 className="detail-card-title">
                            <span>
                              <MapPin size={16} style={{ marginRight: 6 }} />
                              Coordonnées
                            </span>
                            <button className="edit-small">
                              <Edit size={14} />
                            </button>
                          </h3>
                          <div className="detail-content">
                            <div className="detail-row">
                              <span className="detail-label">
                                <Phone size={14} style={{ marginRight: 4 }} /> Téléphone :
                              </span>
                              <span className="detail-value">{currentUser.phone}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">
                                <Mail size={14} style={{ marginRight: 4 }} /> Email :
                              </span>
                              <span className="detail-value">{currentUser.email}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">
                                <Home size={14} style={{ marginRight: 4 }} /> Adresse :
                              </span>
                              <span className="detail-value">{currentUser.address}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">
                                <MapPin size={14} style={{ marginRight: 4 }} /> Région :
                              </span>
                              <span className="detail-value">{currentUser.region}</span>
                            </div>
                          </div>
                        </div>

                        <div className="detail-card full-width">
                          <h3 className="detail-card-title">
                            <span>
                              <Music size={16} style={{ marginRight: 6 }} />
                              Artistes participants
                            </span>
                            <span className="badge-count">{currentUser.artistesList.length} artistes</span>
                          </h3>
                          <div className="events-list">
                            {currentUser.artistesList && currentUser.artistesList.length > 0 ? (
                              currentUser.artistesList.map((artist, index) => (
                                <div key={index} className="event-item">
                                  <span className="event-name">
                                    {artist.nom} {artist.prenom || ''}
                                  </span>
                                  <span className="event-artists">{artist.role || 'Artiste'}</span>
                                  <span className="event-status done">
                                    {artist.nombre_chansons
                                      ? `${artist.nombre_chansons} chansons`
                                      : 'Participant'}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="event-item">
                                <span className="event-name">Aucun artiste enregistré</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="profile-footer-actions">
                        <button
                          className="btn-modern secondary"
                          onClick={() => navigate('/paiement')}
                        >
                          <CreditCard size={18} style={{ marginRight: 6 }} />
                          Gestion paiements
                        </button>
                        <button
                          className="btn-modern outline"
                          onClick={() => navigate('/dashboard')}
                        >
                          <ArrowLeft size={18} style={{ marginRight: 6 }} />
                          Retour
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="user-profile-card">
                      <div className="profile-header">
                        <div className="profile-title-section">
                          <h1 className="profile-name">Aucun usager sélectionné</h1>
                          <p className="profile-category">
                            Veuillez sélectionner un usager dans la liste
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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