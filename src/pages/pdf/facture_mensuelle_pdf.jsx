// src/pages/pdf/facture_mensuelle_pdf.jsx
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Fonction pour formater le numéro de quittance sur 7 chiffres
const formatQuittance = (num) => {
  if (!num) return '0000000';
  const str = String(num).replace(/\D/g, '');
  return str.padStart(7, '0');
};

// Fonction principale de génération de PDF pour facture mensuelle (sans frais de dossier)
export const generateFactureMensuellePDF = (facture, showPreview = false) => {
  try {
    if (!facture) {
      console.error('❌ Aucune facture fournie');
      return false;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Marges
    const margin = 20;
    let y = margin;

    // ========== EN-TÊTE ==========
    // Logo OMDA (simulé avec du texte)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('OMDA', margin, y);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 117, 125);
    doc.text('Office Malagasy des Droits d\'Auteur', margin, y + 6);
    
    // Adresse
    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(108, 117, 125);
    doc.text('Antananarivo, Madagascar', margin, y);
    doc.text('Tél: +261 34 00 000 00', margin, y + 4);
    doc.text('Email: contact@omda.mg', margin, y + 8);
    
    y += 14;

    // Ligne séparatrice
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // ========== RÉFÉRENCES ==========
    const refOmda = facture.ref_omda || '0000';
    const numFacture = facture.num_facture || '0000';
    const refClient = facture.ref_client_type || 'HTL';
    
    // Formatage du numéro de facture avec suffixe si présent
    let numFactureDisplay = numFacture;
    if (facture.num_facture_type === 'B' && facture.suffixe) {
      numFactureDisplay = `${numFacture}-${facture.suffixe}`;
    }
    
    // Référence client
    const refClientDisplay = facture.ref_client_type 
      ? `${facture.ref_client_type} / ${String(facture.ref_usager || 0).padStart(3, '0')}`
      : `${refClient} / 000`;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    
    const rightMargin = pageWidth - margin;
    const refText = `Réf : ${String(refOmda).padStart(4, '0')} / ${numFactureDisplay} / OMDA`;
    doc.text(refText, rightMargin - doc.getTextWidth(refText), y);

    y += 6;
    
    const factureText = `FACTURE n° ${String(refOmda).padStart(4, '0')} / ${numFactureDisplay} / DAFC`;
    doc.text(factureText, rightMargin - doc.getTextWidth(factureText), y);

    y += 6;
    
    const clientText = `Réf. Client : ${refClientDisplay}`;
    doc.text(clientText, rightMargin - doc.getTextWidth(clientText), y);

    y += 10;

    // ========== INFORMATIONS FACTURE ==========
    // Description personnalisée
    const description = facture.description_personnalisee || 'Renouvellement';
    
    // Mois concernés
    let moisText = '';
    const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    if (facture.mois_groupes) {
      const moisList = facture.mois_groupes.split(',').map(Number);
      const moisNoms = moisList.map(m => moisLabels[m - 1]);
      moisText = moisNoms.join(', ');
    } else if (facture.mois_facture) {
      moisText = moisLabels[facture.mois_facture - 1];
    }
    
    const anneeText = facture.annee_facture || new Date().getFullYear();

    // Date de paiement
    const datePaiement = facture.a_compter_du 
      ? new Date(facture.a_compter_du).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    const infoLines = [
      { label: 'Description', value: description },
      { label: 'Période', value: `${moisText} ${anneeText}` },
      { label: 'Date de paiement', value: datePaiement },
      { label: 'Quittance', value: formatQuittance(facture.quittance) }
    ];

    for (const info of infoLines) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${info.label} :`, margin, y);
      doc.setFont('helvetica', 'normal');
      const x = margin + 45;
      doc.text(info.value, x, y);
      y += 6;
    }

    y += 4;

    // ========== TABLEAU DES MONTANTS ==========
    // Sans frais de dossier
    const montantMensuel = parseFloat(facture.montant_mensuel) || 0;
    const uniter = parseInt(facture.uniter) || 1;
    const montantRetard = parseFloat(facture.montant_retard) || 0;
    const isRetard = facture.is_retard || false;
    
    let nombreMois = 1;
    if (facture.mois_groupes) {
      nombreMois = facture.mois_groupes.split(',').length;
    }
    
    const sousTotal = montantMensuel * uniter * nombreMois;
    const total = sousTotal + (isRetard ? montantRetard : 0);

    // Tableau
    const tableData = [
      ['Désignation', 'Quantité', 'PU (Ar)', 'Total (Ar)'],
      [
        `Mensualité ${description}`,
        `${nombreMois} mois`,
        (montantMensuel * uniter).toLocaleString('fr-FR'),
        sousTotal.toLocaleString('fr-FR')
      ]
    ];

    // Ajouter ligne de retard si applicable
    if (isRetard && montantRetard > 0) {
      tableData.push([
        'Pénalité de retard',
        '1',
        montantRetard.toLocaleString('fr-FR'),
        montantRetard.toLocaleString('fr-FR')
      ]);
    }

    doc.autoTable({
      startY: y,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [40, 167, 69],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 80, halign: 'left' },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 }
      },
      margin: { left: margin, right: margin }
    });

    // Récupérer la position y après le tableau
    y = doc.lastAutoTable.finalY + 8;

    // ========== TOTAL ==========
    doc.setDrawColor(40, 167, 69);
    doc.setFillColor(40, 167, 69);
    doc.rect(margin + 120, y - 2, pageWidth - margin - 120 - margin, 10, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL À PAYER', margin + 125, y + 6);
    
    doc.setFontSize(12);
    doc.text(`${total.toLocaleString('fr-FR')} Ar`, pageWidth - margin - 10 - doc.getTextWidth(`${total.toLocaleString('fr-FR')} Ar`), y + 6);

    y += 14;

    // ========== DÉTAIL ==========
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    let detailText = `Détail : ${montantMensuel.toLocaleString('fr-FR')} Ar × ${uniter} × ${nombreMois} mois`;
    if (isRetard && montantRetard > 0) {
      detailText += ` + ${montantRetard.toLocaleString('fr-FR')} Ar (retard)`;
    }
    doc.text(detailText, margin, y);
    
    y += 6;
    doc.text('Net à payer :', margin, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total.toLocaleString('fr-FR')} Ar`, margin + 40, y);
    doc.setFont('helvetica', 'normal');

    y += 10;

    // ========== PIED DE PAGE ==========
    const dafName = facture.daf_nom || 'Directeur Financier';
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    doc.text('Signature du client :', margin, y);
    doc.text('_________________________', margin, y + 6);
    
    doc.text('Signature du DAF :', pageWidth - margin - 50, y);
    doc.text('_________________________', pageWidth - margin - 50, y + 6);
    
    doc.text(dafName, pageWidth - margin - 50 - doc.getTextWidth(dafName) / 2, y + 12);

    y += 20;

    // ========== MENTIONS LÉGALES ==========
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text('Merci de votre confiance. Paiement à effectuer sous 30 jours.', margin, pageHeight - 15);
    doc.text('Toute contestation doit être formulée par écrit dans les 15 jours suivant la réception de la facture.', margin, pageHeight - 10);

    // ========== OUVRIR LE PDF ==========
    if (showPreview) {
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      const filename = `Facture_${facture.num_facture || '0000'}_${facture.ref_client_type || 'HTL'}.pdf`;
      doc.save(filename);
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur génération PDF mensuel:', error);
    return false;
  }
};

export default generateFactureMensuellePDF;