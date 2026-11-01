/** Strip HTML tags → plain text. Block content may contain inline B/I/U markup. */
export function plain(html: string): string {
  if (!html) return '';
  if (!html.includes('<') && !html.includes('&')) return html;   // fast path: no tags or entities
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}

export function wordCount(html: string): number {
  return plain(html).split(/\s+/).filter(Boolean).length;
}
