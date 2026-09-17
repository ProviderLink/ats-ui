import {
  getAuthToken,
  onUnauthorized,
  postJson,
  postJsonPublic,
  postJsonSilent,
  resetRefreshState,
  setAuthToken,
} from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { socketManager } from '../realtime/socket';
import type { User, UserPermissions } from '../types';
import type { AppAccess, UserRole } from '../types/enums';

interface AuthState {
  user: Pick<
    User,
    | '_id'
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'avatar'
    | 'roles'
    | 'appAccess'
    | 'permissions'
  > | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  setUser: (user: AuthState['user']) => void;
  setToken: (token: string) => void;
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  loading: false,
  error: null,
};

// Backend returns `id` + `roles` (array)
interface BackendAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  appAccess?: string[];
  phone?: string;
  avatar?: string | null;
  permissions?: UserPermissions;
  isActive: boolean;
  emailVerified: boolean;
}

function mapAuthUser(u: BackendAuthUser): AuthState['user'] {
  return {
    _id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    roles: (u.roles ?? []) as UserRole[],
    appAccess: (u.appAccess ?? []) as AppAccess[],
    phone: u.phone,
    avatar: u.avatar ?? null,
    permissions: u.permissions,
  };
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer(set => ({
      ...initialState,

      login: async (email, password) => {
        resetRefreshState();
        set(s => {
          s.loading = true;
          s.error = null;
        });
        try {
          const res = await postJsonSilent<{
            user: BackendAuthUser;
            accessToken: string;
          }>('/auth/login', { email, password });
          setAuthToken(res.accessToken);
          // Open the real-time socket now that we have a valid token.
          socketManager.reconnect();
          set(s => {
            s.user = mapAuthUser(res.user);
            s.isAuthenticated = true;
            s.isInitialized = true;
            s.loading = false;
          });
        } catch (e) {
          set(s => {
            s.loading = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      logout: async () => {
        // Tear down the real-time socket before clearing the token so the
        // server sees a clean close rather than an auth failure.
        socketManager.disconnect();
        try {
          await postJson('/auth/logout', {});
        } finally {
          setAuthToken(null);
          set(s => {
            Object.assign(s, initialState);
            s.isInitialized = true;
          });
          // Reset the boot state so next login triggers a fresh data load.
          // Dynamic import avoids a circular dependency with boot-data.ts.
          import('@/lib/boot-data').then(m => m.resetBoot()).catch(() => {});
          // Clear the persisted dashboard store so the next user never sees
          // the previous user's cached dashboard data.
          import('@/store/slices/dashboard.store')
            .then(m => m.useDashboardStore.getState().reset())
            .catch(() => {});
        }
      },

      forgotPassword: async email => {
        await postJsonPublic('/auth/forgot-password', { email });
      },

      resetPassword: async (token, password) => {
        await postJsonPublic('/auth/reset-password', { token, password });
      },

      verifyEmail: async token => {
        await postJsonPublic('/auth/verify-email', { token });
      },

      changePassword: async (currentPassword, newPassword) => {
        await postJson('/auth/change-password', {
          currentPassword,
          newPassword,
        });
      },

      setUser: user =>
        set(s => {
          s.user = user;
          s.isAuthenticated = !!user;
        }),

      setToken: token => setAuthToken(token),

      reset: () => {
        setAuthToken(null);
        set(s => {
          Object.assign(s, initialState);
          s.isInitialized = true;
        });
      },
    })),
    {
      name: 'ats-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist non-sensitive user info — token stays in memory
      partialize: s => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);

// Global 401 handler — clear session only if there's no token (avoids logout on failed login)
onUnauthorized(() => {
  if (!getAuthToken()) useAuthStore.getState().reset();
});

// Initialize auth after Zustand persist hydration completes (Zustand v5 compatible)
async function runAuthInit() {
  const { isAuthenticated, user } = useAuthStore.getState();

  // Detect stale persisted data (e.g. from a previous schema where roles was wrong).
  // If the user object exists but has no valid roles, treat as unauthenticated so the
  // user is forced to log in fresh and get a clean session.
  const hasValidUser =
    user !== null &&
    Array.isArray(user.roles) &&
    user.roles.length > 0 &&
    user.roles.every(r => typeof r === 'string' && r.length > 0);

  if (isAuthenticated && hasValidUser) {
    try {
      const res = await postJsonSilent<{ accessToken: string }>(
        '/auth/refresh-token',
        {}
      );
      setAuthToken(res.accessToken);
      // Re-establish real-time updates after a successful silent refresh.
      socketManager.reconnect();
      useAuthStore.setState({ isInitialized: true });
    } catch {
      socketManager.disconnect();
      setAuthToken(null);
      useAuthStore.setState({ ...initialState, isInitialized: true });
    }
  } else {
    // No session or stale data — clear and redirect to login
    socketManager.disconnect();
    setAuthToken(null);
    useAuthStore.setState({ ...initialState, isInitialized: true });
  }
}

if (useAuthStore.persist.hasHydrated()) {
  runAuthInit();
} else {
  const unsub = useAuthStore.persist.onFinishHydration(() => {
    unsub();
    runAuthInit();
  });
}

export function getAuthUser() {
  return useAuthStore.getState().user;
}
