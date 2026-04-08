import { create } from 'zustand';

type WorkspaceLayout = 'chat-only' | 'split-view';

interface WorkspaceLayoutState {
  layout: WorkspaceLayout;
  previewHtml: string | null;
  setSplitView: () => void;
  closeSplitView: () => void;
  updatePreview: (html: string) => void;
}

export const useWorkspaceLayoutStore = create<WorkspaceLayoutState>((set) => ({
  layout: 'chat-only',
  previewHtml: null,

  setSplitView: () => set({ layout: 'split-view' }),

  closeSplitView: () => set({ layout: 'chat-only', previewHtml: null }),

  updatePreview: (html) => set({ previewHtml: html }),
}));
