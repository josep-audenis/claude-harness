/**
 * Turn a title into a URL slug:
 * - lowercase;
 * - accents removed ("é" → "e");
 * - every run of characters other than a-z and 0-9 becomes a single "-";
 * - no leading or trailing "-".
 */
export function slugify(title) {
  return String(title)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}
