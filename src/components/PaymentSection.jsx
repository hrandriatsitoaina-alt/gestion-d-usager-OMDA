import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSection = () => {
  const navigate = useNavigate();

  return (
    <div className="omda16A">
      <div className="omda17">
        <div className="omda17A">
          <h1>Gestion d'événements et paiement</h1>
          <h3>Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure esse debitis natus, consequatur molestias quos in qui fugiat odit saepe corrupti voluptate corporis aliquam adipisci eum voluptates consequuntur non eaque!</h3>
          <button onClick={() => navigate('/choix-payement')}>💰 Nouveau Payement</button>
        </div>
        
        <div className="omda17B">
          <div className="omdf">
            <div className="omda177A">
              <h1>Liste des paiements :</h1>
              <h3>Suivi et gestion des paiements</h3>
              <hr />
              <div className="omda17Z">
                {[
                  { icon: '✏️', value: '20' },
                  { icon: '📑', value: '90' },
                  { icon: '📈', value: '123' },
                  { icon: '📇', value: '21' },
                  { icon: '👔', value: '90' },
                  { icon: '💰', value: '20%' }
                ].map((item, idx) => (
                  <h2 key={idx}>{item.icon} <p>{item.value}</p></h2>
                ))}
                <div className="omda7Q"><a href="#">Gérer paiement ➕</a></div>
                
              </div>
            </div>



<div className="ol2A">
  <h5>Flux de Paiements</h5>
  
  <div className="omda177B">
    <div className="bar-chart">
      <div className="bar-item h-60"><span>60%</span></div>
      <div className="bar-item h-90"><span>90%</span></div>
      <div className="bar-item h-45"><span>45%</span></div>
      <div className="bar-item h-75"><span>75%</span></div>
    </div>
    
    <div className="chart-line"></div>
  </div>

  <div className="label-row">
    <span>Sem 1</span>
    <span>Sem 2</span>
    <span>Sem 3</span>
    <span>Sem 4</span>
  </div>
</div>

          </div>
          
          <div className="omdasac">
            <div className="osac1" onClick={() => navigate('/facture-usager')}><a href="#">📝 Gestion facture 📝</a></div>
            <div className="osac2"><a href="#">💳 Mode paiement 💳</a></div>
            <div className="osac3"><a href="#">📄 Gestion quittance 📄</a></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;