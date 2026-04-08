import { useState, useMemo, useCallback } from 'react';
import './SkillsPage.css';

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

/* ─── Skill data ─── */
interface Skill {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  status: 'active' | 'available' | 'coming-soon';
  badge?: string;
  featured?: boolean;
}

const skills: Skill[] = [
  // ─── Communication ───
  { id: 'email-draft',      name: 'Email Draft',            description: 'Compose and refine professional emails',             emoji: '✉️',  category: 'Communication', status: 'active',      featured: true },
  { id: 'email-reply',      name: 'Smart Reply',            description: 'Generate context-aware email replies',               emoji: '↩️',  category: 'Communication', status: 'active' },
  { id: 'email-summary',    name: 'Inbox Summary',          description: 'Summarize unread emails into key takeaways',         emoji: '📋',  category: 'Communication', status: 'active' },
  { id: 'meeting-notes',    name: 'Meeting Notes',          description: 'Generate structured meeting summaries',              emoji: '📝',  category: 'Communication', status: 'active' },
  { id: 'translate',        name: 'Translate',              description: 'Translate text between 50+ languages',               emoji: '🌍',  category: 'Communication', status: 'available' },
  { id: 'tone-adjust',      name: 'Tone Adjuster',          description: 'Rewrite text in formal, casual or friendly tone',    emoji: '🎭',  category: 'Communication', status: 'available' },

  // ─── Productivity ───
  { id: 'task-create',      name: 'Create Task',            description: 'Turn natural language into structured tasks',         emoji: '✅',  category: 'Productivity', status: 'active',       featured: true },
  { id: 'daily-planner',    name: 'Daily Planner',          description: 'Generate a prioritized daily schedule',              emoji: '📅',  category: 'Productivity', status: 'active' },
  { id: 'weekly-report',    name: 'Weekly Report',          description: 'Auto-generate weekly progress reports',              emoji: '📊',  category: 'Productivity', status: 'active' },
  { id: 'reminder-set',     name: 'Set Reminder',           description: 'Schedule reminders with natural language',           emoji: '⏰',  category: 'Productivity', status: 'active' },
  { id: 'pomodoro',         name: 'Pomodoro Timer',         description: 'Manage focus sessions with break reminders',         emoji: '🍅',  category: 'Productivity', status: 'available' },
  { id: 'habit-tracker',    name: 'Habit Tracker',          description: 'Track and visualize daily habits',                   emoji: '📈',  category: 'Productivity', status: 'coming-soon' },

  // ─── Research & Analysis ───
  { id: 'web-search',       name: 'Web Search',             description: 'Search the web and return summarized results',       emoji: '🔍',  category: 'Research & Analysis', status: 'active',  featured: true },
  { id: 'summarize',        name: 'Summarize',              description: 'Condense long documents into key points',            emoji: '📄',  category: 'Research & Analysis', status: 'active' },
  { id: 'fact-check',       name: 'Fact Check',             description: 'Verify claims against reliable sources',             emoji: '✔️',  category: 'Research & Analysis', status: 'available' },
  { id: 'competitor-scan',  name: 'Competitor Scan',        description: 'Analyze competitor websites and positioning',        emoji: '🕵️',  category: 'Research & Analysis', status: 'available' },
  { id: 'trend-analysis',   name: 'Trend Analysis',         description: 'Identify emerging trends in any domain',             emoji: '📉',  category: 'Research & Analysis', status: 'coming-soon' },
  { id: 'data-extract',     name: 'Data Extractor',         description: 'Extract structured data from unstructured text',     emoji: '🧲',  category: 'Research & Analysis', status: 'available' },

  // ─── Content Creation ───
  { id: 'blog-post',        name: 'Blog Post',              description: 'Generate SEO-optimized blog articles',               emoji: '✍️',  category: 'Content Creation', status: 'active' },
  { id: 'social-post',      name: 'Social Post',            description: 'Create posts for LinkedIn, Twitter, Instagram',      emoji: '📱',  category: 'Content Creation', status: 'active' },
  { id: 'landing-copy',     name: 'Landing Page Copy',      description: 'Write conversion-focused landing page text',         emoji: '🚀',  category: 'Content Creation', status: 'available' },
  { id: 'ad-copy',          name: 'Ad Copy',                description: 'Generate ad variants for A/B testing',               emoji: '📣',  category: 'Content Creation', status: 'available' },
  { id: 'image-gen',        name: 'Image Generation',       description: 'Create images from text descriptions',               emoji: '🎨',  category: 'Content Creation', status: 'coming-soon' },
  { id: 'video-script',     name: 'Video Script',           description: 'Write scripts for short-form and long-form video',   emoji: '🎬',  category: 'Content Creation', status: 'coming-soon' },

  // ─── Development ───
  { id: 'code-review',      name: 'Code Review',            description: 'Review code for bugs, style and best practices',     emoji: '🐛',  category: 'Development', status: 'active' },
  { id: 'code-gen',         name: 'Code Generator',         description: 'Generate code snippets from descriptions',           emoji: '💻',  category: 'Development', status: 'active' },
  { id: 'sql-query',        name: 'SQL Query Builder',      description: 'Build SQL queries from natural language',             emoji: '🗃️',  category: 'Development', status: 'active' },
  { id: 'api-docs',         name: 'API Docs Generator',     description: 'Auto-generate API documentation',                    emoji: '📖',  category: 'Development', status: 'available' },
  { id: 'regex-builder',    name: 'Regex Builder',          description: 'Create and explain regular expressions',              emoji: '🔣',  category: 'Development', status: 'available' },
  { id: 'debug-assist',     name: 'Debug Assistant',        description: 'Diagnose errors and suggest fixes',                  emoji: '🔧',  category: 'Development', status: 'available' },

  // ─── Data & Files ───
  { id: 'csv-transform',    name: 'CSV Transform',          description: 'Parse, filter and transform CSV data',               emoji: '📑',  category: 'Data & Files', status: 'active' },
  { id: 'pdf-extract',      name: 'PDF Extractor',          description: 'Extract text and tables from PDF files',              emoji: '📕',  category: 'Data & Files', status: 'active' },
  { id: 'json-format',      name: 'JSON Formatter',         description: 'Format, validate and transform JSON',                emoji: '{ }', category: 'Data & Files', status: 'active' },
  { id: 'spreadsheet',      name: 'Spreadsheet Builder',    description: 'Create spreadsheets from natural language',           emoji: '📊',  category: 'Data & Files', status: 'available' },
  { id: 'file-convert',     name: 'File Converter',         description: 'Convert between common file formats',                emoji: '🔄',  category: 'Data & Files', status: 'coming-soon' },
  { id: 'ocr',              name: 'OCR Scanner',            description: 'Extract text from images and scans',                 emoji: '📷',  category: 'Data & Files', status: 'coming-soon' },

  // ─── Automations ───
  { id: 'workflow-create',   name: 'Workflow Builder',       description: 'Create multi-step automations with triggers',        emoji: '⚡',  category: 'Automations', status: 'active',        featured: true },
  { id: 'schedule-task',     name: 'Scheduled Task',         description: 'Run skills automatically on a schedule',             emoji: '🔁',  category: 'Automations', status: 'active' },
  { id: 'webhook-listen',    name: 'Webhook Listener',       description: 'Trigger actions from incoming webhooks',             emoji: '🪝',  category: 'Automations', status: 'available' },
  { id: 'conditional-flow',  name: 'Conditional Flow',       description: 'Add if/else logic to your automations',              emoji: '🔀',  category: 'Automations', status: 'available' },
  { id: 'batch-process',     name: 'Batch Processor',        description: 'Process multiple items in bulk',                     emoji: '📦',  category: 'Automations', status: 'available' },
  { id: 'ai-chain',          name: 'AI Chain',               description: 'Chain multiple AI skills into pipelines',            emoji: '🔗',  category: 'Automations', status: 'coming-soon' },
];

/* ─── Helpers ─── */
const categories = [...new Set(skills.map((s) => s.category))];

function useToggle(initial = false) {
  const [open, setOpen] = useState(initial);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  return [open, toggle] as const;
}

/* ─── Components ─── */

function SkillCard({ skill }: { skill: Skill }) {
  const statusLabel =
    skill.status === 'active' ? 'Active' :
    skill.status === 'coming-soon' ? 'Coming soon' : 'Enable';

  return (
    <div className={`skill-card${skill.featured ? ' featured' : ''}`}>
      <div className="skill-icon">{skill.emoji}</div>
      <div className="skill-details">
        <div className="skill-name">{skill.name}</div>
        <div className="skill-desc">{skill.description}</div>
        <div className="skill-meta">
          <span className={`skill-status ${skill.status}`}>{statusLabel}</span>
          {skill.badge && <span className="skill-badge">{skill.badge}</span>}
        </div>
      </div>
    </div>
  );
}

function SkillSection({
  category,
  items,
  defaultOpen,
}: {
  category: string;
  items: Skill[];
  defaultOpen?: boolean;
}) {
  const [open, toggle] = useToggle(defaultOpen ?? false);

  const activeCount = items.filter((s) => s.status === 'active').length;

  return (
    <div className="skills-section">
      <div className="skills-section-header" onClick={toggle}>
        <span className="skills-section-title">{category}</span>
        <span className="skills-section-count">{items.length}</span>
        {activeCount > 0 && (
          <span className="skills-section-active">{activeCount} active</span>
        )}
        <span className={`skills-section-chevron${open ? ' open' : ''}`}><ChevronDown /></span>
      </div>
      <div className={`skills-section-body${open ? ' open' : ''}`}>
        <div className="skills-grid">
          {items.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export function SkillsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'available'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('category');

  const filtered = useMemo(() => {
    let list = skills;

    if (activeTab === 'active') list = list.filter((s) => s.status === 'active');
    if (activeTab === 'available') list = list.filter((s) => s.status !== 'active');

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q),
      );
    }

    if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'za') list = [...list].sort((a, b) => b.name.localeCompare(a.name));

    return list;
  }, [activeTab, search, sort]);

  const activeSkillsCount = skills.filter((s) => s.status === 'active').length;
  const availableSkillsCount = skills.filter((s) => s.status !== 'active').length;

  return (
    <div className="skills-page">
      <div className="skills-header-row">
        <h1 className="skills-title">Skills</h1>
        <div className="skills-stat">
          <span className="skills-stat-number">{activeSkillsCount}</span>
          <span className="skills-stat-label">active</span>
        </div>
        <div className="skills-stat">
          <span className="skills-stat-number">{skills.length}</span>
          <span className="skills-stat-label">total</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="skills-tabs">
        <button
          className={`skills-tab${activeTab === 'all' ? ' active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All skills
        </button>
        <button
          className={`skills-tab${activeTab === 'active' ? ' active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active <span className="skills-tab-count">{activeSkillsCount}</span>
        </button>
        <button
          className={`skills-tab${activeTab === 'available' ? ' active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available <span className="skills-tab-count">{availableSkillsCount}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="skills-toolbar">
        <span className="skills-results-count">{filtered.length} skills</span>
        <div className="skills-controls">
          <div className="skills-search-wrap">
            <SearchIcon />
            <input
              className="skills-search"
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="skills-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="category">By category</option>
            <option value="az">A – Z</option>
            <option value="za">Z – A</option>
          </select>
        </div>
      </div>

      {/* Sections */}
      {sort === 'category' ? (
        categories.map((cat, i) => {
          const items = filtered.filter((s) => s.category === cat);
          if (items.length === 0) return null;
          return (
            <SkillSection
              key={cat}
              category={cat}
              items={items}
              defaultOpen={i < 2}
            />
          );
        })
      ) : (
        <div className="skills-grid skills-grid-flat">
          {filtered.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="skills-empty">
          No skills found matching &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  );
}
