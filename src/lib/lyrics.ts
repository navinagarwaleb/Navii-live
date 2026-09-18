/** True when lyrics HTML has no visible text. */
export function isLyricsEmpty(html: string | null | undefined) {
  if (!html) return true;
  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\u200B/g, "")
    .trim();
  return text.length === 0;
}

/** Convert legacy plain-text lyrics into simple HTML paragraphs. */
export function lyricsToEditorHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return value;

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return value
    .split(/\n/)
    .map((line) => `<p>${line ? escape(line) : "<br>"}</p>`)
    .join("");
}

/** Strip risky tags/handlers from performer-authored lyrics HTML. */
export function sanitizeLyricsHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(?:iframe|object|embed|link|meta)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}
