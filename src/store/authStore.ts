import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (nameInput: string, passwordInput: string) => Promise<void>;
  logout: () => Promise<void>;
  initSession: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (nameInput: string, passwordInput: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.loginByNameAndPassword(nameInput, passwordInput);
      set({ currentUser: user, isAuthenticated: true, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await authService.logout();
    set({ currentUser: null, isAuthenticated: false, isLoading: false });
  },

  initSession: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getSession();
      if (user) {
        set({ currentUser: user, isAuthenticated: true, isLoading: false });
      } else {
        set({ currentUser: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ currentUser: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set({ isLoading: true, error: null });
    try {
      const updated = await authService.updateProfile(currentUser.uid, updates);
      set({ currentUser: updated, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
