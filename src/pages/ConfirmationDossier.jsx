// src/pages/ConfirmationDossier.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import {
  FileText, Receipt, QrCode, Download, Printer, CheckCircle, XCircle,
  Info, AlertCircle, Building2, User, Phone, MapPin, Calendar, Star,
  Hotel, Store, Bus, PartyPopper, Tv2, Ticket, File, ArrowLeft,
  Clock, CreditCard, FileCheck, Loader2, FileSignature,
} from 'lucide-react';
import '../styles/confirmation-dossier.css';
import MiniSidebar from '../components/MiniSidebar';
import { useToast } from '../components/Toast';
// ✅ Hook unique de traduction
import { useT } from '../hooks/useT';

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

  // ✅ LANGUE UNIQUE — vient du Context
  const { t, langue } = useT();

  // ✅ Locale pour formatage
  const locale = useMemo(() => {
    if (langue === 'en') return 'en-US';
    if (langue === 'mg') return 'fr-MG';
    return 'fr-FR';
  }, [langue]);

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

  const [factureAvanceeCreee, setFactureAvanceeCreee] = useState(false);
  const [contratGenere, setContratGenere] = useState(false);
  const [qrGenere, setQrGenere] = useState(false);

  // ✅ Labels de type traduits
  const typeLabels = useMemo(() => ({
    hotel: t('Hôtel', 'Hotely', 'Hotel'),
    'grand-surface': t('Grande Surface', 'Fivarotana lehibe', 'Large Store'),
    bus: t('Bus', 'Bus', 'Bus'),
    nightclub: t('Night Club', 'Club alina', 'Night Club'),
    media: t('Média', 'Haino aman-jery', 'Media'),
    occ: t('Occasionnel', 'Fotoana manokana', 'Occasional'),
  }), [t]);

  const typeIcons = {
    hotel: Hotel,
    'grand-surface': Store,
    bus: Bus,
    nightclub: PartyPopper,
    media: Tv2,
    occ: Ticket,
  };

  const typeColors = {
    hotel: '#4A90D9',
    'grand-surface': '#27ae60',
    bus: '#f39c12',
    nightclub: '#8e44ad',
    media: '#e74c3c',
    occ: '#1abc9c',
  };

  const typeBgColors = {
    hotel: '#E8F0FE',
    'grand-surface': '#E8F8ED',
    bus: '#FFF8E1',
    nightclub: '#F3E5F5',
    media: '#FDE8E8',
    occ: '#E0F7F4',
  };

  const fetchArtistesForEvent = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/occ/artistes/details/${eventId}`);
      const data = await response.json();
      if (data.success && data.artistes) {
        return data;
      }
      return { artistes: [], artistesNames: [], artistesString: '', count: 0 };
    } catch (error) {
      console.error('❌ Erreur récupération artistes:', error);
      return { artistes: [], artistesNames: [], artistesString: '', count: 0 };
    }
  };

  const getArtistes = (usager) => {
    let artistesList = [];

    if (usager?.artistes_detail && Array.isArray(usager.artistes_detail) && usager.artistes_detail.length > 0) {
      artistesList = usager.artistes_detail.map(a => {
        if (a.nom && a.prenom) return `${a.prenom} ${a.nom}`;
        if (a.nom) return a.nom;
        return a;
      }).filter(Boolean);
    }

    if (artistesList.length === 0 && usager?.otherArtistsDetail && Array.isArray(usager.otherArtistsDetail) && usager.otherArtistsDetail.length > 0) {
      artistesList = usager.otherArtistsDetail.map(a => {
        if (a.nom && a.prenom) return `${a.prenom} ${a.nom}`;
        if (a.nom) return a.nom;
        return a;
      }).filter(Boolean);
    }

    if (artistesList.length === 0 && usager?.artistesList && Array.isArray(usager.artistesList) && usager.artistesList.length > 0) {
      artistesList = usager.artistesList.map(a => {
        if (a.nom && a.prenom) return `${a.prenom} ${a.nom}`;
        if (a.nom) return a.nom;
        return a;
      }).filter(Boolean);
    }

    if (artistesList.length === 0 && usager?.artistes && usager.artistes !== '' && usager.artistes !== 'Non spécifié') {
      const artistesStr = usager.artistes;
      if (artistesStr.includes(',')) {
        artistesList = artistesStr.split(',').map(a => a.trim()).filter(Boolean);
      } else if (artistesStr.includes(' et ')) {
        artistesList = artistesStr.split(' et ').map(a => a.trim()).filter(Boolean);
      } else {
        artistesList = [artistesStr];
      }
    }

    return artistesList;
  };

  const getArtistesForQR = (usager) => {
    const artistesList = getArtistes(usager);
    if (artistesList.length === 0) return t('Aucun artiste spécifié', 'Tsy misy mpihira voafaritra', 'No artist specified');
    return artistesList.join(', ');
  };

  useEffect(() => {
    const loadUsager = async () => {
      const state = location.state;

      if (state && state.usager) {
        let usagerData = state.usager;

        if (state.type === 'occ' && usagerData.id) {
          try {
            const artistesData = await fetchArtistesForEvent(usagerData.id);
            if (artistesData.artistes && artistesData.artistes.length > 0) {
              usagerData = {
                ...usagerData,
                artistes_detail: artistesData.artistes,
                artistesList: artistesData.artistes,
                artistesString: artistesData.artistesString,
              };
            }
          } catch (error) {
            console.error('❌ Erreur récupération artistes:', error);
          }
        }

        setUsager(usagerData);
        setUsagerType(state.type || 'hotel');

        try {
          sessionStorage.setItem('lastUsager', JSON.stringify({ usager: usagerData, type: state.type || 'hotel' }));
        } catch (e) {
          console.warn('⚠️ Impossible de sauvegarder lastUsager en sessionStorage:', e);
        }

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
                    artistesString: artistesData.artistesString,
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
          } catch (e) { /* ignore */ }
        }
        navigate('/dashboard');
      }
    };

    loadUsager();
  }, [location, navigate]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('userId');
        const response = await fetch('http://localhost:3001/api/auth/current-user', {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
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

  useEffect(() => {
    if (usager && usager.id && usagerType) {
      const keyFacture = `facture_avancee_${usagerType}_${usager.id}`;
      const factureDejaCreee = localStorage.getItem(keyFacture);
      if (factureDejaCreee === 'true') {
        setFactureAvanceeCreee(true);
        setValidatedDossiers(prev => ({ ...prev, FactureAvancee: true }));
      }

      const keyContrat = `contrat_genere_${usagerType}_${usager.id}`;
      const contratDejaGenere = localStorage.getItem(keyContrat);
      if (contratDejaGenere === 'true') {
        setContratGenere(true);
        setValidatedDossiers(prev => ({ ...prev, Contrat: true }));
      }

      const keyQr = `qr_genere_${usagerType}_${usager.id}`;
      const qrDejaGenere = localStorage.getItem(keyQr);
      if (qrDejaGenere === 'true') {
        setQrGenere(true);
        setValidatedDossiers(prev => ({ ...prev, 'QR Code': true }));
      }
    }
  }, [usager, usagerType]);

  // ✅ Format date pour QR (avec locale)
  const formatDateForQR = useCallback((dateString) => {
    if (!dateString) return t('Date non spécifiée', 'Daty tsy voafaritra', 'Date not specified');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('Date non spécifiée', 'Daty tsy voafaritra', 'Date not specified');
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return t('Date non spécifiée', 'Daty tsy voafaritra', 'Date not specified');
    }
  }, [locale, t]);

  const formatDateForReference = useCallback(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // ✅ QR CODE traduit
  const generateQRTextContent = useCallback((usager, type) => {
    if (!usager) return `OMDA - ${t('Document officiel', 'Rakitra ofisialy', 'Official document')}`;

    const numeroDossier = usager.numero_dossier_utilisateur || `ID-${usager.id}`;
    const omdaPhone = '034 05 533 88';
    const omdaRegion = 'Analamanga';
    const notSpecified = t('Non spécifié', 'Tsy voafaritra', 'Not specified');
    const notSpecifiedF = t('Non spécifiée', 'Tsy voafaritra', 'Not specified');

    let lines = [];
    let typePrefix = '';

    switch (type) {
      case 'occ': {
        typePrefix = 'OCC';
        const nomPrincipal = usager.organisateurs || usager.demandeur || notSpecified;
        const dateEvent = usager.date_evenement ? formatDateForQR(usager.date_evenement) : '';
        const lieu = usager.lieu_evenement || usager.adresse || '';
        const evenement = usager.genreManifestation || usager.nom_evenement || '';
        const region = usager.region || notSpecifiedF;

        let artistesStr = t('Aucun artiste spécifié', 'Tsy misy mpihira voafaritra', 'No artist specified');
        if (usager.artistes_detail && Array.isArray(usager.artistes_detail) && usager.artistes_detail.length > 0) {
          artistesStr = usager.artistes_detail.map(a => {
            if (a.nom && a.prenom) return `${a.prenom} ${a.nom}`;
            if (a.nom) return a.nom;
            return a;
          }).join(', ');
        } else {
          const fallbackArtistes = getArtistes(usager);
          if (fallbackArtistes.length > 0) {
            artistesStr = fallbackArtistes.join(', ');
          }
        }

        lines = [
          `OMDA ${t('affirme un evenement', 'manamarina hetsika', 'certifies an event')} ${typePrefix}`,
          `${t('Organisateur', 'Mpikarakara', 'Organizer')} : ${nomPrincipal}`,
        ];
        if (evenement) lines.push(`${t('Evenement', 'Hetsika', 'Event')} : ${evenement}`);
        if (artistesStr && artistesStr !== t('Aucun artiste spécifié', 'Tsy misy mpihira voafaritra', 'No artist specified')) {
          lines.push(`${t('Artistes', 'Mpihira', 'Artists')} : ${artistesStr}`);
        }
        if (lieu) lines.push(`${t('Lieu', 'Toerana', 'Location')} : ${lieu}`);
        if (dateEvent) lines.push(`${t('Date', 'Daty', 'Date')} : ${dateEvent}`);
        lines.push(
          `${t('Region', 'Faritra', 'Region')} : ${region}`,
          `Ref : ${numeroDossier}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;
      }

      case 'hotel': {
        typePrefix = 'HOTEL';
        const denominationHotel = usager.denomination || usager.nom || notSpecified;
        const adresseHotel = usager.adresse_siege || usager.ville || usager.adresse || '';
        const etoiles = usager.etoiles ? `${usager.etoiles} ${t('etoile(s)', 'kintana', 'star(s)')}` : '';
        const regionH = usager.region || notSpecifiedF;

        lines = [
          `OMDA ${t('affirme un etablissement', 'manamarina trano', 'certifies an establishment')} ${typePrefix}`,
          `${t('Denomination', 'Anarana', 'Name')} : ${denominationHotel}`,
        ];
        if (adresseHotel) lines.push(`${t('Adresse', 'Adiresy', 'Address')} : ${adresseHotel}`);
        if (etoiles) lines.push(`${t('Categorie', 'Sokajy', 'Category')} : ${etoiles}`);
        lines.push(
          `${t('Region', 'Faritra', 'Region')} : ${regionH}`,
          `Ref : ${numeroDossier}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;
      }

      case 'grand-surface': {
        typePrefix = 'MAGASIN';
        const denominationGS = usager.denomination || usager.nom || notSpecified;
        const adresseGS = usager.adresse_siege || usager.ville || usager.adresse || '';
        const nbMagasins = usager.nombre_magasins || 0;
        const regionGS = usager.region || notSpecifiedF;

        lines = [
          `OMDA ${t('affirme un etablissement', 'manamarina trano', 'certifies an establishment')} ${typePrefix}`,
          `${t('Denomination', 'Anarana', 'Name')} : ${denominationGS}`,
        ];
        if (adresseGS) lines.push(`${t('Adresse', 'Adiresy', 'Address')} : ${adresseGS}`);
        if (nbMagasins > 0) lines.push(`${t('Nb magasins', 'Isan\'ny fivarotana', 'Stores')} : ${nbMagasins}`);
        lines.push(
          `${t('Region', 'Faritra', 'Region')} : ${regionGS}`,
          `Ref : ${numeroDossier}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;
      }

      case 'bus': {
        typePrefix = 'BUS';
        const denominationBus = usager.denomination || usager.nom || notSpecified;
        const adresseBus = usager.adresse_siege || usager.ville || usager.adresse || '';
        const lignes = usager.lignes || '';
        const nbVehicules = usager.nombre_vehicules || 0;
        const regionB = usager.region || notSpecifiedF;

        lines = [
          `OMDA ${t('affirme une societe', 'manamarina orinasa', 'certifies a company')} ${typePrefix}`,
          `${t('Denomination', 'Anarana', 'Name')} : ${denominationBus}`,
        ];
        if (adresseBus) lines.push(`${t('Adresse', 'Adiresy', 'Address')} : ${adresseBus}`);
        if (lignes) lines.push(`${t('Lignes', 'Lalana', 'Lines')} : ${lignes}`);
        if (nbVehicules > 0) lines.push(`${t('Vehicules', 'Fiara', 'Vehicles')} : ${nbVehicules}`);
        lines.push(
          `${t('Region', 'Faritra', 'Region')} : ${regionB}`,
          `Ref : ${numeroDossier}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;
      }

      case 'nightclub': {
        typePrefix = 'NIGHT CLUB';
        const denominationNC = usager.denomination || usager.nom || notSpecified;
        const adresseNC = usager.adresse_siege || usager.ville || usager.adresse || '';
        const jauge = usager.jauge_max || 0;
        const horaires = usager.horaires || '';
        const regionN = usager.region || notSpecifiedF;

        lines = [
          `OMDA ${t('affirme un etablissement', 'manamarina trano', 'certifies an establishment')} ${typePrefix}`,
          `${t('Denomination', 'Anarana', 'Name')} : ${denominationNC}`,
        ];
        if (adresseNC) lines.push(`${t('Adresse', 'Adiresy', 'Address')} : ${adresseNC}`);
        if (jauge > 0) lines.push(`${t('Jauge', 'Fahaiza-mandray', 'Capacity')} : ${jauge} ${t('pers.', 'olona', 'people')}`);
        if (horaires) lines.push(`${t('Horaires', 'Ora', 'Hours')} : ${horaires}`);
        lines.push(
          `${t('Region', 'Faritra', 'Region')} : ${regionN}`,
          `Ref : ${numeroDossier}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;
      }

      case 'media': {
        typePrefix = 'MEDIA';
        const denominationMedia = usager.denomination || usager.nom || notSpecified;
        const adresseMedia = usager.siege || usager.adresse_siege || usager.ville || usager.adresse || '';
        const frequence = usager.frequence || '';
        const canal = usager.canal || '';
        const regionM = usager.region || notSpecifiedF;

        lines = [
          `OMDA ${t('affirme une station', 'manamarina station', 'certifies a station')} ${typePrefix}`,
          `${t('Denomination', 'Anarana', 'Name')} : ${denominationMedia}`,
        ];
        if (adresseMedia) lines.push(`${t('Siege', 'Foibe', 'Head office')} : ${adresseMedia}`);
        if (frequence) lines.push(`${t('Frequence', 'Fahita', 'Frequency')} : ${frequence}`);
        if (canal) lines.push(`${t('Canal', 'Fantsona', 'Channel')} : ${canal}`);
        lines.push(
          `${t('Region', 'Faritra', 'Region')} : ${regionM}`,
          `Ref : ${numeroDossier}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`
        );
        break;
      }

      default: {
        typePrefix = type || t('Inconnu', 'Tsy fantatra', 'Unknown');
        const denominationD = usager.denomination || usager.nom || notSpecified;
        const regionD = usager.region || notSpecifiedF;
        lines = [
          `OMDA ${t('affirme un document', 'manamarina rakitra', 'certifies a document')} ${typePrefix}`,
          `${t('Denomination', 'Anarana', 'Name')} : ${denominationD}`,
          `${t('Region', 'Faritra', 'Region')} : ${regionD}`,
          `Ref : ${numeroDossier}`,
          `© OMDA ${omdaRegion} - Tel : ${omdaPhone}`,
        ];
      }
    }

    return lines.join('\n');
  }, [t, formatDateForQR, formatDateForReference]);

  const handleGenerateQR = async () => {
    if (!usager) return;

    if (qrGenere) {
      let usagerComplet = { ...usager };
      if (usagerType === 'occ' && usager.id) {
        const artistesData = await fetchArtistesForEvent(usager.id);
        if (artistesData.artistes && artistesData.artistes.length > 0) {
          usagerComplet.artistes_detail = artistesData.artistes;
          usagerComplet.artistesList = artistesData.artistes;
        }
      }
      const qrText = generateQRTextContent(usagerComplet, usagerType);
      setQrCodeData({ usager: usagerComplet, type: usagerType, qrText });
      setShowQrModal(true);
      return;
    }

    setIsGenerating(true);
    setNotification({ type: 'info', message: `🔄 ${t('Génération du QR Code...', 'Famokarana QR Code...', 'Generating QR Code...')}` });

    try {
      let usagerComplet = { ...usager };

      if (usagerType === 'occ' && usager.id) {
        const artistesData = await fetchArtistesForEvent(usager.id);
        if (artistesData.artistes && artistesData.artistes.length > 0) {
          usagerComplet.artistes_detail = artistesData.artistes;
          usagerComplet.artistesList = artistesData.artistes;
          usagerComplet.artistesString = artistesData.artistesString;
        }
      }

      const qrText = generateQRTextContent(usagerComplet, usagerType);
      setQrCodeData({ usager: usagerComplet, type: usagerType, qrText });
      setShowQrModal(true);

      const keyQr = `qr_genere_${usagerType}_${usager.id}`;
      localStorage.setItem(keyQr, 'true');
      setQrGenere(true);
      setValidatedDossiers(prev => ({ ...prev, 'QR Code': true }));

      setNotification({ type: 'success', message: `✅ ${t('QR Code généré avec succès', 'Vita ny QR Code', 'QR Code generated successfully')}` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('❌ Erreur génération QR Code:', error);
      setNotification({ type: 'error', message: `❌ ${t('Erreur génération du QR Code', 'Nisy olana tamin\'ny famokarana QR Code', 'QR Code generation error')}` });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateContrat = async () => {
    if (!usager) return;

    if (contratGenere) {
      showToast(t(
        '✅ Le contrat a déjà été généré pour ce dossier',
        '✅ Efa vita ny fifanarahana ho an\'ity rakitra ity',
        '✅ The contract has already been generated for this file'
      ), 'success');
      return;
    }

    setIsGenerating(true);

    const pdfData = {
      date: usager.created_at || new Date().toISOString().split('T')[0],
      annee: new Date().getFullYear(),
      montant: usager.montant_mensuel || usager.montant_total || 0,
      nombreMois: 1,
      montantMensuel: usager.montant_mensuel || 0,
    };

    try {
      setNotification({ type: 'info', message: `🔄 ${t('Génération du contrat...', ' Fifanarahana...', 'Generating contract...')}` });

      switch (usagerType) {
        case 'hotel': generateHotelPDF(usager, pdfData); break;
        case 'grand-surface': generateMagasinPDF(usager, pdfData); break;
        case 'media': generateMediaPDF(usager, pdfData); break;
        case 'nightclub': generateNightPDF(usager, pdfData); break;
        case 'bus': generateBusPDF(usager, pdfData); break;
        case 'occ': await generateOccPDF(usager, pdfData); break;
        default: generateHotelPDF(usager, pdfData);
      }

      const keyContrat = `contrat_genere_${usagerType}_${usager.id}`;
      localStorage.setItem(keyContrat, 'true');
      setContratGenere(true);
      setValidatedDossiers(prev => ({ ...prev, Contrat: true }));

      setNotification({ type: 'success', message: `✅ ${t('Contrat généré avec succès', 'Vita ny fifanarahana', 'Contract generated successfully')}` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', message: `❌ ${t('Erreur génération du contrat', 'Nisy olana tamin\'ny famokarana fifanarahana', 'Contract generation error')}` });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFacture = async () => {
    if (!usager) return;
    setIsGenerating(true);

    const pdfData = {
      date: usager.created_at || new Date().toISOString().split('T')[0],
      annee: new Date().getFullYear(),
      montant: usager.montant_mensuel || usager.montant_total || 0,
      nombreMois: 1,
      montantMensuel: usager.montant_mensuel || 0,
    };

    try {
      setNotification({ type: 'info', message: `🔄 ${t('Génération de la facture...', 'Famokarana ny faktiora...', 'Generating invoice...')}` });
      await generateFacturePDF(usager, pdfData, usagerType);

      setValidatedDossiers(prev => ({ ...prev, Facture: true }));
      setNotification({ type: 'success', message: `✅ ${t('Facture générée avec succès', 'Vita ny faktiora', 'Invoice generated successfully')}` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', message: `❌ ${t('Erreur génération de la facture', 'Nisy olana tamin\'ny famokarana faktiora', 'Invoice generation error')}` });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFactureAvancee = async () => {
    const key = usager?.id ? `facture_avancee_${usagerType}_${usager.id}` : null;
    if (factureAvanceeCreee || (key && localStorage.getItem(key) === 'true')) {
      showToast(t(
        '⚠️ La facture avancée a déjà été créée pour ce dossier',
        '⚠️ Efa vita ny faktiora mandroso ho an\'ity rakitra ity',
        '⚠️ Advanced invoice already created for this file'
      ), 'warning');
      setFactureAvanceeCreee(true);
      setValidatedDossiers(prev => ({ ...prev, FactureAvancee: true }));
      return;
    }

    if (!usager || !currentUser) {
      showToast(t('Utilisateur non identifié', 'Tsy fantatra ny mpampiasa', 'User not identified'), 'error');
      return;
    }

    setIsCreatingFacture(true);

    try {
      setNotification({ type: 'info', message: `🔄 ${t('Création de la facture avancée...', 'Famoronana faktiora mandroso...', 'Creating advanced invoice...')}` });

      let montantMensuel = 0;
      let fraisDossier = 5000;
      let montantRetard = 0;
      let isRetard = false;
      let uniter = 1;
      let soitTotal = 0;

      switch (usagerType) {
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

      const response = await fetch('http://localhost:3001/api/factures/creer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          adminToken: localStorage.getItem('adminToken') || '',
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
          soitTotal: soitTotal,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        if (key) localStorage.setItem(key, 'true');
        setFactureAvanceeCreee(true);
        setValidatedDossiers(prev => ({ ...prev, FactureAvancee: true }));
        setNotification({ type: 'success', message: `✅ ${t('Facture avancée créée avec succès', 'Vita ny faktiora mandroso', 'Advanced invoice created successfully')}` });
        showToast(t('✅ Facture avancée créée avec succès', '✅ Vita ny faktiora mandroso', '✅ Advanced invoice created successfully'), 'success');

        setTimeout(() => {
          navigate('/generation-facture', { state: { factureId: data.factureId } });
        }, 500);
      } else {
        setNotification({ type: 'error', message: `❌ ${data.message}` });
        showToast(`❌ ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('❌ Erreur création facture avancée:', error);
      let errorMessage = t('Erreur de création de la facture', 'Nisy olana tamin\'ny famoronana faktiora', 'Invoice creation error');
      if (error.message.includes('404')) {
        errorMessage = t('Route API non trouvée. Vérifiez que le serveur est démarré.', 'Tsy hita ny lalana API.', 'API route not found.');
      } else if (error.message.includes('500')) {
        errorMessage = t('Erreur interne du serveur.', 'Nisy olana tao amin\'ny server.', 'Server internal error.');
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = t('Impossible de se connecter au serveur.', 'Tsy afaka mifandray amin\'ny server.', 'Cannot connect to server.');
      }
      setNotification({ type: 'error', message: `❌ ${errorMessage}` });
      showToast(`❌ ${errorMessage}`, 'error');
    } finally {
      setIsCreatingFacture(false);
    }
  };

  const allDocumentsGenerated = () => {
    return (
      validatedDossiers.Contrat === true &&
      validatedDossiers.FactureAvancee === true &&
      validatedDossiers['QR Code'] === true
    );
  };

  const handleDownloadQR = async () => {
    if (!qrRef.current) {
      showToast(t('QR code non disponible', 'QR code tsy misy', 'QR code not available'), 'error');
      return;
    }
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(qrRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `qr-code-omda-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast(t('✅ QR Code téléchargé avec succès', '✅ Vita ny fakana QR Code', '✅ QR Code downloaded successfully'), 'success');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      showToast(t('❌ Erreur téléchargement QR Code', '❌ Nisy olana tamin\'ny fakana QR Code', '❌ QR Code download error'), 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintQR = () => window.print();

  const handleGoDashboard = () => {
    if (!allDocumentsGenerated()) {
      showToast(t(
        '⚠️ Veuillez générer le Contrat, la Facture et le QR Code avant de retourner à l\'accueil',
        '⚠️ Hamorona ny Fifanarahana, Faktiora ary QR Code aloha vao miverina any amin\'ny fandraisana',
        '⚠️ Please generate the Contract, Invoice and QR Code before returning home'
      ), 'warning');
      return;
    }
    navigate('/dashboard');
  };

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  }, [locale]);

  if (loading) {
    return (
      <>
        <MiniSidebar />
        <div className="confirmation-loading">
          <Loader2 size={48} className="spinner" strokeWidth={1.5} />
          <p>{t('Chargement du dossier...', 'Maka ny rakitra...', 'Loading file...')}</p>
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
          <p>{t('Aucun usager trouvé', 'Tsy misy mpampiasa hita', 'No user found')}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-retour">
            {t('Retour au tableau de bord', 'Hiverina amin\'ny tabilao', 'Back to dashboard')}
          </button>
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
        <style>{`
          .btn-retour-accueil {
            display: none;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 28px;
            background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
            color: #ffffff;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.3px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(39, 174, 96, 0.35);
            font-family: inherit;
          }
          .btn-retour-accueil.visible { display: inline-flex; animation: fadeInUp 0.4s ease-out; }
          .btn-retour-accueil:hover {
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(39, 174, 96, 0.45);
          }
          .btn-retour-accueil:active { transform: translateY(0); box-shadow: 0 3px 8px rgba(39, 174, 96, 0.35); }
          .btn-retour-accueil svg { transition: transform 0.3s ease; }
          .btn-retour-accueil:hover svg { transform: translateX(-4px); }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

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
          <div className="confirmation-header">
            <div className="header-left">
              <div className="header-icon-wrapper" style={{ background: color }}>
                <IconComponent size={28} color="#fff" strokeWidth={1.5} />
              </div>
              <div>
                <h1>{t('Confirmation du dossier', 'Fanamarinana ny rakitra', 'File confirmation')}</h1>
                <p className="header-subtitle">
                  {typeLabels[usagerType] || t('Usager', 'Mpampiasa', 'User')} {t('ajouté avec succès – Téléchargez les documents ci-dessous.', 'nampiana soa aman-tsara – Alaina ny rakitra etsy ambany.', 'added successfully – Download documents below.')}
                </p>
              </div>
            </div>
            <div className="header-badge" style={{ background: bgColor, color: color }}>
              <span>{typeLabels[usagerType] || t('Usager', 'Mpampiasa', 'User')}</span>
            </div>
          </div>

          <div className="usager-info-card" style={{ borderColor: color, background: bgColor }}>
            <div className="usager-info-grid">
              <div className="info-item">
                <span className="info-label"><FileText size={16} strokeWidth={1.5} /> ID</span>
                <span className="info-value">#{String(usager.id).padStart(3, '0')}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Building2 size={16} strokeWidth={1.5} /> {t('Dénomination', 'Anarana', 'Name')}</span>
                <span className="info-value">{usager.denomination || usager.nom_evenement || usager.organisateurs || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><User size={16} strokeWidth={1.5} /> {t('Demandeur', 'Mpangataka', 'Applicant')}</span>
                <span className="info-value">{usager.demandeur || usager.organisateurs || usager.representant_par || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Phone size={16} strokeWidth={1.5} /> {t('Téléphone', 'Finday', 'Phone')}</span>
                <span className="info-value">{usager.telephone || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><MapPin size={16} strokeWidth={1.5} /> {t('Région', 'Faritra', 'Region')}</span>
                <span className="info-value">{usager.region || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Calendar size={16} strokeWidth={1.5} /> {t('Date création', 'Daty namoronana', 'Creation date')}</span>
                <span className="info-value">{formatDate(usager.created_at) || formatDate(new Date())}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="info-label"><FileText size={16} strokeWidth={1.5} /> {t('Numéro de dossier', 'Laharana rakitra', 'File number')}</span>
                <span className="info-value" style={{ fontWeight: 'bold', color: color }}>
                  {usager.numero_dossier_utilisateur || t('Non défini', 'Tsy voafaritra', 'Not defined')}
                </span>
              </div>
              {usagerType === 'occ' && (
                <>
                  <div className="info-item">
                    <span className="info-label"><Ticket size={16} strokeWidth={1.5} /> {t('Genre manifestation', 'Karazana hetsika', 'Event type')}</span>
                    <span className="info-value">{usager.genre_manifestation || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><Calendar size={16} strokeWidth={1.5} /> {t('Date événement', 'Daty hetsika', 'Event date')}</span>
                    <span className="info-value">{formatDate(usager.date_evenement) || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><MapPin size={16} strokeWidth={1.5} /> {t('Lieu', 'Toerana', 'Location')}</span>
                    <span className="info-value">{usager.lieu_evenement || '-'}</span>
                  </div>
                  {usager.artistes_detail && usager.artistes_detail.length > 0 && (
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="info-label"><User size={16} strokeWidth={1.5} /> {t('Artistes', 'Mpihira', 'Artists')}</span>
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
                  <span className="info-label"><Star size={16} strokeWidth={1.5} /> {t('Étoiles', 'Kintana', 'Stars')}</span>
                  <span className="info-value">{'⭐'.repeat(parseInt(usager.etoiles) || 0)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="documents-card">
            <h3><FileText size={20} strokeWidth={1.5} /> {t('Documents disponibles', 'Rakitra misy', 'Available documents')}</h3>
            <p className="documents-subtitle">
              {t('Générez et téléchargez les documents du dossier', 'Mamorona sy maka ny rakitry ny rakitra', 'Generate and download file documents')}
            </p>

            <div className="documents-grid">
              <div className="doc-item" onClick={handleGenerateContrat}>
                <div className="doc-icon"><FileSignature size={24} strokeWidth={1.5} color={color} /></div>
                <div className="doc-info">
                  <span className="doc-name">{t('Contrat de représentation', 'Fifanarahana fisolo tena', 'Representation contract')}</span>
                  <span className="doc-size">PDF • {t('Cliquer pour générer', 'Tsindrio hamorona', 'Click to generate')}</span>
                </div>
                <div className="doc-status">
                  {contratGenere ? (
                    <span className="badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#e8f5e9', borderRadius: '6px', color: '#2e7d32' }}>
                      <CheckCircle size={18} color="#27ae60" />
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('Contrat généré', 'Vita ny fifanarahana', 'Contract generated')}</span>
                    </span>
                  ) : (
                    <button className="btn-generate">
                      <FileSignature size={16} strokeWidth={2} /> {t('Générer contrat', 'Fifanarahana', 'Generate contract')}
                    </button>
                  )}
                </div>
              </div>

              <div className="doc-item">
                <div className="doc-icon"><Receipt size={24} strokeWidth={1.5} color={color} /></div>
                <div className="doc-info">
                  <span className="doc-name">{t('Facture officielle', 'Faktiora ofisialy', 'Official invoice')}</span>
                  <span className="doc-size">PDF • {t('Cliquer pour générer', 'Tsindrio hamorona', 'Click to generate')}</span>
                </div>
                <div className="doc-status">
                  {factureAvanceeCreee ? (
                    <span className="badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#e8f5e9', borderRadius: '6px', color: '#2e7d32' }}>
                      <CheckCircle size={18} color="#27ae60" />
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('Facture créée', 'Vita ny faktiora', 'Invoice created')}</span>
                    </span>
                  ) : (
                    <button className="btn-facture-avancee" onClick={handleGenerateFactureAvancee} disabled={isCreatingFacture}>
                      {isCreatingFacture
                        ? <><Loader2 size={18} className="spinner" strokeWidth={2} /> {t('Création...', 'Famoronana...', 'Creating...')}</>
                        : <><Receipt size={18} strokeWidth={2} /> {t('Facture Avancée', 'Faktiora mandroso', 'Advanced Invoice')}</>}
                    </button>
                  )}
                </div>
              </div>

              <div className="doc-item" onClick={handleGenerateQR}>
                <div className="doc-icon"><QrCode size={24} strokeWidth={1.5} color={color} /></div>
                <div className="doc-info">
                  <span className="doc-name">{t('QR Code sécurisé', 'QR Code azo antoka', 'Secure QR Code')}</span>
                  <span className="doc-size">PNG • {t('Cliquer pour générer', 'Tsindrio hamorona', 'Click to generate')}</span>
                </div>
                <div className="doc-status">
                  {qrGenere ? (
                    <span className="badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#e8f5e9', borderRadius: '6px', color: '#2e7d32' }}>
                      <CheckCircle size={18} color="#27ae60" />
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('QR généré', 'Vita ny QR', 'QR generated')}</span>
                    </span>
                  ) : (
                    <button className="btn-generate">
                      <QrCode size={16} strokeWidth={2} /> {t('Générer code qr', 'Hamorona code qr', 'Generate QR code')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="documents-actions">
              <button className={`btn-retour-accueil ${allDocumentsGenerated() ? 'visible' : ''}`} onClick={handleGoDashboard}>
                <ArrowLeft size={18} strokeWidth={2} /> {t('Retour à l\'accueil', 'Hiverina any amin\'ny fandraisana', 'Back to home')}
              </button>
            </div>

            {!allDocumentsGenerated() && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fff8e1', border: '1px solid #f39c12', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#7a5c00' }}>
                <AlertCircle size={16} color="#f39c12" />
                <span>
                  {t('Veuillez générer tous les documents obligatoires avant de retourner à l\'accueil. Restant :', 'Hamorona ny rakitra rehetra ilaina aloha vao miverina any amin\'ny fandraisana. Sisa :', 'Please generate all required documents before returning home. Remaining:')}
                  {!validatedDossiers.Contrat && ` ${t('Contrat', 'Fifanarahana', 'Contract')},`}
                  {!validatedDossiers.FactureAvancee && ` ${t('Facture', 'Faktiora', 'Invoice')},`}
                  {!validatedDossiers['QR Code'] && ` QR Code,`}
                  {' '}
                </span>
              </div>
            )}
          </div>
        </div>

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
                        <QRCodeCanvas value={qrCodeData.qrText} size={240} bgColor="#ffffff" fgColor="#dc2626" level="L" includeMargin={true} />
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

                <div className="qr-data-preview">
                  <p className="qr-data-title">📋 {t('Contenu', 'Votoatiny', 'Content')} :</p>
                  <div className="qr-data-content">
                    {qrCodeData.qrText.split('\n').map((line, index) => {
                      if (!line.trim()) return null;
                      if (line.toLowerCase().includes('artistes') || line.toLowerCase().includes('mpihira')) {
                        return <div key={index} className="qr-artist-line"><strong>{line}</strong></div>;
                      }
                      return <div key={index}>{line}</div>;
                    })}
                  </div>
                </div>

                <div className="qr-actions-only">
                  <button className="btn-cancel" onClick={() => setShowQrModal(false)}>
                    {t('Fermer', 'Hidio', 'Close')}
                  </button>
                  <button className="btn-download-qr-only" onClick={handleDownloadQR} disabled={isDownloading}>
                    {isDownloading
                      ? <><Loader2 size={18} className="spinner" strokeWidth={2} /> {t('Téléchargement...', 'Maka...', 'Downloading...')}</>
                      : <><Download size={18} strokeWidth={2} /> {t('Télécharger', 'Alaina', 'Download')}</>}
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