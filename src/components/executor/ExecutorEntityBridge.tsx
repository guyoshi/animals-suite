import { ArrowRight, BookOpen, Braces, ClipboardCheck, FlaskConical, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, SectionTitle } from '../Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadBuildMissions, loadScriptCatalog } from '../../lib/executorContent';
import { getEntityIntegration, plannerStatusForImplementation } from '../../lib/executorIntegration';
import { refKey } from '../../lib/entities';
import { useExecutorStore } from '../../store/useExecutorStore';
import { useProjectStore } from '../../store/useProjectStore';
import type { EntityRef } from '../../types';
import type { EntityImplementationStatus } from '../../types/executor';

const labels:Record<EntityImplementationStatus,string>={nao_iniciado:'Não iniciado',configurando:'Configurando',implementado:'Implementado',testado:'Testado',bloqueado:'Bloqueado'};

export function ExecutorEntityBridge({entityRef,compact=false}:{entityRef:EntityRef;compact?:boolean}){
  const project=useProjectStore(state=>state.project);
  const executor=useExecutorStore(state=>state.executor);
  const mutateExecutor=useExecutorStore(state=>state.mutate);
  const setEntityStatus=useProjectStore(state=>state.setEntityStatus);
  const {data:missions}=useAsyncContent(loadBuildMissions,[]);
  const {data:scripts}=useAsyncContent(loadScriptCatalog,[]);
  const integration=missions?getEntityIntegration(project,executor,missions,scripts,entityRef):undefined;
  if(!integration)return null;
  const key=refKey(entityRef);
  const href=`/executor/entity/${entityRef.type}/${encodeURIComponent(entityRef.id)}${entityRef.parentId?`?parent=${encodeURIComponent(entityRef.parentId)}`:''}`;
  const changeStatus=(status:EntityImplementationStatus)=>{
    mutateExecutor(draft=>{draft.entityStates[key]={entityKey:key,status,updatedAt:new Date().toISOString(),...(status==='testado'?{lastTestedAt:new Date().toISOString()}:{})}});
    if(executor.settings.syncPlannerStatus&&integration.entity.status){const planner=plannerStatusForImplementation(status);const collection=collectionFor(entityRef.type);if(planner&&collection)setEntityStatus(collection,entityRef.id,planner);}
  };
  return <Card className={`executor-entity-bridge ${compact?'compact':''}`}>
    <SectionTitle action={<Link className="text-button" to={href}>Abrir ficha <ArrowRight size={15}/></Link>}><Workflow/> Integração com o Executor</SectionTitle>
    <div className="executor-bridge-status"><label>Estado no Unity<select value={integration.status} onChange={event=>changeStatus(event.target.value as EntityImplementationStatus)}>{Object.entries(labels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><span className={`implementation-dot state-${integration.status}`}>{labels[integration.status]}</span></div>
    <div className="executor-bridge-counts"><span><ClipboardCheck/>{integration.missionIds.length} missões</span><span><BookOpen/>{integration.guideIds.length} guias</span><span><Braces/>{integration.scriptIds.length} scripts</span><span><FlaskConical/>Testes ligados</span></div>
    {integration.missionIds.length===0&&<p className="muted">Ainda não há missão de produção específica vinculada. Abra a ficha para adicionar relações manuais.</p>}
  </Card>;
}

function collectionFor(type:EntityRef['type']):keyof ReturnType<typeof useProjectStore.getState>['project']|undefined{
  const mapping:Partial<Record<EntityRef['type'],keyof ReturnType<typeof useProjectStore.getState>['project']>>={enemy:'enemies',item:'items',npc:'npcs',mission:'missions',rumor:'rumors',whisper:'whispers',challenge:'challenges',boss:'bosses',emblem:'emblems',music:'music'};
  return mapping[type];
}
