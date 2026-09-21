// src/pages/Authentification.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Authentification.css';
import AdminPanel from './AdminPanel';
import omdaLogo from '../assets/imagesOMDA.png';
import { useToast } from '../components/Toast';
import {
  Lock, User, Eye, EyeOff, Crown, LogIn,
  Menu, X, AlertCircle,
} from 'lucide-react';
import { useT } from '../hooks/useT';

const Authentification = () => {
  const navigate = useNavigate();

  // ✅ Récupération sécurisée du toast
  let showToast;
  try {
    showToast = useToast();
  } catch (err) {
    showToast = (msg, type = 'error') => console.log(`[Toast ${type}]`, msg);
  }
  if (typeof showToast !== 'function') {
    showToast = (msg, type = 'error') => console.log(`[Toast ${type}]`, msg);
  }

  const { t } = useT();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [isAdminPanelLoading, setIsAdminPanelLoading] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // ✅ Référence pour tracker le montage
  const isMountedRef = useRef(true);

  // ✅ Cleanup au démontage
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Reset des champs si retour depuis Register
  useEffect(() => {
    const wasJustRegistered = sessionStorage.getItem('just_registered');
    if (wasJustRegistered === 'true') {
      sessionStorage.removeItem('just_registered');
      setUsername('');
      setPassword('');
      setIsLoading(false);
      setIsFormValid(false);
    }
  }, []);

  // ✅ Reset total quand on revient du AdminPanel
  useEffect(() => {
    if (!showAdminPanel) {
      // Forcer un reset propre des états de formulaire
      setIsLoading(false);
      setIsVerifyingAdmin(false);
      setIsAdminPanelLoading(false);
    }
  }, [showAdminPanel]);

  useEffect(() => {
    setIsFormValid(username.trim() !== '' && password.trim() !== '');
  }, [username, password]);

  const handleUsernameChange = useCallback((e) => {
    setUsername(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  // ── LOGIN ────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast(t(
        'Veuillez remplir tous les champs',
        'Fenoy ny saha rehetra',
        'Please fill all fields'
      ), 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!isMountedRef.current) return;

      if (data.success) {
        localStorage.setItem('adminToken', data.adminToken || ('user_' + data.user.id + '_' + Date.now()));
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.nom);
        localStorage.setItem('userId', data.user.id);
        showToast(t(
          'Connexion réussie',
          'Nifandray soa aman-tsara',
          'Login successful'
        ), 'success');
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        showToast(
          data.message || t(
            'Identifiants incorrects',
            'Diso ny mombamomba',
            'Incorrect credentials'
          ),
          'error'
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      if (!isMountedRef.current) return;
      showToast(t(
        'Erreur de connexion au serveur.',
        'Nisy olana tamin\'ny fifandraisana.',
        'Server connection error.'
      ), 'error');
      setIsLoading(false);
    }
  };

  // ── SUPER ADMIN ──────────────────────────────────────────
  const openAdminPanel = useCallback(() => {
    setShowAdminPasswordModal(true);
  }, []);

  const verifyAdminPassword = async () => {
    if (!adminPasswordInput || adminPasswordInput.length !== 4) {
      showToast(t(
        'Veuillez entrer un code à 4 chiffres',
        'Ampidiro kaody 4 isa',
        'Please enter a 4-digit code'
      ), 'error');
      return;
    }

    setIsVerifyingAdmin(true);
    setIsAdminPanelLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput }),
      });

      const data = await response.json();
      if (!isMountedRef.current) return;

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setAdminToken(data.token);

        if (data.user) {
          localStorage.setItem('adminUser', JSON.stringify(data.user));
          localStorage.setItem('adminName', data.user.nom);
          localStorage.setItem('adminEmail', data.user.email);
          localStorage.setItem('adminRole', data.role);
        }

        setShowAdminPasswordModal(false);
        setAdminPasswordInput('');
        setShowAdminPassword(false);
        setIsVerifyingAdmin(false);

        showToast(
          data.message || t(
            'Accès autorisé ✅',
            'Nahazo alalana ✅',
            'Access granted ✅'
          ),
          'success'
        );

        setTimeout(() => {
          if (!isMountedRef.current) return;
          setShowAdminPanel(true);
          setIsAdminPanelLoading(false);
        }, 300);
      } else {
        showToast(
          data.message || t(
            'Mot de passe incorrect ❌',
            'Diso ny teny miafina ❌',
            'Incorrect password ❌'
          ),
          'error'
        );
        setAdminPasswordInput('');
        setIsVerifyingAdmin(false);
        setIsAdminPanelLoading(false);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      if (!isMountedRef.current) return;
      showToast(t(
        'Erreur de connexion au serveur',
        'Nisy olana tamin\'ny fifandraisana',
        'Server connection error'
      ), 'error');
      setIsVerifyingAdmin(false);
      setIsAdminPanelLoading(false);
    }
  };

  // ✅ FERMETURE PROPRE du AdminPanel
  const handleCloseAdminPanel = useCallback(() => {
    // 1. Fermer le panneau
    setShowAdminPanel(false);

    // 2. Nettoyer le token
    localStorage.removeItem('adminToken');

    // 3. Reset des états liés à l'admin
    setAdminToken(null);
    setIsVerifyingAdmin(false);
    setIsAdminPanelLoading(false);

    // 4. Forcer le focus sur le body pour "réveiller" les événements
    setTimeout(() => {
      if (document.body) {
        // Petit hack : force un reflow pour que les inputs réattachent leurs listeners
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent('resize', true, false);
        window.dispatchEvent(evt);
      }
    }, 50);
  }, []);

  // ✅ Redirection Register avec flag
  const goToRegister = useCallback(() => {
    sessionStorage.setItem('just_registered', 'true');
    navigate('/register');
  }, [navigate]);

  // ✅ Contenu traduit
  const sectionContent = useMemo(() => ({
    home: {
      title: t(
        "Bienvenue à l'OMDA",
        "Tongasoa eto amin'ny OMDA",
        'Welcome to OMDA'
      ),
      description: t(
        "L'Office Malagasy du Droit d'Auteur est l'institution publique chargée de la gestion et de la protection des droits d'auteur à Madagascar. Créé en 1984, il œuvre pour la reconnaissance et la rémunération des créateurs.",
        "Ny Birao Malagasy momba ny Zon'ny Mpanoratra dia andrim-panjakana miandraikitra ny fitantanana sy fiarovana ny zon'ny mpanoratra eto Madagasikara. Natsangana tamin'ny 1984 izy, miasa ho fanekena sy valisoa ny mpamorona.",
        "The Malagasy Copyright Office is the public institution responsible for managing and protecting copyright in Madagascar. Founded in 1984, it works for the recognition and remuneration of creators."
      ),
      subtext: t(
        "Notre mission : protéger les œuvres, collecter et répartir les droits, sensibiliser le public et lutter contre la contrefaçon.",
        "Ny iraka ataonay: miaro ny sanganasa, manangona sy mizara ny zo, mampahafantatra ny besinimaro ary miady amin'ny hosoka.",
        "Our mission: protect works, collect and distribute royalties, raise public awareness and fight counterfeiting."
      ),
    },
    features: {
      title: t('Nos services', 'Ny serivisinay', 'Our services'),
      description: t(
        "L'OMDA propose une gamme de services dédiés aux auteurs, artistes et créateurs malgaches : enregistrement des œuvres, perception des droits, conseil juridique, et bien plus.",
        "Manolotra serivisy isan-karazany ho an'ny mpanoratra, mpanakanto ary mpamorona malagasy ny OMDA: firaketana sanganasa, fanangonana zo, torohevitra ara-dalàna, sy ny maro hafa.",
        "OMDA offers a range of services dedicated to Malagasy authors, artists and creators: work registration, royalty collection, legal advice, and much more."
      ),
      subtext: t(
        "Nous accompagnons les créateurs à chaque étape de leur carrière, de la protection de leurs œuvres à la perception des redevances.",
        "Manaraka ny mpamorona amin'ny dingana rehetra amin'ny asany izahay, manomboka amin'ny fiarovana ny sanganasany ka hatramin'ny fahazoana ny vola miditra.",
        "We support creators at every stage of their career, from protecting their works to collecting royalties."
      ),
    },
    about: {
      title: t("À propos de l'OMDA", "Momba ny OMDA", 'About OMDA'),
      description: t(
        "Créé en 1984 par le décret n°84-389, l'OMDA est un Établissement Public à Caractère Industriel et Commercial (EPIC). Placé sous la tutelle du Ministère de la Communication et de la Culture, il est un acteur clé du paysage culturel malgache.",
        "Natsangana tamin'ny 1984 tamin'ny didim-panjakana n°84-389 ny OMDA, ary andrim-panjakana ara-indostria sy ara-barotra (EPIC) izy. Eo ambany fiahian'ny Ministeran'ny Fifandraisana sy ny Kolontsaina izy, ary mpilalao fototra amin'ny tontolon'ny kolontsaina malagasy.",
        "Created in 1984 by decree No. 84-389, OMDA is a Public Industrial and Commercial Establishment (EPIC). Under the supervision of the Ministry of Communication and Culture, it is a key player in the Malagasy cultural landscape."
      ),
      subtext: t(
        "Notre équipe est dédiée à la promotion et à la défense des droits des auteurs, et nous collaborons avec des partenaires nationaux et internationaux pour renforcer notre action.",
        "Ny ekipanay dia natokana ho fampiroboroboana sy fiarovana ny zon'ny mpanoratra, ary miara-miasa amin'ny mpiara-miombon'antoka eo an-toerana sy iraisam-pirenena izahay hanamafisana ny asanay.",
        "Our team is dedicated to promoting and defending authors' rights, and we collaborate with national and international partners to strengthen our action."
      ),
    },
    service: {
      title: t('Nos prestations', 'Ny tolotray', 'Our services'),
      description: t(
        "Nous offrons des prestations sur mesure pour les auteurs, les éditeurs, les producteurs et les utilisateurs d'œuvres. Enregistrement, gestion des contrats, médiation, formation.",
        "Manolotra tolotra manokana ho an'ny mpanoratra, mpamoaka boky, mpamokatra ary mpampiasa sanganasa izahay. Firaketana, fitantanana fifanarahana, fanelanelanana, fiofanana.",
        "We offer tailor-made services for authors, publishers, producers and users of works. Registration, contract management, mediation, training."
      ),
      subtext: t(
        "Nous mettons à disposition des outils et des conseils pour vous aider à protéger et valoriser votre création.",
        "Manolotra fitaovana sy torohevitra izahay hanampiana anao hiaro sy hanandratra ny sanganasanao.",
        "We provide tools and advice to help you protect and enhance your creation."
      ),
    },
    contact: {
      title: t('Contactez-nous', 'Mifandraisa aminay', 'Contact us'),
      description: t(
        "Nous sommes à votre écoute pour toute question relative au droit d'auteur. N'hésitez pas à nous contacter par téléphone, email ou en visitant nos locaux.",
        "Vonona hihaino anao izahay amin'ny fanontaniana rehetra momba ny zon'ny mpanoratra. Aza misalasala mifandray aminay amin'ny finday, mailaka na mitsidika ny biraonay.",
        "We are here to answer any questions you may have about copyright. Feel free to contact us by phone, email or by visiting our offices."
      ),
      subtext: t(
        "Adresse : Lot II F 62, Rue Fredy Rajaofera, Antaninandro, Antananarivo 101. Tél : 261 20 22 610 19. Email : omda@moov.mg",
        "Adiresy : Lot II F 62, Rue Fredy Rajaofera, Antaninandro, Antananarivo 101. Finday : 261 20 22 610 19. Mailaka : omda@moov.mg",
        "Address: Lot II F 62, Rue Fredy Rajaofera, Antaninandro, Antananarivo 101. Phone: 261 20 22 610 19. Email: omda@moov.mg"
      ),
    },
  }), [t]);

  const currentContent = sectionContent[activeSection] || sectionContent.home;

  // ✅ RENDU ADMIN PANEL avec key unique pour forcer un remount propre
  if (showAdminPanel) {
    return (
      <AdminPanel
        key={`admin-panel-${Date.now()}`}
        onClose={handleCloseAdminPanel}
        adminToken={adminToken}
      />
    );
  }

  return (
    <div className="auth-landing" key="auth-landing-main">
      <div className="landing-bg"></div>

      <div className="landing-container">
        <header className="landing-header">
          <div className="header-left">
            <img src={omdaLogo} alt="OMDA" className="logo" />
            <span className="brand-name">OMDA</span>
          </div>
          <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('home'); }}
              className={activeSection === 'home' ? 'active' : ''}
            >
              {t('Accueil', 'Fandraisana', 'Home')}
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('features'); }}
              className={activeSection === 'features' ? 'active' : ''}
            >
              {t('Fonctionnalités', 'Endri-javatra', 'Features')}
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('about'); }}
              className={activeSection === 'about' ? 'active' : ''}
            >
              {t('À propos', 'Momba', 'About')}
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('service'); }}
              className={activeSection === 'service' ? 'active' : ''}
            >
              {t('Services', 'Serivisy', 'Services')}
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('contact'); }}
              className={activeSection === 'contact' ? 'active' : ''}
            >
              {t('Contact', 'Fifandraisana', 'Contact')}
            </a>
          </nav>
          <div className="header-right">
            <button className="mobile-menu-btn" type="button" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        <main className="landing-main">
          <div className="landing-content">
            <div className="hero-text">
              <h1 className="hero-title">{currentContent.title}</h1>
              <p className="hero-description">{currentContent.description}</p>
              <p className="hero-subtext">{currentContent.subtext}</p><br />
              <div className="admin-link">
                <button className="admin-trigger" type="button" onClick={openAdminPanel}>
                  <Crown size={14} /> {t('Accès Super Admin', 'Fidirana Super Admin', 'Super Admin Access')}
                </button>
              </div>
            </div>

            <div className="login-panel">
              <div className="login-card">
                <div className="login-card-header">
                  <Lock size={24} className="login-icon" />
                  <h2>{t('Authentification', 'Fanamarinana', 'Authentication')}</h2>
                  <p className="login-subtitle">
                    {t('Connectez-vous à votre espace', 'Mifandraisa amin\'ny sehatrao', 'Log in to your space')}
                  </p>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                  <div className="form-group">
                    <label><User size={14} /> {t('Identifiant', 'Mpampiasa', 'Username')}</label>
                    <input
                      type="text"
                      placeholder={t('Votre email', 'Ny mailakao', 'Your email')}
                      className="input-field"
                      value={username}
                      onChange={handleUsernameChange}
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>

                  <div className="form-group">
                    <label><Lock size={14} /> {t('Mot de passe', 'Teny miafina', 'Password')}</label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('Votre mot de passe', 'Ny teny miafinao', 'Your password')}
                        className="input-field"
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="toggle-pwd"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`login-btn ${(!isFormValid || isLoading) ? 'disabled' : ''}`}
                    disabled={!isFormValid || isLoading}
                  >
                    {isLoading
                      ? t('Connexion en cours…', 'Mandefa…', 'Logging in…')
                      : (
                        <>
                          <LogIn size={18} /> {t('CONNEXION', 'HIDITRA', 'LOGIN')}
                        </>
                      )}
                  </button>

                  <button
                    className="create-account-btn"
                    onClick={goToRegister}
                    type="button"
                  >
                    {t('Créer un compte', 'Hamorona kaonty', 'Create account')}
                  </button>
                </form>

                <div className="login-footer">
                  <div className="help-row">
                    <AlertCircle size={14} />
                    <span>{t('Besoin d\'aide ?', 'Mila fanampiana ?', 'Need help?')}</span>
                    <a href="mailto:omda@moov.mg">omda@moov.mg</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="landing-footer">
          <p>
            &copy; 2026 OMDA – {t(
              "Office Malagasy du Droit d'Auteur",
              "Birao Malagasy momba ny Zon'ny Mpanoratra",
              'Malagasy Copyright Office'
            )}
          </p>
        </footer>
      </div>

      {showAdminPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <Crown size={24} />
              <h3>{t('Accès Super Administrateur', 'Fidirana Super Administrateur', 'Super Administrator Access')}</h3>
            </div>
            <p className="modal-subtitle">
              {t('Entrez le code à 4 chiffres', 'Ampidiro ny kaody 4 isa', 'Enter the 4-digit code')}
            </p>
            <div className="admin-password-wrapper">
              <input
                type={showAdminPassword ? 'text' : 'password'}
                maxLength="4"
                pattern="[0-9]*"
                inputMode="numeric"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="• • • •"
                className="admin-password-input"
                autoFocus
                disabled={isVerifyingAdmin}
              />
              <button
                type="button"
                className="toggle-admin-password"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
              >
                {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-validate"
                onClick={verifyAdminPassword}
                disabled={isVerifyingAdmin}
              >
                {isVerifyingAdmin
                  ? t('Vérification…', 'Manamarina…', 'Verifying…')
                  : t('Valider', 'Hamarino', 'Validate')}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowAdminPasswordModal(false);
                  setAdminPasswordInput('');
                  setShowAdminPassword(false);
                  setIsVerifyingAdmin(false);
                }}
                disabled={isVerifyingAdmin}
              >
                {t('Annuler', 'Foanana', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Authentification;