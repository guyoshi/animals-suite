import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Gauge, PawPrint } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '../components/Ui';
import { buildAbilityCoverage, buildCategoryCoverage } from '../lib/planning';
import { useProjectStore } from '../store/useProjectStore';

export function CoveragePage(){
  const project=useProjectStore(s=>s.project);
  const [params]=useSearchParams();
  const [worldId,setWorldId]=useState('');
  const [state,setState]=useState('');
  const [query,setQuery]=useState('');
  const [limit,setLimit]=useState(60);
  const abilityRows=useMemo(()=>buildAbilityCoverage(project),[project]);
  const categoryRows=useMemo(()=>buildCategoryCoverage(project),[project]);
  const requestedAnimal=params.get('animal');
  const filtered=abilityRows.filter(row=>(!worldId||row.worldId===worldId)&&(!state||row.state===state)&&(!requestedAnimal||row.animalId===requestedAnimal)&&(!query||`${row.animalName} ${row.ability}`.toLowerCase().includes(query.toLowerCase())));
  const insufficient=abilityRows.filter(r=>r.state==='insuficiente').length,balanced=abilityRows.filter(r=>r.state==='equilibrada').length,excessive=abilityRows.filter(r=>r.state==='excessiva').length;
  return <div>
    <PageHeader title="Cobertura de habilidades" subtitle="Cruza animais, habilidades, categorias, áreas, Provações de Gaia e bosses para encontrar lacunas e excessos."/>
    <div className="stats-grid"><div className="stat-card static"><AlertTriangle/><div><strong>{insufficient}</strong><span>Subutilizadas</span></div></div><div className="stat-card static"><CheckCircle2/><div><strong>{balanced}</strong><span>Equilibradas</span></div></div><div className="stat-card static"><Gauge/><div><strong>{excessive}</strong><span>Usadas demais</span></div></div><div className="stat-card static"><PawPrint/><div><strong>{new Set(abilityRows.map(r=>r.animalId)).size}</strong><span>Animais analisados</span></div></div></div>
    <Card><div className="coverage-filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar animal ou habilidade"/><select value={worldId} onChange={e=>setWorldId(e.target.value)}><option value="">Todos os mundos</option>{project.worlds.filter(w=>w.id!=='w0').map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select><select value={state} onChange={e=>setState(e.target.value)}><option value="">Todos os estados</option><option value="insuficiente">Insuficiente</option><option value="equilibrada">Equilibrada</option><option value="excessiva">Excessiva</option></select></div></Card>
    <div className="coverage-grid">{filtered.slice(0,limit).map(row=>{const world=project.worlds.find(w=>w.id===row.worldId);const teaching=project.areas.find(a=>a.id===row.teachingAreaId);return <Card key={row.key} className={`coverage-card coverage-${row.state}`}><div className="coverage-head"><div><span className="eyebrow">{world?.name}</span><h2>{row.ability}</h2><p>{row.animalName}</p></div><div className="coverage-score"><strong>{row.score}</strong><span>/ 10</span></div></div><div className="coverage-track"><i style={{width:`${Math.min(100,row.score*10)}%`}}/></div><div className="coverage-slots"><CoverageSlot label="Ensino" value={teaching?.name} link={teaching?`/area/${teaching.id}?tab=level`:undefined}/><CoverageSlot label="Reforços" value={names(project,row.reinforcementAreaIds,'area')} count={row.reinforcementAreaIds.length}/><CoverageSlot label="Segredos" value={names(project,row.secretAreaIds,'area')} count={row.secretAreaIds.length}/><CoverageSlot label="Provações" value={names(project,row.challengeIds,'challenge')} count={row.challengeIds.length}/><CoverageSlot label="Bosses" value={names(project,row.bossIds,'boss')} count={row.bossIds.length}/></div>{row.notes.length>0&&<ul className="coverage-notes">{row.notes.map(note=><li key={note}><AlertTriangle/> {note}</li>)}</ul>}</Card>})}</div>
    {filtered.length>limit&&<div className="list-more"><span>Mostrando {limit} de {filtered.length}</span><button className="secondary-button" onClick={()=>setLimit(l=>l+60)}>Mostrar mais</button></div>}
    <Card><SectionTitle>Cobertura por categoria</SectionTitle><div className="category-coverage-table">{categoryRows.map(row=><div key={row.category}><strong>{row.category}</strong><div className="mini-progress"><i style={{width:`${Math.min(100,row.score*8)}%`}}/></div><span>{row.areaIds.length} áreas · {row.mechanicIds.length} mecânicas · {row.challengeIds.length} Provações · {row.bossIds.length} bosses</span></div>)}</div></Card>
  </div>;
}

function CoverageSlot({label,value,count,link}:{label:string;value?:string;count?:number;link?:string}){const content=<><strong>{label}</strong><span>{value||'Nenhum'}</span>{count!==undefined&&<small>{count}</small>}</>;return link?<Link to={link} className="coverage-slot">{content}</Link>:<div className="coverage-slot">{content}</div>}
function names(project:ReturnType<typeof useProjectStore.getState>['project'],ids:string[],kind:'area'|'challenge'|'boss'){const list=kind==='area'?project.areas:kind==='challenge'?project.challenges:project.bosses;return ids.slice(0,3).map(id=>list.find(row=>row.id===id)?.name).filter(Boolean).join(', ')+(ids.length>3?` +${ids.length-3}`:'')}
