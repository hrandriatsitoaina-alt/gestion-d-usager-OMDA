// src/pages/date_occ.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/date_occ.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const DateOcc = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regionsDisponibles, setRegionsDisponibles] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const joursCourt = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    return `${joursCourt[date.getDay()]} ${date.getDate()}`;
  };

  const formatDateComplete = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getMonthName = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const mois = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
    return mois[date.getMonth()];
  };

  const extractAvailableYears = (eventsList) => {
    const years = new Set();
    eventsList.forEach(event => {
      if (event.date_evenement) {
        const date = new Date(event.date_evenement);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Chargement des régions
  const loadRegions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/regions');
      const data = await response.json();
      if (data.success) {
        setRegionsDisponibles(data.regions || []);
      }
    } catch (error) {
      console.error('Erreur chargement régions:', error);
    }
  };

  const fetchOccasionnels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/usagers/occasionnels');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success && data.events) {
        setEvents(data.events);
        const years = extractAvailableYears(data.events);
        setAvailableYears(years);
      } else {
        setEvents([]);
        setAvailableYears([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les données.');
      setEvents([]);
      setAvailableYears([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegions();
    fetchOccasionnels();
  }, []);

  const groupEventsByDenominationAndMonth = (eventsList) => {
    if (!eventsList || eventsList.length === 0) return [];
    const grouped = {};
    
    eventsList.forEach(event => {
      const raisonSociale = event.denomination || 'Sans dénomination';
      let monthYearKey = '', monthName = '', year = '';
      if (event.date_evenement) {
        const date = new Date(event.date_evenement);
        if (!isNaN(date.getTime())) {
          monthName = getMonthName(event.date_evenement);
          year = date.getFullYear().toString();
          monthYearKey = `${monthName} ${year}`;
        } else {
          monthYearKey = 'Date non spécifiée';
          monthName = 'DATE NON SPÉCIFIÉE';
        }
      } else {
        monthYearKey = 'Date non spécifiée';
        monthName = 'DATE NON SPÉCIFIÉE';
      }
      
      if (!grouped[raisonSociale]) grouped[raisonSociale] = {};
      if (!grouped[raisonSociale][monthYearKey]) {
        grouped[raisonSociale][monthYearKey] = { monthName, year, events: [] };
      }
      
      const allArtists = event.artistesList || [];
      
      grouped[raisonSociale][monthYearKey].events.push({
        id: event.id,
        date: formatDate(event.date_evenement),
        dateComplete: formatDateComplete(event.date_evenement),
        dateOriginal: event.date_evenement,
        lieu: event.lieu_evenement || 'Lieu non spécifié',
        artistesList: allArtists,
        nomEvenement: event.nom_evenement || event.denomination || 'Événement sans nom',
        demandeur: event.demandeur || '',
        telephone: event.telephone || '',
        email: event.email || '',
        denomination: event.denomination || '',
        region: event.region || '',
        genre: event.genre_manifestation || '',
        montant_total: event.montant_total || 0
      });
    });
    
    const result = [];
    Object.keys(grouped).forEach(raisonSociale => {
      Object.keys(grouped[raisonSociale]).forEach(monthKey => {
        grouped[raisonSociale][monthKey].events.sort((a, b) => new Date(a.dateOriginal) - new Date(b.dateOriginal));
        result.push({ 
          raisonSociale, 
          monthYear: monthKey, 
          monthName: grouped[raisonSociale][monthKey].monthName, 
          events: grouped[raisonSociale][monthKey].events 
        });
      });
    });
    result.sort((a, b) => {
      if (a.events.length === 0 || b.events.length === 0) return 0;
      return new Date(b.events[0].dateOriginal) - new Date(a.events[0].dateOriginal);
    });
    return result;
  };

  const normalizeId = (input) => {
    if (!input) return null;
    const str = input.toString().trim();
    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
  };

  const findEventById = (id) => {
    const normalizedId = normalizeId(id);
    if (normalizedId === null) return null;
    return events.find(event => event.id === normalizedId);
  };

  const getFilteredEvents = () => {
    if (!events || events.length === 0) return [];
    let filtered = [...events];
    
    if (referenceId && referenceId.trim() !== '') {
      const foundEvent = findEventById(referenceId);
      if (foundEvent) {
        return groupEventsByDenominationAndMonth([foundEvent]);
      } else {
        return [];
      }
    }
    
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(event => {
        const artistesMatch = (event.artistesList || []).some(a => 
          (a.nom && a.nom.toLowerCase().includes(searchLower)) || 
          (a.prenom && a.prenom.toLowerCase().includes(searchLower))
        );
        return (
          (event.denomination && event.denomination.toLowerCase().includes(searchLower)) ||
          (event.demandeur && event.demandeur.toLowerCase().includes(searchLower)) ||
          (event.nom_evenement && event.nom_evenement.toLowerCase().includes(searchLower)) ||
          (event.lieu_evenement && event.lieu_evenement.toLowerCase().includes(searchLower)) ||
          (event.genre_manifestation && event.genre_manifestation.toLowerCase().includes(searchLower)) ||
          artistesMatch
        );
      });
    }

    if (selectedRegion && selectedRegion !== '') {
      filtered = filtered.filter(event => event.region === selectedRegion);
    }

    if (selectedDay && selectedDay !== '') {
      filtered = filtered.filter(event => {
        if (!event.date_evenement) return false;
        return new Date(event.date_evenement).getDate() === parseInt(selectedDay);
      });
    }

    if (selectedMonth && selectedMonth !== '') {
      const moisMap = { 'janvier':0, 'février':1, 'mars':2, 'avril':3, 'mai':4, 'juin':5, 'juillet':6, 'août':7, 'septembre':8, 'octobre':9, 'novembre':10, 'décembre':11 };
      const moisNum = moisMap[selectedMonth.toLowerCase()];
      filtered = filtered.filter(event => {
        if (!event.date_evenement) return false;
        return new Date(event.date_evenement).getMonth() === moisNum;
      });
    }

    if (selectedYear && selectedYear !== '') {
      filtered = filtered.filter(event => {
        if (!event.date_evenement) return false;
        return new Date(event.date_evenement).getFullYear() === parseInt(selectedYear);
      });
    }

    if (startYear && startYear !== '') {
      filtered = filtered.filter(event => {
        if (!event.date_evenement) return false;
        return new Date(event.date_evenement).getFullYear() >= parseInt(startYear);
      });
    }

    if (endYear && endYear !== '') {
      filtered = filtered.filter(event => {
        if (!event.date_evenement) return false;
        return new Date(event.date_evenement).getFullYear() <= parseInt(endYear);
      });
    }

    return groupEventsByDenominationAndMonth(filtered);
  };

  const handleSearch = (e) => { if (e) e.preventDefault(); };
  
  const handleReset = () => { 
    setSearchTerm(''); 
    setReferenceId('');
    setSelectedDay(''); 
    setSelectedMonth(''); 
    setSelectedYear(''); 
    setStartYear(''); 
    setEndYear(''); 
    setSelectedRegion('');
  };

  const filteredEvents = getFilteredEvents();
  const totalEvents = events.length;
  const uniqueRaisonSociale = new Set(events.map(e => e.denomination).filter(Boolean));
  const uniqueLieux = new Set(events.map(e => e.lieu_evenement).filter(Boolean));
  
  const yearOptions = availableYears.length > 0 ? availableYears : [];
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  const openModal = (event) => {
    setSelectedEvent(event);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedEvent(null);
    document.body.style.overflow = 'auto';
  };

  const getAllArtistsNames = (artistesList) => {
    if (!artistesList || artistesList.length === 0) return 'Aucun artiste';
    return artistesList.map(artist => artist.nom).join(', ');
  };

  // Vérifier le statut d'un événement
  const getEventStatus = (dateOriginal) => {
    if (!dateOriginal) return 'unknown';
    const eventDate = new Date(dateOriginal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculer la différence en jours
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'passed'; // Passé - Rouge
    } else if (diffDays === 0) {
      return 'today'; // Aujourd'hui - Vert
    } else if (diffDays <= 5) {
      return 'near'; // Proche (5 jours) - Vert
    } else {
      return 'upcoming'; // Futur - Jaune
    }
  };

  const getEventBadge = (status) => {
    switch(status) {
      case 'passed':
        return <span className="event-badge passed">🔴 Passé</span>;
      case 'today':
        return <span className="event-badge today">🟢 Aujourd'hui</span>;
      case 'near':
        return <span className="event-badge near">🟢 Proche</span>;
      case 'upcoming':
        return <span className="event-badge upcoming">🟡 Futur</span>;
      default:
        return null;
    }
  };

  // Trier les événements : futurs en haut, passés en bas
  const sortEventsByStatus = (eventsList) => {
    return [...eventsList].sort((a, b) => {
      const dateA = new Date(a.dateOriginal);
      const dateB = new Date(b.dateOriginal);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const aPassed = dateA < today;
      const bPassed = dateB < today;
      
      // Les événements futurs passent en premier
      if (aPassed && !bPassed) return 1;
      if (!aPassed && bPassed) return -1;
      
      // Si même statut, trier par date
      return dateA - dateB;
    });
  };

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      <main className="contenu">
        {/* ===== HEADER SIMPLIFIÉ ===== */}
        <div className="header-simplified">
          <div className="header-left">
            <div className="header-title">
              <h1>🎪 OMDA : <span>OCCASIONNELLES</span></h1>
              <div className="header-stats">
                <span className="stat-badge"><strong>{totalEvents}</strong> Événements</span>
                <span className="stat-badge"><strong>{uniqueRaisonSociale.size}</strong> Organisations</span>
                <span className="stat-badge"><strong>{uniqueLieux.size}</strong> Lieux</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <button className="btn-retour" onClick={() => navigate('/dashboard')}>← Retour</button>
          </div>
        </div>

        {/* ===== FILTRES ===== */}
        <section className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>📅 Bilan global</label>
              <div className="filter-group-inline">
                <select className="form-select small" value={startYear} onChange={(e) => setStartYear(e.target.value)}>
                  <option value="">Année début</option>
                  {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <select className="form-select small" value={endYear} onChange={(e) => setEndYear(e.target.value)}>
                  <option value="">Année fin</option>
                  {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label>📆 Date</label>
              <div className="filter-group-inline">
                <select className="form-select" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                  <option value="">Jour</option>
                  {dayOptions.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                <select className="form-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">Mois</option>
                  <option value="janvier">Janvier</option>
                  <option value="février">Février</option>
                  <option value="mars">Mars</option>
                  <option value="avril">Avril</option>
                  <option value="mai">Mai</option>
                  <option value="juin">Juin</option>
                  <option value="juillet">Juillet</option>
                  <option value="août">Août</option>
                  <option value="septembre">Septembre</option>
                  <option value="octobre">Octobre</option>
                  <option value="novembre">Novembre</option>
                  <option value="décembre">Décembre</option>
                </select>
                <select className="form-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  <option value="">Année</option>
                  {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label>📍 Région</label>
              <select className="form-select" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
                <option value="">Toutes les régions</option>
                {regionsDisponibles.map(region => (
                  <option key={region.id} value={region.nom}>{region.nom}</option>
                ))}
              </select>
            </div>

            <div className="filter-group filter-actions">
              <label>&nbsp;</label>
              <button className="btn-reset" onClick={handleReset}>🔄 Réinitialiser</button>
            </div>
          </div>

          <div className="search-bar">
            <div className="search-normal">
              <span className="search-icon"></span>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Rechercher par nom, lieu, artiste..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <button className="search-btn" onClick={handleSearch}>Rechercher</button>
            
            <div className="reference-search">
              <span className="reference-label">📌 Réf :</span>
              <input 
                type="text" 
                className="reference-input" 
                placeholder="ID événement" 
                value={referenceId} 
                onChange={(e) => setReferenceId(e.target.value)} 
              />
            </div>
          </div>
        </section>

        {/* ===== ÉVÉNEMENTS ===== */}
        <section className="events-section">
          {loading ? (
            <div className="loading-container"><div className="spinner"></div><p>Chargement...</p></div>
          ) : error ? (
            <div className="error-container"><p className="error-message">❌ {error}</p><button className="btn-modern" onClick={fetchOccasionnels}>Réessayer</button></div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((eventGroup, idx) => {
              const sortedEvents = sortEventsByStatus(eventGroup.events);
              
              return (
                <div className="event-card" key={idx}>
                  <div className="event-header">
                    <h3>{eventGroup.raisonSociale}</h3>
                    <h4>{eventGroup.monthYear}</h4>
                  </div>
                  <div className="event-details">
                    {sortedEvents.map((item) => {
                      const status = getEventStatus(item.dateOriginal);
                      
                      return (
                        <div key={item.id} className={`event-item event-${status}`}>
                          <div className="event-info-line">
                            <span className="info-text">📅 {item.date}</span>
                            <span className="info-text">📍 {item.lieu}</span>
                            <span className="info-text event-name">📝 {item.nomEvenement}</span>
                            <span className="info-text event-artist">🎤 {getAllArtistsNames(item.artistesList)}</span>
                            <span className="info-text">👤 {item.demandeur}</span>
                            {getEventBadge(status)}
                            <button className="view-more-btn" onClick={() => openModal(item)}>▼</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results">
              <p>{referenceId ? `Aucun événement trouvé avec la référence ${referenceId}` : 'Aucun événement trouvé.'}</p>
            </div>
          )}
        </section>
      </main>

      {/* ===== MODAL ===== */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Détails - Réf: {selectedEvent.id}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h4>🎪 ÉVÉNEMENT</h4>
                <div className="modal-row"><strong>🔢 Référence :</strong> <span>{selectedEvent.id}</span></div>
                <div className="modal-row"><strong>📅 Date :</strong> <span>{selectedEvent.dateComplete}</span></div>
                <div className="modal-row"><strong>📍 Lieu :</strong> <span>{selectedEvent.lieu}</span></div>
                <div className="modal-row"><strong>📝 Nom :</strong> <span>{selectedEvent.nomEvenement}</span></div>
                <div className="modal-row"><strong>🎭 Genre :</strong> <span>{selectedEvent.genre || 'Non spécifié'}</span></div>
                <div className="modal-row"><strong>📍 Région :</strong> <span>{selectedEvent.region || 'Non spécifiée'}</span></div>
                <div className="modal-row"><strong>💰 Montant :</strong> <span>{(selectedEvent.montant_total || 0).toLocaleString()} Ar</span></div>
              </div>
              
              <div className="modal-section">
                <h4>👤 ORGANISATEUR</h4>
                <div className="modal-row"><strong>🏢 Organisation :</strong> <span>{selectedEvent.denomination}</span></div>
                <div className="modal-row"><strong>👤 Organisateur :</strong> <span>{selectedEvent.demandeur}</span></div>
                <div className="modal-row"><strong>📞 Téléphone :</strong> <span>{selectedEvent.telephone || 'Non renseigné'}</span></div>
                <div className="modal-row"><strong>📧 Email :</strong> <span>{selectedEvent.email || 'Non renseigné'}</span></div>
              </div>
              
              {selectedEvent.artistesList && selectedEvent.artistesList.length > 0 && (
                <div className="modal-section">
                  <h4>🎤 ARTISTES</h4>
                  {selectedEvent.artistesList.map((artist, i) => (
                    <div key={i} className="artist-modal-item">
                      <span className="artist-name">{artist.nom} {artist.prenom || ''}</span>
                      {artist.role && <span className="artist-role">🎭 {artist.role}</span>}
                      {artist.nombre_chansons && <span className="artist-chansons">🎵 {artist.nombre_chansons} chansons</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-btn" onClick={closeModal}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DateOcc;