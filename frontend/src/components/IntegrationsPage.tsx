import { useState, useMemo } from 'react';
import './IntegrationsPage.css';

/* ─── SVG helpers ─── */
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/* ─── Connector data ─── */
interface Connector {
  id: string;
  name: string;
  emoji: string;       // simple emoji/letter icon fallback
  status: 'connect' | 'setup' | 'connected';
  readOnly?: boolean;
  featured?: boolean;
}

const connectors: Connector[] = [
  { id: 'stripe',           name: 'Stripe',              emoji: 'S',  status: 'setup',   featured: true },
  { id: 'gmail',            name: 'Gmail',               emoji: '✉',  status: 'connect', readOnly: true },
  { id: 'gcalendar',        name: 'Google Calendar',     emoji: '📅', status: 'connect', readOnly: true },
  { id: 'gsheets',          name: 'Google Sheets',       emoji: '📊', status: 'connect', readOnly: true },
  { id: 'gdrive',           name: 'Google Drive',        emoji: '📁', status: 'connect' },
  { id: 'linkedin',         name: 'LinkedIn',            emoji: 'in', status: 'connect' },
  { id: 'ganalytics',       name: 'Google Analytics',    emoji: '📈', status: 'connect' },
  { id: 'gdocs',            name: 'Google Docs',         emoji: '📄', status: 'connect', readOnly: true },
  { id: 'outlook',          name: 'Outlook',             emoji: '📧', status: 'connect', readOnly: true },
  { id: 'github',           name: 'GitHub',              emoji: '🐙', status: 'connect', readOnly: true },
  { id: 'slack',            name: 'Slack Bot',           emoji: '#',  status: 'connect' },
  { id: 'notion',           name: 'Notion',              emoji: 'N',  status: 'connect' },
  { id: 'hubspot',          name: 'HubSpot',             emoji: '🔶', status: 'connect' },
  { id: 'gslides',          name: 'Google Slides',       emoji: '🖼', status: 'connect', readOnly: true },
  { id: 'slack-user',       name: 'Slack User',          emoji: '👤', status: 'connect' },
  { id: 'tiktok',           name: 'TikTok',              emoji: '🎵', status: 'connect' },
  { id: 'wix',              name: 'Wix',                 emoji: 'W',  status: 'connect' },
  { id: 'bigquery',         name: 'Google BigQuery',     emoji: '🔍', status: 'connect' },
  { id: 'discord',          name: 'Discord',             emoji: '💬', status: 'connect' },
  { id: 'dropbox',          name: 'Dropbox',             emoji: '📦', status: 'connect', readOnly: true },
  { id: 'clickup',          name: 'ClickUp',             emoji: '✓',  status: 'connect' },
  { id: 'gsearch-console',  name: 'Google Search Console', emoji: '🔎', status: 'connect' },
  { id: 'salesforce',       name: 'Salesforce',          emoji: '☁',  status: 'connect' },
  { id: 'box',              name: 'Box',                 emoji: 'B',  status: 'connect' },
  { id: 'airtable',         name: 'Airtable',            emoji: '⊞',  status: 'connect', readOnly: true },
  { id: 'splitwise',        name: 'Splitwise',           emoji: '💰', status: 'connect' },
  { id: 'gclassroom',       name: 'Google Classroom',    emoji: '🎓', status: 'connect' },
  { id: 'wrike',            name: 'Wrike',               emoji: '✔',  status: 'connect' },
  { id: 'linear',           name: 'Linear',              emoji: '▷',  status: 'connect', readOnly: true },
  { id: 'ms-teams',         name: 'Microsoft Teams',     emoji: 'T',  status: 'connect' },
  { id: 'ms-sharepoint',    name: 'Microsoft SharePoint', emoji: 'S', status: 'connect' },
  { id: 'ms-onedrive',      name: 'Microsoft OneDrive',  emoji: '☁',  status: 'connect', readOnly: true },
  { id: 'typeform',         name: 'Typeform',            emoji: '📋', status: 'connect' },
  { id: 'gitlab',           name: 'GitLab',              emoji: '🦊', status: 'connect' },
  { id: 'bamboohr',         name: 'BambooHR',            emoji: '🎋', status: 'connect' },
  { id: 'gtasks',           name: 'Google Tasks',        emoji: '☑',  status: 'connect', readOnly: true },
  { id: 'gmeet',            name: 'Google Meet',         emoji: '📹', status: 'connect' },
  { id: 'huggingface',      name: 'Hugging Face',        emoji: '🤗', status: 'connect' },
  { id: 'calendly',         name: 'Calendly',            emoji: '📅', status: 'connect' },
  { id: 'contentful',       name: 'Contentful',          emoji: 'C',  status: 'connect' },
  { id: 'supabase',         name: 'Supabase',            emoji: '⚡', status: 'connect' },
];

/* ─── Component ─── */

/* ─── SVG icon helpers for backend cards ─── */
const DataIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
    <rect x="3" y="7" width="18" height="4" rx="1" /><rect x="3" y="13" width="18" height="4" rx="1" />
  </svg>
);
const CodeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
);
const StorageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2" /><path d="M2 9h20" /><path d="M10 3v18" />
  </svg>
);
const AutomationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M12 1v4" /><path d="M12 19v4" /><path d="M4.22 4.22l2.83 2.83" /><path d="M16.95 16.95l2.83 2.83" /><path d="M1 12h4" /><path d="M19 12h4" /><path d="M4.22 19.78l2.83-2.83" /><path d="M16.95 7.05l2.83-2.83" />
  </svg>
);

const backendCards = [
  { icon: <DataIcon />, title: 'Data & Entities', lines: ['Create, read, update, delete & filter entity records', 'Row-level security enforcement'] },
  { icon: <CodeIcon />, title: 'Backend Functions', lines: ['Deploy & call serverless Deno functions', 'Manage environment secrets'] },
  { icon: <StorageIcon />, title: 'File Storage', lines: ['Upload public & private files', 'Create signed download URLs'] },
  { icon: <AutomationIcon />, title: 'Automations', lines: ['Schedule CRON jobs', 'Entity change triggers'] },
];

export function IntegrationsPage() {
  const [backendOpen, setBackendOpen] = useState(false);
  const [connectedOpen, setConnectedOpen] = useState(true);
  const [officialOpen, setOfficialOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('most-used');

  const connected = connectors.filter((c) => c.status === 'connected');
  const available = useMemo(() => {
    let list = connectors.filter((c) => c.status !== 'connected');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [search]);

  const featured = available.filter((c) => c.featured);
  const regular = available.filter((c) => !c.featured);

  return (
    <div className="integrations-page">
      <h1 className="integrations-title">Integrations</h1>

      {/* Backend banner — collapsible */}
          <div className={`integrations-backend${backendOpen ? ' open' : ''}`}>
            <div className="backend-header" onClick={() => setBackendOpen((o) => !o)}>
              <div className="backend-icon">A</div>
              <div className="backend-info">
                <div className="backend-name">
                  Arcamatrix Backend
                  <span className="backend-badge" style={{ marginLeft: 8 }}>Always Active</span>
                </div>
                <div className="backend-desc">Database, functions, file storage, and automations</div>
              </div>
              <div className={`backend-chevron${backendOpen ? ' open' : ''}`}><ChevronDown /></div>
            </div>
            <div className={`backend-body${backendOpen ? ' open' : ''}`}>
              <div className="backend-cards">
                {backendCards.map((card) => (
                  <div key={card.title} className="backend-card">
                    <div className="backend-card-icon">{card.icon}</div>
                    <div className="backend-card-title">{card.title}</div>
                    {card.lines.map((line, i) => (
                      <div key={i} className="backend-card-line">{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connected */}
          <div className="integrations-section">
            <div className="section-header" onClick={() => setConnectedOpen((o) => !o)}>
              <span className="section-title">Connected</span>
              <span className="section-count">{connected.length}</span>
              <span className={`section-chevron${connectedOpen ? ' open' : ''}`}><ChevronDown /></span>
            </div>
            <div className={`section-body${connectedOpen ? ' open' : ''}`}>
              {connected.length === 0 ? (
                <div className="section-empty">No connectors connected yet.</div>
              ) : (
                <div className="connectors-grid">
                  {connected.map((c) => (
                    <ConnectorCard key={c.id} connector={c} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Official / Available */}
          <div className="integrations-section">
            <div className="section-header" onClick={() => setOfficialOpen((o) => !o)}>
              <span className="section-header-icon">A</span>
              <span className="section-title">Arcamatrix Official</span>
              <span className="section-count">{available.length}</span>
              <span className={`section-chevron${officialOpen ? ' open' : ''}`}><ChevronDown /></span>
            </div>
            <div className={`section-body${officialOpen ? ' open' : ''}`}>
              {/* Toolbar */}
              <div className="connectors-toolbar">
                <span className="connectors-available">AVAILABLE ({available.length})</span>
                <div className="connectors-controls">
                  <div className="search-wrap">
                    <SearchIcon />
                    <input
                      className="connectors-search"
                      placeholder="Search connectors..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="sort-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="most-used">Most used</option>
                    <option value="az">A – Z</option>
                    <option value="za">Z – A</option>
                  </select>
                </div>
              </div>

              {/* Grid */}
              <div className="connectors-grid">
                {featured.map((c) => (
                  <ConnectorCard key={c.id} connector={c} />
                ))}
                {regular.map((c) => (
                  <ConnectorCard key={c.id} connector={c} />
                ))}
              </div>
            </div>
          </div>
    </div>
  );
}

/* ─── Card sub-component ─── */

function ConnectorCard({ connector }: { connector: Connector }) {
  const { name, emoji, status, readOnly, featured } = connector;
  return (
    <div className={`connector-card${featured ? ' featured' : ''}`}>
      <div className="connector-icon">
        <span>{emoji}</span>
      </div>
      <div className="connector-details">
        <div className="connector-name">{name}</div>
        <div className="connector-meta">
          <span className={`connector-status${status === 'setup' ? ' setup' : ''}`}>
            {status === 'setup' ? 'Set up' : status === 'connected' ? 'Connected' : 'Connect'}
          </span>
          {readOnly && <span className="connector-badge">Read only</span>}
        </div>
      </div>
    </div>
  );
}
