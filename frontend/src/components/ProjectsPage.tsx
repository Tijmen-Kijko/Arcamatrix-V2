import { useState, useCallback, useEffect } from 'react';
import {
  useProjects,
  useActiveProjectId,
  useSetActiveProject,
  useProjectTasks,
  useTasksByStatus,
  useAddTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useOpenTaskCount,
  useInProgressCount,
} from '../hooks/useProjects';
import type { ProjectTask, TaskStatus, TaskPriority } from '../stores/projectStore';
import './ProjectsPage.css';

/* ─── SVG Icons ─── */
const icons = {
  back: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  plus: (w = 13) => (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  monitor: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  ),
  messageCircle: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  send: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#26A5E4" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  cpu: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  ),
  trash: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  edit: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  clipboard: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
    </svg>
  ),
  rocket: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    </svg>
  ),
};

const sourceIcon = (source: ProjectTask['source']) => {
  switch (source) {
    case 'platform': return icons.monitor;
    case 'whatsapp': return icons.messageCircle;
    case 'telegram': return icons.send;
    case 'arcamatrix': return icons.cpu;
  }
};

const sourceLabel = (source: ProjectTask['source']) => {
  switch (source) {
    case 'platform': return 'Platform';
    case 'whatsapp': return 'WhatsApp';
    case 'telegram': return 'Telegram';
    case 'arcamatrix': return 'Arcamatrix';
  }
};

const statusLabel = (status: TaskStatus) => {
  switch (status) {
    case 'backlog': return 'Backlog';
    case 'in_progress': return 'In behandeling';
    case 'done': return 'Afgerond';
  }
};

const priorityLabel = (p?: TaskPriority) => {
  switch (p) {
    case 'high': return 'Hoog';
    case 'medium': return 'Medium';
    case 'low': return 'Laag';
    default: return null;
  }
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/* ═══════════════════════════════════════
   PROJECT LIST — overview of all projects
═══════════════════════════════════════ */

function ProjectCard({ project, onClick }: {
  project: { id: string; name: string; description?: string; last_activity: string };
  onClick: () => void;
}) {
  const openCount = useOpenTaskCount(project.id);
  const inProgressCount = useInProgressCount(project.id);

  return (
    <div className="proj-card" onClick={onClick}>
      <div className="proj-card-header">
        <span className="proj-card-name">{project.name}</span>
        <span className={`proj-card-badge${inProgressCount > 0 ? ' busy' : ''}`}>
          {openCount} open
        </span>
      </div>
      {project.description && (
        <div className="proj-card-desc">{project.description}</div>
      )}
      <div className="proj-card-meta">
        Laatst actief: {formatDate(project.last_activity)}
      </div>
    </div>
  );
}

function ProjectListView({ onSelect }: { onSelect: (id: string) => void }) {
  const projects = useProjects();

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1 className="projects-title">Projects</h1>
        <div className="projects-subtitle">Je bouwprojecten en hun taken</div>
      </div>
      <div className="proj-list">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onClick={() => onSelect(p.id)} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TASK CARD — individual task in a column
═══════════════════════════════════════ */

function TaskCard({ task, onClick }: { task: ProjectTask; onClick: () => void }) {
  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-top">
        {task.priority && <span className={`priority-dot ${task.priority}`} />}
        <span className="task-card-title">{task.title}</span>
      </div>
      <div className="task-card-bottom">
        <span className={`task-status-badge ${task.status}`}>{statusLabel(task.status)}</span>
        <span className="task-source" title={sourceLabel(task.source)}>{sourceIcon(task.source)}</span>
        <span className="task-card-date">
          {task.completed_at ? formatDate(task.completed_at) : formatDate(task.created_at)}
        </span>
      </div>
      {task.arcamatrix_note && (
        <div className="task-card-note">{task.arcamatrix_note}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   TASK COLUMN — one of three board columns
═══════════════════════════════════════ */

function TaskColumn({ projectId, status, label, emptyText, emptyIcon, onTaskClick, onAddTask }: {
  projectId: string;
  status: TaskStatus;
  label: string;
  emptyText: string;
  emptyIcon: React.ReactNode;
  onTaskClick: (task: ProjectTask) => void;
  onAddTask?: () => void;
}) {
  const tasks = useTasksByStatus(projectId, status);

  return (
    <div className="board-column">
      <div className="column-header">
        <span className="column-label">{label}</span>
        <span className={`column-badge ${status}`}>{tasks.length}</span>
      </div>
      <div className="column-body">
        {tasks.length === 0 ? (
          <div className="column-empty">
            <span className="column-empty-icon">{emptyIcon}</span>
            <span className="column-empty-text">{emptyText}</span>
          </div>
        ) : (
          tasks.map((t) => <TaskCard key={t.id} task={t} onClick={() => onTaskClick(t)} />)
        )}
        {onAddTask && (
          <button className="add-task-btn" onClick={onAddTask}>
            {icons.plus(11)}
            Taak toevoegen
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TASK DETAIL PANEL — sliding side panel
═══════════════════════════════════════ */

function TaskDetailPanel({ task, onClose }: { task: ProjectTask; onClose: () => void }) {
  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setEditTitle(task.title);
    setEditDesc(task.description ?? '');
    setIsEditing(false);
    setConfirmDelete(false);
  }, [task.id, task.title, task.description]);

  const handleSaveEdit = () => {
    updateTask(task.id, { title: editTitle, description: editDesc || undefined });
    setIsEditing(false);
  };

  const handleStatusChange = (status: TaskStatus) => {
    updateStatus(task.id, status);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteTask(task.id, task.project_id);
    onClose();
  };

  const statusButtons: { status: TaskStatus; label: string }[] = [
    { status: 'backlog', label: 'Backlog' },
    { status: 'in_progress', label: 'In behandeling' },
    { status: 'done', label: 'Afgerond' },
  ];

  // Build activity timeline
  const timeline: { label: string; date: string }[] = [
    { label: 'Aangemaakt', date: task.created_at },
  ];
  if (task.started_at) timeline.push({ label: 'Gestart', date: task.started_at });
  if (task.completed_at) timeline.push({ label: 'Afgerond', date: task.completed_at });

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div className="detail-panel">
        <div className="detail-header">
          <span className="detail-header-label">Taakdetails</span>
          <button className="detail-close" onClick={onClose}>{icons.close}</button>
        </div>

        <div className="detail-body">
          {/* Title + description */}
          {isEditing ? (
            <div className="detail-edit-section">
              <input
                className="detail-edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
              />
              <textarea
                className="detail-edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Beschrijving (optioneel)"
                rows={3}
              />
              <div className="detail-edit-actions">
                <button className="detail-btn save" onClick={handleSaveEdit}>Opslaan</button>
                <button className="detail-btn cancel" onClick={() => setIsEditing(false)}>Annuleer</button>
              </div>
            </div>
          ) : (
            <div className="detail-title-section">
              <h3 className="detail-title">{task.title}</h3>
              <button className="detail-edit-btn" onClick={() => setIsEditing(true)}>{icons.edit}</button>
              {task.description && <p className="detail-desc">{task.description}</p>}
            </div>
          )}

          {/* Status switcher */}
          <div className="detail-status-section">
            <span className="detail-section-label">Status</span>
            <div className="status-switcher">
              {statusButtons.map((b) => (
                <button
                  key={b.status}
                  className={`status-btn ${b.status}${task.status === b.status ? ' active' : ''}`}
                  onClick={() => handleStatusChange(b.status)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source + priority */}
          <div className="detail-meta-row">
            <div className="detail-meta-item">
              <span className="detail-meta-label">Bron</span>
              <span className="detail-meta-value">
                {sourceIcon(task.source)} {sourceLabel(task.source)}
              </span>
            </div>
            {task.priority && (
              <div className="detail-meta-item">
                <span className="detail-meta-label">Prioriteit</span>
                <span className="detail-meta-value">
                  <span className={`priority-dot ${task.priority}`} />
                  {priorityLabel(task.priority)}
                </span>
              </div>
            )}
          </div>

          {/* Arcamatrix note */}
          {task.arcamatrix_note && (
            <div className="detail-arcamatrix-note">
              <span className="detail-section-label">Arcamatrix</span>
              <div className="arcamatrix-note-body">{task.arcamatrix_note}</div>
            </div>
          )}

          {/* Activity timeline */}
          <div className="detail-timeline">
            <span className="detail-section-label">Activiteit</span>
            <div className="timeline-list">
              {timeline.map((entry, i) => (
                <div key={i} className="timeline-entry">
                  <div className="timeline-dot" />
                  <span className="timeline-label">{entry.label}</span>
                  <span className="timeline-date">{formatDateTime(entry.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delete */}
        <div className="detail-footer">
          <button
            className={`detail-delete-btn${confirmDelete ? ' confirm' : ''}`}
            onClick={handleDelete}
          >
            {icons.trash}
            {confirmDelete ? 'Bevestig verwijdering' : 'Taak verwijderen'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   ADD TASK MODAL — quick add to backlog
═══════════════════════════════════════ */

function AddTaskModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const addTask = useAddTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    addTask({
      id: `task_${Math.random().toString(36).slice(2, 10)}`,
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      status: 'backlog',
      source: 'platform',
      priority: priority || undefined,
      created_at: now,
      updated_at: now,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Nieuwe taak</h3>
          <button className="modal-close" onClick={onClose}>{icons.close}</button>
        </div>
        <div className="modal-body">
          <input
            className="modal-input"
            placeholder="Taaknaam"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <textarea
            className="modal-textarea"
            placeholder="Beschrijving (optioneel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <div className="modal-priority">
            <span className="modal-priority-label">Prioriteit</span>
            <div className="priority-options">
              {(['', 'low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  className={`priority-option${priority === p ? ' active' : ''}`}
                  onClick={() => setPriority(p)}
                >
                  {p === '' ? 'Geen' : priorityLabel(p as TaskPriority)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-submit" onClick={handleSubmit} disabled={!title.trim()}>
            Toevoegen aan Backlog
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PROJECT TASK BOARD — three-column kanban
═══════════════════════════════════════ */

function ProjectTaskBoardView({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const projects = useProjects();
  const project = projects.find((p) => p.id === projectId);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<TaskStatus>('backlog');

  // Keep selectedTask in sync with store
  const allTasks = useProjectTasks(projectId);
  useEffect(() => {
    if (selectedTask) {
      const fresh = allTasks.find((t) => t.id === selectedTask.id);
      if (fresh) setSelectedTask(fresh);
      else setSelectedTask(null);
    }
  }, [allTasks, selectedTask]);

  if (!project) return null;

  const columns: { status: TaskStatus; label: string; emptyText: string; emptyIcon: React.ReactNode }[] = [
    { status: 'backlog', label: 'Backlog', emptyText: 'Geen open taken — goed bezig', emptyIcon: icons.clipboard },
    { status: 'in_progress', label: 'In behandeling', emptyText: 'Arcamatrix staat klaar', emptyIcon: icons.rocket },
    { status: 'done', label: 'Afgerond', emptyText: 'Nog niets afgerond', emptyIcon: icons.check },
  ];

  return (
    <div className="projects-page">
      <div className="board-header">
        <button className="board-back" onClick={onBack}>{icons.back}</button>
        <div>
          <h1 className="projects-title">{project.name}</h1>
          {project.description && <div className="projects-subtitle">{project.description}</div>}
        </div>
      </div>

      {/* Mobile tab switcher */}
      <div className="mobile-tab-switcher">
        {columns.map((col) => (
          <button
            key={col.status}
            className={`mobile-tab${mobileTab === col.status ? ' active' : ''}`}
            onClick={() => setMobileTab(col.status)}
          >
            {col.label}
          </button>
        ))}
      </div>

      {/* Desktop: three-column grid */}
      <div className="board-grid">
        {columns.map((col) => (
          <div key={col.status} className={`board-col-wrap${mobileTab === col.status ? ' mobile-active' : ''}`}>
            <TaskColumn
              projectId={projectId}
              status={col.status}
              label={col.label}
              emptyText={col.emptyText}
              emptyIcon={col.emptyIcon}
              onTaskClick={setSelectedTask}
              onAddTask={col.status === 'backlog' ? () => setShowAddModal(true) : undefined}
            />
          </div>
        ))}
      </div>

      {/* Task detail panel */}
      {selectedTask && (
        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

      {/* Add task modal */}
      {showAddModal && (
        <AddTaskModal projectId={projectId} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT — switches between list and board
═══════════════════════════════════════ */

export function ProjectsPage() {
  const activeProjectId = useActiveProjectId();
  const setActiveProject = useSetActiveProject();

  const handleSelect = useCallback((id: string) => setActiveProject(id), [setActiveProject]);
  const handleBack = useCallback(() => setActiveProject(null), [setActiveProject]);

  if (activeProjectId) {
    return <ProjectTaskBoardView projectId={activeProjectId} onBack={handleBack} />;
  }

  return <ProjectListView onSelect={handleSelect} />;
}
