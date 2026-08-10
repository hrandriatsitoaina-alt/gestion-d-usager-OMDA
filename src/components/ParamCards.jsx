import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, ShoppingBag, Radio, MoreHorizontal,
  BookOpen, Send, Inbox, Settings, Users
} from 'lucide-react';

const ParamCard = () => {
  const navigate = useNavigate();

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
          <div className="param-number">30</div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/date_occ'); }}>Occasionnelle</a>
        </div>
        <div className="param-item">
          <div className="param-icon"><ShoppingBag size={20} strokeWidth={1.8} /></div>
          <div className="param-number">29</div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/date-grandsurface'); }}>Grande surface</a>
        </div>
        <div className="param-item">
          <div className="param-icon"><Radio size={20} strokeWidth={1.8} /></div>
          <div className="param-number">76</div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/date-bus'); }}>Media</a>
        </div>
        <div className="param-item">
          <div className="param-icon"><MoreHorizontal size={20} strokeWidth={1.8} /></div>
          <div className="param-number param-other"><span>Autre</span></div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/autre-usager'); }}>Usager</a>
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