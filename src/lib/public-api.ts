import { getJson, postForm, postJson, postJsonPublic } from './api-client';

/**
 * Public, unauthenticated API helpers for the careers portal.
 *
 * The careers pages (job listings, job details, apply form) must work for
 * anonymous visitors. We reuse the existing `getJson` / `postJson` helpers
 * because they already send credentials and an auth token *only when one is
 * present* — for an anonymous visitor there is no token, so the request goes
 * out without an `Authorization` header and without triggering a silent
 * refresh. A 401 from a public endpoint simply throws and is handled by the
 * calling page (e.g. show an empty / error state) instead of redirecting to
 * login.
 *
 * Only endpoints documented as `PUBLIC` (`POST /ats/jobs/:id/apply`) are
 * guaranteed to work anonymously. The `GET /ats/jobs*` endpoints are used
 * here optimistically; if the backend gates them behind auth, the pages
 * degrade gracefully.
 */
export const publicApi = {
  get: getJson,
  post: postJson,
  postPublic: postJsonPublic,
  postForm,
};
