import { invoke } from '@tauri-apps/api/core';
import { EXECUTOR_SCHEMA_VERSION, SUITE_MANIFEST } from '../config/suiteManifest';
import { initialExecutorState } from '../data/executorSeed';
import type { ExecutorState } from '../types/executor';
import { isTauriRuntime, logError } from './storage';

const LOCAL_KEY = 'animals-suite-executor-state-v1';

export async function loadExecutorState(): Promise<ExecutorState | null> {
  try {
    if (isTauriRuntime()) {
      const raw = await invoke<string | null>('load_executor_state');
      return raw ? migrateExecutorState(JSON.parse(raw) as ExecutorState) : null;
    }
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? migrateExecutorState(JSON.parse(raw) as ExecutorState) : null;
  } catch (error) {
    await logError('loadExecutorState', error);
    return null;
  }
}

export async function saveExecutorState(state: ExecutorState): Promise<{ ok: boolean; hash: string }> {
  const raw = JSON.stringify(state);
  try {
    if (isTauriRuntime()) {
      const hash = await invoke<string>('save_executor_state', { json: raw });
      const verify = await invoke<string | null>('load_executor_state');
      return { ok: verify === raw, hash };
    }
    localStorage.setItem(LOCAL_KEY, raw);
    const verify = localStorage.getItem(LOCAL_KEY);
    return { ok: verify === raw, hash: simpleHash(raw) };
  } catch (error) {
    await logError('saveExecutorState', error);
    return { ok: false, hash: '' };
  }
}

export async function syncContentManifest(): Promise<void> {
  if (!isTauriRuntime()) return;
  try {
    await invoke('save_content_manifest', { json: JSON.stringify(SUITE_MANIFEST) });
  } catch (error) {
    await logError('syncContentManifest', error);
  }
}

export function migrateExecutorState(input: ExecutorState): ExecutorState {
  const base = structuredClone(initialExecutorState);
  return {
    ...base,
    ...input,
    schemaVersion: EXECUTOR_SCHEMA_VERSION,
    contentVersion: SUITE_MANIFEST.contentVersion,
    progress: input.progress ?? {},
    notes: input.notes ?? [],
    focusItems: input.focusItems ?? [],
    bookmarks: input.bookmarks ?? [],
    issues: Number(input.schemaVersion ?? 1) < 3 && !(input.issues?.length) ? base.issues : (input.issues ?? base.issues),
    entityLinks: input.entityLinks ?? [],
    entityStates: input.entityStates ?? {},
    testRuns: input.testRuns ?? {},
    recentLocations: input.recentLocations ?? [],
    settings: { ...base.settings, ...(input.settings ?? {}) },
    saveVerificationOk: input.saveVerificationOk ?? true,
  };
}

function simpleHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
