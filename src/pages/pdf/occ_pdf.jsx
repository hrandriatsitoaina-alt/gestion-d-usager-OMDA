// src/pages/pdf/occ_pdf.jsx
import jsPDF from 'jspdf';
import {
  createPdfT,
  getPdfLocale,
} from './pdfI18n';

// ============================================================
// FONCTIONS UTILITAIRES EXPORTÉES
// ============================================================
export const formatDate = (dateString, langue = 'fr') => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const locale = getPdfLocale(langue);
    const jour = date.getDate();
    const mois = date.toLocaleString(locale, { month: 'long' });
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

export const getCurrentDate = (langue = 'fr') => {
  const date = new Date();
  const locale = getPdfLocale(langue);
  const mois = date.toLocaleString(locale, { month: 'long' });
  const jour = date.getDate();
  const annee = date.getFullYear();
  return `${jour} ${mois} ${annee}`;
};

// ============================================================
// FONCTION : NOMBRE EN LETTRES (Ariary) - FR uniquement
// ============================================================
const nombreEnLettres = (num, langue = 'fr') => {
  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + nombreEnLettres(-num, langue);

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
        if (units === 1 && tens !== 80) return uniteMapping[tens] + ' et un';
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
    if (hundreds === 1) result = 'cent';
    else result = convertHundreds(hundreds) + ' cents';
    if (remainder > 0) result += ' ' + convertHundreds(remainder);
    return result;
  };

  const convertMilliers = (n) => {
    if (n === 0) return '';
    if (n === 1) return 'mille';
    if (n < 1000) return convertHundreds(n);
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    let result = '';
    if (thousands === 1) result = 'mille';
    else result = convertHundreds(thousands) + ' mille';
    if (remainder > 0) result += ' ' + convertHundreds(remainder);
    return result;
  };

  const convertMillions = (n) => {
    if (n === 0) return '';
    if (n < 1000000) return convertMilliers(n);
    const millions = Math.floor(n / 1000000);
    const remainder = n % 1000000;
    let result = '';
    if (millions === 1) result = 'un million';
    else result = convertHundreds(millions) + ' millions';
    if (remainder > 0) result += ' ' + convertMilliers(remainder);
    return result;
  };

  const roundedNum = Math.round(num);
  if (roundedNum === 0) return 'zéro';
  return convertMillions(roundedNum);
};

// ============================================================
// FONCTION : FORMATAGE DATE CIN (JJ-MM-AAAA)
// ============================================================
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

// ✅ Constante pour soulignement
const SOULIGNEMENT_OFFSET = 0.8;

// ✅ Helper : souligner un texte
const souligner = (doc, x, y, texte) => {
  const width = doc.getTextWidth(texte);
  doc.line(x, y + SOULIGNEMENT_OFFSET, x + width, y + SOULIGNEMENT_OFFSET);
};

// ============================================================
// GÉNÉRATEUR PRINCIPAL : PDF CONTRAT OCC
// ✅ Signature étendue : (usager, paymentDetails, options)
// ============================================================
export const generateOccPDF = (usager, paymentDetails = {}, options = {}) => {
  try {
    // ✅ Langue depuis les options
    const langue = options.langue || 'fr';
    const t = createPdfT(langue);

    console.log('Génération PDF avec:', { usager, paymentDetails, langue });

    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    let yPos = 14;

    // ========== RÉCUPÉRATION DES DONNÉES ==========
    const dossierGlobal = usager?.numero_dossier_global || '___/___/_______';
    const numeroDossierUtilisateur = usager?.numero_dossier_utilisateur || '';
    const organisateurs = usager?.organisateurs || usager?.demandeur || '';
    const representantPar = usager?.representant_par || usager?.demandeur || '';
    const genreManifestation = usager?.genre_manifestation || '';
    const artistes = usager?.artistes || usager?.nom_artiste || '';
    const dateEvenement = formatDate(usager?.date_evenement, langue) || '';
    const lieuEvenement = usager?.lieu_evenement || '';

    // ✅ MONTANTS
    const montantPaye = parseFloat(paymentDetails?.montant || usager?.montant_total || usager?.montant || 0);
    const fraisDossier = parseFloat(usager?.frais_dossier) || 5000;
    const montantRetard = parseFloat(usager?.montant_retard) || 0;
    const estRetard = usager?.is_retard || false;
    const uniter = parseInt(usager?.uniter) || 1;

    const montantXUniter = montantPaye * uniter;

    let soitTotal = montantXUniter + fraisDossier;
    if (estRetard) {
      soitTotal += montantRetard;
    }

    const totalEnLettres = nombreEnLettres(Math.round(soitTotal), langue);
    const montantEnLettres = nombreEnLettres(Math.floor(montantXUniter), langue);

    const nomRepresentant = usager?.representant_par || usager?.demandeur || '';

    const cin = usager?.representant_cin || usager?.cin || '';
    const cinDelivree = usager?.representant_cin_delivree || usager?.cin_delivree || '';
    const cinLieu = usager?.representant_cin_lieu || usager?.cin_lieu || '';

    const adresse = usager?.adresse || '';
    const domicile = usager?.domicile || usager?.adresse || '';
    const telephone = usager?.telephone || '';

    const percepteurNom = usager?.confirmation_nom || usager?.nom_signataire || '';

    const currentDateStr = getCurrentDate(langue);
    const currentYear = new Date().getFullYear();

    const lieuAjout = usager?.lieu_ajout || 'Antananarivo';

    const numeroHain = numeroDossierUtilisateur || `01/${currentYear.toString().slice(-2)}`;

    const formattedCinDelivree = formatCinDate(cinDelivree);

    // ============================================================
    // PAGE 1
    // ============================================================

    // En-tête institutionnel FR (officiel)
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

    // ✅ Titre traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    const titreTexte = t(
      'CONTRAT DE REPRESENTATION',
      'FIFANARAHANA FISOLO TENA',
      'REPRESENTATION CONTRACT'
    );
    const titreWidth = doc.getTextWidth(titreTexte);
    doc.text(titreTexte, pageWidth / 2, yPos, { align: 'center' });
    doc.line(pageWidth / 2 - titreWidth / 2, yPos + SOULIGNEMENT_OFFSET, pageWidth / 2 + titreWidth / 2, yPos + SOULIGNEMENT_OFFSET);
    yPos += 9;

    // ✅ Dossier N° traduit
    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.text(`${t('Dossier N°', 'Rakitra N°', 'File N°')} : ${dossierGlobal}`, marginX, yPos);

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

    // ✅ ENTRE LES SOUSSIGNES traduit
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(
      t('ENTRE LES SOUSSIGNES :', 'EO ANELANELAN\'NY SONIA :', 'BETWEEN THE UNDERSIGNED:'),
      marginX,
      yPos
    );
    yPos += 8;

    // 1 - L'OFFICE (institution FR)
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('1 - ', marginX, yPos);
    doc.setFont('times', 'bold');
    doc.text('L\'OFFICE MALAGASY DU DROIT D\'AUTEUR', marginX + 10, yPos);
    doc.setFont('times', 'normal');
    const etabLabel = t(
      ', Etablissement Public à caractère Industriel et',
      ', Andrim-panjakana ho an\'ny indostria sy',
      ', Public Industrial and'
    );
    doc.text(etabLabel, marginX + 10 + doc.getTextWidth('L\'OFFICE MALAGASY DU DROIT D\'AUTEUR') + 5, yPos);
    yPos += 5;
    const commercialLabel = t(
      'Commercial, représenté par ',
      'Varotra, misolo tena ',
      'Commercial Establishment, represented by '
    );
    doc.text(commercialLabel, marginX + 5, yPos);
    if (percepteurNom) {
      doc.setFont('times', 'bold');
      doc.text(`${percepteurNom}`, marginX + 5 + doc.getTextWidth(commercialLabel), yPos);
      doc.setFont('times', 'normal');
      const percepteurLabel = t(
        ', Percepteur et Contrôleur',
        ', Mpanangona hetra sy Mpanara-maso',
        ', Tax Collector and Controller'
      );
      doc.text(
        percepteurLabel,
        marginX + 10 + doc.getTextWidth(commercialLabel) + doc.getTextWidth(`${percepteurNom}`) + 5,
        yPos
      );
    } else {
      doc.setFont('times', 'bold');
      doc.text('________________________', marginX + 5 + doc.getTextWidth(commercialLabel), yPos);
      doc.setFont('times', 'normal');
      const percepteurLabel = t(
        ', Percepteur et Contrôleur',
        ', Mpanangona hetra sy Mpanara-maso',
        ', Tax Collector and Controller'
      );
      doc.text(
        percepteurLabel,
        marginX + 10 + doc.getTextWidth(commercialLabel) + doc.getTextWidth('________________________') + 5,
        yPos
      );
    }
    yPos += 5;
    const ciApresLabel = t('Ci-après désigné « ', 'Antsoina manaraka hoe « ', 'Hereafter referred to as "');
    doc.text(ciApresLabel, marginX + 5, yPos);
    doc.setFont('times', 'bold');
    doc.text('l\'O.M.D.A.', marginX + 5 + doc.getTextWidth(ciApresLabel), yPos);
    doc.setFont('times', 'normal');
    doc.text(' »', marginX + 5 + doc.getTextWidth(ciApresLabel) + doc.getTextWidth('l\'O.M.D.A.') + 2, yPos);
    yPos += 8;
    doc.text(t('D\'UNE PART,', 'ANJARA IRAY,', 'ON ONE PART,'), marginX + 130, yPos);
    yPos += 7;

    // 2 - BENEFICIAIRE
    doc.text('2 - ', marginX, yPos);
    doc.setFont('times', 'bold');
    doc.text(`${organisateurs || '________________________'}`, marginX + 10, yPos);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.text(t('Représenté par M. ', 'Mpisolo tena Andriamatoa ', 'Represented by Mr. '), marginX, yPos);
    doc.setFont('times', 'bold');
    doc.text(`${representantPar || '________________________'}`, marginX + 35, yPos);
    yPos += 5;
    doc.setFont('times', 'normal');
    const ciApres2 = t('Ci-après désigné « ', 'Antsoina manaraka hoe « ', 'Hereafter referred to as "');
    doc.text(ciApres2, marginX, yPos);
    doc.setFont('times', 'bold');
    const benefLabel = t('le BENEFICIAIRE', 'ny MPANDRY SOA', 'the BENEFICIARY');
    doc.text(benefLabel, marginX + 35, yPos);
    doc.setFont('times', 'normal');
    doc.text(' »', marginX + 35 + doc.getTextWidth(benefLabel) + 2, yPos);
    yPos += 8;
    doc.text(t('D\'AUTRE PART,', 'ANJARA IRAY KOSA,', 'ON THE OTHER PART,'), marginX + 130, yPos);
    yPos += 7;

    // ✅ IL A ETE CONVENU traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(
      t(
        'IL A ETE CONVENU ET ARRETE CE QUI SUIT :',
        'NIFANARAHANA SY VOAFAFATRA IZAY MANARAKA IZAY :',
        'IT HAS BEEN AGREED AND DECIDED AS FOLLOWS:'
      ),
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );
    yPos += 7;

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(
      t('A - CONDITIONS GENERALES :', 'A - FEPETRA ANKAPOBENY :', 'A - GENERAL CONDITIONS:'),
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );
    yPos += 8;

    // ⚠️ LES ARTICLES JURIDIQUES RESTENT EN FRANÇAIS
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const art1Texte = 'Article premier :';
    doc.text(art1Texte, marginX, yPos);
    souligner(doc, marginX, yPos, art1Texte);
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

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const art2Texte = 'Article 2 :';
    doc.text(art2Texte, marginX, yPos);
    souligner(doc, marginX, yPos, art2Texte);
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

    // ============================================================
    // PAGE 2 (articles FR)
    // ============================================================
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

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const art3Texte = 'Article 3 :';
    doc.text(art3Texte, marginX, yPos);
    souligner(doc, marginX, yPos, art3Texte);
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

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const art4Texte = 'Article 4 :';
    doc.text(art4Texte, marginX, yPos);
    souligner(doc, marginX, yPos, art4Texte);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('La présente autorisation est personnelle au bénéficiaire et ne s\'applique qu\'à la manifestation, objet', marginX, yPos);
    yPos += 5;
    doc.text('de sa demande, organisée par lui et pour son propre compte.', marginX, yPos);
    yPos += 7;

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const art5Texte = 'Article 5 :';
    doc.text(art5Texte, marginX, yPos);
    souligner(doc, marginX, yPos, art5Texte);
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

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const art6Texte = 'Article 6 :';
    doc.text(art6Texte, marginX, yPos);
    souligner(doc, marginX, yPos, art6Texte);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('Le coût du timbre sur les quittances, les frais de correspondance et de recouvrement s\'il y a lieu seront', marginX, yPos);
    yPos += 5;
    doc.text('à la charge du bénéficiaire.', marginX, yPos);
    yPos += 7;

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const art7Texte = 'Article 7 :';
    doc.text(art7Texte, marginX, yPos);
    souligner(doc, marginX, yPos, art7Texte);
    yPos += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('Les frais des présentes et ceux qui en seront à la suite sont à la charge du bénéficiaire.', marginX, yPos);
    yPos += 10;

    // ✅ B - CONDITIONS PARTICULIERES traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(
      t(
        'B - CONDITIONS PARTICULIERES :',
        'B - FEPETRA MANOKANA :',
        'B - SPECIAL CONDITIONS:'
      ),
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );
    yPos += 10;

    // ✅ Article 1 traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const art1bTexte = t('Article 1 :', 'Andininy 1 :', 'Article 1:');
    doc.text(art1bTexte, marginX, yPos);
    souligner(doc, marginX, yPos, art1bTexte);
    yPos += 7;

    // ✅ BENEFICIAIRE traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const benef2Label = t('BENEFICIAIRE :', 'MPANDRY SOA :', 'BENEFICIARY:');
    doc.text(benef2Label, marginX, yPos);
    souligner(doc, marginX, yPos, benef2Label);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${organisateurs || '________________________'}`, marginX + 35, yPos);
    yPos += 7;

    // ✅ GENRE DE LA MANIFESTATION traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const genreLabel = t('GENRE DE LA MANIFESTATION :', 'KARAZANA HETSIKA :', 'EVENT TYPE:');
    doc.text(genreLabel, marginX, yPos);
    souligner(doc, marginX, yPos, genreLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${genreManifestation || '________________________'}`, marginX + 70, yPos);
    yPos += 7;

    // ✅ ARTISTE(S) traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const artisteLabel = t('ARTISTE(S) :', 'MPANAKANTO :', 'ARTIST(S):');
    doc.text(artisteLabel, marginX, yPos);
    souligner(doc, marginX, yPos, artisteLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${artistes || '________________________'}`, marginX + 30, yPos);
    yPos += 7;

    // ✅ DATE et LIEU traduits
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const dateLabel = t('DATE :', 'DATY :', 'DATE:');
    doc.text(dateLabel, marginX, yPos);
    souligner(doc, marginX, yPos, dateLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${dateEvenement || '________________________'}`, marginX + 18, yPos);

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const lieuLabel = t('LIEU :', 'TOERANA :', 'LOCATION:');
    doc.text(lieuLabel, marginX + 80, yPos);
    souligner(doc, marginX + 80, yPos, lieuLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${lieuEvenement || '________________________'}`, marginX + 98, yPos);
    yPos += 7;

    // ✅ MONTANT traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const montantLabel = t('MONTANT :', 'VOLA :', 'AMOUNT:');
    doc.text(montantLabel, marginX, yPos);
    souligner(doc, marginX, yPos, montantLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    let montantDisplay = '';
    if (uniter > 1) {
      montantDisplay = `${formatNumber(montantPaye)} × ${uniter} ${t('Uniter', 'Uniter', 'Unit')} = ${formatNumber(montantXUniter)} Ar (${montantEnLettres} Ariary)`;
    } else {
      montantDisplay = `${formatNumber(montantPaye)} Ar (${montantEnLettres} Ariary)`;
    }

    doc.text(montantDisplay, marginX + 25, yPos);
    yPos += 5;

    // ✅ FRAIS DE DOSSIER traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const fraisLabel = t('FRAIS DE DOSSIER :', 'SARAM-PANDRAHARAHANA :', 'FILE FEES:');
    doc.text(fraisLabel, marginX, yPos);
    souligner(doc, marginX, yPos, fraisLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${formatNumber(fraisDossier)} Ar`, marginX + 45, yPos);
    yPos += 5;

    // ✅ PENALITE DE RETARD traduit
    if (estRetard && montantRetard > 0) {
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      const retardLabel = t('PENALITE DE RETARD :', 'SAZY NOHO NY FAHATARANA :', 'LATE PENALTY:');
      doc.text(retardLabel, marginX, yPos);
      souligner(doc, marginX, yPos, retardLabel);
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      doc.text(`${formatNumber(montantRetard)} Ar`, marginX + 50, yPos);
      yPos += 7;
    } else {
      yPos += 2;
    }

    // ✅ SOIT TOTAL traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const soitLabel = t('SOIT TOTAL :', 'VOLA TOTAL :', 'TOTAL AMOUNT:');
    doc.text(soitLabel, marginX, yPos);
    souligner(doc, marginX, yPos, soitLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${formatNumber(soitTotal)} Ar (${totalEnLettres} Ariary)`, marginX + 30, yPos);
    yPos += 7;

    // ✅ NOM ET PRENOMS traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const nomLabel = t('NOM ET PRENOMS :', 'ANARANA SY FANAMPIN\'ANARANA :', 'FULL NAME:');
    doc.text(nomLabel, marginX, yPos);
    souligner(doc, marginX, yPos, nomLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${nomRepresentant || '________________________'}`, marginX + 45, yPos);
    yPos += 7;

    // ✅ CIN traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    let cinText = '';
    const delivreeLabel = t('délivrée le', 'nomena ny', 'issued on');
    const aLabel = t('à', 'tao', 'at');

    if (cin && formattedCinDelivree && cinLieu) {
      cinText = `${cin} ${delivreeLabel} ${formattedCinDelivree} ${aLabel} ${cinLieu}`;
    } else if (cin && formattedCinDelivree) {
      cinText = `${cin} ${delivreeLabel} ${formattedCinDelivree}`;
    } else if (cin && cinLieu) {
      cinText = `${cin} ${t('délivré à', 'nomena tao', 'issued at')} ${cinLieu}`;
    } else if (cin) {
      cinText = cin;
    } else {
      cinText = '________________________';
    }
    const cinTitre = t('CIN :', 'CIN :', 'CIN:');
    doc.text(cinTitre, marginX, yPos);
    souligner(doc, marginX, yPos, cinTitre);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(cinText, marginX + 18, yPos);
    yPos += 7;

    // ✅ DOMICILE et Contact traduits
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const domicileLabel = t('DOMICILE :', 'TRANO :', 'HOME ADDRESS:');
    doc.text(domicileLabel, marginX, yPos);
    souligner(doc, marginX, yPos, domicileLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${domicile || '________________________'}`, marginX + 25, yPos);

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const contactLabel = t('Contact :', 'Fifandraisana :', 'Contact:');
    doc.text(contactLabel, marginX + 100, yPos);
    souligner(doc, marginX + 100, yPos, contactLabel);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`${telephone || '________________________'}`, marginX + 125, yPos);
    yPos += 10;

    // ✅ Article 2 traduit (label uniquement)
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const art2bTexte = t('Article 2 :', 'Andininy 2 :', 'Article 2:');
    doc.text(art2bTexte, marginX, yPos);
    souligner(doc, marginX, yPos, art2bTexte);
    yPos += 8;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(
      t(
        'Pour l\'exécution des clauses et conditions du présent contrat, les parties font élection de domicile ',
        'Ho fanatanterahana ny fepetra sy fizarana amin\'ity fifanarahana ity, ny roa tonta dia mifidy toerana ',
        'For the execution of the clauses and conditions of this contract, the parties elect domicile '
      ),
      marginX,
      yPos
    );
    yPos += 5;

    const lieuAjoutTexte = `${t('à', 'ao', 'in')} ${lieuAjout}.`;
    doc.text(lieuAjoutTexte, marginX, yPos);
    souligner(doc, marginX, yPos, lieuAjoutTexte);
    yPos += 5;

    doc.text(`${lieuAjout}, ${t('le', 'ny', 'on')} ${currentDateStr}`, marginX + 100, yPos);
    yPos += 5;
    doc.text(
      t(
        'Pour l\'Office Malagasy du Droit d\'Auteur',
        'Ho an\'ny Birao Malagasy misahana ny Zon\'ny Mpanoratra',
        'For the Malagasy Copyright Office'
      ),
      marginX + 90,
      yPos
    );
    yPos += 5;
    doc.text(t('Le Bénéficiaire', 'Ny mpandray soa', 'The Beneficiary'), marginX + 24, yPos);
    yPos += 5;
    doc.text(
      t('Le Percepteur et Contrôleur', 'Ny mpanangona hetra sy mpanara-maso', 'The Tax Collector and Controller'),
      marginX + 120,
      yPos
    );

    yPos += 25;
    doc.text(representantPar, marginX + 24, yPos);
    doc.text(percepteurNom, marginX + 130, yPos);

    // ============================================================
    // PAGE 3 - AUTORISATION
    // ============================================================
    doc.addPage();
    yPos = 15;
    yPos += 5;

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

    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.text(`${t('Dossier N°', 'Rakitra N°', 'File N°')} : ${dossierGlobal}`, marginX, yPos);

    const rectWidth3 = hainWidth + (rectPadding * 2) + 25;
    const rectX3 = pageWidth - marginX - rectWidth3;
    const rectY3 = yPos - 4;
    const rectHeight3 = 7;
    doc.rect(rectX3, rectY3, rectWidth3, rectHeight3);

    const textX3 = rectX3 + (rectWidth3 / 2) - (hainWidth / 2);
    doc.text(hainText, textX3, yPos);

    yPos += 25;

    // ✅ AUTORISATION traduit
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    const authTexte = t(
      'A U T O R I S A T I O N',
      'F A N A L A L A N A',
      'A U T H O R I Z A T I O N'
    );
    const authWidth = doc.getTextWidth(authTexte);
    doc.text(authTexte, pageWidth / 2, yPos, { align: 'center' });
    doc.line(pageWidth / 2 - authWidth / 2, yPos + SOULIGNEMENT_OFFSET, pageWidth / 2 + authWidth / 2, yPos + SOULIGNEMENT_OFFSET);
    yPos += 18;

    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    // ✅ Texte d'autorisation multi-langue
    let autorisationText = '';
    if (langue === 'mg') {
      autorisationText = `${organisateurs || '________'} misolo tena Andriamatoa ${representantPar || '________'} dia nahazo alalana hampiasa ny asa ao amin'ny lisitra ankapoben'ny Birao Malagasy misahana ny Zon'ny Mpanoratra (OMDA) amin'ny ${genreManifestation || '________'} ny ${dateEvenement || '________'} miaraka amin'ny ${artistes || '________'} ao ${lieuEvenement || '________'}.`;
    } else if (langue === 'en') {
      autorisationText = `${organisateurs || '________'} represented by Mr. ${representantPar || '________'} is authorized to use the works of the general repertoire of the Malagasy Copyright Office (OMDA) on the occasion of the ${genreManifestation || '________'} on ${dateEvenement || '________'} with ${artistes || '________'} at ${lieuEvenement || '________'}.`;
    } else {
      autorisationText = `${organisateurs || '________'} représenté par M. ${representantPar || '________'} est autorisé à utiliser les œuvres du répertoire général de l'Office Malagasy du Droit d'Auteur (OMDA) à l'occasion du ${genreManifestation || '________'} le ${dateEvenement || '________'} avec ${artistes || '________'} au ${lieuEvenement || '________'}.`;
    }

    const splitText = doc.splitTextToSize(autorisationText, pageWidth - 2 * marginX);
    doc.text(splitText, marginX, yPos);
    yPos += 25;

    doc.text(`${t('Fait à', 'Natao tao', 'Done at')} ${lieuAjout}, ${t('le', 'ny', 'on')} ${currentDateStr}`, marginX + 90, yPos);
    yPos += 15;

    doc.text(
      t(
        'Pour l\'Office Malagasy du Droit d\'Auteur',
        'Ho an\'ny Birao Malagasy misahana ny Zon\'ny Mpanoratra',
        'For the Malagasy Copyright Office'
      ),
      marginX + 90,
      yPos
    );
    yPos += 6;
    doc.text('(OMDA)', marginX + 96, yPos);
    yPos += 5;

    doc.text(
      t('Le Percepteur et Contrôleur', 'Ny mpanangona hetra sy mpanara-maso', 'The Tax Collector and Controller'),
      marginX + 93,
      yPos
    );
    yPos += 35;

    doc.setFont('times', 'italic');
    doc.text(percepteurNom, marginX + 91, yPos);

    const fileName = `contrat_occ_${(organisateurs || 'usager').replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
    doc.save(fileName);
    console.log(`PDF OCC généré avec succès (langue: ${langue}):`, fileName);
    return true;

  } catch (error) {
    console.error('Erreur génération PDF OCC:', error);
    throw error;
  }
};

export default generateOccPDF;