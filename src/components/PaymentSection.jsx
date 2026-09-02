// ============================================================
// COMPOSANT : PaymentSection.jsx (Recharts - 6 courbes + montant)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, PieChart, CreditCard, TrendingUp, Calendar,
  FileText, Printer, Layers, BarChart3
} from 'lucide-react';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';

const PaymentSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [statsSummary, setStatsSummary] = useState({
    totalUsagers: 0,
    totalPayes: 0,
    totalMontant: 0,
    categoriesActives: 0
  });

  const TYPES = [
    { key: 'hotel', label: 'Hôtel', color: '#4CAF50' },
    { key: 'grandSurface', label: 'Grande Surface', color: '#2196F3' },
    { key: 'bus', label: 'Bus', color: '#FF9800' },
    { key: 'nightclub', label: 'Night Club', color: '#9C27B0' },
    { key: 'media', label: 'Média', color: '#E91E63' },
    { key: 'occ', label: 'Occasionnelle', color: '#00BCD4' }
  ];

  // Format montant complet (sans abréviation)
  const formatMontant = (value) => {
    if (value === 0) return '0 Ar';
    return Math.round(value).toLocaleString('fr-FR') + ' Ar';
  };

  // Format pour l'axe Y (entier avec séparateurs)
  const formatYAxis = (value) => {
    if (value === 0) return '0';
    return Math.round(value).toLocaleString('fr-FR');
  };

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const token = localStorage.getItem('adminToken') || '';
        const currentYear = new Date().getFullYear();
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        // Récupération des usagers
        const usagersRes = await fetch('http://localhost:3001/api/usagers', {
          headers: { adminToken: token }
        });
        let usagersData = await usagersRes.json();
        if (!Array.isArray(usagersData)) usagersData = usagersData.usagers || [];

        // Récupération des paiements
        const paiementsRes = await fetch('http://localhost:3001/api/paiements/tous', {
          headers: { adminToken: token }
        });
        const paiementsData = await paiementsRes.json();
        const paiements = paiementsData.success ? paiementsData.paiements : [];

        const monthlyMap = {};
        months.forEach(m => {
          monthlyMap[m] = {
            mois: m,
            hotel: 0,
            grandSurface: 0,
            bus: 0,
            nightclub: 0,
            media: 0,
            occ: 0,
            montant: 0
          };
        });

        // Comptage des usagers par mois/type
        usagersData.forEach(u => {
          const date = new Date(u.created_at);
          if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth();
            const monthKey = months[monthIndex];
            if (monthlyMap[monthKey]) {
              const type = u.type_usager;
              let key = '';
              if (type === 'Hôtel') key = 'hotel';
              else if (type === 'Grand Surface') key = 'grandSurface';
              else if (type === 'Bus') key = 'bus';
              else if (type === 'Night club') key = 'nightclub';
              else if (type === 'Télé/Radio') key = 'media';
              else if (type === 'OCC') key = 'occ';
              if (key && monthlyMap[monthKey][key] !== undefined) {
                monthlyMap[monthKey][key] += 1;
              }
            }
          }
        });

        // Montants par mois (paiements payés)
        paiements.forEach(p => {
          if (p.statut === 'paye' && p.annee === currentYear) {
            const monthIndex = p.mois ? p.mois - 1 : new Date(p.date_paiement).getMonth();
            const monthKey = months[monthIndex];
            if (monthlyMap[monthKey]) {
              monthlyMap[monthKey].montant += parseFloat(p.montant) || 0;
            }
          }
        });

        const data = months.map(m => monthlyMap[m]);
        setMonthlyData(data);

        // Synthèse
        const totalUsagers = usagersData.length;
        const totalPayes = paiements.filter(p => p.statut === 'paye').length;
        const totalMontant = paiements.filter(p => p.statut === 'paye').reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
        const categoriesActives = TYPES.filter(t => usagersData.some(u => {
          const type = u.type_usager;
          if (t.key === 'hotel') return type === 'Hôtel';
          if (t.key === 'grandSurface') return type === 'Grand Surface';
          if (t.key === 'bus') return type === 'Bus';
          if (t.key === 'nightclub') return type === 'Night club';
          if (t.key === 'media') return type === 'Télé/Radio';
          if (t.key === 'occ') return type === 'OCC';
          return false;
        })).length;

        setStatsSummary({ totalUsagers, totalPayes, totalMontant, categoriesActives });

      } catch (err) {
        console.error('❌ Erreur chargement données mensuelles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

  // Données pour le graphique
  const chartData = monthlyData.map(d => ({
    ...d,
    'Hôtel': d.hotel,
    'Grande Surface': d.grandSurface,
    'Bus': d.bus,
    'Night Club': d.nightclub,
    'Média': d.media,
    'Occasionnelle': d.occ,
    'Montant (Ar)': d.montant
  }));

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <p style={{ fontWeight: 'bold', margin: 0 }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
              {entry.name}: {entry.name === 'Montant (Ar)' ? formatMontant(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const { totalUsagers, totalPayes, totalMontant, categoriesActives } = statsSummary;

  return (
    <div className="payment-section">
      {/* En-tête */}
      <div className="payment-header">
        <h2>
          <DollarSign size={28} strokeWidth={2} />
          Gestion des paiements
        </h2>
        <p className="payment-sub">
          {loading ? 'Chargement...' : `Total collecté : ${formatMontant(totalMontant)} · ${totalPayes} paiements`}
        </p>
      </div>

      {/* Statistiques clés */}
      <div className="payment-stats-simple">
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><PieChart size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalUsagers}</div>
            <div className="stat-simple-label">Usagers</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><CreditCard size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalPayes}</div>
            <div className="stat-simple-label">Paiements</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><TrendingUp size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalUsagers > 0 ? ((totalPayes / totalUsagers) * 100).toFixed(1) : 0}%</div>
            <div className="stat-simple-label">Taux de paiement</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><BarChart3 size={18} /></span>
          <div>
            <div className="stat-simple-number">{categoriesActives}</div>
            <div className="stat-simple-label">Catégories actives</div>
          </div>
        </div>
      </div>

      {/* Graphique en courbes */}
      <div className="payment-chart-container" style={{ marginTop: 20 }}>
        <h5>Évolution mensuelle des usagers par type et des montants collectés</h5>
        {loading ? (
          <div className="chart-loading">Chargement des données...</div>
        ) : error ? (
          <div className="chart-error">Erreur : {error}</div>
        ) : chartData.every(d => 
          d.hotel === 0 && d.grandSurface === 0 && d.bus === 0 && 
          d.nightclub === 0 && d.media === 0 && d.occ === 0 && d.montant === 0
        ) ? (
          <div className="chart-empty">Aucune donnée pour cette année</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis 
                yAxisId="left"
                tickFormatter={formatYAxis}
                tick={{ fontSize: 10 }}
                domain={[0, 'auto']}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tickFormatter={formatYAxis}
                tick={{ fontSize: 10 }}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />

              {TYPES.map(type => (
                <Line
                  key={type.key}
                  yAxisId="left"
                  type="monotone"
                  dataKey={type.label}
                  stroke={type.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Montant (Ar)"
                stroke="#FF5722"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="chart-legend">
          <span style={{ fontSize: 12, color: '#666' }}>
            * Les montants sont en Ariary (Ar)
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
          Total collecté : {formatMontant(totalMontant)}
        </span>
      </div>
    </div>
  );
};

export default PaymentSection;