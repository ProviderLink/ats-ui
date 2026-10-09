import { getAuthToken, isApiUrl } from './api-client';

/**
 * Sanitize a filename for the `download` attribute.
 * - Decodes percent-encoding (legacy records may store URL-encoded names).
 * - Strips path separators to prevent path traversal.
 */
function sanitizeFilename(name: string): string {
  let out = name || '';
  try {
    const decoded = decodeURIComponent(out);
    if (decoded !== out) out = decoded;
  } catch {
    // keep original on malformed input
  }
  return out.replace(/[\\/]/g, '_').trim() || 'resume';
}

/**
 * Download a remote file by its URL, forcing the browser to save it with the
 * given filename (with correct extension).
 *
 * This fetches the file as a blob and triggers a download via a same-origin
 * object URL — the only reliable way to control the saved filename for
 * cross-origin resources (e.g. Cloudinary), where the `download` attribute on
 * a plain <a href> is ignored by browsers.
 */
export async function downloadFileWithAuth(
  url: string,
  filename: string
): Promise<void> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  // Only our own API gets the token; file hosts (Cloudinary) and any other
  // URL must never receive it.
  if (token && isApiUrl(url)) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  try {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = sanitizeFilename(filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Revoke after a short delay so the download can start.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }
}
