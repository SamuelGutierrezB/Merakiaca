import { create } from "zustand";
import type { User } from "@/types";
import {
  signInWithGoogle,
  signOut,
  getUserData,
  onAuthChange,
} from "@/services/auth.service";

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  signIn: async () => {
    set({ loading: true, error: null });
    try {
      const user = await signInWithGoogle();
      set({ user, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Error al iniciar sesión",
        loading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut();
      set({ user: null, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Error al cerrar sesión",
        loading: false,
      });
      throw error;
    }
  },

  initAuth: () => {
    set({ loading: true });

    onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado, obtener datos de Firestore
        const userData = await getUserData(firebaseUser.uid);
        set({ user: userData, loading: false, initialized: true });
      } else {
        // No hay usuario autenticado
        set({ user: null, loading: false, initialized: true });
      }
    });
  },

  isAdmin: () => {
    const { user } = get();
    return user?.role === "admin";
  },
}));
