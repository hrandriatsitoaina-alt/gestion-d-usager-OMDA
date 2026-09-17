import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un PDF de suivi des quittances - 1 PAGE UNIQUEMENT
 * Style simple et épuré - Orientation PORTRAIT
 */
export const generateQuitancePDF = (quittances, options = {}) => {
  if (!quittances || quittances.length === 0) {
    console.warn('⚠️ Aucune quittance à générer');
    return false;
  }

  try {
    console.log('📄 Début génération PDF...');
    console.log('📊 Nombre de quittances:', quittances.length);

    const {
      carnetDebut = '0000000',
      carnetFin = '0000000',
      responsable = '',
      lieu = 'Antananarivo',
      region = 'Toutes les régions',
      dateDelivre = new Date().toLocaleDateString('fr-FR'),
      dateRetour = ''
    } = options;

    // ============================================================
    // ✅ FONCTIONS DE NETTOYAGE / FORMATAGE DES MONTANTS
    // ============================================================

    // Nettoie une valeur brute (string avec "/", nombre, etc.) en nombre entier propre
    const nettoyerMontant = (valeur) => {
      if (!valeur && valeur !== 0) return 0;
      if (typeof valeur === 'string') {
        // Supprime tout ce qui n'est pas un chiffre, un point ou un signe moins
        const nettoye = valeur.replace(/[^\d.-]/g, '');
        const nombre = parseFloat(nettoye);
        return isNaN(nombre) ? 0 : Math.round(nombre);
      }
      return Math.round(Number(valeur)) || 0;
    };

    // ✅ Formate un nombre en "1 234 567" avec une VRAIE espace normale
    // (jamais toLocaleString('fr-FR') car il utilise une espace insécable fine
    // que la police helvetica de jsPDF affiche comme "/" ou caractère cassé)
    const formatMontant = (valeur) => {
      const nombre = nettoyerMontant(valeur);
      // Formatage manuel : on groupe les chiffres par 3 en partant de la droite
      return String(nombre).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    // Créer le document en PORTRAIT
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let y = margin;

    // ============================================================
    // EN-TÊTE - 5 LIGNES SIMPLES - POLICE 12
    // ============================================================

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('SUIVI QUITANCE', pageWidth / 2, y, { align: 'center' });
    y += 9;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`N° de carnet : ${carnetDebut} à ${carnetFin}`, margin, y);

    const responsableText = `Responsable : ${responsable || '_______________'}`;
    doc.text(responsableText, pageWidth - margin - doc.getTextWidth(responsableText), y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Lieu de l'agence du Représentant : ${lieu || '_______________'}`, margin, y);
    y += 8;

    doc.text(`Date de délivrance : ${dateDelivre}`, margin, y);

    const dateRetourText = `Date de retour : ${dateRetour || '_______________'}`;
    doc.text(dateRetourText, pageWidth - margin - doc.getTextWidth(dateRetourText), y);
    y += 10;

    // ============================================================
    // TABLEAU - POLICE 11
    // ============================================================
    const typeLabels = {
      'HTL': 'Hôtel',
      'MGS': 'Grande Surface',
      'RDP': 'Radio/Télé',
      'TRP': 'Transport',
      'NGT': 'Night Club',
      'OCC': 'Occasionnel'
    };

    const tableHeaders = ['N° QUITANCE', 'TYPE', 'CLIENT', 'MONTANT', 'OBS'];

    const tableData = quittances.map((q, index) => {
      const numGlobal = index + 1;
      const typeLabel = typeLabels[q.ref_client_type] || q.ref_client_type || '-';

      // ✅ Montant propre, formaté avec de vraies espaces
      const montantFormatted = formatMontant(q.soit_total);

      let clientInfo = q.denomination || q.demandeur || '-';
      if (q.denomination && q.siege) {
        clientInfo += `, ${q.siege}`;
      }

      let obs = '';
      if (q.region_usager && q.region_usager !== 'N/A') {
        obs += `Région: ${q.region_usager}`;
      }
      if (!obs) obs = 'Aucune';

      return [
        String(q.quittance || numGlobal).padStart(7, '0'),
        typeLabel,
        clientInfo,
        `${montantFormatted} Ar`,
        obs
      ];
    });

    let fontSize = 11;
    let cellPadding = 4;

    if (tableData.length > 12) {
      fontSize = 10;
      cellPadding = 3.5;
    }
    if (tableData.length > 16) {
      fontSize = 9;
      cellPadding = 3;
    }
    if (tableData.length > 20) {
      fontSize = 8.5;
      cellPadding = 2.5;
    }

    autoTable(doc, {
      startY: y,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: fontSize,
        cellPadding: cellPadding,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        valign: 'middle',
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontSize: fontSize + 1,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 'auto', halign: 'left' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 'auto', halign: 'left' }
      },
      margin: { left: margin, right: margin },
      pageBreak: 'avoid'
    });

    // ============================================================
    // PIED DE PAGE - POLICE 11
    // ============================================================
    const finalY = doc.lastAutoTable.finalY + 4;
    y = finalY;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    const totalItems = quittances.length;
    doc.text(`${totalItems} quittance`, margin, y);

    // ✅ TOTAL propre, formaté avec de vraies espaces (plus de "/")
    const totalMontantBrut = quittances.reduce(
      (sum, q) => sum + nettoyerMontant(q.soit_total),
      0
    );
    const totalMontantFormatted = formatMontant(totalMontantBrut);
    doc.text(`Total : ${totalMontantFormatted} Ar`, pageWidth - margin, y, { align: 'right' });

    // ============================================================
    // SAUVEGARDE
    // ============================================================
    const regionSlug = region
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
    const filename = `suivi_quittance_${regionSlug}_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(filename);

    console.log(`✅ PDF généré avec ${totalItems} quittances en orientation PORTRAIT`);
    return true;

  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    console.error('❌ Stack:', error.stack);
    return false;
  }
};

export default generateQuitancePDF;