// src/pages/Parametre.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
  Settings, Globe, Type, Palette, Database, 
  RefreshCw, Check, Loader2, 
  Edit, Save, ArrowLeft, ExternalLink,
  X
} from 'lucide-react';
import '../styles/parametre.css';

const API_BASE = 'http://localhost:3001/api';

function getUtilisateurActuel() {
  try {
    const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { id: parsed.id, role: parsed.role, nom: parsed.nom };
    }
  } catch (e) { /* ignore */ }
  const id = localStorage.getItem('userId') || localStorage.getItem('utilisateurId');
  return { id: id || null, role: localStorage.getItem('role') || 'user', nom: '' };
}

const Parametre = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const utilisateurActuel = getUtilisateurActuel();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState({});

  const [settings, setSettings] = useState({
    appName: 'OMDA App',
    appVersion: '1.0.0',
    langue: 'fr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    couleurPrincipale: '#D4AF37',
    police: 'default',
    tailleTexte: 'medium'
  });

  const [dbSize, setDbSize] = useState('0 MB');

  // ============================================================
  // APPLIQUER L'APPARENCE (SANS MODE SOMBRE)
  // ============================================================
  const appliquerApparence = useCallback((couleur, police, taille) => {
    const root = document.documentElement;
    
    // Mode clair uniquement
    root.setAttribute('data-theme', 'light');
    localStorage.setItem('app-theme', 'light');
    
    // Variables du mode clair
    const variables = {
      '--bg-primary': '#f5f0eb',
      '--bg-secondary': '#ffffff',
      '--bg-card': '#ffffff',
      '--bg-input': '#f5f0eb',
      '--text-primary': '#1a1a2e',
      '--text-secondary': '#4a4a5e',
      '--text-muted': '#8a8a9e',
      '--border-color': '#e8e0d8',
      '--shadow': '0 4px 20px rgba(0,0,0,0.06)',
      '--shadow-hover': '0 8px 30px rgba(0,0,0,0.1)',
      '--hover-bg': 'rgba(0,0,0,0.03)'
    };

    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    if (couleur) {
      root.style.setProperty('--primary-color', couleur);
      localStorage.setItem('app-primary-color', couleur);
      
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '212, 175, 55';
      };
      const rgb = hexToRgb(couleur);
      root.style.setProperty('--primary-rgb', rgb);
      root.style.setProperty('--primary-light', `rgba(${rgb}, 0.1)`);
      root.style.setProperty('--primary-medium', `rgba(${rgb}, 0.3)`);
      root.style.setProperty('--primary-dark', `rgba(${rgb}, 0.8)`);
    }
    
    if (police && police !== 'default') {
      root.style.setProperty('--font-family', police);
      document.body.style.fontFamily = police;
      localStorage.setItem('app-font', police);
    } else if (police === 'default') {
      root.style.setProperty('--font-family', "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
      document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      localStorage.removeItem('app-font');
    }
    
    const tailleMap = {
      small: '13px',
      medium: '15px',
      large: '18px',
      xlarge: '21px'
    };
    const tailleValue = tailleMap[taille] || '15px';
    root.style.setProperty('--font-size-base', tailleValue);
    document.body.style.fontSize = tailleValue;
    localStorage.setItem('app-font-size', taille);
  }, []);

  // ============================================================
  // SAUVEGARDER LA LANGUE DANS LOCALSTORAGE
  // ============================================================
  const sauvegarderLangue = useCallback((langue) => {
    localStorage.setItem('app-langue', langue);
    window.dispatchEvent(new CustomEvent('langue-change', { detail: { langue } }));
  }, []);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const fetchParametresUtilisateur = useCallback(async () => {
    if (!utilisateurActuel.id) return;
    try {
      const res = await fetch(`${API_BASE}/parametres/${utilisateurActuel.id}`);
      const data = await res.json();
      if (data.success) {
        const p = data.parametres;
        const loaded = {
          appName: p.app_name || 'OMDA App',
          appVersion: settings.appVersion,
          langue: p.langue || 'fr',
          dateFormat: p.date_format || 'DD/MM/YYYY',
          timeFormat: p.time_format || '24h',
          couleurPrincipale: p.couleur_principale || '#D4AF37',
          police: p.police || 'default',
          tailleTexte: p.taille_texte || 'medium'
        };
        setSettings(prev => ({ ...prev, ...loaded }));
        appliquerApparence(loaded.couleurPrincipale, loaded.police, loaded.tailleTexte);
        sauvegarderLangue(loaded.langue);
      }
    } catch (err) {
      console.warn('Impossible de charger les paramètres:', err.message);
    }
  }, [utilisateurActuel.id, settings.appVersion, appliquerApparence, sauvegarderLangue]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const dbRes = await fetch(`${API_BASE}/parametres/db-size`);
      const dbData = await dbRes.json();
      if (dbData && dbData.success) {
        setDbSize(dbData.size || '0 MB');
      }

      await fetchParametresUtilisateur();

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchParametresUtilisateur]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ============================================================
  // CHANGEMENT DE PARAMÈTRE
  // ============================================================
  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (['couleurPrincipale', 'police', 'tailleTexte'].includes(key)) {
      appliquerApparence(
        newSettings.couleurPrincipale, 
        newSettings.police,
        newSettings.tailleTexte
      );
    }
    
    if (key === 'langue') {
      sauvegarderLangue(value);
    }
    
    if (isEditing) {
      setEditedSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  // ============================================================
  // SAUVEGARDE
  // ============================================================
  const handleSaveSettings = async () => {
    if (!utilisateurActuel.id) {
      showToast('Impossible d’identifier l’utilisateur connecté', 'error');
      return;
    }
    
    try {
      const payload = { 
        ...settings, 
        ...editedSettings
      };
      
      const response = await fetch(`${API_BASE}/parametres/${utilisateurActuel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('✅ Paramètres sauvegardés avec succès', 'success');
        setEditedSettings({});
        setIsEditing(false);
        appliquerApparence(
          settings.couleurPrincipale, 
          settings.police,
          settings.tailleTexte
        );
        sauvegarderLangue(settings.langue);
        await fetchParametresUtilisateur();
      } else {
        showToast('❌ ' + (data.message || 'Erreur lors de la sauvegarde'), 'error');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showToast('❌ Erreur de connexion au serveur', 'error');
    }
  };

  // ============================================================
  // ONGLET GÉNÉRAL
  // ============================================================
  const renderGeneralTab = () => (
    <div className="param-tab-content">
      <div className="param-settings-section">
        <div className="param-section-header">
          <h3><Settings size={22} /> Paramètres Généraux</h3>
          <p className="param-section-desc">Personnalisez la langue et l'affichage du texte dans toute l'application</p>
        </div>
        
        <div className="param-settings-grid">
          <div className="param-setting-card">
            <div className="param-setting-card-icon" style={{ backgroundColor: 'var(--primary-light)' }}>
              <Globe size={24} color="var(--primary-color)" />
            </div>
            <div className="param-setting-card-content">
              <label>Langue de l'application</label>
              <select 
                value={settings.langue} 
                disabled={!isEditing}
                onChange={(e) => handleSettingChange('langue', e.target.value)} 
                className="param-setting-select"
              >
                <option value="fr">🇫🇷 Français</option>
                <option value="mg">🇲🇬 Malagasy</option>
                <option value="en">🇬🇧 English</option>
              </select>
              <span className="param-setting-hint">Modifie la langue de toute l'interface</span>
            </div>
          </div>

          <div className="param-setting-card">
            <div className="param-setting-card-icon" style={{ backgroundColor: 'var(--primary-light)' }}>
              <Type size={24} color="var(--primary-color)" />
            </div>
            <div className="param-setting-card-content">
              <label>Taille du texte</label>
              <select 
                value={settings.tailleTexte} 
                disabled={!isEditing}
                onChange={(e) => handleSettingChange('tailleTexte', e.target.value)} 
                className="param-setting-select"
              >
                <option value="small">🔤 Petite</option>
                <option value="medium">🔤 Moyenne</option>
                <option value="large">🔤 Grande</option>
                <option value="xlarge">🔤 Très grande</option>
              </select>
              <span className="param-setting-hint">Modifie la taille du texte dans toute l'application</span>
            </div>
          </div>

          <div className="param-setting-card">
            <div className="param-setting-card-icon" style={{ backgroundColor: 'var(--primary-light)' }}>
              <Type size={24} color="var(--primary-color)" />
            </div>
            <div className="param-setting-card-content">
              <label>Police d'écriture</label>
              <select 
                value={settings.police} 
                disabled={!isEditing}
                onChange={(e) => handleSettingChange('police', e.target.value)} 
                className="param-setting-select"
                style={{ fontFamily: settings.police !== 'default' ? settings.police : 'inherit' }}
              >
                <option value="default">Par défaut (Inter)</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
              </select>
              <span className="param-setting-hint">Modifie la police dans toute l'application</span>
            </div>
          </div>
        </div>

        <div className="param-preview-live">
          <h4>📱 Aperçu en direct</h4>
          <div className="param-preview-content" style={{
            fontFamily: settings.police !== 'default' ? settings.police : 'inherit',
            fontSize: settings.tailleTexte === 'small' ? '13px' : 
                      settings.tailleTexte === 'medium' ? '15px' :
                      settings.tailleTexte === 'large' ? '18px' : '21px'
          }}>
            <p style={{ color: 'var(--primary-color)' }}>
              <strong>OMDA</strong> - Office Malagasy du Droit d'Auteur
            </p>
            <p>
              {settings.langue === 'fr' ? 'Bienvenue dans l\'application OMDA' :
               settings.langue === 'mg' ? 'Tongasoa eto amin\'ny rindranasa OMDA' :
               'Welcome to OMDA application'}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              {new Date().toLocaleDateString(settings.langue === 'fr' ? 'fr-FR' : 
                settings.langue === 'mg' ? 'mg-MG' : 'en-US')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // ONGLET APPAREANCE (SANS MODE SOMBRE)
  // ============================================================
  const renderAppearanceTab = () => (
    <div className="param-tab-content">
      <div className="param-settings-section">
        <div className="param-section-header">
          <h3><Palette size={22} /> Apparence</h3>
          <p className="param-section-desc">Personnalisez les couleurs de l'application</p>
        </div>
        
        <div className="param-settings-grid">
          <div className="param-setting-card param-full-width">
            <div className="param-setting-card-icon" style={{ backgroundColor: 'var(--primary-light)' }}>
              <Palette size={24} color="var(--primary-color)" />
            </div>
            <div className="param-setting-card-content">
              <label>Couleur principale</label>
              <div className="param-color-options">
                {['#D4AF37', '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'].map(color => (
                  <button 
                    key={color} 
                    className={`param-color-option ${settings.couleurPrincipale === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }} 
                    onClick={() => handleSettingChange('couleurPrincipale', color)} 
                  >
                    {settings.couleurPrincipale === color && <Check size={14} className="param-color-check" />}
                  </button>
                ))}
              </div>
              <span className="param-setting-hint">Couleur utilisée pour les éléments interactifs</span>
            </div>
          </div>
        </div>

        <div className="param-preview-colors">
          <h4>🎨 Aperçu des couleurs</h4>
          <div className="param-color-preview-grid">
            <div className="param-color-sample" style={{ backgroundColor: 'var(--primary-color)' }}>
              <span style={{ color: '#fff' }}>Couleur principale</span>
            </div>
            <div className="param-color-sample" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--text-primary)' }}>
              <span>Couleur claire</span>
            </div>
            <div className="param-color-sample" style={{ backgroundColor: 'var(--primary-medium)', color: '#fff' }}>
              <span>Couleur medium</span>
            </div>
          </div>
        </div>

        <div className="param-appearance-note">
          ✨ Les changements s'appliquent immédiatement à toute l'application et sont sauvegardés pour votre compte.
        </div>
      </div>
    </div>
  );

  // ============================================================
  // ONGLET BASE DE DONNÉES
  // ============================================================
  const renderDatabaseTab = () => (
    <div className="param-tab-content">
      <div className="param-settings-section">
        <div className="param-section-header">
          <h3><Database size={22} /> Base de données</h3>
          <p className="param-section-desc">Informations sur votre base de données</p>
        </div>
        
        <div className="param-settings-grid">
          <div className="param-setting-card">
            <div className="param-setting-card-icon" style={{ backgroundColor: 'var(--primary-light)' }}>
              <Database size={24} color="var(--primary-color)" />
            </div>
            <div className="param-setting-card-content">
              <label>Taille de la base de données</label>
              <div className="param-db-size-display">
                <span className="param-db-size-value">{dbSize}</span>
              </div>
              <span className="param-setting-hint">Espace occupé par la base de données</span>
            </div>
          </div>
        </div>

        <div className="param-db-action-box">
          <div className="param-db-action-info">
            <Database size={32} className="param-db-icon" />
            <div>
              <h4>Gestion des sauvegardes</h4>
              <p>Sauvegarde automatique (vendredi 9h), sauvegarde manuelle et restauration</p>
            </div>
          </div>
          <button className="param-btn-db-action" onClick={() => navigate('/base-de-donnees')}>
            <ExternalLink size={18} /> Gérer la base de données
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab();
      case 'appearance': return renderAppearanceTab();
      case 'database': return renderDatabaseTab();
      default: return renderGeneralTab();
    }
  };

  if (loading) {
    return (
      <div className="param-loading">
        <Loader2 size={48} className="param-spinner" />
        <p>Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="param-container">
      <div className="param-header">
        <div className="param-header-left">
          <button className="param-btn-back" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} /> Retour
          </button>
          <h1>
            <Settings size={28} /> Paramètres
          </h1>
        </div>
        <div className="param-header-actions">
          <button className="param-btn-edit" onClick={() => {
            if (isEditing) { 
              setEditedSettings({}); 
              setIsEditing(false); 
            } else { 
              setIsEditing(true); 
            }
          }}>
            {isEditing ? <X size={18} /> : <Edit size={18} />}
            {isEditing ? 'Annuler' : 'Modifier'}
          </button>
          {isEditing && (
            <button className="param-btn-save" onClick={handleSaveSettings}>
              <Save size={18} /> Sauvegarder
            </button>
          )}
          <button className="param-btn-refresh" onClick={fetchData}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="param-nav">
        {[
          { key: 'general', label: 'Général', icon: <Settings size={18} /> },
          { key: 'appearance', label: 'Apparence', icon: <Palette size={18} /> },
          { key: 'database', label: 'Base de données', icon: <Database size={18} /> }
        ].map(tab => (
          <button 
            key={tab.key} 
            className={`param-nav-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.key && <span className="param-nav-indicator" />}
          </button>
        ))}
      </div>

      <div className="param-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Parametre;