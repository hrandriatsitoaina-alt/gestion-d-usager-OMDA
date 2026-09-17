// src/pages/ConfirmePaiement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, User, Phone, MapPin, Calendar, DollarSign, CreditCard,
  CalendarDays, CheckCircle, XCircle, Clock, AlertCircle,
  Hotel, Store, Bus, PartyPopper, Tv2, Ticket, FileText, Info,
  Lock, Hash, ArrowLeft, Trash2
} from 'lucide-react';
import '../styles/confirme-paiement.css';
import MiniSidebar from '../components/MiniSidebar';

const ConfirmePaiement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [usager, setUsager] = useState(null);
  const [usagerType, setUsagerType] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

  const [montantFixe, setMontantFixe] = useState(0);
  const [moisSelectionnes, setMoisSelectionnes] = useState([]);

  const typeLabels = {
    hotel: 'Hôtel',
    'grand-surface': 'Grande Surface',
    bus: 'Bus',
    nightclub: 'Night Club',
    media: 'Média',
    occ: 'Occasionnel'
  };

  const typeIcons = {
    hotel: Hotel, 'grand-surface': Store, bus: Bus,
    nightclub: PartyPopper, media: Tv2, occ: Ticket
  };
  const typeColors = {
    hotel: '#4A90D9', 'grand-surface': '#27ae60', bus: '#f39c12',
    nightclub: '#8e44ad', media: '#e74c3c', occ: '#1abc9c'
  };
  const typeBgColors = {
    hotel: '#E8F0FE', 'grand-surface': '#E8F8ED', bus: '#FFF8E1',
    nightclub: '#F3E5F5', media: '#FDE8E8', occ: '#E0F7F4'
  };

  const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const moisLabelsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const toNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  };

  const getMontantFixe = (usagerData) => {
    const candidats = [
      usagerData.soit_total,
      usagerData.montant_total,
      usagerData.montant_mensuel,
      usagerData.montant
    ];
    for (const c of candidats) {
      const n = toNumber(c);
      if (n !== null) return n;
    }
    return 0;
  };

  const getDetail = (usagerData, type) => {
    const fraisDossier = toNumber(usagerData.frais_dossier) ?? 0;
    const uniter = parseInt(usagerData.uniter) || 1;
    const montantRetard = toNumber(usagerData.montant_retard) ?? 0;
    const isRetard = !!usagerData.is_retard;

    let montantUnitaire;
    if (type === 'occ') {
      montantUnitaire = toNumber(usagerData.montant_total) ?? toNumber(usagerData.montant) ?? 0;
    } else if (type === 'media') {
      montantUnitaire = toNumber(usagerData.montant_mensuel) ?? toNumber(usagerData.taux) ?? toNumber(usagerData.montant_total) ?? 0;
    } else {
      montantUnitaire = toNumber(usagerData.montant_mensuel) ?? toNumber(usagerData.montant_total) ?? toNumber(usagerData.montant) ?? 0;
    }

    return { fraisDossier, uniter, montantRetard, isRetard, montantUnitaire };
  };

  useEffect(() => {
    const state = location.state;
    console.log('📍 State reçu dans ConfirmePaiement:', state);
    if (state && state.usager) {
      setUsager(state.usager);
      setUsagerType(state.type || 'hotel');
      initializePayment(state.usager, state.type || 'hotel');
    } else {
      navigate('/dashboard');
    }
  }, [location]);

  const initializePayment = (usagerData, type) => {
    setLoading(true);
    fetchAnneesDisponibles(type);

    const montant = getMontantFixe(usagerData);
    console.log(`💰 [${type}] Montant fixe retenu (soit_total prioritaire):`, montant);
    setMontantFixe(montant);

    const moisActuel = new Date().getMonth() + 1;
    setMoisSelectionnes(type === 'occ' ? [] : [moisActuel]);

    setLoading(false);
  };

  const fetchAnneesDisponibles = async (type) => {
    try {
      const response = await fetch(`http://localhost:3001/api/paiements/annees-disponibles/${type}`);
      const data = await response.json();
      if (data.success && data.annees.length > 0) {
        setAnneesDisponibles(data.annees);
        setSelectedYear(data.annees.includes(new Date().getFullYear()) ? new Date().getFullYear() : data.annees[data.annees.length - 1]);
      } else {
        setAnneesDisponibles([new Date().getFullYear()]);
        setSelectedYear(new Date().getFullYear());
      }
    } catch {
      setAnneesDisponibles([new Date().getFullYear()]);
      setSelectedYear(new Date().getFullYear());
    }
  };

  const toggleMois = (mois) => {
    setMoisSelectionnes(prev =>
      prev.includes(mois) ? prev.filter(m => m !== mois) : [...prev, mois].sort((a, b) => a - b)
    );
  };

  const selectAllMois = () => setMoisSelectionnes([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const deselectAllMois = () => setMoisSelectionnes([]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return `${date.getDate()} ${date.toLocaleString('fr-FR', { month: 'long' })} ${date.getFullYear()}`;
    } catch { return dateString; }
  };

  const handleCancelAndDelete = async () => {
    if (!usager) return;
    
    setShowCancelModal(false);
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('adminToken') || '';
      
      const typeMap = {
        'hotel': 'hotel',
        'grand-surface': 'grand-surface',
        'media': 'media',
        'occ': 'occ',
        'bus': 'bus',
        'nightclub': 'nightclub'
      };
      
      const typeParam = typeMap[usagerType] || usagerType;
      
      console.log(`🗑️ Suppression de l'usager ${usager.id} (${typeParam})...`);
      
      const response = await fetch(
        `http://localhost:3001/api/usagers/${typeParam}/${usager.id}`,
        {
          method: 'DELETE',
          headers: {
            'adminToken': token,
            'Content-Type': 'application/json'
          }
        }
      );

      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        const text = await response.text();
        throw new Error(`Réponse serveur: ${text || `HTTP ${response.status}`}`);
      }

      if (!response.ok) {
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }

      if (data.success) {
        setNotification({ 
          type: 'success', 
          message: `✅ Usager supprimé avec succès - Retour au tableau de bord` 
        });
        
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              toast: { 
                type: 'success', 
                message: `🗑️ Usager "${usager.denomination || usager.nom_evenement || 'Inconnu'}" a été supprimé` 
              } 
            }
          });
        }, 1500);
      } else {
        setNotification({ type: 'error', message: '❌ ' + (data.message || 'Erreur lors de la suppression') });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      setNotification({ type: 'error', message: '❌ ' + (error.message || 'Erreur lors de la suppression') });
      setIsSubmitting(false);
    }
  };

  const submitPayment = async () => {
    if (isSubmitting || !usager) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken') || '';
      const { fraisDossier, montantRetard, isRetard, uniter } = getDetail(usager, usagerType);

      const payload = {
        usagerId: usager.id,
        usagerType,
        montant: montantFixe,
        date_paiement: paymentDate,
        type_paiement: usagerType === 'occ' ? 'unique' : 'mensuel',
        frais_dossier: fraisDossier,
        montant_retard: montantRetard,
        est_retard: isRetard,
        reference: usager.numero_dossier_utilisateur || null,
        uniter,
        montantMensuel: montantFixe,
        soitTotal: montantFixe,
        nombre_mois: usagerType === 'occ' ? 1 : moisSelectionnes.length
      };

      if (usagerType === 'occ') {
        payload.annee = null;
        payload.mois = null;
      } else {
        payload.annee = selectedYear;
        payload.mois = moisSelectionnes.length > 0 ? moisSelectionnes[0] : new Date().getMonth() + 1;
        payload.mois_payes = moisSelectionnes;
      }

      console.log('📝 Envoi paiement:', payload);

      const response = await fetch('http://localhost:3001/api/paiements/enregistrer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          adminToken: token
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ type: 'success', message: '✅ Paiement enregistré avec succès' });
        setTimeout(() => {
          navigate('/confirmation-dossier', {
            state: {
              usager,
              type: usagerType,
              payment: {
                montant: montantFixe,
                date: paymentDate,
                nombreMois: moisSelectionnes.length,
                annee: selectedYear,
                mois_payes: moisSelectionnes,
                fraisDossier,
                uniter,
                montantMensuel: montantFixe,
                soitTotal: montantFixe,
                montantRetard,
                isRetard
              }
            }
          });
        }, 1500);
      } else {
        setNotification({ type: 'error', message: '❌ ' + data.message });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setNotification({ type: 'error', message: "❌ Erreur lors de l'enregistrement" });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <MiniSidebar />
        <div className="cp-new-loading">
          <div className="cp-new-spinner"></div>
          <p>Chargement du paiement...</p>
        </div>
      </>
    );
  }

  if (!usager) {
    return (
      <>
        <MiniSidebar />
        <div className="cp-new-error">
          <AlertCircle size={48} strokeWidth={1.5} />
          <p>Aucun usager à payer</p>
          <button onClick={() => navigate('/dashboard')} className="cp-new-btn-retour">Retour</button>
        </div>
      </>
    );
  }

  const IconComponent = typeIcons[usagerType] || Building2;
  const color = typeColors[usagerType] || '#4A90D9';
  const bgColor = typeBgColors[usagerType] || '#f0f0f0';
  const isOcc = usagerType === 'occ';

  const { fraisDossier, uniter, montantRetard, isRetard, montantUnitaire } = getDetail(usager, usagerType);
  const totalAPayer = montantFixe;

  return (
    <>
      <MiniSidebar />
      <main className="cp-new-container">
        {notification && (
          <div className={`cp-new-notif ${notification.type}`}>
            <span>{notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}</span>
            <span>{notification.message}</span>
          </div>
        )}

        <div className="cp-new-card">
          <div className="cp-new-header">
            <div className="cp-new-header-left">
              <div className="cp-new-header-icon-wrapper" style={{ background: color }}>
                <IconComponent size={28} color="#fff" strokeWidth={1.5} />
              </div>
              <div>
                <h1>Confirmation de paiement</h1>
                <p className="cp-new-header-subtitle">{typeLabels[usagerType] || 'Usager'} – {usager.denomination || usager.nom_evenement || 'Sans nom'}</p>
              </div>
            </div>
            <div className="cp-new-header-badge" style={{ background: bgColor, color: color }}>
              <span>{typeLabels[usagerType] || 'Usager'}</span>
            </div>
          </div>

          <div className="cp-new-usager-card" style={{ borderColor: color, background: bgColor }}>
            <div className="cp-new-usager-grid">
              <div className="cp-new-info-item">
                <span className="cp-new-info-label"><FileText size={16} strokeWidth={1.5} /> ID</span>
                <span className="cp-new-info-value">#{String(usager.id).padStart(3, '0')}</span>
              </div>
              <div className="cp-new-info-item">
                <span className="cp-new-info-label"><Building2 size={16} strokeWidth={1.5} /> Dénomination</span>
                <span className="cp-new-info-value">{usager.denomination || usager.nom_evenement || '-'}</span>
              </div>
              <div className="cp-new-info-item">
                <span className="cp-new-info-label"><User size={16} strokeWidth={1.5} /> Demandeur</span>
                <span className="cp-new-info-value">{usager.demandeur || usager.organisateurs || '-'}</span>
              </div>
              <div className="cp-new-info-item">
                <span className="cp-new-info-label"><Phone size={16} strokeWidth={1.5} /> Téléphone</span>
                <span className="cp-new-info-value">{usager.telephone || '-'}</span>
              </div>
              <div className="cp-new-info-item">
                <span className="cp-new-info-label"><MapPin size={16} strokeWidth={1.5} /> Région</span>
                <span className="cp-new-info-value">{usager.region || '-'}</span>
              </div>

              {isOcc && (
                <>
                  <div className="cp-new-info-item">
                    <span className="cp-new-info-label"><Ticket size={16} strokeWidth={1.5} /> Genre</span>
                    <span className="cp-new-info-value">{usager.genre_manifestation || '-'}</span>
                  </div>
                  <div className="cp-new-info-item">
                    <span className="cp-new-info-label"><Calendar size={16} strokeWidth={1.5} /> Date événement</span>
                    <span className="cp-new-info-value">{formatDate(usager.date_evenement) || '-'}</span>
                  </div>
                  <div className="cp-new-info-item">
                    <span className="cp-new-info-label"><MapPin size={16} strokeWidth={1.5} /> Lieu</span>
                    <span className="cp-new-info-value">{usager.lieu_evenement || '-'}</span>
                  </div>
                  <div className="cp-new-info-item">
                    <span className="cp-new-info-label"><DollarSign size={16} strokeWidth={1.5} /> Montant</span>
                    <span className="cp-new-info-value">{montantUnitaire.toLocaleString()} Ar</span>
                  </div>
                  <div className="cp-new-info-item">
                    <span className="cp-new-info-label"><FileText size={16} strokeWidth={1.5} /> Frais de dossier</span>
                    <span className="cp-new-info-value">+ {fraisDossier.toLocaleString()} Ar</span>
                  </div>
                  {isRetard && (
                    <div className="cp-new-info-item">
                      <span className="cp-new-info-label"><Clock size={16} strokeWidth={1.5} /> Pénalité retard</span>
                      <span className="cp-new-info-value">+ {montantRetard.toLocaleString()} Ar</span>
                    </div>
                  )}
                </>
              )}

              {!isOcc && (
                <>
                  <div className="cp-new-info-item">
                    <span className="cp-new-info-label"><DollarSign size={16} strokeWidth={1.5} /> Montant mensuel</span>
                    <span className="cp-new-info-value">{montantUnitaire.toLocaleString()} Ar</span>
                  </div>
                  <div className="cp-new-info-item">
                    <span className="cp-new-info-label"><Hash size={16} strokeWidth={1.5} /> Uniter</span>
                    <span className="cp-new-info-value">× {uniter}</span>
                  </div>
                  <div className="cp-new-info-item">
                    <span className="cp-new-info-label"><FileText size={16} strokeWidth={1.5} /> Frais de dossier</span>
                    <span className="cp-new-info-value">+ {fraisDossier.toLocaleString()} Ar</span>
                  </div>
                </>
              )}

              <div className="cp-new-info-item highlight">
                <span className="cp-new-info-label"><Lock size={16} strokeWidth={1.5} /> Total à payer</span>
                <span className="cp-new-info-value montant">{montantFixe.toLocaleString()} Ar</span>
              </div>
            </div>
          </div>

          <div className="cp-new-payment-card">
            <h3><CreditCard size={20} strokeWidth={1.5} /> Enregistrer le paiement</h3>

            <div className="cp-new-info-message" style={{ background: '#FFF8E1', borderLeft: `4px solid ${color}` }}>
              <div className="cp-new-info-message-inner">
                <Info size={18} color={color} />
                <span className="cp-new-info-message-text">
                  <strong>Montant total :</strong> {montantFixe.toLocaleString()} Ar
                  {isOcc ? (
                    ` (${montantUnitaire.toLocaleString()} Ar + ${fraisDossier.toLocaleString()} Ar de frais${isRetard ? ` + ${montantRetard.toLocaleString()} Ar de pénalité` : ''})`
                  ) : (
                    ` (${montantUnitaire.toLocaleString()} Ar × ${uniter} + ${fraisDossier.toLocaleString()} Ar de frais de dossier)`
                  )}
                </span>
              </div>
            </div>

            {!isOcc && (
              <>
                <div className="cp-new-mois-section">
                  <div className="cp-new-mois-header">
                    <label><CalendarDays size={16} strokeWidth={1.5} /> Sélection des mois à payer</label>
                    <div className="cp-new-mois-actions">
                      <button type="button" className="cp-new-btn-select-all" onClick={selectAllMois}>Tout sélectionner</button>
                      <button type="button" className="cp-new-btn-deselect-all" onClick={deselectAllMois}>Tout désélectionner</button>
                    </div>
                  </div>

                  <div className="cp-new-mois-grid">
                    {moisLabels.map((label, index) => {
                      const mois = index + 1;
                      const estSelectionne = moisSelectionnes.includes(mois);
                      return (
                        <div
                          key={mois}
                          className={`cp-new-mois-item ${estSelectionne ? 'selected' : ''}`}
                          onClick={() => toggleMois(mois)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="cp-new-mois-label">{label}</span>
                          <span className="cp-new-mois-num">{mois}</span>
                          {estSelectionne && <span className="cp-new-mois-check">✓</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="cp-new-mois-info">
                    <span>{moisSelectionnes.length} mois sélectionné(s)</span>
                    {moisSelectionnes.length > 0 && (
                      <span className="cp-new-mois-selected-list">
                        ({moisSelectionnes.map(m => moisLabelsShort[m - 1]).join(', ')})
                      </span>
                    )}
                  </div>
                </div>

                <div className="cp-new-form-group full-width">
                  <label><CalendarDays size={16} strokeWidth={1.5} /> Année</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="cp-new-input">
                    {anneesDisponibles.map(y => (<option key={y} value={y}>{y}</option>))}
                  </select>
                </div>
              </>
            )}

            <div className="cp-new-payment-form">
              <div className="cp-new-form-group full-width">
                <label><Calendar size={16} strokeWidth={1.5} /> Date de paiement</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="cp-new-input" />
              </div>

              <div className="cp-new-form-group full-width">
                <label><DollarSign size={16} strokeWidth={1.5} /> Montant total (Ar)</label>
                <div className="cp-new-relative">
                  <input
                    type="number"
                    value={montantFixe}
                    disabled={true}
                    className="cp-new-input cp-new-input-disabled"
                  />
                  <Lock size={16} className="cp-new-lock-icon" />
                </div>
                <small className="cp-new-field-hint" style={{ color: color, fontWeight: 'bold' }}>
                  🔒 Montant fixe : {montantFixe.toLocaleString()} Ar
                  {isOcc ? (
                    ` (${montantUnitaire.toLocaleString()} Ar + ${fraisDossier.toLocaleString()} Ar de frais${isRetard ? ` + ${montantRetard.toLocaleString()} Ar de pénalité` : ''})`
                  ) : (
                    ` (${montantUnitaire.toLocaleString()} Ar × ${uniter} + ${fraisDossier.toLocaleString()} Ar de frais)`
                  )}
                </small>
              </div>

              <div className="cp-new-total-payment full-width">
                <span>Total à payer :</span>
                <strong>{totalAPayer.toLocaleString()} Ar</strong>
              </div>
            </div>

            {/* ============================================================
                BOUTONS — Utilisation des nouvelles classes CSS
                ============================================================ */}
            <div className="cp-new-button-group">
              <button
                className="cp-new-btn-cancel"
                onClick={() => setShowCancelModal(true)}
                disabled={isSubmitting}
              >
                <ArrowLeft size={18} strokeWidth={2} />
                <span>Annuler et supprimer</span>
              </button>

              <button
                className="cp-new-btn-validate"
                onClick={submitPayment}
                disabled={isSubmitting || montantFixe <= 0 || (!isOcc && moisSelectionnes.length === 0)}
                style={{ background: color }}
              >
                {isSubmitting ? (
                  <>
                    <Clock size={18} strokeWidth={2} />
                    <span>Traitement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} strokeWidth={2} />
                    <span>Valider le paiement</span>
                  </>
                )}
              </button>
            </div>

            {/* ============================================================
                MODAL DE CONFIRMATION DE SUPPRESSION
                ============================================================ */}
            {showCancelModal && (
              <div className="cp-new-modal-overlay" onClick={() => setShowCancelModal(false)}>
                <div className="cp-new-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="cp-new-modal-header" style={{ borderBottom: '2px solid #e74c3c' }}>
                    <h3 style={{ color: '#e74c3c' }}>
                      <Trash2 size={24} /> ⚠️ Confirmation de suppression
                    </h3>
                    <button className="cp-new-modal-close" onClick={() => setShowCancelModal(false)}>✕</button>
                  </div>
                  <div className="cp-new-modal-body">
                    <div className="cp-new-delete-warning">
                      <p className="cp-new-delete-warning-title">
                        <strong>⚠️ Attention !</strong> Vous êtes sur le point de supprimer définitivement cet usager.
                      </p>
                      <p className="cp-new-delete-warning-text">
                        <strong>Usager :</strong> {usager.denomination || usager.nom_evenement || 'Inconnu'}
                      </p>
                      <p className="cp-new-delete-warning-text">
                        <strong>Type :</strong> {typeLabels[usagerType] || usagerType}
                      </p>
                      <p className="cp-new-delete-warning-text">
                        <strong>Demandeur :</strong> {usager.demandeur || usager.organisateurs || '-'}
                      </p>
                    </div>

                    <div className="cp-new-delete-info">
                      <p className="cp-new-delete-info-text">
                        <strong>📌 Pourquoi supprimer ?</strong><br />
                        Cette action est irréversible. Si cet usager a été ajouté par erreur, 
                        ou si vous rencontrez un problème, contactez immédiatement le 
                        <strong style={{ color: '#c0392b' }}> Super Admin</strong> pour 
                        toute assistance avant de confirmer.
                      </p>
                    </div>

                    <div className="cp-new-delete-advice">
                      <p className="cp-new-delete-advice-text">
                        <AlertCircle size={18} color="#1a237e" />
                        <span>
                          <strong>Conseil :</strong> Avant de supprimer, vérifiez que cet usager 
                          n'a pas déjà des paiements enregistrés.
                        </span>
                      </p>
                    </div>

                    <div className="cp-new-delete-actions">
                      <button 
                        className="cp-new-btn-cancel-modal"
                        onClick={() => setShowCancelModal(false)}
                      >
                        ❌ Annuler
                      </button>
                      <button 
                        className="cp-new-btn-confirm-delete"
                        onClick={handleCancelAndDelete}
                        disabled={isSubmitting}
                      >
                        <Trash2 size={18} /> Supprimer définitivement
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default ConfirmePaiement;