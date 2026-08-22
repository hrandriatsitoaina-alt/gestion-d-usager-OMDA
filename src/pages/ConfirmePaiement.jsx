// src/pages/ConfirmePaiement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, User, Phone, MapPin, Calendar, DollarSign, CreditCard,
  CalendarDays, CheckCircle, XCircle, Clock, ArrowRight, AlertCircle,
  Hotel, Store, Bus, PartyPopper, Tv2, Ticket, FileText, Info
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
  const [nombreMois, setNombreMois] = useState(1);
  const [montantTotal, setMontantTotal] = useState(0);
  const [soitTotal, setSoitTotal] = useState(0);
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

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
    let montant = parseFloat(usager.soit_total) || 0;
    if (montant === 0) {
      montant = parseFloat(usager.montant_total) || parseFloat(usager.montant_mensuel) || 0;
    }
    setSoitTotal(montant);
    setMontantTotal(montant);
    setNombreMois(type === 'occ' ? 1 : 1);
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

  const handleNombreMoisChange = (nb) => setNombreMois(nb);
  const handleMontantChange = (value) => {
    const montant = parseFloat(value) || 0;
    setSoitTotal(montant);
    setMontantTotal(montant);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return `${date.getDate()} ${date.toLocaleString('fr-FR', { month: 'long' })} ${date.getFullYear()}`;
    } catch { return dateString; }
  };

  const submitPayment = async () => {
    if (isSubmitting || !usager) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken') || '';
      const payload = {
        usagerId: usager.id,
        usagerType: usagerType,
        montant: montantTotal,
        datePaiement: paymentDate,
        nombreMois: usagerType !== 'occ' ? nombreMois : 1,
        anneeDebut: selectedYear,
        fraisDossier: usager.frais_dossier || 0,
        montantRetard: usager.montant_retard || 0,
        estRetard: usager.is_retard || false,
        reference: usager.numero_dossier_utilisateur || null
      };

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
        setNotification({ type: 'success', message: '✅ Paiement enregistré avec succès !' });
        setTimeout(() => {
          navigate('/confirmation-dossier', {
            state: {
              usager: usager,
              type: usagerType,
              payment: { montant: montantTotal, date: paymentDate, nombreMois, annee: selectedYear }
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

  const handleSkipToConfirmation = () => {
    navigate('/confirmation-dossier', { state: { usager, type: usagerType } });
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
                <span className="info-label"><DollarSign size={16} strokeWidth={1.5} /> Soit Total</span>
                <span className="info-value montant">{soitTotal.toLocaleString()} Ar</span>
              </div>
              {usagerType !== 'occ' && (
                <div className="info-item">
                  <span className="info-label"><CalendarDays size={16} strokeWidth={1.5} /> Mensuel</span>
                  <span className="info-value">{soitTotal.toLocaleString()} Ar/mois</span>
                </div>
              )}
            </div>
          </div>

          <div className="payment-form-card">
            <h3><CreditCard size={20} strokeWidth={1.5} /> Enregistrer le paiement</h3>
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

              {usagerType !== 'occ' && (
                <>
                  <div className="form-group">
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
                  <div className="form-group">
                    <label><Clock size={16} strokeWidth={1.5} /> Nombre de mois</label>
                    <select
                      value={nombreMois}
                      onChange={(e) => handleNombreMoisChange(parseInt(e.target.value))}
                      className="input-style"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                        <option key={n} value={n}>{n} mois</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="form-group full-width">
                <label><DollarSign size={16} strokeWidth={1.5} /> Montant (Ar)</label>
                <input
                  type="number"
                  value={soitTotal}
                  onChange={(e) => handleMontantChange(e.target.value)}
                  placeholder="Saisir le montant"
                  step="1000"
                  className="input-style"
                />
                <small className="field-hint">
                  {usagerType !== 'occ'
                    ? `Montant fixe: ${soitTotal.toLocaleString()} Ar pour ${nombreMois} mois`
                    : 'Montant total'}
                </small>
              </div>

              <div className="total-payment full-width">
                <span>Total à payer :</span>
                <strong>{montantTotal.toLocaleString()} Ar</strong>
              </div>
              {usagerType !== 'occ' && (
                <div className="payment-detail full-width">
                  <small>Paiement de {montantTotal.toLocaleString()} Ar pour {nombreMois} mois</small>
                </div>
              )}
            </div>

            <div className="button-group">
              <button
                className="btn-validate"
                onClick={submitPayment}
                disabled={isSubmitting || montantTotal <= 0}
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