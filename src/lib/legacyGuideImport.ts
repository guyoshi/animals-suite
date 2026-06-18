import type { ExecutorState } from '../types/executor';
import type { ImportedBuildMission } from '../types/executorContent';
import { updateMissionProgress } from './executorProgress';

const LEGACY_PREFIXES = ['animals-guide-18-06-att:', 'animals-guide-18-06:', 'animals-guide-16-06:', 'animals-guide-15-06:'];

export interface LegacyImportResult {
  steps: number;
  notes: number;
  ignored: number;
  sourceVersion: string;
  exportedAt?: string;
}

export function importLegacyGuideData(raw: unknown, executor: ExecutorState, missions: ImportedBuildMission[]): LegacyImportResult {
  if (!raw || typeof raw !== 'object') throw new Error('Arquivo de progresso inválido.');
  const source = raw as { version?: string; exportedAt?: string; items?: Record<string, unknown> };
  if (!source.items || typeof source.items !== 'object') throw new Error('O arquivo não possui a seção items esperada.');
  let steps = 0;
  let notes = 0;
  let ignored = 0;

  for (const [originalKey, value] of Object.entries(source.items)) {
    const prefix = LEGACY_PREFIXES.find(item => originalKey.startsWith(item));
    if (!prefix) { ignored += 1; continue; }
    const key = originalKey.slice(prefix.length);
    const stepMatch = key.match(/^step:(\d+):([^:]+):(\d+)$/);
    if (stepMatch) {
      const legacyMission = Number(stepMatch[1]);
      const taskCode = stepMatch[2];
      const stepIndex = Number(stepMatch[3]);
      const mission = missions.find(item => item.legacyId === legacyMission);
      const task = mission?.tasks.find(item => item.code === taskCode);
      const step = task?.steps[stepIndex];
      if (mission && step) {
        updateMissionProgress(executor, mission, step.id, String(value) === '1');
        steps += 1;
      } else ignored += 1;
      continue;
    }
    const noteMatch = key.match(/^note:(\d+)$/);
    if (noteMatch && String(value).trim()) {
      const mission = missions.find(item => item.legacyId === Number(noteMatch[1]));
      if (mission) {
        const now = new Date().toISOString();
        executor.notes.push({
          id: `legacy-note-${mission.legacyId}-${Date.now()}-${notes}`,
          ownerType: 'buildMission',
          ownerId: mission.id,
          text: String(value),
          tags: ['Importado do guia antigo'],
          createdAt: now,
          updatedAt: now,
        });
        notes += 1;
      } else ignored += 1;
      continue;
    }
    ignored += 1;
  }

  return { steps, notes, ignored, sourceVersion: source.version || 'desconhecida', exportedAt: source.exportedAt };
}
