// src/pages/DateOther.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package, ArrowLeft, Eye, X, Calendar, MapPin, Phone, Mail,
  FileText, DollarSign, Plus, RefreshCw, AlertCircle,
  Disc, Music, Globe, Sparkles, Video, Users, Repeat,
  CalendarCheck, FileCheck, RotateCcw, TrendingUp
} from 'lucide-react';
import Header from '../components/Header';
import MiniSidebar from '../components/MiniSidebar';
import '../styles/date_grandSurface.css';   // ✅ MÊME CSS QUE BUS

const API_URL = 'http://localhost:3001/api';

// ✅ Icônes par type
const TYPE_ICONS = {
  cd: Disc,
  mp3: Music,
  'oeuvre-web': Globe,
  hologramme: Sparkles,
  video: Video,
  autre: Package
};

const TYPE_LABELS = {
  cd: 'CD',
  mp3: 'MP3',
  'oeuvre-web': 'Œuvre Web',
  hologramme: 'Hologramme',
  video: 'Vidéo',
  autre: 'Autre'
};

const DateOther = () => {
  const navigate = useNavigate();
  const [usagers, setUsagers] = useState([]);
  const [filteredUsagers, setFilteredUsagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsager, setSelectedUsager] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('tous');
  const [filterMode, setFilterMode] = useState('tous');

  // Statistiques
  const [statsGraph, setStatsGraph] = useState({
    total: 0,
    mensuel: 0,
    unique: 0,
    montantTotal: 0,
  });

  const [notification, setNotification] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [montantTotalRecu, setMontantTotalRecu] = useState(0);

  // ---- Formatage ----
  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return parseFloat(value).toLocaleString('fr-FR');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('fr-FR');
    } catch { return dateStr; }
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await axios.get(`${API_URL}/other-usagers`);

      if (response.data.success) {
        const usagersData = response.data.usagers || [];

        // Calculer le montant total de chaque usager
        const usagersEnrichis = usagersData.map((u) => {
          const lignes = u.lignes || [];
          const paiement = u.paiement || {};
          const totalLignes = lignes.reduce(
            (acc, l) => acc + (parseFloat(l.montant) || 0),
            0
          );
          const total = parseFloat(paiement.montant) || totalLignes;

          return {
            ...u,
            lignes: lignes,
            montant_total: total,
            mode_paiement: u.mode_paiement || 'unique',
          };
        });

        setUsagers(usagersEnrichis);
        setFilteredUsagers(usagersEnrichis);
        updateStats(usagersEnrichis);

        const totalRecu = usagersEnrichis.reduce(
          (sum, u) => sum + (u.montant_total || 0),
          0
        );
        setMontantTotalRecu(totalRecu);
      } else {
        setUsagers([]);
        setFilteredUsagers([]);
        setApiError('Aucun usager événementiel trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur chargement other-usagers:', error);
      setApiError(error.message || 'Erreur de chargement');
      setNotification({
        type: 'error',
        message: '❌ Erreur de chargement des données événementielles',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStats = (data) => {
    const stats = {
      total: data.length,
      mensuel: data.filter((u) => u.mode_paiement === 'mensuel').length,
      unique: data.filter((u) => u.mode_paiement === 'unique').length,
      montantTotal: data.reduce((sum, u) => sum + (u.montant_total || 0), 0),
    };
    setStatsGraph(stats);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================
  // FILTRES
  // ============================================================
  useEffect(() => {
    let filtered = [...usagers];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.denomination || '').toLowerCase().includes(term) ||
          (u.nom || '').toLowerCase().includes(term) ||
          (u.prenom || '').toLowerCase().includes(term) ||
          (u.telephone || '').includes(term) ||
          (u.email || '').toLowerCase().includes(term) ||
          (u.region || '').toLowerCase().includes(term) ||
          (u.representant_par || '').toLowerCase().includes(term)
      );
    }

    if (filterType !== 'tous') {
      filtered = filtered.filter((u) => u.type_usager === filterType);
    }

    if (filterMode !== 'tous') {
      filtered = filtered.filter((u) => u.mode_paiement === filterMode);
    }

    setFilteredUsagers(filtered);
    updateStats(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterType, filterMode, usagers]);

  // ============================================================
  // PAGINATION
  // ============================================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsagers = filteredUsagers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsagers.length / itemsPerPage);

  const goToPage = (page) => setCurrentPage(page);

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('tous');
    setFilterMode('tous');
    setCurrentPage(1);
    loadData();
  };

  const refreshData = () => loadData();

  const openModal = (usager) => {
    setSelectedUsager(usager);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUsager(null);
  };

  const handleRetour = () => navigate('/autre-usager');
  const handleAjouter = () => navigate('/other-ajout');

  // ============================================================
  // STATISTIQUES RAPIDES
  // ============================================================
  const totalUsagers = filteredUsagers.length;
  const mensuels = filteredUsagers.filter((u) => u.mode_paiement === 'mensuel').length;
  const uniques = filteredUsagers.filter((u) => u.mode_paiement === 'unique').length;
  const avecQuittance = filteredUsagers.filter((u) => u.quittance).length;

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <>
      <Header />
      <MiniSidebar />
      <main className="contenu-grandsurface">
        {notification && (
          <div className={`notif ${notification.type}`}>
            <span>{notification.type === 'success' ? '✓' : notification.type === 'info' ? '✨' : '✗'}</span>
            <span>{notification.message}</span>
            <button className="notif-close" onClick={() => setNotification(null)}>✕</button>
          </div>
        )}

        <div className="grandsurface-container">
          {/* ===== EN-TÊTE ===== */}
          <div className="page-header">
            <div className="header-left">
              <h1>
                <Package className="header-icon" size={28} />
                Usager événementiel : <span>Suivi des inscriptions</span>
              </h1>
              <div className="header-stats">
                <span className="stat-badge">
                  <strong>{totalUsagers}</strong> Total
                </span>
                <span className="stat-badge">
                  <strong>{mensuels}</strong> Mensuel
                </span>
                <span className="stat-badge">
                  <strong>{uniques}</strong> Unique
                </span>
                <span className="stat-badge">
                  <strong>{avecQuittance}</strong> Quittances
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button className="btn-back" onClick={handleRetour}>
                <ArrowLeft size={18} /> Retour
              </button>
            </div>
          </div>

          {/* ===== FILTRES ===== */}
          <div className="filters-container">
            <div className="filters-row">
              <div className="filter-item" style={{ flex: '1 1 200px' }}>
                <label htmlFor="search">
                  <Users size={14} className="filter-icon" /> Rechercher
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, téléphone, email, région..."
                  className="form-select"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="filter-item">
                <label htmlFor="typeFilter">
                  <Package size={14} className="filter-icon" /> Type
                </label>
                <select
                  id="typeFilter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="form-select"
                >
                  <option value="tous">Tous les types</option>
                  <option value="cd">CD</option>
                  <option value="mp3">MP3</option>
                  <option value="oeuvre-web">Œuvre Web</option>
                  <option value="hologramme">Hologramme</option>
                  <option value="video">Vidéo</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="modeFilter">
                  <DollarSign size={14} className="filter-icon" /> Mode paiement
                </label>
                <select
                  id="modeFilter"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="form-select"
                >
                  <option value="tous">Tous</option>
                  <option value="mensuel">Mensuel</option>
                  <option value="unique">Unique</option>
                </select>
              </div>

              <div className="filter-item filter-actions">
                <label>&nbsp;</label>
                <div className="filter-buttons">
                  <button className="btn-reset" onClick={resetFilters}>
                    <RotateCcw size={16} /> Réinitialiser
                  </button>
                  <button className="btn-refresh" onClick={refreshData}>
                    <RefreshCw size={16} /> Rafraîchir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===== INDICATEUR ===== */}
          <div className="indicator-bar">
            <span className="indicator-item">
              <Users size={14} className="indicator-icon" /> Total : <strong>{totalUsagers}</strong>
            </span>
            <span className="indicator-item">
              <Repeat size={14} className="indicator-icon" /> Mensuel : <strong>{mensuels}</strong>
            </span>
            <span className="indicator-item">
              <CalendarCheck size={14} className="indicator-icon" /> Unique : <strong>{uniques}</strong>
            </span>
            <span className="indicator-item">
              <DollarSign size={14} className="indicator-icon" /> Total reçu :{' '}
              <strong>{montantTotalRecu.toLocaleString()} Ar</strong>
            </span>
            <span className="indicator-item indicator-total">
              <TrendingUp size={14} className="indicator-icon" /> Montant moyen :{' '}
              <strong>
                {totalUsagers > 0
                  ? Math.round(montantTotalRecu / totalUsagers).toLocaleString()
                  : 0}{' '}
                Ar
              </strong>
            </span>
          </div>

          {/* ===== TABLEAU ===== */}
          <div className="table-wrapper">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Chargement des données…</p>
              </div>
            ) : apiError ? (
              <div className="error-state">
                <AlertCircle size={32} />
                <p>{apiError}</p>
                <button className="btn-retry" onClick={refreshData}>
                  <RefreshCw size={16} /> Réessayer
                </button>
              </div>
            ) : currentUsagers.length === 0 ? (
              <div className="empty-state">
                <Package size={48} color="#94a3b8" />
                <p>Aucun usager événementiel trouvé</p>
                <button className="btn-retry" onClick={handleAjouter}>
                  <Plus size={16} /> Ajouter un usager événementiel
                </button>
              </div>
            ) : (
              <div className="table-scroll-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="sticky-id">ID</th>
                      <th className="sticky-nom">Dénomination</th>
                      <th>Type</th>
                      <th>Représentant</th>
                      <th>Téléphone</th>
                      <th>Région</th>
                      <th>Mode</th>
                      <th>Lignes</th>
                      <th>Quittance</th>
                      <th>Montant (Ar)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsagers.map((usager) => {
                      const TypeIcon = TYPE_ICONS[usager.type_usager] || Package;
                      const typeLabel = TYPE_LABELS[usager.type_usager] || usager.type_usager;
                      const lignes = usager.lignes || [];
                      const isUnique = usager.mode_paiement === 'unique';
                      const statusColor = isUnique ? '#28a745' : '#2c7be5';

                      return (
                        <tr
                          key={usager.id}
                          style={{ borderLeft: `4px solid ${statusColor}` }}
                        >
                          <td className="sticky-id">
                            #{String(usager.id).padStart(3, '0')}
                          </td>
                          <td className="sticky-nom">
                            <strong>{usager.denomination || 'Sans nom'}</strong>
                            {usager.nom && (
                              <div style={{ fontSize: '0.75em', color: '#666' }}>
                                {usager.nom} {usager.prenom || ''}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className="status-badge"
                              style={{
                                background: '#eff6ff',
                                color: '#1e40af',
                                border: '1px solid #bfdbfe',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <TypeIcon size={12} /> {typeLabel}
                            </span>
                          </td>
                          <td>{usager.representant_par || '-'}</td>
                          <td>{formatPhoneNumber(usager.telephone)}</td>
                          <td>{usager.region || '-'}</td>
                          <td>
                            <span
                              className="status-badge"
                              style={{
                                background: isUnique ? '#f0fdf4' : '#eff6ff',
                                color: isUnique ? '#166534' : '#1e40af',
                                border: `1px solid ${isUnique ? '#86efac' : '#bfdbfe'}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {isUnique ? (
                                <><CalendarCheck size={12} /> Unique</>
                              ) : (
                                <><Repeat size={12} /> Mensuel</>
                              )}
                            </span>
                          </td>
                          <td>
                            <strong>{lignes.length}</strong>
                          </td>
                          <td>
                            {usager.quittance ? (
                              <span
                                className="status-badge"
                                style={{
                                  background: '#f0fdf4',
                                  color: '#166534',
                                  border: '1px solid #86efac',
                                  fontFamily: 'Courier New, monospace',
                                  fontWeight: '700',
                                }}
                              >
                                <FileCheck size={11} /> {String(usager.quittance).padStart(7, '0')}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="paye-cell">
                            <strong>{formatNumber(usager.montant_total)} Ar</strong>
                          </td>
                          <td className="action-cell">
                            <button className="btn-view" onClick={() => openModal(usager)}>
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
          </div>

          {/* ===== PAGINATION ===== */}
          {filteredUsagers.length > 0 && (
            <div className="pagination-container">
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ◀
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ▶
                </button>
              </div>
              <div className="pagination-info">
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsagers.length)} sur {filteredUsagers.length}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===== MODAL ===== */}
      {showModal && selectedUsager && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Package size={18} /> {selectedUsager.denomination || 'Usager événementiel'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Informations */}
              <div className="modal-section">
                <h4>
                  <Users size={16} /> Informations
                </h4>
                <div className="modal-row">
                  <span>ID</span>
                  <strong>#{String(selectedUsager.id).padStart(3, '0')}</strong>
                </div>
                <div className="modal-row">
                  <span>Dénomination</span>
                  <strong>{selectedUsager.denomination || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Nom / Prénom</span>
                  <strong>
                    {selectedUsager.nom || '-'} {selectedUsager.prenom || ''}
                  </strong>
                </div>
                <div className="modal-row">
                  <span>Type</span>
                  <strong>
                    {TYPE_LABELS[selectedUsager.type_usager] || selectedUsager.type_usager}
                  </strong>
                </div>
                <div className="modal-row">
                  <span>Téléphone</span>
                  <strong>{formatPhoneNumber(selectedUsager.telephone)}</strong>
                </div>
                <div className="modal-row">
                  <span>Email</span>
                  <strong>{selectedUsager.email || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Région</span>
                  <strong>{selectedUsager.region || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Adresse</span>
                  <strong>{selectedUsager.adresse || '-'}</strong>
                </div>
              </div>

              {/* Représentant */}
              <div className="modal-section">
                <h4>
                  <Users size={16} /> Représentant
                </h4>
                <div className="modal-row">
                  <span>Représenté par</span>
                  <strong>{selectedUsager.representant_par || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>CIN</span>
                  <strong>{selectedUsager.representant_cin || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>CIN délivrée le</span>
                  <strong>{formatDate(selectedUsager.representant_cin_delivree)}</strong>
                </div>
                <div className="modal-row">
                  <span>Lieu de délivrance</span>
                  <strong>{selectedUsager.representant_cin_lieu || '-'}</strong>
                </div>
              </div>

              {/* Lignes de facture */}
              {selectedUsager.lignes && selectedUsager.lignes.length > 0 && (
                <div className="modal-section">
                  <h4>
                    <FileText size={16} /> Détail de la facture
                  </h4>
                  <table className="data-table" style={{ marginTop: '8px' }}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style={{ textAlign: 'center' }}>U.</th>
                        <th style={{ textAlign: 'right' }}>P.U.</th>
                        <th style={{ textAlign: 'right' }}>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUsager.lignes.map((l, i) => (
                        <tr key={i}>
                          <td>{l.description}</td>
                          <td style={{ textAlign: 'center' }}>{l.uniter}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(l.pu)} Ar</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>
                            {formatNumber(l.montant)} Ar
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paiement */}
              <div className="modal-section">
                <h4>
                  <DollarSign size={16} /> Paiement
                </h4>
                <div className="modal-row">
                  <span>Mode paiement</span>
                  <strong>
                    {selectedUsager.mode_paiement === 'unique'
                      ? 'Paiement unique'
                      : 'Paiement mensuel'}
                  </strong>
                </div>
                {selectedUsager.paiement && (
                  <>
                    <div className="modal-row">
                      <span>Montant</span>
                      <strong style={{ color: '#28a745' }}>
                        {formatNumber(selectedUsager.paiement.montant)} Ar
                      </strong>
                    </div>
                    <div className="modal-row">
                      <span>Date paiement</span>
                      <strong>{formatDate(selectedUsager.paiement.date_paiement)}</strong>
                    </div>
                  </>
                )}
                {selectedUsager.quittance && (
                  <div className="modal-row">
                    <span>Quittance</span>
                    <strong>{String(selectedUsager.quittance).padStart(7, '0')}</strong>
                  </div>
                )}
              </div>

              {/* Réception */}
              {selectedUsager.personne_recu && (
                <div className="modal-section">
                  <h4>
                    <CalendarCheck size={16} /> Réception
                  </h4>
                  <div className="modal-row">
                    <span>Personne qui reçoit</span>
                    <strong>{selectedUsager.personne_recu}</strong>
                  </div>
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

export default DateOther;