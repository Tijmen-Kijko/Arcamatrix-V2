import { useAppStore } from '../stores/appStore';

export const useAppPhase = () => useAppStore((s) => s.phase);
export const useSetAppPhase = () => useAppStore((s) => s.setPhase);

export const useMorphState = () => useAppStore((s) => s.morphState);
export const useSetMorphState = () => useAppStore((s) => s.setMorphState);

export const useSandboxPhase = () => useAppStore((s) => s.sandboxPhase);
export const useSetSandboxPhase = () => useAppStore((s) => s.setSandboxPhase);
