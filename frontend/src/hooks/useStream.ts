import { useStreamStore } from '../stores/streamStore';

export const useStreamStatus = () => useStreamStore((s) => s.status);
export const useIsDemoComplete = () => useStreamStore((s) => s.isDemoComplete);
export const useStreamError = () => useStreamStore((s) => s.error);
export const useStreamSessionId = () => useStreamStore((s) => s.sessionId);
export const useStreamUsedTokens = () => useStreamStore((s) => s.usedTokens);
export const useStreamTokenLimit = () => useStreamStore((s) => s.tokenLimit);
export const useStreamBudgetTier = () => useStreamStore((s) => s.budgetTier);
export const useStreamBudgetResetAt = () => useStreamStore((s) => s.resetsAt);
export const useIsBudgetExhausted = () => useStreamStore((s) => s.budgetExhausted);
export const useStreamUpgradePrompt = () => useStreamStore((s) => s.upgradePrompt);
