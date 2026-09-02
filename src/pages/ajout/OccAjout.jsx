// src/pages/ajout/OccAjout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, User, Calendar, MapPin, CreditCard, DollarSign,
  Clock, FileText, CheckCircle, AlertCircle, PlusCircle,
  UserPlus, Music, Film, Star, Heart, Camera, BookOpen,
  ArrowLeft, ArrowRight, Save, X, Eye, Edit, Trash2,
  Hash, Home, Phone, BarChart, Info
} from 'lucide-react';
import { useToast } from '../../components/Toast';

const OccAjout = ({ onCancel }) => {
  const navigate = useNavigate();
  const showToast = useToast();
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
  const [globalTotalCount, setGlobalTotalCount] = useState(0);

  const [regionsList, setRegionsList] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [newRegionPhone, setNewRegionPhone] = useState('');
  const [showAddRegion, setShowAddRegion] = useState(false);

  const [hasOtherArtists, setHasOtherArtists] = useState(false);
  const [otherArtistsInputs, setOtherArtistsInputs] = useState([]);

  const [isRetard, setIsRetard] = useState(false);
  const [montantRetard, setMontantRetard] = useState('');

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
  
  const calculateSoitTotal = () => {
    const fraisVal = parseFloat(fraisDossier) || 0;
    const montantVal = parseFloat(montant) || 0;
    const retardVal = parseFloat(montantRetard) || 0;
    const uniterVal = parseInt(uniter) || 1;
    
    let total = (montantVal * uniterVal) + fraisVal;
    if (isRetard) {
      total += retardVal;
    }
    return total;
  };

  useEffect(() => {
    setSoitTotal(calculateSoitTotal());
  }, [fraisDossier, montant, uniter, isRetard, montantRetard]);

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

  const handleMontantRetardChange = (e) => {
    const rawValue = e.target.value.replace(/\s/g, '');
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      setMontantRetard(rawValue);
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

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        try {
          const response = await fetch('http://localhost:3001/api/auth/current-user', {
            headers: { 'Authorization': `Bearer ${currentUser.id}` }
          });
          const data = await response.json();
          if (data.success && data.user) {
            const countersResponse = await fetch(`http://localhost:3001/api/users/counters/${data.user.id}?year=${new Date().getFullYear()}`);
            let compteurs = { 'OCC': 0 };
            if (countersResponse.ok) {
              const countersData = await countersResponse.json();
              if (countersData.success) compteurs = countersData.compteurs || { 'OCC': 0 };
            }
            setUserInfo({
              id: data.user.id,
              nom: data.user.nom,
              prefix: data.user.prefix || '',
              compteurs: compteurs,
              anneeEnCours: new Date().getFullYear()
            });
          } else {
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
        if (data.success) {
          setGlobalDossierNumber(data.dossierNumber);
          setGlobalTotalCount(data.totalCount || 0);
        }
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
        showToast('Veuillez remplir les champs obligatoires: Organisateurs, Genre, Date et Lieu', 'error');
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!occData.representantCin) {
        showToast('Veuillez remplir les infos CIN du représentant', 'error');
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
        showToast('Veuillez remplir tous les artistes supplémentaires', 'error');
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

  // ✅ HANDLE FINAL SUBMIT - OCC sans montant_mensuel
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      showToast('Erreur: Utilisateur non identifié', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const totalResponse = await fetch('http://localhost:3001/api/occ/total-count');
      let totalGlobal = 0;
      if (totalResponse.ok) {
        const totalData = await totalResponse.json();
        if (totalData.success) totalGlobal = totalData.total;
      }
      
      const globalDay = String(new Date().getDate()).padStart(2, '0');
      const globalMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const globalYear = new Date().getFullYear();
      const nouveauTotalGlobal = totalGlobal + 1;
      const numeroDossierGlobal = `${nouveauTotalGlobal}/${globalMonth}/${globalYear}`;
      
      const prefix = userInfo.prefix || currentUser.nom?.substring(0, 3).toUpperCase() || '';
      const compteurActuel = userInfo.compteurs?.['OCC'] || 0;
      const nouveauCompteur = compteurActuel + 1;
      const currentMonth = new Date().getMonth() + 1;
      const currentTrimestre = getTrimestreFromMonth(currentMonth);
      const numeroDossierUtilisateur = `${prefix} ${nouveauCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

      const fraisVal = parseFloat(fraisDossier) || 0;
      const montantVal = parseFloat(montant) || 0;
      const retardVal = parseFloat(montantRetard) || 0;
      const uniterVal = parseInt(uniter) || 1;
      
      let total = (montantVal * uniterVal) + fraisVal;
      if (isRetard) {
        total += retardVal;
      }

      // ✅ OCC : NE PAS envoyer montant_mensuel (la colonne n'existe pas)
// ✅ OCC utilise montant (pas montant_total)
// ✅ OCC utilise montant (pas montant_total, pas montant_mensuel)
const finalData = {
  type: 'OCC',
  userId: currentUser.id,
  prefix: prefix,
  organisateurs: occData.organisateurs || '',
  representant_par: occData.representantPar || '',
  genre_manifestation: occData.genreManifestation || '',
  artistes: occData.artistes || '',
  date_evenement: occData.dateEvenement || '',
  lieu_evenement: occData.lieuEvenement || '',
  representant_cin: occData.representantCin || '',
  representant_cin_delivree: occData.representantCinDelivree || '',
  representant_cin_lieu: occData.representantCinLieu || '',
  adresse: occData.adresse || '',
  telephone: occData.telephone || '',
  domicile: occData.domicile || '',
  confirmation_nom: occData.confirmationNom || '',
  date_signature: occData.dateSignature || '',
  lieu_ajout: occData.lieuAjout || '',
  region: occData.region || '',
  otherArtistsDetail: otherArtistsInputs,
  hasOtherArtists,
  dateAjout: new Date().toISOString().split('T')[0],
  demandeur: occData.organisateurs || '',
  representantNom: occData.organisateurs || '',
  numeroDossierGlobal: numeroDossierGlobal,
  numeroDossierUtilisateur: numeroDossierUtilisateur,
  uniter: uniterVal,
  typeKey: 'OCC',
  // ✅ OCC utilise montant (pas montant_total)
  montant: montantVal,
  frais_dossier: fraisVal,
  montant_retard: isRetard ? retardVal : 0,
  is_retard: isRetard,
  soit_total: total
};

      console.log('📤 Données envoyées au backend (OCC):', finalData);

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
          updatedUser.compteurs['OCC'] = nouveauCompteur;
          localStorage.setItem('user', JSON.stringify(updatedUser));

          setUserInfo(prev => ({
            ...prev,
            compteurs: {
              ...prev.compteurs,
              'OCC': nouveauCompteur
            }
          }));

          console.log(`✅ Compteur OCC incrémenté à ${nouveauCompteur}`);
        }
        
        showToast('✅ Occasionnelle ajoutée avec succès !', 'success');
        
        navigate('/confirme-paiement', {
          state: {
            usager: {
              id: result.id,
              denomination: occData.genreManifestation || occData.nom_evenement || 'OCC',
              demandeur: occData.organisateurs,
              telephone: occData.telephone,
              region: occData.region,
              adresse: occData.adresse,
              genre_manifestation: occData.genreManifestation,
              date_evenement: occData.dateEvenement,
              lieu_evenement: occData.lieuEvenement,
              organisateurs: occData.organisateurs,
              artistes: occData.artistes,
              representant_par: occData.representantPar,
              representant_cin: occData.representantCin,
              representant_cin_delivree: occData.representantCinDelivree,
              representant_cin_lieu: occData.representantCinLieu,
              numero_dossier_utilisateur: numeroDossierUtilisateur,
              numero_dossier_global: numeroDossierGlobal,
              frais_dossier: fraisVal,
              montant_total: montantVal,
              montant_retard: isRetard ? retardVal : 0,
              is_retard: isRetard,
              soit_total: total,
              uniter: uniterVal,
              confirmation_nom: occData.confirmationNom,
              lieu_ajout: occData.lieuAjout,
              date_signature: occData.dateSignature,
              adresse: occData.adresse,
              domicile: occData.domicile
            },
            type: 'occ'
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
    const globalParts = globalDossierNumber.split('/');
    const globalCount = globalParts[0] || '0';
    const globalDay = String(new Date().getDate()).padStart(2, '0');
    const globalMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const globalYear = new Date().getFullYear();
    const globalDisplay = `${globalCount}/${globalMonth}/${globalYear}`;

    const prefix = userInfo.prefix || '';
    const nextCompteur = (userInfo.compteurs?.['OCC'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${prefix} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    return (
      <>
        <div className="user-info-header">
          <div className="user-info-row">
            <Users size={18} strokeWidth={2} />
            <span>Utilisateur: <strong>{userInfo.nom}</strong> ({prefix})</span>
          </div>
          <div className="user-info-row">
            <FileText size={18} strokeWidth={2} />
            <span>Dossier Global: <strong>{globalCount}/{globalDay}/{globalMonth}/{globalYear}</strong></span>
            <span style={{ marginLeft: '20px', color: '#007bff' }}>{userDossierDisplay}</span>
          </div>
          <div className="user-info-row" style={{ fontSize: '12px', color: '#6c757d' }}>
            <span><BarChart size={14} strokeWidth={2} /> Total dossiers OCC: <strong>{globalTotalCount || globalCount}</strong></span>
            <span style={{ marginLeft: '15px' }}><BarChart size={14} strokeWidth={2} /> Vos dossiers cette année: <strong>{userInfo.compteurs?.['OCC'] || 0}</strong></span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><Users size={18} strokeWidth={2} /> Organisateurs :</h2></div>
          <div className="form-input">
            <input type="text" name="organisateurs" value={occData.organisateurs} onChange={handleOccChange} className="input-style" placeholder="Nom des organisateurs" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><User size={18} strokeWidth={2} /> Représenter par :</h2></div>
          <div className="form-input">
            <input type="text" name="representantPar" value={occData.representantPar} onChange={handleOccChange} className="input-style" placeholder="Nom du représentant" />
          </div>
        </div>

        <hr className="step-divider" />

        <div className="form-row">
          <div className="form-label"><h2><Music size={18} strokeWidth={2} /> Genre manifestation :</h2></div>
          <div className="form-input">
            <input type="text" name="genreManifestation" value={occData.genreManifestation} onChange={handleOccChange} className="input-style" placeholder="Ex: Concert, Spectacle, Festival" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><Star size={18} strokeWidth={2} /> Artiste :</h2></div>
          <div className="form-input">
            <input type="text" name="artistes" value={occData.artistes} onChange={handleOccChange} className="input-style" placeholder="Nom de l'artiste principal" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><PlusCircle size={18} strokeWidth={2} /> Autre artiste :</h2></div>
          <div className="form-input">
            <label className="checkbox-label">
              <input type="checkbox" checked={hasOtherArtists} onChange={handleOtherArtistsChange} />
              Ajouter d'autres artistes
            </label>
          </div>
        </div>

        {hasOtherArtists && (
          <div className="form-row">
            <div className="form-label"><h2><Users size={18} strokeWidth={2} /> Nombre d'artistes :</h2></div>
            <div className="form-input">
              <input type="number" onChange={(e) => handleOtherArtistsCountChange(e.target.value)} className="input-style" placeholder="Nombre d'artistes supplémentaires" min="1" />
            </div>
          </div>
        )}

        {hasOtherArtists && otherArtistsInputs.map((artist, idx) => (
          <div key={idx} className="artist-card">
            <h4><Music size={16} strokeWidth={2} /> Artiste {idx + 1}</h4>
            <div className="form-row">
              <div className="form-label"><h2>Nom :</h2></div>
              <div className="form-input">
                <input type="text" placeholder="Nom d'artiste" value={artist.nom} onChange={(e) => handleOtherArtistChange(idx, 'nom', e.target.value)} className="input-style" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-label"><h2>Rôle :</h2></div>
              <div className="form-input">
                <input type="text" placeholder="Chanteur, Musicien, DJ" value={artist.role} onChange={(e) => handleOtherArtistChange(idx, 'role', e.target.value)} className="input-style" />
              </div>
            </div>
          </div>
        ))}

        <div className="form-row">
          <div className="form-label"><h2><Calendar size={18} strokeWidth={2} /> Date :</h2></div>
          <div className="form-input">
            <input type="date" name="dateEvenement" value={occData.dateEvenement} onChange={handleOccChange} className="input-style" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> Lieu :</h2></div>
          <div className="form-input">
            <input type="text" name="lieuEvenement" value={occData.lieuEvenement} onChange={handleOccChange} className="input-style" placeholder="Lieu de l'événement" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> Région :</h2></div>
          <div className="form-input" style={{ display: 'flex', gap: '10px' }}>
            <select name="region" value={occData.region || ''} onChange={handleOccChange} className="input-style" style={{ flex: 1 }}>
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
      <div className="info-banner">
        <Info size={18} strokeWidth={2} />
        <span>Organisateur : <strong>{occData.organisateurs || 'Non renseigné'}</strong></span>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><CreditCard size={18} strokeWidth={2} /> CIN du représentant :</h2></div>
        <div className="form-input">
          <input type="text" name="representantCin" value={occData.representantCin} onChange={handleOccChange} className="input-style" placeholder="Numéro de la carte CIN" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Calendar size={18} strokeWidth={2} /> Délivré le :</h2></div>
        <div className="form-input">
          <input type="date" name="representantCinDelivree" value={occData.representantCinDelivree} onChange={handleOccChange} className="input-style" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> à :</h2></div>
        <div className="form-input">
          <input type="text" name="representantCinLieu" value={occData.representantCinLieu} onChange={handleOccChange} className="input-style" placeholder="Lieu de délivrance" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Home size={18} strokeWidth={2} /> Adresse :</h2></div>
        <div className="form-input">
          <input type="text" name="adresse" value={occData.adresse} onChange={handleOccChange} className="input-style" placeholder="Adresse complète" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Phone size={18} strokeWidth={2} /> Contact :</h2></div>
        <div className="form-input">
          <input type="tel" name="telephone" value={occData.telephone} onChange={handleOccChange} className="input-style" placeholder="Numéro de téléphone" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Home size={18} strokeWidth={2} /> Domicile :</h2></div>
        <div className="form-input">
          <input type="text" name="domicile" value={occData.domicile} onChange={handleOccChange} className="input-style" placeholder="Domicile (quartier, ville)" />
        </div>
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="form-row">
        <div className="form-label"><h2><FileText size={18} strokeWidth={2} /> Frais de dossier :</h2></div>
        <div className="form-input">
          <input type="text" value={getDisplayValue(fraisDossier)} onChange={handleFraisDossierChange} className="input-style" placeholder="Frais de dossier en Ar" />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6c757d' }}>(fixe, non multiplié par Uniter)</span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><DollarSign size={18} strokeWidth={2} /> Montant à payer :</h2></div>
        <div className="form-input">
          <input type="text" value={getDisplayValue(montant)} onChange={handleMontantChange} className="input-style" placeholder="Montant total en Ar" />
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
        <div className="form-label"><h2><Clock size={18} strokeWidth={2} /> Cas de retard :</h2></div>
        <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <label className="checkbox-label">
            <input type="checkbox" checked={isRetard} onChange={(e) => setIsRetard(e.target.checked)} />
            Appliquer une pénalité de retard
          </label>
          {isRetard && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Pénalité :</span>
              <input
                type="text"
                value={getDisplayValue(montantRetard)}
                onChange={handleMontantRetardChange}
                className="input-style"
                placeholder="Montant de la pénalité (Ar)"
                style={{ width: '180px' }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><DollarSign size={18} strokeWidth={2} /> Soit Total :</h2></div>
        <div className="form-input">
          <input type="text" value={getSoitTotalDisplay()} readOnly className="input-style total-field" />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6c757d' }}>
            (Montant × Uniter + Frais + Retard)
          </span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Edit size={18} strokeWidth={2} /> Je soussigné(e) Mr/Mme :</h2></div>
        <div className="form-input">
          <input type="text" name="confirmationNom" value={occData.confirmationNom} onChange={handleOccChange} className="input-style" placeholder="Nom du signataire" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><Calendar size={18} strokeWidth={2} /> Date :</h2></div>
        <div className="form-input">
          <input type="date" name="dateSignature" value={occData.dateSignature} onChange={handleOccChange} className="input-style" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-label"><h2><MapPin size={18} strokeWidth={2} /> Lieu et date :</h2></div>
        <div className="form-input">
          <input type="text" name="lieuAjout" value={occData.lieuAjout} onChange={handleOccChange} className="input-style" placeholder="Lieu et date de signature" />
        </div>
      </div>
    </>
  );

  const renderStep4 = () => {
    const globalParts = globalDossierNumber.split('/');
    const globalCount = globalParts[0] || '0';
    const globalDay = String(new Date().getDate()).padStart(2, '0');
    const globalMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const globalYear = new Date().getFullYear();
    const prefix = userInfo.prefix || '';
    const nextCompteur = (userInfo.compteurs?.['OCC'] || 0) + 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentTrimestre = getTrimestreFromMonth(currentMonth);
    const userDossierDisplay = `${prefix} ${nextCompteur}/${currentTrimestre}/${userInfo.anneeEnCours || new Date().getFullYear()}`;

    const fraisVal = parseFloat(fraisDossier) || 0;
    const montantVal = parseFloat(montant) || 0;
    const retardVal = parseFloat(montantRetard) || 0;
    const uniterVal = parseInt(uniter) || 1;
    
    let total = (montantVal * uniterVal) + fraisVal;
    if (isRetard) {
      total += retardVal;
    }

    return (
      <div className="recap-container">
        <h3><CheckCircle size={20} strokeWidth={2} /> RÉCAPITULATIF - OCCASIONNELLE</h3>
        <div className="user-info-recap">
          <p><Users size={16} strokeWidth={2} /> Utilisateur: <strong>{userInfo.nom}</strong> ({prefix})</p>
          <p><FileText size={16} strokeWidth={2} /> Dossiers déjà créés cette année: <strong>{userInfo.compteurs?.['OCC'] || 0}</strong></p>
          <p><BarChart size={16} strokeWidth={2} /> Total Global OCC: <strong>{globalTotalCount || globalCount}</strong></p>
          <p><Clock size={16} strokeWidth={2} /> Cas de retard: <strong>{isRetard ? 'Oui' : 'Non'}</strong> {isRetard && `(Pénalité: ${formatNumber(montantRetard)} Ar)`}</p>
        </div>
        <table className="recap-table"><tbody>
          <tr><td><FileText size={16} strokeWidth={2} /> Dossier Global N° {globalCount}/{globalDay}/{globalMonth}/{globalYear}</td><td><strong>{userDossierDisplay}</strong></td></tr>
          <tr><td><Users size={16} strokeWidth={2} /> Organisateurs</td><td>{occData.organisateurs || '-'}</td></tr>
          <tr><td><User size={16} strokeWidth={2} /> Representé par</td><td>{occData.representantPar || '-'}</td></tr>
          <tr><td><Music size={16} strokeWidth={2} /> Genre manifestation</td><td>{occData.genreManifestation || '-'}</td></tr>
          <tr><td><Star size={16} strokeWidth={2} /> Artiste principal</td><td>{occData.artistes || '-'}</td></tr>
          <tr><td><Calendar size={16} strokeWidth={2} /> Date</td><td>{occData.dateEvenement || '-'}</td></tr>
          <tr><td><MapPin size={16} strokeWidth={2} /> Lieu</td><td>{occData.lieuEvenement || '-'}</td></tr>
          <tr><td><CreditCard size={16} strokeWidth={2} /> CIN</td><td>{occData.representantCin || '-'}</td></tr>
          <tr><td><MapPin size={16} strokeWidth={2} /> Région</td><td>{occData.region || '-'}</td></tr>
          <tr><td><FileText size={16} strokeWidth={2} /> Frais de dossier</td><td>{formatNumber(fraisVal)} Ar</td></tr>
          <tr><td><DollarSign size={16} strokeWidth={2} /> Montant à payer</td><td>{formatNumber(montantVal)} Ar</td></tr>
          <tr><td><Hash size={16} strokeWidth={2} /> Uniter</td><td>{uniterVal}</td></tr>
          <tr><td><Clock size={16} strokeWidth={2} /> Pénalité retard</td><td>{isRetard ? formatNumber(retardVal) + ' Ar' : '-'}</td></tr>
          <tr><td><DollarSign size={16} strokeWidth={2} /> Soit Total</td><td><strong style={{ color: '#28a745' }}>{formatNumber(total)} Ar</strong></td></tr>
          <tr><td><Edit size={16} strokeWidth={2} /> Signataire</td><td>{occData.confirmationNom || '-'}</td></tr>
        </tbody></table>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="recap-container">
      <h3><Music size={20} strokeWidth={2} /> ARTISTES SUPPLÉMENTAIRES</h3>
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
    const titles = {
      1: 'Étape 1 - Informations générales',
      2: 'Étape 2 - Représentant',
      3: 'Étape 3 - Calcul',
      4: 'Récapitulatif',
      5: 'Artistes supplémentaires'
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

export default OccAjout;