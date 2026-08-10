// ============================================================
// COMPOSANT : BilanCards.jsx (version finale avec donut)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Users, Calendar, TrendingUp, PieChart,
  BarChart, Activity, AlertTriangle, Layers, Plus, Eye
} from 'lucide-react';

const BilanCards = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken') || '';
        const res = await fetch('http://localhost:3001/api/paiements/stats', {
          headers: { 'adminToken': token }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('❌ Erreur chargement bilan:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculs
  const totalUsagers = stats ? Object.values(stats).reduce((sum, s) => sum + s.total, 0) : 0;
  const totalPayes = stats ? Object.values(stats).reduce((sum, s) => sum + s.totalPayes, 0) : 0;
  const totalMontant = stats ? Object.values(stats).reduce((sum, s) => sum + s.montantTotal, 0) : 0;
  const tauxPaiement = totalUsagers > 0 ? ((totalPayes / totalUsagers) * 100).toFixed(1) : 0;

  // Données pour le diagramme avec couleurs personnalisées
  const typeColors = {
    hotel: '#E53935',         // Rouge
    'grand-surface': '#4CAF50', // Vert
    bus: '#9E9E9E',           // Gris
    nightclub: '#E91E63',     // Rose
    media: '#9C27B0',         // Violet
    occ: '#00BCD4'            // Bleu
  };

  const typeLabels = {
    hotel: 'Hôtel',
    'grand-surface': 'Grande Surface',
    bus: 'Bus',
    nightclub: 'Night Club',
    media: 'Média',
    occ: 'Occasionnelle'
  };

  const chartData = stats ? Object.keys(stats).map(key => ({
    label: typeLabels[key] || key,
    value: stats[key].montantTotal || 0,
    color: typeColors[key] || '#3d99f5'
  })).filter(item => item.value > 0) : [];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Construction du conic-gradient pour le donut
  let gradient = '';
  let startAngle = 0;
  chartData.forEach((item, index) => {
    const percent = (item.value / total) * 100;
    const angle = (percent / 100) * 360;
    const endAngle = startAngle + angle;
    if (index === 0) {
      gradient += `${item.color} ${startAngle}deg ${endAngle}deg`;
    } else {
      gradient += `, ${item.color} ${startAngle}deg ${endAngle}deg`;
    }
    startAngle = endAngle;
  });

  return (
    <div className="bilan-container">
      {/* En-tête */}
      <div className="bilan-header">
        <h2>
          <PieChart size={28} strokeWidth={2} />
          Bilan & Diagnostic
        </h2>
        <p className="bilan-sub">
          {loading ? 'Chargement...' : `${totalUsagers} usagers · ${totalPayes} paiements · ${totalMontant.toFixed(0)} Ar`}
        </p>
      </div>

      <div className="bilan-grid">
        {/* Partie gauche : indicateurs et actions */}
        <div className="bilan-left">
          <div className="bilan-stats">
            <div className="bilan-stat-item">
              <span className="bilan-stat-icon"><Users size={18} /></span>
              <div>
                <div className="bilan-stat-number">{totalUsagers}</div>
                <div className="bilan-stat-label">Usagers</div>
              </div>
            </div>
            <div className="bilan-stat-item">
              <span className="bilan-stat-icon"><DollarSign size={18} /></span>
              <div>
                <div className="bilan-stat-number">{totalMontant.toFixed(0)} Ar</div>
                <div className="bilan-stat-label">Total collecté</div>
              </div>
            </div>
            <div className="bilan-stat-item">
              <span className="bilan-stat-icon"><TrendingUp size={18} /></span>
              <div>
                <div className="bilan-stat-number">{tauxPaiement}%</div>
                <div className="bilan-stat-label">Taux de paiement</div>
              </div>
            </div>
            <div className="bilan-stat-item">
              <span className="bilan-stat-icon"><AlertTriangle size={18} /></span>
              <div>
                <div className="bilan-stat-number">{totalUsagers - totalPayes}</div>
                <div className="bilan-stat-label">En attente</div>
              </div>
            </div>
          </div>

          <div className="bilan-actions">
            <button className="btn-primary" onClick={() => navigate('/tableau-db')}>
              <BarChart size={18} /> Tableau de bord
            </button>
            <button className="btn-secondary" onClick={() => navigate('/ajout-evenement')}>
              <Plus size={18} /> Ajouter événement
            </button>
            <button className="btn-secondary" onClick={() => navigate('/billan')}>
              <Activity size={18} /> Diagnostic avancé
            </button>
          </div>

          <div className="bilan-links">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/facture-usager'); }}>
              <Eye size={14} /> Voir les factures
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/gere-dossier'); }}>
              <Layers size={14} /> Gestion des dossiers
            </a>
          </div>
        </div>

        {/* Partie droite : diagramme circulaire */}
        <div className="bilan-right">
          <h5>Répartition des montants par catégorie</h5>
          {loading ? (
            <div className="chart-loading">Chargement...</div>
          ) : chartData.length > 0 ? (
            <div className="donut-container">
              <div
                className="donut-chart"
                style={{
                  background: `conic-gradient(${gradient})`
                }}
              >
                {/* Centre du donut – on affiche simplement un label "Total" sans montant */}
                <div className="donut-center">
                  <span className="donut-label">Total</span>
                </div>
              </div>
              <div className="donut-legend">
                {chartData.map((item, idx) => (
                  <div className="donut-legend-item" key={idx}>
                    <span className="donut-legend-dot" style={{ background: item.color }}></span>
                    <span className="donut-legend-label">{item.label}</span>
                    <span className="donut-legend-value">{item.value.toFixed(0)} Ar</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chart-empty">Aucune donnée disponible</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BilanCards;