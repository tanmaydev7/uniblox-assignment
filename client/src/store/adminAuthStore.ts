import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
  id: number;
  username: string;
}

interface AdminAuthStore {
  token: string | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, admin: AdminUser) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      setAuth: (token, admin) => {
        set({ token, admin, isAuthenticated: true });
        // Also store token in localStorage for axios interceptor
        localStorage.setItem('adminToken', token);
      },
      logout: () => {
        set({ token: null, admin: null, isAuthenticated: false });
        localStorage.removeItem('adminToken');
      },
    }),
    {
      name: 'admin-auth-storage',
      onRehydrateStorage: () => (state) => {
        // Sync isAuthenticated with token presence
        if (state) {
          state.isAuthenticated = !!state.token;
          // Ensure token is in localStorage for axios interceptor
          if (state.token) {
            localStorage.setItem('adminToken', state.token);
          }
        }
      },
    }
  )
);

