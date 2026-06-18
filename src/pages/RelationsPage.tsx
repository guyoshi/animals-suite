import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ExternalLink, Plus, Unlink } from 'lucide-react';
import { PageHeader, Card, EmptyState } from '../components/Ui';
import { AddRelationDialog, TechnicalDetails } from '../components/EntityTools';
import { useProjectStore } from '../store/useProjectStore';
import { ENTITY_LABELS, getEntityInfo } from '../lib/entities';
import { otherRef, relationsFor } from '../lib/relations';
import type { EntityRef, EntityType } from '../types';

export function RelationsPage(){
  const {entityType,entityId}=useParams();const [params]=useSearchParams();const navigate=useNavigate();
  const project=useProjectStore(s=>s.project);const removeRelation=useProjectStore(s=>s.removeRelation);
  const [adding,setAdding]=useState(false);
  const ref:EntityRef={type:(entityType??'area') as EntityType,id:entityId??'',parentId:params.get('parent')??undefined};
  const info=getEntityInfo(project,ref);const relations=relationsFor(project,ref);
  if(!info)return <EmptyState title="Elemento não encontrado" text="A referência pode ter sido removida permanentemente."/>;
  const grouped=relations.reduce<Record<string,typeof relations>>((acc,r)=>{(acc[r.kind]??=[]).push(r);return acc},{});
  return <div><PageHeader title={`Relações de ${info.title}`} subtitle={`${ENTITY_LABELS[ref.type]} · ${relations.length} relação(ões) encontradas`} actions={<><button className="secondary-button" onClick={()=>navigate(info.route)}><ExternalLink/> Abrir ficha</button><button className="primary-button" onClick={()=>setAdding(true)}><Plus/> Adicionar relação</button></>}/>
    <div className="relation-hub-summary"><Card><strong>{relations.length}</strong><span>Relações totais</span></Card><Card><strong>{relations.filter(r=>r.manual).length}</strong><span>Relações manuais</span></Card><Card><strong>{relations.filter(r=>r.missing).length}</strong><span>Referências quebradas</span></Card><Card><strong>{Object.keys(grouped).length}</strong><span>Tipos de relação</span></Card></div>
    {relations.length===0?<EmptyState title="Sem relações" text="Use Adicionar relação para ligar este elemento a outra parte do projeto."/>:<div className="relation-hub-groups">{Object.entries(grouped).map(([kind,rows])=><Card key={kind}><h3>{kind} <span className="count-pill">{rows.length}</span></h3><div className="relation-list">{rows.map(r=>{const targetRef=otherRef(r,ref);const target=getEntityInfo(project,targetRef);return <div className={`relation-row ${target?.archived?'archived':''}`} key={r.id}><button className="relation-open" disabled={!target} onClick={()=>target&&navigate(target.route)}><strong>{target?.title??targetRef.id}</strong><small>{target?`${ENTITY_LABELS[target.ref.type]} · ${target.subtitle}`:'Referência quebrada'}</small>{r.notes&&<p>{r.notes}</p>}</button><div className="relation-row-actions">{target&&<button className="icon-button" onClick={()=>navigate(target.route)}><ExternalLink/></button>}<button className="icon-button danger" title="Desvincular" onClick={()=>{if(confirm(`Remover a relação “${r.kind}”?`))removeRelation(r)}}><Unlink/></button></div></div>})}</div></Card>)}</div>}
    <TechnicalDetails entityRef={ref}/>
    {adding&&<AddRelationDialog source={ref} sourceTitle={info.title} onClose={()=>setAdding(false)}/>} 
  </div>
}
