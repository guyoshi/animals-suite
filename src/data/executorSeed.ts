import { EXECUTOR_SCHEMA_VERSION, SUITE_MANIFEST } from '../config/suiteManifest';
import type { ExecutorIssue, ExecutorState } from '../types/executor';

const now = new Date().toISOString();

const seededIssues: ExecutorIssue[] = [
  {
    id: 'issue-save-ngplus-validation',
    title: 'Validar preservação do NG+ no fluxo real de carregamento',
    description: 'O design está definido, mas a ordem entre carregar os dados preservados e reiniciar o restante ainda precisa ser testada no jogo compilado.',
    severity: 'alta', status: 'aberto', affects: ['Save', 'NG+', 'Pós-game'],
    workaround: 'Testar sempre a partir do autosave e manter um save de segurança antes de iniciar o NG+.',
    relatedIds: ['build-mission-095'], source: 'auditoria', createdAt: now, updatedAt: now,
  },
  {
    id: 'issue-iris-base-flow',
    title: 'Fluxo inicial da Íris Base depende da montagem correta das Actions',
    description: 'A forma base não deve permanecer disponível depois da adoção do Cavalo. O fluxo usa Actions e precisa ser validado como sequência completa.',
    severity: 'alta', status: 'aberto', affects: ['Prólogo', 'Formas', 'Save'],
    workaround: 'Usar o Debug Panel apenas para testes isolados e validar depois o fluxo narrativo completo.',
    relatedIds: ['build-mission-031'], source: 'auditoria', createdAt: now, updatedAt: now,
  },
  {
    id: 'issue-jukebox-duplicate-config',
    title: 'Evitar cadastrar a mesma Melodia em listas duplicadas do Jukebox',
    description: 'A filtragem individual funciona, mas uma configuração repetida em listas distintas pode criar entradas redundantes.',
    severity: 'media', status: 'aberto', affects: ['Jukebox', 'Melodias Selvagens'],
    workaround: 'Manter cada melodyId em uma única fonte de configuração.',
    relatedIds: ['build-mission-064'], source: 'auditoria', createdAt: now, updatedAt: now,
  },
];

export const initialExecutorState: ExecutorState = {
  schemaVersion: EXECUTOR_SCHEMA_VERSION,
  contentVersion: SUITE_MANIFEST.contentVersion,
  progress: {},
  notes: [],
  focusItems: [],
  bookmarks: [],
  issues: seededIssues,
  entityLinks: [],
  entityStates: {},
  testRuns: {},
  recentLocations: [],
  currentLocation: undefined,
  settings: {
    sequentialLock: true,
    focusModeEnabled: false,
    gamifiedModeEnabled: false,
    reducedMotion: false,
    preferredLaunchMode: 'planner',
    syncPlannerStatus: true,
    autoCheckUpdates: true,
    dismissedUpdateVersion: undefined,
    lastUpdateCheckAt: undefined,
    musicPlayerEnabled: true,
    musicMode: 'sequencial',
    musicVolume: 0.72,
    musicCurrentTrackId: undefined,
    missionTrackAssignments: {},
  },
  lastSavedAt: undefined,
  lastSaveHash: undefined,
  saveVerificationOk: true,
};
