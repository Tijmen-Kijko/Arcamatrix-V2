import { useAuthStore } from '../stores/authStore';

export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useAuthSession = () => useAuthStore((state) => state.session);
export const usePendingMagicLinkEmail = () =>
  useAuthStore((state) => state.pendingEmail);
export const usePendingMagicLinkToken = () =>
  useAuthStore((state) => state.pendingMagicLinkToken);

export const useSignInWithGoogle = () =>
  useAuthStore((state) => state.signInWithGoogle);
export const useStartMagicLink = () =>
  useAuthStore((state) => state.startMagicLink);
export const useVerifyMagicLink = () =>
  useAuthStore((state) => state.verifyMagicLink);
export const useResetMagicLink = () =>
  useAuthStore((state) => state.resetMagicLink);
