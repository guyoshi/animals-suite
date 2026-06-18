import { hasPlannerMusicAttachment } from './musicAttachments';
import type { EntityRef, EntityStatus, EntityType, MapObject, ProjectState } from '../types';

export interface EntityInfo {
  ref: EntityRef;
  title: string;
  subtitle: string;
  status?: EntityStatus;
  archived: boolean;
  route: string;
  keywords: string[];
  technical: Array<{ label: string; value: string }>;
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  world: 'Mundo', area: 'Área', animal: 'Animal', enemy: 'Inimigo', item: 'Item', mechanic: 'Mecânica',
  npc: 'NPC', mission: 'Missão do jogo', task: 'Tarefa da missão', rumor: 'Rumor', whisper: 'Sussurro da Terra',
  challenge: 'Provação de Gaia', boss: 'Boss', emblem: 'Emblema', music: 'Música', idea: 'Ideia', mapObject: 'Objeto de mapa', areaResource:'Recurso local', galleryImage:'Imagem de galeria',
};

export const ARCHIVABLE_ENTITY_TYPES: EntityType[] = [
  'enemy', 'item', 'mechanic', 'npc', 'mission', 'task', 'rumor', 'whisper', 'challenge', 'music', 'idea', 'mapObject', 'areaResource', 'galleryImage',
];

export function refKey(ref: EntityRef): string {
  return `${ref.type}:${ref.parentId ?? ''}:${ref.id}`;
}

export function sameRef(a: EntityRef, b: EntityRef): boolean {
  return a.type === b.type && a.id === b.id && (a.parentId ?? '') === (b.parentId ?? '');
}

export function canArchive(ref: EntityRef): boolean {
  return ARCHIVABLE_ENTITY_TYPES.includes(ref.type);
}

export function getEntityInfo(project: ProjectState, ref: EntityRef): EntityInfo | undefined {
  const base = (title: string, subtitle: string, route: string, raw: unknown, status?: EntityStatus, archived = false, extra: Array<{label:string;value:unknown}> = []): EntityInfo => ({
    ref,
    title,
    subtitle,
    status,
    archived,
    route,
    keywords: collectKeywords(raw),
    technical: [
      { label: 'ID interno', value: ref.id },
      ...(ref.parentId ? [{ label: 'ID do elemento pai', value: ref.parentId }] : []),
      ...extra.filter(row => row.value !== undefined && row.value !== null && String(row.value).trim() !== '').map(row => ({ label: row.label, value: String(row.value) })),
    ],
  });

  switch (ref.type) {
    case 'world': {
      const item = project.worlds.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, item.lesson, `/world/${item.id}`, item, undefined, false, [{label:'Tipo de asset',value:'WorldData / planejamento'}, {label:'ID da vila',value:item.villageId}, {label:'ID do boss',value:item.bossId}]);
    }
    case 'area': {
      const item = project.areas.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, `${areaTypeLabel(item.type)} · ${project.worlds.find(w=>w.id===item.worldId)?.name ?? item.worldId}`, `/area/${item.id}`, item, undefined, false, [{label:'Scene Name',value:item.sceneName}, {label:'World ID',value:item.worldId}, {label:'Modo de desbloqueio',value:item.unlockMode}, {label:'Missão de desbloqueio',value:item.unlockMissionId}]);
    }
    case 'animal': {
      const item = project.animals.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, `${item.categories.join(' / ')} · ${item.primaryAbility ?? item.abilities[0] ?? 'Sem habilidade definida'}`, `/animals?entity=${encodeURIComponent(item.id)}`, item, undefined, false, [{label:'World ID',value:item.worldId}, {label:'Área de desbloqueio',value:item.unlockAreaId}, {label:'Habilidade principal',value:item.primaryAbility}]);
    }
    case 'enemy': {
      const item = project.enemies.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, `${item.category} · ${item.movement}`, `/enemies?entity=${encodeURIComponent(item.id)}`, item, item.status, item.archived, [{label:'Categoria técnica',value:item.category}]);
    }
    case 'item': {
      const item = project.items.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, `${item.kind} · ${item.defaultPrice} Sementes`, `/items?entity=${encodeURIComponent(item.id)}`, item, item.status, item.archived, [{label:'World ID',value:item.worldId}, {label:'Padrões técnicos',value:item.technicalDefaults}]);
    }
    case 'mechanic': {
      const item = project.mechanics.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, `${item.kind} · fonte ${item.source}`, `/mechanics?entity=${encodeURIComponent(item.id)}`, item, undefined, item.archived, [{label:'Tipo',value:item.kind}, {label:'Área sugerida',value:item.firstSuggestedAreaId}]);
    }
    case 'npc': {
      const item = project.npcs.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, `${item.animal || 'Animal não definido'} · ${item.npcType}`, `/npcs?entity=${encodeURIComponent(item.id)}`, item, item.status, item.archived, [{label:'World ID',value:item.worldId}, {label:'Área da vila',value:item.villageAreaId}, {label:'Área de resgate',value:item.rescueAreaId}]);
    }
    case 'mission': {
      const item = project.missions.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, `${item.type} · ${item.tasks.length} tarefa(s)`, `/missions?entity=${encodeURIComponent(item.id)}`, item, item.status, item.archived, [{label:'World ID',value:item.worldId}, {label:'NPC inicial',value:item.starterNpcId}]);
    }
    case 'task': {
      const mission = project.missions.find(x => x.id === ref.parentId || x.tasks.some(t => t.id === ref.id));
      const item = mission?.tasks.find(x => x.id === ref.id); if (!item || !mission) return;
      const archived = Boolean((item as unknown as {archived?:boolean}).archived);
      return base(item.title || item.id, `Tarefa de ${mission.name}`, `/missions?entity=${encodeURIComponent(mission.id)}&task=${encodeURIComponent(item.id)}`, item, mission.status, archived, [{label:'Mission ID',value:mission.id}, {label:'Dependências',value:item.dependsOnTaskIds.join(', ')}]);
    }
    case 'rumor': {
      const item = project.rumors.find(x => x.id === ref.id); if (!item) return;
      return base(item.title, item.text, `/lore?tab=rumores&entity=${encodeURIComponent(item.id)}`, item, item.status, item.archived, [{label:'World ID',value:item.worldId}]);
    }
    case 'whisper': {
      const item = project.whispers.find(x => x.id === ref.id); if (!item) return;
      return base(item.title || item.phrase || 'Sussurro sem frase', project.areas.find(a=>a.id===item.areaId)?.name ?? item.areaId, `/lore?tab=sussurros&entity=${encodeURIComponent(item.id)}`, item, item.status, item.archived, [{label:'Area ID',value:item.areaId}, {label:'NPC de origem',value:item.sourceNpcId}]);
    }
    case 'challenge': {
      const item = project.challenges.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, `${item.type} · ${project.areas.find(a=>a.id===item.areaId)?.name ?? item.areaId}`, `/relations/challenge/${encodeURIComponent(item.id)}`, item, item.status, item.archived, [{label:'Area ID',value:item.areaId}, {label:'Objeto do portal',value:item.portalMapObjectId}]);
    }
    case 'boss': {
      const item = project.bosses.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, `${item.phases.length} fase(s) · ${item.rewardRunes} Runas`, `/bosses?entity=${encodeURIComponent(item.id)}`, item, item.status, Boolean(item.archived), [{label:'World ID',value:item.worldId}, {label:'Area ID',value:item.areaId}]);
    }
    case 'emblem': {
      const item = project.emblems.find(x => x.id === ref.id); if (!item) return;
      return base(item.name, item.condition, `/progress?entity=${encodeURIComponent(item.id)}`, item, item.status, Boolean(item.archived), [{label:'World ID',value:item.worldId}, {label:'Tipo',value:item.kind}]);
    }
    case 'music': {
      const item = project.music.find(x => x.id === ref.id); if (!item) return;
      return base(item.title, item.role, `/music?entity=${encodeURIComponent(item.id)}`, item, undefined, Boolean(item.archived), [{label:'World ID',value:item.worldId}, {label:'Area IDs',value:(item.areaIds??(item.areaId?[item.areaId]:[])).join(', ')}, {label:'Áudio anexado',value:hasPlannerMusicAttachment(item)?(item.attachment?.originalName??'Sim'):'Não'}]);
    }
    case 'idea': {
      const item = project.ideas.find(x => x.id === ref.id); if (!item) return;
      return base(item.title, item.category, `/ideas?entity=${encodeURIComponent(item.id)}`, item, undefined, Boolean(item.archived || item.discarded), [{label:'Categoria',value:item.category}]);
    }
    case 'areaResource': {
      const item = project.areaResources.find(x=>x.id===ref.id); if(!item)return;
      return base(item.name, `${resourceKindLabel(item.kind)} · ${project.areas.find(a=>a.id===item.areaId)?.name ?? item.areaId}`, `/area/${encodeURIComponent(item.areaId)}?tab=resources&resource=${encodeURIComponent(item.id)}`, item, item.status, item.archived, [{label:'Area ID',value:item.areaId},{label:'Tipo',value:item.kind},{label:'Map Object ID',value:item.mapObjectId},{label:'Mission ID',value:item.missionId},{label:'Task ID',value:item.taskId}]);
    }
    case 'galleryImage': {
      const item=project.galleryImages.find(x=>x.id===ref.id);if(!item)return;
      const route=item.ownerType==='area'?`/area/${encodeURIComponent(item.ownerId)}?tab=gallery&image=${encodeURIComponent(item.id)}`:item.ownerType==='world'?`/world/${encodeURIComponent(item.ownerId)}/visual?image=${encodeURIComponent(item.id)}`:`/bosses?entity=${encodeURIComponent(item.ownerId)}`;
      return base(item.caption||'Imagem sem legenda',`${item.kind} · ${item.ownerType}`,route,item,undefined,item.archived,[{label:'Owner ID',value:item.ownerId},{label:'Caminho',value:item.filePath},{label:'Mecânica',value:item.mechanicId},{label:'Zone ID',value:item.zoneId}]);
    }
    case 'mapObject': {
      const found = findMapObject(project, ref); if (!found) return;
      const { areaId, object } = found;
      return base(object.label || mapObjectLabel(object), `${object.type} · ${project.areas.find(a=>a.id===areaId)?.name ?? areaId}`, `/area/${encodeURIComponent(areaId)}/map?object=${encodeURIComponent(object.id)}`, object, object.status, Boolean(object.archived), [{label:'Area ID',value:areaId}, {label:'Tipo de recurso',value:object.resourceType}, {label:'Resource ID',value:object.resourceId}, {label:'Zone ID',value:object.zoneId}]);
    }
  }
}

export function listEntityInfos(project: ProjectState, includeArchived = false): EntityInfo[] {
  const refs: EntityRef[] = [
    ...project.worlds.map(x=>({type:'world' as const,id:x.id})),
    ...project.areas.map(x=>({type:'area' as const,id:x.id})),
    ...project.animals.map(x=>({type:'animal' as const,id:x.id})),
    ...project.enemies.map(x=>({type:'enemy' as const,id:x.id})),
    ...project.items.map(x=>({type:'item' as const,id:x.id})),
    ...project.mechanics.map(x=>({type:'mechanic' as const,id:x.id})),
    ...project.npcs.map(x=>({type:'npc' as const,id:x.id})),
    ...project.missions.map(x=>({type:'mission' as const,id:x.id})),
    ...project.missions.flatMap(m=>m.tasks.map(t=>({type:'task' as const,id:t.id,parentId:m.id}))),
    ...project.rumors.map(x=>({type:'rumor' as const,id:x.id})),
    ...project.whispers.map(x=>({type:'whisper' as const,id:x.id})),
    ...project.challenges.map(x=>({type:'challenge' as const,id:x.id})),
    ...project.bosses.map(x=>({type:'boss' as const,id:x.id})),
    ...project.emblems.map(x=>({type:'emblem' as const,id:x.id})),
    ...project.music.map(x=>({type:'music' as const,id:x.id})),
    ...project.ideas.map(x=>({type:'idea' as const,id:x.id})),
    ...project.areaResources.map(x=>({type:'areaResource' as const,id:x.id,parentId:x.areaId})),
    ...project.galleryImages.map(x=>({type:'galleryImage' as const,id:x.id,parentId:x.ownerId})),
    ...project.maps.flatMap(m=>m.objects.map(o=>({type:'mapObject' as const,id:o.id,parentId:m.areaId}))),
  ];
  return refs.map(ref=>getEntityInfo(project,ref)).filter((x):x is EntityInfo=>Boolean(x && (includeArchived || !x.archived)));
}

export function findMapObject(project: ProjectState, refOrId: EntityRef | string): {areaId:string;object:MapObject}|undefined {
  const id = typeof refOrId === 'string' ? refOrId : refOrId.id;
  const preferredArea = typeof refOrId === 'string' ? undefined : refOrId.parentId;
  const maps = preferredArea ? [...project.maps.filter(m=>m.areaId===preferredArea), ...project.maps.filter(m=>m.areaId!==preferredArea)] : project.maps;
  for (const map of maps) {
    const object = map.objects.find(x=>x.id===id);
    if (object) return {areaId:map.areaId,object};
  }
}

export function setEntityArchived(project: ProjectState, ref: EntityRef, archived: boolean): boolean {
  if (ref.type === 'mapObject') {
    const found = findMapObject(project, ref); if (!found) return false; found.object.archived = archived; return true;
  }
  if (ref.type === 'task') {
    const mission = project.missions.find(m=>m.id===ref.parentId || m.tasks.some(t=>t.id===ref.id));
    const task = mission?.tasks.find(t=>t.id===ref.id); if (!task) return false;
    (task as unknown as {archived?:boolean}).archived = archived; return true;
  }
  if (ref.type === 'areaResource') {
    const resource=project.areaResources.find(item=>item.id===ref.id); if(!resource)return false;
    resource.archived=archived;
    if(resource.mapObjectId){const found=findMapObject(project,resource.mapObjectId);if(found)found.object.archived=archived;}
    return true;
  }
  const map: Partial<Record<EntityType, keyof ProjectState>> = {
    enemy:'enemies', item:'items', mechanic:'mechanics', npc:'npcs', mission:'missions', rumor:'rumors', whisper:'whispers', challenge:'challenges', boss:'bosses', emblem:'emblems', music:'music', idea:'ideas', areaResource:'areaResources', galleryImage:'galleryImages',
  };
  const key = map[ref.type]; if (!key) return false;
  const collection = project[key]; if (!Array.isArray(collection)) return false;
  const target = (collection as unknown as Array<{id:string;archived?:boolean;discarded?:boolean}>).find(x=>x.id===ref.id); if (!target) return false;
  target.archived = archived;
  if (ref.type === 'idea') target.discarded = archived;
  return true;
}

export function removeEntityPermanently(project: ProjectState, ref: EntityRef): boolean {
  if (ref.type === 'mapObject') {
    const map = project.maps.find(m=>m.areaId===ref.parentId) ?? project.maps.find(m=>m.objects.some(o=>o.id===ref.id));
    if (!map) return false; map.objects = map.objects.filter(o=>o.id!==ref.id); return true;
  }
  if (ref.type === 'task') {
    const mission = project.missions.find(m=>m.id===ref.parentId || m.tasks.some(t=>t.id===ref.id)); if (!mission) return false;
    mission.tasks = mission.tasks.filter(t=>t.id!==ref.id);
    mission.tasks.forEach(t=>{t.dependsOnTaskIds=t.dependsOnTaskIds.filter(id=>id!==ref.id)});
    return true;
  }
  if (ref.type === 'areaResource') {
    const resource=project.areaResources.find(item=>item.id===ref.id);if(!resource)return false;
    if(resource.mapObjectId)for(const map of project.maps)map.objects=map.objects.filter(object=>object.id!==resource.mapObjectId);
    project.areaResources=project.areaResources.filter(item=>item.id!==ref.id);return true;
  }
  const map: Partial<Record<EntityType, keyof ProjectState>> = {
    enemy:'enemies', item:'items', mechanic:'mechanics', npc:'npcs', mission:'missions', rumor:'rumors', whisper:'whispers', challenge:'challenges', boss:'bosses', emblem:'emblems', music:'music', idea:'ideas', areaResource:'areaResources', galleryImage:'galleryImages',
  };
  const key = map[ref.type]; if (!key) return false;
  const collection = project[key]; if (!Array.isArray(collection)) return false;
  const index = (collection as unknown as Array<{id:string}>).findIndex(x=>x.id===ref.id); if (index<0) return false;
  (collection as unknown[]).splice(index,1); return true;
}

function mapObjectLabel(object: MapObject): string {
  if (object.resourceType === 'rune') return 'Runa de Gaia';
  if (object.type === 'missionPoint') return 'Ponto de missão';
  return object.resourceType ? `${object.resourceType} no mapa` : object.type;
}

function resourceKindLabel(value:string):string{return ({rune:'Runa',chest:'Baú',fragment:'Fragmento Vital',missionObject:'Objeto de missão',missionPoint:'Ponto de missão',checkpoint:'Checkpoint',exit:'Saída',safeHaven:'Refúgio Seguro',levelNote:'Nota de level design',narrativeObject:'Objeto narrativo'} as Record<string,string>)[value]??value;}

function areaTypeLabel(value: string): string {
  return ({hub:'Hub',fase:'Fase',vila:'Vila',boss:'Boss',apolo:'Provação de Apolo',final:'Final'} as Record<string,string>)[value] ?? value;
}

function collectKeywords(value: unknown, depth = 0): string[] {
  if (depth > 3 || value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(item=>collectKeywords(item,depth+1));
  if (typeof value === 'object') return Object.values(value as Record<string,unknown>).flatMap(item=>collectKeywords(item,depth+1));
  return [];
}

export function restoreEntitySnapshot(project: ProjectState, ref: EntityRef, snapshot: unknown): boolean {
  if (setEntityArchived(project,ref,false)) return true;
  if (ref.type==='mapObject') {
    const map=project.maps.find(m=>m.areaId===ref.parentId); if(!map)return false;
    map.objects.push(structuredClone(snapshot) as MapObject); return true;
  }
  if (ref.type==='task') {
    const mission=project.missions.find(m=>m.id===ref.parentId); if(!mission)return false;
    mission.tasks.push(structuredClone(snapshot) as ProjectState['missions'][number]['tasks'][number]); return true;
  }
  const mapping:Partial<Record<EntityType,keyof ProjectState>>={enemy:'enemies',item:'items',mechanic:'mechanics',npc:'npcs',mission:'missions',rumor:'rumors',whisper:'whispers',challenge:'challenges',boss:'bosses',emblem:'emblems',music:'music',idea:'ideas',areaResource:'areaResources',galleryImage:'galleryImages'};
  const key=mapping[ref.type];if(!key)return false;
  const collection=project[key];if(!Array.isArray(collection))return false;
  (collection as unknown[]).push(structuredClone(snapshot));
  setEntityArchived(project,ref,false);
  return true;
}
