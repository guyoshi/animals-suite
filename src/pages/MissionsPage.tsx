import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GitBranch, Link2, MapPin, Plus, Trash2, Zap } from 'lucide-react';
import { Card, EmptyState, Field, PageHeader, SectionTitle, StatusBadge, WarningDot } from '../components/Ui';
import { useProjectStore } from '../store/useProjectStore';
import { EntityTools } from '../components/EntityTools';
import type {
  MissionAutoCondition, MissionCompletionLink, MissionDef, MissionTask,
  ProjectState, TaskTriggerType,
} from '../types';

const TRIGGERS: Array<[TaskTriggerType,string]> = [
  ['npc_interacao','Interagir com NPC'],['objeto_interacao','Interagir com objeto'],['ponto_mapa','Entrar em ponto do mapa'],['entrar_area','Chegar a uma área'],
  ['possuir_item','Possuir item'],['quantidade_item','Possuir quantidade de item'],['coletar_runa','Coletar qualquer Runa'],['runa_especifica','Coletar Runa específica'],
  ['derrotar_inimigo','Derrotar inimigo'],['quantidade_inimigos','Derrotar quantidade de inimigos'],['resgatar_npc','Resgatar NPC'],['concluir_desafio','Concluir Provação de Gaia'],
  ['descobrir_rumor','Descobrir rumor'],['variavel','Variável atingir valor'],['missao_concluida','Concluir outra missão'],
];

export function MissionsPage(){
  const project=useProjectStore(s=>s.project);
  const mutate=useProjectStore(s=>s.mutate);
  const [params]=useSearchParams();
  const [selectedId,setSelectedId]=useState<string|undefined>(project.missions.find(m=>!m.archived)?.id);
  useEffect(()=>{const id=params.get('entity');if(id)setSelectedId(id);const task=params.get('task');if(task)window.setTimeout(()=>document.getElementById(`task-${task}`)?.scrollIntoView({behavior:'smooth',block:'center'}),100)},[params]);
  const [filter,setFilter]=useState('todas');
  const missions=useMemo(()=>project.missions.filter(m=>!m.archived&&(filter==='todas'||m.type===filter)),[project.missions,filter]);
  const mission=project.missions.find(m=>m.id===selectedId&&!m.archived) ?? missions[0];

  const createMission=()=>{
    const worldId=project.worlds.find(w=>w.id!=='w0')?.id??'w1';
    const id=`missao-${Date.now()}`;
    const next:MissionDef={id,name:'Nova missão',type:'secundaria',worldId,areaIds:[],description:'',suggestedAreaId:undefined,clearObjective:'',vagueHint:'',extraHint:'',reward:'',journalText:'',completionText:'',countsFor100:true,tasks:[],rumorIds:[],status:'planejado',archived:false,notes:''};
    mutate(d=>d.missions.push(next));
    setSelectedId(id);
  };

  const update=(fn:(m:MissionDef,draft:ProjectState)=>void)=>mutate(d=>{
    const target=d.missions.find(x=>x.id===mission?.id);
    if(!target)return;
    fn(target,d);
    syncNpcMissionRelations(d,target);
  });

  const addTask=()=>update(m=>{
    const id=uniqueTaskId(m,'nova_tarefa');
    m.tasks.push({id,title:`Tarefa ${m.tasks.length+1}`,description:'',dependsOnTaskIds:[],completionLinks:[],autoCompleteConditions:[],autoCompleteRequireAll:true,notes:''});
  });



  return <div>
    <PageHeader title="Missões do jogo" subtitle="Missões que existem dentro de Animals. Modelo sincronizado com o backup 16/06: Missão → tarefas não-lineares com dependências e condições automáticas. Uma tarefa fica ativa quando todas as dependências estiverem concluídas." actions={<button className="primary-button" onClick={createMission}><Plus/> Nova missão</button>}/>
    <div className="split-editor">
      <aside className="entity-list">
        <div className="filter-row"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="todas">Todas</option><option value="principal">Principais</option><option value="secundaria">Secundárias</option><option value="quest">Quests</option></select></div>
        {missions.map(item=>{
          const issues=missionIssues(item);
          return <button key={item.id} className={item.id===mission?.id?'active':''} onClick={()=>setSelectedId(item.id)}><div><strong>{item.name}</strong><small>{project.worlds.find(w=>w.id===item.worldId)?.name} · {item.tasks.length} tarefas</small></div>{issues.length?<WarningDot title={issues.join('\n')}/>:<StatusBadge status={item.status}/>}</button>;
        })}
      </aside>
      <section className="editor-pane">{!mission?<EmptyState title="Selecione uma missão" text="Crie ou escolha uma missão para editar suas tarefas e relações."/>:<>
        <div className="editor-heading"><div><input className="title-input" value={mission.name} onChange={e=>update(m=>{m.name=e.target.value})}/><div className="chips"><StatusBadge status={mission.status}/><span>{mission.type}</span><span>{mission.tasks.filter(t=>!t.archived).length} tarefas</span></div></div></div>
        <div className="form-grid three">
          <Field label="Tipo"><select value={mission.type} onChange={e=>update((m,d)=>{const type=e.target.value as MissionDef['type'];if(type==='principal'&&d.missions.some(x=>x.id!==m.id&&x.worldId===m.worldId&&x.type==='principal'&&!x.archived)){alert('Só pode existir uma missão principal por mundo.');return;}m.type=type;})}><option value="principal">Principal</option><option value="secundaria">Secundária</option><option value="quest">Quest</option></select></Field>
          <Field label="Mundo"><select value={mission.worldId} onChange={e=>update(m=>{m.worldId=e.target.value;m.areaIds=m.areaIds.filter(id=>project.areas.find(a=>a.id===id)?.worldId===e.target.value)})}>{project.worlds.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
          <Field label="NPC que inicia"><select value={mission.starterNpcId??''} onChange={e=>update(m=>{m.starterNpcId=e.target.value||undefined})}><option value="">Nenhum / evento de cenário</option>{project.npcs.filter(n=>!n.archived).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></Field>
        </div>
        <Field label="Descrição interna"><textarea value={mission.description} onChange={e=>update(m=>{m.description=e.target.value})}/></Field>
        <div className="form-grid three"><Field label="Área sugerida"><select value={mission.suggestedAreaId??''} onChange={e=>update(m=>{m.suggestedAreaId=e.target.value||undefined})}><option value="">Nenhuma / várias</option>{project.areas.filter(a=>a.worldId===mission.worldId).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label="Conta para 100%"><select value={mission.countsFor100===false?'nao':'sim'} onChange={e=>update(m=>{m.countsFor100=e.target.value==='sim'})}><option value="sim">Sim</option><option value="nao">Não</option></select></Field><Field label="Recompensa"><input value={mission.reward??''} onChange={e=>update(m=>{m.reward=e.target.value})}/></Field></div>
        <Field label="Objetivo claro"><input value={mission.clearObjective??''} onChange={e=>update(m=>{m.clearObjective=e.target.value})} placeholder="O que o jogador precisa fazer"/></Field>
        <div className="form-grid"><Field label="Pista vaga"><textarea value={mission.vagueHint??''} onChange={e=>update(m=>{m.vagueHint=e.target.value})}/></Field><Field label="Pista extra"><textarea value={mission.extraHint??''} onChange={e=>update(m=>{m.extraHint=e.target.value})}/></Field></div>
        <div className="form-grid"><Field label="Texto no Diário"><textarea value={mission.journalText??''} onChange={e=>update(m=>{m.journalText=e.target.value})}/></Field><Field label="Texto após conclusão"><textarea value={mission.completionText??''} onChange={e=>update(m=>{m.completionText=e.target.value})}/></Field></div>
        <Field label="Áreas relacionadas"><div className="chips selectable">{project.areas.filter(a=>a.worldId===mission.worldId).map(a=><button key={a.id} className={mission.areaIds.includes(a.id)?'selected':''} onClick={()=>update(m=>{m.areaIds=m.areaIds.includes(a.id)?m.areaIds.filter(x=>x!==a.id):[...m.areaIds,a.id]})}>{a.name}</button>)}</div></Field>
        <Field label="Rumores relacionados"><div className="chips selectable">{project.rumors.filter(r=>!r.archived).map(r=><button key={r.id} className={mission.rumorIds.includes(r.id)?'selected':''} onClick={()=>update((m,d)=>{m.rumorIds=m.rumorIds.includes(r.id)?m.rumorIds.filter(x=>x!==r.id):[...m.rumorIds,r.id];const rumor=d.rumors.find(x=>x.id===r.id);if(rumor)rumor.missionIds=m.rumorIds.includes(r.id)?[...new Set([...rumor.missionIds,m.id])]:rumor.missionIds.filter(id=>id!==m.id);})}>{r.title}</button>)}</div></Field>

        <Card className="mission-model-note"><GitBranch/><div><strong>Como funciona no Unity 16/06</strong><p>Não existe mais “tarefa atual”. Várias tarefas podem ficar ativas ao mesmo tempo. Cada tarefa depende de <strong>todas</strong> as tarefas selecionadas abaixo. Quando todas as tarefas da missão forem concluídas, a missão termina automaticamente.</p></div></Card>

        <div className="mission-flow-header"><SectionTitle>Tarefas da missão</SectionTitle><button className="secondary-button" onClick={addTask}><Plus/> Adicionar tarefa</button></div>
        <div className="mission-task-stack">{mission.tasks.map((task,index)=>({task,index})).filter(({task})=>!task.archived).map(({task,index})=><TaskCard key={task.id} task={task} index={index} mission={mission} project={project} update={update}/>)}</div>
        {mission.tasks.filter(t=>!t.archived).length===0&&<EmptyState title="Missão sem tarefas" text="Ela funcionará apenas como um interruptor iniciado/concluído. Adicione tarefas para controlar o progresso no Diário."/>}
        <Field label="Notas técnicas"><textarea value={mission.notes??''} onChange={e=>update(m=>{m.notes=e.target.value})} placeholder="Observações de configuração no Unity, variáveis ou decisões de design."/></Field>
        <EntityTools entityRef={{type:'mission',id:mission.id}} onArchived={()=>setSelectedId(undefined)}/>
      </>}</section>
    </div>
  </div>;
}

function TaskCard({task,index,mission,project,update}:{task:MissionTask;index:number;mission:MissionDef;project:ProjectState;update:(fn:(m:MissionDef,d:ProjectState)=>void)=>void}){
  const duplicate=mission.tasks.some(other=>other!==task&&other.id===task.id);
  const missingLinks=task.completionLinks.length===0&&task.autoCompleteConditions.length===0;
  const missingDependency=task.dependsOnTaskIds.some(id=>!mission.tasks.some(other=>other.id===id));
  const circular=hasDependencyCycle(mission,task.id);
  const warnings=[duplicate&&'Task ID repetido',missingLinks&&'Nenhuma ação nem condição conclui esta tarefa',missingDependency&&'Dependência inexistente',circular&&'Dependência circular'].filter(Boolean) as string[];

  const renameTask=(next:string)=>update(m=>{
    const current=m.tasks[index];if(!current)return;
    const old=current.id;current.id=slug(next)||old;
    for(const other of m.tasks)other.dependsOnTaskIds=other.dependsOnTaskIds.map(id=>id===old?current.id:id);
  });
  const addLink=()=>update(m=>m.tasks[index]?.completionLinks.push({id:`acao-${Date.now()}`,triggerType:'npc_interacao',notes:''}));
  const addCondition=()=>update(m=>m.tasks[index]?.autoCompleteConditions.push({id:`condicao-${Date.now()}`,triggerType:'possuir_item',notes:''}));

  return <Card className={`mission-task-v2 ${warnings.length?'has-warning':''}`}><div id={`task-${task.id}`}/>
    <div className="mission-task-head"><span className="task-order">{index+1}</span><div className="mission-task-titles"><input value={task.title} onChange={e=>update(m=>{const t=m.tasks[index];if(t)t.title=e.target.value})} placeholder="Título curto da tarefa"/><label>Task ID <input value={task.id} onChange={e=>renameTask(e.target.value)}/></label></div>{warnings.length?<WarningDot title={warnings.join('\n')}/>:<StatusBadge status={mission.status}/>}<span/></div>
    <Field label="Texto mostrado no Diário"><textarea value={task.description} onChange={e=>update(m=>{const t=m.tasks[index];if(t)t.description=e.target.value})} placeholder="Ex.: Encontrar a pá perdida no Riacho."/></Field>
    <Field label="Pré-requisitos — todas estas tarefas precisam estar concluídas" hint="Tarefas sem dependências ficam ativas assim que a missão começa. Tarefas bloqueadas não aparecem no Diário."><div className="chips selectable">{mission.tasks.filter(other=>other!==task&&!other.archived).map(other=><button key={other.id} className={task.dependsOnTaskIds.includes(other.id)?'selected':''} onClick={()=>update(m=>{const current=m.tasks[index];if(!current)return;current.dependsOnTaskIds=current.dependsOnTaskIds.includes(other.id)?current.dependsOnTaskIds.filter(id=>id!==other.id):[...current.dependsOnTaskIds,other.id]})}>{other.title||other.id}</button>)}</div></Field>

    <div className="mission-subsection-head"><div><Link2/><strong>Ações que concluem a tarefa</strong><small>Representam Action_CompleteMissionTask em NPCs, objetos ou pontos do mapa. Qualquer ação abaixo pode concluir esta mesma tarefa.</small></div><button className="secondary-button" onClick={addLink}><Plus/> Adicionar ação</button></div>
    <div className="mission-link-list">{task.completionLinks.map((link,linkIndex)=><TriggerRow key={link.id} value={link} project={project} mission={mission} task={task} onChange={patch=>update(m=>{const target=m.tasks[index]?.completionLinks[linkIndex];if(target)Object.assign(target,patch)})} onDelete={()=>update(m=>{m.tasks[index]?.completionLinks.splice(linkIndex,1)})}/>)}</div>
    {task.completionLinks.length===0&&<p className="inline-warning">! Nenhuma interação está ligada a esta tarefa.</p>}

    <div className="mission-subsection-head"><div><Zap/><strong>Conclusão automática</strong><small>Condições avaliadas pelo MissionManager enquanto a tarefa estiver ativa.</small></div><button className="secondary-button" onClick={addCondition}><Plus/> Adicionar condição</button></div>
    {task.autoCompleteConditions.length>1&&<label className="condition-mode">Concluir quando <select value={task.autoCompleteRequireAll?'todas':'qualquer'} onChange={e=>update(m=>{const t=m.tasks[index];if(t)t.autoCompleteRequireAll=e.target.value==='todas'})}><option value="todas">todas as condições forem verdadeiras</option><option value="qualquer">qualquer condição for verdadeira</option></select></label>}
    <div className="mission-link-list">{task.autoCompleteConditions.map((condition,conditionIndex)=><TriggerRow key={condition.id} value={condition} project={project} mission={mission} task={task} onChange={patch=>update(m=>{const target=m.tasks[index]?.autoCompleteConditions[conditionIndex];if(target)Object.assign(target,patch)})} onDelete={()=>update(m=>{m.tasks[index]?.autoCompleteConditions.splice(conditionIndex,1)})}/>)}</div>
    <Field label="Notas da tarefa"><textarea value={task.notes??''} onChange={e=>update(m=>{const t=m.tasks[index];if(t)t.notes=e.target.value})} placeholder="Onde configurar, evento, diálogo ou observação de teste."/></Field>
    <EntityTools entityRef={{type:'task',id:task.id,parentId:mission.id}}/>
  </Card>;
}

type TriggerValue=MissionCompletionLink|MissionAutoCondition;
function TriggerRow({value,project,mission,task,onChange,onDelete}:{value:TriggerValue;project:ProjectState;mission:MissionDef;task:MissionTask;onChange:(patch:Partial<TriggerValue>)=>void;onDelete:()=>void}){
  return <div className="mission-trigger-row">
    <Field label="Tipo"><select value={value.triggerType} onChange={e=>onChange({triggerType:e.target.value as TaskTriggerType,targetId:undefined,quantity:undefined,expectedValue:undefined})}>{TRIGGERS.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></Field>
    <TargetField value={value} project={project} mission={mission} task={task} onChange={patch=>onChange(patch)}/>
    {needsQuantity(value.triggerType)&&<Field label="Quantidade"><input type="number" min="1" value={value.quantity??1} onChange={e=>onChange({quantity:Number(e.target.value)})}/></Field>}
    {value.triggerType==='variavel'&&<Field label="Valor esperado"><input value={value.expectedValue??''} onChange={e=>onChange({expectedValue:e.target.value})}/></Field>}
    <Field label="Observação"><input value={value.notes??''} onChange={e=>onChange({notes:e.target.value})} placeholder="Evento, diálogo ou uso"/></Field>
    <button className="danger-icon trigger-delete" onClick={onDelete}><Trash2/></button>
  </div>;
}

function TargetField({value,project,mission,task,onChange}:{value:TriggerValue;project:ProjectState;mission:MissionDef;task:MissionTask;onChange:(patch:Partial<TriggerValue>)=>void}){
  const mutate=useProjectStore(s=>s.mutate);
  const options: Array<[string,string]> = value.triggerType==='npc_interacao'||value.triggerType==='resgatar_npc' ? project.npcs.filter(x=>!x.archived).map(x=>[x.id,x.name] as [string,string])
    : value.triggerType==='entrar_area' ? project.areas.map(x=>[x.id,x.name] as [string,string])
    : value.triggerType==='possuir_item'||value.triggerType==='quantidade_item' ? project.items.filter(x=>!x.archived).map(x=>[x.id,x.name] as [string,string])
    : value.triggerType==='derrotar_inimigo'||value.triggerType==='quantidade_inimigos' ? project.enemies.filter(x=>!x.archived).map(x=>[x.id,x.name] as [string,string])
    : value.triggerType==='concluir_desafio' ? project.challenges.filter(x=>!x.archived).map(x=>[x.id,x.name] as [string,string])
    : value.triggerType==='descobrir_rumor' ? project.rumors.filter(x=>!x.archived).map(x=>[x.id,x.title] as [string,string])
    : value.triggerType==='missao_concluida' ? project.missions.filter(x=>!x.archived).map(x=>[x.id,x.name] as [string,string])
    : value.triggerType==='runa_especifica' ? project.areaResources.filter(r=>r.kind==='rune'&&!r.archived).map(r=>[r.id,`${r.name} — ${project.areas.find(a=>a.id===r.areaId)?.name}`] as [string,string])
    : [];
  if(value.triggerType==='coletar_runa')return <Field label="Alvo"><input value="Qualquer Runa" disabled/></Field>;
  if(value.triggerType==='ponto_mapa'){
    const points=project.areaResources.filter(r=>r.kind==='missionPoint'&&!r.archived);
    const selected=points.find(r=>r.id===value.targetId);
    const createPoint=()=>{const areaId=mission.suggestedAreaId??mission.areaIds[0];if(!areaId){alert('Relacione uma área à missão antes de criar o ponto.');return;}const resourceId=`missionPoint-${crypto.randomUUID()}`,mapId=`map-${resourceId}`;mutate(d=>{d.areaResources.push({id:resourceId,areaId,kind:'missionPoint',name:`${mission.name} — ${task.title}`,description:'Ponto criado pela tarefa.',status:'planejado',missionId:mission.id,taskId:task.id,mapObjectId:mapId,notes:'',archived:false});const map=d.maps.find(m=>m.areaId===areaId);map?.objects.push({id:mapId,type:'missionPoint',x:0,y:0,label:`${mission.name}: ${task.title}`,resourceType:'mission',resourceId,icon:'●',status:'planejado',categoryColor:'#ffc857',placed:false,relationIds:[mission.id,task.id]})},false,`mission-point:${task.id}`);onChange({targetId:resourceId,mapPointId:mapId});};
    return <Field label="Ponto circular do mapa"><div className="target-with-actions"><select value={value.targetId??''} onChange={e=>{const r=points.find(p=>p.id===e.target.value);onChange({targetId:e.target.value||undefined,mapPointId:r?.mapObjectId})}}><option value="">Selecione…</option>{points.map(r=><option key={r.id} value={r.id}>{r.name} — {project.areas.find(a=>a.id===r.areaId)?.name}</option>)}</select><button type="button" className="icon-button" title="Criar ponto a partir desta tarefa" onClick={createPoint}><Plus/></button>{selected?.mapObjectId&&<Link className="icon-button" title="Abrir centralizado no mapa" to={`/area/${selected.areaId}/map?object=${selected.mapObjectId}`}><MapPin/></Link>}</div></Field>;
  }
  if(value.triggerType==='variavel'||value.triggerType==='objeto_interacao')return <Field label={value.triggerType==='variavel'?'Nome da variável':'ID do objeto/NPC Controller'}><input value={value.targetId??''} onChange={e=>onChange({targetId:e.target.value||undefined})}/></Field>;
  return <Field label="Alvo"><select value={value.targetId??''} onChange={e=>onChange({targetId:e.target.value||undefined})}><option value="">Selecione…</option>{options.map(([id,label])=><option value={id} key={`${value.id}-${id}`}>{label}</option>)}</select></Field>;
}

function missionIssues(mission:MissionDef){
  const issues:string[]=[];
  const ids=new Set<string>();
  for(const task of mission.tasks){
    if(!task.id||ids.has(task.id))issues.push('Task ID vazio ou repetido');
    ids.add(task.id);
    if(!task.description)issues.push(`Tarefa “${task.title}” sem texto do Diário`);
    if(task.completionLinks.length===0&&task.autoCompleteConditions.length===0)issues.push(`Tarefa “${task.title}” sem forma de conclusão`);
    if(task.dependsOnTaskIds.some(id=>!mission.tasks.some(other=>other.id===id)))issues.push(`Tarefa “${task.title}” depende de ID inexistente`);
  }
  if(mission.tasks.some(task=>hasDependencyCycle(mission,task.id)))issues.push('Dependência circular entre tarefas');
  return [...new Set(issues)];
}

function hasDependencyCycle(mission:MissionDef,startId:string){
  const visiting=new Set<string>();const visited=new Set<string>();
  const visit=(id:string):boolean=>{if(visiting.has(id))return true;if(visited.has(id))return false;visiting.add(id);const task=mission.tasks.find(t=>t.id===id);for(const dep of task?.dependsOnTaskIds??[]){if(visit(dep))return true;}visiting.delete(id);visited.add(id);return false;};
  return visit(startId);
}
function needsQuantity(type:TaskTriggerType){return type==='quantidade_item'||type==='quantidade_inimigos';}
function uniqueTaskId(mission:MissionDef,base:string){let id=base;let n=2;while(mission.tasks.some(t=>t.id===id)){id=`${base}_${n++}`;}return id;}
function slug(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
function syncNpcMissionRelations(project:ProjectState,mission:MissionDef){
  const related=new Set<string>();if(mission.starterNpcId)related.add(mission.starterNpcId);
  for(const task of mission.tasks){for(const item of [...task.completionLinks,...task.autoCompleteConditions])if((item.triggerType==='npc_interacao'||item.triggerType==='resgatar_npc')&&item.targetId)related.add(item.targetId);}
  for(const npc of project.npcs){const has=npc.missionIds.includes(mission.id);if(related.has(npc.id)&&!has)npc.missionIds.push(mission.id);if(!related.has(npc.id)&&has)npc.missionIds=npc.missionIds.filter(id=>id!==mission.id);}
}
