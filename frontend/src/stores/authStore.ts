import { create } from 'zustand';
import {
  createDevAuthSession,
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
  isDevBypass: boolean;
  bootstrapDevBypass: (emailHint?: string) => AuthSuccessResponse;
  signInWithGoogle: (emailHint?: string) => Promise<AuthSuccessResponse>;
  startMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: () => Promise<AuthSuccessResponse>;
  resetMagicLink: () => void;
}

const GOOGLE_DEMO_EMAIL = 'founder@arcamatrix.ai';
const DEV_BYPASS_STORAGE_KEY = 'arcamatrix.dev-auth-session';
const DEV_AUTH_BYPASS_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS !== 'false';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredDevSession() {
  if (!DEV_AUTH_BYPASS_ENABLED) {
    return null;
  }

  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(DEV_BYPASS_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSuccessResponse;
  } catch {
    window.localStorage.removeItem(DEV_BYPASS_STORAGE_KEY);
    return null;
  }
}

function persistDevSession(session: AuthSuccessResponse) {
  if (!DEV_AUTH_BYPASS_ENABLED) {
    return;
  }

  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(DEV_BYPASS_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredDevSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(DEV_BYPASS_STORAGE_KEY);
}

const storedDevSession = readStoredDevSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  status: storedDevSession ? 'authenticated' : 'idle',
  error: null,
  session: storedDevSession,
  pendingEmail: null,
  pendingMagicLinkToken: null,
  isDevBypass: Boolean(storedDevSession),

  bootstrapDevBypass: (emailHint) => {
    if (!DEV_AUTH_BYPASS_ENABLED) {
      throw new Error('Dev auth bypass is disabled for this environment.');
    }

    const session = createDevAuthSession({ email: emailHint });
    persistDevSession(session);

    set({
      status: 'authenticated',
      error: null,
      session,
      pendingEmail: null,
      pendingMagicLinkToken: null,
      isDevBypass: true,
    });

    return session;
  },

  signInWithGoogle: async (emailHint) => {
    set({ status: 'submitting', error: null });

    try {
      const session = await postAuthGoogle({
        id_token: emailHint?.trim() || GOOGLE_DEMO_EMAIL,
      });

      clearStoredDevSession();

      set({
        status: 'authenticated',
        error: null,
        session,
        pendingEmail: null,
        pendingMagicLinkToken: null,
        isDevBypass: false,
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

      clearStoredDevSession();

      set({
        status: 'authenticated',
        error: null,
        session,
        pendingEmail: null,
        pendingMagicLinkToken: null,
        isDevBypass: false,
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
      isDevBypass: false,
    });
  },
}));
