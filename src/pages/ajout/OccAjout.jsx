// src/pages/ajout/OccAjout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OccAjout = ({ onCancel }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState({ 
    id: null, nom: '', prefix: '', 
    compteurs: { 'OCC': 0 }, 
    anneeEnCours: new Date().getFullYear() 
  });
  const [fraisDossier, setFraisDossier] = useState('');
  const [montant, setMontant] = useState('');
  const [uniter, setUniter] = useState(1);
  const [soitTotal, setSoitTotal] = useState(0);
  const [globalDossierNumber, setGlobalDossierNumber] = useState('');
  const [regionsList, setRegionsList] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [hasOtherArtists, setHasOtherArtists] = useState(false);
  const [otherArtistsInputs, setOtherArtistsInputs] = useState([]);

  const [occData, setOccData] = useState({
    organisateurs: '',
    representantPar: '',
    genreManifestation: '',
    artistes: '',
    dateEvenement: '',
    lieuEvenement: '',
    representantCin: '',
    representantCinDelivree: '',
    representantCinLieu: '',
    adresse: '',
    telephone: '',
    domicile: '',
    confirmationNom: '',
    dateSignature: '',
    lieuAjout: '',
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

  // ============================================================
  // CALCUL DU SOIT TOTAL POUR OCC
  // ============================================================
  useEffect(() => {
    const fraisVal = parseFloat(fraisDossier) || 0;
    const montantVal = parseFloat(montant) || 0;
    const totalCalcule = fraisVal + montantVal;
    const finalTotal = totalCalcule * uniter;
    setSoitTotal(finalTotal);
  }, [fraisDossier, montant, uniter]);

  // ============================================================
  // CHARGEMENT DES INFOS UTILISATEUR ET MISE À JOUR DU COMPTEUR
  // ============================================================
  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Récupérer les données à jour depuis le serveur
        try {
          const response = await fetch('http://localhost:3001/api/auth/current-user', {
            headers: {
              'Authorization': `Bearer ${currentUser.id}`
            }
          });
          const data = await response.json();
          if (data.success && data.user) {
            setUserInfo({
              id: data.user.id,
              nom: data.user.nom,
              prefix: data.user.prefix || '',
              compteurs: data.user.compteurs || { 'OCC': 0 },
              anneeEnCours: data.user.anneeEnCours || new Date().getFullYear()
            });
            console.log('✅ Compteur OCC:', data.user.compteurs?.['OCC'] || 0);
          } else {
            // Fallback sur localStorage
            setUserInfo({
              id: currentUser.id,
              nom: currentUser.nom,
              prefix: currentUser.prefix || '',
              compteurs: currentUser.compteurs || { 'OCC': 0 },
              anneeEnCours: currentUser.anneeEnCours || new Date().getFullYear()
            });
          }
        } catch (error) {
          console.error('Erreur chargement user:', error);
          // Fallback sur localStorage
          setUserInfo({
            id: currentUser.id,
            nom: currentUser.nom,
            prefix: currentUser.prefix || '',
            compteurs: currentUser.compteurs || { 'OCC': 0 },
            anneeEnCours: currentUser.anneeEnCours || new Date().getFullYear()
          });
        }
      }
      loadRegions();
    };
    
    loadUserData();

    const fetchDossierNumber = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/occ/dossier-number');
        const data = await response.json();
        if (data.success) setGlobalDossierNumber(data.dossierNumber);
      } catch (error) { console.error(error); }
    };
    fetchDossierNumber();
  }, []);

  const handleOccChange = (e) => {
    const { name, value } = e.target;
    setOccData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtherArtistsChange = (e) => {
    setHasOtherArtists(e.target.checked);
    if (!e.target.checked) setOtherArtistsInputs([]);
  };

  const handleOtherArtistsCountChange = (value) => {
    const count = parseInt(value) || 0;
    const newArtists = [];
    for (let i = 0; i < count; i++) {
      newArtists.push({ nom: '', role: '' });
    }
    setOtherArtistsInputs(newArtists);
  };

  const handleOtherArtistChange = (index, field, value) => {
    const updatedArtists = [...otherArtistsInputs];
    updatedArtists[index][field] = value;
    setOtherArtistsInputs(updatedArtists);
  };

  const getTotalSteps = () => {
    if (hasOtherArtists && otherArtistsInputs.length > 0) return 5;
    return 4;
  };

  const isLastStep = () => currentStep === getTotalSteps();

  const handlePrevStep = (e) => {
    e.preventDefault();
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    const totalSteps = getTotalSteps();

    if (currentStep === 1) {
      if (!occData.organisateurs || !occData.genreManifestation || !occData.dateEvenement || !occData.lieuEvenement) {
        alert('Veuillez remplir les champs obligatoires: Organisateurs, Genre, Date et Lieu');
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!occData.representantCin) {
        alert('Veuillez remplir les infos CIN du représentant');
        return;
      }
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      if (hasOtherArtists && otherArtistsInputs.length > 0) {
        setCurrentStep(4);
        return;
      }
      setCurrentStep(totalSteps);
      return;
    }
    if (currentStep === 4 && hasOtherArtists) {
      const allFilled = otherArtistsInputs.every(a => a.nom);
      if (!allFilled) {
        alert('Veuillez remplir tous les artistes supplémentaires');
        return;
      }
      setCurrentStep(5);
      return;
    }
    if (currentStep === totalSteps) {
      handleFinalSubmit();
      return;
    }
  };

  // ============================================================
  // SOUMISSION FINALE AVEC MISE À JOUR DU COMPTEUR
  // ============================================================
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      alert('Erreur: Utilisateur non identifié');
      setIsSubmitting(false);
      return;
    }

    try {
      const globalParts = globalDossierNumber.split('/');
      const globalCount = globalParts[0] || '0';
      const globalDay = String(new Date().getDate()).padStart(2, '0');
      const globalMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const globalYear = new Date().getFullYear();
      
      // ⭐ COMPTEUR : Incrémenter le compteur OCC
      const nouveauCompteur = (userInfo.compteurs?.['OCC'] || 0) + 1;
      const currentMonth = new Date().getMonth() + 1;
      const currentTrimestre = getTrimestreFromMonth(currentMonth);
      const numeroDossierUtilisateur = `${userInfo.prefix || ''} ${nouveauCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;
      const numeroDossierGlobal = `${globalCount}/${globalDay}/${globalMonth}/${globalYear}`;

      const finalData = {
        type: 'OCC',
        userId: currentUser.id,
        ...occData,
        otherArtistsDetail: otherArtistsInputs,
        hasOtherArtists,
        fraisDossier: parseFloat(fraisDossier) || 0,
        montantTotal: parseFloat(montant) || 0,
        dateAjout: new Date().toISOString().split('T')[0],
        demandeur: occData.organisateurs || '',
        representantNom: occData.organisateurs || '',
        numeroDossierGlobal: numeroDossierGlobal,
        numeroDossierUtilisateur: numeroDossierUtilisateur,
        region: occData.region || '',
        soitTotal: soitTotal,
        uniter: uniter,
        // ⭐ Envoyer le nouveau compteur au serveur
        nouveauCompteur: nouveauCompteur,
        typeKey: 'OCC'
      };

      const response = await fetch('http://localhost:3001/api/usagers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      const result = await response.json();
      if (result.success) {
        // ⭐ Mettre à jour le compteur dans le localStorage
        const updatedUser = getCurrentUser();
        if (updatedUser) {
          updatedUser.compteurs = updatedUser.compteurs || {};
          updatedUser.compteurs['OCC'] = nouveauCompteur;
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        alert('✅ Occasionnelle ajoutée avec succès !');
        
        // Redirection vers la page de confirmation
        navigate('/confirme-paiement', { 
          state: { 
            usager: { 
              id: result.id,
              denomination: occData.genreManifestation || occData.nom_evenement || 'OCC',
              demandeur: occData.organisateurs,
              telephone: occData.telephone,
              region: occData.region,
              montant_mensuel: 0,
              frais_dossier: parseFloat(fraisDossier) || 0,
              montant_total: parseFloat(montant) || 0,
              soit_total: soitTotal,
              uniter: uniter || 1,
              adresse: occData.adresse,
              genre_manifestation: occData.genreManifestation,
              date_evenement: occData.dateEvenement,
              lieu_evenement: occData.lieuEvenement,
              organisateurs: occData.organisateurs,
              artistes: occData.artistes,
              representant_par: occData.representantPar
            }, 
            type: 'occ'
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
    const globalParts = globalDossierNumber.split('/');
    const globalCount = globalParts[0] || '0';
    const globalDay = String(new Date().getDate()).padStart(2, '0');
    const globalMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const globalYear = new Date().getFullYear();
    
    // ⭐ Afficher le prochain numéro de dossier avec le compteur incrémenté
    const nextCompteur = (userInfo.compteurs?.['OCC'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${userInfo.prefix || ''} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    return (
      <>
        <div className="user-info-header" style={{ background: '#e8f4f8', padding: '15px', borderRadius: '10px', marginBottom: '25px', borderLeft: '4px solid #007bff' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
            👤 Utilisateur: <span style={{ color: '#007bff' }}>{userInfo.nom}</span> ({userInfo.prefix})
          </div>
          <div className="dossier-number" style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
            <span>📄 Dossier Global : {globalDay}/{globalMonth}/{globalYear}</span>
            <span style={{ marginLeft: '20px', color: '#007bff' }}>{userDossierDisplay}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
            📊 Nombre de dossiers OCC déjà créés cette année: <strong>{userInfo.compteurs?.['OCC'] || 0}</strong>
          </div>
        </div>

        <div className="form-row"><div className="form-label"><h2>2️⃣ Organisateurs :</h2></div><div className="form-input">
          <input type="text" name="organisateurs" value={occData.organisateurs} onChange={handleOccChange} className="input-style" required />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>3️⃣ Représenter par :</h2></div><div className="form-input">
          <input type="text" name="representantPar" value={occData.representantPar} onChange={handleOccChange} className="input-style" />
        </div></div>

        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />

        <div className="form-row"><div className="form-label"><h2>4️⃣ Genre de manifestation :</h2></div><div className="form-input">
          <input type="text" name="genreManifestation" value={occData.genreManifestation} onChange={handleOccChange} className="input-style" required />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>5️⃣ Artiste :</h2></div><div className="form-input">
          <input type="text" name="artistes" value={occData.artistes} onChange={handleOccChange} className="input-style" />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>6️⃣ Autre artiste :</h2></div><div className="form-input">
          <label><input type="checkbox" checked={hasOtherArtists} onChange={handleOtherArtistsChange} /> Ajouter d'autres artistes</label>
        </div></div>

        {hasOtherArtists && (
          <div className="form-row"><div className="form-label"><h2>🔢 Nombre d'artistes :</h2></div><div className="form-input">
            <input type="number" onChange={(e) => handleOtherArtistsCountChange(e.target.value)} className="input-style" min="1" />
          </div></div>
        )}

        {hasOtherArtists && otherArtistsInputs.map((artist, idx) => (
          <div key={idx} className="region-card" style={{ border: '1px solid #ddd', padding: '15px', margin: '10px 0', borderRadius: '8px', background: '#f9f9f9' }}>
            <h4>🎤 Artiste {idx + 1}</h4>
            <div className="form-row"><div className="form-label"><h2>Nom :</h2></div><div className="form-input">
              <input type="text" placeholder="Nom d'artiste" value={artist.nom} onChange={(e) => handleOtherArtistChange(idx, 'nom', e.target.value)} className="input-style" />
            </div></div>
            <div className="form-row"><div className="form-label"><h2>Rôle :</h2></div><div className="form-input">
              <input type="text" placeholder="Chanteur, Musicien, DJ" value={artist.role} onChange={(e) => handleOtherArtistChange(idx, 'role', e.target.value)} className="input-style" />
            </div></div>
          </div>
        ))}

        <div className="form-row"><div className="form-label"><h2>7️⃣ Date :</h2></div><div className="form-input">
          <input type="date" name="dateEvenement" value={occData.dateEvenement} onChange={handleOccChange} className="input-style" required />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>8️⃣ Lieu :</h2></div><div className="form-input">
          <input type="text" name="lieuEvenement" value={occData.lieuEvenement} onChange={handleOccChange} className="input-style" required />
        </div></div>

        <div className="form-row">
          <div className="form-label"><h2>📍 Région :</h2></div>
          <div className="form-input" style={{ display: 'flex', gap: '10px' }}>
            <select name="region" value={occData.region || ''} onChange={handleOccChange} className="input-style" style={{ flex: 1 }}>
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
      <div className="info-display" style={{ background: '#f0f7ff', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>
          <strong>📋 Organisateur :</strong> {occData.organisateurs || 'Non renseigné'}
        </p>
      </div>

      <div className="form-row"><div className="form-label"><h2>🆔 CIN du représentant :</h2></div><div className="form-input">
        <input type="text" name="representantCin" value={occData.representantCin} onChange={handleOccChange} className="input-style" required />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📅 Délivré le :</h2></div><div className="form-input">
        <input type="date" name="representantCinDelivree" value={occData.representantCinDelivree} onChange={handleOccChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📍 à :</h2></div><div className="form-input">
        <input type="text" name="representantCinLieu" value={occData.representantCinLieu} onChange={handleOccChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>🏠 Adresse :</h2></div><div className="form-input">
        <input type="text" name="adresse" value={occData.adresse} onChange={handleOccChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📞 Contact :</h2></div><div className="form-input">
        <input type="tel" name="telephone" value={occData.telephone} onChange={handleOccChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>🏡 Domicile :</h2></div><div className="form-input">
        <input type="text" name="domicile" value={occData.domicile} onChange={handleOccChange} className="input-style" />
      </div></div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="form-row"><div className="form-label"><h2>💰 Frais de dossier :</h2></div><div className="form-input">
        <input type="text" value={getDisplayValue(fraisDossier)} onChange={handleFraisDossierChange} className="input-style" placeholder="Frais de dossier en Ar" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>💵 Montant à payer :</h2></div><div className="form-input">
        <input type="text" value={getDisplayValue(montant)} onChange={handleMontantChange} className="input-style" placeholder="Montant total en Ar" />
      </div></div>

      <div className="form-row">
        <div className="form-label"><h2>🔢 Uniter :</h2></div>
        <div className="form-input">
          <input type="number" min="1" max="9" value={uniter} onChange={(e) => setUniter(Math.min(9, Math.max(1, parseInt(e.target.value) || 1)))} className="input-style" style={{ width: '80px' }} />
          <span style={{ marginLeft: '10px', fontSize: '14px', color: '#6c757d' }}>(1 à 9 unités)</span>
        </div>
      </div>

      <div className="form-row"><div className="form-label"><h2>💰 Soit Total :</h2></div><div className="form-input">
        <input type="text" value={getSoitTotalDisplay()} readOnly className="input-style total-field" style={{ fontWeight: 'bold', color: '#28a745' }} />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>✍️ Je soussigné(e) Mr/Mme :</h2></div><div className="form-input">
        <input type="text" name="confirmationNom" value={occData.confirmationNom} onChange={handleOccChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📆 Date :</h2></div><div className="form-input">
        <input type="date" name="dateSignature" value={occData.dateSignature} onChange={handleOccChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📍 Lieu et date :</h2></div><div className="form-input">
        <input type="text" name="lieuAjout" value={occData.lieuAjout} onChange={handleOccChange} className="input-style" />
      </div></div>
    </>
  );

  const renderStep4 = () => {
    const globalParts = globalDossierNumber.split('/');
    const globalCount = globalParts[0] || '0';
    const globalDay = String(new Date().getDate()).padStart(2, '0');
    const globalMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const globalYear = new Date().getFullYear();
    const nextCompteur = (userInfo.compteurs?.['OCC'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${userInfo.prefix || ''} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    return (
      <div className="recap-container">
        <h3>📋 RÉCAPITULATIF - OCCASIONNELLE</h3>
        <div className="user-info-recap" style={{ background: '#e8f4f8', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
          <p><strong>👤 Utilisateur:</strong> {userInfo.nom} ({userInfo.prefix})</p>
          <p><strong>📊 Dossiers déjà créés cette année:</strong> {userInfo.compteurs?.['OCC'] || 0}</p>
        </div>
        <table className="recap-table"><tbody>
          <tr><td style={{ fontWeight: 'bold' }}>📄 Dossier Global N° {globalCount}/{globalDay}/{globalMonth}/{globalYear}</td><td style={{ fontWeight: 'bold' }}>{userDossierDisplay}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>2️⃣ Organisateurs</td><td>{occData.organisateurs || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>3️⃣ Representé par</td><td>{occData.representantPar || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>4️⃣ Genre manifestation</td><td>{occData.genreManifestation || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>5️⃣ Artiste principal</td><td>{occData.artistes || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>7️⃣ Date</td><td>{occData.dateEvenement || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>8️⃣ Lieu</td><td>{occData.lieuEvenement || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>🆔 CIN</td><td>{occData.representantCin || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>📍 Région</td><td>{occData.region || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>💰 Frais de dossier</td><td>{formatNumber(fraisDossier || 0)} Ar</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>💵 Montant à payer</td><td>{formatNumber(montant || 0)} Ar</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>🔢 Uniter</td><td>{uniter}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>💰 Soit Total</td><td><strong style={{ color: '#28a745' }}>{getSoitTotalDisplay()}</strong></td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>✍️ Signataire</td><td>{occData.confirmationNom || '-'}</td></tr>
        </tbody></table>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="recap-container">
      <h3>🎸 ARTISTES SUPPLÉMENTAIRES</h3>
      <table className="recap-table"><thead><tr><th>#</th><th>Nom</th><th>Rôle</th></tr></thead><tbody>
        {otherArtistsInputs.map((a, i) => (<tr key={i}><td>{i + 1}</td><td>{a.nom || '-'}</td><td>{a.role || '-'}</td></tr>))}
      </tbody></table>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: {
        if (hasOtherArtists && otherArtistsInputs.length > 0 && getTotalSteps() === 5) return renderStep4();
        return renderStep4();
      }
      case 5: if (hasOtherArtists) return renderStep5();
      default: return null;
    }
  };

  const getStepTitle = () => {
    const titles = { 1: '📝 Étape 1 - Informations générales', 2: '📝 Étape 2 - Représentant', 3: '📝 Étape 3 - Calcul', 4: '📋 Récapitulatif', 5: '🎸 Artistes supplémentaires' };
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

export default OccAjout;