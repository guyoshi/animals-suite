function pad(value: number, width = 3): string {
  if (!Number.isInteger(value) || value < 0) throw new Error(`Número inválido para ID estável: ${value}`);
  return String(value).padStart(width, '0');
}

function segment(value: string | number): string {
  const normalised = String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!normalised) throw new Error('Segmento vazio em ID estável.');
  return normalised;
}

export const stableIds = {
  buildStage(stageNumber: number): string {
    return `build-stage-${pad(stageNumber, 2)}`;
  },
  buildMission(missionNumber: number): string {
    return `build-mission-${pad(missionNumber)}`;
  },
  buildTask(missionNumber: number, taskCode: string | number): string {
    return `build-task-${pad(missionNumber)}-${segment(taskCode)}`;
  },
  buildStep(missionNumber: number, taskCode: string | number, stepNumber: number): string {
    return `build-step-${pad(missionNumber)}-${segment(taskCode)}-${pad(stepNumber)}`;
  },
  note(ownerType: string, ownerId: string, createdAt = Date.now()): string {
    return `note-${segment(ownerType)}-${segment(ownerId)}-${createdAt}`;
  },
};

export function isStableBuildId(value: string): boolean {
  return /^build-(stage-\d{2}|mission-\d{3}|task-\d{3}-[a-z0-9-]+|step-\d{3}-[a-z0-9-]+-\d{3})$/.test(value);
}
