import type { ClientStatus, CompanySize, CrmHealth, NoteMethod } from './enums';
import type { RawTag } from './tag.types';

export interface ClientAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ClientContact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary: boolean;
}

export interface ClientCrmProfile {
  healthStatus?: CrmHealth;
  baaSign?: boolean;
  baaSignedDate?: string | null;
  emrSystem?: string;
  onboardingComplete?: boolean;
  sopReceived?: boolean;
  satisfactionScore?: number | null;
  openIssuesCount?: number;
  lastClientCheckin?: string | null;
  notes?: string;
}

export interface Client {
  _id: string;
  companyName: string;
  email: string;
  phone?: string;
  website?: string;
  logo?: string | null;
  industry?: string;
  companySize?: CompanySize;
  status: ClientStatus;
  description?: string;
  address?: ClientAddress;
  contacts: ClientContact[];
  // Backend may return tags either populated (full Tag objects) or as a
  // raw `string[]` of tag ObjectIds — list endpoints in particular ship the
  // raw IDs. Resolve via `lib/tags.ts` (`useResolvedTags` / `normalizeTags`)
  // before reading `name`/`color` on a tag.
  tags: RawTag[];
  crmProfile?: ClientCrmProfile | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  companyName: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  companySize?: CompanySize;
  description?: string;
  address?: ClientAddress;
}

export type UpdateClientDto = Partial<CreateClientDto> & {
  status?: ClientStatus;
  tags?: string[];
};

export interface CreateContactDto {
  name: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary?: boolean;
}

export type UpdateContactDto = Partial<CreateContactDto>;

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientNote {
  _id: string;
  clientId: string;
  method: NoteMethod;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteDto {
  method: NoteMethod;
  content: string;
}

export type UpdateNoteDto = Partial<CreateNoteDto>;
