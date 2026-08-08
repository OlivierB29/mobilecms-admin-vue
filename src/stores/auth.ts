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
    get isAuthenticated() {
      return Boolean(state.token || state.user?.token);
    },
    setSession(session: UserSession, jwt: string) {
      state.user = session;
      state.token = jwt;
      localStorage.setItem('currentUser', JSON.stringify({ ...session, token: jwt }));
    },
    restoreSession() {
      const raw = localStorage.getItem('currentUser');
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as UserSession & { token?: string };
        state.user = parsed;
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
