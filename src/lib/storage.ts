import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import type { ProjectState, SnapshotComparison, SnapshotInfo } from '../types';

const LOCAL_KEY = 'animals-planejador-state-v1';
const SNAPSHOT_KEY = `${LOCAL_KEY}-snapshots`;
export const isTauriRuntime = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function loadProject(): Promise<ProjectState | null> {
  try {
    if (isTauriRuntime()) {
      const raw = await invoke<string | null>('load_project_state');
      return raw ? JSON.parse(raw) as ProjectState : null;
    }
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) as ProjectState : null;
  } catch (error) {
    await logError('loadProject', error);
    return null;
  }
}

export async function saveProject(state: ProjectState): Promise<{ ok: boolean; hash: string }> {
  const raw = JSON.stringify(state);
  try {
    if (isTauriRuntime()) {
      const hash = await invoke<string>('save_project_state', { json: raw });
      const verify = await invoke<string | null>('load_project_state');
      return { ok: verify === raw, hash };
    }
    localStorage.setItem(LOCAL_KEY, raw);
    const verify = localStorage.getItem(LOCAL_KEY);
    return { ok: verify === raw, hash: simpleHash(raw) };
  } catch (error) {
    await logError('saveProject', error);
    return { ok: false, hash: '' };
  }
}

export async function createSnapshot(state: ProjectState, kind: 'auto' | 'manual' | 'close' = 'manual', name?: string): Promise<void> {
  const raw = JSON.stringify(state);
  try {
    if (isTauriRuntime()) {
      await invoke('create_snapshot', { json: raw, kind, name: name || null, maxAutoBackups: state.settings.maxAutoBackups });
      return;
    }
    const snapshots = readBrowserSnapshots();
    snapshots.unshift({
      id: Date.now(), kind, name, hash: simpleHash(raw), createdAt: new Date().toISOString(), sizeBytes: raw.length, json: raw,
    });
    const auto = snapshots.filter(s => s.kind === 'auto').slice(0, Math.max(1, state.settings.maxAutoBackups));
    const other = snapshots.filter(s => s.kind !== 'auto');
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify([...other, ...auto].sort((a,b)=>b.id-a.id)));
  } catch (error) {
    await logError('createSnapshot', error);
  }
}

export async function listSnapshots(): Promise<SnapshotInfo[]> {
  if (isTauriRuntime()) return invoke<SnapshotInfo[]>('list_snapshots');
  return readBrowserSnapshots().map(row => ({ id:row.id, kind:row.kind, name:row.name, hash:row.hash, createdAt:row.createdAt, sizeBytes:row.sizeBytes }));
}

export async function loadSnapshot(id: number): Promise<ProjectState> {
  const raw = isTauriRuntime()
    ? await invoke<string>('load_snapshot', { id })
    : readBrowserSnapshots().find(row => row.id === id)?.json;
  if (!raw) throw new Error('Backup não encontrado.');
  return JSON.parse(raw) as ProjectState;
}

export async function deleteSnapshot(id: number): Promise<void> {
  if (isTauriRuntime()) { await invoke('delete_snapshot', { id }); return; }
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(readBrowserSnapshots().filter(row => row.id !== id)));
}

export async function renameSnapshot(id: number, name: string): Promise<void> {
  if (isTauriRuntime()) { await invoke('rename_snapshot', { id, name }); return; }
  const rows = readBrowserSnapshots();
  const row = rows.find(item => item.id === id);
  if (row) row.name = name.trim();
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(rows));
}

export async function compareSnapshot(id: number, current: ProjectState): Promise<SnapshotComparison> {
  const currentJson = JSON.stringify(current);
  if (isTauriRuntime()) return invoke<SnapshotComparison>('compare_snapshot', { id, currentJson });
  const row = readBrowserSnapshots().find(item => item.id === id);
  if (!row) throw new Error('Backup não encontrado.');
  const snapshot = JSON.parse(row.json) as Record<string, unknown>;
  const now = current as unknown as Record<string, unknown>;
  const keys = ['worlds','areas','animals','enemies','items','mechanics','npcs','missions','rumors','whispers','challenges','bosses','music','ideas','areaResources','galleryImages','relations','trash'];
  const changedCollections = keys.flatMap(key => {
    const a = Array.isArray(now[key]) ? now[key].length : 0;
    const b = Array.isArray(snapshot[key]) ? snapshot[key].length : 0;
    return a === b ? [] : [{ key, current:a, snapshot:b, delta:a-b }];
  });
  const currentHash = simpleHash(currentJson);
  return { equal: currentHash === row.hash, currentHash, snapshotHash: row.hash, changedCollections };
}

export async function openBackupsFolder(): Promise<void> {
  if (isTauriRuntime()) { await invoke('open_backups_folder'); return; }
  alert('No navegador, os backups ficam no armazenamento local do próprio navegador.');
}

export async function exportProject(state: ProjectState): Promise<void> {
  const raw = JSON.stringify(state, null, 2);
  if (isTauriRuntime()) { await invoke('export_project_file', { json: raw }); return; }
  downloadText(raw, 'Animals-Planejador.animalsplan.json', 'application/json');
}

export async function exportPortableProject(state: ProjectState): Promise<void> {
  const raw = JSON.stringify(state);
  if (isTauriRuntime()) { await invoke('export_portable_project', { json: raw }); return; }
  const bundle = JSON.stringify({ format:'animalsplan-portable', version:1, exportedAt:new Date().toISOString(), project:state, media:[] });
  downloadText(bundle, 'Animals-Projeto.animalsplan', 'application/json');
}

export async function importProjectFromFile(file: File): Promise<ProjectState> {
  const raw = await file.text();
  const candidate = JSON.parse(raw) as Record<string, unknown>;
  if (candidate.format === 'animalsplan-portable') {
    if (isTauriRuntime()) {
      const projectJson = await invoke<string>('import_portable_project', { bundle: raw });
      return JSON.parse(projectJson) as ProjectState;
    }
    return candidate.project as ProjectState;
  }
  const parsed = candidate as unknown as ProjectState;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.worlds)) throw new Error('Arquivo de projeto inválido.');
  return parsed;
}

export async function copyMediaFile(dataUrl: string, suggestedName: string, category: string): Promise<string> {
  if (isTauriRuntime()) return invoke<string>('save_media_data_url', { dataUrl, suggestedName, category });
  return dataUrl;
}

export async function mediaFileExists(path?: string): Promise<boolean> {
  if (!path) return false;
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http:') || path.startsWith('https:') || path.startsWith('asset:')) return true;
  if (isTauriRuntime()) return invoke<boolean>('media_file_exists', { path });
  return true;
}

export async function logError(context: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error);
  try {
    if (isTauriRuntime()) await invoke('write_error_log', { context, message });
    else {
      const key = `${LOCAL_KEY}-errors`;
      const current = JSON.parse(localStorage.getItem(key) || '[]') as unknown[];
      current.unshift({ at: new Date().toISOString(), context, message });
      localStorage.setItem(key, JSON.stringify(current.slice(0, 200)));
      console.error(`[${context}]`, error);
    }
  } catch { console.error(`[${context}]`, error); }
}

export async function exportSupportReport(): Promise<void> {
  if (isTauriRuntime()) { await invoke('export_support_report'); return; }
  const errors = localStorage.getItem(`${LOCAL_KEY}-errors`) || '[]';
  downloadText(`ANIMALS - PLANEJADOR | RELATÓRIO DE SUPORTE\n\nGerado em: ${new Date().toISOString()}\n\nERROS RECENTES\n${errors}`, 'Animals-Planejador-Relatorio-Suporte.txt', 'text/plain');
}

export function installGlobalErrorLogging(): void {
  window.addEventListener('error', event => { void logError('window.error', event.error ?? event.message); });
  window.addEventListener('unhandledrejection', event => { void logError('unhandledrejection', event.reason); });
}

export async function persistMediaFile(file: File, category: string): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return copyMediaFile(dataUrl, file.name, category);
}

export function mediaDisplayUrl(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('data:') || value.startsWith('http:') || value.startsWith('https:') || value.startsWith('blob:') || value.startsWith('asset:')) return value;
  return isTauriRuntime() ? convertFileSrc(value) : value;
}

function readBrowserSnapshots(): Array<SnapshotInfo & {json:string}> {
  return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '[]') as Array<SnapshotInfo & {json:string}>;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadText(value:string, name:string, type:string):void {
  const blob = new Blob([value], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function simpleHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16);
}
