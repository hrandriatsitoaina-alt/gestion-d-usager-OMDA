import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/date_occ.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const date_occ = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  // Sample events data
  const events = [
    {
      id: 1,
      title: "IVENCO",
      month: "DÉCEMBRE 2026",
      events: [
        { date: "SAM 20", location: "Palais de sport - Ambondrona" },
        { date: "LUNDI 18", location: "Antsahamanitra - Zakay" },
        { date: "SAMEDI 06", location: "HAVORIA - Mahaleo" }
      ]
    },
    {
      id: 2,
      title: "BEMOZIKA",
      month: "NOVEMBRE 2026",
      events: [
        { date: "MARDI 10", location: "MAHAMASINA - 16*12" },
        { date: "SAMEDI 31", location: "Kianja Maintso - Routo" },
        { date: "LUNDI 27", location: "Bevalala - Elidio, Rauto, Paris" }
      ]
    },
    {
      id: 3,
      title: "IVENCO",
      month: "OCTOBRE 2026",
      events: [
        { date: "SAM 20", location: "Palais de sport - Ambondrona" },
        { date: "LUNDI 18", location: "Antsahamanitra - Zakay" },
        { date: "SAMEDI 06", location: "HAVORIA - Mahaleo" }
      ]
    },
    {
      id: 4,
      title: "MAKIPROD",
      month: "SEPTEMBRE 2026",
      events: [
        { date: "SAM 20", location: "Palais de sport - Ambondrona" },
        { date: "LUNDI 18", location: "Antsahamanitra - Zakay" },
        { date: "SAMEDI 06", location: "HAVORIA - Mahaleo" }
      ]
    }
  ];

  // Filter events based on search term and date filters
  const filteredEvents = events.filter(event => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.events.some(e => 
        e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.date.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Date filters (if any selected)
    let matchesDate = true;
    if (selectedMonth && selectedMonth !== '') {
      matchesDate = event.month.toLowerCase().includes(selectedMonth.toLowerCase());
    }
    if (selectedYear && selectedYear !== '') {
      matchesDate = matchesDate && event.month.includes(selectedYear);
    }

    return matchesSearch && matchesDate;
  });

  const handleSearch = () => {
    // Search is already handled by the filter, but you can add additional logic here
    console.log('Searching for:', searchTerm);
  };

  const handleReturn = () => {
    navigate('/dashboard');
  };

  const handleGraphClick = (e) => {
    e.preventDefault();
    // Add graph view logic here
    console.log('View graph clicked');
  };

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />

      <main className="contenu">
        <section className="stats-section">
          <div className="stats-card">
            <div className="stats-title">
              <h2>OMDA : <span className="highlight">OCCASIONNELLE</span></h2>
            </div>
            <div className="stats-numbers">
              <div className="stat-item">
                <h3><span className="stat-value">100</span> <span className="stat-label">Événements</span></h3>
              </div>
              <div className="stat-item">
                <h3><span className="stat-value">500</span> <span className="stat-label">Organisateurs</span></h3>
              </div>
              <div className="stat-item">
                <h3><span className="stat-value">900</span> <span className="stat-label">Lieux</span></h3>
              </div>
              <button className="btn-modern outline" onClick={() => navigate('/autre-usager')}>← Retour</button>

            </div>
          </div>
        </section>

        <section className="filters-section">
          <div className="filters-container">
            <div className="date-filters">
              <div className="filter-group">
                {/* <label>Bilan date :</label> */}
                <select 
                  className="form-select" 
                  aria-label="Jour"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                >
                  <option value="">Jour</option>
                  {[...Array(31)].map((_, i) => (
                    <option key={i+1} value={i+1}>
                      {String(i+1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <select 
                  className="form-select" 
                  aria-label="Mois"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
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
              </div>
              
              <div className="filter-group">
                <select 
                  className="form-select" 
                  aria-label="Année"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">Année</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>
            
            <div className="global-bilan">
              <span className="bilan-label">Bilan global :</span>
              <div className="year-selectors">
                <select 
                  className="form-select small" 
                  aria-label="Année début"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                >
                  <option value="">Année début</option>
                  <option value="2030">2030</option>
                  <option value="2029">2029</option>
                  <option value="2028">2028</option>
                  <option value="2027">2027</option>
                </select>
                <select 
                  className="form-select small" 
                  aria-label="Année fin"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                >
                  <option value="">Année fin</option>
                  <option value="2030">2030</option>
                  <option value="2029">2029</option>
                  <option value="2028">2028</option>
                  <option value="2027">2027</option>
                </select>
              </div>
              <a href="#" className="graph-link" onClick={handleGraphClick}>
                <i className="fas fa-chart-bar"></i> Voir graphique
              </a>
            </div>
          </div>
          
          <div className="search-bar">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Rechercher par titre, mois ou lieu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch}>
              <i className="fas fa-search"></i> Rechercher
            </button>
          </div>
        </section>

        <section className="events-section">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <div className="event-card" key={event.id}>
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <div className="divider"></div>
                  <h4>{event.month}</h4>
                </div>
                <div className="event-details">
                  {event.events.map((item, index) => (
                    <React.Fragment key={index}>
                      <div className="event-item">
                        <div className="event-date">{item.date}</div>
                        <div className="event-location">{item.location}</div>
                      </div>
                      {index < event.events.length - 1 && <div className="separator"></div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>Aucun événement trouvé pour votre recherche.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default date_occ;