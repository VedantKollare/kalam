import { type Script } from '../types/screenplay';

export async function exportToPDF(script: Script): Promise<void> {
  // Dynamic import to keep bundle lean
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginLeft = 96;   // ~1 inch
  const marginRight = 72;  // ~0.75 inch
  const marginTop = 72;
  const marginBottom = 72;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = marginTop;
  const lineHeight = 14;
  const fontSize = 11;

  doc.setFont('Courier', 'normal');
  doc.setFontSize(fontSize);

  function addLine(text: string, x = marginLeft, weight: 'normal' | 'bold' = 'normal') {
    doc.setFont('Courier', weight);
    // Check if we need a new page
    if (y + lineHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
    doc.text(text, x, y);
    y += lineHeight;
  }

  function addBlankLine() {
    y += lineHeight * 0.5;
  }

  // Title page
  doc.setFont('Courier', 'bold');
  doc.setFontSize(16);
  const titleY = pageHeight / 3;
  doc.text(script.title.toUpperCase(), pageWidth / 2, titleY, { align: 'center' });

  if (script.author) {
    doc.setFont('Courier', 'normal');
    doc.setFontSize(fontSize);
    doc.text(`Written by`, pageWidth / 2, titleY + 28, { align: 'center' });
    doc.text(script.author, pageWidth / 2, titleY + 44, { align: 'center' });
  }

  // Script content page
  doc.addPage();
  y = marginTop;
  doc.setFontSize(fontSize);

  for (const block of script.blocks) {
    const content = block.content.trim();
    if (!content) {
      addBlankLine();
      continue;
    }

    switch (block.type) {
      case 'scene_heading': {
        addBlankLine();
        const lines = doc.splitTextToSize(content.toUpperCase(), contentWidth);
        for (const line of lines) addLine(line, marginLeft, 'bold');
        break;
      }

      case 'action': {
        const lines = doc.splitTextToSize(content, contentWidth);
        for (const line of lines) addLine(line, marginLeft, 'normal');
        addBlankLine();
        break;
      }

      case 'character': {
        addBlankLine();
        addLine(content.toUpperCase(), marginLeft + contentWidth * 0.38, 'bold');
        break;
      }

      case 'parenthetical': {
        const pText = content.startsWith('(') ? content : `(${content})`;
        addLine(pText, marginLeft + contentWidth * 0.28, 'normal');
        break;
      }

      case 'dialogue': {
        const dialogueWidth = contentWidth * 0.55;
        const lines = doc.splitTextToSize(content, dialogueWidth);
        for (const line of lines) addLine(line, marginLeft + contentWidth * 0.22, 'normal');
        addBlankLine();
        break;
      }

      case 'transition': {
        addBlankLine();
        const tText = content.toUpperCase();
        addLine(tText, pageWidth - marginRight - doc.getTextWidth(tText), 'bold');
        addBlankLine();
        break;
      }

      case 'intermission': {
        addBlankLine();
        addBlankLine();
        const iText = 'INTERVAL';
        // Draw lines
        if (y + lineHeight * 3 > pageHeight - marginBottom) { doc.addPage(); y = marginTop; }
        doc.setLineWidth(0.5);
        doc.line(marginLeft, y, pageWidth - marginRight, y);
        y += lineHeight * 0.8;
        doc.setFont('Courier', 'bold');
        doc.setFontSize(14);
        doc.text(iText, pageWidth / 2, y, { align: 'center', charSpace: 8 });
        y += lineHeight;
        doc.setFontSize(fontSize);
        doc.line(marginLeft, y, pageWidth - marginRight, y);
        y += lineHeight;
        addBlankLine();
        break;
      }

      case 'song': {
        addBlankLine();
        const songWidth = contentWidth * 0.7;
        const lines = doc.splitTextToSize(content, songWidth);
        doc.setFont('Courier', 'italic' as any);
        for (const line of lines) {
          if (y + lineHeight > pageHeight - marginBottom) { doc.addPage(); y = marginTop; }
          doc.text(line, marginLeft + contentWidth * 0.15, y);
          y += lineHeight;
        }
        addBlankLine();
        break;
      }
    }
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Courier', 'normal');
    doc.setFontSize(10);
    doc.text(`${i - 1}.`, pageWidth - marginRight, marginTop - 20, { align: 'right' });
  }

  doc.save(`${script.title.replace(/\s+/g, '_') || 'script'}.pdf`);
}
