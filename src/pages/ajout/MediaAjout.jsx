// src/pages/ajout/MediaAjout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MediaAjout = ({ onCancel }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState({ 
    id: null, nom: '', prefix: '', 
    compteurs: { 'Télé/Radio': 0 }, 
    anneeEnCours: new Date().getFullYear() 
  });
  const [fraisDossier, setFraisDossier] = useState('');
  const [uniter, setUniter] = useState(1);
  const [soitTotal, setSoitTotal] = useState(0);
  const [regionsList, setRegionsList] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [hasRegions, setHasRegions] = useState(false);
  const [regionsInputs, setRegionsInputs] = useState([]);

  const [mediaData, setMediaData] = useState({
    proprietaireNom: '', proprietaireAdresse: '', proprietaireTel: '', proprietaireCin: '',
    proprietaireCinDelivree: '', proprietaireCinLieu: '',
    representantNom: '', representantAdresse: '', representantTel: '', representantCin: '',
    representantCinDelivree: '', representantCinLieu: '',
    representantPouvoirDate: '', representantPouvoirPar: '', representantFonction: '',
    denomination: '', frequence: '', canal: '', siege: '', telephone: '', email: '',
    nif: '', stat: '', taux: '',
    couvertureCapitale: false, couvertureChefLieuProvince: false,
    couvertureChefLieuRegion: false, couvertureDistrict: false,
    horairesJusqua12: false, horaires13a24: false,
    confirmationNom: '', dateSignature: '', lieuSignature: '',
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
    const tauxVal = parseFloat(mediaData.taux) || 0;
    const fraisVal = parseFloat(fraisDossier) || 0;
    const totalCalcule = tauxVal + fraisVal;
    const finalTotal = totalCalcule * uniter;
    setSoitTotal(finalTotal);
  }, [mediaData.taux, fraisDossier, uniter]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUserInfo(prev => ({ 
        ...prev, 
        id: currentUser.id,
        nom: currentUser.nom, 
        prefix: currentUser.prefix,
        compteurs: currentUser.compteurs || { 'Télé/Radio': 0 },
        anneeEnCours: currentUser.anneeEnCours || new Date().getFullYear()
      }));
    }
    loadRegions();
  }, []);

  const handleMediaChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMediaData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleMediaRegionChange = (index, field, value) => {
    const updatedRegions = [...regionsInputs];
    updatedRegions[index][field] = value;
    setRegionsInputs(updatedRegions);
  };

  const handleMediaHasRegionsChange = (e) => {
    setHasRegions(e.target.checked);
    if (!e.target.checked) setRegionsInputs([]);
  };

  const handleMediaNombreRegionsChange = (value) => {
    const count = parseInt(value) || 0;
    const newRegions = [];
    for (let i = 0; i < count; i++) {
      newRegions.push({ nom: '', frequence: '', audience: '' });
    }
    setRegionsInputs(newRegions);
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
      if (!mediaData.proprietaireNom || !mediaData.proprietaireCin || !mediaData.proprietaireAdresse || !mediaData.proprietaireTel) {
        alert('Veuillez remplir tous les champs du propriétaire');
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!mediaData.representantNom || !mediaData.representantCin || !mediaData.representantAdresse || !mediaData.representantTel) {
        alert('Veuillez remplir tous les champs du représentant légal');
        return;
      }
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      if (!mediaData.denomination || !mediaData.frequence || !mediaData.siege || !mediaData.telephone || !mediaData.taux) {
        alert('Veuillez remplir tous les champs de la station');
        return;
      }
      if (hasRegions && regionsInputs.length > 0) {
        const allRegionsFilled = regionsInputs.every(r => r.nom && r.frequence && r.audience);
        if (!allRegionsFilled) {
          alert('Veuillez remplir tous les détails des régions');
          return;
        }
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
      type: 'Télé/Radio',
      userId: currentUser.id,
      ...mediaData,
      regionsDetail: regionsInputs,
      hasRegions,
      fraisDossier: parseFloat(fraisDossier) || 0,
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
        alert('✅ Télé/Radio ajouté avec succès !');
        
        // ⭐ REDIRECTION VERS LA PAGE DE CONFIRMATION DE PAIEMENT AVEC SOIT_TOTAL
        navigate('/confirme-paiement', { 
          state: { 
            usager: { 
              id: result.id,
              denomination: mediaData.denomination,
              demandeur: mediaData.proprietaireNom,
              telephone: mediaData.telephone,
              region: mediaData.region,
              montant_mensuel: 0,
              frais_dossier: parseFloat(fraisDossier) || 0,
              montant_total: parseFloat(mediaData.taux) || 0,
              soit_total: soitTotal,
              uniter: uniter || 1,
              adresse: mediaData.siege,
              activite: 'Télé/Radio',
              frequence: mediaData.frequence,
              canal: mediaData.canal,
              representant_nom: mediaData.representantNom,
              representant_par: mediaData.representantPar,
              date_evenement: null,
              lieu_evenement: null,
              genre_manifestation: null,
              organisateurs: null,
              artistes: null,
              nom_evenement: null
            }, 
            type: 'media'
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
    const nextCompteur = (userInfo.compteurs?.['Télé/Radio'] || 0) + 1;
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

        <div className="form-section-title">📋 1) PROPRIÉTAIRE DE LA STATION</div>
        
        <div className="form-row"><div className="form-label"><h2>👤 Nom et prénoms :</h2></div><div className="form-input">
          <input type="text" name="proprietaireNom" value={mediaData.proprietaireNom} onChange={handleMediaChange} className="input-style" required />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>🏠 Adresse :</h2></div><div className="form-input">
          <input type="text" name="proprietaireAdresse" value={mediaData.proprietaireAdresse} onChange={handleMediaChange} className="input-style" required />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>📞 Téléphone :</h2></div><div className="form-input">
          <input type="tel" name="proprietaireTel" value={mediaData.proprietaireTel} onChange={handleMediaChange} className="input-style" required />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>🆔 N° CIN :</h2></div><div className="form-input">
          <input type="text" name="proprietaireCin" value={mediaData.proprietaireCin} onChange={handleMediaChange} className="input-style" required />
        </div></div>

        <div className="form-row"><div className="form-label"><h2>📅 Délivrée le / Lieu :</h2></div><div className="form-input-horizontal">
          <input type="date" name="proprietaireCinDelivree" value={mediaData.proprietaireCinDelivree} onChange={handleMediaChange} className="input-date" />
          <input type="text" name="proprietaireCinLieu" value={mediaData.proprietaireCinLieu} onChange={handleMediaChange} placeholder="Lieu" className="input-lieu" />
        </div></div>

        <div className="form-row">
          <div className="form-label"><h2>📍 Région :</h2></div>
          <div className="form-input" style={{ display: 'flex', gap: '10px' }}>
            <select name="region" value={mediaData.region || ''} onChange={handleMediaChange} className="input-style" style={{ flex: 1 }} required>
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
      <div className="form-section-title">📋 2) REPRÉSENTANT LÉGAL</div>
      
      <div className="form-row"><div className="form-label"><h2>👤 Nom et prénoms :</h2></div><div className="form-input">
        <input type="text" name="representantNom" value={mediaData.representantNom} onChange={handleMediaChange} className="input-style" required />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>🏠 Adresse :</h2></div><div className="form-input">
        <input type="text" name="representantAdresse" value={mediaData.representantAdresse} onChange={handleMediaChange} className="input-style" required />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📞 Téléphone :</h2></div><div className="form-input">
        <input type="tel" name="representantTel" value={mediaData.representantTel} onChange={handleMediaChange} className="input-style" required />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>🆔 N° CIN :</h2></div><div className="form-input">
        <input type="text" name="representantCin" value={mediaData.representantCin} onChange={handleMediaChange} className="input-style" required />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📅 Délivrée le / Lieu :</h2></div><div className="form-input-horizontal">
        <input type="date" name="representantCinDelivree" value={mediaData.representantCinDelivree} onChange={handleMediaChange} className="input-date" />
        <input type="text" name="representantCinLieu" value={mediaData.representantCinLieu} onChange={handleMediaChange} placeholder="Lieu" className="input-lieu" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📜 Pouvoir donné le :</h2></div><div className="form-input-horizontal">
        <input type="date" name="representantPouvoirDate" value={mediaData.representantPouvoirDate} onChange={handleMediaChange} className="input-date" />
        <span>par</span>
        <input type="text" name="representantPouvoirPar" value={mediaData.representantPouvoirPar} onChange={handleMediaChange} placeholder="Nom" className="input-lieu" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>💼 Fonction :</h2></div><div className="form-input">
        <input type="text" name="representantFonction" value={mediaData.representantFonction} onChange={handleMediaChange} className="input-style" />
      </div></div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="form-section-title">📋 3) RENSEIGNEMENTS SUR LA STATION</div>
      
      <div className="form-row"><div className="form-label"><h2>🏢 Dénomination :</h2></div><div className="form-input">
        <input type="text" name="denomination" value={mediaData.denomination} onChange={handleMediaChange} className="input-style" required />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📻 Fréquence :</h2></div><div className="form-input">
        <input type="text" name="frequence" value={mediaData.frequence} onChange={handleMediaChange} className="input-style" required />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📺 Canal :</h2></div><div className="form-input">
        <input type="text" name="canal" value={mediaData.canal} onChange={handleMediaChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📍 Siège social :</h2></div><div className="form-input">
        <input type="text" name="siege" value={mediaData.siege} onChange={handleMediaChange} className="input-style" required />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📞 Téléphone :</h2></div><div className="form-input">
        <input type="tel" name="telephone" value={mediaData.telephone} onChange={handleMediaChange} className="input-style" required />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>✉️ E-mail :</h2></div><div className="form-input">
        <input type="email" name="email" value={mediaData.email} onChange={handleMediaChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📄 NIF :</h2></div><div className="form-input">
        <input type="text" name="nif" value={mediaData.nif} onChange={handleMediaChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📊 STAT :</h2></div><div className="form-input">
        <input type="text" name="stat" value={mediaData.stat} onChange={handleMediaChange} className="input-style" />
      </div></div>

      <div className="form-section-subtitle">🌍 Couverture :</div>
      <div className="form-row"><div className="form-label"></div><div className="form-input checkbox-group">
        <label><input type="checkbox" name="couvertureCapitale" checked={mediaData.couvertureCapitale} onChange={handleMediaChange} /> Capitale</label>
        <label><input type="checkbox" name="couvertureChefLieuProvince" checked={mediaData.couvertureChefLieuProvince} onChange={handleMediaChange} /> Chef-lieu de Province</label>
        <label><input type="checkbox" name="couvertureChefLieuRegion" checked={mediaData.couvertureChefLieuRegion} onChange={handleMediaChange} /> Chef-lieu de Région</label>
        <label><input type="checkbox" name="couvertureDistrict" checked={mediaData.couvertureDistrict} onChange={handleMediaChange} /> District</label>
      </div></div>

      <div className="form-section-subtitle">⏰ Horaires de diffusion :</div>
      <div className="form-row"><div className="form-label"></div><div className="form-input checkbox-group">
        <label><input type="checkbox" name="horairesJusqua12" checked={mediaData.horairesJusqua12} onChange={handleMediaChange} /> Jusqu'à 12 heures</label>
        <label><input type="checkbox" name="horaires13a24" checked={mediaData.horaires13a24} onChange={handleMediaChange} /> 13 à 24 heures</label>
      </div></div>

      <div className="form-section-subtitle">🗺️ Présence par région :</div>
      <div className="form-row"><div className="form-label"></div><div className="form-input">
        <label><input type="checkbox" checked={hasRegions} onChange={handleMediaHasRegionsChange} /> Activer les régions</label>
      </div></div>

      {hasRegions && (
        <>
          <div className="form-row"><div className="form-label"><h2>🔢 Nombre de régions :</h2></div><div className="form-input">
            <input type="number" onChange={(e) => handleMediaNombreRegionsChange(e.target.value)} className="input-style" min="1" placeholder="Nombre" />
          </div></div>
          {regionsInputs.map((region, i) => (
            <div key={i} className="region-card" style={{ border: '1px solid #ddd', padding: '15px', margin: '10px 0', borderRadius: '8px' }}>
              <h4>Région {i+1}</h4>
              <div className="form-row"><div className="form-label"><h2>📌 Nom :</h2></div><div className="form-input">
                <input type="text" placeholder="Nom" value={region.nom} onChange={(e) => handleMediaRegionChange(i, 'nom', e.target.value)} className="input-style" />
              </div></div>
              <div className="form-row"><div className="form-label"><h2>📻 Fréquence :</h2></div><div className="form-input">
                <input type="text" placeholder="Fréquence" value={region.frequence} onChange={(e) => handleMediaRegionChange(i, 'frequence', e.target.value)} className="input-style" />
              </div></div>
              <div className="form-row"><div className="form-label"><h2>👥 Audience :</h2></div><div className="form-input">
                <input type="text" placeholder="Audience" value={region.audience} onChange={(e) => handleMediaRegionChange(i, 'audience', e.target.value)} className="input-style" />
              </div></div>
            </div>
          ))}
        </>
      )}

      <div className="form-row"><div className="form-label"><h2>💰 Taux :</h2></div><div className="form-input">
        <input type="text" value={getDisplayValue(mediaData.taux)} onChange={(e) => {
          const rawValue = e.target.value.replace(/\s/g, '');
          if (rawValue === '' || /^\d+$/.test(rawValue)) {
            setMediaData(prev => ({ ...prev, taux: rawValue }));
            e.target.value = formatNumber(rawValue);
          }
        }} className="input-style" required placeholder="Montant en Ar" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>💰 Frais de dossier :</h2></div><div className="form-input">
        <input type="text" value={getDisplayValue(fraisDossier)} onChange={handleFraisDossierChange} className="input-style" placeholder="Frais de dossier en Ar" />
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

      <div className="form-section-subtitle">✍️ Signature :</div>
      <div className="form-row"><div className="form-label"><h2>Je soussigné(e) Mr/Mme :</h2></div><div className="form-input">
        <input type="text" name="confirmationNom" value={mediaData.confirmationNom} onChange={handleMediaChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📆 Le :</h2></div><div className="form-input">
        <input type="date" name="dateSignature" value={mediaData.dateSignature} onChange={handleMediaChange} className="input-style" />
      </div></div>

      <div className="form-row"><div className="form-label"><h2>📍 A :</h2></div><div className="form-input">
        <input type="text" name="lieuSignature" value={mediaData.lieuSignature} onChange={handleMediaChange} className="input-style" />
      </div></div>
    </>
  );

  const renderStep4 = () => {
    const nextCompteur = (userInfo.compteurs?.['Télé/Radio'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${userInfo.prefix || ''} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    return (
      <div className="recap-container">
        <h3>📋 RÉCAPITULATIF - RADIO / TÉLÉVISION</h3>
        <div className="user-info-recap" style={{ background: '#e8f4f8', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
          <p><strong>👤 Utilisateur:</strong> {userInfo.nom} ({userInfo.prefix})</p>
          <p><strong>📄 Prochain numéro de dossier:</strong> {userDossierDisplay}</p>
        </div>
        <div className="recap-section"><h4>1) PROPRIÉTAIRE</h4><table className="recap-table"><tbody>
          <tr><td style={{ fontWeight: 'bold' }}>👤 Nom</td><td>{mediaData.proprietaireNom || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>🆔 CIN</td><td>{mediaData.proprietaireCin || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>📍 Région</td><td>{mediaData.region || '-'}</td></tr>
        </tbody></table></div>
        <div className="recap-section"><h4>2) REPRÉSENTANT LÉGAL</h4><table className="recap-table"><tbody>
          <tr><td style={{ fontWeight: 'bold' }}>👤 Nom</td><td>{mediaData.representantNom || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>🆔 CIN</td><td>{mediaData.representantCin || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>💼 Fonction</td><td>{mediaData.representantFonction || '-'}</td></tr>
        </tbody></table></div>
        <div className="recap-section"><h4>3) STATION</h4><table className="recap-table"><tbody>
          <tr><td style={{ fontWeight: 'bold' }}>🏢 Dénomination</td><td>{mediaData.denomination || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>📻 Fréquence</td><td>{mediaData.frequence || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>📍 Siège</td><td>{mediaData.siege || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>📍 Région</td><td>{mediaData.region || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>💰 Taux</td><td>{formatNumber(mediaData.taux || 0)} Ar</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>💰 Frais de dossier</td><td>{formatNumber(fraisDossier || 0)} Ar</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>🔢 Uniter</td><td>{uniter}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>💰 Soit Total</td><td><strong style={{ color: '#28a745' }}>{getSoitTotalDisplay()}</strong></td></tr>
        </tbody></table></div>
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
    const titles = { 1: '📝 Étape 1 - Propriétaire', 2: '📝 Étape 2 - Représentant légal', 3: '📝 Étape 3 - Station et calcul', 4: '📋 Récapitulatif' };
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

export default MediaAjout;