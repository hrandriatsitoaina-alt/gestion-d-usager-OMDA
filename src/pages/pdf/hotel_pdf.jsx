// src/pages/pdf/hotel_pdf.jsx
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

export const generateHotelPDF = (usager, paymentDetails) => {
  try {
    console.log('========== GÉNÉRATION PDF HÔTEL ==========');
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
    const etoiles = usager?.etoiles || '';
    const ravinalaChecked = usager?.ravinala === true || usager?.ravinala === 'true' || usager?.ravinala === 1;
    
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
          // Gérer différents formats possibles
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
          
          // Fallback pour les anciens formats
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
    
    // Récupérer le montant total annuel de la base (montant_mensuel * 12)
    const montantMensuel = parseFloat(usager?.montant_mensuel) || 0;
    const totalAnnuelBase = montantMensuel * 12;
    
    // AUTRES
    const aCompterDu = usager?.a_compter_du ? formatDate(usager.a_compter_du) : '';
    const echeance = usager?.echeance ? formatDate(usager.echeance) : '';
    const confirmationNom = usager?.confirmation_nom || usager?.demandeur || '';
    const lieuSignature = usager?.lieu_signature || 'Antananarivo';
    const dateSignature = usager?.date_signature ? formatDate(usager.date_signature) : getCurrentDate();
    const numeroDossier = usager?.numero_dossier_utilisateur || '';
    
    console.log('Données extraites:', { demandeur, denomination, representantNom, representantCin, radioTaux, sommeTaux, totalAnnuelBase });
    
    // TITRE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('OFFICE MALAGASY DU DROIT D\'AUTEUR', pageWidth / 2, yPos, { align: 'center' });
    yPos += lineSpacing + 2;
    
    doc.setFontSize(13);
    doc.text('FICHE DE RENSEIGNEMENTS – HOTEL / RESTAURANT', pageWidth / 2, yPos, { align: 'center' });
    yPos += lineSpacing + 5;
    
    if (numeroDossier) {
      doc.setFontSize(10);
      doc.text(`N° DOSSIER : ${numeroDossier}`, pageWidth - marginX - 20, yPos - 8, { align: 'right' });
    }
    
    // SECTION 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1) RENSEIGNEMENTS GENERAUX :', marginX, yPos);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Demandeur : ${demandeur || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Dénomination : ${denomination || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse du Siège : ${adresseSiege || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`NIF / N° STAT : ${nifStat || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`Tél. : ${telephone || '……………………………………'}`, marginX + 100, yPos);
    yPos += lineSpacing;
    
    doc.text(`Catégorie Tourisme : Etoiles ${etoiles || '…'}`, marginX + 5, yPos);
    drawCheckbox(doc, marginX + 80, yPos, ravinalaChecked);
    doc.text('Ravinala', marginX + 85, yPos);
    doc.text(`E-mail : ${email || '……………………………………'}`, marginX + 130, yPos);
    yPos += lineSpacing + 3;
    
    // SECTION 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2) REPRESENTANT LEGAL :', marginX, yPos);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Nom et prénoms : ${representantNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse personnelle : ${representantAdresse || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Téléphone : ${representantTel || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`N° CIN : ${representantCin || '……………………………………'}`, marginX + 5, yPos);
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
    doc.text('3) RENSEIGNEMENTS SUR L\'ACTIVITE :', marginX, yPos);
    yPos += lineSpacing + 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Activité :', marginX + 9, yPos);
    
    drawCheckbox(doc, marginX + 28, yPos, activite === 'hotellerie');
    doc.text('Hôtellerie', marginX + 33, yPos);
    
    drawCheckbox(doc, marginX + 68, yPos, activite === 'restauration');
    doc.text('Restauration', marginX + 73, yPos);
    
    drawCheckbox(doc, marginX + 115, yPos, activite === 'hotellerie_restauration');
    doc.text('Hôtellerie et restauration', marginX + 120, yPos);
    yPos += lineSpacing + 3;
    
    doc.text('Moyen de communication :', marginX + 9, yPos);
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
    
    // LIGNE CORRIGÉE - Affiche: Soit au Total : 6000 Ariary. (70 000 / an)
    // 6000 = somme des taux (radio + lecteur + TV + autres)
    // 70 000 = total annuel de la base (montant_mensuel * 12)
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
    
    const fileName = `hotel_${(denomination || 'document').replace(/\s/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF généré avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur PDF:', error);
    throw error;
  }
};