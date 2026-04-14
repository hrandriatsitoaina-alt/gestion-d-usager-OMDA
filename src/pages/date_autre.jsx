import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/date_autre.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const Dateautre = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      <main className="contenu">
        <fieldset>
          <legend>Traitement d'ajout des usager</legend>
          <div className="form-container">
            <div className="selectUsager">
              <div className="graph-header">
                <h3>📊 liste des usager</h3>
              </div>

              <div className="choices-row">
                <div className="choice-card" align="center">
                  <div className="card-icon">🎪</div>
                  <div className="card-title">Occasionnelle <span>90 inscrit</span></div>
                  <div className="card-desc">Ajout d'un événement</div>
                  <button 
                    className="card-btn" 
                    onClick={() => navigate('/date_occ')}
                  >
                    Plus d'information
                  </button>
                </div>

                <div className="choice-card" align="center">
                  <div className="card-icon">🏪</div>
                  <div className="card-title">Grande Surface <span>12 inscrit</span></div>
                  <div className="card-desc">Ajout d'un lieu</div>
                  <button 
                    className="card-btn" 
                    onClick={() => navigate('/date-grandsurface')}
                  >
                    Plus d'information
                  </button>
                </div>
              </div>

              <div className="choices-row">
                <div className="choice-card" align="center">
                  <div className="card-icon">🚌</div>
                  <div className="card-title">Bus <span>120 inscrit</span></div>
                  <div className="card-desc">Ajout d'une ligne de bus</div>
                  <button 
                    className="card-btn" 
                    onClick={() => navigate('/date-bus')}
                  >
                    Plus d'information
                  </button>
                </div>

                <div className="choice-card" align="center">
                  <div className="card-icon">🎭</div>
                  <div className="card-title">Night Club <span>10 inscrit</span></div>
                  <div className="card-desc">Boîte de nuit</div>
                  <button 
                    className="card-btn" 
                    onClick={() => navigate('/night-club')}
                  >
                    Plus d'information
                  </button>
                </div>
              </div>

              <div className="choices-row">
                <div className="choice-card" align="center">
                  <div className="card-icon">📺/📻</div>
                  <div className="card-title">T/R <span>Tele :21 / Radio :26</span></div>
                  <div className="card-desc">Consulter le statut des television</div>
                  <button 
                    className="card-btn" 
                    onClick={() => navigate('/tele-radio')}
                  >
                    Plus d'information
                  </button>
                </div>

                <div className="choice-card" align="center">
                  <div className="card-icon">🏫</div>
                  <div className="card-title">Hotel <span>70 inscrit</span></div>
                  <div className="card-desc">Detail des hôtel</div>
                  <button 
                    className="card-btn" 
                    onClick={() => navigate('/Hotel_occ')}
                  >
                    Plus d'information
                  </button>
                </div>
              </div>

              <div className="mive">
                <div><h3>Retour au page d'accueil</h3></div>
                <div>
                  <button 
                    className="btn-modern outline" 
                    onClick={() => navigate('/dashboard')}
                  >
                    ← Retour
                  </button>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      </main>
    </>
  );
};

export default Dateautre;