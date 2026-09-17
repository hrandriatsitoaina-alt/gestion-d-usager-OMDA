// src/pages/PaiementMensuel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, CreditCard, Calendar, DollarSign, Hash, FileText, CheckCircle,
  AlertCircle, Loader2, User, Building2, Phone, Mail, MapPin, Clock, Save,
  Printer, FileCheck, ReceiptText, ChevronDown, ChevronUp, AlertTriangle,
  Hotel, Store, Bus, Music, Tv, Tent, Check, X, ShieldCheck, Layers,
  Edit3, CheckSquare, Download, FileArchive, RefreshCw, UserCog,
  Package   // ✅ AJOUTÉ
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
  const [montantRetard, setMontantRetard] = useState(0);
  const [isRetard, setIsRetard] = useState(false);
  const [uniter, setUniter] = useState(1);

  const [fraisRenouvellement, setFraisRenouvellement] = useState('');

  const [montantsParMois, setMontantsParMois] = useState({});
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

  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  const [moisLabels] = useState(['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']);
  const [moisLabelsShort] = useState(['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']);
  const [userId, setUserId] = useState(null);

  const [dataSource, setDataSource] = useState('api');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editedUsager, setEditedUsager] = useState({});
  const [isSavingUsager, setIsSavingUsager] = useState(false);
  const [usagerModifieRenouvellement, setUsagerModifieRenouvellement] = useState(false);

  const getOnlyNumbers = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };

  const estMoisPaye = (mois, annee) => {
    return moisPayes.some(p => Number(p.annee) === Number(annee) && Number(p.mois) === Number(mois));
  };

  const getMoisDisponiblesRestants = () => {
    const moisPayesAnnee = moisPayes.filter(p => Number(p.annee) === Number(selectedYear)).map(p => Number(p.mois));
    let disponibles = [];
    for (let i = 1; i <= 12; i++) {
      if (!moisPayesAnnee.includes(i)) {
        disponibles.push(i);
      }
    }
    return disponibles;
  };

  const distribuerMontantTotalSurMois = (montantTotal, mois) => {
    if (!mois || mois.length === 0) return {};
    const montantParMois = montantTotal / mois.length;
    const result = {};
    mois.forEach(m => {
      result[m] = Math.round(montantParMois * 100) / 100;
    });
    return result;
  };

  const getTotalGeneralCalcule = useCallback(() => {
    const uniterActuel = parseInt(uniter) || 1;
    const montantActuel = parseFloat(montantMensuel) || 0;

    if (moisSelectionnes.length === 0) return 0;

    let total = montantActuel * uniterActuel;

    if (isRetard) total += montantRetard;
    if (factureType === 'C' && parseFloat(fraisRenouvellement) > 0) {
      total += parseFloat(fraisRenouvellement);
    }

    return total;
  }, [montantMensuel, uniter, isRetard, montantRetard, fraisRenouvellement, factureType, moisSelectionnes.length]);

  const recalculerTotal = useCallback(() => {
    const total = getTotalGeneralCalcule();
    setTotalGeneral(total);
  }, [getTotalGeneralCalcule]);

  useEffect(() => {
    recalculerTotal();
  }, [moisSelectionnes, isRetard, montantRetard, fraisRenouvellement, uniter, factureType, montantMensuel, recalculerTotal]);

  useEffect(() => {
    if (factureType === 'B' && moisSelectionnes.length > 0) {
      const montantTotal = (parseFloat(montantMensuel) || 0) * (parseInt(uniter) || 1);
      const nouveauxMontants = distribuerMontantTotalSurMois(montantTotal, moisSelectionnes);
      setMontantsParMois(prev => {
        const result = { ...prev };
        moisSelectionnes.forEach(m => {
          result[m] = nouveauxMontants[m];
        });
        return result;
      });
    }
  }, [moisSelectionnes.length, montantMensuel, uniter, factureType]);

  useEffect(() => {
    if (usager && usagerType) {
      let montantBase = 0;
      if (usagerType === 'occ') {
        montantBase = parseFloat(usager.montant) || parseFloat(usager.montant_total) || 0;
      } else if (usagerType === 'media') {
        montantBase = parseFloat(usager.taux) || parseFloat(usager.montant_mensuel) || 0;
      } else if (usagerType === 'other') {
        montantBase = parseFloat(usager.soit_total) ||
                      parseFloat(usager.montant_total) ||
                      parseFloat(usager.montant) || 0;
      } else {
        montantBase = parseFloat(usager.montant_mensuel) || 0;
      }

      if (montantBase > 0) {
        setMontantMensuel(montantBase.toString());
      } else {
        setMontantMensuel('');
      }

      const nouveauxMontants = {};
      for (let i = 1; i <= 12; i++) {
        nouveauxMontants[i] = montantBase;
      }
      setMontantsParMois(nouveauxMontants);
    }
  }, [usager, usagerType]);

  // ✅ AJOUT : cas 'other' dans appliquerMontants
  const appliquerMontants = (usagerSource, type) => {
    let montant = 0;
    let retardVal = 0;
    let retardActif = false;
    let unit = 1;

    if (type === 'other') {
      // ✅ Pour other : le montant vient de la facture (soit_total)
      montant = parseFloat(usagerSource.soit_total) ||
                parseFloat(usagerSource.montant_total) ||
                parseFloat(usagerSource.montant) || 0;
      retardVal = parseFloat(usagerSource.montant_retard) || 0;
      retardActif = usagerSource.is_retard || false;
      unit = 1;
    } else if (type === 'occ') {
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
    setMontantRetard(retardVal);
    setIsRetard(retardActif);
    setUniter(unit || 1);

    const nouveauxMontants = {};
    for (let i = 1; i <= 12; i++) {
      nouveauxMontants[i] = montant;
    }
    setMontantsParMois(nouveauxMontants);
  };

  const handleConfirmerDescription = () => {
    if (descriptionPersonnalisee.trim()) {
      setDescriptionConfirmee(descriptionPersonnalisee.trim());
      showToast('✅ Description confirmée : ' + descriptionPersonnalisee.trim(), 'success');
    } else {
      setDescriptionConfirmee('');
      showToast('✅ Description effacée', 'info');
    }
  };

  const handleEffacerDescription = () => {
    setDescriptionPersonnalisee('');
    setDescriptionConfirmee('');
    showToast('✅ Description effacée', 'info');
  };

  const openEditModal = (isObligatoire = false) => {
    setEditedUsager({ ...usager });
    setShowEditModal(true);
    if (isObligatoire) {
      showToast('⚠️ Renouvellement de contrat : veuillez confirmer les informations de l\'usager', 'warning');
    }
  };

  const handleSaveUsager = async () => {
    const denominationValue =
      editedUsager.denomination ||
      editedUsager.nom_evenement ||
      editedUsager.genre_manifestation ||
      editedUsager.organisateurs ||
      usager.denomination ||
      usager.nom_evenement ||
      'Sans nom';

    if (!denominationValue || denominationValue.trim() === '') {
      showToast('La dénomination est obligatoire', 'error');
      return;
    }

    setIsSavingUsager(true);
    try {
      const token = localStorage.getItem('adminToken');

      const payload = {
        denomination: denominationValue,
        type_usager: getTypeLabel(usagerType),
        demandeur: editedUsager.demandeur || editedUsager.organisateurs || '',
        telephone: editedUsager.telephone || '',
        email: editedUsager.email || '',
        region: editedUsager.region || '',
        adresse: editedUsager.adresse || editedUsager.adresse_siege || '',
        representant_nom: editedUsager.representant_nom || editedUsager.representant_par || '',
        representant_adresse: editedUsager.representant_adresse || '',
        representant_tel: editedUsager.representant_tel || '',
        representant_cin: editedUsager.representant_cin || '',
        representant_cin_delivree: editedUsager.representant_cin_delivree || null,
        representant_cin_lieu: editedUsager.representant_cin_lieu || '',
        representant_fonction: editedUsager.representant_fonction || '',
        confirmation_nom: editedUsager.confirmation_nom || denominationValue,
        date_signature: editedUsager.date_signature || null,
        lieu_signature: editedUsager.lieu_signature || '',

        ...(usagerType === 'occ' && {
          organisateurs: editedUsager.organisateurs || denominationValue,
          representant_par: editedUsager.representant_par || editedUsager.demandeur || '',
          genre_manifestation: editedUsager.genre_manifestation || denominationValue,
          artistes: editedUsager.artistes || '',
          date_evenement: editedUsager.date_evenement || null,
          lieu_evenement: editedUsager.lieu_evenement || '',
          lieu_ajout: editedUsager.lieu_ajout || 'Antananarivo',
          domicile: editedUsager.domicile || ''
        }),

        ...(usagerType === 'media' && {
          frequence: editedUsager.frequence || '',
          canal: editedUsager.canal || '',
          siege: editedUsager.siege || '',
          nif: editedUsager.nif || '',
          stat: editedUsager.stat || '',
          taux: editedUsager.taux || editedUsager.montant_mensuel || 0
        }),

        ...(usagerType === 'hotel' && {
          activite: editedUsager.activite || '',
          etoiles: editedUsager.etoiles || '',
          ravinala: editedUsager.ravinala || false
        }),

        ...(usagerType === 'nightclub' && {
          activite: editedUsager.activite || '',
          jauge_max: editedUsager.jauge_max || 0,
          horaires: editedUsager.horaires || ''
        }),

        ...(usagerType === 'grand-surface' && {
          activite: editedUsager.activite || '',
          nombre_magasins: editedUsager.nombre_magasins || 0
        }),

        ...(usagerType === 'bus' && {
          lignes: editedUsager.lignes || '',
          nombre_vehicules: editedUsager.nombre_vehicules || 0,
          type_bus: editedUsager.type_bus || '',
          trajet: editedUsager.trajet || '',
          zones_desservies: editedUsager.zones_desservies || ''
        })
      };

      const response = await fetch(`http://localhost:3001/api/usagers/${usager.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'adminToken': token || ''
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setUsager(prev => ({ ...prev, ...editedUsager, denomination: denominationValue }));
        setUsagerModifieRenouvellement(true);
        showToast('✅ Usager modifié avec succès', 'success');
        setShowEditModal(false);
      } else {
        showToast('❌ ' + (data.message || 'Erreur lors de la modification'), 'error');
      }
    } catch (error) {
      console.error('Erreur modification usager:', error);
      showToast('❌ Erreur de connexion', 'error');
    } finally {
      setIsSavingUsager(false);
    }
  };

  const fetchLastQuittance = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/recfacture/quittance/last');
      const data = await response.json();
      if (data.success && data.nextQuittance) {
        const nextNumbers = getOnlyNumbers(data.nextQuittance);
        setQuittance(nextNumbers);
        return data.lastQuittance;
      }
      return 0;
    } catch (error) {
      console.error('❌ Erreur récupération quittance:', error);
      return 0;
    }
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
      fetchLastQuittance();
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

      // ✅ Pour "other", on n'utilise PAS /api/usagers/other/:id (route inexistante)
      // On passe directement par le fallback (usagerData du state)
      if (type === 'other') {
        if (usagerFallback) {
          usagerFinal = usagerFallback;
          source = 'fallback';
        } else {
          // Essayer de récupérer depuis la liste des other-usagers
          try {
            const res = await fetch('http://localhost:3001/api/other-usagers');
            const data = await res.json();
            if (data.success && data.usagers) {
              const found = data.usagers.find(u => Number(u.id) === Number(id));
              if (found) {
                usagerFinal = found;
                source = 'api-other';
              }
            }
          } catch (e) {
            console.warn('⚠️ Erreur récupération other-usagers:', e);
          }
        }
      } else {
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

        if (!usagerFinal && usagerFallback) {
          usagerFinal = usagerFallback;
          source = 'fallback';
        }
      }

      if (!usagerFinal) {
        showToast('Impossible de charger cet usager', 'error');
        navigate('/gere-payer');
        return;
      }

      setUsager(usagerFinal);
      setDataSource(source);
      appliquerMontants(usagerFinal, type);

      if (source === 'fallback') {
        showToast('Données chargées en mode dégradé', 'warning');
      }

      try {
        await fetchPaiementsExistants(id, type, selectedYear);
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

  const fetchAnneesDisponibles = async (type) => {
    try {
      const response = await fetch(`http://localhost:3001/api/paiements/annees-disponibles/${type}`);
      const data = await response.json();

      const currentYear = new Date().getFullYear();
      let annees = [];

      const minAnnee = currentYear - 5;
      const maxAnnee = currentYear + 5;

      if (data.success && data.annees.length) {
        const anneesExistantes = data.annees;
        for (let i = minAnnee; i <= maxAnnee; i++) {
          annees.push(i);
        }
        for (const annee of anneesExistantes) {
          if (!annees.includes(annee)) {
            annees.push(annee);
          }
        }
        annees = [...new Set(annees)].sort((a, b) => a - b);
      } else {
        for (let i = minAnnee; i <= maxAnnee; i++) {
          annees.push(i);
        }
      }

      setAnneesDisponibles(annees);

      if (annees.includes(currentYear)) {
        setSelectedYear(currentYear);
      } else {
        setSelectedYear(annees[annees.length - 1]);
      }
    } catch (error) {
      console.error('❌ Erreur années:', error);
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

  const fetchPaiementsExistants = async (usagerId, type, anneeCible = null) => {
    try {
      const annee = anneeCible !== null ? anneeCible : selectedYear;
      const response = await fetch(`http://localhost:3001/api/paiements/usager/${usagerId}/${type}`);
      const data = await response.json();
      if (data.success) {
        const paiementsAnnee = data.paiements.filter(p => Number(p.annee) === Number(annee));
        setMoisPayes(paiementsAnnee);
        console.log('✅ Paiements chargés pour', annee, ':', paiementsAnnee.length);
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
      fetchPaiementsExistants(selectedUsagerId, usagerType, selectedYear);
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
      if (result.success) return true;
      console.error(`❌ Erreur enregistrement paiement:`, result.message);
      return false;
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
      link.download = `Factures_${new Date().toISOString().slice(0, 10)}.zip`;
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

  const genererFactures = async () => {
    if (!usager) {
      showToast('Aucun usager sélectionné', 'error');
      return;
    }

    if (factureType === 'C' && !usagerModifieRenouvellement) {
      openEditModal(true);
      return;
    }

    if (!personneRecu.trim()) {
      showToast('Veuillez saisir le nom de la personne qui reçoit', 'error');
      return;
    }

    if (moisSelectionnes.length === 0) {
      showToast('Veuillez sélectionner au moins un mois', 'error');
      return;
    }

    if (factureType === 'C') {
      const fraisRenouvVal = parseFloat(fraisRenouvellement) || 0;
      if (!fraisRenouvVal || fraisRenouvVal <= 0) {
        showToast('⚠️ Type C : Veuillez saisir les frais de renouvellement de contrat (obligatoire)', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    let erreurs = [];
    let facturesGenereesList = [];
    let paiementsOk = 0;

    const uniterCapture = parseInt(uniter) || 1;
    const montantMensuelCapture = parseFloat(montantMensuel) || 0;
    const montantTotalCapture = montantMensuelCapture * uniterCapture;
    const montantsParMoisCapture = { ...montantsParMois };
    const montantRetardCapture = isRetard ? montantRetard : 0;
    const isRetardCapture = isRetard;
    const descriptionCapture = descriptionConfirmee || null;
    const fraisRenouvellementCapture = (factureType === 'C') ? (parseFloat(fraisRenouvellement) || 0) : 0;
    const anneeCapture = selectedYear;
    const datePaiementCapture = paymentDate;
    const factureTypeCapture = factureType;
    const moisAPayer = [...moisSelectionnes].sort((a, b) => a - b);

    try {
      const lastQuittanceNumber = await fetchLastQuittance();
      let currentQuittance = parseInt(quittance) || (lastQuittanceNumber + 1);

      if (!quittanceValidee) {
        setQuittance(String(currentQuittance).padStart(7, '0'));
        setQuittanceValidee(true);
      }

      for (const mois of moisAPayer) {
        let montantParMois = 0;

        if (factureTypeCapture === 'B') {
          montantParMois = parseFloat(montantsParMoisCapture[mois]) || 0;
        } else {
          montantParMois = montantTotalCapture / moisAPayer.length;
        }

        const paiementReussi = await enregistrerPaiement(
          usager.id,
          usagerType,
          montantParMois,
          datePaiementCapture,
          mois,
          anneeCapture,
          montantRetardCapture,
          isRetardCapture
        );
        if (paiementReussi) paiementsOk++;
      }

      if (factureTypeCapture === 'A') {
        let totalFacture = montantTotalCapture;
        if (isRetardCapture) totalFacture += montantRetardCapture;

        const quittanceFacture = currentQuittance;

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
            montantMensuel: montantMensuelCapture,
            fraisDossier: 0,
            montantRetard: montantRetardCapture,
            isRetard: isRetardCapture,
            uniter: uniterCapture,
            soitTotal: totalFacture,
            mois: moisAPayer,
            annee: anneeCapture,
            datePaiement: datePaiementCapture,
            numFactureType: 'A',
            typeGroupe: 'A',
            descriptionPersonnalisee: descriptionCapture,
            montantsParMois: montantsParMoisCapture,
            quittance: quittanceFacture,
            quittanceValidee: true,
            isRenouvellement: false,
            fraisRenouvellement: 0
          })
        });

        const result = await response.json();
        if (result.success) {
          const factureResponse = await fetch(`http://localhost:3001/api/factures/${result.factureId}`);
          const factureData = await factureResponse.json();
          if (factureData.success) {
            const factureComplete = {
              ...factureData.facture,
              uniter: uniterCapture,
              uniter_affiche: uniterCapture,
              montant_mensuel: montantMensuelCapture,
              montant_mensuel_affiche: montantMensuelCapture,
              montants_par_mois: montantsParMoisCapture,
              montant_retard: montantRetardCapture,
              is_retard: isRetardCapture,
              mois_list: moisAPayer,
              soit_total: totalFacture,
              description_personnalisee: descriptionCapture,
              is_renouvellement: false,
              frais_renouvellement: 0,
              frais_dossier: 0
            };
            facturesGenereesList.push(factureComplete);
            currentQuittance++;
          }
        } else {
          erreurs.push(result.message || 'Erreur génération facture A');
        }

      } else if (factureTypeCapture === 'B') {
        const quittancePartage = currentQuittance;

        for (let i = 0; i < moisAPayer.length; i++) {
          const mois = moisAPayer[i];
          const moisLabel = moisLabels[mois - 1];
          const suffixe = String.fromCharCode(64 + i + 1);

          const montantMoisReparti = parseFloat(montantsParMoisCapture[mois]) || 0;
          const montantMensuelPourFacture = montantMoisReparti / uniterCapture;

          let totalAvecRetard = montantMoisReparti + montantRetardCapture;

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
                montantMensuel: montantMensuelPourFacture,
                fraisDossier: 0,
                montantRetard: montantRetardCapture,
                isRetard: isRetardCapture,
                uniter: uniterCapture,
                soitTotal: totalAvecRetard,
                mois: mois,
                annee: anneeCapture,
                datePaiement: datePaiementCapture,
                numFactureType: 'B',
                suffixe: suffixe,
                descriptionPersonnalisee: descriptionCapture,
                quittance: quittancePartage,
                quittanceValidee: true,
                isRenouvellement: false,
                fraisRenouvellement: 0
              })
            });

            const result = await response.json();
            if (result.success) {
              const factureResponse = await fetch(`http://localhost:3001/api/factures/${result.factureId}`);
              const factureData = await factureResponse.json();
              if (factureData.success) {
                const factureComplete = {
                  ...factureData.facture,
                  uniter: uniterCapture,
                  uniter_affiche: uniterCapture,
                  montant_mensuel: montantMensuelPourFacture,
                  montant_mensuel_affiche: montantMensuelPourFacture,
                  montants_par_mois: { [mois]: montantMoisReparti },
                  montant_retard: montantRetardCapture,
                  is_retard: isRetardCapture,
                  mois_list: [mois],
                  mois_facture: mois,
                  soit_total: totalAvecRetard,
                  description_personnalisee: descriptionCapture,
                  is_renouvellement: false,
                  frais_renouvellement: 0,
                  frais_dossier: 0
                };
                facturesGenereesList.push(factureComplete);
              }
            } else {
              erreurs.push(`${moisLabel} (${result.message || 'erreur'})`);
            }
          } catch (err) {
            erreurs.push(`${moisLabel} (${err.message || 'erreur technique'})`);
          }
        }

        currentQuittance++;

      } else if (factureTypeCapture === 'C') {
        let totalFacture = montantTotalCapture;
        if (isRetardCapture) totalFacture += montantRetardCapture;
        if (fraisRenouvellementCapture > 0) {
          totalFacture += fraisRenouvellementCapture;
        }

        const quittanceFacture = currentQuittance;

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
            montantMensuel: montantMensuelCapture,
            fraisDossier: fraisRenouvellementCapture,
            montantRetard: montantRetardCapture,
            isRetard: isRetardCapture,
            uniter: uniterCapture,
            soitTotal: totalFacture,
            mois: moisAPayer,
            annee: anneeCapture,
            datePaiement: datePaiementCapture,
            numFactureType: 'C',
            typeGroupe: 'C',
            descriptionPersonnalisee: descriptionCapture,
            montantsParMois: montantsParMoisCapture,
            quittance: quittanceFacture,
            quittanceValidee: true,
            isRenouvellement: fraisRenouvellementCapture > 0,
            fraisRenouvellement: fraisRenouvellementCapture,
            suffixe: null
          })
        });

        const result = await response.json();
        if (result.success) {
          const factureResponse = await fetch(`http://localhost:3001/api/factures/${result.factureId}`);
          const factureData = await factureResponse.json();
          if (factureData.success) {
            const factureComplete = {
              ...factureData.facture,
              uniter: uniterCapture,
              uniter_affiche: uniterCapture,
              montant_mensuel: montantMensuelCapture,
              montant_mensuel_affiche: montantMensuelCapture,
              montants_par_mois: montantsParMoisCapture,
              montant_retard: montantRetardCapture,
              is_retard: isRetardCapture,
              mois_list: moisAPayer,
              soit_total: totalFacture,
              description_personnalisee: descriptionCapture,
              is_renouvellement: fraisRenouvellementCapture > 0,
              frais_renouvellement: fraisRenouvellementCapture,
              frais_dossier: fraisRenouvellementCapture
            };
            facturesGenereesList.push(factureComplete);
            currentQuittance++;
          }
        } else {
          erreurs.push(result.message || 'Erreur génération facture C');
        }
      }

      const nextQuittance = String(currentQuittance).padStart(7, '0');
      setQuittance(nextQuittance);

      if (paiementsOk > 0) {
        await fetchPaiementsExistants(usager.id, usagerType, anneeCapture);
      }

      if (facturesGenereesList.length > 0) {
        setFacturesGenerees(facturesGenereesList);
        setShowFactures(true);
        setMoisSelectionnes([]);
        setTousMois(false);
        setNombreMois(1);

        let message = `✅ ${facturesGenereesList.length} facture(s) générée(s) avec succès`;
        if (paiementsOk > 0) message += ` (${paiementsOk} paiement(s) enregistré(s))`;
        message += ` - Prochain quittance: ${nextQuittance}`;

        if (erreurs.length > 0) {
          message += `, mais ${erreurs.length} mois en erreur: ${erreurs.join(', ')}`;
        }
        showToast(message, 'success');
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
      'grand-surface': 'Grand Surface',
      'bus': 'Bus',
      'nightclub': 'Night club',
      'media': 'Télé/Radio',
      'occ': 'OCC',
      'other': 'Usager événementiel'   // ✅ AJOUTÉ
    };
    return labels[type] || type;
  };

  const getTypeLabelAffichage = (type) => {
    const labels = {
      'hotel': 'Hôtel',
      'grand-surface': 'Grande Surface',
      'bus': 'Transport',
      'nightclub': 'Night Club',
      'media': 'Média',
      'occ': 'Occasionnel',
      'other': 'Usager événementiel'   // ✅ AJOUTÉ
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
      'occ': Tent,
      'other': Package   // ✅ AJOUTÉ
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
  const typeLabel = getTypeLabelAffichage(usagerType);
  const moisDisponibles = getMoisDisponiblesRestants();
  const maxMoisDisponibles = moisDisponibles.length;
  const fraisRenouvValide = factureType === 'C' ? (parseFloat(fraisRenouvellement) > 0) : true;

  const moisHaut = [1, 2, 3, 4, 5, 6];
  const moisBas = [7, 8, 9, 10, 11, 12];

  const renderMoisItem = (mois) => {
    const label = moisLabels[mois - 1];
    const estPaye = estMoisPaye(mois, selectedYear);
    const estDisponible = moisDisponibles.includes(mois);
    const estSelectionne = moisSelectionnes.includes(mois);
    const montantMois = parseFloat(montantsParMois[mois]) || 0;

    let statut = 'indisponible';
    if (estPaye) statut = 'paye';
    else if (estSelectionne) statut = 'disponible selected';
    else if (estDisponible) statut = 'disponible';

    const estCliquable = estDisponible && !estPaye;
    const afficherInputMontant = estCliquable && factureType === 'B';

    return (
      <div
        key={mois}
        className={`pm-mois-item ${statut}`}
        onClick={() => estCliquable && toggleMois(mois)}
        style={{ cursor: estCliquable ? 'pointer' : 'default' }}
      >
        <div className="pm-mois-header">
          <span className="pm-mois-label">{label}</span>
          <span className="pm-mois-num">{mois}</span>
        </div>

        {afficherInputMontant && (
          <div className="pm-mois-montant" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              value={Math.round(montantMois * 100) / 100 || ''}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                setMontantsParMois(prev => ({ ...prev, [mois]: numValue }));
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
            <span className="pm-mois-badge paye"><CheckCircle size={12} /> Payé</span>
          )}
          {estSelectionne && !estPaye && (
            <span className="pm-mois-badge selected"><Check size={12} /> ✓</span>
          )}
          {!estPaye && estDisponible && !estSelectionne && (
            <span className="pm-mois-badge disponible">Sélectionner</span>
          )}
          {!estPaye && !estDisponible && (
            <span className="pm-mois-badge indisponible"><X size={12} /></span>
          )}
        </div>
      </div>
    );
  };

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
            <button className="pm-header-edit-btn" onClick={() => openEditModal(false)} title="Modifier l'usager">
              <UserCog size={16} /> Modifier
            </button>
          </div>
        </div>

        <div className="pm-body">
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
                      setFraisRenouvellement('');
                      setUsagerModifieRenouvellement(false);
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
                      setFraisRenouvellement('');
                      setUsagerModifieRenouvellement(false);
                      const moisDispo = getMoisDisponiblesRestants();
                      const nb = Math.min(nombreMois, moisDispo.length);
                      setMoisSelectionnes(moisDispo.slice(0, nb));
                    }}
                  />
                  <div className="pm-type-option-content">
                    <span className="pm-type-option-title">Type B</span>
                    <span className="pm-type-option-desc">Factures séparées</span>
                    <span className="pm-type-option-badge">Une facture par mois - Même quittance</span>
                  </div>
                </label>

                <label className={`pm-type-option ${factureType === 'C' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    value="C"
                    checked={factureType === 'C'}
                    onChange={() => {
                      setFactureType('C');
                      setUsagerModifieRenouvellement(false);
                      const moisDispo = getMoisDisponiblesRestants();
                      const nb = Math.min(nombreMois, moisDispo.length);
                      setMoisSelectionnes(moisDispo.slice(0, nb));
                      setTimeout(() => {
                        setEditedUsager({ ...usager });
                        setShowEditModal(true);
                        showToast('⚠️ Type C : Veuillez confirmer les informations de l\'usager pour continuer', 'warning');
                      }, 300);
                    }}
                  />
                  <div className="pm-type-option-content">
                    <span className="pm-type-option-title">Type C</span>
                    <span className="pm-type-option-desc">Renouvellement de facture</span>
                    <span className="pm-type-option-badge">Une seule facture + Renouvellement</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

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
              </div>

              <div className="pm-form-group">
                <label><DollarSign size={15} /> Montant mensuel (Ar)</label>
                <input
                  type="number"
                  value={montantMensuel}
                  onChange={(e) => setMontantMensuel(e.target.value)}
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
                  onChange={(e) => setUniter(parseInt(e.target.value) || 1)}
                  min="1"
                  step="1"
                  className="pm-uniter-input"
                />
                <small className="pm-field-hint">Multiplicateur du montant mensuel</small>
              </div>

              {factureType === 'C' && (
                <div className="pm-form-group pm-renouvellement-group">
                  <label className="pm-renouvellement-direct-label">
                    <RefreshCw size={15} />
                    <span>Frais de renouvellement Contrat (Ar) <span style={{ color: 'red' }}>*</span></span>
                  </label>
                  <input
                    type="number"
                    value={fraisRenouvellement}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFraisRenouvellement(val === '' ? '' : (parseFloat(val) || 0));
                    }}
                    placeholder="Saisir les frais de renouvellement (obligatoire)"
                    className={`pm-frais-renouvellement-input ${
                      (!fraisRenouvellement || parseFloat(fraisRenouvellement) <= 0) ? 'pm-input-error' : 'pm-input-valid'
                    }`}
                    step="1"
                    min="0"
                    required
                  />
                  {(!fraisRenouvellement || parseFloat(fraisRenouvellement) <= 0) ? (
                    <small className="pm-field-hint pm-renouvellement-hint pm-hint-error">
                      <AlertCircle size={12} /> <strong>⚠️ OBLIGATOIRE</strong> - Saisissez les frais de renouvellement de contrat
                    </small>
                  ) : (
                    <small className="pm-field-hint pm-renouvellement-hint pm-hint-valid">
                      <CheckCircle size={12} /> Frais de renouvellement de contrat : {parseFloat(fraisRenouvellement).toLocaleString('fr-FR')} Ar
                    </small>
                  )}
                </div>
              )}

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
                    {montantMensuel} × {uniter}
                    {isRetard ? ` + ${montantRetard.toLocaleString('fr-FR')} Ar (retard)` : ''}
                    {factureType === 'C' && parseFloat(fraisRenouvellement) > 0 ? ` + ${parseFloat(fraisRenouvellement).toLocaleString('fr-FR')} Ar (renouv.)` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
                <button className="pm-description-btn-confirm" onClick={handleConfirmerDescription}>
                  <CheckSquare size={18} /> Confirmer
                </button>
                <button className="pm-description-btn-clear" onClick={handleEffacerDescription}>
                  ✕
                </button>
              </div>
              {descriptionConfirmee && (
                <div className="pm-description-confirmee">
                  <CheckCircle size={16} color="#27ae60" />
                  <span>Description confirmée : <strong>"{descriptionConfirmee}"</strong></span>
                </div>
              )}
            </div>
          </div>

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

            {factureType !== 'C' && (
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
            )}

            {factureType === 'C' && (
              <div className="pm-mois-selecteur pm-mois-selecteur-typeC">
                <div className="pm-mois-selecteur-label">
                  <span>Mois couverts par le renouvellement (cliquez pour sélectionner) :</span>
                  <span className="pm-mois-selecteur-info">
                    ({moisSelectionnes.length} mois sélectionné{moisSelectionnes.length > 1 ? 's' : ''})
                  </span>
                </div>
                <div className="pm-mois-selected-info">
                  {moisSelectionnes.length > 0 ? (
                    <span className="pm-mois-selected-list">
                      Mois : {moisSelectionnes.map(m => moisLabels[m - 1]).join(', ')}
                    </span>
                  ) : (
                    <span style={{ color: '#dc3545' }}>Aucun mois sélectionné</span>
                  )}
                </div>
              </div>
            )}

            <div className="pm-mois-grid-2-lignes">
              <div className="pm-mois-grid-ligne">
                {moisHaut.map(mois => renderMoisItem(mois))}
              </div>
              <div className="pm-mois-grid-ligne">
                {moisBas.map(mois => renderMoisItem(mois))}
              </div>
            </div>
          </div>

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

          <button
            className="pm-btn-generate"
            onClick={genererFactures}
            disabled={
              isSubmitting ||
              !personneRecu.trim() ||
              !quittance ||
              !quittanceValidee ||
              moisSelectionnes.length === 0 ||
              (factureType === 'C' && !fraisRenouvValide)
            }
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="spinner" /> Génération en cours...</>
            ) : (
              <><Save size={18} /> Générer la facture ({factureType})</>
            )}
          </button>

          {factureType === 'C' && !fraisRenouvValide && (
            <div className="pm-generate-warning">
              <AlertCircle size={16} />
              <span>⚠️ Frais de renouvellement de contrat obligatoire pour générer la facture</span>
            </div>
          )}
        </div>

        {showFactures && facturesGenerees.length > 0 && (
          <div className="pm-factures-generees">
            <div className="pm-factures-header">
              <h3><FileText size={18} /> Factures générées ({facturesGenerees.length})</h3>
              <div className="pm-factures-actions">
                {facturesGenerees.length > 1 && (
                  <button
                    className="pm-btn-pdf-zip"
                    onClick={handleDownloadZip}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><Loader2 size={16} className="spinner" /> Génération...</>
                    ) : (
                      <><FileArchive size={16} /> Télécharger ZIP</>
                    )}
                  </button>
                )}
                <button className="pm-btn-toggle" onClick={() => setShowFactures(!showFactures)}>
                  {showFactures ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
            </div>

            {showFactures && (
              <div className="pm-factures-list">
                {facturesGenerees.map((facture, index) => {
                  const dateFacture = new Date(facture.a_compter_du);
                  const moisIndex = dateFacture.getMonth();
                  const isTypeB = facture.num_facture_type === 'B';
                  const isTypeC = facture.num_facture_type === 'C';
                  return (
                    <div key={index} className="pm-facture-item">
                      <div className="pm-facture-info">
                        <span className="pm-facture-num">{facture.num_facture}</span>
                        <span className="pm-facture-date">
                          {moisLabels[moisIndex]} {dateFacture.getFullYear()}
                        </span>
                        <span className="pm-facture-montant">{facture.soit_total.toLocaleString('fr-FR')} Ar</span>
                        <span className={`pm-facture-quittance ${isTypeB || isTypeC ? 'shared' : ''}`}>
                          Quittance: {String(facture.quittance || '').padStart(7, '0')}
                        </span>
                        <span className="pm-facture-uniter">U: {facture.uniter}</span>
                        {facture.is_renouvellement && (
                          <span className="pm-facture-renouvellement">
                            <RefreshCw size={12} /> Renouv.
                          </span>
                        )}
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

      {showEditModal && (
        <div className="pm-modal-overlay">
          <div className="pm-modal-content">
            <div className="pm-modal-header">
              <h2>
                <UserCog size={22} color="#3498db" /> Modifier l'usager
                {factureType === 'C' && (
                  <span className="pm-modal-obligatoire">
                    <AlertTriangle size={14} /> OBLIGATOIRE
                  </span>
                )}
              </h2>
              {factureType !== 'C' && (
                <button className="pm-modal-close-btn" onClick={() => setShowEditModal(false)}>✕</button>
              )}
            </div>

            <div className="pm-modal-body">
              {factureType === 'C' && (
                <div className="pm-modal-info-renouvellement">
                  <AlertTriangle size={16} />
                  <span>Renouvellement de contrat : vous devez confirmer les informations de l'usager pour continuer.</span>
                </div>
              )}

              <div className="pm-modal-grid">
                <div className="pm-modal-field">
                  <label>Dénomination <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={editedUsager.denomination || editedUsager.nom_evenement || editedUsager.genre_manifestation || ''}
                    onChange={(e) => setEditedUsager(prev => ({ ...prev, denomination: e.target.value }))}
                  />
                </div>
                <div className="pm-modal-field">
                  <label>Demandeur</label>
                  <input
                    type="text"
                    value={editedUsager.demandeur || editedUsager.organisateurs || ''}
                    onChange={(e) => setEditedUsager(prev => ({ ...prev, demandeur: e.target.value }))}
                  />
                </div>
                <div className="pm-modal-field">
                  <label>Téléphone</label>
                  <input
                    type="text"
                    value={editedUsager.telephone || ''}
                    onChange={(e) => setEditedUsager(prev => ({ ...prev, telephone: e.target.value }))}
                  />
                </div>
                <div className="pm-modal-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editedUsager.email || ''}
                    onChange={(e) => setEditedUsager(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="pm-modal-field">
                  <label>Région</label>
                  <input
                    type="text"
                    value={editedUsager.region || ''}
                    onChange={(e) => setEditedUsager(prev => ({ ...prev, region: e.target.value }))}
                  />
                </div>
                <div className="pm-modal-field">
                  <label>Adresse</label>
                  <input
                    type="text"
                    value={editedUsager.adresse || editedUsager.adresse_siege || ''}
                    onChange={(e) => setEditedUsager(prev => ({ ...prev, adresse: e.target.value, adresse_siege: e.target.value }))}
                  />
                </div>

                {usagerType === 'occ' && (
                  <>
                    <div className="pm-modal-field">
                      <label>Genre manifestation</label>
                      <input
                        type="text"
                        value={editedUsager.genre_manifestation || ''}
                        onChange={(e) => setEditedUsager(prev => ({ ...prev, genre_manifestation: e.target.value }))}
                      />
                    </div>
                    <div className="pm-modal-field">
                      <label>Lieu événement</label>
                      <input
                        type="text"
                        value={editedUsager.lieu_evenement || ''}
                        onChange={(e) => setEditedUsager(prev => ({ ...prev, lieu_evenement: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {usagerType === 'media' && (
                  <>
                    <div className="pm-modal-field">
                      <label>Fréquence</label>
                      <input
                        type="text"
                        value={editedUsager.frequence || ''}
                        onChange={(e) => setEditedUsager(prev => ({ ...prev, frequence: e.target.value }))}
                      />
                    </div>
                    <div className="pm-modal-field">
                      <label>Canal</label>
                      <input
                        type="text"
                        value={editedUsager.canal || ''}
                        onChange={(e) => setEditedUsager(prev => ({ ...prev, canal: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {/* ✅ NOUVEAU : Champs spécifiques "other" */}
                {usagerType === 'other' && (
                  <>
                    <div className="pm-modal-field">
                      <label>Nom</label>
                      <input
                        type="text"
                        value={editedUsager.nom || ''}
                        onChange={(e) => setEditedUsager(prev => ({ ...prev, nom: e.target.value }))}
                      />
                    </div>
                    <div className="pm-modal-field">
                      <label>Prénom</label>
                      <input
                        type="text"
                        value={editedUsager.prenom || ''}
                        onChange={(e) => setEditedUsager(prev => ({ ...prev, prenom: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {(usagerType === 'hotel' || usagerType === 'nightclub' || usagerType === 'grand-surface') && (
                  <>
                    <div className="pm-modal-field">
                      <label>Activité</label>
                      <input
                        type="text"
                        value={editedUsager.activite || ''}
                        onChange={(e) => setEditedUsager(prev => ({ ...prev, activite: e.target.value }))}
                      />
                    </div>
                    {usagerType === 'hotel' && (
                      <div className="pm-modal-field">
                        <label>Étoiles</label>
                        <select
                          value={editedUsager.etoiles || ''}
                          onChange={(e) => setEditedUsager(prev => ({ ...prev, etoiles: e.target.value }))}
                        >
                          <option value="">Sélectionner</option>
                          <option value="1 étoile">1 étoile</option>
                          <option value="2 étoiles">2 étoiles</option>
                          <option value="3 étoiles">3 étoiles</option>
                          <option value="4 étoiles">4 étoiles</option>
                          <option value="5 étoiles">5 étoiles</option>
                        </select>
                      </div>
                    )}
                    {usagerType === 'nightclub' && (
                      <div className="pm-modal-field">
                        <label>Jauge max</label>
                        <input
                          type="number"
                          value={editedUsager.jauge_max || 0}
                          onChange={(e) => setEditedUsager(prev => ({ ...prev, jauge_max: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    )}
                    {usagerType === 'grand-surface' && (
                      <div className="pm-modal-field">
                        <label>Nombre de magasins</label>
                        <input
                          type="number"
                          value={editedUsager.nombre_magasins || 0}
                          onChange={(e) => setEditedUsager(prev => ({ ...prev, nombre_magasins: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    )}
                  </>
                )}

                {usagerType === 'bus' && (
                  <>
                    <div className="pm-modal-field">
                      <label>Lignes</label>
                      <input
                        type="text"
                        value={editedUsager.lignes || ''}
                        onChange={(e) => setEditedUsager(prev => ({ ...prev, lignes: e.target.value }))}
                      />
                    </div>
                    <div className="pm-modal-field">
                      <label>Nombre de véhicules</label>
                      <input
                        type="number"
                        value={editedUsager.nombre_vehicules || 0}
                        onChange={(e) => setEditedUsager(prev => ({ ...prev, nombre_vehicules: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pm-modal-footer">
              {factureType !== 'C' && (
                <button className="pm-modal-btn-cancel" onClick={() => setShowEditModal(false)}>
                  Annuler
                </button>
              )}
              <button className="pm-modal-btn-save" onClick={handleSaveUsager} disabled={isSavingUsager}>
                {isSavingUsager ? (
                  <><Loader2 size={16} className="spinner" /> Sauvegarde...</>
                ) : (
                  <><Save size={16} /> Enregistrer</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaiementMensuel;