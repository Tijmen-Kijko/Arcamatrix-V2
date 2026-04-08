import { useProjectStore } from '../stores/projectStore';
import type { TaskStatus } from '../stores/projectStore';

/* ─── Project selectors ─── */
export const useProjects = () => useProjectStore((s) => s.projects);
export const useActiveProjectId = () => useProjectStore((s) => s.activeProjectId);
export const useActiveProject = () =>
  useProjectStore((s) => s.projects.find((p) => p.id === s.activeProjectId) ?? null);
export const useSetActiveProject = () => useProjectStore((s) => s.setActiveProject);
export const useAddProject = () => useProjectStore((s) => s.addProject);
export const useDeleteProject = () => useProjectStore((s) => s.deleteProject);

/* ─── Task selectors ─── */
export const useProjectTasks = (projectId: string) =>
  useProjectStore((s) => s.tasks[projectId] ?? []);
export const useTasksByStatus = (projectId: string, status: TaskStatus) =>
  useProjectStore((s) => (s.tasks[projectId] ?? []).filter((t) => t.status === status));
export const useAddTask = () => useProjectStore((s) => s.addTask);
export const useUpdateTask = () => useProjectStore((s) => s.updateTask);
export const useUpdateTaskStatus = () => useProjectStore((s) => s.updateTaskStatus);
export const useDeleteTask = () => useProjectStore((s) => s.deleteTask);

/* ─── Derived selectors ─── */
export const useOpenTaskCount = (projectId: string) =>
  useProjectStore((s) => (s.tasks[projectId] ?? []).filter((t) => t.status !== 'done').length);
export const useInProgressCount = (projectId: string) =>
  useProjectStore((s) => (s.tasks[projectId] ?? []).filter((t) => t.status === 'in_progress').length);
