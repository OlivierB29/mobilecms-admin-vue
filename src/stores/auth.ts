import { reactive } from 'vue';

interface UserSession {
  token?: string;
  name?: string;
  role?: string;
}

interface AuthState {
  user: UserSession | null;
  token: string;
}

function getRoleFromJwt(jwt: string): string | undefined {
  if (!jwt) return undefined;

  const parts = jwt.split('.');
  if (parts.length < 2) return undefined;

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(atob(normalized));
    return typeof decoded?.role === 'string' ? decoded.role : undefined;
  } catch {
    return undefined;
  }
}

const state = reactive<AuthState>({
  user: null,
  token: ''
});

export function useAuthStore() {
  return {
    get user() {
      return state.user;
    },
    get token() {
      return state.token;
    },
    get role() {
      return state.user?.role || getRoleFromJwt(state.token) || '';
    },
    get isAuthenticated() {
      return Boolean(state.token || state.user?.token);
    },
    get isAdmin() {
      return this.role === 'admin';
    },
    setSession(session: UserSession, jwt: string) {
      state.user = {
        ...session,
        role: session.role || getRoleFromJwt(jwt) || 'editor'
      };
      state.token = jwt;
      localStorage.setItem('currentUser', JSON.stringify({ ...state.user, token: jwt }));
    },
    restoreSession() {
      const raw = localStorage.getItem('currentUser');
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as UserSession & { token?: string };
        state.user = {
          ...parsed,
          role: parsed.role || getRoleFromJwt(parsed.token || '') || 'editor'
        };
        state.token = parsed.token || '';
      } catch {
        this.clearSession();
      }
    },
    clearSession() {
      state.user = null;
      state.token = '';
      localStorage.removeItem('currentUser');
    }
  };
}

export const authStore = useAuthStore();
export default authStore;
