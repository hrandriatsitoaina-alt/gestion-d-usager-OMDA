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
  ReceiptText,
  Package,
  Plus,
  Disc,
  Globe,
  Sparkles,
  Video,
  Repeat,
  CalendarCheck,
  FileCheck
} from 'lucide-react';
import '../styles/gere-paiement.css';
import MiniSidebar from '../components/MiniSidebar';

// ✅ Icônes par type d'usager événementiel
const OTHER_TYPE_ICONS = {
  cd: Disc,
  mp3: Music,
  'oeuvre-web': Globe,
  hologramme: Sparkles,
  video: Video,
  autre: Package
};

const OTHER_TYPE_LABELS = {
  cd: 'CD',
  mp3: 'MP3',
  'oeuvre-web': 'Œuvre Web',
  hologramme: 'Hologramme',
  video: 'Vidéo',
  autre: 'Autre'
};

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

  // ✅ États pour les usagers événementiels
  const [otherUsagers, setOtherUsagers] = useState([]);
  const [loadingOther, setLoadingOther] = useState(false);

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

  // ✅ 6 types dont "other"
  const typeConfig = {
    hotel: { label: 'Hôtels', icon: Hotel },
    'grand-surface': { label: 'Grandes Surfaces', icon: Store },
    bus: { label: 'Bus', icon: Bus },
    nightclub: { label: 'Night Clubs', icon: Music },
    media: { label: 'Médias', icon: Tv },
    other: { label: 'Usager événementiel', icon: Package }
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
        const idsTemp = {};
        const typesFiltres = Object.keys(countData.nouveaux).filter(t => t !== 'occ');
        for (const type of typesFiltres) {
          if (countData.nouveaux[type] > 0) {
            const idsRes = await fetch(`http://localhost:3001/api/usagers/nouveaux-ids/${type}`);
            const idsData = await idsRes.json();
            idsTemp[type] = idsData.success ? idsData.ids : [];
          } else {
            idsTemp[type] = [];
          }
        }
        setNouveauxIds(idsTemp);
      }
    } catch (err) { console.error(err); }
  }, []);

  // ✅ Charger les usagers événementiels
  const loadOtherUsagers = useCallback(async () => {
    setLoadingOther(true);
    try {
      const res = await fetch('http://localhost:3001/api/other-usagers');
      const data = await res.json();
      if (data.success) {
        setOtherUsagers(data.usagers || []);
      } else {
        setOtherUsagers([]);
      }
    } catch (err) {
      console.error('Erreur chargement usagers_other:', err);
      setOtherUsagers([]);
    } finally {
      setLoadingOther(false);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const statsRes = await fetch('http://localhost:3001/api/paiements/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Charger les usagers événementiels EN ARRIÈRE-PLAN (pour le compteur)
      loadOtherUsagers();

      // ✅ Si le type sélectionné est "other", on s'arrête ici
      if (selectedType === 'other') {
        setLoading(false);
        return;
      }

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
  }, [selectedType, selectedRegion, currentYear, checkNouveauxUsagers, loadOtherUsagers]);

  useEffect(() => {
    loadRegions();
    loadAllData();
  }, [loadRegions, loadAllData]);

  const filterUsagers = useCallback(() => {
    if (selectedType === 'other') return;

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

  // ========== FONCTIONS PAIEMENT ==========
  const getMoisPayes = (usager, annee) => usager.moisPayesParAnnee?.[annee] || [];

  const getMoisDebut = (usager, annee) => {
    const anneeData = usager.resumeAnnees?.find(a => a.annee === annee);
    if (anneeData && anneeData.moisDebut) return anneeData.moisDebut;
    return usager.moisCreation || 1;
  };

  const getMoisPayesComplet = (usager, annee) => usager.moisPayesParAnnee?.[annee] || [];

  const isEnRetard = (usager) => {
    const moisPayes = getMoisPayesComplet(usager, filtreAnnee);
    const nbMoisPayes = moisPayes.length;
    if (nbMoisPayes >= 12) return false;
    const moisDebut = getMoisDebut(usager, filtreAnnee);
    const moisActuel = new Date().getMonth() + 1;
    const anneeActuelle = new Date().getFullYear();
    if (filtreAnnee === anneeActuelle) {
      const moisEcoules = Math.min(moisActuel, 12) - moisDebut + 1;
      return nbMoisPayes < moisEcoules && nbMoisPayes < 12;
    }
    if (filtreAnnee < anneeActuelle) return nbMoisPayes < 12;
    return false;
  };

  const getStatusBadge = (usager) => {
    const moisPayes = getMoisPayesComplet(usager, filtreAnnee);
    const nbMoisPayes = moisPayes.length;
    const moisTries = [...moisPayes].sort((a, b) => a - b);
    const affichageMois = moisTries.map(m => moisLabelsShort[m - 1]).join(', ');

    if (nbMoisPayes >= 12) {
      return <span className="badge badge-success"><CheckCircle size={14} /> 12/12 ✅</span>;
    }
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

  // ✅ Rendu du tableau événementiel
  const renderOtherTable = () => {
    let filtered = [...otherUsagers];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        (u.denomination || '').toLowerCase().includes(term) ||
        (u.nom || '').toLowerCase().includes(term) ||
        (u.prenom || '').toLowerCase().includes(term) ||
        (u.telephone || '').includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.region || '').toLowerCase().includes(term) ||
        (u.representant_par || '').toLowerCase().includes(term)
      );
    }
    if (selectedRegion !== 'tous') {
      filtered = filtered.filter(u => u.region === selectedRegion);
    }

    if (loadingOther) {
      return (
        <div className="state-block">
          <Loader size={32} className="spinner" />
          <p>Chargement des usagers événementiels...</p>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="state-block">
          <Package size={28} />
          <p>Aucun usager événementiel trouvé</p>
          <button
            type="button"
            className="btn-other-add"
            onClick={() => navigate('/other-ajout')}
          >
            <Plus size={16} /> Ajouter un usager événementiel
          </button>
        </div>
      );
    }

    return (
      <table className="paiement-table other-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Dénomination</th>
            <th>Type</th>
            <th>Représentant</th>
            <th>Contact</th>
            <th>Mode paiement</th>
            <th>Quittance</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => {
            const TypeIcon = OTHER_TYPE_ICONS[u.type_usager] || Package;
            const typeLabel = OTHER_TYPE_LABELS[u.type_usager] || u.type_usager;
            const lignes = u.lignes || [];
            const paiement = u.paiement || {};
            const totalLignes = lignes.reduce((acc, l) => acc + (parseFloat(l.montant) || 0), 0);
            const total = parseFloat(paiement.montant) || totalLignes;
            const isUnique = u.mode_paiement === 'unique';

            return (
              <tr key={u.id}>
                <td data-label="ID">
                  <span className="id-cell">
                    #{String(u.id).padStart(3, '0')}
                    <span className="tag tag-other">
                      <Package size={10} /> Événementiel
                    </span>
                  </span>
                </td>

                <td data-label="Dénomination" className="name">
                  <strong>{u.denomination || 'Sans nom'}</strong>
                  {u.region && u.region !== 'N/A' && (
                    <div className="usager-sub"><MapPin size={12} /> {u.region}</div>
                  )}
                  {u.adresse && <div className="usager-sub">{u.adresse}</div>}
                </td>

                <td data-label="Type">
                  <span className="other-type-badge">
                    <TypeIcon size={14} /> {typeLabel}
                  </span>
                </td>

                <td data-label="Représentant">
                  <div className="demandeur-info">
                    <strong>{u.representant_par || '-'}</strong>
                    {u.representant_cin && (
                      <div className="usager-sub">CIN : {u.representant_cin}</div>
                    )}
                  </div>
                </td>

                <td data-label="Contact">
                  <div className="contact-info">
                    {u.telephone && <div className="usager-sub"><Phone size={12} /> {u.telephone}</div>}
                    {u.email && <div className="usager-sub"><Mail size={12} /> {u.email}</div>}
                  </div>
                </td>

                <td data-label="Mode paiement">
                  <span className={`mode-badge mode-${u.mode_paiement || 'unique'}`}>
                    {u.mode_paiement === 'mensuel'
                      ? <><Repeat size={12} /> Mensuel</>
                      : <><CalendarCheck size={12} /> Unique</>}
                  </span>
                  {lignes.length > 0 && (
                    <div className="usager-sub" style={{ marginTop: '4px' }}>
                      {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
                    </div>
                  )}
                </td>

                <td data-label="Quittance">
                  {u.quittance ? (
                    <span className="quittance-badge">
                      <FileCheck size={14} /> {String(u.quittance).padStart(7, '0')}
                    </span>
                  ) : (
                    <span className="usager-info-empty">—</span>
                  )}
                  {total > 0 && (
                    <div className="pmt-montant" style={{ marginTop: '4px' }}>
                      {total.toLocaleString('fr-FR')} Ar
                    </div>
                  )}
                </td>

                <td data-label="Action">
                  {/* ✅ Bouton "Payer" UNIQUEMENT si paiement mensuel */}
                  {!isUnique && (
                    <button
                      type="button"
                      className="btn-pay btn-pay-other"
                      onClick={() => {
                        navigate('/paiement-mensuel', {
                          state: {
                            usagerId: u.id,
                            usagerType: 'other',
                            usagerData: u
                          }
                        });
                      }}
                    >
                      <CreditCard size={14} /> Payer
                    </button>
                  )}
                  {isUnique && (
                    <span className="paid-badge">
                      <CheckCircle size={14} /> Payé
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // ========== RENDU ==========
  return (
    <>
      <style>{`
        .btn-other-ajout {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #6db5ff, #4a9eff);
          color: #fff;
          border: none;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
        }
        .btn-other-ajout:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(74, 158, 255, 0.45);
        }
        .btn-other-ajout:active {
          transform: translateY(0);
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn-other-add {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #6db5ff, #4a9eff);
          color: #fff;
          border: none;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
          margin-top: 12px;
        }
        .btn-other-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(74, 158, 255, 0.45);
        }
        .btn-pay-other {
          background: linear-gradient(135deg, #6db5ff, #4a9eff) !important;
        }
        .btn-pay-other:hover {
          background: #357ABD !important;
        }
        .other-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(74, 158, 255, 0.1);
          color: #357ABD;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba(74, 158, 255, 0.3);
        }
        .mode-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .mode-mensuel {
          background: rgba(74, 144, 217, 0.1);
          color: #357ABD;
          border: 1px solid rgba(74, 144, 217, 0.3);
        }
        .mode-unique {
          background: rgba(39, 174, 96, 0.1);
          color: #1e8449;
          border: 1px solid rgba(39, 174, 96, 0.3);
        }
        .quittance-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: #f0fdf4;
          color: #166534;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          border: 1px solid #86efac;
        }
        .tag-other {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 6px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          margin-left: 4px;
          background: #6db5ff;
          color: #fff;
        }
        .other-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #eef2f7;
          margin-bottom: 12px;
        }
        .other-header-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 14px;
        }
        .other-header-count {
          font-weight: 700;
          color: #357ABD;
          font-size: 16px;
        }
        /* ✅ Badge "Payé" pour les paiements uniques */
        .paid-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #d4edda;
          color: #155724;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>

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
              <button
                type="button"
                className="btn-other-ajout"
                onClick={() => navigate('/other-ajout')}
                title="Ajouter un usager événementiel (CD, MP3, œuvres web...)"
              >
                <Package size={16} /> Usager événementiel
              </button>
              <span className="header-badge"><Calendar size={14} /> Année {currentYear}</span>
            </div>
          </header>

          {/* Types & Stats - 6 types sur UNE SEULE LIGNE */}
          <div className="types-stats types-stats-6">
            {Object.keys(typeConfig).map((type) => {
              const Icon = typeConfig[type].icon;
              const isActive = selectedType === type;
              const count = type === 'other'
                ? otherUsagers.length
                : (stats?.[type]?.total || 0);
              const hasNew = type !== 'other' && nouveauxIds[type]?.length > 0;
              return (
                <button
                  type="button"
                  key={type}
                  className={`type-stat ${isActive ? 'active' : ''} ${type === 'other' ? 'type-stat-other' : ''}`}
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

              {selectedType !== 'other' && anneesDisponibles.length > 0 && (
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
                  placeholder={selectedType === 'other'
                    ? "Rechercher un usager événementiel..."
                    : "Rechercher (nom, demandeur, téléphone...)"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="filters-right">
              {selectedType !== 'other' && (
                <>
                  {showOnlyNouveaux ? (
                    <button type="button" className="btn-secondary" onClick={() => setShowOnlyNouveaux(false)}>
                      <EyeOff size={16} /> Tous les usagers
                    </button>
                  ) : (
                    <button type="button" className="btn-secondary" onClick={() => setShowOnlyNouveaux(true)}>
                      <Eye size={16} /> Nouveaux uniquement
                    </button>
                  )}
                </>
              )}
              <button type="button" className="btn-refresh" onClick={loadAllData}>
                <RefreshCw size={16} /> Rafraîchir
              </button>
            </div>
          </div>

          {/* En-tête spécifique pour l'onglet événementiel */}
          {selectedType === 'other' && !loadingOther && otherUsagers.length > 0 && (
            <div className="other-header-bar">
              <div className="other-header-info">
                <Package size={18} color="#357ABD" />
                <span>
                  <strong className="other-header-count">{otherUsagers.length}</strong> usager(s) événementiel(s)
                  {' '}— CD, MP3, Œuvres Web, Hologrammes, Vidéos...
                </span>
              </div>
              <button
                type="button"
                className="btn-other-add"
                onClick={() => navigate('/other-ajout')}
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>
          )}

          {/* Table */}
          <div className="table-wrapper">
            {loading ? (
              <div className="state-block">
                <Loader size={32} className="spinner" />
                <p>Chargement des données...</p>
              </div>
            ) : apiError && selectedType !== 'other' ? (
              <div className="state-block state-error">
                <AlertCircle size={28} />
                <p>{apiError}</p>
                <button type="button" className="btn-refresh" onClick={loadAllData}>
                  <RefreshCw size={16} /> Rafraîchir
                </button>
              </div>
            ) : selectedType === 'other' ? (
              renderOtherTable()
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