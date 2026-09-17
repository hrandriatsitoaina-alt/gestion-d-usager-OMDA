// src/pages/diagnostique.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  MapPin,
  Activity,
  PieChart,
  Target,
  RefreshCw,
  Loader2,
  X,
  Lightbulb,
  AlertCircle,
  LineChart as LineChartIcon,
  Sparkles,
  Bot,
  Send,
  ChevronRight,
  ChevronDown,
  Compass,
  Globe,
  User,
  ClipboardList,
  Trophy,
  FileWarning,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Home,
  CheckCircle,
  Zap,
  MessageSquare,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

import '../styles/diagnostique.css';

const API_BASE = 'http://localhost:3001/api';

const PRIORITY_ICON = {
  haute: '🔴',
  moyenne: '🟡',
  basse: '🟢'
};

const COLORS = ['#3d99f5', '#6bc1ff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const Diagnostique = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('Toutes');

  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [iaLoading, setIaLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(null);

  const chatMessagesRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetchDiagnostic();
  }, []);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatHistory, iaLoading]);

  const fetchDiagnostic = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/ia/diagnostic`);
      if (res.data.success) {
        setDiagnostic(res.data.diagnostic);
      } else {
        setError(res.data.message || 'Erreur lors de la génération du diagnostic');
      }
    } catch (err) {
      console.error('❌ Erreur chargement diagnostic IA:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const envoyerMessage = async (texte) => {
    const message = (texte ?? userInput).trim();
    if (!message) return;

    setUserInput('');
    setShowChat(true);
    setChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setIaLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/ia/chat`, { message });
      const reponse = res.data.success
        ? res.data.reponse
        : `⚠️ ${res.data.message || "Je n'ai pas pu traiter cette demande."}`;
      setChatHistory(prev => [...prev, { role: 'assistant', content: reponse }]);
    } catch (err) {
      console.error('❌ Erreur chat IA:', err);
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: "⚠️ Le service IA est momentanément indisponible. Réessayez dans un instant." }
      ]);
    } finally {
      setIaLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !iaLoading && userInput.trim()) {
      envoyerMessage();
    }
  };

  const toggleExpand = (alertId) => {
    setExpandedAlert(prev => (prev === alertId ? null : alertId));
  };

  const handleAlertAction = (alert) => {
    if (alert.action === 'voir-usagers' && alert.categorie) {
      navigate(`/verification-usager?type=${alert.categorie}`);
      return;
    }
    if (alert.action === 'voir-quittances') {
      navigate('/quitance');
      return;
    }
    let requete = `Explique-moi comment résoudre : ${alert.titre}`;
    if (alert.action === 'mission' && alert.region) {
      requete = `Planifier une mission de prospection dans la région ${alert.region}`;
    } else if (alert.action === 'relance-globale') {
      requete = 'Je veux lancer une campagne de relance pour les usagers en retard';
    } else if (alert.action === 'analyser-tendance') {
      requete = 'Analyser les causes de la baisse des revenus';
    } else if (alert.action === 'voir-anomalies') {
      requete = 'Voir les anomalies détectées dans les paiements';
    }
    envoyerMessage(requete);
  };

  // ===== RENDU DU CHAT =====
  const renderChat = () => (
    <>
      {showChat && (
        <div className="ia-chat-overlay" onClick={() => setShowChat(false)} />
      )}
      <div className={`ia-chat-container ${showChat ? 'active' : ''}`} ref={chatContainerRef}>
        <div className="ia-chat-header">
          <div className="ia-chat-header-left">
            <div className="ia-chat-header-avatar">
              <Bot size={18} />
            </div>
            <div className="ia-chat-header-info">
              <span className="ia-chat-title">Assistant IA OMDA</span>
              <span className="ia-online-badge">● En ligne</span>
            </div>
          </div>
          <button className="ia-chat-close" onClick={() => setShowChat(false)} title="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="ia-chat-messages" ref={chatMessagesRef}>
          {chatHistory.length === 0 ? (
            <div className="ia-chat-empty">
              <div className="ia-chat-empty-icon">
                <Bot size={40} />
              </div>
              <p className="ia-chat-empty-title">Bonjour ! Je suis votre assistant IA OMDA.</p>
              <p className="ia-chat-empty-sub">Posez-moi une question sur vos données ou choisissez une action rapide</p>
              <div className="ia-chat-quick-actions">
                <button onClick={() => envoyerMessage('Quelle est la performance globale ?')}>
                  <Target size={14} /> Performance
                </button>
                <button onClick={() => envoyerMessage('Voir les alertes')}>
                  <AlertCircle size={14} /> Alertes
                </button>
                <button onClick={() => envoyerMessage('Suggestions IA')}>
                  <Lightbulb size={14} /> Suggestions
                </button>
                <button onClick={() => envoyerMessage('Prévisions des revenus')}>
                  <TrendingUp size={14} /> Prévisions
                </button>
                <button onClick={() => envoyerMessage('Quels sont les succès ?')}>
                  <Trophy size={14} /> Succès
                </button>
                <button onClick={() => envoyerMessage("Donne-moi le plan d'action")}>
                  <ClipboardList size={14} /> Plan d'action
                </button>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`ia-chat-msg ${msg.role}`}>
                <div className={`ia-chat-avatar ${msg.role}`}>
                  {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={`ia-chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {iaLoading && (
            <div className="ia-chat-msg assistant">
              <div className="ia-chat-avatar assistant">
                <Bot size={16} />
              </div>
              <div className="ia-chat-bubble assistant loading">
                <Loader2 size={16} className="spinning" />
                <span>Réflexion en cours...</span>
              </div>
            </div>
          )}
        </div>

        <div className="ia-chat-input">
          <input
            type="text"
            placeholder="Posez une question à l'IA..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={iaLoading}
          />
          <button
            onClick={() => envoyerMessage()}
            disabled={iaLoading || !userInput.trim()}
            title="Envoyer"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );

  const renderNotification = () => (
    <button
      onClick={() => setShowChat(!showChat)}
      className={`ia-notification ${showChat ? 'active' : ''}`}
      title={showChat ? 'Fermer le chat' : 'Ouvrir l’assistant IA'}
    >
      <MessageSquare size={24} />
      {diagnostic?.alertes?.length > 0 && !showChat && (
        <span className="ia-notification-badge">{diagnostic.alertes.length}</span>
      )}
      <span className="ia-notification-label">IA</span>
    </button>
  );

  if (loading) {
    return (
      <div className="diagnostique-loading">
        <div className="spinner"></div>
        <div className="loading-text">Analyse IA des données en cours...</div>
        <div className="loading-sub">Cela peut prendre quelques secondes</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagnostique-error">
        <div className="error-icon-wrap">
          <AlertCircle size={48} />
        </div>
        <h2>Impossible de charger le diagnostic</h2>
        <p>{error}</p>
        <button onClick={() => fetchDiagnostic()}>
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    );
  }

  if (!diagnostic) return null;

  const { global, categories, tendance, forecast, parRegion, historique, alertes, succes, suggestions } = diagnostic;

  const regionsDisponibles = ['Toutes', ...(parRegion || []).map(r => r.region)];
  const regionsAffichees = selectedRegion === 'Toutes'
    ? (parRegion || [])
    : (parRegion || []).filter(r => r.region === selectedRegion);

  const dateGeneration = new Date(diagnostic.genereLe).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Données pour les graphiques
  const pieData = Object.entries(categories || {}).map(([key, c]) => ({
    name: c.label,
    value: c.tauxPaiement
  }));

  const barData = Object.entries(categories || {}).map(([key, c]) => ({
    name: c.label,
    payes: c.payes,
    nonPayes: c.nonPayes
  }));

  const forecastData = (forecast || []).map((v, i) => ({
    mois: `M${i + 1}`,
    valeur: v
  }));

  const getTendanceIcon = () => {
    if (!tendance) return <Minus size={16} />;
    if (tendance.direction === 'croissance') return <ArrowUp size={16} />;
    if (tendance.direction === 'décroissance') return <ArrowDown size={16} />;
    return <Minus size={16} />;
  };

  const getTendanceColor = () => {
    if (!tendance) return '#6b8a9a';
    if (tendance.direction === 'croissance') return '#22c55e';
    if (tendance.direction === 'décroissance') return '#ef4444';
    return '#f59e0b';
  };

  return (
    <div className="diagnostique-page">
      {/* HEADER */}
      <div className="diagnostique-header">
        <div className="header-left">
          <div className="header-icon-wrap">
            <Brain size={26} />
          </div>
          <div className="header-titles">
            <h1>Diagnostic IA</h1>
            <span className="subtitle">Analyse avancée des données OMDA</span>
          </div>
          <span className="ia-badge">
            <Sparkles size={14} /> IA Actif
          </span>
        </div>
        <div className="header-right">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="filter-select"
          >
            {regionsDisponibles.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <button onClick={() => navigate('/dashboard')} className="btn-header btn-dashboard">
            <Home size={16} /> Dashboard
          </button>
        </div>
      </div>

      {/* BANDEAU IA */}
      <div className="ia-header-banner">
        <div className="ia-header-content">
          <div className="ia-header-avatar">
            <Bot size={28} />
          </div>
          <div>
            <h3>Assistant IA — Diagnostic Intelligent</h3>
            <p>Dernière analyse : {dateGeneration}</p>
          </div>
        </div>
        <div className="ia-header-stats">
          <div className="ia-stat">
            <Activity size={16} />
            <span>{global.totalUsagers} usagers</span>
          </div>
          <div className="ia-stat">
            <DollarSign size={16} />
            <span>{global.totalUsagersPayes} à jour</span>
          </div>
          <div className="ia-stat highlight">
            <Target size={16} />
            <span>{global.tauxGlobal}% taux</span>
          </div>
        </div>
      </div>

      {/* SUGGESTIONS IA */}
      {suggestions?.length > 0 && (
        <div className="ia-suggestions-container">
          <div className="section-header">
            <h4><Lightbulb size={18} /> Suggestions IA</h4>
            <span className="section-count">{suggestions.length}</span>
          </div>
          <div className="ia-suggestions-grid">
            {suggestions.map((sug, idx) => (
              <div
                key={idx}
                className={`ia-suggestion-item ${sug.priorite || 'basse'}`}
                onClick={() => envoyerMessage(sug.texte)}
                title="Demander plus de détails à l'IA"
              >
                <div className="suggestion-icon">
                  <Zap size={15} />
                </div>
                <span className="suggestion-text">{sug.texte}</span>
                <span className="ia-suggestion-priority">
                  {PRIORITY_ICON[sug.priorite] || '🟢'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATS GLOBALES */}
      <div className="diagnostique-stats">
        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{global.totalUsagers}</span>
            <span className="stat-label">Usagers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <DollarSign size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{global.totalUsagersPayes}</span>
            <span className="stat-label">À jour</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary">
            <Activity size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{global.tauxGlobal}%</span>
            <span className="stat-label">Taux de paiement</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{global.quittancesNonValidees}</span>
            <span className="stat-label">Quittances à valider</span>
          </div>
        </div>
      </div>

      {/* ALERTES IA */}
      {alertes?.length > 0 && (
        <div className="alerts-container">
          <div className="alerts-header">
            <h4><AlertTriangle size={18} /> Alertes IA</h4>
            <span className="alerts-count">{alertes.length} alerte{alertes.length > 1 ? 's' : ''}</span>
          </div>
          <div className="alerts-list">
            {alertes.map((alert) => (
              <div key={alert.id} className={`alert-item-simple ${alert.type}`}>
                <div className="alert-icon-simple">
                  {alert.type === 'critique' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                </div>
                <div className="alert-content-simple">
                  <div className="alert-header-simple">
                    <span className="alert-title-simple">{alert.titre}</span>
                    <span className={`alert-badge-simple ${alert.type}`}>
                      {alert.type === 'critique' ? 'Critique' : alert.type === 'warning' ? 'Avertissement' : 'Info'}
                    </span>
                  </div>
                  <div className="alert-message-simple">{alert.message}</div>
                </div>
                <div className="alert-actions-simple">
                  <button className="alert-action-simple" onClick={() => toggleExpand(alert.id)}>
                    {expandedAlert === alert.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Plan
                  </button>
                  <button className="alert-action-simple secondary" onClick={() => handleAlertAction(alert)}>
                    <Bot size={14} /> IA
                  </button>
                  {alert.action === 'voir-usagers' && (
                    <button
                      className="alert-action-simple outline"
                      onClick={() => navigate(`/verification-usager?type=${alert.categorie}`)}
                    >
                      <Users size={14} /> Usagers
                    </button>
                  )}
                  {alert.action === 'voir-quittances' && (
                    <button className="alert-action-simple outline" onClick={() => navigate('/quitance')}>
                      <FileWarning size={14} /> Quittances
                    </button>
                  )}
                </div>
                {expandedAlert === alert.id && alert.plan && (
                  <div className="alert-plan-simple">
                    <ul>
                      {alert.plan.map((p, i) => (
                        <li key={i}>
                          <span className="step-num">{i + 1}</span>
                          <span className="step-text">{p.etape}</span>
                          <span className="delai">— {p.delai}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUCCÈS */}
      {succes?.length > 0 && (
        <div className="ia-message-container">
          <div className="ia-message">
            <div className="ia-icon-wrap">
              <Trophy size={22} />
            </div>
            <div className="ia-content">
              <strong className="ia-content-title">Points positifs détectés</strong>
              <ul>
                {succes.map((s, i) => (
                  <li key={i}>
                    <CheckCircle size={14} className="success-check" />
                    <span><strong>{s.titre}</strong> — {s.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* GRAPHIQUES */}
      <div className="diagnostique-charts">
        {forecastData.length > 0 && (
          <div className="chart-card">
            <h4><TrendingUp size={18} /> Prévisions 6 mois</h4>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#6b8a9a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b8a9a' }} />
                  <Tooltip
                    formatter={(value) => `${Math.round(value).toLocaleString()} Ar`}
                    contentStyle={{
                      borderRadius: 10,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      fontSize: 13,
                      padding: '10px 14px'
                    }}
                  />
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3d99f5" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3d99f5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="valeur" fill="url(#forecastGradient)" stroke="none" />
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke="#3d99f5"
                    strokeWidth={2.8}
                    dot={{ fill: '#3d99f5', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {barData.length > 0 && (
          <div className="chart-card">
            <h4><PieChart size={18} /> Paiements par catégorie</h4>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b8a9a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b8a9a' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      fontSize: 13
                    }}
                  />
                  <Bar dataKey="payes" fill="#22c55e" name="Payés" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="nonPayes" fill="#ef4444" name="Non payés" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {pieData.length > 0 && (
          <div className="chart-card">
            <h4><BarChart3 size={18} /> Taux par catégorie</h4>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    fontSize={11}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={{
                      borderRadius: 10,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      fontSize: 13
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tendance && (
          <div className="chart-card">
            <h4 className="chart-title-with-trend">
              <span className="chart-title-left">
                <LineChartIcon size={18} /> Tendance
              </span>
              <span className="trend-badge" style={{ color: getTendanceColor() }}>
                {getTendanceIcon()}
                {tendance.pourcentage}%
              </span>
            </h4>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { periode: 'Actuel', valeur: 100 },
                    { periode: 'Prévu', valeur: 100 + (tendance.pourcentage || 0) }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis dataKey="periode" tick={{ fontSize: 12, fill: '#6b8a9a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b8a9a' }} />
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={{
                      borderRadius: 10,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      fontSize: 13
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke={getTendanceColor()}
                    strokeWidth={3}
                    dot={{ fill: getTendanceColor(), r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* RÉPARTITION PAR RÉGION */}
      {regionsAffichees.length > 0 && (
        <div className="detail-section full-width">
          <h4>
            <MapPin size={18} /> Répartition par région
            {selectedRegion !== 'Toutes' && <span className="region-tag">— {selectedRegion}</span>}
          </h4>
          <ul className="detail-list region-list">
            {regionsAffichees.map((r, i) => (
              <li key={i}>
                <Globe size={16} />
                <span className="region-name">{r.region}</span>
                <span className="region-meta">
                  {r.nbQuittances} quittance{r.nbQuittances > 1 ? 's' : ''} · {Math.round(r.montant).toLocaleString()} Ar
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* OBJECTIFS ET RECOMMANDATIONS */}
      <div className="diagnostique-details">
        <div className="detail-section">
          <h4><Target size={18} /> Objectifs</h4>
          <ul className="detail-list">
            <li>
              <Target size={16} />
              <span>Atteindre <strong>{global.objectifTaux}%</strong> de taux de paiement</span>
            </li>
            {tendance && (
              <li>
                <Compass size={16} />
                <span>
                  Tendance : <strong>{tendance.direction}</strong> ({tendance.pourcentage}%)
                  <span className="trend-emoji" style={{ color: getTendanceColor() }}>
                    {tendance.direction === 'croissance' ? ' 📈' : tendance.direction === 'décroissance' ? ' 📉' : ' ➡️'}
                  </span>
                </span>
              </li>
            )}
            <li>
              <Clock size={16} />
              <span>
                <strong>{global.quittancesNonValidees}</strong> quittance{global.quittancesNonValidees > 1 ? 's' : ''} à valider
              </span>
            </li>
          </ul>
        </div>

        <div className="detail-section">
          <h4><Lightbulb size={18} /> Suggestions</h4>
          <ul className="detail-list">
            {(suggestions || []).map((s, i) => (
              <li key={i} className="suggestion-list-item">
                <span className="priority-dot">{PRIORITY_ICON[s.priorite] || '🟢'}</span>
                <span>{s.texte}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* HISTORIQUE PERFORMANCE */}
      <div className="performance-history">
        <h4><LineChartIcon size={18} /> Historique de performance</h4>
        <div className="performance-stats">
          <div className="perf-item">
            <span className="perf-label">Meilleur mois</span>
            <span className="perf-value">
              {historique?.meilleurMois
                ? `${historique.meilleurMois.montant.toLocaleString()} Ar`
                : 'Pas assez de données'}
            </span>
            {historique?.meilleurMois && (
              <span className="perf-sub">{historique.meilleurMois.periode}</span>
            )}
          </div>
          <div className="perf-item">
            <span className="perf-label">Moyenne mensuelle</span>
            <span className="perf-value">
              {(historique?.moyenneMensuelle || 0).toLocaleString()} Ar
            </span>
          </div>
          <div className="perf-item">
            <span className="perf-label">Croissance annuelle</span>
            <span
              className="perf-value"
              style={{
                color:
                  historique?.croissanceAnnuelle > 0
                    ? '#22c55e'
                    : historique?.croissanceAnnuelle < 0
                    ? '#ef4444'
                    : '#f59e0b'
              }}
            >
              {historique?.croissanceAnnuelle !== null && historique?.croissanceAnnuelle !== undefined
                ? `${historique.croissanceAnnuelle > 0 ? '+' : ''}${historique.croissanceAnnuelle}%`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {renderChat()}
      {renderNotification()}
    </div>
  );
};

export default Diagnostique;