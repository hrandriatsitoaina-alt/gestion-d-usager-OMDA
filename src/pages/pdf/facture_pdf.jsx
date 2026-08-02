// src/pages/pdf/facture_pdf.jsx
import jsPDF from 'jspdf';
import { formatDate, formatNumber, getCurrentDate } from './occ_pdf';
import logoRepoblika from '../../assets/repoblika.jpg';

export const generateFacturePDF = (usager, paymentDetails, type, returnBlob = false) => {
  try {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 20;
    let yPos = 8;
    
    // =========================================================================
    // 1 - LOGO CENTRAL
    // =========================================================================
    const logoWidth = 65;
    const logoHeight = 20;
    doc.addImage(logoRepoblika, 'JPEG', (pageWidth / 2) - (logoWidth / 2), yPos, logoWidth, logoHeight);
    yPos += logoHeight + 6;

    // =========================================================================
    // 2 - BLOC EN-TÊTE ADMINISTRATIF
    // =========================================================================
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
    doc.text('OFFICE MALAGASY DU DROIT D’AUTEUR', marginX, yPos);
    
    // Date dynamique
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text(`Antananarivo, le ${dateStr}`, pageWidth - marginX, yPos, { align: 'right' });
    
    // Centrage de ( OMDA )
    yPos += 5;
    doc.setFont('times', 'bold');
    const textOmda = '( OMDA )';
    const omdaWidth = doc.getTextWidth('OFFICE MALAGASY DU DROIT D’AUTEUR');
    const centerOmdaX = marginX + (omdaWidth / 2);
    doc.text(textOmda, centerOmdaX, yPos, { align: 'center' });
    
    yPos += 12;
    
    // Référence dynamique
    const year = currentDate.getFullYear();
    const refNumber = Math.floor(Math.random() * 900 + 100);
    const refDafc = Math.floor(Math.random() * 900 + 100);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Réf : ${year} / ${refNumber} / OMDA`, marginX, yPos);
    
    // =========================================================================
    // 3 - BLOC TITRE DE LA FACTURE
    // =========================================================================
    yPos += 8;
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    const factureNum = `${year} / ${refDafc} / DAFC`;
    doc.text(`FACTURE n°${factureNum}`, marginX, yPos + 4.5);
    
    yPos += 5.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const clientRef = usager.numero_dossier_utilisateur || `CLT/${year}/${refNumber}`;
    doc.text(`Réf. Client : ${clientRef}`, marginX, yPos + 4);
    
    doc.setTextColor(17, 17, 17);
    yPos += 14;

    // =========================================================================
    // 4 - BLOC COMPTE CLIENT (DONNÉES DYNAMIQUES)
    // =========================================================================
    const boxWidth = pageWidth - (marginX * 2);
    const boxHeight = 34;
    
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.25);
    doc.rect(marginX, yPos, boxWidth, boxHeight, 'FD');
    
    const labelX = marginX + 5;
    const contentX = marginX + 45;
    let clientY = yPos + 6;

    // Nom / Dénomination
    const nomClient = usager.denomination || usager.demandeur || usager.nom_evenement || 'CLIENT';
    doc.setFont('times', 'bold');
    doc.text('Doit :', labelX, clientY);
    doc.setFont('times', 'bold');
    doc.text(nomClient, contentX, clientY);
    clientY += 6;

    // Responsable
    const responsable = usager.responsable || usager.demandeur || 'Non spécifié';
    doc.setFont('times', 'bold');
    doc.text('Nom du Responsable :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(responsable, contentX, clientY);
    clientY += 6;

    // Adresse
    const adresse = usager.adresse || usager.adresse_siege || usager.ville || 'Adresse non spécifiée';
    doc.setFont('times', 'bold');
    doc.text('Adresse :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(adresse, contentX, clientY);
    clientY += 6;

    // Contact
    const contact = usager.telephone || 'Non spécifié';
    doc.setFont('times', 'bold');
    doc.text('Contact :', labelX, clientY);
    doc.setFont('times', 'normal');
    doc.text(contact, contentX, clientY);
    clientY += 6;

    // Objet
    const objet = usager.nom_evenement || usager.type || "Redevances d'auteur";
    doc.setFont('times', 'bold');
    doc.text('OBJET :', labelX, clientY);
    doc.setFont('times', 'bold');
    doc.text(objet, contentX, clientY);
    
    yPos += boxHeight + 8;

    // =========================================================================
    // 5 - TABLEAU DES MONTANTS
    // =========================================================================
    const xDesc = marginX;       
    const xU    = 115;           
    const xPu   = 127;           
    const xMnt  = 152;           
    const xEnd  = pageWidth - marginX; 

    yPos += 8;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text('( x 1 ariary )', xEnd - 3, yPos - 6, { align: 'right' });

    // Dessin de la ligne supérieure
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

    // ---------------- LIGNE 1 : SPECTACLE / SERVICE ----------------
    yPos += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    
    // Description
    const description = usager.nom_evenement || usager.type || 'Prestation OMDA';
    doc.text(description, xDesc + 3, yPos);
    
    // Quantité
    const quantite = usager.nombre_mois || 1;
    doc.text(String(quantite), xU + 5, yPos);
    
    // Prix unitaire
    const prixUnitaire = usager.montant_mensuel || usager.montant_total || 500000;
    const montantTotal = (usager.montant_mensuel || usager.montant_total || 500000) * quantite;
    doc.text(formatNumber(prixUnitaire), xPu + 3, yPos);
    doc.text(formatNumber(montantTotal), xEnd - 3, yPos, { align: 'right' });
    
    // Détails supplémentaires
    yPos += 5;
    if (usager.artistes) {
      doc.text(`Artistes: ${usager.artistes}`, xDesc + 3, yPos);
      yPos += 5;
    }
    if (usager.lieu_evenement) {
      doc.text(`Lieu: ${usager.lieu_evenement}`, xDesc + 3, yPos);
      yPos += 5;
    }
    if (usager.date_evenement) {
      const eventDate = new Date(usager.date_evenement).toLocaleDateString('fr-FR');
      doc.text(`Date: ${eventDate}`, xDesc + 3, yPos);
      yPos += 5;
    }
    
    // Ligne intermédiaire
    yPos += 4;
    doc.setDrawColor(235, 235, 235);
    doc.line(xDesc, yPos, xEnd, yPos);

    // ---------------- LIGNE 2 : FRAIS DE DOSSIER ----------------
    yPos += 6;
    doc.setDrawColor(26, 26, 26);
    doc.text('Frais de dossier', xDesc + 3, yPos);
    doc.text('1', xU + 5, yPos);
    doc.text('5 000', xPu + 3, yPos);
    doc.text('5 000', xEnd - 3, yPos, { align: 'right' });
    
    yPos += 4;

    // ---------------- TRACÉ DES BORDURES ----------------
    doc.line(xDesc, yPos, xEnd, yPos);
    doc.line(xDesc, tableStartHeight, xDesc, yPos); 
    doc.line(xU, tableStartHeight, xU, yPos);       
    doc.line(xPu, tableStartHeight, xPu, yPos);     
    doc.line(xMnt, tableStartHeight, xMnt, yPos);   
    doc.line(xEnd, tableStartHeight, xEnd, yPos);   
    
    // =========================================================================
    // 6 - ZONE DU TOTAL
    // =========================================================================
    const totalGeneral = montantTotal + 5000;
    doc.setFillColor(248, 248, 248);
    doc.rect(xMnt, yPos, xEnd - xMnt, 8, 'FD');
    doc.rect(xDesc, yPos, xMnt - xDesc, 8, 'D'); 
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text('TOTAL', xDesc + 3, yPos + 5.5);
    doc.text(formatNumber(totalGeneral), xEnd - 3, yPos + 5.5, { align: 'right' });
    
    // =========================================================================
    // 7 - SOMME ARRÊTÉE EN LETTRES
    // =========================================================================
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
    
    // =========================================================================
    // 8 - ZONE DES SIGNATURES
    // =========================================================================
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

    // =========================================================================
    // 9 - PIED DE PAGE FIXE
    // =========================================================================
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
    
    doc.save('facture_omda_officielle.pdf');
    return true;

  } catch (error) {
    console.error('Erreur génération facture PDF:', error);
    throw error;
  }
};

// Fonction pour convertir un nombre en lettres (simple)
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