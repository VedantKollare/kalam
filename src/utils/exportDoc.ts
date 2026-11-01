import { type Script } from '../types/screenplay';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Download the screenplay as a Word .doc file.
 * We emit Word-flavoured HTML (which Word opens natively) - no heavy deps.
 */
export function downloadDoc(script: Script): void {
  const body = script.blocks.map(b => {
    // Block content is already HTML (inline B/I/U from the editor) - keep it.
    const c = b.content || '&nbsp;';
    switch (b.type) {
      case 'scene_heading':
        return `<p style="font-weight:bold;text-transform:uppercase;margin:14pt 0 4pt 0;">${c}</p>`;
      case 'action':
        return `<p style="margin:4pt 0;">${c}</p>`;
      case 'character':
        return `<p style="margin:10pt 0 0 2.2in;font-weight:bold;text-transform:uppercase;">${c}</p>`;
      case 'parenthetical':
        return `<p style="margin:0 1.9in 0 1.6in;font-style:italic;">${c}</p>`;
      case 'dialogue':
        return `<p style="margin:0 1.5in 4pt 1in;">${c}</p>`;
      case 'transition':
        return `<p style="margin:8pt 0;text-align:right;font-weight:bold;text-transform:uppercase;">${c}</p>`;
      case 'intermission':
        return `<p style="margin:18pt 0;text-align:center;font-weight:bold;letter-spacing:8pt;text-transform:uppercase;">${c}</p>`;
      case 'song':
        return `<p style="margin:4pt 1in;font-style:italic;">${c}</p>`;
      default:
        return `<p>${c}</p>`;
    }
  }).join('\n');

  const html =
`<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${esc(script.title || 'Untitled')}</title>
<style>
  @page { size: A4; margin: 1in 1in 1in 1.5in; }
  body  { font-family: 'Courier New', monospace; font-size: 12pt; line-height: 1.4; color:#000; }
  h1    { text-align:center; font-size:14pt; text-transform:uppercase; margin:0 0 6pt 0; }
  .by   { text-align:center; font-size:12pt; margin:0 0 24pt 0; }
</style></head>
<body>
  <h1>${esc(script.title || 'Untitled Script')}</h1>
  ${script.author ? `<p class="by">Written by ${esc(script.author)}</p>` : ''}
  ${body}
</body></html>`;

  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(script.title || 'script').replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
