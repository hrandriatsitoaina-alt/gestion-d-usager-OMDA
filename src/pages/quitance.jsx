// src/pages/quitance.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  X,
  CheckCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  Hash,
  Tag,
  AlertCircle,
  RefreshCw,
  MapPin,
  BookOpen,
  Building,
  Phone,
  Mail,
  Key,
  FileCheck,
  Briefcase,
  Percent,
  Home,
  ArrowLeft,
  Download,
  Loader2,
  UserPlus,
  Info
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/quitance.css';
import { generateQuitancePDF } from './pdf/quitance_pdf';

const Quitance = () => {
  // États principaux
  const [quittances, setQuittances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageCourante, setPageCourante] = useState(1);
  const [itemsParPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('toutes');
  const [regions, setRegions] = useState([]);
  const [stats, setStats] = useState(null);
  const [quittanceSelectionnee, setQuittanceSelectionnee] = useState(null);
  const [numeroCarnetDebut, setNumeroCarnetDebut] = useState('');
  const [numeroCarnetFin, setNumeroCarnetFin] = useState('');
  
  // États pour le PDF
  const [responsable, setResponsable] = useState('');
  const [lieuAgence, setLieuAgence] = useState('Antananarivo');
  const [dateDelivre, setDateDelivre] = useState(new Date().toLocaleDateString('fr-FR'));
  const [dateRetour, setDateRetour] = useState('');
  const [showPDFOptions, setShowPDFOptions] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');

  // Hook de navigation
  const navigate = useNavigate();
  const pdfOptionsRef = useRef(null);

  // URL absolue pour l'API
  const API_BASE = 'http://localhost:3001/api';

  // Récupérer les régions
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await axios.get(`${API_BASE}/regions`);
        if (response.data.success) {
          setRegions(response.data.regions || []);
        }
      } catch (err) {
        console.error('❌ Erreur récupération régions:', err);
      }
    };
    fetchRegions();
  }, []);

  // Récupérer les quittances
  useEffect(() => {
    fetchQuittances();
  }, [regionFilter]);

  // Fermer le menu PDF au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pdfOptionsRef.current && !pdfOptionsRef.current.contains(event.target)) {
        setShowPDFOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchQuittances = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/quitance/liste`;
      if (regionFilter !== 'toutes') {
        url = `${API_BASE}/quitance/region/${encodeURIComponent(regionFilter)}`;
      }
      
      console.log('📡 Récupération des quittances...');
      console.log('📡 URL:', url);
      
      const response = await axios.get(url);
      console.log('✅ Réponse reçue:', response.status);
      
      if (response.data.success) {
        const quittancesData = response.data.quittances || [];
        console.log(`✅ ${quittancesData.length} quittances récupérées`);
        setQuittances(quittancesData);
        
        if (quittancesData.length > 0) {
          setQuittanceSelectionnee(quittancesData[0]);
          
          // Calculer les numéros de carnet
          const premier = quittancesData[0]?.quittance || 0;
          const dernier = quittancesData[quittancesData.length - 1]?.quittance || 0;
          setNumeroCarnetDebut(String(premier).padStart(7, '0'));
          setNumeroCarnetFin(String(dernier).padStart(7, '0'));
        }
        
        // Récupérer les stats
        await fetchStats();
      } else {
        setError(response.data.message || 'Erreur lors du chargement des quittances');
      }
    } catch (err) {
      console.error('❌ Erreur détaillée récupération quittances:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError(`Route API non trouvée (404). Vérifiez que ${API_BASE}/quitance/liste existe.`);
        } else if (err.response.status === 500) {
          setError(`Erreur serveur (500): ${err.response.data?.message || 'Erreur interne'}`);
        } else {
          setError(`Erreur ${err.response.status}: ${err.response.data?.message || err.message}`);
        }
      } else if (err.request) {
        setError('Impossible de contacter le serveur. Vérifiez que le serveur est en cours d\'exécution.');
      } else {
        setError(`Erreur: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/quitance/stats`);
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('❌ Erreur récupération stats:', err);
    }
  };

  // Fonction de retour au dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Formater le numéro de quittance sur 7 chiffres
  const formatQuittance = (num) => {
    if (!num && num !== 0) return '';
    return String(num).padStart(7, '0');
  };

  // Formater le montant
  const formatMontant = (montant) => {
    if (!montant && montant !== 0) return '0';
    return new Intl.NumberFormat('fr-FR', {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  // Formater la date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const jour = String(date.getDate()).padStart(2, '0');
      const mois = String(date.getMonth() + 1).padStart(2, '0');
      const annee = date.getFullYear();
      return `${jour}/${mois}/${annee}`;
    } catch {
      return '';
    }
  };

  // Obtenir le nom du mois
  const getMonthName = (month) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month - 1] || '';
  };

  // Obtenir le label du type de client
  const getTypeLabel = (type) => {
    const labels = {
      'HTL': 'Hôtel',
      'MGS': 'Grande Surface',
      'RDP': 'Radio/Télé',
      'TRP': 'Transport',
      'NGT': 'Night Club',
      'OCC': 'Occasionnel'
    };
    return labels[type] || type || '-';
  };

  // Filtrer les quittances
  const filteredQuittances = quittances.filter(q => {
    const search = searchTerm.toLowerCase();
    return (
      (q.quittance && String(q.quittance).includes(search)) ||
      (q.num_facture && q.num_facture.toLowerCase().includes(search)) ||
      (q.denomination && q.denomination.toLowerCase().includes(search)) ||
      (q.demandeur && q.demandeur.toLowerCase().includes(search)) ||
      (q.region_usager && q.region_usager && q.region_usager.toLowerCase().includes(search)) ||
      (q.ref_client_type && q.ref_client_type.toLowerCase().includes(search)) ||
      (q.ref_usager && String(q.ref_usager).includes(search))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredQuittances.length / itemsParPage);
  const paginatedQuittances = filteredQuittances.slice(
    (pageCourante - 1) * itemsParPage,
    pageCourante * itemsParPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageCourante(newPage);
    }
  };

  const handleSelectQuittance = (quittance) => {
    setQuittanceSelectionnee(quittance);
  };

  // Générer les numéros de page
  const renderPageNumbers = () => {
    const numbers = [];
    const total = Math.min(filteredQuittances.length, 200);
    const start = Math.max(1, pageCourante - 5);
    const end = Math.min(total, pageCourante + 5);
    
    for (let i = start; i <= end; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  // Génération du PDF
  const handleGeneratePDF = () => {
    console.log('🔄 handleGeneratePDF appelé');
    console.log('📊 filteredQuittances:', filteredQuittances.length);
    console.log('📄 Page courante:', pageCourante);
  
    if (filteredQuittances.length === 0) {
      setGenerationMessage('⚠️ Aucune quittance à générer');
      setTimeout(() => setGenerationMessage(''), 3000);
      return;
    }
  
    if (!responsable || responsable.trim() === '') {
      setGenerationMessage('⚠️ Veuillez saisir le nom du responsable');
      setTimeout(() => setGenerationMessage(''), 3000);
      return;
    }
  
    setIsGeneratingPDF(true);
    setShowPDFOptions(false);
    setGenerationMessage('🔄 Génération du PDF en cours...');
  
    try {
      // Utiliser UNIQUEMENT les éléments de la page courante
      const currentPageItems = paginatedQuittances;
      
      console.log(`📄 Éléments de la page ${pageCourante}: ${currentPageItems.length}`);
  
      const regionLabel = regionFilter === 'toutes'
        ? 'Toutes les régions'
        : regionFilter;
  
      const pdfOptions = {
        carnetDebut: numeroCarnetDebut || '0000000',
        carnetFin: numeroCarnetFin || '0000000',
        responsable: responsable.trim(),
        lieu: lieuAgence || 'Antananarivo',
        region: regionLabel,
        dateDelivre: dateDelivre || new Date().toLocaleDateString('fr-FR'),
        dateRetour: dateRetour || '',
        pageCourante: pageCourante
      };
  
      console.log('📋 Options PDF:', pdfOptions);
  
      const result = generateQuitancePDF(currentPageItems, pdfOptions);
  
      if (result) {
        setGenerationMessage('✅ PDF généré avec succès !');
        setTimeout(() => setGenerationMessage(''), 4000);
      } else {
        setGenerationMessage('❌ Erreur lors de la génération du PDF');
        setTimeout(() => setGenerationMessage(''), 4000);
      }
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      setGenerationMessage(`❌ Erreur: ${error.message}`);
      setTimeout(() => setGenerationMessage(''), 4000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Rendu du header professionnel - MODIFIÉ AVEC FOND BLEU CIEL
  const renderHeader = () => (
    <div className="quittance-header-professionnel">
      <div className="header-top">
        <div className="header-logo">
          <BookOpen size={28} className="logo-icon" />
          <div>
            <h1>OMDA</h1>
            <span>Office Malgasy du Droit d'Auteur</span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-back-dashboard"
            onClick={handleBackToDashboard}
          >
            <ArrowLeft size={16} />
            <Home size={16} />
            <span>Retour Dashboard</span>
          </button>
          <button 
            className="btn-generate-pdf-header"
            onClick={() => setShowPDFOptions(!showPDFOptions)}
            disabled={filteredQuittances.length === 0 || isGeneratingPDF}
            style={{
              opacity: filteredQuittances.length === 0 || isGeneratingPDF ? 0.5 : 1,
              cursor: filteredQuittances.length === 0 || isGeneratingPDF ? 'not-allowed' : 'pointer'
            }}
          >
            {isGeneratingPDF ? (
              <><Loader2 size={16} className="spinner-small" /> Génération...</>
            ) : (
              <><FileText size={16} /> PDF</>
            )}
          </button>
        </div>
      </div>
      
      {/* Options PDF */}
      {showPDFOptions && (
        <div className="pdf-options-dropdown" ref={pdfOptionsRef}>
          <div className="pdf-options-content">
            <h4><FileText size={16} /> Options de génération PDF</h4>
            <div className="pdf-options-grid">
              <div className="pdf-option-group">
                <label>Responsable *</label>
                <input
                  type="text"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  placeholder="Nom du responsable"
                  className="pdf-input"
                />
              </div>
              <div className="pdf-option-group">
                <label>Lieu de l'agence</label>
                <input
                  type="text"
                  value={lieuAgence}
                  onChange={(e) => setLieuAgence(e.target.value)}
                  placeholder="Lieu"
                  className="pdf-input"
                />
              </div>
              <div className="pdf-option-group">
                <label>Date de délivrance</label>
                <input
                  type="text"
                  value={dateDelivre}
                  onChange={(e) => setDateDelivre(e.target.value)}
                  placeholder="jj/mm/aaaa"
                  className="pdf-input"
                />
              </div>
              <div className="pdf-option-group">
                <label>Date de retour</label>
                <input
                  type="text"
                  value={dateRetour}
                  onChange={(e) => setDateRetour(e.target.value)}
                  placeholder="jj/mm/aaaa"
                  className="pdf-input"
                />
              </div>
            </div>
            <div className="pdf-options-actions">
              <button 
                className="btn-pdf-generate"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF || !responsable.trim()}
              >
                {isGeneratingPDF ? (
                  <><Loader2 size={16} className="spinner-small" /> Génération...</>
                ) : (
                  <><Download size={16} /> Générer le PDF</>
                )}
              </button>
              <button 
                className="btn-pdf-cancel"
                onClick={() => setShowPDFOptions(false)}
              >
                Annuler
              </button>
            </div>
            {generationMessage && (
              <div className={`pdf-generation-message ${generationMessage.includes('✅') ? 'success' : generationMessage.includes('⚠️') ? 'warning' : 'info'}`}>
                {generationMessage}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Informations du carnet */}
      <div className="carnet-info">
        <div className="carnet-info-item">
          <BookOpen size={16} />
          <span className="carnet-label">Numéro de carnet :</span>
          <span className="carnet-value">{numeroCarnetDebut || '---'} à {numeroCarnetFin || '---'}</span>
        </div>
        <div className="carnet-info-item">
          <MapPin size={16} />
          <span className="carnet-label">Agence / Région :</span>
          <select 
            className="region-select"
            value={regionFilter}
            onChange={(e) => {
              setRegionFilter(e.target.value);
              setPageCourante(1);
            }}
          >
            <option value="toutes">Toutes les régions</option>
            {regions.map((region) => (
              <option key={region.id || region.nom} value={region.nom || region}>
                {region.nom || region}
              </option>
            ))}
          </select>
        </div>
        <div className="carnet-info-item">
          <Calendar size={16} />
          <span className="carnet-label">Date :</span>
          <span className="carnet-value">{new Date().toLocaleDateString('fr-FR')}</span>
        </div>
        {stats && (
          <div className="carnet-info-item stats-item">
            <span className="carnet-label">Total :</span>
            <span className="carnet-value total">{stats.totalGlobal || 0}</span>
            <span className="carnet-label">Montant :</span>
            <span className="carnet-value montant">{formatMontant(stats.montantGlobal)} Ar</span>
          </div>
        )}
      </div>

      <div className="header-search">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher par numéro, client, région..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageCourante(1);
            }}
          />
        </div>
        <span className="total-badge">
          <FileText size={14} />
          {filteredQuittances.length} quittance(s)
        </span>
        <button className="btn-refresh" onClick={fetchQuittances} title="Rafraîchir">
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );

  // Rendu de la vue historique
  const renderHistorique = () => (
    <div className="quittance-historique">
      <div className="historique-table-wrapper">
        <table className="historique-table">
          <thead>
            <tr>
              <th className="col-num"><Hash size={14} /> #</th>
              <th className="col-quittance"><Tag size={14} /> N° QUITTANCE</th>
              <th className="col-facture-num"><FileText size={14} /> N° FACTURE</th>
              <th className="col-type-client"><User size={14} /> TYPE</th>
              <th className="col-client"><User size={14} /> CLIENT</th>
              <th className="col-region"><MapPin size={14} /> RÉGION</th>
              <th className="col-montant"><DollarSign size={14} /> MONTANT</th>
              <th className="col-date"><Calendar size={14} /> DATE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading-cell">
                  <div className="spinner"></div>
                  Chargement des quittances...
                </td>
              </tr>
            ) : paginatedQuittances.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">
                  <FileText size={32} />
                  <p>Aucune quittance trouvée</p>
                  <button className="btn-retry" onClick={fetchQuittances}>
                    <RefreshCw size={16} /> Réessayer
                  </button>
                </td>
              </tr>
            ) : (
              paginatedQuittances.map((quittance, index) => {
                const num = (pageCourante - 1) * itemsParPage + index + 1;
                const denomination = quittance.denomination || quittance.demandeur || '-';
                const typeLabel = getTypeLabel(quittance.ref_client_type);
                const region = quittance.region_usager || '-';
                
                return (
                  <tr 
                    key={quittance.id} 
                    className={`quittance-row ${quittanceSelectionnee?.id === quittance.id ? 'selected' : ''}`}
                    onClick={() => handleSelectQuittance(quittance)}
                  >
                    <td className="col-num">{String(num).padStart(3, '0')}</td>
                    <td className="col-quittance">{formatQuittance(quittance.quittance)}</td>
                    <td className="col-facture-num">{quittance.num_facture || '-'}</td>
                    <td className="col-type-client">{typeLabel}</td>
                    <td className="col-client">{denomination}</td>
                    <td className="col-region">{region}</td>
                    <td className="col-montant">{formatMontant(quittance.soit_total)}</td>
                    <td className="col-date">{formatDate(quittance.date_ajout)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="excel-pagination">
          <button 
            className="page-btn"
            onClick={() => handlePageChange(1)}
            disabled={pageCourante === 1}
          >
            <ChevronsLeft size={14} />
          </button>
          <button 
            className="page-btn"
            onClick={() => handlePageChange(pageCourante - 1)}
            disabled={pageCourante === 1}
          >
            <ChevronLeft size={14} />
          </button>
          {renderPageNumbers().map(num => (
            <button
              key={num}
              className={`page-btn ${num === pageCourante ? 'active' : ''}`}
              onClick={() => handlePageChange(num)}
            >
              {num}
            </button>
          ))}
          <button 
            className="page-btn"
            onClick={() => handlePageChange(pageCourante + 1)}
            disabled={pageCourante === totalPages}
          >
            <ChevronRight size={14} />
          </button>
          <button 
            className="page-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={pageCourante === totalPages}
          >
            <ChevronsRight size={14} />
          </button>
          <span className="page-info">
            {pageCourante} / {totalPages}
          </span>
        </div>
      )}

      {/* Bouton Retour Dashboard en bas */}
      <div className="historique-footer">
        <button 
          className="btn-back-dashboard-bottom"
          onClick={handleBackToDashboard}
        >
          <ArrowLeft size={18} />
          <Home size={18} />
          <span>Retour au Dashboard</span>
        </button>
      </div>
    </div>
  );

  // Rendu du détail de la quittance sélectionnée
  const renderQuittanceDetail = () => {
    if (!quittanceSelectionnee) return null;

    const q = quittanceSelectionnee;
    const typeLabel = getTypeLabel(q.ref_client_type);
    
    return (
      <div className="quittance-detail-excel">
        <div className="detail-header">
          <h3><Tag size={16} /> QUITTANCE N° {formatQuittance(q.quittance)}</h3>
          <button 
            className="btn-close-detail"
            onClick={() => setQuittanceSelectionnee(null)}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="detail-body">
          {/* Informations de la quittance */}
          <div className="detail-section">
            <div className="detail-section-title">
              <Tag size={14} /> INFORMATIONS QUITTANCE
            </div>
            
            <div className="detail-row">
              <span className="detail-label"><Tag size={14} /> Numéro quittance:</span>
              <span className="detail-value">{formatQuittance(q.quittance)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><FileText size={14} /> Numéro facture:</span>
              <span className="detail-value">{q.num_facture || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><User size={14} /> Type client:</span>
              <span className="detail-value">{typeLabel}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><Hash size={14} /> Réf client:</span>
              <span className="detail-value">{q.ref_client_type || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><Hash size={14} /> Réf usager:</span>
              <span className="detail-value">{q.ref_usager ? String(q.ref_usager).padStart(3, '0') : '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><DollarSign size={14} /> Montant:</span>
              <span className="detail-value montant">{formatMontant(q.soit_total)} Ar</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><MapPin size={14} /> Région:</span>
              <span className="detail-value">{q.region_usager || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><Calendar size={14} /> Date création:</span>
              <span className="detail-value">{formatDate(q.date_ajout)}</span>
            </div>
            {q.type_facture && (
              <div className="detail-row">
                <span className="detail-label"><FileText size={14} /> Type facture:</span>
                <span className="detail-value">{q.type_facture}</span>
              </div>
            )}
            {q.num_facture_type && (
              <div className="detail-row">
                <span className="detail-label"><Hash size={14} /> Type facture n°:</span>
                <span className="detail-value">{q.num_facture_type}</span>
              </div>
            )}
          </div>

          {/* Informations du client */}
          <div className="detail-section">
            <div className="detail-section-title">
              <User size={14} /> INFORMATIONS CLIENT
            </div>
            
            <div className="detail-row">
              <span className="detail-label"><User size={14} /> Dénomination:</span>
              <span className="detail-value">{q.denomination || q.demandeur || '-'}</span>
            </div>
            
            {q.siege && (
              <div className="detail-row">
                <span className="detail-label"><Building size={14} /> Siège:</span>
                <span className="detail-value">{q.siege}</span>
              </div>
            )}
            
            {q.adresse && (
              <div className="detail-row">
                <span className="detail-label"><MapPin size={14} /> Adresse:</span>
                <span className="detail-value">{q.adresse}</span>
              </div>
            )}
            
            {q.telephone && (
              <div className="detail-row">
                <span className="detail-label"><Phone size={14} /> Téléphone:</span>
                <span className="detail-value">{q.telephone}</span>
              </div>
            )}
            
            {q.email && (
              <div className="detail-row">
                <span className="detail-label"><Mail size={14} /> Email:</span>
                <span className="detail-value">{q.email}</span>
              </div>
            )}
            
            {q.nif && (
              <div className="detail-row">
                <span className="detail-label"><Key size={14} /> NIF:</span>
                <span className="detail-value">{q.nif}</span>
              </div>
            )}
            
            {q.stat && (
              <div className="detail-row">
                <span className="detail-label"><FileCheck size={14} /> STAT:</span>
                <span className="detail-value">{q.stat}</span>
              </div>
            )}
            
            {q.activite && (
              <div className="detail-row">
                <span className="detail-label"><Briefcase size={14} /> Activité:</span>
                <span className="detail-value">{q.activite}</span>
              </div>
            )}
          </div>

          {/* Informations de la facture */}
          <div className="detail-section">
            <div className="detail-section-title">
              <FileText size={14} /> INFORMATIONS FACTURE
            </div>
            
            {q.montant_mensuel && (
              <div className="detail-row">
                <span className="detail-label"><DollarSign size={14} /> Montant mensuel:</span>
                <span className="detail-value">{formatMontant(q.montant_mensuel)} Ar</span>
              </div>
            )}
            
            {q.frais_dossier && (
              <div className="detail-row">
                <span className="detail-label"><DollarSign size={14} /> Frais de dossier:</span>
                <span className="detail-value">{formatMontant(q.frais_dossier)} Ar</span>
              </div>
            )}
            
            {q.montant_retard && q.is_retard && (
              <div className="detail-row">
                <span className="detail-label"><Clock size={14} /> Montant retard:</span>
                <span className="detail-value">{formatMontant(q.montant_retard)} Ar</span>
              </div>
            )}
            
            {q.taux && (
              <div className="detail-row">
                <span className="detail-label"><Percent size={14} /> Taux:</span>
                <span className="detail-value">{q.taux}%</span>
              </div>
            )}
            
            {q.uniter && (
              <div className="detail-row">
                <span className="detail-label"><Hash size={14} /> Uniter:</span>
                <span className="detail-value">{q.uniter}</span>
              </div>
            )}
          </div>

          {/* Informations de période */}
          {(q.mois_facture || q.annee_facture || q.mois_groupes) && (
            <div className="detail-section">
              <div className="detail-section-title">
                <Calendar size={14} /> PÉRIODE
              </div>
              
              {q.mois_facture && (
                <div className="detail-row">
                  <span className="detail-label"><Calendar size={14} /> Mois:</span>
                  <span className="detail-value">{getMonthName(q.mois_facture)} {q.annee_facture || ''}</span>
                </div>
              )}
              
              {q.mois_groupes && (
                <div className="detail-row">
                  <span className="detail-label"><Calendar size={14} /> Mois groupés:</span>
                  <span className="detail-value">
                    {q.mois_groupes.split(',').map(m => getMonthName(parseInt(m))).join(', ')}
                  </span>
                </div>
              )}
              
              {q.type_groupe && (
                <div className="detail-row">
                  <span className="detail-label"><Info size={14} /> Type groupe:</span>
                  <span className="detail-value">{q.type_groupe}</span>
                </div>
              )}
            </div>
          )}

          {/* Informations du représentant */}
          {(q.representant_nom || q.representant_adresse || q.representant_tel || q.representant_cin || q.representant_fonction) && (
            <div className="detail-section">
              <div className="detail-section-title">
                <Briefcase size={14} /> REPRÉSENTANT
              </div>
              
              {q.representant_nom && (
                <div className="detail-row">
                  <span className="detail-label"><User size={14} /> Nom:</span>
                  <span className="detail-value">{q.representant_nom}</span>
                </div>
              )}
              
              {q.representant_fonction && (
                <div className="detail-row">
                  <span className="detail-label"><Briefcase size={14} /> Fonction:</span>
                  <span className="detail-value">{q.representant_fonction}</span>
                </div>
              )}
              
              {q.representant_adresse && (
                <div className="detail-row">
                  <span className="detail-label"><MapPin size={14} /> Adresse:</span>
                  <span className="detail-value">{q.representant_adresse}</span>
                </div>
              )}
              
              {q.representant_tel && (
                <div className="detail-row">
                  <span className="detail-label"><Phone size={14} /> Téléphone:</span>
                  <span className="detail-value">{q.representant_tel}</span>
                </div>
              )}
              
              {q.representant_cin && (
                <div className="detail-row">
                  <span className="detail-label"><Key size={14} /> CIN:</span>
                  <span className="detail-value">{q.representant_cin}</span>
                </div>
              )}
            </div>
          )}

          {/* Informations complémentaires */}
          {(q.description_personnalisee || q.personne_recu || q.uniter || q.suffixe || q.quittance_validee !== undefined) && (
            <div className="detail-section">
              <div className="detail-section-title">
                <Info size={14} /> INFORMATIONS COMPLÉMENTAIRES
              </div>
              
              {q.description_personnalisee && (
                <div className="detail-row">
                  <span className="detail-label"><FileText size={14} /> Description:</span>
                  <span className="detail-value">{q.description_personnalisee}</span>
                </div>
              )}
              
              {q.personne_recu && (
                <div className="detail-row">
                  <span className="detail-label"><UserPlus size={14} /> Reçu par:</span>
                  <span className="detail-value">{q.personne_recu}</span>
                </div>
              )}
              
              {q.suffixe && (
                <div className="detail-row">
                  <span className="detail-label"><Hash size={14} /> Suffixe:</span>
                  <span className="detail-value">{q.suffixe}</span>
                </div>
              )}
              
              {q.quittance_validee !== undefined && (
                <div className="detail-row">
                  <span className="detail-label"><CheckCircle size={14} /> Quittance validée:</span>
                  <span className="detail-value">{q.quittance_validee ? '✅ Oui' : '❌ Non'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="quittance-page">
      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {renderHeader()}

      <div className="quittance-content">
        <div className={`quittance-main ${quittanceSelectionnee ? 'with-detail' : ''}`}>
          {renderHistorique()}
        </div>
        
        {quittanceSelectionnee && (
          <div className="quittance-sidebar">
            {renderQuittanceDetail()}
          </div>
        )}
      </div>

      <div className="quittance-footer-excel">
        <div className="footer-left">
          <BookOpen size={14} />
          <span>Suivi des quittances - {filteredQuittances.length} quittance(s)</span>
        </div>
        <div className="footer-center">
          <span>© {new Date().getFullYear()} - OMDA</span>
        </div>
        <div className="footer-right">
          <span>Version 1.0</span>
        </div>
      </div>
    </div>
  );
};

export default Quitance;