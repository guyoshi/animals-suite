import type { SuiteMode, TechnicalStatus } from '../config/suiteManifest';
import type { EntityRef, EntityType } from '../types';

export type BuildItemStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'bloqueado' | 'ignorado' | 'retestar';
export type ExecutorOwnerType = 'buildMission' | 'buildTask' | 'buildStep' | 'guide' | 'script' | 'issue' | 'entity' | 'test';
export type EntityImplementationStatus = 'nao_iniciado' | 'configurando' | 'implementado' | 'testado' | 'bloqueado';
export type TestRunStatus = 'nao_testado' | 'passou' | 'falhou' | 'bloqueado';
export type ExecutorMusicMode = 'sequencial' | 'repetir_uma' | 'aleatorio' | 'por_missao';

export interface BuildSourceRef {
  kind: 'decision' | 'script' | 'gdd' | 'planner' | 'guide';
  id: string;
  label: string;
  path?: string;
  section?: string;
  version?: string;
}

export interface BuildStepDefinition {
  id: string;
  taskId: string;
  missionId: string;
  title: string;
  objective: string;
  actions: string[];
  expectedResult: string;
  rationale?: string;
  prerequisites: string[];
  completionChecks: string[];
  relatedEntityIds: string[];
  relatedScriptIds: string[];
  relatedGuideIds: string[];
  sources: BuildSourceRef[];
  technicalStatus: TechnicalStatus;
}

export interface BuildTaskDefinition {
  id: string;
  missionId: string;
  title: string;
  description: string;
  stepIds: string[];
  dependsOnTaskIds: string[];
  relatedEntityIds: string[];
}

export interface BuildMissionDefinition {
  id: string;
  stageId: string;
  number: number;
  title: string;
  description: string;
  taskIds: string[];
  dependsOnMissionIds: string[];
  relatedEntityIds: string[];
  technicalStatus: TechnicalStatus;
}

export interface BuildStageDefinition {
  id: string;
  number: number;
  title: string;
  description: string;
  missionIds: string[];
}

export interface ExecutorProgressEntry {
  itemId: string;
  itemType: 'mission' | 'task' | 'step';
  status: BuildItemStatus;
  completedAt?: string;
  updatedAt: string;
  overrideReason?: string;
}

export interface ExecutorNote {
  id: string;
  ownerType: ExecutorOwnerType;
  ownerId: string;
  text: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FocusItem {
  id: string;
  ownerType: 'task' | 'step';
  ownerId: string;
  order: number;
  addedAt: string;
  carriedFrom?: string;
  sessionDate?: string;
}

export interface ExecutorIssue {
  id: string;
  title: string;
  description?: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aberto' | 'investigando' | 'resolvido' | 'adiado';
  affects: string[];
  workaround?: string;
  relatedIds: string[];
  relatedEntities?: EntityRef[];
  source?: 'manual' | 'auditoria' | 'validacao';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ExecutorEntityLink {
  id: string;
  entity: EntityRef;
  missionIds: string[];
  guideIds: string[];
  scriptIds: string[];
  source: 'automatico' | 'manual';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutorEntityState {
  entityKey: string;
  status: EntityImplementationStatus;
  updatedAt: string;
  lastTestedAt?: string;
  blocker?: string;
}

export interface ExecutorTestRun {
  recipeId: string;
  ownerId?: string;
  status: TestRunStatus;
  notes?: string;
  updatedAt: string;
}

export interface ExecutorLocation {
  route: string;
  missionId?: string;
  taskId?: string;
  stepId?: string;
  scrollY?: number;
  visitedAt: string;
}

export interface ExecutorSettings {
  sequentialLock: boolean;
  focusModeEnabled: boolean;
  gamifiedModeEnabled: boolean;
  reducedMotion: boolean;
  preferredLaunchMode: SuiteMode;
  syncPlannerStatus: boolean;
  autoCheckUpdates: boolean;
  dismissedUpdateVersion?: string;
  lastUpdateCheckAt?: string;
  musicPlayerEnabled: boolean;
  musicMode: ExecutorMusicMode;
  musicVolume: number;
  musicCurrentTrackId?: string;
  missionTrackAssignments: Record<string, string>;
}

export interface ExecutorState {
  schemaVersion: number;
  contentVersion: string;
  progress: Record<string, ExecutorProgressEntry>;
  notes: ExecutorNote[];
  focusItems: FocusItem[];
  bookmarks: string[];
  issues: ExecutorIssue[];
  entityLinks: ExecutorEntityLink[];
  entityStates: Record<string, ExecutorEntityState>;
  testRuns: Record<string, ExecutorTestRun>;
  recentLocations: ExecutorLocation[];
  currentLocation?: ExecutorLocation;
  settings: ExecutorSettings;
  lastSavedAt?: string;
  lastSaveHash?: string;
  saveVerificationOk: boolean;
}

export interface ExecutorEntitySummary {
  ref: EntityRef;
  type: EntityType;
  missionIds: string[];
  guideIds: string[];
  scriptIds: string[];
  implementationStatus: EntityImplementationStatus;
}
