import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Eye, Users, Activity, TrendingUp, Calendar,
  Hotel, ShoppingBag, Bus, Music, Tv, CalendarDays,
  BarChart, ArrowRight, PieChart
} from 'lucide-react';

const MainCards = () => {
  const navigate = useNavigate();

  const [totals, setTotals] = useState({});
  const [newCounts, setNewCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Types
  const statTypes = [
    { key: 'hotel', label: 'Hôtel', icon: Hotel, color: '#4CAF50' },
    { key: 'grandSurface', label: 'Grande Surface', icon: ShoppingBag, color: '#2196F3' },
    { key: 'bus', label: 'Bus', icon: Bus, color: '#FF9800' },
    { key: 'nightclub', label: 'Night Club', icon: Music, color: '#9C27B0' },
    { key: 'media', label: 'Média', icon: Tv, color: '#E91E63' },
    { key: 'occ', label: 'Occasionnelle', icon: CalendarDays, color: '#00BCD4' }
  ];

  const chartTypes = statTypes.map(t => ({ ...t, key: t.key === 'grandSurface' ? 'grand-surface' : t.key }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken') || '';

        // 1. Totaux par type
        const totalPromises = statTypes.map(async (type) => {
          const key = type.key === 'grandSurface' ? 'grand-surface' : type.key;
          const res = await fetch(`http://localhost:3001/api/usagers/type/${key}`, {
            headers: { 'adminToken': token }
          });
          const data = await res.json();
          return { key: type.key, count: data.success ? data.usagers.length : 0 };
        });
        const totalResults = await Promise.all(totalPromises);
        const totalsData = {};
        totalResults.forEach(r => { totalsData[r.key] = r.count; });
        setTotals(totalsData);

        // 2. Nouveaux compteurs (24h)
        const newRes = await fetch('http://localhost:3001/api/usagers/nouveaux-compteur', {
          headers: { 'adminToken': token }
        });
        const newData = await newRes.json();
        if (newData.success) {
          setNewCounts(newData.nouveaux);
        }

      } catch (error) {
        console.error('❌ Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculs
  const totalGeneral = Object.values(totals).reduce((a, b) => a + b, 0);
  const totalNew = newCounts ? Object.values(newCounts).reduce((a, b) => a + b, 0) : 0;
  const growthRate = totalGeneral > 0 ? ((totalNew / totalGeneral) * 100).toFixed(1) : 0;
  const activeCategories = Object.values(totals).filter(count => count > 0).length;

  return (
    <div className="main-card-full">

      {/* En-tête */}
      <div className="main-card-header">
        <h2>
          <Users size={28} strokeWidth={2} />
          Gestion des usagers
        </h2>
        <p className="main-card-sub">
          {loading ? 'Chargement...' : `${totalGeneral} usagers enregistrés`}
        </p>
      </div>

      {/* Ligne de statistiques simplifiée */}
      <div className="stats-simple">
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><Users size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalGeneral}</div>
            <div className="stat-simple-label">Total</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><Activity size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalNew}</div>
            <div className="stat-simple-label">Nouveaux (24h)</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><TrendingUp size={18} /></span>
          <div>
            <div className="stat-simple-number">{growthRate}%</div>
            <div className="stat-simple-label">Croissance</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><PieChart size={18} /></span>
          <div>
            <div className="stat-simple-number">{activeCategories}</div>
            <div className="stat-simple-label">Catégories actives</div>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="main-card-actions">
        <button className="btn-primary" onClick={() => navigate('/ajout-usager')}>
          <UserPlus size={18} strokeWidth={2} />
          Ajouter un usager
        </button>
        <button className="btn-secondary" onClick={() => navigate('/verification-usager')}>
          <Eye size={18} strokeWidth={2} />
          Consulter les usagers
        </button>
      </div>

      {/* ===== GRAPHIQUE DYNAMIQUE ===== */}
      <div className="dynamic-chart-container">
        <div className="dynamic-chart-header">
          <h5>
            <Activity size={18} strokeWidth={2} />
            Nouveaux usagers par type (24h)
          </h5>
          <span className="chart-total">
            <Users size={14} strokeWidth={2} />
            {totalNew}
          </span>
        </div>

        {loading ? (
          <div className="chart-loading">Chargement...</div>
        ) : (
          <div className="dynamic-chart-bars">
            {chartTypes.map(type => {
              const key = type.key === 'grand-surface' ? 'grand-surface' : type.key;
              const value = newCounts?.[key] || 0;
              const maxVal = Math.max(...Object.values(newCounts || {}), 1);
              const percent = (value / maxVal) * 100;
              return (
                <div className="dynamic-bar-item" key={type.key}>
                  <div className="dynamic-bar-label">{type.label}</div>
                  <div className="dynamic-bar-track">
                    <div
                      className="dynamic-bar-fill"
                      style={{
                        width: `${Math.max(percent, 2)}%`,
                        backgroundColor: type.color
                      }}
                    />
                  </div>
                  <div className="dynamic-bar-value">{value}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pied */}
      <div className="main-card-footer">
        <span className="footer-info">
          <TrendingUp size={14} strokeWidth={2} />
          Mise à jour automatique toutes les 24h
        </span>
        <span className="footer-date">
          <Calendar size={14} strokeWidth={2} />
          {new Date().toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default MainCards;