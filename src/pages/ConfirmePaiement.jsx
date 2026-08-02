// src/pages/ConfirmePaiement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  
  // États pour le paiement
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [nombreMois, setNombreMois] = useState(1);
  const [montantTotal, setMontantTotal] = useState(0);
  const [soitTotal, setSoitTotal] = useState(0);
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  
  // Type d'usager
  const typeLabels = {
    hotel: 'Hôtel',
    'grand-surface': 'Grande Surface',
    bus: 'Bus',
    nightclub: 'Night Club',
    media: 'Média',
    occ: 'Occasionnel'
  };

  const typeIcons = {
    hotel: '🏨',
    'grand-surface': '🏬',
    bus: '🚌',
    nightclub: '🎭',
    media: '📺',
    occ: '🎪'
  };

  const typeColors = {
    hotel: '#4A90D9',
    'grand-surface': '#27ae60',
    bus: '#f39c12',
    nightclub: '#8e44ad',
    media: '#e74c3c',
    occ: '#1abc9c'
  };

  useEffect(() => {
    const state = location.state;
    console.log('📍 State reçu dans ConfirmePaiement:', state);
    
    if (state && state.usager) {
      setUsager(state.usager);
      setUsagerType(state.type || 'hotel');
      initializePayment(state.usager, state.type || 'hotel');
    } else {
      console.warn('⚠️ Aucune donnée usager trouvée, redirection vers dashboard');
      navigate('/dashboard');
    }
  }, [location]);

  const initializePayment = (usager, type) => {
    setLoading(true);
    
    fetchAnneesDisponibles(type);
    
    let montant = parseFloat(usager.soit_total) || 0;
    console.log('💰 Soit Total reçu:', montant);
    
    if (montant === 0) {
      if (type === 'occ') {
        montant = parseFloat(usager.montant_total) || 0;
      } else {
        montant = parseFloat(usager.montant_mensuel) || 0;
      }
      console.log('💰 Fallback montant:', montant);
    }
    
    setSoitTotal(montant);
    setMontantTotal(montant);
    
    if (type === 'occ') {
      setNombreMois(1);
    } else {
      setNombreMois(1);
    }
    
    setLoading(false);
  };

  const fetchAnneesDisponibles = async (type) => {
    try {
      const response = await fetch(`http://localhost:3001/api/paiements/annees-disponibles/${type}`);
      const data = await response.json();
      if (data.success && data.annees.length > 0) {
        setAnneesDisponibles(data.annees);
        if (data.annees.includes(new Date().getFullYear())) {
          setSelectedYear(new Date().getFullYear());
        } else if (data.annees.length > 0) {
          setSelectedYear(data.annees[data.annees.length - 1]);
        }
      } else {
        setAnneesDisponibles([new Date().getFullYear()]);
        setSelectedYear(new Date().getFullYear());
      }
    } catch (err) {
      console.warn('⚠️ Erreur années disponibles:', err);
      setAnneesDisponibles([new Date().getFullYear()]);
      setSelectedYear(new Date().getFullYear());
    }
  };

  const handleNombreMoisChange = (nb) => {
    setNombreMois(nb);
  };

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
      const jour = date.getDate();
      const mois = date.toLocaleString('fr-FR', { month: 'long' });
      const annee = date.getFullYear();
      return `${jour} ${mois} ${annee}`;
    } catch (error) {
      return dateString;
    }
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
        anneeDebut: selectedYear
      };
      
      console.log('📝 Envoi paiement:', payload);
      
      const response = await fetch('http://localhost:3001/api/paiements/enregistrer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'adminToken': token
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('📥 Réponse:', data);
      
      if (data.success) {
        setNotification({ type: 'success', message: '✅ Paiement enregistré avec succès !' });
        
        // ⭐ REDIRECTION VERS CONFIRMATION DOSSIER
        setTimeout(() => {
          navigate('/confirmation-dossier', { 
            state: { 
              usager: usager,
              type: usagerType,
              payment: {
                montant: montantTotal,
                date: paymentDate,
                nombreMois: nombreMois,
                annee: selectedYear
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

  // ⭐ Nouveau: Passer directement à la confirmation sans payer
  const handleSkipToConfirmation = () => {
    navigate('/confirmation-dossier', { 
      state: { 
        usager: usager,
        type: usagerType
      } 
    });
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
          <p>Aucun usager à payer</p>
          <button onClick={() => navigate('/dashboard')} className="btn-retour">
            Retour au tableau de bord
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <MiniSidebar />
      <main className="confirme-paiement-container">
        {notification && (
          <div className={`notif ${notification.type}`}>
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            <span>{notification.message}</span>
          </div>
        )}

        <div className="confirme-card">
          <div className="confirme-header">
            <h1>
              <span className="header-icon">{typeIcons[usagerType] || '💰'}</span>
              Confirmation de paiement
            </h1>
            <p className="header-subtitle">
              {typeLabels[usagerType] || 'Usager'} ajouté avec succès ! 
              Procédez au paiement ou passez directement à la génération des documents.
            </p>
          </div>

          {/* Information de l'usager */}
          <div className="usager-info-card" style={{ borderColor: typeColors[usagerType] || '#4A90D9' }}>
            <div className="usager-info-header" style={{ background: typeColors[usagerType] || '#4A90D9' }}>
              <span className="usager-type-icon">{typeIcons[usagerType] || '🏨'}</span>
              <span className="usager-type-label">{typeLabels[usagerType] || 'Usager'}</span>
            </div>
            <div className="usager-info-body">
              <div className="info-row">
                <span className="info-label">ID</span>
                <span className="info-value">#{String(usager.id).padStart(3, '0')}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Nom / Dénomination</span>
                <span className="info-value">{usager.denomination || usager.nom_evenement || usager.organisateurs || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Demandeur</span>
                <span className="info-value">{usager.demandeur || usager.organisateurs || usager.representant_par || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Téléphone</span>
                <span className="info-value">{usager.telephone || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Région</span>
                <span className="info-value">{usager.region || '-'}</span>
              </div>
              {usagerType === 'occ' && (
                <>
                  <div className="info-row">
                    <span className="info-label">Genre manifestation</span>
                    <span className="info-value">{usager.genre_manifestation || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date événement</span>
                    <span className="info-value">{formatDate(usager.date_evenement) || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Lieu</span>
                    <span className="info-value">{usager.lieu_evenement || '-'}</span>
                  </div>
                </>
              )}
              
              <div className="info-row highlight">
                <span className="info-label">💰 Soit Total</span>
                <span className="info-value montant">{soitTotal.toLocaleString()} Ar</span>
              </div>
              
              {usagerType !== 'occ' && (
                <div className="info-row">
                  <span className="info-label">📆 Paiement mensuel</span>
                  <span className="info-value">{soitTotal.toLocaleString()} Ar/mois</span>
                </div>
              )}
            </div>
          </div>

          {/* Formulaire de paiement */}
          <div className="payment-form-card">
            <h3>💰 Enregistrer le paiement</h3>
            
            <div className="payment-form">
              <div className="form-group full-width">
                <label>📅 Date de paiement</label>
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
                    <label>📆 Année de paiement</label>
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
                    <label>🔢 Nombre de mois</label>
                    <select 
                      value={nombreMois} 
                      onChange={(e) => handleNombreMoisChange(parseInt(e.target.value))}
                      className="input-style"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <option key={n} value={n}>{n} mois</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              <div className="form-group full-width">
                <label>💰 {usagerType !== 'occ' ? 'Montant mensuel (Ar)' : 'Montant à payer (Ar)'}</label>
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
                    : `Montant total de la manifestation`}
                </small>
              </div>
              
              <div className="total-payment full-width">
                <span>Total à payer :</span>
                <strong>{montantTotal.toLocaleString()} Ar</strong>
              </div>
              
              {usagerType !== 'occ' && (
                <div className="payment-detail full-width">
                  <small>
                    Paiement de {montantTotal.toLocaleString()} Ar pour {nombreMois} mois
                  </small>
                </div>
              )}
            </div>

            <div className="button-group">
              <button 
                className="btn-skip" 
                onClick={handleSkipToConfirmation}
              >
                ⏭️ Passer le paiement → Dossier
              </button>
              <button 
                className="btn-validate" 
                onClick={submitPayment} 
                disabled={isSubmitting || montantTotal <= 0}
              >
                {isSubmitting ? '⏳ Traitement...' : '✓ Valider le paiement'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ConfirmePaiement;