import { initialProjectState } from './seed';
import { PROJECT_SCHEMA_VERSION } from '../config/suiteManifest';
import { migrateLegacyMusicAttachment } from '../lib/musicAttachments';
import type {
  AreaResourceDef, GaiaMapBackgroundImage, MapDocument, MissionCompletionLink, MissionDef,
  MissionTask, ProjectState, TaskTriggerType,
} from '../types';

const CURRENT_VERSION = PROJECT_SCHEMA_VERSION;

export function migrateProject(input: ProjectState): ProjectState {
  const saved = structuredClone(input) as ProjectState;
  const base = structuredClone(initialProjectState);
  const sourceVersion = Number(saved.version ?? 1);

  saved.version = CURRENT_VERSION;
  saved.name ||= base.name;
  saved.worlds = mergeById(saved.worlds ?? [], base.worlds);
  saved.areas = mergeById(saved.areas ?? [], base.areas).map(area => migrateArea(area, base.areas.find(item => item.id === area.id)));
  saved.animals = mergeById(saved.animals ?? [], base.animals).map(animal => migrateAnimal(animal, base.animals.find(item => item.id === animal.id)));
  saved.enemies ??= [];
  saved.items = mergeById(saved.items ?? [], base.items).map(item => migrateItem(item, base.items.find(defaultItem => defaultItem.id === item.id)));
  saved.mechanics = mergeById(saved.mechanics ?? [], base.mechanics).map(mechanic=>({...mechanic,worldIds:mechanic.worldIds??[],scriptRefs:mechanic.scriptRefs??[],configuration:mechanic.configuration??'',implementationStatus:mechanic.implementationStatus??'configuravel'}));
  saved.npcs = mergeById(saved.npcs ?? [], base.npcs).map(npc => ({ ...npc, eventActions:(npc.eventActions??[]).map(action=>({...action,implementationStatus:action.implementationStatus??'implementado',countsForVillageRestoration:action.countsForVillageRestoration??true})), rescueType: npc.rescueType ?? 'interacao', villageLocation: npc.villageLocation ?? '', preBossLine: npc.preBossLine ?? '', postBossLine: npc.postBossLine ?? '', hint: npc.hint ?? '', countsFor100: npc.countsFor100 ?? true, countsForVillageRestoration:npc.countsForVillageRestoration??npc.countsFor100??true, populationRole:npc.populationRole??'resgatado' }));
  saved.missions = mergeById((saved.missions ?? []).map(migrateMission), base.missions.map(migrateMission));
  saved.rumors = (saved.rumors ?? []).map(rumor=>({...rumor,imageCaption:rumor.imageCaption??'',notes:rumor.notes??''}));
  saved.whispers = mergeById(saved.whispers ?? [], base.whispers).map(whisper=>({...whisper,title:whisper.title??'',storyTellerNpcId:whisper.storyTellerNpcId??whisper.sourceNpcId,ecoCost:whisper.ecoCost??whisper.purchaseOrder??1,purchaseOrder:whisper.purchaseOrder??whisper.ecoCost??1,foundState:whisper.foundState??'nao_encontrado',deliveredState:whisper.deliveredState??'nao_entregue',notes:whisper.notes??''}));
  saved.challenges = mergeById(saved.challenges ?? [], base.challenges).map(challenge => ({ ...challenge, repeatable: challenge.repeatable ?? true, primaryReward: challenge.primaryReward ?? challenge.reward ?? '', repeatReward: challenge.repeatReward ?? '', npcEventRewards: challenge.npcEventRewards ?? [], isApoloTrial:false, reward: challenge.reward ?? challenge.primaryReward ?? '',requiredAnimalId:challenge.requiredAnimalId,lockFormDuringTrial:challenge.lockFormDuringTrial??false,allowedCategoryIds:challenge.allowedCategoryIds??[],portalShowAnimalIcon:challenge.portalShowAnimalIcon??true,portalCompletedIndicator:challenge.portalCompletedIndicator??true,portalRewardPreview:challenge.portalRewardPreview??true,objectiveTypes:challenge.objectiveTypes??[],sections:challenge.sections??[],countsFor100:challenge.countsFor100??true }));
  saved.bosses = mergeById(saved.bosses ?? [], base.bosses).map(boss => ({ ...boss, archived: boss.archived ?? false }));
  saved.emblems = mergeById(saved.emblems ?? [], base.emblems).map(emblem => ({ ...emblem, archived: emblem.archived ?? false }));
  saved.music = mergeById(saved.music ?? [], base.music).map(track => { const fallback=base.music.find(item=>item.id===track.id); return migrateLegacyMusicAttachment({ ...track, areaIds: track.areaIds ?? (track.areaId ? [track.areaId] : []), loop:track.loop??true, jukeboxVisibility:track.jukeboxVisibility??fallback?.jukeboxVisibility??'fora_jukebox', melodyId:track.melodyId??fallback?.melodyId, archived: track.archived ?? false }); });
  saved.ideas = mergeById(saved.ideas ?? [], base.ideas).map(idea => ({ ...idea, suggestedAnimalIds:idea.suggestedAnimalIds??[], suggestedAbilities:idea.suggestedAbilities??[], areaReasons:idea.areaReasons??{}, notes:idea.notes??'', archived: idea.archived ?? false }));
  saved.areaResources = migrateAreaResources(saved.areaResources ?? [], saved.maps ?? []);
  saved.villages = mergeByKey(saved.villages ?? [], base.villages, 'areaId').map(village => { const rescued=village.rescuedPopulation??village.currentPopulation??0; const additional=village.additionalPopulation??0; return ({...village,plannedPopulation:village.plannedPopulation??0,currentPopulation:rescued+additional,rescuedPopulation:rescued,additionalPopulation:additional,firstRescueThreshold:village.firstRescueThreshold??2,bossDefeated:village.bossDefeated??false,state:village.state??'vazia',visualEvolution:village.visualEvolution??{vazia:'',primeiros_resgates:'',viva:'',restaurada:'',pos_boss:''},npcPlacements:village.npcPlacements??[],backgroundImages:village.backgroundImages??[],notes:village.notes??''}); });
  saved.galleryImages = (saved.galleryImages ?? []).map((image,index)=>({...image,id:image.id??`galeria-${index}-${Date.now()}`,caption:image.caption??'',kind:image.kind??'referencia',primary:image.primary??false,order:image.order??index,archived:image.archived??false}));
  saved.worldVisuals = mergeByKey(saved.worldVisuals ?? [], base.worldVisuals, 'worldId').map(plan=>({...plan,backgroundImages:plan.backgroundImages??[],drawings:plan.drawings??[],labels:plan.labels??[],layers:plan.layers??{images:{visible:true,locked:false},drawings:{visible:true,locked:false},labels:{visible:true,locked:false}},notes:plan.notes??''}));
  saved.changelog = mergeChangelog(saved.changelog ?? [], base.changelog).map(entry=>({...entry,title:entry.title.replace(/^Etapa\s+\d+\s*[—-]\s*/i,'')}));
  saved.schoolProgress = saved.schoolProgress ?? {};
  saved.apoloTrials = mergeById(saved.apoloTrials ?? [], base.apoloTrials).map(trial=>({...trial,sections:trial.sections??[],unlockedAtWorld100:trial.unlockedAtWorld100??true,countsForBaseCompletion:false,rewardApoloRunes:trial.rewardApoloRunes??1,status:trial.status??'planejado',notes:trial.notes??''}));
  saved.tutorialMessages = mergeById(saved.tutorialMessages ?? [], base.tutorialMessages).map(message=>({...message,requireConfirmation:message.requireConfirmation??message.priority!=='nao_importante',allowPagination:message.allowPagination??true,status:message.status??'planejado',archived:message.archived??false,notes:message.notes??''}));
  saved.localization = {...base.localization,...(saved.localization??{}),languages:(saved.localization?.languages??base.localization.languages).map(language=>({...language}))};
  saved.maps = mergeMaps(saved.maps ?? [], base.maps);
  saved.relations ??= [];
  saved.trash = (saved.trash ?? []).map((row) => migrateTrashRow(row));
  saved.settings = { ...base.settings, ...(saved.settings ?? {}), loopPlayback:saved.settings?.loopPlayback??true };
  saved.worldMap = migrateGaiaMap(saved.worldMap, base.worldMap, sourceVersion);
  upgradeKnown18JuneValues(saved, base, sourceVersion);

  repairRelations(saved);
  return saved;
}

function migrateMission(mission: MissionDef): MissionDef {
  const raw = mission as MissionDef & { stages?: Array<{ taskIds: string[]; completionMode: 'todas' | 'qualquer'; ordered: boolean }> };
  const tasks = (raw.tasks ?? []).map((task, index) => migrateTask(task, index));

  // Converte a ordem visual antiga em dependências reais apenas quando a etapa
  // antiga era explicitamente ordenada. Os dados nunca são apagados em silêncio.
  for (const stage of raw.stages ?? []) {
    if (!stage.ordered) continue;
    const ordered = stage.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as MissionTask[];
    for (let i = 1; i < ordered.length; i += 1) {
      const previous = ordered[i - 1].id;
      if (!ordered[i].dependsOnTaskIds.includes(previous)) ordered[i].dependsOnTaskIds.push(previous);
    }
  }

  // Etapas antigas posteriores dependiam da etapa anterior. Quando a regra era
  // "qualquer", isso não existe no modelo Unity 2.0; preservamos um aviso.
  const stages = raw.stages ?? [];
  for (let i = 1; i < stages.length; i += 1) {
    const previous = stages[i - 1];
    const current = stages[i];
    const previousTaskIds = previous.taskIds.filter(id => tasks.some(t => t.id === id));
    for (const taskId of current.taskIds) {
      const task = tasks.find(t => t.id === taskId);
      if (!task || task.dependsOnTaskIds.length > 0) continue;
      if (previous.completionMode === 'todas') task.dependsOnTaskIds.push(...previousTaskIds);
      else task.notes = appendNote(task.notes, 'Migração de versão anterior: a etapa anterior aceitava “qualquer tarefa”. O sistema Unity 16/06 só aceita todas as dependências; revise esta tarefa.');
    }
  }

  return {
    ...mission,
    tasks,
    rumorIds: mission.rumorIds ?? [],
    areaIds: mission.areaIds ?? [],
    status: mission.status ?? 'planejado',
    archived: mission.archived ?? false,
    stages: undefined,
    autoCompleteOnLastTask: undefined,
    notes: mission.notes ?? '',
    suggestedAreaId: mission.suggestedAreaId,
    clearObjective: mission.clearObjective ?? '',
    vagueHint: mission.vagueHint ?? '',
    extraHint: mission.extraHint ?? '',
    reward: mission.reward ?? '',
    journalText: mission.journalText ?? '',
    completionText: mission.completionText ?? '',
    countsFor100: mission.countsFor100 ?? true,
  };
}

function migrateTask(task: MissionTask, index: number): MissionTask {
  const legacy = task as MissionTask & {
    triggerType?: TaskTriggerType;
    targetId?: string;
    quantity?: number;
    expectedValue?: string;
    mapPointId?: string;
    dependencyMode?: 'todas' | 'qualquer';
  };
  const completionLinks = [...(task.completionLinks ?? [])];
  if (completionLinks.length === 0 && legacy.triggerType) {
    const link: MissionCompletionLink = {
      id: `link-${task.id || index}-${Date.now()}-${index}`,
      triggerType: legacy.triggerType,
      targetId: legacy.targetId,
      quantity: legacy.quantity,
      expectedValue: legacy.expectedValue,
      mapPointId: legacy.mapPointId,
    };
    completionLinks.push(link);
  }

  let notes = task.notes ?? '';
  if (legacy.dependencyMode === 'qualquer') {
    notes = appendNote(notes, 'Migração de versão anterior: “qualquer dependência” não existe no MissionData 15-06 2.0. As dependências agora são todas obrigatórias.');
  }

  return {
    ...task,
    id: task.id || `tarefa_${index}`,
    title: task.title || task.description || `Tarefa ${index + 1}`,
    description: task.description ?? '',
    dependsOnTaskIds: [...new Set(task.dependsOnTaskIds ?? [])],
    completionLinks,
    autoCompleteConditions: task.autoCompleteConditions ?? [],
    autoCompleteRequireAll: task.autoCompleteRequireAll ?? true,
    notes,
    archived: task.archived ?? false,
  };
}

function migrateGaiaMap(saved: ProjectState['worldMap'] | undefined, fallback: ProjectState['worldMap'], sourceVersion: number): ProjectState['worldMap'] {
  const map = saved ? structuredClone(saved) : structuredClone(fallback);
  map.nodes ??= [];
  map.edges ??= [];
  map.drawings ??= [];
  map.gridSize ||= 24;
  map.snapToGrid ??= true;
  map.backgroundImages ??= [];
  map.accessZoneRequired ??= true;
  map.hubAreaId ??= fallback.hubAreaId ?? 'coracao-gaia';
  map.overviewNotes ??= fallback.overviewNotes ?? '';
  map.cameraNotes ??= fallback.cameraNotes ?? '';
  map.nodes = map.nodes.filter(node=>node&&node.id&&node.areaId&&Number.isFinite(Number(node.x))&&Number.isFinite(Number(node.y))).map(node => { const area = initialProjectState.areas.find(item => item.id === node.areaId); return { ...node, x:Number(node.x),y:Number(node.y), unlockMode: node.unlockMode ?? area?.unlockMode, unlockMissionId: node.unlockMissionId ?? area?.unlockMissionId, notes: node.notes ?? '', worldIntro: node.worldIntro ?? false }; });
  const nodeIds=new Set(map.nodes.map(node=>node.id));
  map.edges = map.edges.filter(edge=>edge&&edge.id&&edge.source!==edge.target&&nodeIds.has(edge.source)&&nodeIds.has(edge.target)).map(edge => ({ ...edge, kind: edge.kind ?? 'principal', bidirectional: edge.bidirectional ?? false, notes: edge.notes ?? '',controlPoints:(edge.controlPoints??[]).filter(Number.isFinite) }));

  if (map.backgroundImage && !map.backgroundImages.some(img => img.filePath === map.backgroundImage)) {
    const migrated: GaiaMapBackgroundImage = {
      id: `fundo-migrado-${Date.now()}`,
      filePath: map.backgroundImage,
      x: 0,
      y: 0,
      width: 1200,
      height: 760,
      opacity: 0.55,
      rotation: 0,
      locked: false,
      name: 'Fundo migrado da versão 0.1.x',
    };
    map.backgroundImages.push(migrated);
  }
  map.backgroundImage = undefined;
  if (sourceVersion < 5 && looksLikeSeededFullMap(map)) {
    const hub = map.nodes.find(node=>node.areaId==='coracao-gaia');
    map.nodes = hub ? [hub] : structuredClone(fallback.nodes);
    map.edges = [];
  }
  return map;
}

function mergeMaps(saved: MapDocument[], defaults: MapDocument[]): MapDocument[] {
  const result = [...saved];
  for (const map of defaults) if (!result.some(item => item.areaId === map.areaId)) result.push(structuredClone(map));
  for (const map of result) {
    map.objects ??= [];
    map.history ??= [];
    map.future ??= [];
    map.layers ??= structuredClone(defaults[0]?.layers ?? {});
    map.gridSize ||= 32;
    map.unitScale ||= 1;
    map.backgroundOpacity ??= 0.35;
    map.backgroundImages ??= [];
    map.drawings ??= [];
    map.showStatusOutlines ??= true;
  }
  return result;
}



function migrateArea(area: ProjectState['areas'][number], fallback?: ProjectState['areas'][number]): ProjectState['areas'][number] {
  const legacyUnlock = area.animalUnlockId ? [area.animalUnlockId] : [];
  return {
    ...area,
    animalUnlockIds: area.animalUnlockIds?.length ? area.animalUnlockIds : legacyUnlock,
    unlockMode: area.unlockMode ?? fallback?.unlockMode ?? (area.type === 'boss' ? 'missao_principal' : area.type === 'vila' ? 'automatico' : area.type === 'hub' ? 'inicio' : area.type === 'final' ? 'portao_final' : 'runes'),
    unlockMissionId: area.unlockMissionId ?? fallback?.unlockMissionId,
    designType: area.designType ?? fallback?.designType ?? '', durationEstimate: area.durationEstimate ?? fallback?.durationEstimate ?? '', setting: area.setting ?? fallback?.setting ?? '',
    mainMechanicSummary: area.mainMechanicSummary ?? fallback?.mainMechanicSummary ?? area.description,
    secondaryMechanicSummary: area.secondaryMechanicSummary ?? fallback?.secondaryMechanicSummary ?? '', regionalItemUse: area.regionalItemUse ?? fallback?.regionalItemUse ?? '',
    testedCategories: area.testedCategories ?? fallback?.testedCategories ?? [], hazardNotes: area.hazardNotes ?? fallback?.hazardNotes ?? '', enemyNotes: area.enemyNotes ?? fallback?.enemyNotes ?? '',
    puzzlePlan: area.puzzlePlan ?? fallback?.puzzlePlan ?? '', secretsPlan: area.secretsPlan ?? fallback?.secretsPlan ?? '', shortcutsPlan: area.shortcutsPlan ?? fallback?.shortcutsPlan ?? '',
    checkpointPlan: area.checkpointPlan ?? fallback?.checkpointPlan ?? '', narrativeMoment: area.narrativeMoment ?? fallback?.narrativeMoment ?? '', designGoal: area.designGoal ?? fallback?.designGoal ?? '',
    frustrationRisk: area.frustrationRisk ?? fallback?.frustrationRisk ?? '', uxSolution: area.uxSolution ?? fallback?.uxSolution ?? '',
    ecoTarget: area.type === 'fase' ? (area.ecoTarget ?? 15) : 0,
    melodyTarget: area.type === 'fase' ? (area.melodyTarget ?? 1) : 0,
    whisperTarget: area.type === 'fase' ? Math.max(5,area.whisperTarget??5) : (area.whisperTarget??0),
    countsForBaseCompletion: area.countsForBaseCompletion ?? area.type !== 'apolo',
    apoloTrialId: area.apoloTrialId ?? fallback?.apoloTrialId,
  };
}

function migrateAnimal(animal: ProjectState['animals'][number], fallback?: ProjectState['animals'][number]): ProjectState['animals'][number] {
  const abilities = animal.abilities ?? [animal.primaryAbility ?? '', ...(animal.contextualInteractions ?? [])].filter(Boolean);
  return { ...animal, abilities, primaryAbility: animal.primaryAbility ?? abilities[0] ?? fallback?.primaryAbility ?? '', contextualInteractions: animal.contextualInteractions ?? abilities.slice(1), secondaryTags: animal.secondaryTags ?? fallback?.secondaryTags ?? [], isSecret: animal.isSecret ?? animal.categories.includes('Secreto'),isIrisBase:animal.isIrisBase??fallback?.isIrisBase??false,protectedFromRemoval:animal.protectedFromRemoval??fallback?.protectedFromRemoval??animal.id==='iris-base',surfaceSwim:animal.surfaceSwim??fallback?.surfaceSwim??animal.categories.includes('Aquático'),canDiveAsLand:animal.canDiveAsLand??fallback?.canDiveAsLand??animal.categories.includes('Aquático'),oxygenSeconds:animal.oxygenSeconds??fallback?.oxygenSeconds??(animal.categories.includes('Aquático')?0:20),sinksIfCannotSwim:animal.sinksIfCannotSwim??fallback?.sinksIfCannotSwim??false,underwaterTurnStyle:animal.underwaterTurnStyle??fallback?.underwaterTurnStyle??'direto',swimNotes:animal.swimNotes??fallback?.swimNotes??'',tutorialWarnCannotSwim:animal.tutorialWarnCannotSwim??fallback?.tutorialWarnCannotSwim??false }; 
}

function migrateItem(item: ProjectState['items'][number], fallback?: ProjectState['items'][number]): ProjectState['items'][number] {
  return { ...item, technicalDefaults: item.technicalDefaults ?? fallback?.technicalDefaults ?? '', toggleable: item.toggleable ?? fallback?.toggleable,onlyBuyOnce:item.onlyBuyOnce??fallback?.onlyBuyOnce??false,globallyAvailableInShops:item.globallyAvailableInShops??fallback?.globallyAvailableInShops??false,countsFor100:item.countsFor100??fallback?.countsFor100??false,pickupBehavior:item.pickupBehavior??fallback?.pickupBehavior }; 
}

function upgradeKnown18JuneValues(project: ProjectState, base: ProjectState, sourceVersion: number): void {
  const horse = project.animals.find(animal => animal.id === 'cavalo');
  if (horse?.categories.includes('Predador leve')) horse.categories = horse.categories.map(category => category === 'Predador leve' ? 'Predador' : category);
  const bamboo = project.areas.find(area => area.id === 'bambu-alvorecer');
  if (bamboo && !bamboo.animalUnlockIds?.includes('gibao')) bamboo.animalUnlockIds = [...new Set([...(bamboo.animalUnlockIds ?? []), 'urso-panda', 'gibao'])];
  for (const defaultItem of base.items) {
    const item = project.items.find(entry => entry.id === defaultItem.id);
    if (!item) continue;
    const knownOldDescriptions = ['Escudo de 1 hit.','Aumenta velocidade por alguns segundos.','Adormece inimigos próximos; não funciona em bosses.','Reduz knockback e derrapagem.','Destaca colecionáveis próximos.','Prende inimigos no chão.','Faz inimigos perderem o alvo.','Regeneração suave.','Congela inimigos e projéteis.','Ignora correntes fortes por um tempo.','Rajada vertical extra.'];
    if (knownOldDescriptions.includes(item.description)) item.description = defaultItem.description;
    item.technicalDefaults ||= defaultItem.technicalDefaults ?? '';
  }
  const broto=project.items.find(item=>item.id==='item-broto');
  if(broto){broto.description='Pickup encontrado no chão que recupera vida imediatamente ao ser recolhido.';broto.defaultPrice=0;broto.pickupBehavior='imediato';broto.notes='A cura comprada chama-se Seiva Vital.';}
  const iris=project.animals.find(animal=>animal.id==='iris-base');
  if(iris){iris.protectedFromRemoval=true;iris.isIrisBase=true;}
  for(const area of project.areas){if(area.type==='fase'){area.ecoTarget=15;area.whisperTarget=Math.max(5,area.whisperTarget??5);area.melodyTarget=area.melodyTarget??1;}else area.ecoTarget=0;}
  const eco=project.items.find(item=>item.id==='item-eco-perdido'); if(eco) eco.countsFor100=false;
  const changedMechanicIds=['mec-snapshot-status','mec-melodia-selvagem','mec-populacao-vila-sync','mec-evolucao-vila-cinco-niveis','mec-save-v1','mec-jukebox-favoritos'];
  if(sourceVersion<9){ for(const id of changedMechanicIds){ const current=project.mechanics.find(item=>item.id===id); const fresh=base.mechanics.find(item=>item.id===id); if(current&&fresh) Object.assign(current,structuredClone(fresh)); } }
  for(const track of project.music){ const fallback=base.music.find(item=>item.id===track.id); track.jukeboxVisibility??=fallback?.jukeboxVisibility??'fora_jukebox'; track.melodyId??=fallback?.melodyId; }
  for(const village of project.villages){ village.rescuedPopulation??=village.currentPopulation??0; village.additionalPopulation??=0; village.currentPopulation=(village.rescuedPopulation??0)+(village.additionalPopulation??0); village.firstRescueThreshold??=2; village.bossDefeated??=false; }
}

function repairRelations(project: ProjectState): void {
  for (const npc of project.npcs) npc.missionIds ??= [];
  for (const mission of project.missions) {
    const npcIds = new Set<string>();
    if (mission.starterNpcId) npcIds.add(mission.starterNpcId);
    for (const task of mission.tasks) {
      for (const link of task.completionLinks) {
        if ((link.triggerType === 'npc_interacao' || link.triggerType === 'resgatar_npc') && link.targetId) npcIds.add(link.targetId);
      }
      for (const condition of task.autoCompleteConditions) {
        if ((condition.triggerType === 'npc_interacao' || condition.triggerType === 'resgatar_npc') && condition.targetId) npcIds.add(condition.targetId);
      }
    }
    for (const npc of project.npcs) {
      const shouldHave = npcIds.has(npc.id);
      const has = npc.missionIds.includes(mission.id);
      if (shouldHave && !has) npc.missionIds.push(mission.id);
      if (!shouldHave && has && npc.missionIds.filter(id => id === mission.id).length === 1) {
        // Não removemos relações manuais antigas: só acrescentamos as derivadas.
      }
    }
  }
}



function migrateTrashRow(row: ProjectState['trash'][number] | { entityType?: string; entityId?: string; deletedAt?: string; snapshot?: unknown }): ProjectState['trash'][number] {
  const typeMap: Record<string, ProjectState['trash'][number]['entityType']> = {
    worlds:'world', areas:'area', animals:'animal', enemies:'enemy', items:'item', mechanics:'mechanic', npcs:'npc', missions:'mission', rumors:'rumor', whispers:'whisper', challenges:'challenge', bosses:'boss', emblems:'emblem', music:'music', ideas:'idea',
    world:'world', area:'area', animal:'animal', enemy:'enemy', item:'item', mechanic:'mechanic', npc:'npc', mission:'mission', task:'task', rumor:'rumor', whisper:'whisper', challenge:'challenge', boss:'boss', emblem:'emblem', idea:'idea', mapObject:'mapObject', areaResource:'areaResource', galleryImage:'galleryImage',
  };
  const entityType = typeMap[String(row.entityType ?? '')] ?? 'idea';
  const entityId = String(row.entityId ?? `migrado-${Date.now()}`);
  const snapshot = row.snapshot ?? {};
  const displayName = (snapshot as {name?:string;title?:string;phrase?:string}).name ?? (snapshot as {title?:string}).title ?? (snapshot as {phrase?:string}).phrase ?? entityId;
  return { entityType, entityId, deletedAt: row.deletedAt ?? new Date().toISOString(), snapshot, relationSnapshot: 'relationSnapshot' in row && Array.isArray(row.relationSnapshot) ? row.relationSnapshot : [], displayName, parentId: 'parentId' in row ? row.parentId : undefined };
}
function mergeById<T extends { id: string }>(saved: T[], defaults: T[]): T[] {
  const result = [...saved];
  for (const item of defaults) if (!result.some(existing => existing.id === item.id)) result.push(structuredClone(item));
  return result;
}

function appendNote(current: string | undefined, value: string): string {
  return current ? `${current}\n${value}` : value;
}


function mergeByKey<T extends object>(saved:T[], defaults:T[], key:keyof T):T[]{
  const result=[...saved];
  for(const item of defaults)if(!result.some(existing=>existing[key]===item[key]))result.push(structuredClone(item));
  return result;
}

function mergeChangelog(saved:ProjectState['changelog'], defaults:ProjectState['changelog']){
  const result=[...defaults];
  for(const entry of saved)if(!result.some(item=>item.version===entry.version))result.push(entry);
  return result.sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
}

function migrateAreaResources(existing:AreaResourceDef[], maps:MapDocument[]):AreaResourceDef[]{
  const result=[...existing].map(resource=>({...resource,description:resource.description??'',notes:resource.notes??'',status:resource.status??'planejado',archived:resource.archived??false}));
  const genericKinds:Record<string,AreaResourceDef['kind']>={rune:'rune',chest:'chest',fragment:'fragment',mission:'missionObject'};
  for(const map of maps){
    for(const object of map.objects??[]){
      const kind=genericKinds[String(object.resourceType??'')];
      if(!kind)continue;
      const id=object.resourceId??object.id;
      if(result.some(resource=>resource.id===id))continue;
      result.push({id,areaId:map.areaId,kind,name:object.label??resourceKindName(kind),description:'Importado do mapa da versão anterior.',status:object.status??'planejado',zoneId:object.zoneId,mapObjectId:object.id,notes:'',archived:object.archived??false});
    }
    for(const object of map.objects??[]){
      if(object.type!=='missionPoint')continue;
      const id=object.resourceId??object.id;
      if(result.some(resource=>resource.id===id))continue;
      result.push({id,areaId:map.areaId,kind:'missionPoint',name:object.label??'Ponto de missão',description:'Importado do mapa da versão anterior.',status:object.status??'planejado',zoneId:object.zoneId,mapObjectId:object.id,notes:'',archived:object.archived??false});
    }
  }
  return result;
}

function resourceKindName(kind:AreaResourceDef['kind']){return ({rune:'Runa de Gaia',chest:'Baú',fragment:'Fragmento Vital',missionObject:'Objeto de missão',missionPoint:'Ponto de missão',checkpoint:'Checkpoint',exit:'Saída da área',safeHaven:'Refúgio Seguro',levelNote:'Nota de level design',narrativeObject:'Objeto narrativo'} as Record<AreaResourceDef['kind'],string>)[kind];}

function looksLikeSeededFullMap(map:ProjectState['worldMap']){
  return map.nodes.length>30&&map.nodes.every(node=>node.id===`node-${node.areaId}`)&&map.backgroundImages.length===0&&map.drawings.length===0;
}
