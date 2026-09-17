// src/pages/repartition_artister.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Calendar, DollarSign, Search, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, X, Music, CalendarDays, TrendingUp,
  BarChart3, List, RefreshCw, ArrowLeft, Home, User, Clock,
  CheckCircle, AlertCircle, Building, MapPin, Phone, Mail,
  FileText, Hash, ChevronDown, BookOpen, Download, Loader2
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/repartition_artister.css';
import { generateArtistePDF } from './pdf/artiste_pdf';

const RepartitionArtister = () => {
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vue, setVue] = useState('repartition');
  const [pageCourante, setPageCourante] = useState(1);
  const [itemsParPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [evenementSelectionne, setEvenementSelectionne] = useState(null);
  const [recapMensuel, setRecapMensuel] = useState([]);
  const [recapAnnuel, setRecapAnnuel] = useState({});
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());
  const [moisSelectionne, setMoisSelectionne] = useState(null);
  const [moisActuel, setMoisActuel] = useState(new Date().getMonth() + 1);
  const [anneeActuelle, setAnneeActuelle] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    totalEvenements: 0,
    totalArtistes: 0,
    totalMontant: 0
  });

  const [filtreAnnee, setFiltreAnnee] = useState('');
  const [filtreMois, setFiltreMois] = useState('');
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

  const [responsable, setResponsable] = useState('');
  const [lieuAgence, setLieuAgence] = useState('Antananarivo');
  const [dateDelivre, setDateDelivre] = useState(new Date().toLocaleDateString('fr-FR'));
  const [dateRetour, setDateRetour] = useState('');
  const [showPDFOptions, setShowPDFOptions] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const pdfOptionsRef = useRef(null);

  const navigate = useNavigate();
  const API_BASE = 'http://localhost:3001/api';
  const API_REPARTITION = 'http://localhost:3001/api/repartition';

  // ============================================================
  // ✅ MONTANT TOTAL
  // ============================================================
  const getMontantTotal = (event) => {
    const total = parseFloat(event.montant_total);
    if (!isNaN(total) && total > 0) return total;

    const m = parseFloat(event.montant);
    if (!isNaN(m) && m > 0) return m;

    return 0;
  };

  const getMontantDetail = (event) => {
    const base = parseFloat(event.montant_base) || 0;
    const frais = parseFloat(event.frais_dossier) || 0;
    const penalite = parseFloat(event.montant_retard) || 0;
    return { base, frais, penalite, total: getMontantTotal(event) };
  };

  const getMoisOptions = () => [
    { value: '01', label: 'Janvier' }, { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' }, { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' }, { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' }, { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' }, { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
  ];

  useEffect(() => {
    fetchEvenements();
    fetchStats();
  }, []);

  useEffect(() => {
    if (evenements.length > 0) {
      calculerRecapMensuel();
      calculerRecapAnnuel();
      extraireAnneesDisponibles();
      const moisKey = `${anneeActuelle}-${String(moisActuel).padStart(2, '0')}`;
      setMoisSelectionne(moisKey);
    }
  }, [evenements]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pdfOptionsRef.current && !pdfOptionsRef.current.contains(event.target)) {
        setShowPDFOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const extraireAnneesDisponibles = () => {
    const years = new Set();
    evenements.forEach(event => {
      if (event.date_event) {
        years.add(new Date(event.date_event).getFullYear());
      }
    });
    setAnneesDisponibles(Array.from(years).sort((a, b) => b - a));
  };

  const getLieu = (event) => {
    const champsLieu = [
      event.lieu_evenement, event.lieu, event.lieu_spectacle,
      event.adresse, event.lieu_manifestation, event.ville,
      event.commune, event.district, event.region,
      event.localisation, event.emplacement
    ];
    for (const champ of champsLieu) {
      if (champ && typeof champ === 'string' && champ.trim() !== '' &&
          champ !== 'Non spécifié' && champ !== 'null' && champ !== 'undefined') {
        return champ.trim();
      }
    }
    return 'Non spécifié';
  };

  const getLieuDisplay = (event) => getLieu(event);

  // ============================================================
  // ✅ FETCH ÉVÉNEMENTS avec ordre des artistes CORRIGÉ
  // ============================================================
  const fetchEvenements = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Récupération des événements OCC...');
      const response = await axios.get(`${API_REPARTITION}/occ/events`);
      console.log('✅ Événements reçus:', response.data);

      if (response.data.success) {
        let eventsData = response.data.evenements || [];

        // ✅ CORRECTION : Utiliser la route /occ/artistes/details/:id
        //    (au lieu de /repartition/occ/artistes/details/:id)
        //    Cette route renvoie l'artiste principal EN PREMIER
        const eventsWithArtists = await Promise.all(
          eventsData.map(async (event) => {
            try {
              const artistResponse = await axios.get(
                `${API_BASE}/occ/artistes/details/${event.id}`
              );
              
              // ✅ Utiliser `artistesNames` fourni par le backend (déjà ordonné)
              const artistesNames = artistResponse.data.artistesNames || [];
              const artistesString = artistResponse.data.artistesString 
                || artistesNames.join(', ') 
                || event.artistes 
                || '';
              const artistesList = artistResponse.data.artistes || [];
              const artistesCount = artistResponse.data.count || artistesNames.length;

              console.log(`🎵 Événement ${event.id} - Artistes (ordonnés):`, artistesNames);

              return {
                ...event,
                artistes: artistesList,
                artistesNames: artistesNames,
                artistesString: artistesString,
                artistesCount: artistesCount
              };
            } catch (err) {
              console.warn(`⚠️ Erreur artistes pour event ${event.id}:`, err.message);
              return {
                ...event,
                artistes: [],
                artistesNames: [],
                artistesString: event.artistes || '',
                artistesCount: 0
              };
            }
          })
        );

        const sortedEvents = eventsWithArtists.sort((a, b) => {
          if (!a.date_event) return 1;
          if (!b.date_event) return -1;
          return new Date(b.date_event) - new Date(a.date_event);
        });

        console.log(`✅ ${sortedEvents.length} événements récupérés`);
        setEvenements(sortedEvents);
        if (sortedEvents.length > 0) setEvenementSelectionne(sortedEvents[0]);
      } else {
        setError(response.data.message || 'Erreur');
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_REPARTITION}/stats`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('❌ Erreur stats:', err);
    }
  };

  const calculerRecapMensuel = () => {
    const months = {};
    evenements.forEach(event => {
      if (event.date_event) {
        const date = new Date(event.date_event);
        const mois = date.getMonth() + 1;
        const annee = date.getFullYear();
        const key = `${annee}-${String(mois).padStart(2, '0')}`;

        if (!months[key]) {
          months[key] = {
            mois, annee, key,
            totalEvenements: 0, totalArtistes: 0,
            totalMontant: 0, evenements: []
          };
        }
        months[key].totalEvenements += 1;
        months[key].totalArtistes += event.artistesCount || 0;
        months[key].totalMontant += getMontantTotal(event);
        months[key].evenements.push(event);
      }
    });
    setRecapMensuel(Object.values(months).sort((a, b) => a.key.localeCompare(b.key)));
  };

  const calculerRecapAnnuel = () => {
    const years = {};
    evenements.forEach(event => {
      if (event.date_event) {
        const annee = new Date(event.date_event).getFullYear();
        if (!years[annee]) {
          years[annee] = { annee, totalEvenements: 0, totalArtistes: 0, totalMontant: 0 };
        }
        years[annee].totalEvenements += 1;
        years[annee].totalArtistes += event.artistesCount || 0;
        years[annee].totalMontant += getMontantTotal(event);
      }
    });
    setRecapAnnuel(years);
  };

  const formatMontant = (montant) => {
    if (!montant && montant !== 0) return '0';
    return new Intl.NumberFormat('fr-FR').format(montant);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    } catch { return ''; }
  };

  const getMonthName = (m) => ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][m-1] || '';
  const getMonthShortName = (m) => ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'][m-1] || '';

  const filteredEvenements = evenements.filter(e => {
    const search = searchTerm.toLowerCase();
    const lieuValue = getLieuDisplay(e).toLowerCase();
    const matchSearch = (
      (e.demandeur && e.demandeur.toLowerCase().includes(search)) ||
      (e.denomination && e.denomination.toLowerCase().includes(search)) ||
      lieuValue.includes(search) ||
      (e.artistesString && e.artistesString.toLowerCase().includes(search)) ||
      (e.organisateurs && e.organisateurs.toLowerCase().includes(search))
    );
    if (!matchSearch) return false;
    if (filtreAnnee) {
      if (new Date(e.date_event).getFullYear() !== parseInt(filtreAnnee)) return false;
    }
    if (filtreMois) {
      const m = String(new Date(e.date_event).getMonth() + 1).padStart(2, '0');
      if (m !== filtreMois) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredEvenements.length / itemsParPage);
  const paginatedEvenements = filteredEvenements.slice(
    (pageCourante - 1) * itemsParPage,
    pageCourante * itemsParPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPageCourante(newPage);
  };

  const handleSelectEvenement = (event) => setEvenementSelectionne(event);

  const renderPageNumbers = () => {
    const numbers = [];
    const start = Math.max(1, pageCourante - 5);
    const end = Math.min(totalPages, pageCourante + 5);
    for (let i = start; i <= end; i++) numbers.push(i);
    return numbers;
  };

  const handleBackToDashboard = () => navigate('/dashboard');
  const handleRefresh = () => { fetchEvenements(); fetchStats(); };

  const getEvenementsFiltres = () => {
    if (!moisSelectionne) return evenements;
    return evenements.filter(e => {
      if (!e.date_event) return false;
      const date = new Date(e.date_event);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return key === moisSelectionne;
    });
  };

  const evenementsFiltres = getEvenementsFiltres();

  const resetFilters = () => {
    setFiltreAnnee(''); setFiltreMois(''); setSearchTerm(''); setPageCourante(1);
  };

  const handleGeneratePDF = () => {
    let eventsToExport = [];
    if (vue === 'recap' && moisSelectionne) {
      eventsToExport = evenementsFiltres;
    } else if (vue === 'recap' && !moisSelectionne) {
      eventsToExport = evenements.filter(e => {
        if (!e.date_event) return false;
        return new Date(e.date_event).getFullYear() === anneeSelectionnee;
      });
    } else {
      eventsToExport = paginatedEvenements;
    }

    if (eventsToExport.length === 0) {
      setGenerationMessage('⚠️ Aucun événement à générer');
      setTimeout(() => setGenerationMessage(''), 3000);
      return;
    }
    if (!responsable || responsable.trim() === '') {
      setGenerationMessage('⚠️ Veuillez saisir le nom du responsable');
      setTimeout(() => setGenerationMessage(''), 3000);
      return;
    }

    setIsGeneratingPDF(true);
    setShowPDFOptions(false);
    setGenerationMessage('🔄 Génération du PDF en cours...');

    try {
      let periode = 'mensuelle';
      let moisLabel = '';
      let anneeLabel = anneeSelectionnee;
      if (moisSelectionne) {
        const parts = moisSelectionne.split('-');
        moisLabel = getMonthName(parseInt(parts[1]));
        anneeLabel = parseInt(parts[0]);
      } else {
        periode = 'annuelle';
      }

      const pdfOptions = {
        mois: moisLabel,
        annee: anneeLabel,
        responsable: responsable.trim(),
        lieu: lieuAgence || 'Antananarivo',
        dateDelivre: dateDelivre || new Date().toLocaleDateString('fr-FR'),
        dateRetour: dateRetour || '',
        periode
      };

      const eventsForPDF = eventsToExport.map(ev => ({
        ...ev,
        montant: getMontantTotal(ev)
      }));

      const result = generateArtistePDF(eventsForPDF, pdfOptions);
      setGenerationMessage(result ? '✅ PDF généré !' : '❌ Erreur PDF');
      setTimeout(() => setGenerationMessage(''), 4000);
    } catch (error) {
      setGenerationMessage(`❌ Erreur: ${error.message}`);
      setTimeout(() => setGenerationMessage(''), 4000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderHeader = () => (
    <div className="repartition-header-professionnel">
      <div className="header-top">
        <div className="header-logo">
          <Music size={28} className="logo-icon" />
          <div>
            <h1>Répartition Artistes</h1>
            <span>Gestion des événements OCC</span>
          </div>
        </div>
        <div className="header-actions">
          <button className={`btn-header-action ${vue === 'repartition' ? 'active' : ''}`}
            onClick={() => { setVue('repartition'); setPageCourante(1); }}>
            <List size={16} /> Répartition
          </button>
          <button className={`btn-header-action ${vue === 'recap' ? 'active' : ''}`}
            onClick={() => { setVue('recap'); setPageCourante(1); }}>
            <BarChart3 size={16} /> Récapitulatif
          </button>
          <button className="btn-generate-pdf-header"
            onClick={() => setShowPDFOptions(!showPDFOptions)}
            disabled={filteredEvenements.length === 0 || isGeneratingPDF}>
            {isGeneratingPDF ? (<><Loader2 size={16} className="spinner-small" /> Génération...</>) : (<><Download size={16} /> PDF</>)}
          </button>
          <button className="btn-back-dashboard" onClick={handleBackToDashboard}>
            <ArrowLeft size={16} /><Home size={16} /><span>Dashboard</span>
          </button>
        </div>
      </div>

      {showPDFOptions && (
        <div className="pdf-options-dropdown" ref={pdfOptionsRef}>
          <div className="pdf-options-content">
            <h4><FileText size={16} /> Options PDF</h4>
            <div className="pdf-options-grid">
              <div className="pdf-option-group">
                <label>Responsable *</label>
                <input type="text" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nom du responsable" className="pdf-input" />
              </div>
              <div className="pdf-option-group">
                <label>Lieu de l'agence</label>
                <input type="text" value={lieuAgence} onChange={(e) => setLieuAgence(e.target.value)} className="pdf-input" />
              </div>
              <div className="pdf-option-group">
                <label>Date de délivrance</label>
                <input type="text" value={dateDelivre} onChange={(e) => setDateDelivre(e.target.value)} className="pdf-input" />
              </div>
              <div className="pdf-option-group">
                <label>Date de retour</label>
                <input type="text" value={dateRetour} onChange={(e) => setDateRetour(e.target.value)} className="pdf-input" />
              </div>
            </div>
            <div className="pdf-options-actions">
              <button className="btn-pdf-generate" onClick={handleGeneratePDF} disabled={isGeneratingPDF || !responsable.trim()}>
                {isGeneratingPDF ? (<><Loader2 size={16} className="spinner-small" /> Génération...</>) : (<><Download size={16} /> Générer le PDF</>)}
              </button>
              <button className="btn-pdf-cancel" onClick={() => setShowPDFOptions(false)}>Annuler</button>
            </div>
            {generationMessage && (
              <div className={`pdf-generation-message ${generationMessage.includes('✅') ? 'success' : generationMessage.includes('⚠️') ? 'warning' : 'info'}`}>
                {generationMessage}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="header-search">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Rechercher..." value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPageCourante(1); }} />
        </div>
        <div className="filter-wrapper">
          <select className="filter-select" value={filtreAnnee}
            onChange={(e) => { setFiltreAnnee(e.target.value); setPageCourante(1); }}>
            <option value="">Toutes les années</option>
            {anneesDisponibles.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="filter-select" value={filtreMois}
            onChange={(e) => { setFiltreMois(e.target.value); setPageCourante(1); }}>
            <option value="">Tous les mois</option>
            {getMoisOptions().map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {(filtreAnnee || filtreMois || searchTerm) && (
            <button className="btn-filter-reset" onClick={resetFilters}><X size={14} /></button>
          )}
        </div>
        <span className="total-badge"><Users size={14} />{filteredEvenements.length} événement(s)</span>
        <button className="btn-refresh" onClick={handleRefresh}><RefreshCw size={16} /></button>
      </div>
    </div>
  );

  const renderRepartition = () => (
    <div className="repartition-table-wrapper">
      <table className="repartition-table">
        <thead>
          <tr>
            <th className="col-num">#</th>
            <th className="col-artistes"><Users size={14} /> Artistes</th>
            <th className="col-evenement"><Music size={14} /> Événement</th>
            <th className="col-lieu"><MapPin size={14} /> Lieu</th>
            <th className="col-date"><Calendar size={14} /> Date</th>
            <th className="col-montant"><DollarSign size={14} /> Montant Total</th>
            <th className="col-demandeur"><User size={14} /> Demandeur</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7" className="loading-cell"><div className="spinner"></div>Chargement...</td></tr>
          ) : paginatedEvenements.length === 0 ? (
            <tr><td colSpan="7" className="empty-cell"><Music size={32} /><p>Aucun événement</p></td></tr>
          ) : (
            paginatedEvenements.map((event, index) => {
              const num = (pageCourante - 1) * itemsParPage + index + 1;
              const lieuDisplay = getLieuDisplay(event);
              const detail = getMontantDetail(event);
              return (
                <tr key={event.id}
                  className={`event-row ${evenementSelectionne?.id === event.id ? 'selected' : ''}`}
                  onClick={() => handleSelectEvenement(event)}>
                  <td className="col-num">{String(num).padStart(3, '0')}</td>
                  <td className="col-artistes">
                    <div className="artistes-cell">
                      {/* ✅ Utilise artistesString (déjà ordonné par le backend) */}
                      <span className="artistes-names">{event.artistesString || 'Aucun artiste'}</span>
                      {event.artistesCount > 0 && <span className="artistes-count">{event.artistesCount} artiste(s)</span>}
                    </div>
                  </td>
                  <td className="col-evenement">{event.denomination || event.demandeur || '-'}</td>
                  <td className="col-lieu">{lieuDisplay}</td>
                  <td className="col-date">{formatDate(event.date_event)}</td>
                  <td className="col-montant">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <strong style={{ color: '#27ae60' }}>
                        {formatMontant(detail.total)} Ar
                      </strong>
                      <small style={{ fontSize: '11px', color: '#6c757d' }}>
                        Base: {formatMontant(detail.base)} Ar
                        {detail.frais > 0 && ` + Frais: ${formatMontant(detail.frais)} Ar`}
                        {detail.penalite > 0 && ` + Pénalité: ${formatMontant(detail.penalite)} Ar`}
                      </small>
                    </div>
                  </td>
                  <td className="col-demandeur">{event.demandeur || '-'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="excel-pagination">
          <button className="page-btn" onClick={() => handlePageChange(1)} disabled={pageCourante === 1}><ChevronsLeft size={14} /></button>
          <button className="page-btn" onClick={() => handlePageChange(pageCourante - 1)} disabled={pageCourante === 1}><ChevronLeft size={14} /></button>
          {renderPageNumbers().map(num => (
            <button key={num} className={`page-btn ${num === pageCourante ? 'active' : ''}`} onClick={() => handlePageChange(num)}>{num}</button>
          ))}
          <button className="page-btn" onClick={() => handlePageChange(pageCourante + 1)} disabled={pageCourante === totalPages}><ChevronRight size={14} /></button>
          <button className="page-btn" onClick={() => handlePageChange(totalPages)} disabled={pageCourante === totalPages}><ChevronsRight size={14} /></button>
          <span className="page-info">{pageCourante} / {totalPages}</span>
        </div>
      )}
    </div>
  );

  const renderRecap = () => (
    <div className="recap-container">
      <div className="recap-section">
        <div className="recap-section-header"><h3><TrendingUp size={20} /> Statistiques Globales</h3></div>
        <div className="stats-globales">
          <div className="stat-globale">
            <div className="stat-globale-icon"><Calendar size={24} /></div>
            <div className="stat-globale-content">
              <span className="stat-globale-nombre">{stats.totalEvenements}</span>
              <span className="stat-globale-label">Événements</span>
            </div>
          </div>
          <div className="stat-globale">
            <div className="stat-globale-icon"><Users size={24} /></div>
            <div className="stat-globale-content">
              <span className="stat-globale-nombre">{stats.totalArtistes}</span>
              <span className="stat-globale-label">Artistes</span>
            </div>
          </div>
          <div className="stat-globale">
            <div className="stat-globale-icon"><DollarSign size={24} /></div>
            <div className="stat-globale-content">
              <span className="stat-globale-nombre">{formatMontant(stats.totalMontant)} Ar</span>
              <span className="stat-globale-label">Montant Total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="recap-section">
        <div className="recap-section-header">
          <h3><CalendarDays size={20} /> Récapitulatif Annuel</h3>
          <div className="recap-year-selector">
            {Object.keys(recapAnnuel).sort().reverse().map(annee => (
              <button key={annee}
                className={`year-btn ${parseInt(annee) === anneeSelectionnee ? 'active' : ''}`}
                onClick={() => setAnneeSelectionnee(parseInt(annee))}>
                {annee}
              </button>
            ))}
          </div>
        </div>
        <div className="recap-cards">
          {Object.keys(recapAnnuel).sort().reverse().map(annee => {
            const data = recapAnnuel[annee];
            const isActive = parseInt(annee) === anneeSelectionnee;
            return (
              <div key={annee} className={`recap-card ${isActive ? 'active' : ''}`}>
                <div className="recap-card-header">
                  <span className="recap-year">{annee}</span>
                  {isActive && <span className="recap-badge">Actuel</span>}
                </div>
                <div className="recap-card-stats">
                  <div className="stat-item"><Calendar size={16} /><span>{data.totalEvenements} événements</span></div>
                  <div className="stat-item"><Users size={16} /><span>{data.totalArtistes} artistes</span></div>
                  <div className="stat-item montant"><DollarSign size={16} /><span>{formatMontant(data.totalMontant)} Ar</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="recap-section">
        <div className="recap-section-header">
          <h3><Calendar size={20} /> Récapitulatif Mensuel {anneeSelectionnee}</h3>
          <span className="recap-total"><Users size={14} />{recapMensuel.filter(m => m.annee === anneeSelectionnee).length} mois</span>
        </div>

        <div className="mois-12-grid">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(mois => {
            const key = `${anneeSelectionnee}-${String(mois).padStart(2, '0')}`;
            const moisData = recapMensuel.find(m => m.key === key);
            const isSelected = moisSelectionne === key;
            const isCurrentMonth = mois === moisActuel && anneeSelectionnee === anneeActuelle;
            const hasEvents = moisData && moisData.totalEvenements > 0;
            return (
              <div key={mois}
                className={`mois-card ${isSelected ? 'selected' : ''} ${isCurrentMonth ? 'current' : ''} ${hasEvents ? 'has-events' : ''}`}
                onClick={() => setMoisSelectionne(isSelected ? null : key)}>
                <div className="mois-card-header">
                  <span className="mois-card-nom">{getMonthShortName(mois)}</span>
                  {isCurrentMonth && <span className="mois-card-badge">Actuel</span>}
                </div>
                {hasEvents ? (
                  <>
                    <div className="mois-card-stats">
                      <span>{moisData.totalEvenements} évents</span>
                      <span className="mois-card-montant">{formatMontant(moisData.totalMontant)} Ar</span>
                    </div>
                    <div className="mois-card-artistes"><Users size={12} /> {moisData.totalArtistes} artistes</div>
                  </>
                ) : (
                  <div className="mois-card-empty">Aucun événement</div>
                )}
              </div>
            );
          })}
        </div>

        {moisSelectionne && (
          <div className="mois-details-container">
            <div className="mois-details-title">
              Détails - {getMonthName(parseInt(moisSelectionne.split('-')[1]))} {moisSelectionne.split('-')[0]}
            </div>
            {evenementsFiltres.length === 0 ? (
              <div className="mois-details-empty">Aucun événement</div>
            ) : (
              <div className="mois-details-grid">
                {evenementsFiltres.map((event, idx) => {
                  const lieuDisplay = getLieuDisplay(event);
                  const total = getMontantTotal(event);
                  return (
                    <div key={idx} className="mois-detail-item">
                      <span className="detail-artistes">{event.artistesString || 'Aucun artiste'}</span>
                      <span className="detail-lieu">{lieuDisplay}</span>
                      <span className="detail-date">{formatDate(event.date_event)}</span>
                      <span className="detail-montant">{formatMontant(total)} Ar</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="recap-footer">
        <button className="btn-back-dashboard-bottom" onClick={handleBackToDashboard}>
          <ArrowLeft size={18} /><Home size={18} /><span>Retour au Dashboard</span>
        </button>
      </div>
    </div>
  );

  const renderEvenementDetail = () => {
    if (!evenementSelectionne) return null;
    const e = evenementSelectionne;
    const lieuDisplay = getLieuDisplay(e);
    const detail = getMontantDetail(e);

    // ✅ Utiliser artistesNames en priorité (déjà ordonné)
    const artistesAffiches = e.artistesNames && e.artistesNames.length > 0
      ? e.artistesNames
      : (e.artistes && e.artistes.length > 0
          ? e.artistes.map(a => a.fullName || `${a.prenom || ''} ${a.nom}`.trim())
          : []);

    return (
      <div className="evenement-detail-excel">
        <div className="detail-header">
          <h3><Music size={16} /> ÉVÉNEMENT N° {e.numero_dossier_global || e.id}</h3>
          <button className="btn-close-detail" onClick={() => setEvenementSelectionne(null)}>
            <X size={18} />
          </button>
        </div>
        <div className="detail-body">
          <div className="detail-section">
            <div className="detail-section-title"><Users size={14} /> ARTISTES</div>
            {artistesAffiches.length > 0 ? (
              <div className="artistes-list">
                {artistesAffiches.map((nomArtiste, idx) => (
                  <div key={idx} className="artiste-item">
                    <span className="artiste-nom">
                      {idx === 0 && <strong>⭐ {nomArtiste}</strong>}
                      {idx !== 0 && nomArtiste}
                    </span>
                    {e.artistes && e.artistes[idx] && (
                      <span className="artiste-role">
                        {e.artistes[idx].role || 'Artiste'}
                      </span>
                    )}
                  </div>
                ))}
                <div className="artistes-count">
                  <Users size={14} />
                  <span>{artistesAffiches.length} artiste(s)</span>
                </div>
              </div>
            ) : e.artistesString ? (
              <div className="artistes-list">
                <div className="artiste-item"><span className="artiste-nom">{e.artistesString}</span></div>
              </div>
            ) : (
              <div className="no-artistes">Aucun artiste associé</div>
            )}
          </div>

          <div className="detail-section">
            <div className="detail-section-title"><Music size={14} /> INFORMATIONS ÉVÉNEMENT</div>
            <div className="detail-row">
              <span className="detail-label"><Music size={14} /> Dénomination:</span>
              <span className="detail-value">{e.denomination || e.demandeur || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><MapPin size={14} /> Lieu:</span>
              <span className="detail-value">{lieuDisplay}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><Calendar size={14} /> Date:</span>
              <span className="detail-value">{formatDate(e.date_event)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><DollarSign size={14} /> Montant base:</span>
              <span className="detail-value">{formatMontant(detail.base)} Ar</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><FileText size={14} /> Frais de dossier:</span>
              <span className="detail-value">{formatMontant(detail.frais)} Ar</span>
            </div>
            {detail.penalite > 0 && (
              <div className="detail-row">
                <span className="detail-label"><AlertCircle size={14} /> Pénalité:</span>
                <span className="detail-value" style={{ color: '#e74c3c' }}>{formatMontant(detail.penalite)} Ar</span>
              </div>
            )}
            <div className="detail-row" style={{ borderTop: '2px solid #27ae60', marginTop: '6px', paddingTop: '6px' }}>
              <span className="detail-label"><DollarSign size={14} /> <strong>MONTANT TOTAL:</strong></span>
              <span className="detail-value montant" style={{ color: '#27ae60', fontWeight: 'bold' }}>
                {formatMontant(detail.total)} Ar
              </span>
            </div>
            {e.demandeur && (
              <div className="detail-row"><span className="detail-label"><User size={14} /> Demandeur:</span><span className="detail-value">{e.demandeur}</span></div>
            )}
            {e.telephone && (
              <div className="detail-row"><span className="detail-label"><Phone size={14} /> Téléphone:</span><span className="detail-value">{e.telephone}</span></div>
            )}
            {e.organisateurs && (
              <div className="detail-row"><span className="detail-label"><Users size={14} /> Organisateurs:</span><span className="detail-value">{e.organisateurs}</span></div>
            )}
          </div>

          <div className="detail-section">
            <div className="detail-section-title"><FileText size={14} /> DOSSIER</div>
            {e.numero_dossier_global && (
              <div className="detail-row"><span className="detail-label"><Hash size={14} /> Dossier Global:</span><span className="detail-value">{e.numero_dossier_global}</span></div>
            )}
            {e.numero_dossier_utilisateur && (
              <div className="detail-row"><span className="detail-label"><Hash size={14} /> Dossier Utilisateur:</span><span className="detail-value">{e.numero_dossier_utilisateur}</span></div>
            )}
            {e.region && (
              <div className="detail-row"><span className="detail-label"><MapPin size={14} /> Région:</span><span className="detail-value">{e.region}</span></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="repartition-page">
      {error && (
        <div className="error-message">
          <AlertCircle size={18} /><span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}
      {renderHeader()}
      <div className="repartition-content">
        <div className={`repartition-main ${evenementSelectionne ? 'with-detail' : ''}`}>
          {vue === 'repartition' ? renderRepartition() : renderRecap()}
        </div>
        {evenementSelectionne && vue === 'repartition' && (
          <div className="repartition-sidebar">{renderEvenementDetail()}</div>
        )}
      </div>
      <div className="repartition-footer-excel">
        <div className="footer-left"><Music size={14} /><span>Répartition Artistes OCC</span></div>
        <div className="footer-center"><span>© {new Date().getFullYear()} - OMDA</span></div>
        <div className="footer-right"><span>Version 1.0</span></div>
      </div>
    </div>
  );
};

export default RepartitionArtister;