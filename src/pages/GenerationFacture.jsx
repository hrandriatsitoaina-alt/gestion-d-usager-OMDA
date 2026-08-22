// src/pages/GenerationFacture.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, Save, Printer, FileText, Building2, User,
  Phone, Mail, MapPin, Calendar, DollarSign, CreditCard,
  Hash, Edit, CheckCircle, XCircle, AlertCircle, Loader2
} from 'lucide-react';
import '../styles/generation-facture.css';
import MiniSidebar from '../components/MiniSidebar';

const GenerationFacture = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [facture, setFacture] = useState(null);
  const [factureId, setFactureId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFacture, setEditedFacture] = useState({});

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

  const fetchFacture = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/factures/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setFacture(data.facture);
        setEditedFacture(data.facture);
      } else {
        showToast('Erreur lors du chargement de la facture', 'error');
        navigate('/confirmation-dossier');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field, value) => {
    setEditedFacture(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/factures/${factureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedFacture)
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('✅ Facture mise à jour avec succès', 'success');
        setFacture(editedFacture);
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

  const handleGeneratePDF = async () => {
    try {
      showToast('🔄 Génération du PDF en cours...', 'info');
      
      const response = await fetch('http://localhost:3001/api/factures/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factureId })
      });
      
      const data = await response.json();
      if (data.success) {
        // Télécharger le PDF
        window.open(data.pdfUrl, '_blank');
        showToast('✅ PDF généré avec succès', 'success');
      } else {
        showToast('❌ ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('❌ Erreur de génération PDF', 'error');
    }
  };

  const renderField = (label, value, field, type = 'text') => {
    const displayValue = value || '';
    const isEditable = isEditing;
    
    return (
      <div className="facture-field">
        <span className="field-label">{label}</span>
        {isEditable ? (
          type === 'textarea' ? (
            <textarea
              value={editedFacture[field] || ''}
              onChange={(e) => handleEdit(field, e.target.value)}
              className="field-input textarea"
            />
          ) : type === 'select' ? (
            <select
              value={editedFacture[field] || ''}
              onChange={(e) => handleEdit(field, e.target.value)}
              className="field-input"
            >
              <option value="">Sélectionner</option>
              <option value="Redevances">Redevances</option>
              <option value="Droit d\'auteur">Droit d'auteur</option>
              <option value="Location">Location</option>
              <option value="Autres">Autres</option>
            </select>
          ) : type === 'date' ? (
            <input
              type="date"
              value={editedFacture[field] || ''}
              onChange={(e) => handleEdit(field, e.target.value)}
              className="field-input"
            />
          ) : type === 'number' ? (
            <input
              type="number"
              value={editedFacture[field] || 0}
              onChange={(e) => handleEdit(field, parseFloat(e.target.value) || 0)}
              className="field-input"
            />
          ) : (
            <input
              type="text"
              value={editedFacture[field] || ''}
              onChange={(e) => handleEdit(field, e.target.value)}
              className="field-input"
            />
          )
        ) : (
          <span className="field-value">{displayValue || '-'}</span>
        )}
      </div>
    );
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

  return (
    <>
      <MiniSidebar />
      <div className="generation-facture-container">
        <div className="facture-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/confirmation-dossier')}>
              <ArrowLeft size={20} /> Retour
            </button>
            <h1>Génération de Facture</h1>
          </div>
          <div className="header-right">
            <span className={`facture-status status-${facture.statut}`}>
              {facture.statut === 'brouillon' && '📝 Brouillon'}
              {facture.statut === 'validee' && '✅ Validée'}
            </span>
            <button className="btn-edit" onClick={() => setIsEditing(!isEditing)}>
              <Edit size={18} /> {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>
        </div>

        <div className="facture-body">
          {/* Références */}
          <div className="facture-section">
            <h3><Hash size={18} /> Références</h3>
            <div className="facture-grid">
              {renderField('Réf OMDA', facture.ref_omda, 'ref_omda', 'number')}
              {renderField('N° Facture', facture.num_facture, 'num_facture')}
              {renderField('Type Facture', facture.num_facture_type, 'num_facture_type')}
              {renderField('Type Client', facture.ref_client_type, 'ref_client_type')}
              {renderField('Type de facture', facture.type_facture, 'type_facture', 'select')}
              {renderField('Région', facture.region_usager, 'region_usager')}
            </div>
          </div>

          {/* Informations Client */}
          <div className="facture-section">
            <h3><Building2 size={18} /> Informations Client</h3>
            <div className="facture-grid">
              {renderField('Dénomination', facture.denomination, 'denomination')}
              {renderField('Demandeur', facture.demandeur, 'demandeur')}
              {renderField('Téléphone', facture.telephone, 'telephone')}
              {renderField('Email', facture.email, 'email')}
              {renderField('Adresse', facture.adresse, 'adresse', 'textarea')}
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

          {/* Activité */}
          <div className="facture-section">
            <h3><FileText size={18} /> Informations Spécifiques</h3>
            <div className="facture-grid">
              {renderField('Activité', facture.activite, 'activite')}
              {renderField('Étoiles', facture.etoiles, 'etoiles')}
              {renderField('Ravinala', facture.ravinala ? 'Oui' : 'Non', 'ravinala')}
              {renderField('Nbre Magasins', facture.nombre_magasins, 'nombre_magasins', 'number')}
              {renderField('Nbre Véhicules', facture.nombre_vehicules, 'nombre_vehicules', 'number')}
              {renderField('Lignes', facture.lignes, 'lignes')}
              {renderField('Type Bus', facture.type_bus, 'type_bus')}
              {renderField('Trajet', facture.trajet, 'trajet')}
              {renderField('Zones desservies', facture.zones_desservies, 'zones_desservies')}
              {renderField('Jauge max', facture.jauge_max, 'jauge_max', 'number')}
              {renderField('Fréquence', facture.frequence, 'frequence')}
              {renderField('Canal', facture.canal, 'canal')}
              {renderField('Siège', facture.siege, 'siege')}
              {renderField('NIF', facture.nif, 'nif')}
              {renderField('STAT', facture.stat, 'stat')}
              {renderField('Taux', facture.taux, 'taux', 'number')}
            </div>
          </div>

          {/* Événement (OCC) */}
          {facture.ref_client_type === 'OCC' && (
            <div className="facture-section">
              <h3><Calendar size={18} /> Événement</h3>
              <div className="facture-grid">
                {renderField('Organisateurs', facture.organisateurs, 'organisateurs')}
                {renderField('Représentant par', facture.representant_par, 'representant_par')}
                {renderField('Genre', facture.genre_manifestation, 'genre_manifestation')}
                {renderField('Artistes', facture.artistes, 'artistes')}
                {renderField('Date événement', facture.date_evenement, 'date_evenement', 'date')}
                {renderField('Lieu', facture.lieu_evenement, 'lieu_evenement')}
              </div>
            </div>
          )}

          {/* Période */}
          <div className="facture-section">
            <h3><Calendar size={18} /> Période</h3>
            <div className="facture-grid">
              {renderField('A compter du', facture.a_compter_du, 'a_compter_du', 'date')}
              {renderField('Echéance', facture.echeance, 'echeance', 'date')}
              {renderField('Date signature', facture.date_signature, 'date_signature', 'date')}
            </div>
          </div>

          {/* Montants */}
          <div className="facture-section">
            <h3><DollarSign size={18} /> Montants</h3>
            <div className="facture-grid">
              {renderField('Montant mensuel', facture.montant_mensuel, 'montant_mensuel', 'number')}
              {renderField('Frais de dossier', facture.frais_dossier, 'frais_dossier', 'number')}
              {renderField('Montant retard', facture.montant_retard, 'montant_retard', 'number')}
              {renderField('Retard', facture.is_retard ? 'Oui' : 'Non', 'is_retard')}
              {renderField('Uniter', facture.uniter, 'uniter', 'number')}
              {renderField('Soit Total', facture.soit_total, 'soit_total', 'number')}
            </div>
          </div>
        </div>

        <div className="facture-footer">
          <button className="btn-save" onClick={handleSave} disabled={isSaving || !isEditing}>
            {isSaving ? (
              <><Loader2 size={18} className="spinner" /> Sauvegarde...</>
            ) : (
              <><Save size={18} /> Sauvegarder</>
            )}
          </button>
          <button className="btn-generate-pdf" onClick={handleGeneratePDF}>
            <FileText size={18} /> Générer le PDF
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