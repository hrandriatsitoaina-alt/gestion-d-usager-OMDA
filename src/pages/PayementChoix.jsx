// src/pages/PayementChoix.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Lock,
  ArrowLeft,
  MapPin,
  Building2,
  Users,
  Coins,
  CreditCard,
  TrendingUp,
  DollarSign,
  X,
  Calendar,
  CalendarDays,
  Hotel,
  Store,
  Tv,
  Bus,
  Music,
  Clock,
  User,
  Clipboard,
  Target
} from 'lucide-react';
import '../styles/gestionPaiement.css';
import MiniSidebar from '../components/MiniSidebar';

const API_URL = 'http://localhost:3001/api';

const PaiementChoix = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [regions, setRegions] = useState([]);
  const [usagersList, setUsagersList] = useState([]);
  const [financeData, setFinanceData] = useState(null);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [montantTotalRecu, setMontantTotalRecu] = useState(0);
  const [filterContext, setFilterContext] = useState('Toutes les régions et tous les types');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // États pour les cartes
  const [totalUsagersFiltres, setTotalUsagersFiltres] = useState(0);
  const [totalPayes, setTotalPayes] = useState(0);
  const [totalNonPayes, setTotalNonPayes] = useState(0);
  const [tauxPaiement, setTauxPaiement] = useState(0);

  // État pour le diagramme
  const [chartData, setChartData] = useState([]);
  const [chartMax, setChartMax] = useState(0);

  // États pour les filtres
  const [selectedRegion, setSelectedRegion] = useState('tous');
  const [selectedUsagerType, setSelectedUsagerType] = useState('tous');
  const [selectedMonth, setSelectedMonth] = useState('tous');
  const [selectedYear, setSelectedYear] = useState('tous');

  // 6 types d'usagers avec icônes Lucide (mais on garde des émojis pour les options <select>)
  const usagerTypes = [
    { id: 'hotel', label: 'Hôtel', icon: '🏨' },
    { id: 'grand-surface', label: 'Grand Surface', icon: '🏪' },
    { id: 'media', label: 'Télé/Radio', icon: '📻' },
    { id: 'occ', label: 'OCC', icon: '📅' },
    { id: 'bus', label: 'Bus', icon: '🚌' },
    { id: 'nightclub', label: 'Night club', icon: '🎵' }
  ];

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchFinanceData();
    fetchPaymentHistory();
    fetchChartData();
  }, [selectedRegion, selectedUsagerType, selectedMonth, selectedYear]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchRegions(),
        fetchUsagers(),
        fetchAvailableYears()
      ]);
      await fetchFinanceData();
      await fetchPaymentHistory();
      await fetchChartData();
    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/paiements/stats`);
      if (response.data.success) {
        setStats(response.data.stats);
        console.log('📊 Stats reçues:', response.data.stats);
      }
      setError(null);
    } catch (err) {
      console.error('❌ Erreur fetchStats:', err);
      setError('Erreur lors du chargement des statistiques');
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await axios.get(`${API_URL}/regions`);
      if (response.data.success) {
        setRegions(response.data.regions);
        console.log('📍 Régions chargées:', response.data.regions);
      }
    } catch (err) {
      console.error('❌ Erreur chargement régions:', err);
    }
  };

  const fetchUsagers = async () => {
    try {
      const response = await axios.get(`${API_URL}/usagers`);
      console.log('📥 Réponse brute /usagers:', response.data);
      
      let usagers = [];
      
      if (Array.isArray(response.data)) {
        usagers = response.data;
      } else if (response.data.usagers && Array.isArray(response.data.usagers)) {
        usagers = response.data.usagers;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        usagers = response.data.data;
      }
      
      if (usagers.length > 0) {
        const normalizedUsagers = usagers.map(u => ({
          id: u.id,
          type_usager: u.type_usager || u.type || 'hotel',
          region: u.region || 'N/A',
          denomination: u.denomination || u.nom || 'Sans nom',
          telephone: u.telephone || '',
          email: u.email || '',
          created_at: u.created_at || new Date().toISOString()
        }));
        
        setUsagersList(normalizedUsagers);
        console.log(`👥 ${normalizedUsagers.length} usagers chargés et normalisés`);
      } else {
        console.warn('⚠️ Aucun usager trouvé dans la réponse');
        setUsagersList([]);
      }
    } catch (err) {
      console.error('❌ Erreur chargement usagers:', err);
      setUsagersList([]);
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const response = await axios.get(`${API_URL}/paiements/annees-disponibles/tous`);
      if (response.data.success && response.data.annees.length > 0) {
        setAvailableYears(response.data.annees);
        const currentYear = new Date().getFullYear();
        if (response.data.annees.includes(currentYear)) {
          setSelectedYear(currentYear.toString());
        } else {
          setSelectedYear(response.data.annees[0].toString());
        }
        console.log('📆 Années disponibles:', response.data.annees);
      } else {
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
        setAvailableYears(years);
        setSelectedYear(currentYear.toString());
      }
    } catch (err) {
      console.error('❌ Erreur chargement années:', err);
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
      setAvailableYears(years);
      setSelectedYear(currentYear.toString());
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/paiements/historique-complet`);
      if (response.data.success) {
        let history = response.data.historique || [];
        
        if (selectedRegion !== 'tous') {
          history = history.filter(p => p.region === selectedRegion);
        }
        
        if (selectedUsagerType !== 'tous') {
          history = history.filter(p => p.usager_type === selectedUsagerType);
        }

        if (selectedMonth !== 'tous' && selectedYear !== 'tous') {
          history = history.filter(p => {
            return p.mois === parseInt(selectedMonth) && 
                   p.annee === parseInt(selectedYear);
          });
        } else if (selectedMonth !== 'tous') {
          history = history.filter(p => p.mois === parseInt(selectedMonth));
        } else if (selectedYear !== 'tous') {
          history = history.filter(p => p.annee === parseInt(selectedYear));
        }
        
        history.sort((a, b) => {
          const dateA = new Date(a.date_paiement || a.created_at);
          const dateB = new Date(b.date_paiement || b.created_at);
          return dateB - dateA;
        });
        
        setPaymentHistory(history);
        console.log(`📄 ${history.length} paiements dans l'historique (filtrés)`);
      } else {
        setPaymentHistory([]);
      }
    } catch (err) {
      console.error('❌ Erreur chargement historique:', err);
      setPaymentHistory([]);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await axios.get(`${API_URL}/paiements/tous`);
      
      if (response.data.success) {
        const paiements = response.data.paiements || [];
        
        let paiementsFiltres = paiements.filter(p => p.statut === 'paye');
        
        if (selectedRegion !== 'tous') {
          paiementsFiltres = paiementsFiltres.filter(p => p.region === selectedRegion);
        }
        
        if (selectedUsagerType !== 'tous') {
          paiementsFiltres = paiementsFiltres.filter(p => p.usager_type === selectedUsagerType);
        }
        
        const yearToUse = selectedYear !== 'tous' ? parseInt(selectedYear) : new Date().getFullYear();
        const moisData = {};
        for (let i = 1; i <= 12; i++) {
          moisData[i] = 0;
        }
        
        for (const p of paiementsFiltres) {
          if (p.annee === yearToUse) {
            const mois = p.mois || 1;
            if (moisData[mois] !== undefined) {
              moisData[mois] += parseFloat(p.montant) || 0;
            }
          }
        }
        
        if (selectedMonth !== 'tous') {
          const moisSelectionne = parseInt(selectedMonth);
          for (let i = 1; i <= 12; i++) {
            if (i !== moisSelectionne) {
              moisData[i] = 0;
            }
          }
        }
        
        const chartDataArray = [];
        let maxValue = 0;
        
        for (let i = 1; i <= 12; i++) {
          const value = moisData[i] || 0;
          chartDataArray.push({
            mois: i,
            label: monthLabels[i - 1],
            value: value,
            isSelected: selectedMonth !== 'tous' ? i === parseInt(selectedMonth) : false
          });
          if (value > maxValue) maxValue = value;
        }
        
        setChartData(chartDataArray);
        setChartMax(maxValue > 0 ? maxValue : 1);
        
        console.log('📊 Données du diagramme:', chartDataArray);
      }
    } catch (err) {
      console.error('❌ Erreur chargement données diagramme:', err);
      const defaultData = [];
      for (let i = 1; i <= 12; i++) {
        defaultData.push({
          mois: i,
          label: monthLabels[i - 1],
          value: 0,
          isSelected: false
        });
      }
      setChartData(defaultData);
      setChartMax(1);
    }
  };

  const fetchFinanceData = async () => {
    try {
      setLoadingFinance(true);
      
      let data = [];
      let totalRecu = 0;
      let context = 'Toutes les régions et tous les types';
      
      const response = await axios.get(`${API_URL}/paiements/tous`);
      console.log('📥 Réponse paiements/tous:', response.data);
      
      if (response.data.success) {
        const paiements = response.data.paiements || [];
        console.log(`📊 ${paiements.length} paiements reçus`);
        
        let paiementsFiltres = paiements.filter(p => p.statut === 'paye');
        console.log(`💰 ${paiementsFiltres.length} paiements payés`);
        
        if (selectedMonth !== 'tous' && selectedYear !== 'tous') {
          paiementsFiltres = paiementsFiltres.filter(p => {
            return p.mois === parseInt(selectedMonth) && 
                   p.annee === parseInt(selectedYear);
          });
        } else if (selectedMonth !== 'tous') {
          paiementsFiltres = paiementsFiltres.filter(p => p.mois === parseInt(selectedMonth));
        } else if (selectedYear !== 'tous') {
          paiementsFiltres = paiementsFiltres.filter(p => p.annee === parseInt(selectedYear));
        }
        
        if (selectedRegion !== 'tous') {
          paiementsFiltres = paiementsFiltres.filter(p => p.region === selectedRegion);
        }
        
        console.log(`🎯 ${paiementsFiltres.length} paiements après filtres`);
        
        const usagersPayesMap = new Map();
        for (const p of paiementsFiltres) {
          const key = `${p.usager_id}-${p.usager_type}`;
          if (!usagersPayesMap.has(key)) {
            usagersPayesMap.set(key, {
              usager_id: p.usager_id,
              usager_type: p.usager_type,
              montant_total: 0,
              region: p.region || 'Non spécifiée'
            });
          }
          const usager = usagersPayesMap.get(key);
          usager.montant_total += parseFloat(p.montant) || 0;
        }
        
        const payesCount = usagersPayesMap.size;
        console.log(`👤 ${payesCount} usagers payés uniques`);
        
        let usagersFiltres = [...usagersList];
        console.log(`📋 ${usagersFiltres.length} usagers dans la liste`);
        
        if (selectedRegion !== 'tous') {
          usagersFiltres = usagersFiltres.filter(u => u.region === selectedRegion);
          console.log(`📍 Après filtre région ${selectedRegion}: ${usagersFiltres.length}`);
        }
        
        if (selectedUsagerType !== 'tous') {
          usagersFiltres = usagersFiltres.filter(u => u.type_usager === selectedUsagerType);
          console.log(`🏢 Après filtre type ${selectedUsagerType}: ${usagersFiltres.length}`);
        }
        
        const totalUsagersFiltres = usagersFiltres.length;
        const nonPayesCount = Math.max(0, totalUsagersFiltres - payesCount);
        const taux = totalUsagersFiltres > 0 ? Math.round((payesCount / totalUsagersFiltres) * 100) : 0;
        
        console.log('📊 RÉSULTATS FINAUX:', {
          totalUsagersFiltres,
          payesCount,
          nonPayesCount,
          taux
        });
        
        setTotalUsagersFiltres(totalUsagersFiltres);
        setTotalPayes(payesCount);
        setTotalNonPayes(nonPayesCount);
        setTauxPaiement(taux);
        
        let montantTotal = 0;
        for (const [key, usager] of usagersPayesMap) {
          montantTotal += usager.montant_total;
        }
        setMontantTotalRecu(montantTotal);
        
        context = `${selectedRegion !== 'tous' ? `Région: ${selectedRegion}, ` : 'Toutes les régions, '}${selectedMonth !== 'tous' ? monthNames[parseInt(selectedMonth) - 1] : 'Tous mois'} ${selectedYear !== 'tous' ? selectedYear : 'Toutes années'}`;
        setFilterContext(context);
        
        data = usagerTypes.map(type => {
          const typeUsagers = usagersFiltres.filter(u => u.type_usager === type.id);
          const typeTotal = typeUsagers.length;
          let typePayes = 0;
          let typeMontant = 0;
          
          for (const [key, usager] of usagersPayesMap) {
            if (usager.usager_type === type.id) {
              typePayes++;
              typeMontant += usager.montant_total;
            }
          }
          
          return {
            type: type.id,
            label: type.label,
            totalUsagers: typeTotal,
            usagersAvecPaiement: typePayes,
            usagersSansPaiement: Math.max(0, typeTotal - typePayes),
            montantTotalPaye: typeMontant,
            details: []
          };
        });
        
        for (const typeData of data) {
          const typePayesMap = new Map();
          for (const [key, usager] of usagersPayesMap) {
            if (usager.usager_type === typeData.type) {
              const regionKey = usager.region || 'Non spécifiée';
              if (!typePayesMap.has(regionKey)) {
                typePayesMap.set(regionKey, { montant: 0, count: 0 });
              }
              const regionData = typePayesMap.get(regionKey);
              regionData.montant += usager.montant_total;
              regionData.count++;
            }
          }
          
          for (const [region, regionData] of typePayesMap) {
            typeData.details.push({
              region: region,
              montant_total: regionData.montant,
              nombre_usagers: regionData.count
            });
          }
        }
      }
      
      setFinanceData(data);
      
    } catch (err) {
      console.error('❌ Erreur chargement données financières:', err);
      if (stats) {
        let totalUsagers = 0;
        let totalPayes = 0;
        let totalRecu = 0;
        
        const dataTemp = usagerTypes.map(type => {
          const typeStats = stats[type.id] || { total: 0, totalPayes: 0, nonPayes: 0, montantTotal: 0 };
          totalUsagers += typeStats.total || 0;
          totalPayes += typeStats.totalPayes || 0;
          totalRecu += typeStats.montantTotal || 0;
          
          return {
            type: type.id,
            label: type.label,
            totalUsagers: typeStats.total || 0,
            usagersAvecPaiement: typeStats.totalPayes || 0,
            usagersSansPaiement: typeStats.nonPayes || 0,
            montantTotalPaye: typeStats.montantTotal || 0,
            details: []
          };
        });
        
        setFinanceData(dataTemp);
        setMontantTotalRecu(totalRecu);
        setTotalUsagersFiltres(totalUsagers);
        setTotalPayes(totalPayes);
        setTotalNonPayes(Math.max(0, totalUsagers - totalPayes));
        setTauxPaiement(totalUsagers > 0 ? Math.round((totalPayes / totalUsagers) * 100) : 0);
      }
    } finally {
      setLoadingFinance(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    try {
      const response = await axios.post(`${API_URL}/admin/verify`, {
        password: adminPassword
      });
      if (response.data.success) {
        setShowAdminModal(false);
        setAdminPassword('');
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminRole', response.data.role || 'daf');
        navigate('/gere-payer');
      } else {
        setAdminError('Mot de passe incorrect');
      }
    } catch (err) {
      setAdminError('Erreur de vérification');
      console.error(err);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const getTypeLabel = (typeId) => {
    const type = usagerTypes.find(t => t.id === typeId);
    return type ? type.label : typeId;
  };

  const getCorrectedStats = (typeId) => {
    const typeStats = stats?.[typeId] || { total: 0, totalPayes: 0, nonPayes: 0, montantTotal: 0 };
    if (typeStats.nonPayes < 0) {
      typeStats.nonPayes = 0;
    }
    return typeStats;
  };

  const handleRetour = () => {
    navigate('/dashboard');
  };

  const getPeriodLabel = () => {
    if (selectedMonth === 'tous' && selectedYear === 'tous') {
      return 'Toutes périodes';
    } else if (selectedMonth === 'tous') {
      return `Année ${selectedYear}`;
    } else if (selectedYear === 'tous') {
      return `Mois de ${monthNames[parseInt(selectedMonth) - 1]}`;
    } else {
      return `${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`;
    }
  };

  if (loading) {
    return (
      <>
        <MiniSidebar />
        <div className="payment-loading">
          <div className="spinner"></div>
          <p>Chargement des données financières...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <MiniSidebar />
        <div className="payment-error">
          <p>{error}</p>
          <button onClick={fetchAllData} className="btn-retry">Réessayer</button>
        </div>
      </>
    );
  }

  return (
    <>
      <MiniSidebar />
      <div className="payment-container">
        {/* En-tête */}
        <div className="payment-header">
          <div className="header-left">
            <h1>
              <BarChart3 className="header-icon" size={28} style={{ marginRight: '8px' }} />
              Tableau de Bord Financier
            </h1>
            <p className="header-subtitle">Suivi des paiements et statistiques des usagers</p>
          </div>
          <div className="header-actions">
            <button onClick={handlePrintPDF} className="btn-pdf">
              <FileText size={18} style={{ marginRight: '6px' }} /> Aperçu PDF
            </button>
            <button 
              onClick={() => setShowAdminModal(true)} 
              className="btn-gestion"
            >
              <Lock size={18} style={{ marginRight: '6px' }} /> Gestion des paiements
            </button>
            <button className="btn-retour" onClick={handleRetour}>
              <ArrowLeft size={18} style={{ marginRight: '6px' }} /> Retour
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="filters-section">
          <div className="filters-left">
            <div className="filter-group">
              <label><MapPin size={16} style={{ marginRight: '4px' }} /> Région</label>
              <select 
                value={selectedRegion} 
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="filter-select"
              >
                <option value="tous">Toutes les régions</option>
                {regions.map(region => (
                  <option key={region.id} value={region.nom}>{region.nom}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label><Building2 size={16} style={{ marginRight: '4px' }} /> Type d'usager</label>
              <select 
                value={selectedUsagerType} 
                onChange={(e) => setSelectedUsagerType(e.target.value)}
                className="filter-select"
              >
                <option value="tous">Tous les types</option>
                {usagerTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filters-right">
            <div className="filter-group">
              <label><Calendar size={16} style={{ marginRight: '4px' }} /> Mois</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="filter-select"
              >
                <option value="tous">Tous les mois</option>
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label><CalendarDays size={16} style={{ marginRight: '4px' }} /> Année</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-select"
              >
                <option value="tous">Toutes les années</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          {loadingFinance && <span className="loading-spinner"><Clock size={20} /></span>}
        </div>

        {/* Cartes de synthèse */}
        <div className="summary-cards">
          <div className="summary-card total-usagers">
            <div className="card-icon"><Users size={24} /></div>
            <div className="card-content">
              <span className="card-label">Total Usagers</span>
              <span className="card-value">{totalUsagersFiltres}</span>
              <span className="card-sub-label">
                {selectedRegion !== 'tous' ? `Région: ${selectedRegion}` : 'Toutes régions'}
                {selectedUsagerType !== 'tous' && ` • ${usagerTypes.find(t => t.id === selectedUsagerType)?.label}`}
              </span>
            </div>
          </div>

          <div className="summary-card total-payes">
            <div className="card-icon"><Coins size={24} /></div>
            <div className="card-content">
              <span className="card-label">Total Payés</span>
              <span className="card-value">{totalPayes}</span>
              <span className="card-sub-label">Usagers avec paiement</span>
            </div>
          </div>

          <div className="summary-card total-non-payes">
            <div className="card-icon"><CreditCard size={24} /></div>
            <div className="card-content">
              <span className="card-label">Non Payés</span>
              <span className="card-value">{totalNonPayes}</span>
              <span className="card-sub-label">
                {selectedMonth !== 'tous' ? monthNames[parseInt(selectedMonth) - 1] : 'Tous mois'}
                {selectedYear !== 'tous' && ` ${selectedYear}`}
              </span>
            </div>
          </div>

          <div className="summary-card taux-paiement">
            <div className="card-icon"><TrendingUp size={24} /></div>
            <div className="card-content">
              <span className="card-label">Taux de Paiement</span>
              <span className="card-value">{tauxPaiement}%</span>
              <span className="card-sub-label">
                {totalUsagersFiltres > 0 ? `${totalPayes}/${totalUsagersFiltres} payés` : 'Aucun usager'}
              </span>
            </div>
          </div>

          <div className="summary-card montant-recu">
            <div className="card-icon"><DollarSign size={24} /></div>
            <div className="card-content">
              <span className="card-label">Montant Reçu</span>
              <span className="card-value montant-recu-value">
                {montantTotalRecu.toLocaleString()} Ar
              </span>
              <span className="card-sub-label">{filterContext}</span>
            </div>
          </div>
        </div>

        {/* 6 usagers sur une ligne */}
        <div className="usagers-stats-row">
          {usagerTypes.map(type => {
            if (selectedUsagerType !== 'tous' && selectedUsagerType !== type.id) {
              return null;
            }

            const typeStats = getCorrectedStats(type.id);
            let financeType = financeData?.find(f => f.type === type.id) || { 
              totalUsagers: 0, 
              usagersAvecPaiement: 0, 
              usagersSansPaiement: 0, 
              montantTotalPaye: 0,
              details: []
            };
            
            const total = financeType.totalUsagers || typeStats.total || 0;
            const payes = financeType.usagersAvecPaiement || typeStats.totalPayes || 0;
            const nonPayes = Math.max(0, financeType.usagersSansPaiement || typeStats.nonPayes || 0);
            const montant = financeType.montantTotalPaye || typeStats.montantTotal || 0;
            const taux = total > 0 ? Math.round((payes / total) * 100) : 0;

            // Choix de l'icône selon le type
            let TypeIcon = Hotel;
            if (type.id === 'grand-surface') TypeIcon = Store;
            else if (type.id === 'media') TypeIcon = Tv;
            else if (type.id === 'occ') TypeIcon = Calendar;
            else if (type.id === 'bus') TypeIcon = Bus;
            else if (type.id === 'nightclub') TypeIcon = Music;

            return (
              <div key={type.id} className="usager-stat-card">
                <div className="usager-stat-header">
                  <span className="usager-icon"><TypeIcon size={20} /></span>
                  <span className="usager-label">{type.label}</span>
                </div>
                <div className="usager-stat-body">
                  <div className="usager-stat-item">
                    <span className="usager-stat-label">Total</span>
                    <span className="usager-stat-value">{total}</span>
                  </div>
                  <div className="usager-stat-item">
                    <span className="usager-stat-label">Payés</span>
                    <span className="usager-stat-value success">{payes}</span>
                  </div>
                  <div className="usager-stat-item">
                    <span className="usager-stat-label">Non Payés</span>
                    <span className="usager-stat-value danger">{nonPayes}</span>
                  </div>
                  <div className="usager-stat-item montant-item">
                    <span className="usager-stat-label">Montant</span>
                    <span className="usager-stat-value montant-value">
                      {montant.toLocaleString()} Ar
                    </span>
                  </div>
                  <div className="usager-progress">
                    <div className="usager-progress-bar">
                      <div 
                        className="usager-progress-fill" 
                        style={{ width: `${taux}%` }}
                      />
                    </div>
                    <span className="usager-progress-label">{taux}% payé</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Régions */}
        <div className="regions-section">
          <h2 className="section-title">
            <TrendingUp size={20} className="section-icon" style={{ marginRight: '8px' }} />
            Aperçu par Région
            {selectedRegion !== 'tous' && (
              <span className="filter-badge">Filtré: {selectedRegion}</span>
            )}
            {selectedUsagerType !== 'tous' && (
              <span className="filter-badge">Type: {usagerTypes.find(t => t.id === selectedUsagerType)?.label || ''}</span>
            )}
            <span className="filter-badge" style={{ backgroundColor: '#2980b9', color: '#fff' }}>
              {getPeriodLabel()}
            </span>
          </h2>
          <div className="regions-grid">
            <div className="region-card region-total">
              <div className="region-header">
                <span className="region-name">Toutes les régions</span>
                <span className="region-total-amount">
                  {montantTotalRecu.toLocaleString()} Ar
                </span>
              </div>
              <div className="region-stats">
                <span>Usagers: {totalUsagersFiltres}</span>
                <span>Taux: {tauxPaiement}%</span>
                <span>Reçu: {montantTotalRecu.toLocaleString()} Ar</span>
              </div>
            </div>
            {regions.map(region => {
              if (selectedRegion !== 'tous' && selectedRegion !== region.nom) {
                return null;
              }

              let regionMontant = 0;
              let regionUsagers = 0;
              
              if (financeData) {
                for (const type of financeData) {
                  if (type.details) {
                    for (const detail of type.details) {
                      if (detail.region === region.nom) {
                        regionMontant += detail.montant_total || 0;
                        regionUsagers += detail.nombre_usagers || 0;
                      }
                    }
                  }
                }
              }
              
              return (
                <div key={region.id} className="region-card">
                  <div className="region-header">
                    <span className="region-name">{region.nom}</span>
                    <span className="region-amount">
                      {regionMontant.toLocaleString()} Ar
                    </span>
                  </div>
                  <div className="region-stats">
                    <span>Usagers: {regionUsagers}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historique des paiements */}
        <div className="history-section">
          <h2 className="section-title">
            <FileText size={20} className="section-icon" style={{ marginRight: '8px' }} />
            Historique des paiements
            {selectedRegion !== 'tous' && (
              <span className="filter-badge">Région: {selectedRegion}</span>
            )}
            {selectedUsagerType !== 'tous' && (
              <span className="filter-badge">Type: {usagerTypes.find(t => t.id === selectedUsagerType)?.label || ''}</span>
            )}
            <span className="filter-badge" style={{ backgroundColor: '#27ae60', color: '#fff' }}>
              {getPeriodLabel()}
            </span>
            <span className="filter-badge" style={{ backgroundColor: '#8e44ad', color: '#fff' }}>
              Total: {paymentHistory.length} paiements
            </span>
          </h2>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Usager</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Mois/Année</th>
                  <th>Date Paiement</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory && paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, index) => (
                    <tr key={payment.id || index}>
                      <td>{payment.usager_nom || 'Inconnu'}</td>
                      <td>
                        <span className="type-badge">
                          {usagerTypes.find(t => t.id === payment.usager_type)?.label || payment.usager_type}
                        </span>
                      </td>
                      <td>{(payment.montant || 0).toLocaleString()} Ar</td>
                      <td>
                        {payment.mois ? monthNames[(payment.mois || 1) - 1] : ''} 
                        {payment.annee || ''}
                      </td>
                      <td>{formatDate(payment.date_paiement || payment.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      Aucun paiement enregistré pour {getPeriodLabel().toLowerCase()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="payment-footer">
          <p>© 2026 OMDA - Gestion Financière</p>
          <p>Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* Modal Admin */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal-content admin-modal">
            <button 
              className="modal-close"
              onClick={() => {
                setShowAdminModal(false);
                setAdminPassword('');
                setAdminError('');
              }}
            >
              <X size={20} />
            </button>
            <div className="modal-header">
              <span className="modal-icon"><Lock size={24} /></span>
              <h2>Accès Gestion des Paiements</h2>
              <p>Veuillez entrer votre code d'authentification (DAF)</p>
            </div>
            <form onSubmit={handleAdminLogin} className="admin-form">
              <input
                type="password"
                placeholder="Code à 4 chiffres"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                maxLength={4}
                pattern="[0-9]{4}"
                className="admin-input"
                autoFocus
              />
              {adminError && <p className="error-message">{adminError}</p>}
              <button type="submit" className="btn-admin-login">
                <Lock size={18} style={{ marginRight: '6px' }} /> Vérifier l'accès
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PaiementChoix;