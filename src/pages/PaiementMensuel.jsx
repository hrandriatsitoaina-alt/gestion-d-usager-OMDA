// src/pages/PaiementMensuel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save,
  Printer,
  FileCheck,
  ReceiptText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Hotel,
  Store,
  Bus,
  Music,
  Tv,
  Tent,
  Check,
  X,
  ShieldCheck,
  Layers,
  Edit3,
  CheckSquare,
  Download,
  FileArchive
} from 'lucide-react';
import '../styles/paiement-mensuel.css';
import MiniSidebar from '../components/MiniSidebar';
import { useToast } from '../components/Toast';
import { generateFacturePDF } from './pdf/facture_pdf';
import JSZip from 'jszip';

const PaiementMensuel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usager, setUsager] = useState(null);
  const [usagerType, setUsagerType] = useState('');
  const [selectedUsagerId, setSelectedUsagerId] = useState(null);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [montantMensuel, setMontantMensuel] = useState('');
  const [fraisDossier, setFraisDossier] = useState(0);
  const [montantRetard, setMontantRetard] = useState(0);
  const [isRetard, setIsRetard] = useState(false);
  const [uniter, setUniter] = useState(1);
  
  // ✅ État principal des montants par mois
  const [montantsParMois, setMontantsParMois] = useState({});
  // ✅ État pour le total général
  const [totalGeneral, setTotalGeneral] = useState(0);

  const [descriptionPersonnalisee, setDescriptionPersonnalisee] = useState('');
  const [descriptionConfirmee, setDescriptionConfirmee] = useState('');

  const [factureType, setFactureType] = useState('A');
  const [nombreMois, setNombreMois] = useState(1);
  const [moisSelectionnes, setMoisSelectionnes] = useState([]);
  const [tousMois, setTousMois] = useState(false);
  const [moisPayes, setMoisPayes] = useState([]);

  const [facturesGenerees, setFacturesGenerees] = useState([]);
  const [showFactures, setShowFactures] = useState(false);

  const [quittance, setQuittance] = useState('');
  const [quittanceValidee, setQuittanceValidee] = useState(false);
  const [personneRecu, setPersonneRecu] = useState('');

  // ✅ Générer toutes les années disponibles dynamiquement
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  const [moisLabels] = useState(['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']);
  const [moisLabelsShort] = useState(['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']);
  const [userId, setUserId] = useState(null);

  const [dataSource, setDataSource] = useState('api');

  const getOnlyNumbers = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };

  const estMoisPaye = (mois, annee) => {
    return moisPayes.some(p => p.annee === annee && p.mois === mois);
  };

  const getMoisDisponiblesRestants = () => {
    const moisPayesAnnee = moisPayes.filter(p => p.annee === selectedYear).map(p => p.mois);
    let disponibles = [];
    for (let i = 1; i <= 12; i++) {
      if (!moisPayesAnnee.includes(i)) {
        disponibles.push(i);
      }
    }
    return disponibles;
  };

  // ✅ Fonction pour mettre à jour le montant mensuel (tous les mois)
  const handleMontantMensuelChange = (valeur) => {
    const numValue = parseFloat(valeur) || 0;
    setMontantMensuel(valeur);
    
    const nouveauMontant = numValue * uniter;
    const nouveauxMontants = {};
    for (let i = 1; i <= 12; i++) {
      nouveauxMontants[i] = nouveauMontant;
    }
    setMontantsParMois(nouveauxMontants);
    
    // Recalculer le total après mise à jour
    setTimeout(() => {
      recalculerTotal(nouveauxMontants);
    }, 0);
  };

  // ✅ Fonction pour mettre à jour le montant d'un mois spécifique
  const handleMontantMoisChange = (mois, valeur) => {
    const numValue = parseFloat(valeur) || 0;
    
    // Mettre à jour le montant du mois
    setMontantsParMois(prev => {
      const nouveauxMontants = {
        ...prev,
        [mois]: numValue
      };
      
      // Recalculer le total immédiatement avec les nouvelles valeurs
      recalculerTotal(nouveauxMontants);
      
      return nouveauxMontants;
    });
  };

  // ✅ Fonction de recalcul du total
  const recalculerTotal = useCallback((montants = null) => {
    const moisActuels = moisSelectionnes;
    if (moisActuels.length === 0) {
      setTotalGeneral(0);
      return;
    }

    // Utiliser les montants passés en paramètre ou l'état actuel
    const montantsAUtiliser = montants || montantsParMois;
    
    let total = 0;
    moisActuels.forEach(mois => {
      total += (montantsAUtiliser[mois] || 0);
    });
    
    if (isRetard) {
      total += montantRetard;
    }
    
    setTotalGeneral(total);
  }, [moisSelectionnes, montantsParMois, isRetard, montantRetard]);

  // ✅ Recalculer le total quand les sélections changent
  useEffect(() => {
    recalculerTotal();
  }, [moisSelectionnes, isRetard, montantRetard, recalculerTotal]);

  // ✅ Initialiser les montants quand un usager est chargé
  useEffect(() => {
    if (usager && usagerType) {
      let montantBase = 0;
      if (usagerType === 'occ') {
        montantBase = parseFloat(usager.montant) || parseFloat(usager.montant_total) || 0;
      } else if (usagerType === 'media') {
        montantBase = parseFloat(usager.taux) || parseFloat(usager.montant_mensuel) || 0;
      } else {
        montantBase = parseFloat(usager.montant_mensuel) || 0;
      }
      
      if (montantBase > 0) {
        setMontantMensuel(montantBase.toString());
      } else {
        setMontantMensuel('');
      }
      
      const montantParMois = montantBase * (uniter || 1);
      const nouveauxMontants = {};
      for (let i = 1; i <= 12; i++) {
        nouveauxMontants[i] = montantParMois;
      }
      setMontantsParMois(nouveauxMontants);
      
      setTimeout(() => {
        recalculerTotal(nouveauxMontants);
      }, 100);
    }
  }, [usager, usagerType]);

  // ✅ Mettre à jour quand uniter change
  useEffect(() => {
    if (usager) {
      const montantBase = parseFloat(montantMensuel) || 0;
      const nouveauMontant = montantBase * uniter;
      const nouveauxMontants = {};
      for (let i = 1; i <= 12; i++) {
        nouveauxMontants[i] = nouveauMontant;
      }
      setMontantsParMois(nouveauxMontants);
      recalculerTotal(nouveauxMontants);
    }
  }, [uniter]);

  const appliquerMontants = (usagerSource, type) => {
    let montant = 0;
    let retardVal = 0;
    let retardActif = false;
    let unit = 1;

    if (type === 'occ') {
      montant = parseFloat(usagerSource.montant) || parseFloat(usagerSource.montant_total) || 0;
      retardVal = parseFloat(usagerSource.montant_retard) || 0;
      retardActif = usagerSource.is_retard || false;
      unit = parseInt(usagerSource.uniter) || 1;
    } else if (type === 'media') {
      montant = parseFloat(usagerSource.taux) || parseFloat(usagerSource.montant_mensuel) || 0;
      unit = parseInt(usagerSource.uniter) || 1;
    } else {
      montant = parseFloat(usagerSource.montant_mensuel) || 0;
      unit = parseInt(usagerSource.uniter) || 1;
    }

    if (montant > 0) {
      setMontantMensuel(montant.toString());
    } else {
      setMontantMensuel('');
    }
    setFraisDossier(0);
    setMontantRetard(retardVal);
    setIsRetard(retardActif);
    setUniter(unit || 1);
    
    const montantParMois = montant * unit;
    const nouveauxMontants = {};
    for (let i = 1; i <= 12; i++) {
      nouveauxMontants[i] = montantParMois;
    }
    setMontantsParMois(nouveauxMontants);
    
    setTimeout(() => {
      recalculerTotal(nouveauxMontants);
    }, 0);
  };

  const handleConfirmerDescription = () => {
    if (descriptionPersonnalisee.trim()) {
      setDescriptionConfirmee(descriptionPersonnalisee.trim());
      showToast('✅ Description confirmée : ' + descriptionPersonnalisee.trim(), 'success');
    } else {
      setDescriptionConfirmee('');
      showToast('✅ Description effacée, la dénomination de l\'usager sera utilisée', 'info');
    }
  };

  const handleEffacerDescription = () => {
    setDescriptionPersonnalisee('');
    setDescriptionConfirmee('');
    showToast('✅ Description effacée, la dénomination de l\'usager sera utilisée', 'info');
  };

  useEffect(() => {
    const state = location.state;
    if (state && state.usagerId && state.usagerType) {
      setSelectedUsagerId(state.usagerId);
      setUsagerType(state.usagerType);
      const user = localStorage.getItem('userId');
      if (user) setUserId(parseInt(user));
      fetchUsagerData(state.usagerId, state.usagerType, state.usagerData || null);
      fetchAnneesDisponibles(state.usagerType);
    } else {
      showToast('Aucun usager sélectionné', 'error');
      navigate('/gere-payer');
    }
  }, [location]);

  const fetchUsagerData = async (id, type, usagerFallback) => {
    try {
      setLoading(true);
      let usagerFinal = null;
      let source = 'api';

      try {
        const response = await fetch(`http://localhost:3001/api/usagers/${type}/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.usager) {
            usagerFinal = data.usager;
            source = 'api';
          }
        }
      } catch (fetchError) {
        console.warn('⚠️ Erreur réseau/API:', fetchError);
      }

      if (!usagerFinal) {
        if (usagerFallback) {
          usagerFinal = usagerFallback;
          source = 'fallback';
        } else {
          showToast('Impossible de charger cet usager', 'error');
          navigate('/gere-payer');
          return;
        }
      }

      setUsager(usagerFinal);
      setDataSource(source);
      appliquerMontants(usagerFinal, type);

      if (source === 'fallback') {
        showToast('Données chargées en mode dégradé', 'warning');
      }

      try {
        const quittanceRes = await fetch('http://localhost:3001/api/quittance/last');
        const quittanceData = await quittanceRes.json();
        if (quittanceData.success && quittanceData.nextQuittance) {
          const nextNumbers = getOnlyNumbers(quittanceData.nextQuittance);
          setQuittance(nextNumbers);
        }
      } catch (err) {
        console.warn('⚠️ Erreur récupération quittance:', err);
      }

      try {
        await fetchPaiementsExistants(id, type);
      } catch (err) {
        console.warn('⚠️ Erreur récupération paiements:', err);
        setMoisPayes([]);
      }

    } catch (error) {
      console.error('❌ Erreur fetch usager:', error);
      if (usagerFallback) {
        setUsager(usagerFallback);
        setDataSource('fallback');
        appliquerMontants(usagerFallback, type);
        showToast('Données chargées en mode dégradé', 'warning');
      } else {
        showToast('Erreur de connexion', 'error');
        navigate('/gere-payer');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECTION: Générer toutes les années dynamiquement (-5 ans / +5 ans)
  const fetchAnneesDisponibles = async (type) => {
    try {
      // Essayer de récupérer les années depuis l'API
      const response = await fetch(`http://localhost:3001/api/paiements/annees-disponibles/${type}`);
      const data = await response.json();
      
      const currentYear = new Date().getFullYear();
      let annees = [];
      
      // ✅ Calculer la plage dynamique: -5 ans et +5 ans par rapport à l'année actuelle
      const minAnnee = currentYear - 5;
      const maxAnnee = currentYear + 5;
      
      if (data.success && data.annees.length) {
        // ✅ Combiner les années de l'API avec la plage dynamique
        const anneesExistantes = data.annees;
        
        // ✅ Générer une plage continue de années (de minAnnee à maxAnnee)
        for (let i = minAnnee; i <= maxAnnee; i++) {
          annees.push(i);
        }
        
        // ✅ Ajouter les années existantes qui pourraient être en dehors de la plage
        for (const annee of anneesExistantes) {
          if (!annees.includes(annee)) {
            annees.push(annee);
          }
        }
        
        // ✅ Trier et dédoublonner
        annees = [...new Set(annees)].sort((a, b) => a - b);
      } else {
        // ✅ Si aucune année n'est trouvée, générer de minAnnee à maxAnnee
        for (let i = minAnnee; i <= maxAnnee; i++) {
          annees.push(i);
        }
      }
      
      setAnneesDisponibles(annees);
      
      // ✅ Sélectionner l'année en cours par défaut
      if (annees.includes(currentYear)) {
        setSelectedYear(currentYear);
      } else {
        setSelectedYear(annees[annees.length - 1]);
      }
      
      console.log('📅 Années disponibles (dynamiques):', annees);
      console.log(`📅 Plage: ${minAnnee} à ${maxAnnee} (année actuelle: ${currentYear})`);
      
    } catch (error) {
      console.error('❌ Erreur années:', error);
      // ✅ En cas d'erreur, générer la plage dynamique
      const currentYear = new Date().getFullYear();
      const minAnnee = currentYear - 5;
      const maxAnnee = currentYear + 5;
      const annees = [];
      for (let i = minAnnee; i <= maxAnnee; i++) {
        annees.push(i);
      }
      setAnneesDisponibles(annees);
      setSelectedYear(new Date().getFullYear());
    }
  };

  const fetchPaiementsExistants = async (usagerId, type) => {
    try {
      const response = await fetch(`http://localhost:3001/api/paiements/usager/${usagerId}/${type}`);
      const data = await response.json();
      if (data.success) {
        const paiementsAnnee = data.paiements.filter(p => p.annee === selectedYear);
        setMoisPayes(paiementsAnnee);
      } else {
        setMoisPayes([]);
      }
    } catch (error) {
      console.error('❌ Erreur fetch paiements:', error);
      setMoisPayes([]);
    }
  };

  useEffect(() => {
    if (selectedUsagerId && usagerType) {
      fetchPaiementsExistants(selectedUsagerId, usagerType);
      setMoisSelectionnes([]);
      setTousMois(false);
    }
  }, [selectedYear]);

  const handleNombreMoisChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const maxMois = Math.min(12, getMoisDisponiblesRestants().length);
    const finalValue = Math.min(Math.max(value, 1), maxMois);
    setNombreMois(finalValue);
    const moisDisponibles = getMoisDisponiblesRestants();
    const moisSelectionnesAuto = moisDisponibles.slice(0, finalValue);
    setMoisSelectionnes(moisSelectionnesAuto);
    setTousMois(finalValue === moisDisponibles.length && moisDisponibles.length > 0);
  };

  const toggleMois = (mois) => {
    if (estMoisPaye(mois, selectedYear)) {
      showToast(`Le mois ${moisLabels[mois - 1]} est déjà payé`, 'warning');
      return;
    }
    setMoisSelectionnes(prev => {
      let nouveau = prev.includes(mois) ? prev.filter(m => m !== mois) : [...prev, mois].sort((a, b) => a - b);
      setNombreMois(nouveau.length);
      const disponible = getMoisDisponiblesRestants();
      setTousMois(nouveau.length === disponible.length && disponible.length > 0);
      return nouveau;
    });
  };

  const toggleTousMois = () => {
    const moisDisponibles = getMoisDisponiblesRestants();
    if (tousMois) {
      setMoisSelectionnes([]);
      setTousMois(false);
      setNombreMois(0);
    } else {
      setMoisSelectionnes([...moisDisponibles]);
      setTousMois(true);
      setNombreMois(moisDisponibles.length);
    }
  };

  const enregistrerPaiement = async (usagerId, usagerType, montant, datePaiement, mois, annee, montantRetard, isRetard) => {
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        usagerId: usagerId,
        usagerType: usagerType,
        type_paiement: 'mensuel',
        annee: annee,
        mois: mois,
        montant: montant,
        date_paiement: datePaiement,
        frais_dossier: 0,
        montant_retard: montantRetard || 0,
        est_retard: isRetard || false,
        statut: 'paye'
      };

      const response = await fetch('http://localhost:3001/api/paiements/enregistrer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'adminToken': token || ''
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        return true;
      } else {
        console.error(`❌ Erreur enregistrement paiement:`, result.message);
        return false;
      }
    } catch (error) {
      console.error(`❌ Erreur enregistrement paiement:`, error);
      return false;
    }
  };

  const handleDownloadPDF = async (facture) => {
    try {
      setIsGenerating(true);
      showToast('🔄 Génération du PDF en cours...', 'info');
      await generateFacturePDF(facture, false);
      showToast('✅ PDF téléchargé avec succès !', 'success');
    } catch (error) {
      console.error('Erreur PDF:', error);
      showToast('❌ Erreur de génération PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadZip = async () => {
    if (facturesGenerees.length === 0) {
      showToast('Aucune facture à générer', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      showToast(`🔄 Génération du ZIP avec ${facturesGenerees.length} fichiers...`, 'info');

      const zip = new JSZip();
      let count = 0;

      for (const facture of facturesGenerees) {
        try {
          const pdfBlob = await generateFacturePDF(facture, true);
          
          if (pdfBlob && pdfBlob instanceof Blob) {
            const filename = `Facture_${facture.num_facture || '0000'}_${facture.ref_client_type || 'AUT'}.pdf`;
            zip.file(filename, pdfBlob);
            count++;
            console.log(`✅ PDF ajouté au ZIP: ${filename}`);
          } else {
            console.warn(`⚠️ Pas de blob pour la facture ${facture.num_facture}`);
          }
        } catch (err) {
          console.error('Erreur génération PDF:', err);
        }
      }

      if (count === 0) {
        showToast('❌ Aucun PDF généré', 'error');
        setIsGenerating(false);
        return;
      }

      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `Factures_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
      
      showToast(`✅ ${count} PDFs téléchargés dans le ZIP !`, 'success');
    } catch (error) {
      console.error('Erreur ZIP:', error);
      showToast('❌ Erreur de génération du ZIP: ' + error.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ Fonction pour obtenir les montants à jour pour la génération
  const getMontantsPourGeneration = () => {
    return { ...montantsParMois };
  };

  const genererFactures = async () => {
    if (!usager) {
      showToast('Aucun usager sélectionné', 'error');
      return;
    }

    if (!personneRecu.trim()) {
      showToast('Veuillez saisir le nom de la personne qui reçoit', 'error');
      return;
    }

    if (!quittance || !quittanceValidee) {
      showToast('Veuillez valider le numéro de quittance', 'error');
      return;
    }

    if (moisSelectionnes.length === 0) {
      showToast('Veuillez sélectionner au moins un mois', 'error');
      return;
    }

    setIsSubmitting(true);
    let erreurs = [];
    let facturesGenereesList = [];
    let paiementsOk = 0;

    try {
      const moisAPayer = moisSelectionnes.sort((a, b) => a - b);
      const annee = selectedYear;
      const datePaiement = paymentDate;

      // ✅ Utiliser les montants actuels pour chaque mois
      for (const mois of moisAPayer) {
        const montantMois = montantsParMois[mois] || 0;
        console.log(`📊 Mois ${mois} - Montant: ${montantMois}`);
        
        const paiementReussi = await enregistrerPaiement(
          usager.id,
          usagerType,
          montantMois,
          datePaiement,
          mois,
          annee,
          isRetard ? montantRetard : 0,
          isRetard
        );
        if (paiementReussi) paiementsOk++;
      }

      const descriptionFinale = descriptionConfirmee || null;

      if (factureType === 'A') {
        // TYPE A: Une seule facture groupée
        try {
          // ✅ Calculer le total avec les montants actuels
          let totalFacture = 0;
          moisAPayer.forEach(mois => {
            totalFacture += (montantsParMois[mois] || 0);
          });
          if (isRetard) totalFacture += montantRetard;

          console.log('📊 Total facture type A:', totalFacture);
          console.log('📊 Montants par mois:', montantsParMois);

          const response = await fetch('http://localhost:3001/api/factures/creer-avec-paiement-groupe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usagerId: usager.id,
              usagerType: usagerType,
              userId: userId,
              typeFacture: 'DAFC',
              regionUsager: usager.region || '',
              personneRecu: personneRecu,
              montantMensuel: parseFloat(montantMensuel) || 0,
              fraisDossier: 0,
              montantRetard: isRetard ? montantRetard : 0,
              isRetard: isRetard,
              uniter: uniter,
              soitTotal: totalFacture,
              mois: moisAPayer,
              annee: annee,
              datePaiement: datePaiement,
              numFactureType: 'A',
              typeGroupe: 'A',
              descriptionPersonnalisee: descriptionFinale,
              montantsParMois: montantsParMois // ✅ Envoyer les montants actuels
            })
          });

          const result = await response.json();
          if (result.success) {
            const factureResponse = await fetch(`http://localhost:3001/api/factures/${result.factureId}`);
            const factureData = await factureResponse.json();
            if (factureData.success) {
              // ✅ Ajouter les montants actuels à la facture
              factureData.facture.montants_par_mois = { ...montantsParMois };
              factureData.facture.mois_list = moisAPayer;
              factureData.facture.montant_mensuel_affiche = parseFloat(montantMensuel) || 0;
              factureData.facture.uniter_affiche = uniter;
              facturesGenereesList.push(factureData.facture);
            }
          } else {
            erreurs.push(result.message || 'Erreur génération facture');
          }
        } catch (err) {
          erreurs.push(err.message || 'Erreur technique');
        }
      } else {
        // TYPE B: Factures séparées par mois
        for (let i = 0; i < moisAPayer.length; i++) {
          const mois = moisAPayer[i];
          const moisLabel = moisLabels[mois - 1];
          const suffixe = String.fromCharCode(64 + mois);
          
          // ✅ Utiliser le montant actuel du mois
          const montantMois = montantsParMois[mois] || 0;
          const totalAvecRetard = montantMois + (isRetard ? montantRetard : 0);

          console.log(`📊 Mois ${mois} (${moisLabel}) - Montant: ${montantMois}, Total avec retard: ${totalAvecRetard}`);

          try {
            const response = await fetch('http://localhost:3001/api/factures/creer-avec-paiement', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                usagerId: usager.id,
                usagerType: usagerType,
                userId: userId,
                typeFacture: 'DAFC',
                regionUsager: usager.region || '',
                personneRecu: personneRecu,
                montantMensuel: montantMois, // ✅ Montant actuel du mois
                fraisDossier: 0,
                montantRetard: isRetard ? montantRetard : 0,
                isRetard: isRetard,
                uniter: 1,
                soitTotal: totalAvecRetard,
                mois: mois,
                annee: annee,
                datePaiement: datePaiement,
                numFactureType: 'B',
                suffixe: suffixe,
                descriptionPersonnalisee: descriptionFinale
              })
            });

            const result = await response.json();
            if (result.success) {
              const factureResponse = await fetch(`http://localhost:3001/api/factures/${result.factureId}`);
              const factureData = await factureResponse.json();
              if (factureData.success) {
                facturesGenereesList.push(factureData.facture);
              }
            } else {
              erreurs.push(`${moisLabel} (${result.message || 'erreur'})`);
            }
          } catch (err) {
            erreurs.push(`${moisLabel} (${err.message || 'erreur technique'})`);
          }
        }
      }

      if (paiementsOk > 0) {
        await fetchPaiementsExistants(usager.id, usagerType);
      }

      if (facturesGenereesList.length > 0) {
        setFacturesGenerees(facturesGenereesList);
        setShowFactures(true);

        setMoisSelectionnes([]);
        setTousMois(false);
        setNombreMois(1);

        let message = `✅ ${facturesGenereesList.length} facture(s) générée(s) avec succès`;
        if (paiementsOk > 0) {
          message += ` (${paiementsOk} paiement(s) enregistré(s))`;
        }
        if (erreurs.length > 0) {
          message += `, mais ${erreurs.length} mois en erreur: ${erreurs.join(', ')}`;
        }
        showToast(message, facturesGenereesList.length > 0 ? 'success' : 'warning');
      } else if (erreurs.length > 0) {
        showToast(`❌ Aucune facture générée. Erreurs: ${erreurs.join(', ')}`, 'error');
      }

    } catch (error) {
      console.error('❌ Erreur génération factures:', error);
      showToast('Erreur lors de la génération des factures', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'hotel': 'Hôtel',
      'grand-surface': 'Grande Surface',
      'bus': 'Transport',
      'nightclub': 'Night Club',
      'media': 'Média',
      'occ': 'Occasionnel'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'hotel': Hotel,
      'grand-surface': Store,
      'bus': Bus,
      'nightclub': Music,
      'media': Tv,
      'occ': Tent
    };
    return icons[type] || Building2;
  };

  if (loading) {
    return (
      <>
        <MiniSidebar />
        <div className="pm-loading">
          <Loader2 size={48} className="spinner" />
          <p>Chargement des données...</p>
        </div>
      </>
    );
  }

  if (!usager) {
    return (
      <>
        <MiniSidebar />
        <div className="pm-error">
          <AlertCircle size={48} />
          <p>Usager non trouvé</p>
          <button onClick={() => navigate('/gere-payer')} className="pm-btn-back">
            Retour
          </button>
        </div>
      </>
    );
  }

  const IconComponent = getTypeIcon(usagerType);
  const typeLabel = getTypeLabel(usagerType);
  const moisDisponibles = getMoisDisponiblesRestants();
  const maxMoisDisponibles = moisDisponibles.length;

  return (
    <>
      <MiniSidebar />
      <div className="paiement-mensuel-container">
        <div className="pm-header">
          <div className="pm-header-left">
            <button className="pm-btn-back" onClick={() => navigate('/gere-payer')}>
              <ArrowLeft size={20} /> Retour
            </button>
            <div className="pm-header-info">
              <h1>Paiement Mensuel</h1>
              <div className="pm-header-type">
                <IconComponent size={18} />
                <span>{typeLabel}</span>
                <span className="pm-header-id">#{String(usager.id).padStart(3, '0')}</span>
              </div>
            </div>
          </div>
          <div className="pm-header-right">
            {dataSource === 'fallback' && (
              <span className="pm-header-badge" style={{ background: '#fff3cd', color: '#856404' }}>
                <AlertTriangle size={14} /> Mode dégradé
              </span>
            )}
            <span className="pm-header-badge">
              <Clock size={14} /> Paiement Multiple
            </span>
          </div>
        </div>

        <div className="pm-body">
          {/* Informations de l'usager */}
          <div className="pm-section pm-usager-info">
            <h3><User size={18} /> Informations de l'usager</h3>
            <div className="pm-usager-grid">
              <div className="pm-usager-item">
                <span className="pm-label">Dénomination</span>
                <span className="pm-value">{usager.denomination || usager.nom_evenement || usager.organisateurs || '-'}</span>
              </div>
              <div className="pm-usager-item">
                <span className="pm-label">Demandeur</span>
                <span className="pm-value">{usager.demandeur || usager.representant_par || '-'}</span>
              </div>
              <div className="pm-usager-item">
                <span className="pm-label"><Phone size={14} /> Téléphone</span>
                <span className="pm-value">{usager.telephone || '-'}</span>
              </div>
              <div className="pm-usager-item">
                <span className="pm-label"><Mail size={14} /> Email</span>
                <span className="pm-value">{usager.email || '-'}</span>
              </div>
              <div className="pm-usager-item">
                <span className="pm-label"><MapPin size={14} /> Région</span>
                <span className="pm-value">{usager.region || '-'}</span>
              </div>
              <div className="pm-usager-item">
                <span className="pm-label"><MapPin size={14} /> Adresse</span>
                <span className="pm-value">{usager.adresse || usager.adresse_siege || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section Type de facture */}
          <div className="pm-section pm-type-facture-section">
            <h3><Layers size={18} /> Type de facture</h3>
            <div className="pm-type-facture-container">
              <div className="pm-type-options">
                <label className={`pm-type-option ${factureType === 'A' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    value="A"
                    checked={factureType === 'A'}
                    onChange={() => {
                      setFactureType('A');
                      const moisDispo = getMoisDisponiblesRestants();
                      const nb = Math.min(nombreMois, moisDispo.length);
                      setMoisSelectionnes(moisDispo.slice(0, nb));
                    }}
                  />
                  <div className="pm-type-option-content">
                    <span className="pm-type-option-title">Type A</span>
                    <span className="pm-type-option-desc">Une seule facture groupée</span>
                    <span className="pm-type-option-badge">Tous les mois sur une facture</span>
                  </div>
                </label>

                <label className={`pm-type-option ${factureType === 'B' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    value="B"
                    checked={factureType === 'B'}
                    onChange={() => {
                      setFactureType('B');
                      const moisDispo = getMoisDisponiblesRestants();
                      const nb = Math.min(nombreMois, moisDispo.length);
                      setMoisSelectionnes(moisDispo.slice(0, nb));
                    }}
                  />
                  <div className="pm-type-option-content">
                    <span className="pm-type-option-title">Type B</span>
                    <span className="pm-type-option-desc">Factures séparées</span>
                    <span className="pm-type-option-badge">Une facture par mois</span>
                  </div>
                </label>
              </div>

              {factureType === 'B' && moisSelectionnes.length > 1 && (
                <div className="pm-type-info">
                  <Info size={16} />
                  <span>{moisSelectionnes.length} factures seront générées avec les suffixes correspondant aux mois (A=Janvier, B=Février, ...)</span>
                </div>
              )}
              {factureType === 'A' && moisSelectionnes.length > 1 && (
                <div className="pm-type-info">
                  <Info size={16} />
                  <span>Une seule facture pour {moisSelectionnes.length} mois (Total: {totalGeneral.toLocaleString('fr-FR')} Ar)</span>
                </div>
              )}
            </div>
          </div>

          {/* Section paiement */}
          <div className="pm-section pm-paiement-section">
            <h3><CreditCard size={18} /> Paramètres du paiement</h3>

            <div className="pm-paiement-grid">
              <div className="pm-form-group">
                <label><Calendar size={15} /> Date de paiement</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="pm-form-group">
                <label><Calendar size={15} /> Année de paiement</label>
                {/* ✅ Afficher TOUTES les années disponibles (passées, présente, futures) */}
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="pm-year-select"
                >
                  {anneesDisponibles.map(y => (
                    <option key={y} value={y}>
                      {y} {y === new Date().getFullYear() ? '(En cours)' : y < new Date().getFullYear() ? '(Passée)' : '(Future)'}
                    </option>
                  ))}
                </select>
                <small className="pm-field-hint">
                  Vous pouvez payer pour les années {Math.min(...anneesDisponibles)} à {Math.max(...anneesDisponibles)}
                </small>
              </div>

              <div className="pm-form-group">
                <label><DollarSign size={15} /> Montant mensuel (Ar)</label>
                <input
                  type="number"
                  value={montantMensuel}
                  onChange={(e) => handleMontantMensuelChange(e.target.value)}
                  placeholder="Saisir le montant mensuel"
                  step="1"
                  min="0"
                  className="pm-montant-input"
                />
              </div>

              <div className="pm-form-group">
                <label><Hash size={15} /> Uniter</label>
                <input
                  type="number"
                  value={uniter}
                  onChange={(e) => {
                    const newUniter = parseInt(e.target.value) || 1;
                    setUniter(newUniter);
                  }}
                  min="1"
                  step="1"
                  className="pm-uniter-input"
                />
                <small className="pm-field-hint">Multiplicateur du montant mensuel</small>
              </div>

              <div className="pm-form-group pm-retard-group">
                <label><AlertTriangle size={15} /> Retard</label>
                <div className="pm-retard-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={isRetard}
                      onChange={(e) => setIsRetard(e.target.checked)}
                    />
                    Activer le retard
                  </label>
                </div>
                {isRetard && (
                  <input
                    type="number"
                    value={montantRetard}
                    onChange={(e) => setMontantRetard(parseFloat(e.target.value) || 0)}
                    placeholder="Montant du retard"
                    className="pm-retard-input"
                    step="1"
                    min="0"
                  />
                )}
              </div>

              <div className="pm-form-group pm-total-group">
                <label><ReceiptText size={15} /> Total général (Ar)</label>
                <div className="pm-total-display">
                  <span className="pm-total-amount">
                    {totalGeneral.toLocaleString('fr-FR')} Ar
                  </span>
                  <span className="pm-total-detail">
                    {moisSelectionnes.length} mois sélectionné(s)
                    {isRetard ? ` + ${montantRetard} Ar (retard)` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Description personnalisée */}
          <div className="pm-section pm-description-section">
            <h3><Edit3 size={18} /> Description personnalisée</h3>
            <div className="pm-description-container">
              <div className="pm-description-input-group">
                <input
                  type="text"
                  value={descriptionPersonnalisee}
                  onChange={(e) => setDescriptionPersonnalisee(e.target.value)}
                  placeholder="Ex: Authentification de facture, Paiement anticipé, ..."
                  className="pm-description-input"
                />
                <button
                  className="pm-description-btn-confirm"
                  onClick={handleConfirmerDescription}
                >
                  <CheckSquare size={18} />
                  Confirmer
                </button>
                <button
                  className="pm-description-btn-clear"
                  onClick={handleEffacerDescription}
                >
                  ✕
                </button>
              </div>
              <small className="pm-field-hint">
                {descriptionConfirmee ? '✅ Description confirmée' : '💡 Laissez vide pour utiliser la dénomination de l\'usager'}
              </small>
              {descriptionConfirmee && (
                <div className="pm-description-confirmee">
                  <CheckCircle size={16} color="#27ae60" />
                  <span>Description confirmée : <strong>"{descriptionConfirmee}"</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Section sélection des mois */}
          <div className="pm-section pm-mois-section">
            <h3><Calendar size={18} /> Sélection des mois à payer</h3>

            <div className="pm-mois-info">
              <span className="pm-mois-count">
                {maxMoisDisponibles} mois disponibles pour {selectedYear}
              </span>
              {moisPayes.length > 0 && (
                <span className="pm-mois-payes">
                  <ShieldCheck size={14} color="#27ae60" />
                  {moisPayes.length} mois déjà payés
                </span>
              )}
            </div>

            <div className="pm-mois-selecteur">
              <div className="pm-mois-selecteur-label">
                <span>Nombre de mois à payer :</span>
                <span className="pm-mois-selecteur-info">
                  (1 - {maxMoisDisponibles} disponible{maxMoisDisponibles > 1 ? 's' : ''})
                </span>
              </div>
              <div className="pm-mois-selecteur-input">
                <button
                  className="pm-mois-selecteur-btn"
                  onClick={() => {
                    const newVal = Math.max(1, nombreMois - 1);
                    setNombreMois(newVal);
                    const moisDispo = getMoisDisponiblesRestants();
                    setMoisSelectionnes(moisDispo.slice(0, newVal));
                  }}
                  disabled={nombreMois <= 1 || maxMoisDisponibles === 0}
                >
                  −
                </button>
                <input
                  type="number"
                  value={nombreMois}
                  onChange={handleNombreMoisChange}
                  min="1"
                  max={maxMoisDisponibles || 1}
                  className="pm-mois-selecteur-input-number"
                />
                <button
                  className="pm-mois-selecteur-btn"
                  onClick={() => {
                    const newVal = Math.min(maxMoisDisponibles, nombreMois + 1);
                    setNombreMois(newVal);
                    const moisDispo = getMoisDisponiblesRestants();
                    setMoisSelectionnes(moisDispo.slice(0, newVal));
                  }}
                  disabled={nombreMois >= maxMoisDisponibles || maxMoisDisponibles === 0}
                >
                  +
                </button>
                <button
                  className="pm-mois-selecteur-all"
                  onClick={toggleTousMois}
                  disabled={maxMoisDisponibles === 0}
                >
                  {tousMois ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              <div className="pm-mois-selected-info">
                {moisSelectionnes.length} mois sélectionné(s)
                {moisSelectionnes.length > 0 && (
                  <span className="pm-mois-selected-list">
                    ({moisSelectionnes.map(m => moisLabelsShort[m - 1]).join(', ')})
                  </span>
                )}
                {moisSelectionnes.length > 0 && (
                  <span className="pm-mois-selected-total">
                    Total : {totalGeneral.toLocaleString('fr-FR')} Ar
                  </span>
                )}
              </div>
            </div>

            <div className="pm-mois-grid">
              {moisLabels.map((label, index) => {
                const mois = index + 1;
                const estPaye = estMoisPaye(mois, selectedYear);
                const estDisponible = moisDisponibles.includes(mois);
                const estSelectionne = moisSelectionnes.includes(mois);
                const montantMois = montantsParMois[mois] || 0;

                let statut = 'indisponible';
                if (estPaye) statut = 'paye';
                else if (estSelectionne) statut = 'disponible selected';
                else if (estDisponible) statut = 'disponible';

                const estCliquable = estDisponible && !estPaye;

                return (
                  <div
                    key={mois}
                    className={`pm-mois-item ${statut}`}
                    style={{ cursor: estCliquable ? 'pointer' : 'default' }}
                  >
                    <div className="pm-mois-header">
                      <span className="pm-mois-label">{label}</span>
                      <span className="pm-mois-num">{mois}</span>
                    </div>
                    
                    {/* ✅ INPUT NUMBER MODIFIABLE - CORRIGÉ */}
                    {estCliquable && (
                      <div className="pm-mois-montant">
                        <input
                          type="number"
                          value={montantMois || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleMontantMoisChange(mois, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.target.select()}
                          placeholder="Montant"
                          className="pm-mois-input"
                          step="1"
                          min="0"
                          autoComplete="off"
                        />
                      </div>
                    )}
                    
                    <div className="pm-mois-badges">
                      {estPaye && (
                        <span className="pm-mois-badge paye">
                          <CheckCircle size={12} /> Payé
                        </span>
                      )}
                      {estSelectionne && !estPaye && (
                        <span className="pm-mois-badge selected">
                          <Check size={12} /> ✓
                        </span>
                      )}
                      {!estPaye && estDisponible && !estSelectionne && (
                        <span className="pm-mois-badge disponible">
                          Sélectionner
                        </span>
                      )}
                      {!estPaye && !estDisponible && (
                        <span className="pm-mois-badge indisponible">
                          <X size={12} />
                        </span>
                      )}
                    </div>
                    
                    {estCliquable && (
                      <div 
                        className="pm-mois-click-area"
                        onClick={() => toggleMois(mois)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section personne reçu */}
          <div className="pm-section pm-personne-section">
            <h3><User size={18} /> Personne qui reçoit</h3>
            <div className="pm-personne-container">
              <input
                type="text"
                value={personneRecu}
                onChange={(e) => setPersonneRecu(e.target.value)}
                placeholder="Saisir le nom de la personne qui reçoit"
                className="pm-personne-input"
              />
            </div>
          </div>

          {/* Section quittance */}
          <div className="pm-section pm-quittance-section">
            <h3><FileCheck size={18} /> Quittance</h3>
            <div className="pm-quittance-container">
              <div className="pm-quittance-input-group">
                <input
                  type="text"
                  value={quittance}
                  onChange={(e) => setQuittance(getOnlyNumbers(e.target.value))}
                  placeholder="Numéro de quittance"
                  className="pm-quittance-input"
                />
                <label className="pm-quittance-checkbox">
                  <input
                    type="checkbox"
                    checked={quittanceValidee}
                    onChange={(e) => {
                      if (!quittance) {
                        showToast('Veuillez saisir un numéro de quittance', 'error');
                        return;
                      }
                      setQuittanceValidee(e.target.checked);
                    }}
                  />
                  Valider la quittance
                </label>
              </div>
              {quittance && quittanceValidee && (
                <div className="pm-quittance-validee">
                  <CheckCircle size={16} color="#27ae60" />
                  <span>Quittance validée : <strong>{quittance}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Bouton générer */}
          <button
            className="pm-btn-generate"
            onClick={genererFactures}
            disabled={isSubmitting || !personneRecu.trim() || !quittance || !quittanceValidee || moisSelectionnes.length === 0}
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="spinner" /> Génération en cours...</>
            ) : (
              <><Save size={18} /> Générer {moisSelectionnes.length} facture(s) ({factureType === 'A' ? 'Groupé' : 'Séparé'})</>
            )}
          </button>
        </div>

        {/* Liste des factures générées */}
        {showFactures && facturesGenerees.length > 0 && (
          <div className="pm-factures-generees">
            <div className="pm-factures-header">
              <h3><FileText size={18} /> Factures générées ({facturesGenerees.length})</h3>
              <div className="pm-factures-actions">
                <button
                  className="pm-btn-pdf-zip"
                  onClick={handleDownloadZip}
                  disabled={isGenerating}
                  title="Télécharger toutes les factures en ZIP"
                >
                  {isGenerating ? (
                    <><Loader2 size={16} className="spinner" /> Génération...</>
                  ) : (
                    <><FileArchive size={16} /> Télécharger ZIP</>
                  )}
                </button>
                <button
                  className="pm-btn-toggle"
                  onClick={() => setShowFactures(!showFactures)}
                >
                  {showFactures ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
            </div>

            {showFactures && (
              <div className="pm-factures-list">
                {facturesGenerees.map((facture, index) => {
                  const dateFacture = new Date(facture.a_compter_du);
                  const moisIndex = dateFacture.getMonth();
                  return (
                    <div key={index} className="pm-facture-item">
                      <div className="pm-facture-info">
                        <span className="pm-facture-num">{facture.num_facture}</span>
                        <span className="pm-facture-date">
                          {moisLabels[moisIndex]} {dateFacture.getFullYear()}
                          {facture.mois_groupes && ` (${facture.mois_groupes})`}
                        </span>
                        <span className="pm-facture-montant">{facture.soit_total.toLocaleString('fr-FR')} Ar</span>
                      </div>
                      <button
                        className="pm-btn-pdf"
                        onClick={() => handleDownloadPDF(facture)}
                        disabled={isGenerating}
                      >
                        <Download size={16} /> PDF
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="pm-footer">
          <button className="pm-btn-print" onClick={() => window.print()}>
            <Printer size={18} /> Imprimer
          </button>
        </div>
      </div>
    </>
  );
};

export default PaiementMensuel;