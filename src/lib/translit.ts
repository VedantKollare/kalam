// Phonetic transliteration via Google Input Tools.
// Type Latin (e.g. "namaste") → the selected Indian script (నమస్తే / नमस्ते …).

const ITC: Record<string, string> = {
  hindi: 'hi', tamil: 'ta', telugu: 'te', malayalam: 'ml',
};

const cache = new Map<string, string>();

export function isTranslitLang(language: string): boolean {
  return language in ITC;
}

/** Best transliteration for a single Latin word. Falls back to the input on any failure. */
export async function translitWord(word: string, language: string): Promise<string> {
  const itc = ITC[language];
  if (!itc || !/[a-zA-Z]/.test(word)) return word;

  const key = `${itc}:${word.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  try {
    const url =
      `https://inputtools.google.com/request?text=${encodeURIComponent(word)}` +
      `&itc=${itc}-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.[0] === 'SUCCESS' && data[1]?.[0]?.[1]?.[0]) {
      const out = data[1][0][1][0] as string;
      cache.set(key, out);
      return out;
    }
  } catch {
    /* offline / blocked → keep the original Latin word */
  }
  return word;
}
