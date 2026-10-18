import type { Client } from '../types';
import { CompanySize } from '../types/enums';
import type { ClientState } from './clients.store.types';

const VALID_COMPANY_SIZES = Object.values(CompanySize) as string[];

/** Unwrap envelope responses like { data: T } — returns T directly. */
export function unwrap<T>(res: T | { data: T }): T {
  if (res && typeof res === 'object' && 'data' in res && !('_id' in res)) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/** Normalize known bad companySize values from the backend. */
export function normalizeClient(c: Client): Client {
  if (c.companySize && !VALID_COMPANY_SIZES.includes(c.companySize)) {
    if ((c.companySize as string) === '1-50')
      return { ...c, companySize: '11-50' };
  }
  return c;
}

/** A client endpoint's response, unwrapped and normalised. */
export function toClient(res: Client | { data: Client }): Client {
  return normalizeClient(unwrap(res));
}

/** Put a fresh client into the list row and, when cached, the detail entry. */
export function replaceClient(
  s: Pick<ClientState, 'items' | 'detail'>,
  id: string,
  client: Client
) {
  const idx = s.items.findIndex(x => x._id === id);
  if (idx !== -1) s.items[idx] = client;
  if (s.detail[id]) s.detail[id] = client;
}
