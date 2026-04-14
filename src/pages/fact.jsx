import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/fatcure.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const Fact = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2026');

  // Données centralisées
  const invoiceStats = [
    { id: 1, count: 60, label: 'Payée réglée', percentage: 50, status: 'paid', },
    { id: 2, count: 30, label: 'Retard -30j', percentage: 30, status: 'late',},
    { id: 3, count: 20, label: 'Retard +30j', percentage: 20, status: 'overdue', }
  ];

  const monthlyData = {
    OCC: [3, 6, 1, 8, 4, 9, 0, 3, 1, 9, 8, 2],
    BUS: [3, 2, 1, 6, 3, 1, 0, 5, 1, 1, 2, 2],
    GS: [1, 6, 1, 2, 4, 5, 0, 3, 1, 3, 1, 2],
    NC: [1, 2, 1, 3, 2, 1, 5, 1, 4, 2, 1, 2]
  };

  const categories = {
    OCC: { name: 'Occasionelle', total: 68, color: '#4A90E2' },
    BUS: { name: 'Transport', total: 55, color: '#5BA3F5' },
    GS: { name: 'Grande Surface', total: 43, color: '#6BB5FF' },
    NC: { name: 'Night Club', total: 23, color: '#7BC7FF' }
  };

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate()} ${currentDate.toLocaleString('fr', { month: 'long' })} ${currentDate.getFullYear()}`;

  const getStatusClass = (status) => {
    switch(status) {
      case 'paid': return 'status-badge status-badge-success';
      case 'late': return 'status-badge status-badge-warning';
      case 'overdue': return 'status-badge status-badge-danger';
      default: return 'status-badge';
    }
  };

  const totalInvoices = 110;
  const paidPercentage = (60 / totalInvoices * 100).toFixed(0);

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      <main className="contenu">
        <section className="invoice-section-wrapper">
          <fieldset className="invoice-fieldset">
            <legend className="invoice-legend">
              <span className="legend-icon">📊</span>
              Facturation
            </legend>
            
            <div className="invoice-header-section">
              <h1 className="invoice-main-title">Gestion de facturation</h1>
              <div className="header-date-badge">
                <span className="date-icon">📅</span>
                <span className="date-text">{formattedDate}</span>
              </div>
            </div>
            
            <section className="invoice-content-area">
              <div className="invoice-dashboard-grid">
                {/* Colonne gauche */}
                <div className="invoice-left-column">
                  {/* Carte des statistiques */}
                  <div className="stats-primary-card">
                    <div className="stats-card-header">
                      <h4 className="stats-card-title">📋 Facture d'usager</h4>
                      <div className="stats-total-badge">
                        <span className="total-label">Total</span>
                        <span className="total-value">{totalInvoices}</span>
                      </div>
                    </div>
                    
                    <div className="stats-progress-bar">
                      <div className="progress-fill" style={{ width: `${paidPercentage}%` }}></div>
                      <span className="progress-text">{paidPercentage}% payé</span>
                    </div>
                    
                    {invoiceStats.map((stat) => (
                      <div className="stats-row" key={stat.id}>
                        <div className="stats-circle-badge">
                          <span className="stat-icon">{stat.icon}</span>
                          <h4>{stat.count}</h4>
                        </div>
                        <div className="stats-label-wrapper">
                          <h3>{stat.label}</h3>
                          <span className="stat-subtitle">factures</span>
                        </div>
                        <div className={getStatusClass(stat.status)} align="center">
                          {stat.percentage}%
                        </div>
                      </div>
                    ))}
                    
                    <hr className="stats-divider"/>
                    
                    <div className="stats-footer-wrapper">
                      <div className="stats-footer-left">
                        <div className="stats-icon-box">
                          <span>📃</span>
                        </div>
                        <div>
                          <h4>Liste de facturation</h4>
                          <h5>{totalInvoices} Usagers</h5>
                        </div>
                      </div>
                      <div className="stats-footer-right">
                        <a href="/factures" className="consult-link" onClick={(e) => e.preventDefault()}>
                          Consulter →
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Tableau des factures */}
                  <div className="invoice-table-card">
                    <div className="table-card-header">
                      <h4 className="table-card-title">📑 Liste des factures</h4>
                      <div className="year-selector">
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="year-select">
                          <option value="2024">2024</option>
                          <option value="2025">2025</option>
                          <option value="2026">2026</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="table-header-wrapper">
                      <div className="date-display">
                        <span className="calendar-icon">📅</span>
                        <h4>Date : {formattedDate}</h4>
                      </div>
                      <div>
                        <a href="#" className="invoice-year-link" onClick={(e) => e.preventDefault()}>
                          Liste des factures {selectedYear} →
                        </a>
                      </div>
                    </div>
                    
                    <div className="table-responsive-wrapper">
                      <table className="invoice-data-table">
                        <thead>
                          <tr className="table-header-row">
                            <th>Activité</th>
                            {months.map(month => (
                              <th key={month}>{month}</th>
                            ))}
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(monthlyData).map(([key, values]) => (
                            <tr key={key} className="table-data-row">
                              <td className="category-cell">
                                <span className="category-dot" style={{ backgroundColor: categories[key].color }}></span>
                                {key}
                              </td>
                              {values.map((value, idx) => (
                                <td key={idx} className={value > 5 ? 'high-value' : ''}>{value}</td>
                              ))}
                              <td className="total-cell-value">{categories[key].total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="categories-legend">
                        {Object.entries(categories).map(([key, value]) => (
                          <div className="legend-item" key={key}>
                            <span className="legend-dot" style={{ backgroundColor: value.color }}></span>
                            <h4><strong>{key}</strong> : <span>{value.name}</span> - {value.total} factures</h4>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Nouvel élément ajouté - Graphique de tendance */}
                  <div className="trend-chart-card">
                    <div className="trend-header">
                      <h4>📈 Tendance des paiements</h4>
                      <span className="trend-badge">+12%</span>
                    </div>
                    <div className="trend-bars">
                      <div className="trend-bar" style={{ height: '40px' }}><span>Jan</span></div>
                      <div className="trend-bar" style={{ height: '55px' }}><span>Fév</span></div>
                      <div className="trend-bar" style={{ height: '48px' }}><span>Mar</span></div>
                      <div className="trend-bar" style={{ height: '62px' }}><span>Avr</span></div>
                      <div className="trend-bar" style={{ height: '70px' }}><span>Mai</span></div>
                      <div className="trend-bar" style={{ height: '58px' }}><span>Jun</span></div>
                    </div>
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="invoice-right-column">
                  <div className="info-card info-card-primary">
                    <div className="info-card-icon-wrapper">
                      <div className="info-card-icon">📊</div>
                    </div>
                    <div className="info-card-content">
                      <h4>Performance financière</h4>
                      <p className="info-description">Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis sint sunt mollitia!</p>
                      <h5 className="info-subtitle">Objectif du mois : 85%</h5>
                      <a href="#" className="info-card-link" onClick={(e) => e.preventDefault()}>
                        En savoir plus →
                      </a>
                    </div>
                  </div>
                  
                  <div className="info-card info-card-stats">
                    <h3>👥 Client principal</h3>
                    <div className="client-stats">
                      <div className="stat-circle">
                        <span className="stat-number-large">130</span>
                        <span className="stat-label-small">Membres</span>
                      </div>
                      <div className="client-growth">
                        <span className="growth-icon">📈</span>
                        <span className="growth-text">+15% cette année</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="info-card info-card-warning">
                    <h3>⚠️ Contraintes et menaces</h3>
                    <ul className="threats-list">
                      <li>🔴 Retards de paiement fréquents</li>
                      <li>🟡 Non-conformité réglementaire</li>
                      <li>🟢 Litiges en cours (3 cas)</li>
                    </ul>
                    <div className="alert-banner">
                      <span>Action requise</span>
                      <button className="alert-button">Voir détails</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <br/>
          </fieldset>
          
          <div className="navigation-footer">
            <div className="back-button-wrapper">
              <h3>Retour à la page d'accueil</h3>
              <p className="back-description">Naviguez facilement entre les sections</p>
            </div>
            <div>
              <button className="btn-back-modern" onClick={() => navigate('/dashboard')}>
                ← Retour
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Fact;