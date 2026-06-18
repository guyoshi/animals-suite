import type {
  EntityRef, EntityRelation, MissionTask, ProjectState, TaskTriggerType,
} from '../types';
import { findMapObject, getEntityInfo, refKey, sameRef } from './entities';

export interface RelationView extends EntityRelation {
  missing?: boolean;
}

export function collectRelations(project: ProjectState): RelationView[] {
  const result: RelationView[] = [];
  const seen = new Set<string>();
  const add = (from: EntityRef, to: EntityRef, kind: string, notes = '', manual = false, id?: string) => {
    if (sameRef(from,to)) return;
    const pair = [refKey(from),refKey(to)].sort().join('|');
    const key = `${pair}|${normal(kind)}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({
      id: id ?? `derived-${hash(`${refKey(from)}|${refKey(to)}|${kind}`)}`,
      from, to, kind, notes, manual, createdAt: manual ? new Date().toISOString() : '',
      missing: !getEntityInfo(project,from) || !getEntityInfo(project,to),
    });
  };

  for (const world of project.worlds) {
    for (const area of project.areas.filter(a=>a.worldId===world.id)) add({type:'world',id:world.id},{type:'area',id:area.id},area.id===world.villageId?'Vila do mundo':'Área do mundo');
    for (const animal of project.animals.filter(a=>a.worldId===world.id)) add({type:'world',id:world.id},{type:'animal',id:animal.id},'Animal do mundo');
    for (const item of project.items.filter(i=>i.worldId===world.id)) add({type:'world',id:world.id},{type:'item',id:item.id},'Item do mundo');
    for (const boss of project.bosses.filter(b=>b.worldId===world.id)) add({type:'world',id:world.id},{type:'boss',id:boss.id},'Boss do mundo');
    for (const emblem of project.emblems.filter(e=>e.worldId===world.id)) add({type:'world',id:world.id},{type:'emblem',id:emblem.id},'Emblema do mundo');
  }

  for (const area of project.areas) {
    for (const animalId of area.animalUnlockIds ?? (area.animalUnlockId ? [area.animalUnlockId] : [])) add({type:'area',id:area.id},{type:'animal',id:animalId},'Desbloqueia animal');
    for (const mechanicId of area.centralMechanicIds) add({type:'area',id:area.id},{type:'mechanic',id:mechanicId},'Mecânica central');
    for (const musicId of area.musicTrackIds) add({type:'area',id:area.id},{type:'music',id:musicId},'Música da área');
    if (area.unlockMissionId) add({type:'area',id:area.id},{type:'mission',id:area.unlockMissionId},'Desbloqueada pela missão');
  }

  for (const animal of project.animals) {
    if (animal.unlockAreaId) add({type:'animal',id:animal.id},{type:'area',id:animal.unlockAreaId},'Área de desbloqueio');
  }

  for (const mechanic of project.mechanics) if (mechanic.firstSuggestedAreaId) add({type:'mechanic',id:mechanic.id},{type:'area',id:mechanic.firstSuggestedAreaId},'Primeira área sugerida');

  for (const npc of project.npcs) {
    add({type:'npc',id:npc.id},{type:'world',id:npc.worldId},'Mundo do NPC');
    add({type:'npc',id:npc.id},{type:'area',id:npc.villageAreaId},'Vila de destino');
    if (npc.rescueAreaId) add({type:'npc',id:npc.id},{type:'area',id:npc.rescueAreaId},'Área de resgate');
    for (const missionId of npc.missionIds) add({type:'npc',id:npc.id},{type:'mission',id:missionId},'Missão relacionada');
    for (const row of npc.shopItems) add({type:'npc',id:npc.id},{type:'item',id:row.itemId},row.customPrice===undefined?'Vende item':`Vende item por ${row.customPrice}`);
  }

  for (const mission of project.missions) {
    const missionRef: EntityRef = {type:'mission',id:mission.id};
    add(missionRef,{type:'world',id:mission.worldId},'Mundo da missão');
    for (const areaId of mission.areaIds) add(missionRef,{type:'area',id:areaId},'Área da missão');
    if (mission.suggestedAreaId) add(missionRef,{type:'area',id:mission.suggestedAreaId},'Área sugerida');
    if (mission.starterNpcId) add(missionRef,{type:'npc',id:mission.starterNpcId},'NPC que inicia');
    for (const rumorId of mission.rumorIds) add(missionRef,{type:'rumor',id:rumorId},'Rumor relacionado');
    for (const task of mission.tasks) {
      const taskRef: EntityRef = {type:'task',id:task.id,parentId:mission.id};
      add(missionRef,taskRef,'Contém tarefa');
      for (const dependencyId of task.dependsOnTaskIds) add(taskRef,{type:'task',id:dependencyId,parentId:mission.id},'Depende da tarefa');
      for (const link of task.completionLinks) {
        const target = triggerTarget(project, link.triggerType, link.targetId, link.mapPointId);
        if (target) add(taskRef,target,`Conclusão: ${triggerLabel(link.triggerType)}`,link.notes ?? '');
      }
      for (const condition of task.autoCompleteConditions) {
        const target = triggerTarget(project, condition.triggerType, condition.targetId);
        if (target) add(taskRef,target,`Condição automática: ${triggerLabel(condition.triggerType)}`,condition.notes ?? '');
      }
    }
  }

  for (const rumor of project.rumors) {
    for (const npcId of rumor.npcIds) add({type:'rumor',id:rumor.id},{type:'npc',id:npcId},'NPC que conta o Rumor');
    for (const missionId of rumor.missionIds) add({type:'rumor',id:rumor.id},{type:'mission',id:missionId},'Missão relacionada');
    for (const areaId of rumor.targetAreaIds) add({type:'rumor',id:rumor.id},{type:'area',id:areaId},'Área indicada pelo Rumor');
  }

  for (const whisper of project.whispers) {
    add({type:'whisper',id:whisper.id},{type:'area',id:whisper.areaId},'Encontrado na área');
    if (whisper.sourceNpcId) add({type:'whisper',id:whisper.id},{type:'npc',id:whisper.sourceNpcId},'Entregue/relacionado ao NPC');
  }

  for (const challenge of project.challenges) {
    const ref: EntityRef = {type:'challenge',id:challenge.id};
    add(ref,{type:'area',id:challenge.areaId},'Desafio da área');
    for (const animalId of challenge.recommendedAnimalIds) add(ref,{type:'animal',id:animalId},'Animal recomendado');
    for (const reward of challenge.npcEventRewards ?? []) add(ref,{type:'npc',id:reward.npcId},'Evento de NPC na recompensa',reward.notes ?? reward.eventId);
    if (challenge.portalMapObjectId) {
      const found = findMapObject(project,challenge.portalMapObjectId);
      if (found) add(ref,{type:'mapObject',id:found.object.id,parentId:found.areaId},'Portal colocado no mapa');
    }
  }

  for (const boss of project.bosses) {
    const ref: EntityRef = {type:'boss',id:boss.id};
    add(ref,{type:'world',id:boss.worldId},'Mundo do boss');
    add(ref,{type:'area',id:boss.areaId},'Área do boss');
    for (const phase of boss.phases) for (const animalId of phase.recommendedAnimalIds) add(ref,{type:'animal',id:animalId},`Recomendado em ${phase.title}`);
  }

  for (const music of project.music) {
    if (music.worldId) add({type:'music',id:music.id},{type:'world',id:music.worldId},'Música do mundo');
    for(const areaId of (music.areaIds?.length?music.areaIds:music.areaId?[music.areaId]:[])) add({type:'music',id:music.id},{type:'area',id:areaId},'Música da área');
  }

  for (const idea of project.ideas) for (const areaId of idea.suggestedAreaIds) add({type:'idea',id:idea.id},{type:'area',id:areaId},'Ideia sugerida para a área');

  for (const resource of project.areaResources) {
    const ref: EntityRef = {type:'areaResource',id:resource.id,parentId:resource.areaId};
    add(ref,{type:'area',id:resource.areaId},'Recurso da área');
    if (resource.missionId) add(ref,{type:'mission',id:resource.missionId},'Missão relacionada');
    if (resource.taskId) add(ref,{type:'task',id:resource.taskId,parentId:resource.missionId},'Tarefa relacionada');
    if (resource.targetAreaId) add(ref,{type:'area',id:resource.targetAreaId},'Área de destino');
    if (resource.mapObjectId) {
      const found=findMapObject(project,resource.mapObjectId);
      if(found)add(ref,{type:'mapObject',id:found.object.id,parentId:found.areaId},'Colocado no mapa');
    }
  }

  for (const image of project.galleryImages) {
    const ref:EntityRef={type:'galleryImage',id:image.id,parentId:image.ownerId};
    const ownerType=image.ownerType==='area'?'area':image.ownerType==='world'?'world':'boss';
    add(ref,{type:ownerType,id:image.ownerId},'Imagem da galeria');
    if(image.mechanicId)add(ref,{type:'mechanic',id:image.mechanicId},'Ilustra mecânica');
  }

  for (const village of project.villages) {
    for (const placement of village.npcPlacements) add({type:'npc',id:placement.npcId},{type:'area',id:village.areaId},'Posicionado no mapa da vila',placement.note??'');
  }

  for (const map of project.maps) {
    for (const object of map.objects) {
      const objectRef: EntityRef = {type:'mapObject',id:object.id,parentId:map.areaId};
      add(objectRef,{type:'area',id:map.areaId},'Colocado no mapa da área');
      const localResource=object.resourceId?project.areaResources.find(resource=>resource.id===object.resourceId):undefined;
      if(localResource)add(objectRef,{type:'areaResource',id:localResource.id,parentId:localResource.areaId},'Representa recurso local');
      else {const targetType = resourceEntityType(object.resourceType);if (targetType && object.resourceId) add(objectRef,{type:targetType,id:object.resourceId},'Representa recurso');}
      for (const relationId of object.relationIds ?? []) {
        const target = findAnyRefById(project,relationId);
        if (target) add(objectRef,target,'Relação do objeto de mapa');
      }
    }
  }

  for (const relation of project.relations ?? []) add(relation.from,relation.to,relation.kind,relation.notes ?? '',true,relation.id);
  return result;
}

export function relationsFor(project: ProjectState, ref: EntityRef): RelationView[] {
  return collectRelations(project).filter(relation=>sameRef(relation.from,ref)||sameRef(relation.to,ref));
}

export function otherRef(relation: EntityRelation, ref: EntityRef): EntityRef {
  return sameRef(relation.from,ref) ? relation.to : relation.from;
}

export function addManualRelation(project: ProjectState, from: EntityRef, to: EntityRef, kind = 'Relacionado', notes = ''): EntityRelation {
  const existing = (project.relations ?? []).find(r => ((sameRef(r.from,from)&&sameRef(r.to,to))||(sameRef(r.from,to)&&sameRef(r.to,from))) && normal(r.kind)===normal(kind));
  if (existing) return existing;
  const relation: EntityRelation = { id:`rel-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, from, to, kind, notes, createdAt:new Date().toISOString(), manual:true };
  project.relations ??= [];
  project.relations.push(relation);
  syncKnownRelation(project,from,to,kind);
  return relation;
}

export function unlinkRelation(project: ProjectState, relation: EntityRelation): void {
  project.relations = (project.relations ?? []).filter(r=>r.id!==relation.id);
  unsyncKnownRelation(project,relation.from,relation.to);
}

export function removeAllReferences(project: ProjectState, ref: EntityRef): void {
  project.relations = (project.relations ?? []).filter(r=>!sameRef(r.from,ref)&&!sameRef(r.to,ref));
  const id = ref.id;
  if (ref.type === 'npc') {
    project.missions.forEach(m=>{if(m.starterNpcId===id)m.starterNpcId=undefined;m.tasks.forEach(t=>removeTaskTargets(t,id));});
    project.rumors.forEach(r=>{r.npcIds=r.npcIds.filter(x=>x!==id)});
    project.whispers.forEach(w=>{if(w.sourceNpcId===id)w.sourceNpcId=undefined});
    project.challenges.forEach(c=>{c.npcEventRewards=(c.npcEventRewards??[]).filter(x=>x.npcId!==id)});
  }
  if (ref.type === 'mission') {
    project.npcs.forEach(n=>{n.missionIds=n.missionIds.filter(x=>x!==id)});
    project.rumors.forEach(r=>{r.missionIds=r.missionIds.filter(x=>x!==id)});
    project.areas.forEach(a=>{if(a.unlockMissionId===id)a.unlockMissionId=undefined});
    project.missions.forEach(m=>m.tasks.forEach(t=>removeTaskTargets(t,id)));
  }
  if (ref.type === 'item') {
    project.npcs.forEach(n=>{n.shopItems=n.shopItems.filter(x=>x.itemId!==id)});
    project.missions.forEach(m=>m.tasks.forEach(t=>removeTaskTargets(t,id)));
  }
  if (ref.type === 'enemy' || ref.type === 'challenge' || ref.type === 'rumor') project.missions.forEach(m=>m.tasks.forEach(t=>removeTaskTargets(t,id)));
  if (ref.type === 'rumor') project.missions.forEach(m=>{m.rumorIds=m.rumorIds.filter(x=>x!==id)});
  if (ref.type === 'mechanic') project.areas.forEach(a=>{a.centralMechanicIds=a.centralMechanicIds.filter(x=>x!==id)});
  if (ref.type === 'music') project.areas.forEach(a=>{a.musicTrackIds=a.musicTrackIds.filter(x=>x!==id)});
  if (ref.type === 'animal') {
    project.areas.forEach(a=>{a.animalUnlockIds=(a.animalUnlockIds??[]).filter(x=>x!==id);if(a.animalUnlockId===id)a.animalUnlockId=undefined});
    project.challenges.forEach(c=>{c.recommendedAnimalIds=c.recommendedAnimalIds.filter(x=>x!==id)});
    project.bosses.forEach(b=>b.phases.forEach(p=>{p.recommendedAnimalIds=p.recommendedAnimalIds.filter(x=>x!==id)}));
  }
  if (ref.type === 'area') {
    project.npcs.forEach(n=>{if(n.rescueAreaId===id)n.rescueAreaId=undefined});
    project.missions.forEach(m=>{m.areaIds=m.areaIds.filter(x=>x!==id);if(m.suggestedAreaId===id)m.suggestedAreaId=undefined});
    project.rumors.forEach(r=>{r.targetAreaIds=r.targetAreaIds.filter(x=>x!==id)});
    project.ideas.forEach(i=>{i.suggestedAreaIds=i.suggestedAreaIds.filter(x=>x!==id)});
  }
  if (ref.type === 'mapObject') {
    project.challenges.forEach(c=>{if(c.portalMapObjectId===id)c.portalMapObjectId=undefined});
    project.areaResources.forEach(r=>{if(r.mapObjectId===id)r.mapObjectId=undefined});
    project.missions.forEach(m=>m.tasks.forEach(t=>{t.completionLinks=t.completionLinks.filter(x=>x.mapPointId!==id&&x.targetId!==id);t.autoCompleteConditions=t.autoCompleteConditions.filter(x=>x.targetId!==id)}));
  }
  if(ref.type==='areaResource'){const resource=project.areaResources.find(r=>r.id===id);project.missions.forEach(m=>m.tasks.forEach(t=>{removeTaskTargets(t,id);if(resource?.mapObjectId)removeTaskTargets(t,resource.mapObjectId)}));}
  if(ref.type==='galleryImage')project.galleryImages.forEach(image=>{if(image.mechanicId===id)image.mechanicId=undefined});
  for (const map of project.maps) for (const object of map.objects) {
    if (object.resourceId===id) object.resourceId=undefined;
    object.relationIds=(object.relationIds??[]).filter(x=>x!==id);
  }
}

function syncKnownRelation(project: ProjectState, a: EntityRef, b: EntityRef, kind: string): void {
  const [left,right] = orderPair(a,b);
  if (left.type==='npc'&&right.type==='mission') {
    const npc=project.npcs.find(x=>x.id===left.id);const mission=project.missions.find(x=>x.id===right.id);
    if(npc&&!npc.missionIds.includes(right.id))npc.missionIds.push(right.id);
    if(mission&&normal(kind).includes('inicia'))mission.starterNpcId=left.id;
  }
  if (left.type==='npc'&&right.type==='rumor') {const r=project.rumors.find(x=>x.id===right.id);if(r&&!r.npcIds.includes(left.id))r.npcIds.push(left.id)}
  if (left.type==='mission'&&right.type==='rumor') {const m=project.missions.find(x=>x.id===left.id);const r=project.rumors.find(x=>x.id===right.id);if(m&&!m.rumorIds.includes(right.id))m.rumorIds.push(right.id);if(r&&!r.missionIds.includes(left.id))r.missionIds.push(left.id)}
  if (left.type==='area'&&right.type==='mission') {const m=project.missions.find(x=>x.id===right.id);if(m&&!m.areaIds.includes(left.id))m.areaIds.push(left.id)}
  if (left.type==='area'&&right.type==='rumor') {const r=project.rumors.find(x=>x.id===right.id);if(r&&!r.targetAreaIds.includes(left.id))r.targetAreaIds.push(left.id)}
  if (left.type==='npc'&&right.type==='whisper') {const w=project.whispers.find(x=>x.id===right.id);if(w)w.sourceNpcId=left.id}
  if (left.type==='item'&&right.type==='npc') {const n=project.npcs.find(x=>x.id===right.id);if(n&&!n.shopItems.some(x=>x.itemId===left.id))n.shopItems.push({itemId:left.id})}
  if (left.type==='area'&&right.type==='mechanic') {const area=project.areas.find(x=>x.id===left.id);if(area&&!area.centralMechanicIds.includes(right.id))area.centralMechanicIds.push(right.id)}
  const resourceRef=a.type==='areaResource'?a:b.type==='areaResource'?b:undefined;const otherResource=resourceRef?(sameRef(resourceRef,a)?b:a):undefined;
  if(resourceRef&&otherResource){const resource=project.areaResources.find(x=>x.id===resourceRef.id);if(resource){if(otherResource.type==='mission')resource.missionId=otherResource.id;if(otherResource.type==='task'){resource.taskId=otherResource.id;resource.missionId=otherResource.parentId??resource.missionId}if(otherResource.type==='mapObject')resource.mapObjectId=otherResource.id}}
  const galleryRef=a.type==='galleryImage'?a:b.type==='galleryImage'?b:undefined;const galleryOther=galleryRef?(sameRef(galleryRef,a)?b:a):undefined;if(galleryRef&&galleryOther?.type==='mechanic'){const image=project.galleryImages.find(x=>x.id===galleryRef.id);if(image)image.mechanicId=galleryOther.id}
}

function unsyncKnownRelation(project: ProjectState, a: EntityRef, b: EntityRef): void {
  const taskRef = a.type === 'task' ? a : b.type === 'task' ? b : undefined;
  if (taskRef) {
    const other = sameRef(taskRef,a) ? b : a;
    const mission = project.missions.find(m=>m.id===taskRef.parentId || m.tasks.some(t=>t.id===taskRef.id));
    const task = mission?.tasks.find(t=>t.id===taskRef.id);
    if (task) {
      if (other.type === 'task') task.dependsOnTaskIds = task.dependsOnTaskIds.filter(id=>id!==other.id);
      else if (other.type !== 'mission') {
        task.completionLinks = task.completionLinks.filter(link=>!triggerMatchesRef(project,link.triggerType,link.targetId,link.mapPointId,other));
        task.autoCompleteConditions = task.autoCompleteConditions.filter(condition=>!triggerMatchesRef(project,condition.triggerType,condition.targetId,undefined,other));
      }
    }
  }
  const [left,right] = orderPair(a,b);
  if (left.type==='npc'&&right.type==='mission') {const n=project.npcs.find(x=>x.id===left.id);const m=project.missions.find(x=>x.id===right.id);if(n)n.missionIds=n.missionIds.filter(x=>x!==right.id);if(m?.starterNpcId===left.id)m.starterNpcId=undefined}
  if (left.type==='npc'&&right.type==='rumor') {const r=project.rumors.find(x=>x.id===right.id);if(r)r.npcIds=r.npcIds.filter(x=>x!==left.id)}
  if (left.type==='mission'&&right.type==='rumor') {const m=project.missions.find(x=>x.id===left.id);const r=project.rumors.find(x=>x.id===right.id);if(m)m.rumorIds=m.rumorIds.filter(x=>x!==right.id);if(r)r.missionIds=r.missionIds.filter(x=>x!==left.id)}
  if (left.type==='area'&&right.type==='mission') {const m=project.missions.find(x=>x.id===right.id);if(m)m.areaIds=m.areaIds.filter(x=>x!==left.id)}
  if (left.type==='area'&&right.type==='rumor') {const r=project.rumors.find(x=>x.id===right.id);if(r)r.targetAreaIds=r.targetAreaIds.filter(x=>x!==left.id)}
  if (left.type==='npc'&&right.type==='whisper') {const w=project.whispers.find(x=>x.id===right.id);if(w?.sourceNpcId===left.id)w.sourceNpcId=undefined}
  if (left.type==='item'&&right.type==='npc') {const n=project.npcs.find(x=>x.id===right.id);if(n)n.shopItems=n.shopItems.filter(x=>x.itemId!==left.id)}
  if (left.type==='area'&&right.type==='mechanic') {const area=project.areas.find(x=>x.id===left.id);if(area)area.centralMechanicIds=area.centralMechanicIds.filter(x=>x!==right.id)}
  if (left.type==='area'&&right.type==='music') {const area=project.areas.find(x=>x.id===left.id);if(area)area.musicTrackIds=area.musicTrackIds.filter(x=>x!==right.id);const music=project.music.find(x=>x.id===right.id);if(music){music.areaIds=(music.areaIds??(music.areaId?[music.areaId]:[])).filter(x=>x!==left.id);music.areaId=music.areaIds[0]}}
  if (left.type==='area'&&right.type==='animal') {const area=project.areas.find(x=>x.id===left.id);if(area){area.animalUnlockIds=(area.animalUnlockIds??[]).filter(x=>x!==right.id);if(area.animalUnlockId===right.id)area.animalUnlockId=undefined}}
  if (left.type==='animal'&&right.type==='challenge') {const challenge=project.challenges.find(x=>x.id===right.id);if(challenge)challenge.recommendedAnimalIds=challenge.recommendedAnimalIds.filter(x=>x!==left.id)}
  if (left.type==='animal'&&right.type==='boss') {const boss=project.bosses.find(x=>x.id===right.id);if(boss)boss.phases.forEach(p=>{p.recommendedAnimalIds=p.recommendedAnimalIds.filter(x=>x!==left.id)})}
  if (left.type==='challenge'&&right.type==='mapObject') {const challenge=project.challenges.find(x=>x.id===left.id);if(challenge?.portalMapObjectId===right.id)challenge.portalMapObjectId=undefined}
  if (left.type==='mapObject') {const found=findMapObject(project,left);if(found&&found.object.resourceId===right.id)found.object.resourceId=undefined}
  if (right.type==='mapObject') {const found=findMapObject(project,right);if(found&&found.object.resourceId===left.id)found.object.resourceId=undefined}
  const resourceRef=a.type==='areaResource'?a:b.type==='areaResource'?b:undefined;const resourceOther=resourceRef?(sameRef(resourceRef,a)?b:a):undefined;if(resourceRef&&resourceOther){const resource=project.areaResources.find(x=>x.id===resourceRef.id);if(resource){if(resourceOther.type==='mission'&&resource.missionId===resourceOther.id){resource.missionId=undefined;resource.taskId=undefined}if(resourceOther.type==='task'&&resource.taskId===resourceOther.id)resource.taskId=undefined;if(resourceOther.type==='mapObject'&&resource.mapObjectId===resourceOther.id)resource.mapObjectId=undefined}}
  const galleryRef=a.type==='galleryImage'?a:b.type==='galleryImage'?b:undefined;const galleryOther=galleryRef?(sameRef(galleryRef,a)?b:a):undefined;if(galleryRef&&galleryOther?.type==='mechanic'){const image=project.galleryImages.find(x=>x.id===galleryRef.id);if(image?.mechanicId===galleryOther.id)image.mechanicId=undefined}
}

function orderPair(a:EntityRef,b:EntityRef):[EntityRef,EntityRef] {
  const order:Record<string,number>={area:1,areaResource:2,item:3,npc:4,mission:5,task:6,rumor:7,whisper:8,mechanic:9,galleryImage:10};
  return (order[a.type]??99)<=(order[b.type]??99)?[a,b]:[b,a];
}

function triggerTarget(project: ProjectState, type: TaskTriggerType, targetId?: string, mapPointId?: string): EntityRef|undefined {
  if (type==='npc_interacao'||type==='resgatar_npc') return targetId?{type:'npc',id:targetId}:undefined;
  if (type==='entrar_area') return targetId?{type:'area',id:targetId}:undefined;
  if (type==='possuir_item'||type==='quantidade_item') return targetId?{type:'item',id:targetId}:undefined;
  if (type==='derrotar_inimigo'||type==='quantidade_inimigos') return targetId?{type:'enemy',id:targetId}:undefined;
  if (type==='concluir_desafio') return targetId?{type:'challenge',id:targetId}:undefined;
  if (type==='descobrir_rumor') return targetId?{type:'rumor',id:targetId}:undefined;
  if (type==='missao_concluida') return targetId?{type:'mission',id:targetId}:undefined;
  if (type==='ponto_mapa'||type==='runa_especifica'||type==='objeto_interacao') {
    const resource=targetId?project.areaResources.find(item=>item.id===targetId):undefined;
    if(resource)return{type:'areaResource',id:resource.id,parentId:resource.areaId};
    const found=findMapObject(project,mapPointId||targetId||'');
    if(found)return{type:'mapObject',id:found.object.id,parentId:found.areaId};
    return targetId?findAnyRefById(project,targetId):undefined;
  }
}

function findAnyRefById(project: ProjectState, id:string):EntityRef|undefined {
  const types:Array<[keyof ProjectState,EntityRef['type']]>=[['areas','area'],['animals','animal'],['enemies','enemy'],['items','item'],['mechanics','mechanic'],['npcs','npc'],['missions','mission'],['rumors','rumor'],['whispers','whisper'],['challenges','challenge'],['bosses','boss'],['emblems','emblem'],['music','music'],['ideas','idea'],['areaResources','areaResource'],['galleryImages','galleryImage']];
  for(const [key,type] of types){const c=project[key];if(Array.isArray(c)&&(c as unknown as Array<{id:string}>).some(x=>x.id===id))return{type,id}}
  const found=findMapObject(project,id);return found?{type:'mapObject',id,parentId:found.areaId}:undefined;
}

function resourceEntityType(value?:string):EntityRef['type']|undefined {
  return ({enemy:'enemy',npc:'npc',whisper:'whisper',challenge:'challenge',mechanic:'mechanic',mission:'mission'} as Record<string,EntityRef['type']>)[value??''];
}

function triggerMatchesRef(project:ProjectState,type:TaskTriggerType,targetId:string|undefined,mapPointId:string|undefined,ref:EntityRef):boolean {
  const target=triggerTarget(project,type,targetId,mapPointId);
  return Boolean(target&&sameRef(target,ref));
}
function removeTaskTargets(task:MissionTask,id:string):void {task.completionLinks=task.completionLinks.filter(x=>x.targetId!==id&&x.mapPointId!==id);task.autoCompleteConditions=task.autoCompleteConditions.filter(x=>x.targetId!==id);task.dependsOnTaskIds=task.dependsOnTaskIds.filter(x=>x!==id)}
function triggerLabel(value:TaskTriggerType):string{return ({npc_interacao:'interagir com NPC',objeto_interacao:'interagir com objeto',ponto_mapa:'ponto do mapa',entrar_area:'entrar na área',possuir_item:'possuir item',quantidade_item:'quantidade de item',coletar_runa:'coletar Runa',runa_especifica:'Runa específica',derrotar_inimigo:'derrotar inimigo',quantidade_inimigos:'quantidade de inimigos',resgatar_npc:'resgatar NPC',concluir_desafio:'concluir desafio',descobrir_rumor:'descobrir Rumor',variavel:'variável',missao_concluida:'missão concluída'} as Record<TaskTriggerType,string>)[value]}
function normal(value:string):string{return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function hash(value:string):string{let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
