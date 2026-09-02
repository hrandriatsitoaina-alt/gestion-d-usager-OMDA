// src/pages/GenerationFacture.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, Save, Printer, FileText, Building2, User,
  Phone, Mail, MapPin, Calendar, DollarSign, CreditCard,
  Hash, Edit, CheckCircle, AlertCircle, Loader2,
  Users, Bus, Hotel, Store, Tv2, PartyPopper, Ticket,
  UserPlus, FileCheck, Radio, Headphones
} from 'lucide-react';
import '../styles/generation-facture.css';
import MiniSidebar from '../components/MiniSidebar';
import { generateFacturePDF } from './pdf/facture_pdf';

const GenerationFacture = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [facture, setFacture] = useState(null);
  const [factureId, setFactureId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFacture, setEditedFacture] = useState({});
  const [personneRecu, setPersonneRecu] = useState('');
  const [isSavingPersonne, setIsSavingPersonne] = useState(false);
  const [quittance, setQuittance] = useState('');
  const [quittanceValidee, setQuittanceValidee] = useState(false);
  const [isSavingQuittance, setIsSavingQuittance] = useState(false);

  // États pour les montants - NON MODIFIABLES (lecture seule)
  const [montant, setMontant] = useState(0);
  const [fraisDossier, setFraisDossier] = useState(0);
  const [montantRetard, setMontantRetard] = useState(0);
  const [isRetard, setIsRetard] = useState(false);
  const [uniter, setUniter] = useState(1);
  const [soitTotalCalcule, setSoitTotalCalcule] = useState(0);
  const [refClientType, setRefClientType] = useState('');

  const [moyensCommunication, setMoyensCommunication] = useState({
    radio: { actif: false, taux: 0 },
    lecteur: { actif: false, taux: 0 },
    tv: { actif: false, taux: 0 },
    autres: { actif: false, taux: 0 }
  });

  const getOnlyNumbers = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };

  const getTotalMoyens = () => {
    let total = 0;
    if (moyensCommunication.radio?.actif) total += parseFloat(moyensCommunication.radio?.taux) || 0;
    if (moyensCommunication.lecteur?.actif) total += parseFloat(moyensCommunication.lecteur?.taux) || 0;
    if (moyensCommunication.tv?.actif) total += parseFloat(moyensCommunication.tv?.taux) || 0;
    if (moyensCommunication.autres?.actif) total += parseFloat(moyensCommunication.autres?.taux) || 0;
    return total;
  };

  const hasMoyensCommunication = (type) => {
    return ['HTL', 'MGS', 'NGT'].includes(type);
  };

  const hasRetard = (type) => {
    return type === 'OCC';
  };

  useEffect(() => {
    const state = location.state;
    if (state && state.factureId) {
      setFactureId(state.factureId);
      fetchFacture(state.factureId);
    } else {
      showToast('Aucune facture à générer', 'error');
      navigate('/confirmation-dossier');
    }
  }, [location]);

  // Récupération de la facture avec tous les montants
  const fetchFacture = async (id) => {
    try {
      setLoading(true);
      console.log('🔍 Récupération de la facture ID:', id);
      
      const response = await fetch(`http://localhost:3001/api/factures/${id}`);
      const data = await response.json();
      
      console.log('📦 Réponse API:', data);
      
      if (data.success) {
        const factureData = data.facture;
        console.log('✅ Facture chargée:', factureData);
        
        // Récupération des montants depuis la facture
        let montantVal = parseFloat(factureData.montant_mensuel) || 0;
        let fraisDossierVal = parseFloat(factureData.frais_dossier) || 0;
        let montantRetardVal = parseFloat(factureData.montant_retard) || 0;
        let isRetardVal = factureData.is_retard || false;
        let uniterVal = parseInt(factureData.uniter) || 1;
        let soitTotalVal = parseFloat(factureData.soit_total) || 0;
        const type = factureData.ref_client_type || '';
        setRefClientType(type);

        console.log('📊 MONTANTS DE LA FACTURE:', {
          type,
          montantVal,
          fraisDossierVal,
          montantRetardVal,
          isRetardVal,
          uniterVal,
          soitTotalVal
        });

        // Récupération des moyens de communication
        let moyensComm = {
          radio: { actif: false, taux: 0 },
          lecteur: { actif: false, taux: 0 },
          tv: { actif: false, taux: 0 },
          autres: { actif: false, taux: 0 }
        };

        if (factureData.moyens_communication) {
          try {
            if (typeof factureData.moyens_communication === 'string') {
              moyensComm = JSON.parse(factureData.moyens_communication);
            } else {
              moyensComm = factureData.moyens_communication;
            }
          } catch (e) {
            console.warn('⚠️ Erreur parsing moyens_communication:', e);
          }
        }

        // Si les montants sont vides, essayer de les récupérer depuis l'usager
        if (montantVal === 0 && factureData.ref_usager) {
          try {
            const usagerResponse = await fetch(`http://localhost:3001/api/usagers/${factureData.ref_usager}`);
            const usagerData = await usagerResponse.json();
            console.log('📊 Données de l\'usager:', usagerData);
            
            if (type === 'OCC') {
              montantVal = parseFloat(usagerData.montant) || parseFloat(usagerData.montant_total) || 0;
              montantRetardVal = parseFloat(usagerData.montant_retard) || 0;
              isRetardVal = usagerData.is_retard || false;
            } else if (type === 'RDP') {
              montantVal = parseFloat(usagerData.taux) || parseFloat(usagerData.montant_mensuel) || 0;
            } else {
              montantVal = parseFloat(usagerData.montant_mensuel) || parseFloat(usagerData.montant_total) || 0;
            }
            
            if (fraisDossierVal === 0) {
              fraisDossierVal = parseFloat(usagerData.frais_dossier) || 0;
            }
            if (uniterVal === 1 && usagerData.uniter) {
              uniterVal = parseInt(usagerData.uniter) || 1;
            }
            
            console.log('📊 MONTANTS DEPUIS L\'USAGER:', {
              montantVal,
              fraisDossierVal,
              uniterVal,
              montantRetardVal,
              isRetardVal
            });
          } catch (usagerError) {
            console.warn('⚠️ Impossible de récupérer l\'usager:', usagerError);
          }
        }

        // Recalculer soit_total si nécessaire
        if (soitTotalVal === 0 && montantVal > 0) {
          const retard = isRetardVal ? montantRetardVal : 0;
          
          if (type === 'HTL' || type === 'MGS' || type === 'NGT') {
            let totalMoyens = 0;
            if (moyensComm.radio?.actif) totalMoyens += parseFloat(moyensComm.radio?.taux) || 0;
            if (moyensComm.lecteur?.actif) totalMoyens += parseFloat(moyensComm.lecteur?.taux) || 0;
            if (moyensComm.tv?.actif) totalMoyens += parseFloat(moyensComm.tv?.taux) || 0;
            if (moyensComm.autres?.actif) totalMoyens += parseFloat(moyensComm.autres?.taux) || 0;
            soitTotalVal = (montantVal + totalMoyens) * uniterVal + fraisDossierVal + retard;
          } else {
            soitTotalVal = (montantVal * uniterVal) + fraisDossierVal + retard;
          }
          console.log('🔄 Soit_total recalculé:', soitTotalVal);
        }

        console.log('📊 MONTANTS FINAUX:', {
          type,
          montant: montantVal,
          fraisDossier: fraisDossierVal,
          montantRetard: montantRetardVal,
          isRetard: isRetardVal,
          uniter: uniterVal,
          soitTotal: soitTotalVal
        });

        // Mettre à jour tous les états
        setFacture(factureData);
        setEditedFacture(factureData);
        
        // ✅ IMPORTANT: Ne pas définir personneRecu par défaut
        // La personne qui reçoit doit être saisie manuellement
        setPersonneRecu(''); // Toujours vide initialement
        
        const quittanceRaw = factureData.quittance || '';
        const quittanceNumbers = getOnlyNumbers(quittanceRaw);
        setQuittance(quittanceNumbers);
        setQuittanceValidee(factureData.quittance_validee || false);
        
        setMontant(montantVal);
        setFraisDossier(fraisDossierVal);
        setMontantRetard(montantRetardVal);
        setIsRetard(isRetardVal);
        setUniter(uniterVal);
        setMoyensCommunication(moyensComm);
        setSoitTotalCalcule(soitTotalVal);
        
        // Si quittance est vide, récupérer le prochain numéro
        if (!quittanceNumbers || quittanceNumbers === '') {
          try {
            const quittanceResponse = await fetch('http://localhost:3001/api/quittance/last');
            const quittanceData = await quittanceResponse.json();
            if (quittanceData.success && quittanceData.nextQuittance) {
              const nextNumbers = getOnlyNumbers(quittanceData.nextQuittance);
              setQuittance(nextNumbers);
            }
          } catch (err) {
            console.warn('⚠️ Erreur récupération quittance:', err);
          }
        }
        
      } else {
        console.error('❌ Erreur API:', data.message);
        showToast('Erreur lors du chargement de la facture', 'error');
        navigate('/confirmation-dossier');
      }
    } catch (error) {
      console.error('❌ Erreur fetch:', error);
      showToast('Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Recalculer le total quand les valeurs changent
  useEffect(() => {
    if (facture) {
      const totalMoyens = getTotalMoyens();
      const retard = isRetard ? montantRetard : 0;
      
      let total = 0;
      if (refClientType === 'HTL' || refClientType === 'MGS' || refClientType === 'NGT') {
        total = (montant + totalMoyens) * uniter + fraisDossier + retard;
      } else {
        total = (montant * uniter) + fraisDossier + retard;
      }
      
      setSoitTotalCalcule(total);
      
      setEditedFacture(prev => ({
        ...prev,
        montant_mensuel: montant,
        frais_dossier: fraisDossier,
        montant_retard: isRetard ? montantRetard : 0,
        is_retard: isRetard,
        uniter: uniter,
        soit_total: total,
        quittance: quittance,
        quittance_validee: quittanceValidee,
        moyens_communication: moyensCommunication
      }));
    }
  }, [montant, fraisDossier, montantRetard, isRetard, uniter, moyensCommunication, quittance, quittanceValidee, refClientType]);

  const handleEdit = (field, value) => {
    setEditedFacture(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave = {
        ...editedFacture,
        montant_mensuel: montant,
        frais_dossier: fraisDossier,
        montant_retard: isRetard ? montantRetard : 0,
        is_retard: isRetard,
        uniter: uniter,
        soit_total: soitTotalCalcule,
        quittance: quittance,
        quittance_validee: quittanceValidee,
        moyens_communication: moyensCommunication
      };
      
      console.log('💾 Sauvegarde des données:', dataToSave);
      
      const response = await fetch(`http://localhost:3001/api/factures/${factureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('✅ Facture mise à jour avec succès', 'success');
        setFacture(data.facture);
        setEditedFacture(data.facture);
        setIsEditing(false);
      } else {
        showToast('❌ ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('❌ Erreur de sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Fonction pour sauvegarder la personne qui reçoit
  const handleSavePersonneRecu = async () => {
    // ✅ Vérifier que le nom n'est pas vide
    if (!personneRecu.trim()) {
      showToast('Veuillez saisir le nom de la personne qui reçoit', 'error');
      return;
    }
    
    // ✅ Vérifier que le nom n'est pas un nom par défaut
    const defaultNames = ['FITAHIANTSOA Nemenjanahary', 'Administrateur', 'User', ''];
    if (defaultNames.includes(personneRecu.trim())) {
      showToast('Veuillez saisir un nom valide pour la personne qui reçoit', 'error');
      return;
    }
    
    setIsSavingPersonne(true);
    try {
      const response = await fetch(`http://localhost:3001/api/factures/${factureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personne_recu: personneRecu.trim() })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('✅ Personne reçu enregistrée avec succès', 'success');
        setFacture(data.facture);
        setEditedFacture(data.facture);
        // ✅ Garder le nom saisi
        setPersonneRecu(personneRecu.trim());
      } else {
        showToast('❌ ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('❌ Erreur de sauvegarde', 'error');
    } finally {
      setIsSavingPersonne(false);
    }
  };

  const handleSaveQuittance = async () => {
    const quittanceClean = getOnlyNumbers(quittance);
    
    if (!quittanceClean || quittanceClean === '') {
      showToast('Veuillez saisir un numéro de quittance', 'error');
      return;
    }
    
    setIsSavingQuittance(true);
    try {
      const response = await fetch(`http://localhost:3001/api/factures/${factureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quittance: quittanceClean,
          quittance_validee: quittanceValidee
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('✅ Quittance enregistrée avec succès', 'success');
        setFacture(data.facture);
        setEditedFacture(data.facture);
      } else {
        showToast('❌ ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('❌ Erreur de sauvegarde', 'error');
    } finally {
      setIsSavingQuittance(false);
    }
  };

  // ✅ Fonction de génération PDF avec validation de la personne reçu
  const handleGeneratePDF = async () => {
    if (!facture) {
      showToast('Aucune facture à générer', 'error');
      return;
    }
    
    // ✅ Vérifier que personne_recu est bien saisi et non vide
    const personneName = facture.personne_recu || personneRecu;
    if (!personneName || personneName.trim() === '') {
      showToast('Veuillez d\'abord enregistrer le nom de la personne qui reçoit', 'error');
      return;
    }
    
    // ✅ Vérifier que ce n'est pas un nom par défaut
    const defaultNames = ['FITAHIANTSOA Nemenjanahary', 'Administrateur', 'User'];
    if (defaultNames.includes(personneName.trim())) {
      showToast('Veuillez saisir un nom valide pour la personne qui reçoit', 'error');
      return;
    }
    
    if (!quittanceValidee) {
      showToast('⚠️ Veuillez valider le numéro de quittance avant de générer le PDF', 'error');
      return;
    }
    
    if (!quittance || quittance === '') {
      showToast('⚠️ Veuillez saisir un numéro de quittance', 'error');
      return;
    }
    
    try {
      setIsGenerating(true);
      showToast('🔄 Génération du PDF en cours...', 'info');
      
      const factureData = { 
        ...facture,
        montant_mensuel: montant,
        frais_dossier: fraisDossier,
        montant_retard: isRetard ? montantRetard : 0,
        is_retard: isRetard,
        uniter: uniter,
        soit_total: soitTotalCalcule,
        quittance: quittance,
        quittance_validee: quittanceValidee,
        moyens_communication: moyensCommunication
      };
      
      if (personneRecu) {
        factureData.personne_recu = personneRecu;
      }
      
      console.log('📄 Données envoyées au PDF:', factureData);
      
      const result = generateFacturePDF(factureData, false);
      
      if (result) {
        showToast('✅ PDF généré avec succès !', 'success');
      } else {
        showToast('❌ Erreur lors de la génération du PDF', 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('❌ Erreur de génération PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMoyenCommEdit = (moyen, field, value) => {
    setMoyensCommunication(prev => ({
      ...prev,
      [moyen]: {
        ...prev[moyen],
        [field]: field === 'actif' ? value : parseFloat(value) || 0
      }
    }));
  };

  const getTypeIcon = (type) => {
    const icons = {
      'HTL': Hotel,
      'MGS': Store,
      'RDP': Tv2,
      'TRP': Bus,
      'NGT': PartyPopper,
      'OCC': Ticket
    };
    return icons[type] || Building2;
  };

  const getTypeLabel = (type) => {
    const labels = {
      'HTL': 'Hôtel',
      'MGS': 'Grande Surface',
      'RDP': 'Radio/Télé',
      'TRP': 'Transport',
      'NGT': 'Night Club',
      'OCC': 'Occasionnel'
    };
    return labels[type] || type;
  };

  const formatNumber = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = value.toString().replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (!num) return '';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const renderField = (label, value, field, type = 'text') => {
    const currentValue = isEditing ? editedFacture[field] : value;
    const displayValue = currentValue !== undefined && currentValue !== null ? currentValue : '';
    
    const isProtected = [
      'ref_omda', 'num_facture', 'num_facture_type', 'ref_client_type',
      'soit_total', 'montant_total'
    ].includes(field);
    
    const isMontantField = [
      'montant_mensuel', 'frais_dossier', 'montant_retard', 'is_retard', 'uniter', 'soit_total'
    ].includes(field);
    
    // Les champs de montant sont TOUJOURS en lecture seule
    const canEdit = isEditing && !isProtected && !isMontantField;
    
    return (
      <div className="facture-field" key={field}>
        <span className="field-label">{label}</span>
        {canEdit ? (
          type === 'textarea' ? (
            <textarea
              value={displayValue}
              onChange={(e) => handleEdit(field, e.target.value)}
              className="field-input textarea"
              rows={2}
            />
          ) : type === 'select' ? (
            <select
              value={displayValue}
              onChange={(e) => handleEdit(field, e.target.value)}
              className="field-input"
            >
              <option value="DAFC">DAFC</option>
              <option value="Redevances">Redevances</option>
              <option value="Droit d'auteur">Droit d'auteur</option>
              <option value="Location">Location</option>
              <option value="Autres">Autres</option>
            </select>
          ) : type === 'date' ? (
            <input
              type="date"
              value={displayValue || ''}
              onChange={(e) => handleEdit(field, e.target.value)}
              className="field-input"
            />
          ) : type === 'number' ? (
            <input
              type="number"
              value={displayValue}
              onChange={(e) => handleEdit(field, parseFloat(e.target.value) || 0)}
              className="field-input"
            />
          ) : (
            <input
              type="text"
              value={displayValue}
              onChange={(e) => handleEdit(field, e.target.value)}
              className="field-input"
            />
          )
        ) : (
          <span className={`field-value ${isProtected || isMontantField ? 'protected' : ''}`}>
            {type === 'date' && displayValue ? new Date(displayValue).toLocaleDateString('fr-FR') : displayValue || '-'}
          </span>
        )}
        {isMontantField && (
          <span style={{ fontSize: '10px', color: '#6c757d', marginLeft: '5px' }}>
            
          </span>
        )}
      </div>
    );
  };

  const renderFieldsByType = () => {
    const type = facture?.ref_client_type;
    const data = isEditing ? editedFacture : facture;
    
    if (!data) return { commonFields: null, specificFields: null };
    
    const commonFields = (
      <>
        {renderField('Dénomination', data.denomination, 'denomination')}
        {renderField('Demandeur', data.demandeur, 'demandeur')}
        {renderField('Téléphone', data.telephone, 'telephone')}
        {renderField('Email', data.email, 'email')}
        {renderField('Adresse', data.adresse, 'adresse', 'textarea')}
        {renderField('Région', data.region_usager, 'region_usager')}
      </>
    );

    let specificFields = null;

    switch(type) {
      case 'HTL':
        specificFields = (
          <>
            {renderField('Activité', data.activite, 'activite')}
            {renderField('Étoiles', data.etoiles, 'etoiles')}
            {renderField('Ravinala', data.ravinala ? 'Oui' : 'Non', 'ravinala')}
          </>
        );
        break;
      case 'MGS':
        specificFields = (
          <>
            {renderField('Activité', data.activite, 'activite')}
            {renderField('Nombre de magasins', data.nombre_magasins, 'nombre_magasins', 'number')}
          </>
        );
        break;
      case 'TRP':
        specificFields = (
          <>
            {renderField('Nombre de véhicules', data.nombre_vehicules, 'nombre_vehicules', 'number')}
            {renderField('Lignes', data.lignes, 'lignes')}
            {renderField('Type de transport', data.type_bus, 'type_bus')}
            {renderField('Trajet', data.trajet, 'trajet')}
            {renderField('Zones desservies', data.zones_desservies, 'zones_desservies')}
          </>
        );
        break;
      case 'NGT':
        specificFields = (
          <>
            {renderField('Jauge maximale', data.jauge_max, 'jauge_max', 'number')}
            {renderField('Horaires', data.horaires, 'horaires')}
          </>
        );
        break;
      case 'RDP':
        specificFields = (
          <>
            {renderField('Fréquence', data.frequence, 'frequence')}
            {renderField('Canal', data.canal, 'canal')}
            {renderField('Siège', data.siege, 'siege')}
            {renderField('NIF', data.nif, 'nif')}
            {renderField('STAT', data.stat, 'stat')}
          </>
        );
        break;
      case 'OCC':
        specificFields = (
          <>
            {renderField('Organisateurs', data.organisateurs, 'organisateurs')}
            {renderField('Représentant par', data.representant_par, 'representant_par')}
            {renderField('Genre manifestation', data.genre_manifestation, 'genre_manifestation')}
            {renderField('Artistes', data.artistes, 'artistes')}
            {renderField('Date événement', data.date_evenement, 'date_evenement', 'date')}
            {renderField('Lieu événement', data.lieu_evenement, 'lieu_evenement')}
          </>
        );
        break;
      default:
        specificFields = null;
    }

    return { commonFields, specificFields };
  };

  if (loading) {
    return (
      <>
        <MiniSidebar />
        <div className="facture-loading">
          <Loader2 size={48} className="spinner" />
          <p>Chargement de la facture...</p>
        </div>
      </>
    );
  }

  if (!facture) {
    return (
      <>
        <MiniSidebar />
        <div className="facture-error">
          <AlertCircle size={48} />
          <p>Facture non trouvée</p>
          <button onClick={() => navigate('/confirmation-dossier')} className="btn-retour">
            Retour
          </button>
        </div>
      </>
    );
  }

  const IconComponent = getTypeIcon(facture.ref_client_type);
  const typeLabel = getTypeLabel(facture.ref_client_type);
  const { commonFields, specificFields } = renderFieldsByType();
  const showMoyensComm = hasMoyensCommunication(facture.ref_client_type);
  const showRetard = hasRetard(facture.ref_client_type);
  const totalMoyens = getTotalMoyens();

  return (
    <>
      <MiniSidebar />
      <div className="generation-facture-container">
        <div className="facture-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/confirmation-dossier')}>
              <ArrowLeft size={20} /> Retour
            </button>
            <div className="header-info">
              <h1>Génération de Facture</h1>
              <div className="header-type">
                <IconComponent size={18} />
                <span>{typeLabel}</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <span className={`facture-status status-${facture.statut || 'brouillon'}`}>
              {facture.statut === 'brouillon' && '📝 Brouillon'}
              {facture.statut === 'validee' && '✅ Validée'}
              {!facture.statut && '📝 Brouillon'}
            </span>
            <button className="btn-edit" onClick={() => setIsEditing(!isEditing)}>
              <Edit size={18} /> {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>
        </div>

        <div className="facture-body">
          {/* Références */}
          <div className="facture-section references">
            <h3><Hash size={18} /> Références</h3>
            <div className="facture-grid">
              <div className="facture-field">
                <span className="field-label">Réf OMDA</span>
                <span className="field-value protected">{facture.ref_omda || '-'}</span>
              </div>
              <div className="facture-field">
                <span className="field-label">N° Facture</span>
                <span className="field-value protected">{facture.num_facture || '001'}</span>
              </div>
              <div className="facture-field">
                <span className="field-label">Type Client</span>
                <span className="field-value protected">{typeLabel}</span>
              </div>
              <div className="facture-field">
                <span className="field-label">Type de facture</span>
                {isEditing ? (
                  <select
                    value={editedFacture.type_facture || 'DAFC'}
                    onChange={(e) => handleEdit('type_facture', e.target.value)}
                    className="field-input"
                  >
                    <option value="DAFC">DAFC</option>
                    <option value="SFL">SFL</option>
                  </select>
                ) : (
                  <span className="field-value">{facture.type_facture || 'DAFC'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Informations Client */}
          <div className="facture-section">
            <h3><Building2 size={18} /> Informations Client</h3>
            <div className="facture-grid">
              {commonFields}
            </div>
          </div>

          {/* Représentant */}
          <div className="facture-section">
            <h3><User size={18} /> Représentant</h3>
            <div className="facture-grid">
              {renderField('Nom', facture.representant_nom, 'representant_nom')}
              {renderField('Adresse', facture.representant_adresse, 'representant_adresse')}
              {renderField('Téléphone', facture.representant_tel, 'representant_tel')}
              {renderField('CIN', facture.representant_cin, 'representant_cin')}
              {renderField('Fonction', facture.representant_fonction, 'representant_fonction')}
            </div>
          </div>

          {/* Informations Spécifiques */}
          {specificFields && (
            <div className="facture-section">
              <h3><FileText size={18} /> Informations Spécifiques</h3>
              <div className="facture-grid">
                {specificFields}
              </div>
            </div>
          )}

          {/* Période */}
          <div className="facture-section">
            <h3><Calendar size={18} /> Période</h3>
            <div className="facture-grid">
              {renderField('A compter du', facture.a_compter_du, 'a_compter_du', 'date')}
              {renderField('Échéance', facture.echeance, 'echeance', 'date')}
              {renderField('Date signature', facture.date_signature, 'date_signature', 'date')}
            </div>
          </div>

          {/* ✅ SECTION PERSONNE QUI REÇOIT - CORRIGÉE */}
          <div className="facture-section personne-recu-section">
            <h3><UserPlus size={18} /> Personne qui reçoit</h3>
            <div className="personne-recu-container">
              <div className="personne-recu-input-group">
                <input
                  type="text"
                  value={personneRecu}
                  onChange={(e) => setPersonneRecu(e.target.value)}
                  placeholder="Saisir le nom de la personne qui reçoit"
                  className="personne-recu-input"
                  disabled={isSavingPersonne}
                />
                <button
                  className="btn-save-personne"
                  onClick={handleSavePersonneRecu}
                  disabled={isSavingPersonne || !personneRecu.trim()}
                >
                  {isSavingPersonne ? (
                    <><Loader2 size={18} className="spinner" /> Enregistrement...</>
                  ) : (
                    <><Save size={18} /> Enregistrer</>
                  )}
                </button>
              </div>
              
              {/* ✅ Affichage conditionnel */}
              {facture.personne_recu && facture.personne_recu.trim() !== '' && (
                <div className="personne-recu-info success">
                  <CheckCircle size={16} color="#27ae60" />
                  <span>Enregistrée  <strong></strong></span>
                </div>
              )}
              
              {/* ✅ Message d'avertissement si vide */}
              {(!facture.personne_recu || facture.personne_recu.trim() === '') && (
                <div className="personne-recu-info warning">
                  <AlertCircle size={16} color="#f39c12" />
                  <span>⚠️ Aucune personne enregistrée - Veuillez saisir le nom</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION QUITTANCE */}
          <div className="facture-section quittance-section">
            <h3><FileCheck size={18} /> Quittance</h3>
            <div className="quittance-container">
              <div className="quittance-input-group">
                <div className="quittance-input-wrapper">
                  <input
                    type="text"
                    value={quittance}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setQuittance(value);
                    }}
                    placeholder="Numéro de quittance"
                    className="quittance-input"
                    disabled={isSavingQuittance}
                  />
                </div>
                <button
                  className="btn-save-quittance"
                  onClick={handleSaveQuittance}
                  disabled={isSavingQuittance || !quittance || quittance === ''}
                >
                  {isSavingQuittance ? (
                    <><Loader2 size={18} className="spinner" /> Enregistrement...</>
                  ) : (
                    <><Save size={18} /> Enregistrer</>
                  )}
                </button>
              </div>
              
              <div className="quittance-validation">
                <label className="quittance-checkbox-label">
                  <input
                    type="checkbox"
                    checked={quittanceValidee}
                    onChange={(e) => {
                      if (!quittance || quittance === '') {
                        showToast('Veuillez saisir un numéro de quittance', 'error');
                        return;
                      }
                      setQuittanceValidee(e.target.checked);
                    }}
                    className="quittance-checkbox"
                    disabled={!quittance || quittance === ''}
                  />
                  <span>
                    Je confirme le numéro de quittance : <strong>{quittance || '...'}</strong>
                  </span>
                </label>
                
                {quittanceValidee && quittance && (
                  <div className="quittance-validee-info">
                    <CheckCircle size={16} color="#27ae60" />
                    <span>✅ Quittance validée</span>
                  </div>
                )}
                {!quittanceValidee && quittance && (
                  <div className="quittance-non-validee-info">
                    <AlertCircle size={16} color="#f39c12" />
                    <span>☑️ Cochez la case pour valider la quittance</span>
                  </div>
                )}
                {!quittance && (
                  <div className="quittance-non-validee-info">
                    <AlertCircle size={16} color="#dc3545" />
                    <span>📝 Saisissez le numéro de quittance</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION MOYENS DE COMMUNICATION - LECTURE SEULE */}
          {showMoyensComm && (
            <div className="facture-section moyens-comm-section">
              <h3><Radio size={18} /> Moyens de Communication</h3>
              <div className="moyens-comm-grid">
                <div className="moyen-comm-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={moyensCommunication.radio?.actif || false}
                      disabled={true}
                    />
                    Radio - Poste TSF
                  </label>
                  <div className="taux-display">
                    <span>Taux :</span>
                    <span className="field-value protected">
                      {moyensCommunication.radio?.actif ? (moyensCommunication.radio?.taux || 0).toLocaleString('fr-FR') + ' Ar' : 'Non actif'}
                    </span>
                  </div>
                </div>

                <div className="moyen-comm-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={moyensCommunication.lecteur?.actif || false}
                      disabled={true}
                    />
                    Lecteur
                  </label>
                  <div className="taux-display">
                    <span>Taux :</span>
                    <span className="field-value protected">
                      {moyensCommunication.lecteur?.actif ? (moyensCommunication.lecteur?.taux || 0).toLocaleString('fr-FR') + ' Ar' : 'Non actif'}
                    </span>
                  </div>
                </div>

                <div className="moyen-comm-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={moyensCommunication.tv?.actif || false}
                      disabled={true}
                    />
                    TV
                  </label>
                  <div className="taux-display">
                    <span>Taux :</span>
                    <span className="field-value protected">
                      {moyensCommunication.tv?.actif ? (moyensCommunication.tv?.taux || 0).toLocaleString('fr-FR') + ' Ar' : 'Non actif'}
                    </span>
                  </div>
                </div>

                <div className="moyen-comm-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={moyensCommunication.autres?.actif || false}
                      disabled={true}
                    />
                    Autres
                  </label>
                  <div className="taux-display">
                    <span>Taux :</span>
                    <span className="field-value protected">
                      {moyensCommunication.autres?.actif ? (moyensCommunication.autres?.taux || 0).toLocaleString('fr-FR') + ' Ar' : 'Non actif'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="total-moyens-display">
                <span className="total-moyens-label">Total Moyens de Communication :</span>
                <span className="total-moyens-value">
                  {totalMoyens.toLocaleString('fr-FR')} Ar
                </span>
              </div>
            </div>
          )}

          {/* MONTANTS - EN LECTURE SEULE UNIQUEMENT */}
          <div className="facture-section montants">
            <h3><DollarSign size={18} /> Montants</h3>
            <div className="facture-grid montants-grid">
              {/* Montant */}
              <div className="facture-field">
                <span className="field-label">
                  {facture.ref_client_type === 'OCC' ? 'Montant à payer' : 
                   facture.ref_client_type === 'RDP' ? 'Taux' : 
                   'Montant mensuel'}
                </span>
                <span className="field-value protected" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  {(montant || 0).toLocaleString('fr-FR')} Ar 
                </span>
              </div>

              {/* Frais de dossier */}
              <div className="facture-field">
                <span className="field-label">Frais de dossier</span>
                <span className="field-value protected" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  {(fraisDossier || 0).toLocaleString('fr-FR')} Ar 
                  <span style={{ fontSize: '11px', color: '#6c757d', marginLeft: '8px' }}>
                    (fixe)
                  </span>
                </span>
              </div>

              {/* Montant retard - UNIQUEMENT pour OCC */}
              {showRetard && (
                <div className="facture-field">
                  <span className="field-label">Montant retard</span>
                  <span className="field-value protected" style={{ fontWeight: 'bold', color: isRetard ? '#dc3545' : '#6c757d' }}>
                    {(isRetard ? montantRetard : 0).toLocaleString('fr-FR')} Ar 
                  </span>
                </div>
              )}

              {/* Retard - UNIQUEMENT pour OCC */}
              {showRetard && (
                <div className="facture-field">
                  <span className="field-label">Retard</span>
                  <span className="field-value protected" style={{ fontWeight: 'bold', color: isRetard ? '#dc3545' : '#28a745' }}>
                    {isRetard ? 'Oui' : 'Non'} 
                  </span>
                </div>
              )}

              {/* Uniter */}
              <div className="facture-field">
                <span className="field-label">Uniter</span>
                <span className="field-value protected" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  {uniter || '1'} 
                </span>
              </div>

              {/* Soit Total */}
              <div className="facture-field total">
                <span className="field-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>Soit Total</span>
                <span className="field-value protected total-value" style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#28a745'
                }}>
                  {soitTotalCalcule.toLocaleString('fr-FR')} Ar 
                </span>
                <span style={{ fontSize: '11px', color: '#6c757d', marginLeft: '8px' }}>
                  (Montant × Uniter + Frais {showRetard ? '+ Retard' : ''})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="facture-footer">
          <button 
            className="btn-save" 
            onClick={handleSave} 
            disabled={isSaving || !isEditing}
          >
            {isSaving ? (
              <><Loader2 size={18} className="spinner" /> Sauvegarde...</>
            ) : (
              <><Save size={18} /> Sauvegarder</>
            )}
          </button>
          <button 
            className="btn-generate-pdf" 
            onClick={handleGeneratePDF} 
            disabled={isGenerating || !facture.personne_recu || !quittanceValidee || !quittance}
          >
            {isGenerating ? (
              <><Loader2 size={18} className="spinner" /> Génération...</>
            ) : (
              <><FileText size={18} /> Générer le PDF</>
            )}
          </button>
          <button className="btn-print" onClick={() => window.print()}>
            <Printer size={18} /> Imprimer
          </button>
        </div>
      </div>
    </>
  );
};

export default GenerationFacture;