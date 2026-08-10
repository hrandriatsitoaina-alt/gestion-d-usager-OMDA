// src/pages/ajout/MagasinAjout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, User, Building2, MapPin, FileText, Phone, Mail,
  Star, CheckCircle, CreditCard, Calendar, Clock, DollarSign,
  ArrowLeft, ArrowRight, Save, X, Edit, Hash, Radio, Tv,
  Headphones, MoreHorizontal, Briefcase, Home, PlusCircle,
  ShoppingBag, Target
} from 'lucide-react';

const MagasinAjout = ({ onCancel }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState({ 
    id: null, nom: '', prefix: '', 
    compteurs: { 'Grand Surface': 0 }, 
    anneeEnCours: new Date().getFullYear() 
  });
  const [fraisDossier, setFraisDossier] = useState('');
  const [montant, setMontant] = useState('');
  const [uniter, setUniter] = useState(1);
  const [soitTotal, setSoitTotal] = useState(0);
  const [regionsList, setRegionsList] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [showAddRegion, setShowAddRegion] = useState(false);

  const [magasinData, setMagasinData] = useState({
    demandeur: '', denomination: '', adresseSiege: '', nifStat: '', telephone: '',
    representantNom: '', representantAdresse: '', representantTel: '', representantCin: '',
    representantCinDelivree: '', representantCinLieu: '', representantFonction: '',
    activite: '', nombreMagasins: '',
    moyensCommunication: {
      radio: { actif: false, taux: '' },
      lecteur: { actif: false, taux: '' },
      tv: { actif: false, taux: '' },
      autres: { actif: false, taux: '', periode: 'mois' }
    },
    total: '', aCompterDu: '', echeance: '', confirmationNom: '', dateSignature: '', lieuSignature: '',
    region: ''
  });

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
      if (result.success) setRegionsList(result.regions.map(r => r.nom));
    } catch (error) { console.error(error); }
  };

  const handleAddRegion = async () => {
    if (newRegion.trim() && !regionsList.includes(newRegion.trim())) {
      try {
        const response = await fetch('http://localhost:3001/api/regions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: newRegion.trim() })
        });
        const result = await response.json();
        if (result.success) {
          setRegionsList([...regionsList, newRegion.trim()]);
          setNewRegion('');
          setShowAddRegion(false);
          alert(`✅ Région "${newRegion.trim()}" ajoutée!`);
        }
      } catch (error) { console.error(error); }
    }
  };

  useEffect(() => {
    let totalMoyens = 0;
    if (magasinData.moyensCommunication.radio.actif) {
      totalMoyens += parseInt(magasinData.moyensCommunication.radio.taux) || 0;
    }
    if (magasinData.moyensCommunication.lecteur.actif) {
      totalMoyens += parseInt(magasinData.moyensCommunication.lecteur.taux) || 0;
    }
    if (magasinData.moyensCommunication.tv.actif) {
      totalMoyens += parseInt(magasinData.moyensCommunication.tv.taux) || 0;
    }
    if (magasinData.moyensCommunication.autres.actif) {
      let taux = parseInt(magasinData.moyensCommunication.autres.taux) || 0;
      if (magasinData.moyensCommunication.autres.periode === 'mois') {
        taux *= 12;
      }
      totalMoyens += taux;
    }
    const fraisVal = parseFloat(fraisDossier) || 0;
    const montantVal = parseFloat(montant) || 0;
    totalMoyens = totalMoyens + fraisVal + montantVal;
    
    setMagasinData(prev => ({ ...prev, total: totalMoyens.toString() }));
    const finalTotal = totalMoyens * uniter;
    setSoitTotal(finalTotal);
  }, [magasinData.moyensCommunication, fraisDossier, montant, uniter]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUserInfo(prev => ({ 
        ...prev, 
        id: currentUser.id,
        nom: currentUser.nom, 
        prefix: currentUser.prefix,
        compteurs: currentUser.compteurs || { 'Grand Surface': 0 },
        anneeEnCours: currentUser.anneeEnCours || new Date().getFullYear()
      }));
    }
    loadRegions();
  }, []);

  const handleMagasinChange = (e) => {
    const { name, value } = e.target;
    setMagasinData(prev => ({ ...prev, [name]: value }));
  };

  const handleMagasinMoyenCommChange = (moyen, field, value) => {
    setMagasinData(prev => ({
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
      if (!magasinData.demandeur || !magasinData.denomination || !magasinData.region) {
        alert('Veuillez remplir les champs obligatoires: Demandeur, Dénomination et Région');
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!magasinData.representantNom || !magasinData.representantCin) {
        alert('Veuillez remplir les infos du représentant légal');
        return;
      }
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      if (!magasinData.activite || !magasinData.nombreMagasins) {
        alert('Veuillez remplir l\'activité et le nombre de magasins');
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

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      alert('Erreur: Utilisateur non identifié');
      setIsSubmitting(false);
      return;
    }

    const finalData = {
      type: 'Grand Surface',
      userId: currentUser.id,
      ...magasinData,
      fraisDossier: parseFloat(fraisDossier) || 0,
      montantMensuel: parseFloat(montant) || 0,
      soitTotal: soitTotal,
      uniter: uniter
    };

    try {
      const response = await fetch('http://localhost:3001/api/usagers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Magasin ajouté avec succès !');
        navigate('/confirme-paiement', { 
          state: { 
            usager: { 
              id: result.id,
              denomination: magasinData.denomination,
              demandeur: magasinData.demandeur,
              telephone: magasinData.telephone,
              region: magasinData.region,
              montant_mensuel: parseFloat(montant) || 0,
              frais_dossier: parseFloat(fraisDossier) || 0,
              montant_total: parseFloat(montant) || 0,
              soit_total: soitTotal,
              uniter: uniter || 1,
              adresse: magasinData.adresseSiege,
              activite: magasinData.activite,
              nombre_magasins: magasinData.nombreMagasins,
              representant_nom: magasinData.representantNom,
              representant_par: magasinData.representantPar,
              date_evenement: null,
              lieu_evenement: null,
              genre_manifestation: null,
              organisateurs: null,
              artistes: null,
              nom_evenement: null
            }, 
            type: 'grand-surface'
          } 
        });
      } else {
        alert('❌ Erreur: ' + result.message);
      }
    } catch (error) {
      console.error(error);
      alert('❌ Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => {
    const nextCompteur = (userInfo.compteurs?.['Grand Surface'] || 0) + 1;
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
            <input type="text" name="demandeur" value={magasinData.demandeur} onChange={handleMagasinChange} className="input-style" placeholder="Nom et prénoms du demandeur" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><Building2 size={18} strokeWidth={2} /> Dénomination :</h2></div>
          <div className="form-input">
            <input type="text" name="denomination" value={magasinData.denomination} onChange={handleMagasinChange} className="input-style" placeholder="Nom de l'établissement" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> Adresse :</h2></div>
          <div className="form-input">
            <input type="text" name="adresseSiege" value={magasinData.adresseSiege} onChange={handleMagasinChange} className="input-style" placeholder="Adresse complète du siège" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><FileText size={18} strokeWidth={2} /> NIF / STAT :</h2></div>
          <div className="form-input">
            <input type="text" name="nifStat" value={magasinData.nifStat} onChange={handleMagasinChange} className="input-style" placeholder="Numéro NIF ou STAT" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><Phone size={18} strokeWidth={2} /> Tél. :</h2></div>
          <div className="form-input">
            <input type="tel" name="telephone" value={magasinData.telephone} onChange={handleMagasinChange} className="input-style" placeholder="Numéro de téléphone" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> Région :</h2></div>
          <div className="form-input" style={{ display: 'flex', gap: '10px' }}>
            <select name="region" value={magasinData.region || ''} onChange={handleMagasinChange} className="input-style" style={{ flex: 1 }} required>
              <option value="">Sélectionner une région</option>
              {regionsList.map((region, idx) => (<option key={idx} value={region}>{region}</option>))}
            </select>
            <button type="button" onClick={() => setShowAddRegion(!showAddRegion)} className="btn-add-region">+</button>
          </div>
        </div>
        {showAddRegion && (
          <div className="form-row">
            <div className="form-label"><h2><PlusCircle size={18} strokeWidth={2} /> Nouvelle région :</h2></div>
            <div className="form-input" style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={newRegion} onChange={(e) => setNewRegion(e.target.value)} placeholder="Nom de la nouvelle région" className="input-style" style={{ flex: 1 }} />
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
          <input type="text" name="representantNom" value={magasinData.representantNom} onChange={handleMagasinChange} className="input-style" placeholder="Nom complet du représentant" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Home size={18} strokeWidth={2} /> Adresse :</h2></div>
        <div className="form-input">
          <input type="text" name="representantAdresse" value={magasinData.representantAdresse} onChange={handleMagasinChange} className="input-style" placeholder="Adresse du représentant" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Phone size={18} strokeWidth={2} /> Téléphone :</h2></div>
        <div className="form-input">
          <input type="tel" name="representantTel" value={magasinData.representantTel} onChange={handleMagasinChange} className="input-style" placeholder="Numéro de téléphone" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><CreditCard size={18} strokeWidth={2} /> N° CIN :</h2></div>
        <div className="form-input">
          <input type="text" name="representantCin" value={magasinData.representantCin} onChange={handleMagasinChange} className="input-style" placeholder="Numéro de la carte CIN" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Calendar size={18} strokeWidth={2} /> Délivrée le / Lieu :</h2></div>
        <div className="form-input-horizontal">
          <input type="date" name="representantCinDelivree" value={magasinData.representantCinDelivree} onChange={handleMagasinChange} className="input-date" />
          <input type="text" name="representantCinLieu" value={magasinData.representantCinLieu} onChange={handleMagasinChange} placeholder="Lieu de délivrance" className="input-lieu" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Briefcase size={18} strokeWidth={2} /> Fonction :</h2></div>
        <div className="form-input">
          <input type="text" name="representantFonction" value={magasinData.representantFonction} onChange={handleMagasinChange} className="input-style" placeholder="Fonction du représentant" />
        </div>
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="form-row">
        <div className="form-label"><h2><Target size={18} strokeWidth={2} /> Activité :</h2></div>
        <div className="form-input">
          <input type="text" name="activite" value={magasinData.activite} onChange={handleMagasinChange} className="input-style" placeholder="Type d'activité" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><ShoppingBag size={18} strokeWidth={2} /> Nombre de magasins :</h2></div>
        <div className="form-input">
          <input type="number" name="nombreMagasins" value={magasinData.nombreMagasins} onChange={handleMagasinChange} className="input-style" placeholder="Nombre total de magasins" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Radio size={18} strokeWidth={2} /> Moyen de communication :</h2></div>
        <div className="form-input moyens-comm">
          <div className="moyen-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={magasinData.moyensCommunication.radio.actif} onChange={(e) => handleMagasinMoyenCommChange('radio', 'actif', e.target.checked)} />
              Radio - Poste TSF
            </label>
            <div className="taux-input">
              <span>Taux :</span>
              <input type="number" value={magasinData.moyensCommunication.radio.taux} onChange={(e) => handleMagasinMoyenCommChange('radio', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!magasinData.moyensCommunication.radio.actif} />
            </div>
          </div>
          <div className="moyen-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={magasinData.moyensCommunication.lecteur.actif} onChange={(e) => handleMagasinMoyenCommChange('lecteur', 'actif', e.target.checked)} />
              Lecteur
            </label>
            <div className="taux-input">
              <span>Taux :</span>
              <input type="number" value={magasinData.moyensCommunication.lecteur.taux} onChange={(e) => handleMagasinMoyenCommChange('lecteur', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!magasinData.moyensCommunication.lecteur.actif} />
            </div>
          </div>
          <div className="moyen-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={magasinData.moyensCommunication.tv.actif} onChange={(e) => handleMagasinMoyenCommChange('tv', 'actif', e.target.checked)} />
              TV
            </label>
            <div className="taux-input">
              <span>Taux :</span>
              <input type="number" value={magasinData.moyensCommunication.tv.taux} onChange={(e) => handleMagasinMoyenCommChange('tv', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!magasinData.moyensCommunication.tv.actif} />
            </div>
          </div>
          <div className="moyen-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={magasinData.moyensCommunication.autres.actif} onChange={(e) => handleMagasinMoyenCommChange('autres', 'actif', e.target.checked)} />
              Autres
            </label>
            <div className="taux-input">
              <span>Taux :</span>
              <input type="number" value={magasinData.moyensCommunication.autres.taux} onChange={(e) => handleMagasinMoyenCommChange('autres', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!magasinData.moyensCommunication.autres.actif} />
            </div>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><FileText size={18} strokeWidth={2} /> Frais de dossier :</h2></div>
        <div className="form-input">
          <input type="text" value={getDisplayValue(fraisDossier)} onChange={handleFraisDossierChange} className="input-style" placeholder="Frais de dossier en Ar" />
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
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Edit size={18} strokeWidth={2} /> Soussigné(e) :</h2></div>
        <div className="form-input">
          <input type="text" name="confirmationNom" value={magasinData.confirmationNom} onChange={handleMagasinChange} className="input-style" placeholder="Nom du signataire" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> Fait à :</h2></div>
        <div className="form-input">
          <input type="text" name="lieuSignature" value={magasinData.lieuSignature} onChange={handleMagasinChange} className="input-style" placeholder="Lieu de signature" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Calendar size={18} strokeWidth={2} /> le :</h2></div>
        <div className="form-input">
          <input type="date" name="dateSignature" value={magasinData.dateSignature} onChange={handleMagasinChange} className="input-style" />
        </div>
      </div>
    </>
  );

  const renderStep4 = () => {
    const nextCompteur = (userInfo.compteurs?.['Grand Surface'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${userInfo.prefix || ''} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    return (
      <div className="recap-container">
        <h3><CheckCircle size={20} strokeWidth={2} /> RÉCAPITULATIF - MAGASIN</h3>
        <div className="user-info-recap">
          <p><Users size={16} strokeWidth={2} /> Utilisateur: <strong>{userInfo.nom}</strong> ({userInfo.prefix})</p>
          <p><FileText size={16} strokeWidth={2} /> Prochain dossier: <strong>{userDossierDisplay}</strong></p>
        </div>
        <table className="recap-table">
          <tbody>
            <tr><td><Users size={16} strokeWidth={2} /> Demandeur</td><td>{magasinData.demandeur || '-'}</td></tr>
            <tr><td><Building2 size={16} strokeWidth={2} /> Dénomination</td><td>{magasinData.denomination || '-'}</td></tr>
            <tr><td><MapPin size={16} strokeWidth={2} /> Région</td><td>{magasinData.region || '-'}</td></tr>
            <tr><td><Target size={16} strokeWidth={2} /> Activité</td><td>{magasinData.activite || '-'}</td></tr>
            <tr><td><ShoppingBag size={16} strokeWidth={2} /> Nombre magasins</td><td>{magasinData.nombreMagasins || '0'}</td></tr>
            <tr><td><FileText size={16} strokeWidth={2} /> Frais de dossier</td><td>{formatNumber(fraisDossier || 0)} Ar</td></tr>
            <tr><td><DollarSign size={16} strokeWidth={2} /> Montant mensuel</td><td>{formatNumber(montant || 0)} Ar/mois</td></tr>
            <tr><td><Radio size={16} strokeWidth={2} /> Radio - Poste TSF</td><td>{magasinData.moyensCommunication.radio.actif ? formatNumber(magasinData.moyensCommunication.radio.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td><Headphones size={16} strokeWidth={2} /> Lecteur</td><td>{magasinData.moyensCommunication.lecteur.actif ? formatNumber(magasinData.moyensCommunication.lecteur.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td><Tv size={16} strokeWidth={2} /> TV</td><td>{magasinData.moyensCommunication.tv.actif ? formatNumber(magasinData.moyensCommunication.tv.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td><MoreHorizontal size={16} strokeWidth={2} /> Autres</td><td>{magasinData.moyensCommunication.autres.actif ? formatNumber(magasinData.moyensCommunication.autres.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
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

export default MagasinAjout;