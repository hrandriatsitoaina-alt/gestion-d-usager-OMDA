// src/pages/pdf/occ_pdf.jsx
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

// Fonction pour formater la date CIN au format JJ-MM-AAAA
const formatCinDate = (dateString) => {
  if (!dateString) return '';
  try {
    let cleanDate = dateString;
    if (typeof dateString === 'string' && dateString.includes('T')) {
      cleanDate = dateString.split('T')[0];
    }
    
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      const jour = date.getDate().toString().padStart(2, '0');
      const mois = (date.getMonth() + 1).toString().padStart(2, '0');
      const annee = date.getFullYear();
      return `${jour}-${mois}-${annee}`;
    }
    
    return cleanDate;
  } catch (error) {
    return dateString;
  }
};

export const generateOccPDF = (usager, paymentDetails) => {
  try {
    console.log('Génération PDF avec:', { usager, paymentDetails });
    
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    let yPos = 14;
    
    // Récupération des données
    const dossierGlobal = usager?.numero_dossier_global || '___/___/_______';
    const numeroDossierUtilisateur = usager?.numero_dossier_utilisateur || '';
    const organisateurs = usager?.organisateurs || usager?.demandeur || '';
    const representantPar = usager?.representant_par || usager?.demandeur || '';
    const genreManifestation = usager?.genre_manifestation || '';
    const artistes = usager?.artistes || usager?.nom_artiste || '';
    const dateEvenement = formatDate(usager?.date_evenement) || '';
    const lieuEvenement = usager?.lieu_evenement || '';
    
    const montantPaye = paymentDetails?.montant || usager?.montant_total || 0;
    const fraisDossier = usager?.frais_dossier || 5000;
    const montantRetard = usager?.montant_retard || 0;
    const estRetard = usager?.is_retard || false;
    const uniter = parseInt(usager?.uniter) || 1;
    
    // ✅ BONNE RÈGLE DE CALCUL : (Montant × Uniter) + Frais de dossier + Retard
    // Le frais de dossier est FIXE et N'EST PAS multiplié par Uniter
    const baseTotal = montantPaye * uniter;
    let soitTotal = baseTotal + fraisDossier;
    if (estRetard) {
      soitTotal += montantRetard;
    }
    const totalEnLettres = nombreEnLettres(Math.round(soitTotal));
    const montantEnLettres = nombreEnLettres(Math.floor(montantPaye));
    
    const nomRepresentant = usager?.representant_par || usager?.demandeur || '';
    
    const cin = usager?.representant_cin || usager?.cin || '';
    const cinDelivree = usager?.representant_cin_delivree || usager?.cin_delivree || '';
    const cinLieu = usager?.representant_cin_lieu || usager?.cin_lieu || '';
    
    const adresse = usager?.adresse || '';
    const domicile = usager?.domicile || usager?.adresse || '';
    const telephone = usager?.telephone || '';
    
    const percepteurNom = usager?.confirmation_nom || usager?.nom_signataire || '';
    
    const currentDateStr = getCurrentDate();
    const currentYear = new Date().getFullYear();
    
    const lieuAjout = usager?.lieu_ajout || 'Antananarivo';
    
    const numeroHain = numeroDossierUtilisateur || `01/${currentYear.toString().slice(-2)}`;
    
    const formattedCinDelivree = formatCinDate(cinDelivree);

    // ========== PAGE 1 ==========
    // En-tête centré
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('REPOBLIKAN\'I MADAGASIKARA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Fitiavana - Tanindrazana - Fandrosoana', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('=-=-=-=-=-=-=', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Informations OMDA
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('MINISTERE DE LA COMMUNICATION,', marginX, yPos);
    yPos += 4;
    doc.text('ET DE LA CULTURE', marginX + 13, yPos);
    yPos += 4;
    
    doc.text('-------------------', marginX + 23, yPos);
    yPos += 4;
    
    doc.text('SECRETARIAT GENERAL', marginX + 12, yPos);
    yPos += 4;
    
    doc.text('--------------------', marginX + 23, yPos);
    yPos += 6;
    
    // OFFICE et O.M.D.A. en gras
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('OFFICE MALAGASY DU DROIT D\'AUTEUR', marginX, yPos);
    yPos += 5;
    doc.text('(O.M.D.A.)', marginX + 12, yPos);
    yPos += 5;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('Lot II F 62 , rue Fredy Rajaofera', marginX, yPos);
    yPos += 4;
    doc.text('Tél : 034 05 533 88', marginX, yPos);
    yPos += 4;
    doc.text('e-mail : omda@moov.mg', marginX, yPos);
    yPos += 5;
    doc.text('* * * *', marginX + 15, yPos);
    yPos += 8;
    
    yPos += 1;
    
    // Titre centré CONTRAT DE REPRESENTATION
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    const titreTexte = 'CONTRAT DE REPRESENTATION';
    const titreWidth = doc.getTextWidth(titreTexte);
    doc.text(titreTexte, pageWidth / 2, yPos, { align: 'center' });
    doc.line(pageWidth / 2 - titreWidth / 2, yPos + 1.5, pageWidth / 2 + titreWidth / 2, yPos + 1.5);
    yPos += 9;
    
    // Dossier N° et Hain
    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.text(`Dossier N° : ${dossierGlobal}`, marginX, yPos);
    
    const hainText = `${numeroDossierUtilisateur || numeroHain}`;
    const hainWidth = doc.getTextWidth(hainText);
    const rectPadding = 2;
    const rectWidth = hainWidth + (rectPadding * 2) + 25;
    const rectX = pageWidth - marginX - rectWidth;
    const rectY = yPos - 4;
    const rectHeight = 7;
    doc.rect(rectX, rectY, rectWidth, rectHeight);
    
    const textX = rectX + (rectWidth / 2) - (hainWidth / 2);
    doc.text(hainText, textX, yPos);
    
    yPos += 9;
    
    // ENTRE LES SOUSSIGNES
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('ENTRE LES SOUSSIGNES :', marginX, yPos);
    yPos += 8;
    
    // 1 - L'OFFICE...
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('1 - ', marginX, yPos);
    doc.setFont('times', 'bold');
    doc.text('L\'OFFICE MALAGASY DU DROIT D\'AUTEUR', marginX + 10, yPos);
    doc.setFont('times', 'normal');
    doc.text(', Etablissement Public à caractère Industriel et', marginX + 10 + doc.getTextWidth('L\'OFFICE MALAGASY DU DROIT D\'AUTEUR') + 5, yPos);
    yPos += 5;
    doc.text('Commercial, représenté par ', marginX + 5, yPos);
    if (percepteurNom) {
      doc.setFont('times', 'bold');
      doc.text(`${percepteurNom}`, marginX + 5 + doc.getTextWidth('Commercial, représenté par '), yPos);
      doc.setFont('times', 'normal');
      doc.text(', Percepteur et Contrôleur', marginX + 10 + doc.getTextWidth('Commercial, représenté par ') + doc.getTextWidth(`${percepteurNom}`) + 5, yPos);
    } else {
      doc.setFont('times', 'bold');
      doc.text('________________________', marginX + 5 + doc.getTextWidth('Commercial, représenté par '), yPos);
      doc.setFont('times', 'normal');
      doc.text(', Percepteur et Contrôleur', marginX + 10 + doc.getTextWidth('Commercial, représenté par ') + doc.getTextWidth('________________________') + 5, yPos);
    }
    yPos += 5;
    doc.text('Ci-après désigné « ', marginX + 5, yPos);
    doc.setFont('times', 'bold');
    doc.text('l\'O.M.D.A.', marginX + 5 + doc.getTextWidth('Ci-après désigné « '), yPos);
    doc.setFont('times', 'normal');
    doc.text(' »', marginX + 5 + doc.getTextWidth('Ci-après désigné « ') + doc.getTextWidth('l\'O.M.D.A.') + 2, yPos);
    yPos += 8;
    doc.text('D\'UNE PART,', marginX + 130, yPos);
    yPos += 7;
    
    // 2 - BENEFICIAIRE
    doc.text('2 - ', marginX, yPos);
    doc.setFont('times', 'bold');
    doc.text(`${organisateurs || '________________________'}`, marginX + 10, yPos);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.text('Représenté par M. ', marginX, yPos);
    doc.setFont('times', 'bold');
    doc.text(`${representantPar || '________________________'}`, marginX + 35, yPos);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.text('Ci-après désigné « ', marginX, yPos);
    doc.setFont('times', 'bold');
    doc.text('le BENEFICIAIRE', marginX + 35, yPos);
    doc.setFont('times', 'normal');
    doc.text(' »', marginX + 35 + doc.getTextWidth('le BENEFICIAIRE') + 2, yPos);
    yPos += 8;
    doc.text('D\'AUTRE PART,', marginX + 130, yPos);
    yPos += 7;
    
    // Centré
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('IL A ETE CONVENU ET ARRETE CE QUI SUIT :', pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('A - CONDITIONS GENERALES :', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Article premier
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Article premier :', marginX, yPos);
    const art1Width = doc.getTextWidth('Article premier :');
    doc.line(marginX, yPos + 1.5, marginX + art1Width, yPos + 1.5);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('L\'O.M.D.A. donne au bénéficiaire dans les limites et sous les conditions ci-après précisées,', marginX + 5, yPos);
    yPos += 5;
    doc.text('l\'autorisation préalable à l\'effet de :', marginX + 5, yPos);
    yPos += 6;
    doc.text('- Exécuter faire ou laisser exécuter publiquement les œuvres du répertoire aux seules fins d\'utilisation', marginX + 10, yPos);
    yPos += 5;
    doc.text('publique les enregistrements licites, les œuvres du répertoire général de l\'O.M.D.A. qu\'il jugera bon', marginX + 10, yPos);
    yPos += 5;
    doc.text('d\'utiliser ;', marginX + 10, yPos);
    yPos += 6;
    doc.text('- Utiliser aux seules fins d\'exécution publique les enregistrements licites sur le territoire de la', marginX + 10, yPos);
    yPos += 5;
    doc.text('République de Madagascar au titre du droit de reproduction mécanique des auteurs et de leurs', marginX + 10, yPos);
    yPos += 5;
    doc.text('ayants droits que l\'OMDA exerce.', marginX + 10, yPos);
    yPos += 6;
    
    doc.text('Cette autorisation est consentie sous la réserve que possède le Directeur de l\'O.M.D.A. d\'interdire au titre', marginX, yPos);
    yPos += 5;
    doc.text('du droit moral sur demande des auteurs ou de leurs ayants droit, l\'exécution et ou l\'utilisation publiques', marginX, yPos);
    yPos += 5;
    doc.text('d\'enregistrements mécaniques d\'une ou de plusieurs œuvres du répertoire général sans que l\'O.M.D.A. puisse', marginX, yPos);
    yPos += 5;
    doc.text('être tenu à garantie à ce titre à l\'égard du bénéficiaire :', marginX, yPos);
    yPos += 10;
    
    // Article 2
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Article 2 :', marginX, yPos);
    const art2Width = doc.getTextWidth('Article 2 :');
    doc.line(marginX, yPos + 1.5, marginX + art2Width, yPos + 1.5);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('Le bénéficiaire s\'engage à payer, en contrepartie de l\'autorisation, une redevance de :', marginX, yPos);
    yPos += 6;
    doc.text('1°- a) 6 % calculée sur la totalité des recettes brutes à l\'occasion des exécutions publiques par les entrées', marginX + 5, yPos);
    yPos += 5;
    doc.text('(billets, participations, etc...)', marginX + 5, yPos);
    yPos += 6;
    doc.text('- b) toutes autres recettes (notamment les recettes de consommation sur table ou buvettes, buffet,', marginX + 5, yPos);
    yPos += 5;
    doc.text('restauration, vente billets de tombola, de programme, etc...)', marginX + 5, yPos);
    yPos += 6;
    doc.text('En cas d\'entrée gratuite, le taux est fixé à 6 % des dépenses occasionnées par l\'organisation de la', marginX + 5, yPos);
    yPos += 5;
    doc.text('manifestation.', marginX + 5, yPos);
    yPos += 10;
    
    // ========== PAGE 2 ==========
    doc.addPage();
    yPos = 14;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('2°- 12% calculée sur la totalité des recettes brutes à l\'occasion des représentations dramatiques.', marginX + 5, yPos);
    yPos += 5;
    doc.text('Les invitations ou places de service et les consommations offertes à titre gracieux sont réputées payantes et', marginX + 5, yPos);
    yPos += 5;
    doc.text('comprises dans l\'assiette de calcul des pourcentages.', marginX + 5, yPos);
    yPos += 7;
    
    // Article 3
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Article 3 :', marginX, yPos);
    const art3Width = doc.getTextWidth('Article 3 :');
    doc.line(marginX, yPos + 1.5, marginX + art3Width, yPos + 1.5);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('Le bénéficiaire s\'engage à remettre préalablement ou au moment du paiement, le programme exact', marginX, yPos);
    yPos += 5;
    doc.text('des œuvres exécutées. Ils doivent prendre toutes dispositions pour que le programme porte l\'indication, pour', marginX, yPos);
    yPos += 5;
    doc.text('chaque œuvre du nom de l\'auteur, du compositeur et s\'il y a lieu, de l\'arrangeur. Le programme sera certifié', marginX, yPos);
    yPos += 5;
    doc.text('sincère par le bénéficiaire et par le représentant du ou des groupes artistiques.', marginX, yPos);
    yPos += 7;
    
    // Article 4
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Article 4 :', marginX, yPos);
    const art4Width = doc.getTextWidth('Article 4 :');
    doc.line(marginX, yPos + 1.5, marginX + art4Width, yPos + 1.5);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('La présente autorisation est personnelle au bénéficiaire et ne s\'applique qu\'à la manifestation, objet', marginX, yPos);
    yPos += 5;
    doc.text('de sa demande, organisée par lui et pour son propre compte.', marginX, yPos);
    yPos += 7;
    
    // Article 5
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Article 5 :', marginX, yPos);
    const art5Width = doc.getTextWidth('Article 5 :');
    doc.line(marginX, yPos + 1.5, marginX + art5Width, yPos + 1.5);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('L\'OMDA aura le droit de contrôle sur toutes les opérations rentrant dans l\'objet de la présente', marginX, yPos);
    yPos += 5;
    doc.text('autorisation. Le Directeur de l\'O.M.D.A. ou son délégué aura droit à deux places VIP ainsi qu\'à deux places', marginX, yPos);
    yPos += 5;
    doc.text('gratuites non négociables dont ils auront la libre disposition, quel que soit le mode d\'accès (billets, invitation,', marginX, yPos);
    yPos += 5;
    doc.text('consommation obligatoire public déterminé, etc...)', marginX, yPos);
    yPos += 7;
    
    // Article 6
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Article 6 :', marginX, yPos);
    const art6Width = doc.getTextWidth('Article 6 :');
    doc.line(marginX, yPos + 1.5, marginX + art6Width, yPos + 1.5);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('Le coût du timbre sur les quittances, les frais de correspondance et de recouvrement s\'il y a lieu seront', marginX, yPos);
    yPos += 5;
    doc.text('à la charge du bénéficiaire.', marginX, yPos);
    yPos += 7;
    
    // Article 7
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Article 7 :', marginX, yPos);
    const art7Width = doc.getTextWidth('Article 7 :');
    doc.line(marginX, yPos + 1.5, marginX + art7Width, yPos + 1.5);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('Les frais des présentes et ceux qui en seront à la suite sont à la charge du bénéficiaire.', marginX, yPos);
    yPos += 10;
    
    // B - CONDITIONS PARTICULIERES
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('B - CONDITIONS PARTICULIERES :', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Article 1
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Article 1 :', marginX, yPos);
    const art1bWidth = doc.getTextWidth('Article 1 :');
    doc.line(marginX, yPos + 1.5, marginX + art1bWidth, yPos + 1.5);
    yPos += 7;
    
    // BENEFICIAIRE
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('BENEFICIAIRE :', marginX, yPos);
    const art1WWidth = doc.getTextWidth('BENEFICIAIRE :');
    doc.line(marginX, yPos + 1.5, marginX + art1WWidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${organisateurs || '________________________'}`, marginX + 35, yPos);
    yPos += 7;
    
    // GENRE DE LA MANIFESTATION
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('GENRE DE LA MANIFESTATION :', marginX, yPos);
    const art1WAidth = doc.getTextWidth('GENRE DE LA MANIFESTATION  :');
    doc.line(marginX, yPos + 1.5, marginX + art1WAidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${genreManifestation || '________________________'}`, marginX + 70, yPos);
    yPos += 7;
    
    // ARTISTE(S)
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('ARTISTE(S) :', marginX, yPos);
    const art1WBidth = doc.getTextWidth('ARTISTE(S) :');
    doc.line(marginX, yPos + 1.5, marginX + art1WBidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${artistes || '________________________'}`, marginX + 30, yPos);
    yPos += 7;
    
    // DATE et LIEU
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('DATE :', marginX, yPos);
    const art1WCidth = doc.getTextWidth('DATE :');
    doc.line(marginX, yPos + 1.5, marginX + art1WCidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${dateEvenement || '________________________'}`, marginX + 18, yPos);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('LIEU :', marginX + 80, yPos);
    const art1WDidth = doc.getTextWidth('LIEU :');
    doc.line(marginX, yPos + 1.5, marginX + art1WDidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${lieuEvenement || '________________________'}`, marginX + 98, yPos);
    yPos += 7;
    
    // MONTANT
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('MONTANT :', marginX, yPos);
    const art1WEidth = doc.getTextWidth('MONTANT :');
    doc.line(marginX, yPos + 1.5, marginX + art1WEidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${formatNumber(montantPaye)} Ar ( ${montantEnLettres} Ariary)`, marginX + 25, yPos);
    yPos += 5;
    
    // FRAIS DE DOSSIER
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('FRAIS DE DOSSIER :', marginX, yPos);
    const fraisWidth = doc.getTextWidth('FRAIS DE DOSSIER :');
    doc.line(marginX, yPos + 1.5, marginX + fraisWidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${formatNumber(fraisDossier)} Ar`, marginX + 45, yPos);
    yPos += 5;
    
    // Afficher le retard seulement s'il est activé
    if (estRetard && montantRetard > 0) {
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.text('PENALITE DE RETARD :', marginX, yPos);
      const retardWidth = doc.getTextWidth('PENALITE DE RETARD :');
      doc.line(marginX, yPos + 1.5, marginX + retardWidth, yPos + 1.5);
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      doc.text(`${formatNumber(montantRetard)} Ar`, marginX + 50, yPos);
      yPos += 7;
    } else {
      yPos += 2;
    }
    
    // ✅ SOIT TOTAL corrigé : (Montant × Uniter) + Frais de dossier + Retard
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('SOIT TOTAL :', marginX, yPos);
    const soitTotalWidth = doc.getTextWidth('SOIT TOTAL :');
    doc.line(marginX, yPos + 1.5, marginX + soitTotalWidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${formatNumber(soitTotal)} Ar ( ${totalEnLettres} Ariary)`, marginX + 30, yPos);
    yPos += 7;
    
    // NOM ET PRENOMS (Représentant)
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('NOM ET PRENOMS :', marginX, yPos);
    const art1WFidth = doc.getTextWidth('NOM ET PRENOMS :');
    doc.line(marginX, yPos + 1.5, marginX + art1WFidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${nomRepresentant || '________________________'}`, marginX + 45, yPos);
    yPos += 7;
    
    // CIN avec délivrée et lieu
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    let cinText = '';
    
    if (cin && formattedCinDelivree && cinLieu) {
      cinText = `${cin} délivrée le ${formattedCinDelivree} à ${cinLieu}`;
    } else if (cin && formattedCinDelivree) {
      cinText = `${cin} délivrée le ${formattedCinDelivree}`;
    } else if (cin && cinLieu) {
      cinText = `${cin} délivré à ${cinLieu}`;
    } else if (cin) {
      cinText = cin;
    } else {
      cinText = '________________________';
    }
    doc.text('CIN :', marginX, yPos);
    const art1WGidth = doc.getTextWidth('CIN :');
    doc.line(marginX, yPos + 1.5, marginX + art1WGidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(cinText, marginX + 18, yPos);
    yPos += 7;
    
    // DOMICILE
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('DOMICILE :', marginX, yPos);
    const art1WHidth = doc.getTextWidth('DOMICILE :');
    doc.line(marginX, yPos + 1.5, marginX + art1WHidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${domicile || '________________________'}`, marginX + 25, yPos);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Contact :', marginX + 100, yPos);
    const art1WJidth = doc.getTextWidth('Contact :');
    doc.line(marginX, yPos + 1.5, marginX + art1WJidth, yPos + 1.5);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${telephone || '________________________'}`, marginX + 125, yPos);
    yPos += 10;
    
    // Article 2
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Article 2 : ', marginX, yPos);
    const art2bWidth = doc.getTextWidth('Article 2 :');
    doc.line(marginX, yPos + 1.5, marginX + art2bWidth, yPos + 1.5);
    yPos += 8;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('Pour l\'exécution des clauses et conditions du présent contrat, les parties font élection de domicile ', marginX, yPos);
    yPos += 5;
    
    doc.text(`à ${lieuAjout}.`, marginX, yPos);
    const art2bXidth = doc.getTextWidth(`à ${lieuAjout}.`);
    doc.line(marginX, yPos + 1.5, marginX + art2bXidth, yPos + 1.5);
    yPos += 5;
    
    doc.text(`${lieuAjout}, le ${currentDateStr}`, marginX + 100, yPos);
    yPos += 5;
    doc.text('Pour l\'Office Malagasy du Droit d\'Auteur', marginX + 90, yPos);
    yPos += 5;
    doc.text('Le Bénéficiaire', marginX + 24, yPos);
    yPos += 5;
    doc.text('Le Percepteur et Contrôleur', marginX + 120, yPos);
    
    yPos += 25;
    doc.text(representantPar, marginX + 24, yPos);
    doc.text(percepteurNom, marginX + 130, yPos);
    
    // ========== PAGE 3 ==========
    doc.addPage();
    yPos = 15;
    
    yPos += 5;
    
    // En-tête centré
    doc.setFont('times');
    doc.setFontSize(12);
    doc.text('REPOBLIKAN\'I MADAGASIKARA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    doc.setFont('helvetica');
    doc.setFontSize(10);
    doc.text('Fitiavana - Tanindrazana - Fandrosoana', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('=-=-=-=-=-=-=', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Informations OMDA
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('MINISTERE DE LA COMMUNICATION,', marginX, yPos);
    yPos += 4;
    doc.text('ET DE LA CULTURE', marginX + 13, yPos);
    yPos += 4;
    
    doc.text('-------------------', marginX + 23, yPos);
    yPos += 4;
    
    doc.text('SECRETARIAT GENERAL', marginX + 12, yPos);
    yPos += 4;
    
    doc.text('--------------------', marginX + 23, yPos);
    yPos += 6;
    
    // OFFICE et O.M.D.A. en gras
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('OFFICE MALAGASY DU DROIT D\'AUTEUR', marginX, yPos);
    yPos += 5;
    doc.text('(O.M.D.A.)', marginX + 12, yPos);
    yPos += 5;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('Lot II F 62 , rue Fredy Rajaofera', marginX, yPos);
    yPos += 4;
    doc.text('Tél : 034 05 533 88', marginX, yPos);
    yPos += 4;
    doc.text('e-mail : omda@moov.mg', marginX, yPos);
    yPos += 5;
    doc.text('* * * *', marginX + 15, yPos);
    yPos += 8;
    
    // DOS N° et Hain
    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.text(`Dossier N° : ${dossierGlobal}`, marginX, yPos);
    
    const rectWidth3 = hainWidth + (rectPadding * 2) + 25;
    const rectX3 = pageWidth - marginX - rectWidth3;
    const rectY3 = yPos - 4;
    const rectHeight3 = 7;
    doc.rect(rectX3, rectY3, rectWidth3, rectHeight3);
    
    const textX3 = rectX3 + (rectWidth3 / 2) - (hainWidth / 2);
    doc.text(hainText, textX3, yPos);
    
    yPos += 25;
    
    // AUTORISATION
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    const authTexte = 'A U T O R I S A T I O N';
    const authWidth = doc.getTextWidth(authTexte);
    doc.text(authTexte, pageWidth / 2, yPos, { align: 'center' });
    doc.line(pageWidth / 2 - authWidth / 2, yPos + 2, pageWidth / 2 + authWidth / 2, yPos + 2);
    yPos += 18;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    const autorisationText = `${organisateurs || '________'} représenté par M. ${representantPar || '________'} est autorisé à utiliser les œuvres du répertoire général de l'Office Malagasy du Droit d'Auteur (OMDA) à l'occasion du ${genreManifestation || '________'} le ${dateEvenement || '________'} avec ${artistes || '________'} au ${lieuEvenement || '________'}.`;
    const splitText = doc.splitTextToSize(autorisationText, pageWidth - 2 * marginX);
    doc.text(splitText, marginX, yPos);
    yPos += 25;
    
    doc.text(`Fait à ${lieuAjout}, le ${currentDateStr}`, marginX + 90, yPos);
    yPos += 15;
    
    doc.text('Pour l\'Office Malagasy du Droit d\'Auteur', marginX + 90, yPos);
    yPos += 6;
    doc.text('(OMDA)', marginX + 96, yPos);
    yPos += 5;
    
    doc.text('Le Percepteur et Contrôleur', marginX + 93, yPos);
    yPos += 35;
    
    doc.setFont('times', 'italic');
    doc.text(percepteurNom, marginX + 91, yPos);
    
    const fileName = `contrat_occ_${(organisateurs || 'usager').replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
    doc.save(fileName);
    console.log('PDF généré avec succès:', fileName);
    return true;
    
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    throw error;
  }
};