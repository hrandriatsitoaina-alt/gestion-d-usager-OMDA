// src/pages/TableauDB.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, DollarSign, Calendar, MapPin, Building2, TrendingUp, TrendingDown,
  AlertCircle, Clock, BarChart3, RefreshCw, ArrowLeft, Download, Printer,
  Activity, Target, Award, PieChart, LineChart as LineChartIcon, Filter,
  Zap, Eye, X, CheckCircle, AlertTriangle, Info, ChevronRight, ChevronLeft,
  MoreVertical, Share2, UserPlus, FileText, Briefcase, Home, Phone, Mail,
  CreditCard, Hash, Bus, Navigation, Route, Truck, Star, Trophy, Tv, Radio,
  Music, Sparkles, Hotel, Store, ShoppingBag, PartyPopper
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart,
  Line
} from 'recharts';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';
import '../styles/TableauDB.css';

const API_URL = 'http://localhost:3001/api';

const TableauDB = () => {
  const navigate = useNavigate();
  // États principaux
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usagers, setUsagers] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [availableYears, setAvailableYears] = useState([]);

  // KPI
  const [kpi, setKpi] = useState({
    totalUsagers: 0,
    totalImpayes: 0,
    totalEvenements: 0,
    usagersEnRetard: 0,
    totalRecettes: 0,
    tauxRecouvrement: 0,
    objectifAnnuel: 180000000,
    progressionObjectif: 0,
    nouveauxContrats: 0,
    recettesMoyennes: 0,
    croissance: 0,
  });

  // Données mensuelles
  const [monthlyData, setMonthlyData] = useState([]);
  // Répartition par type
  const [typeDistribution, setTypeDistribution] = useState([]);
  // Données pour le tableau mensuel
  const [monthlyTableData, setMonthlyTableData] = useState([]);
  // Statistiques par région
  const [regionStats, setRegionStats] = useState([]);
  // Données de paiement par type (pour graphique)
  const [paymentByType, setPaymentByType] = useState([]);

  // Couleurs professionnelles (bleu ciel / azur)
  const COLORS = ['#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5', '#0288D1', '#01579B'];
  const CHART_COLORS = ['#4FC3F7', '#81D4FA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1'];

  // ---- Formattage des montants (sans "k" ni "M") ----
  const formatMontant = (val) => {
    if (val === 0 || !val) return '0 Ar';
    const rounded = Math.round(val);
    return rounded.toLocaleString('fr-FR') + ' Ar';
  };

  // ---- Chargement des données ----
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer tous les usagers
      const usagersRes = await axios.get(`${API_URL}/usagers`);
      let usagersData = usagersRes.data || [];
      if (!Array.isArray(usagersData)) {
        if (usagersData.usagers && Array.isArray(usagersData.usagers)) {
          usagersData = usagersData.usagers;
        } else {
          usagersData = [];
        }
      }
      setUsagers(usagersData);

      // Récupérer tous les paiements
      const paiementsRes = await axios.get(`${API_URL}/paiements/tous`);
      let paiementsData = paiementsRes.data.paiements || [];
      if (!Array.isArray(paiementsData)) paiementsData = [];
      setPaiements(paiementsData);

      // Extraire les années disponibles des paiements
      const years = new Set();
      paiementsData.forEach(p => { if (p.annee) years.add(p.annee); });
      if (years.size === 0) {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear - 2; y <= currentYear + 1; y++) years.add(y);
      }
      const yearsArray = Array.from(years).sort((a, b) => b - a);
      setAvailableYears(yearsArray);

      // ---- Calcul des KPI ----
      const totalUsagers = usagersData.length;
      const totalRecettes = paiementsData
        .filter(p => p.statut === 'paye')
        .reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
      const totalImpayes = paiementsData
        .filter(p => p.statut !== 'paye')
        .reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
      const totalEvenements = usagersData.filter(u => u.type_usager === 'OCC').length;

      const usagerIdsWithImpays = new Set();
      paiementsData.forEach(p => {
        if (p.statut !== 'paye') usagerIdsWithImpays.add(p.usager_id);
      });
      const usagersEnRetard = usagerIdsWithImpays.size;

      const tauxRecouvrement = (totalRecettes + totalImpayes) > 0
        ? Math.round((totalRecettes / (totalRecettes + totalImpayes)) * 100)
        : 0;
      const objectifAnnuel = 180000000;
      const progressionObjectif = Math.min(Math.round((totalRecettes / objectifAnnuel) * 100), 100);
      const nouveauxContrats = usagersData.filter(u => {
        const date = new Date(u.created_at);
        return date.getFullYear() === selectedYear;
      }).length;

      const recettesMoyennes = totalUsagers > 0 ? totalRecettes / totalUsagers : 0;
      const croissance = 18.5;

      setKpi({
        totalUsagers,
        totalImpayes,
        totalEvenements,
        usagersEnRetard,
        totalRecettes,
        tauxRecouvrement,
        objectifAnnuel,
        progressionObjectif,
        nouveauxContrats,
        recettesMoyennes,
        croissance,
      });

      // ---- Données mensuelles ----
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthlyMap = {};
      months.forEach(m => monthlyMap[m] = { mois: m, usagers: 0, montant: 0, occ: 0, bus: 0, gs: 0, nc: 0, tr: 0, hotel: 0 });

      usagersData.forEach(u => {
        const date = new Date(u.created_at);
        if (date.getFullYear() === selectedYear) {
          const monthIndex = date.getMonth();
          const monthKey = months[monthIndex];
          if (monthlyMap[monthKey]) {
            monthlyMap[monthKey].usagers += 1;
            const type = u.type_usager;
            if (type === 'OCC') monthlyMap[monthKey].occ += 1;
            else if (type === 'Bus') monthlyMap[monthKey].bus += 1;
            else if (type === 'Grand Surface') monthlyMap[monthKey].gs += 1;
            else if (type === 'Night club') monthlyMap[monthKey].nc += 1;
            else if (type === 'Télé/Radio') monthlyMap[monthKey].tr += 1;
            else if (type === 'Hôtel') monthlyMap[monthKey].hotel += 1;
          }
        }
      });

      paiementsData.forEach(p => {
        if (p.annee === selectedYear && p.statut === 'paye') {
          const month = p.mois ? p.mois - 1 : new Date(p.date_paiement).getMonth();
          const monthKey = months[month];
          if (monthlyMap[monthKey]) {
            monthlyMap[monthKey].montant += parseFloat(p.montant || 0);
          }
        }
      });

      const monthlyArray = Object.values(monthlyMap);
      setMonthlyData(monthlyArray);
      setMonthlyTableData(monthlyArray);

      // ---- Répartition par type ----
      const typeCounts = {};
      usagersData.forEach(u => {
        const type = u.type_usager || 'Autre';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      const typeDist = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
      setTypeDistribution(typeDist);

      // ---- Statistiques par région ----
      const regionCounts = {};
      usagersData.forEach(u => {
        const region = u.region || 'Non spécifié';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      const regionArr = Object.entries(regionCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      setRegionStats(regionArr);

      // ---- Paiements par type ----
      const typePaymentMap = {};
      paiementsData.filter(p => p.statut === 'paye').forEach(p => {
        const type = p.usager_type || 'Autre';
        typePaymentMap[type] = (typePaymentMap[type] || 0) + parseFloat(p.montant || 0);
      });
      const paymentByTypeArr = Object.entries(typePaymentMap).map(([name, value]) => ({ name, value }));
      setPaymentByType(paymentByTypeArr);

    } catch (err) {
      console.error('❌ Erreur chargement dashboard:', err);
      setError(err.message || 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Filtrage par mois ----
  const getFilteredMonthlyData = () => {
    if (selectedMonth === 'all') return monthlyData;
    const index = parseInt(selectedMonth);
    return monthlyData.filter((_, i) => i === index);
  };

  const filteredData = getFilteredMonthlyData();

  // ---- Totaux filtrés ----
  const totals = filteredData.reduce(
    (acc, d) => {
      acc.usagers += d.usagers || 0;
      acc.montant += d.montant || 0;
      acc.occ += d.occ || 0;
      acc.bus += d.bus || 0;
      acc.gs += d.gs || 0;
      acc.nc += d.nc || 0;
      acc.tr += d.tr || 0;
      acc.hotel += d.hotel || 0;
      return acc;
    },
    { usagers: 0, montant: 0, occ: 0, bus: 0, gs: 0, nc: 0, tr: 0, hotel: 0 }
  );

  // ---- Gestionnaires ----
  const handleYearChange = (e) => setSelectedYear(parseInt(e.target.value));
  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handleRefresh = () => loadData();
  const handleRetour = () => navigate('/dashboard');

  // ---- Rendu conditionnel ----
  if (loading) {
    return (
      <>
        <Header />
        <Sidebar />
        <MiniSidebar />
        <main className="contenu-dashboard">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Sidebar />
        <MiniSidebar />
        <main className="contenu-dashboard">
          <div className="error-container">
            <AlertCircle size={48} color="#e63757" />
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={handleRefresh}>
              <RefreshCw size={16} /> Réessayer
            </button>
          </div>
        </main>
      </>
    );
  }

  // ---- Rendu principal ----
  return (
    <>
      <Header />
      <MiniSidebar />
      <main className="contenu-dashboard">
        <div className="dashboard-wrapper">

          {/* ========== EN-TÊTE ========== */} 
          <br /><br /><br /><br />
          <div className="dashboard-header">
            <div className="header-left">
              <h1>
                <BarChart3 className="header-icon" size={28} />
                Tableau de Bord OMDA
              </h1>
              <div className="header-filters">
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="filter-select"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="filter-select"
                >
                  <option value="all">Toute l'année</option>
                  {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <button className="btn-refresh" onClick={handleRefresh}>
                  <RefreshCw size={16} /> Rafraîchir
                </button>
              </div>
            </div>
            <button className="btn-back" onClick={handleRetour}>
              <ArrowLeft size={18} /> Retour
            </button>
          </div>
          

          {/* ========== KPI CARDS ========== */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#E3F2FD' }}>
                <Users size={24} color="#039BE5" />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{kpi.totalUsagers.toLocaleString()}</span>
                <span className="kpi-label">Usagers</span>
                <span className="kpi-change positive">+{kpi.nouveauxContrats} nouveaux</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#FFEBEE' }}>
                <DollarSign size={24} color="#E53935" />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{formatMontant(kpi.totalImpayes)}</span>
                <span className="kpi-label">Impayés</span>
                <span className="kpi-change negative">-{kpi.tauxRecouvrement}% recouvré</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#E8F5E9' }}>
                <Calendar size={24} color="#43A047" />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{kpi.totalEvenements}</span>
                <span className="kpi-label">Événements</span>
                <span className="kpi-change neutral">+5% vs 2025</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#FFF3E0' }}>
                <Clock size={24} color="#F57C00" />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{kpi.usagersEnRetard}</span>
                <span className="kpi-label">En retard</span>
                <span className="kpi-change negative">
                  -{kpi.totalUsagers > 0 ? Math.round((kpi.usagersEnRetard / kpi.totalUsagers) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* ========== GRAPHIQUES PRINCIPAUX ========== */}
          <div className="charts-row">
            {/* Évolution des usagers */}
            <div className="chart-card">
              <div className="chart-header">
                <h3><TrendingUp size={18} /> Évolution des usagers</h3>
                <span className="chart-badge">+{totals.usagers} total</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorUsagers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4FC3F7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} usagers`} />
                  <Area
                    type="monotone"
                    dataKey="usagers"
                    stroke="#039BE5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsagers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recettes mensuelles */}
            <div className="chart-card">
              <div className="chart-header">
                <h3><DollarSign size={18} /> Recettes mensuelles</h3>
                <span className="chart-badge">{formatMontant(kpi.totalRecettes)}</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" />
                  <YAxis tickFormatter={(value) => value.toLocaleString('fr-FR')} />
                  <Tooltip formatter={(value) => formatMontant(value)} />
                  <Bar dataKey="montant" fill="#4DD0E1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========== RÉPARTITIONS ========== */}
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header">
                <h3><PieChart size={18} /> Répartition par type</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3><MapPin size={18} /> Top 5 Régions</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={regionStats}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#29B6F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========== TABLEAU MENSUEL ========== */}
          <div className="table-card">
            <div className="table-header">
              <h3><Calendar size={18} /> Détail mensuel des usagers</h3>
              <div className="table-actions">
                <button className="btn-icon"><Download size={18} /></button>
                <button className="btn-icon"><Printer size={18} /></button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="monthly-table">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Usagers</th>
                    <th>Montant</th>
                    <th>🎪 OCC</th>
                    <th>🚌 Bus</th>
                    <th>🏪 G.Surface</th>
                    <th>🎭 Night</th>
                    <th>📺 Télé/Radio</th>
                    <th>🏨 Hôtel</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.mois}</td>
                        <td><strong>{row.usagers}</strong></td>
                        <td>{formatMontant(row.montant)}</td>
                        <td>{row.occ}</td>
                        <td>{row.bus}</td>
                        <td>{row.gs}</td>
                        <td>{row.nc}</td>
                        <td>{row.tr}</td>
                        <td>{row.hotel}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                        Aucune donnée pour cette période
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{totals.usagers}</strong></td>
                    <td><strong>{formatMontant(totals.montant)}</strong></td>
                    <td><strong>{totals.occ}</strong></td>
                    <td><strong>{totals.bus}</strong></td>
                    <td><strong>{totals.gs}</strong></td>
                    <td><strong>{totals.nc}</strong></td>
                    <td><strong>{totals.tr}</strong></td>
                    <td><strong>{totals.hotel}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ========== SYNTHÈSE FINANCIÈRE ========== */}
          <div className="synthese-row">
            <div className="synthese-card">
              <div className="synthese-header">
                <h3><Target size={18} /> Synthèse financière</h3>
              </div>
              <div className="synthese-grid">
                <div className="synthese-item">
                  <span className="synthese-label">Recettes totales</span>
                  <span className="synthese-value">{formatMontant(kpi.totalRecettes)}</span>
                </div>
                <div className="synthese-item">
                  <span className="synthese-label">Impayés</span>
                  <span className="synthese-value">{formatMontant(kpi.totalImpayes)}</span>
                </div>
                <div className="synthese-item">
                  <span className="synthese-label">Taux recouvrement</span>
                  <span className="synthese-value">{kpi.tauxRecouvrement}%</span>
                </div>
                <div className="synthese-item">
                  <span className="synthese-label">Nouveaux contrats</span>
                  <span className="synthese-value">{kpi.nouveauxContrats}</span>
                </div>
              </div>
              <div className="objectif-container">
                <div className="objectif-label">
                  <span>Objectif annuel</span>
                  <span>{kpi.progressionObjectif}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${kpi.progressionObjectif}%` }}
                  />
                </div>
                <div className="objectif-montants">
                  <span>{formatMontant(kpi.totalRecettes)}</span>
                  <span>{formatMontant(kpi.objectifAnnuel)}</span>
                </div>
              </div>
            </div>

            <div className="synthese-card">
              <div className="synthese-header">
                <h3><Award size={18} /> Indicateurs clés</h3>
              </div>
              <div className="indicateurs-grid">
                <div className="indicateur-item">
                  <div className="indicateur-icon" style={{ background: '#E3F2FD' }}>
                    <Users size={20} color="#039BE5" />
                  </div>
                  <div>
                    <span className="indicateur-label">Moy. usagers/mois</span>
                    <span className="indicateur-value">
                      {Math.round(kpi.totalUsagers / 12)}
                    </span>
                  </div>
                </div>
                <div className="indicateur-item">
                  <div className="indicateur-icon" style={{ background: '#E8F5E9' }}>
                    <DollarSign size={20} color="#43A047" />
                  </div>
                  <div>
                    <span className="indicateur-label">Panier moyen</span>
                    <span className="indicateur-value">
                      {formatMontant(kpi.recettesMoyennes)}
                    </span>
                  </div>
                </div>
                <div className="indicateur-item">
                  <div className="indicateur-icon" style={{ background: '#FFF3E0' }}>
                    <TrendingUp size={20} color="#F57C00" />
                  </div>
                  <div>
                    <span className="indicateur-label">Croissance estimée</span>
                    <span className="indicateur-value">+{kpi.croissance}%</span>
                  </div>
                </div>
                <div className="indicateur-item">
                  <div className="indicateur-icon" style={{ background: '#F3E5F5' }}>
                    <Activity size={20} color="#7B1FA2" />
                  </div>
                  <div>
                    <span className="indicateur-label">Taux d'occupation</span>
                    <span className="indicateur-value">79.6%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== PIED DE PAGE ========== */}
          <div className="dashboard-footer">
            <button className="btn-back" onClick={handleRetour}>
              <ArrowLeft size={18} /> Retour
            </button>
            <span className="footer-info">
              Dernière mise à jour: {new Date().toLocaleString()}
            </span>
          </div>

        </div>
      </main>
    </>
  );
};

export default TableauDB;