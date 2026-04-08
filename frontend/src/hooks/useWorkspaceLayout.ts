import { useWorkspaceLayoutStore } from '../stores/workspaceLayoutStore';

export const useWorkspaceLayout = () =>
  useWorkspaceLayoutStore((s) => ({
    layout: s.layout,
    setSplitView: s.setSplitView,
    closeSplitView: s.closeSplitView,
  }));

export const useIsSplitView = () =>
  useWorkspaceLayoutStore((s) => s.layout === 'split-view');

export const usePreviewHtml = () =>
  useWorkspaceLayoutStore((s) => s.previewHtml);

export const useUpdatePreview = () =>
  useWorkspaceLayoutStore((s) => s.updatePreview);
