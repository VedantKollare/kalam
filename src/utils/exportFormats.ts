// Industry interchange formats: Fountain (plain-text screenplay markup) and
// Final Draft (.fdx). Both let a Scripter script open in other professional
// tools without losing its structure.

import type { Script, ScreenplayBlock } from '../domain/screenplay';
import { plain } from './text';

const HEADING_RE = /^(INT|EXT|EST|INT\.?\/EXT|EXT\.?\/INT|I\/E)[.\s]/i;
const hasCase = (s: string) => s.toUpperCase() !== s.toLowerCase();

/** Editor HTML → Fountain emphasis (**bold**, *italic*, _underline_). */
export function htmlToFountain(html: string): string {
  const marked = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(b|strong)>/gi, '**')
    .replace(/<\/?(i|em)>/gi, '*')
    .replace(/<\/?u>/gi, '_');
  return plain(marked).trim();
}

function fountainBlock(b: ScreenplayBlock): string {
  const text = htmlToFountain(b.content);
  const upper = text.toUpperCase();
  switch (b.type) {
    case 'scene_heading':
      return HEADING_RE.test(text) ? upper : `.${upper}`;
    case 'action':
      // An all-caps line would be read as a character cue; force it to action.
      return (hasCase(text) && text === upper) || HEADING_RE.test(text) ? `!${text}` : text;
    case 'character':
      // Names in Indian scripts have no capitals, so mark them explicitly.
      return hasCase(text) ? upper : `@${text}`;
    case 'parenthetical':
      return text.startsWith('(') ? text : `(${text})`;
    case 'dialogue':
      return text;
    case 'transition':
      return /TO:$/.test(upper) ? upper : `> ${upper}`;
    case 'song':
      return text.split('\n').map(l => `~${l}`).join('\n');
    case 'intermission':
      return `> ${upper || 'INTERVAL'} <`;
  }
}

export function toFountain(script: Script): string {
  const head: string[] = [`Title: ${script.title || 'Untitled Script'}`];
  if (script.author) head.push('Credit: Written by', `Author: ${script.author}`);
  if (script.draftDate) head.push(`Draft date: ${script.draftDate}`);
  if (script.contact) head.push('Contact:', ...script.contact.split(/\r?\n/).map(l => `    ${l}`));

  const out: string[] = [];
  let prev: ScreenplayBlock['type'] | null = null;
  for (const b of script.blocks) {
    if (!plain(b.content).trim()) continue;
    // Character, parenthetical and dialogue form one group with no blank lines.
    const inDialogue = (b.type === 'dialogue' || b.type === 'parenthetical')
      && (prev === 'character' || prev === 'parenthetical' || prev === 'dialogue');
    out.push(inDialogue ? '\n' : '\n\n');
    out.push(fountainBlock(b));
    prev = b.type;
  }
  return `${head.join('\n')}\n${out.join('').replace(/^\n+/, '\n')}\n`;
}

const FDX_TYPE: Record<ScreenplayBlock['type'], string> = {
  scene_heading: 'Scene Heading',
  action: 'Action',
  character: 'Character',
  parenthetical: 'Parenthetical',
  dialogue: 'Dialogue',
  transition: 'Transition',
  song: 'Action',
  intermission: 'Action',
};

const xml = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const para = (type: string | null, text: string, opts: { align?: string; style?: string } = {}) =>
  `    <Paragraph${type ? ` Type="${type}"` : ''}${opts.align ? ` Alignment="${opts.align}"` : ''}>`
  + `<Text${opts.style ? ` Style="${opts.style}"` : ''}>${xml(text)}</Text></Paragraph>`;

export function toFDX(script: Script): string {
  const body = script.blocks
    .map(b => ({ b, text: plain(b.content).trim() }))
    .filter(x => x.text)
    .map(({ b, text }) => {
      if (b.type === 'song') return para('Action', text, { style: 'Italic' });
      if (b.type === 'intermission') return para('Action', text.toUpperCase() || 'INTERVAL', { align: 'Center', style: 'Bold' });
      return para(FDX_TYPE[b.type], text);
    });

  const title = [
    para(null, (script.title || 'Untitled Script').toUpperCase(), { align: 'Center', style: 'Bold+Underline' }),
    ...(script.author ? [para(null, 'Written by', { align: 'Center' }), para(null, script.author, { align: 'Center' })] : []),
    ...(script.draftDate ? [para(null, script.draftDate, { align: 'Right' })] : []),
    ...(script.contact ? script.contact.split(/\r?\n/).map(l => para(null, l, { align: 'Left' })) : []),
  ];

  return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
${body.join('\n')}
  </Content>
  <TitlePage>
    <Content>
${title.join('\n')}
    </Content>
  </TitlePage>
</FinalDraft>
`;
}

export function downloadText(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const baseName = (script: Script) => (script.title || 'script').replace(/\s+/g, '_');

export const downloadFountain = (script: Script) =>
  downloadText(toFountain(script), `${baseName(script)}.fountain`, 'text/plain;charset=utf-8');

export const downloadFDX = (script: Script) =>
  downloadText(toFDX(script), `${baseName(script)}.fdx`, 'application/xml;charset=utf-8');
