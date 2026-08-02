// src/pages/pdf/bus_pdf.jsx
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

const drawUnderline = (doc, text, x, y, textWidth) => {
  const lineY = y + 1.5;
  doc.line(x, lineY, x + textWidth, lineY);
};

export const generateBusPDF = (usager, paymentDetails) => {
  try {
    console.log('========== GÉNÉRATION PDF BUS ==========');
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
    
    // INFORMATIONS SPECIFIQUES BUS
    const nombreVehicules = usager?.nombre_vehicules || 0;
    const lignes = usager?.lignes || '';
    const typeBus = usager?.type_bus || '';
    const trajet = usager?.trajet || '';
    const horaires = usager?.horaires || '';
    const zonesDesservies = usager?.zones_desservies || '';
    
    // MONTANTS
    const montantMensuel = parseFloat(usager?.montant_mensuel) || 0;
    const fraisDossier = parseFloat(usager?.frais_dossier) || 0;
    const totalAnnuel = montantMensuel * 12;
    
    // AUTRES
    const aCompterDu = usager?.a_compter_du ? formatDate(usager.a_compter_du) : '';
    const echeance = usager?.echeance ? formatDate(usager.echeance) : '';
    const confirmationNom = usager?.confirmation_nom || usager?.demandeur || '';
    const lieuSignature = usager?.lieu_signature || 'Antananarivo';
    const dateSignature = usager?.date_signature ? formatDate(usager.date_signature) : getCurrentDate();
    const numeroDossier = usager?.numero_dossier_utilisateur || '';
    
    console.log('Données extraites:', { demandeur, denomination, representantNom, nombreVehicules, lignes, trajet, montantMensuel });
    
    // TITRE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titre1 = 'OFFICE MALAGASY DU DROIT D\'AUTEUR';
    const titre1Width = doc.getStringUnitWidth(titre1) * 14 / doc.internal.scaleFactor;
    doc.text(titre1, pageWidth / 2, yPos, { align: 'center' });
    drawUnderline(doc, titre1, pageWidth / 2 - titre1Width / 2, yPos, titre1Width);
    yPos += lineSpacing + 2;
    
    doc.setFontSize(13);
    const titre2 = 'FICHE DE RENSEIGNEMENTS – BUS / TRANSPORT';
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
    
    doc.text(`E-mail : ${email || '……………………………………'}`, marginX + 5, yPos);
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
    doc.text(`Nombre de véhicules : ${nombreVehicules > 0 ? formatNumber(nombreVehicules) : '………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Lignes exploitées : ${lignes || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Type de bus : ${typeBus || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Trajet : ${trajet || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Horaires : ${horaires || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Zones desservies : ${zonesDesservies || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing + 5;
    
    // SECTION 4
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const section4 = '4) REDEVANCES :';
    doc.text(section4, marginX, yPos);
    const section4Width = doc.getStringUnitWidth(section4) * 12 / doc.internal.scaleFactor;
    drawUnderline(doc, section4, marginX, yPos, section4Width);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Montant mensuel : ${formatNumber(montantMensuel)} Ariary`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Soit au Total annuel : ${formatNumber(totalAnnuel)} Ariary`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Frais de dossier : ${formatNumber(fraisDossier)} Ariary`, marginX + 5, yPos);
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
    
    const fileName = `bus_${(denomination || 'document').replace(/\s/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF Bus généré avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur PDF Bus:', error);
    throw error;
  }
};