import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Store, Radio, CalendarDays, Bus, Music,
  ChevronDown, Sparkles, AlertCircle, PlusCircle
} from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const typeOptions = [
    { value: 'Hôtel', label: 'Hôtel / Restaurant', icon: Building2 },
    { value: 'Grand Surface', label: 'Magasin et Autres', icon: Store },
    { value: 'Télé/Radio', label: 'Radio / Télévision', icon: Radio },
    { value: 'OCC', label: 'Occasionnelle', icon: CalendarDays },
    { value: 'Bus', label: 'Transport - Bus', icon: Bus },
    { value: 'Night club', label: 'Night Club', icon: Music }
  ];

  const selectedOption = typeOptions.find(opt => opt.value === selectedType);
  const SelectedIcon = selectedOption?.icon || PlusCircle;

  const handleSelect = (value) => {
    setSelectedType(value);
    setIsOpen(false);
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
          <legend>
            <Sparkles size={20} strokeWidth={2} />
            OFFICE MALAGASY DU DROIT D'AUTEUR – FICHE DE RENSEIGNEMENTS
          </legend>

          <div className="type-selection-container">
            <div className="type-selection-header">
              {/* Sélecteur personnalisé */}
              <div className="custom-select-wrapper" ref={wrapperRef}>
                <div 
                  className={`custom-select ${isOpen ? 'open' : ''}`}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <div className="custom-select-display">
                    <div className="custom-select-icon">
                      <SelectedIcon size={22} strokeWidth={2} />
                    </div>
                    <span className="custom-select-value">
                      {selectedType || 'Sélectionnez le type d\'établissement'}
                    </span>
                  </div>
                  <div className="custom-select-arrow">
                    <ChevronDown size={20} strokeWidth={2} />
                  </div>
                </div>
                {isOpen && (
                  <ul className="custom-select-options">
                    <li 
                      className="custom-select-option"
                      onClick={() => handleSelect('')}
                    >
                      <span className="option-icon">✕</span>
                      <span className="option-label">Aucune sélection</span>
                    </li>
                    {typeOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <li 
                          key={opt.value}
                          className={`custom-select-option ${selectedType === opt.value ? 'active' : ''}`}
                          onClick={() => handleSelect(opt.value)}
                        >
                          <span className="option-icon">
                            <Icon size={20} strokeWidth={2} />
                          </span>
                          <span className="option-label">{opt.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <button className="btn-new" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Sparkles size={18} strokeWidth={2} />
                Nouveau dossier
              </button>
            </div>

            <div className="type-status-bar">
              <div className="status-item">
                <span className="status-label">Type sélectionné</span>
                <span className="status-value badge">
                  {selectedType || 'Aucun'}
                </span>
              </div>
              <div className="status-divider"></div>
              <div className="status-item">
                <span className="status-label">Statut</span>
                <span className="status-value step-number">
                  {selectedType ? 'En cours' : 'En attente'}
                </span>
              </div>
            </div>
          </div>

          {!selectedType ? (
            <div className="alert-message">
              <AlertCircle size={28} strokeWidth={2} />
              <span>Veuillez sélectionner un type d'établissement pour commencer</span>
            </div>
          ) : (
            <div className="form-container step-container">
              {renderSelectedComponent()}
            </div>
          )}
        </fieldset>
      </main>
    </>
  );
};

export default AjoutUsager;