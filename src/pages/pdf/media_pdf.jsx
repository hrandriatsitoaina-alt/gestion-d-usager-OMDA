// src/pages/pdf/media_pdf.jsx
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

const drawUnderline = (doc, text, x, y, textWidth) => {
  const lineY = y + 1.5;
  doc.line(x, lineY, x + textWidth, lineY);
};

export const generateMediaPDF = (usager, paymentDetails) => {
  try {
    console.log('========== GÉNÉRATION PDF MEDIA ==========');
    console.log('Données usager reçues:', usager);
    console.log('Données paiement:', paymentDetails);
    
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 15;
    const lineSpacing = 6.5;
    let yPos = 20;
    
    // RENSEIGNEMENTS GENERAUX - PROPRIETAIRE
    const proprietaireNom = usager?.proprietaire_nom || '';
    const proprietaireAdresse = usager?.proprietaire_adresse || '';
    const proprietaireTel = usager?.proprietaire_tel || '';
    const proprietaireCin = usager?.proprietaire_cin || '';
    
    let proprietaireCinDelivree = '';
    if (usager?.proprietaire_cin_delivree) {
      try {
        const d = new Date(usager.proprietaire_cin_delivree);
        if (!isNaN(d.getTime())) {
          proprietaireCinDelivree = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`;
        }
      } catch(e) {}
    }
    
    const proprietaireCinLieu = usager?.proprietaire_cin_lieu || '';
    
    // REPRESENTANT LEGAL
    const representantNom = usager?.representant_nom || '';
    const representantAdresse = usager?.representant_adresse || '';
    const representantTel = usager?.representant_tel || '';
    const representantCin = usager?.representant_cin || '';
    
    let representantCinDelivree = '';
    if (usager?.representant_cin_delivree) {
      try {
        const d = new Date(usager.representant_cin_delivree);
        if (!isNaN(d.getTime())) {
          representantCinDelivree = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`;
        }
      } catch(e) {}
    }
    
    const representantCinLieu = usager?.representant_cin_lieu || '';
    const representantPouvoirDate = usager?.representant_pouvoir_date ? formatDate(usager.representant_pouvoir_date) : '';
    const representantPouvoirPar = usager?.representant_pouvoir_par || '';
    const representantFonction = usager?.representant_fonction || '';
    
    // INFORMATIONS MEDIA
    const denomination = usager?.denomination || '';
    const frequence = usager?.frequence || '';
    const canal = usager?.canal || '';
    const siege = usager?.siege || '';
    const telephone = usager?.telephone || '';
    const email = usager?.email || '';
    const nif = usager?.nif || '';
    const stat = usager?.stat || '';
    const taux = usager?.taux || '';
    
    // COUVERTURE
    const couvercleCapitale = usager?.couvercle_capitale || false;
    const couvercleChefLieuProvince = usager?.couvercle_chef_lieu_province || false;
    const couvercleChefLieuRegion = usager?.couvercle_chef_lieu_region || false;
    const couvercleDistrict = usager?.couvercle_district || false;
    
    // HORAIRES
    const horairesJusqua12 = usager?.horaires_jusqua12 || false;
    const horaires13a24 = usager?.horaires_13a24 || false;
    
    // REGIONS
    let regionsDetail = [];
    try {
      if (usager?.regions_detail) {
        regionsDetail = typeof usager.regions_detail === 'string' 
          ? JSON.parse(usager.regions_detail) 
          : usager.regions_detail;
      }
    } catch(e) {
      console.error('Erreur parsing regions:', e);
    }
    
    const hasRegions = usager?.has_regions || (regionsDetail.length > 0);
    
    // MONTANTS
    const montantMensuel = parseFloat(usager?.montant_mensuel) || 0;
    const fraisDossier = parseFloat(usager?.frais_dossier) || 0;
    const totalAnnuel = montantMensuel * 12;
    
    // AUTRES
    const aCompterDu = usager?.a_compter_du ? formatDate(usager.a_compter_du) : '';
    const echeance = usager?.echeance ? formatDate(usager.echeance) : '';
    const confirmationNom = usager?.confirmation_nom || '';
    const lieuSignature = usager?.lieu_signature || 'Antananarivo';
    const dateSignature = usager?.date_signature ? formatDate(usager.date_signature) : getCurrentDate();
    const numeroDossier = usager?.numero_dossier_utilisateur || '';
    
    console.log('Données extraites:', { denomination, proprietaireNom, representantNom, frequence, canal, montantMensuel });
    
    // TITRE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titre1 = 'OFFICE MALAGASY DU DROIT D\'AUTEUR';
    const titre1Width = doc.getStringUnitWidth(titre1) * 14 / doc.internal.scaleFactor;
    doc.text(titre1, pageWidth / 2, yPos, { align: 'center' });
    drawUnderline(doc, titre1, pageWidth / 2 - titre1Width / 2, yPos, titre1Width);
    yPos += lineSpacing + 2;
    
    doc.setFontSize(13);
    const titre2 = 'FICHE DE RENSEIGNEMENTS – TELEVISION / RADIO';
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
    doc.text(`Dénomination : ${denomination || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Fréquence : ${frequence || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`Canal : ${canal || '……………………………………'}`, marginX + 100, yPos);
    yPos += lineSpacing;
    
    doc.text(`Siège social : ${siege || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Tél. : ${telephone || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`E-mail : ${email || '……………………………………'}`, marginX + 100, yPos);
    yPos += lineSpacing;
    
    doc.text(`NIF : ${nif || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`STAT : ${stat || '……………………………………'}`, marginX + 100, yPos);
    yPos += lineSpacing;
    
    doc.text(`Taux : ${taux || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing + 3;
    
    // SECTION 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const section2 = '2) PROPRIETAIRE :';
    doc.text(section2, marginX, yPos);
    const section2Width = doc.getStringUnitWidth(section2) * 12 / doc.internal.scaleFactor;
    drawUnderline(doc, section2, marginX, yPos, section2Width);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Nom et prénoms : ${proprietaireNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse : ${proprietaireAdresse || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Téléphone : ${proprietaireTel || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`N° CIN : ${proprietaireCin || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    let cinText = `Délivrée le : ${proprietaireCinDelivree || '……………………………………'}`;
    if (proprietaireCinLieu) cinText += ` à ${proprietaireCinLieu}`;
    doc.text(cinText, marginX + 5, yPos);
    yPos += lineSpacing + 3;
    
    // SECTION 3
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const section3 = '3) REPRESENTANT LEGAL :';
    doc.text(section3, marginX, yPos);
    const section3Width = doc.getStringUnitWidth(section3) * 12 / doc.internal.scaleFactor;
    drawUnderline(doc, section3, marginX, yPos, section3Width);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Nom et prénoms : ${representantNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse : ${representantAdresse || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Téléphone : ${representantTel || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`N° CIN : ${representantCin || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    let cinRepText = `Délivrée le : ${representantCinDelivree || '……………………………………'}`;
    if (representantCinLieu) cinRepText += ` à ${representantCinLieu}`;
    doc.text(cinRepText, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Pouvoir en date du : ${representantPouvoirDate || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Par : ${representantPouvoirPar || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Fonction : ${representantFonction || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing + 3;
    
    // SECTION 4 - COUVERTURE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const section4 = '4) COUVERTURE :';
    doc.text(section4, marginX, yPos);
    const section4Width = doc.getStringUnitWidth(section4) * 12 / doc.internal.scaleFactor;
    drawUnderline(doc, section4, marginX, yPos, section4Width);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const checkboxX = marginX + 70;
    
    doc.text('Capitale (TNR)', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX, yPos, couvercleCapitale);
    yPos += lineSpacing;
    
    doc.text('Chef-lieu de province', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX, yPos, couvercleChefLieuProvince);
    yPos += lineSpacing;
    
    doc.text('Chef-lieu de région', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX, yPos, couvercleChefLieuRegion);
    yPos += lineSpacing;
    
    doc.text('District', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX, yPos, couvercleDistrict);
    yPos += lineSpacing + 3;
    
    // SECTION 5 - HORAIRES
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const section5 = '5) HORAIRES DE DIFFUSION :';
    doc.text(section5, marginX, yPos);
    const section5Width = doc.getStringUnitWidth(section5) * 12 / doc.internal.scaleFactor;
    drawUnderline(doc, section5, marginX, yPos, section5Width);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const checkboxX2 = marginX + 70;
    
    doc.text('Jusqu\'à 12h', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX2, yPos, horairesJusqua12);
    yPos += lineSpacing;
    
    doc.text('13h à 24h', marginX + 30, yPos);
    drawCheckbox(doc, checkboxX2, yPos, horaires13a24);
    yPos += lineSpacing + 3;
    
    // SECTION 6 - REGIONS
    if (hasRegions && regionsDetail.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const section6 = '6) DETAIL DES REGIONS :';
      doc.text(section6, marginX, yPos);
      const section6Width = doc.getStringUnitWidth(section6) * 12 / doc.internal.scaleFactor;
      drawUnderline(doc, section6, marginX, yPos, section6Width);
      yPos += lineSpacing + 2;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      for (const region of regionsDetail.slice(0, 5)) {
        const regionText = `• ${region.nom || ''}${region.type_equipement ? ` - ${region.type_equipement}` : ''}`;
        doc.text(regionText, marginX + 5, yPos);
        yPos += lineSpacing;
      }
      if (regionsDetail.length > 5) {
        doc.text(`... et ${regionsDetail.length - 5} autre(s) région(s)`, marginX + 5, yPos);
        yPos += lineSpacing;
      }
      yPos += 3;
    }
    
    // SECTION 7 - REDEVANCES
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const section7 = '7) REDEVANCES :';
    doc.text(section7, marginX, yPos);
    const section7Width = doc.getStringUnitWidth(section7) * 12 / doc.internal.scaleFactor;
    drawUnderline(doc, section7, marginX, yPos, section7Width);
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
    
    const fileName = `media_${(denomination || 'document').replace(/\s/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF Media généré avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur PDF Media:', error);
    throw error;
  }
};