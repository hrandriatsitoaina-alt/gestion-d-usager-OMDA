// src/pages/pdf/media_pdf.jsx
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

export const generateMediaPDF = (usager, paymentDetails) => {
  try {
    console.log('========== GÉNÉRATION PDF MEDIA ==========');
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
    const lineSpacing = 7.5;
    
    // Récupération des données
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
    
    const denomination = usager?.denomination || '';
    const frequence = usager?.frequence || '';
    const canal = usager?.canal || '';
    const siege = usager?.siege || usager?.adresse_siege || '';
    const telephone = usager?.telephone || '';
    const email = usager?.email || '';
    const nif = usager?.nif || '';
    const stat = usager?.stat || '';
    const taux = parseFloat(usager?.taux) || 0;
    
    const couvertureCapitale = usager?.couverture_capitale || false;
    const couvertureChefLieuProvince = usager?.couverture_chef_lieu_province || false;
    const couvertureChefLieuRegion = usager?.couverture_chef_lieu_region || false;
    const couvertureDistrict = usager?.couverture_district || false;
    
    const horairesJusqua12 = usager?.horaires_jusqua12 || false;
    const horaires13a24 = usager?.horaires_13a24 || false;
    
    const fraisDossier = parseFloat(usager?.frais_dossier) || 0;
    const uniter = parseInt(usager?.uniter) || 1;
    
    // ✅ Soit au Total = (Taux + Frais de dossier) × Uniter
    const baseTotal = taux + fraisDossier;
    const soitTotal = baseTotal * uniter;
    const totalEnLettres = nombreEnLettres(Math.round(soitTotal));
    
    const confirmationNom = usager?.confirmation_nom || '';
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
    doc.text('FICHE DE RENSEIGNEMENTS – RADIO ET TELEVISION', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // SECTION 1
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    const section1Text = '1) RENSEIGNEMENTS SUR LE PROPRIETAIRE DE LA STATION :';
    const section1Width = doc.getTextWidth(section1Text);
    doc.text(section1Text, marginX, yPos);
    doc.line(marginX, yPos + 1.5, marginX + section1Width, yPos + 1.5);
    yPos += 8;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    doc.text(`Nom et prénoms : ${proprietaireNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse (domicile) : ${proprietaireAdresse || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Téléphone : ${proprietaireTel || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`N° Carte d'identité nationale : ${proprietaireCin || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    let cinPropText = `Délivrée le : ${proprietaireCinDelivree || '……………………………………'}`;
    if (proprietaireCinLieu) cinPropText += ` à ${proprietaireCinLieu}`;
    doc.text(cinPropText, marginX + 5, yPos);
    yPos += lineSpacing + 5;
    
    // SECTION 2
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    const section2Text = '2) RENSEIGNEMENTS SUR LE REPRESENTANT LEGAL :';
    const section2Width = doc.getTextWidth(section2Text);
    doc.text(section2Text, marginX, yPos);
    doc.line(marginX, yPos + 1.5, marginX + section2Width, yPos + 1.5);
    yPos += 8;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    doc.text(`Nom et prénoms : ${representantNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Adresse (domicile) : ${representantAdresse || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Téléphone : ${representantTel || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`N° Carte d'identité nationale : ${representantCin || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    let cinRepText = `Délivrée le : ${representantCinDelivree || '……………………………………'}`;
    if (representantCinLieu) cinRepText += ` à ${representantCinLieu}`;
    doc.text(cinRepText, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Pouvoir donné le : ${representantPouvoirDate || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`par ${representantPouvoirPar || '……………………………………'}`, marginX + 85, yPos);
    yPos += lineSpacing;
    
    doc.text(`Fonction : ${representantFonction || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing + 3;
    
    // SECTION 3
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    const section3Text = '3) RENSEIGNEMENTS SUR LA STATION RADIO/TV :';
    const section3Width = doc.getTextWidth(section3Text);
    doc.text(section3Text, marginX, yPos);
    doc.line(marginX, yPos + 1.5, marginX + section3Width, yPos + 1.5);
    yPos += 8;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    doc.text(`Dénomination : ${denomination || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Fréquence : ${frequence || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`Canal : ${canal || '……………………………………'}`, marginX + 85, yPos);
    yPos += lineSpacing;
    
    doc.text(`Siège : ${siege || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.text(`Téléphone : ${telephone || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`E-mail : ${email || '……………………………………'}`, marginX + 85, yPos);
    yPos += lineSpacing;
    
    doc.text(`NIF : ${nif || '……………………………………'}`, marginX + 5, yPos);
    doc.text(`STAT : ${stat || '……………………………………'}`, marginX + 85, yPos);
    yPos += lineSpacing;
    
    doc.text(`Taux : ${formatNumber(taux)} Ariary`, marginX + 5, yPos);
    yPos += lineSpacing ;
    
    // Couverture
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Couverture :', marginX + 5, yPos);
    
    const couvStartX = marginX + 40;
    const couvPos1 = couvStartX;
    const couvPos2 = couvStartX + 26;
    const couvPos3 = couvStartX + 72;
    const couvPos4 = couvStartX + 122;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    drawCheckbox(doc, couvPos1, yPos, couvertureCapitale);
    doc.text('Capitale', couvPos1 + 7, yPos);
    
    drawCheckbox(doc, couvPos2, yPos, couvertureChefLieuProvince);
    doc.text('Chef-lieu de Province', couvPos2 + 7, yPos);
    
    drawCheckbox(doc, couvPos3, yPos, couvertureChefLieuRegion);
    doc.text('Chef-lieu de Région', couvPos3 + 7, yPos);
    
    drawCheckbox(doc, couvPos4, yPos, couvertureDistrict);
    doc.text('District', couvPos4 + 7, yPos);
    yPos += lineSpacing ;
    
    // Horaires
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Horaires de diffusion :', marginX + 5, yPos);
    
    const horaireStartX = marginX + 60;
    const horairePos1 = horaireStartX;
    const horairePos2 = horaireStartX + 55;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    drawCheckbox(doc, horairePos1, yPos, horairesJusqua12);
    doc.text('Jusqu\'à 12 heures', horairePos1 + 7, yPos);
    
    drawCheckbox(doc, horairePos2, yPos, horaires13a24);
    doc.text('13 à 24 heures', horairePos2 + 7, yPos);
    yPos += lineSpacing ;
    
    // ✅ Soit au Total corrigé
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(`Soit au Total : ${formatNumber(soitTotal)} Ariary (${totalEnLettres} )`, marginX + 5, yPos);
    yPos += lineSpacing + 2;
    
    // Signature
    doc.text(`Je soussigné(e) Mr/Mme ${confirmationNom || '……………………………………'}`, marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('confirme sous ma responsabilité la sincérité et l\'exactitude des renseignements ci-dessus et', marginX + 5, yPos);
    yPos += lineSpacing;
    doc.text('m\'engage à respecter les obligations prévues par le contrat général de représentation.', marginX + 5, yPos);
    yPos += lineSpacing;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.text(`Fait à ${lieuSignature}, le ${dateSignature}`, pageWidth - marginX - 5, yPos, { align: 'right' });
    yPos += lineSpacing;
    
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.text('(Signature)', pageWidth - marginX - 5, yPos, { align: 'right' });
    yPos += 15;

    // ========== PAGE 2 ==========
    doc.addPage();
    yPos = 25;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Dossier à fournir :', marginX, yPos);
    yPos += 8;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('• CIN certifié du propriétaire et du représentant légal', marginX + 5, yPos);
    yPos += lineSpacing;
    doc.text('• Cif', marginX + 5, yPos);
    yPos += lineSpacing;
    doc.text('• Stat', marginX + 5, yPos);
    yPos += lineSpacing;
    doc.text('• Autorisation Artec', marginX + 5, yPos);
    yPos += lineSpacing;
    doc.text('• Autorisation du Ministère de la Communication', marginX + 5, yPos);
    yPos += lineSpacing + 20;
    
    const bottomMargin = 25;
    if (yPos < pageHeight - bottomMargin) {
      const extraSpace = (pageHeight - bottomMargin) - yPos;
      if (extraSpace > 0) {
        // Rien à faire, l'espace est déjà suffisant
      }
    }
    
    const fileName = `media_${(denomination || 'document').replace(/\s/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF Media généré avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur PDF Media:', error);
    throw error;
  }
};