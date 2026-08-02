// src/pages/pdf/magasin_pdf.jsx
import jsPDF from 'jspdf';

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const jour = date.getDate();
    const mois = date.toLocaleString('fr-FR', { month: 'long' });
    const annee = date.getFullYear();
    return `${jour} ${mois} ${annee}`;
  } catch (error) {
    return dateString;
  }
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const getCurrentDate = () => {
  const date = new Date();
  const mois = date.toLocaleString('fr-FR', { month: 'long' });
  const jour = date.getDate();
  const annee = date.getFullYear();
  return `${jour} ${mois} ${annee}`;
};

const drawCheckbox = (doc, x, y, checked) => {
  doc.setLineWidth(0.3);
  doc.rect(x, y - 3.2, 3.2, 3.2);
  if (checked) {
    doc.line(x, y - 3.2, x + 3.2, y);
    doc.line(x + 3.2, y - 3.2, x, y);
  }
};

// Fonction pour dessiner une ligne soulignée
const drawUnderline = (doc, text, x, y, textWidth) => {
  const lineY = y + 1.5;
  doc.line(x, lineY, x + textWidth, lineY);
};

export const generateMagasinPDF = (usager, paymentDetails) => {
  try {
    console.log('========== GÉNÉRATION PDF MAGASIN ==========');
    console.log('Données usager reçues:', usager);
    console.log('Données paiement:', paymentDetails);
    
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 15;
    const lineSpacing = 6.5;
    let yPos = 20;
    
    // RENSEIGNEMENTS GENERAUX
    const demandeur = usager?.demandeur || '';
    const denomination = usager?.denomination || '';
    const adresseSiege = usager?.adresse_siege || '';
    const nifStat = usager?.nif_stat || '';
    const telephone = usager?.telephone || '';
    const email = usager?.email || '';
    const nombreMagasins = usager?.nombre_magasins || 0;
    
    // REPRESENTANT LEGAL
    const representantNom = usager?.representant_nom || '';
    const representantAdresse = usager?.representant_adresse || '';
    const representantTel = usager?.representant_tel || '';
    const representantCin = usager?.representant_cin || '';
    
    let cinDelivree = '';
    if (usager?.representant_cin_delivree) {
      try {
        const d = new Date(usager.representant_cin_delivree);
        if (!isNaN(d.getTime())) {
          cinDelivree = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`;
        }
      } catch(e) {}
    }
    
    const representantCinLieu = usager?.representant_cin_lieu || '';
    const representantFonction = usager?.representant_fonction || '';
    
    // ACTIVITE
    const activite = usager?.activite || '';
    
    // MOYENS DE COMMUNICATION
    let radioTaux = 0, lecteurTaux = 0, tvTaux = 0, autresTaux = 0;
    
    try {
      let moyensComm = usager?.moyens_communication;
      console.log('Moyens communication bruts:', moyensComm);
      
      if (moyensComm) {
        if (typeof moyensComm === 'string') {
          moyensComm = JSON.parse(moyensComm);
        }
        
        if (moyensComm && typeof moyensComm === 'object') {
          if (moyensComm.radio) {
            radioTaux = typeof moyensComm.radio === 'object' ? (Number(moyensComm.radio.taux) || 0) : Number(moyensComm.radio) || 0;
          }
          if (moyensComm.lecteur) {
            lecteurTaux = typeof moyensComm.lecteur === 'object' ? (Number(moyensComm.lecteur.taux) || 0) : Number(moyensComm.lecteur) || 0;
          }
          if (moyensComm.tv) {
            tvTaux = typeof moyensComm.tv === 'object' ? (Number(moyensComm.tv.taux) || 0) : Number(moyensComm.tv) || 0;
          }
          if (moyensComm.autres) {
            autresTaux = typeof moyensComm.autres === 'object' ? (Number(moyensComm.autres.taux) || 0) : Number(moyensComm.autres) || 0;
          }
          
          if (radioTaux === 0 && moyensComm['Radio - Poste TSF']) {
            radioTaux = Number(moyensComm['Radio - Poste TSF']) || 0;
          }
        }
      }
    } catch(e) {
      console.error('Erreur parsing moyens:', e);
    }
    
    console.log('Taux extraits:', { radioTaux, lecteurTaux, tvTaux, autresTaux });
    
    const radioActif = radioTaux > 0;
    const lecteurActif = lecteurTaux > 0;
    const tvActif = tvTaux > 0;
    const autresActif = autresTaux > 0;
    const sommeTaux = radioTaux + lecteurTaux + tvTaux + autresTaux;
    
    // Montant total annuel
    const montantMensuel = parseFloat(usager?.montant_mensuel) || 0;
    const totalAnnuelBase = montantMensuel * 12;
    
    // AUTRES
    const aCompterDu = usager?.a_compter_du ? formatDate(usager.a_compter_du) : '';
    const echeance = usager?.echeance ? formatDate(usager.echeance) : '';
    const confirmationNom = usager?.confirmation_nom || usager?.demandeur || '';
    const lieuSignature = usager?.lieu_signature || 'Antananarivo';
    const dateSignature = usager?.date_signature ? formatDate(usager.date_signature) : getCurrentDate();
    const numeroDossier = usager?.numero_dossier_utilisateur || '';
    
    console.log('Données extraites:', { demandeur, denomination, representantNom, nombreMagasins, sommeTaux, totalAnnuelBase });
    
    // TITRE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titre1 = 'OFFICE MALAGASY DU DROIT D\'AUTEUR';
    const titre1Width = doc.getStringUnitWidth(titre1) * 14 / doc.internal.scaleFactor;
    doc.text(titre1, pageWidth / 2, yPos, { align: 'center' });
    drawUnderline(doc, titre1, pageWidth / 2 - titre1Width / 2, yPos, titre1Width);
    yPos += lineSpacing + 2;
    
    doc.setFontSize(13);
    const titre2 = 'FICHE DE RENSEIGNEMENTS – MAGASIN ET AUTRES';
    const titre2Width = doc.getStringUnitWidth(titre2) * 13 / doc.internal.scaleFactor;
    doc.text(titre2, pageWidth / 2, yPos, { align: 'center' });
    drawUnderline(doc, titre2, pageWidth / 2 - titre2Width / 2, yPos, titre2Width);
    yPos += lineSpacing + 5;
    
    if (numeroDossier) {
      doc.setFontSize(10);
      doc.text(`N° DOSSIER : ${numeroDossier}`, pageWidth - marginX - 20, yPos - 8, { align: 'right' });
    }
    
    // SECTION 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const section1 = '1) RENSEIGNEMENTS GENERAUX :';
    doc.text(section1, marginX, yPos);
    const section1Width = doc.getStringUnitWidth(section1) * 12 / doc.internal.scaleFactor;
    drawUnderline(doc, section1, marginX, yPos, section1Width);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Demandeur : ${demandeur || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Dénomination : ${denomination || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse du Siège / lieu d’exploitation : ${adresseSiege || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`NIF / N° STAT : ${nifStat || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`Tél. : ${telephone || '……………………………………'}`, marginX + 100, yPos);
    yPos += lineSpacing;
    
    doc.text(`Nombre de magasin : ${nombreMagasins > 0 ? nombreMagasins : '………………'}`, marginX + 5, yPos);
    doc.text(`E-mail : ${email || '……………………………………'}`, marginX + 100, yPos);
    yPos += lineSpacing + 3;
    
    // SECTION 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const section2 = '2) REPRESENTANT LEGAL :';
    doc.text(section2, marginX, yPos);
    const section2Width = doc.getStringUnitWidth(section2) * 12 / doc.internal.scaleFactor;
    drawUnderline(doc, section2, marginX, yPos, section2Width);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Nom et prénoms : ${representantNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse personnelle : ${representantAdresse || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Téléphone : ${representantTel || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`N° Carte d’identité nationale : ${representantCin || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    let cinText = `Délivrée le : ${cinDelivree || '……………………………………'}`;
    if (representantCinLieu) cinText += ` à ${representantCinLieu}`;
    doc.text(cinText, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Fonction : ${representantFonction || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing + 3;
    
    // SECTION 3
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const section3 = '3) RENSEIGNEMENTS SUR L\'ACTIVITE :';
    doc.text(section3, marginX, yPos);
    const section3Width = doc.getStringUnitWidth(section3) * 12 / doc.internal.scaleFactor;
    drawUnderline(doc, section3, marginX, yPos, section3Width);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Activité : ${activite || '…………………………………………………………………………………......................'}`, marginX + 5, yPos);
    yPos += lineSpacing + 2;
    
    doc.text(`   Nombre de magasin : ${nombreMagasins > 0 ? nombreMagasins : '…………………………………………………………………………………......................'}`, marginX + 5, yPos);
    yPos += lineSpacing + 2;
    
    doc.text('Moyen de communication :', marginX + 5, yPos);
    yPos += lineSpacing + 2;
    
    const checkboxX = marginX + 70;
    
    doc.text('Radio - Poste TSF', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX, yPos, radioActif);
    doc.text(`: Taux : ${formatNumber(radioTaux)} Ar/an`, checkboxX + 8, yPos);
    yPos += lineSpacing;
    
    doc.text('Lecteur', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX, yPos, lecteurActif);
    doc.text(`: Taux : ${formatNumber(lecteurTaux)} Ar/an`, checkboxX + 8, yPos);
    yPos += lineSpacing;
    
    doc.text('TV', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX, yPos, tvActif);
    doc.text(`: Taux : ${formatNumber(tvTaux)} Ar/an`, checkboxX + 8, yPos);
    yPos += lineSpacing;
    
    doc.text('Autres', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX, yPos, autresActif);
    doc.text(`: Taux : ${formatNumber(autresTaux)} Ar/an`, checkboxX + 8, yPos);
    yPos += lineSpacing + 5;
    
    // TOTAL
    doc.text(`Soit au Total : ${formatNumber(sommeTaux)} Ariary. (${formatNumber(totalAnnuelBase)} / an)`, marginX + 5, yPos);
    yPos += lineSpacing + 2;
    
    doc.text(`A compter du : ${aCompterDu || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    doc.text(`Echéance : ${echeance || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing + 5;
    
    // SIGNATURE
    doc.text(`Je soussigné(e) Mr/Mme ${confirmationNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.setFont('helvetica', 'bold');
    doc.text('confirme sous ma responsabilité la sincérité et l\'exactitude des renseignements ci-dessus et', marginX + 5, yPos);
    yPos += lineSpacing;
    doc.text('m\'engage à respecter les obligations prévues par le contrat général de représentation.', marginX + 5, yPos);
    yPos += lineSpacing + 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Fait à ${lieuSignature}, le ${dateSignature}`, pageWidth - marginX, yPos, { align: 'right' });
    yPos += lineSpacing + 5;
    
    doc.text('(Signature)', pageWidth - marginX - 20, yPos, { align: 'center' });
    
    const fileName = `magasin_${(denomination || 'document').replace(/\s/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF Magasin généré avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur PDF Magasin:', error);
    throw error;
  }
};