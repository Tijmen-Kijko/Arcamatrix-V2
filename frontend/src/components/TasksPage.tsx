import { useState } from 'react';
import './TasksPage.css';

/* ─── Types ─── */
type TimePeriod = 'today' | 'week' | 'month';

interface Automation {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'error';
  lastRun: string;
  runsToday: number;
  timeSaved: { today: number; week: number; month: number }; // minutes
  trigger: string;
}

/* ─── Mock data ─── */
const automations: Automation[] = [
  {
    id: 'a1',
    name: 'Email triage & labeling',
    description: 'Reads incoming emails, labels by priority and sends summaries to Slack.',
    status: 'active',
    lastRun: '2 min ago',
    runsToday: 34,
    timeSaved: { today: 45, week: 210, month: 840 },
    trigger: 'Every new email',
  },
  {
    id: 'a2',
    name: 'Weekly report generator',
    description: 'Retrieves KPIs from Google Sheets and creates a summary in Notion.',
    status: 'active',
    lastRun: 'yesterday 17:00',
    runsToday: 0,
    timeSaved: { today: 0, week: 60, month: 240 },
    trigger: 'Every Friday 17:00',
  },
  {
    id: 'a3',
    name: 'Agenda sync & reminders',
    description: 'Syncs Google Calendar with tasks and sends reminders via WhatsApp.',
    status: 'active',
    lastRun: '15 min ago',
    runsToday: 8,
    timeSaved: { today: 20, week: 95, month: 380 },
    trigger: 'Every hour',
  },
  {
    id: 'a4',
    name: 'Lead intake from LinkedIn',
    description: 'Captures new LinkedIn messages and automatically creates HubSpot contacts.',
    status: 'paused',
    lastRun: '3 days ago',
    runsToday: 0,
    timeSaved: { today: 0, week: 0, month: 150 },
    trigger: 'New LinkedIn message',
  },
  {
    id: 'a5',
    name: 'Invoice processing',
    description: 'Recognizes invoices in Gmail, extracts amounts and books them in Stripe.',
    status: 'error',
    lastRun: 'today 09:12',
    runsToday: 2,
    timeSaved: { today: 10, week: 55, month: 220 },
    trigger: 'Email with attachment',
  },
  {
    id: 'a6',
    name: 'Social media scheduler',
    description: 'Plans and publishes content on TikTok and LinkedIn based on a content calendar.',
    status: 'active',
    lastRun: 'today 08:00',
    runsToday: 3,
    timeSaved: { today: 30, week: 150, month: 600 },
    trigger: 'Daily at 08:00',
  },
];

/* ─── SVG icons ─── */
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ZapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const TrendUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const PlayIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const PauseIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
);
const AlertIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/* ─── Helpers ─── */
function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const periodLabels: Record<TimePeriod, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
};

/* ─── Component ─── */
export function TasksPage() {
  const [period, setPeriod] = useState<TimePeriod>('today');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalTimeSaved = automations.reduce((sum, a) => sum + a.timeSaved[period], 0);
  const totalRuns = automations.reduce((sum, a) => sum + a.runsToday, 0);
  const activeCount = automations.filter((a) => a.status === 'active').length;

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h1 className="tasks-title">Daily Tasks</h1>
        <div className="tasks-subtitle">Your automations and time saved</div>
      </div>

      {/* Time saved hero */}
      <div className="time-saved-hero">
        <div className="time-saved-main">
          <div className="time-saved-icon"><ClockIcon /></div>
          <div className="time-saved-content">
            <div className="time-saved-label">Time saved</div>
            <div className="time-saved-value">{formatTime(totalTimeSaved)}</div>
          </div>
          <div className="time-saved-period-toggle">
            {(['today', 'week', 'month'] as TimePeriod[]).map((p) => (
              <button
                key={p}
                className={`period-btn${period === p ? ' active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon active"><ZapIcon /></div>
            <div className="stat-info">
              <div className="stat-value">{activeCount}</div>
              <div className="stat-label">Active automations</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon runs"><PlayIcon /></div>
            <div className="stat-info">
              <div className="stat-value">{totalRuns}</div>
              <div className="stat-label">Runs today</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon trend"><TrendUpIcon /></div>
            <div className="stat-info">
              <div className="stat-value">{formatTime(totalTimeSaved)}</div>
              <div className="stat-label">{periodLabels[period]} saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Automations list */}
      <div className="automations-section">
        <div className="automations-header">
          <span className="automations-label">Automations</span>
          <span className="automations-count">{automations.length}</span>
        </div>

        <div className="automations-list">
          {automations.map((a) => {
            const isExpanded = expandedId === a.id;
            return (
              <div
                key={a.id}
                className={`automation-card${isExpanded ? ' expanded' : ''}`}
              >
                <div
                  className="automation-row"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                >
                  <div className={`automation-status-dot ${a.status}`} />
                  <div className="automation-info">
                    <div className="automation-name">{a.name}</div>
                    <div className="automation-trigger">{a.trigger}</div>
                  </div>
                  <div className="automation-time-saved">
                    <span className="automation-time-value">{formatTime(a.timeSaved[period])}</span>
                    <span className="automation-time-label">saved</span>
                  </div>
                  <div className="automation-runs">
                    <span className="automation-runs-value">{a.runsToday}</span>
                    <span className="automation-runs-label">runs</span>
                  </div>
                  <div className={`automation-status-badge ${a.status}`}>
                    {a.status === 'active' && <><PlayIcon /> Active</>}
                    {a.status === 'paused' && <><PauseIcon /> Paused</>}
                    {a.status === 'error' && <><AlertIcon /> Error</>}
                  </div>
                  <div className={`automation-chevron${isExpanded ? ' open' : ''}`}>
                    <ChevronDown />
                  </div>
                </div>

                {/* Expanded detail */}
                <div className={`automation-detail${isExpanded ? ' open' : ''}`}>
                  <div className="automation-description">{a.description}</div>
                  <div className="automation-meta">
                    <div className="meta-item">
                      <span className="meta-key">Last run</span>
                      <span className="meta-val">{a.lastRun}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-key">Saved today</span>
                      <span className="meta-val">{formatTime(a.timeSaved.today)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-key">This week</span>
                      <span className="meta-val">{formatTime(a.timeSaved.week)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-key">This month</span>
                      <span className="meta-val">{formatTime(a.timeSaved.month)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
