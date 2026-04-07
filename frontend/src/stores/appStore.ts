import { create } from 'zustand';

type AppPhase = 'landing' | 'transitioning' | 'workspace';
type MorphState = 'send' | 'morphing' | 'cta' | 'reset';

interface AppState {
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;
  morphState: MorphState;
  setMorphState: (state: MorphState) => void;
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'landing',
  setPhase: (phase) => set({ phase }),
  morphState: 'send',
  setMorphState: (morphState) => set({ morphState }),
}));
