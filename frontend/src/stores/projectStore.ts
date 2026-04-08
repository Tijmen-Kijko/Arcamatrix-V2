import { create } from 'zustand';

/* ─── Types ─── */
export type TaskStatus = 'backlog' | 'in_progress' | 'done';
export type TaskSource = 'platform' | 'whatsapp' | 'telegram' | 'arcamatrix';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  last_activity: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  source: TaskSource;
  priority?: TaskPriority;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  arcamatrix_note?: string;
}

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  tasks: Record<string, ProjectTask[]>;
  setActiveProject: (id: string | null) => void;
  addProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addTask: (task: ProjectTask) => void;
  updateTask: (taskId: string, updates: Partial<ProjectTask>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string, projectId: string) => void;
}

/* ─── Mock data ─── */
const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    user_id: 'user_1',
    name: 'SportApp Pro',
    description: 'Fitness tracking app met AI-coaching en community features.',
    created_at: '2026-03-15T10:00:00Z',
    last_activity: '2026-04-08T09:30:00Z',
  },
  {
    id: 'proj_2',
    user_id: 'user_1',
    name: 'Marketing Automation',
    description: 'Geautomatiseerde campagnes en lead-nurturing pipeline.',
    created_at: '2026-03-20T14:00:00Z',
    last_activity: '2026-04-07T16:45:00Z',
  },
  {
    id: 'proj_3',
    user_id: 'user_1',
    name: 'Client Portal',
    description: 'Self-service portaal voor klanten met facturen, support en documenten.',
    created_at: '2026-04-01T08:00:00Z',
    last_activity: '2026-04-08T11:00:00Z',
  },
];

const MOCK_TASKS: Record<string, ProjectTask[]> = {
  proj_1: [
    {
      id: 'task_1', project_id: 'proj_1', title: 'Onboarding flow bouwen',
      description: 'Stap-voor-stap onboarding met fitheid-assessment en doelen selectie.',
      status: 'in_progress', source: 'platform', priority: 'high',
      created_at: '2026-03-18T10:00:00Z', updated_at: '2026-04-07T14:00:00Z',
      started_at: '2026-04-05T09:00:00Z',
      arcamatrix_note: 'Bezig met het implementeren van de fitness assessment wizard. Stap 1 en 2 zijn klaar.',
    },
    {
      id: 'task_2', project_id: 'proj_1', title: 'Push notificaties integreren',
      description: 'Firebase Cloud Messaging voor workout reminders en social updates.',
      status: 'backlog', source: 'whatsapp', priority: 'medium',
      created_at: '2026-03-25T08:30:00Z', updated_at: '2026-03-25T08:30:00Z',
    },
    {
      id: 'task_3', project_id: 'proj_1', title: 'Leaderboard API',
      description: 'REST endpoint voor community rankings per workout-type.',
      status: 'backlog', source: 'telegram', priority: 'low',
      created_at: '2026-04-01T11:00:00Z', updated_at: '2026-04-01T11:00:00Z',
    },
    {
      id: 'task_4', project_id: 'proj_1', title: 'App icon en splash screen',
      status: 'done', source: 'platform', priority: 'medium',
      created_at: '2026-03-16T09:00:00Z', updated_at: '2026-03-28T17:00:00Z',
      completed_at: '2026-03-28T17:00:00Z',
      arcamatrix_note: 'Design aangeleverd en geïmplementeerd in beide platforms.',
    },
    {
      id: 'task_5', project_id: 'proj_1', title: 'Workout timer component',
      status: 'done', source: 'arcamatrix',
      created_at: '2026-03-20T14:00:00Z', updated_at: '2026-04-02T10:00:00Z',
      completed_at: '2026-04-02T10:00:00Z',
      arcamatrix_note: 'Automatisch aangemaakt na analyse van de app-requirements. Timer met rust-intervallen is live.',
    },
  ],
  proj_2: [
    {
      id: 'task_6', project_id: 'proj_2', title: 'Email drip campaign opzetten',
      description: 'Welkomst-serie van 5 emails voor nieuwe leads.',
      status: 'in_progress', source: 'platform', priority: 'high',
      created_at: '2026-03-22T10:00:00Z', updated_at: '2026-04-07T16:45:00Z',
      started_at: '2026-04-06T08:00:00Z',
      arcamatrix_note: 'Email 1-3 zijn geschreven en goedgekeurd. Bezig met email 4.',
    },
    {
      id: 'task_7', project_id: 'proj_2', title: 'LinkedIn lead scraper',
      status: 'backlog', source: 'whatsapp', priority: 'medium',
      created_at: '2026-04-03T09:00:00Z', updated_at: '2026-04-03T09:00:00Z',
    },
    {
      id: 'task_8', project_id: 'proj_2', title: 'A/B test framework',
      description: 'Split testing voor subject lines en CTA buttons.',
      status: 'backlog', source: 'arcamatrix', priority: 'low',
      created_at: '2026-04-05T12:00:00Z', updated_at: '2026-04-05T12:00:00Z',
      arcamatrix_note: 'Automatisch aangemaakt: A/B testing verhoogt conversie gemiddeld 23% in vergelijkbare campagnes.',
    },
    {
      id: 'task_9', project_id: 'proj_2', title: 'HubSpot CRM koppeling',
      status: 'done', source: 'telegram',
      created_at: '2026-03-21T15:00:00Z', updated_at: '2026-04-01T09:00:00Z',
      completed_at: '2026-04-01T09:00:00Z',
    },
  ],
  proj_3: [
    {
      id: 'task_10', project_id: 'proj_3', title: 'Factuur download endpoint',
      description: 'PDF-generatie en download via signed URL.',
      status: 'backlog', source: 'platform', priority: 'high',
      created_at: '2026-04-02T10:00:00Z', updated_at: '2026-04-02T10:00:00Z',
    },
    {
      id: 'task_11', project_id: 'proj_3', title: 'Support ticket systeem',
      description: 'CRUD voor support tickets met status tracking.',
      status: 'backlog', source: 'whatsapp', priority: 'medium',
      created_at: '2026-04-04T14:00:00Z', updated_at: '2026-04-04T14:00:00Z',
    },
    {
      id: 'task_12', project_id: 'proj_3', title: 'Klant authenticatie flow',
      status: 'in_progress', source: 'platform', priority: 'high',
      created_at: '2026-04-01T08:00:00Z', updated_at: '2026-04-08T11:00:00Z',
      started_at: '2026-04-07T09:00:00Z',
      arcamatrix_note: 'Magic link auth wordt geïmplementeerd. Backend endpoint is klaar, frontend volgt.',
    },
    {
      id: 'task_13', project_id: 'proj_3', title: 'Landing page design',
      status: 'done', source: 'arcamatrix',
      created_at: '2026-04-01T08:30:00Z', updated_at: '2026-04-06T15:00:00Z',
      completed_at: '2026-04-06T15:00:00Z',
      arcamatrix_note: 'Design en responsive implementatie afgerond. Live op staging.',
    },
  ],
};

/* ─── Store ─── */
export const useProjectStore = create<ProjectStore>((set) => ({
  projects: MOCK_PROJECTS,
  activeProjectId: null,
  tasks: MOCK_TASKS,

  setActiveProject: (id) => set({ activeProjectId: id }),

  addProject: (project) =>
    set((s) => ({
      projects: [...s.projects, project],
      tasks: { ...s.tasks, [project.id]: [] },
    })),

  deleteProject: (id) =>
    set((s) => {
      const { [id]: _, ...remainingTasks } = s.tasks;
      return {
        projects: s.projects.filter((p) => p.id !== id),
        tasks: remainingTasks,
        activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
      };
    }),

  addTask: (task) =>
    set((s) => ({
      tasks: {
        ...s.tasks,
        [task.project_id]: [...(s.tasks[task.project_id] ?? []), task],
      },
    })),

  updateTask: (taskId, updates) =>
    set((s) => {
      const newTasks: Record<string, ProjectTask[]> = {};
      for (const [pid, list] of Object.entries(s.tasks)) {
        newTasks[pid] = list.map((t) =>
          t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t,
        );
      }
      return { tasks: newTasks };
    }),

  updateTaskStatus: (taskId, status) =>
    set((s) => {
      const now = new Date().toISOString();
      const newTasks: Record<string, ProjectTask[]> = {};
      for (const [pid, list] of Object.entries(s.tasks)) {
        newTasks[pid] = list.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            status,
            updated_at: now,
            started_at: status === 'in_progress' ? (t.started_at ?? now) : t.started_at,
            completed_at: status === 'done' ? now : undefined,
          };
        });
      }
      return { tasks: newTasks };
    }),

  deleteTask: (taskId, projectId) =>
    set((s) => ({
      tasks: {
        ...s.tasks,
        [projectId]: (s.tasks[projectId] ?? []).filter((t) => t.id !== taskId),
      },
    })),
}));
