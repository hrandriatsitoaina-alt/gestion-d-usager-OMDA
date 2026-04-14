import React from 'react';
import { useNavigate } from 'react-router-dom';

const ParamCard = () => {
  const navigate = useNavigate();

  return (
    <div className="param-card">

      <div className="omd16"><h1>Paramètres du droit public</h1></div>
      
      <div className="omda16T">
        <div className="omda16TA">
          <h1>30</h1>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            navigate('/date_occ');
          }}>Occasionnelle</a>
        </div>

        <div className="omda16TA">
          <h1>29</h1>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            navigate('/date-grandsurface');
          }}>Grande surface</a>
        </div>
        
        <div className="omda16TA">
        <h1>76</h1>
        <a href="#" onClick={(e) => {
          e.preventDefault();
          navigate('/date-bus');
        }}>Bus</a>
       </div>
        
        {/* <div className="omda16TA">
          <h1>90</h1>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            navigate('/night-club');
          }}>Night club</a>
        </div> */}

        <div className="omda16TA">
          <h1><span>Aure Usager</span></h1>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            navigate('/autre-usager');
          }}>Autre...</a>
        </div>
      </div>
      
      {/* Barre d'actions */}
      <div className="omdaF1">
        <div className="omdP">
          <div className="divP">
            <button>Donner 📖</button>
          </div>
          <div className="div">
            <button>Envoyer 📤</button>
          </div>
          <div className="div">
            <button>Recevoir 📥</button>
          </div>
        </div>
        <div className="omdP">
          <div className="div">
            <button>Paramètres 🔧</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParamCard;