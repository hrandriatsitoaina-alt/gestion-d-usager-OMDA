// src/pages/date_bus.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/date_grandSurface.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

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
  
  // États pour les filtres
  const [anneeRecherche, setAnneeRecherche] = useState(new Date().getFullYear());
  const [anneeDebut, setAnneeDebut] = useState('');
  const [anneeFin, setAnneeFin] = useState('');
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  
  // États pour les statistiques
  const [statsGraph, setStatsGraph] = useState({
    bonPayeur: 0,
    payeurMoyen: 0,
    mauvaisPayeur: 0,
    nonPayeur: 0,
    total: 0
  });

  // États pour les notifications
  const [notification, setNotification] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [montantTotalRecu, setMontantTotalRecu] = useState(0);

  // Mois labels
  const moisLabelsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Chargement des années disponibles
  const loadAnnees = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/paiements/annees-disponibles/bus`);
      console.log('📡 Années disponibles bus:', response.data);
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

  // Chargement des données principales
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    
    try {
      console.log('📡 Chargement des usagers bus...');
      
      // Récupérer les usagers bus
      const usagersResponse = await axios.get(`${API_URL}/usagers/paiements/bus`);
      console.log('📡 Réponse usagers bus:', usagersResponse.data);
      
      let usagersData = [];
      let paiements = [];
      
      // Récupérer les usagers
      if (usagersResponse.data.success && usagersResponse.data.usagers) {
        usagersData = usagersResponse.data.usagers;
        console.log(`✅ ${usagersData.length} usagers bus trouvés`);
      } else {
        console.warn('⚠️ Aucun usager bus trouvé dans la réponse');
        // Essayer de récupérer depuis l'API générale des usagers
        try {
          const allUsagersResponse = await axios.get(`${API_URL}/usagers`);
          console.log('📡 Réponse all usagers:', allUsagersResponse.data);
          
          if (allUsagersResponse.data.success && allUsagersResponse.data.usagers) {
            usagersData = allUsagersResponse.data.usagers.filter(u => u.type_usager === 'bus' || u.type === 'bus');
            console.log(`✅ ${usagersData.length} usagers bus filtrés depuis la liste générale`);
          }
        } catch (err) {
          console.error('❌ Erreur chargement usagers généraux:', err);
        }
      }
      
      // Si toujours pas d'usagers, afficher un message
      if (usagersData.length === 0) {
        setUsagers([]);
        setFilteredUsagers([]);
        setLoading(false);
        setApiError('Aucun usager bus trouvé dans la base de données');
        return;
      }
      
      // Récupérer les paiements
      try {
        const paiementsResponse = await axios.get(`${API_URL}/paiements/tous`);
        if (paiementsResponse.data.success) {
          paiements = paiementsResponse.data.paiements || [];
          console.log(`💰 ${paiements.length} paiements récupérés`);
        }
      } catch (err) {
        console.warn('⚠️ Erreur chargement paiements:', err);
      }
      
      // Transformer les données
      const usagersWithYearData = usagersData.map(usager => {
        // Filtrer les paiements pour cet usager et l'année sélectionnée
        const moisPayesPourAnnee = paiements.filter(p => 
          p.usager_id === usager.id && 
          (p.usager_type === 'bus' || p.usager_type === usager.type_usager) &&
          p.annee === anneeRecherche &&
          p.statut === 'paye'
        );
        
        const moisPayes = moisPayesPourAnnee.map(p => p.mois);
        
        return {
          ...usager,
          moisPayes: moisPayes,
          totalMoisPayesAnnee: moisPayes.length,
          anneeCourante: anneeRecherche,
          montant_total_paye: moisPayesPourAnnee.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0)
        };
      });
      
      console.log('📊 Usagers transformés:', usagersWithYearData);
      
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
        message: '❌ Erreur de chargement des données bus' 
      });
    } finally {
      setLoading(false);
    }
  }, [anneeRecherche]);

  // Filtrer par années
  const filterByYears = useCallback((data) => {
    let filtered = [...data];
    
    if (anneeRecherche) {
      // Ne pas filtrer par année, on affiche tous les usagers avec leurs paiements pour l'année sélectionnée
      // On garde tous les usagers
    }
    
    if (anneeDebut && anneeFin) {
      const debut = parseInt(anneeDebut);
      const fin = parseInt(anneeFin);
      filtered = filtered.filter(u => {
        return u.moisPayes?.some(m => m >= debut && m <= fin);
      });
    } else if (anneeDebut) {
      const debut = parseInt(anneeDebut);
      filtered = filtered.filter(u => u.moisPayes?.some(m => m >= debut));
    } else if (anneeFin) {
      const fin = parseInt(anneeFin);
      filtered = filtered.filter(u => u.moisPayes?.some(m => m <= fin));
    }
    
    return filtered;
  }, [anneeRecherche, anneeDebut, anneeFin]);

  // Mise à jour des statistiques
  const updateStats = (data) => {
    const stats = {
      bonPayeur: data.filter(u => (u.totalMoisPayesAnnee || 0) >= 9).length,
      payeurMoyen: data.filter(u => (u.totalMoisPayesAnnee || 0) >= 5 && (u.totalMoisPayesAnnee || 0) <= 8).length,
      mauvaisPayeur: data.filter(u => (u.totalMoisPayesAnnee || 0) > 0 && (u.totalMoisPayesAnnee || 0) < 5).length,
      nonPayeur: data.filter(u => (u.totalMoisPayesAnnee || 0) === 0).length,
      total: data.length
    };
    setStatsGraph(stats);
  };

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

  // Calcul des pourcentages pour le graphique
  const bonPayeurPercent = statsGraph.total > 0 ? (statsGraph.bonPayeur / statsGraph.total) * 100 : 0;
  const payeurMoyenPercent = statsGraph.total > 0 ? (statsGraph.payeurMoyen / statsGraph.total) * 100 : 0;
  const mauvaisPayeurPercent = statsGraph.total > 0 ? (statsGraph.mauvaisPayeur / statsGraph.total) * 100 : 0;
  const nonPayeurPercent = statsGraph.total > 0 ? (statsGraph.nonPayeur / statsGraph.total) * 100 : 0;

  // Statistiques rapides
  const totalUsagers = filteredUsagers.length;
  const nonPayes = filteredUsagers.filter(u => (u.totalMoisPayesAnnee || 0) === 0).length;
  const partiels = filteredUsagers.filter(u => (u.totalMoisPayesAnnee || 0) > 0 && (u.totalMoisPayesAnnee || 0) < 12).length;
  const aJour = filteredUsagers.filter(u => (u.totalMoisPayesAnnee || 0) === 12).length;
  const tauxPaiement = totalUsagers > 0 ? Math.round(((totalUsagers - nonPayes) / totalUsagers) * 100) : 0;

  const handleRetour = () => navigate('/dashboard');

  return (
    <>
      <Header />
      <Sidebar />
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
          {/* ===== HEADER + FILTRES ===== */}
          <div className="header-filters-card">
            <div className="header-filters-left">
              <button className="btn-retour-header" onClick={handleRetour}>
                ← Retour
              </button>
              <div className="header-filters-title">
                <h1>🚌 Bus & Transports</h1>
                <p>Suivi des paiements mensuels</p>
              </div>
            </div>
            <div className="header-filters-right">
              <div className="filter-group">
                <label>📆 Année</label>
                <select 
                  value={anneeRecherche} 
                  onChange={(e) => handleAnneeRechercheChange(e.target.value)}
                  className="filter-select"
                >
                  {anneesDisponibles.length > 0 ? (
                    anneesDisponibles.map(an => (
                      <option key={an} value={an}>{an}</option>
                    ))
                  ) : (
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  )}
                </select>
              </div>
              <div className="filter-group">
                <label>📅 Année début</label>
                <select 
                  value={anneeDebut} 
                  onChange={(e) => handleAnneeDebutChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Sélectionner</option>
                  {anneesDisponibles.map(an => (
                    <option key={an} value={an}>{an}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>📅 Année fin</label>
                <select 
                  value={anneeFin} 
                  onChange={(e) => handleAnneeFinChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Sélectionner</option>
                  {anneesDisponibles.map(an => (
                    <option key={an} value={an}>{an}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group filter-actions">
                <label>&nbsp;</label>
                <div className="filter-buttons">
                  <button className="btn-reset" onClick={resetFilters}>🔄 Réinitialiser</button>
                  <button className="btn-refresh" onClick={refreshData}>🔄 Rafraîchir</button>
                </div>
              </div>
            </div>
          </div>

          {/* ===== INDICATEUR ===== */}
          <div className="indicator-bar">
            <span className="indicator-item">
              📆 Année : <strong>{anneeRecherche}</strong>
            </span>
            {anneeDebut && (
              <span className="indicator-item">
                📅 Début : <strong>{anneeDebut}</strong>
              </span>
            )}
            {anneeFin && (
              <span className="indicator-item">
                📅 Fin : <strong>{anneeFin}</strong>
              </span>
            )}
            <span className="indicator-item">
              💰 Total reçu : <strong>{montantTotalRecu.toLocaleString()} Ar</strong>
            </span>
            <span className="indicator-item indicator-total">
              👥 Total usagers : <strong>{totalUsagers}</strong>
            </span>
          </div>

          {/* ===== STATISTIQUES RAPIDES ===== */}
          <div className="quick-stats">
            <div className="quick-stat">
              <span className="quick-stat-value">{totalUsagers}</span>
              <span className="quick-stat-label">Total</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-value" style={{color: '#28a745'}}>{aJour}</span>
              <span className="quick-stat-label">À jour</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-value" style={{color: '#ffc107'}}>{partiels}</span>
              <span className="quick-stat-label">En retard</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-value" style={{color: '#dc3545'}}>{nonPayes}</span>
              <span className="quick-stat-label">Non payés</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-value" style={{color: '#0284c7'}}>{tauxPaiement}%</span>
              <span className="quick-stat-label">Taux</span>
            </div>
          </div>

          {/* ===== TABLEAU ===== */}
          <div className="table-wrapper">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Chargement des données...</p>
              </div>
            ) : apiError ? (
              <div className="empty error">
                <p>❌ {apiError}</p>
                <button className="btn-refresh" onClick={refreshData}>
                  🔄 Rafraîchir
                </button>
              </div>
            ) : currentUsagers.length === 0 ? (
              <div className="empty">
                <p>Aucun usager bus trouvé pour la période sélectionnée</p>
                <button className="btn-refresh" onClick={refreshData}>
                  🔄 Rafraîchir
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
                      <th>Type Bus</th>
                      <th>Nb véhicules</th>
                      {[...Array(12)].map((_, i) => (
                        <th key={i} className="month-col">{i+1}</th>
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
                        <tr key={usager.id} style={{borderLeft: `4px solid ${statusColor}`}}>
                          <td className="sticky-id">#{String(usager.id).padStart(3, '0')}</td>
                          <td className="sticky-nom">
                            <strong>{usager.denomination || usager.nom || '-'}</strong>
                            {usager.region && (
                              <div style={{fontSize: '0.65em', color: '#666'}}>
                                📍 {usager.region}
                              </div>
                            )}
                          </td>
                          <td>{usager.demandeur || usager.representant_par || '-'}</td>
                          <td>{usager.telephone || '-'}</td>
                          <td>{usager.adresse_siege || usager.adresse || '-'}</td>
                          <td>{usager.type_bus || usager.categorie || '-'}</td>
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
                          <td className="total-cell"><strong>{totalPayes}/12</strong></td>
                          <td className="paye-cell">{totalPayeAr.toLocaleString()} Ar</td>
                          <td className="reste-cell">{reste.toLocaleString()} Ar</td>
                          <td className="status-cell">
                            <span className="status-badge" style={{background: `${statusColor}20`, color: statusColor}}>
                              {statusText}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button className="view-more-btn" onClick={() => openModal(usager)}>
                              👁️
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
            <>
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
            </>
          )}
        </div>
      </main>

      {/* ===== MODAL ===== */}
      {showModal && selectedUsager && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚌 {selectedUsager.denomination || selectedUsager.nom || 'Bus'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h4>🚍 INFORMATIONS</h4>
                <div className="modal-row">
                  <strong>ID :</strong> <span>#{String(selectedUsager.id).padStart(3, '0')}</span>
                </div>
                <div className="modal-row">
                  <strong>Dénomination :</strong> <span>{selectedUsager.denomination || selectedUsager.nom || '-'}</span>
                </div>
                <div className="modal-row">
                  <strong>Demandeur :</strong> <span>{selectedUsager.demandeur || selectedUsager.representant_par || '-'}</span>
                </div>
                <div className="modal-row">
                  <strong>Adresse :</strong> <span>{selectedUsager.adresse_siege || selectedUsager.adresse || '-'}</span>
                </div>
                <div className="modal-row">
                  <strong>Téléphone :</strong> <span>{selectedUsager.telephone || '-'}</span>
                </div>
                <div className="modal-row">
                  <strong>Région :</strong> <span>{selectedUsager.region || '-'}</span>
                </div>
                <div className="modal-row">
                  <strong>Type Bus :</strong> <span>{selectedUsager.type_bus || selectedUsager.categorie || '-'}</span>
                </div>
                <div className="modal-row">
                  <strong>Nombre véhicules :</strong> <span>{selectedUsager.nombre_vehicules || '-'}</span>
                </div>
                <div className="modal-row">
                  <strong>Lignes :</strong> <span>{selectedUsager.lignes || '-'}</span>
                </div>
                <div className="modal-row">
                  <strong>Trajet :</strong> <span>{selectedUsager.trajet || '-'}</span>
                </div>
              </div>
              <div className="modal-section">
                <h4>💰 PAIEMENTS - {selectedUsager.anneeCourante || anneeRecherche}</h4>
                <div className="modal-row">
                  <strong>Montant mensuel :</strong> 
                  <span>{(selectedUsager.montant_mensuel || 0).toLocaleString()} Ar</span>
                </div>
                <div className="modal-row">
                  <strong>Mois payés :</strong> 
                  <span>{selectedUsager.totalMoisPayesAnnee || 0}/12</span>
                </div>
                <div className="modal-row">
                  <strong>Détails :</strong> 
                  <span>
                    {selectedUsager.moisPayes && selectedUsager.moisPayes.length > 0 
                      ? selectedUsager.moisPayes.map(m => moisLabelsShort[m - 1]).join(', ') 
                      : 'Aucun paiement'}
                  </span>
                </div>
                <div className="modal-row">
                  <strong>Total payé :</strong> 
                  <span style={{color: '#28a745', fontWeight: 'bold'}}>
                    {(selectedUsager.montant_total_paye || 0).toLocaleString()} Ar
                  </span>
                </div>
                <div className="modal-row">
                  <strong>Reste :</strong> 
                  <span style={{color: '#dc3545', fontWeight: 'bold'}}>
                    {((12 - (selectedUsager.totalMoisPayesAnnee || 0)) * (selectedUsager.montant_mensuel || 0)).toLocaleString()} Ar
                  </span>
                </div>
                <div className="modal-row">
                  <strong>Statut :</strong> 
                  <span className="status-badge" style={{background: `${getStatusColor(selectedUsager)}20`, color: getStatusColor(selectedUsager)}}>
                    {getStatusText(selectedUsager)}
                  </span>
                </div>
              </div>
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

export default DateBus;