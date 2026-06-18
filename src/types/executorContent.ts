export interface ExecutorContentManifest {
  version: string;
  generatedAt: string;
  sourceVersion: string;
  desktopOnly: boolean;
  counts: {
    stages: number;
    missions: number;
    detailedMissions: number;
    plannedMissions: number;
    tasks: number;
    steps: number;
    guides: number;
    scripts: number;
  };
  validation: {
    missingGuideRefs: string[];
    duplicateScriptIds: string[];
    missionIdsUnique: boolean;
    stepIdsUnique: boolean;
  };
}

export interface ImportedBuildStage {
  id: string;
  number: number;
  title: string;
  missionIds: string[];
}

export interface ImportedBuildStep {
  id: string;
  index: number;
  title: string;
  actions: string[];
  expected: string;
  trouble: string;
  why: string;
  guide: string;
  art: string;
  preset: string;
}

export interface ImportedBuildTask {
  id: string;
  index: number;
  code: string;
  title: string;
  purpose: string;
  result: string;
  guide: string;
  scripts: string[];
  art: string;
  preset: string;
  steps: ImportedBuildStep[];
}

export interface ImportedBuildMission {
  id: string;
  legacyId: number;
  number: number;
  stageId: string;
  phase: string;
  title: string;
  summary: string;
  objective: string;
  result: string;
  sourceStatus: string;
  detailed: boolean;
  roadmap: boolean;
  guide: string;
  scripts: string[];
  warnings: string[];
  prerequisites: string[];
  art: string;
  preset: string;
  tasks: ImportedBuildTask[];
}

export interface BuildMissionIndexItem {
  id: string;
  legacyId: number;
  number: number;
  stageId: string;
  phase: string;
  title: string;
  summary: string;
  detailed: boolean;
  roadmap: boolean;
  taskCount: number;
  stepCount: number;
  scripts: string[];
  guide: string;
}

export interface GuideTocItem {
  id: string;
  level: number;
  label: string;
}

export interface GuideIndexItem {
  slug: string;
  title: string;
  category: string;
  source: string;
  summary: string;
  searchText: string;
  historical: boolean;
}

export interface GuideDocument extends GuideIndexItem {
  html: string;
  toc: GuideTocItem[];
}

export interface ScriptTypeInfo {
  name: string;
  kind: string;
  bases?: string;
  attrs?: string;
}

export interface ScriptIndexItem {
  id: string;
  path: string;
  filename: string;
  category: string;
  primary: string;
  kind: string;
  summary: string;
  attach: string;
  types: ScriptTypeInfo[];
  dependencies: string[];
  dependencyIds: string[];
  usedBy: string[];
  usedByIds: string[];
  fieldNames: string[];
  methodNames: string[];
}

export interface ScriptFieldInfo {
  name: string;
  type: string;
  mods: string;
  default: string;
  section: string;
  attrs: string;
  inspector: boolean;
  description: string;
}

export interface ScriptMethodInfo {
  name: string;
  return_type?: string;
  returnType?: string;
  params?: string;
  mods?: string;
  summary?: string;
}

export interface ScriptDocument extends Omit<ScriptIndexItem, 'fieldNames' | 'methodNames'> {
  fields: ScriptFieldInfo[];
  methods: ScriptMethodInfo[];
  source: string;
  used_by?: string[];
}

export interface ScriptCatalog {
  version: string;
  count: number;
  categories: string[];
  files: ScriptIndexItem[];
}
