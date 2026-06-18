import { useMemo, useState } from 'react';
import { CheckCircle2, CircleDashed, Clock3, Filter, LockKeyhole, Search, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadBuildMissions, loadBuildStages } from '../../lib/executorContent';
import { getMissionStats, isDetailedMissionUnlocked } from '../../lib/executorProgress';
import { useExecutorStore } from '../../store/useExecutorStore';

export function ExecutorRoadmapPage(){
  const {data:missions,error,loading}=useAsyncContent(loadBuildMissions,[]);
  const {data:stages}=useAsyncContent(loadBuildStages,[]);
  const executor=useExecutorStore(state=>state.executor);
  const [term,setTerm]=useState('');
  const [stage,setStage]=useState('');
  const [stateFilter,setStateFilter]=useState('');
  const [productionFilter,setProductionFilter]=useState('');

  const filtered=useMemo(()=>{
    if(!missions)return [];
    const query=term.trim().toLocaleLowerCase('pt-BR');
    return missions.filter(mission=>{
      const stats=getMissionStats(executor,mission);
      const matchesText=!query||`${mission.number} ${mission.title} ${mission.summary} ${mission.phase} ${mission.scripts.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query);
      const matchesStage=!stage||mission.stageId===stage;
      const matchesState=!stateFilter||stateFilter===(mission.detailed?stats.status:'planejada');
      const allText=`${mission.title} ${mission.summary} ${mission.objective} ${mission.result} ${mission.scripts.join(' ')} ${mission.guide} ${mission.art} ${mission.preset} ${mission.warnings.join(' ')} ${mission.tasks.flatMap(task=>[task.title,task.purpose,task.art,task.preset,...task.scripts,...task.steps.flatMap(step=>[step.title,step.actions.join(' '),step.expected,step.trouble,step.art,step.preset])]).join(' ')}`.toLocaleLowerCase('pt-BR');
      const matchesProduction=!productionFilter||productionFilter==='code'&&mission.scripts.length>0||productionFilter==='art'&&Boolean(mission.art||mission.tasks.some(task=>task.art||task.steps.some(step=>step.art)))||productionFilter==='preset'&&Boolean(mission.preset||mission.tasks.some(task=>task.preset||task.steps.some(step=>step.preset)))||productionFilter==='guide'&&Boolean(mission.guide||mission.tasks.some(task=>task.guide||task.steps.some(step=>step.guide)))||productionFilter==='warning'&&mission.warnings.length>0||productionFilter==='save'&&/(save|autosave|checkpoint|ng\+)/.test(allText)||productionFilter==='audio'&&/(audio|música|musica|som|jukebox|melodia|bgm|sfx)/.test(allText)||productionFilter==='test'&&mission.detailed||productionFilter==='global'&&/(global|todos os mundos|manager|singleton)/.test(allText);
      return matchesText&&matchesStage&&matchesState&&matchesProduction;
    });
  },[executor,missions,productionFilter,stage,stateFilter,term]);

  if(loading)return <div className="executor-loading">Carregando roteiro de produção…</div>;
  if(error||!missions)return <EmptyState title="Não foi possível abrir o roteiro" text={error||'Conteúdo ausente.'}/>;

  return <div>
    <PageHeader title="Roteiro de Produção" subtitle={`${missions.length} missões agrupadas em ${stages?.length||8} etapas. As missões planejadas podem ser consultadas; as detalhadas possuem tarefas e Steps executáveis.`}/>
    <div className="executor-toolbar">
      <label><Search/><input value={term} onChange={event=>setTerm(event.target.value)} placeholder="Buscar missão, sistema ou script…"/></label>
      <label><Filter/><select value={stage} onChange={event=>setStage(event.target.value)}><option value="">Todas as etapas</option>{stages?.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <select value={stateFilter} onChange={event=>setStateFilter(event.target.value)}><option value="">Todos os estados</option><option value="nao_iniciado">Por começar</option><option value="em_andamento">Em andamento</option><option value="concluido">Concluídas</option><option value="planejada">Planejadas</option></select><select value={productionFilter} onChange={event=>setProductionFilter(event.target.value)}><option value="">Todos os tipos de trabalho</option><option value="code">Precisa de código</option><option value="art">Precisa de arte</option><option value="preset">Precisa de prefab/preset</option><option value="guide">Possui guia relacionado</option><option value="warning">Possui alerta</option><option value="save">Afeta save/checkpoint</option><option value="audio">Precisa de áudio</option><option value="test">Precisa de teste</option><option value="global">Afeta sistemas globais</option></select><button className="text-button" onClick={()=>{setTerm('');setStage('');setStateFilter('');setProductionFilter('')}}>Limpar filtros</button>
    </div>
    <div className="executor-stage-list">{stages?.map(stageItem=>{
      const stageMissions=filtered.filter(mission=>mission.stageId===stageItem.id);
      if(stageMissions.length===0)return null;
      const allStage=missions.filter(mission=>mission.stageId===stageItem.id&&mission.detailed);
      const done=allStage.filter(mission=>getMissionStats(executor,mission).status==='concluido').length;
      const totalSteps=allStage.reduce((sum,mission)=>sum+getMissionStats(executor,mission).total,0);
      const doneSteps=allStage.reduce((sum,mission)=>sum+getMissionStats(executor,mission).done,0);
      const percent=totalSteps?Math.round(doneSteps/totalSteps*100):0;
      return <section key={stageItem.id} className="executor-stage-section">
        <header><div><span>ETAPA {stageItem.number}</span><h2>{stageItem.title.replace(/^Fase \d+\s*[—-]\s*/,'')}</h2></div><div className="executor-stage-progress"><strong>{percent}%</strong><span>{done}/{allStage.length} detalhadas concluídas</span><i><b style={{width:`${percent}%`}}/></i></div></header>
        <div className="executor-mission-grid">{stageMissions.map(mission=>{
          const stats=getMissionStats(executor,mission);
          const unlocked=isDetailedMissionUnlocked(executor,missions,mission);
          const visual=mission.detailed?stats.status:'planejada';
          return <Link key={mission.id} to={`/executor/roadmap/${mission.id}`} className={`executor-mission-card state-${visual} ${!unlocked?'locked':''}`}>
            <div className="executor-mission-card-top"><span>MISSÃO {mission.number}</span>{!mission.detailed?<em><Wrench/>Planejada</em>:!unlocked?<em><LockKeyhole/>Bloqueada</em>:stats.status==='concluido'?<em><CheckCircle2/>Concluída</em>:stats.inProgress?<em><Clock3/>Em andamento</em>:<em><CircleDashed/>Por começar</em>}</div>
            <h3>{mission.title}</h3><p>{mission.summary}</p>
            <footer><span>{mission.tasks.length} tarefas</span><span>{stats.total} Steps</span>{mission.detailed&&<div><i style={{width:`${stats.percent}%`}}/></div>}</footer>
          </Link>;
        })}</div>
      </section>;
    })}</div>
    {filtered.length===0&&<EmptyState title="Nenhuma missão encontrada" text="Altere os filtros ou o texto pesquisado."/>}
  </div>;
}
