import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TableauDB.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const TableauDB = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Données globales du projet OMDA
  const globalStats = {
    totalUsagers: 1521,
    totalUsagersParType: {
      OCC: 245,
      Bus: 189,
      GrandSurface: 234,
      NightClub: 178,
      TeleRadio: 412,
      Hotel: 263
    },
    totalImpayes: 32211000,
    totalImpayesParType: {
      OCC: 4250000,
      Bus: 6780000,
      GrandSurface: 5230000,
      NightClub: 4890000,
      TeleRadio: 6540000,
      Hotel: 4520000
    },
    totalEvenements: 351,
    usagersEnRetard: 122,
    totalRecettes: 125680000,
    totalRecettesParType: {
      OCC: 18500000,
      Bus: 32400000,
      GrandSurface: 28700000,
      NightClub: 18900000,
      TeleRadio: 15600000,
      Hotel: 11800000
    },
    tauxRecouvrement: 79.6,
    objectifAnnuel: 180000000,
    progressionObjectif: 69.8,
    nouveauxContratsAnnee: 47
  };

  // Données mensuelles
  const monthlyData = [
    { mois: 'Jan', vips: 42, montant: 3241000, occ: 8, bus: 7, gs: 9, nc: 6, tr: 7, hotel: 5 },
    { mois: 'Fév', vips: 38, montant: 2890000, occ: 7, bus: 6, gs: 8, nc: 5, tr: 6, hotel: 6 },
    { mois: 'Mar', vips: 35, montant: 2750000, occ: 6, bus: 5, gs: 7, nc: 5, tr: 6, hotel: 6 },
    { mois: 'Avr', vips: 45, montant: 3560000, occ: 9, bus: 8, gs: 10, nc: 6, tr: 7, hotel: 5 },
    { mois: 'Mai', vips: 52, montant: 4120000, occ: 10, bus: 9, gs: 11, nc: 7, tr: 9, hotel: 6 },
    { mois: 'Juin', vips: 58, montant: 4980000, occ: 12, bus: 10, gs: 12, nc: 8, tr: 10, hotel: 6 },
    { mois: 'Juil', vips: 62, montant: 5230000, occ: 13, bus: 11, gs: 13, nc: 9, tr: 10, hotel: 6 },
    { mois: 'Aoû', vips: 55, montant: 4670000, occ: 11, bus: 10, gs: 11, nc: 8, tr: 9, hotel: 6 },
    { mois: 'Sep', vips: 48, montant: 3980000, occ: 10, bus: 8, gs: 10, nc: 7, tr: 8, hotel: 5 },
    { mois: 'Oct', vips: 44, montant: 3670000, occ: 9, bus: 7, gs: 9, nc: 6, tr: 8, hotel: 5 },
    { mois: 'Nov', vips: 39, montant: 3120000, occ: 8, bus: 6, gs: 8, nc: 5, tr: 7, hotel: 5 },
    { mois: 'Déc', vips: 51, montant: 4230000, occ: 11, bus: 9, gs: 10, nc: 7, tr: 9, hotel: 5 }
  ];

  const getFilteredData = () => {
    if (selectedMonth === 'all') return monthlyData;
    return monthlyData.filter((_, index) => index === parseInt(selectedMonth));
  };

  const getFilteredTotals = () => {
    const filtered = getFilteredData();
    return {
      vips: filtered.reduce((sum, d) => sum + d.vips, 0),
      montant: filtered.reduce((sum, d) => sum + d.montant, 0),
      occ: filtered.reduce((sum, d) => sum + d.occ, 0),
      bus: filtered.reduce((sum, d) => sum + d.bus, 0),
      gs: filtered.reduce((sum, d) => sum + d.gs, 0),
      nc: filtered.reduce((sum, d) => sum + d.nc, 0),
      tr: filtered.reduce((sum, d) => sum + d.tr, 0),
      hotel: filtered.reduce((sum, d) => sum + d.hotel, 0)
    };
  };

  // Dessiner le graphique
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    const padding = { left: 45, right: 20, top: 20, bottom: 35 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const filteredData = getFilteredData();
    const maxY = Math.max(...filteredData.map(d => d.vips), 70);
    const stepY = Math.ceil(maxY / 6);
    const values = filteredData.map(d => d.vips);
    const months = filteredData.map(d => d.mois);

    // Grille
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let y = 0; y <= maxY; y += stepY) {
      const yPos = padding.top + graphHeight - (y / maxY) * graphHeight;
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(width - padding.right, yPos);
      ctx.stroke();
      ctx.fillStyle = '#999';
      ctx.font = '9px sans-serif';
      ctx.fillText(y.toString(), padding.left - 25, yPos + 2);
    }

    const stepX = graphWidth / (months.length - 1 || 1);
    for (let i = 0; i < months.length; i++) {
      const x = padding.left + i * stepX;
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      ctx.fillStyle = '#666';
      ctx.font = '9px sans-serif';
      ctx.fillText(months[i], x - 8, height - padding.bottom + 15);
    }

    // Courbe
    if (months.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#2c7da0';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(44,125,160,0.05)';
      let first = true;
      const points = [];
      for (let i = 0; i < months.length; i++) {
        const x = padding.left + i * stepX;
        const y = padding.top + graphHeight - (values[i] / maxY) * graphHeight;
        points.push({ x, y });
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      if (points.length > 0) {
        ctx.lineTo(points[points.length-1].x, height - padding.bottom);
        ctx.lineTo(points[0].x, height - padding.bottom);
        ctx.fill();
      }

      ctx.fillStyle = '#e76f51';
      for (let p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2*Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, 2*Math.PI);
        ctx.fill();
        ctx.fillStyle = '#e76f51';
      }
    }
  }, [monthlyData, selectedMonth]);

  const usagerTypes = [
    { key: 'OCC', label: 'Occasionnelle', icon: '🎪' },
    { key: 'Bus', label: 'Bus', icon: '🚌' },
    { key: 'GrandSurface', label: 'Grand Surface', icon: '🏪' },
    { key: 'NightClub', label: 'Night Club', icon: '🎭' },
    { key: 'TeleRadio', label: 'Télé/Radio', icon: '📺' },
    { key: 'Hotel', label: 'Hôtel', icon: '🏨' }
  ];

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      <main className="contenu">
        <div className="dashboard-header">
          <h1>Tableau de bord OMDA</h1>
          <div className="filters">
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="filter-select">
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="filter-select">
              <option value="all">Toute l'année</option>
              <option value="0">Janvier</option>
              <option value="1">Février</option>
              <option value="2">Mars</option>
              <option value="3">Avril</option>
              <option value="4">Mai</option>
              <option value="5">Juin</option>
              <option value="6">Juillet</option>
              <option value="7">Août</option>
              <option value="8">Septembre</option>
              <option value="9">Octobre</option>
              <option value="10">Novembre</option>
              <option value="11">Décembre</option>
            </select>
          </div>
        </div>

        {/* 4 cartes KPI */}
        <div className="kpi-grid">
          <div className="kpi-tile">
            <div className="kpi-number">{globalStats.totalUsagers.toLocaleString()}</div>
            <div className="kpi-title">Usagers</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-number">{Math.round(globalStats.totalImpayes / 1000000)} MAr</div>
            <div className="kpi-title">Impayés</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-number">{globalStats.totalEvenements}</div>
            <div className="kpi-title">Événements</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-number">{globalStats.usagersEnRetard}</div>
            <div className="kpi-title">En retard</div>
          </div>
        </div>

        {/* Graphique + Tableau */}
        <div className="mid-section">
          <div className="chart-container">
            <h3>Évolution mensuelle (VIPs)</h3>
            <canvas ref={canvasRef} className="curve-canvas" style={{ width: '100%', height: '250px' }}></canvas>
          </div>
          <div className="table-container">
            <h3>Suivi mensuel</h3>
            <div className="table-wrapper">
              <table className="monthly-table">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>VIPs</th>
                    <th>Montant</th>
                    <th>🎪</th>
                    <th>🚌</th>
                    <th>🏪</th>
                    <th>🎭</th>
                    <th>📺</th>
                    <th>🏨</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData().map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.mois}</td>
                      <td>{row.vips}</td>
                      <td>{Math.round(row.montant / 1000)}k</td>
                      <td>{row.occ}</td>
                      <td>{row.bus}</td>
                      <td>{row.gs}</td>
                      <td>{row.nc}</td>
                      <td>{row.tr}</td>
                      <td>{row.hotel}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td><strong>Total</strong></td>
                    <td><strong>{getFilteredTotals().vips}</strong></td>
                    <td><strong>{Math.round(getFilteredTotals().montant / 1000)}k</strong></td>
                    <td><strong>{getFilteredTotals().occ}</strong></td>
                    <td><strong>{getFilteredTotals().bus}</strong></td>
                    <td><strong>{getFilteredTotals().gs}</strong></td>
                    <td><strong>{getFilteredTotals().nc}</strong></td>
                    <td><strong>{getFilteredTotals().tr}</strong></td>
                    <td><strong>{getFilteredTotals().hotel}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Synthèse par type */}
        <div className="synthese-types">
          <h3>Répartition par type</h3>
          <div className="types-grid">
            {usagerTypes.map(type => (
              <div key={type.key} className="type-card">
                <div className="type-header">
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </div>
                <div className="type-stats">
                  <div className="stat-item">
                    <span className="stat-label">Usagers</span>
                    <span className="stat-value">{globalStats.totalUsagersParType[type.key]}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Restant</span>
                    <span className="stat-value">{(globalStats.totalImpayesParType[type.key] / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Synthèse financière */}
        <div className="synthese-financiere">
          <div className="synthese-card">
            <h3>Synthèse financière</h3>
            <div className="synthese-grid">
              <div className="synthese-item">
                <span className="synthese-label">Recettes totales</span>
                <span className="synthese-value">{(globalStats.totalRecettes / 1000000).toFixed(0)} MAr</span>
              </div>
              <div className="synthese-item">
                <span className="synthese-label">Impayés</span>
                <span className="synthese-value">{(globalStats.totalImpayes / 1000000).toFixed(0)} MAr</span>
              </div>
              <div className="synthese-item">
                <span className="synthese-label">Taux recouvrement</span>
                <span className="synthese-value">{globalStats.tauxRecouvrement}%</span>
              </div>
              <div className="synthese-item">
                <span className="synthese-label">Nouveaux contrats</span>
                <span className="synthese-value">{globalStats.nouveauxContratsAnnee}</span>
              </div>
            </div>
            <div className="objectif-bar">
              <div className="objectif-label">Objectif annuel</div>
              <div className="progress-container">
                <div className="progress-fill" style={{ width: `${globalStats.progressionObjectif}%` }}></div>
                <span className="progress-text">{globalStats.progressionObjectif}%</span>
              </div>
            </div>
          </div>

          <div className="synthese-card">
            <h3>Indicateurs</h3>
            <div className="performance-grid">
              <div className="perf-item">
                <div className="perf-icon">📊</div>
                <div className="perf-info">
                  <span className="perf-label">CA moyen</span>
                  <span className="perf-value">{(globalStats.totalRecettes / globalStats.totalUsagers / 1000).toFixed(0)}k Ar</span>
                </div>
              </div>
              <div className="perf-item">
                <div className="perf-icon">📈</div>
                <div className="perf-info">
                  <span className="perf-label">Croissance</span>
                  <span className="perf-value">+18.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="back-footer">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>← Retour</button>
        </div>
      </main>
    </>
  );
};

export default TableauDB;