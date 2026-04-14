import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AjoutUsager.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MiniSidebar from '../components/MiniSidebar';

const AjoutUsager = () => {
  const navigate = useNavigate();
  
  // États pour les étapes
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  
  // État pour stocker toutes les données du formulaire
  const [formData, setFormData] = useState({
    typeUsager: '',
    nomOrganisateur: '',
    contact: '',
    email: '',
    entreprise: '',
    cin: '',
    // Données spécifiques selon le type
    specificData: {}
  });
  
  // État pour la liste des enregistrements temporaires
  const [savedRecords, setSavedRecords] = useState([]);
  const [currentRecord, setCurrentRecord] = useState(null);

  // Champs spécifiques selon le type d'usager
  const getSpecificFields = () => {
    switch(selectedType) {
      case 'OCC':
        return (
          <div className="specific-fields">
            <div className="form-row">
              <div className="form-label"><h2>Nombre de places :</h2></div>
              <div className="form-input"><input type="number" placeholder="Nombre de places" className="input-style" /></div>
            </div>
            <div className="form-row">
              <div className="form-label"><h2>Date d'événement :</h2></div>
              <div className="form-input"><input type="date" className="input-style" /></div>
            </div>
          </div>
        );
      case 'Bus':
        return (
          <div className="specific-fields">
            <div className="form-row">
              <div className="form-label"><h2>Nombre de véhicules :</h2></div>
              <div className="form-input"><input type="number" placeholder="Nombre de bus" className="input-style" /></div>
            </div>
            <div className="form-row">
              <div className="form-label"><h2>Lignes desservies :</h2></div>
              <div className="form-input"><input type="text" placeholder="Ex: Ligne 1, Ligne 2" className="input-style" /></div>
            </div>
          </div>
        );
      case 'Grand Surface':
        return (
          <div className="specific-fields">
            <div className="form-row">
              <div className="form-label"><h2>Surface (m²) :</h2></div>
              <div className="form-input"><input type="number" placeholder="Surface en m²" className="input-style" /></div>
            </div>
            <div className="form-row">
              <div className="form-label"><h2>Chiffre d'affaires mensuel :</h2></div>
              <div className="form-input"><input type="number" placeholder="CA mensuel" className="input-style" /></div>
            </div>
          </div>
        );
      case 'Night club':
        return (
          <div className="specific-fields">
            <div className="form-row">
              <div className="form-label"><h2>Jauge maximale :</h2></div>
              <div className="form-input"><input type="number" placeholder="Capacité" className="input-style" /></div>
            </div>
            <div className="form-row">
              <div className="form-label"><h2>Horaires d'ouverture :</h2></div>
              <div className="form-input"><input type="text" placeholder="Ex: 22h - 05h" className="input-style" /></div>
            </div>
          </div>
        );
      case 'Télé/Radio':
        return (
          <div className="specific-fields">
            <div className="form-row">
              <div className="form-label"><h2>Fréquence :</h2></div>
              <div className="form-input"><input type="text" placeholder="Fréquence" className="input-style" /></div>
            </div>
            <div className="form-row">
              <div className="form-label"><h2>Audience :</h2></div>
              <div className="form-input"><input type="text" placeholder="Nombre d'auditeurs" className="input-style" /></div>
            </div>
          </div>
        );
      case 'Hôtel':
        return (
          <div className="specific-fields">
            <div className="form-row">
              <div className="form-label"><h2>Nombre d'étoiles :</h2></div>
              <div className="form-input"><input type="number" placeholder="Étoiles" className="input-style" /></div>
            </div>
            <div className="form-row">
              <div className="form-label"><h2>Nombre de chambres :</h2></div>
              <div className="form-input"><input type="number" placeholder="Chambres" className="input-style" /></div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setSelectedType(type);
    setFormData({ ...formData, typeUsager: type });
    // Réinitialiser les étapes quand on change le type
    setCurrentStep(1);
    setSavedRecords([]);
  };

  // Étape 1: Enregistrement partiel
  const handleStep1Save = (e) => {
    e.preventDefault();
    
    const record = {
      id: Date.now(),
      typeUsager: selectedType,
      nomOrganisateur: e.target.nomOrganisateur?.value || '',
      contact: e.target.contact?.value || '',
      email: e.target.email?.value || '',
      entreprise: e.target.entreprise?.value || '',
      cin: e.target.cin?.value || '',
      specificData: {}
    };
    
    // Récupérer les données spécifiques
    const specificInputs = e.target.querySelectorAll('.specific-fields input');
    specificInputs.forEach(input => {
      record.specificData[input.placeholder] = input.value;
    });
    
    setSavedRecords([...savedRecords, record]);
    setCurrentRecord(record);
    setCurrentStep(2);
    
    alert('Première partie enregistrée ! Passons à la deuxième partie.');
  };

  // Étape 2: Deuxième groupe d'inputs
  const handleStep2Save = (e) => {
    e.preventDefault();
    
    const additionalData = {
      adresse: e.target.adresse?.value || '',
      ville: e.target.ville?.value || '',
      codePostal: e.target.codePostal?.value || '',
      responsable: e.target.responsable?.value || '',
      telephoneSecondaire: e.target.telephoneSecondaire?.value || ''
    };
    
    // Mettre à jour l'enregistrement actuel
    const updatedRecords = savedRecords.map(record => 
      record.id === currentRecord.id 
        ? { ...record, additionalData: additionalData }
        : record
    );
    
    setSavedRecords(updatedRecords);
    setCurrentStep(3);
    alert('Deuxième partie enregistrée ! Voici le récapitulatif final.');
  };

  // Étape 3: Enregistrement final
  const handleFinalSubmit = () => {
    console.log('Données complètes:', savedRecords);
    alert('Usager ajouté avec succès en 3 parties !');
    navigate('/dashboard');
  };

  // Afficher le récapitulatif des enregistrements
  const renderSummary = () => {
    return (
      <div className="summary-container">
        <h3>📋 Récapitulatif des informations</h3>
        {savedRecords.map((record, index) => (
          <div key={record.id} className="summary-record">
            <h4>Partie {index + 1} - {record.typeUsager}</h4>
            <p><strong>Nom:</strong> {record.nomOrganisateur}</p>
            <p><strong>Contact:</strong> {record.contact}</p>
            <p><strong>Email:</strong> {record.email}</p>
            <p><strong>Entreprise:</strong> {record.entreprise}</p>
            <p><strong>CIN:</strong> {record.cin}</p>
            {record.specificData && Object.keys(record.specificData).length > 0 && (
              <div>
                <strong>Données spécifiques:</strong>
                {Object.entries(record.specificData).map(([key, value]) => (
                  <p key={key}>- {key}: {value}</p>
                ))}
              </div>
            )}
            {record.additionalData && (
              <div>
                <strong>Informations complémentaires:</strong>
                <p>- Adresse: {record.additionalData.adresse}</p>
                <p>- Ville: {record.additionalData.ville}</p>
                <p>- Code postal: {record.additionalData.codePostal}</p>
                <p>- Responsable: {record.additionalData.responsable}</p>
                <p>- Tél. secondaire: {record.additionalData.telephoneSecondaire}</p>
              </div>
            )}
            <hr />
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header />
      <Sidebar />
      <MiniSidebar />
      
      <main className="contenu">
        <section>
          <div className="OM15T"></div>
        </section>
        
        <section>
          <fieldset>
            <legend>Vous êtes en train d'ajouter un usager "{selectedType || 'Occasionnel'}"</legend>

            {/* Sélection du type d'usager */}
            <div className="cont">
              <div className="cont1">
                <div className="cont11">
                  <select className="form-select" value={selectedType} onChange={handleTypeChange}>
                    <option value="">Sélectionnez votre usage</option>
                    <option value="OCC">OCC</option>
                    <option value="Bus">Bus</option>
                    <option value="Grand Surface">Grand Surface</option>
                    <option value="Night club">Night club</option>
                    <option value="Télé/Radio">Télé/Radio</option>
                    <option value="Hôtel">Hôtel</option>
                  </select>
                </div>
                <div className="cont12">
                  <div className="btn"><button type="button" onClick={() => setCurrentStep(1)}>➕ Ajout Nouveau</button></div>
                  <div className="btn"><button type="button" onClick={() => currentStep === 3 && handleFinalSubmit()}>✔ Valider</button></div>
                </div>
              </div>
              <div className="cont2">
                <div className="cont21"><h3>Éléments sélectionnés : <span>{selectedType || 'Aucun'}</span></h3></div>
                <div className="cont22">
                  <div className="izr">
                    <div><h3>Usg : <span>{selectedType || '---'}</span></h3></div>
                    <div><h4>Étape: <span>{currentStep}/3</span></h4></div>
                  </div>
                </div>
              </div><br/>
            </div><br />

            {/* Étape 1: Premier formulaire */}
            {currentStep === 1 && selectedType && (
              <form onSubmit={handleStep1Save} className="Ajout1">
                <div className="form-row">
                  <div className="form-label"><h2>Nom de l'organisateur :</h2></div>
                  <div className="form-input">
                    <input type="text" name="nomOrganisateur" placeholder="Ex: Rakoto Jean" className="input-style" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label"><h2>Contact :</h2></div>
                  <div className="form-input">
                    <input type="tel" name="contact" placeholder="034 00 000 00" className="input-style" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label"><h2>Email :</h2></div>
                  <div className="form-input">
                    <input type="email" name="email" placeholder="exemple@mail.com" className="input-style" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label"><h2>Présentant entreprise :</h2></div>
                  <div className="form-input">
                    <input type="text" name="entreprise" placeholder="Nom de l'entreprise" className="input-style" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label"><h2>CIN :</h2></div>
                  <div className="form-input">
                    <input type="text" name="cin" placeholder="Numéro CIN" className="input-style" required />
                    <button type="button" className="btn-verify" onClick={() => alert('Vérification CIN...')}>Vérifier</button>
                  </div>
                </div>

                {getSpecificFields()}

                <div className="form-row">
                  <div className="form-label"></div>
                  <div className="form-input button-group">
                    <button type="submit" className="btn-primary">Enregistrer Partie 1/3</button>
                  </div>
                </div>
              </form>
            )}

            {/* Étape 2: Deuxième groupe d'inputs */}
            {currentStep === 2 && (
              <form onSubmit={handleStep2Save} className="Ajout1">
                <fieldset className="details-field">
                  <legend>Informations complémentaires (Partie 2/3)</legend>
                  
                  <div className="form-row">
                    <div className="form-label"><h2>Adresse :</h2></div>
                    <div className="form-input">
                      <input type="text" name="adresse" placeholder="Adresse complète" className="input-style" required />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-label"><h2>Ville :</h2></div>
                    <div className="form-input">
                      <input type="text" name="ville" placeholder="Ville" className="input-style" required />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-label"><h2>Code Postal :</h2></div>
                    <div className="form-input">
                      <input type="text" name="codePostal" placeholder="Code postal" className="input-style" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-label"><h2>Nom du responsable :</h2></div>
                    <div className="form-input">
                      <input type="text" name="responsable" placeholder="Responsable principal" className="input-style" required />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-label"><h2>Téléphone secondaire :</h2></div>
                    <div className="form-input">
                      <input type="tel" name="telephoneSecondaire" placeholder="Téléphone de secours" className="input-style" />
                    </div>
                  </div>
                </fieldset>

                <div className="form-row">
                  <div className="form-label"></div>
                  <div className="form-input button-group">
                    <button type="submit" className="btn-primary">Enregistrer Partie 2/3</button>
                  </div>
                </div>
              </form>
            )}

            {/* Étape 3: Récapitulatif et enregistrement final */}
            {currentStep === 3 && (
              <div className="Ajout1">
                {renderSummary()}
                
                <div className="form-row">
                  <div className="form-label"></div>
                  <div className="form-input button-group">
                    <button onClick={handleFinalSubmit} className="btn-primary">✅ Enregistrement Final (3/3)</button>
                    <button onClick={() => setCurrentStep(1)} className="btn-secondary">➕ Ajouter un autre</button>
                  </div>
                </div>
              </div>
            )}

            {!selectedType && (
              <div className="alert-message">
                ⚠️ Veuillez sélectionner un type d'usager pour commencer
              </div>
            )}

          </fieldset>
        </section>
      </main>
    </>
  );
};

export default AjoutUsager;