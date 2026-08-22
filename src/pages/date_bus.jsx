// src/pages/date_bus.jsx
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
  Bus,
  Route,
} from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';
import '../styles/date_grandSurface.css';

const API_URL = 'http://localhost:3001/api';

const DateBus = () => {
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
  const [anneeDebut, setAnneeDebut] = useState('');
  const [anneeFin, setAnneeFin] = useState('');
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

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

  // ---- Formatage du téléphone ----
  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  // Chargement des années disponibles
  const loadAnnees = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/paiements/annees-disponibles/bus`);
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
      const usagersResponse = await axios.get(`${API_URL}/usagers/paiements/bus`);
      let usagersData = [];
      let paiements = [];

      if (usagersResponse.data.success && usagersResponse.data.usagers) {
        usagersData = usagersResponse.data.usagers;
      } else {
        // Fallback sur tous les usagers
        try {
          const allUsagersResponse = await axios.get(`${API_URL}/usagers`);
          if (allUsagersResponse.data.success && allUsagersResponse.data.usagers) {
            usagersData = allUsagersResponse.data.usagers.filter(
              (u) => u.type_usager === 'bus' || u.type === 'bus'
            );
          }
        } catch (err) {
          console.error('❌ Erreur chargement usagers généraux:', err);
        }
      }

      if (usagersData.length === 0) {
        setUsagers([]);
        setFilteredUsagers([]);
        setLoading(false);
        setApiError('Aucun usager bus trouvé dans la base de données');
        return;
      }

      try {
        const paiementsResponse = await axios.get(`${API_URL}/paiements/tous`);
        if (paiementsResponse.data.success) {
          paiements = paiementsResponse.data.paiements || [];
        }
      } catch (err) {
        console.warn('⚠️ Erreur chargement paiements:', err);
      }

      const usagersWithYearData = usagersData.map((usager) => {
        const moisPayesPourAnnee = paiements.filter(
          (p) =>
            p.usager_id === usager.id &&
            (p.usager_type === 'bus' || p.usager_type === usager.type_usager) &&
            p.annee === anneeRecherche &&
            p.statut === 'paye'
        );

        const moisPayes = moisPayesPourAnnee.map((p) => p.mois);

        return {
          ...usager,
          moisPayes: moisPayes,
          totalMoisPayesAnnee: moisPayes.length,
          anneeCourante: anneeRecherche,
          montant_total_paye: moisPayesPourAnnee.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0),
        };
      });

      setUsagers(usagersWithYearData);
      setFilteredUsagers(usagersWithYearData);
      updateStats(usagersWithYearData);

      const totalRecu = usagersWithYearData.reduce((sum, u) => sum + (u.montant_total_paye || 0), 0);
      setMontantTotalRecu(totalRecu);
    } catch (error) {
      console.error('❌ Erreur chargement données bus:', error);
      setApiError(error.message || 'Erreur de chargement');
      setNotification({
        type: 'error',
        message: '❌ Erreur de chargement des données bus',
      });
    } finally {
      setLoading(false);
    }
  }, [anneeRecherche]);

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

  // Filtrer par années (début/fin)
  const filterByYears = useCallback(
    (data) => {
      let filtered = [...data];
      // On garde tous les usagers, mais on peut éventuellement filtrer sur les mois payés si besoin
      // Ici le filtre est appliqué sur les données déjà chargées pour l'année sélectionnée
      // On ne modifie pas le tableau, on affiche tout
      return filtered;
    },
    [anneeRecherche, anneeDebut, anneeFin]
  );

  // Effets
  useEffect(() => {
    loadAnnees();
  }, [loadAnnees]);

  useEffect(() => {
    if (anneeRecherche) {
      loadData();
    }
  }, [anneeRecherche, loadData]);

  useEffect(() => {
    if (usagers.length > 0) {
      const filtered = filterByYears(usagers);
      setFilteredUsagers(filtered);
      updateStats(filtered);
      setCurrentPage(1);
    }
  }, [anneeDebut, anneeFin, usagers, filterByYears]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsagers = filteredUsagers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsagers.length / itemsPerPage);

  const goToPage = (page) => setCurrentPage(page);

  // Gestionnaires
  const handleAnneeRechercheChange = (value) => {
    setAnneeRecherche(parseInt(value));
    setCurrentPage(1);
  };

  const handleAnneeDebutChange = (value) => {
    setAnneeDebut(value);
    setCurrentPage(1);
  };

  const handleAnneeFinChange = (value) => {
    setAnneeFin(value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setAnneeRecherche(new Date().getFullYear());
    setAnneeDebut('');
    setAnneeFin('');
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
          {/* ===== EN-TÊTE ===== */}
          <div className="page-header">
            <div className="header-left">
              <h1>
                <Bus className="header-icon" size={28} />
                Bus & Transports : <span>Suivi des paiements</span>
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

          {/* ===== FILTRES ===== */}
          <div className="filters-container">
            <div className="filters-row">
              {/* Année de référence */}
              <div className="filter-item">
                <label htmlFor="anneeRef">
                  <Calendar size={14} className="filter-icon" /> Année
                </label>
                <select
                  id="anneeRef"
                  value={anneeRecherche}
                  onChange={(e) => handleAnneeRechercheChange(e.target.value)}
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

              {/* Année début */}
              <div className="filter-item">
                <label htmlFor="anneeDebut">
                  <Calendar size={14} className="filter-icon" /> Début
                </label>
                <select
                  id="anneeDebut"
                  value={anneeDebut}
                  onChange={(e) => handleAnneeDebutChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">Début</option>
                  {anneesDisponibles.map((an) => (
                    <option key={an} value={an}>
                      {an}
                    </option>
                  ))}
                </select>
              </div>

              {/* Année fin */}
              <div className="filter-item">
                <label htmlFor="anneeFin">
                  <Calendar size={14} className="filter-icon" /> Fin
                </label>
                <select
                  id="anneeFin"
                  value={anneeFin}
                  onChange={(e) => handleAnneeFinChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">Fin</option>
                  {anneesDisponibles.map((an) => (
                    <option key={an} value={an}>
                      {an}
                    </option>
                  ))}
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
            {anneeDebut && (
              <span className="indicator-item">
                <Calendar size={14} className="indicator-icon" /> Début : <strong>{anneeDebut}</strong>
              </span>
            )}
            {anneeFin && (
              <span className="indicator-item">
                <Calendar size={14} className="indicator-icon" /> Fin : <strong>{anneeFin}</strong>
              </span>
            )}
            <span className="indicator-item">
              <DollarSign size={14} className="indicator-icon" /> Total reçu :{' '}
              <strong>{montantTotalRecu.toLocaleString()} Ar</strong>
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
                <p>Aucun usager bus trouvé pour la période sélectionnée</p>
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
                      <th>Adresse</th>
                      {/* <th>Type Bus</th> */}
                      <th>Nb véhicules</th>
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
                            <strong>{usager.denomination || usager.nom || '-'}</strong>
                            {usager.region && (
                              <div style={{ fontSize: '0.65em', color: '#666' }}>
                                <MapPin size={12} style={{ display: 'inline', marginRight: '2px' }} />
                                {usager.region}
                              </div>
                            )}
                          </td>
                          <td>{usager.demandeur || usager.representant_par || '-'}</td>
                          <td>{formatPhoneNumber(usager.telephone)}</td>
                          <td>{usager.adresse_siege || usager.adresse || '-'}</td>
                          {/* <td>{usager.type_bus || usager.categorie || '-'}</td> */}
                          <td>{usager.nombre_vehicules || '-'}</td>
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
                <Bus size={18} /> {selectedUsager.denomination || selectedUsager.nom || 'Bus'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h4>
                  <Bus size={16} /> Informations
                </h4>
                <div className="modal-row">
                  <span>ID</span>
                  <strong>#{String(selectedUsager.id).padStart(3, '0')}</strong>
                </div>
                <div className="modal-row">
                  <span>Dénomination</span>
                  <strong>{selectedUsager.denomination || selectedUsager.nom || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Demandeur</span>
                  <strong>{selectedUsager.demandeur || selectedUsager.representant_par || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Adresse</span>
                  <strong>{selectedUsager.adresse_siege || selectedUsager.adresse || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Téléphone</span>
                  <strong>{formatPhoneNumber(selectedUsager.telephone)}</strong>
                </div>
                <div className="modal-row">
                  <span>Région</span>
                  <strong>{selectedUsager.region || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Type Bus</span>
                  <strong>{selectedUsager.type_bus || selectedUsager.categorie || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Nombre véhicules</span>
                  <strong>{selectedUsager.nombre_vehicules || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Lignes</span>
                  <strong>{selectedUsager.lignes || '-'}</strong>
                </div>
                <div className="modal-row">
                  <span>Trajet</span>
                  <strong>{selectedUsager.trajet || '-'}</strong>
                </div>
              </div>
              <div className="modal-section">
                <h4>
                  <DollarSign size={16} /> Paiements - {selectedUsager.anneeCourante || anneeRecherche}
                </h4>
                <div className="modal-row">
                  <span>Montant mensuel</span>
                  <strong>{(selectedUsager.montant_mensuel || 0).toLocaleString()} Ar</strong>
                </div>
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

export default DateBus;