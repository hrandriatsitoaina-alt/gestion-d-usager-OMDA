// src/pages/pdf/artiste_pdf.jsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un PDF de répartition des artistes - 1 PAGE UNIQUEMENT
 * Orientation PORTRAIT
 */
export const generateArtistePDF = (evenements, options = {}) => {
  if (!evenements || evenements.length === 0) {
    console.warn('⚠️ Aucun événement à générer');
    return false;
  }

  try {
    console.log('📄 Début génération PDF Artiste...');
    console.log('📊 Nombre d\'événements:', evenements.length);
    console.log('🔍 Détail 1er événement:', evenements[0]);

    const {
      mois = '',
      annee = new Date().getFullYear(),
      responsable = '',
      lieu = 'Antananarivo',
      dateDelivre = new Date().toLocaleDateString('fr-FR'),
      dateRetour = '',
      periode = 'mensuelle'
    } = options;

    // ============================================================
    // FONCTIONS DE NETTOYAGE / FORMATAGE
    // ============================================================
    const nettoyerMontant = (valeur) => {
      if (!valeur && valeur !== 0) return 0;
      if (typeof valeur === 'string') {
        const nettoye = valeur.replace(/[^\d.-]/g, '');
        const nombre = parseFloat(nettoye);
        return isNaN(nombre) ? 0 : Math.round(nombre);
      }
      return Math.round(Number(valeur)) || 0;
    };

    const formatMontant = (valeur) => {
      const nombre = nettoyerMontant(valeur);
      return String(nombre).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    // ✅ DATE sur 2 chiffres : 12/09/26
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const jour = String(date.getDate()).padStart(2, '0');
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const annee2 = String(date.getFullYear()).slice(-2);
        return `${jour}/${mois}/${annee2}`;
      } catch {
        return '';
      }
    };

    // ✅ Césure automatique : "Analamanga" → "Anala-manga"
    const cesurerMot = (mot, maxLength = 6) => {
      if (!mot || typeof mot !== 'string') return mot;
      const trimmed = mot.trim();
      // ✅ Retour simple sans tiret
      return trimmed;
    };

    const extraireLieu = (event) => {
      const champs = [
        'lieu_evenement', 'lieu', 'lieuEvent',
        'adresse', 'domicile', 'region'
      ];
      for (const champ of champs) {
        const val = event[champ];
        if (val && typeof val === 'string') {
          const v = val.trim();
          if (v !== '' && v !== 'null' && v !== 'undefined' && v !== 'Non spécifié') {
            return v;
          }
        }
      }
      if (event.lieu_evenement && typeof event.lieu_evenement === 'object') {
        const keys = ['nom', 'lieu', 'adresse', 'ville', 'nom_lieu'];
        for (const k of keys) {
          const val = event.lieu_evenement[k];
          if (val && typeof val === 'string' && val.trim() !== '') {
            return val.trim();
          }
        }
      }
      return 'Non spécifié';
    };

    const extraireRegion = (event) => {
      const champs = ['region', 'Region', 'REGION', 'region_usager'];
      for (const champ of champs) {
        const val = event[champ];
        if (val && typeof val === 'string') {
          const v = val.trim();
          if (v !== '' && v !== 'null' && v !== 'undefined' && v !== 'Non spécifié') {
            return v;
          }
        }
      }
      return 'Non spécifiée';
    };

    // ✅ ORGANISATEURS — cherche dans representant_par EN PRIORITÉ
    // (car dans la base, "representant_par" peut contenir le vrai nom
    //  d'organisateur comme "Boma Event", alors que "organisateurs" peut
    //  contenir le demandeur comme "RANALALA")
    const extraireOrganisateurs = (event) => {
      const champs = [
        'representant_par',    // ✅ PRIORITÉ 1 : "Boma Event"
        'organisateurs',       // priorité 2 : "RANALALA"
        'denomination',
        'demandeur',
        'nom_evenement'
      ];
      for (const champ of champs) {
        const val = event[champ];
        if (val && typeof val === 'string') {
          const v = val.trim();
          if (v !== '' && v !== 'null' && v !== 'undefined' && v !== 'Non spécifié') {
            return v;
          }
        }
      }
      return '-';
    };

    // ============================================================
    // CRÉATION DU DOCUMENT
    // ============================================================
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 8;
    let y = 12;

    // ============================================================
    // EN-TÊTE
    // ============================================================
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('RÉPARTITION ARTISTES', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    const periodeText = periode === 'mensuelle'
      ? `Période : ${mois} ${annee}`
      : `Période : Année ${annee}`;
    doc.text(periodeText, margin, y);

    const responsableText = `Responsable : ${responsable || '_______________'}`;
    doc.text(responsableText, pageWidth - margin - doc.getTextWidth(responsableText), y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`Lieu de l'agence du Représentant : ${lieu || '_______________'}`, margin, y);
    y += 6;

    doc.text(`Date de délivrance : ${dateDelivre}`, margin, y);

    const dateRetourText = `Date de retour : ${dateRetour || '_______________'}`;
    doc.text(dateRetourText, pageWidth - margin - doc.getTextWidth(dateRetourText), y);
    y += 7;

    // ============================================================
    // TABLEAU
    // ============================================================
    const tableHeaders = ['N', 'ORGANISATEURS', 'LIEU', 'RÉGION', 'DATE', 'ARTISTES', 'MONTANT'];

    const tableData = evenements.map((e, index) => {
      const num = index + 1;
      const organisateurs = extraireOrganisateurs(e);       // ✅ Boma Event
      const lieuEvent = extraireLieu(e);
      const regionEvent = extraireRegion(e);
      const dateFormatted = formatDate(e.date_event);       // ✅ 12/09/26
      const artistes = e.artistesString || 'Aucun artiste';
      const montantFormatted = formatMontant(e.montant);

      return [
        String(num),
        organisateurs,
        lieuEvent,
        regionEvent,
        dateFormatted,
        artistes,
        `${montantFormatted} Ar`
      ];
    });

    // ✅ POLICE entre 9 et 10
    let fontSize = 10;
    let cellPadding = 3;

    if (tableData.length > 12) {
      fontSize = 9.5;
      cellPadding = 2.8;
    }
    if (tableData.length > 16) {
      fontSize = 9;
      cellPadding = 2.5;
    }
    if (tableData.length > 20) {
      fontSize = 9;
      cellPadding = 2.2;
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
        textColor: [0, 0, 0],
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontSize: fontSize,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: cellPadding
      },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },   // N
        1: { cellWidth: 34, halign: 'left' },     // ORGANISATEURS
        2: { cellWidth: 26, halign: 'left' },     // LIEU
        3: { cellWidth: 24, halign: 'left' },     // RÉGION
        4: { cellWidth: 20, halign: 'center' },   // DATE
        5: { cellWidth: 'auto', halign: 'left' }, // ARTISTES
        6: { cellWidth: 28, halign: 'right' }     // MONTANT
      },
      // ✅ Diminuer la police de la colonne RÉGION (index 3)
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.fontSize = fontSize - 1; // ✅ 1 pt plus petit que les autres
        }
      },
      margin: { left: margin, right: margin },
      pageBreak: 'avoid'
    });

    // ============================================================
    // PIED DE PAGE
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

    const totalItems = evenements.length;
    doc.text(`${totalItems} événement${totalItems > 1 ? 's' : ''}`, margin, y);

    const totalArtistes = evenements.reduce((sum, e) => sum + (e.artistesCount || 0), 0);
    doc.text(`Total artistes : ${totalArtistes}`, pageWidth / 2 - 15, y);

    const totalMontantBrut = evenements.reduce(
      (sum, e) => sum + nettoyerMontant(e.montant),
      0
    );
    const totalMontantFormatted = formatMontant(totalMontantBrut);
    doc.text(`Total : ${totalMontantFormatted} Ar`, pageWidth - margin, y, { align: 'right' });

    // ============================================================
    // SAUVEGARDE
    // ============================================================
    const periodeSlug = periode === 'mensuelle'
      ? `${mois}_${annee}`
      : `annee_${annee}`;
    const filename = `repartition_artistes_${periodeSlug}_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(filename);

    console.log(`✅ PDF Artiste généré avec ${totalItems} événements`);
    return true;

  } catch (error) {
    console.error('❌ Erreur génération PDF Artiste:', error);
    console.error('❌ Stack:', error.stack);
    return false;
  }
};

export default generateArtistePDF;