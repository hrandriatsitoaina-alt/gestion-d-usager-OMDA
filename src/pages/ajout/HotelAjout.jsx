// src/pages/ajout/HotelAjout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HotelAjout = ({ onCancel }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState({ 
    id: null, nom: '', prefix: '', 
    compteurs: { 'Hôtel': 0 }, 
    anneeEnCours: new Date().getFullYear() 
  });
  const [fraisDossier, setFraisDossier] = useState('');
  const [montant, setMontant] = useState('');
  const [uniter, setUniter] = useState(1);
  const [soitTotal, setSoitTotal] = useState(0);
  const [regionsList, setRegionsList] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [showAddRegion, setShowAddRegion] = useState(false);

  const [hotelData, setHotelData] = useState({
    demandeur: '', denomination: '', adresseSiege: '', nifStat: '', telephone: '', email: '',
    etoiles: '', ravinala: false,
    representantNom: '', representantAdresse: '', representantTel: '', representantCin: '',
    representantCinDelivree: '', representantCinLieu: '', representantFonction: '',
    activite: '',
    moyensCommunication: {
      radio: { actif: false, taux: '' },
      lecteur: { actif: false, taux: '' },
      tv: { actif: false, taux: '' },
      autres: { actif: false, taux: '' }
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

  // CALCUL DU SOIT TOTAL
  useEffect(() => {
    let totalMoyens = 0;
    if (hotelData.moyensCommunication.radio.actif) {
      totalMoyens += parseInt(hotelData.moyensCommunication.radio.taux) || 0;
    }
    if (hotelData.moyensCommunication.lecteur.actif) {
      totalMoyens += parseInt(hotelData.moyensCommunication.lecteur.taux) || 0;
    }
    if (hotelData.moyensCommunication.tv.actif) {
      totalMoyens += parseInt(hotelData.moyensCommunication.tv.taux) || 0;
    }
    if (hotelData.moyensCommunication.autres.actif) {
      let taux = parseInt(hotelData.moyensCommunication.autres.taux) || 0;
      totalMoyens += taux;
    }
    const fraisVal = parseFloat(fraisDossier) || 0;
    const montantVal = parseFloat(montant) || 0;
    totalMoyens = totalMoyens + fraisVal + montantVal;
    
    setHotelData(prev => ({ ...prev, total: totalMoyens.toString() }));
    const finalTotal = totalMoyens * uniter;
    setSoitTotal(finalTotal);
  }, [hotelData.moyensCommunication, fraisDossier, montant, uniter]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUserInfo(prev => ({ 
        ...prev, 
        id: currentUser.id,
        nom: currentUser.nom, 
        prefix: currentUser.prefix,
        compteurs: currentUser.compteurs || { 'Hôtel': 0 },
        anneeEnCours: currentUser.anneeEnCours || new Date().getFullYear()
      }));
    }
    loadRegions();
  }, []);

  const handleHotelChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHotelData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleHotelMoyenCommChange = (moyen, field, value) => {
    setHotelData(prev => ({
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
      if (!hotelData.demandeur || !hotelData.denomination || !hotelData.region) {
        alert('Veuillez remplir les champs obligatoires: Demandeur, Dénomination et Région');
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!hotelData.representantNom || !hotelData.representantCin) {
        alert('Veuillez remplir les infos du représentant légal');
        return;
      }
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      if (!hotelData.activite) {
        alert('Veuillez sélectionner une activité');
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
      type: 'Hôtel',
      userId: currentUser.id,
      ...hotelData,
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
        alert('✅ Hôtel ajouté avec succès !');
        
        // ⭐ Rediriger vers la page de confirmation de paiement AVEC soit_total
        navigate('/confirme-paiement', { 
          state: { 
            usager: { 
              id: result.id,
              denomination: hotelData.denomination,
              demandeur: hotelData.demandeur,
              telephone: hotelData.telephone,
              region: hotelData.region,
              montant_mensuel: parseFloat(montant) || 0,
              frais_dossier: parseFloat(fraisDossier) || 0,
              montant_total: parseFloat(montant) || 0,
              // ⭐ AJOUT : Passer le soitTotal calculé
              soit_total: soitTotal,
              adresse: hotelData.adresseSiege,
              etoiles: hotelData.etoiles,
              ravinala: hotelData.ravinala,
              activite: hotelData.activite,
              representant_nom: hotelData.representantNom,
              representant_par: hotelData.representantPar,
              date_evenement: null,
              lieu_evenement: null,
              genre_manifestation: null,
              organisateurs: null,
              artistes: null,
              nom_evenement: null
            }, 
            type: 'hotel' 
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
    const nextCompteur = (userInfo.compteurs?.['Hôtel'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${userInfo.prefix || ''} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    return (
      <>
        <div className="user-info-header" style={{ background: '#e8f4f8', padding: '15px', borderRadius: '10px', marginBottom: '25px', borderLeft: '4px solid #007bff' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
            👤 Utilisateur: <span style={{ color: '#007bff' }}>{userInfo.nom}</span> ({userInfo.prefix})
          </div>
          <div className="dossier-number" style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginTop: '10px' }}>
            📄 Prochain dossier: {userDossierDisplay}
          </div>
        </div>

        <div className="form-row"><div className="form-label"><h2>👤 Demandeur :</h2></div><div className="form-input">
          <input type="text" name="demandeur" value={hotelData.demandeur} onChange={handleHotelChange} className="input-style" required />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>🏢 Dénomination :</h2></div><div className="form-input">
          <input type="text" name="denomination" value={hotelData.denomination} onChange={handleHotelChange} className="input-style" required />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>📍 Adresse du Siège :</h2></div><div className="form-input">
          <input type="text" name="adresseSiege" value={hotelData.adresseSiege} onChange={handleHotelChange} className="input-style" />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>📄 NIF / N° STAT :</h2></div><div className="form-input">
          <input type="text" name="nifStat" value={hotelData.nifStat} onChange={handleHotelChange} className="input-style" />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>📞 Tél. :</h2></div><div className="form-input">
          <input type="tel" name="telephone" value={hotelData.telephone} onChange={handleHotelChange} className="input-style" />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>✉️ E-mail :</h2></div><div className="form-input">
          <input type="email" name="email" value={hotelData.email} onChange={handleHotelChange} className="input-style" />
        </div></div>

        <div className="form-row">
          <div className="form-label"><h2>⭐ Catégorie :</h2></div>
          <div className="form-input-horizontal">
            <div className="inline-field">
              <span>Etoiles :</span>
              <select name="etoiles" value={hotelData.etoiles} onChange={handleHotelChange} className="input-small">
                <option value="">-</option><option value="1">⭐</option><option value="2">⭐⭐</option>
                <option value="3">⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="5">⭐⭐⭐⭐⭐</option>
              </select>
            </div>
            <div className="inline-field">
              <span>Ravinala :</span>
              <label><input type="checkbox" name="ravinala" checked={hotelData.ravinala} onChange={handleHotelChange} /></label>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2>📍 Région :</h2></div>
          <div className="form-input" style={{ display: 'flex', gap: '10px' }}>
            <select name="region" value={hotelData.region || ''} onChange={handleHotelChange} className="input-style" style={{ flex: 1 }} required>
              <option value="">Sélectionner une région</option>
              {regionsList.map((region, idx) => (<option key={idx} value={region}>{region}</option>))}
            </select>
            <button type="button" onClick={() => setShowAddRegion(!showAddRegion)} style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>+</button>
          </div>
        </div>
        {showAddRegion && (
          <div className="form-row">
            <div className="form-label"><h2>➕ Nouvelle région :</h2></div>
            <div className="form-input" style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={newRegion} onChange={(e) => setNewRegion(e.target.value)} placeholder="Nom de la nouvelle région" className="input-style" style={{ flex: 1 }} />
              <button type="button" onClick={handleAddRegion} style={{ padding: '8px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Ajouter</button>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderStep2 = () => (
    <>
      <div className="form-row"><div className="form-label"><h2>👤 Nom et prénoms :</h2></div><div className="form-input">
        <input type="text" name="representantNom" value={hotelData.representantNom} onChange={handleHotelChange} className="input-style" required />
      </div></div>
      <div className="form-row"><div className="form-label"><h2>🏠 Adresse :</h2></div><div className="form-input">
        <input type="text" name="representantAdresse" value={hotelData.representantAdresse} onChange={handleHotelChange} className="input-style" />
      </div></div>
      <div className="form-row"><div className="form-label"><h2>📞 Téléphone :</h2></div><div className="form-input">
        <input type="tel" name="representantTel" value={hotelData.representantTel} onChange={handleHotelChange} className="input-style" />
      </div></div>
      <div className="form-row"><div className="form-label"><h2>🆔 N° CIN :</h2></div><div className="form-input">
        <input type="text" name="representantCin" value={hotelData.representantCin} onChange={handleHotelChange} className="input-style" required />
      </div></div>
      <div className="form-row"><div className="form-label"><h2>📅 Délivrée le / Lieu :</h2></div><div className="form-input-horizontal">
        <input type="date" name="representantCinDelivree" value={hotelData.representantCinDelivree} onChange={handleHotelChange} className="input-date" />
        <input type="text" name="representantCinLieu" value={hotelData.representantCinLieu} onChange={handleHotelChange} placeholder="Lieu" className="input-lieu" />
      </div></div>
      <div className="form-row"><div className="form-label"><h2>💼 Fonction :</h2></div><div className="form-input">
        <input type="text" name="representantFonction" value={hotelData.representantFonction} onChange={handleHotelChange} className="input-style" />
      </div></div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="form-row"><div className="form-label"><h2>🎯 Activité :</h2></div><div className="form-input radio-group">
        <label><input type="radio" name="activite" value="hotellerie" checked={hotelData.activite === 'hotellerie'} onChange={handleHotelChange} /> Hôtellerie</label>
        <label><input type="radio" name="activite" value="restauration" checked={hotelData.activite === 'restauration'} onChange={handleHotelChange} /> Restauration</label>
        <label><input type="radio" name="activite" value="hotellerie_restauration" checked={hotelData.activite === 'hotellerie_restauration'} onChange={handleHotelChange} /> Hôtellerie et restauration</label>
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📻 Moyen de communication :</h2></div><div className="form-input moyens-comm">
        <div className="moyen-row">
          <label><input type="checkbox" checked={hotelData.moyensCommunication.radio.actif} onChange={(e) => handleHotelMoyenCommChange('radio', 'actif', e.target.checked)} /> Radio - Poste TSF</label>
          <div className="taux-input"><span>Taux :</span><input type="number" value={hotelData.moyensCommunication.radio.taux} onChange={(e) => handleHotelMoyenCommChange('radio', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!hotelData.moyensCommunication.radio.actif} /></div>
        </div>
        <div className="moyen-row">
          <label><input type="checkbox" checked={hotelData.moyensCommunication.lecteur.actif} onChange={(e) => handleHotelMoyenCommChange('lecteur', 'actif', e.target.checked)} /> Lecteur</label>
          <div className="taux-input"><span>Taux :</span><input type="number" value={hotelData.moyensCommunication.lecteur.taux} onChange={(e) => handleHotelMoyenCommChange('lecteur', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!hotelData.moyensCommunication.lecteur.actif} /></div>
        </div>
        <div className="moyen-row">
          <label><input type="checkbox" checked={hotelData.moyensCommunication.tv.actif} onChange={(e) => handleHotelMoyenCommChange('tv', 'actif', e.target.checked)} /> TV</label>
          <div className="taux-input"><span>Taux :</span><input type="number" value={hotelData.moyensCommunication.tv.taux} onChange={(e) => handleHotelMoyenCommChange('tv', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!hotelData.moyensCommunication.tv.actif} /></div>
        </div>
        <div className="moyen-row">
          <label><input type="checkbox" checked={hotelData.moyensCommunication.autres.actif} onChange={(e) => handleHotelMoyenCommChange('autres', 'actif', e.target.checked)} /> Autres</label>
          <div className="taux-input"><span>Taux :</span><input type="number" value={hotelData.moyensCommunication.autres.taux} onChange={(e) => handleHotelMoyenCommChange('autres', 'taux', e.target.value)} placeholder="Ar/an" className="input-taux" disabled={!hotelData.moyensCommunication.autres.actif} /></div>
        </div>
      </div></div>

      <div className="form-row"><div className="form-label"><h2>💰 Frais de dossier :</h2></div><div className="form-input">
        <input type="text" value={getDisplayValue(fraisDossier)} onChange={handleFraisDossierChange} className="input-style" placeholder="Montant en Ar" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>💵 Montant mensuel :</h2></div><div className="form-input">
        <input type="text" value={getDisplayValue(montant)} onChange={handleMontantChange} className="input-style" placeholder="Montant en Ar" />
      </div></div>

      <div className="form-row">
        <div className="form-label"><h2>🔢 Uniter :</h2></div>
        <div className="form-input">
          <input type="number" min="1" max="9" value={uniter} onChange={(e) => setUniter(Math.min(9, Math.max(1, parseInt(e.target.value) || 1)))} className="input-style" style={{ width: '80px' }} />
          <span style={{ marginLeft: '10px', fontSize: '14px', color: '#6c757d' }}>(1 à 9 unités)</span>
        </div>
      </div>

      <div className="form-row"><div className="form-label"><h2>💰 Soit au Total :</h2></div><div className="form-input">
        <input type="text" value={getSoitTotalDisplay()} readOnly className="input-style total-field" style={{ fontWeight: 'bold', color: '#28a745' }} />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>✍️ Soussigné(e) :</h2></div><div className="form-input">
        <input type="text" name="confirmationNom" value={hotelData.confirmationNom} onChange={handleHotelChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📍 Fait à :</h2></div><div className="form-input">
        <input type="text" name="lieuSignature" value={hotelData.lieuSignature} onChange={handleHotelChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📆 le :</h2></div><div className="form-input">
        <input type="date" name="dateSignature" value={hotelData.dateSignature} onChange={handleHotelChange} className="input-style" />
      </div></div>
    </>
  );

  const renderStep4 = () => {
    const nextCompteur = (userInfo.compteurs?.['Hôtel'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${userInfo.prefix || ''} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    return (
      <div className="recap-container">
        <h3>📋 RÉCAPITULATIF - HÔTEL / RESTAURANT</h3>
        <div className="user-info-recap" style={{ background: '#e8f4f8', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
          <p><strong>👤 Utilisateur:</strong> {userInfo.nom} ({userInfo.prefix})</p>
          <p><strong>📄 Prochain numéro de dossier:</strong> {userDossierDisplay}</p>
        </div>
        <table className="recap-table">
          <tbody>
            <tr><td style={{ fontWeight: 'bold' }}>👤 Demandeur</td><td>{hotelData.demandeur || '-'}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>🏢 Dénomination</td><td>{hotelData.denomination || '-'}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>📍 Région</td><td>{hotelData.region || '-'}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>🎯 Activité</td><td>{hotelData.activite === 'hotellerie' ? 'Hôtellerie' : hotelData.activite === 'restauration' ? 'Restauration' : hotelData.activite === 'hotellerie_restauration' ? 'Hôtellerie et restauration' : '-'}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>💰 Frais de dossier</td><td>{formatNumber(fraisDossier || 0)} Ar</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>💵 Montant mensuel</td><td>{formatNumber(montant || 0)} Ar/mois</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>📻 Radio - Poste TSF</td><td>{hotelData.moyensCommunication.radio.actif ? formatNumber(hotelData.moyensCommunication.radio.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>📻 Lecteur</td><td>{hotelData.moyensCommunication.lecteur.actif ? formatNumber(hotelData.moyensCommunication.lecteur.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>📺 TV</td><td>{hotelData.moyensCommunication.tv.actif ? formatNumber(hotelData.moyensCommunication.tv.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>📻 Autres</td><td>{hotelData.moyensCommunication.autres.actif ? formatNumber(hotelData.moyensCommunication.autres.taux || 0) + ' Ar/an' : 'Non actif'}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>🔢 Uniter</td><td>{uniter}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>💰 Soit Total</td><td><strong style={{ color: '#28a745' }}>{getSoitTotalDisplay()}</strong></td></tr>
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
    const titles = { 1: '📝 Étape 1 - Informations générales', 2: '📝 Étape 2 - Représentant légal', 3: '📝 Étape 3 - Activité et calcul', 4: '📋 Récapitulatif' };
    return titles[currentStep] || `📝 Étape ${currentStep}`;
  };

  return (
    <form onSubmit={handleNextStep}>
      <fieldset><legend>{getStepTitle()}</legend>
        {renderCurrentStep()}
        <div className="button-group" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', gap: '10px' }}>
          <button type="button" className="btn-cancel" onClick={onCancel} style={{ background: '#dc3545', color: 'white', padding: '10px 25px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
            ❌ Annuler
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep > 1 && (
              <button type="button" className="btn-secondary" onClick={handlePrevStep} style={{ background: '#6c757d', color: 'white', padding: '10px 25px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
                ◀ Précédent
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: '#007bff', color: 'white', padding: '10px 25px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
              {isLastStep() ? (isSubmitting ? '⏳ Envoi...' : '✅ Valider') : '▶ Suivant'}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
};

export default HotelAjout;