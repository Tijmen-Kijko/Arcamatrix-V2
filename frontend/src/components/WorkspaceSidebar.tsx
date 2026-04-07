import { useState } from 'react';
import { useAppPhase } from '../hooks/useAppPhase';
import { useAuthSession, useIsDevBypass } from '../hooks/useAuth';
import './WorkspaceSidebar.css';

type NavKey = 'chat' | 'brain' | 'tasks' | 'files' | 'settings';

interface NavItem {
  key: NavKey;
  label: string;
  meta?: string;
  hasChevron?: boolean;
}

const navItems: NavItem[] = [
  { key: 'chat', label: 'Chat' },
  {
    key: 'brain',
    label: 'Brain',
    meta: 'Tools · Knowledge · Memory',
    hasChevron: true,
  },
  { key: 'tasks', label: 'Tasks' },
  { key: 'files', label: 'Files' },
  { key: 'settings', label: 'Settings', hasChevron: true },
];

const channelItems = [
  {
    key: 'whatsapp',
    label: 'Continue on WhatsApp',
    brandClassName: 'sb-channel-icon whatsapp',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z"
          fill="currentColor"
        />
        <path
          d="M12 0C5.373 0 0 5.373 0 12c0 2.17.578 4.2 1.586 5.951L0 24l6.262-1.567A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0Zm0 21.818a9.817 9.817 0 0 1-5.001-1.369l-.36-.214-3.717.93.972-3.618-.234-.371A9.818 9.818 0 1 1 12 21.818Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: 'telegram',
    label: 'Continue on Telegram',
    brandClassName: 'sb-channel-icon telegram',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L3 7V12C3 16.97 7.02 21.61 12 22.93C16.98 21.61 21 16.97 21 12V7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11.5 14.5L15.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <polyline
        points="12 6 12 12 16 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilesIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconForNavItem(key: NavKey) {
  switch (key) {
    case 'chat':
      return <ChatIcon />;
    case 'brain':
      return <BrainIcon />;
    case 'tasks':
      return <TasksIcon />;
    case 'files':
      return <FilesIcon />;
    case 'settings':
      return <SettingsIcon />;
    default:
      return null;
  }
}

export function WorkspaceSidebar() {
  const phase = useAppPhase();
  const authSession = useAuthSession();
  const isDevBypass = useIsDevBypass();
  const [activeItem, setActiveItem] = useState<NavKey>('chat');

  return (
    <div className={`sidebar-view ${phase === 'workspace' ? 'visible' : ''}`}>
      <div className="sb-logo">
        <div className="sb-logo-icon">
          <ShieldIcon />
        </div>
        <div className="sb-logo-text">
          <div className="sb-logo-name">Arcamatrix</div>
          <div className="sb-logo-ws">My Workspace</div>
        </div>
      </div>

      {authSession && (
        <div className="sb-session-card">
          {isDevBypass && <div className="sb-dev-badge">DEV BYPASS</div>}
          <div className="sb-session-label">{authSession.user.email}</div>
          <div className="sb-session-copy">
            {isDevBypass
              ? 'Local dev bypass active, backend auth skipped'
              : `Signed in via ${authSession.user.auth_provider}`}
          </div>
        </div>
      )}

      <nav className="sb-nav" aria-label="Workspace navigation">
        {navItems.map((item) => {
          const isActive = item.key === activeItem;

          return (
            <button
              key={item.key}
              type="button"
              className={`sb-item${isActive ? ' active' : ''}`}
              onClick={() => setActiveItem(item.key)}
            >
              <span className="sb-item-icon">{iconForNavItem(item.key)}</span>
              <span className="sb-item-copy">
                <span className="sb-item-label">{item.label}</span>
                {item.meta && <span className="sb-item-meta">{item.meta}</span>}
              </span>
              {item.hasChevron && (
                <span className="sb-item-chevron">
                  <ChevronIcon />
                </span>
              )}
            </button>
          );
        })}

        <div className="sb-section-label">Channels</div>

        {channelItems.map((channel) => (
          <button key={channel.key} type="button" className="sb-channel">
            <span className={channel.brandClassName}>{channel.icon}</span>
            <span>{channel.label}</span>
          </button>
        ))}
      </nav>

      <div className="sb-bottom">
        <button type="button" className="sb-feedback">
          <ChatIcon />
          <span>Leave feedback</span>
        </button>
      </div>
    </div>
  );
}
