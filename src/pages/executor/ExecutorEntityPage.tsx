import { ArrowLeft, BookOpen, Braces, CheckCircle2, ExternalLink, FlaskConical, Link2, Save, TriangleAlert, Workflow } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState, PageHeader, SectionTitle, Card } from '../../components/Ui';
import { ExecutorBookmarkButton } from '../../components/executor/ExecutorBookmarkButton';
import { bookmarkKey } from '../../lib/executorBookmarks';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { ENTITY_LABELS, refKey } from '../../lib/entities';
import { loadBuildMissions, loadGuideIndex, loadScriptCatalog } from '../../lib/executorContent';
import { entityRefFromParams, getEntityIntegration, plannerStatusForImplementation, upsertEntityLink } from '../../lib/executorIntegration';
import { testRunKey, testsForEntity } from '../../lib/executorTestMatching';
import { useExecutorStore } from '../../store/useExecutorStore';
import { useProjectStore } from '../../store/useProjectStore';
import type { EntityImplementationStatus, TestRunStatus } from '../../types/executor';

const statusLabels:Record<EntityImplementationStatus,string>={nao_iniciado:'Não iniciado',configurando:'Configurando',implementado:'Implementado',testado:'Testado',bloqueado:'Bloqueado'};
const testLabels:Record<TestRunStatus,string>={nao_testado:'Não testado',passou:'Passou',falhou:'Falhou',bloqueado:'Bloqueado'};

export function ExecutorEntityPage(){
  const {entityType,entityId}=useParams();
  const [params]=useSearchParams();
  const ref=entityRefFromParams(entityType,entityId,params.get('parent'));
  const project=useProjectStore(state=>state.project);
  const executor=useExecutorStore(state=>state.executor);
  const mutate=useExecutorStore(state=>state.mutate);
  const setEntityStatus=useProjectStore(state=>state.setEntityStatus);
  const {data:missions}=useAsyncContent(loadBuildMissions,[]);
  const {data:guides}=useAsyncContent(loadGuideIndex,[]);
  const {data:scripts}=useAsyncContent(loadScriptCatalog,[]);
  if(!ref||!missions)return <div className="executor-loading">Carregando integração…</div>;
  const integration=getEntityIntegration(project,executor,missions,scripts,ref);
  if(!integration)return <EmptyState title="Entidade não encontrada" text="O elemento não existe mais no Planejador ou o link está incompleto."/>;
  const key=refKey(ref);
  const recipes=testsForEntity(ref);
  const issues=executor.issues.filter(issue=>issue.relatedEntities?.some(item=>refKey(item)===key)||issue.relatedIds.includes(ref.id)||issue.relatedIds.some(id=>integration.missionIds.includes(id)));
  const linkedMissions=missions.filter(item=>integration.missionIds.includes(item.id));
  const linkedGuides=guides?.filter(item=>integration.guideIds.includes(item.slug))??[];
  const linkedScripts=scripts?.files.filter(item=>integration.scriptIds.includes(item.id))??[];

  const changeStatus=(status:EntityImplementationStatus)=>{
    mutate(draft=>{draft.entityStates[key]={entityKey:key,status,updatedAt:new Date().toISOString(),...(status==='testado'?{lastTestedAt:new Date().toISOString()}:{})}});
    if(executor.settings.syncPlannerStatus&&integration.entity.status){const planner=plannerStatusForImplementation(status);const collection=collectionFor(ref.type);if(planner&&collection)setEntityStatus(collection,ref.id,planner);}
  };
  const setLink=(field:'missionIds'|'guideIds'|'scriptIds',values:string[])=>mutate(draft=>{draft.entityLinks=upsertEntityLink(draft.entityLinks,ref,{[field]:values})});
  const manual=integration.manualLink;

  return <div className="executor-entity-page">
    <div className="executor-breadcrumb"><Link to="/executor/integration">Integração</Link><span>›</span><span>{ENTITY_LABELS[ref.type]}</span><span>›</span><strong>{integration.entity.title}</strong></div>
    <PageHeader title={integration.entity.title} subtitle={`${ENTITY_LABELS[ref.type]} · ${integration.entity.subtitle}`} actions={<><ExecutorBookmarkButton value={bookmarkKey('entity',key)}/><Link className="secondary-button" to={integration.entity.route}><ExternalLink/>Abrir no Planejador</Link><Link className="secondary-button" to="/executor/integration"><ArrowLeft/>Voltar</Link></>}/>

    <div className="executor-integration-hero"><div><Workflow/><div><span>Estado compartilhado</span><strong>{statusLabels[integration.status]}</strong><small>{executor.settings.syncPlannerStatus?'Sincronização com o Planejador ativa':'Sincronização automática desativada'}</small></div></div><select value={integration.status} onChange={event=>changeStatus(event.target.value as EntityImplementationStatus)}>{Object.entries(statusLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div>

    <div className="executor-grid-two">
      <Card><SectionTitle><Link2/> Relações de produção</SectionTitle><div className="executor-link-summary"><span><strong>{linkedMissions.length}</strong> missões</span><span><strong>{linkedGuides.length}</strong> guias</span><span><strong>{linkedScripts.length}</strong> scripts</span><span><strong>{recipes.length}</strong> receitas de teste</span></div>{integration.automaticMissionIds.length>0&&<p className="muted">{integration.automaticMissionIds.length} missão(ões) foram associadas automaticamente pelo nome ou ID. As escolhas manuais são mantidas separadamente.</p>}</Card>
      <Card><SectionTitle><TriangleAlert/> Problemas relacionados</SectionTitle>{issues.length===0?<p className="muted">Nenhum problema aberto relacionado.</p>:<div className="executor-mini-issues">{issues.map(issue=><Link key={issue.id} to={`/executor/issues?issue=${issue.id}`} className={`severity-${issue.severity}`}><strong>{issue.title}</strong><span>{issue.severity} · {issue.status}</span></Link>)}</div>}<Link className="text-button" to={`/executor/issues?entity=${encodeURIComponent(key)}`}>Registrar ou consultar problemas</Link></Card>
    </div>

    <section className="executor-entity-section"><SectionTitle><ClipboardIcon/> Missões de produção</SectionTitle>{linkedMissions.length===0?<EmptyState title="Sem missão específica" text="Use o editor de relações abaixo para associar uma ou mais missões."/>:<div className="executor-linked-cards">{linkedMissions.map(mission=><Link key={mission.id} to={`/executor/roadmap/${mission.id}`}><span>MISSÃO {mission.number}</span><strong>{mission.title}</strong><small>{mission.detailed?`${mission.tasks.length} tarefas detalhadas`:'Conteúdo planejado'}</small></Link>)}</div>}</section>

    <div className="executor-grid-two">
      <Card><SectionTitle><BookOpen/> Guias e tutoriais</SectionTitle>{linkedGuides.length===0?<p className="muted">Nenhum guia encontrado.</p>:<div className="executor-simple-links">{linkedGuides.map(guide=><Link key={guide.slug} to={`/executor/guides/${guide.slug}`}><strong>{guide.title}</strong><small>{guide.category}</small></Link>)}</div>}</Card>
      <Card><SectionTitle><Braces/> Scripts</SectionTitle>{linkedScripts.length===0?<p className="muted">Nenhum script específico encontrado.</p>:<div className="executor-script-list compact">{linkedScripts.slice(0,14).map(script=><Link key={script.id} to={`/executor/scripts/${script.id}`}><strong>{script.filename}</strong><span>{script.category}</span></Link>)}</div>}{linkedScripts.length>14&&<small className="muted">Mais {linkedScripts.length-14} scripts ligados.</small>}</Card>
    </div>

    <section className="executor-entity-section"><SectionTitle><FlaskConical/> Receitas de teste</SectionTitle><div className="executor-test-grid">{recipes.map(recipe=>{const run=executor.testRuns[testRunKey(recipe.id,key)];const state=run?.status??'nao_testado';return <article key={recipe.id} className={`test-state-${state}`}><header><div><span>{recipe.category}</span><strong>{recipe.title}</strong></div><select value={state} onChange={event=>mutate(draft=>{const status=event.target.value as TestRunStatus;draft.testRuns[testRunKey(recipe.id,key)]={recipeId:recipe.id,ownerId:key,status,updatedAt:new Date().toISOString()};if(status==='passou')draft.entityStates[key]={entityKey:key,status:'testado',updatedAt:new Date().toISOString(),lastTestedAt:new Date().toISOString()}})}>{Object.entries(testLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></header><p>{recipe.description}</p><details><summary>Ver passos e resultados</summary><h4>Debug Panel</h4><ol>{recipe.debugSteps.map(step=><li key={step}>{step}</li>)}</ol><h4>Resultado esperado</h4><ul>{recipe.expected.map(item=><li key={item}>{item}</li>)}</ul><h4>Testes negativos</h4><ul>{recipe.negativeTests.map(item=><li key={item}>{item}</li>)}</ul></details></article>})}</div></section>

    <details className="executor-link-editor"><summary><Link2/> Editar relações manuais</summary><div className="executor-manual-link-grid"><MultiSelect title="Missões" options={missions.map(item=>({id:item.id,label:`${item.number}. ${item.title}`}))} values={manual?.missionIds??[]} onChange={values=>setLink('missionIds',values)}/><MultiSelect title="Guias" options={(guides??[]).map(item=>({id:item.slug,label:item.title}))} values={manual?.guideIds??[]} onChange={values=>setLink('guideIds',values)}/><MultiSelect title="Scripts" options={(scripts?.files??[]).map(item=>({id:item.id,label:item.filename}))} values={manual?.scriptIds??[]} onChange={values=>setLink('scriptIds',values)}/></div><p className="muted"><Save/> As alterações são salvas automaticamente no estado do Executor.</p></details>
  </div>;
}

function MultiSelect({title,options,values,onChange}:{title:string;options:Array<{id:string;label:string}>;values:string[];onChange:(values:string[])=>void}){
  return <label><strong>{title}</strong><select multiple size={10} value={values} onChange={event=>onChange(Array.from(event.currentTarget.selectedOptions).map(option=>option.value))}>{options.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select><small>Ctrl + clique para selecionar vários.</small></label>;
}

function collectionFor(type:string):keyof ReturnType<typeof useProjectStore.getState>['project']|undefined{const map:Record<string,keyof ReturnType<typeof useProjectStore.getState>['project']>={enemy:'enemies',item:'items',npc:'npcs',mission:'missions',rumor:'rumors',whisper:'whispers',challenge:'challenges',boss:'bosses',emblem:'emblems',music:'music'};return map[type];}
function ClipboardIcon(){return <CheckCircle2/>}
