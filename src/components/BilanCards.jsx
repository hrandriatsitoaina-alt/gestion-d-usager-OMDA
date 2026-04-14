import React from 'react';
import { useNavigate } from 'react-router-dom';

const BilanCards = () => {
  const navigate = useNavigate();

  return (
    <div className="omdprim">
      {/* Carte Bilan annuel */}
      <div className="omdfi1">
        <div className="omi">
          <div className="omi3">
            <div className="ol1">
              <h3>Gestion d'evenement </h3>
              <h4>Les evenement organiser avec lieux</h4>
              <div className="ol11">
                {[
                  { icon: '📊', value: '156', label: 'Événements' },
                  { icon: '🎤', value: '890', label: 'Artistes' },
                  { icon: '📊', value: '2.4M', label: 'Revenus' },
                  { icon: '📅', value: '2.4M', label: 'Revenus' },
                  { icon: '📃', value: '2.4M', label: 'Revenus' },
                  { icon: '💰', value: '2.4M', label: 'Revenus' },

                ].map((item, idx) => (
                  <div className="odm" key={idx} title={item.label}>
                    <h2>{item.icon} <p>{item.value}</p></h2>
                  </div>
                ))}
              </div>
            </div>




<div className="ol2">
  <h5>Graphique d'activité</h5>
  <br />
  <div className="omdI2"> </div>

  <div className="legend-horizontal">
    <div className="item">
      <span className="dot s1-bg"></span> 1-Actif
    </div>
    <div className="item">
      <span className="dot s2-bg"></span> 2- Passif
    </div>
    <div className="item">
      <span className="dot s3-bg"></span> 3- Resultat
    </div>
  </div>
</div>


</div>




        </div>
        <div className="omdP1">
          <div className="omr1">
            <button onClick={() => navigate('/ajout-evenement')}>
              ➕ Ajouter événement
            </button>
          </div>
          <div className="omr2">
            <button>📊 Voir détails</button>
          </div>
        </div>
      </div>
      
      {/* Carte Diagnostic */}
      <div className="omdfi2">
        <div className="omi">
          <div className="omi3">
            <div className="ol1">
              <h3>Diagnostic</h3>
              <h4>Analyse et recommandations</h4>
              <div className="ol112">
                {[
                  { icon: '✅', value: '85%', label: 'Conformité' },
                  { icon: '⚠️', value: '12', label: 'Alertes' },
                  { icon: '📈', value: '+15%', label: 'Croissance' },
                  { icon: '📑', value: '+15%', label: 'Croissance' },
                  { icon: '📇', value: '+15%', label: 'Croissance' },
                  { icon: '💳', value: '+15%', label: 'Croissance' },

                  
                ].map((item, idx) => (
                  <div className="odm" key={idx} title={item.label}>
                    <h2>{item.icon} <p>{item.value}</p></h2>
                  </div>
                ))}
              </div>
            </div>








<div className="ol2">
  <h5>Graphique d'activité</h5>
  <br />
  <div className="omdI3"> </div>

  <div className="legend-horizontal">
    <div className="item">
      <span className="dot s1-bg"></span> 1-Profit
    </div>
    <div className="item">
      <span className="dot s2-bg"></span> 2- Marge
    </div>
    <div className="item">
      <span className="dot s3-bg"></span> 3- Rentabiliter
    </div>
  </div>
</div>










          </div>
        </div>
        <div className="omdP1">
        <div className="omr2">
          <button onClick={() => navigate('/tableau-db')}>
              ➕ Tableau de bord
            </button>
          </div>
          <div className="omr1">
            <button onClick={() => navigate('/ajout-evenement')}>
              🔍 Diagnostic avancé
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BilanCards;