import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { searchProject } from '../lib/search';
import { ENTITY_LABELS } from '../lib/entities';
import { useProjectStore } from '../store/useProjectStore';

export function CommandPalette({open,query,onQuery,onClose}:{open:boolean;query:string;onQuery:(value:string)=>void;onClose:()=>void}){
  const project=useProjectStore(s=>s.project);const navigate=useNavigate();const inputRef=useRef<HTMLInputElement>(null);const [active,setActive]=useState(0);
  const results=useMemo(()=>searchProject(project,query),[project,query]);
  useEffect(()=>{if(open){window.setTimeout(()=>inputRef.current?.focus(),0);setActive(0)}},[open]);
  useEffect(()=>{setActive(0)},[query]);
  if(!open)return null;
  const choose=(index:number)=>{const result=results[index];if(!result)return;navigate(result.route);onClose()};
  return <div className="command-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="command-palette" role="dialog" aria-modal="true"><div className="command-input"><Search/><input ref={inputRef} value={query} onChange={e=>onQuery(e.target.value)} placeholder="Buscar mundo, área, animal, tarefa, nota, ID…" onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setActive(v=>Math.min(results.length-1,v+1))}if(e.key==='ArrowUp'){e.preventDefault();setActive(v=>Math.max(0,v-1))}if(e.key==='Enter'){e.preventDefault();choose(active)}if(e.key==='Escape')onClose()}}/><kbd>Esc</kbd><button className="icon-button" onClick={onClose}><X/></button></div>
    <div className="command-results">{!query.trim()?<div className="command-empty"><strong>Busca universal</strong><p>Procura nomes, IDs, notas, tarefas, relações e conteúdo técnico do projeto.</p><span>Atalho: Ctrl + K</span></div>:results.length===0?<div className="command-empty"><strong>Nenhum resultado</strong><p>Tente outro nome, palavra da descrição ou ID interno.</p></div>:results.map((result,index)=><button key={`${result.ref.type}-${result.ref.parentId??''}-${result.ref.id}`} className={index===active?'active':''} onMouseEnter={()=>setActive(index)} onClick={()=>choose(index)}><span className="command-type">{ENTITY_LABELS[result.ref.type]}</span><div><strong>{result.title}</strong><small>{result.subtitle}</small><em>{result.matchedIn}</em></div>{result.status&&<span className={`status-dot ${result.status}`}/>}</button>)}</div>
    <div className="command-footer"><span>↑ ↓ navegar</span><span>Enter abrir</span><span>{results.length} resultado(s)</span></div>
  </div></div>;
}
