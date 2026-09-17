// src/pages/GestionDossier.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import {
  FileText, Receipt, QrCode, Download, Printer, CheckCircle, XCircle,
  Info, AlertCircle, Building2, User, Phone, MapPin, Calendar, Star,
  Hotel, Store, Bus, PartyPopper, Tv2, Ticket, File, ArrowLeft,
  Clock, CreditCard, FileCheck, Loader2, FileSignature,
  Home, FolderOpen, FileArchive, Shield, Settings, Database,
  BarChart3, PieChart, TrendingUp, Users, DollarSign,
  ChevronRight, ChevronDown, Plus, Edit3, Trash2, Eye,
  Table, LayoutGrid, Search, Filter, RefreshCw, Globe,
  Mail, Headphones, Music, Briefcase, Layers, Box,
  HardDrive, Cpu, Server, Lock, Key, ShieldCheck,
  Upload, Copy, Clipboard, Menu, Maximize2, Hash, Banknote,
  Grid, List, ChevronsRight, Activity, PieChart as PieChartIcon,
  CreditCard as CreditCardIcon, Wallet, FileSpreadsheet, PieChart as PieChartIcon2,
  ChevronLeft
} from 'lucide-react';
import '../styles/gestion_dossier.css';
import MiniSidebar from '../components/MiniSidebar';

// Import des générateurs PDF
import { generateHotelPDF } from './pdf/hotel_pdf';
import { generateMagasinPDF } from './pdf/magasin_pdf';
import { generateMediaPDF } from './pdf/media_pdf';
import { generateNightPDF } from './pdf/night_pdf';
import { generateBusPDF } from './pdf/bus_pdf';
import generateContratOccPDF from './pdf/generateContratOccPDF'; 
import { generateFacturePDF } from './pdf/facture_pdf_g';
import { generateBilanGlobalPDF } from './pdf/bilanGlobal_pdf';

const API_BASE = 'http://localhost:3001/api';

const GestionDossier = () => {
  const navigate = useNavigate();
  const qrRef = useRef(null);

  // États principaux
  const [currentPath, setCurrentPath] = useState('OMDA /');
  const [viewMode, setViewMode] = useState('root');
  const [displayMode, setDisplayMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // États des données
  const [usagers, setUsagers] = useState([]);
  const [filteredUsagers, setFilteredUsagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);

  // États des modales
  const [showQrModal, setShowQrModal] = useState(false);
  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedUsagerForDetails, setSelectedUsagerForDetails] = useState(null);
  const [showUsagerDetails, setShowUsagerDetails] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [processingDoc, setProcessingDoc] = useState(null);
  const [validatedDossiers, setValidatedDossiers] = useState({});
  const [stats, setStats] = useState(null);
  const [qrCompteur, setQrCompteur] = useState(1);
  const [bilanData, setBilanData] = useState(null);

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
    'occ': '#f59e0b', 'media': '#f43f5e', 'grand-surface': '#8b5cf6',
    'nightclub': '#ec4899', 'hotel': '#6366f1', 'transport': '#06b6d4'
  };

  const typeIcons = {
    'occ': Ticket, 'media': Tv2, 'grand-surface': Store,
    'nightclub': PartyPopper, 'hotel': Hotel, 'transport': Bus
  };

  const typeLabels = {
    'occ': 'Occasionnel',
    'media': 'Média / Radio',
    'grand-surface': 'Magasin',
    'nightclub': 'Night Club',
    'hotel': 'Hôtel',
    'transport': 'Transport'
  };

  // ============================================================
  // DOCUMENTS DISPONIBLES SELON LE TYPE
  // ============================================================
  const getDocumentsForType = (apiType) => {
    // OCC : seulement Facture et QR Code (pas de Contrat)
    if (apiType === 'occ') {
      return ['Facture', 'QR Code'];
    }
    // Autres types : Contrat, Facture, QR Code
    return ['Contrat', 'Facture', 'QR Code'];
  };

  // Dossiers utilitaires - 6 éléments avec action de génération PDF
  const utilityFolders = [
    {
      id: 'bilan_annuel',
      name: 'Bilan Annuel',
      icon: BarChart3,
      color: '#2ecc71',
      desc: "Résumé financier de l'année",
      itemCount: 'Générer PDF',
      pdfAction: 'bilan_global',
      details: {
        title: `Bilan Annuel ${new Date().getFullYear()}`,
        content: "Rapport financier complet de l'Office Malagasy du Droit d'Auteur.",
        sections: [
          { label: 'Recettes totales', value: 'Voir Bilan Global (PDF)' },
          { label: 'Dossiers traités (total)', value: 'Voir Bilan Global (PDF)' },
          { label: 'Dernière génération', value: new Date().toLocaleDateString('fr-FR') }
        ],
        files: [
          { name: 'Bilan_Annuel.pdf', size: 'Généré à la demande', action: 'bilan' }
        ]
      }
    },
    {
      id: 'bilan_region',
      name: 'Bilan par Région',
      icon: MapPin,
      color: '#3498db',
      desc: 'Résumé par région et par semestre',
      itemCount: 'Générer PDF',
      pdfAction: 'bilan_region',
      details: {
        title: `Bilan par Région - ${new Date().getFullYear()}`,
        content: "Rapport détaillé par région avec répartition semestrielle.",
        sections: [
          { label: 'Période', value: 'Année en cours' },
          { label: 'Source des données', value: 'Table facture_usager' },
          { label: 'Mise à jour', value: 'Temps réel' }
        ],
        files: [
          { name: 'Bilan_Region.pdf', size: 'Généré à la demande', action: 'bilan' }
        ]
      }
    },
    {
      id: 'paiements',
      name: 'Paiements',
      icon: CreditCardIcon,
      color: '#9b59b6',
      desc: 'Historique des paiements',
      itemCount: 'Générer PDF',
      pdfAction: 'bilan_paiements',
      details: {
        title: `Historique des Paiements - ${new Date().getFullYear()}`,
        content: "Liste complète des paiements enregistrés.",
        sections: [
          { label: 'Total des paiements', value: 'Voir détails' },
          { label: 'Dernière mise à jour', value: new Date().toLocaleDateString('fr-FR') }
        ],
        files: [
          { name: 'Paiements.pdf', size: 'Généré à la demande', action: 'bilan' }
        ]
      }
    },
    {
      id: 'recettes',
      name: 'Recettes',
      icon: Wallet,
      color: '#f39c12',
      desc: 'Recettes par catégorie',
      itemCount: 'Générer PDF',
      pdfAction: 'bilan_recettes',
      details: {
        title: `Recettes - ${new Date().getFullYear()}`,
        content: "Récapitulatif des recettes par catégorie.",
        sections: [
          { label: 'Total des recettes', value: 'Voir détails' },
          { label: 'Dernière mise à jour', value: new Date().toLocaleDateString('fr-FR') }
        ],
        files: [
          { name: 'Recettes.pdf', size: 'Généré à la demande', action: 'bilan' }
        ]
      }
    },
    {
      id: 'rapport_mensuel',
      name: 'Rapport Mensuel',
      icon: FileSpreadsheet,
      color: '#1abc9c',
      desc: 'Rapport du mois en cours',
      itemCount: 'Générer PDF',
      pdfAction: 'bilan_mensuel',
      details: {
        title: `Rapport Mensuel - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        content: "Statistiques et indicateurs de performance du mois en cours.",
        sections: [
          { label: 'Période', value: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) },
          { label: 'Source des données', value: 'Table facture_usager' },
          { label: 'Mise à jour', value: 'Temps réel' }
        ],
        files: [
          { name: 'Rapport_Mensuel.pdf', size: 'Généré à la demande', action: 'bilan' }
        ]
      }
    },
    {
      id: 'stats_globales',
      name: 'Statistiques Globales',
      icon: PieChartIcon2,
      color: '#e74c3c',
      desc: 'Statistiques complètes',
      itemCount: 'Générer PDF',
      pdfAction: 'bilan_stats',
      details: {
        title: `Statistiques Globales - ${new Date().getFullYear()}`,
        content: "Statistiques complètes de l'OMDA.",
        sections: [
          { label: 'Total dossiers', value: 'Voir détails' },
          { label: 'Total usagers', value: 'Voir détails' },
          { label: 'Dernière mise à jour', value: new Date().toLocaleDateString('fr-FR') }
        ],
        files: [
          { name: 'Statistiques.pdf', size: 'Généré à la demande', action: 'bilan' }
        ]
      }
    }
  ];

  // ============================================================
  // FETCH - Utilisateur courant
  // ============================================================
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('userId');
        const response = await fetch(`${API_BASE}/auth/current-user`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await response.json();
        if (data.success && data.user) setCurrentUser(data.user);
      } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // ============================================================
  // FETCH - Statistiques générales
  // ============================================================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/factures`);
        const data = await response.json();
        if (data.success) {
          const factures = data.factures || [];
          const typeToCategory = { 'HTL': 'hotel', 'MGS': 'grand-surface', 'RDP': 'media', 'TRP': 'bus', 'NGT': 'nightclub', 'OCC': 'occ' };
          const parCategorie = {};
          Object.values(typeToCategory).forEach(cat => { parCategorie[cat] = { total: 0, nouveaux: 0, montant: 0 }; });

          const now = new Date();
          const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

          factures.forEach(f => {
            const cat = typeToCategory[f.ref_client_type];
            if (!cat) return;
            parCategorie[cat].total += 1;
            parCategorie[cat].montant += parseFloat(f.soit_total) || 0;
            const createdAt = f.created_at ? new Date(f.created_at) : null;
            if (createdAt && createdAt >= debutMois) parCategorie[cat].nouveaux += 1;
          });

          setStats(parCategorie);
          const totalDossiers = factures.length;
          const totalMontant = factures.reduce((acc, f) => acc + (parseFloat(f.soit_total) || 0), 0);

          setStatsData({ totalDossiers, totalUsagers: totalDossiers, totalPaiements: totalDossiers, totalMontant, parCategorie });
        }
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      }
    };
    fetchStats();
  }, []);

  // ============================================================
  // FETCH - Bilan Global complet
  // ============================================================
  const fetchBilanData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/bilan/global`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setBilanData(data.data);
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération bilan:', error);
      setNotification({ type: 'error', message: `❌ Erreur récupération bilan: ${error.message}` });
      setTimeout(() => setNotification(null), 3000);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH - Usagers par catégorie
  // ============================================================
  const loadUsagersByCategory = useCallback(async (categoryName) => {
    setLoading(true);
    const apiType = categoryMapping[categoryName];
    try {
      console.log(`📊 Chargement des usagers pour: ${categoryName} (${apiType})`);
      const response = await fetch(`${API_BASE}/factures/type/${apiType}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Données reçues:`, data);
      
      if (data.success && data.usagers) {
        let usagersEnrichis = data.usagers;
        if (apiType === 'occ') {
          usagersEnrichis = await Promise.all(
            data.usagers.map(async (usager) => {
              try {
                const artistesResponse = await fetch(`${API_BASE}/occ/artistes/details/${usager.id}`);
                if (artistesResponse.ok) {
                  const artistesData = await artistesResponse.json();
                  if (artistesData.success && artistesData.artistes) {
                    return { ...usager, artistes_detail: artistesData.artistes };
                  }
                }
                return usager;
              } catch (err) {
                console.error(`❌ Erreur récupération artistes usager ${usager.id}:`, err);
                return usager;
              }
            })
          );
        }
        setUsagers(usagersEnrichis);
        setFilteredUsagers(usagersEnrichis);
        console.log(`✅ ${usagersEnrichis.length} usagers chargés pour ${categoryName}`);
      } else {
        setUsagers([]);
        setFilteredUsagers([]);
        console.warn(`⚠️ Aucun usager trouvé pour ${categoryName}`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement dossiers:', error);
      setNotification({ type: 'error', message: `❌ Erreur chargement des dossiers: ${error.message}` });
      setTimeout(() => setNotification(null), 3000);
      setUsagers([]);
      setFilteredUsagers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // FETCH - Artistes pour OCC
  // ============================================================
  const fetchArtistesForOcc = async (eventId) => {
    try {
      const response = await fetch(`${API_BASE}/occ/artistes/details/${eventId}`);
      if (!response.ok) return [];
      const data = await response.json();
      if (data.success && data.artistes) return data.artistes;
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération artistes OCC:', error);
      return [];
    }
  };

  // ============================================================
  // RECHERCHE
  // ============================================================
  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const filtered = usagers.filter(u =>
        (u.denomination?.toLowerCase() || '').includes(term) ||
        (u.demandeur?.toLowerCase() || '').includes(term) ||
        (u.organisateurs?.toLowerCase() || '').includes(term) ||
        (u.telephone || '').includes(term) ||
        (u.numero_dossier_utilisateur?.toLowerCase() || '').includes(term) ||
        (u.quittance || '').includes(term) ||
        (u.region_usager?.toLowerCase() || '').includes(term) ||
        (u.genre_manifestation?.toLowerCase() || '').includes(term) ||
        (u.nom_evenement?.toLowerCase() || '').includes(term) ||
        (u.lieu_evenement?.toLowerCase() || '').includes(term)
      );
      setFilteredUsagers(filtered);
    } else {
      setFilteredUsagers(usagers);
    }
  }, [searchTerm, usagers]);

  // ============================================================
  // HANDLERS - Navigation
  // ============================================================
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

  const handleGoDashboard = () => navigate('/dashboard');

  // ============================================================
  // HANDLERS - Dossiers utilitaires
  // ============================================================
  const handleOpenUtilityFolder = (folder) => {
    setSelectedUtility(folder);
    setShowUtilityModal(true);
    if (folder.pdfAction) {
      handleGenerateUtilityPDF(folder.pdfAction);
    }
  };

  const handleGenerateUtilityPDF = async (actionType) => {
    try {
      setNotification({ type: 'info', message: `🔄 Génération du PDF...` });
      
      const data = await fetchBilanData();
      if (!data) {
        setNotification({ type: 'error', message: '❌ Impossible de récupérer les données' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      
      const options = {
        annee: new Date().getFullYear(),
        responsable: currentUser?.nom || 'DAF',
        dateGeneration: new Date().toLocaleDateString('fr-FR'),
        actionType: actionType,
        title: getUtilityTitle(actionType)
      };
      
      const result = await generateBilanGlobalPDF(data, options);
      
      setNotification(result
        ? { type: 'success', message: `✅ PDF généré avec succès` }
        : { type: 'error', message: '❌ Erreur génération du PDF' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('❌ Erreur:', error);
      setNotification({ type: 'error', message: `❌ Erreur technique: ${error.message}` });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getUtilityTitle = (actionType) => {
    const titles = {
      'bilan_global': 'Bilan Global',
      'bilan_region': 'Bilan par Région',
      'bilan_paiements': 'Historique des Paiements',
      'bilan_recettes': 'Recettes par Catégorie',
      'bilan_mensuel': 'Rapport Mensuel',
      'bilan_stats': 'Statistiques Globales'
    };
    return titles[actionType] || 'Bilan OMDA';
  };

  // ============================================================
  // HANDLERS - Détails usager
  // ============================================================
  const handleShowUsagerDetails = (usager) => {
    setSelectedUsagerForDetails(usager);
    setShowUsagerDetails(true);
  };

  // ============================================================
  // HANDLERS - Génération Bilan Global
  // ============================================================
  const handleGenerateBilanGlobal = async () => {
    try {
      setNotification({ type: 'info', message: '🔄 Génération du Bilan Global...' });
      
      const data = await fetchBilanData();
      if (!data) {
        setNotification({ type: 'error', message: '❌ Impossible de récupérer les données' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      
      const result = await generateBilanGlobalPDF(data, {
        annee: new Date().getFullYear(),
        responsable: currentUser?.nom || 'DAF',
        dateGeneration: new Date().toLocaleDateString('fr-FR'),
        actionType: 'bilan_global',
        title: 'Bilan Global OMDA'
      });
      
      setNotification(result
        ? { type: 'success', message: '✅ Bilan Global généré avec succès' }
        : { type: 'error', message: '❌ Erreur génération du Bilan Global' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('❌ Erreur:', error);
      setNotification({ type: 'error', message: `❌ Erreur technique: ${error.message}` });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return ''; }
  };

  const formatDateForQR = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return 'Date invalide'; }
  };

  const formatDateForReference = () => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  };

  const formatMontant = (valeur) => {
    const n = Math.round(Number(valeur) || 0);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // ============================================================
  // NORMALISATION pour contrat OCC - CORRIGÉE
  // ============================================================
  const normalizeFactureForContrat = (f, apiType) => {
    // S'assurer que toutes les données sont présentes
    const safeData = {
      id: f?.id || 0,
      denomination: f?.denomination || f?.nom || f?.nom_evenement || '',
      demandeur: f?.demandeur || f?.organisateurs || '',
      telephone: f?.telephone || '',
      email: f?.email || '',
      adresse: f?.adresse || f?.siege || f?.adresse_siege || f?.domicile || '',
      siege: f?.siege || f?.adresse || '',
      adresse_siege: f?.adresse_siege || f?.adresse || f?.siege || '',
      nif: f?.nif || '',
      stat: f?.stat || '',
      nif_stat: f?.nif_stat || [f?.nif, f?.stat].filter(Boolean).join(' / '),
      montant_mensuel: parseFloat(f?.montant_mensuel || f?.montant || 0),
      frais_dossier: parseFloat(f?.frais_dossier || 0),
      uniter: parseInt(f?.uniter) || 1,
      region: f?.region || f?.region_usager || '',
      region_usager: f?.region_usager || f?.region || '',
      created_at: f?.created_at || f?.date_ajout || new Date().toISOString(),
      date_ajout: f?.date_ajout || f?.created_at || new Date().toISOString(),
      numero_dossier_utilisateur: f?.numero_dossier_utilisateur || '',
      quittance: f?.quittance || '',
      soit_total: parseFloat(f?.soit_total || f?.montant_total || f?.montant_mensuel || 0),
      montant_total: parseFloat(f?.montant_total || f?.soit_total || f?.montant_mensuel || 0),
      moyens_communication: f?.moyens_communication || {},
      total: f?.total || '',
      a_compter_du: f?.a_compter_du || null,
      echeance: f?.echeance || null,
      confirmation_nom: f?.confirmation_nom || f?.demandeur || '',
      date_signature: f?.date_signature || null,
      lieu_signature: f?.lieu_ajout || 'Antananarivo',
      lieu_ajout: f?.lieu_ajout || 'Antananarivo',
      etoiles: f?.etoiles || '',
      ravinala: f?.ravinala || false,
      nombre_magasins: parseInt(f?.nombre_magasins) || 0,
      nombre_vehicules: parseInt(f?.nombre_vehicules) || 0,
      jauge_max: parseInt(f?.jauge_max) || 0,
      lignes: f?.lignes || '',
      type_bus: f?.type_bus || '',
      trajet: f?.trajet || '',
      horaires: f?.horaires || '',
      zones_desservies: f?.zones_desservies || '',
      activite: f?.activite || '',
      representant_par: f?.representant_par || '',
      organisateurs: f?.organisateurs || f?.demandeur || '',
      genre_manifestation: f?.genre_manifestation || '',
      date_evenement: f?.date_evenement || null,
      lieu_evenement: f?.lieu_evenement || '',
      nom_evenement: f?.nom_evenement || '',
      artistes: f?.artistes || '',
      artistes_detail: f?.artistes_detail || [],
      proprietaire_nom: f?.demandeur || f?.representant_nom || '',
      proprietaire_adresse: f?.adresse || '',
      proprietaire_tel: f?.telephone || '',
      proprietaire_cin: f?.representant_cin || '',
      proprietaire_cin_delivree: f?.representant_cin_delivree || null,
      proprietaire_cin_lieu: f?.representant_cin_lieu || '',
      frequence: f?.frequence || '',
      canal: f?.canal || '',
      taux: parseFloat(f?.taux || 0),
      personne_recu: f?.personne_recu || '',
      is_retard: f?.is_retard || false,
      montant_retard: parseFloat(f?.montant_retard || 0),
      ref_usager: f?.ref_usager || f?.id || 0,
      ref_client_type: f?.ref_client_type || '',
      cin: f?.cin || f?.representant_cin || '',
      representant_cin: f?.representant_cin || f?.cin || '',
      cin_delivree: f?.cin_delivree || f?.representant_cin_delivree || '',
      representant_cin_delivree: f?.representant_cin_delivree || f?.cin_delivree || '',
      cin_lieu: f?.cin_lieu || f?.representant_cin_lieu || '',
      representant_cin_lieu: f?.representant_cin_lieu || f?.cin_lieu || '',
      domicile: f?.domicile || f?.adresse || '',
      nom_signataire: f?.nom_signataire || f?.confirmation_nom || '',
      // Champs supplémentaires pour OCC
      organisateurs_occ: f?.organisateurs || f?.demandeur || '',
      representant_par_occ: f?.representant_par || '',
      genre_manifestation_occ: f?.genre_manifestation || '',
      artistes_occ: f?.artistes || '',
      artistes_detail_occ: f?.artistes_detail || [],
      date_evenement_occ: f?.date_evenement || null,
      lieu_evenement_occ: f?.lieu_evenement || '',
      telephone_occ: f?.telephone || '',
      adresse_occ: f?.adresse || f?.domicile || '',
      cin_occ: f?.representant_cin || f?.cin || '',
      cin_delivree_occ: f?.representant_cin_delivree || f?.cin_delivree || '',
      cin_lieu_occ: f?.representant_cin_lieu || f?.cin_lieu || '',
      lieu_ajout_occ: f?.lieu_ajout || 'Antananarivo',
      confirmation_nom_occ: f?.confirmation_nom || ''
    };

    // Pour OCC, s'assurer que les champs spécifiques sont bien remplis
    if (apiType === 'occ') {
      safeData.organisateurs = safeData.organisateurs_occ || safeData.organisateurs;
      safeData.representant_par = safeData.representant_par_occ || safeData.representant_par;
      safeData.genre_manifestation = safeData.genre_manifestation_occ || safeData.genre_manifestation;
      safeData.artistes = safeData.artistes_occ || safeData.artistes;
      safeData.artistes_detail = safeData.artistes_detail_occ || safeData.artistes_detail;
      safeData.date_evenement = safeData.date_evenement_occ || safeData.date_evenement;
      safeData.lieu_evenement = safeData.lieu_evenement_occ || safeData.lieu_evenement;
      safeData.telephone = safeData.telephone_occ || safeData.telephone;
      safeData.adresse = safeData.adresse_occ || safeData.adresse;
      safeData.domicile = safeData.adresse_occ || safeData.domicile;
      safeData.representant_cin = safeData.cin_occ || safeData.representant_cin;
      safeData.cin = safeData.cin_occ || safeData.cin;
      safeData.representant_cin_delivree = safeData.cin_delivree_occ || safeData.representant_cin_delivree;
      safeData.cin_delivree = safeData.cin_delivree_occ || safeData.cin_delivree;
      safeData.representant_cin_lieu = safeData.cin_lieu_occ || safeData.representant_cin_lieu;
      safeData.cin_lieu = safeData.cin_lieu_occ || safeData.cin_lieu;
      safeData.lieu_ajout = safeData.lieu_ajout_occ || safeData.lieu_ajout;
      safeData.confirmation_nom = safeData.confirmation_nom_occ || safeData.confirmation_nom;
      safeData.nom_signataire = safeData.confirmation_nom_occ || safeData.nom_signataire;
    }

    return safeData;
  };

  // ============================================================
  // GÉNÉRATION QR CODE
  // ============================================================
  const generateQRTextContent = (usager, type) => {
    if (!usager) return '© OMDA - Document officiel';
    const dateStr = formatDateForReference();
    const compteurValue = qrCompteur || usager.id || 1;
    const numeroDossier = usager.numero_dossier_utilisateur || `REF-${usager.id}`;

    switch (type) {
      case 'occ': {
        const organisateurs = usager.organisateurs || usager.demandeur || 'Non spécifié';
        let artistesStr = 'Non spécifié';
        if (usager.artistes_detail && usager.artistes_detail.length > 0) {
          artistesStr = usager.artistes_detail.map(a => {
            if (a.prenom && a.nom) return `${a.prenom} ${a.nom}`;
            return a.nom || a;
          }).join(', ');
        } else if (usager.artistes) {
          artistesStr = usager.artistes;
        }
        const lieu = usager.lieu_evenement || usager.adresse || 'Lieu non spécifié';
        const dateEvent = usager.date_evenement ? formatDateForQR(usager.date_evenement) : 'Date non spécifiée';
        return `OMDA affirme un événement OCC\nOrganisateur : ${organisateurs}\nArtistes : ${artistesStr}\nLieu : ${lieu}\nDate : ${dateEvent}\nRef : ${numeroDossier}\n© OMDA - Tel: 034 05 533 88`;
      }
      case 'hotel':
        return `OMDA affirme un établissement HOTEL\nNom : ${usager.denomination || usager.demandeur || 'HÔTEL'}\nAdresse: ${usager.adresse || usager.siege || 'N/A'}\nÉtoiles: ${usager.etoiles || 'N/A'}\nRef: ${numeroDossier}\n© OMDA - Tel: 034 05 533 88`;
      case 'grand-surface':
        return `OMDA affirme un établissement MAGASIN\nNom : ${usager.denomination || usager.demandeur || 'N/A'}\nAdresse: ${usager.adresse || 'N/A'}\nNb magasins: ${usager.nombre_magasins || 0}\nRef: ${numeroDossier}\n© OMDA - Tel: 034 05 533 88`;
      case 'bus':
        return `OMDA affirme une société BUS\nNom : ${usager.denomination || usager.demandeur || 'N/A'}\nType: ${usager.type_bus || 'N/A'}\nNb bus: ${usager.nombre_vehicules || 0}\nLignes: ${usager.lignes || 'N/A'}\nRef: ${numeroDossier}\n© OMDA - Tel: 034 05 533 88`;
      case 'nightclub':
        return `OMDA affirme un établissement NIGHT CLUB\nNom : ${usager.denomination || usager.demandeur || 'N/A'}\nAdresse: ${usager.adresse || 'N/A'}\nJauge: ${usager.jauge_max || 0}\nHoraires: ${usager.horaires || 'N/A'}\nRef: ${numeroDossier}\n© OMDA - Tel: 034 05 533 88`;
      case 'media':
        return `OMDA affirme une station MEDIA\nNom : ${usager.denomination || usager.demandeur || 'N/A'}\nAdresse: ${usager.siege || usager.adresse || 'N/A'}\nCanal/Fréquence: ${usager.canal || usager.frequence || 'N/A'}\nRef: ${numeroDossier}\n© OMDA - Tel: 034 05 533 88`;
      default:
        return `© OMDA - Document officiel\nRef: ${numeroDossier}\n© OMDA - Tel: 034 05 533 88`;
    }
  };

  // ============================================================
  // GÉNÉRATION DOCUMENTS - CORRIGÉE
  // ============================================================
  const handleOpenDocument = async (usager, docType) => {
    if (!usager) return;
    const apiType = categoryMapping[selectedCategory] || 'hotel';
    setProcessingDoc({ usagerId: usager.id, docType });

    try {
      setNotification({ type: 'info', message: `🔄 Génération du ${docType}...` });

      // ✅ S'assurer que toutes les données de l'usager sont complètes
      const usagerComplet = {
        ...usager,
        // S'assurer que les champs obligatoires sont présents
        denomination: usager.denomination || usager.nom || usager.nom_evenement || 'Sans nom',
        demandeur: usager.demandeur || usager.organisateurs || '',
        telephone: usager.telephone || '',
        email: usager.email || '',
        adresse: usager.adresse || usager.siege || usager.adresse_siege || usager.domicile || '',
        region: usager.region || usager.region_usager || '',
        montant_mensuel: parseFloat(usager.montant_mensuel || usager.montant || 0),
        frais_dossier: parseFloat(usager.frais_dossier || 0),
        uniter: parseInt(usager.uniter) || 1,
        soit_total: parseFloat(usager.soit_total || usager.montant_total || usager.montant_mensuel || 0),
        // Pour OCC
        organisateurs: usager.organisateurs || usager.demandeur || '',
        representant_par: usager.representant_par || '',
        genre_manifestation: usager.genre_manifestation || '',
        artistes: usager.artistes || '',
        artistes_detail: usager.artistes_detail || [],
        date_evenement: usager.date_evenement || null,
        lieu_evenement: usager.lieu_evenement || '',
        lieu_ajout: usager.lieu_ajout || 'Antananarivo',
        confirmation_nom: usager.confirmation_nom || usager.demandeur || '',
        representant_cin: usager.representant_cin || usager.cin || '',
        representant_cin_delivree: usager.representant_cin_delivree || usager.cin_delivree || '',
        representant_cin_lieu: usager.representant_cin_lieu || usager.cin_lieu || '',
        numero_dossier_utilisateur: usager.numero_dossier_utilisateur || '',
        numero_dossier_global: usager.numero_dossier_global || '',
        quittance: usager.quittance || '',
        personne_recu: usager.personne_recu || '',
        is_retard: usager.is_retard || false,
        montant_retard: parseFloat(usager.montant_retard || 0),
        // Pour Hôtel
        etoiles: usager.etoiles || '',
        // Pour Grand Surface
        nombre_magasins: parseInt(usager.nombre_magasins) || 0,
        // Pour Bus
        nombre_vehicules: parseInt(usager.nombre_vehicules) || 0,
        lignes: usager.lignes || '',
        type_bus: usager.type_bus || '',
        trajet: usager.trajet || '',
        // Pour Night Club
        jauge_max: parseInt(usager.jauge_max) || 0,
        horaires: usager.horaires || '',
        // Pour Média
        frequence: usager.frequence || '',
        canal: usager.canal || '',
        siege: usager.siege || usager.adresse || '',
        nif: usager.nif || '',
        stat: usager.stat || '',
        taux: parseFloat(usager.taux || 0),
        // Dates
        created_at: usager.created_at || usager.date_ajout || new Date().toISOString(),
        date_ajout: usager.date_ajout || usager.created_at || new Date().toISOString(),
        a_compter_du: usager.a_compter_du || null,
        echeance: usager.echeance || null,
        date_signature: usager.date_signature || null,
        // Références
        ref_usager: usager.ref_usager || usager.id || 0,
        ref_client_type: usager.ref_client_type || apiType.toUpperCase(),
        type_usager: usager.type_usager || apiType
      };

      console.log('📄 Génération pour:', usagerComplet.denomination);

      switch (docType) {
        case 'Contrat':
          // UNIQUEMENT POUR LES TYPES NON OCC
          if (apiType === 'occ') {
            // OCC n'a pas de contrat, on génère la facture à la place
            await generateFacturePDF(usagerComplet, false);
          } else {
            const normalizedData = normalizeFactureForContrat(usagerComplet, apiType);
            switch (apiType) {
              case 'hotel':
                await generateHotelPDF(normalizedData);
                break;
              case 'grand-surface':
                await generateMagasinPDF(normalizedData);
                break;
              case 'media':
                await generateMediaPDF(normalizedData);
                break;
              case 'nightclub':
                await generateNightPDF(normalizedData);
                break;
              case 'bus':
                await generateBusPDF(normalizedData);
                break;
              default:
                throw new Error(`Type de contrat non supporté: ${apiType}`);
            }
          }
          break;

        case 'Facture':
          // TOUS LES TYPES utilisent le même générateur de facture
          await generateFacturePDF(usagerComplet, false);
          break;

        case 'QR Code': {
          const qrText = generateQRTextContent(usagerComplet, apiType);
          setQrCodeData({ usager: usagerComplet, apiType, qrText });
          setShowQrModal(true);
          setProcessingDoc(null);
          return;
        }
        default:
          break;
      }

      setValidatedDossiers(prev => ({ ...prev, [`${usager.id}_${docType}`]: true }));
      setNotification({ type: 'success', message: `✅ ${docType} généré avec succès` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error(`Erreur génération ${docType}:`, error);
      setNotification({ type: 'error', message: `❌ Erreur génération ${docType} : ${error.message}` });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setProcessingDoc(null);
    }
  };

  // ============================================================
  // HANDLERS - QR Code
  // ============================================================
  const handleDownloadQR = async () => {
    if (!qrRef.current) { alert('QR code non disponible'); return; }
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(qrRef.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true, allowTaint: true, logging: false });
      const link = document.createElement('a');
      link.download = `qr-code-omda-${new Date().toISOString().split('T')[0]}.png`;
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

  const handlePrintQR = () => window.print();
  const handlePrintUtility = () => window.print();

  // ============================================================
  // STATS par catégorie
  // ============================================================
  const getCategoryStats = (categoryName) => {
    const apiType = categoryMapping[categoryName];
    if (stats && stats[apiType]) return { total: stats[apiType].total || 0, new: stats[apiType].nouveaux || 0 };
    return { total: 0, new: 0 };
  };

  const totalDossiers = stats ? Object.values(stats).reduce((acc, s) => acc + (s.total || 0), 0) : 0;

  // ============================================================
  // ICÔNE DOSSIER
  // ============================================================
  const FolderIcon = ({ color = '#ffc857', size = 40 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path fill={color} d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      <path fill="#000" opacity="0.08" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" transform="translate(0,1)"/>
    </svg>
  );

  // ============================================================
  // RENDU - FLEC (bouton de retour visible)
  // ============================================================
  const renderNavigationFlec = () => (
    <div className="navigation-flec">
      <div className="flec-container">
        <button 
          className={`flec-back-btn ${viewMode === 'root' ? 'flec-back-btn-disabled' : ''}`}
          onClick={handleGoBack}
          disabled={viewMode === 'root'}
          title="Retour à la racine"
        >
          <ChevronLeft size={18} className="flec-back-icon" />
          <span className="flec-back-text">Retour</span>
        </button>

        <div className="flec-separator">|</div>

        <div className="flec-path">
          <span className="flec-home">
            <Home size={14} />
          </span>
          {currentPath.split('/').filter(Boolean).map((seg, i, arr) => (
            <React.Fragment key={i}>
              <ChevronRight size={12} className="flec-sep" />
              <span className={`flec-seg ${i === arr.length - 1 ? 'flec-seg-active' : ''}`}>
                {seg.trim()}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="flec-indicator">
          <div className="flec-dot"></div>
          <span className="flec-count">
            {viewMode === 'root' ? 'Racine' : `${filteredUsagers.length} dossier${filteredUsagers.length > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <>
      <MiniSidebar />
      <main className="contenu-gestion-dossier">
        {notification && (
          <div className={`notification ${notification.type}`}>
            <div className="notification-content">
              <span className="notification-icon">{notification.type === 'success' ? '✅' : notification.type === 'info' ? 'ℹ️' : '❌'}</span>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={() => setNotification(null)}>✕</button>
            </div>
          </div>
        )}

        {renderNavigationFlec()}

        <div className="explorer-titlebar">
          <div className="explorer-titlebar-left">
            <FolderOpen size={18} />
            <span>Gestion des dossiers — OMDA</span>
          </div>
          <div className="explorer-titlebar-right">
            <span className="total-dossiers-pill">{totalDossiers} dossier{totalDossiers > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="explorer-ribbon">
          <button className="ribbon-btn" onClick={handleGenerateBilanGlobal}>
            <FileText size={16} /> <span>Bilan PDF</span>
          </button>
          <button className="ribbon-btn" onClick={() => setShowStatsModal(true)}>
            <TrendingUp size={16} /> <span>Statistiques</span>
          </button>
          <div className="ribbon-sep" />
          <div className="ribbon-view-toggle">
            <button className={displayMode === 'grid' ? 'active' : ''} onClick={() => setDisplayMode('grid')} title="Vue grille">
              <Grid size={15} />
            </button>
            <button className={displayMode === 'list' ? 'active' : ''} onClick={() => setDisplayMode('list')} title="Vue liste">
              <List size={15} />
            </button>
          </div>
          <div className="ribbon-spacer" />
          <button className="ribbon-btn dashboard-btn" onClick={handleGoDashboard}>
            <ArrowLeft size={16} /> <span>Retour Dashboard</span>
          </button>
        </div>

        <div className="windows-explorer-bar">
          <div className="explorer-nav">
            <h1></h1>
            <button 
              onClick={handleGoBack} 
              disabled={viewMode === 'root'} 
              className={`nav-btn ${viewMode === 'root' ? 'nav-btn-disabled' : ''}`}
            >
              <ArrowLeft size={18} />
            </button>
          </div>
          <div className="explorer-address">
            <span className="address-icon"><FolderOpen size={16} /></span>
            {currentPath.split('/').filter(Boolean).map((seg, i, arr) => (
              <React.Fragment key={i}>
                <span className="breadcrumb-seg">{seg.trim()}</span>
                {i < arr.length - 1 && <ChevronsRight size={12} className="breadcrumb-sep" />}
              </React.Fragment>
            ))}
          </div>
          <div className="explorer-search">
            <Search size={16} className="search-icon-header" />
            <input 
              type="text" 
              placeholder="Rechercher (nom, quittance, région...)" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="search-input" 
            />
          </div>
        </div>

        <div className="dossier-dashboard">
          {viewMode === 'root' && (
            <div className="root-view">
              <div className="section-utility-folders">
                <h2 className="section-title"><Briefcase size={20} /> Dossiers Utilitaires</h2>
                <div className={displayMode === 'grid' ? 'utility-folders-grid' : 'explorer-list'}>
                  {utilityFolders.map((folder) => {
                    const IconComponent = folder.icon;
                    return displayMode === 'grid' ? (
                      <div 
                        key={folder.id} 
                        className="explorer-item" 
                        onDoubleClick={() => handleOpenUtilityFolder(folder)}
                        onClick={() => handleOpenUtilityFolder(folder)}
                      >
                        <div className="explorer-item-icon">
                          <IconComponent size={40} color={folder.color} strokeWidth={1.4} />
                        </div>
                        <div className="explorer-item-name">{folder.name}</div>
                        <div className="explorer-item-sub">{folder.itemCount}</div>
                      </div>
                    ) : (
                      <div 
                        key={folder.id} 
                        className="explorer-list-row" 
                        onClick={() => handleOpenUtilityFolder(folder)}
                      >
                        <IconComponent size={20} color={folder.color} />
                        <span className="row-name">{folder.name}</span>
                        <span className="row-desc">{folder.desc}</span>
                        <span className="row-meta">{folder.itemCount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="section-divider"></div>

              <div className="section-dossiers-usagers">
                <h2 className="section-title"><Users size={20} /> Dossiers Usagers</h2>
                <div className={displayMode === 'grid' ? 'utility-folders-grid' : 'explorer-list'}>
                  {Object.keys(categoryMapping).map((catName) => {
                    const statsCat = getCategoryStats(catName);
                    const apiType = categoryMapping[catName];
                    const color = typeColors[apiType] || '#6366f1';
                    const IconComponent = typeIcons[apiType] || FolderOpen;

                    return displayMode === 'grid' ? (
                      <div 
                        key={catName} 
                        className="explorer-item" 
                        onDoubleClick={() => handleOpenCategory(catName)}
                        onClick={() => handleOpenCategory(catName)}
                      >
                        <div className="explorer-item-icon">
                          <FolderIcon size={40} color={color} />
                        </div>
                        <div className="explorer-item-name">{catName}</div>
                        <div className="explorer-item-sub">{statsCat.total} dossier{statsCat.total > 1 ? 's' : ''}</div>
                      </div>
                    ) : (
                      <div 
                        key={catName} 
                        className="explorer-list-row" 
                        onClick={() => handleOpenCategory(catName)}
                      >
                        <IconComponent size={20} color={color} />
                        <span className="row-name">{catName}</span>
                        <span className="row-desc">{statsCat.total} dossier(s){statsCat.new > 0 ? ` • ${statsCat.new} ce mois` : ''}</span>
                        <span className="row-meta">→</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'sub' && (
            <div className="sub-view">
              <div className="filters-bar">
                <div className="filters-left">
                  <span className="filter-count"><FileText size={16} /> {filteredUsagers.length} Dossier{filteredUsagers.length > 1 ? 's' : ''}</span>
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
                  <div className="empty-icon"><FolderOpen size={48} /></div>
                  <p>Aucun dossier trouvé</p>
                </div>
              ) : (
                <div className="usagers-grid">
                  {filteredUsagers.map((usager) => {
                    const apiType = categoryMapping[selectedCategory] || 'hotel';
                    const nomDossier = usager.denomination || usager.organisateurs || usager.demandeur || usager.nom_evenement || 'Sans nom';
                    const dateDossier = formatDate(usager.date_ajout || usager.created_at) || new Date().toLocaleDateString('fr-FR');
                    const color = typeColors[apiType] || '#6366f1';
                    
                    let artistesStr = '';
                    if (apiType === 'occ') {
                      if (usager.artistes_detail && usager.artistes_detail.length > 0) {
                        artistesStr = usager.artistes_detail.map(a => {
                          if (a.prenom && a.nom) return `${a.prenom} ${a.nom}`;
                          return a.nom || a;
                        }).join(', ');
                      } else if (usager.artistes) {
                        artistesStr = usager.artistes;
                      }
                    }

                    // ✅ Utiliser getDocumentsForType pour déterminer les documents
                    const documents = getDocumentsForType(apiType);

                    return (
                      <div key={usager.id} className="usager-folder">
                        <div className="folder-tab-doc" style={{ background: color }}></div>
                        <div className="folder-content-doc">
                          <div className="folder-icon-doc"><FolderIcon size={28} color={color} /></div>
                          <div className="folder-info-doc">
                            <h4 className="folder-title-doc" onClick={() => handleShowUsagerDetails(usager)}>
                              {nomDossier}
                              <span className="info-icon"><Info size={14} /></span>
                            </h4>
                            <p className="folder-date-doc"><Calendar size={14} /> {dateDossier}</p>
                            <p className="folder-meta-doc"><Hash size={12} /> Quittance: {usager.quittance || '-'}</p>
                            <p className="folder-meta-doc"><Banknote size={12} /> {formatMontant(usager.soit_total || usager.montant_mensuel || 0)} Ar</p>
                            {usager.region_usager && (
                              <p className="folder-meta-doc"><MapPin size={12} /> {usager.region_usager}</p>
                            )}
                            {apiType === 'occ' && usager.date_evenement && (
                              <p className="folder-meta-doc"><Calendar size={12} /> Événement: {formatDate(usager.date_evenement)}</p>
                            )}
                            {apiType === 'occ' && usager.lieu_evenement && (
                              <p className="folder-meta-doc"><MapPin size={12} /> Lieu: {usager.lieu_evenement}</p>
                            )}
                            {apiType === 'occ' && artistesStr && (
                              <p className="folder-meta-doc"><User size={12} /> Artistes: {artistesStr}</p>
                            )}
                            {apiType === 'hotel' && usager.etoiles && (
                              <p className="folder-meta-doc"><Star size={12} /> {'⭐'.repeat(parseInt(usager.etoiles) || 0)}</p>
                            )}
                            {apiType === 'grand-surface' && usager.nombre_magasins > 0 && (
                              <p className="folder-meta-doc"><Store size={12} /> {usager.nombre_magasins} magasin(s)</p>
                            )}
                            {apiType === 'bus' && usager.nombre_vehicules > 0 && (
                              <p className="folder-meta-doc"><Bus size={12} /> {usager.nombre_vehicules} véhicule(s)</p>
                            )}
                            {apiType === 'nightclub' && usager.jauge_max > 0 && (
                              <p className="folder-meta-doc"><Users size={12} /> Jauge: {usager.jauge_max} pers.</p>
                            )}
                            {apiType === 'media' && usager.frequence && (
                              <p className="folder-meta-doc"><Tv2 size={12} /> {usager.frequence}</p>
                            )}
                          </div>
                          <div className="folder-documents-doc">
                            {documents.map((docType) => {
                              const isProcessing = processingDoc?.usagerId === usager.id && processingDoc?.docType === docType;
                              const icons = { 
                                'Contrat': FileSignature, 
                                'Facture': Receipt, 
                                'QR Code': QrCode 
                              };
                              const DocIcon = icons[docType];
                              return (
                                <div 
                                  key={docType} 
                                  className={`doc-item-doc ${isProcessing ? 'processing' : ''}`}
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!isProcessing) handleOpenDocument(usager, docType); 
                                  }}
                                  style={{ cursor: isProcessing ? 'wait' : 'pointer', opacity: isProcessing ? 0.6 : 1 }}
                                >
                                  {isProcessing ? <Loader2 size={18} className="spinner-icon" /> : <DocIcon size={18} />}
                                  <span>{docType}</span>
                                </div>
                              );
                            })}
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

        {/* ===== MODALES ===== */}
        {showStatsModal && statsData && (
          <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
            <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3><TrendingUp size={20} /> Statistiques Globales</h3>
                <button className="modal-close" onClick={() => setShowStatsModal(false)}>✕</button>
              </div>
              <div className="stats-content">
                <div className="stats-grid">
                  <div className="stats-card">
                    <div className="stats-icon"><FolderOpen size={24} color="#6366f1" /></div>
                    <div className="stats-number">{statsData.totalDossiers.toLocaleString('fr-FR')}</div>
                    <div className="stats-label">Total Dossiers</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-icon"><DollarSign size={24} color="#2ecc71" /></div>
                    <div className="stats-number">{formatMontant(statsData.totalMontant)} Ar</div>
                    <div className="stats-label">Montant Total</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-icon"><FileText size={24} color="#3498db" /></div>
                    <div className="stats-number">{statsData.totalPaiements.toLocaleString('fr-FR')}</div>
                    <div className="stats-label">Total Factures</div>
                  </div>
                </div>
                <div className="stats-categories">
                  <h4>Par Catégorie</h4>
                  {Object.entries(statsData.parCategorie || {}).map(([key, value]) => {
                    const labels = { 
                      hotel: '🏨 Hôtel', 
                      'grand-surface': '🏬 Grande Surface', 
                      bus: '🚌 Transport', 
                      nightclub: '🎭 Night Club', 
                      media: '📺 Média', 
                      occ: '🎪 Occasionnel' 
                    };
                    return (
                      <div key={key} className="stats-category-item">
                        <span className="stats-category-name">{labels[key] || key}</span>
                        <span className="stats-category-total">{value.total || 0} dossiers</span>
                        <span className="stats-category-montant">{formatMontant(value.montant)} Ar</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowStatsModal(false)}>Fermer</button>
                <button className="btn-print" onClick={handleGenerateBilanGlobal}>
                  <FileText size={18} /> Exporter PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {showQrModal && qrCodeData && (
          <div className="modal-overlay qr-modal-overlay" onClick={() => setShowQrModal(false)}>
            <div className="modal-content qr-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header qr-modal-header">
                <h3><QrCode size={20} /> QR Code OMDA</h3>
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
                      <div className="qr-omda-footer">OFFICE MALAGASY DU<br />DROIT D'AUTEUR</div>
                    </div>
                  </div>
                </div>

                <div className="qr-data-preview">
                  <p className="qr-data-title">📋 Contenu :</p>
                  <div className="qr-data-content">
                    {qrCodeData.qrText.split('\n').map((line, index) => {
                      if (!line.trim()) return null;
                      if (line.toLowerCase().includes('artistes')) {
                        return <div key={index} className="qr-artist-line"><strong>{line}</strong></div>;
                      }
                      return <div key={index}>{line}</div>;
                    })}
                  </div>
                </div>

                <div className="qr-actions-only">
                  <button className="btn-cancel" onClick={() => setShowQrModal(false)}>Fermer</button>
                  <button
                    className="btn-download-qr-only"
                    onClick={handleDownloadQR}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <><Loader2 size={18} className="spinner" /> Téléchargement...</>
                    ) : (
                      <><Download size={18} /> Télécharger</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showUtilityModal && selectedUtility && (
          <div className="modal-overlay utility-modal-overlay" onClick={() => setShowUtilityModal(false)}>
            <div className="modal-content utility-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header utility-modal-header" style={{ borderBottom: `3px solid ${selectedUtility.color}` }}>
                <h3><selectedUtility.icon size={20} color={selectedUtility.color} /> {selectedUtility.name}</h3>
                <button className="modal-close" onClick={() => setShowUtilityModal(false)}>×</button>
              </div>

              <div className="utility-body" id="utility-print-content">
                <div className="utility-header">
                  <div className="utility-icon-large" style={{ background: `${selectedUtility.color}15` }}>
                    <selectedUtility.icon size={40} color={selectedUtility.color} />
                  </div>
                  <div>
                    <h2>{selectedUtility.details.title}</h2>
                    {selectedUtility.details.content && (
                      <p className="utility-description">{selectedUtility.details.content}</p>
                    )}
                  </div>
                </div>

                {selectedUtility.details.sections.length > 0 && (
                  <div className="utility-info-table">
                    {selectedUtility.details.sections.map((s, i) => (
                      <div key={i} className="utility-info-row">
                        <span className="utility-info-label">{s.label}</span>
                        <span className="utility-info-value">{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedUtility.details.files.length > 0 && (
                  <div className="utility-files-list">
                    <h4><FileText size={16} /> Documents disponibles</h4>
                    {selectedUtility.details.files.map((file, index) => (
                      <div 
                        key={index} 
                        className="utility-file-item" 
                        onClick={() => file.action === 'bilan' && handleGenerateUtilityPDF(selectedUtility.pdfAction)}
                      >
                        <FileSignature size={16} color="#e74c3c" />
                        <span className="file-name">{file.name}</span>
                        <span className="file-meta">{file.size}</span>
                        <Download size={14} className="file-download-icon" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="utility-footer">
                  <p>© OMDA - {new Date().getFullYear()} - Tous droits réservés</p>
                </div>
              </div>

              <div className="modal-actions utility-actions">
                <button onClick={() => setShowUtilityModal(false)} className="btn-cancel">Fermer</button>
                <button onClick={handlePrintUtility} className="btn-print"><Printer size={16} /> Imprimer</button>
              </div>
            </div>
          </div>
        )}

        {showUsagerDetails && selectedUsagerForDetails && (
          <div className="modal-overlay" onClick={() => setShowUsagerDetails(false)}>
            <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3><User size={20} /> Détails du dossier</h3>
                <button className="modal-close" onClick={() => setShowUsagerDetails(false)}>✕</button>
              </div>
              <div className="details-content">
                <div className="details-row">
                  <span className="details-label"><User size={16} /> Nom / Dénomination</span>
                  <span className="details-value">{selectedUsagerForDetails.denomination || selectedUsagerForDetails.demandeur || selectedUsagerForDetails.organisateurs || selectedUsagerForDetails.nom_evenement || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label"><Phone size={16} /> Téléphone</span>
                  <span className="details-value">{selectedUsagerForDetails.telephone || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label"><Mail size={16} /> Email</span>
                  <span className="details-value">{selectedUsagerForDetails.email || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label"><MapPin size={16} /> Adresse</span>
                  <span className="details-value">{selectedUsagerForDetails.adresse || selectedUsagerForDetails.siege || selectedUsagerForDetails.adresse_siege || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label"><MapPin size={16} /> Région</span>
                  <span className="details-value">{selectedUsagerForDetails.region_usager || selectedUsagerForDetails.region || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label"><FileText size={16} /> N° Dossier</span>
                  <span className="details-value">{selectedUsagerForDetails.numero_dossier_utilisateur || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label"><Hash size={16} /> Quittance</span>
                  <span className="details-value">{selectedUsagerForDetails.quittance || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label"><User size={16} /> Personne reçue</span>
                  <span className="details-value">{selectedUsagerForDetails.personne_recu || 'Non spécifié'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label"><DollarSign size={16} /> Montant Total</span>
                  <span className="details-value">{formatMontant(selectedUsagerForDetails.soit_total || selectedUsagerForDetails.montant_mensuel || 0)} Ar</span>
                </div>
                {selectedUsagerForDetails.type_usager === 'occ' && (
                  <>
                    <div className="details-row">
                      <span className="details-label"><Ticket size={16} /> Genre manifestation</span>
                      <span className="details-value">{selectedUsagerForDetails.genre_manifestation || 'Non spécifié'}</span>
                    </div>
                    <div className="details-row">
                      <span className="details-label"><Calendar size={16} /> Date événement</span>
                      <span className="details-value">{formatDate(selectedUsagerForDetails.date_evenement) || 'Non spécifié'}</span>
                    </div>
                    <div className="details-row">
                      <span className="details-label"><MapPin size={16} /> Lieu événement</span>
                      <span className="details-value">{selectedUsagerForDetails.lieu_evenement || 'Non spécifié'}</span>
                    </div>
                    <div className="details-row">
                      <span className="details-label"><User size={16} /> Organisateurs</span>
                      <span className="details-value">{selectedUsagerForDetails.organisateurs || 'Non spécifié'}</span>
                    </div>
                    {selectedUsagerForDetails.artistes_detail && selectedUsagerForDetails.artistes_detail.length > 0 && (
                      <div className="details-row">
                        <span className="details-label"><User size={16} /> Artistes</span>
                        <span className="details-value" style={{ fontSize: '13px' }}>
                          {selectedUsagerForDetails.artistes_detail.map((a, i) => (
                            <span key={i}>
                              {a.prenom ? `${a.prenom} ${a.nom}` : a.nom}
                              {i < selectedUsagerForDetails.artistes_detail.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {selectedUsagerForDetails.type_usager === 'hotel' && selectedUsagerForDetails.etoiles && (
                  <div className="details-row">
                    <span className="details-label"><Star size={16} /> Étoiles</span>
                    <span className="details-value">{'⭐'.repeat(parseInt(selectedUsagerForDetails.etoiles) || 0)}</span>
                  </div>
                )}
                {selectedUsagerForDetails.type_usager === 'grand-surface' && selectedUsagerForDetails.nombre_magasins > 0 && (
                  <div className="details-row">
                    <span className="details-label"><Store size={16} /> Nombre magasins</span>
                    <span className="details-value">{selectedUsagerForDetails.nombre_magasins}</span>
                  </div>
                )}
                {selectedUsagerForDetails.type_usager === 'bus' && selectedUsagerForDetails.nombre_vehicules > 0 && (
                  <div className="details-row">
                    <span className="details-label"><Bus size={16} /> Nombre véhicules</span>
                    <span className="details-value">{selectedUsagerForDetails.nombre_vehicules}</span>
                  </div>
                )}
                {selectedUsagerForDetails.type_usager === 'nightclub' && selectedUsagerForDetails.jauge_max > 0 && (
                  <div className="details-row">
                    <span className="details-label"><Users size={16} /> Jauge max</span>
                    <span className="details-value">{selectedUsagerForDetails.jauge_max} pers.</span>
                  </div>
                )}
                {selectedUsagerForDetails.type_usager === 'media' && (
                  <>
                    {selectedUsagerForDetails.frequence && (
                      <div className="details-row">
                        <span className="details-label"><Tv2 size={16} /> Fréquence</span>
                        <span className="details-value">{selectedUsagerForDetails.frequence}</span>
                      </div>
                    )}
                    {selectedUsagerForDetails.canal && (
                      <div className="details-row">
                        <span className="details-label"><Tv2 size={16} /> Canal</span>
                        <span className="details-value">{selectedUsagerForDetails.canal}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowUsagerDetails(false)} className="btn-cancel">Fermer</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default GestionDossier;