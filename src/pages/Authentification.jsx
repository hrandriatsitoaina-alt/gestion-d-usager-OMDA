import React, { useState } from 'react';
import '../styles/Authentification.css';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

import omdaLogo from '../assets/imagesOMDA.png'; 


const Authentification = () => {
    const navigate = useNavigate();
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [currentPage, setCurrentPage] = useState('sync');
    const [serverStatusText, setServerStatusText] = useState('Recherche du serveur...');
    const [successMessage, setSuccessMessage] = useState('⏳ Sélectionnez un réseau puis cliquez sur "Serveur OK"');
    const [selectedNetworkName, setSelectedNetworkName] = useState('Aucun');
    const [connectedNetwork, setConnectedNetwork] = useState(null);
    
    // États pour le formulaire
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isFormValid, setIsFormValid] = useState(false);

    // Vérifier si le formulaire est valide
    const checkFormValidity = (user, pass) => {
        setIsFormValid(user.trim() !== '' && pass.trim() !== '');
    };

    // Gestionnaire changement username
    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        checkFormValidity(value, password);
    };

    // Gestionnaire changement password
    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        checkFormValidity(username, value);
    };

    // Fonction pour connecter à un réseau
    const connectToNetwork = (networkName, btnElement) => {
        setSuccessMessage(`🔌 Connexion à ${networkName} en cours...`);
        setServerStatusText(`🔄 Connexion à ${networkName}...`);
        
        setTimeout(() => {
            setSelectedNetwork(networkName);
            setSelectedNetworkName(networkName);
            setServerStatusText(`✅ Connecté à ${networkName} - Serveur prêt`);
            setSuccessMessage(`✅ Connecté à ${networkName}. Cliquez sur "Serveur OK" pour continuer.`);
            
            btnElement.textContent = 'Connecté ✓';
            btnElement.style.background = '#2ecc71';
            btnElement.style.color = 'white';
            btnElement.disabled = true;
        }, 1500);
    };

    // Fonction pour passer à l'authentification
    const goToAuthPage = () => {
        if (!selectedNetwork) {
            setSuccessMessage('❌ Veuillez d\'abord sélectionner un réseau !');
            setTimeout(() => {
                setSuccessMessage('⏳ Sélectionnez un réseau puis cliquez sur "Serveur OK"');
            }, 3000);
            return;
        }
        setConnectedNetwork(selectedNetwork);
        setCurrentPage('auth');
    };

    // Fonction pour revenir à la synchronisation
    const goToSyncPage = () => {
        setCurrentPage('sync');
        setUsername('');
        setPassword('');
        setIsFormValid(false);
    };

    // Gestionnaire de connexion - Redirection vers Dashboard
    const handleLogin = () => {
        if (username.trim() === '' || password.trim() === '') {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        // Connexion réussie - Redirection vers Dashboard
        alert(`Bienvenue ${username} ! Connexion réussie sur le réseau ${connectedNetwork}.`);
        navigate('/dashboard');
    };

    return (
        <>
            <Header />
            <Sidebar />
            <MiniSidebar />
            
            <main className="contenu">
                {/* PAGE 1 : SYNCHRONISATION */}
                {currentPage === 'sync' && (
                    <div className="page-sync">
                        <div className="sauth2">
                            <h1>🔄 Synchronisation BD</h1>
                            
                            <div className="sync-container">
                                <div className="sync-left">
                                    <div className="sync-status">
                                        <h3>📡 Connexion à la base de données</h3>
                                        <div className="network-indicator">
                                            <div className="round">
                                                <div className="ro"></div>
                                                <div className="wifi-points">
                                                    <span className="point"></span>
                                                    <span className="point"></span>
                                                    <span className="point"></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="network-text">
                                            <h3>🌐 Veillez à être connecté au même réseau</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="sync-right">
                                    <div className="network-suggestions">
                                        <h4>📡 Réseaux disponibles :</h4>
                                        <div className="network-list">
                                            {['OMDA-Server', 'Bureau-OMDA', 'OMDA-Portable', 'IT-Office-Secure'].map((network, idx) => (
                                                <div className="network-item" key={idx} data-network={network}>
                                                    <span className="network-icon">📶</span>
                                                    <span className="network-name">{network}</span>
                                                    <span className={`network-signal ${idx === 0 ? 'strong' : idx === 1 ? 'medium' : 'weak'}`}>
                                                        {idx === 0 ? '●●●' : idx === 1 ? '●●○' : '●○○'}
                                                    </span>
                                                    <button 
                                                        className="connect-btn"
                                                        onClick={(e) => connectToNetwork(network, e.target)}
                                                    >
                                                        Connecter
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ipo">
                                <div className="led red"></div>
                                <div className="led blue"></div>
                                <div className="led green"></div>
                                <span className="server-status">{serverStatusText}</span>
                            </div>

                            <div className="selected-network-info">
                                <span className="label">📌 Réseau sélectionné :</span>
                                <span className="value">{selectedNetworkName}</span>
                            </div>

                            <button className="btn-server-ok" onClick={goToAuthPage}>
                                ✅ Serveur OK - Passer à l'authentification
                            </button>

                            <hr className="divider" />
                            <h4 className="success-message">{successMessage}</h4>
                        </div>
                    </div>
                )}

                {/* PAGE 2 : AUTHENTIFICATION */}
                {currentPage === 'auth' && (
                    <div className="page-auth">
                        <div className="sauth1">
                            <div className="logo-wrapper">
                                <div className="ip1"><img src={omdaLogo} alt="OMDA Logo"className=""/></div>
                                
                                <h1>OMDA</h1>
                            </div>
                            
                            <div className="server-connection-status">
                                <div className="status-indicator connected">
                                    <span className="status-dot connected-dot"></span>
                                    <span className="status-text">Serveur connecté ✅</span>
                                </div>
                            </div>
                            
                            <div className="network-info-auth">
                                <span className="label">🔗 Réseau connecté :</span>
                                <span className="value">{connectedNetwork}</span>
                            </div>
                            
                            <div className="auth-form-container">
                                <div className="auth-form-left">
                                    <legend>🔐 Identification</legend><br />
                                    <input 
                                        type="text" 
                                        placeholder="Nom d'utilisateur" 
                                        className="input-field" 
                                        id="username"
                                        value={username}
                                        onChange={handleUsernameChange}
                                    />
                                    
                                    <legend>🔒 Mot de passe</legend><br />
                                    <input 
                                        type="password" 
                                        placeholder="Mot de passe" 
                                        className="input-field" 
                                        id="password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                    />
                                    
                                    <button 
                                        className={`btn-login ${!isFormValid ? 'disabled' : ''}`}
                                        onClick={handleLogin}
                                        disabled={!isFormValid}
                                    >
                                        Se connecter
                                    </button><br /><br />
                                    
                                    <button className="btn-back" onClick={goToSyncPage}>
                                        ← Retour à la synchronisation
                                    </button>
                                </div>
                                
                                <div className="auth-form-right">
                                    <div className="info-card">
                                        <h4>📋 Informations de connexion</h4>
                                        <div className="info-item">
                                            <span className="info-icon">🖥️</span>
                                            <span className="info-text">Poste: Bureau OMDA</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-icon">🌐</span>
                                            <span className="info-text">Réseau: <span>{connectedNetwork}</span></span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-icon">⏱️</span>
                                            <span className="info-text">Dernière connexion: Aujourd'hui</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-icon">🔐</span>
                                            <span className="info-text">Connexion sécurisée</span>
                                        </div>
                                    </div>
                                    <div className="help-card">
                                        <h4>❓ Besoin d'aide ?</h4>
                                        <p>Contactez l'administrateur au <strong>omda@moov.mg</strong></p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="login-footer">
                                <hr />
                                <div>
                                    <h6>Office Malagasy du Droit d'Auteur</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
};

export default Authentification;