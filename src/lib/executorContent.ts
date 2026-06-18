import type {
  BuildMissionIndexItem,
  ExecutorContentManifest,
  GuideDocument,
  GuideIndexItem,
  ImportedBuildMission,
  ImportedBuildStage,
  ScriptCatalog,
  ScriptDocument,
} from '../types/executorContent';

const cache = new Map<string, Promise<unknown>>();

function contentUrl(path: string): string {
  return `/executor-content/${path.replace(/^\/+/, '')}`;
}

async function loadJson<T>(path: string): Promise<T> {
  const url = contentUrl(path);
  const existing = cache.get(url);
  if (existing) return existing as Promise<T>;
  const promise = fetch(url).then(async response => {
    if (!response.ok) throw new Error(`Não foi possível carregar ${path} (${response.status}).`);
    return response.json() as Promise<T>;
  });
  cache.set(url, promise);
  return promise;
}

export const loadExecutorContentManifest = () => loadJson<ExecutorContentManifest>('manifest.json');
export const loadBuildStages = () => loadJson<ImportedBuildStage[]>('roadmap/stages.json');
export const loadBuildMissionIndex = () => loadJson<BuildMissionIndexItem[]>('roadmap/index.json');
export const loadBuildMissions = () => loadJson<ImportedBuildMission[]>('roadmap/missions.json');
export const loadGuideIndex = () => loadJson<GuideIndexItem[]>('guides/index.json');
export const loadGuideDocument = (slug: string) => loadJson<GuideDocument>(`guides/${encodeURIComponent(slug)}.json`);
export const loadScriptCatalog = () => loadJson<ScriptCatalog>('scripts/index.json');
export const loadScriptDocument = (id: string) => loadJson<ScriptDocument>(`scripts/${encodeURIComponent(id)}.json`);

export function clearExecutorContentCache(): void {
  cache.clear();
}
