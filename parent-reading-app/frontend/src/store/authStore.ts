/**
 * 认证状态管理 (Zustand)
 */
import { create } from 'zustand';

interface User {
  userId: string;
  phone: string;
  nickname: string;
  avatarUrl: string | null;
  subscriptionType: string;
}

interface AuthState {
  isLoggedIn: boolean;
  currentMode: 'parent' | 'child';
  user: User | null;
  token: string | null;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  switchMode: (mode: 'parent' | 'child') => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  currentMode: 'parent',
  user: null,
  token: null,

  login: (user, token) =>
    set({ isLoggedIn: true, user, token }),

  logout: () =>
    set({ isLoggedIn: false, user: null, token: null, currentMode: 'parent' }),

  switchMode: (mode) =>
    set({ currentMode: mode }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));
