import { useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, CalendarDays, Check, CirclePlus, Focus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, EmptyState, PageHeader, SectionTitle } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadBuildMissions } from '../../lib/executorContent';
import { getStepDone, getTaskStats, updateMissionProgress } from '../../lib/executorProgress';
import { useExecutorStore } from '../../store/useExecutorStore';
import type { ImportedBuildMission, ImportedBuildStep, ImportedBuildTask } from '../../types/executorContent';

const today=()=>new Date().toISOString().slice(0,10);

export function ExecutorFocusPage(){
  const {data:missions,error,loading}=useAsyncContent(loadBuildMissions,[]);
  const executor=useExecutorStore(state=>state.executor);
  const mutate=useExecutorStore(state=>state.mutate);
  const [term,setTerm]=useState('');
  const currentDate=today();
  const lookup=useMemo(()=>{
    const result=new Map<string,{mission:ImportedBuildMission;task:ImportedBuildTask;step?:ImportedBuildStep;taskPosition:number;stepPosition:number}>();
    for(const mission of missions||[])mission.tasks.forEach((task,taskPosition)=>{result.set(task.id,{mission,task,taskPosition,stepPosition:0});task.steps.forEach((step,stepPosition)=>result.set(step.id,{mission,task,step,taskPosition,stepPosition}))})
    return result;
  },[missions]);
  const current=executor.focusItems.filter(item=>(item.sessionDate||item.addedAt.slice(0,10))===currentDate).sort((a,b)=>a.order-b.order);
  const oldIncomplete=executor.focusItems.filter(item=>(item.sessionDate||item.addedAt.slice(0,10))!==currentDate).filter(item=>{const hit=lookup.get(item.ownerId);return hit?.step ? !getStepDone(executor,hit.step.id) : Boolean(hit&&getTaskStats(executor,hit.task).status!=='concluido')});
  const done=current.filter(item=>{const hit=lookup.get(item.ownerId);return hit?.step?getStepDone(executor,hit.step.id):(hit?getTaskStats(executor,hit.task).status==='concluido':false)}).length;
  const candidates=useMemo(()=>{
    const q=term.trim().toLocaleLowerCase('pt-BR');if(!q||!missions)return [];
    const out:Array<{id:string;type:'task'|'step';label:string;sub:string}>=[];
    for(const mission of missions.filter(item=>item.detailed))for(const task of mission.tasks){
      if(`${mission.number} ${mission.title} ${task.code} ${task.title}`.toLocaleLowerCase('pt-BR').includes(q))out.push({id:task.id,type:'task',label:`Tarefa ${task.code} — ${task.title}`,sub:`Missão ${mission.number} — ${mission.title}`});
      for(const step of task.steps)if(`${step.title} ${step.actions.join(' ')}`.toLocaleLowerCase('pt-BR').includes(q))out.push({id:step.id,type:'step',label:step.title,sub:`Missão ${mission.number} · Tarefa ${task.code}`});
      if(out.length>=20)return out;
    }
    return out;
  },[missions,term]);
  if(loading)return <div className="executor-loading">Preparando o Modo Foco…</div>;
  if(error||!missions)return <EmptyState title="Modo Foco indisponível" text={error||'Roteiro não carregado.'}/>;

  const add=(ownerType:'task'|'step',ownerId:string)=>mutate(draft=>{
    const existing=draft.focusItems.find(item=>item.ownerId===ownerId&&(item.sessionDate||item.addedAt.slice(0,10))===currentDate);if(existing)return;
    draft.focusItems.push({id:`focus-${crypto.randomUUID()}`,ownerType,ownerId,order:draft.focusItems.filter(item=>(item.sessionDate||item.addedAt.slice(0,10))===currentDate).length,addedAt:new Date().toISOString(),sessionDate:currentDate});
  });
  const move=(id:string,direction:number)=>mutate(draft=>{const same=draft.focusItems.filter(item=>(item.sessionDate||item.addedAt.slice(0,10))===currentDate).sort((a,b)=>a.order-b.order);const index=same.findIndex(item=>item.id===id);const target=index+direction;if(index<0||target<0||target>=same.length)return;const a=same[index],b=same[target];const old=a.order;a.order=b.order;b.order=old});
  const remove=(id:string)=>mutate(draft=>{draft.focusItems=draft.focusItems.filter(item=>item.id!==id)});
  const carry=()=>mutate(draft=>{const base=draft.focusItems.filter(item=>(item.sessionDate||item.addedAt.slice(0,10))===currentDate).length;oldIncomplete.forEach((item,index)=>{const existing=draft.focusItems.some(currentItem=>currentItem.ownerId===item.ownerId&&(currentItem.sessionDate||currentItem.addedAt.slice(0,10))===currentDate);if(!existing)draft.focusItems.push({...item,id:`focus-${crypto.randomUUID()}`,order:base+index,sessionDate:currentDate,addedAt:new Date().toISOString(),carriedFrom:item.sessionDate||item.addedAt.slice(0,10)})})});

  return <div className={`executor-focus-page ${executor.settings.focusModeEnabled?'focus-clean':''}`}>
    <PageHeader title="Modo Foco" subtitle="Monte a lista de trabalho de hoje e execute somente as tarefas e Steps escolhidos." actions={<button className="secondary-button" onClick={()=>mutate(draft=>{draft.settings.focusModeEnabled=!draft.settings.focusModeEnabled})}><Focus/>{executor.settings.focusModeEnabled?'Sair da visão limpa':'Entrar na visão limpa'}</button>}/>
    <section className="executor-focus-hero"><div><CalendarDays/><div><span>FOCO DE HOJE</span><h2>{new Date(`${currentDate}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</h2><p>{done}/{current.length} itens concluídos</p></div></div><div className="executor-focus-ring"><strong>{current.length?Math.round(done/current.length*100):0}%</strong><span>do dia</span></div></section>
    {oldIncomplete.length>0&&<div className="executor-carry-banner"><RotateCcw/><span>{oldIncomplete.length} item(ns) não concluído(s) de dias anteriores.</span><button className="secondary-button" onClick={carry}>Trazer para hoje</button></div>}
    <div className="executor-focus-layout">
      <section><SectionTitle>Lista do dia</SectionTitle>{current.length===0?<EmptyState title="Nenhum item selecionado" text="Adicione tarefas ou Steps pela pesquisa ao lado ou diretamente dentro de uma missão."/>:<div className="executor-focus-list">{current.map((item,index)=>{
        const hit=lookup.get(item.ownerId);
        if(!hit)return <article key={item.id} className="missing"><strong>Item removido do roteiro</strong><button onClick={()=>remove(item.id)}><Trash2/></button></article>;
        const currentStep=hit.step;
        const taskStats=getTaskStats(executor,hit.task);
        const completed=currentStep?getStepDone(executor,currentStep.id):taskStats.status==='concluido';
        const route=`/executor/roadmap/${hit.mission.id}?task=${hit.taskPosition}&step=${currentStep?hit.stepPosition:0}`;
        return <article key={item.id} className={completed?'completed':''}><label>{currentStep&&<input type="checkbox" checked={completed} onChange={()=>mutate(draft=>updateMissionProgress(draft,hit.mission,currentStep.id,!completed))}/>}<span>{completed&&<Check/>}<small>{currentStep?'STEP':'TAREFA'} · MISSÃO {hit.mission.number}</small><strong>{currentStep?.title||`Tarefa ${hit.task.code} — ${hit.task.title}`}</strong><em>{currentStep?`Tarefa ${hit.task.code}`:`${taskStats.done}/${taskStats.total} Steps`}</em></span></label><div><button disabled={index===0} onClick={()=>move(item.id,-1)} title="Mover para cima"><ArrowUp/></button><button disabled={index===current.length-1} onClick={()=>move(item.id,1)} title="Mover para baixo"><ArrowDown/></button><Link to={route} title="Abrir"><ArrowRight/></Link><button onClick={()=>remove(item.id)} title="Remover"><Trash2/></button></div></article>;
      })}</div>}
      {current.length>0&&<button className="danger-button executor-focus-clear" onClick={()=>mutate(draft=>{draft.focusItems=draft.focusItems.filter(item=>(item.sessionDate||item.addedAt.slice(0,10))!==currentDate||!current.some(currentItem=>currentItem.id===item.id))})}><Trash2/>Limpar lista de hoje</button>}</section>
      <Card className="executor-focus-picker"><SectionTitle><CirclePlus/> Adicionar ao foco</SectionTitle><label className="executor-focus-search"><Search/><input value={term} onChange={event=>setTerm(event.target.value)} placeholder="Buscar tarefa, Step ou missão…"/></label>{term&&!candidates.length&&<p className="muted">Nenhum resultado.</p>}<div className="executor-focus-candidates">{candidates.map(item=><button key={`${item.type}-${item.id}`} onClick={()=>add(item.type,item.id)}><CirclePlus/><span><strong>{item.label}</strong><small>{item.sub}</small></span></button>)}</div></Card>
    </div>
  </div>;
}
