// src/pages/pdf/bilanGlobal_pdf.jsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatMontant = (valeur) => {
  const n = Math.round(Number(valeur) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return ''; }
};

export const generateBilanGlobalPDF = async (statsData, options = {}) => {
  try {
    console.log('📄 Début génération Bilan Global PDF...');

    const {
      annee = new Date().getFullYear(),
      responsable = 'DAF',
      dateGeneration = new Date().toLocaleDateString('fr-FR'),
      actionType = 'bilan_global',
      title = 'Bilan Global OMDA'
    } = options;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 16;
    let y = margin;

    const NAVY = [26, 35, 126];
    const GREY = [90, 90, 90];
    const LIGHT_GREY = [235, 235, 235];

    // ===== BANDEAU D'EN-TÊTE =====
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('OMDA — ' + title, margin, 13);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Office Malagasy du Droit d\'Auteur', margin, 20);

    doc.setFontSize(9.5);
    doc.text(`Année ${annee}`, pageWidth - margin, 13, { align: 'right' });
    doc.text(`Généré le ${dateGeneration}`, pageWidth - margin, 20, { align: 'right' });

    y = 36;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Responsable : ${responsable}`, margin, y);
    doc.text(`Type : ${title}`, pageWidth - margin, y, { align: 'right' });
    y += 8;

    // ===== RÉSUMÉ GÉNÉRAL (cartes) =====
    const totalDossiers = statsData?.totalDossiers || 0;
    const totalPaiements = statsData?.totalPaiements || 0;
    const totalMontant = statsData?.totalMontant || 0;

    const cardData = [
      { label: 'TOTAL DOSSIERS', value: totalDossiers.toLocaleString('fr-FR') },
      { label: 'TOTAL FACTURES', value: totalPaiements.toLocaleString('fr-FR') },
      { label: 'MONTANT TOTAL', value: `${formatMontant(totalMontant)} Ar` }
    ];

    const cardWidth = (pageWidth - margin * 2 - 8 * 2) / 3;
    const cardHeight = 22;

    cardData.forEach((card, i) => {
      const x = margin + i * (cardWidth + 8);
      doc.setDrawColor(...LIGHT_GREY);
      doc.setLineWidth(0.3);
      doc.setFillColor(248, 248, 250);
      doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GREY);
      doc.text(card.label, x + 4, y + 7);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(String(card.value), x + 4, y + 16);
    });

    y += cardHeight + 12;

    // ===== SECTION SPÉCIFIQUE SELON LE TYPE D'ACTION =====
    switch (actionType) {
      case 'bilan_global':
        await renderBilanGlobal(doc, statsData, y, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY);
        break;
      case 'bilan_region':
        await renderBilanRegion(doc, statsData, y, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY);
        break;
      case 'bilan_paiements':
        await renderBilanPaiements(doc, statsData, y, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY);
        break;
      case 'bilan_recettes':
        await renderBilanRecettes(doc, statsData, y, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY);
        break;
      case 'bilan_mensuel':
        await renderBilanMensuel(doc, statsData, y, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY);
        break;
      case 'bilan_stats':
        await renderBilanStats(doc, statsData, y, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY);
        break;
      default:
        await renderBilanGlobal(doc, statsData, y, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY);
    }

    // ===== PIED DE PAGE SUR TOUTES LES PAGES =====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 12;
      doc.setDrawColor(...LIGHT_GREY);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text('OMDA - Office Malagasy du Droit d\'Auteur', margin, footerY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GREY);
      doc.text(`Page ${i} / ${pageCount}`, pageWidth - margin, footerY + 5, { align: 'right' });
    }

    const filename = `${actionType}_omda_${annee}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    console.log(`✅ ${title} PDF généré avec succès`);
    return true;

  } catch (error) {
    console.error('❌ Erreur génération Bilan Global PDF:', error);
    return false;
  }
};

// ============================================================
// RENDER - Bilan Global (complet)
// ============================================================
async function renderBilanGlobal(doc, statsData, startY, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY) {
  let y = startY;

  // ===== TABLEAU PAR CATÉGORIE =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('RÉPARTITION PAR CATÉGORIE', margin, y);
  y += 3;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 62, y);
  y += 6;

  const categories = [
    { id: 'hotel', label: 'Hôtel' },
    { id: 'grand-surface', label: 'Grande Surface' },
    { id: 'bus', label: 'Transport' },
    { id: 'nightclub', label: 'Night Club' },
    { id: 'media', label: 'Radio / Télé' },
    { id: 'occ', label: 'Occasionnel' }
  ];

  const categoryStats = categories.map(cat => {
    const data = statsData?.parCategorie?.[cat.id] || { total: 0, nouveaux: 0, montant: 0 };
    return { ...cat, ...data };
  });

  const totalGeneral = categoryStats.reduce((acc, c) => acc + (c.montant || 0), 0);

  const tableData = categoryStats.map(cat => {
    const pourcentage = totalGeneral > 0 ? ((cat.montant / totalGeneral) * 100).toFixed(1) : '0.0';
    return [
      cat.label,
      String(cat.total || 0),
      String(cat.nouveaux || 0),
      `${formatMontant(cat.montant)} Ar`,
      `${pourcentage} %`
    ];
  });

  tableData.push([
    'TOTAL GÉNÉRAL',
    String(categoryStats.reduce((acc, c) => acc + (c.total || 0), 0)),
    String(categoryStats.reduce((acc, c) => acc + (c.nouveaux || 0), 0)),
    `${formatMontant(totalGeneral)} Ar`,
    '100 %'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Catégorie', 'Dossiers', 'Ce mois', 'Montant', 'Part']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [210, 210, 210],
      lineWidth: 0.2,
      valign: 'middle',
      textColor: [30, 30, 30]
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontSize: 9.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 48, halign: 'left' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 'auto', halign: 'right' },
      4: { cellWidth: 22, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.row.section === 'body' && data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 245];
      }
    },
    margin: { left: margin, right: margin }
  });

  y = doc.lastAutoTable.finalY + 12;

  // ===== DÉTAIL PAR CATÉGORIE =====
  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('DÉTAIL DES DOSSIERS ACTIFS', margin, y);
  y += 3;
  doc.setDrawColor(...NAVY);
  doc.line(margin, y, margin + 68, y);
  y += 8;

  categoryStats.forEach((cat) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(...LIGHT_GREY);
    doc.setLineWidth(0.2);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 1.2, 1.2, 'FD');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(cat.label, margin + 4, y + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY);
    doc.text(`${cat.total || 0} dossier(s) au total  •  ${cat.nouveaux || 0} nouveau(x) ce mois`, margin + 4, y + 14.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.setFontSize(10.5);
    doc.text(`${formatMontant(cat.montant)} Ar`, pageWidth - margin - 4, y + 11, { align: 'right' });

    y += 24;
  });
}

// ============================================================
// RENDER - Bilan par Région
// ============================================================
async function renderBilanRegion(doc, statsData, startY, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY) {
  let y = startY;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('RÉPARTITION PAR RÉGION', margin, y);
  y += 3;
  doc.setDrawColor(...NAVY);
  doc.line(margin, y, margin + 58, y);
  y += 6;

  const regions = statsData?.parRegion || [];

  if (regions.length > 0) {
    const tableData = regions.map(region => [
      region.region || 'Non spécifié',
      String(region.total || 0),
      String(region.usagers || 0),
      `${formatMontant(region.montant)} Ar`
    ]);

    const totalRegionMontant = regions.reduce((acc, r) => acc + (r.montant || 0), 0);
    tableData.push([
      'TOTAL GÉNÉRAL',
      String(regions.reduce((acc, r) => acc + (r.total || 0), 0)),
      String(regions.reduce((acc, r) => acc + (r.usagers || 0), 0)),
      `${formatMontant(totalRegionMontant)} Ar`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Région', 'Dossiers', 'Usagers uniques', 'Montant']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [210, 210, 210],
        lineWidth: 0.2,
        valign: 'middle',
        textColor: [30, 30, 30]
      },
      headStyles: {
        fillColor: NAVY,
        textColor: [255, 255, 255],
        fontSize: 9.5,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 'auto', halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.row.section === 'body' && data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 245];
        }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GREY);
    doc.text('Aucune donnée par région disponible', margin, y);
    y += 10;
  }
}

// ============================================================
// RENDER - Bilan Paiements
// ============================================================
async function renderBilanPaiements(doc, statsData, startY, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY) {
  let y = startY;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('HISTORIQUE DES PAIEMENTS', margin, y);
  y += 3;
  doc.setDrawColor(...NAVY);
  doc.line(margin, y, margin + 62, y);
  y += 6;

  const paiements = statsData?.paiements || [];

  if (paiements.length > 0) {
    const tableData = paiements.slice(0, 50).map(p => [
      p.reference || p.id || '-',
      p.type_paiement || 'N/A',
      formatDate(p.date_paiement) || formatDate(p.created_at) || '-',
      `${formatMontant(p.montant)} Ar`,
      p.statut || 'OK'
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Référence', 'Type', 'Date', 'Montant', 'Statut']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [210, 210, 210],
        lineWidth: 0.2,
        valign: 'middle',
        textColor: [30, 30, 30]
      },
      headStyles: {
        fillColor: NAVY,
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 'auto', halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 12;
    
    if (paiements.length > 50) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...GREY);
      doc.text(`* Affichage des 50 premiers paiements sur ${paiements.length}`, margin, y);
      y += 8;
    }
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GREY);
    doc.text('Aucun paiement enregistré', margin, y);
    y += 10;
  }
}

// ============================================================
// RENDER - Bilan Recettes
// ============================================================
async function renderBilanRecettes(doc, statsData, startY, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY) {
  let y = startY;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('RECETTES PAR CATÉGORIE', margin, y);
  y += 3;
  doc.setDrawColor(...NAVY);
  doc.line(margin, y, margin + 58, y);
  y += 6;

  const categories = [
    { id: 'hotel', label: '🏨 Hôtel' },
    { id: 'grand-surface', label: '🏬 Grande Surface' },
    { id: 'bus', label: '🚌 Transport' },
    { id: 'nightclub', label: '🎭 Night Club' },
    { id: 'media', label: '📺 Média' },
    { id: 'occ', label: '🎪 Occasionnel' }
  ];

  const categoryStats = categories.map(cat => {
    const data = statsData?.parCategorie?.[cat.id] || { total: 0, montant: 0 };
    return { ...cat, ...data };
  });

  const totalGeneral = categoryStats.reduce((acc, c) => acc + (c.montant || 0), 0);

  const tableData = categoryStats.map(cat => {
    const pourcentage = totalGeneral > 0 ? ((cat.montant / totalGeneral) * 100).toFixed(1) : '0.0';
    return [
      cat.label,
      `${formatMontant(cat.montant)} Ar`,
      `${pourcentage} %`
    ];
  });

  tableData.push([
    'TOTAL GÉNÉRAL',
    `${formatMontant(totalGeneral)} Ar`,
    '100 %'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Catégorie', 'Montant', 'Part']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [210, 210, 210],
      lineWidth: 0.2,
      valign: 'middle',
      textColor: [30, 30, 30]
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 'auto', halign: 'right' },
      2: { cellWidth: 35, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.row.section === 'body' && data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 245];
      }
    },
    margin: { left: margin, right: margin }
  });

  y = doc.lastAutoTable.finalY + 12;
}

// ============================================================
// RENDER - Bilan Mensuel
// ============================================================
async function renderBilanMensuel(doc, statsData, startY, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY) {
  let y = startY;

  const moisActuel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text(`RAPPORT MENSUEL - ${moisActuel.toUpperCase()}`, margin, y);
  y += 3;
  doc.setDrawColor(...NAVY);
  doc.line(margin, y, margin + 70, y);
  y += 6;

  // Résumé du mois
  const factures = statsData?.factures || [];
  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  
  const facturesMois = factures.filter(f => {
    const date = f.created_at ? new Date(f.created_at) : null;
    return date && date >= debutMois;
  });

  const totalMois = facturesMois.length;
  const montantMois = facturesMois.reduce((acc, f) => acc + (parseFloat(f.soit_total) || 0), 0);

  const cardData = [
    { label: 'DOSSIERS DU MOIS', value: totalMois.toLocaleString('fr-FR') },
    { label: 'MONTANT DU MOIS', value: `${formatMontant(montantMois)} Ar` },
    { label: 'MOYENNE PAR DOSSIER', value: totalMois > 0 ? `${formatMontant(montantMois / totalMois)} Ar` : '0 Ar' }
  ];

  const cardWidth = (pageWidth - margin * 2 - 8 * 2) / 3;
  const cardHeight = 20;

  cardData.forEach((card, i) => {
    const x = margin + i * (cardWidth + 8);
    doc.setDrawColor(...LIGHT_GREY);
    doc.setLineWidth(0.3);
    doc.setFillColor(248, 248, 250);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY);
    doc.text(card.label, x + 4, y + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(String(card.value), x + 4, y + 15);
  });

  y += cardHeight + 12;

  // Détail des dossiers du mois
  if (facturesMois.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('DÉTAIL DES DOSSIERS DU MOIS', margin, y);
    y += 3;
    doc.setDrawColor(...NAVY);
    doc.line(margin, y, margin + 58, y);
    y += 6;

    const tableData = facturesMois.slice(0, 30).map(f => [
      f.denomination || f.demandeur || '-',
      f.ref_client_type || '-',
      formatDate(f.created_at) || '-',
      `${formatMontant(f.soit_total)} Ar`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Bénéficiaire', 'Type', 'Date', 'Montant']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [210, 210, 210],
        lineWidth: 0.2,
        valign: 'middle',
        textColor: [30, 30, 30]
      },
      headStyles: {
        fillColor: NAVY,
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 'auto', halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 12;
    
    if (facturesMois.length > 30) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...GREY);
      doc.text(`* Affichage des 30 premiers dossiers sur ${facturesMois.length}`, margin, y);
      y += 8;
    }
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GREY);
    doc.text('Aucun dossier pour le mois en cours', margin, y);
    y += 10;
  }
}

// ============================================================
// RENDER - Statistiques Globales
// ============================================================
async function renderBilanStats(doc, statsData, startY, margin, pageWidth, pageHeight, NAVY, GREY, LIGHT_GREY) {
  let y = startY;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('STATISTIQUES GLOBALES', margin, y);
  y += 3;
  doc.setDrawColor(...NAVY);
  doc.line(margin, y, margin + 55, y);
  y += 6;

  // Statistiques clés
  const totalDossiers = statsData?.totalDossiers || 0;
  const totalUsagers = statsData?.totalUsagersUniques || 0;
  const totalPaiements = statsData?.totalPaiements || 0;
  const totalMontant = statsData?.totalMontant || 0;
  const totalRegions = statsData?.parRegion?.length || 0;

  const statsCards = [
    { label: 'Total Dossiers', value: totalDossiers.toLocaleString('fr-FR'), icon: '📁' },
    { label: 'Usagers Uniques', value: totalUsagers.toLocaleString('fr-FR'), icon: '👤' },
    { label: 'Total Factures', value: totalPaiements.toLocaleString('fr-FR'), icon: '📄' },
    { label: 'Montant Total', value: `${formatMontant(totalMontant)} Ar`, icon: '💰' },
    { label: 'Régions', value: totalRegions.toLocaleString('fr-FR'), icon: '🌍' },
    { label: 'Catégories', value: '6', icon: '📊' }
  ];

  const cardWidth = (pageWidth - margin * 2 - 8 * 2) / 3;
  const cardHeight = 22;

  statsCards.forEach((card, i) => {
    const x = margin + (i % 3) * (cardWidth + 8);
    const rowY = y + Math.floor(i / 3) * (cardHeight + 6);
    
    if (i % 3 === 0 && i > 0) {
      // Nouvelle ligne
    }
    
    doc.setDrawColor(...LIGHT_GREY);
    doc.setLineWidth(0.3);
    doc.setFillColor(248, 248, 250);
    doc.roundedRect(x, rowY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY);
    doc.text(`${card.icon} ${card.label}`, x + 4, rowY + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(String(card.value), x + 4, rowY + 17);
  });

  y += Math.ceil(statsCards.length / 3) * (cardHeight + 6) + 12;

  // Détail par catégorie
  if (y > pageHeight - 80) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('DÉTAIL PAR CATÉGORIE', margin, y);
  y += 3;
  doc.setDrawColor(...NAVY);
  doc.line(margin, y, margin + 58, y);
  y += 6;

  const categories = [
    { id: 'hotel', label: 'Hôtel', emoji: '🏨' },
    { id: 'grand-surface', label: 'Grande Surface', emoji: '🏬' },
    { id: 'bus', label: 'Transport', emoji: '🚌' },
    { id: 'nightclub', label: 'Night Club', emoji: '🎭' },
    { id: 'media', label: 'Média', emoji: '📺' },
    { id: 'occ', label: 'Occasionnel', emoji: '🎪' }
  ];

  const categoryStats = categories.map(cat => {
    const data = statsData?.parCategorie?.[cat.id] || { total: 0, nouveaux: 0, montant: 0 };
    return { ...cat, ...data };
  });

  const totalGeneral = categoryStats.reduce((acc, c) => acc + (c.montant || 0), 0);

  const tableData = categoryStats.map(cat => {
    const pourcentage = totalGeneral > 0 ? ((cat.montant / totalGeneral) * 100).toFixed(1) : '0.0';
    return [
      `${cat.emoji} ${cat.label}`,
      String(cat.total || 0),
      String(cat.nouveaux || 0),
      `${formatMontant(cat.montant)} Ar`,
      `${pourcentage} %`
    ];
  });

  tableData.push([
    '📌 TOTAL GÉNÉRAL',
    String(categoryStats.reduce((acc, c) => acc + (c.total || 0), 0)),
    String(categoryStats.reduce((acc, c) => acc + (c.nouveaux || 0), 0)),
    `${formatMontant(totalGeneral)} Ar`,
    '100 %'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Catégorie', 'Dossiers', 'Nouveaux', 'Montant', 'Part']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [210, 210, 210],
      lineWidth: 0.2,
      valign: 'middle',
      textColor: [30, 30, 30]
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontSize: 9.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 55, halign: 'left' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 'auto', halign: 'right' },
      4: { cellWidth: 22, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.row.section === 'body' && data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 245];
      }
    },
    margin: { left: margin, right: margin }
  });
}

export default generateBilanGlobalPDF;