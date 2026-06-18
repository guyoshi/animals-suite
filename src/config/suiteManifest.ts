import rawManifest from '../../suite.manifest.json';

export type SuiteMode = 'planner' | 'executor';
export type TechnicalStatus = 'implementado' | 'configuravel' | 'design_aprovado' | 'planejado' | 'historico';

export interface SuiteApplicationManifest {
  id: SuiteMode;
  name: string;
  description: string;
  route: string;
  launchArgument: string;
}

export interface SuiteManifest {
  suiteId: string;
  suiteName: string;
  version: string;
  releaseDate: string;
  locale: 'pt-BR';
  contentVersion: string;
  schemas: {
    project: number;
    executor: number;
    database: number;
    portableBundle: number;
  };
  applications: SuiteApplicationManifest[];
  sources: {
    technicalBackup: string;
    gdd: string;
    plannerBaseline: string;
    guideBaseline: string;
  };
  authorityOrder: string[];
  executorContent: {
    expectedBuildMissions: number;
    expectedTasks: number;
    expectedSteps: number;
    expectedGuides: number;
    expectedScripts: number;
    importedBuildMissions: number;
    importedTasks: number;
    importedSteps: number;
    importedGuides: number;
    importedScripts: number;
    migrationStatus: string;
  };
}

export const SUITE_MANIFEST = rawManifest as SuiteManifest;
export const APP_VERSION = SUITE_MANIFEST.version;
export const PROJECT_SCHEMA_VERSION = SUITE_MANIFEST.schemas.project;
export const EXECUTOR_SCHEMA_VERSION = SUITE_MANIFEST.schemas.executor;

export function getApplicationManifest(mode: SuiteMode): SuiteApplicationManifest {
  const app = SUITE_MANIFEST.applications.find(item => item.id === mode);
  if (!app) throw new Error(`Aplicativo da suite não encontrado: ${mode}`);
  return app;
}

export function isSuiteMode(value: unknown): value is SuiteMode {
  return value === 'planner' || value === 'executor';
}
