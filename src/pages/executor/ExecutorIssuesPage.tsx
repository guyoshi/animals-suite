import { AlertOctagon, CheckCircle2, Filter, Plus, Search, Trash2, TriangleAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, EmptyState, Field, PageHeader, SectionTitle } from '../../components/Ui';
import { getEntityInfo, refKey } from '../../lib/entities';
import { useExecutorStore } from '../../store/useExecutorStore';
import { useProjectStore } from '../../store/useProjectStore';
import type { EntityRef } from '../../types';
import type { ExecutorIssue } from '../../types/executor';

const severityLabels={baixa:'Baixa',media:'Média',alta:'Alta',critica:'Crítica'} as const;
const statusLabels={aberto:'Aberto',investigando:'Investigando',resolvido:'Resolvido',adiado:'Adiado'} as const;

export function ExecutorIssuesPage(){
  const executor=useExecutorStore(state=>state.executor);
  const [params,setParams]=useSearchParams();
  const [term,setTerm]=useState('');
  const [severity,setSeverity]=useState('');
  const [status,setStatus]=useState('');
  const [creating,setCreating]=useState(Boolean(params.get('entity')));
  const selectedId=params.get('issue');
  const selected=executor.issues.find(item=>item.id===selectedId);
  const entityRef=parseEntityKey(params.get('entity'));
  const filtered=useMemo(()=>{const q=term.trim().toLocaleLowerCase('pt-BR');return executor.issues.filter(issue=>(!q||`${issue.title} ${issue.description??''} ${issue.affects.join(' ')} ${issue.workaround??''}`.toLocaleLowerCase('pt-BR').includes(q))&&(!severity||issue.severity===severity)&&(!status||issue.status===status));},[executor.issues,severity,status,term]);
  const open=executor.issues.filter(item=>item.status!=='resolvido').length;
  const critical=executor.issues.filter(item=>item.status!=='resolvido'&&(item.severity==='critica'||item.severity==='alta')).length;
  const closeCreate=()=>{setCreating(false);setParams(current=>{current.delete('entity');return current});};
  return <div>
    <PageHeader title="Problemas e Limitações" subtitle="Bugs, riscos, bloqueios e soluções temporárias ligados às entidades e missões do projeto." actions={<button className="primary-button" onClick={()=>setCreating(true)}><Plus/>Novo problema</button>}/>
    <section className="executor-issue-stats"><div><TriangleAlert/><strong>{open}</strong><span>abertos</span></div><div><AlertOctagon/><strong>{critical}</strong><span>alta ou crítica</span></div><div><CheckCircle2/><strong>{executor.issues.filter(item=>item.status==='resolvido').length}</strong><span>resolvidos</span></div></section>
    <div className="executor-toolbar"><label><Search/><input value={term} onChange={event=>setTerm(event.target.value)} placeholder="Buscar problema, sistema ou solução…"/></label><label><Filter/><select value={severity} onChange={event=>setSeverity(event.target.value)}><option value="">Todas as severidades</option>{Object.entries(severityLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><select value={status} onChange={event=>setStatus(event.target.value)}><option value="">Todos os estados</option>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
    <div className="executor-issues-layout"><div className="executor-issues-list">{filtered.map(issue=><button key={issue.id} className={`${selectedId===issue.id?'active':''} severity-${issue.severity}`} onClick={()=>setParams(current=>{current.set('issue',issue.id);return current})}><div><span>{severityLabels[issue.severity]}</span><em>{statusLabels[issue.status]}</em></div><strong>{issue.title}</strong><small>{issue.affects.join(' · ')||'Sem área informada'}</small></button>)}{filtered.length===0&&<EmptyState title="Nenhum problema encontrado" text="Altere os filtros ou registre um novo problema."/>}</div><div className="executor-issue-detail">{selected?<IssueEditor issue={selected} onClose={()=>setParams(current=>{current.delete('issue');return current})}/>:<Card><SectionTitle>Selecione um problema</SectionTitle><p className="muted">Abra um item da lista para editar descrição, estado, severidade, solução temporária e relações.</p></Card>}</div></div>
    {creating&&<CreateIssueDialog initialEntity={entityRef} onClose={closeCreate} onCreated={id=>setParams(current=>{current.set('issue',id);current.delete('entity');return current})}/>} 
  </div>;
}

function IssueEditor({issue,onClose}:{issue:ExecutorIssue;onClose:()=>void}){
  const mutate=useExecutorStore(state=>state.mutate);
  const project=useProjectStore(state=>state.project);
  const update=(patch:Partial<ExecutorIssue>)=>mutate(draft=>{const target=draft.issues.find(item=>item.id===issue.id);if(target)Object.assign(target,patch,{updatedAt:new Date().toISOString(),...(patch.status==='resolvido'?{resolvedAt:new Date().toISOString()}:{})})});
  return <Card className="executor-issue-editor"><div className="modal-head"><div><span className={`severity-pill severity-${issue.severity}`}>{severityLabels[issue.severity]}</span><strong>{issue.title}</strong></div><button className="icon-button" onClick={onClose}><X/></button></div><div className="form-grid"><Field label="Título"><input value={issue.title} onChange={event=>update({title:event.target.value})}/></Field><Field label="Estado"><select value={issue.status} onChange={event=>update({status:event.target.value as ExecutorIssue['status']})}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field><Field label="Severidade"><select value={issue.severity} onChange={event=>update({severity:event.target.value as ExecutorIssue['severity']})}>{Object.entries(severityLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field></div><Field label="Descrição"><textarea value={issue.description??''} onChange={event=>update({description:event.target.value})}/></Field><Field label="Afeta"><input value={issue.affects.join(', ')} onChange={event=>update({affects:split(event.target.value)})} placeholder="Save, Player, Jukebox…"/></Field><Field label="Solução temporária"><textarea value={issue.workaround??''} onChange={event=>update({workaround:event.target.value})}/></Field><Field label="IDs relacionados"><input value={issue.relatedIds.join(', ')} onChange={event=>update({relatedIds:split(event.target.value)})} placeholder="build-mission-012, script-…"/></Field>{issue.relatedEntities&&issue.relatedEntities.length>0&&<div className="executor-related-entities"><strong>Entidades ligadas</strong>{issue.relatedEntities.map(ref=>{const info=getEntityInfo(project,ref);return info?<Link key={refKey(ref)} to={`/executor/entity/${ref.type}/${encodeURIComponent(ref.id)}${ref.parentId?`?parent=${encodeURIComponent(ref.parentId)}`:''}`}>{info.title}</Link>:<span key={refKey(ref)}>{refKey(ref)}</span>})}</div>}<div className="modal-actions"><button className="danger-button" onClick={()=>{if(confirm('Excluir este problema permanentemente?')){mutate(draft=>{draft.issues=draft.issues.filter(item=>item.id!==issue.id)});onClose();}}}><Trash2/>Excluir</button>{issue.status!=='resolvido'&&<button className="primary-button" onClick={()=>update({status:'resolvido'})}><CheckCircle2/>Marcar resolvido</button>}</div></Card>;
}

function CreateIssueDialog({initialEntity,onClose,onCreated}:{initialEntity?:EntityRef;onClose:()=>void;onCreated:(id:string)=>void}){
  const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [severityValue,setSeverityValue]=useState<ExecutorIssue['severity']>('media');const [affects,setAffects]=useState('');
  const project=useProjectStore(state=>state.project);const mutate=useExecutorStore(state=>state.mutate);const info=initialEntity?getEntityInfo(project,initialEntity):undefined;
  const submit=()=>{if(!title.trim())return;const now=new Date().toISOString();const issue:ExecutorIssue={id:`issue-${crypto.randomUUID()}`,title:title.trim(),description:description.trim(),severity:severityValue,status:'aberto',affects:split(affects),relatedIds:[],relatedEntities:initialEntity?[initialEntity]:[],source:'manual',createdAt:now,updatedAt:now};mutate(draft=>draft.issues.unshift(issue));onCreated(issue.id);onClose();};
  return <div className="modal-backdrop"><div className="modal-card"><div className="modal-head"><div><strong>Novo problema</strong><small>{info?`Relacionado a ${info.title}`:'Registro manual'}</small></div><button className="icon-button" onClick={onClose}><X/></button></div><Field label="Título"><input autoFocus value={title} onChange={event=>setTitle(event.target.value)} placeholder="O que precisa ser corrigido ou validado?"/></Field><Field label="Descrição"><textarea value={description} onChange={event=>setDescription(event.target.value)}/></Field><div className="form-grid"><Field label="Severidade"><select value={severityValue} onChange={event=>setSeverityValue(event.target.value as ExecutorIssue['severity'])}>{Object.entries(severityLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field><Field label="Afeta"><input value={affects} onChange={event=>setAffects(event.target.value)} placeholder="Player, Save, Área…"/></Field></div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={!title.trim()} onClick={submit}><Plus/>Criar problema</button></div></div></div>;
}

function split(value:string):string[]{return value.split(',').map(item=>item.trim()).filter(Boolean)}
function parseEntityKey(value:string|null):EntityRef|undefined{if(!value)return;const [type,parent,id]=value.split(':');if(!type||!id)return;return {type:type as EntityRef['type'],id,...(parent?{parentId:parent}:{})};}
