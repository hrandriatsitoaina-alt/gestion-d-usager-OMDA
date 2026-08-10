// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';
import omdaLogo from '../assets/imagesOMDA.png';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    confirm_mot_de_passe: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!formData.mot_de_passe || formData.mot_de_passe.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères');
      return false;
    }
    if (formData.mot_de_passe !== formData.confirm_mot_de_passe) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      nom: formData.nom,
      email: formData.email,
      mot_de_passe: formData.mot_de_passe
    };

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Compte créé avec succès ! Vous allez être redirigé vers la page de connexion.');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError(data.message || 'Erreur lors de la création du compte.');
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setError('Impossible de contacter le serveur. Vérifie qu\'il est bien lancé sur http://localhost:3001.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-bg"></div>
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <img src={omdaLogo} alt="OMDA" className="register-logo" />
            <h1>Créer un compte</h1>
            <p className="register-subtitle">Rejoignez l'Office Malagasy du Droit d'Auteur</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label><User size={16} /> Nom complet</label>
              <input
                type="text"
                name="nom"
                placeholder="Votre nom et prénom"
                value={formData.nom}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label><Mail size={16} /> Email</label>
              <input
                type="email"
                name="email"
                placeholder="exemple@domaine.mg"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label><Lock size={16} /> Mot de passe</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="mot_de_passe"
                  placeholder="Au moins 4 caractères"
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  disabled={isLoading}
                   maxLength="4"   // ← ajout
                  required
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

            <div className="form-group">
              <label><Lock size={16} /> Confirmer le mot de passe</label>
              <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_mot_de_passe"
                placeholder="4 chiffres"
                value={formData.confirm_mot_de_passe}
                onChange={handleChange}
                disabled={isLoading}
                maxLength="4"   // ← ajout
                required
              />
                <button
                  type="button"
                  className="toggle-pwd"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button
              type="submit"
              className={`register-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Création en cours...' : 'S\'inscrire'}
            </button>

            <div className="register-footer">
              <span>Vous avez déjà un compte ?</span>
              <button
                type="button"
                className="login-link"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={16} /> Se connecter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;