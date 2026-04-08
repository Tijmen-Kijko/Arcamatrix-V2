import { useEffect, useRef, useState } from 'react';
import { useWorkspaceLayout } from '../hooks/useWorkspaceLayout';
import { usePreviewHtml } from '../hooks/useWorkspaceLayout';
import './PreviewPanel.css';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEBOUNCE_MS = 400;

const deviceIcons = {
  desktop: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  tablet: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="18" r="1" />
    </svg>
  ),
  mobile: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
};

const refreshIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const closeIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const expandIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const externalIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export function PreviewPanel() {
  const { closeSplitView } = useWorkspaceLayout();
  const previewHtml = usePreviewHtml();

  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [url, setUrl] = useState('/');
  const [iframeKey, setIframeKey] = useState(0);

  // Debounced srcdoc — only update iframe every 400ms
  const [debouncedHtml, setDebouncedHtml] = useState<string | null>(null);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (previewHtml === null) {
      setDebouncedHtml(null);
      return;
    }

    if (debounceTimer.current !== null) {
      window.clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(() => {
      setDebouncedHtml(previewHtml);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, [previewHtml]);

  const handleRefresh = () => setIframeKey((k) => k + 1);

  const hasContent = debouncedHtml !== null;

  return (
    <div className="preview-panel">
      {/* Toolbar */}
      <div className="preview-toolbar">
        <button className="preview-tool-btn" onClick={handleRefresh} title="Refresh">
          {refreshIcon}
        </button>

        <div className="preview-url-bar">
          <span className="preview-url-prefix">/</span>
          <input
            className="preview-url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="preview-device-group">
          {(Object.keys(deviceIcons) as DeviceMode[]).map((mode) => (
            <button
              key={mode}
              className={`preview-device-btn${device === mode ? ' active' : ''}`}
              onClick={() => setDevice(mode)}
              title={mode}
            >
              {deviceIcons[mode]}
            </button>
          ))}
        </div>

        <button className="preview-tool-btn" title="Fullscreen">
          {expandIcon}
        </button>
        <button className="preview-tool-btn" title="Open in new tab">
          {externalIcon}
        </button>

        {/* Close split view */}
        <button
          className="preview-tool-btn preview-close-btn"
          onClick={closeSplitView}
          title="Sluit preview"
        >
          {closeIcon}
        </button>
      </div>

      {/* Preview frame */}
      <div className={`preview-viewport device-${device}`}>
        <div className="preview-iframe-wrap">
          {hasContent ? (
            <iframe
              key={iframeKey}
              className="preview-iframe"
              title="Preview"
              srcDoc={debouncedHtml ?? undefined}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <>
              {/* Skeleton loader while waiting for first output */}
              <div className="preview-skeleton">
                <div className="skeleton-bar skeleton-bar-lg" />
                <div className="skeleton-bar skeleton-bar-md" />
                <div className="skeleton-bar skeleton-bar-sm" />
                <div className="skeleton-block" />
                <div className="skeleton-bar skeleton-bar-md" />
              </div>

              {/* Empty state overlay */}
              <div className="preview-empty">
                <div className="preview-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                </div>
                <p className="preview-empty-title">Preview wordt geladen...</p>
                <p className="preview-empty-sub">
                  Arcamatrix is aan het bouwen. De live preview verschijnt hier zodra de eerste output binnenkomt.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
