import { postJson } from '@/lib/api-client';

/**
 * Ask the server to re-read these candidates' resumes (with AI for scanned
 * PDFs) and redo parsing, validation and scoring. It runs in the background;
 * new results arrive over the realtime candidate/application updates.
 */
export async function requestAiRecheck(ids: string[]): Promise<number> {
  const path =
    ids.length === 1
      ? `/ats/candidates/${ids[0]}/ai-recheck`
      : '/ats/candidates/ai-recheck';
  const res = await postJson<{ queued: number }>(
    path,
    ids.length === 1 ? {} : { ids }
  );
  return res.queued;
}
