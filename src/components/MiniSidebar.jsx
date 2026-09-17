import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, BookOpen, Phone, Keyboard, Bell, Settings,
  Plus, Search, CalendarPlus, CreditCard, LayoutDashboard,
  FileText, Store, Bus, Moon, Music, Users, Receipt,
  ChevronLeft, ChevronRight, X, Check, Mail, Palette,
  Globe, Type
} from 'lucide-react';
import '../styles/aide.css';

const MiniSidebar = () => {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [showDocPopup, setShowDocPopup] = useState(false);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showRaccourcisPopup, setShowRaccourcisPopup] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showParamsPopup, setShowParamsPopup] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [prefs, setPrefs] = useState({
    langue: localStorage.getItem('app-langue') || 'fr',
    tailleTexte: localStorage.getItem('app-font-size') || 'medium',
    police: localStorage.getItem('app-font') || 'default',
    couleurPrincipale: localStorage.getItem('app-primary-color') || '#D4AF37'
  });

  // ===== Synchronisation avec Parametre.jsx =====
  useEffect(() => {
    const syncPrefs = () => {
      setPrefs({
        langue: localStorage.getItem('app-langue') || 'fr',
        tailleTexte: localStorage.getItem('app-font-size') || 'medium',
        police: localStorage.getItem('app-font') || 'default',
        couleurPrincipale: localStorage.getItem('app-primary-color') || '#D4AF37'
      });
    };
    window.addEventListener('langue-change', syncPrefs);
    window.addEventListener('storage', syncPrefs);
    window.addEventListener('apparence-change', syncPrefs);
    syncPrefs();
    return () => {
      window.removeEventListener('langue-change', syncPrefs);
      window.removeEventListener('storage', syncPrefs);
      window.removeEventListener('apparence-change', syncPrefs);
    };
  }, []);

  // ============================================================
  // ✅ TRADUCTIONS COMPLÈTES (fr / mg / en)
  // ============================================================
  const translations = {
    fr: {
      aide: 'Aide',
      doc: 'Documentation',
      support: 'Support',
      raccourcis: 'Raccourcis',
      notif: 'Notifications',
      params: 'Paramètres',
      tutorial: 'Guide d\'utilisation',
      preferences: 'Préférences',
      search: 'Recherche',
      // Doc popup
      docTitle: 'Guide d\'utilisation',
      docDesc: 'Consultez la documentation complète de l\'application OMDA.',
      docUserManual: 'Manuel utilisateur',
      docFeatures: 'Guide des fonctionnalités',
      docFaq: 'FAQ',
      docVideos: 'Vidéos tutorielles',
      // Support popup
      supportTitle: 'Support technique',
      supportContact: 'Contacter le support',
      supportEmail: 'Email',
      supportPhone: 'Téléphone',
      supportHours: 'Horaires',
      supportHoursValue: 'Lun-Ven, 9h-18h',
      supportSend: 'Envoyer un message',
      // Raccourcis popup
      shortcutsAvailable: 'Raccourcis clavier disponibles',
      shortcutsHint: 'Ces raccourcis sont actifs partout dans l\'application.',
      shortcutSearch: 'Rechercher',
      shortcutSave: 'Sauvegarder',
      shortcutHelp: 'Aide',
      shortcutClose: 'Fermer',
      // Notifications popup
      notifLatest: 'Dernières notifications',
      notif1: '3 factures en attente de paiement',
      notif2: 'Nouvel événement ajouté ce jour',
      notif3: 'Mise à jour système disponible',
      notif4: 'Rappel : réunion demain 10h',
      // Preferences popup
      prefLangue: 'Langue',
      prefTaille: 'Taille du texte',
      prefPolice: 'Police',
      prefCouleur: 'Couleur principale',
      prefTailleSmall: 'Petite',
      prefTailleMedium: 'Moyenne',
      prefTailleLarge: 'Grande',
      prefTailleXLarge: 'Très grande',
      prefPoliceDefault: 'Par défaut (Inter)',
      prefOpenFull: 'Ouvrir les paramètres complets',
      // Search popup
      searchPlaceholder: 'Rechercher une page...',
      searchNoResult: 'Aucun résultat pour',
      // Tutorial popup
      tutorialStep: 'Étape',
      tutorialAccess: 'Accéder à cette page',
      tutorialCancel: 'Annuler',
      tutorialPrev: 'Précédent',
      tutorialNext: 'Suivant',
      tutorialEnd: 'Terminer'
    },
    mg: {
      aide: 'Fanampiana',
      doc: 'Antontan-taratasy',
      support: 'Fanohanana',
      raccourcis: 'Fanalahidy',
      notif: 'Fampandrenesana',
      params: 'Kirakira',
      tutorial: 'Torolalana',
      preferences: 'Safidy',
      search: 'Fikarohana',
      docTitle: 'Torolalana',
      docDesc: 'Jereo ny antontan-taratasy feno momba ny rindranasa OMDA.',
      docUserManual: 'Boky fampiasana',
      docFeatures: 'Torolalana momba ny endri-javatra',
      docFaq: 'Fanontaniana matetika',
      docVideos: 'Horonantsary fampianarana',
      supportTitle: 'Fanohanana ara-teknika',
      supportContact: 'Mifandraisa amin\'ny fanohanana',
      supportEmail: 'Mailaka',
      supportPhone: 'Telefaona',
      supportHours: 'Ora',
      supportHoursValue: 'Alatsinainy-Zoma, 9h-18h',
      supportSend: 'Mandarà hafatra',
      shortcutsAvailable: 'Fanalahidy misy',
      shortcutsHint: 'Mandeha any amin\'ny rindranasa rehetra ireto fanalahidy ireto.',
      shortcutSearch: 'Hikaroka',
      shortcutSave: 'Hitahiry',
      shortcutHelp: 'Fanampiana',
      shortcutClose: 'Hanidy',
      notifLatest: 'Fampandrenesana farany',
      notif1: 'Faktiora 3 miandry fandoavana',
      notif2: 'Hetsika vaovao nampiana anio',
      notif3: 'Fanavaozana rafitra misy',
      notif4: 'Fampahatsiahivana : fivoriana rahampitso 10 ora',
      prefLangue: 'Fiteny',
      prefTaille: 'Haben\'ny lahatsoratra',
      prefPolice: 'Endri-tsoratra',
      prefCouleur: 'Loko fototra',
      prefTailleSmall: 'Kely',
      prefTailleMedium: 'Antonony',
      prefTailleLarge: 'Lehibe',
      prefTailleXLarge: 'Lehibe dia lehibe',
      prefPoliceDefault: 'Mahazatra (Inter)',
      prefOpenFull: 'Sokafy ny kirakira feno',
      searchPlaceholder: 'Hikaroka pejy...',
      searchNoResult: 'Tsy misy valiny ho an\'ny',
      tutorialStep: 'Dingana',
      tutorialAccess: 'Hankany amin\'ity pejy ity',
      tutorialCancel: 'Hanafoana',
      tutorialPrev: 'Teo aloha',
      tutorialNext: 'Manaraka',
      tutorialEnd: 'Vita'
    },
    en: {
      aide: 'Help',
      doc: 'Documentation',
      support: 'Support',
      raccourcis: 'Shortcuts',
      notif: 'Notifications',
      params: 'Settings',
      tutorial: 'User guide',
      preferences: 'Preferences',
      search: 'Search',
      docTitle: 'User guide',
      docDesc: 'Browse the complete documentation of the OMDA application.',
      docUserManual: 'User manual',
      docFeatures: 'Features guide',
      docFaq: 'FAQ',
      docVideos: 'Tutorial videos',
      supportTitle: 'Technical support',
      supportContact: 'Contact support',
      supportEmail: 'Email',
      supportPhone: 'Phone',
      supportHours: 'Hours',
      supportHoursValue: 'Mon-Fri, 9am-6pm',
      supportSend: 'Send a message',
      shortcutsAvailable: 'Available shortcuts',
      shortcutsHint: 'These shortcuts are active everywhere in the application.',
      shortcutSearch: 'Search',
      shortcutSave: 'Save',
      shortcutHelp: 'Help',
      shortcutClose: 'Close',
      notifLatest: 'Latest notifications',
      notif1: '3 invoices awaiting payment',
      notif2: 'New event added today',
      notif3: 'System update available',
      notif4: 'Reminder: meeting tomorrow 10am',
      prefLangue: 'Language',
      prefTaille: 'Text size',
      prefPolice: 'Font',
      prefCouleur: 'Primary color',
      prefTailleSmall: 'Small',
      prefTailleMedium: 'Medium',
      prefTailleLarge: 'Large',
      prefTailleXLarge: 'Extra large',
      prefPoliceDefault: 'Default (Inter)',
      prefOpenFull: 'Open full settings',
      searchPlaceholder: 'Search a page...',
      searchNoResult: 'No result for',
      tutorialStep: 'Step',
      tutorialAccess: 'Go to this page',
      tutorialCancel: 'Cancel',
      tutorialPrev: 'Previous',
      tutorialNext: 'Next',
      tutorialEnd: 'Finish'
    }
  };

  // ✅ `t` = dictionnaire de traductions pour les labels fixes (t.aide, t.doc, ...)
  const t = translations[prefs.langue] || translations.fr;

  // ✅ `tr` = fonction de traduction pour les chaînes dynamiques
  const tr = (fr, mg, en) => {
    switch (prefs.langue) {
      case 'mg': return mg || fr;
      case 'en': return en || fr;
      default: return fr;
    }
  };

  // ============================================================
  // ✅ PAGES TRADUITES (utilisation de tr())
  // ============================================================
  const pages = [
    { name: tr('Ajout d\'usager', 'Manampy mpampiasa', 'Add user'), path: '/ajout-usager', desc: tr('Enregistrer un nouvel usager', 'Misoratra mpampiasa vaovao', 'Register a new user'), icon: Plus, keywords: 'ajout usager nouveau client' },
    { name: tr('Vérification usager', 'Fanamarinana mpampiasa', 'User check'), path: '/verification-usager', desc: tr('Rechercher un usager existant', 'Hikaroka mpampiasa efa misy', 'Search for an existing user'), icon: Search, keywords: 'verification recherche usager' },
    { name: tr('Ajout d\'événement', 'Manampy hetsika', 'Add event'), path: '/ajout-evenement', desc: tr('Créer un événement culturel', 'Mamorona hetsika ara-kolontsaina', 'Create a cultural event'), icon: CalendarPlus, keywords: 'evenement ajout creation' },
    { name: tr('Paiement mensuel', 'Fandoavana isam-bolana', 'Monthly payment'), path: '/paiement-mensuel', desc: tr('Gérer les paiements mensuels', 'Mitantana ny fandoavana isam-bolana', 'Manage monthly payments'), icon: CreditCard, keywords: 'paiement mensuel' },
    { name: tr('Tableau de bord global', 'Tabilao fitantanana', 'Global dashboard'), path: '/tableau-db', desc: tr('Visualisation des données', 'Fijerena ny angona', 'Data visualization'), icon: LayoutDashboard, keywords: 'tableau bord dashboard' },
    { name: tr('Facturation occasionnelle', 'Faktiora tsindraindray', 'Occasional invoicing'), path: '/date_occ', desc: tr('Factures usagers occasionnels', 'Faktiora mpampiasa tsindraindray', 'Occasional user invoices'), icon: FileText, keywords: 'facturation occasionnel' },
    { name: tr('Facturation grande surface', 'Faktiora trano fivarotana lehibe', 'Supermarket invoicing'), path: '/date-grandsurface', desc: tr('Factures grandes surfaces', 'Faktiora trano fivarotana lehibe', 'Supermarket invoices'), icon: Store, keywords: 'facturation grande surface' },
    { name: tr('Facturation transport', 'Faktiora fitaterana', 'Transport invoicing'), path: '/date-bus', desc: tr('Factures sociétés transport', 'Faktiora orinasa fitaterana', 'Transport company invoices'), icon: Bus, keywords: 'facturation transport bus' },
    { name: tr('Facturation night club', 'Faktiora night club', 'Night club invoicing'), path: '/night-club', desc: tr('Factures night clubs', 'Faktiora night club', 'Night club invoices'), icon: Moon, keywords: 'facturation night club' },
    { name: tr('Facturation télé/radio', 'Faktiora tele/radio', 'TV/Radio invoicing'), path: '/tele-radio', desc: tr('Factures télé et radio', 'Faktiora tele sy radio', 'TV and radio invoices'), icon: Music, keywords: 'facturation tele radio' },
    { name: tr('Facturation hôtel', 'Faktiora hotely', 'Hotel invoicing'), path: '/Hotel_occ', desc: tr('Factures hôtels', 'Faktiora hotely', 'Hotel invoices'), icon: Store, keywords: 'facturation hotel' },
    { name: tr('Autre usager', 'Mpampiasa hafa', 'Other user'), path: '/autre-usager', desc: tr('Factures autres catégories', 'Faktiora sokajy hafa', 'Other category invoices'), icon: Users, keywords: 'autre usager' },
    { name: tr('Facture usager', 'Faktiora mpampiasa', 'User invoice'), path: '/facture-usager', desc: tr('Liste complète des factures', 'Lisitra feno faktiora', 'Complete invoice list'), icon: Receipt, keywords: 'facture usager liste' },
    { name: tr('Base de données', 'Tahiry angona', 'Database'), path: '/base-de-donnees', desc: tr('Gestion de la base', 'Fitantanana tahiry', 'Database management'), icon: Settings, keywords: 'base donnees database' }
  ];

  const savePref = useCallback((key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    const lsKey = {
      langue: 'app-langue', tailleTexte: 'app-font-size',
      police: 'app-font', couleurPrincipale: 'app-primary-color'
    }[key];
    if (lsKey) {
      localStorage.setItem(lsKey, value);
      window.dispatchEvent(new CustomEvent('apparence-change', { detail: { key, value } }));
      window.dispatchEvent(new CustomEvent('langue-change', { detail: { langue: value } }));
    }
  }, []);

  // ==============================
  // TUTORIEL
  // ==============================
  const openTutorial = () => { setShowTutorial(true); setCurrentStep(0); };
  const closeTutorial = () => setShowTutorial(false);
  const nextStep = () => currentStep < pages.length - 1 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 0 && setCurrentStep(currentStep - 1);
  const goToPage = () => {
    navigate(pages[currentStep].path);
    closeTutorial();
  };

  // ==============================
  // POPUPS
  // ==============================
  const closeAllPopups = useCallback(() => {
    setShowDocPopup(false);
    setShowSupportPopup(false);
    setShowRaccourcisPopup(false);
    setShowNotifPopup(false);
    setShowParamsPopup(false);
    setShowSearchPopup(false);
    setShowTutorial(false);
  }, []);

  const handleIconClick = (action) => {
    closeAllPopups();
    switch (action) {
      case 'aide': openTutorial(); break;
      case 'doc': setShowDocPopup(true); break;
      case 'support': setShowSupportPopup(true); break;
      case 'raccourcis': setShowRaccourcisPopup(true); break;
      case 'notif': setShowNotifPopup(true); break;
      case 'params': setShowParamsPopup(true); break;
      default: break;
    }
  };

  // ============================================================
  // RACCOURCIS CLAVIER
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === 'Escape') { closeAllPopups(); return; }
      if (e.key === 'F1') { e.preventDefault(); openTutorial(); return; }
      if (ctrl && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        closeAllPopups();
        setShowSearchPopup(true);
        setTimeout(() => {
          const input = document.getElementById('msb-search-input');
          if (input) input.focus();
        }, 100);
        return;
      }
      if (ctrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('app-save'));
        const btn = document.activeElement;
        if (btn) {
          btn.style.transition = 'all 0.3s';
          btn.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.4)';
          setTimeout(() => { btn.style.boxShadow = ''; }, 500);
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeAllPopups, navigate]);

  // ============================================================
  // RECHERCHE DANS LES PAGES
  // ============================================================
  const filteredPages = searchQuery.trim()
    ? pages.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.keywords || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pages;

  return (
    <>
      <nav className="msb-nav">
        <div className="msb-minimal">
          <div className="msb-dot"></div>
          <div className="msb-dot"></div>
          <div className="msb-dot"></div>
        </div>

        <div className="msb-expanded">
          <div className="msb-content">
            <div className="msb-group">
              <button className="msb-icon" title={`${t.aide} (F1)`} onClick={() => handleIconClick('aide')}>
                <HelpCircle size={16} />
              </button>
              <button className="msb-icon" title={t.doc} onClick={() => handleIconClick('doc')}>
                <BookOpen size={16} />
              </button>
              <button className="msb-icon" title={t.support} onClick={() => handleIconClick('support')}>
                <Phone size={16} />
              </button>
            </div>

            <div className="msb-divider"></div>

            <div className="msb-logo">
              <span>O</span><span>M</span><span>D</span><span>A</span>
            </div>

            <div className="msb-divider"></div>

            <div className="msb-group">
              <button className="msb-icon" title={`${t.raccourcis} (Ctrl+F, Ctrl+S)`} onClick={() => handleIconClick('raccourcis')}>
                <Keyboard size={16} />
              </button>
              <button className="msb-icon msb-icon-badge" title={t.notif} onClick={() => handleIconClick('notif')}>
                <Bell size={16} />
                <span className="msb-badge">3</span>
              </button>
              <button className="msb-icon" title={t.params} onClick={() => handleIconClick('params')}>
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* POPUP DOCUMENTATION */}
      {showDocPopup && (
        <div className="msb-overlay" onClick={closeAllPopups}>
          <div className="msb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msb-modal-header">
              <h2><BookOpen size={22} /> {t.doc}</h2>
              <button className="msb-modal-close" onClick={closeAllPopups}><X size={20} /></button>
            </div>
            <div className="msb-modal-body">
              <h3>{t.docTitle}</h3>
              <p>{t.docDesc}</p>
              <ul className="msb-list">
                <li><Check size={14} /> {t.docUserManual}</li>
                <li><Check size={14} /> {t.docFeatures}</li>
                <li><Check size={14} /> {t.docFaq}</li>
                <li><Check size={14} /> {t.docVideos}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* POPUP SUPPORT */}
      {showSupportPopup && (
        <div className="msb-overlay" onClick={closeAllPopups}>
          <div className="msb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msb-modal-header">
              <h2><Phone size={22} /> {t.supportTitle}</h2>
              <button className="msb-modal-close" onClick={closeAllPopups}><X size={20} /></button>
            </div>
            <div className="msb-modal-body">
              <h3>{t.supportContact}</h3>
              <p><strong>{t.supportEmail} :</strong> support@omda.com</p>
              <p><strong>{t.supportPhone} :</strong> +261 34 00 00 00</p>
              <p><strong>{t.supportHours} :</strong> {t.supportHoursValue}</p>
              <button className="msb-btn-primary" onClick={closeAllPopups}>
                <Mail size={16} /> {t.supportSend}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP RACCOURCIS */}
      {showRaccourcisPopup && (
        <div className="msb-overlay" onClick={closeAllPopups}>
          <div className="msb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msb-modal-header">
              <h2><Keyboard size={22} /> {t.raccourcis}</h2>
              <button className="msb-modal-close" onClick={closeAllPopups}><X size={20} /></button>
            </div>
            <div className="msb-modal-body">
              <h3>{t.shortcutsAvailable}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                {t.shortcutsHint}
              </p>
              <table className="msb-table">
                <tbody>
                  <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>F</kbd></td>
                    <td>{t.shortcutSearch}</td>
                  </tr>
                  <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>S</kbd></td>
                    <td>{t.shortcutSave}</td>
                  </tr>
                  <tr>
                    <td><kbd>F1</kbd></td>
                    <td>{t.shortcutHelp}</td>
                  </tr>
                  <tr>
                    <td><kbd>Esc</kbd></td>
                    <td>{t.shortcutClose}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* POPUP NOTIFICATIONS */}
      {showNotifPopup && (
        <div className="msb-overlay" onClick={closeAllPopups}>
          <div className="msb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msb-modal-header">
              <h2><Bell size={22} /> {t.notif}</h2>
              <button className="msb-modal-close" onClick={closeAllPopups}><X size={20} /></button>
            </div>
            <div className="msb-modal-body">
              <h3>{t.notifLatest}</h3>
              <div className="msb-notif-list">
                <div className="msb-notif-item"><Check size={14} /> {t.notif1}</div>
                <div className="msb-notif-item"><Check size={14} /> {t.notif2}</div>
                <div className="msb-notif-item"><Check size={14} /> {t.notif3}</div>
                <div className="msb-notif-item"><Check size={14} /> {t.notif4}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP PARAMÈTRES */}
      {showParamsPopup && (
        <div className="msb-overlay" onClick={closeAllPopups}>
          <div className="msb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msb-modal-header">
              <h2><Settings size={22} /> {t.preferences}</h2>
              <button className="msb-modal-close" onClick={closeAllPopups}><X size={20} /></button>
            </div>
            <div className="msb-modal-body">
              <div className="msb-pref-row">
                <label><Globe size={16} /> {t.prefLangue}</label>
                <select value={prefs.langue} onChange={(e) => savePref('langue', e.target.value)}>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="mg">🇲🇬 Malagasy</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>

              <div className="msb-pref-row">
                <label><Type size={16} /> {t.prefTaille}</label>
                <select value={prefs.tailleTexte} onChange={(e) => savePref('tailleTexte', e.target.value)}>
                  <option value="small">{t.prefTailleSmall}</option>
                  <option value="medium">{t.prefTailleMedium}</option>
                  <option value="large">{t.prefTailleLarge}</option>
                  <option value="xlarge">{t.prefTailleXLarge}</option>
                </select>
              </div>

              <div className="msb-pref-row">
                <label><Type size={16} /> {t.prefPolice}</label>
                <select value={prefs.police} onChange={(e) => savePref('police', e.target.value)}>
                  <option value="default">{t.prefPoliceDefault}</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                </select>
              </div>

              <div className="msb-pref-row">
                <label><Palette size={16} /> {t.prefCouleur}</label>
                <div className="msb-color-options">
                  {['#D4AF37', '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'].map(c => (
                    <button
                      key={c}
                      className={`msb-color-btn ${prefs.couleurPrincipale === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => savePref('couleurPrincipale', c)}
                    >
                      {prefs.couleurPrincipale === c && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              <button className="msb-btn-primary" onClick={() => {
                closeAllPopups();
                navigate('/Parametre_global');
              }}>
                <Settings size={16} /> {t.prefOpenFull}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP RECHERCHE */}
      {showSearchPopup && (
        <div className="msb-overlay" onClick={closeAllPopups}>
          <div className="msb-modal msb-modal-search" onClick={(e) => e.stopPropagation()}>
            <div className="msb-modal-header">
              <h2><Search size={22} /> {t.search}</h2>
              <button className="msb-modal-close" onClick={closeAllPopups}><X size={20} /></button>
            </div>
            <div className="msb-search-box">
              <Search size={18} className="msb-search-icon" />
              <input
                id="msb-search-input"
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {searchQuery && (
                <button className="msb-search-clear" onClick={() => setSearchQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="msb-search-results">
              {filteredPages.length === 0 ? (
                <div className="msb-search-empty">{t.searchNoResult} "{searchQuery}"</div>
              ) : (
                filteredPages.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={i}
                      className="msb-search-item"
                      onClick={() => {
                        navigate(p.path);
                        closeAllPopups();
                        setSearchQuery('');
                      }}
                    >
                      <div className="msb-search-item-icon">
                        <Icon size={18} />
                      </div>
                      <div className="msb-search-item-text">
                        <strong>{p.name}</strong>
                        <span>{p.desc}</span>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TUTORIEL */}
      {showTutorial && (
        <div className="msb-overlay" onClick={closeTutorial}>
          <div className="msb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msb-modal-header">
              <h2><BookOpen size={22} /> {t.tutorial}</h2>
              <button className="msb-modal-close" onClick={closeTutorial}><X size={20} /></button>
            </div>
            <div className="msb-progress">
              {t.tutorialStep} {currentStep + 1} / {pages.length}
            </div>
            <div className="msb-tuto-body">
              <div className="msb-tuto-icon">
                {React.createElement(pages[currentStep].icon, { size: 48 })}
              </div>
              <h3>{pages[currentStep].name}</h3>
              <p className="msb-tuto-desc">{pages[currentStep].desc}</p>
              <button className="msb-btn-primary" onClick={goToPage}>
                <ChevronRight size={16} /> {t.tutorialAccess}
              </button>
            </div>
            <div className="msb-modal-footer">
              <button className="msb-btn-secondary" onClick={closeTutorial}>{t.tutorialCancel}</button>
              <div className="msb-nav-btns">
                {currentStep > 0 && (
                  <button className="msb-btn-secondary" onClick={prevStep}>
                    <ChevronLeft size={16} /> {t.tutorialPrev}
                  </button>
                )}
                <button className="msb-btn-primary" onClick={nextStep}>
                  {currentStep === pages.length - 1 ? t.tutorialEnd : t.tutorialNext}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MiniSidebar;