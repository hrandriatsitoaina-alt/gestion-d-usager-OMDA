// src/pages/GerePaiement.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  Users,
  Building2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Clock,
  DollarSign,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Filter,
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
  Tent,
  Plus,
  Minus,
  Eye,
  EyeOff
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
  const currentMonth = new Date().getMonth() + 1;
  const [filtreAnnee, setFiltreAnnee] = useState(currentYear);
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [nombreMois, setNombreMois] = useState(1);
  const [montantPayer, setMontantPayer] = useState('');
  const [montantTotal, setMontantTotal] = useState(0);
  const [montantMensuelOriginal, setMontantMensuelOriginal] = useState(0);

  const notificationsAffichees = useRef(new Set());

  const typeConfig = {
    hotel:   { label: 'Hôtels',        icon: Hotel,   color: '#4A90D9' },
    'grand-surface': { label: 'Grandes Surfaces', icon: Store,  color: '#27ae60' },
    bus:     { label: 'Bus',           icon: Bus,    color: '#f39c12' },
    nightclub: { label: 'Night Clubs', icon: Music,  color: '#8e44ad' },
    media:   { label: 'Médias',        icon: Tv,     color: '#e74c3c' },
    occ:     { label: 'Occasionnels',  icon: Tent,   color: '#1abc9c' }
  };

  const typeTableMapping = {
    hotel: 'usagers_hotel',
    'grand-surface': 'usagers_magasin',
    bus: 'usagers_bus',
    nightclub: 'usagers_nightclub',
    media: 'usagers_media',
    occ: 'usagers_occasionnel'
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

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      // Stats
      const statsRes = await fetch('http://localhost:3001/api/paiements/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Usagers
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

      // Années disponibles
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
      setNotification({ type: 'error', message: '❌ Erreur de chargement des données' });
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedRegion, currentYear]);

  const checkNouveauxUsagers = useCallback(async () => {
    try {
      const countRes = await fetch('http://localhost:3001/api/usagers/nouveaux-compteur');
      const countData = await countRes.json();
      if (countData.success && countData.nouveaux) {
        let totalNew = 0;
        const idsTemp = {};
        for (const [type, count] of Object.entries(countData.nouveaux)) {
          if (count > 0) {
            totalNew += count;
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
            message: `✨ ${totalNew} nouveau(x) usager(s) ajouté(s) !`,
            onClick: () => {
              setShowOnlyNouveaux(true);
              setTimeout(() => setNotification(null), 5000);
            }
          });
        }
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    loadRegions();
    loadAllData();
  }, [loadRegions, loadAllData]);

  useEffect(() => {
    filterUsagers();
  }, [searchTerm, usagers, showOnlyNouveaux, nouveauxIds, filtreAnnee, selectedType]);

  const filterUsagers = () => {
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
        const artistes = (u.artistes || '').toLowerCase();
        return nom.includes(term) || demandeur.includes(term) || telephone.includes(term) ||
               email.includes(term) || region.includes(term) || adresse.includes(term) ||
               artistes.includes(term);
      });
    }
    if (showOnlyNouveaux) {
      if (selectedType === 'occ') {
        filtered = filtered.filter(u => u.statut_paiement !== 'paye');
      } else if (nouveauxIds[selectedType]?.length) {
        filtered = filtered.filter(u => nouveauxIds[selectedType].includes(u.id));
      }
    }
    setFilteredUsagers(filtered);
  };

  // ========== UTILITAIRES ==========
  const getProgressionForYear = (usager, annee) => {
    if (!usager.resumeAnnees) return 'Aucune donnée';
    const anneeData = usager.resumeAnnees.find(a => a.annee === annee);
    if (!anneeData) {
      const moisDebut = usager.moisCreation || 1;
      const moisTotalAttendus = 12 - moisDebut + 1;
      return `0/${moisTotalAttendus}`;
    }
    const nbMois = anneeData.nbMois || 0;
    const moisTotalAttendus = anneeData.moisTotalAttendus || 12;
    const moisDebut = anneeData.moisDebut || 1;
    const moisPayes = usager.moisPayesParAnnee?.[annee] || [];
    if (nbMois === 0) return `0/${moisTotalAttendus}`;
    const moisValides = moisPayes.filter(m => m >= moisDebut);
    const nbMoisValides = moisValides.length;
    if (nbMoisValides >= moisTotalAttendus) {
      const moisTries = [...moisValides].sort((a, b) => a - b);
      const affichageMois = moisTries.map(m => moisLabelsShort[m - 1]).join(', ');
      return `✅ 12/12${affichageMois ? ` (${affichageMois})` : ''}`;
    }
    let affichageMois = '';
    if (moisValides.length > 0) {
      const moisTries = [...moisValides].sort((a, b) => a - b);
      affichageMois = moisTries.map(m => moisLabelsShort[m - 1]).join(', ');
    }
    return `${nbMoisValides}/${moisTotalAttendus}${affichageMois ? ` (${affichageMois})` : ''}`;
  };

  const isEnRetard = (usager) => {
    if (selectedType === 'occ') return false;
    const anneeData = usager.resumeAnnees?.find(a => a.annee === filtreAnnee);
    if (!anneeData) return true;
    const nbMois = anneeData.nbMois || 0;
    const moisTotalAttendus = anneeData.moisTotalAttendus || 12;
    const moisDebut = anneeData.moisDebut || 1;
    if (nbMois >= moisTotalAttendus) return false;
    const moisActuel = new Date().getMonth() + 1;
    const anneeActuelle = new Date().getFullYear();
    if (filtreAnnee === usager.anneeCreation) {
      const moisEcoules = Math.max(0, moisActuel - moisDebut + 1);
      return nbMois < moisEcoules && nbMois < moisTotalAttendus;
    }
    if (filtreAnnee < anneeActuelle) return nbMois < moisTotalAttendus;
    const moisEcoules = Math.min(moisActuel, 12);
    return nbMois < moisEcoules && nbMois < moisTotalAttendus;
  };

  const getStatusBadge = (usager) => {
    if (selectedType === 'occ') {
      if (usager.statut_paiement === 'paye' || (usager.montant_total && usager.montant_total > 0)) {
        return <span className="badge-success"><BadgeCheck size={14} /> Payé</span>;
      }
      return <span className="badge-warning"><AlertCircle size={14} /> En attente</span>;
    }
    const anneeData = usager.resumeAnnees?.find(a => a.annee === filtreAnnee);
    if (!anneeData) {
      const moisDebut = usager.moisCreation || 1;
      const moisTotalAttendus = 12 - moisDebut + 1;
      return <span className="badge-danger"><X size={14} /> 0/{moisTotalAttendus}</span>;
    }
    const nbMois = anneeData.nbMois || 0;
    const moisTotalAttendus = anneeData.moisTotalAttendus || 12;
    const moisDebut = anneeData.moisDebut || 1;
    if (nbMois >= moisTotalAttendus) {
      return <span className="badge-success"><CheckCircle size={14} /> 12/12</span>;
    } else if (nbMois > 0) {
      const moisRestants = moisTotalAttendus - nbMois;
      const moisPayes = usager.moisPayesParAnnee?.[filtreAnnee] || [];
      const moisValides = moisPayes.filter(m => m >= moisDebut);
      const affichageMois = moisValides.map(m => moisLabelsShort[m - 1]).join(', ');
      return (
        <span className="badge-warning">
          <AlertTriangle size={14} /> {nbMois}/{moisTotalAttendus}
          {affichageMois ? ` (${affichageMois})` : ''}
          <span className="badge-sub">{moisRestants} mois restants</span>
        </span>
      );
    }
    return <span className="badge-danger"><X size={14} /> 0/{moisTotalAttendus}</span>;
  };

  const getSpecificInfo = (usager, type) => {
    switch(type) {
      case 'hotel': return usager.etoiles ? `${usager.etoiles}⭐` : '-';
      case 'grand-surface': return usager.nombre_magasins ? `${usager.nombre_magasins} mag` : '-';
      case 'bus': return usager.nombre_vehicules ? `${usager.nombre_vehicules} bus` : '-';
      case 'nightclub': return usager.jauge_max ? `${usager.jauge_max} pl` : '-';
      case 'media': return usager.frequence || usager.canal || '-';
      case 'occ': return usager.artistes || usager.nom_evenement || usager.genre_manifestation || '-';
      default: return '-';
    }
  };

  const getFullInfo = (usager, type) => {
    const infos = [];
    if (usager.adresse || usager.adresse_siege) infos.push(usager.adresse || usager.adresse_siege);
    if (usager.region && usager.region !== 'N/A') infos.push(`📍 ${usager.region}`);
    if (usager.email) infos.push(`📧 ${usager.email}`);
    switch(type) {
      case 'hotel':
        if (usager.etoiles) infos.push(`${usager.etoiles}⭐`);
        if (usager.ravinala) infos.push('🏆 Ravinala');
        break;
      case 'grand-surface':
        if (usager.nombre_magasins) infos.push(`${usager.nombre_magasins} magasins`);
        if (usager.activite) infos.push(usager.activite);
        break;
      case 'bus':
        if (usager.nombre_vehicules) infos.push(`${usager.nombre_vehicules} bus`);
        if (usager.lignes) infos.push(`Ligne: ${usager.lignes}`);
        if (usager.trajet) infos.push(`Trajet: ${usager.trajet}`);
        break;
      case 'nightclub':
        if (usager.jauge_max) infos.push(`Jauge: ${usager.jauge_max}`);
        break;
      case 'media':
        if (usager.frequence) infos.push(`Fréquence: ${usager.frequence}`);
        if (usager.canal) infos.push(`Canal: ${usager.canal}`);
        break;
      case 'occ':
        if (usager.nom_evenement) infos.push(`🎪 ${usager.nom_evenement}`);
        if (usager.date_evenement) infos.push(`📅 ${formatDate(usager.date_evenement)}`);
        if (usager.lieu_evenement) infos.push(`📍 ${usager.lieu_evenement}`);
        if (usager.artistes) infos.push(`🎤 ${usager.artistes}`);
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

  // ========== MODALE ==========
  const openPaymentModal = (usager) => {
    setSelectedUsager(usager);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setSelectedYear(filtreAnnee);
    setNombreMois(1);
    setIsSubmitting(false);
    if (selectedType === 'occ') {
      const montantSansFrais = usager.montant_total || 0;
      setMontantPayer(montantSansFrais.toString());
      setMontantTotal(montantSansFrais);
      setMontantMensuelOriginal(montantSansFrais);
    } else {
      const montantMensuel = usager.montant_mensuel || 0;
      setMontantMensuelOriginal(montantMensuel);
      setMontantPayer(montantMensuel.toString());
      setMontantTotal(montantMensuel);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUsager(null);
    setNombreMois(1);
    setIsSubmitting(false);
  };

  const updateNombreMois = (nb) => {
    setNombreMois(nb);
    // le montant reste saisi par l'utilisateur
  };

  const updateMontant = (value) => {
    const montant = parseFloat(value) || 0;
    setMontantPayer(montant.toString());
    setMontantTotal(montant);
  };

  const submitPayment = async () => {
    if (isSubmitting || !selectedUsager) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        usagerId: selectedUsager.id,
        usagerType: selectedType,
        montant: montantTotal,
        datePaiement: paymentDate,
        nombreMois: selectedType !== 'occ' ? nombreMois : 1,
        anneeDebut: selectedYear
      };
      const res = await fetch('http://localhost:3001/api/paiements/enregistrer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'adminToken': token },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: '✅ Paiement enregistré avec succès !' });
        try {
          await fetch('http://localhost:3001/api/usagers/marquer-vu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'adminToken': token },
            body: JSON.stringify({ usagerId: selectedUsager.id, type: selectedType })
          });
        } catch {}
        setTimeout(() => setNotification(null), 3000);
        closeModal();
        await loadAllData();
      } else {
        setNotification({ type: 'error', message: '❌ ' + data.message });
        setTimeout(() => setNotification(null), 3000);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: '❌ Erreur lors de l\'enregistrement' });
      setTimeout(() => setNotification(null), 3000);
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (typeName) => {
    setSelectedType(typeName);
    setShowOnlyNouveaux(false);
    setNotification(null);
    setApiError(null);
  };

  const handleRetour = () => navigate('/billan');

  // ========== RENDU ==========
  return (
    <>
      <MiniSidebar />
      <main className="contenu-paiement">
        {/* Notification */}
        {notification && (
          <div className={`notif ${notification.type}`} onClick={notification.onClick} style={{ cursor: notification.onClick ? 'pointer' : 'default' }}>
            {notification.type === 'success' && <CheckCircle size={20} />}
            {notification.type === 'error' && <AlertCircle size={20} />}
            {notification.type === 'info' && <Info size={20} />}
            {notification.type === 'warning' && <AlertTriangle size={20} />}
            <span>{notification.message}</span>
            <button className="notif-close" onClick={(e) => { e.stopPropagation(); setNotification(null); }}><X size={18} /></button>
          </div>
        )}

        <div className="paiement-container">
          {/* HEADER AMÉLIORÉ */}
          <header className="paiement-header">
            <div className="header-left">
              <button className="btn-retour" onClick={handleRetour}>
                <ArrowLeft size={20} /> Retour
              </button>
              <div className="header-title">
                <h1>💰 Gestion des paiements</h1>
                <p className="header-subtitle">Suivez et gérez les paiements mensuels de vos usagers</p>
              </div>
            </div>
            <div className="header-right">
              <span className="header-badge">Année {currentYear}</span>
            </div>
          </header>

          {/* Types & Stats */}
          <div className="types-stats">
            {Object.keys(typeConfig).map((type) => {
              const Icon = typeConfig[type].icon;
              const color = typeConfig[type].color;
              const isActive = selectedType === type;
              const count = stats?.[type]?.total || 0;
              const hasNew = nouveauxIds[type]?.length > 0;
              return (
                <div
                  key={type}
                  className={`type-stat ${isActive ? 'active' : ''}`}
                  onClick={() => handleTypeChange(type)}
                  style={{ borderColor: isActive ? color : 'transparent' }}
                >
                  <div className="type-stat-icon" style={{ color }}>
                    <Icon size={24} />
                  </div>
                  <div className="type-stat-info">
                    <span className="type-stat-name">{typeConfig[type].label}</span>
                    <span className="type-stat-count">{count}</span>
                  </div>
                  {hasNew && <span className="type-stat-alert">{nouveauxIds[type].length}</span>}
                </div>
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
              {anneesDisponibles.length > 0 && selectedType !== 'occ' && (
                <div className="filter-group">
                  <Calendar size={16} className="filter-icon" />
                  <select value={filtreAnnee} onChange={(e) => setFiltreAnnee(parseInt(e.target.value))} className="filter-select">
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
              {showOnlyNouveaux && (
                <button className="btn-show" onClick={() => setShowOnlyNouveaux(false)}>
                  <EyeOff size={16} /> Tous les usagers
                </button>
              )}
              <button className="btn-refresh" onClick={loadAllData}>
                <RefreshCw size={16} /> Rafraîchir
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            {loading ? (
              <div className="loading">
                <Loader size={40} className="spinner" />
                <p>Chargement des données...</p>
              </div>
            ) : apiError ? (
              <div className="empty error">
                <AlertCircle size={32} />
                <p>{apiError}</p>
                <button className="btn-refresh" onClick={loadAllData}>
                  <RefreshCw size={16} /> Rafraîchir
                </button>
              </div>
            ) : filteredUsagers.length === 0 ? (
              <div className="empty">
                <p>{showOnlyNouveaux ? 'Aucun nouvel usager en attente' : 'Aucun résultat trouvé'}</p>
                <button className="btn-refresh" onClick={loadAllData}>
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
                    {selectedType !== 'occ' && <th>Pmt {filtreAnnee}</th>}
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsagers.map((u) => {
                    const isNew = selectedType === 'occ'
                      ? u.statut_paiement !== 'paye'
                      : nouveauxIds[selectedType]?.includes(u.id) || u.estNouveau;
                    const isLate = isEnRetard(u);
                    const fullInfos = getFullInfo(u, selectedType);
                    return (
                      <tr key={u.id} className={`${isLate ? 'late' : ''} ${isNew ? 'new' : ''}`}>
                        <td data-label="ID">
                          #{String(u.id).padStart(3, '0')}
                          {isNew && <span className="badge-new">NOUVEAU</span>}
                          {isLate && <span className="badge-late">!</span>}
                        </td>
                        <td data-label="Nom" className="name">
                          <strong>{u.denomination || u.nom_evenement || u.organisateurs || 'Sans nom'}</strong>
                          {u.region && u.region !== 'N/A' && <div className="usager-region"><MapPin size={12} /> {u.region}</div>}
                          {u.adresse || u.adresse_siege ? <div className="usager-adresse">{u.adresse || u.adresse_siege}</div> : null}
                          {u.moisCreation && u.moisCreation > 1 && (
                            <div className="usager-creation"><Calendar size={12} /> Début: {moisLabelsShort[u.moisCreation - 1]} {u.anneeCreation}</div>
                          )}
                        </td>
                        <td data-label="Demandeur">
                          <div className="demandeur-info">
                            <strong>{u.demandeur || u.representant_par || '-'}</strong>
                            {u.representant_nom && <div className="usager-detail">Rep: {u.representant_nom}</div>}
                          </div>
                        </td>
                        <td data-label="Contact">
                          <div className="contact-info">
                            {u.telephone && <div className="usager-phone"><Phone size={12} /> {u.telephone}</div>}
                            {u.email && <div className="usager-email"><Mail size={12} /> {u.email}</div>}
                          </div>
                        </td>
                        <td data-label="Informations">
                          <div className="usager-infos">
                            {fullInfos.length > 0 ? fullInfos.map((info, i) => <div key={i} className="usager-info-item">{info}</div>) : <span className="usager-info-empty">-</span>}
                            {selectedType === 'occ' && u.montant_total > 0 && <div className="usager-info-item montant-info"><DollarSign size={12} /> {u.montant_total.toLocaleString()} Ar</div>}
                          </div>
                        </td>
                        {selectedType !== 'occ' && (
                          <td data-label="Pmt">
                            <div className="pmt-info">
                              {getProgressionForYear(u, filtreAnnee)}
                              {u.montant_mensuel > 0 && <div className="usager-montant-mensuel">{u.montant_mensuel.toLocaleString()} Ar/mois</div>}
                            </div>
                          </td>
                        )}
                        <td data-label="Statut">{getStatusBadge(u)}</td>
                        <td data-label="Action">
                          <button className="btn-pay" onClick={() => openPaymentModal(u)}>
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

      {/* MODALE */}
      {showModal && selectedUsager && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><CreditCard size={20} /> Enregistrer un paiement</h3>
              <button className="modal-close" onClick={closeModal}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="usager-info">
                <div className="info-row"><span className="info-label">Nom :</span><strong>{selectedUsager.denomination || selectedUsager.nom_evenement || selectedUsager.organisateurs || '-'}</strong></div>
                <div className="info-row"><span className="info-label">Demandeur :</span><span>{selectedUsager.demandeur || selectedUsager.representant_par || '-'}</span></div>
                <div className="info-row"><span className="info-label">Téléphone :</span><span>{selectedUsager.telephone || '-'}</span></div>
                <div className="info-row"><span className="info-label">Région :</span><span>{selectedUsager.region || '-'}</span></div>
                {selectedType !== 'occ' && (
                  <>
                    <div className="info-row"><span className="info-label">Montant mensuel :</span><span className="montant-highlight">{montantMensuelOriginal.toLocaleString()} Ar</span></div>
                    {selectedUsager.moisCreation && selectedUsager.moisCreation > 1 && (
                      <div className="info-row"><span className="info-label">Début paiement :</span><span>{moisLabels[selectedUsager.moisCreation - 1]} {selectedUsager.anneeCreation}</span></div>
                    )}
                  </>
                )}
                {selectedType === 'occ' && (
                  <>
                    <div className="info-row"><span className="info-label">Genre :</span><span>{selectedUsager.genre_manifestation || '-'}</span></div>
                    <div className="info-row"><span className="info-label">Date événement :</span><span>{formatDate(selectedUsager.date_evenement) || '-'}</span></div>
                    <div className="info-row"><span className="info-label">Lieu :</span><span>{selectedUsager.lieu_evenement || '-'}</span></div>
                    <div className="info-row"><span className="info-label">Montant à payer :</span><span className="montant-highlight">{montantMensuelOriginal.toLocaleString()} Ar</span></div>
                    <div className="info-row"><span className="info-label">Frais de dossier :</span><span className="montant-highlight">{(selectedUsager.frais_dossier || 5000).toLocaleString()} Ar</span></div>
                  </>
                )}
              </div>

              <div className="payment-form">
                <div className="form-group">
                  <label><Calendar size={16} /> Date de paiement</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>
                {selectedType !== 'occ' && (
                  <div className="form-group">
                    <label><Calendar size={16} /> Année de paiement</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                      {anneesDisponibles.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                {selectedType !== 'occ' && (
                  <div className="form-group">
                    <label><Hash size={16} /> Nombre de mois</label>
                    <select value={nombreMois} onChange={(e) => updateNombreMois(parseInt(e.target.value))}>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n} mois</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label><DollarSign size={16} /> Montant (Ar)</label>
                  <input type="number" value={montantPayer} onChange={(e) => updateMontant(e.target.value)} placeholder="Saisir le montant" step="1" min="0" />
                  <small className="field-hint">
                    {selectedType !== 'occ' ? `Montant mensuel de référence : ${montantMensuelOriginal.toLocaleString()} Ar` : `Montant de la manifestation (sans frais de dossier)`}
                  </small>
                </div>
                <div className="total-payment">
                  <span>Total à payer :</span>
                  <strong>{(montantTotal + (selectedType === 'occ' ? (selectedUsager?.frais_dossier || 5000) : 0)).toLocaleString()} Ar</strong>
                </div>
                {selectedType === 'occ' && (
                  <div className="payment-detail">
                    <small>Détail: {montantTotal.toLocaleString()} Ar (manifestation) + {(selectedUsager?.frais_dossier || 5000).toLocaleString()} Ar (frais de dossier)</small>
                  </div>
                )}
                {selectedType !== 'occ' && (
                  <div className="payment-detail">
                    <small>Paiement de {nombreMois} mois • Montant saisi: {montantTotal.toLocaleString()} Ar</small>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}><X size={16} /> Annuler</button>
              <button className="btn-validate" onClick={submitPayment} disabled={isSubmitting || montantTotal <= 0}>
                {isSubmitting ? <><Loader size={16} className="spinner-inline" /> Traitement...</> : <><CheckCircle size={16} /> Valider le paiement</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GerePaiement;