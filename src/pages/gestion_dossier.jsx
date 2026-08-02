// src/pages/GestionDossier.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import '../styles/gestion_dossier.css';
import MiniSidebar from '../components/MiniSidebar';

// Importations des générateurs de PDF
import { generateHotelPDF } from './pdf/hotel_pdf';
import { generateMagasinPDF } from './pdf/magasin_pdf';
import { generateMediaPDF } from './pdf/media_pdf';
import { generateNightPDF } from './pdf/night_pdf';
import { generateBusPDF } from './pdf/bus_pdf';
import { generateOccPDF } from './pdf/occ_pdf';
import { generateFacturePDF } from './pdf/facture_pdf';

const GestionDossier = () => {
  const navigate = useNavigate();
  const qrRef = useRef(null);
  
  // Navigation
  const [currentPath, setCurrentPath] = useState('OMDA /');
  const [viewMode, setViewMode] = useState('root');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États des usagers
  const [usagers, setUsagers] = useState([]);
  const [filteredUsagers, setFilteredUsagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modale d'impression
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState(null);
  const [activeUsager, setActiveUsager] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedUsagerForDetails, setSelectedUsagerForDetails] = useState(null);
  const [showUsagerDetails, setShowUsagerDetails] = useState(false);

  const [validatedDossiers, setValidatedDossiers] = useState({});
  const [stats, setStats] = useState(null);
  const [qrCompteur, setQrCompteur] = useState(1);

  // Mapping des catégories
  const categoryMapping = {
    'Occasionnelle': 'occ',
    'Tele / Radio': 'media',
    'Magasin/Autre': 'grand-surface',
    'Night-Club': 'nightclub',
    'Hotel': 'hotel',
    'Transport': 'bus'
  };

  const typeColors = {
    'occ': '#f59e0b',
    'media': '#f43f5e',
    'grand-surface': '#8b5cf6',
    'nightclub': '#ec4899',
    'hotel': '#6366f1',
    'transport': '#06b6d4'
  };

  const typeIcons = {
    'occ': '🎪',
    'media': '📺',
    'grand-surface': '🏬',
    'nightclub': '🎭',
    'hotel': '🏨',
    'transport': '🚌'
  };

  // Dossiers utilitaires avec détails
  const utilityFolders = [
    { 
      id: 'bilan', 
      name: '📊 Bilan Annuel', 
      icon: '📊', 
      color: '#2ecc71', 
      desc: 'Résumé financier de l\'année',
      details: {
        title: 'Bilan Annuel 2025',
        content: 'Rapport financier complet de l\'Office Malagasy du Droit d\'Auteur pour l\'année 2025.',
        sections: [
          '📈 Recettes totales: 2 450 000 000 Ar',
          '📉 Dépenses totales: 1 800 000 000 Ar',
          '💰 Bénéfice net: 650 000 000 Ar',
          '📊 Nombre de dossiers traités: 1 245',
          '🏢 Nombre d\'usagers actifs: 3 789'
        ],
        files: ['Rapport_2024.pdf', 'Statistiques.pdf', 'Graphiques.pdf']
      }
    },
    { 
      id: 'rapport', 
      name: '📈 Rapport Mensuel', 
      icon: '📈', 
      color: '#3498db', 
      desc: 'Statistiques mensuelles',
      details: {
        title: 'Rapport Mensuel - Juin 2026',
        content: 'Statistiques et indicateurs de performance pour le mois de juin 2026.',
        sections: [
          '📊 Dossiers créés: 145',
          '✅ Dossiers validés: 132',
          '💰 Revenus du mois: 325 000 000 Ar',
          '📋 Taux de validation: 91%',
          '👥 Nouveaux usagers: 28'
        ],
        files: ['Rapport_Mensuel_2026.pdf', 'Statistiques_Mensuelles.pdf', 'Graphiques_Mensuels.pdf']
      }
    },
    { 
      id: 'archive', 
      name: '📦 Archives', 
      icon: '📦', 
      color: '#f39c12', 
      desc: 'Dossiers anciens archivés',
      details: {
        title: 'Archives OMDA',
        content: 'Dossiers historiques archivés de l\'année 2022 à 2024.',
        sections: [
          '📁 2022: 1 234 dossiers',
          '📁 2023: 1 567 dossiers',
          '📁 2024: 1 890 dossiers',
          '📁 Total archivés: 4 691 dossiers',
          '💾 Espace utilisé: 2.4 GB'
        ],
        files: ['Archive_2022.pdf', 'Archive_2023.pdf', 'Archive_2024.pdf']
      }
    },
    { 
      id: 'backup', 
      name: '💾 Backup', 
      icon: '💾', 
      color: '#9b59b6', 
      desc: 'Sauvegarde des données',
      details: {
        title: 'Sauvegarde OMDA',
        content: 'Sauvegarde complète des données et configurations.',
        sections: [
          '💾 Dernière sauvegarde: 02/08/2026 15:30',
          '📊 Base de données: 4.2 GB',
          '📁 Documents: 1.8 GB',
          '⚙️ Configuration: 120 MB',
          '🔄 Backup automatique: Activé'
        ],
        files: ['Backup_Complet.pdf', 'Backup_DB.pdf', 'Backup_Config.pdf']
      }
    },
    { 
      id: 'config', 
      name: '⚙️ Configuration', 
      icon: '⚙️', 
      color: '#e74c3c', 
      desc: 'Paramètres système',
      details: {
        title: 'Configuration Système',
        content: 'Paramètres de configuration de l\'application OMDA.',
        sections: [
          '⚙️ Version: 2.5.0',
          '🔧 Environnement: Production',
          '🗄️ Base de données: PostgreSQL 15',
          '🌐 Serveur: Ubuntu 22.04 LTS',
          '🔒 Sécurité: HTTPS avec certificat SSL'
        ],
        files: ['Config_Generale.pdf', 'Config_Utilisateur.pdf']
      }
    }
  ];

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

  // Charger les statistiques
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/paiements/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Récupérer le compteur pour le QR Code
  useEffect(() => {
    const fetchCompteur = async () => {
      if (!currentUser || !selectedCategory) return;
      
      try {
        const apiType = categoryMapping[selectedCategory];
        const typeLabels = {
          hotel: 'Hôtel',
          'grand-surface': 'Grand Surface',
          bus: 'Bus',
          nightclub: 'Night club',
          media: 'Média',
          occ: 'OCC'
        };
        const typeName = typeLabels[apiType] || apiType;
        
        const response = await fetch(`http://localhost:3001/api/users/dossier-counter/${currentUser.id}/${typeName}`);
        const data = await response.json();
        if (data.success) {
          setQrCompteur(data.compteur + 1);
        }
      } catch (error) {
        console.error('Erreur récupération compteur:', error);
      }
    };
    
    fetchCompteur();
  }, [currentUser, selectedCategory]);

  const loadUsagersByCategory = useCallback(async (categoryName) => {
    setLoading(true);
    const apiType = categoryMapping[categoryName];
    try {
      const response = await fetch(`http://localhost:3001/api/usagers/paiements/${apiType}`);
      const data = await response.json();
      if (data.success && data.usagers) {
        setUsagers(data.usagers);
        setFilteredUsagers(data.usagers);
      } else {
        setUsagers([]);
        setFilteredUsagers([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des usagers:', error);
      setNotification({ type: 'error', message: '❌ Erreur chargement des usagers' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const filtered = usagers.filter(u => 
        (u.denomination?.toLowerCase() || '').includes(term) ||
        (u.demandeur?.toLowerCase() || '').includes(term) ||
        (u.nom_evenement?.toLowerCase() || '').includes(term) ||
        (u.telephone || '').includes(term) ||
        (u.numero_dossier_utilisateur?.toLowerCase() || '').includes(term)
      );
      setFilteredUsagers(filtered);
    } else {
      setFilteredUsagers(usagers);
    }
  }, [searchTerm, usagers]);

  const handleOpenCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    setViewMode('sub');
    setCurrentPath(`OMDA / ${categoryName} /`);
    loadUsagersByCategory(categoryName);
  };

  const handleGoBack = () => {
    setViewMode('root');
    setSelectedCategory(null);
    setCurrentPath('OMDA /');
    setSearchTerm('');
    setUsagers([]);
    setFilteredUsagers([]);
  };

  const handleGoDashboard = () => {
    navigate('/dashboard');
  };

  // OUVERTURE D'UN DOSSIER USAGER
  const handleOpenUsagerFolder = (usager) => {
    setActiveUsager(usager);
    setShowPrintModal(true);
  };

  // OUVERTURE D'UN DOSSIER UTILITAIRE
  const handleOpenUtilityFolder = (folder) => {
    setSelectedUtility(folder);
    setShowUtilityModal(true);
  };

  // Afficher les détails de l'usager
  const handleShowUsagerDetails = (usager) => {
    setSelectedUsagerForDetails(usager);
    setShowUsagerDetails(true);
  };

  // Fonction pour formater la date
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

  // Génération du texte pour le QR code
  const generateQRTextContent = (usager, type) => {
    if (!usager) return '© OMDA - Document officiel';
    
    const dateStr = formatDateForReference();
    const compteurValue = qrCompteur || usager.id || 1;
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

  // OUVERTURE D'UN DOCUMENT SPÉCIFIQUE
  const handleOpenDocument = async (usager, docType) => {
    if (!usager) return;

    const apiType = categoryMapping[selectedCategory] || 'hotel';
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
          switch(apiType) {
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
          await generateFacturePDF(usager, pdfData, apiType);
          break;
        case 'QR Code':
          const qrText = generateQRTextContent(usager, apiType);
          setQrCodeData({ usager, apiType, qrText });
          setShowQrModal(true);
          return;
        default:
          break;
      }

      setValidatedDossiers(prev => ({
        ...prev,
        [usager.id]: true
      }));

      setNotification({ type: 'success', message: `✅ ${docType} généré avec succès` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', message: `❌ Erreur génération ${docType}` });
      setTimeout(() => setNotification(null), 3000);
    }
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

  // Impression du document utilitaire
  const handlePrintUtility = () => {
    window.print();
  };

  const getCategoryStats = (categoryName) => {
    const apiType = categoryMapping[categoryName];
    if (stats && stats[apiType]) {
      return {
        total: stats[apiType].total || 0,
        new: stats[apiType].nouveaux || 0
      };
    }
    return { total: 0, new: 0 };
  };

  const totalDossiers = stats ? Object.values(stats).reduce((acc, s) => acc + (s.total || 0), 0) : 0;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Fonction pour obtenir les informations spécifiques à l'usager
  const getUsagerInfo = (usager, type) => {
    const info = {
      nom: usager.denomination || usager.demandeur || usager.nom_evenement || 'ENTREPRISE',
      lieu: '',
      date: '',
      details: [],
      telephone: usager.telephone || 'Non spécifié',
      email: usager.email || 'Non spécifié',
      numero_dossier: usager.numero_dossier_utilisateur || 'Non spécifié'
    };

    switch(type) {
      case 'occ':
        info.nom = usager.denomination || usager.demandeur || usager.nom_evenement || 'ÉVÉNEMENT';
        info.lieu = usager.lieu_evenement || 'Lieu non spécifié';
        info.date = formatDateForQR(usager.date_evenement);
        if (usager.organisateurs) info.details.push(`Organisateurs: ${usager.organisateurs}`);
        if (usager.artistes_detail?.length > 0) {
          info.details.push(`Artistes: ${usager.artistes_detail.map(a => a.nom).join(', ')}`);
        } else if (usager.artistesList?.length > 0) {
          info.details.push(`Artistes: ${usager.artistesList.map(a => a.nom).join(', ')}`);
        } else if (usager.artistes && usager.artistes !== 'Non spécifié') {
          info.details.push(`Artistes: ${usager.artistes}`);
        }
        if (usager.genre_manifestation) info.details.push(`Genre: ${usager.genre_manifestation}`);
        break;
      case 'hotel':
        info.nom = usager.denomination || usager.nom || 'HÔTEL';
        info.lieu = usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        info.date = formatDateForQR(usager.created_at);
        if (usager.etoiles) info.details.push(`Étoiles: ${usager.etoiles}⭐`);
        break;
      case 'grand-surface':
        info.nom = usager.denomination || usager.nom || 'GRANDE SURFACE';
        info.lieu = usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        info.date = formatDateForQR(usager.created_at);
        if (usager.nombre_magasins) info.details.push(`Nb magasins: ${usager.nombre_magasins}`);
        break;
      case 'bus':
        info.nom = usager.denomination || usager.nom || 'ENTREPRISE DE BUS';
        info.lieu = usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        info.date = formatDateForQR(usager.created_at);
        if (usager.nombre_vehicules) info.details.push(`Nb bus: ${usager.nombre_vehicules}`);
        if (usager.lignes) info.details.push(`Lignes: ${usager.lignes}`);
        break;
      case 'nightclub':
        info.nom = usager.denomination || usager.nom || 'NIGHT CLUB';
        info.lieu = usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        info.date = formatDateForQR(usager.created_at);
        if (usager.jauge_max) info.details.push(`Jauge: ${usager.jauge_max}`);
        if (usager.horaires) info.details.push(`Horaires: ${usager.horaires}`);
        break;
      case 'media':
        info.nom = usager.denomination || usager.nom || 'MÉDIA';
        info.lieu = usager.siege || usager.adresse_siege || usager.ville || usager.adresse || 'Adresse non spécifiée';
        info.date = formatDateForQR(usager.created_at);
        if (usager.canal) info.details.push(`Canal: ${usager.canal}`);
        break;
    }

    return info;
  };

  // Icône DOSSIER WINDOWS
  const FolderIcon = ({ color = '#f5c842', size = 32 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );

  // Icône DOCUMENT PDF
  const PdfIcon = ({ size = 24 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#e74c3c" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
      <path d="M14 2v6h6"/>
      <path d="M9 15l2 2 4-4"/>
    </svg>
  );

  return (
    <>
      <MiniSidebar />
      
      <main className="contenu-gestion-dossier">
        {notification && (
          <div className={`notification ${notification.type}`}>
            <div className="notification-content">
              <span className="notification-icon">
                {notification.type === 'success' ? '✅' : notification.type === 'info' ? 'ℹ️' : '❌'}
              </span>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={() => setNotification(null)}>✕</button>
            </div>
          </div>
        )}

        <div className="dossier-dashboard">
          
          {/* HEADER SIMPLIFIÉ */}
          <div className="dashboard-header-simple">
            <div className="header-left">
              <button className="btn-dashboard" onClick={handleGoDashboard}>
                ← Retour Dashboard
              </button>
              <h1>📂 Gestion des dossiers</h1>
            </div>
            <div className="header-right">
              <span className="total-dossiers">Total: {totalDossiers} dossiers</span>
            </div>
          </div>

          {/* BARRE D'EXPLORATEUR WINDOWS */}
          <div className="windows-explorer-bar">
            <div className="explorer-nav">
              <button 
                onClick={handleGoBack} 
                disabled={viewMode === 'root'} 
                className={`nav-btn ${viewMode === 'root' ? 'nav-btn-disabled' : ''}`}
              >
                ←
              </button>
            </div>
            
            <div className="explorer-address">
              <span className="address-icon">📁</span>
              <input 
                type="text" 
                value={currentPath} 
                onChange={(e) => setCurrentPath(e.target.value)} 
                className="address-input"
                readOnly
              />
            </div>

            <div className="explorer-search">
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* VUE RACINE */}
          {viewMode === 'root' && (
            <div className="root-view">
              {/* DOSSIERS UTILITAIRES (BILAN) */}
              <div className="section-utility-folders">
                <h2 className="section-title">📁 Dossiers Utilitaires</h2>
                <div className="utility-folders-grid">
                  {utilityFolders.map((folder) => (
                    <div 
                      key={folder.id} 
                      className="utility-folder"
                      style={{ borderLeftColor: folder.color }}
                      onClick={() => handleOpenUtilityFolder(folder)}
                    >
                      <div className="folder-tab" style={{ background: folder.color }}></div>
                      <div className="folder-icon" style={{ color: folder.color }}>
                        <span style={{ fontSize: '28px' }}>{folder.icon}</span>
                      </div>
                      <h3 className="folder-name">{folder.name}</h3>
                      <p className="folder-stats">{folder.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-divider"></div>

              {/* DOSSIERS USAGERS */}
              <div className="section-dossiers-usagers">
                <h2 className="section-title">📁 Dossiers Usagers</h2>
                <div className="dossiers-grid-usagers">
                  {Object.keys(categoryMapping).map((catName) => {
                    const stats = getCategoryStats(catName);
                    const apiType = categoryMapping[catName];
                    const color = typeColors[apiType] || '#6366f1';
                    const icon = typeIcons[apiType] || '📁';
                    
                    return (
                      <div 
                        key={catName} 
                        className="dossier-folder-usager"
                        onClick={() => handleOpenCategory(catName)}
                        style={{ borderLeftColor: color }}
                      >
                        <div className="folder-tab" style={{ background: color }}></div>
                        <div className="folder-icon" style={{ color: color }}>
                          <span style={{ fontSize: '28px' }}>{icon}</span>
                        </div>
                        <h3 className="folder-name">{catName}</h3>
                        <p className="folder-stats">
                          {stats.total} Dossier{stats.total > 1 ? 's' : ''} 
                          {stats.new > 0 && ` • ${stats.new} Nouveau`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VUE SOUS-DOSSIER */}
          {viewMode === 'sub' && (
            <div className="sub-view">
              <div className="filters-bar">
                <div className="filters-left">
                  <span className="filter-count">
                    {filteredUsagers.length} Dossier{filteredUsagers.length > 1 ? 's' : ''}
                  </span>
                  <span className="filter-category">{selectedCategory}</span>
                </div>
                <div className="filters-right">
                  <span className="filter-year">{new Date().getFullYear()}</span>
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Chargement des dossiers...</p>
                </div>
              ) : filteredUsagers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>Aucun dossier trouvé</p>
                </div>
              ) : (
                <div className="usagers-grid">
                  {filteredUsagers.map((usager) => {
                    const nomDossier = usager.denomination || usager.nom_evenement || usager.demandeur || 'Sans nom';
                    const dateDossier = formatDate(usager.created_at) || new Date().toLocaleDateString('fr-FR');
                    const isPrinted = validatedDossiers[usager.id] || false;
                    const apiType = categoryMapping[selectedCategory] || 'hotel';
                    const info = getUsagerInfo(usager, apiType);
                    
                    return (
                      <div 
                        key={usager.id} 
                        className={`usager-folder ${isPrinted ? 'folder-validated' : ''}`}
                      >
                        <div className="folder-tab-doc" style={{ background: '#f5c842' }}></div>
                        <div className="folder-content-doc">
                          <div className="folder-icon-doc">
                            <FolderIcon size={28} />
                          </div>
                          <div className="folder-info-doc">
                            <h4 className="folder-title-doc" onClick={() => handleShowUsagerDetails(usager)}>
                              {nomDossier}
                              <span className="info-icon">ℹ️</span>
                            </h4>
                            <p className="folder-date-doc">📅 {dateDossier}</p>
                            {isPrinted && <span className="badge-valid">✅ Validé</span>}
                          </div>
                          <div className="folder-documents-doc">
                            <div 
                              className="doc-item-doc"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocument(usager, 'Contrat');
                              }}
                            >
                              <PdfIcon size={20} />
                              <span>Contrat.pdf</span>
                            </div>
                            <div 
                              className="doc-item-doc"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocument(usager, 'Facture');
                              }}
                            >
                              <PdfIcon size={20} />
                              <span>Facture.pdf</span>
                            </div>
                            <div 
                              className="doc-item-doc"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocument(usager, 'QR Code');
                              }}
                            >
                              <span style={{ fontSize: '18px' }}>📱</span>
                              <span>QR Code</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODALE DOSSIER USAGER */}
        {showPrintModal && activeUsager && (
          <div className="modal-overlay" onClick={() => setShowPrintModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📂 {activeUsager.denomination || activeUsager.nom_evenement || 'Dossier'}</h3>
                <button className="modal-close" onClick={() => setShowPrintModal(false)}>✕</button>
              </div>
              
              {/* AFFICHAGE DES INFORMATIONS DE L'USAGER */}
              <div className="usager-info-section">
                <div className="usager-info-row">
                  <span className="usager-info-label">📋 Nom:</span>
                  <span className="usager-info-value">{activeUsager.denomination || activeUsager.demandeur || activeUsager.nom_evenement || 'Non spécifié'}</span>
                </div>
                <div className="usager-info-row">
                  <span className="usager-info-label">📞 Téléphone:</span>
                  <span className="usager-info-value">{activeUsager.telephone || 'Non spécifié'}</span>
                </div>
                <div className="usager-info-row">
                  <span className="usager-info-label">📧 Email:</span>
                  <span className="usager-info-value">{activeUsager.email || 'Non spécifié'}</span>
                </div>
                <div className="usager-info-row">
                  <span className="usager-info-label">📍 Adresse:</span>
                  <span className="usager-info-value">{activeUsager.adresse || activeUsager.adresse_siege || activeUsager.ville || 'Non spécifié'}</span>
                </div>
                <div className="usager-info-row">
                  <span className="usager-info-label">📁 N° Dossier:</span>
                  <span className="usager-info-value">{activeUsager.numero_dossier_utilisateur || 'Non spécifié'}</span>
                </div>
                {activeUsager.organisateurs && (
                  <div className="usager-info-row">
                    <span className="usager-info-label">👥 Organisateurs:</span>
                    <span className="usager-info-value">{activeUsager.organisateurs}</span>
                  </div>
                )}
                {activeUsager.artistes && activeUsager.artistes !== 'Non spécifié' && (
                  <div className="usager-info-row">
                    <span className="usager-info-label">🎤 Artistes:</span>
                    <span className="usager-info-value">{activeUsager.artistes}</span>
                  </div>
                )}
                {activeUsager.lieu_evenement && (
                  <div className="usager-info-row">
                    <span className="usager-info-label">📍 Lieu événement:</span>
                    <span className="usager-info-value">{activeUsager.lieu_evenement}</span>
                  </div>
                )}
                {activeUsager.date_evenement && (
                  <div className="usager-info-row">
                    <span className="usager-info-label">📅 Date événement:</span>
                    <span className="usager-info-value">{formatDateForQR(activeUsager.date_evenement)}</span>
                  </div>
                )}
                {activeUsager.etoiles && (
                  <div className="usager-info-row">
                    <span className="usager-info-label">⭐ Étoiles:</span>
                    <span className="usager-info-value">{activeUsager.etoiles}</span>
                  </div>
                )}
                {activeUsager.nombre_magasins && (
                  <div className="usager-info-row">
                    <span className="usager-info-label">🏪 Nb magasins:</span>
                    <span className="usager-info-value">{activeUsager.nombre_magasins}</span>
                  </div>
                )}
                {activeUsager.nombre_vehicules && (
                  <div className="usager-info-row">
                    <span className="usager-info-label">🚌 Nb véhicules:</span>
                    <span className="usager-info-value">{activeUsager.nombre_vehicules}</span>
                  </div>
                )}
                {activeUsager.jauge_max && (
                  <div className="usager-info-row">
                    <span className="usager-info-label">👥 Jauge max:</span>
                    <span className="usager-info-value">{activeUsager.jauge_max}</span>
                  </div>
                )}
                {activeUsager.canal && (
                  <div className="usager-info-row">
                    <span className="usager-info-label">📻 Canal:</span>
                    <span className="usager-info-value">{activeUsager.canal}</span>
                  </div>
                )}
              </div>
              
              <p className="modal-subtitle">
                Documents disponibles pour <strong>{activeUsager.denomination || activeUsager.demandeur || 'cet usager'}</strong>
              </p>
              
              <div className="modal-documents-list">
                <div 
                  className="modal-doc-item"
                  onClick={() => handleOpenDocument(activeUsager, 'Contrat')}
                >
                  <PdfIcon size={28} />
                  <div className="doc-info">
                    <span className="doc-name">📄 Contrat de représentation</span>
                    <span className="doc-size">PDF • Cliquer pour générer</span>
                  </div>
                  <button className="doc-open-btn">📄 Ouvrir</button>
                </div>

                <div 
                  className="modal-doc-item"
                  onClick={() => handleOpenDocument(activeUsager, 'Facture')}
                >
                  <PdfIcon size={28} />
                  <div className="doc-info">
                    <span className="doc-name">🧾 Facture officielle</span>
                    <span className="doc-size">PDF • Cliquer pour générer</span>
                  </div>
                  <button className="doc-open-btn">📄 Ouvrir</button>
                </div>

                <div 
                  className="modal-doc-item"
                  onClick={() => handleOpenDocument(activeUsager, 'QR Code')}
                >
                  <span style={{ fontSize: '28px' }}>📱</span>
                  <div className="doc-info">
                    <span className="doc-name">🔐 QR Code sécurisé</span>
                    <span className="doc-size">PNG • Cliquer pour générer</span>
                  </div>
                  <button className="doc-open-btn">📱 Générer</button>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  onClick={() => setShowPrintModal(false)} 
                  className="btn-cancel"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => {
                    handleOpenDocument(activeUsager, 'Contrat');
                    setTimeout(() => handleOpenDocument(activeUsager, 'Facture'), 500);
                    setTimeout(() => handleOpenDocument(activeUsager, 'QR Code'), 1000);
                  }} 
                  className="btn-print"
                >
                  🖨️ Tout générer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE QR CODE AVEC LOGO AU CENTRE */}
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
                        {/* Logo OMDA au centre */}
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

        {/* MODALE DOSSIER UTILITAIRE */}
        {showUtilityModal && selectedUtility && (
          <div className="modal-overlay utility-modal-overlay" onClick={() => setShowUtilityModal(false)}>
            <div className="modal-content utility-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header utility-modal-header">
                <h3>{selectedUtility.name}</h3>
                <button className="modal-close" onClick={() => setShowUtilityModal(false)}>✕</button>
              </div>
              
              <div className="utility-body" id="utility-print-content">
                <div className="utility-header">
                  <div className="utility-icon-large">{selectedUtility.icon}</div>
                  <h2>{selectedUtility.details.title}</h2>
                  <p className="utility-description">{selectedUtility.details.content}</p>
                </div>
                
                <div className="utility-sections">
                  {selectedUtility.details.sections.map((section, index) => (
                    <div key={index} className="utility-section-item">
                      {section}
                    </div>
                  ))}
                </div>

                <div className="utility-files-list">
                  <h4>📄 Documents disponibles</h4>
                  {selectedUtility.details.files.map((file, index) => (
                    <div key={index} className="utility-file-item">
                      <PdfIcon size={20} />
                      <span>{file}</span>
                    </div>
                  ))}
                </div>

                <div className="utility-footer">
                  <p>© OMDA - {new Date().getFullYear()} - Tous droits réservés</p>
                </div>
              </div>

              <div className="modal-actions utility-actions">
                <button 
                  onClick={() => setShowUtilityModal(false)} 
                  className="btn-cancel"
                >
                  Fermer
                </button>
                <button 
                  onClick={handlePrintUtility}
                  className="btn-print"
                >
                  🖨️ Imprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE DÉTAILS USAGER */}
        {showUsagerDetails && selectedUsagerForDetails && (
          <div className="modal-overlay" onClick={() => setShowUsagerDetails(false)}>
            <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📋 Détails de l'usager</h3>
                <button className="modal-close" onClick={() => setShowUsagerDetails(false)}>✕</button>
              </div>
              
              <div className="details-content">
                <div className="details-row">
                  <span className="details-label">Nom / Dénomination</span>
                  <span className="details-value">{selectedUsagerForDetails.denomination || selectedUsagerForDetails.demandeur || selectedUsagerForDetails.nom_evenement || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Téléphone</span>
                  <span className="details-value">{selectedUsagerForDetails.telephone || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Email</span>
                  <span className="details-value">{selectedUsagerForDetails.email || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">N° Dossier</span>
                  <span className="details-value">{selectedUsagerForDetails.numero_dossier_utilisateur || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Adresse</span>
                  <span className="details-value">{selectedUsagerForDetails.adresse || selectedUsagerForDetails.adresse_siege || selectedUsagerForDetails.ville || 'Non spécifié'}</span>
                </div>
                {selectedUsagerForDetails.organisateurs && (
                  <div className="details-row">
                    <span className="details-label">Organisateurs</span>
                    <span className="details-value">{selectedUsagerForDetails.organisateurs}</span>
                  </div>
                )}
                {selectedUsagerForDetails.artistes && selectedUsagerForDetails.artistes !== 'Non spécifié' && (
                  <div className="details-row">
                    <span className="details-label">Artistes</span>
                    <span className="details-value">{selectedUsagerForDetails.artistes}</span>
                  </div>
                )}
                {selectedUsagerForDetails.lieu_evenement && (
                  <div className="details-row">
                    <span className="details-label">Lieu de l'événement</span>
                    <span className="details-value">{selectedUsagerForDetails.lieu_evenement}</span>
                  </div>
                )}
                {selectedUsagerForDetails.date_evenement && (
                  <div className="details-row">
                    <span className="details-label">Date de l'événement</span>
                    <span className="details-value">{formatDateForQR(selectedUsagerForDetails.date_evenement)}</span>
                  </div>
                )}
                {selectedUsagerForDetails.etoiles && (
                  <div className="details-row">
                    <span className="details-label">Étoiles</span>
                    <span className="details-value">{selectedUsagerForDetails.etoiles}⭐</span>
                  </div>
                )}
                {selectedUsagerForDetails.nombre_magasins && (
                  <div className="details-row">
                    <span className="details-label">Nombre de magasins</span>
                    <span className="details-value">{selectedUsagerForDetails.nombre_magasins}</span>
                  </div>
                )}
                {selectedUsagerForDetails.nombre_vehicules && (
                  <div className="details-row">
                    <span className="details-label">Nombre de véhicules</span>
                    <span className="details-value">{selectedUsagerForDetails.nombre_vehicules}</span>
                  </div>
                )}
                {selectedUsagerForDetails.jauge_max && (
                  <div className="details-row">
                    <span className="details-label">Jauge max</span>
                    <span className="details-value">{selectedUsagerForDetails.jauge_max}</span>
                  </div>
                )}
                {selectedUsagerForDetails.canal && (
                  <div className="details-row">
                    <span className="details-label">Canal</span>
                    <span className="details-value">{selectedUsagerForDetails.canal}</span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  onClick={() => setShowUsagerDetails(false)} 
                  className="btn-cancel"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Styles pour l'impression */}
      <style jsx>{`
        @media print {
          .modal-overlay.qr-modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: white !important;
            z-index: 9999 !important;
            backdrop-filter: none !important;
          }
          .modal-content.qr-modal-content {
            max-width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 20px !important;
          }
          .modal-header.qr-modal-header, 
          .qr-actions-only,
          .modal-close {
            display: none !important;
          }
          .qr-preview-container {
            padding: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
          }
          .qr-body {
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 100vh !important;
          }
          .qr-code-wrapper-only {
            margin: 0 auto !important;
          }
          .qr-red-border {
            border-color: #dc2626 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .qr-logo-circle {
            border-color: #dc2626 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .qr-omda-footer {
            color: #dc2626 !important;
            border-color: #dc2626 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Impression des utilitaires */
          .utility-modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: white !important;
            z-index: 9999 !important;
          }
          .utility-modal-content {
            max-width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 20px !important;
          }
          .utility-modal-header, 
          .utility-actions,
          .modal-close {
            display: none !important;
          }
          #utility-print-content {
            padding: 20px !important;
          }
        }
      `}</style>
    </>
  );
};

export default GestionDossier;