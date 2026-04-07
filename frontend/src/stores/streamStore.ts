import { create } from 'zustand';
import type { TokenBudgetTier, TokenStatusResponse } from '../services/streamApi';

export type StreamStatus =
  | 'idle'
  | 'streaming'
  | 'done'
  | 'error'
  | 'budget-exhausted';

const DEFAULT_TOKEN_LIMIT = 5_000;

interface StreamState {
  status: StreamStatus;
  sessionId: string | null;
  isDemoComplete: boolean;
  firstResponseReceived: boolean;
  error: string | null;
  usedTokens: number;
  tokenLimit: number | null;
  budgetTier: TokenBudgetTier;
  resetsAt: string | null;
  budgetExhausted: boolean;
  upgradePrompt: string | null;
  setStatus: (status: StreamStatus) => void;
  setSessionId: (id: string | null) => void;
  setDemoComplete: (complete: boolean) => void;
  setFirstResponseReceived: () => void;
  setError: (error: string | null) => void;
  setUsage: (used: number, limit: number | null) => void;
  setBudgetStatus: (status: TokenStatusResponse) => void;
  setBudgetExhausted: (prompt: string | null) => void;
  reset: () => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  status: 'idle',
  sessionId: null,
  isDemoComplete: false,
  firstResponseReceived: false,
  error: null,
  usedTokens: 0,
  tokenLimit: DEFAULT_TOKEN_LIMIT,
  budgetTier: 'sandbox',
  resetsAt: null,
  budgetExhausted: false,
  upgradePrompt: null,
  setStatus: (status) => set({ status }),
  setSessionId: (sessionId) => set({ sessionId }),
  setDemoComplete: (isDemoComplete) => set({ isDemoComplete }),
  setFirstResponseReceived: () => set({ firstResponseReceived: true }),
  setError: (error) => set({ error, status: 'error' }),
  setUsage: (usedTokens, tokenLimit) =>
    set({ usedTokens, tokenLimit, budgetExhausted: false, upgradePrompt: null }),
  setBudgetStatus: (budgetStatus) =>
    set({
      usedTokens: budgetStatus.used,
      tokenLimit: budgetStatus.limit,
      budgetTier: budgetStatus.tier,
      resetsAt: budgetStatus.resets_at,
      budgetExhausted: budgetStatus.exhausted,
      upgradePrompt: budgetStatus.upgrade_prompt,
    }),
  setBudgetExhausted: (upgradePrompt) =>
    set({
      status: 'budget-exhausted',
      budgetExhausted: true,
      upgradePrompt,
    }),
  reset: () =>
    set({
      status: 'idle',
      sessionId: null,
      isDemoComplete: false,
      firstResponseReceived: false,
      error: null,
      usedTokens: 0,
      tokenLimit: DEFAULT_TOKEN_LIMIT,
      budgetTier: 'sandbox',
      resetsAt: null,
      budgetExhausted: false,
      upgradePrompt: null,
    }),
}));
