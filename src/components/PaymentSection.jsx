// ============================================================
// COMPOSANT : PaymentSection.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, PieChart, CreditCard, TrendingUp, Calendar,
  FileText, Printer, Layers, BarChart3
} from 'lucide-react';

const PaymentSection = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken') || '';
        const res = await fetch('http://localhost:3001/api/paiements/stats', {
          headers: { 'adminToken': token }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        } else {
          setError('Impossible de charger les statistiques');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Préparer les données pour le graphique
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
    total: stats[key].total || 0,
    payes: stats[key].totalPayes || 0,
    montant: stats[key].montantTotal || 0
  })) : [];

  // Calculs globaux
  const totalGlobal = stats ? Object.values(stats).reduce((sum, s) => sum + s.total, 0) : 0;
  const totalPayesGlobal = stats ? Object.values(stats).reduce((sum, s) => sum + s.totalPayes, 0) : 0;
  const totalMontantGlobal = stats ? Object.values(stats).reduce((sum, s) => sum + s.montantTotal, 0) : 0;

  // Trouver la valeur maximale pour l'échelle Y
  const maxMontant = Math.max(...chartData.map(d => d.montant), 1);

  // Couleur unique pour toutes les barres (bleu ciel)
  const barColor = '#3d99f5';

  return (
    <div className="payment-section">
      {/* En-tête */}
      <div className="payment-header">
        <h2>
          <DollarSign size={28} strokeWidth={2} />
          Gestion des paiements
        </h2>
        <p className="payment-sub">
          {loading ? 'Chargement...' : `Total collecté : ${totalMontantGlobal.toFixed(0)} Ar · ${totalPayesGlobal} paiements`}
        </p>
      </div>

      {/* Statistiques clés */}
      <div className="payment-stats-simple">
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><PieChart size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalGlobal}</div>
            <div className="stat-simple-label">Usagers</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><CreditCard size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalPayesGlobal}</div>
            <div className="stat-simple-label">Paiements</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><TrendingUp size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalGlobal > 0 ? ((totalPayesGlobal / totalGlobal) * 100).toFixed(1) : 0}%</div>
            <div className="stat-simple-label">Taux de paiement</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><BarChart3 size={18} /></span>
          <div>
            <div className="stat-simple-number">{chartData.filter(d => d.total > 0).length}</div>
            <div className="stat-simple-label">Catégories actives</div>
          </div>
        </div>
      </div>

      {/* Graphique à barres verticales (axe X = catégories, axe Y = montants) */}
      <div className="payment-chart-container">
        <h5>Montants collectés par catégorie (en Ariary)</h5>
        {loading ? (
          <div className="chart-loading">Chargement des données...</div>
        ) : (
          <div className="vertical-bar-chart">
            <div className="chart-y-axis">
              <span className="y-label">{Math.round(maxMontant * 1.2)}</span>
              <span className="y-label">{Math.round(maxMontant * 0.8)}</span>
              <span className="y-label">{Math.round(maxMontant * 0.4)}</span>
              <span className="y-label">0</span>
            </div>
            <div className="chart-bars-container">
              {chartData.map((item, idx) => {
                const heightPercent = (item.montant / maxMontant) * 100;
                return (
                  <div className="bar-wrapper" key={idx}>
                    <div className="bar-column">
                      <div
                        className="bar-fill"
                        style={{
                          height: `${Math.max(heightPercent, 4)}%`,
                          backgroundColor: barColor,
                          borderRadius: '6px 6px 0 0'
                        }}
                      >
                        <span className="bar-tooltip">{item.montant.toFixed(0)} Ar</span>
                      </div>
                    </div>
                    <div className="bar-label">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: barColor }}></span>
            Montant collecté
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'rgba(61,153,245,0.15)' }}></span>
            Taux de paiement (barres ombrées)
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="payment-actions">
        <button className="btn-primary" onClick={() => navigate('/gere-dossier')}>
          <FileText size={18} /> Gestion des dossiers
        </button>
        <button className="btn-secondary" onClick={() => navigate('/billan')}>
          <DollarSign size={18} /> Bilan financier
        </button>
        <button className="btn-secondary" onClick={() => navigate('/facture-usager')}>
          <Printer size={18} /> Factures
        </button>
        <button className="btn-secondary" onClick={() => navigate('/gere-contra')}>
          <Layers size={18} /> Contrats
        </button>
      </div>

      {/* Pied */}
      <div className="payment-footer">
        <span className="footer-info">
          <Calendar size={14} /> Dernière mise à jour : {new Date().toLocaleDateString()}
        </span>
        <span className="footer-total">
          Total collecté : {totalMontantGlobal.toFixed(0)} Ar
        </span>
      </div>
    </div>
  );
};

export default PaymentSection;