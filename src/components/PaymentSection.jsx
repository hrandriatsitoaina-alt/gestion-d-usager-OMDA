// ============================================================
// COMPOSANT : PaymentSection.jsx (Recharts - 6 courbes + montant)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, PieChart, CreditCard, TrendingUp, Calendar,
  FileText, Printer, Layers, BarChart3, BookOpen
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
    categoriesActives: 0,
    usagersAyantPaye: 0
  });

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

  const TYPES = [
    { key: 'hotel', label: t('Hôtel', 'Trano fandraisam-bahiny', 'Hotel'), color: '#4CAF50' },
    { key: 'grandSurface', label: t('Grande Surface', 'Trano fivarotana lehibe', 'Supermarket'), color: '#2196F3' },
    { key: 'bus', label: t('Bus', 'Fiarakodia', 'Bus'), color: '#FF9800' },
    { key: 'nightclub', label: t('Night Club', 'Kliobina alina', 'Night Club'), color: '#9C27B0' },
    { key: 'media', label: t('Média', 'Haino aman-jery', 'Media'), color: '#E91E63' },
    { key: 'occ', label: t('Occasionnelle', 'Tsindraindray', 'Occasional'), color: '#00BCD4' }
  ];

  // Mois selon la langue
  const moisLabels = {
    fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    mg: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jol', 'Aog', 'Sep', 'Okt', 'Nov', 'Des'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };

  const getMonths = () => {
    return moisLabels[appLangue] || moisLabels['fr'];
  };

  // Format montant complet
  const formatMontant = (value) => {
    if (value === 0) return '0 Ar';
    return Math.round(value).toLocaleString('fr-FR') + ' Ar';
  };

  // Format pour l'axe Y
  const formatYAxis = (value) => {
    if (value === 0) return '0';
    return Math.round(value).toLocaleString('fr-FR');
  };

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const token = localStorage.getItem('adminToken') || '';
        const currentYear = new Date().getFullYear();
        const months = getMonths();

        const usagersRes = await fetch('http://localhost:3001/api/usagers', {
          headers: { adminToken: token }
        });
        let usagersData = await usagersRes.json();
        if (!Array.isArray(usagersData)) usagersData = usagersData.usagers || [];

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

        // Montants par mois
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

        // ===== Synthèse =====
        const totalUsagers = usagersData.length;
        const paiementsPayes = paiements.filter(p => p.statut === 'paye');
        const totalPayes = paiementsPayes.length;
        const totalMontant = paiementsPayes.reduce(
          (sum, p) => sum + parseFloat(p.montant || 0), 0
        );

        // Nombre d'usagers distincts ayant au moins un paiement
        const usagersAyantPaye = new Set(
          paiementsPayes
            .map(p => p.usager_id || p.id_usager || p.numero_usager)
            .filter(id => id !== undefined && id !== null)
        ).size;

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

        setStatsSummary({
          totalUsagers,
          totalPayes,
          totalMontant,
          categoriesActives,
          usagersAyantPaye
        });

      } catch (err) {
        console.error('❌ Erreur chargement données mensuelles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [appLangue]);

  // Données pour le graphique
  const chartData = monthlyData.map(d => ({
    ...d,
    [t('Hôtel', 'Trano fandraisam-bahiny', 'Hotel')]: d.hotel,
    [t('Grande Surface', 'Trano fivarotana lehibe', 'Supermarket')]: d.grandSurface,
    [t('Bus', 'Fiarakodia', 'Bus')]: d.bus,
    [t('Night Club', 'Kliobina alina', 'Night Club')]: d.nightclub,
    [t('Média', 'Haino aman-jery', 'Media')]: d.media,
    [t('Occasionnelle', 'Tsindraindray', 'Occasional')]: d.occ,
    [t('Montant (Ar)', 'Vola (Ar)', 'Amount (Ar)')]: d.montant
  }));

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <p style={{ fontWeight: 'bold', margin: 0 }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
              {entry.name}: {entry.name === t('Montant (Ar)', 'Vola (Ar)', 'Amount (Ar)')
                ? formatMontant(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const {
    totalUsagers,
    totalPayes,
    totalMontant,
    categoriesActives,
    usagersAyantPaye
  } = statsSummary;

  // ===== TAUX DE PAIEMENT CORRIGÉ (plafonné à 100%) =====
  const tauxPaiement = totalUsagers > 0
    ? Math.min((usagersAyantPaye / totalUsagers) * 100, 100)
    : 0;

  return (
    <div className="payment-section">
      {/* En-tête */}
      <div className="payment-header">
        <h2>
          <DollarSign size={28} strokeWidth={2} />
          {t('Gestion des paiements', 'Fitandremana ny fandoavana', 'Payment management')}
        </h2>
        <p className="payment-sub">
          {loading ? t('Chargement...', 'Mandrindra...', 'Loading...') :
            t('Total collecté : {montant} · {count} paiements',
              'Vola voangona : {montant} · {count} fandoavana',
              'Total collected : {montant} · {count} payments')
              .replace('{montant}', formatMontant(totalMontant))
              .replace('{count}', totalPayes)}
        </p>
      </div>

      {/* Statistiques clés */}
      <div className="payment-stats-simple">
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><PieChart size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalUsagers}</div>
            <div className="stat-simple-label">{t('Usagers', 'Mpampiasa', 'Users')}</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><CreditCard size={18} /></span>
          <div>
            <div className="stat-simple-number">{totalPayes}</div>
            <div className="stat-simple-label">{t('Paiements', 'Fandoavana', 'Payments')}</div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><TrendingUp size={18} /></span>
          <div>
            <div className="stat-simple-number">
              {tauxPaiement.toFixed(1)}%
            </div>
            <div className="stat-simple-label">
              {t('Taux de paiement', "Tahan'ny fandoavana", 'Payment rate')}
            </div>
          </div>
        </div>
        <div className="stat-simple-item">
          <span className="stat-simple-icon"><BarChart3 size={18} /></span>
          <div>
            <div className="stat-simple-number">{categoriesActives}</div>
            <div className="stat-simple-label">{t('Catégories actives', 'Sokajy mavitrika', 'Active categories')}</div>
          </div>
        </div>
      </div>

      {/* Graphique en courbes */}
      <div className="payment-chart-container" style={{ marginTop: 20 }}>
        <h5>
          {t('Évolution mensuelle des usagers par type et des montants collectés',
             "Fivoaran'ny mpampiasa isam-bolana araka ny karazany sy ny vola voangona",
             'Monthly evolution of users by type and collected amounts')}
        </h5>
        {loading ? (
          <div className="chart-loading">{t('Chargement des données...', 'Mandrindra ny data...', 'Loading data...')}</div>
        ) : error ? (
          <div className="chart-error">{t('Erreur :', 'Hadisoana :', 'Error :')} {error}</div>
        ) : chartData.every(d =>
          d.hotel === 0 && d.grandSurface === 0 && d.bus === 0 &&
          d.nightclub === 0 && d.media === 0 && d.occ === 0 && d.montant === 0
        ) ? (
          <div className="chart-empty">{t('Aucune donnée pour cette année', "Tsy misy data ho an'ity taona ity", 'No data for this year')}</div>
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
                dataKey={t('Montant (Ar)', 'Vola (Ar)', 'Amount (Ar)')}
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
            * {t('Les montants sont en Ariary (Ar)', 'Ny vola dia Ariary (Ar)', 'Amounts are in Ariary (Ar)')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="payment-actions">
        <button className="btn-primary" onClick={() => navigate('/gere-dossier')}>
          <FileText size={18} /> {t('Gestion des dossiers', 'Fitandremana ny rakitra', 'Folder management')}
        </button>
        <button className="btn-secondary" onClick={() => navigate('/billan')}>
          <DollarSign size={18} /> {t('Bilan financier', 'Famerenam-bola', 'Financial balance')}
        </button>
        <button className="btn-secondary" onClick={() => navigate('/facture-usager')}>
          <Printer size={18} /> {t('Factures', 'Faktiora', 'Invoices')}
        </button>
        <button className="btn-secondary" onClick={() => navigate('/quitance')}>
          <BookOpen size={18} /> {t('Suivi Quittances', 'Fanaraha-maso ny fandoavana', 'Receipt tracking')}
        </button>
      </div>

      {/* Pied */}
      <div className="payment-footer">
        <span className="footer-info">
          <Calendar size={14} /> {t('Dernière mise à jour :', 'Fanavaozana farany :', 'Last update :')} {new Date().toLocaleDateString(
            appLangue === 'fr' ? 'fr-FR' :
            appLangue === 'mg' ? 'mg-MG' : 'en-US'
          )}
        </span>
        <span className="footer-total">
          {t('Total collecté :', 'Vola voangona :', 'Total collected :')} {formatMontant(totalMontant)}
        </span>
      </div>
    </div>
  );
};

export default PaymentSection;