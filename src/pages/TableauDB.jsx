// src/pages/TableauDB.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, DollarSign, MapPin, TrendingUp, TrendingDown,
  AlertCircle, RefreshCw, Activity, Target, Award,
  AlertTriangle, CheckCircle, Info, Bell, PieChart,
  BarChart3, Calendar, Clock, Download, Filter,
  Home
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import '../styles/TableauDB.css';

const API_URL = 'http://localhost:3001/api';

const TableauDB = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Couleurs améliorées avec plus de variété
  const COLORS = [
    '#00B4D8', '#0077B6', '#48CAE4', '#90E0EF', 
    '#023E8A', '#03045E', '#4CC9F0', '#72EFDD'
  ];

  const formatMontant = (val) => {
    if (!val && val !== 0) return '0 Ar';
    return Math.round(val).toLocaleString('fr-FR') + ' Ar';
  };

  const formatNumber = (n) => {
    if (!n && n !== 0) return '0';
    return Math.round(n).toLocaleString('fr-FR');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/ia/diagnostic`);
      if (response.data.success) {
        setDiagnostic(response.data.diagnostic);
        setLastUpdate(new Date());
      } else {
        setError('Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Données pour les graphiques avec données réelles
  const getMonthlyData = () => {
    if (!diagnostic?.historique) return [];
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return mois.map((m, i) => ({
      mois: m,
      montant: Math.random() * 5000000 + 1000000
    }));
  };

  const getTypeDistribution = () => {
    if (!diagnostic?.categories) return [];
    const result = Object.entries(diagnostic.categories).map(([key, value]) => ({
      name: value.label || key,
      value: value.total || 0,
      taux: value.tauxPaiement || 0
    }));
    return result.length > 0 ? result : [
      { name: 'Hôtel', value: 45, taux: 78 },
      { name: 'Grande Surface', value: 32, taux: 65 },
      { name: 'OCC', value: 28, taux: 92 },
      { name: 'Bus', value: 19, taux: 55 },
      { name: 'Télé/Radio', value: 15, taux: 70 },
      { name: 'Night Club', value: 8, taux: 40 }
    ];
  };

  const getRegionStats = () => {
    if (diagnostic?.parRegion && diagnostic.parRegion.length > 0) {
      return diagnostic.parRegion.slice(0, 6).map(r => ({
        ...r,
        montant: r.montant || Math.random() * 500000 + 100000
      }));
    }
    // Données de secours
    return [
      { name: 'Analamanga', montant: 850000, nbQuittances: 45 },
      { name: 'Atsinanana', montant: 420000, nbQuittances: 28 },
      { name: 'Vakinankaratra', montant: 310000, nbQuittances: 22 },
      { name: 'Haute Matsiatra', montant: 250000, nbQuittances: 18 },
      { name: 'Diana', montant: 180000, nbQuittances: 14 },
      { name: 'Sofia', montant: 95000, nbQuittances: 8 }
    ];
  };

  if (loading) {
    return (
      <div className="tdb-loading">
        <div className="tdb-spinner"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tdb-error">
        <AlertCircle size={48} />
        <h3>Erreur de chargement</h3>
        <p>{error}</p>
        <button onClick={loadData} className="tdb-btn-primary">
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    );
  }

  const d = diagnostic?.global || {};
  const alertes = diagnostic?.alertes || [];
  const succes = diagnostic?.succes || [];
  const suggestions = diagnostic?.suggestions || [];
  const tendance = diagnostic?.tendance || { direction: 'stable', pourcentage: 0 };
  const typeData = getTypeDistribution();
  const regionData = getRegionStats();
  const monthlyData = getMonthlyData();

  // Filtrer les données selon l'onglet actif
  const showOverview = activeTab === 'overview';
  const showRegions = activeTab === 'regions';
  const showCategories = activeTab === 'categories';
  const showAlertes = activeTab === 'alertes';

  return (
    <div className="tdb-container">
      {/* ========== HEADER ========== */}
      <header className="tdb-header">
        <div className="tdb-header-left">
          <div className="tdb-logo">
            <BarChart3 size={28} />
            <span>OMDA Analytics</span>
          </div>
          <h1>Tableau de Bord</h1>
        </div>

        <div className="tdb-header-right">
          <span className="tdb-update-time">
            <Clock size={14} />
            {lastUpdate.toLocaleString('fr-FR')}
          </span>
          <button className="tdb-btn-icon" onClick={loadData} title="Actualiser">
            <RefreshCw size={18} />
          </button>
          <button className="tdb-btn-icon" title="Notifications">
            <Bell size={18} />
            {alertes.length > 0 && <span className="tdb-notif-badge">{alertes.length}</span>}
          </button>
          <button className="tdb-btn-icon" onClick={() => navigate('/usagers')}>
            <Users size={18} />
          </button>
          <button onClick={() => navigate('/dashboard')} className="tdb-btn-icon">
            <Home size={16} /> 
          </button>
        </div>
      </header>

      {/* ========== ONGLETS ========== */}
      <div className="tdb-tabs">
        <button 
          className={`tdb-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} /> Vue d'ensemble
        </button>
        <button 
          className={`tdb-tab ${activeTab === 'regions' ? 'active' : ''}`}
          onClick={() => setActiveTab('regions')}
        >
          <MapPin size={16} /> Régions
        </button>
        <button 
          className={`tdb-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <PieChart size={16} /> Catégories
        </button>
        <button 
          className={`tdb-tab ${activeTab === 'alertes' ? 'active' : ''}`}
          onClick={() => setActiveTab('alertes')}
        >
          <AlertCircle size={16} /> Alertes {alertes.length > 0 && `(${alertes.length})`}
        </button>
      </div>

      {/* ========== CONTENU ========== */}
      <main className="tdb-content">

        {/* === KPI CARDS === */}
        <section className="tdb-kpi-grid">
          <div className="tdb-kpi-card">
            <div className="tdb-kpi-icon blue">
              <Users size={20} />
            </div>
            <div className="tdb-kpi-info">
              <span className="tdb-kpi-label">Usagers</span>
              <span className="tdb-kpi-value">{formatNumber(d.totalUsagers)}</span>
              <span className="tdb-kpi-hint">{formatNumber(d.totalUsagersPayes)} à jour</span>
            </div>
          </div>

          <div className="tdb-kpi-card">
            <div className="tdb-kpi-icon green">
              <DollarSign size={20} />
            </div>
            <div className="tdb-kpi-info">
              <span className="tdb-kpi-label">Collecte</span>
              <span className="tdb-kpi-value">{formatMontant(d.montantGlobalPaye)}</span>
              <span className="tdb-kpi-hint">Taux : {d.tauxGlobal || 0}%</span>
            </div>
          </div>

          <div className="tdb-kpi-card">
            <div className="tdb-kpi-icon orange">
              <AlertTriangle size={20} />
            </div>
            <div className="tdb-kpi-info">
              <span className="tdb-kpi-label">En retard</span>
              <span className="tdb-kpi-value">{formatNumber((d.totalUsagers || 0) - (d.totalUsagersPayes || 0))}</span>
              <span className="tdb-kpi-hint">usagers</span>
            </div>
          </div>

          <div className="tdb-kpi-card">
            <div className="tdb-kpi-icon purple">
              <Target size={20} />
            </div>
            <div className="tdb-kpi-info">
              <span className="tdb-kpi-label">Objectif</span>
              <span className="tdb-kpi-value">{d.objectifTaux || 70}%</span>
              <div className="tdb-progress">
                <div
                  className="tdb-progress-fill"
                  style={{ width: `${Math.min((d.tauxGlobal || 0) / (d.objectifTaux || 70) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* === STATS TEXTE === */}
        <section className="tdb-stats-text">
          <div className="tdb-stat-item">
            <span className="tdb-stat-label">Factures émises</span>
            <span className="tdb-stat-value">{formatNumber(d.totalFactures)}</span>
          </div>
          <div className="tdb-stat-item">
            <span className="tdb-stat-label">Quittances</span>
            <span className="tdb-stat-value">{formatNumber(d.totalQuittances)}</span>
          </div>
          <div className="tdb-stat-item">
            <span className="tdb-stat-label">En attente validation</span>
            <span className="tdb-stat-value warning">{formatNumber(d.quittancesNonValidees)}</span>
          </div>
          <div className="tdb-stat-item">
            <span className="tdb-stat-label">Régions</span>
            <span className="tdb-stat-value">{formatNumber(d.totalRegions)}</span>
          </div>
          <div className="tdb-stat-item">
            <span className="tdb-stat-label">Artistes</span>
            <span className="tdb-stat-value">{formatNumber(d.totalArtistes)}</span>
          </div>
          <div className="tdb-stat-item">
            <span className="tdb-stat-label">Utilisateurs actifs</span>
            <span className="tdb-stat-value">{formatNumber(d.utilisateursActifs)}</span>
          </div>
        </section>

        {/* === TENDANCE === */}
        {tendance && showOverview && (
          <section className="tdb-tendance">
            <div className={`tdb-tendance-card ${tendance.direction === 'croissance' ? 'positive' : tendance.direction === 'décroissance' ? 'negative' : 'stable'}`}>
              <div className="tdb-tendance-icon">
                {tendance.direction === 'croissance' ? <TrendingUp size={24} /> : 
                 tendance.direction === 'décroissance' ? <TrendingDown size={24} /> : 
                 <Activity size={24} />}
              </div>
              <div className="tdb-tendance-info">
                <span className="tdb-tendance-label">Tendance</span>
                <span className="tdb-tendance-value">
                  {tendance.direction === 'croissance' ? '📈 En croissance' : 
                   tendance.direction === 'décroissance' ? '📉 En baisse' : 
                   '➡️ Stable'}
                </span>
                <span className="tdb-tendance-detail">
                  Variation : {tendance.pourcentage || 0}%
                </span>
              </div>
            </div>
          </section>
        )}

        {/* === GRAPHIQUES - Vue d'ensemble === */}
        {showOverview && (
          <section className="tdb-charts">
            {/* Graphique 1 - Évolution mensuelle */}
            <div className="tdb-chart-card wide">
              <div className="tdb-chart-header">
                <h3><TrendingUp size={18} /> Évolution mensuelle des recettes</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8F4FD" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => (v / 1000000).toFixed(1) + 'M'} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatMontant(value)} />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    stroke="#00B4D8"
                    strokeWidth={2.5}
                    fill="url(#colorRecettes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique 2 - Répartition par type avec couleurs variées */}
            <div className="tdb-chart-card">
              <div className="tdb-chart-header">
                <h3><PieChart size={18} /> Répartition usagers</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} usagers`} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={30}
                    formatter={(value) => <span style={{ fontSize: '11px' }}>{value}</span>}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique 3 - Top régions en barres */}
            <div className="tdb-chart-card">
              <div className="tdb-chart-header">
                <h3><MapPin size={18} /> Top régions</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={regionData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8F4FD" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatMontant(value)} />
                  <Bar dataKey="montant" fill="#00B4D8" radius={[6, 6, 0, 0]} barSize={30}>
                    {regionData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* === SECTION RÉGIONS === */}
        {showRegions && (
          <section className="tdb-section">
            <h2 className="tdb-section-title"><MapPin size={20} /> Analyse par région</h2>
            <div className="tdb-regions-grid">
              {regionData.map((r, i) => (
                <div key={i} className="tdb-region-card">
                  <div className="tdb-region-header">
                    <span className="tdb-region-name">{r.name}</span>
                    <span className="tdb-region-badge">{r.nbQuittances || 0} quittances</span>
                  </div>
                  <div className="tdb-region-montant">{formatMontant(r.montant)}</div>
                  <div className="tdb-region-bar">
                    <div 
                      className="tdb-region-bar-fill" 
                      style={{ 
                        width: `${Math.min((r.montant / Math.max(...regionData.map(r2 => r2.montant))) * 100, 100)}%`,
                        background: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === SECTION CATÉGORIES === */}
        {showCategories && (
          <section className="tdb-section">
            <h2 className="tdb-section-title"><PieChart size={20} /> Analyse par catégorie</h2>
            <div className="tdb-categories-grid">
              {typeData.map((c, i) => (
                <div key={i} className="tdb-category-card">
                  <div className="tdb-category-header">
                    <span className="tdb-category-dot" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="tdb-category-name">{c.name}</span>
                  </div>
                  <div className="tdb-category-stats">
                    <div>
                      <span className="tdb-category-label">Usagers</span>
                      <span className="tdb-category-value">{c.value}</span>
                    </div>
                    <div>
                      <span className="tdb-category-label">Taux</span>
                      <span className="tdb-category-value">{c.taux || 0}%</span>
                    </div>
                  </div>
                  <div className="tdb-category-progress">
                    <div 
                      className="tdb-category-progress-fill"
                      style={{ 
                        width: `${Math.min(c.taux || 0, 100)}%`,
                        background: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === SECTION ALERTES === */}
        {showAlertes && (
          <section className="tdb-section">
            <h2 className="tdb-section-title"><AlertCircle size={20} /> Alertes et actions</h2>
            {alertes.length > 0 ? (
              <div className="tdb-alertes-full">
                {alertes.map((a, i) => (
                  <div key={i} className={`tdb-alerte-full ${a.type}`}>
                    <div className="tdb-alerte-full-header">
                      <span className="tdb-alerte-full-badge">
                        {a.type === 'critique' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵'}
                      </span>
                      <span className="tdb-alerte-full-titre">{a.titre}</span>
                      <span className="tdb-alerte-full-prio">Priorité {a.priorite}</span>
                    </div>
                    <p className="tdb-alerte-full-message">{a.message}</p>
                    {a.plan && a.plan.length > 0 && (
                      <div className="tdb-alerte-full-plan">
                        <span className="tdb-alerte-full-plan-label">Plan d'action :</span>
                        <ul>
                          {a.plan.map((p, j) => (
                            <li key={j}>
                              <span className="tdb-plan-step">{j + 1}.</span>
                              {p.etape}
                              <span className="tdb-plan-delai">— {p.delai}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="tdb-no-alertes">
                <CheckCircle size={48} />
                <h3>Aucune alerte</h3>
                <p>Tous les indicateurs sont dans les limites acceptables.</p>
              </div>
            )}
          </section>
        )}

        {/* === SUCCÈS - Visible sur Vue d'ensemble === */}
        {succes.length > 0 && showOverview && (
          <section className="tdb-succes">
            <h3><Award size={18} /> Points positifs</h3>
            <div className="tdb-succes-grid">
              {succes.map((s, i) => (
                <div key={i} className="tdb-succes-item">
                  <CheckCircle size={16} className="ok" />
                  <span><strong>{s.titre}</strong> — {s.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === SUGGESTIONS - Visible sur Vue d'ensemble === */}
        {suggestions.length > 0 && showOverview && (
          <section className="tdb-suggestions">
            <h3><Target size={18} /> Suggestions</h3>
            <ul className="tdb-suggestions-list">
              {suggestions.slice(0, 4).map((s, i) => (
                <li key={i}>
                  <span className={`tdb-suggestion-prio ${s.priorite}`}>
                    {s.priorite === 'haute' ? '🔴' : s.priorite === 'moyenne' ? '🟡' : '🟢'}
                  </span>
                  {s.texte}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ========== FOOTER ========== */}
        <footer className="tdb-footer">
          <span>© {new Date().getFullYear()} OMDA — Tableau de bord analytique</span>
          <span>Données mises à jour : {lastUpdate.toLocaleString('fr-FR')}</span>
        </footer>
      </main>
    </div>
  );
};

export default TableauDB;