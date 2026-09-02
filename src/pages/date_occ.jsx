// src/pages/DateOcc.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  MapPin,
  Building2,
  Search,
  X,
  Eye,
  RotateCcw,
  ArrowLeft,
  Music,
  User,
  Mail,
  Phone,
  DollarSign,
  Tag,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';
import '../styles/date_occ.css';


const DateOcc = () => {
  const navigate = useNavigate();

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Données
  const [regionsDisponibles, setRegionsDisponibles] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  // ========== Fonctions utilitaires ==========
  const formatDateComplete = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const extractAvailableYears = (eventsList) => {
    const years = new Set();
    eventsList.forEach((ev) => {
      if (ev.date_evenement) {
        const d = new Date(ev.date_evenement);
        if (!isNaN(d)) years.add(d.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // ========== Appels API ==========
  const loadRegions = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/regions');
      const data = await res.json();
      if (data.success) setRegionsDisponibles(data.regions || []);
    } catch (err) {
      console.error('Erreur chargement régions:', err);
    }
  }, []);

  const fetchOccasionnels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/usagers/occasionnels');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.events) {
        setEvents(data.events);
        setAvailableYears(extractAvailableYears(data.events));
      } else {
        setEvents([]);
        setAvailableYears([]);
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données.');
      setEvents([]);
      setAvailableYears([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegions();
    fetchOccasionnels();
  }, [loadRegions, fetchOccasionnels]);

  // ========== Filtrage ==========
  const normalizeId = (input) => {
    if (!input) return null;
    const num = parseInt(input.trim(), 10);
    return isNaN(num) ? null : num;
  };

  const findEventById = (id) => {
    const normalized = normalizeId(id);
    if (normalized === null) return null;
    return events.find((ev) => ev.id === normalized);
  };

  const getFilteredEvents = useMemo(() => {
    if (!events.length) return [];

    let filtered = [...events];

    // Recherche par ID
    if (referenceId.trim()) {
      const found = findEventById(referenceId);
      return found ? [found] : [];
    }

    // Recherche textuelle
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((ev) => {
        const artistesMatch = (ev.artistesList || []).some(
          (a) =>
            (a.nom && a.nom.toLowerCase().includes(lower)) ||
            (a.prenom && a.prenom.toLowerCase().includes(lower))
        );
        return (
          (ev.denomination && ev.denomination.toLowerCase().includes(lower)) ||
          (ev.demandeur && ev.demandeur.toLowerCase().includes(lower)) ||
          (ev.nom_evenement && ev.nom_evenement.toLowerCase().includes(lower)) ||
          (ev.lieu_evenement && ev.lieu_evenement.toLowerCase().includes(lower)) ||
          (ev.genre_manifestation && ev.genre_manifestation.toLowerCase().includes(lower)) ||
          artistesMatch
        );
      });
    }

    // Filtres date
    if (selectedDay) {
      const day = parseInt(selectedDay, 10);
      filtered = filtered.filter(
        (ev) => ev.date_evenement && new Date(ev.date_evenement).getDate() === day
      );
    }
    if (selectedMonth) {
      const moisMap = {
        janvier: 0,
        février: 1,
        mars: 2,
        avril: 3,
        mai: 4,
        juin: 5,
        juillet: 6,
        août: 7,
        septembre: 8,
        octobre: 9,
        novembre: 10,
        décembre: 11,
      };
      const moisNum = moisMap[selectedMonth.toLowerCase()];
      filtered = filtered.filter(
        (ev) => ev.date_evenement && new Date(ev.date_evenement).getMonth() === moisNum
      );
    }
    if (selectedYear) {
      const year = parseInt(selectedYear, 10);
      filtered = filtered.filter(
        (ev) => ev.date_evenement && new Date(ev.date_evenement).getFullYear() === year
      );
    }

    // Filtre région
    if (selectedRegion) {
      filtered = filtered.filter((ev) => ev.region === selectedRegion);
    }

    // Tri par date décroissante
    filtered.sort((a, b) => new Date(b.date_evenement) - new Date(a.date_evenement));
    return filtered;
  }, [
    events,
    searchTerm,
    referenceId,
    selectedDay,
    selectedMonth,
    selectedYear,
    selectedRegion,
  ]);

  // Statistiques
  const totalEvents = events.length;
  const uniqueOrgs = new Set(events.map((e) => e.denomination).filter(Boolean)).size;
  const uniqueLieux = new Set(events.map((e) => e.lieu_evenement).filter(Boolean)).size;

  // ========== Statut ==========
  const getEventStatus = (dateOriginal) => {
    if (!dateOriginal) return 'unknown';
    const eventDate = new Date(dateOriginal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'passed';
    if (diffDays === 0) return 'today';
    if (diffDays <= 5) return 'near';
    return 'upcoming';
  };

  const statusConfig = {
    passed: { label: 'Passé', icon: AlertCircle, className: 'status-passed' },
    today: { label: "Aujourd'hui", icon: CheckCircle, className: 'status-today' },
    near: { label: 'Proche', icon: Clock, className: 'status-near' },
    upcoming: { label: 'Futur', icon: Calendar, className: 'status-upcoming' },
  };

  // ========== Modal ==========
  const openModal = (event) => {
    setSelectedEvent(event);
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    setSelectedEvent(null);
    document.body.style.overflow = 'auto';
  };

  // Réinitialisation
  const resetFilters = () => {
    setSearchTerm('');
    setReferenceId('');
    setSelectedDay('');
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedRegion('');
  };

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      <main className="contenu">
        {/* ===== EN‑TÊTE ===== */}
        <div className="page-header">
          <div className="header-left">
            <h1>
              <CalendarDays className="header-icon" size={28} />
              OMDA : <span>Occasionnelles</span>
            </h1>
            <div className="header-stats">
              <span className="stat-badge">
                <strong>{totalEvents}</strong> Événements
              </span>
              <span className="stat-badge">
                <strong>{uniqueOrgs}</strong> Organisations
              </span>
              <span className="stat-badge">
                <strong>{uniqueLieux}</strong> Lieux
              </span>
            </div>
          </div>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} /> Retour
          </button>
        </div>

        {/* ===== FILTRES INDÉPENDANTS ===== */}
        <div className="filters-container">
          <div className="filters-row">
            {/* Jour */}
            <div className="filter-item">
              <label htmlFor="daySelect">
                <Calendar size={14} className="filter-icon" /> Jour
              </label>
              <select
                id="daySelect"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="form-select"
              >
                <option value="">Tous</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Mois */}
            <div className="filter-item">
              <label htmlFor="monthSelect">
                <Calendar size={14} className="filter-icon" /> Mois
              </label>
              <select
                id="monthSelect"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-select"
              >
                <option value="">Tous</option>
                {[
                  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
                ].map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Année */}
            <div className="filter-item">
              <label htmlFor="yearSelect">
                <Calendar size={14} className="filter-icon" /> Année
              </label>
              <select
                id="yearSelect"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-select"
              >
                <option value="">Tous</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Région */}
            <div className="filter-item">
              <label htmlFor="regionSelect">
                <MapPin size={14} className="filter-icon" /> Région
              </label>
              <select
                id="regionSelect"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="form-select"
              >
                <option value="">Toutes les régions</option>
                {regionsDisponibles.map((r) => (
                  <option key={r.id} value={r.nom}>{r.nom}</option>
                ))}
              </select>
            </div>

            {/* Réinitialiser */}
            <div className="filter-item filter-actions">
              <label>&nbsp;</label>
              <button className="btn-reset" onClick={resetFilters}>
                <RotateCcw size={16} /> Réinitialiser
              </button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="search-bar">
            <div className="search-input-wrapper">

              <input
                type="text"
                placeholder="Rechercher par nom, lieu, artiste…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="reference-input-wrapper">
              <Tag size={16} className="ref-icon" />
              <input
                type="text"
                placeholder="ID événement"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="reference-input"
              />
            </div>
          </div>
        </div>

        {/* ===== TABLEAU ===== */}
        <section className="events-table-wrapper">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Chargement des événements…</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={32} />
              <p>{error}</p>
              <button className="btn-retry" onClick={fetchOccasionnels}>
                Réessayer
              </button>
            </div>
          ) : getFilteredEvents.length === 0 ? (
            <div className="empty-state">
              <Search size={40} />
              <p>
                {referenceId
                  ? `Aucun événement avec la référence ${referenceId}`
                  : 'Aucun événement ne correspond à vos critères'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Réf.</th>
                    <th>Date</th>
                    <th>Organisation</th>
                    <th>Événement</th>
                    <th>Lieu</th>
                    <th>Artistes</th>
                    <th>Statut</th>
                    <th style={{ width: '50px' }}>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredEvents.map((event) => {
                    const status = getEventStatus(event.date_evenement);
                    const { label, icon: StatusIcon, className } = statusConfig[status] || {};
                    const artistNames = (event.artistesList || [])
                      .map((a) => a.nom)
                      .filter(Boolean)
                      .join(', ') || '—';

                    return (
                      <tr key={event.id} className={`event-row ${className}`}>
                        <td className="col-id">{event.id}</td>
                        <td className="col-date" title={formatDateComplete(event.date_evenement)}>
                          {formatDateComplete(event.date_evenement)}
                        </td>
                        <td className="col-org">
                          <Building2 size={14} className="inline-icon" />
                          {event.denomination || '—'}
                        </td>
                        <td className="col-event">
                          {event.nom_evenement || event.denomination || '—'}
                        </td>
                        <td className="col-lieu">
                          <MapPin size={14} className="inline-icon" />
                          {event.lieu_evenement || '—'}
                        </td>
                        <td className="col-artists">
                          <Music size={14} className="inline-icon" />
                          {artistNames}
                        </td>
                        <td className="col-status">
                          {status && (
                            <span className={`status-badge ${className}`}>
                              <StatusIcon size={14} />
                              {label}
                            </span>
                          )}
                        </td>
                        <td className="col-action">
                          <button
                            className="btn-view"
                            onClick={() => openModal(event)}
                            aria-label="Voir les détails"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ===== MODAL ===== */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Tag size={18} /> Détails – Réf. {selectedEvent.id}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h4>
                  <Calendar size={16} /> Événement
                </h4>
                <div className="modal-row">
                  <span>Date</span>
                  <strong>{formatDateComplete(selectedEvent.date_evenement)}</strong>
                </div>
                <div className="modal-row">
                  <span>Lieu</span>
                  <strong>{selectedEvent.lieu_evenement || '—'}</strong>
                </div>
                <div className="modal-row">
                  <span>Nom</span>
                  <strong>{selectedEvent.nom_evenement || '—'}</strong>
                </div>
                <div className="modal-row">
                  <span>Genre</span>
                  <strong>{selectedEvent.genre_manifestation || '—'}</strong>
                </div>
                <div className="modal-row">
                  <span>Région</span>
                  <strong>{selectedEvent.region || '—'}</strong>
                </div>
                <div className="modal-row">
                  <span>
                    <DollarSign size={14} /> Montant
                  </span>
                  <strong>{(selectedEvent.montant_total || 0).toLocaleString()} Ar</strong>
                </div>
              </div>

              <div className="modal-section">
                <h4>
                  <Building2 size={16} /> Organisateur
                </h4>
                <div className="modal-row">
                  <span>Structure</span>
                  <strong>{selectedEvent.denomination || '—'}</strong>
                </div>
                <div className="modal-row">
                  <span>
                    <User size={14} /> Demandeur
                  </span>
                  <strong>{selectedEvent.demandeur || '—'}</strong>
                </div>
                <div className="modal-row">
                  <span>
                    <Phone size={14} /> Téléphone
                  </span>
                  <strong>{selectedEvent.telephone || '—'}</strong>
                </div>
                <div className="modal-row">
                  <span>
                    <Mail size={14} /> Email
                  </span>
                  <strong>{selectedEvent.email || '—'}</strong>
                </div>
              </div>

              {selectedEvent.artistesList && selectedEvent.artistesList.length > 0 && (
                <div className="modal-section">
                  <h4>
                    <Music size={16} /> Artistes
                  </h4>
                  <ul className="artist-list">
                    {selectedEvent.artistesList.map((artist, idx) => (
                      <li key={idx}>
                        <span className="artist-name">
                          {artist.nom} {artist.prenom || ''}
                        </span>
                        {artist.role && <span className="artist-role">🎭 {artist.role}</span>}
                        {artist.nombre_chansons && (
                          <span className="artist-songs">🎵 {artist.nombre_chansons} chansons</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-close" onClick={closeModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DateOcc;