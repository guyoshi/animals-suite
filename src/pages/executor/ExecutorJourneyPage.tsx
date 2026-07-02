import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowRight, Award, CheckCircle2, CloudFog, Gamepad2, LockKeyhole, Map, Sparkles, Star, Trophy, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadBuildMissions, loadBuildStages } from '../../lib/executorContent';
import { getMissionStats, isDetailedMissionUnlocked } from '../../lib/executorProgress';
import { useExecutorStore } from '../../store/useExecutorStore';
import type { ImportedBuildMission, ImportedBuildStage } from '../../types/executorContent';

const positions=[
  {x:10,y:66},{x:24,y:34},{x:39,y:60},{x:54,y:26},
  {x:68,y:57},{x:82,y:31},{x:91,y:65},{x:73,y:82},
];

export function ExecutorJourneyPage(){
  const {data:missions,error,loading}=useAsyncContent(loadBuildMissions,[]);
  const {data:stages}=useAsyncContent(loadBuildStages,[]);
  const executor=useExecutorStore(state=>state.executor);
  const mutate=useExecutorStore(state=>state.mutate);
  const [selected,setSelected]=useState(0);
  const [opened,setOpened]=useState(false);

  const stageStats=useMemo(()=>stages?.map(stage=>buildStageStats(stage,missions??[],executor))??[],[executor,missions,stages]);

  useEffect(()=>{
    if(!executor.settings.gamifiedModeEnabled)return;
    const key=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      if(target?.matches('input,textarea,select,[contenteditable="true"]'))return;
      const value=event.key.toLowerCase();
      let next:number;
      if(value==='arrowright'||value==='d')next=Math.min(stageStats.length-1,selected+1);
      else if(value==='arrowleft'||value==='a')next=Math.max(0,selected-1);
      else if(value==='arrowdown'||value==='s')next=Math.min(stageStats.length-1,selected+4);
      else if(value==='arrowup'||value==='w')next=Math.max(0,selected-4);
      else if(value==='enter'){event.preventDefault();setOpened(true);return;}
      else if(value==='escape'){setOpened(false);return;}
      else return;
      event.preventDefault();setSelected(next);
    };
    window.addEventListener('keydown',key);
    return()=>window.removeEventListener('keydown',key);
  },[executor.settings.gamifiedModeEnabled,selected,stageStats.length]);

  if(loading)return <div className="executor-loading">Criando o mapa da Jornada…</div>;
  if(error||!missions||!stages)return <EmptyState title="Não foi possível abrir a Jornada" text={error||'Conteúdo do roteiro ausente.'}/>;

  if(!executor.settings.gamifiedModeEnabled)return <div>
    <PageHeader title="Jornada de Produção" subtitle="Uma visualização orgânica e gamificada do roteiro. O Roteiro tradicional continua disponível em paralelo." actions={<Link className="secondary-button" to="/executor/roadmap">Voltar ao Roteiro</Link>}/>
    <section className="journey-disabled-card"><div className="journey-disabled-orb"><Sparkles/></div><span>MODO OPCIONAL</span><h2>Transforme as Etapas numa jornada pelo Coração de Gaia</h2><p>Use WASD ou as setas para mover o orbe entre as regiões. Cada região mostra o progresso, as missões e os caminhos ainda cobertos pela névoa.</p><button className="primary-button" onClick={()=>mutate(draft=>{draft.settings.gamifiedModeEnabled=true})}><Gamepad2/>Ativar Jornada</button></section>
  </div>;

  const active=stageStats[selected];
  const completedSteps=Object.values(executor.progress).filter(entry=>entry.itemType==='step'&&entry.status==='concluido').length;
  const passedTests=Object.values(executor.testRuns).filter(run=>run.status==='passou').length;
  const achievements=[
    {id:'first-mission',title:'Primeiro Caminho',description:'Concluir a primeira Missão de Produção.',unlocked:stageStats.some(stage=>stage.done>0),icon:<Star/>},
    {id:'first-stage',title:'Região Restaurada',description:'Concluir uma Etapa inteira.',unlocked:stageStats.some(stage=>stage.percent===100),icon:<Sparkles/>},
    {id:'hundred-steps',title:'Cem Passos de Gaia',description:'Concluir 100 Steps.',unlocked:completedSteps>=100,icon:<Award/>},
    {id:'systems-tested',title:'Guardião dos Sistemas',description:'Aprovar as 12 receitas de teste.',unlocked:passedTests>=12,icon:<CheckCircle2/>},
    {id:'vertical-slice',title:'Vertical Slice',description:'Concluir as quatro primeiras Etapas.',unlocked:stageStats.length>=4&&stageStats.slice(0,4).every(stage=>stage.percent===100),icon:<Trophy/>},
    {id:'all-stages',title:'Coração Restaurado',description:'Concluir todas as Etapas detalhadas.',unlocked:stageStats.length>0&&stageStats.every(stage=>stage.percent===100),icon:<Trophy/>},
  ];
  return <div className="executor-journey-page">
    <PageHeader title="Jornada de Produção" subtitle="Mova o orbe com WASD/setas. Enter abre a Etapa selecionada. A névoa indica caminhos ainda não concluídos." actions={<><Link className="secondary-button" to="/executor/roadmap">Voltar ao Roteiro</Link><button className="secondary-button" onClick={()=>mutate(draft=>{draft.settings.gamifiedModeEnabled=false})}>Desativar modo</button></>}/>
    <section className="journey-map" aria-label="Mapa gamificado das Etapas">
      <div className="journey-stars"/>
      <svg className="journey-paths" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
        {positions.slice(0,-1).map((point,index)=>{const next=positions[index+1];const x1=point.x*10,y1=point.y*6,x2=next.x*10,y2=next.y*6;const middle=(x1+x2)/2;return <path key={index} className={stageStats[index]?.percent===100?'complete':''} d={`M ${x1} ${y1} C ${middle} ${y1}, ${middle} ${y2}, ${x2} ${y2}`}/>})}
      </svg>
      {stageStats.map((item,index)=>{const point=positions[index]??positions[positions.length-1];return <button key={item.stage.id} className={`journey-region ${item.percent===100?'complete':''} ${item.locked?'locked':''} ${index===selected?'selected':''}`} style={{left:`${point.x}%`,top:`${point.y}%`}} onClick={()=>{setSelected(index);setOpened(true)}} aria-label={`Etapa ${item.stage.number}: ${item.stage.title}. ${item.percent}% concluída`}>
        <i className="journey-node-glow"/><span className="journey-stage-number">{item.stage.number}</span>{item.locked?<CloudFog/>:item.percent===100?<CheckCircle2/>:<Map/>}<strong>{shortStageTitle(item.stage.title)}</strong><small>{item.percent}% · {item.done}/{item.detailed} missões</small>
      </button>})}
      {active&&<div className="journey-orb" style={{left:`${positions[selected].x}%`,top:`${positions[selected].y}%`}}><span/><i/></div>}
      <div className="journey-legend"><span><i className="done"/>Concluída</span><span><i className="current"/>Posição atual</span><span><i className="fog"/>Névoa</span></div>
      <div className="journey-controls"><kbd>WASD</kbd><kbd>← ↑ ↓ →</kbd><span>mover</span><kbd>Enter</kbd><span>abrir</span></div>
    </section>
    <section className="journey-achievements"><header><div><span>CONQUISTAS DA JORNADA</span><h2>{achievements.filter(item=>item.unlocked).length}/{achievements.length} desbloqueadas</h2></div><Trophy/></header><div>{achievements.map(item=><article key={item.id} className={item.unlocked?'unlocked':'locked'}>{item.icon}<div><strong>{item.title}</strong><span>{item.description}</span></div>{item.unlocked?<CheckCircle2/>:<LockKeyhole/>}</article>)}</div></section>
    {opened&&active&&<StageWindow item={active} missions={missions} executor={executor} onClose={()=>setOpened(false)}/>} 
  </div>;
}

function StageWindow({item,missions,executor,onClose}:{item:StageStats;missions:ImportedBuildMission[];executor:ReturnType<typeof useExecutorStore.getState>['executor'];onClose:()=>void}){
  const stageMissions=missions.filter(mission=>mission.stageId===item.stage.id);
  return <div className="journey-window-backdrop" onMouseDown={event=>{if(event.currentTarget===event.target)onClose()}}><section className="journey-stage-window" role="dialog" aria-modal="true" aria-label={`Progresso da Etapa ${item.stage.number}`}>
    <header><div><span>REGIÃO {item.stage.number}</span><h2>{shortStageTitle(item.stage.title)}</h2><p>{item.locked?'A região pode ser consultada, mas parte do caminho ainda está coberta pela névoa.':'Escolha uma Missão para continuar a jornada.'}</p></div><button onClick={onClose} title="Fechar" aria-label="Fechar"><X/></button></header>
    <div className="journey-stage-overview"><div className="journey-progress-orb" style={{'--progress':`${item.percent}%`} as CSSProperties}><strong>{item.percent}%</strong><span>concluído</span></div><div><strong>{item.done} de {item.detailed}</strong><span>missões detalhadas concluídas</span><strong>{item.doneSteps} de {item.totalSteps}</strong><span>Steps concluídos</span></div></div>
    <div className="journey-mission-nodes">{stageMissions.map(mission=>{const stats=getMissionStats(executor,mission);const unlocked=isDetailedMissionUnlocked(executor,missions,mission);const state=!mission.detailed?'planned':stats.status==='concluido'?'done':stats.inProgress?'progress':!unlocked?'locked':'open';return <Link key={mission.id} className={`journey-mission-node ${state}`} to={`/executor/roadmap/${mission.id}`}><span>{mission.number}</span><div><strong>{mission.title}</strong><small>{mission.detailed?`${stats.percent}% · ${stats.done}/${stats.total} Steps`:'Conteúdo planejado'}</small></div>{state==='done'?<CheckCircle2/>:state==='locked'?<LockKeyhole/>:<ArrowRight/>}</Link>})}</div>
  </section></div>;
}

type StageStats={stage:ImportedBuildStage;percent:number;done:number;detailed:number;doneSteps:number;totalSteps:number;locked:boolean};
function buildStageStats(stage:ImportedBuildStage,missions:ImportedBuildMission[],executor:ReturnType<typeof useExecutorStore.getState>['executor']):StageStats{
  const stageMissions=missions.filter(mission=>mission.stageId===stage.id&&mission.detailed);
  const done=stageMissions.filter(mission=>getMissionStats(executor,mission).status==='concluido').length;
  const totalSteps=stageMissions.reduce((sum,mission)=>sum+getMissionStats(executor,mission).total,0);
  const doneSteps=stageMissions.reduce((sum,mission)=>sum+getMissionStats(executor,mission).done,0);
  const percent=totalSteps?Math.round(doneSteps/totalSteps*100):0;
  const previousMissions=missions.filter(mission=>mission.stageId===`build-stage-${String(stage.number-1).padStart(2,'0')}`&&mission.detailed);
  const locked=stage.number>1&&previousMissions.some(mission=>getMissionStats(executor,mission).status!=='concluido');
  return{stage,percent,done,detailed:stageMissions.length,doneSteps,totalSteps,locked};
}
function shortStageTitle(title:string){return title.replace(/^Fase \d+\s*[—-]\s*/,'')}
