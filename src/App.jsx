// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Importer la page d'authentification comme page d'accueil
import Authentification from './pages/Authentification';
import Dashboard from './pages/Dashboard';
import AjoutUsager from './pages/AjoutUsager';
import VerificationUsager from './pages/VerificationUsager';
import AjoutEvenement from './pages/AjoutEvenement';
import PayementChoix from './pages/PayementChoix';
import TableauDB from './pages/TableauDB';
import DateOcc from './pages/date_occ';
import DateGrandSurface from './pages/date_grandSurface';
import DateBus from './pages/date_bus';
import DateNigth from './pages/date_nigth';
import Dateautre from './pages/date_autre';
import Facture from './pages/fact';
import Tele from './pages/tele_radio';
import Hotel from './pages/hotel_class';  
import Gerepaiement from './pages/gere-paiement';
import Gestioncontra from './pages/gestion_contra'; 
import Gestiondossier from './pages/gestion_dossier';
import Gestusagercrud from './pages/gestion_crud';
import NotificationAdmin from './pages/notification_admin';
import ConfirmePaiement from './pages/ConfirmePaiement';
import ConfirmationDossier from './pages/ConfirmationDossier'; // ⭐ NOUVEAU

function App() {
  return (
    <Routes>
      {/* Page d'accueil = Authentification */}
      <Route path="/" element={<Authentification />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/ajout-usager" element={<AjoutUsager />} />
      <Route path="/verification-usager" element={<VerificationUsager />} />
      <Route path="/ajout-evenement" element={<AjoutEvenement />} />
      <Route path="/billan" element={<PayementChoix />} />
      <Route path="/tableau-db" element={<TableauDB />} />
      <Route path="/date_occ" element={<DateOcc />} />
      <Route path="/date-grandsurface" element={<DateGrandSurface />} />
      <Route path="/date-bus" element={<DateBus />} />
      <Route path="/night-club" element={<DateNigth />} />
      <Route path="/autre-usager" element={<Dateautre />} />
      <Route path="/facture-usager" element={<Facture />} />
      <Route path="/tele-radio" element={<Tele />} />
      <Route path="/Hotel_occ" element={<Hotel />} />
      <Route path="/gere-payer" element={<Gerepaiement />} />
      <Route path="/gere-contra" element={<Gestioncontra />} />
      <Route path="/gere-dossier" element={<Gestiondossier />} />
      <Route path="/gestion_crud" element={<Gestusagercrud />} />
      <Route path="/notification_admin" element={<NotificationAdmin />} />
      <Route path="/confirme-paiement" element={<ConfirmePaiement />} />
      <Route path="/confirmation-dossier" element={<ConfirmationDossier />} /> {/* ⭐ NOUVEAU */}
    </Routes>
  );
}

export default App;