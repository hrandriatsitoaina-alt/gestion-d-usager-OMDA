import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';
import HotelAjout from './ajout/HotelAjout';
import MagasinAjout from './ajout/MagasinAjout';
import MediaAjout from './ajout/MediaAjout';
import OccAjout from './ajout/OccAjout';
import BusAjout from './ajout/BusAjout';
import NightAjout from './ajout/NightAjout';
import '../styles/AjoutUsager.css';

const AjoutUsager = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('');

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  const handleCancel = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ?')) {
      navigate('/dashboard');
    }
  };

  const renderSelectedComponent = () => {
    switch (selectedType) {
      case 'Hôtel':
        return <HotelAjout onCancel={handleCancel} />;
      case 'Grand Surface':
        return <MagasinAjout onCancel={handleCancel} />;
      case 'Télé/Radio':
        return <MediaAjout onCancel={handleCancel} />;
      case 'OCC':
        return <OccAjout onCancel={handleCancel} />;
      case 'Bus':
        return <BusAjout onCancel={handleCancel} />;
      case 'Night club':
        return <NightAjout onCancel={handleCancel} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      <main className="contenu">
        <fieldset>
          <legend>📋 OFFICE MALAGASY DU DROIT D'AUTEUR - FICHE DE RENSEIGNEMENTS</legend>
          
          <div className="type-selection-container">
            <div className="type-selector-wrapper">
              <div className="type-selector-icon">📌</div>
              <select className="type-selector" value={selectedType} onChange={handleTypeChange}>
                <option value="">Sélectionnez le type</option>
                <option value="Hôtel">🏨 Hôtel / Restaurant</option>
                <option value="Grand Surface">🏬 Magasin et Autres</option>
                <option value="Télé/Radio">📻 Radio / Télévision</option>
                <option value="OCC">🎪 Occasionnelle</option>
                <option value="Bus">🚌 Transport - Bus</option>
                <option value="Night club">🎭 Night Club</option>
              </select>
              <div className="type-selector-arrow">▼</div>
            </div>
            <div className="type-status-bar">
              <div className="status-item">
                <span className="status-label">Type :</span>
                <span className="status-value badge">{selectedType || 'Non sélectionné'}</span>
              </div>
            </div>
          </div>

          {!selectedType ? (
            <div className="alert-message">⚠️ Veuillez sélectionner un type d'établissement</div>
          ) : (
            renderSelectedComponent()
          )}
        </fieldset>
      </main>
    </>
  );
};

export default AjoutUsager;