/**
 * Project API stubs — frontend mock (same pattern as authApi.ts).
 * Replace with real fetch calls when B-09 is complete.
 */
import type { Project, ProjectTask, TaskStatus, TaskPriority, TaskSource } from '../stores/projectStore';

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const randomId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/* ─── Projects ─── */

export async function fetchProjects(): Promise<{ projects: Project[] }> {
  await wait(200);
  // In production: GET /projects
  return { projects: [] }; // Store has mock data; this stub exists for contract parity
}

export async function createProject(body: {
  name: string;
  description?: string;
}): Promise<{ project: Project }> {
  await wait(300);
  const project: Project = {
    id: randomId('proj'),
    user_id: 'user_1',
    name: body.name,
    description: body.description,
    created_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
  };
  return { project };
}

export async function deleteProject(projectId: string): Promise<{ deleted: true }> {
  await wait(250);
  void projectId;
  return { deleted: true };
}

/* ─── Tasks ─── */

export async function fetchProjectTasks(
  projectId: string,
): Promise<{ tasks: ProjectTask[] }> {
  await wait(200);
  void projectId;
  return { tasks: [] };
}

export async function createProjectTask(
  projectId: string,
  body: { title: string; description?: string; priority?: TaskPriority; source?: TaskSource },
): Promise<{ task: ProjectTask }> {
  await wait(280);
  const now = new Date().toISOString();
  const task: ProjectTask = {
    id: randomId('task'),
    project_id: projectId,
    title: body.title,
    description: body.description,
    status: 'backlog',
    source: body.source ?? 'platform',
    priority: body.priority,
    created_at: now,
    updated_at: now,
  };
  return { task };
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  body: { status?: TaskStatus; title?: string; description?: string; arcamatrix_note?: string },
): Promise<{ task: ProjectTask }> {
  await wait(220);
  void projectId;
  // In production this returns the full updated task from the server.
  // The stub returns a minimal shape; the real update is done optimistically via Zustand.
  return {
    task: {
      id: taskId,
      project_id: projectId,
      title: body.title ?? '',
      status: body.status ?? 'backlog',
      source: 'platform',
      created_at: '',
      updated_at: new Date().toISOString(),
    },
  };
}

export async function deleteProjectTask(
  projectId: string,
  taskId: string,
): Promise<{ deleted: true }> {
  await wait(200);
  void projectId;
  void taskId;
  return { deleted: true };
}
