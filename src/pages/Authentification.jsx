// src/pages/Authentification.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Authentification.css';
import AdminPanel from './AdminPanel';
import omdaLogo from '../assets/imagesOMDA.png';
import {
  Lock, User, Eye, EyeOff, Crown, LogIn,
  Menu, X, AlertCircle
} from 'lucide-react';

const Authentification = () => {
  const navigate = useNavigate();

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

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    setIsFormValid(username.trim() !== '' && password.trim() !== '');
  }, [username, password]);

  const handleUsernameChange = (e) => setUsername(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.adminToken || ('user_' + data.user.id + '_' + Date.now()));
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.nom);
        localStorage.setItem('userId', data.user.id);
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        alert(`❌ ${data.message || 'Identifiants incorrects'}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('❌ Erreur de connexion au serveur.');
      setIsLoading(false);
    }
  };

  const openAdminPanel = () => {
    setShowAdminPasswordModal(true);
  };

  const verifyAdminPassword = async () => {
    if (!adminPasswordInput || adminPasswordInput.length !== 4) {
      alert('Veuillez entrer un code à 4 chiffres');
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setAdminToken(data.token);
        setShowAdminPasswordModal(false);
        setShowAdminPanel(true);
        setAdminPasswordInput('');
        setShowAdminPassword(false);
      } else {
        alert('Mot de passe incorrect');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur de vérification');
    }
  };

  const sectionContent = {
    home: {
      title: "Bienvenue à l'OMDA",
      description: "L'Office Malagasy du Droit d'Auteur est l'institution publique chargée de la gestion et de la protection des droits d'auteur à Madagascar. Créé en 1984, il œuvre pour la reconnaissance et la rémunération des créateurs.",
      subtext: "Notre mission : protéger les œuvres, collecter et répartir les droits, sensibiliser le public et lutter contre la contrefaçon."
    },
    features: {
      title: "Nos services",
      description: "L'OMDA propose une gamme de services dédiés aux auteurs, artistes et créateurs malgaches : enregistrement des œuvres, perception des droits, conseil juridique, et bien plus.",
      subtext: "Nous accompagnons les créateurs à chaque étape de leur carrière, de la protection de leurs œuvres à la perception des redevances."
    },
    about: {
      title: "À propos de l'OMDA",
      description: "Créé en 1984 par le décret n°84-389, l'OMDA est un Établissement Public à Caractère Industriel et Commercial (EPIC). Placé sous la tutelle du Ministère de la Communication et de la Culture, il est un acteur clé du paysage culturel malgache.",
      subtext: "Notre équipe est dédiée à la promotion et à la défense des droits des auteurs, et nous collaborons avec des partenaires nationaux et internationaux pour renforcer notre action."
    },
    service: {
      title: "Nos prestations",
      description: "Nous offrons des prestations sur mesure pour les auteurs, les éditeurs, les producteurs et les utilisateurs d'œuvres. Enregistrement, gestion des contrats, médiation, formation.",
      subtext: "Nous mettons à disposition des outils et des conseils pour vous aider à protéger et valoriser votre création."
    },
    contact: {
      title: "Contactez-nous",
      description: "Nous sommes à votre écoute pour toute question relative au droit d'auteur. N'hésitez pas à nous contacter par téléphone, email ou en visitant nos locaux.",
      subtext: "Adresse : Lot II F 62, Rue Fredy Rajaofera, Antaninandro, Antananarivo 101. Tél : 261 20 22 610 19. Email : omda@moov.mg"
    }
  };

  const currentContent = sectionContent[activeSection] || sectionContent.home;

  return (
    <div className="auth-landing">
      <div className="landing-bg"></div>

      <div className="landing-container">
        <header className="landing-header">
          <div className="header-left">
            <img src={omdaLogo} alt="OMDA" className="logo" />
            <span className="brand-name">OMDA</span>
          </div>
          <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
            <a href="#" onClick={() => setActiveSection('home')} className={activeSection === 'home' ? 'active' : ''}>Accueil</a>
            <a href="#" onClick={() => setActiveSection('features')} className={activeSection === 'features' ? 'active' : ''}>Fonctionnalités</a>
            <a href="#" onClick={() => setActiveSection('about')} className={activeSection === 'about' ? 'active' : ''}>À propos</a>
            <a href="#" onClick={() => setActiveSection('service')} className={activeSection === 'service' ? 'active' : ''}>Services</a>
            <a href="#" onClick={() => setActiveSection('contact')} className={activeSection === 'contact' ? 'active' : ''}>Contact</a>
          </nav>
          <div className="header-right">
            <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
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
                <button className="admin-trigger" onClick={openAdminPanel}>
                  <Crown size={14} /> Accès Super Admin
                </button>
              </div>
            </div>

            <div className="login-panel">
              <div className="login-card">
                <div className="login-card-header">
                  <Lock size={24} className="login-icon" />
                  <h2>Authentification</h2>
                  <p className="login-subtitle">Connectez-vous à votre espace</p>
                </div>

                <form className="login-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-group">
                    <label><User size={14} /> Identifiant</label>
                    <input
                      type="text"
                      placeholder="Votre email "
                      className="input-field"
                      value={username}
                      onChange={handleUsernameChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label><Lock size={14} /> Mot de passe</label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Votre mot de passe"
                        className="input-field"
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={isLoading}
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
                    className={`login-btn ${(!isFormValid || isLoading) ? 'disabled' : ''}`}
                    onClick={handleLogin}
                    disabled={!isFormValid || isLoading}
                  >
                    {isLoading ? 'Connexion en cours…' : (
                      <>
                        <LogIn size={18} /> LOGIN
                      </>
                    )}
                  </button>

                  <button
                    className="create-account-btn"
                    onClick={() => navigate('/register')}
                    type="button"
                  >
                    Créer un compte
                  </button>
                </form>

                <div className="login-footer">
                  <div className="help-row">
                    <AlertCircle size={14} />
                    <span>Besoin d'aide ?</span>
                    <a href="mailto:omda@moov.mg">omda@moov.mg</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="landing-footer">
          <p>&copy; 2026 OMDA – Office Malagasy du Droit d'Auteur</p>
        </footer>
      </div>

      {showAdminPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <Crown size={24} />
              <h3>Accès Super Administrateur</h3>
            </div>
            <p className="modal-subtitle">Entrez le code à 4 chiffres</p>
            <div className="admin-password-wrapper">
              <input
                type={showAdminPassword ? "text" : "password"}
                maxLength="4"
                pattern="[0-9]*"
                inputMode="numeric"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="• • • •"
                className="admin-password-input"
                autoFocus
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
              <button className="btn-validate" onClick={verifyAdminPassword}>Valider</button>
              <button className="btn-cancel" onClick={() => {
                setShowAdminPasswordModal(false);
                setAdminPasswordInput('');
                setShowAdminPassword(false);
              }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showAdminPanel && (
        <AdminPanel
          onClose={() => {
            setShowAdminPanel(false);
            localStorage.removeItem('adminToken');
          }}
          adminToken={adminToken}
        />
      )}
    </div>
  );
};

export default Authentification;