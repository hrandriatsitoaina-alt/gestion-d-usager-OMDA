import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, ShoppingBag, Radio, MoreHorizontal,
  BookOpen, Send, Inbox, Settings, Users
} from 'lucide-react';

const ParamCard = () => {
  const navigate = useNavigate();
  
  const [counts, setCounts] = useState({
    occ: 0,
    grandSurface: 0,
    media: 0,
    hotel: 0
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [occRes, grandSurfaceRes, mediaRes, hotelRes] = await Promise.all([
        fetch('http://localhost:3001/api/usagers/occasionnels'),
        fetch('http://localhost:3001/api/usagers/paiements/grand-surface'),
        fetch('http://localhost:3001/api/usagers/paiements/media'),
        fetch('http://localhost:3001/api/usagers/paiements/hotel')
      ]);

      const occData = await occRes.json();
      const grandSurfaceData = await grandSurfaceRes.json();
      const mediaData = await mediaRes.json();
      const hotelData = await hotelRes.json();

      setCounts({
        occ: occData.success ? (occData.events ? occData.events.length : occData.usagers ? occData.usagers.length : 0) : 0,
        grandSurface: grandSurfaceData.success ? grandSurfaceData.usagers.length : 0,
        media: mediaData.success ? mediaData.usagers.length : 0,
        hotel: hotelData.success ? hotelData.usagers.length : 0
      });
    } catch (error) {
      console.error('❌ Erreur chargement des compteurs:', error);
    }
  };

  return (
    <div className="param-card">
      <div className="param-header">
        <h1>
          <Users size={20} strokeWidth={2} />
          Paramètres du droit public
        </h1>
      </div>

      <div className="param-grid">
        <div className="param-item">
          <div className="param-icon"><Calendar size={20} strokeWidth={1.8} /></div>
          <div className="param-number">{counts.occ}</div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/date_occ'); }}>Occasionnelle</a>
        </div>
        <div className="param-item">
          <div className="param-icon"><ShoppingBag size={20} strokeWidth={1.8} /></div>
          <div className="param-number">{counts.grandSurface}</div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/date-grandsurface'); }}>Grande surface</a>
        </div>
        <div className="param-item">
          <div className="param-icon"><Radio size={20} strokeWidth={1.8} /></div>
          <div className="param-number">{counts.media}</div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/date-bus'); }}>Media</a>
        </div>
        <div className="param-item">
          <div className="param-icon"><MoreHorizontal size={20} strokeWidth={1.8} /></div>
          <div className="param-number param-other"><span>{counts.hotel}</span></div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/autre-usager'); }}>Autre Usager</a>
        </div>
      </div>

      {/* Actions sur une seule ligne */}
      <div className="param-actions">
        <div className="action-group">
          <button className="action-btn"><BookOpen size={15} /> Donner</button>
          <button className="action-btn"><Send size={15} /> Envoyer</button>
          <button className="action-btn"><Inbox size={15} /> Recevoir</button>
        </div>
        <button className="action-btn" style={{ marginLeft: 'auto' }}>
          <Settings size={15} /> Paramètres
        </button>
      </div>
    </div>
  );
};

export default ParamCard;