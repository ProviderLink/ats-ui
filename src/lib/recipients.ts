/**
 * Split a raw email recipient string into trimmed addresses.
 *
 * Accepts commas AND semicolons as separators — people paste both — so the
 * compose sheet's To/Cc/Bcc fields and the chip-style recipient input all agree
 * on what counts as a separate address.
 */
export function parseRecipients(value: string): string[] {
  return value
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean);
}
