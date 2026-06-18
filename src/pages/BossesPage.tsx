import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ImagePlus, Plus, Swords, Trash2 } from 'lucide-react';
import { Card, Field, PageHeader, SectionTitle, StatusBadge } from '../components/Ui';
import { EntityTools } from '../components/EntityTools';
import { mediaDisplayUrl, persistMediaFile } from '../lib/storage';
import { useProjectStore } from '../store/useProjectStore';
import type { BossDef } from '../types';

export function BossesPage(){
  const project=useProjectStore(s=>s.project);
  const mutate=useProjectStore(s=>s.mutate);
  const [params,setParams]=useSearchParams();
  const visible=project.bosses.filter(b=>!b.archived);
  const [selectedId,setSelectedId]=useState(params.get('entity')??visible[0]?.id);
  useEffect(()=>{const id=params.get('entity');if(id)setSelectedId(id)},[params]);
  const boss=visible.find(b=>b.id===selectedId)??visible[0];
  const update=(fn:(draft:BossDef)=>void)=>boss&&mutate(d=>{const target=d.bosses.find(x=>x.id===boss.id);if(target)fn(target)},false,`boss:${boss.id}`);
  if(!boss)return <div>Sem bosses cadastrados.</div>;
  const world=project.worlds.find(w=>w.id===boss.worldId);
  const area=project.areas.find(a=>a.id===boss.areaId);
  const mission=project.missions.find(m=>m.id===area?.unlockMissionId)??project.missions.find(m=>m.worldId===boss.worldId&&m.type==='principal');
  const animalUse=project.animals.map(animal=>({animal,count:boss.phases.filter(p=>p.recommendedAnimalIds.includes(animal.id)).length})).filter(x=>x.animal.worldId===boss.worldId||x.animal.id==='cavalo');
  const abilityValues=new Map<string,number>();for(const phase of boss.phases)for(const ability of phase.recommendedAbilities)abilityValues.set(ability,(abilityValues.get(ability)??0)+1);
  const abilityUse=[...abilityValues.entries()].sort((a,b)=>a[1]-b[1]);

  return <div className="bosses-page">
    <PageHeader title="Bosses" subtitle="Edite fases, recomendações, arte e relações dos oito confrontos."/>
    <div className="master-detail">
      <aside className="master-list"><h3>Bosses cadastrados</h3>{visible.map(item=><button key={item.id} className={item.id===boss.id?'active':''} onClick={()=>{setSelectedId(item.id);setParams({entity:item.id})}}><Swords/><span><strong>{item.name}</strong><small>{project.worlds.find(w=>w.id===item.worldId)?.name} · {item.phases.length} fases</small></span><StatusBadge status={item.status}/></button>)}</aside>
      <main className="detail-pane">
        <div className="boss-hero">
          <div className="boss-art">{boss.conceptArt?<img src={mediaDisplayUrl(boss.conceptArt)} alt={boss.name}/>:<Swords/>}<label className="image-overlay"><input type="file" accept="image/*" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const saved=await persistMediaFile(file,`bosses/${boss.id}`);update(b=>{b.conceptArt=saved})}}/><ImagePlus/> {boss.conceptArt?'Trocar arte':'Adicionar arte conceitual'}</label></div>
          <Card><Field label="Nome"><input value={boss.name} onChange={e=>update(b=>{b.name=e.target.value})}/></Field><div className="form-grid"><Field label="Mundo"><select value={boss.worldId} onChange={e=>update(b=>{b.worldId=e.target.value})}>{project.worlds.map(w=><option value={w.id} key={w.id}>{w.name}</option>)}</select></Field><Field label="Área"><select value={boss.areaId} onChange={e=>update(b=>{b.areaId=e.target.value})}>{project.areas.filter(a=>a.worldId===boss.worldId&&a.type==='boss').map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></Field><Field label="Recompensa em Runas"><input type="number" min="0" value={boss.rewardRunes} onChange={e=>update(b=>{b.rewardRunes=Number(e.target.value)})}/></Field><Field label="Estado"><select value={boss.status} onChange={e=>update(b=>{b.status=e.target.value as BossDef['status']})}><option value="planejado">Planejado</option><option value="unity">Unity</option><option value="erro">Erro</option></select></Field></div>
          <div className="related-links"><span>Mundo: <Link to={`/world/${world?.id}`}>{world?.name}</Link></span><span>Área: <Link to={`/area/${area?.id}`}>{area?.name}</Link></span><span>Missão principal: <Link to={`/missions?entity=${mission?.id}`}>{mission?.name??'Não relacionada'}</Link></span><span className={boss.rewardRunes===5?'ok':'warning'}>{boss.rewardRunes===5?'✓ Recompensa confirmada: 5 Runas':'⚠ O GDD prevê 5 Runas'}</span></div>
          <Field label="Notas gerais"><textarea value={boss.notes} onChange={e=>update(b=>{b.notes=e.target.value})}/></Field><EntityTools entityRef={{type:'boss',id:boss.id}}/></Card>
        </div>

        <SectionTitle action={<button className="primary-button" onClick={()=>update(b=>b.phases.push({id:`fase-${crypto.randomUUID()}`,title:`Fase ${b.phases.length+1}`,description:'',recommendedAnimalIds:[],recommendedAbilities:[]}))}><Plus/> Adicionar fase</button>}>Fases do confronto</SectionTitle>
        <div className="boss-phase-list">{boss.phases.map((phase,index)=><Card key={phase.id} className="boss-phase-card"><div className="phase-head"><span className="phase-index">{index+1}</span><input value={phase.title} onChange={e=>update(b=>{b.phases[index].title=e.target.value})}/><button className="icon-button" disabled={index===0} onClick={()=>update(b=>{[b.phases[index-1],b.phases[index]]=[b.phases[index],b.phases[index-1]]})}><ArrowUp/></button><button className="icon-button" disabled={index===boss.phases.length-1} onClick={()=>update(b=>{[b.phases[index+1],b.phases[index]]=[b.phases[index],b.phases[index+1]]})}><ArrowDown/></button><button className="danger-icon" onClick={()=>update(b=>{b.phases.splice(index,1)})}><Trash2/></button></div>
          <Field label="O que acontece nesta fase"><textarea value={phase.description} onChange={e=>update(b=>{b.phases[index].description=e.target.value})}/></Field>
          <Field label="Animais recomendados"><div className="chips selectable">{project.animals.map(animal=><button key={animal.id} className={phase.recommendedAnimalIds.includes(animal.id)?'selected':''} onClick={()=>update(b=>{const list=b.phases[index].recommendedAnimalIds;b.phases[index].recommendedAnimalIds=list.includes(animal.id)?list.filter(id=>id!==animal.id):[...list,animal.id]})}>{animal.name}</button>)}</div></Field>
          <Field label="Habilidades recomendadas"><input value={phase.recommendedAbilities.join(', ')} onChange={e=>update(b=>{b.phases[index].recommendedAbilities=split(e.target.value)})}/></Field>
        </Card>)}</div>

        <div className="two-column"><Card><SectionTitle>Cobertura de animais locais</SectionTitle><div className="coverage-list">{animalUse.map(({animal,count})=><div key={animal.id} className={count===0?'underused':''}><span>{animal.name}</span><strong>{count} fase(s)</strong></div>)}</div></Card><Card><SectionTitle>Habilidades citadas</SectionTitle>{abilityUse.length?<div className="coverage-list">{abilityUse.map(([ability,count])=><div key={ability} className={count===1?'underused':''}><span>{ability}</span><strong>{count} uso(s)</strong></div>)}</div>:<p className="inline-warning">Nenhuma habilidade foi associada às fases.</p>}</Card></div>
      </main>
    </div>
  </div>;
}
function split(value:string){return value.split(',').map(x=>x.trim()).filter(Boolean)}
