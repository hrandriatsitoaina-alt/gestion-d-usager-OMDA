// src/components/regionListe.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Users, TrendingUp, Activity, BarChart2, Eye } from 'lucide-react';
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

const RegionListe = () => {
  const [regions, setRegions] = useState([]);
  const [usagerCounts, setUsagerCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== ÉTATS POUR LA LANGUE =====
  const [appLangue, setAppLangue] = useState('fr');

  // ===== CHARGER LA LANGUE =====
  useEffect(() => {
    const langue = localStorage.getItem('app-langue') || 'fr';
    setAppLangue(langue);
    
    const handleLangueChange = (event) => {
      const { langue } = event.detail;
      setAppLangue(langue);
    };
    
    window.addEventListener('langue-change', handleLangueChange);
    
    return () => {
      window.removeEventListener('langue-change', handleLangueChange);
    };
  }, []);

  // ===== FONCTION DE TRADUCTION =====
  const t = (fr, mg, en) => {
    switch (appLangue) {
      case 'mg': return mg || fr;
      case 'en': return en || fr;
      default: return fr;
    }
  };

  const token = localStorage.getItem('adminToken') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les régions
        const regionRes = await fetch('http://localhost:3001/api/regions');
        const regionData = await regionRes.json();
        if (!regionData.success) throw new Error(t('Erreur chargement régions', 'Hadisoana tamin\'ny fampidirana ny faritra', 'Error loading regions'));
        setRegions(regionData.regions);

        // Récupérer tous les usagers pour compter par région
        const usagerRes = await fetch('http://localhost:3001/api/usagers', {
          headers: { adminToken: token }
        });
        let usagers = await usagerRes.json();
        if (!Array.isArray(usagers)) usagers = usagers.usagers || [];

        const counts = {};
        usagers.forEach(u => {
          const region = u.region || t('Non spécifié', 'Tsy voafaritra', 'Not specified');
          counts[region] = (counts[region] || 0) + 1;
        });

        const chartData = Object.keys(counts).map(region => ({
          name: region,
          value: counts[region]
        }));
        chartData.sort((a, b) => b.value - a.value);
        setUsagerCounts(chartData);

      } catch (err) {
        console.error('❌ Erreur chargement données régions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appLangue]);

  // Statistiques
  const totalRegions = regions.length;
  const totalUsagers = usagerCounts.reduce((sum, d) => sum + d.value, 0);
  const regionMax = usagerCounts.length > 0 ? usagerCounts[0] : null;
  const regionsAvecUsagers = usagerCounts.filter(d => d.value > 0).length;
  const tauxCouverture = totalRegions > 0 ? ((regionsAvecUsagers / totalRegions) * 100).toFixed(1) : 0;

  // Couleurs pour les barres
  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#FF5722', '#607D8B', '#795548', '#9E9E9E'];

  if (loading) return <div className="loading-spinner">...</div>;
  if (error) return <div className="error-msg">{t('Erreur :', 'Hadisoana :', 'Error :')} {error}</div>;

  return (
    <div className="bilan-container" style={{ marginTop: 20 }}>
      {/* En-tête */}
      <div className="bilan-header">
        <h2>
          <MapPin size={28} strokeWidth={2} />
          {t('Répartition géographique', 'Fizarana ara-paritra', 'Geographical distribution')}
        </h2>
        <p className="bilan-sub">
          {loading ? '' : 
            t('{count} régions · {users} usagers', 
              '{count} faritra · {users} mpampiasa', 
              '{count} regions · {users} users')
              .replace('{count}', totalRegions)
              .replace('{users}', totalUsagers)}
        </p>
      </div>

      {/* Grille à deux colonnes */}
      <div className="bilan-grid">
        {/* Colonne gauche : graphique */}
        <div className="bilan-left">
          <h5 style={{ marginTop: 0, marginBottom: 10, color: '#555', fontWeight: 500 }}>
            <BarChart2 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('Usagers par région', 'Mpampiasa isam-paritra', 'Users per region')}
          </h5>
          {usagerCounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#888' }}>
              {t('Aucun usager enregistré', 'Tsy misy mpampiasa voasoratra', 'No registered users')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={usagerCounts} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(value) => 
                  t('{value} usager(s)', '{value} mpampiasa', '{value} user(s)').replace('{value}', value)
                } />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {usagerCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 5 }}>
            {t('Données en temps réel', 'Data amin\'ny fotoana tena izy', 'Real-time data')}
          </div>
        </div>

        {/* Colonne droite : indicateurs + perspectives */}
        <div className="bilan-right">
          {/* 4 indicateurs style BilanCards */}
          <div className="bilan-stats">
            <div className="bilan-stat-item">
              <span className="bilan-stat-icon"><MapPin size={18} /></span>
              <div>
                <div className="bilan-stat-number">{totalRegions}</div>
                <div className="bilan-stat-label">{t('Régions', 'Faritra', 'Regions')}</div>
              </div>
            </div>
            <div className="bilan-stat-item">
              <span className="bilan-stat-icon"><Users size={18} /></span>
              <div>
                <div className="bilan-stat-number">{totalUsagers}</div>
                <div className="bilan-stat-label">{t('Usagers', 'Mpampiasa', 'Users')}</div>
              </div>
            </div>
            <div className="bilan-stat-item">
              <span className="bilan-stat-icon"><TrendingUp size={18} /></span>
              <div>
                <div className="bilan-stat-number">{regionsAvecUsagers}</div>
                <div className="bilan-stat-label">{t('Régions actives', 'Faritra mavitrika', 'Active regions')}</div>
              </div>
            </div>
            <div className="bilan-stat-item">
              <span className="bilan-stat-icon"><Activity size={18} /></span>
              <div>
                <div className="bilan-stat-number">{tauxCouverture}%</div>
                <div className="bilan-stat-label">{t('Taux de couverture', 'Tahan\'ny fandrakofana', 'Coverage rate')}</div>
              </div>
            </div>
          </div>

          {/* Encart "Évolution et perspectives d'avenir" */}
          <div className="bilan-actions" style={{ background: '#f9f9fc', border: '1px solid #e8e8ee', padding: '12px 15px', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Eye size={16} color="#039BE5" />
              <h5 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#222' }}>
                {t('Évolution et perspectives d\'avenir', 
                   'Fivoarana sy fijery ho avy', 
                   'Evolution and future prospects')}
              </h5>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.4 }}>
              {totalUsagers > 0 
                ? t(
                    'La région {region} concentre {count} usagers ({percent}% du total). {active} régions sont actives sur {total}, soit un taux de couverture de {coverage}%. Une expansion vers les zones moins représentées est recommandée.',
                    'Ny faritra {region} dia manana mpampiasa {count} ({percent}% amin\'ny totaliny). {active} faritra no mavitrika amin\'ny {total}, izany hoe tahan\'ny fandrakofana {coverage}%. Aroso ny fanitarana any amin\'ny faritra tsy dia be solontena.',
                    'The region {region} has {count} users ({percent}% of total). {active} regions are active out of {total}, giving a coverage rate of {coverage}%. Expansion to less represented areas is recommended.'
                  )
                  .replace('{region}', regionMax?.name || '')
                  .replace('{count}', regionMax?.value || 0)
                  .replace('{percent}', ((regionMax?.value || 0) / totalUsagers * 100).toFixed(1))
                  .replace('{active}', regionsAvecUsagers)
                  .replace('{total}', totalRegions)
                  .replace('{coverage}', tauxCouverture)
                : t(
                    'Aucun usager enregistré pour le moment. Commencez à ajouter des usagers pour obtenir des perspectives.',
                    'Tsy misy mpampiasa voasoratra amin\'izao fotoana izao. Atombohy ny fampidirana mpampiasa mba hahazoana fijery.',
                    'No users registered at the moment. Start adding users to get insights.'
                  )}
            </p>
          </div>

          {/* Pied léger */}
          <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 10 }}>
            {t('Dernière mise à jour :', 'Fanavaozana farany :', 'Last update :')} {new Date().toLocaleString(
              appLangue === 'fr' ? 'fr-FR' : 
              appLangue === 'mg' ? 'mg-MG' : 'en-US'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionListe;