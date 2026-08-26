// src/pages/pdf/facture_pdf.jsx
import jsPDF from 'jspdf';
import { formatNumber } from './occ_pdf';
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
    // ✅ Récupérer le nom du DAF depuis l'API si non présent
    let dafName = factureData.daf_nom || 'Directeur Financier';
    
    // ✅ Si le nom est "Directeur Financier" ou vide, on va chercher dans l'API
    if (!factureData.daf_nom || factureData.daf_nom === 'Directeur Financier' || factureData.daf_nom === '') {
      try {
        console.log('🔍 Récupération du DAF depuis l\'API...');
        const response = await fetch('http://localhost:3001/api/daf/name');
        const data = await response.json();
        if (data.success && data.dafName) {
          dafName = data.dafName;
          console.log('✅ DAF récupéré depuis l\'API:', dafName);
        } else {
          console.warn('⚠️ Aucun DAF trouvé dans l\'API, utilisation du fallback');
          // ✅ Fallback: utiliser le nom "DAF" si disponible
          dafName = 'DAF';
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer le DAF, utilisation du fallback');
        dafName = 'DAF';
      }
    }

    // ✅ Vérifier que dafName n'est pas vide
    if (!dafName || dafName === '' || dafName === 'Directeur Financier') {
      dafName = 'DAF';
    }

    console.log('📝 Nom du DAF utilisé pour la facture:', dafName);

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
    doc.addImage(logoRepoblika, 'JPEG', (pageWidth / 2) - (logoWidth / 2), yPos, logoWidth, logoHeight);
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
    doc.text(`FACTURE n° ${factureNum}`, marginX, yPos + 4.5);
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

    const nomClient = factureData.denomination || factureData.demandeur || 'CLIENT';
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
    // 5 - TABLEAU
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

    const montantMensuel = parseFloat(factureData.montant_mensuel) || 0;
    const fraisDossier = parseFloat(factureData.frais_dossier) || 0;
    const uniter = parseInt(factureData.uniter) || 1;
    const montantRetard = parseFloat(factureData.montant_retard) || 0;
    const isRetard = factureData.is_retard || false;
    
    const baseTotal = (montantMensuel * uniter) + fraisDossier;
    const totalGeneral = isRetard ? baseTotal + montantRetard : baseTotal;

    yPos += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    
    let descLine = factureData.type_facture || 'Prestation OMDA';
    
    if (factureData.artistes) {
      descLine += ` avec ${factureData.artistes}`;
    }
    
    if (factureData.date_evenement) {
      const eventDate = new Date(factureData.date_evenement).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      descLine += ` le ${eventDate}`;
    }
    
    if (factureData.lieu_evenement) {
      descLine += ` au ${factureData.lieu_evenement}`;
    }
    
    doc.text(descLine, xDesc + 3, yPos);
    doc.text(String(uniter), xU + 5, yPos);
    doc.text(formatNumber(montantMensuel), xPu + 3, yPos);
    doc.text(formatNumber(montantMensuel * uniter), xEnd - 3, yPos, { align: 'right' });
    
    let subY = yPos + 5;
    if (factureData.organisateurs) {
      doc.text(`Organisateurs: ${factureData.organisateurs}`, xDesc + 3, subY);
      subY += 5;
    }
    if (factureData.genre_manifestation) {
      doc.text(`Genre: ${factureData.genre_manifestation}`, xDesc + 3, subY);
      subY += 5;
    }
    
    yPos = subY;
    yPos += 4;
    doc.setDrawColor(235, 235, 235);
    doc.line(xDesc, yPos, xEnd, yPos);

    yPos += 6;
    doc.setDrawColor(26, 26, 26);
    doc.text('Frais de dossier', xDesc + 3, yPos);
    doc.text('1', xU + 5, yPos);
    doc.text(formatNumber(fraisDossier), xPu + 3, yPos);
    doc.text(formatNumber(fraisDossier), xEnd - 3, yPos, { align: 'right' });
    yPos += 4;

    if (isRetard && montantRetard > 0) {
      yPos += 6;
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
    
    // ========================================================================
    // 6 - TOTAL
    // ========================================================================
    doc.setFillColor(248, 248, 248);
    doc.rect(xMnt, yPos, xEnd - xMnt, 8, 'FD');
    doc.rect(xDesc, yPos, xMnt - xDesc, 8, 'D');
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text('TOTAL', xDesc + 3, yPos + 5.5);
    doc.text(formatNumber(totalGeneral), xEnd - 3, yPos + 5.5, { align: 'right' });
    
    // ========================================================================
    // 7 - SOMME EN LETTRES
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
    const montantLettres = numberToWords(totalGeneral);
    doc.text(montantLettres, marginX + phraseWidth + 5, yPos);
    
    yPos += 4;
    doc.line(marginX, yPos, xEnd, yPos);
    
    // ========================================================================
    // 8 - SIGNATURES AVEC NOM DYNAMIQUE DU DAF
    // ========================================================================
    yPos += 12;
    doc.setFont('times', 'bold');
    doc.setTextColor(17, 17, 17);
    doc.text('Le client', marginX + 10, yPos);
    doc.text('Le Directeur Financier', xEnd - 55, yPos);
    
    yPos += 27;
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    
    // ✅ Afficher le nom du DAF correctement
    doc.text(dafName, xEnd - 5, yPos);

    yPos += 8;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Reçu ce : ${dateStr}`, marginX, yPos);
    yPos += 5.5;
    
    const personneRecuValue = factureData.personne_recu || responsable || '________________________';
    doc.text(`Par : ${personneRecuValue}`, marginX, yPos);

    // ========================================================================
    // 9 - PIED DE PAGE
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
    // 10 - SORTIE
    // ========================================================================
    if (returnBlob) {
      return doc.output('blob');
    }
    
    doc.save(`facture_${numFactureFormatted}_${refClientType}.pdf`);
    return true;

  } catch (error) {
    console.error('Erreur génération facture PDF:', error);
    throw error;
  }
};