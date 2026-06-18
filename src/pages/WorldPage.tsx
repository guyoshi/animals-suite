import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Crown, Gem, Home, Map, Music, Palette, PawPrint, ShieldOff, Target } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '../components/Ui';
import { ExecutorEntityBridge } from '../components/executor/ExecutorEntityBridge';
import { mediaDisplayUrl, persistMediaFile } from '../lib/storage';
import { useProjectStore } from '../store/useProjectStore';
import type { AnimalDef, EnemyDef } from '../types';

export function WorldPage(){
  const {worldId}=useParams();
  const project=useProjectStore(s=>s.project);
  const mutate=useProjectStore(s=>s.mutate);
  const [tab,setTab]=useState<'areas'|'animals'|'main'|'media'>('areas');
  const world=project.worlds.find(w=>w.id===worldId);
  const areas=useMemo(()=>project.areas.filter(a=>a.worldId===worldId),[project.areas,worldId]);
  if(!world)return <div>Mundo não encontrado.</div>;
  const boss=project.bosses.find(b=>b.id===world.bossId);
  const mainMission=project.missions.find(m=>m.worldId===world.id&&m.type==='principal');
  return <div style={{'--world':world.theme.primary} as React.CSSProperties}>
    <PageHeader title={world.name} subtitle={world.lesson} actions={<><Link className="secondary-button" to={`/world/${world.id}/visual`}><Palette/> Editor visual</Link>{world.villageId&&<Link className="secondary-button" to={`/village/${world.villageId}`}><Home/> Editar vila</Link>}{boss&&<Link className="secondary-button" to={`/bosses?entity=${boss.id}`}><Crown/> Editar boss</Link>}<Link className="primary-button" to="/world-map"><Map/> Abrir na Terra de Gaia</Link></>}/>
    <div className="world-summary"><span><Home/> {project.areas.find(a=>a.id===world.villageId)?.name??'Santuário'}</span><span><Crown/> {boss?.name??'—'}</span><span><Gem/> {areas.reduce((s,a)=>s+a.runeTarget,0)} Runas</span><span><PawPrint/> {project.animals.filter(a=>a.worldId===world.id).length} animais</span></div>
    <div className="tabs"><button className={tab==='areas'?'active':''} onClick={()=>setTab('areas')}>Áreas</button><button className={tab==='animals'?'active':''} onClick={()=>setTab('animals')}>Animais e habilidades</button><button className={tab==='main'?'active':''} onClick={()=>setTab('main')}>Missão principal</button><button className={tab==='media'?'active':''} onClick={()=>setTab('media')}>Música e imagens</button></div>
    {tab==='areas'&&<div className="area-list">{areas.sort((a,b)=>areaOrder(a.type)-areaOrder(b.type)||a.accessCost-b.accessCost).map(a=><Link key={a.id} className={`area-row area-${a.type}`} to={`/area/${a.id}`}><div><strong>{a.name}</strong><small>{a.description}</small></div><div className="area-row-meta"><span>{a.type}</span><span>{a.accessCost?`${a.accessCost} Runas acesso`:'sem custo'}</span><span>{a.runeTarget} Runas</span>{(a.animalUnlockIds?.length?a.animalUnlockIds:a.animalUnlockId?[a.animalUnlockId]:[]).map(id=><span key={id}>{project.animals.find(x=>x.id===id)?.name}</span>)}</div></Link>)}</div>}
    {tab==='animals'&&<div className="animal-grid">{project.animals.filter(a=>a.worldId===world.id).map(a=><AnimalCard key={a.id} animal={a} enemies={project.enemies.filter(e=>!e.archived)}/>)}</div>}
    {tab==='main'&&<Card><SectionTitle>{mainMission?.name??'Missão principal'}</SectionTitle><p>{mainMission?.description}</p><Link className="primary-button" to="/missions">Editar missão</Link></Card>}
    <ExecutorEntityBridge entityRef={{type:'world',id:world.id}}/>
    {tab==='media'&&<Card><SectionTitle>Imagens do mundo</SectionTitle><label className="upload-zone"><input type="file" accept="image/*" multiple onChange={async e=>{const files=[...(e.target.files??[])];for(const f of files){const saved=await persistMediaFile(f,`worlds/${world.id}`);mutate(d=>{d.worlds.find(x=>x.id===world.id)?.backgroundImages.push(saved);});}}}/><span>Adicionar referências, desenhos de rios, montanhas, desertos ou composição do mundo. Os arquivos são copiados para a pasta do projeto.</span></label><div className="gallery-grid">{world.backgroundImages.map((src,i)=><img key={i} src={mediaDisplayUrl(src)} alt={`Referência ${i+1} de ${world.name}`}/>)}</div><SectionTitle action={<Music size={18}/>}>Músicas relacionadas</SectionTitle><div className="simple-list">{project.music.filter(m=>m.worldId===world.id).map(m=><div key={m.id}><strong>{m.title}</strong><span>{m.role}</span></div>)}</div></Card>}
  </div>
}

function AnimalCard({animal,enemies}:{animal:AnimalDef;enemies:EnemyDef[]}){
  const vulnerable=animal.canAttack?enemies.filter(e=>matchesAny(animal.attackTags,e.weaknesses)):[];
  const unaffected=animal.canAttack?enemies.filter(e=>matchesAny(animal.attackTags,e.immunities)):[];
  const normal=animal.canAttack?enemies.filter(e=>e.weaknesses.length===0&&e.immunities.length===0):[];
  return <Card>
    <SectionTitle>{animal.name}</SectionTitle>
    <div className="chips">{animal.categories.map(c=><span key={c}>{c}</span>)}</div>
    <p><strong>Principal:</strong> {animal.primaryAbility??animal.abilities[0]}</p><ul>{(animal.contextualInteractions??animal.abilities.slice(1)).map(x=><li key={x}>{x}</li>)}</ul>
    <p className="muted"><strong>Uso em puzzles:</strong> {animal.puzzleUses.join(', ')}</p>
    {animal.canAttack&&<>
      <p><strong>Ataques:</strong> {animal.attackTags.join(', ')||'Ataque comum'}</p>
      <div className="animal-enemy-relations">
        <RelationGroup icon={<Target/>} title="Especialmente eficaz contra" items={vulnerable}/>
        <RelationGroup icon={<ShieldOff/>} title="Não afeta" items={unaffected}/>
        <RelationGroup icon={<PawPrint/>} title="Pode ferir normalmente" items={normal}/>
      </div>
    </>}
  </Card>
}

function RelationGroup({icon,title,items}:{icon:React.ReactNode;title:string;items:EnemyDef[]}){
  return <div className="animal-enemy-group"><strong>{icon}{title}</strong>{items.length?<div className="mini-chip-list">{items.map(e=><span key={e.id}>{e.icon} {e.name}</span>)}</div>:<small>Nenhum inimigo relacionado.</small>}</div>
}

function matchesAny(attacks:string[],values:string[]){
  return attacks.some(a=>values.some(v=>normal(a).includes(normal(v))||normal(v).includes(normal(a))));
}
function normal(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function areaOrder(type:string){return type==='hub'?0:type==='vila'?1:type==='fase'?2:type==='boss'?3:4}
