// src/context/ParametreContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';
const ParametreContext = createContext();

export const useParametres = () => {
  const context = useContext(ParametreContext);
  if (!context) {
    throw new Error('useParametres must be used within ParametreProvider');
  }
  return context;
};

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

export const ParametreProvider = ({ children }) => {
  const [parametres, setParametres] = useState({
    langue: 'fr',
    theme: 'light',
    couleurPrincipale: '#D4AF37',
    police: 'default',
    tailleTexte: 'medium',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    appName: 'OMDA App'
  });
  
  const [loading, setLoading] = useState(true);
  const utilisateurActuel = getUtilisateurActuel();

  // ============================================================
  // APPLIQUER L'APPARENCE À TOUT LE PROJET
  // ============================================================
  const appliquerApparenceGlobale = useCallback((theme, couleur, police, taille) => {
    const root = document.documentElement;
    
    // 1. THÈME
    if (theme) {
      root.setAttribute('data-theme', theme);
      localStorage.setItem('app-theme', theme);
      
      const variables = theme === 'dark' ? {
        '--bg-primary': '#0f0e17',
        '--bg-secondary': '#1a1932',
        '--bg-card': '#1e1d3a',
        '--bg-input': '#2a294a',
        '--text-primary': '#fffffe',
        '--text-secondary': '#a7a9be',
        '--text-muted': '#6c6e8a',
        '--border-color': '#2a294a',
        '--shadow': '0 4px 20px rgba(0,0,0,0.4)',
        '--shadow-hover': '0 8px 30px rgba(0,0,0,0.6)',
        '--hover-bg': 'rgba(255,255,255,0.05)'
      } : {
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
    }
    
    // 2. COULEUR PRINCIPALE
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
    
    // 3. POLICE
    if (police && police !== 'default') {
      root.style.setProperty('--font-family', police);
      document.body.style.fontFamily = police;
      localStorage.setItem('app-font', police);
    } else if (police === 'default') {
      root.style.setProperty('--font-family', "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
      document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      localStorage.removeItem('app-font');
    }
    
    // 4. TAILLE DE TEXTE
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
    
    // 5. APPLIQUER LA LANGUE
    if (theme) {
      localStorage.setItem('app-langue', theme);
    }
  }, []);

  // ============================================================
  // CHARGER LES PARAMÈTRES DEPUIS LA BASE
  // ============================================================
  const chargerParametres = useCallback(async () => {
    if (!utilisateurActuel.id) {
      // Charger depuis localStorage si pas d'utilisateur
      const savedTheme = localStorage.getItem('app-theme') || 'light';
      const savedColor = localStorage.getItem('app-primary-color') || '#D4AF37';
      const savedFont = localStorage.getItem('app-font') || 'default';
      const savedFontSize = localStorage.getItem('app-font-size') || 'medium';
      const savedLangue = localStorage.getItem('app-langue') || 'fr';
      
      setParametres({
        langue: savedLangue,
        theme: savedTheme,
        couleurPrincipale: savedColor,
        police: savedFont,
        tailleTexte: savedFontSize,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        appName: 'OMDA App'
      });
      
      appliquerApparenceGlobale(savedTheme, savedColor, savedFont, savedFontSize);
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/parametres/${utilisateurActuel.id}`);
      const data = await res.json();
      
      if (data.success) {
        const p = data.parametres;
        const loaded = {
          appName: p.app_name || 'OMDA App',
          langue: p.langue || 'fr',
          dateFormat: p.date_format || 'DD/MM/YYYY',
          timeFormat: p.time_format || '24h',
          theme: p.theme || 'light',
          couleurPrincipale: p.couleur_principale || '#D4AF37',
          police: p.police || 'default',
          tailleTexte: p.taille_texte || 'medium'
        };
        
        setParametres(loaded);
        appliquerApparenceGlobale(loaded.theme, loaded.couleurPrincipale, loaded.police, loaded.tailleTexte);
      }
    } catch (error) {
      console.warn('Impossible de charger les paramètres:', error.message);
      // Fallback sur localStorage
      const savedTheme = localStorage.getItem('app-theme') || 'light';
      const savedColor = localStorage.getItem('app-primary-color') || '#D4AF37';
      const savedFont = localStorage.getItem('app-font') || 'default';
      const savedFontSize = localStorage.getItem('app-font-size') || 'medium';
      
      appliquerApparenceGlobale(savedTheme, savedColor, savedFont, savedFontSize);
    } finally {
      setLoading(false);
    }
  }, [utilisateurActuel.id, appliquerApparenceGlobale]);

  // ============================================================
  // METTRE À JOUR LES PARAMÈTRES
  // ============================================================
  const mettreAJourParametres = useCallback(async (nouveauxParametres) => {
    setParametres(prev => ({ ...prev, ...nouveauxParametres }));
    
    // Appliquer immédiatement
    if (nouveauxParametres.theme || nouveauxParametres.couleurPrincipale || 
        nouveauxParametres.police || nouveauxParametres.tailleTexte) {
      appliquerApparenceGlobale(
        nouveauxParametres.theme || parametres.theme,
        nouveauxParametres.couleurPrincipale || parametres.couleurPrincipale,
        nouveauxParametres.police || parametres.police,
        nouveauxParametres.tailleTexte || parametres.tailleTexte
      );
    }
    
    // Sauvegarder en base
    if (utilisateurActuel.id) {
      try {
        await fetch(`${API_BASE}/parametres/${utilisateurActuel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...parametres, ...nouveauxParametres })
        });
      } catch (error) {
        console.warn('Erreur sauvegarde paramètres:', error);
      }
    }
  }, [parametres, utilisateurActuel.id, appliquerApparenceGlobale]);

  // ============================================================
  // INITIALISATION
  // ============================================================
  useEffect(() => {
    chargerParametres();
  }, [chargerParametres]);

  const value = {
    parametres,
    setParametres: mettreAJourParametres,
    loading,
    chargerParametres,
    appliquerApparenceGlobale
  };

  return (
    <ParametreContext.Provider value={value}>
      {children}
    </ParametreContext.Provider>
  );
};

export default ParametreContext;