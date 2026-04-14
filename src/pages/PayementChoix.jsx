import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/gestionPaiement.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const PayementChoix = () => {
  const navigate = useNavigate();
  const [usagers, setUsagers] = useState([
    { id: 1342, organisateur: 'IVENCO', responsable: 'RAKOTONIAINA', lieu: 'ANTSAHAMANITRA', nbEvenements: 30, montant: 530000, statut: 'payé', retard: 0 },
    { id: 1142, organisateur: 'LA MOZIKA', responsable: 'SOARY', lieu: 'COLESIUM', nbEvenements: 10, montant: 630000, statut: 'payé', retard: 0 },
    { id: 1392, organisateur: 'LAC PROD', responsable: 'HERY', lieu: 'COLBERT', nbEvenements: 1, montant: 530000, statut: 'non payé', retard: 45 },
    { id: 1456, organisateur: 'FENOARIVO', responsable: 'RANDRIAN', lieu: 'MAHAJANGA', nbEvenements: 25, montant: 780000, statut: 'partiel', retard: 15 },
    { id: 1567, organisateur: 'TSANGANGA', responsable: 'ANDRIANA', lieu: 'TOAMASINA', nbEvenements: 40, montant: 1200000, statut: 'non payé', retard: 60 },
  ]);

  const [filtre, setFiltre] = useState('tout');
  const [recherche, setRecherche] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newUsager, setNewUsager] = useState({ organisateur: '', responsable: '', lieu: '', nbEvenements: 0, montant: 0 });

  const getRetardClass = (retard) => {
    if (retard > 30) return 'retard-rouge';
    if (retard >= 10) return 'retard-bleu';
    if (retard > 0) return 'retard-jaune';
    return 'retard-vert';
  };

  const getRetardTexte = (retard) => {
    if (retard === 0) return '✅ À jour';
    if (retard > 30) return `🔴 ${retard} jours de retard`;
    if (retard >= 10) return `🟡 ${retard} jours de retard`;
    return `🟠 ${retard} jours de retard`;
  };

  const usagersFiltres = usagers.filter(u => {
    if (filtre === 'payé' && u.statut !== 'payé') return false;
    if (filtre === 'non payé' && u.statut !== 'non payé') return false;
    if (filtre === 'partiel' && u.statut !== 'partiel') return false;
    if (recherche && !u.organisateur.toLowerCase().includes(recherche.toLowerCase()) && !u.responsable.toLowerCase().includes(recherche.toLowerCase())) return false;
    return true;
  });

  const handlePaiement = (id) => {
    setUsagers(usagers.map(u => 
      u.id === id ? { ...u, statut: 'payé', retard: 0 } : u
    ));
    alert(`💰 Paiement en ligne simulé pour l'usager ${id}. Montant réglé.`);
  };

  const handleAjout = () => {
    if (!newUsager.organisateur || !newUsager.responsable || !newUsager.lieu || newUsager.nbEvenements <= 0 || newUsager.montant <= 0) {
      alert('⚠️ Veuillez remplir tous les champs correctement.');
      return;
    }
    const newId = Math.max(...usagers.map(u => u.id)) + 1;
    setUsagers([...usagers, { 
      id: newId, 
      ...newUsager, 
      statut: 'non payé', 
      retard: 0 
    }]);
    setNewUsager({ organisateur: '', responsable: '', lieu: '', nbEvenements: 0, montant: 0 });
    setShowModal(false);
    alert('✅ Usager ajouté avec succès !');
  };

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      
      <main className="contenu">

  {/* otion */}
  <div class="cont">
         <div class="cont1">
                 <div class="cont11">
                    <select class="form-select">
                        <option value="">Sélectionnez votre usage</option>
                        <option value="OCC">OCC</option>
                        <option value="Bus">Bus</option>
                        <option value="Grand Surface">Grand Surface</option>
                        <option value="Night club">Night club</option>
                        <option value="Télé/Radio">Télé/Radio</option>
                        <option value="Hôtel">Hôtel</option>
                    </select>
                 </div>

                 <div class="cont12">
                      <div class="btn"><button> ➕ Ajout Nouveau</button></div>
                      <div class="btn"><button> ✔ Valider</button></div>
                 </div>
         </div>
         <div class="cont2">
           <div class="cont21"><h3>Éléments sélectionnés : <span>OCC</span></h3></div>
           <div class="cont22">
                <div class="izr">
                     <div><h3>Usg : <span>Occ</span></h3></div>
                     <div><h4>Ins: <span>30</span> |  Fonct : <span>40</span> | Ret : <span>300</span></h4></div>
                </div>
          </div>
         </div><br />
   </div>

  {/* option */}


        <section className="paiement-section">
          <div className="paiement-header">
            <h1>📋 Gestion des paiements</h1>
            <div className="filtres-recherche">
              <select value={filtre} onChange={(e) => setFiltre(e.target.value)} className="filtre-select">
                <option value="tout">🌐 Tous</option>
                <option value="payé">✅ Payés</option>
                <option value="non payé">❌ Non payés</option>
                <option value="partiel">🔄 Partiels</option>
              </select>
              <input 
                type="text" 
                placeholder="🔍 Rechercher (organisateur/responsable)" 
                value={recherche} 
                onChange={(e) => setRecherche(e.target.value)} 
                className="recherche-input" 
              />
              <button className="btn-ajout" onClick={() => setShowModal(true)}>
                ➕ Ajouter
              </button>
            </div>
          </div>

          <div className="tableau-paiements">
            <div className="table-header">
              <div>ID</div>
              <div>Organisateur</div>
              <div>Responsable</div>
              <div>Lieu</div>
              <div>Événements</div>
              <div>Montant (Ar)</div>
              <div>Situation</div>
              <div>Action</div>
            </div>
            {usagersFiltres.map(u => (
              <div key={u.id} className="table-row">
                <div>{u.id}</div>
                <div>{u.organisateur}</div>
                <div>{u.responsable}</div>
                <div>{u.lieu}</div>
                <div>{u.nbEvenements}</div>
                <div>{u.montant.toLocaleString()} Ar</div>
                <div>
                  <span className={`situation-badge ${u.statut === 'payé' ? 'paye' : u.statut === 'partiel' ? 'partiel' : 'non-paye'}`}>
                    {u.statut === 'payé' ? '✅ Payé' : u.statut === 'partiel' ? '🔄 Partiel' : '❌ Non payé'}
                  </span>
                  <span className={getRetardClass(u.retard)}>
                    {getRetardTexte(u.retard)}
                  </span>
                </div>
                <div>
                  {u.statut !== 'payé' && (
                    <button className="btn-payer" onClick={() => handlePaiement(u.id)}>
                      💳 Payer en ligne
                    </button>
                  )}
                  {u.statut === 'payé' && <span className="paye-texte">✔ Réglé</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="mive">
            <div><h3>⬅️ Retour à la page d'accueil</h3></div>
            <div><button className="btn-modern outline" onClick={() => navigate('/dashboard')}>← Retour</button></div>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>➕ Ajouter un usager / événement</h2>
            <div className="modal-form">
              <input type="text" placeholder="Organisateur" value={newUsager.organisateur} onChange={(e) => setNewUsager({...newUsager, organisateur: e.target.value})} />
              <input type="text" placeholder="Responsable" value={newUsager.responsable} onChange={(e) => setNewUsager({...newUsager, responsable: e.target.value})} />
              <input type="text" placeholder="Lieu" value={newUsager.lieu} onChange={(e) => setNewUsager({...newUsager, lieu: e.target.value})} />
              <input type="number" placeholder="Nombre d'événements" value={newUsager.nbEvenements} onChange={(e) => setNewUsager({...newUsager, nbEvenements: parseInt(e.target.value) || 0})} />
              <input type="number" placeholder="Montant (Ar)" value={newUsager.montant} onChange={(e) => setNewUsager({...newUsager, montant: parseInt(e.target.value) || 0})} />
              <div className="modal-buttons">
                <button className="btn-valider" onClick={handleAjout}>✔ Valider</button>
                <button className="btn-annuler" onClick={() => setShowModal(false)}>✖ Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PayementChoix;