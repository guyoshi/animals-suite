import { create } from 'zustand';
import { initialExecutorState } from '../data/executorSeed';
import { loadExecutorState, saveExecutorState, syncContentManifest } from '../lib/executorStorage';
import type { ExecutorLocation, ExecutorState } from '../types/executor';

interface ExecutorStore {
  executor: ExecutorState;
  hydrated: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  hydrate: () => Promise<void>;
  mutate: (recipe: (draft: ExecutorState) => void) => void;
  flushSave: () => Promise<void>;
  rememberLocation: (location: ExecutorLocation) => void;
}

let saveTimer: number | undefined;

export const useExecutorStore = create<ExecutorStore>((set, get) => ({
  executor: structuredClone(initialExecutorState),
  hydrated: false,
  saveState: 'idle',

  hydrate: async () => {
    const saved = await loadExecutorState();
    const executor = saved ?? structuredClone(initialExecutorState);
    set({ executor, hydrated: true, saveState: 'saved' });
    await syncContentManifest();
  },

  mutate: (recipe) => {
    const next = structuredClone(get().executor);
    recipe(next);
    set({ executor: next, saveState: 'saving' });
    scheduleSave(get, set);
  },

  flushSave: async () => {
    set({ saveState: 'saving' });
    const next = structuredClone(get().executor);
    next.lastSavedAt = new Date().toISOString();
    const result = await saveExecutorState(next);
    next.lastSaveHash = result.hash;
    next.saveVerificationOk = result.ok;
    set({ executor: next, saveState: result.ok ? 'saved' : 'error' });
  },

  rememberLocation: (location) => get().mutate((draft) => {
    draft.currentLocation = location;
    draft.recentLocations = [location, ...draft.recentLocations.filter(item => item.route !== location.route)].slice(0, 20);
  }),
}));

function scheduleSave(get: () => ExecutorStore, set: (partial: Partial<ExecutorStore>) => void): void {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    const next = structuredClone(get().executor);
    next.lastSavedAt = new Date().toISOString();
    const result = await saveExecutorState(next);
    next.lastSaveHash = result.hash;
    next.saveVerificationOk = result.ok;
    set({ executor: next, saveState: result.ok ? 'saved' : 'error' });
  }, 350);
}
