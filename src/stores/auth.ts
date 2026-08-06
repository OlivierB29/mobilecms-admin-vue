import { defineStore } from 'pinia';

interface UserSession {
  token?: string;
  name?: string;
  role?: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserSession | null,
    token: '' as string
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token || state.user?.token)
  },
  actions: {
    setSession(session: UserSession, jwt: string) {
      this.user = session;
      this.token = jwt;
      localStorage.setItem('currentUser', JSON.stringify({ ...session, token: jwt }));
    },
    restoreSession() {
      const raw = localStorage.getItem('currentUser');
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as UserSession & { token?: string };
        this.user = parsed;
        this.token = parsed.token || '';
      } catch {
        this.clearSession();
      }
    },
    clearSession() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('currentUser');
    }
  }
});
