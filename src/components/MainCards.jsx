import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Eye, Users, Activity, TrendingUp, Calendar,
  Hotel, ShoppingBag, Bus, Music, Tv, CalendarDays
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

const MainCards = () => {
  const navigate = useNavigate();

  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Définition des types – clés utilisées en interne
  const statTypes = [
    { key: 'hotel', label: 'Hôtel', color: '#4CAF50' },
    { key: 'grandSurface', label: 'Grande Surface', color: '#2196F3' },
    { key: 'bus', label: 'Bus', color: '#FF9800' },
    { key: 'nightclub', label: 'Night Club', color: '#9C27B0' },
    { key: 'media', label: 'Média', color: '#E91E63' },
    { key: 'occ', label: 'Occasionnelle', color: '#00BCD4' }
  ];

  // Mapping pour l'API – clé utilisée dans l'URL
  const getApiKey = (key) => {
    return key === 'grandSurface' ? 'grand-surface' : key;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken') || '';

        const totalPromises = statTypes.map(async (type) => {
          const apiKey = getApiKey(type.key);
          try {
            const res = await fetch(`http://localhost:3001/api/usagers/type/${apiKey}`, {
              headers: { 'adminToken': token }
            });
            const data = await res.json();
            console.log(`📊 ${type.label} (${apiKey}) :`, data);
            return { key: type.key, count: data.success ? data.usagers.length : 0 };
          } catch (err) {
            console.error(`❌ Erreur pour ${type.label} :`, err);
            return { key: type.key, count: 0 };
          }
        });

        const results = await Promise.all(totalPromises);
        const totalsData = {};
        results.forEach(r => { totalsData[r.key] = r.count; });
        console.log('✅ Totaux finaux :', totalsData);
        setTotals(totalsData);

      } catch (err) {
        console.error('❌ Erreur générale :', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculs
  const totalGeneral = Object.values(totals).reduce((a, b) => a + b, 0);
  const activeCategories = Object.values(totals).filter(count => count > 0).length;

  // Données pour le graphique (triées par valeur décroissante)
  const chartData = statTypes
    .map(type => ({
      name: type.label,
      value: totals[type.key] || 0,
      color: type.color
    }))
    .sort((a, b) => b.value - a.value);

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
            <div className="stat-simple-label">Total usagers</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><Activity size={18} /></span>
          <div>
            <div className="stat-simple-number">{activeCategories}</div>
            <div className="stat-simple-label">Catégories actives</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><TrendingUp size={18} /></span>
          <div>
            <div className="stat-simple-number">{statTypes.length}</div>
            <div className="stat-simple-label">Types disponibles</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><Calendar size={18} /></span>
          <div>
            <div className="stat-simple-number">{new Date().getFullYear()}</div>
            <div className="stat-simple-label">Année en cours</div>
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

      {/* ===== GRAPHIQUE ===== */}
      <div className="dynamic-chart-container">
        <div className="dynamic-chart-header">
          <h5>
            <Activity size={18} strokeWidth={2} />
            Répartition des usagers par type
          </h5>
          <span className="chart-total">
            <Users size={14} strokeWidth={2} />
            {totalGeneral}
          </span>
        </div>

        {loading ? (
          <div className="chart-loading">Chargement...</div>
        ) : error ? (
          <div className="chart-error">Erreur : {error}</div>
        ) : chartData.every(d => d.value === 0) ? (
          <div className="chart-empty">Aucun usager enregistré</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value) => `${value} usager(s)`}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pied */}
      <div className="main-card-footer">
        <span className="footer-info">
          <TrendingUp size={14} strokeWidth={2} />
          Données en temps réel
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