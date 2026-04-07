import { create } from 'zustand';
import {
  peekMagicLinkToken,
  postAuthEmailStart,
  postAuthEmailVerify,
  postAuthGoogle,
  type AuthSuccessResponse,
} from '../services/authApi';

export type AuthStatus =
  | 'idle'
  | 'submitting'
  | 'magic-link-sent'
  | 'authenticated'
  | 'error';

interface AuthState {
  status: AuthStatus;
  error: string | null;
  session: AuthSuccessResponse | null;
  pendingEmail: string | null;
  pendingMagicLinkToken: string | null;
  signInWithGoogle: (emailHint?: string) => Promise<AuthSuccessResponse>;
  startMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: () => Promise<AuthSuccessResponse>;
  resetMagicLink: () => void;
}

const GOOGLE_DEMO_EMAIL = 'founder@arcamatrix.ai';

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  error: null,
  session: null,
  pendingEmail: null,
  pendingMagicLinkToken: null,

  signInWithGoogle: async (emailHint) => {
    set({ status: 'submitting', error: null });

    try {
      const session = await postAuthGoogle({
        id_token: emailHint?.trim() || GOOGLE_DEMO_EMAIL,
      });

      set({
        status: 'authenticated',
        error: null,
        session,
        pendingEmail: null,
        pendingMagicLinkToken: null,
      });

      return session;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Google sign-in is mislukt.';

      set({ status: 'error', error: message });
      throw error;
    }
  },

  startMagicLink: async (email) => {
    set({ status: 'submitting', error: null });

    try {
      await postAuthEmailStart({ email });

      set({
        status: 'magic-link-sent',
        error: null,
        pendingEmail: email.trim().toLowerCase(),
        pendingMagicLinkToken: peekMagicLinkToken(email),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Magic link versturen is mislukt.';

      set({ status: 'error', error: message });
      throw error;
    }
  },

  verifyMagicLink: async () => {
    const token = get().pendingMagicLinkToken;

    if (!token) {
      const error = new Error('Er is nog geen magic link om te verifiëren.');
      set({ status: 'error', error: error.message });
      throw error;
    }

    set({ status: 'submitting', error: null });

    try {
      const session = await postAuthEmailVerify({ token });

      set({
        status: 'authenticated',
        error: null,
        session,
        pendingEmail: null,
        pendingMagicLinkToken: null,
      });

      return session;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Magic link verifiëren is mislukt.';

      set({ status: 'magic-link-sent', error: message });
      throw error;
    }
  },

  resetMagicLink: () => {
    set({
      status: 'idle',
      error: null,
      pendingEmail: null,
      pendingMagicLinkToken: null,
    });
  },
}));
