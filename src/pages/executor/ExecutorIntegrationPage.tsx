import { ArrowRight, BookOpen, Braces, Filter, Link2, Search, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { ENTITY_LABELS, refKey } from '../../lib/entities';
import { loadBuildMissions, loadScriptCatalog } from '../../lib/executorContent';
import { getAllEntityIntegrations } from '../../lib/executorIntegration';
import { useExecutorStore } from '../../store/useExecutorStore';
import { useProjectStore } from '../../store/useProjectStore';
import type { EntityType } from '../../types';

const primaryTypes:EntityType[]=['world','area','animal','npc','mission','enemy','boss','item','mechanic','challenge','music','whisper','rumor'];

export function ExecutorIntegrationPage(){
  const project=useProjectStore(state=>state.project);
  const executor=useExecutorStore(state=>state.executor);
  const {data:missions}=useAsyncContent(loadBuildMissions,[]);
  const {data:scripts}=useAsyncContent(loadScriptCatalog,[]);
  const [term,setTerm]=useState('');
  const [type,setType]=useState<EntityType|'todos'>('todos');
  const [coverage,setCoverage]=useState<'todos'|'ligados'|'sem_missao'>('todos');
  const integrations=useMemo(()=>missions?getAllEntityIntegrations(project,executor,missions,scripts).filter(item=>primaryTypes.includes(item.entity.ref.type)):[],[executor,missions,project,scripts]);
  const filtered=useMemo(()=>{const q=term.toLocaleLowerCase('pt-BR').trim();return integrations.filter(item=>(type==='todos'||item.entity.ref.type===type)&&(!q||`${item.entity.title} ${item.entity.subtitle} ${item.entity.ref.id}`.toLocaleLowerCase('pt-BR').includes(q))&&(coverage==='todos'||(coverage==='ligados'?item.missionIds.length>0:item.missionIds.length===0)));},[coverage,integrations,term,type]);
  const linked=integrations.filter(item=>item.missionIds.length>0).length;
  const tested=integrations.filter(item=>item.status==='testado').length;
  const blocked=integrations.filter(item=>item.status==='bloqueado').length;
  if(!missions)return <div className="executor-loading">Calculando integração…</div>;
  return <div>
    <PageHeader title="Planejador ↔ Executor" subtitle="Uma única fonte de dados para design, implementação, documentação, testes e problemas do projeto."/>
    <section className="executor-integration-overview"><div><Workflow/><strong>{integrations.length}</strong><span>entidades acompanhadas</span></div><div><Link2/><strong>{linked}</strong><span>com missão relacionada</span></div><div><span className="integration-symbol">✓</span><strong>{tested}</strong><span>testadas</span></div><div><span className="integration-symbol warning">!</span><strong>{blocked}</strong><span>bloqueadas</span></div></section>
    <div className="executor-toolbar"><label><Search/><input value={term} onChange={event=>setTerm(event.target.value)} placeholder="Buscar entidade, ID ou descrição…"/></label><label><Filter/><select value={type} onChange={event=>setType(event.target.value as EntityType|'todos')}><option value="todos">Todos os tipos principais</option>{primaryTypes.map(value=><option key={value} value={value}>{ENTITY_LABELS[value]}</option>)}</select></label><select value={coverage} onChange={event=>setCoverage(event.target.value as typeof coverage)}><option value="todos">Toda cobertura</option><option value="ligados">Com missão vinculada</option><option value="sem_missao">Sem missão específica</option></select></div>
    <div className="executor-integration-table"><header><span>Entidade</span><span>Estado</span><span>Relações</span><span/></header>{filtered.map(item=>{const href=`/executor/entity/${item.entity.ref.type}/${encodeURIComponent(item.entity.ref.id)}${item.entity.ref.parentId?`?parent=${encodeURIComponent(item.entity.ref.parentId)}`:''}`;return <Link key={refKey(item.entity.ref)} to={href}><div><small>{ENTITY_LABELS[item.entity.ref.type]}</small><strong>{item.entity.title}</strong><span>{item.entity.subtitle}</span></div><em className={`implementation-dot state-${item.status}`}>{labelStatus(item.status)}</em><div className="integration-relations"><span><Link2/>{item.missionIds.length}</span><span><BookOpen/>{item.guideIds.length}</span><span><Braces/>{item.scriptIds.length}</span></div><ArrowRight/></Link>})}</div>
    {filtered.length===0&&<EmptyState title="Nenhuma entidade encontrada" text="Altere os filtros ou associe conteúdo manualmente pela ficha de uma entidade."/>}
  </div>;
}
function labelStatus(value:string){return ({nao_iniciado:'Não iniciado',configurando:'Configurando',implementado:'Implementado',testado:'Testado',bloqueado:'Bloqueado'} as Record<string,string>)[value]??value;}
