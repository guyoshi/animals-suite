import { useEffect, useMemo, useState } from 'react';
import { Check, Lightbulb, Plus, RotateCcw, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card, Field, PageHeader, SectionTitle } from '../components/Ui';
import { EntityTools } from '../components/EntityTools';
import { useProjectStore } from '../store/useProjectStore';
import type { IdeaDef } from '../types';

export function IdeasPage(){
  const project=useProjectStore(s=>s.project);const mutate=useProjectStore(s=>s.mutate);const [params]=useSearchParams();
  const [category,setCategory]=useState('todas');const [selectedId,setSelectedId]=useState<string|undefined>();const [view,setView]=useState<'ativas'|'descartadas'>('ativas');const [adoptId,setAdoptId]=useState<string>();const [targetAreaId,setTargetAreaId]=useState('');
  useEffect(()=>{const id=params.get('entity');if(id)setSelectedId(id)},[params]);
  const ideas=useMemo(()=>project.ideas.filter(i=>!i.archived&&(view==='descartadas'?i.discarded:!i.discarded)&&(category==='todas'||i.category===category)),[project.ideas,category,view]);
  const selected=project.ideas.find(i=>i.id===selectedId&&!i.archived);
  const update=(fn:(idea:IdeaDef)=>void)=>mutate(d=>{const idea=d.ideas.find(x=>x.id===selectedId);if(idea)fn(idea)},false,`idea:${selectedId}`);
  const add=()=>{const id=`ideia-${Date.now()}`;mutate(d=>d.ideas.push({id,category:'mecanica',title:'Nova ideia',description:'',suggestedAreaIds:[],suggestedAnimalIds:[],suggestedAbilities:[],areaReasons:{},notes:'',tags:[],discarded:false,archived:false}),false,'idea:create');setSelectedId(id)};
  const openAdopt=(id:string)=>{const idea=project.ideas.find(i=>i.id===id);setAdoptId(id);setTargetAreaId(idea?.suggestedAreaIds[0]??project.areas.find(a=>a.type==='fase')?.id??'')};
  const adopt=()=>{
    const idea=project.ideas.find(i=>i.id===adoptId);
    const area=project.areas.find(a=>a.id===targetAreaId);
    if(!idea||!area)return;
    mutate(d=>{
      const source=d.ideas.find(i=>i.id===idea.id);
      const idSuffix=crypto.randomUUID().slice(0,8);
      if(idea.category==='inimigo'){
        d.enemies.push({id:`inimigo-${idSuffix}`,name:idea.title,category:'Drone',movement:'Estático',attackStyle:['Sem ataque'],isFlying:false,canSwim:false,canDive:false,defeatMethods:[],weaknesses:[],resistances:[],immunities:[],puzzleTraits:idea.tags,icon:'◆',notes:[idea.description,idea.notes].filter(Boolean).join('\n'),status:'planejado',archived:false});
      }else if(idea.category==='desafio'){
        d.challenges.push({id:`desafio-${idSuffix}`,areaId:area.id,name:idea.title,type:'combinado',objective:idea.description,recommendedAnimalIds:idea.suggestedAnimalIds??[],recommendedAbilities:idea.suggestedAbilities??[],reward:'',repeatable:true,primaryReward:'',repeatReward:'',npcEventRewards:[],isApoloTrial:false,status:'planejado',archived:false});
      }else if(idea.category==='missao'){
        d.missions.push({id:`missao-${idSuffix}`,name:idea.title,type:'secundaria',worldId:area.worldId,areaIds:[area.id],description:idea.description,suggestedAreaId:area.id,clearObjective:idea.description,vagueHint:idea.areaReasons?.[area.id]??'',extraHint:'',reward:'',journalText:idea.description,completionText:'',countsFor100:true,tasks:[{id:`tarefa-${idSuffix}-1`,title:'Objetivo principal',description:idea.description,dependsOnTaskIds:[],completionLinks:[],autoCompleteConditions:[],autoCompleteRequireAll:true,notes:''}],rumorIds:[],status:'planejado',archived:false,notes:idea.notes??''});
      }else if(idea.category==='npc'){
        const world=d.worlds.find(w=>w.id===area.worldId);
        d.npcs.push({id:`npc-${idSuffix}`,name:idea.title,animal:'',worldId:area.worldId,villageAreaId:world?.villageId??'',rescueAreaId:area.id,rescueRequirement:idea.description,rescueType:'interacao',villageLocation:'',preBossLine:'',postBossLine:'',hint:'',countsFor100:true,npcType:'comum',notes:idea.notes??'',missionIds:[],shopItems:[],status:'planejado',archived:false});
      }else{
        const mechanicId=`mecanica-${idSuffix}`;
        d.mechanics.push({id:mechanicId,name:idea.title,kind:idea.category==='puzzle'?'puzzle':'objeto',description:idea.description,goodForCategories:idea.tags,goodForAnimals:(idea.suggestedAnimalIds??[]).map(id=>d.animals.find(a=>a.id===id)?.name).filter(Boolean) as string[],firstSuggestedAreaId:area.id,icon:'◇',source:'Criado',archived:false});
        const target=d.areas.find(a=>a.id===area.id);
        if(target&&!target.centralMechanicIds.includes(mechanicId))target.centralMechanicIds.push(mechanicId);
      }
      if(source){
        source.discarded=true;
        source.notes=[source.notes,`Adotada em ${area.name} em ${new Date().toLocaleDateString('pt-BR')}.`].filter(Boolean).join('\n');
      }
    },true,`idea:adopt:${idea.id}`);
    setAdoptId(undefined);
    setSelectedId(undefined);
  };
  const toggle=(values:string[],id:string)=>values.includes(id)?values.filter(x=>x!==id):[...values,id];

  return <div><PageHeader title="Banco de ideias" subtitle="Ideias editáveis de inimigos, puzzles, mecânicas, Provações de Gaia, NPCs e missões. Escolha a área antes de adotar e registre por que a ideia combina com ela." actions={<button className="primary-button" onClick={add}><Plus/> Nova ideia</button>}/>
    <div className="idea-toolbar"><div className="tabs compact"><button className={view==='ativas'?'active':''} onClick={()=>setView('ativas')}>Disponíveis</button><button className={view==='descartadas'?'active':''} onClick={()=>setView('descartadas')}>Descartadas</button></div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="todas">Todas</option><option value="inimigo">Inimigos</option><option value="puzzle">Puzzles</option><option value="mecanica">Mecânicas</option><option value="desafio">Provações de Gaia</option><option value="npc">NPCs</option><option value="missao">Missões</option></select><span>{ideas.length} ideia(s)</span></div>
    {selected&&<Card className="idea-editor"><SectionTitle>Editar ideia</SectionTitle><div className="form-grid three"><Field label="Título"><input value={selected.title} onChange={e=>update(i=>{i.title=e.target.value})}/></Field><Field label="Tipo"><select value={selected.category} onChange={e=>update(i=>{i.category=e.target.value as IdeaDef['category']})}><option value="inimigo">Inimigo</option><option value="puzzle">Puzzle</option><option value="mecanica">Mecânica</option><option value="desafio">Provação de Gaia</option><option value="npc">NPC</option><option value="missao">Missão</option></select></Field><Field label="Tags"><input value={selected.tags.join(', ')} onChange={e=>update(i=>{i.tags=split(e.target.value)})}/></Field></div><Field label="Descrição"><textarea value={selected.description} onChange={e=>update(i=>{i.description=e.target.value})}/></Field>
      <SectionTitle>Áreas sugeridas e justificativa</SectionTitle><div className="idea-area-editor">{project.areas.filter(a=>a.type==='fase').map(area=>{const active=selected.suggestedAreaIds.includes(area.id);return <div key={area.id} className={active?'active':''}><button onClick={()=>update(i=>{i.suggestedAreaIds=toggle(i.suggestedAreaIds,area.id);if(!i.suggestedAreaIds.includes(area.id)&&i.areaReasons)delete i.areaReasons[area.id]})}>{area.name}</button>{active&&<input placeholder="Por que combina com esta área?" value={selected.areaReasons?.[area.id]??''} onChange={e=>update(i=>{i.areaReasons??={};i.areaReasons[area.id]=e.target.value})}/>}</div>})}</div>
      <SectionTitle>Animais e habilidades sugeridos</SectionTitle><div className="chips selectable">{project.animals.map(animal=><button key={animal.id} className={(selected.suggestedAnimalIds??[]).includes(animal.id)?'selected':''} onClick={()=>update(i=>{i.suggestedAnimalIds=toggle(i.suggestedAnimalIds??[],animal.id)})}>{animal.name}</button>)}</div><Field label="Habilidades sugeridas"><input value={(selected.suggestedAbilities??[]).join(', ')} onChange={e=>update(i=>{i.suggestedAbilities=split(e.target.value)})}/></Field><Field label="Notas"><textarea value={selected.notes??''} onChange={e=>update(i=>{i.notes=e.target.value})}/></Field><div className="card-actions">{selected.discarded?<button className="secondary-button" onClick={()=>update(i=>{i.discarded=false})}><RotateCcw/> Recuperar ideia</button>:<button className="secondary-button" onClick={()=>update(i=>{i.discarded=true})}>Descartar ideia</button>}<button className="primary-button" onClick={()=>openAdopt(selected.id)}><Check/> Adotar numa área</button></div><EntityTools entityRef={{type:'idea',id:selected.id}} onArchived={()=>setSelectedId(undefined)}/></Card>}
    <div className="ideas-grid">{ideas.map(i=><Card key={i.id}><button className="idea-card-open" onClick={()=>setSelectedId(i.id)}><div className="idea-icon"><Lightbulb/></div><SectionTitle>{i.title}</SectionTitle><p>{i.description}</p></button><div className="chips">{i.tags.map(t=><span key={t}>{t}</span>)}</div><div className="idea-areas">{i.suggestedAreaIds.map(id=>{const a=project.areas.find(x=>x.id===id);const w=a&&project.worlds.find(x=>x.id===a.worldId);return a?<span key={id} title={i.areaReasons?.[id]} style={{borderColor:w?.theme.primary,color:w?.theme.primary}}>{a.name}</span>:null})}</div><div className="card-actions"><button className="secondary-button" onClick={()=>setSelectedId(i.id)}>Editar</button>{i.discarded?<button className="secondary-button" onClick={()=>mutate(d=>{const x=d.ideas.find(x=>x.id===i.id);if(x)x.discarded=false})}><RotateCcw/> Recuperar</button>:<button className="primary-button" onClick={()=>openAdopt(i.id)}><Check/> Adotar</button>}</div></Card>)}</div>
    {adoptId&&<div className="modal-backdrop" onClick={()=>setAdoptId(undefined)}><div className="modal-card" onClick={e=>e.stopPropagation()}><div className="modal-title-row"><SectionTitle>Adotar ideia</SectionTitle><button className="icon-button" onClick={()=>setAdoptId(undefined)}><X/></button></div><p>A ideia será transformada no tipo correto e ligada diretamente à área escolhida.</p><Field label="Área de destino"><select value={targetAreaId} onChange={e=>setTargetAreaId(e.target.value)}>{project.areas.filter(a=>a.type==='fase').map(a=><option key={a.id} value={a.id}>{project.worlds.find(w=>w.id===a.worldId)?.name} — {a.name}</option>)}</select></Field>{targetAreaId&&<p className="idea-reason-preview"><strong>Por que combina:</strong> {project.ideas.find(i=>i.id===adoptId)?.areaReasons?.[targetAreaId]||'Nenhuma justificativa registrada.'}</p>}<div className="modal-actions"><button className="secondary-button" onClick={()=>setAdoptId(undefined)}>Cancelar</button><button className="primary-button" disabled={!targetAreaId} onClick={adopt}><Check/> Criar e relacionar</button></div></div></div>}
  </div>;
}
function split(value:string){return value.split(',').map(x=>x.trim()).filter(Boolean)}
