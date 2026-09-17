// src/pages/Dateautre.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, ShoppingBag, Bus, Music, Tv, Hotel,
  ArrowLeft, Users, Package, Sparkles
} from 'lucide-react';
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
    occ: 0,
    other: 0
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [hotelRes, grandSurfaceRes, busRes, nightclubRes, mediaRes, occRes, otherRes] = await Promise.all([
        fetch('http://localhost:3001/api/usagers/paiements/hotel'),
        fetch('http://localhost:3001/api/usagers/paiements/grand-surface'),
        fetch('http://localhost:3001/api/usagers/paiements/bus'),
        fetch('http://localhost:3001/api/usagers/paiements/nightclub'),
        fetch('http://localhost:3001/api/usagers/paiements/media'),
        fetch('http://localhost:3001/api/usagers/occasionnels'),
        fetch('http://localhost:3001/api/other-usagers')
      ]);

      const hotelData = await hotelRes.json();
      const grandSurfaceData = await grandSurfaceRes.json();
      const busData = await busRes.json();
      const nightclubData = await nightclubRes.json();
      const mediaData = await mediaRes.json();
      const occData = await occRes.json();
      const otherData = await otherRes.json();

      let mediaCount = 0;
      if (mediaData.success && mediaData.usagers) {
        mediaCount = mediaData.usagers.length;
      }

      setCounts({
        hotel: hotelData.success ? hotelData.usagers.length : 0,
        grandSurface: grandSurfaceData.success ? grandSurfaceData.usagers.length : 0,
        bus: busData.success ? busData.usagers.length : 0,
        nightclub: nightclubData.success ? nightclubData.usagers.length : 0,
        media: mediaCount,
        occ: occData.success ? (occData.events ? occData.events.length : occData.usagers ? occData.usagers.length : 0) : 0,
        other: otherData.success ? (otherData.usagers ? otherData.usagers.length : 0) : 0
      });
    } catch (error) {
      console.error('❌ Erreur chargement des compteurs:', error);
    }
  };

  const cards = [
    {
      id: 'occ',
      icon: Calendar,
      title: 'Occasionnelle',
      count: counts.occ,
      desc: 'Ajout d\'un événement',
      path: '/date_occ'
    },
    {
      id: 'grandSurface',
      icon: ShoppingBag,
      title: 'Grande Surface',
      count: counts.grandSurface,
      desc: 'Ajout d\'un lieu',
      path: '/date-grandsurface'
    },
    {
      id: 'bus',
      icon: Bus,
      title: 'Bus',
      count: counts.bus,
      desc: 'Ajout d\'une ligne',
      path: '/date-bus'
    },
    {
      id: 'nightclub',
      icon: Music,
      title: 'Night Club',
      count: counts.nightclub,
      desc: 'Boîte de nuit',
      path: '/night-club'
    },
    {
      id: 'media',
      icon: Tv,
      title: 'Média',
      count: counts.media,
      desc: 'Télé / Radio',
      path: '/tele-radio'
    },
    {
      id: 'hotel',
      icon: Hotel,
      title: 'Hôtel',
      count: counts.hotel,
      desc: 'Détail des hôtels',
      path: '/Hotel_occ'
    }
  ];

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      <main className="contenu">
        <fieldset className="compact-fieldset">
          <legend>
            <Users size={20} strokeWidth={2} />
            Traitement d'ajout des usagers
          </legend>

          {/* 6 cartes classiques */}
          <div className="compact-grid">
            {cards.map((card) => (
              <div className="compact-card" key={card.id}>
                <div className="compact-card-icon">
                  <card.icon size={34} strokeWidth={1.8} />
                </div>
                <div className="compact-card-content">
                  <div className="compact-card-title">
                    {card.title}
                    <span className="compact-card-count">{card.count} inscrit</span>
                  </div>
                  <div className="compact-card-desc">{card.desc}</div>
                  <button 
                    className="compact-card-btn"
                    onClick={() => navigate(card.path)}
                  >
                    Plus d'information →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Carte "Usager événementiel" simplifiée */}
          <div className="other-featured-wrapper">
            <div className="other-featured-card">
              <div className="other-featured-icon">
                <Package size={44} strokeWidth={1.6} />
              </div>

              <div className="other-featured-content">
                <h3 className="other-featured-title">
                  Usager événementiel
                  <span className="other-featured-count">
                    {counts.other} inscrit{counts.other > 1 ? 's' : ''}
                  </span>
                </h3>

                <p className="other-featured-desc">
                  CD, MP3, Œuvres Web, Hologrammes, Vidéos...
                </p>

                <div className="other-featured-tags">
                  <span className="other-tag">CD</span>
                  <span className="other-tag">MP3</span>
                  <span className="other-tag">Web</span>
                  <span className="other-tag">Hologramme</span>
                  <span className="other-tag">Vidéo</span>
                  <span className="other-tag">Autre</span>
                </div>

                <div className="other-featured-actions">
                  <button
                    className="other-btn other-btn-primary"
                    onClick={() => navigate('/date_other')}
                  >
                    Voir la liste →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="compact-footer">
            <button 
              className="compact-back-btn"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft size={18} strokeWidth={2} />
              Retour à l'accueil
            </button>
          </div>
        </fieldset>
      </main>
    </>
  );
};

export default Dateautre;