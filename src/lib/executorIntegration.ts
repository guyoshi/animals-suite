import type { EntityInfo } from './entities';
import { getEntityInfo, listEntityInfos, refKey } from './entities';
import type { EntityRef, EntityStatus, ProjectState } from '../types';
import type { ImportedBuildMission, ScriptCatalog } from '../types/executorContent';
import type { EntityImplementationStatus, ExecutorEntityLink, ExecutorState } from '../types/executor';

export interface EntityIntegrationResult {
  entity: EntityInfo;
  missionIds: string[];
  guideIds: string[];
  scriptIds: string[];
  automaticMissionIds: string[];
  manualLink?: ExecutorEntityLink;
  status: EntityImplementationStatus;
}

const fallbackGuides: Partial<Record<EntityRef['type'], string[]>> = {
  world: ['mapa-mundo18', 'setup'], area: ['setup', 'localizacao', 'mapa-mundo18'],
  animal: ['animal', 'player'], enemy: ['inimigos'], boss: ['inimigos'], item: ['coleccionaveis'],
  mechanic: ['puzzles'], npc: ['npc', 'vila18'], mission: ['missoes'], task: ['missoes'],
  challenge: ['desafios', 'desafios-iniciante'], music: ['sistemas18', 'menus17'],
  whisper: ['coleccionaveis'], rumor: ['npc'], areaResource: ['puzzles', 'setup'], mapObject: ['mapa', 'puzzles'],
};

const fallbackScripts: Partial<Record<EntityRef['type'], string[]>> = {
  animal: ['AnimalFormData.cs', 'FormSwitcher.cs', 'AbilityRouter.cs'],
  area: ['AreaManager.cs', 'AreaSpawnPoint.cs', 'WorldState.cs'],
  world: ['WorldMapManager.cs', 'WorldState.cs'],
  npc: ['NPCController.cs', 'Action_RescueNpc.cs', 'VillageEvolutionController.cs'],
  mission: ['MissionManager.cs', 'MissionData.cs'], task: ['MissionManager.cs'],
  enemy: ['EnemyController.cs', 'EnemyData.cs', 'EnemyHealth.cs'], boss: ['EnemyMultiPartBoss.cs', 'BossManager.cs'],
  item: ['ItemData.cs', 'InventoryManager.cs'], mechanic: ['Switch.cs', 'Lever.cs'],
  challenge: ['ChallengeManager.cs', 'ChallengeTrigger.cs'], music: ['AudioManager.cs', 'MusicZone.cs', 'JukeboxSectionUI.cs'],
  whisper: ['PlayerProgress.cs', 'EcosPerdidosPickup.cs'],
};

export function getEntityIntegration(
  project: ProjectState,
  executor: ExecutorState,
  missions: ImportedBuildMission[],
  scripts: ScriptCatalog | undefined,
  ref: EntityRef,
): EntityIntegrationResult | undefined {
  const entity = getEntityInfo(project, ref);
  if (!entity) return undefined;
  const manualLink = executor.entityLinks.find(link => refKey(link.entity) === refKey(ref));
  const automaticMissionIds = findAutomaticMissionIds(entity, missions);
  const missionIds = unique([...(manualLink?.missionIds ?? []), ...automaticMissionIds]);
  const relatedMissions = missions.filter(mission => missionIds.includes(mission.id));
  const guideIds = unique([
    ...(manualLink?.guideIds ?? []),
    ...relatedMissions.map(item => item.guide).filter(Boolean),
    ...(fallbackGuides[ref.type] ?? []),
  ]);
  const scriptNames = unique([
    ...(manualLink?.scriptIds ?? []),
    ...relatedMissions.flatMap(item => item.scripts),
    ...(fallbackScripts[ref.type] ?? []),
  ]);
  const scriptIds = resolveScriptIds(scriptNames, scripts);
  return {
    entity,
    missionIds,
    guideIds,
    scriptIds,
    automaticMissionIds,
    manualLink,
    status: executor.entityStates[refKey(ref)]?.status ?? mapPlannerStatus(entity.status),
  };
}

export function getAllEntityIntegrations(project: ProjectState, executor: ExecutorState, missions: ImportedBuildMission[], scripts?: ScriptCatalog): EntityIntegrationResult[] {
  return listEntityInfos(project, false).map(info => getEntityIntegration(project, executor, missions, scripts, info.ref)).filter((value): value is EntityIntegrationResult => Boolean(value));
}

export function upsertEntityLink(links: ExecutorEntityLink[], ref: EntityRef, patch: Partial<Pick<ExecutorEntityLink, 'missionIds'|'guideIds'|'scriptIds'|'notes'>>): ExecutorEntityLink[] {
  const key = refKey(ref);
  const index = links.findIndex(link => refKey(link.entity) === key);
  const now = new Date().toISOString();
  if (index < 0) return [...links, { id: `entity-link-${crypto.randomUUID()}`, entity: ref, missionIds: [], guideIds: [], scriptIds: [], source: 'manual', createdAt: now, updatedAt: now, ...patch }];
  const next = [...links];
  next[index] = { ...next[index], ...patch, source: 'manual', updatedAt: now };
  return next;
}

export function plannerStatusForImplementation(status: EntityImplementationStatus): EntityStatus | undefined {
  if (status === 'nao_iniciado') return 'planejado';
  if (status === 'bloqueado') return 'erro';
  return 'unity';
}

export function mapPlannerStatus(status?: EntityStatus): EntityImplementationStatus {
  if (status === 'erro') return 'bloqueado';
  if (status === 'unity') return 'implementado';
  return 'nao_iniciado';
}

export function entityRefFromParams(type: string | undefined, id: string | undefined, parentId?: string | null): EntityRef | undefined {
  if (!type || !id) return undefined;
  return { type: type as EntityRef['type'], id, ...(parentId ? { parentId } : {}) };
}

function findAutomaticMissionIds(entity: EntityInfo, missions: ImportedBuildMission[]): string[] {
  const title = normalize(entity.title);
  const id = normalize(entity.ref.id.replace(/[-_]/g, ' '));
  if (title.length < 4 && id.length < 4) return [];
  return missions.filter(mission => {
    const text = normalize(missionSearchText(mission));
    const titleHit = title.length >= 4 && containsWhole(text, title);
    const idHit = id.length >= 5 && containsWhole(text, id);
    return titleHit || idHit;
  }).map(mission => mission.id);
}

function missionSearchText(mission: ImportedBuildMission): string {
  return [mission.title, mission.summary, mission.objective, mission.result, mission.guide, ...mission.scripts, ...mission.warnings, ...mission.prerequisites,
    ...mission.tasks.flatMap(task => [task.title, task.purpose, task.result, task.guide, ...task.scripts, ...task.steps.flatMap(step => [step.title, step.expected, step.why, step.guide, ...step.actions])])].join(' ');
}

function resolveScriptIds(values: string[], catalog?: ScriptCatalog): string[] {
  if (!catalog) return values;
  const resolved: string[] = [];
  for (const value of values) {
    const normalized = normalize(value.replace(/\.cs$/i, ''));
    const direct = catalog.files.find(file => file.id === value || normalize(file.filename.replace(/\.cs$/i, '')) === normalized || normalize(file.primary) === normalized);
    if (direct) resolved.push(direct.id);
  }
  return unique(resolved);
}

function containsWhole(haystack: string, needle: string): boolean {
  return ` ${haystack} `.includes(` ${needle} `) || haystack.includes(needle);
}

export function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
}

function unique(values: string[]): string[] { return [...new Set(values.filter(Boolean))]; }
