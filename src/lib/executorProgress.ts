import type { ExecutorState, BuildItemStatus } from '../types/executor';
import type { ImportedBuildMission, ImportedBuildTask } from '../types/executorContent';

export interface ProgressStats {
  total: number;
  done: number;
  percent: number;
  inProgress: boolean;
  status: BuildItemStatus;
}

export function getStepDone(executor: ExecutorState, stepId: string): boolean {
  return executor.progress[stepId]?.status === 'concluido';
}

export function getTaskStats(executor: ExecutorState, task: ImportedBuildTask): ProgressStats {
  const total = task.steps.length;
  const done = task.steps.filter(step => getStepDone(executor, step.id)).length;
  return stats(total, done, executor.progress[task.id]?.status);
}

export function getMissionStats(executor: ExecutorState, mission: ImportedBuildMission): ProgressStats {
  const steps = mission.tasks.flatMap(task => task.steps);
  const total = steps.length;
  const done = steps.filter(step => getStepDone(executor, step.id)).length;
  return stats(total, done, executor.progress[mission.id]?.status);
}

export function updateMissionProgress(
  executor: ExecutorState,
  mission: ImportedBuildMission,
  changedStepId: string,
  complete: boolean,
): void {
  const now = new Date().toISOString();
  executor.progress[changedStepId] = {
    itemId: changedStepId,
    itemType: 'step',
    status: complete ? 'concluido' : 'nao_iniciado',
    completedAt: complete ? now : undefined,
    updatedAt: now,
  };

  for (const task of mission.tasks) {
    const taskStats = getTaskStats(executor, task);
    executor.progress[task.id] = {
      itemId: task.id,
      itemType: 'task',
      status: taskStats.status,
      completedAt: taskStats.status === 'concluido' ? now : undefined,
      updatedAt: now,
    };
  }

  const missionStats = getMissionStats(executor, mission);
  executor.progress[mission.id] = {
    itemId: mission.id,
    itemType: 'mission',
    status: missionStats.status,
    completedAt: missionStats.status === 'concluido' ? now : undefined,
    updatedAt: now,
  };
}

export function resetTaskProgress(executor: ExecutorState, mission: ImportedBuildMission, task: ImportedBuildTask): void {
  const now = new Date().toISOString();
  for (const step of task.steps) delete executor.progress[step.id];
  executor.progress[task.id] = {
    itemId: task.id,
    itemType: 'task',
    status: 'nao_iniciado',
    updatedAt: now,
  };
  const missionStats = getMissionStats(executor, mission);
  executor.progress[mission.id] = {
    itemId: mission.id,
    itemType: 'mission',
    status: missionStats.status,
    completedAt: missionStats.status === 'concluido' ? now : undefined,
    updatedAt: now,
  };
}

export function isDetailedMissionUnlocked(
  executor: ExecutorState,
  missions: ImportedBuildMission[],
  mission: ImportedBuildMission,
): boolean {
  if (!executor.settings.sequentialLock || !mission.detailed) return true;
  const detailed = missions.filter(item => item.detailed).sort((a, b) => a.number - b.number);
  const index = detailed.findIndex(item => item.id === mission.id);
  if (index <= 0) return true;
  return getMissionStats(executor, detailed[index - 1]).status === 'concluido';
}

export function getPreviousDetailedMission(missions: ImportedBuildMission[], mission: ImportedBuildMission): ImportedBuildMission | undefined {
  const detailed = missions.filter(item => item.detailed).sort((a, b) => a.number - b.number);
  const index = detailed.findIndex(item => item.id === mission.id);
  return index > 0 ? detailed[index - 1] : undefined;
}

export function findNextIncompleteLocation(executor: ExecutorState, missions: ImportedBuildMission[]) {
  for (const mission of missions.filter(item => item.detailed).sort((a, b) => a.number - b.number)) {
    for (const task of mission.tasks) {
      const step = task.steps.find(item => !getStepDone(executor, item.id));
      if (step) return { mission, task, step };
    }
  }
  return undefined;
}

function stats(total: number, done: number, explicit?: BuildItemStatus): ProgressStats {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  let status: BuildItemStatus = explicit ?? 'nao_iniciado';
  if (total > 0) status = done === total ? 'concluido' : done > 0 ? 'em_andamento' : explicit === 'bloqueado' ? 'bloqueado' : 'nao_iniciado';
  return { total, done, percent, inProgress: done > 0 && done < total, status };
}
