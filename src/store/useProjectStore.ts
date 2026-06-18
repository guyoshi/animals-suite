import { create } from 'zustand';
import { initialProjectState } from '../data/seed';
import { migrateProject } from '../data/migrate';
import { createSnapshot, loadProject, saveProject } from '../lib/storage';
import { getEntityInfo, removeEntityPermanently, restoreEntitySnapshot, setEntityArchived } from '../lib/entities';
import { addManualRelation, relationsFor, removeAllReferences, unlinkRelation } from '../lib/relations';
import type {
  AreaDef, EntityRef, EntityRelation, EntityStatus, MapDocument, MapObject,
  MissionDef, ProjectState,
} from '../types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface ProjectStore {
  project: ProjectState;
  hydrated: boolean;
  saveState: SaveState;
  selectedWorldId: string;
  selectedAreaId: string;
  past: ProjectState[];
  future: ProjectState[];
  hydrate: () => Promise<void>;
  replaceProject: (state: ProjectState) => void;
  mutate: (recipe: (draft: ProjectState) => void, snapshot?: boolean, historyKey?: string) => void;
  flushSave: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  setSelectedWorld: (id: string) => void;
  setSelectedArea: (id: string) => void;
  updateArea: (areaId: string, patch: Partial<AreaDef>) => void;
  updateMap: (areaId: string, updater: (map: MapDocument) => void, recordHistory?: boolean) => void;
  undoMap: (areaId: string) => void;
  redoMap: (areaId: string) => void;
  addMapObject: (areaId: string, object: MapObject) => void;
  removeMapObject: (areaId: string, objectId: string) => void;
  updateMission: (missionId: string, patch: Partial<MissionDef>) => void;
  setEntityStatus: (entityType: keyof ProjectState, entityId: string, status: EntityStatus) => void;
  archiveEntity: (ref: EntityRef) => boolean;
  restoreTrash: (index: number) => boolean;
  purgeTrash: (index: number) => boolean;
  addRelation: (from: EntityRef, to: EntityRef, kind: string, notes?: string) => EntityRelation | undefined;
  removeRelation: (relation: EntityRelation) => void;
}

let saveTimer: number | undefined;
let lastSnapshotAt = Date.now();
let lastHistoryAt = 0;
let lastHistoryKey = '';
const HISTORY_LIMIT = 50;
const HISTORY_COALESCE_MS = 650;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: structuredClone(initialProjectState),
  hydrated: false,
  saveState: 'idle',
  selectedWorldId: 'w1',
  selectedAreaId: 'trilho-musgo',
  past: [],
  future: [],

  hydrate: async () => {
    const saved = await loadProject();
    if (!saved) {
      set({ project: structuredClone(initialProjectState), hydrated: true, saveState: 'saved', past: [], future: [] });
      return;
    }

    const previousVersion = Number(saved.version ?? 1);
    const migrated = migrateProject(saved);
    if (previousVersion < migrated.version) {
      await createSnapshot(saved, 'manual');
      const result = await saveProject(migrated);
      migrated.settings.lastSavedAt = new Date().toISOString();
      migrated.settings.lastSaveHash = result.hash;
      migrated.settings.saveVerificationOk = result.ok;
      set({ project: migrated, hydrated: true, saveState: result.ok ? 'saved' : 'error', past: [], future: [] });
      return;
    }

    set({ project: migrated, hydrated: true, saveState: 'saved', past: [], future: [] });
  },

  replaceProject: (state) => {
    const current = structuredClone(get().project);
    set({ project: migrateProject(state), past: [current].slice(-HISTORY_LIMIT), future: [], saveState: 'saving' });
    scheduleSave(get, set);
  },

  mutate: (recipe, snapshot = false, historyKey = 'generic') => {
    const current = get().project;
    const next = structuredClone(current);
    recipe(next);
    const now = Date.now();
    const shouldRecord = historyKey !== 'none' && (now - lastHistoryAt > HISTORY_COALESCE_MS || lastHistoryKey !== historyKey);
    const past = shouldRecord ? [...get().past, structuredClone(current)].slice(-HISTORY_LIMIT) : get().past;
    if (shouldRecord) {
      lastHistoryAt = now;
      lastHistoryKey = historyKey;
    }
    set({ project: next, saveState: 'saving', past, future: [] });
    if (snapshot) void createSnapshot(next, 'manual');
    scheduleSave(get, set);
  },

  flushSave: async () => {
    set({ saveState: 'saving' });
    const state = get().project;
    const result = await saveProject(state);
    const next = structuredClone(get().project);
    next.settings.lastSavedAt = new Date().toISOString();
    next.settings.lastSaveHash = result.hash;
    next.settings.saveVerificationOk = result.ok;
    set({ project: next, saveState: result.ok ? 'saved' : 'error' });
  },

  undo: () => {
    const past = [...get().past];
    const previous = past.pop();
    if (!previous) return;
    const current = structuredClone(get().project);
    set({ project: structuredClone(previous), past, future: [current, ...get().future].slice(0,HISTORY_LIMIT), saveState: 'saving' });
    lastHistoryAt = 0;
    scheduleSave(get,set);
  },

  redo: () => {
    const future = [...get().future];
    const next = future.shift();
    if (!next) return;
    const current = structuredClone(get().project);
    set({ project: structuredClone(next), past: [...get().past,current].slice(-HISTORY_LIMIT), future, saveState: 'saving' });
    lastHistoryAt = 0;
    scheduleSave(get,set);
  },

  setSelectedWorld: (id) => set({ selectedWorldId: id }),
  setSelectedArea: (id) => set({ selectedAreaId: id }),

  updateArea: (areaId, patch) => get().mutate((draft) => {
    const area = draft.areas.find((x) => x.id === areaId);
    if (area) Object.assign(area, patch);
  },false,`area:${areaId}`),

  updateMap: (areaId, updater, recordHistory = true) => get().mutate((draft) => {
    const map = draft.maps.find((x) => x.areaId === areaId);
    if (!map) return;
    if (recordHistory) {
      map.history.push(structuredClone(map.objects));
      if (map.history.length > 100) map.history.shift();
      map.future = [];
    }
    updater(map);
  },false,recordHistory?`map:${areaId}`:'none'),

  undoMap: (areaId) => get().mutate((draft) => {
    const map = draft.maps.find((x) => x.areaId === areaId);
    if (!map || map.history.length === 0) return;
    const previous = map.history.pop();
    if (!previous) return;
    map.future.push(structuredClone(map.objects));
    map.objects = previous;
  },false,`map-undo:${areaId}`),

  redoMap: (areaId) => get().mutate((draft) => {
    const map = draft.maps.find((x) => x.areaId === areaId);
    if (!map || map.future.length === 0) return;
    const next = map.future.pop();
    if (!next) return;
    map.history.push(structuredClone(map.objects));
    map.objects = next;
  },false,`map-redo:${areaId}`),

  addMapObject: (areaId, object) => get().updateMap(areaId, (map) => { map.objects.push(object); }),
  removeMapObject: (areaId, objectId) => get().updateMap(areaId, (map) => { map.objects = map.objects.filter((x) => x.id !== objectId); }),

  updateMission: (missionId, patch) => get().mutate((draft) => {
    const mission = draft.missions.find((x) => x.id === missionId);
    if (mission) Object.assign(mission, patch);
  },false,`mission:${missionId}`),

  setEntityStatus: (entityType, entityId, status) => get().mutate((draft) => {
    const collection = draft[entityType];
    if (!Array.isArray(collection)) return;
    const target = (collection as Array<{ id?: string; status?: EntityStatus }>).find((x) => x.id === entityId);
    if (target && 'status' in target) target.status = status;
  },false,`status:${String(entityType)}:${entityId}`),

  archiveEntity: (ref) => {
    const project = get().project;
    const info = getEntityInfo(project,ref);
    if (!info || info.archived) return false;
    get().mutate(draft=>{
      const draftInfo = getEntityInfo(draft,ref);
      if (!draftInfo || !setEntityArchived(draft,ref,true)) return;
      if (!draft.trash.some(row=>row.entityType===ref.type&&row.entityId===ref.id&&row.parentId===ref.parentId)) {
        draft.trash.push({
          entityType:ref.type,
          entityId:ref.id,
          parentId:ref.parentId,
          deletedAt:new Date().toISOString(),
          snapshot:structuredClone(resolveRawEntity(draft,ref)),
          relationSnapshot:structuredClone(relationsFor(draft,ref)),
          displayName:draftInfo.title,
        });
      }
    },true,`archive:${ref.type}:${ref.id}`);
    return true;
  },

  restoreTrash: (index) => {
    const row = get().project.trash[index];
    if (!row) return false;
    get().mutate(draft=>{
      const target=draft.trash[index];if(!target)return;
      restoreEntitySnapshot(draft,{type:target.entityType,id:target.entityId,parentId:target.parentId},target.snapshot);
      for(const relation of target.relationSnapshot??[]) {
        if(relation.manual&&!draft.relations.some(r=>r.id===relation.id))draft.relations.push(structuredClone(relation));
      }
      draft.trash.splice(index,1);
    },true,`restore:${row.entityType}:${row.entityId}`);
    return true;
  },

  purgeTrash: (index) => {
    const row=get().project.trash[index];if(!row)return false;
    get().mutate(draft=>{
      const target=draft.trash[index];if(!target)return;
      const ref:EntityRef={type:target.entityType,id:target.entityId,parentId:target.parentId};
      removeAllReferences(draft,ref);
      removeEntityPermanently(draft,ref);
      draft.trash.splice(index,1);
    },true,`purge:${row.entityType}:${row.entityId}`);
    return true;
  },

  addRelation: (from,to,kind,notes='') => {
    let created:EntityRelation|undefined;
    get().mutate(draft=>{created=addManualRelation(draft,from,to,kind,notes)},false,`relation:${from.type}:${from.id}`);
    return created;
  },

  removeRelation: (relation) => get().mutate(draft=>unlinkRelation(draft,relation),false,`relation-remove:${relation.id}`),
}));

function resolveRawEntity(project:ProjectState,ref:EntityRef):unknown {
  if(ref.type==='task')return project.missions.find(m=>m.id===ref.parentId)?.tasks.find(t=>t.id===ref.id);
  if(ref.type==='mapObject')return project.maps.find(m=>m.areaId===ref.parentId)?.objects.find(o=>o.id===ref.id);
  const map:Partial<Record<EntityRef['type'],keyof ProjectState>>={world:'worlds',area:'areas',animal:'animals',enemy:'enemies',item:'items',mechanic:'mechanics',npc:'npcs',mission:'missions',rumor:'rumors',whisper:'whispers',challenge:'challenges',boss:'bosses',emblem:'emblems',music:'music',idea:'ideas',areaResource:'areaResources',galleryImage:'galleryImages'};
  const key=map[ref.type];const collection=key?project[key]:undefined;
  return Array.isArray(collection)?(collection as unknown as Array<{id:string}>).find(x=>x.id===ref.id):undefined;
}

function scheduleSave(get: () => ProjectStore, set: (partial: Partial<ProjectStore>) => void): void {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    const state = get().project;
    const result = await saveProject(state);
    const updated = structuredClone(get().project);
    updated.settings.lastSavedAt = new Date().toISOString();
    updated.settings.lastSaveHash = result.hash;
    updated.settings.saveVerificationOk = result.ok;
    set({ project: updated, saveState: result.ok ? 'saved' : 'error' });

    const elapsed = Date.now() - lastSnapshotAt;
    if (elapsed >= state.settings.backupMinutes * 60_000) {
      await createSnapshot(updated, 'auto');
      lastSnapshotAt = Date.now();
    }
  }, 450);
}
