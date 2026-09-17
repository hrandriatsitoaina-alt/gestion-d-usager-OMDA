// src/pages/OtherAjout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Save, X, Users, User, Phone, Mail,
  MapPin, Calendar, CreditCard, DollarSign, Clock, FileText,
  CheckCircle, Info, Hash, Disc, Music, Globe, Sparkles, Video,
  Package, Repeat, CalendarCheck, Building2, Plus, Trash2,
  PlusCircle, ListOrdered, FileCheck, UserPlus
} from 'lucide-react';
import '../styles/other-ajout.css';

// ✅ 6 types d'usagers événementiels
const TYPES_USAGERS = [
  { id: 'cd', label: 'CD', icon: Disc, color: '#3498db' },
  { id: 'mp3', label: 'MP3', icon: Music, color: '#9b59b6' },
  { id: 'oeuvre-web', label: 'Œuvre Web', icon: Globe, color: '#2ecc71' },
  { id: 'hologramme', label: 'Hologramme', icon: Sparkles, color: '#e67e22' },
  { id: 'video', label: 'Vidéo', icon: Video, color: '#e74c3c' },
  { id: 'autre', label: 'Autre', icon: Package, color: '#7f8c8d' }
];

// ✅ 2 modes de paiement
const MODES_PAIEMENT = [
  { id: 'mensuel', label: 'Paiement mensuel', icon: Repeat },
  { id: 'unique', label: 'Paiement unique', icon: CalendarCheck }
];

const emptyLigne = () => ({
  description: '',
  uniter: 1,
  pu: ''
});

const OtherAjout = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Régions
  const [regionsList, setRegionsList] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [newRegionPhone, setNewRegionPhone] = useState('');
  const [showAddRegion, setShowAddRegion] = useState(false);

  // ✅ ÉTAPE 1 : Identification
  const [typeUsager, setTypeUsager] = useState('');
  const [identification, setIdentification] = useState({
    denomination: '',
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    region: ''
  });

  // ✅ ÉTAPE 2 : Représentant
  const [representant, setRepresentant] = useState({
    representantPar: '',
    cin: '',
    cinDelivree: '',
    cinLieu: '',
    contact: ''
  });

  // ✅ ÉTAPE 3 : Paiement
  const [modePaiement, setModePaiement] = useState('');
  const [fraisDossierActif, setFraisDossierActif] = useState(false);
  const [fraisDossierMontant, setFraisDossierMontant] = useState('');
  const [isRetard, setIsRetard] = useState(false);
  const [montantRetard, setMontantRetard] = useState('');

  // ✅ Tableau de lignes personnalisables
  const [lignes, setLignes] = useState([
    { description: 'Hologramme', uniter: 3, pu: '5000' },
    { description: 'WEB', uniter: 2, pu: '5000' },
    { description: 'CD', uniter: 1, pu: '5000' }
  ]);

  // ✅ Quittance + Personne qui reçoit
  const [quittanceInfo, setQuittanceInfo] = useState({ last: 0, next: '0000001' });
  const [personneRecu, setPersonneRecu] = useState('');

  // ✅ Modal de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingResult, setSavingResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================================
  // HELPERS
  // ============================================================
  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    const num = value.toString().replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (!num) return '';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/\s/g, '')) || 0;
  };

  const getMontantLigne = (ligne) => {
    return parseNumber(ligne.pu) * (parseInt(ligne.uniter) || 1);
  };

  const getTotalLignes = () => {
    return lignes.reduce((acc, l) => acc + getMontantLigne(l), 0);
  };

  const getTotalGeneral = () => {
    const totalLignes = getTotalLignes();
    const frais = fraisDossierActif ? parseNumber(fraisDossierMontant) : 0;
    const retard = isRetard ? parseNumber(montantRetard) : 0;
    return totalLignes + frais + retard;
  };

  const getOnlyNumbers = (value) => {
    if (!value) return '';
    return value.toString().replace(/\D/g, '');
  };

  // ============================================================
  // GESTION DES LIGNES
  // ============================================================
  const handleLigneChange = (index, field, value) => {
    setLignes(prev => {
      const copy = [...prev];
      if (field === 'pu') {
        const raw = value.replace(/\s/g, '');
        if (raw !== '' && !/^\d+$/.test(raw)) return prev;
        copy[index] = { ...copy[index], pu: raw };
      } else if (field === 'uniter') {
        const n = parseInt(value) || 1;
        copy[index] = { ...copy[index], uniter: Math.max(1, n) };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const addLigne = () => setLignes(prev => [...prev, emptyLigne()]);

  const removeLigne = (index) => {
    if (lignes.length <= 1) return;
    setLignes(prev => prev.filter((_, i) => i !== index));
  };

  const setNombreLignes = (n) => {
    const count = Math.max(1, Math.min(20, parseInt(n) || 1));
    setLignes(prev => {
      if (count > prev.length) {
        const added = Array.from({ length: count - prev.length }, () => emptyLigne());
        return [...prev, ...added];
      }
      return prev.slice(0, count);
    });
  };

  // ============================================================
  // RÉGIONS
  // ============================================================
  const loadRegions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/regions');
      const result = await response.json();
      if (result.success) setRegionsList(result.regions);
    } catch (error) {
      console.error('Erreur chargement régions:', error);
    }
  };

  // ✅ Charger la prochaine quittance
  const loadQuittance = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/other-usagers/quittance/last');
      const data = await res.json();
      if (data.success) {
        setQuittanceInfo({
          last: data.lastQuittance || 0,
          next: data.nextQuittance || '0000001',
          nextNumber: data.nextQuittanceNumber || 1
        });
      }
    } catch (err) {
      console.error('Erreur quittance:', err);
    }
  };

  useEffect(() => {
    loadRegions();
    loadQuittance();
  }, []);

  const handleAddRegion = async () => {
    const trimmed = newRegion.trim();
    if (!trimmed) { alert('Veuillez saisir un nom de région'); return; }
    if (regionsList.some(r => r.nom === trimmed)) { alert('Cette région existe déjà'); return; }

    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) { alert('Token administrateur manquant'); return; }

    try {
      const response = await fetch('http://localhost:3001/api/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'adminToken': adminToken },
        body: JSON.stringify({ nom: trimmed, telephone: newRegionPhone.trim() || null })
      });
      const result = await response.json();
      if (result.success) {
        setRegionsList([...regionsList, result.region]);
        setNewRegion('');
        setNewRegionPhone('');
        setShowAddRegion(false);
        alert(`✅ Région "${trimmed}" ajoutée !`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      alert('❌ Erreur de connexion');
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)}`;
  };

  // ============================================================
  // CHANGEMENTS FORMULAIRES
  // ============================================================
  const handleIdentificationChange = (field, value) => {
    setIdentification(prev => ({ ...prev, [field]: value }));
  };
  const handleRepresentantChange = (field, value) => {
    setRepresentant(prev => ({ ...prev, [field]: value }));
  };

  // ============================================================
  // NAVIGATION
  // ============================================================
  const handleNext = () => {
    if (currentStep === 1) {
      if (!typeUsager) { alert("Veuillez sélectionner un type d'usager"); return; }
      if (!identification.denomination) { alert('Veuillez saisir la dénomination'); return; }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!representant.representantPar) { alert('Veuillez saisir le nom du représentant'); return; }
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      if (!modePaiement) { alert('Veuillez choisir un mode de paiement'); return; }
      if (lignes.length === 0) { alert('Ajoutez au moins une ligne'); return; }
      const allFilled = lignes.every(l => l.description.trim() !== '' && l.pu !== '');
      if (!allFilled) { alert('Veuillez remplir toutes les lignes (description et P.U.)'); return; }
      if (!personneRecu || personneRecu.trim() === '') {
        alert('⚠️ OBLIGATOIRE : Saisissez le nom de la personne qui reçoit');
        return;
      }
      // ✅ Ouvrir la modal de confirmation
      setSavingResult(null);
      setShowConfirmModal(true);
      return;
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ============================================================
  // ✅ CONFIRMATION + ENREGISTREMENT COMPLET (usager + paiement + facture + PDF)
  // ============================================================
  const handleConfirmSave = async () => {
    setIsSaving(true);
    const currentUser = (() => {
      try { return JSON.parse(localStorage.getItem('user') || '{}'); }
      catch { return {}; }
    })();

    try {
      const payload = {
        type: typeUsager,
        identification,
        representant,
        paiement: {
          mode: modePaiement,
          frais_dossier_actif: fraisDossierActif,
          frais_dossier: fraisDossierActif ? parseNumber(fraisDossierMontant) : 0,
          is_retard: isRetard,
          montant_retard: isRetard ? parseNumber(montantRetard) : 0,
          lignes: lignes.map(l => ({
            description: l.description,
            uniter: parseInt(l.uniter) || 1,
            pu: parseNumber(l.pu)
          }))
        },
        userId: currentUser.id || null,
        quittance: quittanceInfo.next,
        personneRecu
      };

      const response = await fetch('http://localhost:3001/api/other-usagers/creer-complet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setSavingResult(data);

      if (data.success) {
        // ✅ Recharger la quittance pour la prochaine fois
        await loadQuittance();

        // ✅ Générer le PDF automatiquement
        try {
          const { generateFactureOtherPDF } = await import('./pdf/facture_other');
          await generateFactureOtherPDF({
            ref_omda: data.refOmda,
            num_facture: data.numFacture,
            ref_client_type: 'OTH',
            ref_usager: data.usagerOtherId,
            type_facture: 'DAFC',
            denomination: identification.denomination,
            representant_nom: representant.representantPar,
            adresse: identification.adresse,
            telephone: identification.telephone,
            lignes: lignes.map(l => ({
              description: l.description,
              uniter: parseInt(l.uniter) || 1,
              pu: parseNumber(l.pu)
            })),
            frais_dossier: fraisDossierActif ? parseNumber(fraisDossierMontant) : 0,
            montant_retard: isRetard ? parseNumber(montantRetard) : 0,
            is_retard: isRetard,
            soit_total: data.soitTotal,
            personne_recu: personneRecu,
            quittance: data.quittanceNumber
          });
        } catch (pdfErr) {
          console.warn('⚠️ PDF non généré:', pdfErr);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      setSavingResult({ success: false, message: 'Erreur de connexion au serveur' });
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // RENDU ÉTAPE 1
  // ============================================================
  const renderStep1 = () => (
    <div className="oa-step-content">
      <div className="oa-section">
        <h3 className="oa-section-title"><Package size={18} /> Type d'usager événementiel</h3>
        <div className="oa-types-grid">
          {TYPES_USAGERS.map(type => {
            const Icon = type.icon;
            const isActive = typeUsager === type.id;
            return (
              <button
                key={type.id}
                type="button"
                className={`oa-type-card ${isActive ? 'active' : ''}`}
                onClick={() => setTypeUsager(type.id)}
                style={isActive ? { borderColor: type.color, background: `${type.color}10` } : {}}
              >
                <div className="oa-type-icon" style={{ background: `${type.color}20`, color: type.color }}>
                  <Icon size={22} />
                </div>
                <strong>{type.label}</strong>
                {isActive && <CheckCircle size={16} className="oa-type-check" style={{ color: type.color }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="oa-section">
        <h3 className="oa-section-title"><Building2 size={18} /> Identification</h3>
        <div className="oa-form-grid">
          <div className="oa-form-group oa-full">
            <label><FileText size={14} /> Dénomination *</label>
            <input
              type="text"
              value={identification.denomination}
              onChange={(e) => handleIdentificationChange('denomination', e.target.value)}
              placeholder="Nom de l'entreprise / structure"
            />
          </div>
          <div className="oa-form-group">
            <label><User size={14} /> Nom</label>
            <input
              type="text"
              value={identification.nom}
              onChange={(e) => handleIdentificationChange('nom', e.target.value)}
              placeholder="Nom"
            />
          </div>
          <div className="oa-form-group">
            <label><User size={14} /> Prénom</label>
            <input
              type="text"
              value={identification.prenom}
              onChange={(e) => handleIdentificationChange('prenom', e.target.value)}
              placeholder="Prénom"
            />
          </div>
          <div className="oa-form-group">
            <label><Phone size={14} /> Téléphone</label>
            <input
              type="tel"
              value={identification.telephone}
              onChange={(e) => handleIdentificationChange('telephone', e.target.value)}
              placeholder="034 00 000 00"
            />
          </div>
          <div className="oa-form-group">
            <label><Mail size={14} /> Email</label>
            <input
              type="email"
              value={identification.email}
              onChange={(e) => handleIdentificationChange('email', e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>
          <div className="oa-form-group oa-full">
            <label><MapPin size={14} /> Adresse</label>
            <input
              type="text"
              value={identification.adresse}
              onChange={(e) => handleIdentificationChange('adresse', e.target.value)}
              placeholder="Adresse complète"
            />
          </div>

          <div className="oa-form-group oa-full">
            <label><MapPin size={14} /> Région</label>
            <div className="oa-region-row">
              <select
                value={identification.region}
                onChange={(e) => handleIdentificationChange('region', e.target.value)}
                className="oa-region-select"
              >
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
              <button
                type="button"
                onClick={() => setShowAddRegion(!showAddRegion)}
                className="oa-btn-add-region"
                title="Ajouter une région"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {showAddRegion && (
            <div className="oa-form-group oa-full">
              <div className="oa-add-region-box">
                <input
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="Nom de la région"
                />
                <input
                  type="text"
                  value={newRegionPhone}
                  onChange={(e) => setNewRegionPhone(e.target.value)}
                  placeholder="Téléphone (optionnel)"
                />
                <button type="button" onClick={handleAddRegion} className="oa-btn-confirm-region">
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDU ÉTAPE 2
  // ============================================================
  const renderStep2 = () => (
    <div className="oa-step-content">
      <div className="oa-info-banner">
        <Info size={16} />
        <span>Usager : <strong>{identification.denomination || 'Non renseigné'}</strong></span>
      </div>

      <div className="oa-section">
        <h3 className="oa-section-title"><User size={18} /> Représentant légal</h3>
        <div className="oa-form-grid">
          <div className="oa-form-group oa-full">
            <label><User size={14} /> Représenté par *</label>
            <input
              type="text"
              value={representant.representantPar}
              onChange={(e) => handleRepresentantChange('representantPar', e.target.value)}
              placeholder="Nom complet du représentant"
            />
          </div>
          <div className="oa-form-group">
            <label><CreditCard size={14} /> Numéro CIN</label>
            <input
              type="text"
              value={representant.cin}
              onChange={(e) => handleRepresentantChange('cin', e.target.value)}
              placeholder="Numéro de CIN"
            />
          </div>
          <div className="oa-form-group">
            <label><Calendar size={14} /> Délivrée le</label>
            <input
              type="date"
              value={representant.cinDelivree}
              onChange={(e) => handleRepresentantChange('cinDelivree', e.target.value)}
            />
          </div>
          <div className="oa-form-group">
            <label><MapPin size={14} /> Lieu de délivrance</label>
            <input
              type="text"
              value={representant.cinLieu}
              onChange={(e) => handleRepresentantChange('cinLieu', e.target.value)}
              placeholder="Lieu"
            />
          </div>
          <div className="oa-form-group">
            <label><Phone size={14} /> Contact</label>
            <input
              type="tel"
              value={representant.contact}
              onChange={(e) => handleRepresentantChange('contact', e.target.value)}
              placeholder="034 00 000 00"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDU ÉTAPE 3
  // ============================================================
  const renderStep3 = () => {
    const total = getTotalGeneral();

    return (
      <div className="oa-step-content">
        {/* Mode de paiement */}
        <div className="oa-section">
          <h3 className="oa-section-title"><DollarSign size={18} /> Mode de paiement</h3>
          <div className="oa-modes-grid">
            {MODES_PAIEMENT.map(mode => {
              const Icon = mode.icon;
              const isActive = modePaiement === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  className={`oa-mode-card ${isActive ? 'active' : ''}`}
                  onClick={() => setModePaiement(mode.id)}
                >
                  <Icon size={24} />
                  <strong>{mode.label}</strong>
                  {isActive && <CheckCircle size={16} className="oa-mode-check" />}
                </button>
              );
            })}
          </div>
        </div>

        {modePaiement && (
          <>
            {/* Contrôle du nombre de lignes */}
            <div className="oa-section">
              <h3 className="oa-section-title">
                <ListOrdered size={18} /> Nombre de lignes de facture
              </h3>
              <div className="oa-lines-control">
                <label>Nombre de lignes :</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={lignes.length}
                  onChange={(e) => setNombreLignes(e.target.value)}
                  className="oa-input-lines-count"
                />
                <button type="button" className="oa-btn-add-line" onClick={addLigne}>
                  <Plus size={14} /> Ajouter une ligne
                </button>
                <span className="oa-lines-hint">
                  (Ajoutez autant de descriptions que nécessaire : WEB, CD, USB, MANOVA...)
                </span>
              </div>
            </div>

            {/* TABLEAU FACTURE */}
            <div className="oa-section">
              <h3 className="oa-section-title">
                <FileText size={18} /> Détail de la facture
              </h3>

              <div className="oa-facture-table-wrapper">
                <table className="oa-facture-table">
                  <thead>
                    <tr>
                      <th>DESCRIPTIONS</th>
                      <th>U.</th>
                      <th>P.U. (Ar)</th>
                      <th>MONTANT (Ar)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((ligne, index) => {
                      const montant = getMontantLigne(ligne);
                      return (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={ligne.description}
                              onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                              placeholder="Ex: RAKOTONAIVO, WEB, CD, USB..."
                              className="oa-input-cell"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={ligne.uniter}
                              onChange={(e) => handleLigneChange(index, 'uniter', e.target.value)}
                              className="oa-input-cell oa-input-small"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={formatNumber(ligne.pu)}
                              onChange={(e) => handleLigneChange(index, 'pu', e.target.value)}
                              placeholder="0"
                              className="oa-input-cell"
                            />
                          </td>
                          <td className="oa-cell-montant">
                            {formatNumber(montant)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="oa-btn-remove-line"
                              onClick={() => removeLigne(index)}
                              disabled={lignes.length <= 1}
                              title="Supprimer cette ligne"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* FRAIS DE DOSSIER */}
                    <tr className="oa-row-frais">
                      <td>
                        <label className="oa-frais-label-inline">
                          <input
                            type="checkbox"
                            checked={fraisDossierActif}
                            onChange={(e) => {
                              setFraisDossierActif(e.target.checked);
                              if (!e.target.checked) setFraisDossierMontant('');
                            }}
                          />
                          <span>Frais de dossier</span>
                        </label>
                      </td>
                      <td>
                        <input
                          type="number"
                          value="1"
                          readOnly
                          className="oa-input-cell oa-input-small oa-input-readonly"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={formatNumber(fraisDossierMontant)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\s/g, '');
                            if (raw === '' || /^\d+$/.test(raw)) {
                              setFraisDossierMontant(raw);
                            }
                          }}
                          placeholder="0"
                          disabled={!fraisDossierActif}
                          className="oa-input-cell"
                        />
                      </td>
                      <td className="oa-cell-montant">
                        {formatNumber(fraisDossierActif ? parseNumber(fraisDossierMontant) : 0)}
                      </td>
                      <td></td>
                    </tr>

                    {/* Pénalité de retard */}
                    {isRetard && (
                      <tr className="oa-row-retard">
                        <td>
                          <input
                            type="text"
                            value="Pénalité de retard"
                            readOnly
                            className="oa-input-cell oa-input-readonly"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value="1"
                            readOnly
                            className="oa-input-cell oa-input-small oa-input-readonly"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={formatNumber(montantRetard)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\s/g, '');
                              if (raw === '' || /^\d+$/.test(raw)) setMontantRetard(raw);
                            }}
                            placeholder="0"
                            className="oa-input-cell"
                          />
                        </td>
                        <td className="oa-cell-montant">
                          {formatNumber(parseNumber(montantRetard))}
                        </td>
                        <td></td>
                      </tr>
                    )}

                    {/* TOTAL */}
                    <tr className="oa-row-total">
                      <td colSpan={3}>TOTAL</td>
                      <td className="oa-cell-montant oa-total-value">
                        {formatNumber(total)} Ar
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Case retard */}
              <div className="oa-retard-box">
                <label className="oa-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isRetard}
                    onChange={(e) => setIsRetard(e.target.checked)}
                  />
                  <Clock size={14} /> Appliquer une pénalité de retard
                </label>
              </div>
            </div>

            {/* Récap total */}
            <div className="oa-total-box">
              <div className="oa-total-row">
                <span><Hash size={14} /> Total à payer</span>
                <strong>{formatNumber(total)} Ar</strong>
              </div>
              <div className="oa-total-detail">
                {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
                {fraisDossierActif && parseNumber(fraisDossierMontant) > 0 &&
                  ` + ${formatNumber(parseNumber(fraisDossierMontant))} Ar frais`}
                {isRetard && ` + ${formatNumber(parseNumber(montantRetard))} Ar retard`}
              </div>
            </div>

            {/* ✅ QUITTANCE */}
            <div className="oa-section quittance-section">
              <h3 className="oa-section-title">
                <FileCheck size={18} /> Quittance <span style={{ color: 'red' }}>*</span>
              </h3>
              <div className="oa-quittance-box">
                <div className="oa-quittance-display">
                  <span className="oa-quittance-label">N° Quittance :</span>
                  <span className="oa-quittance-value">{quittanceInfo.next}</span>
                  <span className="oa-quittance-hint">(dernier utilisé : {quittanceInfo.last})</span>
                </div>
              </div>
            </div>

            {/* ✅ PERSONNE QUI REÇOIT */}
            <div className="oa-section personne-recu-section">
              <h3 className="oa-section-title">
                <UserPlus size={18} /> Personne qui reçoit <span style={{ color: 'red' }}>*</span>
              </h3>
              <input
                type="text"
                value={personneRecu}
                onChange={(e) => setPersonneRecu(e.target.value)}
                placeholder="Saisir le nom de la personne qui reçoit (obligatoire)"
                className="oa-personne-recu-input"
                style={{
                  borderColor: personneRecu.trim() ? '#27ae60' : '#ddd',
                  borderWidth: personneRecu.trim() ? '2px' : '1px'
                }}
              />
              {personneRecu.trim() && (
                <div className="oa-personne-recu-ok">
                  <CheckCircle size={14} /> <strong>{personneRecu}</strong> - Enregistré
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  const getStepTitle = () => ({
    1: 'Étape 1 — Identification',
    2: 'Étape 2 — Représentant',
    3: 'Étape 3 — Paiement & Facture'
  }[currentStep] || `Étape ${currentStep}`);

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="oa-container">
      <div className="oa-wrapper">
        <header className="oa-header">
          <button className="oa-btn-back" onClick={() => navigate('/gere-payer')}>
            <ArrowLeft size={18} /> Retour
          </button>
          <div className="oa-header-title">
            <Package size={24} />
            <div>
              <h1>Ajout d'usager événementiel</h1>
              <p>CD, MP3, œuvres web, hologrammes et autres supports</p>
            </div>
          </div>
          <div className="oa-header-steps">
            {[1, 2, 3].map(s => (
              <div key={s} className={`oa-step-dot ${currentStep === s ? 'active' : ''} ${currentStep > s ? 'done' : ''}`}>
                {currentStep > s ? <CheckCircle size={14} /> : s}
              </div>
            ))}
          </div>
        </header>

        <div className="oa-progress-bar">
          <div className="oa-progress-fill" style={{ width: `${(currentStep / 3) * 100}%` }} />
        </div>

        <div className="oa-step-header">
          <h2>{getStepTitle()}</h2>
        </div>

        <div className="oa-body">
          {renderCurrentStep()}
        </div>

        <div className="oa-footer">
          <button type="button" className="oa-btn-secondary" onClick={() => navigate('/gere-payer')}>
            <X size={16} /> Annuler
          </button>
          <div className="oa-footer-right">
            {currentStep > 1 && (
              <button type="button" className="oa-btn-secondary" onClick={handlePrev}>
                <ArrowLeft size={16} /> Précédent
              </button>
            )}
            <button type="button" className="oa-btn-primary" onClick={handleNext} disabled={isSubmitting}>
              {currentStep === 3 ? (
                <><Save size={16} /> Valider</>
              ) : (
                <>Suivant <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ MODAL DE CONFIRMATION */}
      {showConfirmModal && (
        <div className="oa-modal-overlay" onClick={() => !isSaving && setShowConfirmModal(false)}>
          <div className="oa-modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="oa-modal-header">
              <h2>
                {savingResult ? (
                  savingResult.success ? <><CheckCircle size={22} /> Succès</> : <><X size={22} /> Erreur</>
                ) : (
                  <><Info size={22} /> Confirmation</>
                )}
              </h2>
              {!isSaving && (
                <button className="oa-modal-close" onClick={() => setShowConfirmModal(false)}>
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="oa-modal-body">
              {!savingResult && !isSaving && (
                <>
                  <p className="oa-confirm-text">Confirmez-vous les actions suivantes ?</p>
                  <ul className="oa-confirm-list">
                    <li><CheckCircle size={16} color="#27ae60" /> <strong>Ajout d'un usager événementiel</strong> ({TYPES_USAGERS.find(t => t.id === typeUsager)?.label})</li>
                    <li><CheckCircle size={16} color="#27ae60" /> <strong>Ajout d'un paiement</strong> ({modePaiement === 'mensuel' ? 'Mensuel' : 'Unique'})</li>
                    <li><CheckCircle size={16} color="#27ae60" /> <strong>Génération d'une facture</strong> (quittance n° {quittanceInfo.next})</li>
                  </ul>
                  <div className="oa-confirm-summary">
                    <div><span>Usager :</span> <strong>{identification.denomination}</strong></div>
                    <div><span>Type :</span> <strong>{TYPES_USAGERS.find(t => t.id === typeUsager)?.label}</strong></div>
                    <div><span>Mode :</span> <strong>{modePaiement === 'mensuel' ? 'Mensuel' : 'Unique'}</strong></div>
                    <div><span>Lignes :</span> <strong>{lignes.length}</strong></div>
                    <div><span>Total :</span> <strong className="oa-total-strong">{formatNumber(getTotalGeneral())} Ar</strong></div>
                  </div>
                </>
              )}

              {isSaving && (
                <div className="oa-saving">
                  <Clock size={48} className="oa-spin" />
                  <p>Enregistrement en cours...</p>
                </div>
              )}

              {savingResult && savingResult.success && (
                <div className="oa-success">
                  <CheckCircle size={56} color="#27ae60" />
                  <h3>Enregistrement réussi !</h3>
                  <ul className="oa-result-list">
                    <li>✅ Usager événementiel créé (ID: {savingResult.usagerOtherId})</li>
                    <li>✅ Paiement enregistré ({savingResult.modePaiement})</li>
                    <li>✅ Facture n° {savingResult.numFacture} générée</li>
                    <li>✅ Quittance n° {savingResult.quittance}</li>
                  </ul>
                  <p className="oa-result-total">
                    Total : <strong>{formatNumber(savingResult.soitTotal)} Ar</strong>
                  </p>
                </div>
              )}

              {savingResult && !savingResult.success && (
                <div className="oa-error">
                  <X size={56} color="#e74c3c" />
                  <h3>Erreur</h3>
                  <p>{savingResult.message}</p>
                </div>
              )}
            </div>

            <div className="oa-modal-footer">
              {!savingResult && !isSaving && (
                <>
                  <button className="oa-btn-secondary" onClick={() => setShowConfirmModal(false)}>
                    Annuler
                  </button>
                  <button className="oa-btn-primary" onClick={handleConfirmSave}>
                    <Save size={16} /> Confirmer
                  </button>
                </>
              )}
              {savingResult && savingResult.success && (
                <button className="oa-btn-primary" onClick={() => navigate('/gere-payer')}>
                  <CheckCircle size={16} /> Terminer
                </button>
              )}
              {savingResult && !savingResult.success && (
                <button className="oa-btn-secondary" onClick={() => setSavingResult(null)}>
                  Réessayer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherAjout;