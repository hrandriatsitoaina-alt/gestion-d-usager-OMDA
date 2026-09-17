// src/pages/fact.jsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckSquare, Search, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, X, CheckCircle, Clock, User,
  Calendar, DollarSign, Hash, Tag, Info, List, AlertCircle,
  RefreshCw, Building, MapPin, Phone, Mail, CreditCard,
  Briefcase, Key, Percent, FileCheck, ArrowLeft, Home
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/facture_conf.css';

const Fact = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vue, setVue] = useState('historique');
  const [pageCourante, setPageCourante] = useState(1);
  const [itemsParPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [dafName, setDafName] = useState('Directeur Financier');
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);

  const [filtreRegion, setFiltreRegion] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState('');
  const [filtreMois, setFiltreMois] = useState('');
  const [regionsDisponibles, setRegionsDisponibles] = useState([]);
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

  const navigate = useNavigate();
  const API_BASE = 'http://localhost:3001/api/recfacture';

  useEffect(() => {
    const fetchDafName = async () => {
      try {
        const response = await axios.get(`${API_BASE}/daf-name`);
        if (response.data.success) setDafName(response.data.dafName);
      } catch (err) {
        console.error('❌ Erreur récupération DAF:', err.message);
      }
    };
    fetchDafName();
  }, []);

  useEffect(() => { fetchFactures(); }, []);

  useEffect(() => {
    if (factures.length > 0) extraireFiltresDisponibles();
  }, [factures]);

  const extraireFiltresDisponibles = () => {
    const regions = new Set();
    const annees = new Set();
    factures.forEach(f => {
      if (f.region_usager && f.region_usager.trim() !== '') regions.add(f.region_usager.trim());
      if (f.annee_facture) annees.add(f.annee_facture);
    });
    setRegionsDisponibles(Array.from(regions).sort());
    setAnneesDisponibles(Array.from(annees).sort((a, b) => b - a));
  };

  const fetchFactures = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/factures`);
      if (response.data.success) {
        const facturesData = response.data.factures || [];
        const sortedFactures = [...facturesData].sort((a, b) => {
          const numA = a.num_facture || a.ref_omda || '';
          const numB = b.num_facture || b.ref_omda || '';
          const parseNumFacture = (str) => {
            const match = str.match(/^(\d+)(?:-([A-Za-z]))?$/);
            if (match) return { num: parseInt(match[1]), suffix: match[2] || '' };
            return { num: parseInt(str) || 0, suffix: '' };
          };
          const parsedA = parseNumFacture(numA);
          const parsedB = parseNumFacture(numB);
          if (parsedA.num !== parsedB.num) return parsedA.num - parsedB.num;
          return parsedA.suffix.localeCompare(parsedB.suffix);
        });
        setFactures(sortedFactures);
        if (sortedFactures.length > 0) {
          setFactureSelectionnee(sortedFactures[0]);
          setPageCourante(1);
        }
        if (response.data.dafName) setDafName(response.data.dafName);
      } else {
        setError(response.data.message || 'Erreur lors du chargement des factures');
      }
    } catch (err) {
      console.error('❌ Erreur récupération factures:', err.message);
      if (err.response) {
        if (err.response.status === 404) setError(`Route API non trouvée (404).`);
        else if (err.response.status === 500) setError(`Erreur serveur (500): ${err.response.data?.message || 'Erreur interne'}`);
        else setError(`Erreur ${err.response.status}: ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        setError('Impossible de contacter le serveur.');
      } else {
        setError(`Erreur: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => navigate('/dashboard');

  const formatQuittance = (num) => (!num && num !== 0) ? '' : String(num).padStart(7, '0');
  const formatMontant = (m) => (!m && m !== 0) ? '0' : new Intl.NumberFormat('fr-FR').format(m);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    } catch { return ''; }
  };

  const getMonthName = (month) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month - 1] || '';
  };

  const getMoisOptions = () => [
    { value: '', label: 'Tous les mois' },
    { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' }, { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' }, { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
  ];

  const resetFilters = () => {
    setFiltreRegion('');
    setFiltreAnnee('');
    setFiltreMois('');
    setPageCourante(1);
  };

  const filteredFactures = factures.filter(f => {
    const search = searchTerm.toLowerCase();
    const matchSearch = (
      (f.num_facture && f.num_facture.toLowerCase().includes(search)) ||
      (f.denomination && f.denomination.toLowerCase().includes(search)) ||
      (f.demandeur && f.demandeur.toLowerCase().includes(search)) ||
      (f.quittance && String(f.quittance).includes(search)) ||
      (f.ref_omda && String(f.ref_omda).includes(search)) ||
      (f.ref_client_type && f.ref_client_type.toLowerCase().includes(search)) ||
      (f.nif && f.nif.toLowerCase().includes(search)) ||
      (f.stat && f.stat.toLowerCase().includes(search))
    );
    if (!matchSearch) return false;
    if (filtreRegion && (!f.region_usager || f.region_usager !== filtreRegion)) return false;
    if (filtreAnnee && f.annee_facture !== parseInt(filtreAnnee)) return false;
    if (filtreMois && f.mois_facture !== parseInt(filtreMois)) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredFactures.length / itemsParPage);
  const paginatedFactures = filteredFactures.slice(
    (pageCourante - 1) * itemsParPage,
    pageCourante * itemsParPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPageCourante(newPage);
  };

  const handleSelectFacture = (facture) => setFactureSelectionnee(facture);

  const renderPageNumbers = () => {
    const numbers = [];
    const total = Math.min(filteredFactures.length, 200);
    const start = Math.max(1, pageCourante - 5);
    const end = Math.min(total, pageCourante + 5);
    for (let i = start; i <= end; i++) numbers.push(i);
    return numbers;
  };

  const renderHeader = () => (
    <div className="fact-header">
      <div className="fact-header-top">
        <div className="fact-header-logo">
          <FileText size={28} className="fact-logo-icon" />
          <div>
            <h1>OMDA</h1>
            <span>Office Malgasy du Droit d'Auteur</span>
          </div>
        </div>
        <div className="fact-header-actions">
          <button 
            className={`fact-btn-action ${vue === 'historique' ? 'active' : ''}`}
            onClick={() => { setVue('historique'); setPageCourante(1); }}
          >
            <List size={16} /> Historique de facture
          </button>
          <button 
            className={`fact-btn-action ${vue === 'checklist' ? 'active' : ''}`}
            onClick={() => { setVue('checklist'); setPageCourante(1); }}
          >
            <CheckSquare size={16} /> Check list
          </button>
        </div>
      </div>

      <div className="fact-header-search">
        <div className="fact-search-wrapper">
          <Search size={16} className="fact-search-icon" />
          <input
            type="text"
            className="fact-search-input"
            placeholder="Rechercher une facture (N°, client, quittance...)"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPageCourante(1); }}
          />
        </div>

        <div className="fact-filter-wrapper">
          <select className="fact-filter-select" value={filtreRegion}
            onChange={(e) => { setFiltreRegion(e.target.value); setPageCourante(1); }}>
            <option value="">Toutes les régions</option>
            {regionsDisponibles.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <select className="fact-filter-select" value={filtreAnnee}
            onChange={(e) => { setFiltreAnnee(e.target.value); setPageCourante(1); }}>
            <option value="">Toutes les années</option>
            {anneesDisponibles.map(annee => (
              <option key={annee} value={annee}>{annee}</option>
            ))}
          </select>

          <select className="fact-filter-select" value={filtreMois}
            onChange={(e) => { setFiltreMois(e.target.value); setPageCourante(1); }}>
            {getMoisOptions().map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>

          {(filtreRegion || filtreAnnee || filtreMois || searchTerm) && (
            <button className="fact-btn-filter-reset" onClick={resetFilters} title="Réinitialiser">
              <X size={14} />
            </button>
          )}
        </div>

        <span className="fact-total-badge">
          <FileText size={14} />
          {filteredFactures.length} facture(s)
        </span>
        <button className="fact-btn-refresh" onClick={fetchFactures} title="Rafraîchir">
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );

  const renderHistorique = () => (
    <div className="fact-historique">
      <div className="fact-table-wrapper">
        <table className="fact-table">
          <thead>
            <tr>
              <th className="fact-col-num"><Hash size={14} /> #</th>
              <th><FileText size={14} /> N° FACTURE</th>
              <th className="fact-col-client"><User size={14} /> CLIENT</th>
              <th className="fact-col-description"><FileText size={14} /> DÉNOMINATION</th>
              <th className="fact-col-total"><DollarSign size={14} /> TOTAL</th>
              <th className="fact-col-date"><Calendar size={14} /> DATE</th>
              <th className="fact-col-paiement"><CheckCircle size={14} /> PAIEMENT</th>
              <th className="fact-col-quittance"><Tag size={14} /> QUITTANCE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="fact-loading-cell">
                  <div className="fact-spinner"></div>
                  Chargement des factures...
                </td>
              </tr>
            ) : paginatedFactures.length === 0 ? (
              <tr>
                <td colSpan="8" className="fact-empty-cell">
                  <FileText size={32} />
                  <p>Aucune facture trouvée</p>
                  <button className="fact-btn-retry" onClick={fetchFactures}>
                    <RefreshCw size={16} /> Réessayer
                  </button>
                </td>
              </tr>
            ) : (
              paginatedFactures.map((facture, index) => {
                const num = (pageCourante - 1) * itemsParPage + index + 1;
                const refClient = facture.ref_client_type || '';
                const refUsager = facture.ref_usager || '';
                const clientRef = refClient && refUsager ? `${refClient}/${String(refUsager).padStart(3, '0')}` : '-';
                
                return (
                  <tr 
                    key={facture.id} 
                    className={factureSelectionnee?.id === facture.id ? 'selected' : ''}
                    onClick={() => handleSelectFacture(facture)}
                  >
                    <td className="fact-col-num">{String(num).padStart(3, '0')}</td>
                    <td>{facture.num_facture || facture.ref_omda || '-'}</td>
                    <td className="fact-col-client">{clientRef}</td>
                    <td className="fact-col-description">{facture.denomination || facture.demandeur || '-'}</td>
                    <td className="fact-col-total">{formatMontant(facture.soit_total)}</td>
                    <td className="fact-col-date">{formatDate(facture.date_ajout)}</td>
                    <td className="fact-col-paiement">
                      {facture.statut === 'validee' ? (
                        <CheckCircle size={16} className="fact-icon-valid" />
                      ) : (
                        <Clock size={16} className="fact-icon-pending" />
                      )}
                    </td>
                    <td className="fact-col-quittance">{formatQuittance(facture.quittance)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="fact-pagination">
          <button className="fact-page-btn" onClick={() => handlePageChange(1)} disabled={pageCourante === 1}>
            <ChevronsLeft size={14} />
          </button>
          <button className="fact-page-btn" onClick={() => handlePageChange(pageCourante - 1)} disabled={pageCourante === 1}>
            <ChevronLeft size={14} />
          </button>
          {renderPageNumbers().map(num => (
            <button key={num} className={`fact-page-btn ${num === pageCourante ? 'active' : ''}`} onClick={() => handlePageChange(num)}>
              {num}
            </button>
          ))}
          <button className="fact-page-btn" onClick={() => handlePageChange(pageCourante + 1)} disabled={pageCourante === totalPages}>
            <ChevronRight size={14} />
          </button>
          <button className="fact-page-btn" onClick={() => handlePageChange(totalPages)} disabled={pageCourante === totalPages}>
            <ChevronsRight size={14} />
          </button>
          <span className="fact-page-info">{pageCourante} / {totalPages}</span>
        </div>
      )}

      <div className="fact-footer-back">
        <button className="fact-btn-back" onClick={handleBackToDashboard}>
          <ArrowLeft size={18} />
          <Home size={18} />
          <span>Retour au Dashboard</span>
        </button>
      </div>
    </div>
  );

  const renderChecklist = () => (
    <div className="fact-checklist">
      <div className="fact-checklist-header">
        <h2><CheckSquare size={20} /> CHECK LIST DES FACTURES</h2>
        <div className="fact-checklist-stats">
          <span><FileText size={14} /> Total: {filteredFactures.length}</span>
          <span><CheckCircle size={14} /> Validées: {filteredFactures.filter(f => f.statut === 'validee').length}</span>
          <span><Clock size={14} /> En attente: {filteredFactures.filter(f => f.statut !== 'validee').length}</span>
        </div>
      </div>
      <div className="fact-checklist-grid">
        {loading ? (
          <div className="fact-loading-text">
            <div className="fact-spinner"></div>
            Chargement de la checklist...
          </div>
        ) : filteredFactures.length === 0 ? (
          <div className="fact-empty-text">
            <FileText size={32} />
            <p>Aucune facture dans la checklist</p>
            <button className="fact-btn-retry" onClick={fetchFactures}>
              <RefreshCw size={16} /> Réessayer
            </button>
          </div>
        ) : (
          filteredFactures.slice(0, 100).map((facture, index) => (
            <div 
              key={facture.id} 
              className={`fact-checklist-item ${factureSelectionnee?.id === facture.id ? 'selected' : ''}`}
              onClick={() => handleSelectFacture(facture)}
            >
              <div className="fact-checklist-num">{String(index + 1).padStart(3, '0')}</div>
              <div className="fact-checklist-content">
                <div>
                  <span className="label"><FileText size={12} /> N° Facture:</span>
                  <span className="value">{facture.num_facture || facture.ref_omda || '-'}</span>
                </div>
                <div>
                  <span className="label"><User size={12} /> Client:</span>
                  <span className="value">{facture.denomination || facture.demandeur || '-'}</span>
                </div>
                <div>
                  <span className="label"><DollarSign size={12} /> Montant:</span>
                  <span className="value">{formatMontant(facture.soit_total)} Ar</span>
                </div>
                <div>
                  <span className="label"><Tag size={12} /> Quittance:</span>
                  <span className="value">{formatQuittance(facture.quittance)}</span>
                </div>
                <div>
                  <span className="label"><Calendar size={12} /> Date:</span>
                  <span className="value">{formatDate(facture.date_ajout)}</span>
                </div>
                <div className="fact-checklist-statut">
                  <span className={`fact-statut-badge ${facture.statut}`}>
                    {facture.statut === 'validee' ? (
                      <><CheckCircle size={12} /> Validée</>
                    ) : (
                      <><Clock size={12} /> En attente</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {filteredFactures.length > 100 && (
        <div className="fact-checklist-more">+ {filteredFactures.length - 100} autres factures...</div>
      )}
      
      <div className="fact-checklist-footer">
        <button className="fact-btn-back" onClick={handleBackToDashboard}>
          <ArrowLeft size={18} />
          <Home size={18} />
          <span>Retour au Dashboard</span>
        </button>
      </div>
    </div>
  );

  const renderFactureDetail = () => {
    if (!factureSelectionnee) return null;
    const f = factureSelectionnee;
    
    return (
      <div className="fact-detail">
        <div className="fact-detail-header">
          <h3><FileText size={16} /> FACTURE N° {f.num_facture || f.ref_omda}</h3>
          <button className="fact-btn-close-detail" onClick={() => setFactureSelectionnee(null)}>
            <X size={18} />
          </button>
        </div>
        
        <div className="fact-detail-body">
          <div className="fact-detail-section">
            <div className="fact-detail-section-title">
              <User size={14} /> INFORMATIONS CLIENT
            </div>
            <div className="fact-detail-row">
              <span className="fact-detail-label"><User size={14} /> Dénomination:</span>
              <span className="fact-detail-value">{f.denomination || f.demandeur || '-'}</span>
            </div>
            {f.siege && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><Building size={14} /> Siège:</span>
                <span className="fact-detail-value">{f.siege}</span>
              </div>
            )}
            {f.adresse && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><MapPin size={14} /> Adresse:</span>
                <span className="fact-detail-value">{f.adresse}</span>
              </div>
            )}
            {f.telephone && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><Phone size={14} /> Téléphone:</span>
                <span className="fact-detail-value">{f.telephone}</span>
              </div>
            )}
            {f.email && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><Mail size={14} /> Email:</span>
                <span className="fact-detail-value">{f.email}</span>
              </div>
            )}
            {f.nif && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><Key size={14} /> NIF:</span>
                <span className="fact-detail-value">{f.nif}</span>
              </div>
            )}
            {f.stat && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><FileCheck size={14} /> STAT:</span>
                <span className="fact-detail-value">{f.stat}</span>
              </div>
            )}
          </div>

          <div className="fact-detail-section">
            <div className="fact-detail-section-title">
              <FileText size={14} /> INFORMATIONS FACTURE
            </div>
            <div className="fact-detail-row">
              <span className="fact-detail-label"><Tag size={14} /> Quittance:</span>
              <span className="fact-detail-value">{formatQuittance(f.quittance)}</span>
            </div>
            <div className="fact-detail-row">
              <span className="fact-detail-label"><DollarSign size={14} /> Montant total:</span>
              <span className="fact-detail-value montant">{formatMontant(f.soit_total)} Ar</span>
            </div>
            {f.montant_mensuel && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><DollarSign size={14} /> Montant mensuel:</span>
                <span className="fact-detail-value">{formatMontant(f.montant_mensuel)} Ar</span>
              </div>
            )}
            {f.frais_dossier && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><DollarSign size={14} /> Frais dossier:</span>
                <span className="fact-detail-value">{formatMontant(f.frais_dossier)} Ar</span>
              </div>
            )}
            {f.montant_retard && f.is_retard && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><Clock size={14} /> Montant retard:</span>
                <span className="fact-detail-value">{formatMontant(f.montant_retard)} Ar</span>
              </div>
            )}
            {f.taux && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><Percent size={14} /> Taux:</span>
                <span className="fact-detail-value">{f.taux}%</span>
              </div>
            )}
            <div className="fact-detail-row">
              <span className="fact-detail-label"><Calendar size={14} /> Date création:</span>
              <span className="fact-detail-value">{formatDate(f.date_ajout)}</span>
            </div>
            <div className="fact-detail-row">
              <span className="fact-detail-label"><Info size={14} /> Statut:</span>
              <span className={`fact-statut-badge ${f.statut}`}>
                {f.statut === 'validee' ? (
                  <><CheckCircle size={12} /> Validée</>
                ) : (
                  <><Clock size={12} /> En attente</>
                )}
              </span>
            </div>
            <div className="fact-detail-row">
              <span className="fact-detail-label"><FileText size={14} /> Type:</span>
              <span className="fact-detail-value">{f.type_facture || 'DAFC'}</span>
            </div>
            {f.num_facture_type && (
              <div className="fact-detail-row">
                <span className="fact-detail-label"><Hash size={14} /> Type facture:</span>
                <span className="fact-detail-value">{f.num_facture_type}</span>
              </div>
            )}
          </div>

          {(f.mois_facture || f.annee_facture || f.mois_groupes) && (
            <div className="fact-detail-section">
              <div className="fact-detail-section-title">
                <Calendar size={14} /> PÉRIODE
              </div>
              {f.mois_facture && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><Calendar size={14} /> Mois:</span>
                  <span className="fact-detail-value">{getMonthName(f.mois_facture)} {f.annee_facture || ''}</span>
                </div>
              )}
              {f.mois_groupes && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><Calendar size={14} /> Mois groupés:</span>
                  <span className="fact-detail-value">
                    {f.mois_groupes.split(',').map(m => getMonthName(parseInt(m))).join(', ')}
                  </span>
                </div>
              )}
              {f.type_groupe && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><Info size={14} /> Type groupe:</span>
                  <span className="fact-detail-value">{f.type_groupe}</span>
                </div>
              )}
            </div>
          )}

          {(f.representant_nom || f.representant_adresse || f.representant_tel || f.representant_cin || f.representant_fonction) && (
            <div className="fact-detail-section">
              <div className="fact-detail-section-title">
                <Briefcase size={14} /> REPRÉSENTANT
              </div>
              {f.representant_nom && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><User size={14} /> Nom:</span>
                  <span className="fact-detail-value">{f.representant_nom}</span>
                </div>
              )}
              {f.representant_fonction && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><Briefcase size={14} /> Fonction:</span>
                  <span className="fact-detail-value">{f.representant_fonction}</span>
                </div>
              )}
              {f.representant_adresse && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><MapPin size={14} /> Adresse:</span>
                  <span className="fact-detail-value">{f.representant_adresse}</span>
                </div>
              )}
              {f.representant_tel && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><Phone size={14} /> Téléphone:</span>
                  <span className="fact-detail-value">{f.representant_tel}</span>
                </div>
              )}
              {f.representant_cin && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><Key size={14} /> CIN:</span>
                  <span className="fact-detail-value">{f.representant_cin}</span>
                </div>
              )}
            </div>
          )}

          {(f.description_personnalisee || f.personne_recu || f.activite || f.uniter || f.suffixe) && (
            <div className="fact-detail-section">
              <div className="fact-detail-section-title">
                <Info size={14} /> INFORMATIONS COMPLÉMENTAIRES
              </div>
              {f.activite && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><Briefcase size={14} /> Activité:</span>
                  <span className="fact-detail-value">{f.activite}</span>
                </div>
              )}
              {f.description_personnalisee && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><FileText size={14} /> Description:</span>
                  <span className="fact-detail-value">{f.description_personnalisee}</span>
                </div>
              )}
              {f.personne_recu && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><User size={14} /> Reçu par:</span>
                  <span className="fact-detail-value">{f.personne_recu}</span>
                </div>
              )}
              {f.uniter && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><FileText size={14} /> Unité:</span>
                  <span className="fact-detail-value">{f.uniter}</span>
                </div>
              )}
              {f.suffixe && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><Hash size={14} /> Suffixe:</span>
                  <span className="fact-detail-value">{f.suffixe}</span>
                </div>
              )}
              {f.quittance_validee !== undefined && (
                <div className="fact-detail-row">
                  <span className="fact-detail-label"><CheckCircle size={14} /> Quittance validée:</span>
                  <span className="fact-detail-value">{f.quittance_validee ? 'Oui' : 'Non'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fact-page">
      {error && (
        <div className="fact-error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {renderHeader()}

      <div className="fact-content">
        <div className={`fact-main ${factureSelectionnee ? 'with-detail' : ''}`}>
          {vue === 'historique' ? renderHistorique() : renderChecklist()}
        </div>
        
        {factureSelectionnee && (
          <div className="fact-sidebar">
            {renderFactureDetail()}
          </div>
        )}
      </div>

      <div className="fact-footer">
        <div className="fact-footer-left">
          <User size={14} />
          <span>DAF: {dafName}</span>
        </div>
        <div className="fact-footer-center">
          <span>© {new Date().getFullYear()} - OMDA</span>
        </div>
        <div className="fact-footer-right">
          <span>Version 1.0</span>
        </div>
      </div>
    </div>
  );
};

export default Fact;