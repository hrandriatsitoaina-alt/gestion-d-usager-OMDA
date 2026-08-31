// src/pages/ConfirmationDossier.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import {
  FileText, Receipt, QrCode, Download, Printer, CheckCircle, XCircle,
  Info, AlertCircle, Building2, User, Phone, MapPin, Calendar, Star,
  Hotel, Store, Bus, PartyPopper, Tv2, Ticket, File, ArrowLeft,
  Clock, CreditCard, FileCheck, Loader2, FileSignature
} from 'lucide-react';
import '../styles/confirmation-dossier.css';
import MiniSidebar from '../components/MiniSidebar';
import { useToast } from '../components/Toast';

// Import des générateurs PDF
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
  const showToast = useToast();
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
  const [isCreatingFacture, setIsCreatingFacture] = useState(false);

  // Mapping des types
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

  // ✅ Fonction pour récupérer TOUS les artistes depuis la base de données
  const fetchArtistesForEvent = async (eventId) => {
    try {
      console.log('🔍 Récupération des artistes pour l\'événement ID:', eventId);
      const response = await fetch(`http://localhost:3001/api/occ/artistes/details/${eventId}`);
      const data = await response.json();
      if (data.success && data.artistes) {
        console.log('✅ Artistes récupérés:', data.artistes);
        return data;
      }
      return { artistes: [], artistesNames: [], artistesString: '', count: 0 };
    } catch (error) {
      console.error('❌ Erreur récupération artistes:', error);
      return { artistes: [], artistesNames: [], artistesString: '', count: 0 };
    }
  };

  // ✅ Fonction pour récupérer TOUS les artistes depuis différentes sources
  const getArtistes = (usager) => {
    let artistesList = [];
    
    console.log('🔍 RECHERCHE DES ARTISTES DANS USAGER:', {
      hasArtistesDetail: !!usager?.artistes_detail,
      hasOtherArtistsDetail: !!usager?.otherArtistsDetail,
      hasArtistesList: !!usager?.artistesList,
      hasArtistes: !!usager?.artistes
    });
    
    // 1. Vérifier artistes_detail (de la base via event_artistes)
    if (usager?.artistes_detail && Array.isArray(usager.artistes_detail) && usager.artistes_detail.length > 0) {
      console.log('✅ artistes_detail trouvé:', usager.artistes_detail);
      artistesList = usager.artistes_detail.map(a => {
        if (a.nom && a.prenom) return `${a.prenom} ${a.nom}`;
        if (a.nom) return a.nom;
        return a;
      }).filter(Boolean);
    }
    
    // 2. Vérifier otherArtistsDetail (de OccAjout)
    if (artistesList.length === 0 && usager?.otherArtistsDetail && Array.isArray(usager.otherArtistsDetail) && usager.otherArtistsDetail.length > 0) {
      console.log('✅ otherArtistsDetail trouvé:', usager.otherArtistsDetail);
      artistesList = usager.otherArtistsDetail.map(a => {
        if (a.nom && a.prenom) return `${a.prenom} ${a.nom}`;
        if (a.nom) return a.nom;
        return a;
      }).filter(Boolean);
    }
    
    // 3. Vérifier artistesList
    if (artistesList.length === 0 && usager?.artistesList && Array.isArray(usager.artistesList) && usager.artistesList.length > 0) {
      console.log('✅ artistesList trouvé:', usager.artistesList);
      artistesList = usager.artistesList.map(a => {
        if (a.nom && a.prenom) return `${a.prenom} ${a.nom}`;
        if (a.nom) return a.nom;
        return a;
      }).filter(Boolean);
    }
    
    // 4. Vérifier artistes (champ texte simple)
    if (artistesList.length === 0 && usager?.artistes && usager.artistes !== '' && usager.artistes !== 'Non spécifié') {
      console.log('✅ artistes (texte) trouvé:', usager.artistes);
      const artistesStr = usager.artistes;
      if (artistesStr.includes(',')) {
        artistesList = artistesStr.split(',').map(a => a.trim()).filter(Boolean);
      } else if (artistesStr.includes(' et ')) {
        artistesList = artistesStr.split(' et ').map(a => a.trim()).filter(Boolean);
      } else {
        artistesList = [artistesStr];
      }
    }
    
    console.log('🎵 Artistes finaux:', artistesList);
    return artistesList;
  };

  // ✅ Fonction pour obtenir les artistes formatés pour le QR Code
  const getArtistesForQR = (usager) => {
    const artistesList = getArtistes(usager);
    if (artistesList.length === 0) return 'Aucun artiste spécifié';
    return artistesList.join(', ');
  };

  // Effet pour récupérer l'usager
  useEffect(() => {
    const loadUsager = async () => {
      const state = location.state;
      console.log('📍 State reçu dans ConfirmationDossier:', state);

      if (state && state.usager) {
        let usagerData = state.usager;
        
        // ✅ Si c'est un OCC, récupérer les artistes depuis la base
        if (state.type === 'occ' && usagerData.id) {
          try {
            console.log('🔍 Récupération des artistes pour OCC ID:', usagerData.id);
            const artistesData = await fetchArtistesForEvent(usagerData.id);
            if (artistesData.artistes && artistesData.artistes.length > 0) {
              usagerData = {
                ...usagerData,
                artistes_detail: artistesData.artistes,
                artistesList: artistesData.artistes,
                artistesString: artistesData.artistesString
              };
              console.log('🎵 Artistes ajoutés à l\'usager:', artistesData.artistes);
            } else {
              console.log('⚠️ Aucun artiste trouvé pour cet événement');
            }
          } catch (error) {
            console.error('❌ Erreur récupération artistes:', error);
          }
        }
        
        setUsager(usagerData);
        setUsagerType(state.type || 'hotel');
        setLoading(false);
      } else {
        const savedUsager = sessionStorage.getItem('lastUsager');
        if (savedUsager) {
          try {
            const parsed = JSON.parse(savedUsager);
            let usagerData = parsed.usager;
            
            if (parsed.type === 'occ' && usagerData.id) {
              try {
                const artistesData = await fetchArtistesForEvent(usagerData.id);
                if (artistesData.artistes && artistesData.artistes.length > 0) {
                  usagerData = {
                    ...usagerData,
                    artistes_detail: artistesData.artistes,
                    artistesList: artistesData.artistes,
                    artistesString: artistesData.artistesString
                  };
                }
              } catch (error) {
                console.error('❌ Erreur récupération artistes:', error);
              }
            }
            
            setUsager(usagerData);
            setUsagerType(parsed.type || 'hotel');
            setLoading(false);
            return;
          } catch (e) {}
        }
        console.warn('⚠️ Aucune donnée usager trouvée, redirection vers dashboard');
        navigate('/dashboard');
      }
    };
    
    loadUsager();
  }, [location]);

  // Récupérer l'utilisateur courant
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('userId');
        const response = await fetch('http://localhost:3001/api/auth/current-user', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
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

  // Fonctions utilitaires
  const formatDateForQR = (dateString) => {
    if (!dateString) return 'Date non specifiee';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date non specifiee';
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch { return 'Date non specifiee'; }
  };

  const formatDateForReference = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // ✅ QR CODE avec TOUS les artistes
  const generateQRTextContent = (usager, type) => {
    if (!usager) return 'OMDA - Document officiel';
    
    const dateStr = formatDateForReference();
    const compteurValue = usager.id || 1;
    const andReference = `AND ${dateStr}-${compteurValue}`;
    const omdaPhone = '034 05 533 88';
    const omdaRegion = 'Analamanga';
    
    let lines = [];
    let typePrefix = '';
    let nomPrincipal = '';

    switch(type) {
      case 'occ':
        typePrefix = 'OCC';
        nomPrincipal = usager.organisateurs || usager.demandeur || 'Non specifie';
        const dateEvent = usager.date_evenement ? formatDateForQR(usager.date_evenement) : '';
        const lieu = usager.lieu_evenement || usager.adresse || '';
        const evenement = usager.genreManifestation || usager.nom_evenement || '';
        const region = usager.region || 'Non specifiee';
        
        // ✅ Récupérer TOUS les artistes (priorité à artistes_detail de la base)
        let artistesStr = 'Aucun artiste spécifié';
        if (usager.artistes_detail && Array.isArray(usager.artistes_detail) && usager.artistes_detail.length > 0) {
          artistesStr = usager.artistes_detail.map(a => {
            if (a.nom && a.prenom) return `${a.prenom} ${a.nom}`;
            if (a.nom) return a.nom;
            return a;
          }).join(', ');
        } else {
          // Fallback: chercher dans d'autres sources
          const fallbackArtistes = getArtistes(usager);
          if (fallbackArtistes.length > 0) {
            artistesStr = fallbackArtistes.join(', ');
          }
        }
        
        lines = [
          `OMDA affirme un evenement ${typePrefix}`,
          `Organisateur : ${nomPrincipal}`,
        ];
        if (evenement) {
          lines.push(`Evenement : ${evenement}`);
        }
        if (artistesStr && artistesStr !== 'Aucun artiste spécifié') {
          lines.push(`Artistes : ${artistesStr}`);
        }
        if (lieu) {
          lines.push(`Lieu : ${lieu}`);
        }
        if (dateEvent) {
          lines.push(`Date : ${dateEvent}`);
        }
        lines.push(
          `Region : ${region}`,
          `Ref : ${andReference}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;

      case 'hotel':
        typePrefix = 'HOTEL';
        nomPrincipal = usager.denomination || usager.nom || 'Non specifie';
        const adresseHotel = usager.adresse_siege || usager.ville || usager.adresse || '';
        const etoiles = usager.etoiles ? `⭐`.repeat(parseInt(usager.etoiles) || 0) : '';
        const demandeurH = usager.demandeur || '';
        const regionH = usager.region || 'Non specifiee';
        
        lines = [
          `OMDA affirme un etablissement ${typePrefix}`,
          `Nom : ${nomPrincipal}`,
        ];
        if (adresseHotel) {
          lines.push(`Adresse : ${adresseHotel}`);
        }
        if (etoiles) {
          lines.push(`Etoiles : ${etoiles}`);
        }
        if (demandeurH) {
          lines.push(`Demandeur : ${demandeurH}`);
        }
        lines.push(
          `Region : ${regionH}`,
          `Ref : ${andReference}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;

      case 'grand-surface':
        typePrefix = 'MAGASIN';
        nomPrincipal = usager.denomination || usager.nom || 'Non specifie';
        const adresseGS = usager.adresse_siege || usager.ville || usager.adresse || '';
        const nbMagasins = usager.nombre_magasins || 0;
        const demandeurGS = usager.demandeur || '';
        const regionGS = usager.region || 'Non specifiee';
        
        lines = [
          `OMDA affirme un etablissement ${typePrefix}`,
          `Nom : ${nomPrincipal}`,
        ];
        if (adresseGS) {
          lines.push(`Adresse : ${adresseGS}`);
        }
        if (nbMagasins > 0) {
          lines.push(`Nb magasins : ${nbMagasins}`);
        }
        if (demandeurGS) {
          lines.push(`Demandeur : ${demandeurGS}`);
        }
        lines.push(
          `Region : ${regionGS}`,
          `Ref : ${andReference}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;

      case 'bus':
        typePrefix = 'BUS';
        nomPrincipal = usager.denomination || usager.nom || 'Non specifie';
        const adresseBus = usager.adresse_siege || usager.ville || usager.adresse || '';
        const lignes = usager.lignes || '';
        const nbVehicules = usager.nombre_vehicules || 0;
        const demandeurB = usager.demandeur || '';
        const regionB = usager.region || 'Non specifiee';
        
        lines = [
          `OMDA affirme une societe ${typePrefix}`,
          `Nom : ${nomPrincipal}`,
        ];
        if (adresseBus) {
          lines.push(`Adresse : ${adresseBus}`);
        }
        if (lignes) {
          lines.push(`Lignes : ${lignes}`);
        }
        if (nbVehicules > 0) {
          lines.push(`Vehicules : ${nbVehicules}`);
        }
        if (demandeurB) {
          lines.push(`Demandeur : ${demandeurB}`);
        }
        lines.push(
          `Region : ${regionB}`,
          `Ref : ${andReference}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;

      case 'nightclub':
        typePrefix = 'NIGHT CLUB';
        nomPrincipal = usager.denomination || usager.nom || 'Non specifie';
        const adresseNC = usager.adresse_siege || usager.ville || usager.adresse || '';
        const jauge = usager.jauge_max || 0;
        const horaires = usager.horaires || '';
        const demandeurN = usager.demandeur || '';
        const regionN = usager.region || 'Non specifiee';
        
        lines = [
          `OMDA affirme un etablissement ${typePrefix}`,
          `Nom : ${nomPrincipal}`,
        ];
        if (adresseNC) {
          lines.push(`Adresse : ${adresseNC}`);
        }
        if (jauge > 0) {
          lines.push(`Jauge : ${jauge} pers.`);
        }
        if (horaires) {
          lines.push(`Horaires : ${horaires}`);
        }
        if (demandeurN) {
          lines.push(`Demandeur : ${demandeurN}`);
        }
        lines.push(
          `Region : ${regionN}`,
          `Ref : ${andReference}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;

      case 'media':
        typePrefix = 'MEDIA';
        nomPrincipal = usager.denomination || usager.nom || 'Non specifie';
        const adresseMedia = usager.siege || usager.adresse_siege || usager.ville || usager.adresse || '';
        const frequence = usager.frequence || '';
        const canal = usager.canal || '';
        const demandeurM = usager.demandeur || usager.proprietaire_nom || '';
        const regionM = usager.region || 'Non specifiee';
        
        lines = [
          `OMDA affirme une station ${typePrefix}`,
          `Nom : ${nomPrincipal}`,
        ];
        if (adresseMedia) {
          lines.push(`Siege : ${adresseMedia}`);
        }
        if (frequence) {
          lines.push(`Frequence : ${frequence}`);
        }
        if (canal) {
          lines.push(`Canal : ${canal}`);
        }
        if (demandeurM) {
          lines.push(`Proprietaire : ${demandeurM}`);
        }
        lines.push(
          `Region : ${regionM}`,
          `Ref : ${andReference}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;

      default:
        typePrefix = type || 'Inconnu';
        nomPrincipal = usager.denomination || usager.demandeur || 'Non specifie';
        const regionD = usager.region || 'Non specifiee';
        lines = [
          `OMDA affirme un document ${typePrefix}`,
          `Nom : ${nomPrincipal}`,
          `Region : ${regionD}`,
          `Ref : ${andReference}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        ];
    }
    
    return lines.join('\n');
  };

  // ✅ Génération du QR Code avec récupération des artistes depuis la base
  const handleGenerateQR = async () => {
    if (!usager) return;
    
    setIsGenerating(true);
    setNotification({ type: 'info', message: '🔄 Génération du QR Code...' });
    
    try {
      // ✅ Si c'est un OCC, récupérer les artistes depuis la base
      let usagerComplet = { ...usager };
      
      if (usagerType === 'occ' && usager.id) {
        console.log('🔍 Récupération des artistes pour l\'événement OCC ID:', usager.id);
        const artistesData = await fetchArtistesForEvent(usager.id);
        if (artistesData.artistes && artistesData.artistes.length > 0) {
          usagerComplet.artistes_detail = artistesData.artistes;
          usagerComplet.artistesList = artistesData.artistes;
          usagerComplet.artistesString = artistesData.artistesString;
          console.log('🎵 Artistes récupérés depuis la base:', artistesData.artistes);
        } else {
          console.log('⚠️ Aucun artiste trouvé pour cet événement');
        }
      }
      
      const qrText = generateQRTextContent(usagerComplet, usagerType);
      setQrCodeData({ usager: usagerComplet, type: usagerType, qrText });
      setShowQrModal(true);
      setNotification({ type: 'success', message: '✅ QR Code généré avec succès' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('❌ Erreur génération QR Code:', error);
      setNotification({ type: 'error', message: '❌ Erreur génération du QR Code' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Génération du contrat
  const handleGenerateContrat = async () => {
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
      setNotification({ type: 'info', message: '🔄 Génération du contrat...' });

      switch(usagerType) {
        case 'hotel': generateHotelPDF(usager, pdfData); break;
        case 'grand-surface': generateMagasinPDF(usager, pdfData); break;
        case 'media': generateMediaPDF(usager, pdfData); break;
        case 'nightclub': generateNightPDF(usager, pdfData); break;
        case 'bus': generateBusPDF(usager, pdfData); break;
        case 'occ': await generateOccPDF(usager, pdfData); break;
        default: generateHotelPDF(usager, pdfData);
      }

      setValidatedDossiers(prev => ({ ...prev, 'Contrat': true }));
      setNotification({ type: 'success', message: '✅ Contrat généré avec succès' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', message: '❌ Erreur génération du contrat' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Génération de la facture simple
  const handleGenerateFacture = async () => {
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
      setNotification({ type: 'info', message: '🔄 Génération de la facture...' });
      await generateFacturePDF(usager, pdfData, usagerType);
      
      setValidatedDossiers(prev => ({ ...prev, 'Facture': true }));
      setNotification({ type: 'success', message: '✅ Facture générée avec succès' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', message: '❌ Erreur génération de la facture' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

// Dans ConfirmationDossier.jsx - remplacer handleGenerateFactureAvancee par ceci

// CRÉER LA FACTURE AVANCÉE - VERSION CORRIGÉE
const handleGenerateFactureAvancee = async () => {
  if (!usager || !currentUser) {
    showToast('Utilisateur non identifié', 'error');
    return;
  }
  
  setIsCreatingFacture(true);
  
  try {
    setNotification({ type: 'info', message: '🔄 Création de la facture avancée...' });
    
    let montantMensuel = 0;
    let fraisDossier = 5000;
    let montantRetard = 0;
    let isRetard = false;
    let uniter = 1;
    let soitTotal = 0;

    // ✅ RÉCUPÉRER LES MONTANTS SELON LE TYPE
    switch(usagerType) {
      case 'hotel':
      case 'grand-surface':
      case 'nightclub':
        montantMensuel = parseFloat(usager.montant_mensuel) || 0;
        fraisDossier = parseFloat(usager.frais_dossier) || 5000;
        uniter = parseInt(usager.uniter) || 1;
        soitTotal = (montantMensuel * uniter) + fraisDossier;
        break;

      case 'media':
        montantMensuel = parseFloat(usager.taux) || 0;
        fraisDossier = parseFloat(usager.frais_dossier) || 5000;
        uniter = parseInt(usager.uniter) || 1;
        soitTotal = (montantMensuel * uniter) + fraisDossier;
        break;

      case 'bus':
        montantMensuel = parseFloat(usager.montant_mensuel) || 0;
        fraisDossier = parseFloat(usager.frais_dossier) || 5000;
        uniter = parseInt(usager.uniter) || 1;
        soitTotal = (montantMensuel * uniter) + fraisDossier;
        break;

      case 'occ':
        montantMensuel = parseFloat(usager.montant) || parseFloat(usager.montant_total) || 0;
        fraisDossier = parseFloat(usager.frais_dossier) || 5000;
        montantRetard = parseFloat(usager.montant_retard) || 0;
        isRetard = usager.is_retard || false;
        uniter = parseInt(usager.uniter) || 1;
        const baseTotal = (montantMensuel * uniter) + fraisDossier;
        soitTotal = isRetard ? baseTotal + montantRetard : baseTotal;
        break;

      default:
        montantMensuel = parseFloat(usager.montant_mensuel) || 0;
        fraisDossier = parseFloat(usager.frais_dossier) || 5000;
        uniter = parseInt(usager.uniter) || 1;
        soitTotal = (montantMensuel * uniter) + fraisDossier;
    }

    console.log('📊 MONTANTS POUR FACTURE:', {
      usagerType,
      montantMensuel,
      fraisDossier,
      montantRetard,
      isRetard,
      uniter,
      soitTotal
    });

    const response = await fetch('http://localhost:3001/api/factures/creer', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'adminToken': localStorage.getItem('adminToken') || ''
      },
      body: JSON.stringify({
        usagerId: usager.id,
        usagerType: usagerType,
        userId: currentUser.id,
        typeFacture: 'Redevances',
        regionUsager: usager.region || '',
        personneRecu: currentUser.nom || 'DAF',
        montantMensuel: montantMensuel,
        fraisDossier: fraisDossier,
        montantRetard: montantRetard,
        isRetard: isRetard,
        uniter: uniter,
        soitTotal: soitTotal
      })
    });
    
    // ✅ Vérifier si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Réponse serveur non OK:', errorText);
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      setNotification({ type: 'success', message: '✅ Facture avancée créée avec succès' });
      setValidatedDossiers(prev => ({ ...prev, 'Facture': true }));
      showToast('✅ Facture avancée créée avec succès', 'success');
      
      setTimeout(() => {
        navigate('/generation-facture', {
          state: { factureId: data.factureId }
        });
      }, 500);
    } else {
      setNotification({ type: 'error', message: '❌ ' + data.message });
      showToast('❌ ' + data.message, 'error');
    }
  } catch (error) {
    console.error('❌ Erreur création facture avancée:', error);
    
    let errorMessage = 'Erreur de création de la facture';
    if (error.message.includes('404')) {
      errorMessage = 'Route API non trouvée. Vérifiez que le serveur est démarré.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Erreur interne du serveur. Vérifiez les logs.';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur est démarré sur le port 3001.';
    } else if (error.message.includes('colonne')) {
      errorMessage = 'Erreur de base de données. Vérifiez la structure de la table facture_usager.';
    }
    
    setNotification({ type: 'error', message: '❌ ' + errorMessage });
    showToast('❌ ' + errorMessage, 'error');
  } finally {
    setIsCreatingFacture(false);
  }
};

  // Tout générer
  const handleGenerateAll = async () => {
    await handleGenerateContrat();
    setTimeout(() => handleGenerateQR(), 500);
  };

  const handleDownloadQR = async () => {
    if (!qrRef.current) {
      showToast('QR code non disponible', 'error');
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
      showToast('✅ QR Code téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      showToast('❌ Erreur téléchargement QR Code', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintQR = () => window.print();

  const handleGoDashboard = () => navigate('/dashboard');

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateString; }
  };

  if (loading) {
    return (
      <>
        <MiniSidebar />
        <div className="confirmation-loading">
          <Loader2 size={48} className="spinner" strokeWidth={1.5} />
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
          <AlertCircle size={48} strokeWidth={1.5} />
          <p>Aucun usager trouvé</p>
          <button onClick={handleGoDashboard} className="btn-retour">Retour au tableau de bord</button>
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
      <main className="confirmation-dossier-container">
        {notification && (
          <div className={`notif ${notification.type}`}>
            <span>
              {notification.type === 'success' && <CheckCircle size={20} />}
              {notification.type === 'info' && <Info size={20} />}
              {notification.type === 'error' && <XCircle size={20} />}
            </span>
            <span>{notification.message}</span>
            <button className="notif-close" onClick={() => setNotification(null)}>×</button>
          </div>
        )}

        <div className="confirmation-card">
          {/* Header */}
          <div className="confirmation-header">
            <div className="header-left">
              <div className="header-icon-wrapper" style={{ background: color }}>
                <IconComponent size={28} color="#fff" strokeWidth={1.5} />
              </div>
              <div>
                <h1>Confirmation du dossier</h1>
                <p className="header-subtitle">
                  {typeLabels[usagerType] || 'Usager'} ajouté avec succès – Téléchargez les documents ci-dessous.
                </p>
              </div>
            </div>
            <div className="header-badge" style={{ background: bgColor, color: color }}>
              <span>{typeLabels[usagerType] || 'Usager'}</span>
            </div>
          </div>

          {/* Carte usager */}
          <div className="usager-info-card" style={{ borderColor: color, background: bgColor }}>
            <div className="usager-info-grid">
              <div className="info-item">
                <span className="info-label"><FileText size={16} strokeWidth={1.5} /> ID</span>
                <span className="info-value">#{String(usager.id).padStart(3, '0')}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Building2 size={16} strokeWidth={1.5} /> Dénomination</span>
                <span className="info-value">{usager.denomination || usager.nom_evenement || usager.organisateurs || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><User size={16} strokeWidth={1.5} /> Demandeur</span>
                <span className="info-value">{usager.demandeur || usager.organisateurs || usager.representant_par || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Phone size={16} strokeWidth={1.5} /> Téléphone</span>
                <span className="info-value">{usager.telephone || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><MapPin size={16} strokeWidth={1.5} /> Région</span>
                <span className="info-value">{usager.region || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Calendar size={16} strokeWidth={1.5} /> Date création</span>
                <span className="info-value">{formatDate(usager.created_at) || formatDate(new Date())}</span>
              </div>
              {usagerType === 'occ' && (
                <>
                  <div className="info-item">
                    <span className="info-label"><Ticket size={16} strokeWidth={1.5} /> Genre manifestation</span>
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
                  {/* ✅ Affichage des artistes dans la carte info */}
                  {usager.artistes_detail && usager.artistes_detail.length > 0 && (
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="info-label"><User size={16} strokeWidth={1.5} /> Artistes</span>
                      <span className="info-value" style={{ fontSize: '14px' }}>
                        {usager.artistes_detail.map((a, i) => (
                          <span key={i}>
                            {a.prenom ? `${a.prenom} ${a.nom}` : a.nom}
                            {i < usager.artistes_detail.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </>
              )}
              {usager.etoiles && (
                <div className="info-item">
                  <span className="info-label"><Star size={16} strokeWidth={1.5} /> Étoiles</span>
                  <span className="info-value">{'⭐'.repeat(parseInt(usager.etoiles) || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="documents-card">
            <h3><FileText size={20} strokeWidth={1.5} /> Documents disponibles</h3>
            <p className="documents-subtitle">Générez et téléchargez les documents du dossier</p>

            <div className="documents-grid">
              {/* Contrat */}
              <div className="doc-item" onClick={handleGenerateContrat}>
                <div className="doc-icon"><FileSignature size={24} strokeWidth={1.5} color={color} /></div>
                <div className="doc-info">
                  <span className="doc-name">Contrat de représentation</span>
                  <span className="doc-size">PDF • Cliquer pour générer</span>
                </div>
                <div className="doc-status">
                  {validatedDossiers['Contrat'] ? (
                    <span className="badge-success"><CheckCircle size={18} color="#27ae60" /></span>
                  ) : (
                    <button className="btn-generate">
                      <FileSignature size={16} strokeWidth={2} /> Générer contrat
                    </button>
                  )}
                </div>
              </div>

              {/* Facture */}
              <div className="doc-item">
                <div className="doc-icon"><Receipt size={24} strokeWidth={1.5} color={color} /></div>
                <div className="doc-info">
                  <span className="doc-name">Facture officielle</span>
                  <span className="doc-size">PDF • Cliquer pour générer</span>
                </div>
                <div className="doc-status">
                  <button
                    className="btn-facture-avancee"
                    onClick={handleGenerateFactureAvancee}
                    disabled={isCreatingFacture}
                  >
                    {isCreatingFacture ? (
                      <><Loader2 size={18} className="spinner" strokeWidth={2} /> Création...</>
                    ) : (
                      <><Receipt size={18} strokeWidth={2} /> Facture Avancée</>
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="doc-item" onClick={handleGenerateQR}>
                <div className="doc-icon"><QrCode size={24} strokeWidth={1.5} color={color} /></div>
                <div className="doc-info">
                  <span className="doc-name">QR Code sécurisé</span>
                  <span className="doc-size">PNG • Cliquer pour générer</span>
                </div>
                <div className="doc-status">
                  {validatedDossiers['QR Code'] ? (
                    <span className="badge-success"><CheckCircle size={18} color="#27ae60" /></span>
                  ) : (
                    <button className="btn-generate">
                      <QrCode size={16} strokeWidth={2} /> Générer code qr
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons en bas */}
            <div className="documents-actions">
              <button
                className="btn-generate-all"
                onClick={handleGenerateAll}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <><Loader2 size={18} className="spinner" strokeWidth={2} /> Génération...</>
                ) : (
                  <><FileCheck size={18} strokeWidth={2} /> Tout générer</>
                )}
              </button>

              <button className="btn-dashboard" onClick={handleGoDashboard}>
                <ArrowLeft size={18} strokeWidth={2} /> Retour Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* MODALE QR CODE */}
        {showQrModal && qrCodeData && (
          <div className="modal-overlay qr-modal-overlay" onClick={() => setShowQrModal(false)}>
            <div className="modal-content qr-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header qr-modal-header">
                <h3><QrCode size={20} strokeWidth={1.5} /> QR Code OMDA</h3>
                <button className="modal-close" onClick={() => setShowQrModal(false)}>×</button>
              </div>

              <div className="qr-body">
                <div className="qr-preview-container" ref={qrRef}>
                  <div className="qr-code-wrapper-only">
                    <div className="qr-red-border">
                      <div className="qr-code-container">
                        <QRCodeCanvas
                          value={qrCodeData.qrText}
                          size={240}
                          bgColor="#ffffff"
                          fgColor="#dc2626"
                          level="L"
                          includeMargin={true}
                        />
                        <div className="qr-logo-styled">
                          <div className="qr-logo-circle">
                            <img src="/logo.ico" alt="OMDA" className="qr-logo-img" />
                          </div>
                        </div>
                      </div>
                      <div className="qr-omda-footer">OFFICE MALAGASY DU  <br /> DROIT D'AUTEUR</div>
                    </div>
                  </div>
                </div>

                {/* ✅ Affichage du contenu avec TOUS les artistes */}
                <div className="qr-data-preview">
                  <p className="qr-data-title">📋 Contenu :</p>
                  <div className="qr-data-content">
                    {qrCodeData.qrText.split('\n').map((line, index) => {
                      if (!line.trim()) return null;
                      // Mettre en évidence la ligne des artistes
                      if (line.toLowerCase().includes('artistes')) {
                        return <div key={index} className="qr-artist-line"><strong>{line}</strong></div>;
                      }
                      return <div key={index}>{line}</div>;
                    })}
                  </div>
                </div>

                <div className="qr-actions-only">
                  <button className="btn-cancel" onClick={() => setShowQrModal(false)}>Fermer</button>
                  {/* <button className="btn-print-qr-only" onClick={handlePrintQR}>
                    <Printer size={18} strokeWidth={2} /> Imprimer
                  </button> */}
                  <button
                    className="btn-download-qr-only"
                    onClick={handleDownloadQR}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <><Loader2 size={18} className="spinner" strokeWidth={2} /> Téléchargement...</>
                    ) : (
                      <><Download size={18} strokeWidth={2} /> Téléchargers</>
                    )}
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