// src/pages/ConfirmationDossier.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import '../styles/confirmation-dossier.css';
import MiniSidebar from '../components/MiniSidebar';

// Importations des générateurs de PDF
import { generateHotelPDF } from './pdf/hotel_pdf';
import { generateMagasinPDF } from './pdf/magasin_pdf';
import { generateMediaPDF } from './pdf/media_pdf';
import { generateNightPDF } from './pdf/night_pdf';
import { generateBusPDF } from './pdf/bus_pdf';
import { generateOccPDF } from './pdf/occ_pdf';
import { generateFacturePDF } from './pdf/facture_pdf';

const ConfirmationDossier = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const qrRef = useRef(null);
  
  const [usager, setUsager] = useState(null);
  const [usagerType, setUsagerType] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [validatedDossiers, setValidatedDossiers] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

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
    console.log('📍 State reçu dans ConfirmationDossier:', state);
    
    if (state && state.usager) {
      setUsager(state.usager);
      setUsagerType(state.type || 'hotel');
      setLoading(false);
    } else {
      // Essayer de récupérer depuis sessionStorage
      const savedUsager = sessionStorage.getItem('lastUsager');
      if (savedUsager) {
        try {
          const parsed = JSON.parse(savedUsager);
          setUsager(parsed.usager);
          setUsagerType(parsed.type || 'hotel');
          setLoading(false);
          return;
        } catch (e) {}
      }
      console.warn('⚠️ Aucune donnée usager trouvée, redirection vers dashboard');
      navigate('/dashboard');
    }
  }, [location]);

  // Récupérer l'utilisateur courant
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('userId');
        const response = await fetch('http://localhost:3001/api/auth/current-user', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const formatDateForQR = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const formatDateForReference = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const generateQRTextContent = (usager, type) => {
    if (!usager) return '© OMDA - Document officiel';
    
    const dateStr = formatDateForReference();
    const compteurValue = usager.id || 1;
    const andReference = `AND ${dateStr}-${compteurValue}`;
    
    let typePrefix = '';

    switch(type) {
      case 'occ':
        typePrefix = 'OCC';
        const organisateurs = usager.organisateurs || usager.demandeur || 'Non spécifié';
        let artistesStr = 'Non spécifié';
        if (usager.artistes_detail && usager.artistes_detail.length > 0) {
          artistesStr = usager.artistes_detail.map(a => a.nom).join(', ');
        } else if (usager.artistesList && usager.artistesList.length > 0) {
          artistesStr = usager.artistesList.map(a => a.nom).join(', ');
        } else if (usager.artistes && usager.artistes !== '' && usager.artistes !== 'Non spécifié') {
          artistesStr = usager.artistes;
        }
        const lieu = usager.lieu_evenement || usager.adresse || 'Lieu non spécifié';
        const dateEvent = usager.date_evenement ? formatDateForQR(usager.date_evenement) : 'Date non spécifiée';
        return `© OMDA affirme un événement : ${typePrefix} : Organisateurs: ${organisateurs}, Artistes: ${artistesStr}, Lieu: ${lieu}, Date événement: ${dateEvent}, ${andReference}`;

      case 'hotel':
        typePrefix = 'Hôtel';
        const nomHotel = usager.denomination || usager.nom || 'HÔTEL';
        const adresseHotel = usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        const etoiles = usager.etoiles || 'Non spécifié';
        let anneePaiementHotel = new Date().getFullYear();
        if (usager.annee_dernier_paiement) {
          anneePaiementHotel = usager.annee_dernier_paiement;
        }
        return `${typePrefix} : ${nomHotel}, Adresse: ${adresseHotel}, Étoiles: ${etoiles}, Validation année: ${anneePaiementHotel}, ${andReference}`;

      case 'grand-surface':
        typePrefix = 'Grande Surface';
        const nomGS = usager.denomination || usager.nom || 'GRANDE SURFACE';
        const adresseGS = usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        const nbMagasins = usager.nombre_magasins || 0;
        let anneePaiementGS = new Date().getFullYear();
        if (usager.annee_dernier_paiement) {
          anneePaiementGS = usager.annee_dernier_paiement;
        }
        return `${typePrefix} : ${nomGS}, Adresse: ${adresseGS}, Nb magasins: ${nbMagasins}, Validation année: ${anneePaiementGS}, ${andReference}`;

      case 'bus':
        typePrefix = 'Bus';
        const nomBus = usager.denomination || usager.nom || 'ENTREPRISE DE BUS';
        const adresseBus = usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        const typeBus = usager.type_bus || 'Non spécifié';
        const nbBus = usager.nombre_vehicules || 0;
        const lignes = usager.lignes || 'Non spécifiées';
        let anneePaiementBus = new Date().getFullYear();
        if (usager.annee_dernier_paiement) {
          anneePaiementBus = usager.annee_dernier_paiement;
        }
        return `${typePrefix} : ${nomBus}, type: ${typeBus}, Nb bus: ${nbBus}, Lignes: ${lignes}, Validation année: ${anneePaiementBus}, ${andReference}`;

      case 'nightclub':
        typePrefix = 'Night Club';
        const nomNC = usager.denomination || usager.nom || 'NIGHT CLUB';
        const adresseNC = usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        const jauge = usager.jauge_max || 0;
        const horaires = usager.horaires || 'Non spécifiés';
        let anneePaiementNC = new Date().getFullYear();
        if (usager.annee_dernier_paiement) {
          anneePaiementNC = usager.annee_dernier_paiement;
        }
        return `${typePrefix} : ${nomNC}, Adresse: ${adresseNC}, Jauge: ${jauge}, Horaires: ${horaires}, Validation année: ${anneePaiementNC}, ${andReference}`;

      case 'media':
        typePrefix = 'Média';
        const nomMedia = usager.denomination || usager.nom || 'MÉDIA';
        const adresseMedia = usager.siege || usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        const canal = usager.canal || usager.frequence || 'Non spécifié';
        let anneePaiementMedia = new Date().getFullYear();
        if (usager.annee_dernier_paiement) {
          anneePaiementMedia = usager.annee_dernier_paiement;
        }
        return `${typePrefix} : ${nomMedia}, Adresse: ${adresseMedia}, Canal/Fréquence: ${canal}, Validation année: ${anneePaiementMedia}, ${andReference}`;

      default:
        return `© OMDA - Document officiel, ${andReference}`;
    }
  };

  const generateDocument = async (docType) => {
    if (!usager) return;
    
    setIsGenerating(true);
    
    const pdfData = {
      date: usager.created_at || new Date().toISOString().split('T')[0],
      annee: new Date().getFullYear(),
      montant: usager.montant_mensuel || usager.montant_total || 0,
      nombreMois: 1,
      montantMensuel: usager.montant_mensuel || 0
    };

    try {
      setNotification({ type: 'info', message: `🔄 Génération du ${docType}...` });

      switch(docType) {
        case 'Contrat':
          switch(usagerType) {
            case 'hotel': generateHotelPDF(usager, pdfData); break;
            case 'grand-surface': generateMagasinPDF(usager, pdfData); break;
            case 'media': generateMediaPDF(usager, pdfData); break;
            case 'nightclub': generateNightPDF(usager, pdfData); break;
            case 'bus': generateBusPDF(usager, pdfData); break;
            case 'occ': await generateOccPDF(usager, pdfData); break;
            default: generateHotelPDF(usager, pdfData);
          }
          break;
        case 'Facture':
          await generateFacturePDF(usager, pdfData, usagerType);
          break;
        case 'QR Code':
          const qrText = generateQRTextContent(usager, usagerType);
          setQrCodeData({ usager, type: usagerType, qrText });
          setShowQrModal(true);
          setIsGenerating(false);
          return;
        default:
          break;
      }

      setValidatedDossiers(prev => ({
        ...prev,
        [docType]: true
      }));

      setNotification({ type: 'success', message: `✅ ${docType} généré avec succès` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', message: `❌ Erreur génération ${docType}` });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    await generateDocument('Contrat');
    setTimeout(() => generateDocument('Facture'), 500);
    setTimeout(() => generateDocument('QR Code'), 1000);
  };

  // Téléchargement du QR Code
  const handleDownloadQR = async () => {
    if (!qrRef.current) {
      alert('QR code non disponible');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(qrRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `qr-code-omda-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setNotification({ type: 'success', message: '✅ QR Code téléchargé avec succès' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setNotification({ type: 'error', message: '❌ Erreur téléchargement QR Code' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  // Impression du QR Code
  const handlePrintQR = () => {
    window.print();
  };

  const handleGoDashboard = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <>
        <MiniSidebar />
        <div className="confirmation-loading">
          <div className="spinner"></div>
          <p>Chargement du dossier...</p>
        </div>
      </>
    );
  }

  if (!usager) {
    return (
      <>
        <MiniSidebar />
        <div className="confirmation-error">
          <p>Aucun usager trouvé</p>
          <button onClick={handleGoDashboard} className="btn-retour">
            Retour au tableau de bord
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <MiniSidebar />
      <main className="confirmation-dossier-container">
        {notification && (
          <div className={`notif ${notification.type}`}>
            <span>{notification.type === 'success' ? '✅' : notification.type === 'info' ? 'ℹ️' : '❌'}</span>
            <span>{notification.message}</span>
            <button className="notif-close" onClick={() => setNotification(null)}>✕</button>
          </div>
        )}

        <div className="confirmation-card">
          <div className="confirmation-header">
            <h1>
              <span className="header-icon">{typeIcons[usagerType] || '📂'}</span>
              Confirmation du dossier
            </h1>
            <p className="header-subtitle">
              {typeLabels[usagerType] || 'Usager'} ajouté avec succès ! 
              Téléchargez les documents ci-dessous.
            </p>
          </div>

          {/* Information de l'usager */}
          <div className="usager-info-card" style={{ borderColor: typeColors[usagerType] || '#4A90D9' }}>
            <div className="usager-info-header" style={{ background: typeColors[usagerType] || '#4A90D9' }}>
              <span className="usager-type-icon">{typeIcons[usagerType] || '🏨'}</span>
              <span className="usager-type-label">{typeLabels[usagerType] || 'Usager'}</span>
              <span className="usager-id">#{String(usager.id).padStart(3, '0')}</span>
            </div>
            <div className="usager-info-body">
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
              <div className="info-row">
                <span className="info-label">Date création</span>
                <span className="info-value">{formatDate(usager.created_at) || formatDate(new Date())}</span>
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
              {usager.etoiles && (
                <div className="info-row">
                  <span className="info-label">Étoiles</span>
                  <span className="info-value">{'⭐'.repeat(parseInt(usager.etoiles) || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Documents à télécharger */}
          <div className="documents-card">
            <h3>📄 Documents disponibles</h3>
            <p className="documents-subtitle">
              Générez et téléchargez les documents du dossier
            </p>

            <div className="documents-grid">
              {/* Contrat */}
              <div className="doc-item" onClick={() => generateDocument('Contrat')}>
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <span className="doc-name">Contrat de représentation</span>
                  <span className="doc-size">PDF • Cliquer pour générer</span>
                </div>
                <div className="doc-status">
                  {validatedDossiers['Contrat'] ? (
                    <span className="badge-success">✅</span>
                  ) : (
                    <button className="btn-generate">Générer</button>
                  )}
                </div>
              </div>

              {/* Facture */}
              <div className="doc-item" onClick={() => generateDocument('Facture')}>
                <div className="doc-icon">🧾</div>
                <div className="doc-info">
                  <span className="doc-name">Facture officielle</span>
                  <span className="doc-size">PDF • Cliquer pour générer</span>
                </div>
                <div className="doc-status">
                  {validatedDossiers['Facture'] ? (
                    <span className="badge-success">✅</span>
                  ) : (
                    <button className="btn-generate">Générer</button>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div className="doc-item" onClick={() => generateDocument('QR Code')}>
                <div className="doc-icon">📱</div>
                <div className="doc-info">
                  <span className="doc-name">QR Code sécurisé</span>
                  <span className="doc-size">PNG • Cliquer pour générer</span>
                </div>
                <div className="doc-status">
                  {validatedDossiers['QR Code'] ? (
                    <span className="badge-success">✅</span>
                  ) : (
                    <button className="btn-generate">Générer</button>
                  )}
                </div>
              </div>
            </div>

            <div className="documents-actions">
              <button 
                className="btn-generate-all"
                onClick={handleGenerateAll}
                disabled={isGenerating}
              >
                {isGenerating ? '⏳ Génération...' : '🖨️ Tout générer et télécharger'}
              </button>
              <button 
                className="btn-dashboard"
                onClick={handleGoDashboard}
              >
                ← Retour Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* MODALE QR CODE AVEC LOGO */}
        {showQrModal && qrCodeData && (
          <div className="modal-overlay qr-modal-overlay" onClick={() => setShowQrModal(false)}>
            <div className="modal-content qr-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header qr-modal-header">
                <h3>📱 QR Code</h3>
                <button className="modal-close" onClick={() => setShowQrModal(false)}>✕</button>
              </div>
              
              <div className="qr-body">
                <div className="qr-preview-container" ref={qrRef}>
                  <div className="qr-code-wrapper-only">
                    <div className="qr-red-border">
                      <div className="qr-code-container">
                        <QRCodeCanvas
                          value={qrCodeData.qrText}
                          size={220}
                          bgColor="#ffffff"
                          fgColor="#dc2626"
                          level="H"
                          includeMargin={true}
                        />
                        <div className="qr-logo-styled">
                          <div className="qr-logo-circle">
                            <img src="/logo.ico" alt="OMDA" className="qr-logo-img" />
                          </div>
                        </div>
                      </div>
                      <div className="qr-omda-footer">
                        OFFICE MALAGASY DU DROIT D'AUTEUR
                      </div>
                    </div>
                  </div>
                </div>

                <div className="qr-actions-only">
                  <button 
                    className="btn-cancel" 
                    onClick={() => setShowQrModal(false)}
                  >
                    Fermer
                  </button>
                  <button 
                    className="btn-print-qr-only"
                    onClick={handlePrintQR}
                  >
                    🖨️ Imprimer
                  </button>
                  <button 
                    className="btn-download-qr-only"
                    onClick={handleDownloadQR}
                    disabled={isDownloading}
                  >
                    {isDownloading ? '⏳ Téléchargement...' : '📥 Télécharger'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default ConfirmationDossier;