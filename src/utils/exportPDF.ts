import { type Script } from '../types/screenplay';
import { PAGE_SIZES, TOP_MARGIN_IN, LINE_HEIGHT_IN, CHARS_PER_INCH, type PageLine } from '../domain/pagination';
import { paginateScript } from './layout';

const PT = 72;   // points per inch

/** jsPDF's built-in Courier has no Indian-script glyphs or text shaping. */
export function needsBrowserPDF(script: Script): boolean {
  return script.language !== 'english' && script.language !== 'hinglish'
    || script.blocks.some(b => /[ऀ-෿]/.test(b.content));
}

/**
 * Export the script as a PDF laid out by the pagination engine, so the file
 * matches the page view and print exactly. Indian-script scripts go through
 * the browser's print dialog ("Save as PDF"), which shapes those fonts.
 */
export async function exportToPDF(script: Script): Promise<void> {
  if (needsBrowserPDF(script)) {
    window.print();
    return;
  }

  const { default: jsPDF } = await import('jspdf');
  const size = script.pageSize ?? 'A4';
  const { width, height } = PAGE_SIZES[size];
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: size === 'A4' ? 'a4' : 'letter' });
  const W = width * PT;
  const center = W / 2;

  // Title page
  doc.setFont('Courier', 'bold');
  doc.setFontSize(12);
  const title = (script.title || 'Untitled Script').toUpperCase();
  const titleY = 3.3 * PT + 12;
  doc.text(title, center, titleY, { align: 'center' });
  const tw = doc.getTextWidth(title);
  doc.setLineWidth(0.6);
  doc.line(center - tw / 2, titleY + 3, center + tw / 2, titleY + 3);
  doc.setFont('Courier', 'normal');
  if (script.author) {
    doc.text('Written by', center, titleY + 0.5 * PT, { align: 'center' });
    doc.text(script.author, center, titleY + 0.67 * PT, { align: 'center' });
  }
  const bottom = height * PT - PT;
  if (script.contact) {
    const lines = script.contact.split(/\r?\n/);
    lines.forEach((l, i) => doc.text(l, 1.5 * PT, bottom - (lines.length - 1 - i) * 12));
  }
  if (script.draftDate) {
    const lines = script.draftDate.split(/\r?\n/);
    lines.forEach((l, i) => doc.text(l, W - PT, bottom - (lines.length - 1 - i) * 12, { align: 'right' }));
  }

  const { pages } = paginateScript(script);
  for (const page of pages) {
    doc.addPage();
    doc.setFont('Courier', 'normal');
    doc.setFontSize(12);
    if (page.number > 1) doc.text(`${page.number}.`, W - PT, 0.5 * PT + 10, { align: 'right' });
    for (const line of page.lines) drawLine(doc, line, W);
  }

  doc.save(`${script.title.replace(/\s+/g, '_') || 'script'}.pdf`);
}

type Doc = InstanceType<typeof import('jspdf').default>;

function drawLine(doc: Doc, l: PageLine, W: number) {
  // Baseline sits ~80% down the 1/6" line box
  const y = (TOP_MARGIN_IN + l.row * LINE_HEIGHT_IN) * PT + 9.5;
  const bold = ['scene_heading', 'character', 'transition', 'contd', 'intermission'].includes(l.kind);
  const italic = l.kind === 'parenthetical' || l.kind === 'song';
  doc.setFont('Courier', bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal');

  if (l.sceneNumber != null) {
    doc.setFont('Courier', 'bold');
    doc.text(String(l.sceneNumber), (l.left - 0.75) * PT, y);
    doc.text(String(l.sceneNumber), W - PT, y, { align: 'right' });
  }

  if (l.align === 'right') {
    doc.text(l.text, (l.left + 6) * PT, y, { align: 'right' });
  } else if (l.align === 'center') {
    const cx = (l.left + 3) * PT;
    doc.text(l.text, cx, y, { align: 'center', charSpace: 4 });
    doc.setLineWidth(0.5);
    doc.line(l.left * PT, y - 11, (l.left + 6) * PT, y - 11);
    doc.line(l.left * PT, y + 4, (l.left + 6) * PT, y + 4);
  } else {
    doc.text(l.text, l.left * PT, y, { maxWidth: (l.width / CHARS_PER_INCH) * PT + 4 });
  }
}
