import { useState, useEffect } from 'react';
import './SettingsModal.css';

export type SettingsTab = 'account' | 'api';

interface SettingsModalProps {
  open: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
}

/* ─── Icons ─── */
const icons = {
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  user: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  key: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
};

export function SettingsModal({ open, initialTab = 'account', onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Sync tab when modal opens with a specific tab
  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose}>
            {icons.close}
          </button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab${activeTab === 'account' ? ' active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            {icons.user}
            Account &amp; Billing
          </button>
          <button
            className={`settings-tab${activeTab === 'api' ? ' active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            {icons.key}
            API
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeTab === 'account' && (
            <div className="settings-placeholder">
              <div className="placeholder-icon">{icons.user}</div>
              <p className="placeholder-title">Account &amp; Billing</p>
              <p className="placeholder-sub">Manage your account details, subscription, and billing preferences.</p>
            </div>
          )}
          {activeTab === 'api' && (
            <div className="settings-placeholder">
              <div className="placeholder-icon">{icons.key}</div>
              <p className="placeholder-title">API</p>
              <p className="placeholder-sub">View and manage your API keys, usage limits, and integration settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
