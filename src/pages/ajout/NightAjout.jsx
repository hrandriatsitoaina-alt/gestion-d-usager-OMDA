// src/pages/ajout/NightAjout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, User, Building2, MapPin, FileText, Phone, Mail,
  CreditCard, Calendar, Clock, DollarSign, Hash,
  ArrowLeft, ArrowRight, Save, X, Edit, Briefcase, Home,
  PlusCircle, Radio, Tv, Headphones, MoreHorizontal,
  CheckCircle, UserPlus, Music, Users as UsersIcon, Sunset
} from 'lucide-react';
import { useToast } from '../../components/Toast';

const NightAjout = ({ onCancel }) => {
  const navigate = useNavigate();
  const showToast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState({ 
    id: null, nom: '', prefix: '', 
    compteurs: { 'Night club': 0 }, 
    anneeEnCours: new Date().getFullYear() 
  });
  const [fraisDossier, setFraisDossier] = useState('');
  const [montant, setMontant] = useState('');
  const [uniter, setUniter] = useState(1);
  const [soitTotal, setSoitTotal] = useState(0);

  const [regionsList, setRegionsList] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [newRegionPhone, setNewRegionPhone] = useState('');
  const [showAddRegion, setShowAddRegion] = useState(false);

  const [nightData, setNightData] = useState({
    demandeur: '', denomination: '', adresseSiege: '', nifStat: '', telephone: '', email: '',
    representantNom: '', representantAdresse: '', representantTel: '', representantCin: '',
    representantCinDelivree: '', representantCinLieu: '', representantFonction: '',
    jaugeMax: '', horaires: '',
    moyensCommunication: {
      radio: { actif: false, taux: '' },
      lecteur: { actif: false, taux: '' },
      tv: { actif: false, taux: '' },
      autres: { actif: false, taux: '' }
    },
    total: '', aCompterDu: '', echeance: '', confirmationNom: '', dateSignature: '', lieuSignature: '',
    region: ''
  });

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)}`;
  };

  const formatNumber = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = value.toString().replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (!num) return '';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const getDisplayValue = (rawValue) => formatNumber(rawValue);
  const getSoitTotalDisplay = () => formatNumber(soitTotal) + ' Ar';

  const getTrimestreFromMonth = (month) => {
    if (month >= 1 && month <= 4) return 1;
    if (month >= 5 && month <= 8) return 2;
    return 3;
  };

  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) return JSON.parse(userStr);
    } catch (e) { console.error(e); }
    return null;
  };

  const handleFraisDossierChange = (e) => {
    const rawValue = e.target.value.replace(/\s/g, '');
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      setFraisDossier(rawValue);
      e.target.value = formatNumber(rawValue);
    }
  };

  const handleMontantChange = (e) => {
    const rawValue = e.target.value.replace(/\s/g, '');
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      setMontant(rawValue);
      e.target.value = formatNumber(rawValue);
    }
  };

  const loadRegions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/regions');
      const result = await response.json();
      if (result.success) {
        setRegionsList(result.regions);
      }
    } catch (error) {
      console.error('Erreur chargement régions:', error);
    }
  };

  const handleAddRegion = async () => {
    const trimmed = newRegion.trim();
    if (!trimmed) {
      showToast('Veuillez saisir un nom de région', 'error');
      return;
    }
    if (regionsList.some(r => r.nom === trimmed)) {
      showToast('Cette région existe déjà', 'error');
      return;
    }

    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      showToast('Token administrateur manquant. Veuillez vous reconnecter.', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/regions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'adminToken': adminToken
        },
        body: JSON.stringify({
          nom: trimmed,
          telephone: newRegionPhone.trim() || null
        })
      });
      const result = await response.json();
      if (result.success) {
        setRegionsList([...regionsList, result.region]);
        setNewRegion('');
        setNewRegionPhone('');
        setShowAddRegion(false);
        showToast(`✅ Région "${trimmed}" ajoutée !`, 'success');
        loadRegions();
      } else {
        showToast(`❌ ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Erreur ajout région:', error);
      showToast('❌ Erreur de connexion', 'error');
    }
  };

  // ✅ CALCUL CORRIGÉ - (Montant + Somme des taux) × Uniter + Frais de dossier
  useEffect(() => {
    let totalMoyens = 0;
    if (nightData.moyensCommunication.radio.actif) {
      totalMoyens += parseInt(nightData.moyensCommunication.radio.taux) || 0;
    }
    if (nightData.moyensCommunication.lecteur.actif) {
      totalMoyens += parseInt(nightData.moyensCommunication.lecteur.taux) || 0;
    }
    if (nightData.moyensCommunication.tv.actif) {
      totalMoyens += parseInt(nightData.moyensCommunication.tv.taux) || 0;
    }
    if (nightData.moyensCommunication.autres.actif) {
      let taux = parseInt(nightData.moyensCommunication.autres.taux) || 0;
      totalMoyens += taux;
    }
    const fraisVal = parseFloat(fraisDossier) || 0;
    const montantVal = parseFloat(montant) || 0;
    const uniterVal = parseInt(uniter) || 1;
    
    const totalCalcule = (montantVal + totalMoyens) * uniterVal;
    const totalFinal = totalCalcule + fraisVal;
    
    setNightData(prev => ({ ...prev, total: totalFinal.toString() }));
    setSoitTotal(totalFinal);
  }, [nightData.moyensCommunication, fraisDossier, montant, uniter]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUserInfo(prev => ({ 
        ...prev, 
        id: currentUser.id,
        nom: currentUser.nom, 
        prefix: currentUser.prefix,
        compteurs: currentUser.compteurs || { 'Night club': 0 },
        anneeEnCours: currentUser.anneeEnCours || new Date().getFullYear()
      }));
    }
    loadRegions();
  }, []);

  const handleNightChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNightData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNightMoyenCommChange = (moyen, field, value) => {
    setNightData(prev => ({
      ...prev,
      moyensCommunication: {
        ...prev.moyensCommunication,
        [moyen]: { ...prev.moyensCommunication[moyen], [field]: value }
      }
    }));
  };

  const getTotalSteps = () => 4;
  const isLastStep = () => currentStep === getTotalSteps();

  const handlePrevStep = (e) => {
    e.preventDefault();
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleNextStep = (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      if (!nightData.demandeur || !nightData.denomination || !nightData.region) {
        showToast('Veuillez remplir les champs obligatoires: Demandeur, Dénomination et Région', 'error');
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!nightData.representantNom || !nightData.representantCin) {
        showToast('Veuillez remplir les infos du représentant légal', 'error');
        return;
      }
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      if (!nightData.jaugeMax || !nightData.horaires) {
        showToast('Veuillez renseigner la jauge maximale et les horaires', 'error');
        return;
      }
      setCurrentStep(4);
      return;
    }
    if (currentStep === 4) {
      handleFinalSubmit();
      return;
    }
  };

  // ✅ HANDLE FINAL SUBMIT CORRIGÉ - comme Hotel et OCC
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      showToast('Erreur: Utilisateur non identifié', 'error');
      setIsSubmitting(false);
      return;
    }

    const fraisVal = parseFloat(fraisDossier) || 0;
    const montantVal = parseFloat(montant) || 0;
    const uniterVal = parseInt(uniter) || 1;
    
    let totalMoyens = 0;
    if (nightData.moyensCommunication.radio.actif) {
      totalMoyens += parseInt(nightData.moyensCommunication.radio.taux) || 0;
    }
    if (nightData.moyensCommunication.lecteur.actif) {
      totalMoyens += parseInt(nightData.moyensCommunication.lecteur.taux) || 0;
    }
    if (nightData.moyensCommunication.tv.actif) {
      totalMoyens += parseInt(nightData.moyensCommunication.tv.taux) || 0;
    }
    if (nightData.moyensCommunication.autres.actif) {
      totalMoyens += parseInt(nightData.moyensCommunication.autres.taux) || 0;
    }
    
    const totalCalcule = (montantVal + totalMoyens) * uniterVal;
    const totalFinal = totalCalcule + fraisVal;

    const finalData = {
      type: 'Night club',
      userId: currentUser.id,
      prefix: userInfo.prefix || currentUser.prefix || '',
      ...nightData,
      frais_dossier: fraisVal,
      montant_mensuel: montantVal,
      montant_total: montantVal,
      soit_total: totalFinal,
      uniter: uniterVal
    };

    console.log('📤 Données envoyées au backend (Night club):', finalData);

    try {
      const response = await fetch('http://localhost:3001/api/usagers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      const result = await response.json();
      
      if (result.success) {
        const updatedUser = getCurrentUser();
        if (updatedUser) {
          updatedUser.compteurs = updatedUser.compteurs || {};
          const nouveauCompteur = (updatedUser.compteurs['Night club'] || 0) + 1;
          updatedUser.compteurs['Night club'] = nouveauCompteur;
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          setUserInfo(prev => ({
            ...prev,
            compteurs: {
              ...prev.compteurs,
              'Night club': nouveauCompteur
            }
          }));
          
          console.log(`✅ Compteur Night club incrémenté à ${nouveauCompteur}`);
        }
        
        showToast('✅ Night Club ajouté avec succès !', 'success');
        
        navigate('/confirme-paiement', { 
          state: { 
            usager: { 
              id: result.id,
              denomination: nightData.denomination,
              demandeur: nightData.demandeur,
              telephone: nightData.telephone,
              region: nightData.region,
              adresse_siege: nightData.adresseSiege,
              nif_stat: nightData.nifStat,
              email: nightData.email,
              representant_nom: nightData.representantNom,
              representant_adresse: nightData.representantAdresse,
              representant_tel: nightData.representantTel,
              representant_cin: nightData.representantCin,
              representant_cin_delivree: nightData.representantCinDelivree,
              representant_cin_lieu: nightData.representantCinLieu,
              representant_fonction: nightData.representantFonction,
              jauge_max: nightData.jaugeMax,
              horaires: nightData.horaires,
              moyens_communication: nightData.moyensCommunication,
              a_compter_du: nightData.aCompterDu,
              echeance: nightData.echeance,
              confirmation_nom: nightData.confirmationNom,
              lieu_signature: nightData.lieuSignature,
              date_signature: nightData.dateSignature,
              montant_mensuel: montantVal,
              frais_dossier: fraisVal,
              montant_total: montantVal,
              soit_total: totalFinal,
              uniter: uniterVal,
              numero_dossier_utilisateur: `${userInfo.prefix || ''} ${(userInfo.compteurs?.['Night club'] || 0) + 1}/${getTrimestreFromMonth(new Date().getMonth() + 1)}/${userInfo.anneeEnCours || new Date().getFullYear()}`
            }, 
            type: 'nightclub'
          } 
        });
      } else {
        showToast('❌ Erreur: ' + result.message, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('❌ Erreur de connexion', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => {
    const nextCompteur = (userInfo.compteurs?.['Night club'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${userInfo.prefix || ''} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    return (
      <>
        <div className="user-info-header">
          <div className="user-info-row">
            <Users size={18} strokeWidth={2} />
            <span>Utilisateur: <strong>{userInfo.nom}</strong> ({userInfo.prefix})</span>
          </div>
          <div className="user-info-row">
            <FileText size={18} strokeWidth={2} />
            <span>Prochain dossier: <strong>{userDossierDisplay}</strong></span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><Users size={18} strokeWidth={2} /> Demandeur :</h2></div>
          <div className="form-input">
            <input type="text" name="demandeur" value={nightData.demandeur} onChange={handleNightChange} className="input-style" placeholder="Nom et prénoms du demandeur" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><Building2 size={18} strokeWidth={2} /> Dénomination :</h2></div>
          <div className="form-input">
            <input type="text" name="denomination" value={nightData.denomination} onChange={handleNightChange} className="input-style" placeholder="Nom de l'établissement" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> Adresse :</h2></div>
          <div className="form-input">
            <input type="text" name="adresseSiege" value={nightData.adresseSiege} onChange={handleNightChange} className="input-style" placeholder="Adresse complète" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><FileText size={18} strokeWidth={2} /> NIF / STAT :</h2></div>
          <div className="form-input">
            <input type="text" name="nifStat" value={nightData.nifStat} onChange={handleNightChange} className="input-style" placeholder="Numéro NIF ou STAT" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><Phone size={18} strokeWidth={2} /> Téléphone :</h2></div>
          <div className="form-input">
            <input type="tel" name="telephone" value={nightData.telephone} onChange={handleNightChange} className="input-style" placeholder="Numéro de téléphone" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><Mail size={18} strokeWidth={2} /> E-mail :</h2></div>
          <div className="form-input">
            <input type="email" name="email" value={nightData.email} onChange={handleNightChange} className="input-style" placeholder="Adresse e-mail" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> Région :</h2></div>
          <div className="form-input" style={{ display: 'flex', gap: '10px' }}>
            <select name="region" value={nightData.region || ''} onChange={handleNightChange} className="input-style" style={{ flex: 1 }} required>
              <option value="">Sélectionner une région</option>
              {regionsList.map((region) => {
                const phone = region.telephone && region.telephone.trim() !== ''
                  ? formatPhoneNumber(region.telephone)
                  : null;
                return (
                  <option key={region.id} value={region.nom}>
                    {region.nom} {phone ? `- ${phone}` : ''}
                  </option>
                );
              })}
            </select>
            <button type="button" onClick={() => setShowAddRegion(!showAddRegion)} className="btn-add-region">+</button>
          </div>
        </div>

        {showAddRegion && (
          <div className="form-row">
            <div className="form-label"><h2><PlusCircle size={18} strokeWidth={2} /> Nouvelle région :</h2></div>
            <div className="form-input" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                placeholder="Nom de la région"
                className="input-style"
                style={{ flex: 1, minWidth: '150px' }}
              />
              <input
                type="text"
                value={newRegionPhone}
                onChange={(e) => setNewRegionPhone(e.target.value)}
                placeholder="Téléphone (optionnel)"
                className="input-style"
                style={{ flex: 1, minWidth: '150px' }}
              />
              <button type="button" onClick={handleAddRegion} className="btn-add-region-confirm">Ajouter</button>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderStep2 = () => (
    <>
      <div className="form-row">
        <div className="form-label"><h2><User size={18} strokeWidth={2} /> Nom et prénoms :</h2></div>
        <div className="form-input">
          <input type="text" name="representantNom" value={nightData.representantNom} onChange={handleNightChange} className="input-style" placeholder="Nom complet du représentant" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Home size={18} strokeWidth={2} /> Adresse :</h2></div>
        <div className="form-input">
          <input type="text" name="representantAdresse" value={nightData.representantAdresse} onChange={handleNightChange} className="input-style" placeholder="Adresse du représentant" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Phone size={18} strokeWidth={2} /> Téléphone :</h2></div>
        <div className="form-input">
          <input type="tel" name="representantTel" value={nightData.representantTel} onChange={handleNightChange} className="input-style" placeholder="Numéro de téléphone" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><CreditCard size={18} strokeWidth={2} /> N° CIN :</h2></div>
        <div className="form-input">
          <input type="text" name="representantCin" value={nightData.representantCin} onChange={handleNightChange} className="input-style" placeholder="Numéro de la carte CIN" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Calendar size={18} strokeWidth={2} /> Délivrée le / Lieu :</h2></div>
        <div className="form-input-horizontal">
          <input type="date" name="representantCinDelivree" value={nightData.representantCinDelivree} onChange={handleNightChange} className="input-date" />
          <input type="text" name="representantCinLieu" value={nightData.representantCinLieu} onChange={handleNightChange} placeholder="Lieu de délivrance" className="input-lieu" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Briefcase size={18} strokeWidth={2} /> Fonction :</h2></div>
        <div className="form-input">
          <input type="text" name="representantFonction" value={nightData.representantFonction} onChange={handleNightChange} className="input-style" placeholder="Fonction du représentant" />
        </div>
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="form-row">
        <div className="form-label"><h2><UsersIcon size={18} strokeWidth={2} /> Jauge maximale :</h2></div>
        <div className="form-input">
          <input type="number" name="jaugeMax" value={nightData.jaugeMax} onChange={handleNightChange} className="input-style" placeholder="Capacité maximale en personnes" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Clock size={18} strokeWidth={2} /> Horaires :</h2></div>
        <div className="form-input">
          <input type="text" name="horaires" value={nightData.horaires} onChange={handleNightChange} className="input-style" placeholder="Ex: 20h - 04h" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Radio size={18} strokeWidth={2} /> Moyen de communication :</h2></div>
        <div className="form-input moyens-comm">
          <div className="moyen-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={nightData.moyensCommunication.radio.actif} onChange={(e) => handleNightMoyenCommChange('radio', 'actif', e.target.checked)} />
              Radio - Poste TSF
            </label>
            <div className="taux-input">
              <span>Taux :</span>
              <input type="number" value={nightData.moyensCommunication.radio.taux} onChange={(e) => handleNightMoyenCommChange('radio', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!nightData.moyensCommunication.radio.actif} />
            </div>
          </div>
          <div className="moyen-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={nightData.moyensCommunication.lecteur.actif} onChange={(e) => handleNightMoyenCommChange('lecteur', 'actif', e.target.checked)} />
              Lecteur
            </label>
            <div className="taux-input">
              <span>Taux :</span>
              <input type="number" value={nightData.moyensCommunication.lecteur.taux} onChange={(e) => handleNightMoyenCommChange('lecteur', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!nightData.moyensCommunication.lecteur.actif} />
            </div>
          </div>
          <div className="moyen-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={nightData.moyensCommunication.tv.actif} onChange={(e) => handleNightMoyenCommChange('tv', 'actif', e.target.checked)} />
              TV
            </label>
            <div className="taux-input">
              <span>Taux :</span>
              <input type="number" value={nightData.moyensCommunication.tv.taux} onChange={(e) => handleNightMoyenCommChange('tv', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!nightData.moyensCommunication.tv.actif} />
            </div>
          </div>
          <div className="moyen-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={nightData.moyensCommunication.autres.actif} onChange={(e) => handleNightMoyenCommChange('autres', 'actif', e.target.checked)} />
              Autres
            </label>
            <div className="taux-input">
              <span>Taux :</span>
              <input type="number" value={nightData.moyensCommunication.autres.taux} onChange={(e) => handleNightMoyenCommChange('autres', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!nightData.moyensCommunication.autres.actif} />
            </div>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><FileText size={18} strokeWidth={2} /> Frais de dossier :</h2></div>
        <div className="form-input">
          <input type="text" value={getDisplayValue(fraisDossier)} onChange={handleFraisDossierChange} className="input-style" placeholder="Frais de dossier en Ar" />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6c757d' }}>(fixe, non multiplié par Uniter)</span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><DollarSign size={18} strokeWidth={2} /> Montant mensuel :</h2></div>
        <div className="form-input">
          <input type="text" value={getDisplayValue(montant)} onChange={handleMontantChange} className="input-style" placeholder="Montant mensuel en Ar" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Hash size={18} strokeWidth={2} /> Uniter :</h2></div>
        <div className="form-input">
          <input type="number" min="1" max="9" value={uniter} onChange={(e) => setUniter(Math.min(9, Math.max(1, parseInt(e.target.value) || 1)))} className="input-style" style={{ width: '80px' }} placeholder="1" />
          <span style={{ marginLeft: '10px', fontSize: '14px', color: '#6c757d' }}>(1 à 9 unités)</span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><DollarSign size={18} strokeWidth={2} /> Soit Total :</h2></div>
        <div className="form-input">
          <input type="text" value={getSoitTotalDisplay()} readOnly className="input-style total-field" />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6c757d' }}>
            (Montant × Uniter + Frais de dossier)
          </span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Calendar size={18} strokeWidth={2} /> A compter du :</h2></div>
        <div className="form-input">
          <input type="date" name="aCompterDu" value={nightData.aCompterDu} onChange={handleNightChange} className="input-style" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Calendar size={18} strokeWidth={2} /> Echéance :</h2></div>
        <div className="form-input">
          <input type="date" name="echeance" value={nightData.echeance} onChange={handleNightChange} className="input-style" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Edit size={18} strokeWidth={2} /> Soussigné(e) :</h2></div>
        <div className="form-input">
          <input type="text" name="confirmationNom" value={nightData.confirmationNom} onChange={handleNightChange} className="input-style" placeholder="Nom du signataire" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> Fait à :</h2></div>
        <div className="form-input">
          <input type="text" name="lieuSignature" value={nightData.lieuSignature} onChange={handleNightChange} className="input-style" placeholder="Lieu de signature" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Calendar size={18} strokeWidth={2} /> le :</h2></div>
        <div className="form-input">
          <input type="date" name="dateSignature" value={nightData.dateSignature} onChange={handleNightChange} className="input-style" />
        </div>
      </div>
    </>
  );

  const renderStep4 = () => {
    const nextCompteur = (userInfo.compteurs?.['Night club'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${userInfo.prefix || ''} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    return (
      <div className="recap-container">
        <h3><CheckCircle size={20} strokeWidth={2} /> RÉCAPITULATIF - NIGHT CLUB</h3>
        <div className="user-info-recap">
          <p><Users size={16} strokeWidth={2} /> Utilisateur: <strong>{userInfo.nom}</strong> ({userInfo.prefix})</p>
          <p><FileText size={16} strokeWidth={2} /> Prochain dossier: <strong>{userDossierDisplay}</strong></p>
        </div>
        <table className="recap-table">
          <tbody>
            <tr><td><Users size={16} strokeWidth={2} /> Demandeur</td><td>{nightData.demandeur || '-'}</td></tr>
            <tr><td><Building2 size={16} strokeWidth={2} /> Dénomination</td><td>{nightData.denomination || '-'}</td></tr>
            <tr><td><MapPin size={16} strokeWidth={2} /> Région</td><td>{nightData.region || '-'}</td></tr>
            <tr><td><UsersIcon size={16} strokeWidth={2} /> Jauge max</td><td>{nightData.jaugeMax || '0'}</td></tr>
            <tr><td><Clock size={16} strokeWidth={2} /> Horaires</td><td>{nightData.horaires || '-'}</td></tr>
            <tr><td><FileText size={16} strokeWidth={2} /> Frais de dossier</td><td>{formatNumber(fraisDossier || 0)} Ar <span style={{ color: '#6c757d', fontSize: '12px' }}>(fixe)</span></td></tr>
            <tr><td><DollarSign size={16} strokeWidth={2} /> Montant mensuel</td><td>{formatNumber(montant || 0)} Ar/mois</td></tr>
            <tr><td><Radio size={16} strokeWidth={2} /> Radio - Poste TSF</td><td>{nightData.moyensCommunication.radio.actif ? formatNumber(nightData.moyensCommunication.radio.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td><Headphones size={16} strokeWidth={2} /> Lecteur</td><td>{nightData.moyensCommunication.lecteur.actif ? formatNumber(nightData.moyensCommunication.lecteur.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td><Tv size={16} strokeWidth={2} /> TV</td><td>{nightData.moyensCommunication.tv.actif ? formatNumber(nightData.moyensCommunication.tv.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td><MoreHorizontal size={16} strokeWidth={2} /> Autres</td><td>{nightData.moyensCommunication.autres.actif ? formatNumber(nightData.moyensCommunication.autres.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td><Hash size={16} strokeWidth={2} /> Uniter</td><td>{uniter}</td></tr>
            <tr><td><DollarSign size={16} strokeWidth={2} /> Soit Total</td><td><strong style={{ color: '#28a745' }}>{getSoitTotalDisplay()}</strong></td></tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  const getStepTitle = () => {
    const titles = {
      1: 'Étape 1 - Informations générales',
      2: 'Étape 2 - Représentant légal',
      3: 'Étape 3 - Activité et calcul',
      4: 'Récapitulatif'
    };
    return titles[currentStep] || `Étape ${currentStep}`;
  };

  return (
    <form onSubmit={handleNextStep}>
      <fieldset><legend>{getStepTitle()}</legend>
        {renderCurrentStep()}
        <div className="button-group">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            <X size={18} strokeWidth={2} /> Annuler
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep > 1 && (
              <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                <ArrowLeft size={18} strokeWidth={2} /> Précédent
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isLastStep() ? (
                isSubmitting ? <><Clock size={18} strokeWidth={2} /> Envoi...</> : <><Save size={18} strokeWidth={2} /> Valider</>
              ) : (
                <><ArrowRight size={18} strokeWidth={2} /> Suivant</>
              )}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
};

export default NightAjout;