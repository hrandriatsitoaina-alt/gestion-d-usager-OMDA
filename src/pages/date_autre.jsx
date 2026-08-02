// src/pages/date_autre.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/date_autre.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const Dateautre = () => {
  const navigate = useNavigate();
  
  const [counts, setCounts] = useState({
    hotel: 0,
    grandSurface: 0,
    bus: 0,
    nightclub: 0,
    media: 0,
    occ: 0
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      // Récupérer les compteurs pour chaque type d'usager
      const [hotelRes, grandSurfaceRes, busRes, nightclubRes, mediaRes, occRes] = await Promise.all([
        fetch('http://localhost:3001/api/usagers/paiements/hotel'),
        fetch('http://localhost:3001/api/usagers/paiements/grand-surface'),
        fetch('http://localhost:3001/api/usagers/paiements/bus'),
        fetch('http://localhost:3001/api/usagers/paiements/nightclub'),
        fetch('http://localhost:3001/api/usagers/paiements/media'),
        fetch('http://localhost:3001/api/usagers/occasionnels')
      ]);

      const hotelData = await hotelRes.json();
      const grandSurfaceData = await grandSurfaceRes.json();
      const busData = await busRes.json();
      const nightclubData = await nightclubRes.json();
      const mediaData = await mediaRes.json();
      const occData = await occRes.json();

      console.log('📡 Réponse media:', mediaData);

      // Compter le nombre total de médias
      let mediaCount = 0;
      
      if (mediaData.success && mediaData.usagers) {
        mediaCount = mediaData.usagers.length;
        console.log(`📺 Total médias: ${mediaCount}`);
      }

      setCounts({
        hotel: hotelData.success ? hotelData.usagers.length : 0,
        grandSurface: grandSurfaceData.success ? grandSurfaceData.usagers.length : 0,
        bus: busData.success ? busData.usagers.length : 0,
        nightclub: nightclubData.success ? nightclubData.usagers.length : 0,
        media: mediaCount,
        occ: occData.success ? (occData.events ? occData.events.length : occData.usagers ? occData.usagers.length : 0) : 0
      });
    } catch (error) {
      console.error('❌ Erreur chargement des compteurs:', error);
    }
  };

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
                  <div className="card-title">Occasionnelle <span>{counts.occ} inscrit</span></div>
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
                  <div className="card-title">Grande Surface <span>{counts.grandSurface} inscrit</span></div>
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
                  <div className="card-title">Bus <span>{counts.bus} inscrit</span></div>
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
                  <div className="card-title">Night Club <span>{counts.nightclub} inscrit</span></div>
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
                  <div className="card-icon">📺</div>
                  <div className="card-title">Média <span>{counts.media} inscrit</span></div>
                  <div className="card-desc">Consulter le statut des médias (Télé/Radio)</div>
                  <button 
                    className="card-btn" 
                    onClick={() => navigate('/tele-radio')}
                  >
                    Plus d'information
                  </button>
                </div>

                <div className="choice-card" align="center">
                  <div className="card-icon">🏨</div>
                  <div className="card-title">Hotel <span>{counts.hotel} inscrit</span></div>
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