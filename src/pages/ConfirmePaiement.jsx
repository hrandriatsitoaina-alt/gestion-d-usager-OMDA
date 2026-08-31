// src/pages/ConfirmePaiement.jsx - Version SIMPLIFIÉE
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, User, Phone, MapPin, Calendar, DollarSign, CreditCard,
  CalendarDays, CheckCircle, XCircle, Clock, ArrowRight, AlertCircle,
  Hotel, Store, Bus, PartyPopper, Tv2, Ticket, FileText, Info,
  Lock
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

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  
  // ✅ Montant FIXE - ne change JAMAIS
  const [montantFixe, setMontantFixe] = useState(0);
  const [nombreMois, setNombreMois] = useState(1);
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
    hotel: Hotel,
    'grand-surface': Store,
    bus: Bus,
    nightclub: PartyPopper,
    media: Tv2,
    occ: Ticket
  };

  const typeColors = {
    hotel: '#4A90D9',
    'grand-surface': '#27ae60',
    bus: '#f39c12',
    nightclub: '#8e44ad',
    media: '#e74c3c',
    occ: '#1abc9c'
  };

  const typeBgColors = {
    hotel: '#E8F0FE',
    'grand-surface': '#E8F8ED',
    bus: '#FFF8E1',
    nightclub: '#F3E5F5',
    media: '#FDE8E8',
    occ: '#E0F7F4'
  };

  const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const moisLabelsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

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

  const initializePayment = (usager, type) => {
    setLoading(true);
    fetchAnneesDisponibles(type);
    
    // ✅ Récupérer le montant FIXE depuis l'usager
    let montant = 0;
    if (type === 'occ') {
      montant = parseFloat(usager.montant_total) || parseFloat(usager.soit_total) || parseFloat(usager.montant) || 0;
    } else {
      montant = parseFloat(usager.montant_mensuel) || parseFloat(usager.soit_total) || parseFloat(usager.montant) || 0;
    }
    
    setMontantFixe(montant);
    setNombreMois(type === 'occ' ? 1 : 1);
    
    // ✅ Initialiser les mois sélectionnés (par défaut le mois en cours)
    const moisActuel = new Date().getMonth() + 1;
    setMoisSelectionnes([moisActuel]);
    
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

  // ✅ Fonction pour gérer la sélection des mois
  const handleNombreMoisChange = (nb) => {
    setNombreMois(nb);
    const moisDisponibles = [];
    for (let i = 1; i <= 12; i++) {
      moisDisponibles.push(i);
    }
    setMoisSelectionnes(moisDisponibles.slice(0, nb));
  };

  // ✅ Fonction pour basculer la sélection d'un mois
  const toggleMois = (mois) => {
    setMoisSelectionnes(prev => {
      if (prev.includes(mois)) {
        return prev.filter(m => m !== mois);
      } else {
        const nouveau = [...prev, mois].sort((a, b) => a - b);
        setNombreMois(nouveau.length);
        return nouveau;
      }
    });
  };

  // ✅ Fonction pour sélectionner tous les mois
  const selectAllMois = () => {
    const tous = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    setMoisSelectionnes(tous);
    setNombreMois(12);
  };

  // ✅ Fonction pour désélectionner tous les mois
  const deselectAllMois = () => {
    setMoisSelectionnes([]);
    setNombreMois(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return `${date.getDate()} ${date.toLocaleString('fr-FR', { month: 'long' })} ${date.getFullYear()}`;
    } catch { return dateString; }
  };

  // ✅ Fonction submitPayment
  const submitPayment = async () => {
    if (isSubmitting || !usager) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken') || '';
      
      const payload = {
        usagerId: usager.id,
        usagerType: usagerType,
        montant: montantFixe,
        date_paiement: paymentDate,
        type_paiement: usagerType === 'occ' ? 'unique' : 'mensuel',
        frais_dossier: usager.frais_dossier || 0,
        montant_retard: usager.montant_retard || 0,
        est_retard: usager.is_retard || false,
        reference: usager.numero_dossier_utilisateur || null,
        uniter: usager.uniter || 1,
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
        setNotification({ 
          type: 'success', 
          message: `✅ Paiement enregistré avec succès` 
        });
        setTimeout(() => {
          navigate('/confirmation-dossier', {
            state: {
              usager: usager,
              type: usagerType,
              payment: {
                montant: montantFixe,
                date: paymentDate,
                nombreMois: moisSelectionnes.length,
                annee: selectedYear,
                mois_payes: moisSelectionnes,
                fraisDossier: usager.frais_dossier || 0,
                uniter: usager.uniter || 1,
                montantMensuel: montantFixe,
                soitTotal: montantFixe,
                montantRetard: usager.montant_retard || 0,
                isRetard: usager.is_retard || false
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
      setNotification({ type: 'error', message: '❌ Erreur lors de l\'enregistrement' });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <MiniSidebar />
        <div className="confirme-loading">
          <div className="spinner"></div>
          <p>Chargement du paiement...</p>
        </div>
      </>
    );
  }

  if (!usager) {
    return (
      <>
        <MiniSidebar />
        <div className="confirme-error">
          <AlertCircle size={48} strokeWidth={1.5} />
          <p>Aucun usager à payer</p>
          <button onClick={() => navigate('/dashboard')} className="btn-retour">Retour</button>
        </div>
      </>
    );
  }

  const IconComponent = typeIcons[usagerType] || Building2;
  const color = typeColors[usagerType] || '#4A90D9';
  const bgColor = typeBgColors[usagerType] || '#f0f0f0';
  
  // ✅ Total = montant fixe (sans calcul)
  const totalAPayer = montantFixe;

  return (
    <>
      <MiniSidebar />
      <main className="confirme-paiement-container">
        {notification && (
          <div className={`notif ${notification.type}`}>
            <span>{notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}</span>
            <span>{notification.message}</span>
          </div>
        )}

        <div className="confirme-card">
          <div className="confirme-header">
            <div className="header-left">
              <div className="header-icon-wrapper" style={{ background: color }}>
                <IconComponent size={28} color="#fff" strokeWidth={1.5} />
              </div>
              <div>
                <h1>Confirmation de paiement</h1>
                <p className="header-subtitle">{typeLabels[usagerType] || 'Usager'} – {usager.denomination || usager.nom_evenement || 'Sans nom'}</p>
              </div>
            </div>
            <div className="header-badge" style={{ background: bgColor, color: color }}>
              <span>{typeLabels[usagerType] || 'Usager'}</span>
            </div>
          </div>

          <div className="usager-info-card" style={{ borderColor: color, background: bgColor }}>
            <div className="usager-info-grid">
              <div className="info-item">
                <span className="info-label"><FileText size={16} strokeWidth={1.5} /> ID</span>
                <span className="info-value">#{String(usager.id).padStart(3, '0')}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Building2 size={16} strokeWidth={1.5} /> Dénomination</span>
                <span className="info-value">{usager.denomination || usager.nom_evenement || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><User size={16} strokeWidth={1.5} /> Demandeur</span>
                <span className="info-value">{usager.demandeur || usager.organisateurs || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Phone size={16} strokeWidth={1.5} /> Téléphone</span>
                <span className="info-value">{usager.telephone || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><MapPin size={16} strokeWidth={1.5} /> Région</span>
                <span className="info-value">{usager.region || '-'}</span>
              </div>
              {usagerType === 'occ' && (
                <>
                  <div className="info-item">
                    <span className="info-label"><Ticket size={16} strokeWidth={1.5} /> Genre</span>
                    <span className="info-value">{usager.genre_manifestation || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><Calendar size={16} strokeWidth={1.5} /> Date événement</span>
                    <span className="info-value">{formatDate(usager.date_evenement) || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><MapPin size={16} strokeWidth={1.5} /> Lieu</span>
                    <span className="info-value">{usager.lieu_evenement || '-'}</span>
                  </div>
                </>
              )}
              <div className="info-item highlight">
                <span className="info-label"><Lock size={16} strokeWidth={1.5} /> Montant FIXE</span>
                <span className="info-value montant">{montantFixe.toLocaleString()} Ar</span>
              </div>
              {usagerType !== 'occ' && (
                <div className="info-item">
                  <span className="info-label"><CalendarDays size={16} strokeWidth={1.5} /> Mensuel</span>
                  <span className="info-value">{montantFixe.toLocaleString()} Ar/mois</span>
                </div>
              )}
            </div>
          </div>

          <div className="payment-form-card">
            <h3><CreditCard size={20} strokeWidth={1.5} /> Enregistrer le paiement</h3>
            
            {/* ✅ Message d'information sur le montant FIXE */}
            <div className="info-message" style={{ background: '#FFF8E1', borderLeft: `4px solid ${color}`, padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={18} color={color} />
                <span style={{ fontSize: '14px', color: '#6d5a00' }}>
                  <strong>Montant fixe :</strong> {montantFixe.toLocaleString()} Ar par mois (défini lors de l'ajout de l'usager)
                </span>
              </div>
            </div>

            {usagerType !== 'occ' && (
              <>
                {/* ✅ Sélection des mois */}
                <div className="mois-selection-section">
                  <div className="mois-selection-header">
                    <label><CalendarDays size={16} strokeWidth={1.5} /> Sélection des mois à payer</label>
                    <div className="mois-selection-actions">
                      <button type="button" className="btn-select-all" onClick={selectAllMois}>
                        Tout sélectionner
                      </button>
                      <button type="button" className="btn-deselect-all" onClick={deselectAllMois}>
                        Tout désélectionner
                      </button>
                    </div>
                  </div>
                  
                  <div className="mois-selection-grid">
                    {moisLabels.map((label, index) => {
                      const mois = index + 1;
                      const estSelectionne = moisSelectionnes.includes(mois);
                      return (
                        <div
                          key={mois}
                          className={`mois-item ${estSelectionne ? 'selected' : ''}`}
                          onClick={() => toggleMois(mois)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="mois-label">{label}</span>
                          <span className="mois-num">{mois}</span>
                          {estSelectionne && (
                            <span className="mois-check">✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mois-selection-info">
                    <span>{moisSelectionnes.length} mois sélectionné(s)</span>
                    {moisSelectionnes.length > 0 && (
                      <span className="mois-selected-list">
                        ({moisSelectionnes.map(m => moisLabelsShort[m - 1]).join(', ')})
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label><CalendarDays size={16} strokeWidth={1.5} /> Année</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="input-style"
                  >
                    {anneesDisponibles.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="payment-form">
              <div className="form-group full-width">
                <label><Calendar size={16} strokeWidth={1.5} /> Date de paiement</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="input-style"
                />
              </div>

              {/* ✅ Champ Montant FIXE - DÉSACTIVÉ */}
              <div className="form-group full-width">
                <label><DollarSign size={16} strokeWidth={1.5} /> Montant FIXE (Ar)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={montantFixe}
                    disabled={true}
                    className="input-style input-disabled"
                    style={{ 
                      backgroundColor: '#f5f5f5', 
                      cursor: 'not-allowed',
                      color: '#2c3e50',
                      fontWeight: 'bold',
                      border: '2px solid #e0e0e0'
                    }}
                  />
                  <Lock size={16} style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#999'
                  }} />
                </div>
                <small className="field-hint" style={{ color: color, fontWeight: 'bold' }}>
                  🔒 Montant fixe : {montantFixe.toLocaleString()} Ar (ne peut pas être modifié)
                </small>
              </div>

              {/* ✅ Total à payer = montant fixe (SANS CALCUL) */}
              <div className="total-payment full-width">
                <span>Total à payer :</span>
                <strong>{totalAPayer.toLocaleString()} Ar</strong>
              </div>
            </div>

            <div className="button-group">
              <button
                className="btn-validate"
                onClick={submitPayment}
                disabled={isSubmitting || montantFixe <= 0 || (usagerType !== 'occ' && moisSelectionnes.length === 0)}
                style={{ background: color }}
              >
                {isSubmitting ? (
                  <><Clock size={18} strokeWidth={2} /> Traitement...</>
                ) : (
                  <><CheckCircle size={18} strokeWidth={2} /> Valider le paiement</>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ConfirmePaiement;