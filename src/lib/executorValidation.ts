import { getEntityInfo, listEntityInfos, refKey } from './entities';
import type { ProjectState } from '../types';
import type { ExecutorState } from '../types/executor';
import type { ExecutorContentManifest, GuideIndexItem, ImportedBuildMission, ScriptCatalog } from '../types/executorContent';

export type ValidationSeverity='info'|'warning'|'error';
export interface ValidationFinding {id:string;severity:ValidationSeverity;category:string;title:string;detail:string;route?:string;}

export function validateSuite(project:ProjectState,executor:ExecutorState,content:ExecutorContentManifest,missions:ImportedBuildMission[],guides:GuideIndexItem[],scripts:ScriptCatalog):ValidationFinding[]{
  const findings:ValidationFinding[]=[];
  const expected={missions:96,tasks:277,steps:1099,guides:26,scripts:278};
  for(const [key,value] of Object.entries(expected)){const actual=content.counts[key as keyof typeof content.counts];if(actual!==value)findings.push({id:`count-${key}`,severity:'error',category:'Conteúdo',title:`Quantidade inesperada de ${key}`,detail:`Esperado ${value}; encontrado ${actual}.`});}
  if(content.validation.missingGuideRefs.length)findings.push({id:'missing-guide-refs',severity:'error',category:'Guias',title:'Referências de guia quebradas',detail:content.validation.missingGuideRefs.join(', '),route:'/executor/guides'});
  if(content.validation.duplicateScriptIds.length)findings.push({id:'duplicate-script-ids',severity:'error',category:'Scripts',title:'IDs de scripts duplicados',detail:content.validation.duplicateScriptIds.join(', '),route:'/executor/scripts'});
  const allInfos=listEntityInfos(project,true);const keys=allInfos.map(info=>refKey(info.ref));for(const duplicate of duplicates(keys))findings.push({id:`entity-duplicate-${duplicate}`,severity:'error',category:'Planejador',title:'Referência de entidade duplicada',detail:duplicate});
  for(const relation of project.relations){if(!getEntityInfo(project,relation.from)||!getEntityInfo(project,relation.to))findings.push({id:`broken-relation-${relation.id}`,severity:'error',category:'Relações',title:'Relação aponta para entidade ausente',detail:`${refKey(relation.from)} → ${refKey(relation.to)}`,route:`/relations/${relation.from.type}/${encodeURIComponent(relation.from.id)}`});}
  const missionIds=new Set(missions.map(item=>item.id));const guideIds=new Set(guides.map(item=>item.slug));const scriptIds=new Set(scripts.files.map(item=>item.id));
  for(const link of executor.entityLinks){if(!getEntityInfo(project,link.entity))findings.push({id:`link-entity-${link.id}`,severity:'error',category:'Integração',title:'Ligação manual aponta para entidade ausente',detail:refKey(link.entity),route:'/executor/integration'});for(const id of link.missionIds)if(!missionIds.has(id))findings.push({id:`link-mission-${link.id}-${id}`,severity:'error',category:'Integração',title:'Missão ligada não existe',detail:id});for(const id of link.guideIds)if(!guideIds.has(id))findings.push({id:`link-guide-${link.id}-${id}`,severity:'error',category:'Integração',title:'Guia ligado não existe',detail:id});for(const id of link.scriptIds)if(!scriptIds.has(id))findings.push({id:`link-script-${link.id}-${id}`,severity:'error',category:'Integração',title:'Script ligado não existe',detail:id});}
  const openCritical=executor.issues.filter(issue=>issue.status!=='resolvido'&&issue.severity==='critica');if(openCritical.length)findings.push({id:'critical-open',severity:'warning',category:'Problemas',title:`${openCritical.length} problema(s) crítico(s) aberto(s)`,detail:openCritical.map(item=>item.title).join(' · '),route:'/executor/issues'});
  const noLinks=allInfos.filter(info=>['world','area','animal','npc','mission','enemy','boss'].includes(info.ref.type)&&!executor.entityLinks.some(link=>refKey(link.entity)===refKey(info.ref))).length;if(noLinks)findings.push({id:'entities-without-manual-links',severity:'info',category:'Integração',title:`${noLinks} entidades principais sem ligação manual`,detail:'Associações automáticas e guias por tipo continuam disponíveis. Use relações manuais apenas quando precisar de maior precisão.',route:'/executor/integration'});
  if(findings.every(item=>item.severity!=='error'))findings.unshift({id:'integrity-ok',severity:'info',category:'Integridade',title:'Nenhum erro estrutural bloqueante encontrado',detail:'IDs, conteúdo importado, relações e ligações manuais estão consistentes.'});
  return findings;
}
function duplicates(values:string[]):string[]{const seen=new Set<string>(),dupes=new Set<string>();for(const value of values){if(seen.has(value))dupes.add(value);seen.add(value)}return [...dupes]}
