import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Braces, Check, CheckCircle2, Focus, LockKeyhole, RotateCcw, TriangleAlert } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ExecutorNotesPanel } from '../../components/executor/ExecutorNotesPanel';
import { ExecutorMissionIntegration } from '../../components/executor/ExecutorMissionIntegration';
import { ExecutorBookmarkButton } from '../../components/executor/ExecutorBookmarkButton';
import { bookmarkKey } from '../../lib/executorBookmarks';
import { EmptyState } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadBuildMissions } from '../../lib/executorContent';
import { getMissionStats, getPreviousDetailedMission, getStepDone, getTaskStats, isDetailedMissionUnlocked, resetTaskProgress, updateMissionProgress } from '../../lib/executorProgress';
import { useExecutorStore } from '../../store/useExecutorStore';
import type { ImportedBuildMission } from '../../types/executorContent';

export function ExecutorMissionPage(){
  const {missionId}=useParams();
  const [params,setParams]=useSearchParams();
  const {data:missions,error,loading}=useAsyncContent(loadBuildMissions,[]);
  const executor=useExecutorStore(state=>state.executor);
  const mutate=useExecutorStore(state=>state.mutate);
  const rememberLocation=useExecutorStore(state=>state.rememberLocation);
  const [copied,setCopied]=useState(false);

  const mission=missions?.find(item=>item.id===missionId);
  const taskIndex=clamp(Number(params.get('task')||0),0,Math.max(0,(mission?.tasks.length||1)-1));
  const task=mission?.tasks[taskIndex];
  const stepIndex=clamp(Number(params.get('step')||0),0,Math.max(0,(task?.steps.length||1)-1));
  const step=task?.steps[stepIndex];
  const unlocked=Boolean(mission&&missions&&isDetailedMissionUnlocked(executor,missions,mission));

  const go=(nextTask:number,nextStep:number,replace=false)=>{
    if(!mission)return;
    setParams({task:String(nextTask),step:String(nextStep)},{replace});
  };

  useEffect(()=>{
    if(!mission||!task||!step)return;
    rememberLocation({route:`/executor/roadmap/${mission.id}?task=${taskIndex}&step=${stepIndex}`,missionId:mission.id,taskId:task.id,stepId:step.id,scrollY:window.scrollY,visitedAt:new Date().toISOString()});
  },[mission,rememberLocation,step,stepIndex,task,taskIndex]);

  useEffect(()=>{
    if(!mission||!task||!step||!unlocked)return;
    const key=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      if(target?.matches('input,textarea,select,[contenteditable="true"]'))return;
      if(event.key==='ArrowRight'){event.preventDefault();advance(false);}
      if(event.key==='ArrowLeft'){event.preventDefault();previous();}
      if(event.code==='Space'){event.preventDefault();toggleCurrent();}
    };
    window.addEventListener('keydown',key);
    return()=>window.removeEventListener('keydown',key);
  });

  if(loading)return <div className="executor-loading">Carregando missão…</div>;
  if(error||!missions||!mission)return <EmptyState title="Missão não encontrada" text={error||'O identificador desta missão não existe no conteúdo migrado.'}/>;

  const stats=getMissionStats(executor,mission);
  const previousMission=missions.find(item=>item.number===mission.number-1);
  const nextMission=missions.find(item=>item.number===mission.number+1);
  const previousRequired=getPreviousDetailedMission(missions,mission);

  if(!mission.detailed)return <div className="executor-planned-mission">
    <div className="executor-breadcrumb"><Link to="/executor/roadmap">Roteiro</Link><span>›</span><span>{mission.phase}</span><span>›</span><strong>Missão {mission.number}</strong></div>
    <section className="executor-planned-hero"><span>MISSÃO {mission.number} · CONTEÚDO PLANEJADO</span><h1>{mission.title}</h1><p>{mission.summary}</p></section>
    <div className="executor-mission-summary-grid"><article><strong>Objetivo</strong><p>{mission.objective||'Será detalhado numa atualização futura do roteiro.'}</p></article><article><strong>Resultado esperado</strong><p>{mission.result||'Ainda não possui Steps executáveis.'}</p></article><article><strong>Estado</strong><p>Pode ser consultada, mas ainda não é marcada como concluída porque não possui tarefas detalhadas.</p></article></div>
    {mission.prerequisites.length>0&&<section className="executor-callout"><strong>Pré-requisitos previstos</strong><ul>{mission.prerequisites.map(item=><li key={item}>{item}</li>)}</ul></section>}
    <MissionLinks mission={mission}/>
    <ExecutorMissionIntegration mission={mission}/>
    <ExecutorNotesPanel ownerType="buildMission" ownerId={mission.id}/>
    <div className="executor-bottom-nav">{previousMission?<Link className="secondary-button" to={`/executor/roadmap/${previousMission.id}`}><ArrowLeft/>Missão anterior</Link>:<span/>}{nextMission&&<Link className="primary-button" to={`/executor/roadmap/${nextMission.id}`}>Próxima missão<ArrowRight/></Link>}</div>
  </div>;

  if(!task||!step)return <EmptyState title="Missão sem conteúdo" text="Esta missão foi marcada como detalhada, mas não contém tarefas ou Steps."/>;
  const taskStats=getTaskStats(executor,task);
  const done=getStepDone(executor,step.id);

  function toggleCurrent(){
    if(!mission||!step||!unlocked)return;
    mutate(draft=>updateMissionProgress(draft,mission,step.id,!getStepDone(draft,step.id)));
  }
  function advance(mark=true){
    if(!mission||!task||!step||!unlocked)return;
    if(mark)mutate(draft=>updateMissionProgress(draft,mission,step.id,true));
    if(stepIndex<task.steps.length-1)go(taskIndex,stepIndex+1);
    else if(taskIndex<mission.tasks.length-1)go(taskIndex+1,0);
  }
  function previous(){
    if(!mission||!task)return;
    if(stepIndex>0)go(taskIndex,stepIndex-1);
    else if(taskIndex>0){const previousTask=mission.tasks[taskIndex-1];go(taskIndex-1,Math.max(0,previousTask.steps.length-1));}
  }
  async function copyErrorContext(){
    if(!mission||!task||!step)return;
    const text=[
      'Preciso de ajuda para resolver um erro no projeto Unity Animals.',
      '',
      `Versão do conteúdo: 18/06 att`,
      `Etapa: ${mission.phase}`,
      `Missão ${mission.number}: ${mission.title}`,
      `Tarefa ${task.code}: ${task.title}`,
      `Step ${stepIndex+1}/${task.steps.length}: ${step.title}`,
      '',
      'Ações que eu deveria executar:',
      ...step.actions.map((action,index)=>`${index+1}. ${action}`),
      '',
      `Resultado esperado: ${step.expected||'Não informado.'}`,
      step.trouble?`Orientação do guia se algo der errado: ${step.trouble}`:'',
      `Scripts relacionados: ${[...new Set([...mission.scripts,...task.scripts])].join(', ')||'Nenhum listado.'}`,
      `Guia relacionado: ${step.guide||task.guide||mission.guide||'Nenhum listado.'}`,
      '',
      'O que aconteceu de verdade:',
      '[Descreva aqui]',
      '',
      'Erro completo do Console:',
      '[Cole aqui]',
    ].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);window.setTimeout(()=>setCopied(false),1800);
  }

  const addFocus=(ownerType:'task'|'step',ownerId:string)=>mutate(draft=>{const date=new Date().toISOString().slice(0,10);if(draft.focusItems.some(item=>item.ownerId===ownerId&&(item.sessionDate||item.addedAt.slice(0,10))===date))return;draft.focusItems.push({id:`focus-${crypto.randomUUID()}`,ownerType,ownerId,order:draft.focusItems.filter(item=>(item.sessionDate||item.addedAt.slice(0,10))===date).length,addedAt:new Date().toISOString(),sessionDate:date})});

  return <div className="executor-mission-page">
    <div className="executor-breadcrumb"><Link to="/executor/roadmap">Roteiro</Link><span>›</span><span>{mission.phase}</span><span>›</span><strong>Missão {mission.number}</strong><span>›</span><span>Tarefa {task.code}</span><span>›</span><span>Step {stepIndex+1}/{task.steps.length}</span></div>
    <section className="executor-mission-header">
      <div><span>MISSÃO {mission.number}</span><h1>{mission.title}</h1><p>{mission.summary}</p></div>
      <div className="executor-mission-header-actions"><ExecutorBookmarkButton value={bookmarkKey('mission',mission.id)}/><div className="executor-mission-progress"><strong>{stats.percent}%</strong><span>{stats.done}/{stats.total} Steps</span><i><b style={{width:`${stats.percent}%`}}/></i></div></div>
    </section>

    {!unlocked&&<section className="executor-lock-warning"><LockKeyhole/><div><strong>Missão bloqueada para execução</strong><p>Você pode consultar todo o conteúdo, mas precisa concluir {previousRequired?`a Missão ${previousRequired.number} — ${previousRequired.title}`:'a missão detalhada anterior'} antes de marcar Steps.</p></div></section>}

    <div className="executor-mission-layout">
      <aside className="executor-task-sidebar"><Link className="secondary-button" to="/executor/roadmap"><ArrowLeft/>Todas as missões</Link>{mission.tasks.map((item,index)=>{
        const itemStats=getTaskStats(executor,item);
        return <button key={item.id} className={`${index===taskIndex?'active':''} ${itemStats.status==='concluido'?'done':''}`} onClick={()=>go(index,0)}><span>{item.code} · {item.title}</span><small>{itemStats.done}/{itemStats.total} Steps · {itemStats.percent}%</small><i><b style={{width:`${itemStats.percent}%`}}/></i></button>;
      })}</aside>

      <div className="executor-step-column">
        <section className="executor-task-header"><div><span>TAREFA {task.code}</span><h2>{task.title}</h2><p>{task.purpose}</p></div><div className="executor-task-header-tools"><button className="secondary-button compact-button" onClick={()=>addFocus('task',task.id)}><Focus/>Adicionar tarefa ao foco</button><div><strong>{taskStats.percent}%</strong><small>{taskStats.done}/{taskStats.total} Steps</small></div></div></section>
        <section className={`executor-step-card ${done?'completed':''}`}>
          <header><div><span>STEP {stepIndex+1} DE {task.steps.length}</span><h3>{step.title}</h3></div>{done&&<div className="executor-complete-badge"><CheckCircle2/>Concluído</div>}</header>
          <div className="executor-step-actions"><h4>O que fazer</h4><ol>{step.actions.map((action,index)=><li key={`${index}-${action}`}>{action}</li>)}</ol></div>
          {step.expected&&<div className="executor-step-block expected"><strong>O que você deve ver</strong><p>{step.expected}</p></div>}
          {step.trouble&&<div className="executor-step-block trouble"><strong><TriangleAlert/>Se algo der errado</strong><p>{step.trouble}</p></div>}
          {step.why&&<div className="executor-step-block why"><strong>Por que isso é necessário</strong><p>{step.why}</p></div>}
          {(step.art||task.art||mission.art)&&<div className="executor-step-block production"><strong>Arte</strong><p>{step.art||task.art||mission.art}</p></div>}
          {(step.preset||task.preset||mission.preset)&&<div className="executor-step-block production"><strong>Preset/Prefab</strong><p>{step.preset||task.preset||mission.preset}</p></div>}
          <div className="executor-step-links"><MissionLinks mission={mission} taskScripts={task.scripts} guide={step.guide||task.guide||mission.guide}/></div>
          <div className="executor-step-completion">
            <label className={done?'checked':''}><input type="checkbox" checked={done} disabled={!unlocked} onChange={toggleCurrent}/><span><Check/>Concluí este Step</span></label>
            <button className="secondary-button" onClick={()=>addFocus('step',step.id)}><Focus/>Adicionar ao foco</button><button className="secondary-button error-context-button" onClick={()=>void copyErrorContext()}><AlertTriangle/>{copied?'Contexto copiado':'Estou com erro'}</button>
          </div>
        </section>
        <div className="executor-step-navigation"><button className="secondary-button" onClick={previous} disabled={taskIndex===0&&stepIndex===0}><ArrowLeft/>Step anterior</button><span>{stepIndex+1}/{task.steps.length}</span><button className="primary-button" onClick={()=>advance(true)} disabled={!unlocked}>{stepIndex===task.steps.length-1&&taskIndex===mission.tasks.length-1?'Concluir missão':'Concluir e avançar'}<ArrowRight/></button></div>
        <div className="executor-keyboard-help"><kbd>←</kbd><kbd>→</kbd> navegar <kbd>Espaço</kbd> marcar/desmarcar</div>
        <ExecutorMissionIntegration mission={mission}/>
        <ExecutorNotesPanel ownerType="buildStep" ownerId={step.id}/>
        <details className="executor-task-notes"><summary>Notas da Tarefa {task.code}</summary><ExecutorNotesPanel ownerType="buildTask" ownerId={task.id} compact/></details>
        <details className="executor-task-notes"><summary>Notas gerais da Missão {mission.number}</summary><ExecutorNotesPanel ownerType="buildMission" ownerId={mission.id} compact/></details>
        <div className="executor-task-reset"><button className="danger-button" onClick={()=>{if(confirm(`Apagar o progresso da Tarefa ${task.code}?`))mutate(draft=>resetTaskProgress(draft,mission,task))}}><RotateCcw/>Recomeçar esta tarefa</button></div>
      </div>
    </div>
  </div>;
}

function MissionLinks({mission,taskScripts=[],guide}:{mission:ImportedBuildMission;taskScripts?:string[];guide?:string}){
  const scripts=[...new Set([...mission.scripts,...taskScripts])];
  const guideSlug=guide||mission.guide;
  if(!guideSlug&&scripts.length===0)return null;
  return <div className="executor-related-links">{guideSlug&&<Link className="secondary-button" to={`/executor/guides/${guideSlug}`}><BookOpen/>Abrir guia relacionado</Link>}{scripts.map(script=><Link key={script} className="executor-script-chip" to={`/executor/scripts?q=${encodeURIComponent(script)}`}><Braces/>{script}</Link>)}</div>;
}

function clamp(value:number,min:number,max:number){return Number.isFinite(value)?Math.min(max,Math.max(min,value)):min;}
