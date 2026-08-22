// src/pages/pdf/night_pdf.jsx
import jsPDF from 'jspdf';

// Fonctions utilitaires exportées
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const jour = date.getDate();
    const mois = date.toLocaleString('fr-FR', { month: 'long' });
    const annee = date.getFullYear();
    return `${jour} ${mois} ${annee}`;
  } catch (error) {
    return '';
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

// Fonction pour convertir un nombre en lettres (Ariary)
const nombreEnLettres = (num) => {
  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + nombreEnLettres(-num);
  
  const uniteMapping = {
    0: 'zéro', 1: 'un', 2: 'deux', 3: 'trois', 4: 'quatre',
    5: 'cinq', 6: 'six', 7: 'sept', 8: 'huit', 9: 'neuf',
    10: 'dix', 11: 'onze', 12: 'douze', 13: 'treize', 14: 'quatorze',
    15: 'quinze', 16: 'seize', 17: 'dix-sept', 18: 'dix-huit', 19: 'dix-neuf',
    20: 'vingt', 30: 'trente', 40: 'quarante', 50: 'cinquante',
    60: 'soixante', 70: 'soixante-dix', 80: 'quatre-vingts', 90: 'quatre-vingt-dix'
  };

  const convertHundreds = (n) => {
    if (n === 0) return '';
    if (n === 100) return 'cent';
    if (n < 100) {
      if (uniteMapping[n]) return uniteMapping[n];
      if (n < 70) {
        const tens = Math.floor(n / 10) * 10;
        const units = n % 10;
        if (units === 1 && tens !== 80) {
          return uniteMapping[tens] + ' et un';
        }
        return uniteMapping[tens] + (units > 0 ? '-' + uniteMapping[units] : '');
      }
      if (n < 80) {
        const units = n - 60;
        if (units === 0) return 'soixante';
        if (units === 1) return 'soixante et un';
        return 'soixante-' + convertHundreds(units);
      }
      if (n < 90) {
        const units = n - 80;
        if (units === 0) return 'quatre-vingts';
        if (units === 1) return 'quatre-vingt-un';
        return 'quatre-vingt-' + convertHundreds(units);
      }
      const units = n - 90;
      if (units === 0) return 'quatre-vingt-dix';
      if (units === 1) return 'quatre-vingt-onze';
      return 'quatre-vingt-' + convertHundreds(10 + units);
    }
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    let result = '';
    if (hundreds === 1) {
      result = 'cent';
    } else {
      result = convertHundreds(hundreds) + ' cents';
    }
    if (remainder > 0) {
      if (hundreds === 1) {
        result += ' ';
      } else {
        result += ' ';
      }
      result += convertHundreds(remainder);
    }
    return result;
  };

  const convertMilliers = (n) => {
    if (n === 0) return '';
    if (n === 1) return 'mille';
    if (n < 1000) {
      return convertHundreds(n);
    }
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    let result = '';
    if (thousands === 1) {
      result = 'mille';
    } else {
      result = convertHundreds(thousands) + ' mille';
    }
    if (remainder > 0) {
      result += ' ' + convertHundreds(remainder);
    }
    return result;
  };

  const convertMillions = (n) => {
    if (n === 0) return '';
    if (n < 1000000) return convertMilliers(n);
    const millions = Math.floor(n / 1000000);
    const remainder = n % 1000000;
    let result = '';
    if (millions === 1) {
      result = 'un million';
    } else {
      result = convertHundreds(millions) + ' millions';
    }
    if (remainder > 0) {
      result += ' ' + convertMilliers(remainder);
    }
    return result;
  };

  const roundedNum = Math.round(num);
  if (roundedNum === 0) return 'zéro';
  return convertMillions(roundedNum);
};

// Fonction pour dessiner une case à cocher avec une vraie croix (X)
const drawCheckbox = (doc, x, y, checked) => {
  const size = 4.5;
  doc.setLineWidth(0.5);
  doc.rect(x, y - size/2, size, size);
  if (checked) {
    doc.setLineWidth(0.8);
    doc.line(x + 0.5, y - size/2 + 0.5, x + size - 0.5, y + size/2 - 0.5);
    doc.line(x + size - 0.5, y - size/2 + 0.5, x + 0.5, y + size/2 - 0.5);
  }
};

export const generateNightPDF = (usager, paymentDetails) => {
  try {
    console.log('========== GÉNÉRATION PDF NIGHT CLUB ==========');
    console.log('Données usager reçues:', usager);
    
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    let yPos = 25;
    const lineSpacing = 7.2;
    
    // Récupération des données
    const demandeur = usager?.demandeur || '';
    const denomination = usager?.denomination || '';
    const adresseSiege = usager?.adresse_siege || '';
    const nifStat = usager?.nif_stat || '';
    const telephone = usager?.telephone || '';
    const email = usager?.email || '';
    
    const representantNom = usager?.representant_nom || '';
    const representantAdresse = usager?.representant_adresse || '';
    const representantTel = usager?.representant_tel || '';
    const representantCin = usager?.representant_cin || '';
    const representantCinLieu = usager?.representant_cin_lieu || '';
    const representantFonction = usager?.representant_fonction || '';
    
    let cinDelivree = '';
    if (usager?.representant_cin_delivree) {
      try {
        const d = new Date(usager.representant_cin_delivree);
        if (!isNaN(d.getTime())) {
          cinDelivree = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`;
        }
      } catch(e) {}
    }
    
    const jaugeMax = usager?.jauge_max || 0;
    const horaires = usager?.horaires || '';
    
    // MOYENS DE COMMUNICATION
    let radioTaux = 0, lecteurTaux = 0, tvTaux = 0, autresTaux = 0;
    
    try {
      let moyensComm = usager?.moyens_communication;
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
        }
      }
    } catch(e) {
      console.error('Erreur parsing moyens:', e);
    }
    
    const radioActif = radioTaux > 0;
    const lecteurActif = lecteurTaux > 0;
    const tvActif = tvTaux > 0;
    const autresActif = autresTaux > 0;
    const sommeTaux = radioTaux + lecteurTaux + tvTaux + autresTaux;
    
    const montantMensuel = parseFloat(usager?.montant_mensuel) || 0;
    const fraisDossier = parseFloat(usager?.frais_dossier) || 0;
    const uniter = parseInt(usager?.uniter) || 1;
    
    // ✅ Soit au Total = (Montant mensuel + Frais de dossier + Somme des taux) × Uniter
    const baseTotal = montantMensuel + fraisDossier + sommeTaux;
    const soitTotal = baseTotal * uniter;
    const totalEnLettres = nombreEnLettres(Math.round(soitTotal));
    
    const aCompterDu = usager?.a_compter_du ? formatDate(usager.a_compter_du) : '';
    const echeance = usager?.echeance ? formatDate(usager.echeance) : '';
    const confirmationNom = usager?.confirmation_nom || usager?.demandeur || '';
    const lieuSignature = usager?.lieu_signature || 'Antananarivo';
    const dateSignature = usager?.date_signature ? formatDate(usager.date_signature) : getCurrentDate();

    // ========== PAGE 1 ==========
    // Titre principal
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('OFFICE MALAGASY DU DROIT D\'AUTEUR', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Sous-titre
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('FICHE DE RENSEIGNEMENTS – NIGHT CLUB', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // SECTION 1
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    const section1Text = '1) RENSEIGNEMENTS GENERAUX :';
    const section1Width = doc.getTextWidth(section1Text);
    doc.text(section1Text, marginX, yPos);
    doc.line(marginX, yPos + 1.5, marginX + section1Width, yPos + 1.5);
    yPos += 8;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    doc.text(`Demandeur : ${demandeur || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Dénomination : ${denomination || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse du Siège / lieu d'exploitation : ${adresseSiege || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`NIF / N° STAT : ${nifStat || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`Tél. : ${telephone || '……………………………………'}`, marginX + 100, yPos);
    yPos += lineSpacing;
    
    doc.text(`E-mail : ${email || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing ;
    
    // SECTION 2
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    const section2Text = '2) REPRESENTANT LEGAL :';
    const section2Width = doc.getTextWidth(section2Text);
    doc.text(section2Text, marginX, yPos);
    doc.line(marginX, yPos + 1.5, marginX + section2Width, yPos + 1.5);
    yPos += 8;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    doc.text(`Nom et prénoms : ${representantNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse personnelle : ${representantAdresse || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Téléphone : ${representantTel || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`N° Carte d'identité nationale : ${representantCin || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    let cinText = `Délivrée le : ${cinDelivree || '……………………………………'}`;
    if (representantCinLieu) cinText += ` à ${representantCinLieu}`;
    doc.text(cinText, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Fonction : ${representantFonction || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    // SECTION 3
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    const section3Text = '3) RENSEIGNEMENTS SUR L\'ETABLISSEMENT :';
    const section3Width = doc.getTextWidth(section3Text);
    doc.text(section3Text, marginX, yPos);
    doc.line(marginX, yPos + 1.5, marginX + section3Width, yPos + 1.5);
    yPos += 8;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    doc.text(`Jauge maximale : ${jaugeMax > 0 ? formatNumber(jaugeMax) : '………………'} personnes`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Horaires d'ouverture : ${horaires || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing + 5;
    
    // Moyen de communication
    doc.text('Moyen de communication :', marginX + 5, yPos);
    
    const moyenStartX = marginX + 58;
    const checkX = marginX + 120;
    const tauxX = checkX + 10;
    
    doc.text('Radio - Poste TSF', moyenStartX, yPos);
    drawCheckbox(doc, checkX, yPos, radioActif);
    doc.text(`: Taux : ${formatNumber(radioTaux)} Ar/an`, tauxX, yPos);
    yPos += lineSpacing;
    
    doc.text('Lecteur', moyenStartX, yPos);
    drawCheckbox(doc, checkX, yPos, lecteurActif);
    doc.text(`: Taux : ${formatNumber(lecteurTaux)} Ar/an`, tauxX, yPos);
    yPos += lineSpacing;
    
    doc.text('TV', moyenStartX, yPos);
    drawCheckbox(doc, checkX, yPos, tvActif);
    doc.text(`: Taux : ${formatNumber(tvTaux)} Ar/an`, tauxX, yPos);
    yPos += lineSpacing;
    
    doc.text('Autres', moyenStartX, yPos);
    drawCheckbox(doc, checkX, yPos, autresActif);
    doc.text(`: Taux : ${formatNumber(autresTaux)} Ar/an`, tauxX, yPos);
    yPos += lineSpacing;
    
    // SECTION 4
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    const section4Text = '4) REDEVANCES :';
    const section4Width = doc.getTextWidth(section4Text);
    doc.text(section4Text, marginX, yPos);
    doc.line(marginX, yPos + 1.5, marginX + section4Width, yPos + 1.5);
    yPos += 8;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    doc.text(`Montant mensuel : ${formatNumber(montantMensuel)} Ariary`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Frais de dossier : ${formatNumber(fraisDossier)} Ariary`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    // ✅ Soit au Total corrigé
    doc.setFont('times', 'bold');
    doc.text(`Soit au Total : ${formatNumber(soitTotal)} Ariary (${totalEnLettres} )`, marginX + 5, yPos);
    yPos += lineSpacing + 2;
    
    doc.setFont('times', 'normal');
    doc.text(`A compter du : ${aCompterDu || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    doc.text(`Echéance : ${echeance || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing ;
    
    // Signature
    doc.text(`Je soussigné(e) Mr/Mme ${confirmationNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('confirme sous ma responsabilité la sincérité et l\'exactitude des renseignements ci-dessus et', marginX + 5, yPos);
    yPos += lineSpacing;
    doc.text('m\'engage à respecter les obligations prévues par le contrat général de représentation.', marginX + 5, yPos);
    yPos += lineSpacing ;
    
    // Fait à et Signature
    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.text(`Fait à ${lieuSignature}, le ${dateSignature}`, pageWidth - marginX - 5, yPos, { align: 'right' });
    yPos += lineSpacing ;
    
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.text('(Signature)', pageWidth - marginX - 5, yPos, { align: 'right' });
    yPos += 25;
    
    // Vérifier l'espace en bas de page
    const bottomMargin = 25;
    if (yPos < pageHeight - bottomMargin) {
      const extraSpace = (pageHeight - bottomMargin) - yPos;
      if (extraSpace > 0) {
        // Rien à faire, l'espace est déjà suffisant
      }
    }
    
    const fileName = `nightclub_${(denomination || 'document').replace(/\s/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF Night Club généré avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur PDF Night Club:', error);
    throw error;
  }
};