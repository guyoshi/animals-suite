import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, ExternalLink, Link2, Plus, Trash2, Unlink, X } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { canArchive, ENTITY_LABELS, getEntityInfo, listEntityInfos, refKey } from '../lib/entities';
import { otherRef, relationsFor } from '../lib/relations';
import type { EntityRef, EntityRelation, EntityType } from '../types';
import { Card, SectionTitle, WarningDot } from './Ui';
import { DuplicateDialog, type DuplicateOptions } from './DuplicateDialog';
import { duplicateEntity } from '../lib/duplicate';
import { ExecutorEntityBridge } from './executor/ExecutorEntityBridge';

export function EntityTools({ entityRef, showRelations = true, showTechnical = true, showDelete = true, onArchived, compact = false }: { entityRef: EntityRef; showRelations?: boolean; showTechnical?: boolean; showDelete?: boolean; onArchived?:()=>void; compact?:boolean }) {
  return <div className={`entity-tools ${compact?'compact':''}`}>
    {showRelations && <RelationsCard entityRef={entityRef}/>} 
    {showTechnical && <TechnicalDetails entityRef={entityRef}/>} 
    <ExecutorEntityBridge entityRef={entityRef} compact={compact}/>
    {['mission','npc','enemy','area','challenge','mechanic'].includes(entityRef.type) && <DuplicateEntityButton entityRef={entityRef}/>}
    {showDelete && canArchive(entityRef) && <SafeArchiveButton entityRef={entityRef} onArchived={onArchived}/>} 
  </div>;
}


function DuplicateEntityButton({entityRef}:{entityRef:EntityRef}) {
  const project=useProjectStore(s=>s.project);
  const mutate=useProjectStore(s=>s.mutate);
  const navigate=useNavigate();
  const [open,setOpen]=useState(false);
  const info=getEntityInfo(project,entityRef);
  if(!info)return null;
  const confirmDuplicate=(options:DuplicateOptions)=>{
    let created:EntityRef|undefined;
    mutate(d=>{created=duplicateEntity(d,entityRef,options)},true,`duplicate:${entityRef.type}:${entityRef.id}`);
    setOpen(false);
    if(created){const next=getEntityInfo(useProjectStore.getState().project,created);if(next)navigate(next.route)}
  };
  return <><button className="secondary-button duplicate-entity-button" onClick={()=>setOpen(true)}><Copy/> Duplicar</button>{open&&<DuplicateDialog title={info.title} allowTasks={entityRef.type==='mission'} onClose={()=>setOpen(false)} onConfirm={confirmDuplicate}/>}</>;
}

export function RelationsCard({ entityRef }: { entityRef: EntityRef }) {
  const project = useProjectStore(s=>s.project);
  const removeRelation = useProjectStore(s=>s.removeRelation);
  const navigate = useNavigate();
  const [adding,setAdding]=useState(false);
  const relations=relationsFor(project,entityRef);
  const info=getEntityInfo(project,entityRef);
  const centralRoute=`/relations/${entityRef.type}/${encodeURIComponent(entityRef.id)}${entityRef.parentId?`?parent=${encodeURIComponent(entityRef.parentId)}`:''}`;
  return <Card className="relations-card"><SectionTitle action={<div className="inline-actions"><button className="text-button" onClick={()=>setAdding(true)}><Plus size={15}/> Relacionar</button><button className="text-button" onClick={()=>navigate(centralRoute)}><Link2 size={15}/> Central</button></div>}>Relações <span className="count-pill">{relations.length}</span></SectionTitle>
    {relations.length===0?<p className="empty-inline"><WarningDot title="Elemento sem relações"/> Nenhuma relação encontrada.</p>:<div className="relation-list compact">{relations.slice(0,8).map(relation=><RelationRow key={relation.id} relation={relation} current={entityRef} onOpen={route=>navigate(route)} onRemove={()=>{if(window.confirm(`Remover a relação “${relation.kind}”?`))removeRelation(relation)}}/>)}{relations.length>8&&<button className="text-button relation-more" onClick={()=>navigate(centralRoute)}>Ver mais {relations.length-8}</button>}</div>}
    {adding&&info&&<AddRelationDialog source={entityRef} sourceTitle={info.title} onClose={()=>setAdding(false)}/>} 
  </Card>;
}

function RelationRow({relation,current,onOpen,onRemove}:{relation:EntityRelation;current:EntityRef;onOpen:(route:string)=>void;onRemove:()=>void}) {
  const project=useProjectStore(s=>s.project);
  const targetRef=otherRef(relation,current);
  const target=getEntityInfo(project,targetRef);
  return <div className={`relation-row ${target?.archived?'archived':''}`}>
    <button className="relation-open" disabled={!target} onClick={()=>target&&onOpen(target.route)}>
      <span className="relation-kind">{relation.kind}</span>
      <strong>{target?.title??`${ENTITY_LABELS[targetRef.type]} ausente (${targetRef.id})`}</strong>
      <small>{target?`${ENTITY_LABELS[target.ref.type]} · ${target.subtitle}`:'Referência quebrada'}</small>
    </button>
    <div className="relation-row-actions">{target&&<button className="icon-button" title="Abrir" onClick={()=>onOpen(target.route)}><ExternalLink size={15}/></button>}<button className="icon-button danger" title="Remover relação" onClick={onRemove}><Unlink size={15}/></button></div>
  </div>;
}

export function AddRelationDialog({source,sourceTitle,onClose}:{source:EntityRef;sourceTitle:string;onClose:()=>void}) {
  const project=useProjectStore(s=>s.project);
  const addRelation=useProjectStore(s=>s.addRelation);
  const [type,setType]=useState<EntityType>('area');
  const [targetKey,setTargetKey]=useState('');
  const [kind,setKind]=useState('Relacionado');
  const [notes,setNotes]=useState('');
  const [query,setQuery]=useState('');
  const options=listEntityInfos(project,false).filter(info=>info.ref.type===type&&refKey(info.ref)!==refKey(source)&&`${info.title} ${info.ref.id}`.toLowerCase().includes(query.toLowerCase())).slice(0,100);
  const selected=options.find(info=>refKey(info.ref)===targetKey)??listEntityInfos(project,false).find(info=>refKey(info.ref)===targetKey);
  const submit=()=>{if(!selected)return;addRelation(source,selected.ref,kind.trim()||'Relacionado',notes.trim());onClose()};
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal-card relation-dialog"><div className="modal-head"><div><strong>Adicionar relação</strong><small>{sourceTitle}</small></div><button className="icon-button" onClick={onClose}><X/></button></div>
    <div className="form-grid two"><label>Tipo de elemento<select value={type} onChange={e=>{setType(e.target.value as EntityType);setTargetKey('')}}>{(Object.keys(ENTITY_LABELS) as EntityType[]).filter(t=>t!=='task'&&t!=='mapObject').map(t=><option key={t} value={t}>{ENTITY_LABELS[t]}</option>)}</select></label><label>Pesquisar<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome ou ID"/></label></div>
    <label>Elemento<select size={Math.min(8,Math.max(3,options.length))} value={targetKey} onChange={e=>setTargetKey(e.target.value)}>{options.map(info=><option key={refKey(info.ref)} value={refKey(info.ref)}>{info.title} — {info.subtitle}</option>)}</select></label>
    <div className="form-grid two"><label>Tipo da relação<input value={kind} onChange={e=>setKind(e.target.value)} placeholder="Ex.: NPC que inicia"/></label><label>Observação<input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Opcional"/></label></div>
    <p className="muted">Relações conhecidas, como NPC ↔ missão, Rumor ↔ NPC e item ↔ comerciante, também atualizam os campos correspondentes nas duas fichas.</p>
    <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={!selected} onClick={submit}><Link2/> Criar relação</button></div>
  </div></div>;
}

export function TechnicalDetails({entityRef}:{entityRef:EntityRef}) {
  const project=useProjectStore(s=>s.project);
  const info=getEntityInfo(project,entityRef);
  const [copied,setCopied]=useState(false);
  if(!info)return null;
  return <details className="technical-details"><summary>Detalhes técnicos</summary><div className="technical-grid"><div><span>Tipo</span><strong>{ENTITY_LABELS[entityRef.type]}</strong></div>{info.technical.map(row=><div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div><button className="text-button" onClick={async()=>{await navigator.clipboard.writeText(entityRef.id);setCopied(true);window.setTimeout(()=>setCopied(false),1200)}}><Copy size={14}/> {copied?'ID copiado':'Copiar ID'}</button></details>;
}

export function SafeArchiveButton({entityRef,onArchived}:{entityRef:EntityRef;onArchived?:()=>void}) {
  const project=useProjectStore(s=>s.project);
  const archiveEntity=useProjectStore(s=>s.archiveEntity);
  const [open,setOpen]=useState(false);
  const info=getEntityInfo(project,entityRef);
  const relations=relationsFor(project,entityRef);
  if(!info||info.archived)return null;
  return <><button className="danger-button safe-archive-button" onClick={()=>setOpen(true)}><Trash2/> Mover para a Lixeira</button>{open&&<div className="modal-backdrop"><div className="modal-card"><div className="modal-head"><div><strong>Arquivar {info.title}?</strong><small>As relações serão preservadas para restauração.</small></div><button className="icon-button" onClick={()=>setOpen(false)}><X/></button></div>
    <div className="delete-relation-summary"><strong>{relations.length} relação(ões) encontradas</strong>{relations.length===0?<p>Nenhuma relação será afetada.</p>:<ul>{relations.slice(0,12).map(r=>{const other=getEntityInfo(project,otherRef(r,entityRef));return <li key={r.id}><span>{r.kind}</span><strong>{other?.title??'Referência ausente'}</strong></li>})}</ul>}{relations.length>12&&<small>Mais {relations.length-12} relações serão preservadas.</small>}</div>
    <p className="muted">O elemento deixa de aparecer nas listas normais, mas nenhuma ligação é apagada. Restaurar pela Lixeira devolve o elemento com as relações atuais e as relações manuais registradas.</p>
    <div className="modal-actions"><button className="secondary-button" onClick={()=>setOpen(false)}>Cancelar</button><button className="danger-button" onClick={()=>{if(archiveEntity(entityRef)){setOpen(false);onArchived?.()}}}><Trash2/> Arquivar</button></div>
  </div></div>}</>;
}
