import { useState, useCallback } from 'react';
import { useAppPhase } from '../hooks/useAppPhase';
import { useAuthSession } from '../hooks/useAuth';
import { useIsSplitView } from '../hooks/useWorkspaceLayout';
import { useWorkspaceLayoutStore } from '../stores/workspaceLayoutStore';
import { useMessageStore } from '../stores/messageStore';
import { useProjectStore } from '../stores/projectStore';
import { useProjects } from '../hooks/useProjects';
import { SettingsModal, type SettingsTab } from './SettingsModal';
import './WorkspaceSidebar.css';

export type WorkspaceView = 'chat' | 'tasks' | 'integrations' | 'skills' | 'secrets' | 'projects';

/* ─── Collapsible group helper ─── */
function useToggle(initial = false) {
  const [open, setOpen] = useState(initial);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  return [open, toggle] as const;
}

/* ─── SVG Icons (inline, no library) ─── */
const icons = {
  plus: (w = 13) => (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
  ),
  chevron: (w = 12) => (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
  ),
  tools: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
  ),
  integrations: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>
  ),
  skills: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
  ),
  lock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  ),
  dailyTasks: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12l2 2 4-4" /></svg>
  ),
  list: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
  ),
  file: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
  ),
  chat: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  folder: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
  ),
  phone: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.44a16 16 0 0 0 5.61 5.61l.5-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  ),
  whatsapp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  ),
  telegram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#26A5E4"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0 12 12 0 0011.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  ),
  user: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  link: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
  ),
  logout: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
  ),
};

/* ─── Static data (placeholder) ─── */
const dailyChats = [
  { id: 'dc1', title: 'Email automation setup', date: 'nu', active: true },
  { id: 'dc2', title: 'Weekly report draft', date: 'gis' },
  { id: 'dc3', title: 'Agenda sync & planning', date: 'ma' },
];

/* Project colors – deterministic based on index */
const PROJECT_COLORS = ['#5ca85c', '#4d8fcc', '#cc8f4d', '#a85ca8', '#cc4d4d', '#4dcca8'];

/* ─── Sub-components ─── */

function NavGroupHeader({
  icon,
  label,
  open,
  onToggle,
  badge,
  addButton,
  onAdd,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  badge?: number;
  addButton?: boolean;
  onAdd?: () => void;
}) {
  return (
    <div
      className={`nav-group-header${open ? ' open' : ''}`}
      onClick={onToggle}
    >
      <span className="group-icon">{icon}</span>
      <span className="group-label">{label}</span>
      {badge !== undefined && <span className="group-badge">{badge}</span>}
      {addButton && (
        <span className="add-btn" onClick={(e) => { e.stopPropagation(); onAdd?.(); }}>
          {icons.plus(11)}
        </span>
      )}
      <span className="chevron">{icons.chevron()}</span>
    </div>
  );
}

function ProjectGroup({ project, color, onNavigate }: { project: { id: string; name: string }; color: string; onNavigate?: (view: WorkspaceView) => void }) {
  const [open, toggle] = useToggle(false);
  const isSplit = useIsSplitView();
  const setSplitView = useWorkspaceLayoutStore((s) => s.setSplitView);
  const updatePreview = useWorkspaceLayoutStore((s) => s.updatePreview);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate?.('chat');
    updatePreview(
      `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#0f0d0b;color:#e8e0d4;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}
.wrap{max-width:360px;padding:24px}
.icon{width:48px;height:48px;margin:0 auto 16px;border-radius:12px;background:${color}22;display:flex;align-items:center;justify-content:center}
.icon svg{stroke:${color};width:24px;height:24px}
h2{font-size:15px;font-weight:600;margin-bottom:6px;color:#e8e0d4}
p{font-size:13px;color:#8a7e6e;line-height:1.5}
.tag{display:inline-block;margin-top:14px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:500;background:${color}18;color:${color}}
</style></head>
<body><div class="wrap">
<div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg></div>
<h2>${project.name}</h2>
<p>Preview klaar — zodra Arcamatrix output genereert verschijnt de live preview hier.</p>
<span class="tag">Wacht op build…</span>
</div></body></html>`
    );
    setSplitView();
  };

  return (
    <div className="project-group">
      <div className={`project-header${open ? ' open' : ''}`} onClick={toggle}>
        <div className="proj-dot" style={{ background: color }} />
        <span className="proj-name">{project.name}</span>
        {!isSplit && (
          <span className="proj-preview-btn" onClick={handlePreview} title="Open preview">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </span>
        )}
        <span className="chevron">{icons.chevron(11)}</span>
      </div>
      <div className={`project-body${open ? ' open' : ''}`}>
        <div className="sub-item project-sub" onClick={(e) => {
          e.stopPropagation();
          useProjectStore.getState().setActiveProject(project.id);
          onNavigate?.('projects');
        }}>{icons.list} Task Board</div>
        <div className="sub-item project-sub">{icons.file} Files</div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export function WorkspaceSidebar({ activeView, onNavigate }: { activeView?: WorkspaceView; onNavigate?: (view: WorkspaceView) => void }) {
  const phase = useAppPhase();
  const authSession = useAuthSession();
  const storeProjects = useProjects();
  const [toolsOpen, toggleTools] = useToggle(false);
  const [dailyOpen, toggleDaily] = useToggle(true);
  const [projectsOpen, toggleProjects] = useToggle(false);

  const [footerOpen, setFooterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('account');
  const { clearMessages, addMessage } = useMessageStore();

  const handleAddProject = useCallback(() => {
    clearMessages();
    addMessage({
      id: `project-init-${Date.now()}`,
      type: 'ai-text',
      text: 'Wat voor soort project zou je willen starten?',
    });
    onNavigate?.('chat');
  }, [clearMessages, addMessage, onNavigate]);

  const userName = authSession?.user.display_name ?? 'User';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className={`sidebar ${phase === 'workspace' ? 'visible' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="workspace-avatar">A</div>
        <div>
          <span className="workspace-name">Arcamatrix</span>
          <span className="workspace-sub">My Workspace</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {/* New chat */}
        <div style={{ padding: '6px 8px 2px' }}>
          <button className="new-chat-btn" type="button" onClick={() => onNavigate?.('chat')}>
            {icons.plus(13)}
            New chat
          </button>
        </div>

        {/* Daily Tasks */}
        <div className="nav-group">
          <NavGroupHeader icon={icons.dailyTasks} label="Daily Tasks" open={dailyOpen} onToggle={toggleDaily} badge={3} />
          <div className={`nav-group-body${dailyOpen ? ' open' : ''}`}>
            <div className={`sub-item${activeView === 'tasks' ? ' active' : ''}`} onClick={() => onNavigate?.('tasks')}>{icons.list} Tasks</div>
            <div className="sub-item">{icons.file} Files</div>
            <div className="chat-history-label">Chats</div>
            {dailyChats.map((c) => (
              <div key={c.id} className={`chat-item${c.active ? ' active' : ''}`} onClick={() => onNavigate?.('chat')}>
                {icons.chat}
                <span className="chat-title">{c.title}</span>
                <span className="chat-date">{c.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="nav-divider" />

        {/* Projects */}
        <div className="nav-group">
          <NavGroupHeader icon={icons.folder} label="Projects" open={projectsOpen} onToggle={toggleProjects} addButton onAdd={handleAddProject} />
          <div className={`nav-group-body${projectsOpen ? ' open' : ''}`}>
            <div
              className={`sub-item${activeView === 'projects' ? ' active' : ''}`}
              onClick={() => {
                useProjectStore.getState().setActiveProject(null);
                onNavigate?.('projects');
              }}
            >
              {icons.list} All Projects
            </div>
            {storeProjects.map((p, i) => (
              <ProjectGroup key={p.id} project={p} color={PROJECT_COLORS[i % PROJECT_COLORS.length]} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        <div className="nav-divider" />

        {/* Tools */}
        <div className="nav-group">
          <NavGroupHeader icon={icons.tools} label="Tools" open={toolsOpen} onToggle={toggleTools} />
          <div className={`nav-group-body${toolsOpen ? ' open' : ''}`}>
            <div className={`sub-item${activeView === 'integrations' ? ' active' : ''}`} onClick={() => onNavigate?.('integrations')}>{icons.integrations} Integrations</div>
            <div className={`sub-item${activeView === 'skills' ? ' active' : ''}`} onClick={() => onNavigate?.('skills')}>{icons.skills} Skills</div>
          </div>
        </div>

        {/* Secrets */}
        <div
          className={`nav-item${activeView === 'secrets' ? ' active' : ''}`}
          onClick={() => onNavigate?.('secrets')}
        >
          {icons.lock}
          <span className="item-label">Secrets</span>
        </div>

      </nav>

      {/* Channels — always visible above footer */}
      <div className="channels-section">
        <div className="channels-label">Channels</div>
        <div className="channel-item">
          {icons.whatsapp}
          Continue on WhatsApp
        </div>
        <div className="channel-item">
          {icons.telegram}
          Continue on Telegram
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="footer-item" onClick={() => setFooterOpen((o) => !o)}>
          <div className="user-avatar">{userInitials}</div>
          <span className="user-name">{userName}</span>
          <span className={`chevron${footerOpen ? ' open' : ''}`}>{icons.chevron()}</span>
        </div>
        <div className={`footer-menu${footerOpen ? ' open' : ''}`}>
          <div className="footer-link" onClick={() => { setSettingsTab('account'); setSettingsOpen(true); }}>{icons.user} Account &amp; Billing</div>
          <div className="footer-link" onClick={() => { setSettingsTab('api'); setSettingsOpen(true); }}>{icons.link} API</div>
          <div className="footer-link danger">{icons.logout} Log out</div>
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        initialTab={settingsTab}
        onClose={() => setSettingsOpen(false)}
      />
    </aside>
  );
}
