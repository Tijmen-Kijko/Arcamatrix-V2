import { create } from 'zustand';

type AppPhase = 'landing' | 'transitioning' | 'workspace';
type MorphState = 'send' | 'morphing' | 'cta' | 'reset';
type SandboxPhase = 'loading' | 'active' | 'budget_warning' | 'promote_prompt' | 'workspace';
type ActiveView = 'chat' | 'secrets' | 'integrations' | 'skills';

interface AppState {
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;
  morphState: MorphState;
  setMorphState: (state: MorphState) => void;
  sandboxPhase: SandboxPhase;
  setSandboxPhase: (phase: SandboxPhase) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'landing',
  setPhase: (phase) => set({ phase }),
  morphState: 'send',
  setMorphState: (morphState) => set({ morphState }),
  sandboxPhase: 'loading',
  setSandboxPhase: (sandboxPhase) => set({ sandboxPhase }),
  activeView: 'chat',
  setActiveView: (activeView) => set({ activeView }),
}));
