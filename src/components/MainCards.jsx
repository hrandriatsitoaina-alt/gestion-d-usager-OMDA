import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainCards = () => {
  const navigate = useNavigate();

  return (
    <div className="omdprim">
      {/* Carte Ajout catégorie */}
      <div className="omdfi1">
        <div className="omi">
          <div className="omi3">
            <div className="ol1">
              <h3>Formulaire d'ajout</h3>
              <h4>Ajouter une nouvelle catégorie ou un nouvel élément</h4>
              <div className="ol11">
                {[
                  { icon: '✏️', value: '20', label: 'Catégories' },
                  { icon: '🎰', value: '90', label: 'Sous-catégories' },
                  { icon: '📖', value: '123', label: 'Documents' },
                  { icon: '🛒', value: '21', label: 'Commerces' },
                  { icon: '⛔', value: '90', label: 'Restrictions' },
                  { icon: '📈', value: '20%', label: 'Taux' }
                ].map((item, idx) => (
                  <div className="odm" key={idx} title={item.label}>
                    <h2>{item.icon} <p>{item.value}</p></h2>
                  </div>
                ))}
              </div>
            </div>





{/* Premier contenaire  */}
<div className="ol2">
  <h5>Graphique d'activité</h5>
  <br />
  <div className="omdI">
    <div className="segment s1"></div>
    <div className="segment s2"></div>
    <div className="segment s3"></div>
  </div>

  <div className="legend-horizontal">
    <div className="item">
      <span className="dot s1-bg"></span> 1-Accroissement
    </div>
    <div className="item">
      <span className="dot s2-bg"></span> 2- Controle 
    </div>
    <div className="item">
      <span className="dot s3-bg"></span> 3- Protection 
    </div>
  </div>
</div>
{/* contenaire */}



          </div>
        </div>
        <div className="omdP1">
          <div className="omr1">
            <button onClick={() => navigate('/ajout-usager')}>
              ➕ Ajout nouveau
            </button>
          </div>
          <div className="omr2">
            <button onClick={() => navigate('/ajout-usager')}>
              📋 Consulter
            </button>
          </div>
        </div>
      </div>
      
      {/* Carte Vérification */}
      <div className="omdfi2">
        <div className="omi">
          <div className="omi3">
            <div className="ol1">
              <h3>Vérification</h3>
              <h4>Vérifier l'existence et le statut des éléments des usager</h4>
              <div className="ol112">
                {[
                  { icon: '🪪', value: '20', label: 'Identités' },
                  { icon: '🎤', value: '90', label: 'Artistes' },
                  { icon: '🎶', value: '123', label: 'Œuvres' },
                  { icon: '🎧', value: '21', label: 'Producteurs' },
                  { icon: '🎲', value: '90', label: 'Événements' },
                  { icon: '🎴', value: '20%', label: 'Taux' }
                ].map((item, idx) => (
                  <div className="odm" key={idx} title={item.label}>
                    <h2>{item.icon} <p>{item.value}</p></h2>
                  </div>
                ))}
              </div>
            </div>




{/* deuxiemme courbe ------------------------------------------------ */}
<div className="ol2">
  <h5>Graphique d'activité</h5><br />
  
  <div className="omdI">
    <div className="segment s1"></div>
    <div className="segment s2"></div>
    <div className="segment s3"></div>
  </div>

  <div className="legend-horizontal">
    <div className="item">
      <span className="dot s1-bg"></span> 1- Format
    </div>
    <div className="item">
      <span className="dot s2-bg"></span> 2-Contenu
    </div>
    <div className="item">
      <span className="dot s3-bg"></span> 3- Cohérence
    </div>
  </div>
</div>
{/* ---------------------------------------------SSS---------------------------------- */}




          </div>
        </div>
        <div className="omdP1">
          <div className="omr1">
            <button onClick={() => navigate('/verification-usager')}>
              🔍 Vérifier existence
            </button>
          </div>
          <div className="omr2">
            <button onClick={() => navigate('/verification-usager')}>
              📊 Vérifier graphique
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainCards;