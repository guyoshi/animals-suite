import type { DuplicateOptions } from '../components/DuplicateDialog';
import type { EntityRef, ProjectState } from '../types';

export function duplicateEntity(draft:ProjectState, ref:EntityRef, options:DuplicateOptions):EntityRef|undefined {
  const suffix=crypto.randomUUID().slice(0,8);
  const now=new Date().toISOString();
  const duplicateManualRelations=(from:EntityRef,to:EntityRef)=>{
    if(!options.relations)return;
    for(const relation of [...draft.relations]){
      const fromMatch=relation.from.type===from.type&&relation.from.id===from.id&&relation.from.parentId===from.parentId;
      const toMatch=relation.to.type===from.type&&relation.to.id===from.id&&relation.to.parentId===from.parentId;
      if(!fromMatch&&!toMatch)continue;
      draft.relations.push({...structuredClone(relation),id:crypto.randomUUID(),from:fromMatch?to:structuredClone(relation.from),to:toMatch?to:structuredClone(relation.to),createdAt:now});
    }
  };

  if(ref.type==='mission'){
    const source=draft.missions.find(x=>x.id===ref.id);if(!source)return;
    const id=`${source.id}-copia-${suffix}`;
    const copy=structuredClone(source);copy.id=id;copy.name=`${source.name} — Cópia`;copy.status='planejado';copy.archived=false;
    if(!options.tasks)copy.tasks=[];
    if(!options.relations){copy.starterNpcId=undefined;copy.rumorIds=[];copy.areaIds=[];}
    else for(const npc of draft.npcs)if(npc.missionIds.includes(source.id))npc.missionIds.push(id);
    if(options.placements){for(const map of draft.maps)for(const object of [...map.objects])if(object.relationIds?.includes(source.id)||object.resourceId===source.id)map.objects.push({...structuredClone(object),id:crypto.randomUUID(),x:object.x+24,y:object.y+24,relationIds:object.relationIds?.map(x=>x===source.id?id:x),resourceId:object.resourceId===source.id?id:object.resourceId});}
    draft.missions.push(copy);duplicateManualRelations(ref,{type:'mission',id});return {type:'mission',id};
  }
  if(ref.type==='npc'){
    const source=draft.npcs.find(x=>x.id===ref.id);if(!source)return;
    const id=`${source.id}-copia-${suffix}`;const copy=structuredClone(source);copy.id=id;copy.name=`${source.name} — Cópia`;copy.status='planejado';copy.archived=false;
    if(!options.relations){copy.missionIds=[];copy.shopItems=[];}
    draft.npcs.push(copy);
    if(options.placements){for(const village of draft.villages)for(const row of [...village.npcPlacements])if(row.npcId===source.id)village.npcPlacements.push({...row,npcId:id,x:row.x+30,y:row.y+30});for(const map of draft.maps)for(const object of [...map.objects])if(object.resourceType==='npc'&&object.resourceId===source.id)map.objects.push({...structuredClone(object),id:crypto.randomUUID(),resourceId:id,x:object.x+24,y:object.y+24});}
    duplicateManualRelations(ref,{type:'npc',id});return {type:'npc',id};
  }
  if(ref.type==='enemy'){
    const source=draft.enemies.find(x=>x.id===ref.id);if(!source)return;const id=`${source.id}-copia-${suffix}`;const copy=structuredClone(source);copy.id=id;copy.name=`${source.name} — Cópia`;copy.status='planejado';copy.archived=false;if(!options.images)copy.image=undefined;draft.enemies.push(copy);
    if(options.placements)for(const map of draft.maps)for(const object of [...map.objects])if(object.resourceType==='enemy'&&object.resourceId===source.id)map.objects.push({...structuredClone(object),id:crypto.randomUUID(),resourceId:id,x:object.x+24,y:object.y+24});duplicateManualRelations(ref,{type:'enemy',id});return {type:'enemy',id};
  }
  if(ref.type==='mechanic'){
    const source=draft.mechanics.find(x=>x.id===ref.id);if(!source)return;const id=`${source.id}-copia-${suffix}`;const copy=structuredClone(source);copy.id=id;copy.name=`${source.name} — Cópia`;copy.archived=false;draft.mechanics.push(copy);
    if(options.relations)for(const area of draft.areas)if(area.centralMechanicIds.includes(source.id))area.centralMechanicIds.push(id);
    if(options.placements)for(const map of draft.maps)for(const object of [...map.objects])if(object.resourceType==='mechanic'&&object.resourceId===source.id)map.objects.push({...structuredClone(object),id:crypto.randomUUID(),resourceId:id,x:object.x+24,y:object.y+24});duplicateManualRelations(ref,{type:'mechanic',id});return {type:'mechanic',id};
  }
  if(ref.type==='challenge'){
    const source=draft.challenges.find(x=>x.id===ref.id);if(!source)return;const id=`${source.id}-copia-${suffix}`;const copy=structuredClone(source);copy.id=id;copy.name=`${source.name} — Cópia`;copy.status='planejado';copy.archived=false;if(!options.relations){copy.recommendedAnimalIds=[];copy.recommendedAbilities=[];copy.npcEventRewards=[];}if(!options.placements)copy.portalMapObjectId=undefined;draft.challenges.push(copy);
    if(options.placements&&source.portalMapObjectId){const map=draft.maps.find(x=>x.areaId===source.areaId);const object=map?.objects.find(x=>x.id===source.portalMapObjectId);if(map&&object){const clone={...structuredClone(object),id:crypto.randomUUID(),x:object.x+24,y:object.y+24,resourceId:id};map.objects.push(clone);copy.portalMapObjectId=clone.id;}}
    duplicateManualRelations(ref,{type:'challenge',id});return {type:'challenge',id};
  }
  if(ref.type==='area'){
    const source=draft.areas.find(x=>x.id===ref.id);if(!source)return;const id=`${source.id}-copia-${suffix}`;const copy=structuredClone(source);copy.id=id;copy.name=`${source.name} — Cópia`;copy.sceneName='';
    if(!options.relations){copy.unlockMissionId=undefined;copy.animalUnlockId=undefined;copy.animalUnlockIds=[];copy.centralMechanicIds=[];copy.musicTrackIds=[];}
    if(!options.images){copy.backgroundImage=undefined;copy.gallery=[];}
    draft.areas.push(copy);
    const sourceMap=draft.maps.find(x=>x.areaId===source.id);if(sourceMap){const map=structuredClone(sourceMap);map.areaId=id;map.objects=options.placements?map.objects.map(object=>({...object,id:crypto.randomUUID(),x:object.x+24,y:object.y+24})):[];map.backgroundImages=options.images?map.backgroundImages:[];map.drawings=[];map.history=[];map.future=[];draft.maps.push(map);}
    if(options.images)for(const image of draft.galleryImages.filter(x=>x.ownerType==='area'&&x.ownerId===source.id))draft.galleryImages.push({...structuredClone(image),id:crypto.randomUUID(),ownerId:id,primary:false});
    duplicateManualRelations(ref,{type:'area',id});return {type:'area',id};
  }
  return undefined;
}
