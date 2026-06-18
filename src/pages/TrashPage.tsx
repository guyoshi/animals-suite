import { useState } from 'react';
import { AlertTriangle, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { Card, EmptyState, PageHeader } from '../components/Ui';
import { useProjectStore } from '../store/useProjectStore';
import { ENTITY_LABELS, getEntityInfo } from '../lib/entities';
import type { EntityRef } from '../types';

export function TrashPage(){
  const project=useProjectStore(s=>s.project);const restoreTrash=useProjectStore(s=>s.restoreTrash);const purgeTrash=useProjectStore(s=>s.purgeTrash);
  const [inspect,setInspect]=useState<number|undefined>();
  return <div><PageHeader title="Lixeira" subtitle="Arquivar não rompe relações. Restaurar devolve o elemento; excluir definitivamente limpa as referências após confirmação."/>
    {project.trash.length===0?<EmptyState title="Lixeira vazia" text="Nada foi arquivado."/>:<div className="trash-grid">{project.trash.map((row,i)=>{const ref:EntityRef={type:row.entityType,id:row.entityId,parentId:row.parentId};const info=getEntityInfo(project,ref);return <Card key={`${row.entityType}-${row.parentId??''}-${row.entityId}-${row.deletedAt}`}><div className="trash-title"><span>{ENTITY_LABELS[row.entityType]}</span><strong>{row.displayName||info?.title||row.entityId}</strong></div><small>{new Date(row.deletedAt).toLocaleString('pt-BR')} · {row.relationSnapshot?.length??0} relação(ões) preservadas</small><div className="card-actions"><button className="text-button" onClick={()=>setInspect(inspect===i?undefined:i)}><Eye/> {inspect===i?'Ocultar':'Ver relações'}</button><button className="secondary-button" onClick={()=>restoreTrash(i)}><RotateCcw/> Restaurar</button><button className="danger-button" onClick={()=>{const count=row.relationSnapshot?.length??0;if(confirm(`Excluir “${row.displayName}” definitivamente? ${count} relação(ões) serão limpas. Esta ação não pode ser desfeita.`))purgeTrash(i)}}><Trash2/> Excluir definitivamente</button></div>{inspect===i&&<div className="trash-relations"><strong>Relações registradas no momento da exclusão</strong>{(row.relationSnapshot??[]).length===0?<p>Nenhuma relação.</p>:<ul>{row.relationSnapshot.map(relation=>{const other=relation.from.id===row.entityId?relation.to:relation.from;const target=getEntityInfo(project,other);return <li key={relation.id}><span>{relation.kind}</span><strong>{target?.title??other.id}</strong></li>})}</ul>}<p className="muted"><AlertTriangle/> Relações criadas depois do arquivamento também serão detectadas antes da exclusão definitiva.</p></div>}</Card>})}</div>}
  </div>;
}
