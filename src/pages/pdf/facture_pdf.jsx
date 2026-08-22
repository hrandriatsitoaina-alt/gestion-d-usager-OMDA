// src/pages/pdf/facture_pdf.jsx (version améliorée)
import jsPDF from 'jspdf';
import { formatDate, formatNumber, getCurrentDate } from './occ_pdf';
import logoRepoblika from '../../assets/repoblika.jpg';

// Fonction pour convertir un nombre en lettres
function numberToWords(num) {
  if (num === 0) return 'Zéro Ariary';
  
  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf'];
  const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-sept', 'Dix-huit', 'Dix-neuf'];
  const tens = ['', 'Dix', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-dix', 'Quatre-vingt', 'Quatre-vingt-dix'];
  
  function convertToWords(n) {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (unit === 0) return tens[ten];
      if (ten === 7 || ten === 9) {
        return tens[ten] + '-' + units[unit];
      }
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
    return 'Nombre trop grand';
  }
  
  const ariary = Math.floor(num);
  const centimes = Math.round((num - ariary) * 100);
  
  let result = convertToWords(ariary) + ' Ariary';
  if (centimes > 0) {
    result += ' et ' + convertToWords(centimes) + ' Centimes';
  }
  
  return result;
}

export const generateFacturePDF = (factureData, returnBlob = false) => {
  try {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 20;
    let yPos = 8;
    
    // 1 - LOGO
    const logoWidth = 65;
    const logoHeight = 20;
    doc.addImage(logoRepoblika, 'JPEG', (pageWidth / 2) - (logoWidth / 2), yPos, logoWidth, logoHeight);
    yPos += logoHeight + 6;

    // 2 - EN-TÊTE
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
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text(`Antananarivo, le ${dateStr}`, pageWidth - marginX, yPos, { align: 'right' });
    
    yPos += 5;
    doc.setFont('times', 'bold');
    const omdaWidth = doc.getTextWidth('OFFICE MALAGASY DU DROIT D\'AUTEUR');
    doc.text('( OMDA )', marginX + (omdaWidth / 2), yPos, { align: 'center' });
    yPos += 12;
    
    // Référence
    const refOmda = factureData.ref_omda || '001';
    const numFacture = factureData.num_facture || refOmda;
    const refClientType = factureData.ref_client_type || 'AUT';
    const refUsager = factureData.ref_usager || '0';
    
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Réf : ${refOmda} / OMDA`, marginX, yPos);
    yPos += 8;
    
    // Titre facture
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    const factureNum = `${numFacture} / ${refClientType} / ${refUsager}`;
    doc.text(`FACTURE N° ${factureNum}`, marginX, yPos + 4.5);
    yPos += 5.5;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const clientRef = factureData.numero_dossier_utilisateur || `CLT/${refUsager}`;
    doc.text(`Réf. Client : ${clientRef}`, marginX, yPos + 4);
    doc.setTextColor(17, 17, 17);
    yPos += 14;

    // 3 - BLOC CLIENT
    const boxWidth = pageWidth - (marginX * 2);
    const boxHeight = 34;
    
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.25);
    doc.rect(marginX, yPos, boxWidth, boxHeight, 'FD');
    
    const labelX = marginX + 5;
    const contentX = marginX + 45;
    let clientY = yPos + 6;

    const nomClient = factureData.denomination || factureData.demandeur || 'CLIENT';
    doc.setFont('times', 'bold');
    doc.text('Doit :', labelX, clientY);
    doc.setFont('times', 'bold');
    doc.text(nomClient, contentX, clientY);
    clientY += 6;

    const responsable = factureData.demandeur || factureData.representant_nom || 'Non spécifié';
    doc.setFont('times', 'bold');
    doc.text('Responsable :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(responsable, contentX, clientY);
    clientY += 6;

    const adresse = factureData.adresse || factureData.siege || 'Adresse non spécifiée';
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

    const typeFacture = factureData.type_facture || 'Redevances';
    doc.setFont('times', 'bold');
    doc.text('OBJET :', labelX, clientY);
    doc.setFont('times', 'bold');
    doc.text(typeFacture, contentX, clientY);
    
    yPos += boxHeight + 8;

    // 4 - TABLEAU
    const xDesc = marginX;
    const xU = 115;
    const xPu = 127;
    const xEnd = pageWidth - marginX;

    yPos += 8;
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

    // Ligne 1
    yPos += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    
    const description = factureData.type_facture || 'Prestation OMDA';
    doc.text(description, xDesc + 3, yPos);
    
    const quantite = 1;
    doc.text(String(quantite), xU + 5, yPos);
    
    const montantMensuel = parseFloat(factureData.montant_mensuel) || 0;
    const fraisDossier = parseFloat(factureData.frais_dossier) || 0;
    const uniter = parseInt(factureData.uniter) || 1;
    const montantRetard = parseFloat(factureData.montant_retard) || 0;
    const isRetard = factureData.is_retard || false;
    
    const baseTotal = (montantMensuel + fraisDossier) * uniter;
    const totalGeneral = isRetard ? baseTotal + montantRetard : baseTotal;
    
    doc.text(formatNumber(baseTotal), xPu + 3, yPos);
    doc.text(formatNumber(baseTotal), xEnd - 3, yPos, { align: 'right' });
    
    yPos += 5;
    if (factureData.artistes) {
      doc.text(`Artistes: ${factureData.artistes}`, xDesc + 3, yPos);
      yPos += 5;
    }
    if (factureData.lieu_evenement) {
      doc.text(`Lieu: ${factureData.lieu_evenement}`, xDesc + 3, yPos);
      yPos += 5;
    }
    if (factureData.date_evenement) {
      const eventDate = new Date(factureData.date_evenement).toLocaleDateString('fr-FR');
      doc.text(`Date: ${eventDate}`, xDesc + 3, yPos);
      yPos += 5;
    }
    
    yPos += 4;
    doc.setDrawColor(235, 235, 235);
    doc.line(xDesc, yPos, xEnd, yPos);

    // Ligne 2 - Frais de dossier
    yPos += 6;
    doc.setDrawColor(26, 26, 26);
    doc.text('Frais de dossier', xDesc + 3, yPos);
    doc.text(String(uniter), xU + 5, yPos);
    doc.text(formatNumber(fraisDossier), xPu + 3, yPos);
    doc.text(formatNumber(fraisDossier * uniter), xEnd - 3, yPos, { align: 'right' });
    
    yPos += 4;

    // Ligne 3 - Retard (si présent)
    if (isRetard && montantRetard > 0) {
      yPos += 6;
      doc.text('Pénalité de retard', xDesc + 3, yPos);
      doc.text('1', xU + 5, yPos);
      doc.text(formatNumber(montantRetard), xPu + 3, yPos);
      doc.text(formatNumber(montantRetard), xEnd - 3, yPos, { align: 'right' });
      yPos += 4;
    }

    // Bordure
    doc.line(xDesc, yPos, xEnd, yPos);
    doc.line(xDesc, tableStartHeight, xDesc, yPos);
    doc.line(xU, tableStartHeight, xU, yPos);
    doc.line(xPu, tableStartHeight, xPu, yPos);
    doc.line(xEnd, tableStartHeight, xEnd, yPos);
    
    // TOTAL
    doc.setFillColor(248, 248, 248);
    const totalX = xPu;
    doc.rect(totalX, yPos, xEnd - totalX, 8, 'FD');
    doc.rect(xDesc, yPos, totalX - xDesc, 8, 'D');
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text('TOTAL', xDesc + 3, yPos + 5.5);
    doc.text(formatNumber(totalGeneral), xEnd - 3, yPos + 5.5, { align: 'right' });
    
    // 5 - SOMME EN LETTRES
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
    const montantLettres = numberToWords(totalGeneral);
    doc.text(montantLettres, marginX + phraseWidth, yPos);
    
    yPos += 4;
    doc.line(marginX, yPos, xEnd, yPos);
    
    // 6 - SIGNATURES
    yPos += 12;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Reçu ce : ${dateStr}`, marginX, yPos);
    yPos += 5.5;
    doc.text(`Par : ${responsable}`, marginX, yPos);
    
    yPos += 8;
    doc.setFont('times', 'bold');
    doc.setTextColor(17, 17, 17);
    doc.text('Le client', marginX + 10, yPos);
    doc.text('Le Directeur Financier', xEnd - 55, yPos);
    
    yPos += 25;
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    const directorName = 'RAKOTONIAINA Volana Larissa';
    doc.text(directorName, xEnd - 60, yPos);

    // 7 - PIED DE PAGE
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

    if (returnBlob) {
      return doc.output('blob');
    }
    
    doc.save(`facture_${numFacture}_${refClientType}.pdf`);
    return true;

  } catch (error) {
    console.error('Erreur génération facture PDF:', error);
    throw error;
  }
};