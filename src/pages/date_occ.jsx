// src/pages/DateOcc.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  MapPin,
  Building2,
  Search,
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
  FileText,
  Hash,
  MapPinned,
  CreditCard,
  CalendarClock,
  Ban,
  Users,
  TrendingUp,
  Activity,
  Layers,
  RefreshCw,
} from 'lucide-react';

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

  // ========== Helpers ==========
  const formatDateComplete = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString('fr-FR');
  };

  const formatMoney = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('fr-FR') + ' Ar';
  };

  const firstNonEmpty = (...values) => {
    for (const v of values) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        return v;
      }
    }
    return null;
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

    if (referenceId.trim()) {
      const found = findEventById(referenceId);
      return found ? [found] : [];
    }

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
          (ev.organisateurs && ev.organisateurs.toLowerCase().includes(lower)) ||
          (ev.nom_evenement && ev.nom_evenement.toLowerCase().includes(lower)) ||
          (ev.lieu_evenement && ev.lieu_evenement.toLowerCase().includes(lower)) ||
          (ev.genre_manifestation && ev.genre_manifestation.toLowerCase().includes(lower)) ||
          (ev.email && ev.email.toLowerCase().includes(lower)) ||
          artistesMatch
        );
      });
    }

    if (selectedDay) {
      const day = parseInt(selectedDay, 10);
      filtered = filtered.filter(
        (ev) => ev.date_evenement && new Date(ev.date_evenement).getDate() === day
      );
    }
    if (selectedMonth) {
      const moisMap = {
        janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
        juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
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
    if (selectedRegion) {
      filtered = filtered.filter((ev) => ev.region === selectedRegion);
    }

    filtered.sort((a, b) => new Date(b.date_evenement) - new Date(a.date_evenement));
    return filtered;
  }, [
    events, searchTerm, referenceId,
    selectedDay, selectedMonth, selectedYear, selectedRegion,
  ]);

  // ========== Statistiques (basées sur FILTRÉ) ==========
  const totalEvents = getFilteredEvents.length;

  const totalArtistesUniques = useMemo(() => {
    const s = new Set();
    getFilteredEvents.forEach((ev) => {
      (ev.artistesList || []).forEach((a) => {
        if (a.nom) s.add(a.nom.toLowerCase());
      });
    });
    return s.size;
  }, [getFilteredEvents]);

  const totalRegionsCouvertes = useMemo(() => {
    const s = new Set();
    getFilteredEvents.forEach((ev) => {
      if (ev.region) s.add(ev.region);
    });
    return s.size;
  }, [getFilteredEvents]);

  const chiffreAffaireTotal = useMemo(() => {
    return getFilteredEvents.reduce(
      (sum, ev) => sum + (parseFloat(ev.montant_total) || 0),
      0
    );
  }, [getFilteredEvents]);

  const uniqueOrgs = useMemo(() => {
    const s = new Set();
    getFilteredEvents.forEach((ev) => {
      const org = ev.organisateurs || ev.denomination;
      if (org) s.add(org);
    });
    return s.size;
  }, [getFilteredEvents]);

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
    passed: { label: 'Passé', icon: AlertCircle, className: 'occ-status-passed' },
    today: { label: "Aujourd'hui", icon: CheckCircle, className: 'occ-status-today' },
    near: { label: 'Proche', icon: Clock, className: 'occ-status-near' },
    upcoming: { label: 'Futur', icon: Calendar, className: 'occ-status-upcoming' },
    unknown: { label: 'Inconnu', icon: AlertCircle, className: 'occ-status-unknown' },
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
      {/* <Header /> */}
      <MiniSidebar />

      <main className="occ-page">
        {/* ============ HEADER INDÉPENDANT ============ */}
        <header className="occ-header">
          <div className="occ-header-bg" />
          <div className="occ-header-content">
            <div className="occ-header-left">
              <div className="occ-header-icon-wrapper">
                <CalendarDays size={32} strokeWidth={2} />
              </div>
              <div>
                <h1 className="occ-header-title">
                  OMDA <span>Occasionnelles</span>
                </h1>
                <p className="occ-header-subtitle">
                  Gestion et suivi des événements occasionnels
                </p>
              </div>
            </div>

            <div className="occ-header-right">
              <button
                className="occ-btn-refresh"
                onClick={fetchOccasionnels}
                title="Rafraîchir"
              >
                <RefreshCw size={16} />
                Rafraîchir
              </button>
              <button
                className="occ-btn-back"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft size={16} />
                Retour
              </button>
            </div>
          </div>

          {/* ===== KPI CARDS ===== */}
          <div className="occ-kpi-grid">
            <div className="occ-kpi-card occ-kpi-blue">
              <div className="occ-kpi-icon">
                <Layers size={22} />
              </div>
              <div className="occ-kpi-data">
                <span className="occ-kpi-value">{totalEvents}</span>
                <span className="occ-kpi-label">Événements</span>
              </div>
            </div>

            <div className="occ-kpi-card occ-kpi-purple">
              <div className="occ-kpi-icon">
                <Users size={22} />
              </div>
              <div className="occ-kpi-data">
                <span className="occ-kpi-value">{uniqueOrgs}</span>
                <span className="occ-kpi-label">Organisateurs</span>
              </div>
            </div>

            <div className="occ-kpi-card occ-kpi-green">
              <div className="occ-kpi-icon">
                <Music size={22} />
              </div>
              <div className="occ-kpi-data">
                <span className="occ-kpi-value">{totalArtistesUniques}</span>
                <span className="occ-kpi-label">Artistes uniques</span>
              </div>
            </div>

            <div className="occ-kpi-card occ-kpi-orange">
              <div className="occ-kpi-icon">
                <MapPin size={22} />
              </div>
              <div className="occ-kpi-data">
                <span className="occ-kpi-value">{totalRegionsCouvertes}</span>
                <span className="occ-kpi-label">Régions couvertes</span>
              </div>
            </div>

            <div className="occ-kpi-card occ-kpi-teal">
              <div className="occ-kpi-icon">
                <TrendingUp size={22} />
              </div>
              <div className="occ-kpi-data">
                <span className="occ-kpi-value">
                  {chiffreAffaireTotal.toLocaleString('fr-FR')}
                </span>
                <span className="occ-kpi-label">Chiffre total (Ar)</span>
              </div>
            </div>
          </div>
        </header>

        {/* ============ FILTRES ============ */}
        <section className="occ-filters-section">
          <div className="occ-filters-header">
            <h3>
              <Activity size={16} />
              Filtres de recherche
            </h3>
          </div>

          <div className="occ-filters-row">
            <div className="occ-filter-item">
              <label htmlFor="occ-day">
                <Calendar size={13} /> Jour
              </label>
              <select
                id="occ-day"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="occ-form-select"
              >
                <option value="">Tous</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="occ-filter-item">
              <label htmlFor="occ-month">
                <Calendar size={13} /> Mois
              </label>
              <select
                id="occ-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="occ-form-select"
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

            <div className="occ-filter-item">
              <label htmlFor="occ-year">
                <Calendar size={13} /> Année
              </label>
              <select
                id="occ-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="occ-form-select"
              >
                <option value="">Tous</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="occ-filter-item">
              <label htmlFor="occ-region">
                <MapPin size={13} /> Région
              </label>
              <select
                id="occ-region"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="occ-form-select"
              >
                <option value="">Toutes</option>
                {regionsDisponibles.map((r) => (
                  <option key={r.id} value={r.nom}>{r.nom}</option>
                ))}
              </select>
            </div>

            <div className="occ-filter-item occ-filter-actions">
              <label>&nbsp;</label>
              <button className="occ-btn-reset" onClick={resetFilters}>
                <RotateCcw size={14} /> Réinitialiser
              </button>
            </div>
          </div>

          <div className="occ-search-bar">
            <div className="occ-search-wrapper">
              <Search size={16} className="occ-search-icon" />
              <input
                type="text"
                placeholder="Rechercher par nom, lieu, artiste, organisateur…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="occ-search-input"
              />
            </div>
            <div className="occ-ref-wrapper">
              <Tag size={16} className="occ-ref-icon" />
              <input
                type="text"
                placeholder="ID événement"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="occ-ref-input"
              />
            </div>
          </div>
        </section>

        {/* ============ TABLEAU ============ */}
        <section className="occ-table-section">
          <div className="occ-table-header">
            <h3>
              <FileText size={16} />
              Liste des événements
              <span className="occ-table-count">
                {getFilteredEvents.length} résultat
                {getFilteredEvents.length > 1 ? 's' : ''}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="occ-state occ-state-loading">
              <div className="occ-spinner" />
              <p>Chargement des événements…</p>
            </div>
          ) : error ? (
            <div className="occ-state occ-state-error">
              <AlertCircle size={36} />
              <p>{error}</p>
              <button className="occ-btn-retry" onClick={fetchOccasionnels}>
                <RefreshCw size={14} /> Réessayer
              </button>
            </div>
          ) : getFilteredEvents.length === 0 ? (
            <div className="occ-state occ-state-empty">
              <Search size={40} />
              <p>
                {referenceId
                  ? `Aucun événement avec la référence ${referenceId}`
                  : 'Aucun événement ne correspond à vos critères'}
              </p>
            </div>
          ) : (
            <div className="occ-table-scroll">
              <table className="occ-table">
                <thead>
                  <tr>
                    <th>Réf.</th>
                    <th>Date</th>
                    <th>Organisateur</th>
                    <th>Événement</th>
                    <th>Lieu</th>
                    <th>Artistes</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th className="occ-th-action">Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredEvents.map((event) => {
                    const status = getEventStatus(event.date_evenement);
                    const cfg = statusConfig[status] || statusConfig.unknown;
                    const StatusIcon = cfg.icon;
                    const artistNames =
                      (event.artistesList || [])
                        .map((a) => a.nom)
                        .filter(Boolean)
                        .join(', ') || '—';

                    const eventName = firstNonEmpty(
                      event.nom_evenement,
                      event.genre_manifestation,
                      event.denomination
                    ) || '—';

                    return (
                      <tr key={event.id} className="occ-row">
                        <td className="occ-col-id">#{event.id}</td>
                        <td className="occ-col-date" title={formatDateComplete(event.date_evenement)}>
                          {formatDateShort(event.date_evenement)}
                        </td>
                        <td className="occ-col-org">
                          <Building2 size={13} className="occ-inline-icon" />
                          <span>{event.organisateurs || event.denomination || '—'}</span>
                        </td>
                        <td className="occ-col-event">{eventName}</td>
                        <td className="occ-col-lieu">
                          <MapPin size={13} className="occ-inline-icon" />
                          <span>{event.lieu_evenement || '—'}</span>
                        </td>
                        <td className="occ-col-artists" title={artistNames}>
                          <Music size={13} className="occ-inline-icon" />
                          <span>{artistNames}</span>
                        </td>
                        <td className="occ-col-montant">
                          {formatMoney(event.montant_total || event.montant || 0)}
                        </td>
                        <td className="occ-col-status">
                          <span className={`occ-status-badge ${cfg.className}`}>
                            <StatusIcon size={13} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="occ-col-action">
                          <button
                            className="occ-btn-view"
                            onClick={() => openModal(event)}
                            aria-label="Voir les détails"
                          >
                            <Eye size={17} />
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

        {/* ============ FOOTER INDÉPENDANT ============ */}
        <footer className="occ-footer">
          <div className="occ-footer-content">
            <div className="occ-footer-brand">
              <CalendarDays size={18} />
              <span>OMDA · Occasionnelles</span>
            </div>
            <div className="occ-footer-info">
              <span>
                <Layers size={13} /> {totalEvents} événement{totalEvents > 1 ? 's' : ''}
              </span>
              <span className="occ-footer-sep">•</span>
              <span>
                <Users size={13} /> {uniqueOrgs} organisateur{uniqueOrgs > 1 ? 's' : ''}
              </span>
              <span className="occ-footer-sep">•</span>
              <span>
                <Music size={13} /> {totalArtistesUniques} artiste{totalArtistesUniques > 1 ? 's' : ''}
              </span>
              <span className="occ-footer-sep">•</span>
              <span>
                <TrendingUp size={13} /> {chiffreAffaireTotal.toLocaleString('fr-FR')} Ar
              </span>
            </div>
            <div className="occ-footer-date">
              <Calendar size={13} />
              {new Date().toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
        </footer>
      </main>

      {/* ============ MODAL ============ */}
      {selectedEvent && (
        <div className="occ-modal-overlay" onClick={closeModal}>
          <div className="occ-modal" onClick={(e) => e.stopPropagation()}>
            <div className="occ-modal-header">
              <div className="occ-modal-title-group">
                <div className="occ-modal-icon-badge">
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="occ-modal-title">
                    Détails de l'événement
                  </h3>
                  <span className="occ-modal-ref">Réf. #{selectedEvent.id}</span>
                </div>
              </div>
              <button className="occ-modal-close" onClick={closeModal} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="occ-modal-body">
              {/* ===== Événement ===== */}
              <div className="occ-modal-section">
                <h4>
                  <Calendar size={15} /> Événement
                </h4>
                <div className="occ-modal-grid">
                  <div className="occ-modal-row">
                    <span><CalendarClock size={13} /> Date</span>
                    <strong>{formatDateComplete(selectedEvent.date_evenement)}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><Tag size={13} /> Genre</span>
                    <strong>{selectedEvent.genre_manifestation || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><MapPin size={13} /> Lieu</span>
                    <strong>{selectedEvent.lieu_evenement || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><MapPinned size={13} /> Région</span>
                    <strong>{selectedEvent.region || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><Music size={13} /> Artistes (texte)</span>
                    <strong>{selectedEvent.artistes || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* ===== Organisateur ===== */}
              <div className="occ-modal-section">
                <h4>
                  <Building2 size={15} /> Organisateur
                </h4>
                <div className="occ-modal-grid">
                  <div className="occ-modal-row">
                    <span><Users size={13} /> Organisateurs</span>
                    <strong className="occ-highlight">
                      {selectedEvent.organisateurs || '—'}
                    </strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><Building2 size={13} /> Dénomination</span>
                    <strong>{selectedEvent.denomination || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><User size={13} /> Demandeur</span>
                    <strong>{selectedEvent.demandeur || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><User size={13} /> Représenté par</span>
                    <strong>{selectedEvent.representant_par || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><CreditCard size={13} /> CIN représentant</span>
                    <strong>{selectedEvent.representant_cin || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><Calendar size={13} /> CIN délivrée le</span>
                    <strong>{formatDateShort(selectedEvent.representant_cin_delivree)}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><MapPin size={13} /> CIN lieu</span>
                    <strong>{selectedEvent.representant_cin_lieu || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><Phone size={13} /> Téléphone</span>
                    <strong>{selectedEvent.telephone || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><MapPin size={13} /> Adresse</span>
                    <strong>{selectedEvent.adresse || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><MapPin size={13} /> Domicile</span>
                    <strong>{selectedEvent.domicile || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* ===== Dossier ===== */}
              <div className="occ-modal-section">
                <h4>
                  <FileText size={15} /> Dossier
                </h4>
                <div className="occ-modal-grid">
                  <div className="occ-modal-row">
                    <span><Hash size={13} /> N° global</span>
                    <strong>{selectedEvent.numero_dossier_global || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><Hash size={13} /> N° utilisateur</span>
                    <strong>{selectedEvent.numero_dossier_utilisateur || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><Calendar size={13} /> Date d'ajout</span>
                    <strong>{formatDateShort(selectedEvent.date_ajout)}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><MapPin size={13} /> Lieu d'ajout</span>
                    <strong>{selectedEvent.lieu_ajout || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><User size={13} /> Confirmation</span>
                    <strong>{selectedEvent.confirmation_nom || '—'}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><Calendar size={13} /> Date signature</span>
                    <strong>{formatDateShort(selectedEvent.date_signature)}</strong>
                  </div>
                </div>
              </div>

              {/* ===== Finances ===== */}
              <div className="occ-modal-section">
                <h4>
                  <DollarSign size={15} /> Finances
                </h4>
                <div className="occ-modal-grid">
                  <div className="occ-modal-row">
                    <span>Frais dossier</span>
                    <strong>{formatMoney(selectedEvent.frais_dossier)}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span>Montant</span>
                    <strong>{formatMoney(selectedEvent.montant)}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span><Ban size={13} /> Montant retard</span>
                    <strong>{formatMoney(selectedEvent.montant_retard)}</strong>
                  </div>
                  <div className="occ-modal-row">
                    <span>En retard ?</span>
                    <strong
                      style={{
                        color: selectedEvent.is_retard ? '#dc3545' : '#28a745',
                      }}
                    >
                      {selectedEvent.is_retard ? 'Oui' : 'Non'}
                    </strong>
                  </div>
                  <div className="occ-modal-row">
                    <span>Soit total</span>
                    <strong>{formatMoney(selectedEvent.soit_total)}</strong>
                  </div>
                </div>

                <div className="occ-modal-total">
                  <span>
                    <DollarSign size={16} /> MONTANT TOTAL
                  </span>
                  <strong>{formatMoney(selectedEvent.montant_total)}</strong>
                </div>
              </div>

              {/* ===== Artistes ===== */}
              {selectedEvent.artistesList && selectedEvent.artistesList.length > 0 && (
                <div className="occ-modal-section">
                  <h4>
                    <Music size={15} /> Artistes ({selectedEvent.artistesList.length})
                  </h4>
                  <ul className="occ-artist-list">
                    {selectedEvent.artistesList.map((artist, idx) => (
                      <li key={idx}>
                        <span className="occ-artist-name">
                          {artist.nom} {artist.prenom || ''}
                        </span>
                        {artist.role && (
                          <span className="occ-artist-role">🎭 {artist.role}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="occ-modal-footer">
              <button className="occ-btn-close-modal" onClick={closeModal}>
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