// src/components/GenerateQRCode.jsx
import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import '../styles/generate-qrcode.css';

const GenerateQRCode = ({ 
  usager, 
  type = 'occ',
  onClose = null,
  onGenerate = null
}) => {
  const qrRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrText, setQrText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [compteur, setCompteur] = useState(1);

  // Récupérer l'utilisateur courant et le compteur
  useEffect(() => {
    const fetchUserAndCounter = async () => {
      try {
        const token = localStorage.getItem('userId');
        const userResponse = await fetch('http://localhost:3001/api/auth/current-user', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        const userData = await userResponse.json();
        if (userData.success && userData.user) {
          setCurrentUser(userData.user);
          
          // Récupérer le compteur pour ce type
          const typeLabels = {
            hotel: 'Hôtel',
            'grand-surface': 'Grand Surface',
            bus: 'Bus',
            nightclub: 'Night club',
            media: 'Média',
            occ: 'OCC'
          };
          
          const typeName = typeLabels[type] || type;
          const counterResponse = await fetch(`http://localhost:3001/api/users/dossier-counter/${userData.user.id}/${typeName}`);
          const counterData = await counterResponse.json();
          if (counterData.success) {
            setCompteur(counterData.compteur + 1);
          }
        }
      } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
      }
    };
    fetchUserAndCounter();
  }, [type]);

  // Fonction pour formater la date depuis la base de données
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

  // Fonction pour formater la date en JJ/MM/AAAA
  const formatDateForReference = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Génération du texte pour le QR code selon le type - FORMAT DEMANDÉ
  const generateQRTextContent = (usager, type) => {
    if (!usager) return '© OMDA - Document officiel';
    
    const userId = currentUser?.id || '1';
    const dateStr = formatDateForReference();
    // Utiliser le compteur ou l'ID de l'usager
    const compteurValue = compteur || usager.id || 1;
    const andReference = `AND ${dateStr}-${compteurValue}`;
    
    let typePrefix = '';

    switch(type) {
      case 'occ':
        typePrefix = 'OCC';
        // Organisateurs: utiliser organisateurs ou demandeur
        const organisateurs = usager.organisateurs || usager.demandeur || 'Non spécifié';
        
        // Artistes: récupérer depuis artistes_detail ou artistesList ou artistes
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
        } else if (usager.paiements && usager.paiements.length > 0) {
          const dernierPaiement = usager.paiements.sort((a, b) => 
            new Date(b.date_paiement) - new Date(a.date_paiement)
          )[0];
          if (dernierPaiement) {
            anneePaiementHotel = new Date(dernierPaiement.date_paiement).getFullYear();
          }
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
        } else if (usager.paiements && usager.paiements.length > 0) {
          const dernierPaiement = usager.paiements.sort((a, b) => 
            new Date(b.date_paiement) - new Date(a.date_paiement)
          )[0];
          if (dernierPaiement) {
            anneePaiementGS = new Date(dernierPaiement.date_paiement).getFullYear();
          }
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
        } else if (usager.paiements && usager.paiements.length > 0) {
          const dernierPaiement = usager.paiements.sort((a, b) => 
            new Date(b.date_paiement) - new Date(a.date_paiement)
          )[0];
          if (dernierPaiement) {
            anneePaiementBus = new Date(dernierPaiement.date_paiement).getFullYear();
          }
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
        } else if (usager.paiements && usager.paiements.length > 0) {
          const dernierPaiement = usager.paiements.sort((a, b) => 
            new Date(b.date_paiement) - new Date(a.date_paiement)
          )[0];
          if (dernierPaiement) {
            anneePaiementNC = new Date(dernierPaiement.date_paiement).getFullYear();
          }
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
        } else if (usager.paiements && usager.paiements.length > 0) {
          const dernierPaiement = usager.paiements.sort((a, b) => 
            new Date(b.date_paiement) - new Date(a.date_paiement)
          )[0];
          if (dernierPaiement) {
            anneePaiementMedia = new Date(dernierPaiement.date_paiement).getFullYear();
          }
        }
        
        return `${typePrefix} : ${nomMedia}, Adresse: ${adresseMedia}, Canal/Fréquence: ${canal}, Validation année: ${anneePaiementMedia}, ${andReference}`;

      default:
        return `© OMDA - Document officiel, ${andReference}`;
    }
  };

  useEffect(() => {
    if (usager) {
      const text = generateQRTextContent(usager, type);
      setQrText(text);
    }
  }, [usager, type, currentUser, compteur]);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleDownload = async () => {
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
      
      if (onGenerate) onGenerate();
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement du QR code');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!usager) {
    return (
      <div className="qr-generate-overlay">
        <div className="qr-generate-modal">
          <div className="qr-modal-body">
            <p>Aucun usager sélectionné</p>
          </div>
        </div>
      </div>
    );
  }

  // Fonction pour obtenir les noms des artistes formatés
  const getArtistesFormatted = () => {
    if (usager.artistes_detail && usager.artistes_detail.length > 0) {
      return usager.artistes_detail.map(a => a.nom).join(', ');
    }
    if (usager.artistesList && usager.artistesList.length > 0) {
      return usager.artistesList.map(a => a.nom).join(', ');
    }
    if (usager.artistes && usager.artistes !== '' && usager.artistes !== 'Non spécifié') {
      return usager.artistes;
    }
    return null;
  };

  const getEventName = () => {
    if (type === 'occ') {
      return usager.organisateurs || usager.demandeur || usager.nom_evenement || 'ÉVÉNEMENT';
    } else {
      return usager.denomination || usager.nom || 'ENTREPRISE';
    }
  };

  const getLieu = () => {
    if (type === 'occ') {
      return usager.lieu_evenement || 'Lieu non spécifié';
    } else {
      return usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
    }
  };

  const getDate = () => {
    if (type === 'occ') {
      return formatDisplayDate(usager.date_evenement);
    } else {
      return formatDisplayDate(usager.created_at);
    }
  };

  const getTypeLabel = () => {
    const labels = {
      hotel: 'Hôtel',
      'grand-surface': 'Grande Surface',
      bus: 'Bus',
      nightclub: 'Night Club',
      media: 'Média',
      occ: 'OCC'
    };
    return labels[type] || type;
  };

  const getSubTitle = () => {
    if (type === 'occ') {
      return 'affirme un événement';
    } else if (type === 'hotel') {
      return 'Autorisation d\'exploitation - Hôtel';
    } else if (type === 'grand-surface') {
      return 'Autorisation commerciale - Grande Surface';
    } else if (type === 'bus') {
      return 'Autorisation de transport - Bus';
    } else if (type === 'nightclub') {
      return 'Autorisation d\'exploitation - Night Club';
    } else if (type === 'media') {
      return 'Autorisation de diffusion - Média';
    } else {
      return 'Autorisation';
    }
  };

  const artistesFormatted = getArtistesFormatted();
  const dateStr = formatDateForReference();
  const compteurValue = compteur || usager.id || 1;
  const referenceText = `AND ${dateStr}-${compteurValue}`;

  return (
    <div className="qr-generate-overlay">
      <div className="qr-generate-modal">
        <div className="qr-modal-header">
          <div className="qr-modal-title">
            <span className="qr-title-icon">🔐</span>
            <h3>Génération du QR Code</h3>
          </div>
          <button className="qr-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="qr-modal-body">
          <div className="qr-usager-info">
            <div className="qr-usager-name">
              {getEventName()}
            </div>
            <div className="qr-usager-details">
              <span>📋 {usager.numero_dossier_utilisateur || 'N° dossier'}</span>
              <span>📞 {usager.telephone || 'Téléphone'}</span>
              <span>🏷️ {getTypeLabel()}</span>
            </div>
          </div>

          <div className="qr-code-wrapper" ref={qrRef}>
            <div className="qr-red-border">
              <div className="qr-code-container">
                <QRCodeCanvas
                  value={qrText}
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
            
            <div className="qr-text-container">
              <div className="qr-text-main">
                © OMDA - {getSubTitle()}
              </div>
              <div className="qr-text-event">
                {getEventName()}
              </div>
              {type === 'occ' && (
                <>
                  {usager.organisateurs && (
                    <div className="qr-text-occ-infos">
                      Organisateurs: {usager.organisateurs}
                    </div>
                  )}
                  {artistesFormatted && (
                    <div className="qr-text-occ-infos">
                      Artistes: {artistesFormatted}
                    </div>
                  )}
                  {usager.genre_manifestation && (
                    <div className="qr-text-occ-infos">
                      Genre: {usager.genre_manifestation}
                    </div>
                  )}
                </>
              )}
              {type === 'hotel' && usager.etoiles && (
                <div className="qr-text-occ-infos">
                  Étoiles: {usager.etoiles}⭐
                </div>
              )}
              {type === 'grand-surface' && usager.nombre_magasins && (
                <div className="qr-text-occ-infos">
                  Nb magasins: {usager.nombre_magasins}
                </div>
              )}
              {type === 'bus' && usager.nombre_vehicules && (
                <div className="qr-text-occ-infos">
                  Nb bus: {usager.nombre_vehicules} | Lignes: {usager.lignes || 'Non spécifiées'}
                </div>
              )}
              {type === 'nightclub' && usager.jauge_max && (
                <div className="qr-text-occ-infos">
                  Jauge: {usager.jauge_max} | Horaires: {usager.horaires || 'Non spécifiés'}
                </div>
              )}
              {type === 'media' && usager.canal && (
                <div className="qr-text-occ-infos">
                  Canal/Fréquence: {usager.canal}
                </div>
              )}
              <div className="qr-text-lieu">
                📍 {getLieu()}
              </div>
              <div className="qr-text-date">
                📅 {getDate()}
              </div>
              <div className="qr-text-reference">
                🔗 {referenceText}
              </div>
            </div>
          </div>
        </div>

        <div className="qr-modal-footer">
          <button className="qr-btn qr-btn-secondary" onClick={onClose}>
            Fermer
          </button>
          <button className="qr-btn qr-btn-print" onClick={handlePrint}>
            🖨️ Imprimer
          </button>
          <button 
            className="qr-btn qr-btn-primary" 
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? '⏳ Téléchargement...' : '📥 Télécharger'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateQRCode;