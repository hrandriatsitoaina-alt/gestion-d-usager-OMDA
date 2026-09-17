// src/pages/base_de_donnees.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useParametres } from '../context/ParametreContext';
import {
  Database, Download, Upload, RefreshCw, HardDrive, Clock,
  FolderOpen, Check, Loader2, ArrowLeft, CalendarClock,
  ShieldCheck, History, X, Folder,
  Table, HardDrive as HardDriveIcon
} from 'lucide-react';
import '../styles/base_de_donnees.css';

const API_BASE = 'http://localhost:3001/api';

function getUtilisateurId() {
  try {
    const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user');
    if (raw) return JSON.parse(raw).id;
  } catch (e) { /* ignore */ }
  return localStorage.getItem('userId') || null;
}

const BaseDeDonnees = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const { parametres } = useParametres();
  const userId = getUtilisateurId();

  const [loading, setLoading] = useState(true);
  const [dbSize, setDbSize] = useState('0 MB');
  const [dbTables, setDbTables] = useState(0);
  const [dossierBackup, setDossierBackup] = useState('');
  const [infoDossier, setInfoDossier] = useState({ nombreFichiers: 0, tailleTotale: '0 MB' });
  const [historique, setHistorique] = useState([]);

  const [isBackingUpManuel, setIsBackingUpManuel] = useState(false);
  const [isBackingUpAuto, setIsBackingUpAuto] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [fichierRestore, setFichierRestore] = useState(null);

  // Styles dynamiques
  const styles = {
    fontFamily: parametres.police !== 'default' ? parametres.police : 'inherit',
    fontSize: parametres.tailleTexte === 'small' ? '13px' : 
              parametres.tailleTexte === 'medium' ? '15px' :
              parametres.tailleTexte === 'large' ? '18px' : '21px'
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      
      // Taille de la DB
      const dbRes = await fetch(`${API_BASE}/database/size`);
      const dbData = await dbRes.json();
      if (dbData && dbData.success) {
        setDbSize(dbData.size || '0 MB');
      }
      
      // Info dossier backup
      const dossierRes = await fetch(`${API_BASE}/backup/dossier-info`);
      const dossierData = await dossierRes.json();
      if (dossierData && dossierData.success) {
        setDossierBackup(dossierData.dossier || '');
        setInfoDossier({
          nombreFichiers: dossierData.nombreFichiers || 0,
          tailleTotale: dossierData.tailleTotale || '0 MB'
        });
      }
      
      // Historique - LES PLUS RÉCENTS EN PREMIER (déjà trié par le backend)
      const histoRes = await fetch(`${API_BASE}/backup/historique`);
      const histoData = await histoRes.json();
      if (histoData && histoData.success) {
        setHistorique(histoData.historique || []);
      }
      
      // Nombre de tables
      try {
        const tablesRes = await fetch(`${API_BASE}/parametres/db-tables-count`);
        const tablesData = await tablesRes.json();
        if (tablesData && tablesData.success) {
          setDbTables(tablesData.count || 0);
        }
      } catch (e) {}
      
    } catch (error) {
      console.error('Erreur chargement:', error);
      showToast('Erreur de chargement des informations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ============================================================
  // Sauvegarde manuelle
  // ============================================================
  const handleBackupManuel = async () => {
    setIsBackingUpManuel(true);
    try {
      const res = await fetch(`${API_BASE}/backup/manuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      
      showToast(data.message || (data.success ? '✅ Sauvegarde manuelle effectuée' : '❌ Échec'), data.success ? 'success' : 'error');
      
      if (data.success) {
        await fetchAll(); // Attendre que le refresh soit terminé
        console.log('🔔 Sauvegarde manuelle terminée:', data.chemin);
      }
    } catch (error) {
      showToast('❌ Erreur de connexion', 'error');
    } finally {
      setIsBackingUpManuel(false);
    }
  };

  // ============================================================
  // Sauvegarde automatique (test manuel)
  // ============================================================
  const handleBackupAuto = async () => {
    setIsBackingUpAuto(true);
    try {
      const res = await fetch(`${API_BASE}/backup/auto`, { method: 'POST' });
      const data = await res.json();
      
      showToast(data.message || (data.success ? '✅ Sauvegarde automatique effectuée' : '❌ Échec'), data.success ? 'success' : 'error');
      
      if (data.success) {
        await fetchAll(); // Attendre que le refresh soit terminé
        console.log('🔔 Sauvegarde auto terminée');
      }
    } catch (error) {
      showToast('❌ Erreur de connexion', 'error');
    } finally {
      setIsBackingUpAuto(false);
    }
  };

  // ============================================================
  // Restauration
  // ============================================================
  const handleRestore = async () => {
    if (!fichierRestore) {
      showToast('Veuillez sélectionner un fichier .sql', 'error');
      return;
    }
    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('backup', fichierRestore);
      formData.append('userId', userId || '');
      const res = await fetch(`${API_BASE}/backup/restore`, { method: 'POST', body: formData });
      const data = await res.json();
      showToast(data.message || (data.success ? '✅ Restauration effectuée' : '❌ Échec'), data.success ? 'success' : 'error');
      if (data.success) {
        setShowRestoreModal(false);
        setFichierRestore(null);
        await fetchAll(); // Attendre que le refresh soit terminé
        console.log('🔔 Restauration terminée');
      }
    } catch (error) {
      showToast('❌ Erreur de connexion', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleTelecharger = (type) => {
    window.open(`${API_BASE}/backup/telecharger/${type}`, '_blank');
  };

  // ============================================================
  // Formater la date
  // ============================================================
  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return date;
    }
  };

  // ============================================================
  // Formater la taille
  // ============================================================
  const formatTaille = (octets) => {
    if (!octets || octets === 0) return '-';
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / 1024 / 1024).toFixed(2)} Mo`;
  };

  if (loading) {
    return (
      <div className="bdd-loading" style={styles}>
        <Loader2 size={48} className="spinner" />
        <p>Chargement des informations...</p>
      </div>
    );
  }

  return (
    <div className="bdd-container" style={styles}>
      {/* En-tête */}
      <div className="bdd-header">
        <button className="btn-back" onClick={() => navigate('/Parametre_global')}>
          <ArrowLeft size={20} /> Retour
        </button>
        <h1 style={{ color: 'var(--primary-color)' }}>
          <Database size={28} /> Gestion de la base de données
        </h1>
        <button className="btn-refresh" onClick={fetchAll}><RefreshCw size={18} /></button>
      </div>

      {/* Statistiques */}
      <div className="bdd-grid">
        <div className="bdd-card" style={{ borderLeftColor: 'var(--primary-color)' }}>
          <div className="bdd-card-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
            <HardDriveIcon size={22} />
          </div>
          <div>
            <span className="bdd-card-title">Taille de la base</span>
            <span className="bdd-card-value">{dbSize}</span>
          </div>
        </div>
        <div className="bdd-card" style={{ borderLeftColor: '#3498db' }}>
          <div className="bdd-card-icon" style={{ backgroundColor: '#3498db20', color: '#3498db' }}>
            <Table size={22} />
          </div>
          <div>
            <span className="bdd-card-title">Nombre de tables</span>
            <span className="bdd-card-value">{dbTables}</span>
          </div>
        </div>
        <div className="bdd-card" style={{ borderLeftColor: '#2ecc71' }}>
          <div className="bdd-card-icon" style={{ backgroundColor: '#2ecc7120', color: '#2ecc71' }}>
            <CalendarClock size={22} />
          </div>
          <div>
            <span className="bdd-card-title">Sauvegarde auto</span>
            <span className="bdd-card-value-small">Tous les vendredis à 9h</span>
          </div>
        </div>
        <div className="bdd-card" style={{ borderLeftColor: '#f39c12' }}>
          <div className="bdd-card-icon" style={{ backgroundColor: '#f39c1220', color: '#f39c12' }}>
            <Folder size={22} />
          </div>
          <div>
            <span className="bdd-card-title">Fichiers sauvegardés</span>
            <span className="bdd-card-value">{infoDossier.nombreFichiers}</span>
            <span className="bdd-card-value-small" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {infoDossier.tailleTotale}
            </span>
          </div>
        </div>
      </div>

      {/* Dossier de sauvegarde */}
      <div className="bdd-section" style={{ borderColor: 'var(--border-color)' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>
          <FolderOpen size={20} /> Dossier de sauvegarde
        </h3>
        
        <div className="bdd-info-banner success" style={{ backgroundColor: '#27ae6020', color: '#27ae60' }}>
          <ShieldCheck size={18} />
          <span>
            📁 Sauvegardes stockées dans : <strong>{dossierBackup || 'Chargement...'}</strong>
          </span>
        </div>
        
        <div className="bdd-backup-info" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '12px'
        }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📄 Fichier manuel</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              omda_backup_manuel.sql
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Écrase à chaque sauvegarde</div>
          </div>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🔄 Fichier automatique</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              omda_backup_auto.sql
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Écrase à chaque sauvegarde</div>
          </div>
        </div>
      </div>

      {/* Actions de sauvegarde */}
      <div className="bdd-section" style={{ borderColor: 'var(--border-color)' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>
          <Download size={20} /> Sauvegardes
        </h3>
        <div className="bdd-actions-grid">
          <div className="bdd-action-card" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-primary)' }}>📥 Sauvegarde manuelle</h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              Génère un export SQL complet de la base. Écrase le fichier précédent.
            </p>
            <div className="bdd-action-buttons">
              <button className="btn-primary" onClick={handleBackupManuel} disabled={isBackingUpManuel}>
                {isBackingUpManuel ? <><Loader2 size={18} className="spinner" /> En cours...</> : <><Download size={18} /> Sauvegarder</>}
              </button>
              <button className="btn-secondary" onClick={() => handleTelecharger('manuel')}>
                <Download size={16} /> Télécharger
              </button>
            </div>
          </div>

          <div className="bdd-action-card" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-primary)' }}>🔄 Sauvegarde auto (vendredi)</h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              S'exécute automatiquement chaque vendredi à 9h. Écrase le fichier précédent.
            </p>
            <div className="bdd-action-buttons">
              <button className="btn-secondary" onClick={handleBackupAuto} disabled={isBackingUpAuto}>
                {isBackingUpAuto ? <><Loader2 size={18} className="spinner" /> En cours...</> : <><RefreshCw size={18} /> Tester</>}
              </button>
              <button className="btn-secondary" onClick={() => handleTelecharger('auto')}>
                <Download size={16} /> Télécharger
              </button>
            </div>
          </div>

          <div className="bdd-action-card" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-primary)' }}>↩️ Restauration</h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              Importe un fichier .sql pour restaurer la base de données.
            </p>
            <div className="bdd-action-buttons">
              <button className="btn-danger" onClick={() => setShowRestoreModal(true)}>
                <Upload size={18} /> Restaurer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historique - CORRIGÉ : Affichage du plus récent en haut */}
      <div className="bdd-section" style={{ borderColor: 'var(--border-color)' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>
          <History size={20} /> Historique des sauvegardes
          <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '10px' }}>
            ({historique.length} entrée{historique.length > 1 ? 's' : ''})
          </span>
        </h3>
        <div className="bdd-historique-list" style={{ borderColor: 'var(--border-color)' }}>
          <div className="bdd-historique-header" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <span>Type</span>
            <span>Fichier</span>
            <span>Taille</span>
            <span>Statut</span>
            <span>Date</span>
          </div>
          {historique.map((h, index) => (
            <div 
              className="bdd-historique-row" 
              key={h.id} 
              style={{ 
                borderColor: 'var(--border-color)',
                backgroundColor: index === 0 ? 'var(--primary-light)' : 'transparent',
                fontWeight: index === 0 ? '500' : 'normal'
              }}
            >
              <span className={`bdd-type-badge bdd-type-${h.type_backup}`}>
                {h.type_backup === 'manuel' ? '📥 Manuel' : 
                 h.type_backup === 'auto' ? '🔄 Auto' : 
                 h.type_backup === 'restauration' ? '↩️ Restauration' : h.type_backup}
              </span>
              <span title={h.chemin_complet || 'N/A'}>{h.nom_fichier || '-'}</span>
              <span>{formatTaille(h.taille_octets)}</span>
              <span className={`bdd-statut-badge bdd-statut-${h.statut}`}>
                {h.statut === 'succes' ? '✅ Succès' : h.statut === 'echec' ? '❌ Échec' : h.statut}
              </span>
              <span>{formatDate(h.created_at)}</span>
            </div>
          ))}
          {historique.length === 0 && (
            <div className="empty-state" style={{ color: 'var(--text-muted)', padding: '30px', textAlign: 'center' }}>
              Aucune sauvegarde effectuée
            </div>
          )}
        </div>
      </div>

      {/* Modal restauration */}
      {showRestoreModal && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="modal-header" style={{ borderColor: 'var(--border-color)' }}>
              <h2 style={{ color: 'var(--text-primary)' }}>
                <Upload size={24} /> Restaurer une sauvegarde
              </h2>
              <button className="modal-close" onClick={() => setShowRestoreModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <p className="bdd-warning-text" style={{ backgroundColor: '#f39c1220', color: '#d68910', padding: '12px', borderRadius: '8px' }}>
                ⚠️ Cette opération remplace les données actuelles. Action irréversible.
              </p>
              <input 
                type="file" 
                accept=".sql" 
                onChange={(e) => setFichierRestore(e.target.files[0])} 
                className="form-input"
                style={{ 
                  padding: '12px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  width: '100%',
                  marginTop: '12px'
                }}
              />
              {fichierRestore && (
                <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  📎 Fichier sélectionné : <strong>{fichierRestore.name}</strong> ({(fichierRestore.size / 1024).toFixed(1)} Ko)
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ borderColor: 'var(--border-color)' }}>
              <button className="btn-cancel" onClick={() => setShowRestoreModal(false)}>Annuler</button>
              <button className="btn-confirm" onClick={handleRestore} disabled={isRestoring}>
                {isRestoring ? <><Loader2 size={18} className="spinner" /> Restauration...</> : <><Upload size={18} /> Restaurer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseDeDonnees;