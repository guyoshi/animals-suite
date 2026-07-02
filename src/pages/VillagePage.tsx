import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Text, Group, Circle, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { hasPlannerMusicAttachment } from '../lib/musicAttachments';
import type Konva from 'konva';
import { Home, ImagePlus, MapPin, Music, Store, UsersRound } from 'lucide-react';
import { Card, Field, PageHeader, SectionTitle } from '../components/Ui';
import { mediaDisplayUrl, persistMediaFile } from '../lib/storage';
import { useProjectStore } from '../store/useProjectStore';
import { useUiStore } from '../store/useUiStore';
import type { MapBackgroundImage, VillagePlan } from '../types';

const stateLabels={vazia:'Vazia',primeiros_resgates:'Primeiros Resgates',viva:'Viva',restaurada:'Restaurada',pos_boss:'Pós-boss'} as const;

export function VillagePage(){
  const {areaId}=useParams();
  const project=useProjectStore(s=>s.project);
  const mutate=useProjectStore(s=>s.mutate);
  const area=project.areas.find(a=>a.id===areaId&&a.type==='vila');
  const world=project.worlds.find(w=>w.id===area?.worldId);
  const plan=project.villages.find(v=>v.areaId===areaId);
  const shellRef=useRef<HTMLDivElement|null>(null);
  const stageRef=useRef<Konva.Stage|null>(null);
  const [size,setSize]=useState({w:900,h:620});
  const [selectedBg,setSelectedBg]=useState<string>();
  const [fullscreen,setFullscreen]=useState(false);
  const setImmersive=useUiStore(s=>s.setImmersive);
  useEffect(()=>{setImmersive(fullscreen);return()=>setImmersive(false)},[fullscreen,setImmersive]);
  useEffect(()=>{if(!shellRef.current)return;const ob=new ResizeObserver(([e])=>setSize({w:Math.max(600,e.contentRect.width),h:Math.max(500,e.contentRect.height)}));ob.observe(shellRef.current);return()=>ob.disconnect()},[]);
  if(!area||!world||!plan)return <div>Vila não encontrada.</div>;
  const villageNpcs=project.npcs.filter(n=>n.villageAreaId===area.id&&!n.archived);
  const placedIds=new Set(plan.npcPlacements.map(p=>p.npcId));
  const musicRoles=['vila_vazia','vila_viva','vila_pos_boss'] as const;
  const rescued=plan.rescuedPopulation??plan.currentPopulation??0;
  const additional=plan.additionalPopulation??0;
  const totalPopulation=rescued+additional;
  const plannedRequired=plan.plannedPopulation||villageNpcs.filter(n=>n.populationRole!=='adicional'&&n.populationRole!=='nenhum'&&n.countsForVillageRestoration!==false).length;
  const predictedState=predictVillageState(rescued,additional,plannedRequired,plan.firstRescueThreshold??2,plan.bossDefeated??false);
  const patch=(fn:(v:VillagePlan)=>void)=>mutate(d=>{const target=d.villages.find(v=>v.areaId===area.id);if(target)fn(target)},false,`village:${area.id}`);
  const addBg=async(file:File)=>{const saved=await persistMediaFile(file,`vilas/${area.id}/mapa`);patch(v=>v.backgroundImages.push({id:crypto.randomUUID(),filePath:saved,x:50,y:50,width:600,height:400,opacity:.7,rotation:0,locked:false,name:file.name}))};
  return <div className={`village-page ${fullscreen?'is-fullscreen':''}`}>
    {!fullscreen&&<PageHeader title={area.name} subtitle={`${world.name} · editor próprio da vila`} actions={<><Link className="secondary-button" to={`/area/${area.id}`}><Home/> Ficha da área</Link><button className="primary-button" onClick={()=>setFullscreen(true)}>Tela cheia do mapa</button></>}/>} 
    <div className="village-overview">
      <Card><SectionTitle><UsersRound/> População sincronizada</SectionTitle><div className="village-population"><strong>{totalPopulation}</strong><span> = {rescued} resgatados + {additional} adicionais</span></div><div className="form-grid three"><Field label="NPCs resgatados"><input type="number" min="0" max={plannedRequired||undefined} value={rescued} onChange={e=>patch(v=>{v.rescuedPopulation=Number(e.target.value);v.currentPopulation=(v.rescuedPopulation??0)+(v.additionalPopulation??0)})}/></Field><Field label="Habitantes adicionais"><input type="number" min="0" value={additional} onChange={e=>patch(v=>{v.additionalPopulation=Number(e.target.value);v.currentPopulation=(v.rescuedPopulation??0)+(v.additionalPopulation??0)})}/></Field><Field label="NPCs obrigatórios"><input type="number" min="0" value={plan.plannedPopulation} onChange={e=>patch(v=>{v.plannedPopulation=Number(e.target.value)})}/></Field></div><div className="form-grid two"><Field label="Limiar de primeiros resgates"><input type="number" min="1" value={plan.firstRescueThreshold??2} onChange={e=>patch(v=>{v.firstRescueThreshold=Number(e.target.value)})}/></Field><label className="check-row"><input type="checkbox" checked={plan.bossDefeated??false} onChange={e=>patch(v=>{v.bossDefeated=e.target.checked})}/> Boss regional derrotado</label></div><p className="info-callout">Nível previsto pelo código: <strong>{stateLabels[predictedState]}</strong>. Resgates usam rescuedCount; lojistas e visitantes usam additionalPopulation e não entram nos 100%.</p></Card>
      <Card><SectionTitle>Estado da vila</SectionTitle><select className="large-select" value={plan.state} onChange={e=>patch(v=>{v.state=e.target.value as VillagePlan['state']})}>{Object.entries(stateLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><button className="text-button" onClick={()=>patch(v=>{v.state=predictedState})}>Aplicar estado previsto: {stateLabels[predictedState]}</button><Field label="Evolução visual deste estado"><textarea value={plan.visualEvolution[plan.state]??''} onChange={e=>patch(v=>{v.visualEvolution[plan.state]=e.target.value})}/></Field></Card>
      <Card><SectionTitle>Contador e missões</SectionTitle><Field label="Contador de Histórias"><select value={plan.storyTellerNpcId??''} onChange={e=>patch(v=>{v.storyTellerNpcId=e.target.value||undefined})}><option value="">Não definido</option>{villageNpcs.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></Field><p>{project.missions.filter(m=>m.starterNpcId&&villageNpcs.some(n=>n.id===m.starterNpcId)&&!m.archived).length} missão(ões) iniciadas na vila.</p><Link className="text-button" to="/missions">Abrir missões</Link></Card>
    </div>
    <div className="two-column village-detail-columns"><Card><SectionTitle>NPCs da vila</SectionTitle><div className="village-npc-list">{villageNpcs.map(npc=><div key={npc.id}><div><strong>{npc.name}</strong><small>{npc.npcType} · {npc.rescueAreaId?`resgatado em ${project.areas.find(a=>a.id===npc.rescueAreaId)?.name}`:'sem área de resgate'}</small></div><span className={placedIds.has(npc.id)?'placed':'missing'}>{placedIds.has(npc.id)?'No mapa':'Fora do mapa'}</span><button className="icon-button" title="Colocar no centro" onClick={()=>patch(v=>{if(!v.npcPlacements.some(p=>p.npcId===npc.id))v.npcPlacements.push({npcId:npc.id,x:size.w/2,y:size.h/2})})}><MapPin/></button></div>)}</div></Card>
      <Card><SectionTitle><Store/> Comerciantes e lojas</SectionTitle>{villageNpcs.filter(n=>n.npcType==='comerciante'||n.shopItems.length>0).map(n=><div className="shop-summary" key={n.id}><strong>{n.name}</strong><span>{n.shopItems.length} item(ns)</span><ul>{n.shopItems.map(row=><li key={row.itemId}>{project.items.find(i=>i.id===row.itemId)?.name??row.itemId}{row.customPrice!==undefined?` — ${row.customPrice} Sementes`:''}</li>)}</ul></div>)}{!villageNpcs.some(n=>n.npcType==='comerciante'||n.shopItems.length>0)&&<p className="muted">Nenhum comerciante relacionado.</p>}</Card>
    </div>
    <Card><SectionTitle><Music/> Validação das três músicas</SectionTitle><div className="music-validation">{musicRoles.map(role=>{const track=project.music.find(m=>(m.areaIds?.includes(area.id)||m.areaId===area.id)&&m.role===role&&!m.archived);return <div key={role} className={hasPlannerMusicAttachment(track)?'ok':'warning'}><strong>{role==='vila_vazia'?'Vila Vazia':role==='vila_viva'?'Vila Viva/Restaurada':'Vila Pós-boss'}</strong><span>{track?.title??'Ficha ausente'}</span><small>{hasPlannerMusicAttachment(track)?'Áudio anexado ao Planejador':'Sem áudio anexado'}</small></div>})}</div><Link className="text-button" to="/music">Abrir biblioteca musical</Link></Card>

    <Card className="village-map-card"><SectionTitle action={<><label className="secondary-button file-button"><input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)void addBg(file)}}/><ImagePlus/> Adicionar fundo</label>{fullscreen&&<button className="secondary-button" onClick={()=>setFullscreen(false)}>Sair da tela cheia</button>}</>}>Mapa da vila</SectionTitle><div className="village-map-shell" ref={shellRef}><Stage ref={stageRef} width={size.w} height={size.h} draggable onWheel={e=>{e.evt.preventDefault();const st=stageRef.current;if(!st)return;const old=st.scaleX(),pt=st.getPointerPosition()!;const mouse={x:(pt.x-st.x())/old,y:(pt.y-st.y())/old};const next=Math.max(.25,Math.min(3,e.evt.deltaY<0?old*1.1:old/1.1));st.scale({x:next,y:next});st.position({x:pt.x-mouse.x*next,y:pt.y-mouse.y*next})}}>
      <Layer><Rect x={-3000} y={-3000} width={6000} height={6000} fill="#111a20"/>{plan.backgroundImages.map(bg=><VillageBackground key={bg.id} bg={bg} selected={selectedBg===bg.id} onSelect={()=>setSelectedBg(bg.id)} onChange={data=>patch(v=>{const target=v.backgroundImages.find(x=>x.id===bg.id);if(target)Object.assign(target,data)})}/>)}</Layer>
      <Layer>{plan.npcPlacements.map((placement,index)=>{const npc=project.npcs.find(n=>n.id===placement.npcId);if(!npc)return null;return <Group key={placement.npcId} x={placement.x} y={placement.y} draggable onDragEnd={e=>patch(v=>{v.npcPlacements[index].x=e.target.x();v.npcPlacements[index].y=e.target.y()})} onContextMenu={e=>{e.evt.preventDefault();patch(v=>{v.npcPlacements=v.npcPlacements.filter(p=>p.npcId!==placement.npcId)})}}><Circle radius={25} fill={world.theme.primary} stroke="#fff" strokeWidth={2}/><Text text="🐾" x={-13} y={-14} fontSize={24}/><Text text={npc.name} x={-70} y={32} width={140} align="center" fill="#fff" fontSize={13}/></Group>})}</Layer>
    </Stage><div className="map-help">Arraste os NPCs. Clique direito num NPC para removê-lo do mapa sem excluir a ficha. Roda do mouse aproxima e afasta.</div></div></Card>
    {!fullscreen&&<Card><SectionTitle>Notas da vila</SectionTitle><Field label="Notas gerais"><textarea value={plan.notes} onChange={e=>patch(v=>{v.notes=e.target.value})}/></Field></Card>}
  </div>;
}
function predictVillageState(rescued:number,additional:number,max:number,threshold:number,bossDefeated:boolean):VillagePlan['state']{
  if(rescued<=0)return 'vazia';
  const all=max>0&&rescued>=max;
  if(all&&bossDefeated)return 'pos_boss';
  if(all)return 'restaurada';
  if(max>0&&rescued/max>=.5&&additional>0)return 'viva';
  if(rescued>=Math.max(1,threshold))return 'primeiros_resgates';
  return 'vazia';
}
function VillageBackground({bg,selected,onSelect,onChange}:{bg:MapBackgroundImage;selected:boolean;onSelect:()=>void;onChange:(p:Partial<MapBackgroundImage>)=>void}){const [image]=useImage(mediaDisplayUrl(bg.filePath)??'','anonymous');const ref=useRef<Konva.Image|null>(null);const tr=useRef<Konva.Transformer|null>(null);useEffect(()=>{if(selected&&ref.current&&tr.current){tr.current.nodes([ref.current]);tr.current.getLayer()?.batchDraw()}else tr.current?.nodes([])},[selected]);return <><KonvaImage ref={ref} image={image} x={bg.x} y={bg.y} width={bg.width} height={bg.height} opacity={bg.opacity} rotation={bg.rotation} draggable={!bg.locked} onClick={e=>{e.cancelBubble=true;onSelect()}} onDragEnd={e=>onChange({x:e.target.x(),y:e.target.y()})} onTransformEnd={e=>{const n=e.target;onChange({x:n.x(),y:n.y(),width:Math.max(40,n.width()*n.scaleX()),height:Math.max(40,n.height()*n.scaleY()),rotation:n.rotation()});n.scale({x:1,y:1})}}/>{selected&&<Transformer ref={tr} rotateEnabled/>}</>}
