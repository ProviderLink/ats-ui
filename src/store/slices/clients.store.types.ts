import type {
  Client,
  ClientCrmProfile,
  ClientFilters,
  ClientNote,
  CreateClientDto,
  CreateContactDto,
  CreateNoteDto,
  Pagination,
  UpdateClientDto,
  UpdateContactDto,
  UpdateNoteDto,
} from '../types';

export interface ClientState {
  items: Client[];
  detail: Record<string, Client>;
  notes: Record<string, ClientNote[]>;
  loading: boolean;
  isRefreshing: boolean;
  notesLoading: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: ClientFilters;
}

export interface ClientActions {
  fetch: (params?: ClientFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (data: CreateClientDto) => Promise<Client>;
  update: (id: string, data: UpdateClientDto) => Promise<void>;
  remove: (id: string) => Promise<void>;
  uploadLogo: (id: string, file: File) => Promise<void>;
  removeLogo: (id: string) => Promise<void>;
  addContact: (id: string, data: CreateContactDto) => Promise<void>;
  updateContact: (
    id: string,
    contactId: string,
    data: UpdateContactDto
  ) => Promise<void>;
  removeContact: (id: string, contactId: string) => Promise<void>;
  updateCrmProfile: (
    id: string,
    data: Partial<ClientCrmProfile>
  ) => Promise<void>;
  setFilters: (f: Partial<ClientFilters>) => void;
  fetchNotes: (clientId: string) => Promise<void>;
  addNote: (clientId: string, data: CreateNoteDto) => Promise<void>;
  updateNote: (
    clientId: string,
    noteId: string,
    data: UpdateNoteDto
  ) => Promise<void>;
  deleteNote: (clientId: string, noteId: string) => Promise<void>;
  reset: () => void;
  _patch: (client: Client) => void;
  _remove: (id: string) => void;
}
