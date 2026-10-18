// Keeps the parsing spinner on screen long enough that a rejection reads as
// a processing result instead of an instant snap back to the form.
const MIN_PARSE_DURATION_MS = 1200;

export const IMAGE_PDF_MESSAGE =
  'This PDF appears to be image-based or scanned and cannot be parsed. Please upload a text-based PDF.';

export function isImageOnlyPdfError(message: string): boolean {
  return /image-based|scanned|text-based PDF/i.test(message);
}

export async function waitForMinParseDuration(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_PARSE_DURATION_MS) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_PARSE_DURATION_MS - elapsed)
    );
  }
}
