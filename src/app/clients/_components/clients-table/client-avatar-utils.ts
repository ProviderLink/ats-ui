/** Stable 0–359 hue from the company name, so each company keeps its colour. */
export function hueOf(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

/** "Acme Corp" → "AC", "Acme" → "AC", "Zoom" → "ZO". */
export function monogram(name: string) {
  const words = name.trim().split(/[\s\-_.&]+/).filter(Boolean);
  const letters =
    words.length > 1
      ? words[0][0] + words[1][0]
      : (words[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

/**
 * Solid mid-tone background for monogram avatars. Lightness and chroma are
 * fixed so it never blends into the white/dark table or sheet backgrounds,
 * and the table and detail sheet always render the same colour.
 */
export function avatarBg(name: string) {
  return `oklch(0.52 0.13 ${hueOf(name)})`;
}
