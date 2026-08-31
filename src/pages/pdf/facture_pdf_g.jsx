// src/pages/pdf/facture_pdf_g.jsx
// GÉNÉRATEUR PDF POUR GenerationFacture.jsx (AVEC FRAIS DE DOSSIER)
import jsPDF from 'jspdf';
import logoRepoblika from '../../assets/repoblika.jpg';

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

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

export const formatNumber = (value) => {
  if (value === undefined || value === null) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('fr-FR');
};

// Fonction pour convertir un nombre en lettres (Ariary)
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

// ============================================================
// FONCTION PRINCIPALE - GENERATION FACTURE AVEC FRAIS
// ============================================================

export const generateFacturePDF = async (factureData, returnBlob = false) => {
  try {
    console.log('========== GÉNÉRATION FACTURE PDF (AVEC FRAIS) ==========');
    console.log('📄 Données reçues:', factureData);

    // Récupérer le nom du DAF depuis l'API
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

    // ========================================================================
    // 1 - LOGO
    // ========================================================================
    const logoWidth = 65;
    const logoHeight = 20;
    try {
      doc.addImage(logoRepoblika, 'JPEG', (pageWidth / 2) - (logoWidth / 2), yPos, logoWidth, logoHeight);
    } catch (e) {
      console.warn('⚠️ Logo non trouvé, continuation sans logo');
    }
    yPos += logoHeight + 6;

    // ========================================================================
    // 2 - EN-TÊTE ADMINISTRATIF
    // ========================================================================
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('MINISTERE DE LA COMMUNICATION', marginX, yPos);
    yPos += 4.5;
    doc.text('ET DE LA CULTURE', marginX + 14, yPos);
    yPos += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.text('********', marginX + 22, yPos);
    yPos += 4.5;
    doc.setFont('times', 'bold');
    doc.text('SECRETARIAT GENERAL', marginX + 10, yPos);
    yPos += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.text('********', marginX + 22, yPos);
    yPos += 5.5;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('OFFICE MALAGASY DU DROIT D\'AUTEUR', marginX, yPos);

    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const currentYear = currentDate.getFullYear().toString().slice(-2);

    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text(`Antananarivo, le ${dateStr}`, pageWidth - marginX, yPos, { align: 'right' });

    yPos += 5;
    doc.setFont('times', 'bold');
    const omdaWidth = doc.getTextWidth('OFFICE MALAGASY DU DROIT D\'AUTEUR ');
    doc.text('( OMDA )', marginX + (omdaWidth / 2), yPos, { align: 'center' });
    yPos += 12;

    // ========================================================================
    // 3 - RÉFÉRENCES
    // ========================================================================
    const refOmda = factureData.ref_omda || '001';
    const numFacture = factureData.num_facture || refOmda;
    const refClientType = factureData.ref_client_type || 'AUT';
    const refUsager = factureData.ref_usager || '0';

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Réf : ${currentYear} / ${refOmda} / OMDA`, marginX, yPos);
    yPos += 7;

    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    const numFactureFormatted = String(numFacture).padStart(3, '0');

    let typeFactureLabel = factureData.type_facture || 'DAFC';
    if (typeFactureLabel !== 'DAFC' && typeFactureLabel !== 'SFL') {
      typeFactureLabel = 'DAFC';
    }

    const factureNum = `${currentYear} / ${numFactureFormatted} / ${typeFactureLabel}`;
    doc.text(`FACTURE n° ${factureNum}`, marginX + 50, yPos + 4);
    yPos += 5;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const clientRef = `${refClientType} / ${String(refUsager).padStart(3, '0')}`;
    doc.text(`Réf. Client : ${clientRef}`, marginX, yPos + 4);
    doc.setTextColor(17, 17, 17);
    yPos += 10;

    // ========================================================================
    // 4 - BLOC CLIENT
    // ========================================================================
    const boxWidth = pageWidth - (marginX * 2);
    const boxHeight = 34;

    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.25);
    doc.rect(marginX, yPos, boxWidth, boxHeight, 'FD');

    const labelX = marginX + 5;
    const contentX = marginX + 45;
    let clientY = yPos + 6;

    const nomClient = factureData.denomination || factureData.demandeur || factureData.organisateurs || 'CLIENT';
    doc.setFont('times', 'bold');
    doc.text('Doit :', labelX, clientY);
    doc.setFont('times', 'bold');
    doc.text(nomClient, contentX, clientY);
    clientY += 6;

    const responsable = factureData.representant_par || factureData.demandeur || factureData.representant_nom || 'Non spécifié';
    doc.setFont('times', 'bold');
    doc.text('Responsable :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(responsable, contentX, clientY);
    clientY += 6;

    const adresse = factureData.adresse || factureData.siege || factureData.adresse_siege || 'Adresse non spécifiée';
    doc.setFont('times', 'bold');
    doc.text('Adresse :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(adresse, contentX, clientY);
    clientY += 6;

    const contact = factureData.telephone || 'Non spécifié';
    doc.setFont('times', 'bold');
    doc.text('Contact :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(contact, contentX, clientY);
    clientY += 6;

    const typeFactureObjet = factureData.type_facture || 'Redevances';
    doc.setFont('times', 'bold');
    doc.text('OBJET :', labelX, clientY);
    doc.setFont('times', 'bold');
    doc.text(typeFactureObjet, contentX, clientY);

    yPos += boxHeight + 8;

    // ========================================================================
    // 5 - RÉCUPÉRATION DES MONTANTS (AVEC FRAIS DE DOSSIER)
    // ========================================================================
    console.log('🔍 RECHERCHE DES MONTANTS (AVEC FRAIS)...');

    let montantMensuel = parseFloat(factureData.montant_mensuel) || 0;
    let fraisDossier = parseFloat(factureData.frais_dossier) || 0;
    let montantRetard = parseFloat(factureData.montant_retard) || 0;
    let isRetard = factureData.is_retard || false;
    let uniter = parseInt(factureData.uniter) || 1;
    let totalGeneral = parseFloat(factureData.soit_total) || 0;

    console.log('📊 MONTANTS RÉCUPÉRÉS:', {
      montantMensuel,
      fraisDossier,
      montantRetard,
      isRetard,
      uniter,
      totalGeneral
    });

    // Si le total n'est pas fourni, le calculer
    if (totalGeneral === 0) {
      const baseMontant = montantMensuel * uniter;
      totalGeneral = baseMontant + fraisDossier + (isRetard ? montantRetard : 0);
      console.log('🔄 Total recalculé:', totalGeneral);
    }

    // Si les frais de dossier sont à 0 mais que le total est fourni, on essaie de les déduire
    if (fraisDossier === 0 && totalGeneral > 0 && montantMensuel > 0) {
      const baseMontant = montantMensuel * uniter;
      const retard = isRetard ? montantRetard : 0;
      const fraisCalcule = totalGeneral - baseMontant - retard;
      if (fraisCalcule > 0) {
        fraisDossier = fraisCalcule;
        console.log('🔄 Frais de dossier déduits du total:', fraisDossier);
      }
    }

    console.log('📊 MONTANTS FINAUX (AVEC FRAIS):');
    console.log('  - montantMensuel:', montantMensuel);
    console.log('  - fraisDossier:', fraisDossier);
    console.log('  - uniter:', uniter);
    console.log('  - totalGeneral:', totalGeneral);

    // ========================================================================
    // 6 - TABLEAU
    // ========================================================================
    const xDesc = marginX;
    const xU = 115;
    const xPu = 130;
    const xMnt = 155;
    const xEnd = pageWidth - marginX;

    yPos += 2;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text('( x 1 ariary )', xEnd - 3, yPos - 6, { align: 'right' });

    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.3);
    doc.line(xDesc, yPos, xEnd, yPos);

    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 17, 17);

    doc.text('DESCRIPTIONS', xDesc + 3, yPos + 5.5);
    doc.text('U.', xU + 3, yPos + 5.5);
    doc.text('P.U. (Ar)', xPu + 3, yPos + 5.5);
    doc.text('MONTANT (Ar)', xEnd - 3, yPos + 5.5, { align: 'right' });

    yPos += 8;
    doc.line(xDesc, yPos, xEnd, yPos);

    const tableStartHeight = yPos - 8;

    yPos += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);

    // CONSTRUCTION DE LA DESCRIPTION
    let descLine = '';

    if (factureData.description_personnalisee && factureData.description_personnalisee.trim() !== '') {
      descLine = factureData.description_personnalisee.trim();
    } else {
      descLine = factureData.denomination || factureData.demandeur || factureData.organisateurs || 'Prestation OMDA';
      
      if (factureData.mois_groupes) {
        const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const moisList = factureData.mois_groupes.split(',').map(Number);
        const moisNoms = moisList.map(m => moisLabels[m - 1]);
        descLine += ` - ${moisNoms.join(', ')} ${factureData.annee_facture || ''}`;
      } else if (factureData.mois_facture) {
        const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        descLine += ` - ${moisLabels[factureData.mois_facture - 1]} ${factureData.annee_facture || ''}`;
      }
    }

    console.log('📝 DESCRIPTION FINALE:', descLine);

    // AFFICHAGE DES VALEURS DANS LE TABLEAU
    const puValue = montantMensuel > 0 ? montantMensuel : 0;
    const montantValue = puValue * uniter;

    console.log('📊 Affichage tableau (AVEC FRAIS):');
    console.log('  - description:', descLine);
    console.log('  - uniter:', uniter);
    console.log('  - pu (montantMensuel):', puValue);
    console.log('  - montant (pu × uniter):', montantValue);

    const maxWidth = xU - xDesc - 6;
    const lines = doc.splitTextToSize(descLine, maxWidth);
    const lineHeight = 5.5;

    for (let i = 0; i < lines.length; i++) {
      const currentY = yPos + (i * lineHeight);
      doc.text(lines[i], xDesc + 3, currentY);
    }

    doc.text(String(uniter), xU + 5, yPos);
    doc.text(formatNumber(puValue), xPu + 3, yPos);
    doc.text(formatNumber(montantValue), xEnd - 3, yPos, { align: 'right' });

    yPos += (lines.length * lineHeight) + 2;

    doc.setDrawColor(235, 235, 235);
    doc.line(xDesc, yPos, xEnd, yPos);

    // ✅ FRAIS DE DOSSIER (TOUJOURS AFFICHÉ CAR > 0 DANS GenerationFacture)
    if (fraisDossier > 0) {
      yPos += 6;
      doc.text('Frais de dossier', xDesc + 3, yPos);
      doc.text('1', xU + 5, yPos);
      doc.text(formatNumber(fraisDossier), xPu + 3, yPos);
      doc.text(formatNumber(fraisDossier), xEnd - 3, yPos, { align: 'right' });
      yPos += 4;
    }

    // PÉNALITÉ DE RETARD
    if (isRetard && montantRetard > 0) {
      yPos += 6;
      doc.text('Pénalité de retard', xDesc + 3, yPos);
      doc.text('1', xU + 5, yPos);
      doc.text(formatNumber(montantRetard), xPu + 3, yPos);
      doc.text(formatNumber(montantRetard), xEnd - 3, yPos, { align: 'right' });
      yPos += 4;
    }

    // LIGNES DE FERMETURE
    doc.line(xDesc, yPos, xEnd, yPos);
    doc.line(xDesc, tableStartHeight, xDesc, yPos);
    doc.line(xU, tableStartHeight, xU, yPos);
    doc.line(xPu, tableStartHeight, xPu, yPos);
    doc.line(xMnt, tableStartHeight, xMnt, yPos);
    doc.line(xEnd, tableStartHeight, xEnd, yPos);

    // ========================================================================
    // 7 - TOTAL
    // ========================================================================
    const totalValue = totalGeneral;
    doc.setFillColor(248, 248, 248);
    doc.rect(xMnt, yPos, xEnd - xMnt, 8, 'FD');
    doc.rect(xDesc, yPos, xMnt - xDesc, 8, 'D');

    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text('TOTAL', xDesc + 3, yPos + 5.5);
    doc.text(formatNumber(totalValue), xEnd - 3, yPos + 5.5, { align: 'right' });

    // ========================================================================
    // 8 - SOMME EN LETTRES
    // ========================================================================
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(marginX, yPos, xEnd, yPos);

    yPos += 5;
    doc.setTextColor(17, 17, 17);
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text('Arrêtée la présente facture à la somme de : ', marginX, yPos);
    doc.setFont('times', 'italic');
    const phraseWidth = doc.getTextWidth('Arrêtée la présente facture à la somme de : ');
    const montantLettres = numberToWords(totalValue);
    doc.text(montantLettres, marginX + phraseWidth + 5, yPos);

    yPos += 4;
    doc.line(marginX, yPos, xEnd, yPos);

    // ========================================================================
    // 9 - SIGNATURES
    // ========================================================================
    yPos += 12;
    doc.setFont('times', 'bold');
    doc.setTextColor(17, 17, 17);
    doc.text('Le client', marginX + 10, yPos);
    doc.text('Le Directeur Financier', xEnd - 55, yPos);

    yPos += 27;
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);

    const dafTextWidth = doc.getTextWidth(dafName);
    const dafX = (xEnd - 55) + 27 - (dafTextWidth / 2);
    doc.text(dafName, dafX, yPos);

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const dafSubText = '(Directeur Administratif et Financier)';
    const dafSubWidth = doc.getTextWidth(dafSubText);
    const dafSubX = (xEnd - 55) + 27 - (dafSubWidth / 2);
    doc.text(dafSubText, dafSubX, yPos + 5);

    yPos += 15;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Reçu ce : ${dateStr}`, marginX, yPos);
    yPos += 5.5;

    const personneRecuValue = factureData.personne_recu || responsable || '________________________';
    doc.text(`Par : ${personneRecuValue}`, marginX, yPos);

    // ========================================================================
    // 10 - PIED DE PAGE
    // ========================================================================
    const footerY = 274;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(marginX, footerY, xEnd, footerY);

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text('Lot IIF 62, Fredy Rajaofera - Antaninandro - ANTANANARIVO - 101  |  Contacts : 034 05 533 88  |  mail: omda@moov.mg', pageWidth / 2, footerY + 4, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.text('Stat. N° 84212 11 2014 0 02912  •  NIF 4000 566 726', pageWidth / 2, footerY + 8, { align: 'center' });

    // ========================================================================
    // 11 - SORTIE
    // ========================================================================
    if (returnBlob) {
      console.log('📤 Retour du blob PDF (AVEC FRAIS)');
      return doc.output('blob');
    }

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `facture_${numFactureFormatted}_${refClientType}_${currentYear}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

    console.log('✅ Facture PDF générée avec succès (AVEC FRAIS)');
    return true;

  } catch (error) {
    console.error('❌ Erreur génération facture PDF (AVEC FRAIS):', error);
    throw error;
  }
};

export default generateFacturePDF;