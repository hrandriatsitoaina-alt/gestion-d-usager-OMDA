// src/pages/date_grandSurface.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  MapPin,
  Building2,
  Users,
  RotateCcw,
  RefreshCw,
  ArrowLeft,
  Eye,
  X,
  DollarSign,
  Phone,
  Mail,
  Home,
  Store,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';
import '../styles/date_grandSurface.css';

const API_URL = 'http://localhost:3001/api';

const DateGrandSurface = () => {
  const navigate = useNavigate();
  const [usagers, setUsagers] = useState([]);
  const [filteredUsagers, setFilteredUsagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsager, setSelectedUsager] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtres
  const [anneeRecherche, setAnneeRecherche] = useState(new Date().getFullYear());
  const [regionFiltre, setRegionFiltre] = useState('');
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  const [regionsDisponibles, setRegionsDisponibles] = useState([]);

  // Statistiques
  const [statsGraph, setStatsGraph] = useState({
    bonPayeur: 0,
    payeurMoyen: 0,
    mauvaisPayeur: 0,
    nonPayeur: 0,
    total: 0,
  });

  const [notification, setNotification] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [montantTotalRecu, setMontantTotalRecu] = useState(0);

  const moisLabelsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Chargement des régions
  const loadRegions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/regions`);
      if (response.data.success) {
        setRegionsDisponibles(response.data.regions || []);
      } else {
        setRegionsDisponibles([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement régions:', error);
      setRegionsDisponibles([]);
    }
  }, []);

  // Chargement des années disponibles
  const loadAnnees = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/paiements/annees-disponibles/grand-surface`);
      if (response.data.success) {
        setAnneesDisponibles(response.data.annees || []);
        if (response.data.annees.length > 0 && !response.data.annees.includes(new Date().getFullYear())) {
          setAnneeRecherche(response.data.annees[response.data.annees.length - 1]);
        }
      } else {
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
        setAnneesDisponibles(years);
      }
    } catch (error) {
      console.error('❌ Erreur chargement années:', error);
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
      setAnneesDisponibles(years);
    }
  }, []);

  // Chargement des données
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const paiementsResponse = await axios.get(`${API_URL}/paiements/tous`);
      const usagersResponse = await axios.get(`${API_URL}/usagers/paiements/grand-surface`);

      let paiements = [];
      let usagersData = [];

      if (paiementsResponse.data.success) {
        paiements = paiementsResponse.data.paiements || [];
      }

      if (usagersResponse.data.success && usagersResponse.data.usagers) {
        usagersData = usagersResponse.data.usagers;
      } else {
        setUsagers([]);
        setFilteredUsagers([]);
        setLoading(false);
        setApiError('Aucun usager trouvé');
        return;
      }

      const usagersWithYearData = usagersData.map((usager) => {
        const moisPayesPourAnnee = paiements.filter(
          (p) =>
            p.usager_id === usager.id &&
            p.usager_type === 'grand-surface' &&
            p.annee === anneeRecherche &&
            p.statut === 'paye'
        );

        const moisPayes = moisPayesPourAnnee.map((p) => p.mois);

        return {
          ...usager,
          moisPayesAnnee: moisPayesPourAnnee,
          moisPayes: moisPayes,
          totalMoisPayesAnnee: moisPayes.length,
          anneeCourante: anneeRecherche,
          montant_total_paye: moisPayesPourAnnee.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0),
        };
      });

      setUsagers(usagersWithYearData);

      let filtered = [...usagersWithYearData];
      if (regionFiltre) {
        filtered = filtered.filter((u) => u.region === regionFiltre);
      }

      setFilteredUsagers(filtered);
      updateStats(filtered);

      const totalRecu = filtered.reduce((sum, u) => sum + (u.montant_total_paye || 0), 0);
      setMontantTotalRecu(totalRecu);
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      setApiError(error.message || 'Erreur de chargement');
      setNotification({
        type: 'error',
        message: '❌ Erreur de chargement des données',
      });
    } finally {
      setLoading(false);
    }
  }, [anneeRecherche, regionFiltre]);

  const updateStats = (data) => {
    const stats = {
      bonPayeur: data.filter((u) => (u.totalMoisPayesAnnee || 0) >= 9).length,
      payeurMoyen: data.filter((u) => (u.totalMoisPayesAnnee || 0) >= 5 && (u.totalMoisPayesAnnee || 0) <= 8).length,
      mauvaisPayeur: data.filter((u) => (u.totalMoisPayesAnnee || 0) > 0 && (u.totalMoisPayesAnnee || 0) < 5).length,
      nonPayeur: data.filter((u) => (u.totalMoisPayesAnnee || 0) === 0).length,
      total: data.length,
    };
    setStatsGraph(stats);
  };

  const filterByRegion = useCallback(() => {
    let filtered = [...usagers];
    if (regionFiltre) {
      filtered = filtered.filter((u) => u.region === regionFiltre);
    }
    setFilteredUsagers(filtered);
    updateStats(filtered);
    setCurrentPage(1);
  }, [usagers, regionFiltre]);

  // Effets
  useEffect(() => {
    loadRegions();
    loadAnnees();
  }, [loadRegions, loadAnnees]);

  useEffect(() => {
    if (anneeRecherche) {
      loadData();
    }
  }, [anneeRecherche, loadData]);

  useEffect(() => {
    if (usagers.length > 0) {
      filterByRegion();
    }
  }, [regionFiltre, usagers, filterByRegion]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsagers = filteredUsagers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsagers.length / itemsPerPage);

  const goToPage = (page) => setCurrentPage(page);

  // Gestionnaires
  const handleRegionChange = (value) => {
    setRegionFiltre(value);
  };

  const handleAnneeChange = (value) => {
    setAnneeRecherche(parseInt(value));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setAnneeRecherche(new Date().getFullYear());
    setRegionFiltre('');
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

  const getStatusColor = (usager) => {
    const total = usager.totalMoisPayesAnnee || 0;
    if (total === 0) return '#6c757d';
    if (total >= 9) return '#28a745';
    if (total >= 5) return '#ffc107';
    return '#dc3545';
  };

  const getStatusText = (usager) => {
    const total = usager.totalMoisPayesAnnee || 0;
    if (total === 0) return 'Aucun paiement';
    if (total >= 9) return 'Bon état';
    if (total >= 5) return 'Attention';
    return 'Critique';
  };

  // Statistiques rapides
  const totalUsagers = filteredUsagers.length;
  const nonPayes = filteredUsagers.filter((u) => (u.totalMoisPayesAnnee || 0) === 0).length;
  const partiels = filteredUsagers.filter((u) => (u.totalMoisPayesAnnee || 0) > 0 && (u.totalMoisPayesAnnee || 0) < 12).length;
  const aJour = filteredUsagers.filter((u) => (u.totalMoisPayesAnnee || 0) === 12).length;
  const tauxPaiement = totalUsagers > 0 ? Math.round(((totalUsagers - nonPayes) / totalUsagers) * 100) : 0;

  // Pourcentage graphique
  const bonPayeurPercent = statsGraph.total > 0 ? (statsGraph.bonPayeur / statsGraph.total) * 100 : 0;
  const payeurMoyenPercent = statsGraph.total > 0 ? (statsGraph.payeurMoyen / statsGraph.total) * 100 : 0;
  const mauvaisPayeurPercent = statsGraph.total > 0 ? (statsGraph.mauvaisPayeur / statsGraph.total) * 100 : 0;
  const nonPayeurPercent = statsGraph.total > 0 ? (statsGraph.nonPayeur / statsGraph.total) * 100 : 0;

  const handleRetour = () => navigate('/autre-usager');

  return (
    <>
      <Header />
      {/* <Sidebar /> */}
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
          {/* ===== EN-TÊTE (comme DateOcc) ===== */}
          <div className="page-header">
            <div className="header-left">
              <h1>
                <Building2 className="header-icon" size={28} />
                Grandes Surfaces : <span>Suivi des paiements</span>
              </h1>
              <div className="header-stats">
                <span className="stat-badge">
                  <strong>{totalUsagers}</strong> Usagers
                </span>
                <span className="stat-badge">
                  <strong>{aJour}</strong> À jour
                </span>
                <span className="stat-badge">
                  <strong>{partiels}</strong> En retard
                </span>
                <span className="stat-badge">
                  <strong>{nonPayes}</strong> Non payés
                </span>
                <span className="stat-badge">
                  <strong>{tauxPaiement}%</strong> Taux
                </span>
              </div>
            </div>
            <button className="btn-back" onClick={handleRetour}>
              <ArrowLeft size={18} /> Retour
            </button>
          </div>

          {/* ===== FILTRES (indépendants) ===== */}
          <div className="filters-container">
            <div className="filters-row">
              {/* Année */}
              <div className="filter-item">
                <label htmlFor="anneeSelect">
                  <Calendar size={14} className="filter-icon" /> Année
                </label>
                <select
                  id="anneeSelect"
                  value={anneeRecherche}
                  onChange={(e) => handleAnneeChange(e.target.value)}
                  className="form-select"
                >
                  {anneesDisponibles.length > 0 ? (
                    anneesDisponibles.map((an) => (
                      <option key={an} value={an}>
                        {an}
                      </option>
                    ))
                  ) : (
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  )}
                </select>
              </div>

              {/* Région */}
              <div className="filter-item">
                <label htmlFor="regionSelect">
                  <MapPin size={14} className="filter-icon" /> Région
                </label>
                <select
                  id="regionSelect"
                  value={regionFiltre}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">Toutes les régions</option>
                  {regionsDisponibles && regionsDisponibles.length > 0 ? (
                    regionsDisponibles.map((region, index) => (
                      <option key={index} value={region.nom || region}>
                        {region.nom || region}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Aucune région</option>
                  )}
                </select>
              </div>

              {/* Boutons d'action */}
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
              <Calendar size={14} className="indicator-icon" /> Année : <strong>{anneeRecherche}</strong>
            </span>
            {regionFiltre && (
              <span className="indicator-item">
                <MapPin size={14} className="indicator-icon" /> Région : <strong>{regionFiltre}</strong>
              </span>
            )}
            <span className="indicator-item">
              <DollarSign size={14} className="indicator-icon" /> Total reçu : <strong>{montantTotalRecu.toLocaleString()} Ar</strong>
            </span>
            <span className="indicator-item indicator-total">
              <Users size={14} className="indicator-icon" /> Total usagers : <strong>{totalUsagers}</strong>
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
                <AlertCircle size={32} />
                <p>Aucun usager trouvé pour la période sélectionnée</p>
                <button className="btn-retry" onClick={refreshData}>
                  <RefreshCw size={16} /> Réessayer
                </button>
              </div>
            ) : (
              <div className="table-scroll-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="sticky-id">ID</th>
                      <th className="sticky-nom">Dénomination</th>
                      <th>Demandeur</th>
                      <th>Téléphone</th>
                      {/* <th>Adresse</th> */}
                      <th>Région</th>
                      <th>Nb mag</th>
                      {[...Array(12)].map((_, i) => (
                        <th key={i} className="month-col">
                          {i + 1}
                        </th>
                      ))}
                      <th>Total</th>
                      <th>Payé (Ar)</th>
                      <th>Reste (Ar)</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsagers.map((usager) => {
                      const statusColor = getStatusColor(usager);
                      const statusText = getStatusText(usager);
                      const totalPayes = usager.totalMoisPayesAnnee || 0;
                      const montantMensuel = usager.montant_mensuel || 0;
                      const totalPayeAr = usager.montant_total_paye || 0;
                      const reste = (12 - totalPayes) * montantMensuel;

                      return (
                        <tr key={usager.id} style={{ borderLeft: `4px solid ${statusColor}` }}>
                          <td className="sticky-id">#{String(usager.id).padStart(3, '0')}</td>
                          <td className="sticky-nom">
                            <strong>{usager.denomination || '-'}</strong>
                          </td>
                          <td>{usager.demandeur || '-'}</td>
                          <td>{usager.telephone || '-'}</td>
                          {/* <td>{usager.adresse_siege || '-'}</td> */}
                          <td>{usager.region || '-'}</td>
                          <td>{usager.nombre_magasins || '-'}</td>
                          {[...Array(12)].map((_, i) => {
                            const mois = i + 1;
                            const isPaye = usager.moisPayes?.includes(mois);
                            return (
                              <td key={i} className="month-cell">
                                <span className={`mois-badge ${isPaye ? 'paye' : 'non-paye'}`}>
                                  {isPaye ? '✓' : '○'}
                                </span>
                              </td>
                            );
                          })}
                          <td className="total-cell">
                            <strong>{totalPayes}/12</strong>
                          </td>
                          <td className="paye-cell">{totalPayeAr.toLocaleString()} Ar</td>
                          <td className="reste-cell">{reste.toLocaleString()} Ar</td>
                          <td className="status-cell">
                            <span className="status-badge" style={{ background: `${statusColor}20`, color: statusColor }}>
                              {statusText}
                            </span>
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
                <Building2 size={18} /> {selectedUsager.denomination}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h4>
                  <Building2 size={16} /> Informations
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
                  <span>Demandeur</span>
                  <strong>{selectedUsager.demandeur || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Adresse</span>
                  <strong>{selectedUsager.adresse_siege || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Téléphone</span>
                  <strong>{selectedUsager.telephone || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Région</span>
                  <strong>{selectedUsager.region || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Nb magasins</span>
                  <strong>{selectedUsager.nombre_magasins || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Montant mensuel</span>
                  <strong>{(selectedUsager.montant_mensuel || 0).toLocaleString()} Ar</strong>
                </div>
              </div>
              <div className="modal-section">
                <h4>
                  <DollarSign size={16} /> Paiements - {selectedUsager.anneeCourante || anneeRecherche}
                </h4>
                <div className="modal-row">
                  <span>Mois payés</span>
                  <strong>{selectedUsager.totalMoisPayesAnnee || 0}/12</strong>
                </div>
                <div className="modal-row">
                  <span>Détails</span>
                  <strong>
                    {selectedUsager.moisPayes && selectedUsager.moisPayes.length > 0
                      ? selectedUsager.moisPayes.map((m) => moisLabelsShort[m - 1]).join(', ')
                      : 'Aucun paiement'}
                  </strong>
                </div>
                <div className="modal-row">
                  <span>Total payé</span>
                  <strong style={{ color: '#28a745' }}>
                    {(selectedUsager.montant_total_paye || 0).toLocaleString()} Ar
                  </strong>
                </div>
                <div className="modal-row">
                  <span>Reste</span>
                  <strong style={{ color: '#dc3545' }}>
                    {((12 - (selectedUsager.totalMoisPayesAnnee || 0)) * (selectedUsager.montant_mensuel || 0)).toLocaleString()} Ar
                  </strong>
                </div>
                <div className="modal-row">
                  <span>Statut</span>
                  <strong>
                    <span
                      className="status-badge"
                      style={{
                        background: `${getStatusColor(selectedUsager)}20`,
                        color: getStatusColor(selectedUsager),
                      }}
                    >
                      {getStatusText(selectedUsager)}
                    </span>
                  </strong>
                </div>
              </div>
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

export default DateGrandSurface;