import React, { useState } from 'react';
import '../styles/Authentification.css';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';
import AdminPanel from './AdminPanel';
import omdaLogo from '../assets/imagesOMDA.png'; 

const Authentification = () => {
    const navigate = useNavigate();
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [currentPage, setCurrentPage] = useState('sync');
    const [serverStatusText, setServerStatusText] = useState('Recherche du serveur...');
    const [selectedNetworkName, setSelectedNetworkName] = useState('Aucun');
    const [connectedNetwork, setConnectedNetwork] = useState(null);
    
    // États pour le formulaire de login
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // États pour le Super Admin Panel
    const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
    const [adminPasswordInput, setAdminPasswordInput] = useState('');
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [adminToken, setAdminToken] = useState(null);
    const [showAdminPanel, setShowAdminPanel] = useState(false);

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

    // Fonction pour connecter à un réseau (simulé)
    const connectToNetwork = (networkName, btnElement) => {
        setServerStatusText(`Connexion à ${networkName}...`);
        
        setTimeout(() => {
            setSelectedNetwork(networkName);
            setSelectedNetworkName(networkName);
            setServerStatusText(`Connecté à ${networkName} - Serveur prêt`);
            
            btnElement.textContent = 'Connecté ✓';
            btnElement.style.background = '#2ecc71';
            btnElement.style.color = 'white';
            btnElement.disabled = true;
        }, 1500);
    };

    // Fonction pour passer à l'authentification
    const goToAuthPage = () => {
        if (!selectedNetwork) {
            alert('Veuillez d\'abord sélectionner un réseau !');
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
        setShowPassword(false);
    };

    // ============================================================
    // GESTIONNAIRE DE CONNEXION - AVEC SAUVEGARDE DU TOKEN
    // ============================================================
    const handleLogin = async () => {
        if (username.trim() === '' || password.trim() === '') {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        setIsLoading(true);
        
        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // ============================================
                // SAUVEGARDER LE TOKEN ADMIN
                // ============================================
                if (data.adminToken) {
                    localStorage.setItem('adminToken', data.adminToken);
                    console.log('✅ Token Admin sauvegardé:', data.adminToken);
                } else {
                    // Pour les utilisateurs normaux, créer un token temporaire
                    const tempToken = 'user_' + data.user.id + '_' + Date.now();
                    localStorage.setItem('adminToken', tempToken);
                    console.log('✅ Token Utilisateur sauvegardé:', tempToken);
                }
                
                // Stocker les informations utilisateur
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('userName', data.user.nom);
                localStorage.setItem('userId', data.user.id);
                
                console.log('✅ Connexion réussie:', data.user.nom, 'Rôle:', data.user.role);
                
                setTimeout(() => {
                    navigate('/dashboard');
                }, 500);
            } else {
                alert(`❌ ${data.message || 'Identifiants incorrects'}`);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            alert('❌ Erreur de connexion au serveur.\n\nVérifiez que le serveur backend est démarré :\nnode src/server/server.js');
            setIsLoading(false);
        }
    };

    // ============================================================
    // ACCÈS SUPER ADMIN PANEL
    // ============================================================
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
            console.error('Erreur:', error);
            alert('Erreur de vérification');
        }
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

                            {/* Bouton Accès Super Admin - visible après connexion réseau */}
                            {selectedNetwork && (
                                <div className="admin-link-container">
                                    <button className="admin-link-btn" onClick={openAdminPanel}>
                                        👑 Accès Super Admin
                                    </button>
                                </div>
                            )}

                            <hr className="divider" />
                        </div>
                    </div>
                )}

                {/* PAGE 2 : AUTHENTIFICATION */}
                {currentPage === 'auth' && (
                    <div className="page-auth">
                        <div className="sauth1">
                            <div className="logo-wrapper">
                                <div className="ip1"><img src={omdaLogo} alt="OMDA Logo" className=""/></div>
                                <h1>OMDA</h1>
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
                                        placeholder="Nom d'utilisateur ou Email" 
                                        className="input-field" 
                                        id="username"
                                        value={username}
                                        onChange={handleUsernameChange}
                                        disabled={isLoading}
                                    />
                                    
                                    <legend>🔒 Mot de passe</legend><br />
                                    <div className="password-wrapper">
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="Mot de passe" 
                                            className="input-field password-input" 
                                            id="password"
                                            value={password}
                                            onChange={handlePasswordChange}
                                            disabled={isLoading}
                                        />
                                        <button 
                                            type="button" 
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                    
                                    <button 
                                        className={`btn-login ${(!isFormValid || isLoading) ? 'disabled' : ''}`}
                                        onClick={handleLogin}
                                        disabled={!isFormValid || isLoading}
                                    >
                                        {isLoading ? '⏳ Connexion...' : 'Se connecter'}
                                    </button><br /><br />
                                    
                                    <button className="btn-back" onClick={goToSyncPage} disabled={isLoading}>
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
                                        <hr />
                                        <p style={{fontSize: '11px', marginTop: '8px'}}>
                                            <strong>Comptes de test:</strong><br />
                                            ⭐ Super Admin: superadmin@omda.mg / 1234<br />
                                            👑 Admin: admin@omda.mg / admin123<br />
                                            👤 User: user@omda.mg / user123
                                        </p>
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

            {/* Modal pour le mot de passe Super Admin */}
            {showAdminPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <h3>🔐 Accès Super Administrateur</h3>
                        <p>Entrez le mot de passe à 4 chiffres</p>
                        <div className="password-wrapper-modal">
                            <input 
                                type={showAdminPassword ? "text" : "password"} 
                                maxLength="4" 
                                pattern="[0-9]*" 
                                inputMode="numeric"
                                value={adminPasswordInput}
                                onChange={(e) => setAdminPasswordInput(e.target.value)}
                                placeholder="- - - -"
                                className="admin-password-input"
                                autoFocus
                            />
                            <button 
                                type="button" 
                                className="password-toggle-modal"
                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                            >
                                {showAdminPassword ? '🔐' : '👁️'}
                            </button>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={verifyAdminPassword}>✅ Valider</button>
                            <button onClick={() => { 
                                setShowAdminPasswordModal(false); 
                                setAdminPasswordInput('');
                                setShowAdminPassword(false);
                            }}>❌ Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Panel */}
            {showAdminPanel && (
                <AdminPanel 
                    onClose={() => {
                        setShowAdminPanel(false);
                        localStorage.removeItem('adminToken');
                    }} 
                    adminToken={adminToken}
                />
            )}
        </>
    );
};

export default Authentification;