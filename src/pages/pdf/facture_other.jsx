// src/pages/pdf/facture_other.jsx
import jsPDF from 'jspdf';
import logoRepoblika from '../../assets/repoblika.jpg';

// ============================================================
// HELPERS
// ============================================================
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0';
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

function numberToWords(num) {
  if (num === 0) return 'Zéro Ariary';
  if (num < 0) return 'Moins ' + numberToWords(Math.abs(num));
  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf'];
  const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-sept', 'Dix-huit', 'Dix-neuf'];
  const tens = ['', 'Dix', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-dix', 'Quatre-vingt', 'Quatre-vingt-dix'];

  function convert(n) {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const t = Math.floor(n / 10), u = n % 10;
      if (u === 0) return tens[t];
      if (t === 7) return 'Soixante-dix' + (u > 0 ? '-' + units[u] : '');
      if (t === 8) return 'Quatre-vingt' + (u > 0 ? '-' + units[u] : '');
      if (t === 9) return 'Quatre-vingt-dix' + (u > 0 ? '-' + units[u] : '');
      return tens[t] + '-' + units[u];
    }
    if (n < 1000) {
      const h = Math.floor(n / 100), r = n % 100;
      if (r === 0) return units[h] + ' Cent';
      return units[h] + ' Cent ' + convert(r);
    }
    if (n < 1000000) {
      const m = Math.floor(n / 1000), r = n % 1000;
      if (r === 0) return convert(m) + ' Mille';
      return convert(m) + ' Mille ' + convert(r);
    }
    if (n < 1000000000) {
      const m = Math.floor(n / 1000000), r = n % 1000000;
      if (r === 0) return convert(m) + ' Million';
      return convert(m) + ' Million ' + convert(r);
    }
    return 'Nombre trop grand';
  }

  const ariary = Math.floor(num);
  let result = convert(ariary);
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result + ' Ariary';
}

// ============================================================
// GÉNÉRATEUR PDF FACTURE OTHER
// ============================================================
export const generateFactureOtherPDF = async (factureData, returnBlob = false) => {
  try {
    console.log('========== GÉNÉRATION FACTURE OTHER PDF ==========');

    // ---------- Récupération DAF ----------
    let dafName = 'DAF';
    try {
      const response = await fetch('http://localhost:3001/api/daf/name');
      const data = await response.json();
      if (data.success && data.dafName) dafName = data.dafName;
    } catch { /* ignore */ }
    if (!dafName) dafName = 'DAF';

    // ---------- Création doc ----------
    const doc = new jsPDF({ unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const xEnd = pageWidth - marginX;
    let yPos = 8;

    // ============================================================
    // 1. LOGO + EN-TÊTE ADMINISTRATIF
    // ============================================================
    const logoWidth = 65, logoHeight = 20;
    doc.addImage(logoRepoblika, 'JPEG', (pageWidth / 2) - (logoWidth / 2), yPos, logoWidth, logoHeight);
    yPos += logoHeight + 6;

    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text('MINISTERE DE LA COMMUNICATION', marginX + 8, yPos);
    yPos += 4.5;
    doc.text('ET DE LA CULTURE', marginX + 20, yPos);
    yPos += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.text('********', marginX + 30, yPos);
    yPos += 4.5;
    doc.setFont('times', 'bold');
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
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const currentYear = currentDate.getFullYear().toString().slice(-2);

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(`Antananarivo, le ${dateStr}`, pageWidth - marginX, yPos, { align: 'right' });
    yPos += 5;
    const omdaWidth = doc.getTextWidth('OFFICE MALAGASY DU DROIT D\'AUTEUR ');
    doc.text('( OMDA )', marginX + (omdaWidth / 2), yPos, { align: 'center' });
    yPos += 12;

    // ============================================================
    // 2. RÉFÉRENCES
    // ============================================================
    const refOmda = factureData.ref_omda || '001';
    const numFacture = factureData.num_facture || refOmda;
    const refClientType = factureData.ref_client_type || 'OTH';
    const refUsager = factureData.ref_usager || '0';

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(`Réf : ${currentYear} / ${refOmda} / OMDA`, marginX, yPos);
    yPos += 8;

    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    const numFactureFormatted = String(numFacture).padStart(3, '0');
    let typeFactureLabel = factureData.type_facture || 'DAFC';
    if (typeFactureLabel !== 'DAFC' && typeFactureLabel !== 'SFL') typeFactureLabel = 'DAFC';
    const factureNum = `${currentYear} / ${numFactureFormatted} / ${typeFactureLabel}`;

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
    // 3. BOX CLIENT
    // ============================================================
    const boxWidth = pageWidth - (marginX * 2);
    const boxHeight = 40;
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.25);
    doc.rect(marginX, yPos, boxWidth, boxHeight, 'FD');

    const labelX = marginX + 5;
    const contentX = marginX + 50;
    let clientY = yPos + 7;
    doc.setFontSize(11);

    const nomClient = factureData.denomination || 'CLIENT';
    doc.setFont('times', 'bold');
    doc.text('Doit :', labelX, clientY);
    doc.text(nomClient, contentX, clientY);
    clientY += 6.5;

    const responsable = factureData.representant_nom || factureData.demandeur || 'Non spécifié';
    doc.text('Responsable :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(responsable, contentX, clientY);
    clientY += 6.5;

    const adresse = factureData.adresse || 'Adresse non spécifiée';
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

    doc.setFont('times', 'bold');
    doc.text('OBJET :', labelX, clientY);
    doc.text("Redevances d'auteur", contentX, clientY);

    yPos += boxHeight + 10;

    // ============================================================
    // 4. TABLEAU — CONFIGURATION AVEC PADDING
    // ============================================================
    const xDesc = marginX;
    const xU = 115;
    const xPu = 130;
    const xMnt = 155;

    // ✅ Padding vertical pour ne PAS toucher les lignes
    const ROW_HEIGHT = 8;          // hauteur standard d'une ligne
    const TEXT_OFFSET = 5.5;       // position du texte depuis le haut de la ligne
    const HEADER_HEIGHT = 9;       // hauteur de l'en-tête
    const TOTAL_HEIGHT = 9;        // hauteur de la ligne TOTAL

    // ---------- En-tête du tableau ----------
    const tableHeaderY = yPos;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text('( x 1 ariary )', xEnd - 3, tableHeaderY - 2, { align: 'right' });

    // Ligne haut du tableau
    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.3);
    doc.line(xDesc, tableHeaderY, xEnd, tableHeaderY);

    // Texte de l'en-tête
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 17, 17);
    doc.text('DESCRIPTIONS', xDesc + 3, tableHeaderY + TEXT_OFFSET);
    doc.text('U.', xU + 3, tableHeaderY + TEXT_OFFSET);
    doc.text('P.U. (Ar)', xPu + 3, tableHeaderY + TEXT_OFFSET);
    doc.text('MONTANT (Ar)', xEnd - 3, tableHeaderY + TEXT_OFFSET, { align: 'right' });

    // Ligne basse de l'en-tête
    const tableBodyStart = tableHeaderY + HEADER_HEIGHT;
    doc.line(xDesc, tableBodyStart, xEnd, tableBodyStart);

    // ============================================================
    // 5. LIGNES DU TABLEAU
    // ============================================================
    const lignes = factureData.lignes || [];
    let currentY = tableBodyStart;

    for (const ligne of lignes) {
      // Saut de page si nécessaire
      if (currentY > pageHeight - 80) {
        doc.addPage();
        currentY = 20;
      }

      const montantLigne = (parseFloat(ligne.pu) || 0) * (parseInt(ligne.uniter) || 1);

      doc.setFontSize(11);
      const maxWidthDesc = xU - xDesc - 8;
      const lines = doc.splitTextToSize(String(ligne.description || ''), maxWidthDesc);
      const rowHeight = Math.max(ROW_HEIGHT, lines.length * 6 + 2);

      // Texte centré verticalement dans la ligne
      const textY = currentY + (rowHeight / 2) + 1.5;

      // Description (multi-lignes si nécessaire)
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      for (let i = 0; i < lines.length; i++) {
        const lineY = currentY + TEXT_OFFSET + (i * 5.5);
        doc.text(lines[i], xDesc + 3, lineY);
      }

      // Colonnes U / PU / MONTANT alignées sur la 1ère ligne
      doc.text(String(ligne.uniter || 1), xU + 5, currentY + TEXT_OFFSET);
      doc.text(formatNumber(ligne.pu), xPu + 3, currentY + TEXT_OFFSET);
      doc.text(formatNumber(montantLigne), xEnd - 3, currentY + TEXT_OFFSET, { align: 'right' });

      // Avancer
      currentY += rowHeight;

      // Séparateur léger
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.15);
      doc.line(xDesc, currentY, xEnd, currentY);
    }

    // ============================================================
    // 6. FRAIS DE DOSSIER
    // ============================================================
    if (factureData.frais_dossier && parseFloat(factureData.frais_dossier) > 0) {
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text('Frais de dossier', xDesc + 3, currentY + TEXT_OFFSET);
      doc.text('1', xU + 5, currentY + TEXT_OFFSET);
      doc.text(formatNumber(factureData.frais_dossier), xPu + 3, currentY + TEXT_OFFSET);
      doc.text(formatNumber(factureData.frais_dossier), xEnd - 3, currentY + TEXT_OFFSET, { align: 'right' });

      currentY += ROW_HEIGHT;
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.15);
      doc.line(xDesc, currentY, xEnd, currentY);
    }

    // ============================================================
    // 7. PÉNALITÉ DE RETARD
    // ============================================================
    if (factureData.is_retard && factureData.montant_retard && parseFloat(factureData.montant_retard) > 0) {
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text('Pénalité de retard', xDesc + 3, currentY + TEXT_OFFSET);
      doc.text('1', xU + 5, currentY + TEXT_OFFSET);
      doc.text(formatNumber(factureData.montant_retard), xPu + 3, currentY + TEXT_OFFSET);
      doc.text(formatNumber(factureData.montant_retard), xEnd - 3, currentY + TEXT_OFFSET, { align: 'right' });

      currentY += ROW_HEIGHT;
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.15);
      doc.line(xDesc, currentY, xEnd, currentY);
    }

    // ============================================================
    // 8. LIGNE TOTAL
    // ============================================================
    const totalValue = parseFloat(factureData.soit_total) || 0;

    // Case grise pour le montant
    doc.setFillColor(248, 248, 248);
    doc.rect(xMnt, currentY, xEnd - xMnt, TOTAL_HEIGHT, 'FD');
    // Case blanche pour le libellé
    doc.rect(xDesc, currentY, xMnt - xDesc, TOTAL_HEIGHT, 'D');

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text('TOTAL', xDesc + 3, currentY + 6.5);
    doc.text(formatNumber(totalValue), xEnd - 3, currentY + 6.5, { align: 'right' });

    // ============================================================
    // 9. LIGNES VERTICALES DU TABLEAU (tracées en UNE FOIS)
    // ============================================================
    const tableStart = tableHeaderY;
    const tableEnd = currentY + TOTAL_HEIGHT;

    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.3);
    doc.line(xDesc, tableStart, xDesc, tableEnd);   // gauche
    doc.line(xU, tableStart, xU, tableEnd);
    doc.line(xPu, tableStart, xPu, tableEnd);
    doc.line(xMnt, tableStart, xMnt, tableEnd);
    doc.line(xEnd, tableStart, xEnd, tableEnd);     // droite
    doc.line(xDesc, tableEnd, xEnd, tableEnd);      // bas

    yPos = tableEnd + 10;

    // ============================================================
    // 10. SOMME EN LETTRES
    // ============================================================
    doc.setTextColor(17, 17, 17);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('Arrêtée la présente facture à la somme de : ', marginX, yPos);
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    const phraseWidth = doc.getTextWidth('Arrêtée la présente facture à la somme de : ');
    doc.text(numberToWords(totalValue), marginX + phraseWidth + 3, yPos);

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(marginX, yPos, xEnd, yPos);

    // ============================================================
    // 11. SIGNATURES
    // ============================================================
    yPos += 13;
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text('Le client', marginX + 10, yPos);
    doc.text('Le Directeur Financier', xEnd - 55, yPos);

    yPos += 28;
    const dafTextWidth = doc.getTextWidth(dafName);
    const dafX = (xEnd - 55) + 27 - (dafTextWidth / 2) - 10;
    doc.text(dafName, dafX, yPos);

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const dafSubText = '(Directeur Administratif et Financier)';
    const dafSubWidth = doc.getTextWidth(dafSubText);
    doc.text(dafSubText, (xEnd - 55) + 27 - (dafSubWidth / 2) - 10, yPos + 5);

    // ============================================================
    // 12. REÇU CE / PAR (SANS QUITTANCE)
    // ============================================================
    yPos += 10;
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Reçu ce : ${dateStr}`, marginX, yPos);
    yPos += 6;
    const personneRecuValue = factureData.personne_recu || '________________________';
    doc.text(`Par : ${personneRecuValue}`, marginX, yPos);

    // ============================================================
    // 13. PIED DE PAGE
    // ============================================================
    const footerY = pageHeight - 22;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(marginX, footerY, xEnd, footerY);

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(
      'Lot IIF 62, Fredy Rajaofera - Antaninandro - ANTANANARIVO - 101  |  Contacts : 034 05 533 88  |  mail: omda@moov.mg',
      pageWidth / 2, footerY + 5, { align: 'center' }
    );
    doc.setFont('times', 'bold');
    doc.text(
      'Stat. N° 84212 11 2014 0 02912  •  NIF 4000 566 726',
      pageWidth / 2, footerY + 9, { align: 'center' }
    );

    // ============================================================
    // 14. SORTIE
    // ============================================================
    if (returnBlob) return doc.output('blob');

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `facture_other_${numFactureFormatted}_${refClientType}_${currentYear}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

    return true;
  } catch (error) {
    console.error('❌ Erreur génération facture other PDF:', error);
    throw error;
  }
};

export default generateFactureOtherPDF;