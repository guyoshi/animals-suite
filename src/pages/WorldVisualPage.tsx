import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Circle, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import { Download, Eye, EyeOff, ImagePlus, Layers3, Lock, MousePointer2, Pencil, RotateCcw, Type, Unlock } from 'lucide-react';
import { Card, Field, PageHeader, SectionTitle } from '../components/Ui';
import { GalleryManager } from '../components/GalleryManager';
import { mediaDisplayUrl, persistMediaFile } from '../lib/storage';
import { useProjectStore } from '../store/useProjectStore';
import { useUiStore } from '../store/useUiStore';
import type { MapBackgroundImage, WorldVisualPlan } from '../types';

const layerNames: Record<string,string>={images:'Imagens',drawings:'Desenhos',labels:'Legendas',grid:'Grelha'};
type Tool='select'|'hand'|'draw'|'text';

export function WorldVisualPage(){
  const {worldId}=useParams();
  const project=useProjectStore(s=>s.project);
  const mutate=useProjectStore(s=>s.mutate);
  const world=project.worlds.find(w=>w.id===worldId);
  const plan=project.worldVisuals.find(v=>v.worldId===worldId);
  const shellRef=useRef<HTMLDivElement|null>(null);
  const stageRef=useRef<Konva.Stage|null>(null);
  const [size,setSize]=useState({w:1000,h:680});
  const [tool,setTool]=useState<Tool>('select');
  const [selected,setSelected]=useState<{kind:'image'|'label';id:string}>();
  const [drawing,setDrawing]=useState(false);
  const [draftPoints,setDraftPoints]=useState<number[]>([]);
  const [fullscreen,setFullscreen]=useState(false);
  const setImmersive=useUiStore(s=>s.setImmersive);
  useEffect(()=>{setImmersive(fullscreen);return()=>setImmersive(false)},[fullscreen,setImmersive]);
  useEffect(()=>{if(!shellRef.current)return;const ob=new ResizeObserver(([e])=>setSize({w:Math.max(620,e.contentRect.width),h:Math.max(520,e.contentRect.height)}));ob.observe(shellRef.current);return()=>ob.disconnect()},[]);
  if(!world||!plan)return <div>Mundo não encontrado.</div>;
  const patch=(fn:(value:WorldVisualPlan)=>void)=>mutate(d=>{const target=d.worldVisuals.find(v=>v.worldId===world.id);if(target)fn(target)},false,`world-visual:${world.id}`);
  const addImages=async(files:FileList|null)=>{for(const file of [...(files??[])]){const saved=await persistMediaFile(file,`worlds/${world.id}/visual`);patch(v=>v.backgroundImages.push({id:crypto.randomUUID(),filePath:saved,x:80+v.backgroundImages.length*30,y:80+v.backgroundImages.length*30,width:520,height:330,opacity:.8,rotation:0,locked:false,name:file.name}))}};
  const pointer=()=>{const st=stageRef.current;const p=st?.getPointerPosition();if(!st||!p)return;return{x:(p.x-st.x())/st.scaleX(),y:(p.y-st.y())/st.scaleY()}};
  const exportPng=()=>{const uri=stageRef.current?.toDataURL({pixelRatio:2});if(!uri)return;const a=document.createElement('a');a.href=uri;a.download=`${world.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-visual.png`;a.click()};
  const start=(e:Konva.KonvaEventObject<MouseEvent|TouchEvent>)=>{if(e.target!==e.target.getStage())return;const p=pointer();if(!p)return;setSelected(undefined);if(tool==='draw'&&!plan.layers.drawings.locked){setDrawing(true);setDraftPoints([p.x,p.y])}else if(tool==='text'&&!plan.layers.labels.locked){const text=prompt('Legenda:')?.trim();if(text)patch(v=>v.labels.push({id:crypto.randomUUID(),x:p.x,y:p.y,text,color:'#ffffff',fontSize:22}))}};
  const move=()=>{if(!drawing||tool!=='draw')return;const p=pointer();if(p)setDraftPoints(points=>[...points,p.x,p.y])};
  const finish=()=>{if(!drawing)return;setDrawing(false);if(draftPoints.length>=4)patch(v=>v.drawings.push({id:crypto.randomUUID(),points:draftPoints,color:'#84d9a5',width:5}));setDraftPoints([])};
  const center=()=>{const st=stageRef.current;if(!st)return;st.position({x:0,y:0});st.scale({x:1,y:1});st.batchDraw()};
  return <div className={`world-visual-page ${fullscreen?'is-fullscreen':''}`}>
    {!fullscreen&&<PageHeader title={`Editor visual — ${world.name}`} subtitle="Componha rios, montanhas, florestas, desertos, oceanos, imagens e legendas em uma tela livre." actions={<><Link className="secondary-button" to={`/world/${world.id}`}>Voltar ao mundo</Link><button className="primary-button" onClick={()=>setFullscreen(true)}>Tela cheia</button></>}/>} 
    <div className="world-visual-layout">
      <aside className="world-visual-sidebar">
        <Card><SectionTitle>Ferramentas</SectionTitle><div className="tool-grid compact-tools">
          <button className={tool==='select'?'active':''} onClick={()=>setTool('select')}><MousePointer2/>Selecionar</button>
          <button className={tool==='hand'?'active':''} onClick={()=>setTool('hand')}><Layers3/>Mão</button>
          <button className={tool==='draw'?'active':''} onClick={()=>setTool('draw')}><Pencil/>Desenhar</button>
          <button className={tool==='text'?'active':''} onClick={()=>setTool('text')}><Type/>Legenda</button>
        </div><label className="secondary-button file-button full"><input type="file" accept="image/*" multiple onChange={e=>void addImages(e.target.files)}/><ImagePlus/> Adicionar imagens</label><button className="secondary-button full" onClick={center}><RotateCcw/> Centralizar</button><button className="secondary-button full" onClick={exportPng}><Download/> Exportar PNG</button>{fullscreen&&<button className="secondary-button full" onClick={()=>setFullscreen(false)}>Sair da tela cheia</button>}</Card>
        <Card><SectionTitle>Camadas</SectionTitle>{Object.entries(layerNames).map(([id,label])=>{const layer=plan.layers[id]??{visible:true,locked:false};return <div className="layer-row" key={id}><span>{label}</span><button className="icon-button" onClick={()=>patch(v=>{v.layers[id]??={visible:true,locked:false};v.layers[id].visible=!v.layers[id].visible})}>{layer.visible?<Eye/>:<EyeOff/>}</button><button className="icon-button" onClick={()=>patch(v=>{v.layers[id]??={visible:true,locked:false};v.layers[id].locked=!v.layers[id].locked})}>{layer.locked?<Lock/>:<Unlock/>}</button></div>})}</Card>
        <Card><SectionTitle>Elementos</SectionTitle><div className="visual-element-list">{plan.backgroundImages.map(img=><button key={img.id} className={selected?.id===img.id?'active':''} onClick={()=>setSelected({kind:'image',id:img.id})}><span>🖼️</span><div><strong>{img.name}</strong><small>{img.locked?'Bloqueada':'Movível'}</small></div></button>)}{plan.labels.map(label=><button key={label.id} className={selected?.id===label.id?'active':''} onClick={()=>setSelected({kind:'label',id:label.id})}><span>🏷️</span><div><strong>{label.text}</strong><small>Legenda</small></div></button>)}</div></Card>
      </aside>
      <main className="world-visual-main"><div className="world-visual-canvas" ref={shellRef}><Stage ref={stageRef} width={size.w} height={size.h} draggable={tool==='hand'} onMouseDown={start} onTouchStart={start} onMouseMove={move} onTouchMove={move} onMouseUp={finish} onTouchEnd={finish} onWheel={e=>{e.evt.preventDefault();const st=stageRef.current;if(!st)return;const old=st.scaleX();const pt=st.getPointerPosition();if(!pt)return;const mouse={x:(pt.x-st.x())/old,y:(pt.y-st.y())/old};const next=Math.max(.2,Math.min(4,e.evt.deltaY<0?old*1.1:old/1.1));st.scale({x:next,y:next});st.position({x:pt.x-mouse.x*next,y:pt.y-mouse.y*next})}}>
        <Layer listening={false}><Rect x={-6000} y={-6000} width={12000} height={12000} fill="#10181d"/>{plan.layers.grid?.visible&&<Grid width={size.w} height={size.h}/>}</Layer>
        <Layer visible={plan.layers.images?.visible!==false} listening={!plan.layers.images?.locked}>{plan.backgroundImages.map(img=><VisualImage key={img.id} image={img} selected={selected?.kind==='image'&&selected.id===img.id} onSelect={()=>setSelected({kind:'image',id:img.id})} onChange={next=>patch(v=>{const target=v.backgroundImages.find(x=>x.id===img.id);if(target)Object.assign(target,next)})}/>)}</Layer>
        <Layer visible={plan.layers.drawings?.visible!==false} listening={false}>{plan.drawings.map(line=><Line key={line.id} points={line.points} stroke={line.color} strokeWidth={line.width} lineCap="round" lineJoin="round"/>)}{draftPoints.length>1&&<Line points={draftPoints} stroke="#84d9a5" strokeWidth={5} lineCap="round" lineJoin="round"/>}</Layer>
        <Layer visible={plan.layers.labels?.visible!==false} listening={!plan.layers.labels?.locked}>{plan.labels.map(label=><Text key={label.id} text={label.text} x={label.x} y={label.y} fill={label.color} fontSize={label.fontSize} draggable={!label.locked} onClick={e=>{e.cancelBubble=true;setSelected({kind:'label',id:label.id})}} onDragEnd={e=>patch(v=>{const t=v.labels.find(x=>x.id===label.id);if(t){t.x=e.target.x();t.y=e.target.y()}})}/>)}</Layer>
      </Stage><div className="map-help">Use a ferramenta Mão ou botão do meio para navegar. Roda do mouse controla o zoom. Desenhos e imagens são independentes.</div></div>
      <Inspector plan={plan} selected={selected} patch={patch}/>
      </main>
    </div>
    {!fullscreen&&<><GalleryManager ownerType="world" ownerId={world.id}/><Card><SectionTitle>Notas do criador visual</SectionTitle><Field label="Notas"><textarea value={plan.notes} onChange={e=>patch(v=>{v.notes=e.target.value})}/></Field></Card></>}
  </div>;
}

function VisualImage({image,selected,onSelect,onChange}:{image:MapBackgroundImage;selected:boolean;onSelect:()=>void;onChange:(patch:Partial<MapBackgroundImage>)=>void}){
  const [loaded]=useImage(mediaDisplayUrl(image.filePath)??'','anonymous');
  const ref=useRef<Konva.Image|null>(null);const tr=useRef<Konva.Transformer|null>(null);
  useEffect(()=>{if(selected&&ref.current&&tr.current){tr.current.nodes([ref.current]);tr.current.getLayer()?.batchDraw()}else tr.current?.nodes([])},[selected]);
  return <><KonvaImage ref={ref} image={loaded} x={image.x} y={image.y} width={image.width} height={image.height} opacity={image.opacity} rotation={image.rotation} draggable={!image.locked} onClick={e=>{e.cancelBubble=true;onSelect()}} onTap={e=>{e.cancelBubble=true;onSelect()}} onDragEnd={e=>onChange({x:e.target.x(),y:e.target.y()})} onTransformEnd={e=>{const n=e.target;onChange({x:n.x(),y:n.y(),width:Math.max(40,n.width()*n.scaleX()),height:Math.max(40,n.height()*n.scaleY()),rotation:n.rotation()});n.scale({x:1,y:1})}}/>{selected&&<Transformer ref={tr} rotateEnabled enabledAnchors={['top-left','top-right','bottom-left','bottom-right']}/>}</>;
}

function Inspector({plan,selected,patch}:{plan:WorldVisualPlan;selected?:{kind:'image'|'label';id:string};patch:(fn:(v:WorldVisualPlan)=>void)=>void}){
  const image=selected?.kind==='image'?plan.backgroundImages.find(x=>x.id===selected.id):undefined;
  const label=selected?.kind==='label'?plan.labels.find(x=>x.id===selected.id):undefined;
  if(!image&&!label)return <Card className="visual-inspector"><SectionTitle>Inspector</SectionTitle><p className="muted">Selecione uma imagem ou legenda.</p></Card>;
  return <Card className="visual-inspector"><SectionTitle>Inspector</SectionTitle>{image&&<><Field label="Nome"><input value={image.name} onChange={e=>patch(v=>{const x=v.backgroundImages.find(i=>i.id===image.id);if(x)x.name=e.target.value})}/></Field><Field label={`Opacidade ${Math.round(image.opacity*100)}%`}><input type="range" min="0.05" max="1" step="0.05" value={image.opacity} onChange={e=>patch(v=>{const x=v.backgroundImages.find(i=>i.id===image.id);if(x)x.opacity=Number(e.target.value)})}/></Field><button className="secondary-button full" onClick={()=>patch(v=>{const x=v.backgroundImages.find(i=>i.id===image.id);if(x)x.locked=!x.locked})}>{image.locked?<Unlock/>:<Lock/>}{image.locked?'Desbloquear':'Bloquear'}</button><button className="danger-button full" onClick={()=>patch(v=>{v.backgroundImages=v.backgroundImages.filter(i=>i.id!==image.id)})}>Excluir imagem</button></>}{label&&<><Field label="Texto"><textarea value={label.text} onChange={e=>patch(v=>{const x=v.labels.find(i=>i.id===label.id);if(x)x.text=e.target.value})}/></Field><Field label="Tamanho"><input type="number" min="8" max="120" value={label.fontSize} onChange={e=>patch(v=>{const x=v.labels.find(i=>i.id===label.id);if(x)x.fontSize=Number(e.target.value)})}/></Field><Field label="Cor"><input type="color" value={label.color} onChange={e=>patch(v=>{const x=v.labels.find(i=>i.id===label.id);if(x)x.color=e.target.value})}/></Field><button className="danger-button full" onClick={()=>patch(v=>{v.labels=v.labels.filter(i=>i.id!==label.id)})}>Excluir legenda</button></>}</Card>;
}

function Grid({width,height}:{width:number;height:number}){const lines=useMemo(()=>{const out:React.ReactNode[]=[];for(let x=0;x<width;x+=40)out.push(<Line key={`x${x}`} points={[x,0,x,height]} stroke="rgba(255,255,255,.055)" strokeWidth={1}/>);for(let y=0;y<height;y+=40)out.push(<Line key={`y${y}`} points={[0,y,width,y]} stroke="rgba(255,255,255,.055)" strokeWidth={1}/>);return out},[width,height]);return <>{lines}<Circle x={0} y={0} radius={4} fill="rgba(255,255,255,.25)"/></>}
