import type {
  CreateUserDto,
  UpdateUserDto,
  User,
  UserFilters,
} from '../types';

export interface UserState {
  items: User[];
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
}

export interface UserActions {
  fetch: (params?: UserFilters) => Promise<void>;
  create: (data: CreateUserDto) => Promise<User>;
  update: (id: string, data: UpdateUserDto) => Promise<void>;
  updateMe: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<User>;
  uploadAvatar: (file: File) => Promise<User>;
  remove: (id: string) => Promise<void>;
  provisionClient: (clientId: string) => Promise<User>;
  provisionVA: (candidateId: string) => Promise<User>;
  revokeCrmAccess: (userId: string) => Promise<User>;
  reset: () => void;
  _patch: (user: User) => void;
  _remove: (id: string) => void;
}
