// src/pages/pdf/facture_pdf.jsx
import jsPDF from 'jspdf';
import { formatNumber as formatNumberBase } from './occ_pdf';
import logoRepoblika from '../../assets/repoblika.jpg';

// ============================================================
// FORMATAGE À 2 DÉCIMALES MAX
// ============================================================
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0';
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  const rounded = Math.round(num * 100) / 100;
  if (Number.isInteger(rounded)) {
    return formatNumberBase(rounded);
  }
  const parts = rounded.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decPart = parts[1].replace(/0+$/, '');
  return decPart ? `${intPart}.${decPart}` : intPart;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const jour = String(date.getDate()).padStart(2, '0');
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const annee = date.getFullYear();
    return `${jour}/${mois}/${annee}`;
  } catch (error) {
    return '';
  }
};

export const formatDateLong = (dateString) => {
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

function numberToWords(num) {
  if (num === 0) return 'Zéro Ariary';
  if (num < 0) return 'Moins ' + numberToWords(Math.abs(num));

  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf'];
  const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-sept', 'Dix-huit', 'Dix-neuf'];
  const tens = ['', 'Dix', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-dix', 'Quatre-vingt', 'Quatre-vingt-dix'];

  function convertToWords(n) {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (unit === 0) return tens[ten];
      if (ten === 7) return 'Soixante-dix' + (unit > 0 ? '-' + units[unit] : '');
      if (ten === 8) return 'Quatre-vingt' + (unit > 0 ? '-' + units[unit] : '');
      if (ten === 9) return 'Quatre-vingt-dix' + (unit > 0 ? '-' + units[unit] : '');
      return tens[ten] + '-' + units[unit];
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      if (rest === 0) return units[hundred] + ' Cent';
      return units[hundred] + ' Cent ' + convertToWords(rest);
    }
    if (n < 1000000) {
      const thousand = Math.floor(n / 1000);
      const rest = n % 1000;
      if (rest === 0) return convertToWords(thousand) + ' Mille';
      return convertToWords(thousand) + ' Mille ' + convertToWords(rest);
    }
    if (n < 1000000000) {
      const million = Math.floor(n / 1000000);
      const rest = n % 1000000;
      if (rest === 0) return convertToWords(million) + ' Million';
      return convertToWords(million) + ' Million ' + convertToWords(rest);
    }
    return 'Nombre trop grand';
  }

  const ariary = Math.floor(num);
  let result = convertToWords(ariary);
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result + ' Ariary';
}

export const generateFacturePDF = async (factureData, returnBlob = false) => {
  try {
    console.log('========== GÉNÉRATION FACTURE PDF ==========');
    console.log('🔑 uniter reçu:', factureData.uniter);
    console.log('🔑 montant_mensuel reçu:', factureData.montant_mensuel);
    console.log('🔑 soit_total reçu:', factureData.soit_total);
    console.log('🔑 num_facture_type:', factureData.num_facture_type);
    console.log('🔑 nb mois reçu:', factureData.mois_list?.length);
    console.log('🔑 is_renouvellement:', factureData.is_renouvellement);
    console.log('🔑 frais_renouvellement:', factureData.frais_renouvellement);

    let dafName = 'DAF';

    try {
      const response = await fetch('http://localhost:3001/api/daf/name');
      const data = await response.json();
      if (data.success && data.dafName) {
        dafName = data.dafName;
      }
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer le DAF');
    }

    if (!dafName || dafName === '' || dafName === 'Directeur Financier' || dafName === 'undefined') {
      dafName = 'DAF';
    }

    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 20;
    let yPos = 8;

    // ============================================================
    // LOGO
    // ============================================================
    const logoWidth = 65;
    const logoHeight = 20;
    doc.addImage(logoRepoblika, 'JPEG', (pageWidth / 2) - (logoWidth / 2), yPos, logoWidth, logoHeight);
    yPos += logoHeight + 6;

        // ============================================================
    // EN-TÊTE ADMINISTRATIF (police diminuée, position inchangée)
    // ============================================================
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text('MINISTERE DE LA COMMUNICATION', marginX + 8, yPos);
    yPos += 4.5;
    doc.text('ET DE LA CULTURE', marginX + 20, yPos);
    yPos += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('********', marginX + 30, yPos);
    yPos += 4.5;
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text('SECRETARIAT GENERAL', marginX + 18, yPos);
    yPos += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.text('********', marginX + 30, yPos);
    yPos += 5.5;

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('OFFICE MALAGASY DU DROIT D\'AUTEUR', marginX, yPos);

    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const currentYear = currentDate.getFullYear().toString().slice(-2);

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(`Antananarivo, le ${dateStr}`, pageWidth - marginX, yPos, { align: 'right' });

    yPos += 5;
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    const omdaWidth = doc.getTextWidth('OFFICE MALAGASY DU DROIT D\'AUTEUR ');
    doc.text('( OMDA )', marginX + (omdaWidth / 2), yPos, { align: 'center' });
    yPos += 12;

    // ============================================================
    // RÉFÉRENCES
    // ============================================================
    const refOmda = factureData.ref_omda || '001';
    const numFacture = factureData.num_facture || refOmda;
    const refClientType = factureData.ref_client_type || 'AUT';
    const refUsager = factureData.ref_usager || '0';

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(`Réf : ${currentYear} / ${refOmda} / OMDA`, marginX, yPos);
    yPos += 8;

    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    const numFactureFormatted = String(numFacture).padStart(3, '0');

    let typeFactureLabel = factureData.type_facture || 'DAFC';
    if (typeFactureLabel !== 'DAFC' && typeFactureLabel !== 'SFL') {
      typeFactureLabel = 'DAFC';
    }

    let factureNum = `${currentYear} / ${numFactureFormatted} / ${typeFactureLabel}`;

    const numFactureStr = String(numFacture);
    const numFactureTypeLocal = factureData.num_facture_type || 'A';
    const hasSuffixe = (numFactureTypeLocal === 'B') && factureData.suffixe;

    if (numFactureStr.includes('-')) {
      factureNum = `${currentYear} / ${numFactureStr} / ${typeFactureLabel}`;
    } else if (hasSuffixe) {
      factureNum = `${currentYear} / ${numFactureFormatted}-${factureData.suffixe} / ${typeFactureLabel}`;
    }

    doc.text(`FACTURE n° ${factureNum}`, marginX + 50, yPos + 4);
    yPos += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const clientRef = `${refClientType} / ${String(refUsager).padStart(3, '0')}`;
    doc.text(`Réf. Client : ${clientRef}`, marginX, yPos + 4);
    doc.setTextColor(17, 17, 17);
    yPos += 10;

    // ============================================================
    // BOX CLIENT (tailles augmentées)
    // ============================================================
    const boxWidth = pageWidth - (marginX * 2);
    const boxHeight = 40;

    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.25);
    doc.rect(marginX, yPos, boxWidth, boxHeight, 'FD');

    // ✅ labelX et contentX : tous les labels alignés sur la même colonne
    const labelX = marginX + 5;
    const contentX = marginX + 50;
    let clientY = yPos + 7;

    doc.setFontSize(11);

    const nomClient = factureData.denomination || factureData.demandeur || factureData.organisateurs || 'CLIENT';
    doc.setFont('times', 'bold');
    doc.text('Doit :', labelX, clientY);
    doc.setFont('times', 'bold');
    doc.text(nomClient, contentX, clientY);
    clientY += 6.5;

    const responsable = factureData.representant_par || factureData.demandeur || factureData.representant_nom || 'Non spécifié';
    doc.setFont('times', 'bold');
    doc.text('Responsable :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(responsable, contentX, clientY);
    clientY += 6.5;

    const adresse = factureData.adresse || factureData.siege || factureData.adresse_siege || 'Adresse non spécifiée';
    doc.setFont('times', 'bold');
    doc.text('Adresse :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(adresse, contentX, clientY);
    clientY += 6.5;

    const contact = factureData.telephone || 'Non spécifié';
    doc.setFont('times', 'bold');
    doc.text('Contact :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(contact, contentX, clientY);
    clientY += 7;

    // ✅ OBJET : toujours "Redevances d'auteur"
    //    Label "OBJET :" aligné à gauche (même labelX) + valeur alignée à contentX
    doc.setFont('times', 'bold');
    doc.text('OBJET :', labelX, clientY);
    doc.setFont('times', 'bold');
    doc.text("Redevances d'auteur", contentX, clientY);

    yPos += boxHeight + 8;

    // ========================================================================
    // RÉCUPÉRATION DES MONTANTS
    // ========================================================================
    let montantMensuel = 0;
    let fraisDossier = 0;
    let montantRetard = 0;
    let isRetard = false;
    let uniter = 1;
    let totalGeneral = 0;
    let montantsParMois = {};
    let isRenouvellement = false;
    let fraisRenouvellement = 0;

    if (factureData.montants_par_mois && typeof factureData.montants_par_mois === 'object') {
      montantsParMois = { ...factureData.montants_par_mois };
    }

    if (factureData.montant_mensuel && factureData.montant_mensuel !== '') {
      montantMensuel = parseFloat(factureData.montant_mensuel) || 0;
    }
    if (montantMensuel === 0 && factureData.montant && factureData.montant !== '') {
      montantMensuel = parseFloat(factureData.montant) || 0;
    }
    if (montantMensuel === 0 && factureData.taux && factureData.taux !== '') {
      montantMensuel = parseFloat(factureData.taux) || 0;
    }
    if (montantMensuel === 0 && factureData.montant_total && factureData.montant_total !== '') {
      montantMensuel = parseFloat(factureData.montant_total) || 0;
    }

    if (montantMensuel === 0 && Object.keys(montantsParMois).length > 0) {
      const firstKey = Object.keys(montantsParMois)[0];
      montantMensuel = montantsParMois[firstKey] || 0;
    }

    if (factureData.frais_dossier && factureData.frais_dossier !== '') {
      fraisDossier = parseFloat(factureData.frais_dossier) || 0;
    }

    if (factureData.is_renouvellement !== undefined && factureData.is_renouvellement !== null) {
      isRenouvellement = factureData.is_renouvellement === true || factureData.is_renouvellement === 'true' || factureData.is_renouvellement === 1;
    }
    if (factureData.frais_renouvellement && factureData.frais_renouvellement !== '') {
      fraisRenouvellement = parseFloat(factureData.frais_renouvellement) || 0;
    }

    if (factureData.uniter !== undefined && factureData.uniter !== null && factureData.uniter !== '') {
      uniter = parseInt(factureData.uniter) || 1;
    } else if (factureData.uniter_affiche !== undefined && factureData.uniter_affiche !== null) {
      uniter = parseInt(factureData.uniter_affiche) || 1;
    }
    if (!uniter || uniter <= 0) uniter = 1;

    if (factureData.montant_retard && factureData.montant_retard !== '') {
      montantRetard = parseFloat(factureData.montant_retard) || 0;
    }
    if (factureData.is_retard !== undefined && factureData.is_retard !== null) {
      isRetard = factureData.is_retard === true || factureData.is_retard === 'true' || factureData.is_retard === 1;
    }

    let moisList = [];
    if (factureData.mois_list && Array.isArray(factureData.mois_list)) {
      moisList = factureData.mois_list;
    } else if (factureData.mois_groupes) {
      moisList = factureData.mois_groupes.split(',').map(Number);
    } else if (factureData.mois_facture) {
      moisList = [factureData.mois_facture];
    }

    const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    // ========================================================================
    // ✅ CALCUL FINAL UNIFIÉ
    // ========================================================================
    const nbMois = moisList.length || 1;

    const puAfficheFinal = montantMensuel;
    const quantiteAffiche = uniter;
    const montantLignePrincipale = montantMensuel * uniter;

    let totalAttendu = montantLignePrincipale;
    if (isRetard && montantRetard > 0) {
      totalAttendu += montantRetard;
    }
    if (isRenouvellement && fraisRenouvellement > 0) {
      totalAttendu += fraisRenouvellement;
    }

    if (factureData.soit_total && parseFloat(factureData.soit_total) > 0) {
      totalGeneral = parseFloat(factureData.soit_total);
    } else {
      totalGeneral = totalAttendu;
    }

    console.log('📊 CALCULS FINAUX:');
    console.log('  - Type:', numFactureTypeLocal);
    console.log('  - montantMensuel (P.U.):', montantMensuel);
    console.log('  - uniter (U.):', uniter);
    console.log('  - MONTANT ligne (P.U. × U.):', montantLignePrincipale);
    console.log('  - TOTAL final:', totalGeneral);

    // ========================================================================
    // TABLEAU (tailles augmentées)
    // ========================================================================
    const xDesc = marginX;
    const xU = 115;
    const xPu = 130;
    const xMnt = 155;
    const xEnd = pageWidth - marginX;

    yPos += 2;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text('( x 1 ariary )', xEnd - 3, yPos - 6, { align: 'right' });

    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.3);
    doc.line(xDesc, yPos, xEnd, yPos);

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);

    doc.text('DESCRIPTIONS', xDesc + 3, yPos + 6);
    doc.text('U.', xU + 3, yPos + 6);
    doc.text('P.U. (Ar)', xPu + 3, yPos + 6);
    doc.text('MONTANT (Ar)', xEnd - 3, yPos + 6, { align: 'right' });

    yPos += 9;
    doc.line(xDesc, yPos, xEnd, yPos);

    const tableStartHeight = yPos - 9;
    yPos += 6;

    // ✅ CONSTRUCTION DE LA DESCRIPTION avec retour à la ligne
    let descLine = '';

    if (factureData.description_personnalisee && factureData.description_personnalisee.trim() !== '') {
      descLine = factureData.description_personnalisee.trim();
    } else {
      descLine = factureData.denomination || factureData.demandeur || factureData.organisateurs || 'Prestation OMDA';

      if (moisList.length > 0) {
        const moisNoms = moisList.map(m => moisLabels[m - 1]);
        descLine += ` - ${moisNoms.join(', ')} ${factureData.annee_facture || currentDate.getFullYear()}`;
        if (moisList.length > 1) {
          descLine += ` (${moisList.length} mois)`;
        }
      }
    }

    const maxWidth = xU - xDesc - 6;
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(descLine, maxWidth);
    const lineHeight = 6;

    const hauteurLignes = lines.length * lineHeight;

    for (let i = 0; i < lines.length; i++) {
      const currentY = yPos + (i * lineHeight);
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text(lines[i], xDesc + 3, currentY);
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(String(quantiteAffiche), xU + 5, yPos);
    doc.text(formatNumber(puAfficheFinal), xPu + 3, yPos);
    doc.text(formatNumber(montantLignePrincipale), xEnd - 3, yPos, { align: 'right' });

    yPos += hauteurLignes + 2;

    doc.setDrawColor(235, 235, 235);
    doc.line(xDesc, yPos, xEnd, yPos);

    if (isRenouvellement && fraisRenouvellement > 0) {
      yPos += 6.5;
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text('Frais renouvellement Contrat', xDesc + 3, yPos);
      doc.text('1', xU + 5, yPos);
      doc.text(formatNumber(fraisRenouvellement), xPu + 3, yPos);
      doc.text(formatNumber(fraisRenouvellement), xEnd - 3, yPos, { align: 'right' });
      yPos += 4;
    }

    if (isRetard && montantRetard > 0) {
      yPos += 6.5;
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text('Pénalité de retard', xDesc + 3, yPos);
      doc.text('1', xU + 5, yPos);
      doc.text(formatNumber(montantRetard), xPu + 3, yPos);
      doc.text(formatNumber(montantRetard), xEnd - 3, yPos, { align: 'right' });
      yPos += 4;
    }

    doc.line(xDesc, yPos, xEnd, yPos);
    doc.line(xDesc, tableStartHeight, xDesc, yPos);
    doc.line(xU, tableStartHeight, xU, yPos);
    doc.line(xPu, tableStartHeight, xPu, yPos);
    doc.line(xMnt, tableStartHeight, xMnt, yPos);
    doc.line(xEnd, tableStartHeight, xEnd, yPos);

    const totalValue = totalGeneral;
    doc.setFillColor(248, 248, 248);
    doc.rect(xMnt, yPos, xEnd - xMnt, 9, 'FD');
    doc.rect(xDesc, yPos, xMnt - xDesc, 9, 'D');

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL', xDesc + 3, yPos + 6);
    doc.text(formatNumber(totalValue), xEnd - 3, yPos + 6, { align: 'right' });

    yPos += 11;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(marginX, yPos, xEnd, yPos);

    // ========================================================================
    // SOMME EN LETTRES (taille augmentée)
    // ========================================================================
    yPos += 6;
    doc.setTextColor(17, 17, 17);
    doc.setFont('times', 'bold');
    doc.setFontSize(11.5);
    doc.text('Arrêtée la présente facture à la somme de : ', marginX, yPos);
    doc.setFont('times', 'italic');
    doc.setFontSize(11.5);
    const phraseWidth = doc.getTextWidth('Arrêtée la présente facture à la somme de : ');
    const montantLettres = numberToWords(totalValue);
    doc.text(montantLettres, marginX + phraseWidth + 5, yPos);

    yPos += 5;
    doc.line(marginX, yPos, xEnd, yPos);

    // ========================================================================
    // SIGNATURES (taille augmentée)
    // ========================================================================
    yPos += 13;
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text('Le client', marginX + 10, yPos);
    doc.text('Le Directeur Financier', xEnd - 55, yPos);

    yPos += 28;
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);

    const dafTextWidth = doc.getTextWidth(dafName);
    const dafX = (xEnd - 55) + 27 - (dafTextWidth / 2) - 10;
    doc.text(dafName, dafX, yPos);

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const dafSubText = '(Directeur Administratif et Financier)';
    const dafSubWidth = doc.getTextWidth(dafSubText);
    const dafSubX = (xEnd - 55) + 27 - (dafSubWidth / 2) - 10;
    doc.text(dafSubText, dafSubX, yPos + 5);

    yPos += 16;
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Reçu ce : ${dateStr}`, marginX, yPos);
    yPos += 6;

    const personneRecuValue = factureData.personne_recu || responsable || '________________________';
    doc.text(`Par : ${personneRecuValue}`, marginX, yPos);

    // ========================================================================
    // PIED DE PAGE (taille augmentée)
    // ========================================================================
    const footerY = 274;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(marginX, footerY, xEnd, footerY);

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text('Lot IIF 62, Fredy Rajaofera - Antaninandro - ANTANANARIVO - 101  |  Contacts : 034 05 533 88  |  mail: omda@moov.mg', pageWidth / 2, footerY + 5, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.text('Stat. N° 84212 11 2014 0 02912  •  NIF 4000 566 726', pageWidth / 2, footerY + 9, { align: 'center' });

    if (returnBlob) {
      return doc.output('blob');
    }

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const link = document.createElement('a');
    link.href = pdfUrl;
    const suffixe = (numFactureTypeLocal === 'B' && factureData.suffixe) ? `-${factureData.suffixe}` : '';
    link.download = `facture_${numFactureFormatted}${suffixe}_${refClientType}_${currentYear}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

    return true;

  } catch (error) {
    console.error('❌ Erreur génération facture PDF:', error);
    throw error;
  }
};

export default generateFacturePDF;