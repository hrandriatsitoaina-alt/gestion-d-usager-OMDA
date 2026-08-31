// src/pages/GerePaiement.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  RefreshCw,
  Loader,
  BadgeCheck,
  AlertTriangle,
  Info,
  Hotel,
  Store,
  Bus,
  Music,
  Tv,
  Eye,
  EyeOff,
  Star,
  Award,
  Wallet,
  ReceiptText
} from 'lucide-react';
import '../styles/gere-paiement.css';
import MiniSidebar from '../components/MiniSidebar';

const GerePaiement = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [selectedType, setSelectedType] = useState('hotel');
  const [selectedRegion, setSelectedRegion] = useState('tous');
  const [regions, setRegions] = useState([]);
  const [usagers, setUsagers] = useState([]);
  const [filteredUsagers, setFilteredUsagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsager, setSelectedUsager] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [nouveauxIds, setNouveauxIds] = useState({});
  const [showOnlyNouveaux, setShowOnlyNouveaux] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const currentYear = new Date().getFullYear();

  const [filtreAnnee, setFiltreAnnee] = useState(currentYear);
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [nombreMois, setNombreMois] = useState(1);
  const [montantPayer, setMontantPayer] = useState('');
  const [montantTotal, setMontantTotal] = useState(0);
  const [montantMensuelOriginal, setMontantMensuelOriginal] = useState(0);

  const notificationsAffichees = useRef(new Set());

  // Type config sans "occ" (occasionnel)
  const typeConfig = {
    hotel: { label: 'Hôtels', icon: Hotel },
    'grand-surface': { label: 'Grandes Surfaces', icon: Store },
    bus: { label: 'Bus', icon: Bus },
    nightclub: { label: 'Night Clubs', icon: Music },
    media: { label: 'Médias', icon: Tv }
  };

  const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const moisLabelsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  // ========== CHARGEMENT ==========
  const loadRegions = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/regions');
      const data = await res.json();
      if (data.success) setRegions(data.regions);
    } catch (err) { console.error(err); }
  }, []);

  const checkNouveauxUsagers = useCallback(async () => {
    try {
      const countRes = await fetch('http://localhost:3001/api/usagers/nouveaux-compteur');
      const countData = await countRes.json();
      if (countData.success && countData.nouveaux) {
        let totalNew = 0;
        const idsTemp = {};
        const typesFiltres = Object.keys(countData.nouveaux).filter(t => t !== 'occ');
        for (const type of typesFiltres) {
          if (countData.nouveaux[type] > 0) {
            totalNew += countData.nouveaux[type];
            const idsRes = await fetch(`http://localhost:3001/api/usagers/nouveaux-ids/${type}`);
            const idsData = await idsRes.json();
            idsTemp[type] = idsData.success ? idsData.ids : [];
          } else {
            idsTemp[type] = [];
          }
        }
        setNouveauxIds(idsTemp);
        const key = JSON.stringify(idsTemp);
        if (totalNew > 0 && !notificationsAffichees.current.has(key)) {
          notificationsAffichees.current.add(key);
          setNotification({
            type: 'info',
            message: `${totalNew} nouveau(x) usager(s) ajouté(s)`,
            onClick: () => {
              setShowOnlyNouveaux(true);
              setTimeout(() => setNotification(null), 5000);
            }
          });
        }
      }
    } catch (err) { console.error(err); }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const statsRes = await fetch('http://localhost:3001/api/paiements/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      const url = `http://localhost:3001/api/usagers/paiements/${selectedType}`;
      const usagersRes = await fetch(url);
      const usagersData = await usagersRes.json();

      if (!usagersRes.ok) {
        setApiError(`Erreur ${usagersRes.status} : ${usagersRes.statusText}`);
        setUsagers([]);
        setFilteredUsagers([]);
        setLoading(false);
        return;
      }

      if (usagersData.success && usagersData.usagers?.length) {
        let sorted = [...usagersData.usagers];
        if (selectedRegion !== 'tous') {
          sorted = sorted.filter(u => u.region === selectedRegion);
        }
        sorted.sort((a, b) => {
          const nomA = (a.denomination || a.nom_evenement || a.organisateurs || '').toLowerCase();
          const nomB = (b.denomination || b.nom_evenement || b.organisateurs || '').toLowerCase();
          return nomA.localeCompare(nomB);
        });
        setUsagers(sorted);
        setFilteredUsagers(sorted);
      } else {
        setUsagers([]);
        setFilteredUsagers([]);
        setApiError('Aucun usager trouvé');
      }

      try {
        const anRes = await fetch(`http://localhost:3001/api/paiements/annees-disponibles/${selectedType}`);
        const anData = await anRes.json();
        if (anData.success && anData.annees.length) {
          setAnneesDisponibles(anData.annees);
          if (anData.annees.includes(currentYear)) setFiltreAnnee(currentYear);
          else setFiltreAnnee(anData.annees[anData.annees.length - 1]);
        } else {
          setAnneesDisponibles([currentYear, currentYear + 1]);
          setFiltreAnnee(currentYear);
        }
      } catch {
        setAnneesDisponibles([currentYear, currentYear + 1]);
        setFiltreAnnee(currentYear);
      }

      await checkNouveauxUsagers();
    } catch (err) {
      console.error(err);
      setApiError(err.message);
      setUsagers([]);
      setFilteredUsagers([]);
      setAnneesDisponibles([currentYear, currentYear + 1]);
      setNotification({ type: 'error', message: 'Erreur de chargement des données' });
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedRegion, currentYear, checkNouveauxUsagers]);

  useEffect(() => {
    loadRegions();
    loadAllData();
  }, [loadRegions, loadAllData]);

  const filterUsagers = useCallback(() => {
    let filtered = [...usagers];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => {
        const nom = (u.denomination || u.nom_evenement || u.organisateurs || '').toLowerCase();
        const demandeur = (u.demandeur || u.representant_par || '').toLowerCase();
        const telephone = u.telephone || '';
        const email = (u.email || '').toLowerCase();
        const region = (u.region || '').toLowerCase();
        const adresse = (u.adresse || u.adresse_siege || '').toLowerCase();
        return nom.includes(term) || demandeur.includes(term) || telephone.includes(term) ||
               email.includes(term) || region.includes(term) || adresse.includes(term);
      });
    }
    if (showOnlyNouveaux) {
      if (nouveauxIds[selectedType]?.length) {
        filtered = filtered.filter(u => nouveauxIds[selectedType].includes(u.id));
      }
    }
    setFilteredUsagers(filtered);
  }, [searchTerm, usagers, showOnlyNouveaux, nouveauxIds, selectedType]);

  useEffect(() => {
    filterUsagers();
  }, [filterUsagers]);

  // ========== FONCTIONS CORRIGÉES - AFFICHE TOUS LES MOIS PAYÉS ==========
  
  // ✅ Récupère la liste des mois payés pour une année donnée
  const getMoisPayes = (usager, annee) => {
    return usager.moisPayesParAnnee?.[annee] || [];
  };

  // ✅ Récupère le mois de début de paiement
  const getMoisDebut = (usager, annee) => {
    const anneeData = usager.resumeAnnees?.find(a => a.annee === annee);
    if (anneeData && anneeData.moisDebut) {
      return anneeData.moisDebut;
    }
    return usager.moisCreation || 1;
  };

  // ✅ Récupère TOUS les mois payés (sans filtre de début)
  const getMoisPayesComplet = (usager, annee) => {
    return usager.moisPayesParAnnee?.[annee] || [];
  };

  // ✅ Affiche la progression des paiements (mois payés / 12)
  const getProgressionForYear = (usager, annee) => {
    // ✅ Utiliser TOUS les mois payés, pas seulement ceux après le début
    const moisPayes = getMoisPayesComplet(usager, annee);
    const nbMoisPayes = moisPayes.length;
    
    // ✅ Trier les mois payés pour l'affichage
    const moisTries = [...moisPayes].sort((a, b) => a - b);
    const affichageMois = moisTries.map(m => moisLabelsShort[m - 1]).join(', ');
    
    // ✅ Si 12 mois payés
    if (nbMoisPayes >= 12) {
      return '12/12 ✅';
    }
    
    // ✅ Si des mois sont payés
    if (nbMoisPayes > 0) {
      return `${nbMoisPayes}/12 (${affichageMois})`;
    }
    
    // ✅ Aucun mois payé
    return '0/12';
  };

  // ✅ Vérifie si l'usager est en retard (basé sur les mois payés)
  const isEnRetard = (usager) => {
    const moisPayes = getMoisPayesComplet(usager, filtreAnnee);
    const nbMoisPayes = moisPayes.length;
    
    // ✅ Si 12 mois payés, pas en retard
    if (nbMoisPayes >= 12) return false;
    
    const moisDebut = getMoisDebut(usager, filtreAnnee);
    const moisActuel = new Date().getMonth() + 1;
    const anneeActuelle = new Date().getFullYear();
    
    // ✅ Pour l'année en cours
    if (filtreAnnee === anneeActuelle) {
      const moisEcoules = Math.min(moisActuel, 12) - moisDebut + 1;
      return nbMoisPayes < moisEcoules && nbMoisPayes < 12;
    }
    
    // ✅ Pour les années passées
    if (filtreAnnee < anneeActuelle) {
      return nbMoisPayes < 12;
    }
    
    return false;
  };

  // ✅ Affiche le badge de statut - CORRIGÉ
  const getStatusBadge = (usager) => {
    // ✅ Utiliser TOUS les mois payés
    const moisPayes = getMoisPayesComplet(usager, filtreAnnee);
    const nbMoisPayes = moisPayes.length;
    
    // ✅ Trier les mois payés pour l'affichage
    const moisTries = [...moisPayes].sort((a, b) => a - b);
    const affichageMois = moisTries.map(m => moisLabelsShort[m - 1]).join(', ');
    
    // ✅ Si 12 mois payés
    if (nbMoisPayes >= 12) {
      return <span className="badge badge-success"><CheckCircle size={14} /> 12/12 ✅</span>;
    }
    
    // ✅ Si des mois sont payés
    if (nbMoisPayes > 0) {
      const moisRestants = 12 - nbMoisPayes;
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={14} /> {nbMoisPayes}/12
          <span className="badge-sub"> ({affichageMois})</span>
          <span className="badge-sub" style={{ display: 'block', marginTop: '2px' }}>
            {moisRestants} mois restants
          </span>
        </span>
      );
    }
    
    // ✅ Aucun mois payé
    return <span className="badge badge-danger"><X size={14} /> 0/12</span>;
  };

  const getFullInfo = (usager, type) => {
    const infos = [];
    if (usager.adresse || usager.adresse_siege) infos.push({ icon: null, text: usager.adresse || usager.adresse_siege });
    if (usager.region && usager.region !== 'N/A') infos.push({ icon: MapPin, text: usager.region });
    if (usager.email) infos.push({ icon: Mail, text: usager.email });
    switch (type) {
      case 'hotel':
        if (usager.etoiles) infos.push({ icon: Star, text: `${usager.etoiles} étoiles` });
        if (usager.ravinala) infos.push({ icon: Award, text: 'Label Ravinala' });
        break;
      case 'grand-surface':
        if (usager.nombre_magasins) infos.push({ icon: Store, text: `${usager.nombre_magasins} magasins` });
        if (usager.activite) infos.push({ icon: FileText, text: usager.activite });
        break;
      case 'bus':
        if (usager.nombre_vehicules) infos.push({ icon: Bus, text: `${usager.nombre_vehicules} bus` });
        if (usager.lignes) infos.push({ icon: MapPin, text: `Ligne : ${usager.lignes}` });
        if (usager.trajet) infos.push({ icon: MapPin, text: `Trajet : ${usager.trajet}` });
        break;
      case 'nightclub':
        if (usager.jauge_max) infos.push({ icon: Users, text: `Jauge : ${usager.jauge_max}` });
        break;
      case 'media':
        if (usager.frequence) infos.push({ icon: Tv, text: `Fréquence : ${usager.frequence}` });
        if (usager.canal) infos.push({ icon: Tv, text: `Canal : ${usager.canal}` });
        break;
      default:
        break;
    }
    return infos;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const jour = date.getDate();
      const mois = date.toLocaleString('fr-FR', { month: 'long' });
      const annee = date.getFullYear();
      return `${jour} ${mois} ${annee}`;
    } catch { return dateString; }
  };

  // ========== REDIRECTION VERS PAIEMENT MENSUEL ==========
  const openPaymentModal = (usager) => {
    if (!usager || !usager.id) {
      setNotification({ type: 'error', message: 'Usager invalide' });
      return;
    }

    navigate('/paiement-mensuel', {
      state: {
        usagerId: usager.id,
        usagerType: selectedType,
        usagerData: usager
      }
    });
  };

  // ========== GESTION DU CHANGEMENT DE TYPE ==========
  const handleTypeChange = (typeName) => {
    setSelectedType(typeName);
    setShowOnlyNouveaux(false);
    setNotification(null);
    setApiError(null);
  };

  const handleRetour = () => navigate('/billan');

  const notificationIcon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
  };

  // ========== RENDU ==========
  return (
    <>
      <MiniSidebar />
      <main className="contenu-paiement">
        {/* Notification */}
        {notification && (() => {
          const NotifIcon = notificationIcon[notification.type] || Info;
          return (
            <div
              className={`notif notif-${notification.type}`}
              onClick={notification.onClick}
              role={notification.onClick ? 'button' : undefined}
              tabIndex={notification.onClick ? 0 : undefined}
            >
              <NotifIcon size={18} className="notif-icon" />
              <span className="notif-message">{notification.message}</span>
              <button
                type="button"
                className="notif-close"
                onClick={(e) => { e.stopPropagation(); setNotification(null); }}
                aria-label="Fermer la notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })()}

        <div className="paiement-container">
          {/* HEADER */}
          <header className="paiement-header">
            <div className="header-left">
              <button type="button" className="btn-retour" onClick={handleRetour}>
                <ArrowLeft size={18} /> Retour
              </button>
              <div className="header-title-group">
                <span className="header-icon-badge"><Wallet size={20} /></span>
                <div className="header-title">
                  <h1>Gestion des paiements</h1>
                  <p className="header-subtitle">Suivez et gérez les paiements mensuels de vos usagers</p>
                </div>
              </div>
            </div>
            <div className="header-right">
              <span className="header-badge"><Calendar size={14} /> Année {currentYear}</span>
            </div>
          </header>

          {/* Types & Stats - 5 types alignés */}
          <div className="types-stats">
            {Object.keys(typeConfig).map((type) => {
              const Icon = typeConfig[type].icon;
              const isActive = selectedType === type;
              const count = stats?.[type]?.total || 0;
              const hasNew = nouveauxIds[type]?.length > 0;
              return (
                <button
                  type="button"
                  key={type}
                  className={`type-stat ${isActive ? 'active' : ''}`}
                  onClick={() => handleTypeChange(type)}
                >
                  <span className="type-stat-icon"><Icon size={20} /></span>
                  <span className="type-stat-info">
                    <span className="type-stat-name">{typeConfig[type].label}</span>
                    <span className="type-stat-count">{count}</span>
                  </span>
                  {hasNew && <span className="type-stat-alert">{nouveauxIds[type].length}</span>}
                </button>
              );
            })}
          </div>

          {/* Filtres */}
          <div className="filters">
            <div className="filters-left">
              <div className="filter-group">
                <MapPin size={16} className="filter-icon" />
                <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="filter-select">
                  <option value="tous">Toutes les régions</option>
                  {regions.map(r => <option key={r.id} value={r.nom}>{r.nom}</option>)}
                </select>
              </div>
              {anneesDisponibles.length > 0 && (
                <div className="filter-group">
                  <Calendar size={16} className="filter-icon" />
                  <select value={filtreAnnee} onChange={(e) => setFiltreAnnee(parseInt(e.target.value, 10))} className="filter-select">
                    {anneesDisponibles.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
              <div className="filter-group search-group">
                <Search size={16} className="filter-icon" />
                <input
                  type="text"
                  placeholder="Rechercher (nom, demandeur, téléphone...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="filters-right">
              {showOnlyNouveaux ? (
                <button type="button" className="btn-secondary" onClick={() => setShowOnlyNouveaux(false)}>
                  <EyeOff size={16} /> Tous les usagers
                </button>
              ) : (
                <button type="button" className="btn-secondary" onClick={() => setShowOnlyNouveaux(true)}>
                  <Eye size={16} /> Nouveaux uniquement
                </button>
              )}
              <button type="button" className="btn-refresh" onClick={loadAllData}>
                <RefreshCw size={16} /> Rafraîchir
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            {loading ? (
              <div className="state-block">
                <Loader size={32} className="spinner" />
                <p>Chargement des données...</p>
              </div>
            ) : apiError ? (
              <div className="state-block state-error">
                <AlertCircle size={28} />
                <p>{apiError}</p>
                <button type="button" className="btn-refresh" onClick={loadAllData}>
                  <RefreshCw size={16} /> Rafraîchir
                </button>
              </div>
            ) : filteredUsagers.length === 0 ? (
              <div className="state-block">
                <FileText size={28} />
                <p>{showOnlyNouveaux ? 'Aucun nouvel usager en attente' : 'Aucun résultat trouvé'}</p>
                <button type="button" className="btn-refresh" onClick={loadAllData}>
                  <RefreshCw size={16} /> Rafraîchir
                </button>
              </div>
            ) : (
              <table className="paiement-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom / Dénomination</th>
                    <th>Demandeur</th>
                    <th>Contact</th>
                    <th>Informations</th>
                    <th>Pmt {filtreAnnee}</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsagers.map((u) => {
                    const isNew = nouveauxIds[selectedType]?.includes(u.id) || u.estNouveau;
                    const isLate = isEnRetard(u);
                    const fullInfos = getFullInfo(u, selectedType);
                    
                    // ✅ Utiliser TOUS les mois payés
                    const moisPayes = getMoisPayesComplet(u, filtreAnnee);
                    const moisTries = [...moisPayes].sort((a, b) => a - b);
                    const affichageMoisPayes = moisTries.map(m => moisLabelsShort[m - 1]).join(', ');
                    const nbMoisPayes = moisTries.length;
                    
                    return (
                      <tr key={u.id} className={`${isLate ? 'row-late' : ''} ${isNew ? 'row-new' : ''}`}>
                        <td data-label="ID">
                          <span className="id-cell">
                            #{String(u.id).padStart(3, '0')}
                            {isNew && <span className="tag tag-new">Nouveau</span>}
                            {isLate && <span className="tag tag-late"><AlertTriangle size={12} /></span>}
                          </span>
                        </td>
                        <td data-label="Nom" className="name">
                          <strong>{u.denomination || u.nom_evenement || u.organisateurs || 'Sans nom'}</strong>
                          {u.region && u.region !== 'N/A' && <div className="usager-sub"><MapPin size={12} /> {u.region}</div>}
                          {u.adresse || u.adresse_siege ? <div className="usager-sub">{u.adresse || u.adresse_siege}</div> : null}
                          {u.moisCreation && u.moisCreation > 1 && (
                            <div className="usager-sub"><Calendar size={12} /> Début : {moisLabelsShort[u.moisCreation - 1]} {u.anneeCreation}</div>
                          )}
                        </td>
                        <td data-label="Demandeur">
                          <div className="demandeur-info">
                            <strong>{u.demandeur || u.representant_par || '-'}</strong>
                            {u.representant_nom && <div className="usager-sub">Rep. {u.representant_nom}</div>}
                          </div>
                        </td>
                        <td data-label="Contact">
                          <div className="contact-info">
                            {u.telephone && <div className="usager-sub"><Phone size={12} /> {u.telephone}</div>}
                            {u.email && <div className="usager-sub"><Mail size={12} /> {u.email}</div>}
                          </div>
                        </td>
                        <td data-label="Informations">
                          <div className="usager-infos">
                            {fullInfos.length > 0 ? fullInfos.map((info, i) => (
                              <div key={i} className="usager-info-item">
                                {info.icon ? <info.icon size={12} /> : null}
                                <span>{info.text}</span>
                              </div>
                            )) : <span className="usager-info-empty">Aucune information</span>}
                          </div>
                        </td>
                        <td data-label="Pmt">
                          <div className="pmt-info">
                            {/* ✅ Afficher TOUS les mois payés */}
                            {nbMoisPayes >= 12 ? (
                              <>
                                <span style={{ fontWeight: 'bold', color: '#198754' }}>12/12 ✅</span>
                                <div className="pmt-detail" style={{ fontSize: '10px', color: '#198754', marginTop: '2px' }}>
                                  Tous les mois payés
                                </div>
                              </>
                            ) : nbMoisPayes > 0 ? (
                              <>
                                <span style={{ fontWeight: '600' }}>{nbMoisPayes}/12</span>
                                <span style={{ fontSize: '12px', color: '#0d6efd' }}> ({affichageMoisPayes})</span>
                                <div className="pmt-detail" style={{ fontSize: '10px', color: '#6c757d', marginTop: '2px' }}>
                                  Payés : {affichageMoisPayes}
                                </div>
                              </>
                            ) : (
                              <span style={{ color: '#dc3545' }}>0/12</span>
                            )}
                            {u.montant_mensuel > 0 && <div className="pmt-montant">{u.montant_mensuel.toLocaleString()} Ar / mois</div>}
                          </div>
                        </td>
                        <td data-label="Statut">{getStatusBadge(u)}</td>
                        <td data-label="Action">
                          <button 
                            type="button" 
                            className="btn-pay" 
                            onClick={() => openPaymentModal(u)}
                          >
                            <CreditCard size={14} /> Payer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default GerePaiement;