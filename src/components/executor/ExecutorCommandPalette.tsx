import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, Braces, ClipboardCheck, FlaskConical, Link2, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadBuildMissions, loadGuideIndex, loadScriptCatalog } from '../../lib/executorContent';
import { listEntityInfos, refKey } from '../../lib/entities';
import { EXECUTOR_TEST_RECIPES } from '../../data/executorTests';
import { useProjectStore } from '../../store/useProjectStore';
import { useExecutorStore } from '../../store/useExecutorStore';

type ResultKind='mission'|'task'|'step'|'guide'|'script'|'entity'|'issue'|'test';
interface PaletteResult{kind:ResultKind;title:string;subtitle:string;route:string;search:string;score:number}

export function ExecutorCommandPalette({open,onClose}:{open:boolean;onClose:()=>void}){
  const navigate=useNavigate();
  const inputRef=useRef<HTMLInputElement>(null);
  const [term,setTerm]=useState('');
  const [selected,setSelected]=useState(0);
  const {data:missions}=useAsyncContent(loadBuildMissions,[]);
  const {data:guides}=useAsyncContent(loadGuideIndex,[]);
  const {data:scripts}=useAsyncContent(loadScriptCatalog,[]);
  const project=useProjectStore(state=>state.project);
  const executor=useExecutorStore(state=>state.executor);

  const index=useMemo(()=>{
    const results:PaletteResult[]=[];
    for(const mission of missions||[]){
      results.push({kind:'mission',title:`Missão ${mission.number} — ${mission.title}`,subtitle:mission.phase,route:`/executor/roadmap/${mission.id}`,search:`${mission.number} ${mission.title} ${mission.summary} ${mission.phase} ${mission.scripts.join(' ')}`,score:0});
      for(const task of mission.tasks){
        results.push({kind:'task',title:`Tarefa ${task.code} — ${task.title}`,subtitle:`Missão ${mission.number} · ${mission.title}`,route:`/executor/roadmap/${mission.id}?task=${task.index}&step=0`,search:`${task.code} ${task.title} ${task.purpose} ${task.scripts.join(' ')}`,score:0});
        for(const step of task.steps){
          results.push({kind:'step',title:`Step ${step.index+1} — ${step.title}`,subtitle:`Missão ${mission.number} · Tarefa ${task.code}`,route:`/executor/roadmap/${mission.id}?task=${task.index}&step=${step.index}`,search:`${step.title} ${step.actions.join(' ')} ${step.expected} ${step.trouble}`,score:0});
        }
      }
    }
    for(const guide of guides||[])results.push({kind:'guide',title:guide.title,subtitle:`${guide.category} · ${guide.source}`,route:`/executor/guides/${guide.slug}`,search:`${guide.title} ${guide.category} ${guide.source} ${guide.summary} ${guide.searchText}`,score:0});
    for(const script of scripts?.files||[])results.push({kind:'script',title:script.filename,subtitle:`${script.category} · ${script.kind}`,route:`/executor/scripts/${script.id}`,search:`${script.filename} ${script.primary} ${script.path} ${script.summary} ${script.dependencies.join(' ')} ${script.fieldNames.join(' ')} ${script.methodNames.join(' ')}`,score:0});
    for(const entity of listEntityInfos(project,false)){const ref=entity.ref;results.push({kind:'entity',title:entity.title,subtitle:`${ref.type} · ${entity.subtitle}`,route:`/executor/entity/${ref.type}/${encodeURIComponent(ref.id)}${ref.parentId?`?parent=${encodeURIComponent(ref.parentId)}`:''}`,search:`${entity.title} ${entity.subtitle} ${refKey(ref)} ${entity.keywords.join(' ')}`,score:0});}
    for(const issue of executor.issues)results.push({kind:'issue',title:issue.title,subtitle:`${issue.severity} · ${issue.status}`,route:`/executor/issues?issue=${issue.id}`,search:`${issue.title} ${issue.description??''} ${issue.affects.join(' ')} ${issue.workaround??''}`,score:0});
    for(const test of EXECUTOR_TEST_RECIPES)results.push({kind:'test',title:test.title,subtitle:test.category,route:`/executor/tests?q=${encodeURIComponent(test.title)}`,search:`${test.title} ${test.description} ${test.category} ${test.scriptNames.join(' ')}`,score:0});
    return results;
  },[executor.issues,guides,missions,project,scripts]);

  const results=useMemo(()=>{
    const query=normalise(term);
    if(!query)return index.filter(item=>item.kind==='mission'||item.kind==='guide').slice(0,20);
    return index.map(item=>({...item,score:score(normalise(item.search),query)})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'pt-BR')).slice(0,40);
  },[index,term]);

  useEffect(()=>{if(open){setTerm('');setSelected(0);window.setTimeout(()=>inputRef.current?.focus(),0)}},[open]);
  useEffect(()=>setSelected(0),[term]);
  useEffect(()=>{
    if(!open)return;
    const handler=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onClose();}
      if(event.key==='ArrowDown'){event.preventDefault();setSelected(value=>Math.min(results.length-1,value+1));}
      if(event.key==='ArrowUp'){event.preventDefault();setSelected(value=>Math.max(0,value-1));}
      if(event.key==='Enter'&&results[selected]){event.preventDefault();navigate(results[selected].route);onClose();}
    };
    window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
  },[navigate,onClose,open,results,selected]);

  if(!open)return null;
  return <div className="executor-palette-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className="executor-palette" role="dialog" aria-modal="true" aria-label="Pesquisa global">
    <header><Search/><input ref={inputRef} value={term} onChange={event=>setTerm(event.target.value)} placeholder="Buscar entidades, missões, guias, scripts, testes ou problemas…"/><kbd>Ctrl K</kbd><button onClick={onClose}><X/></button></header>
    <div className="executor-palette-results">{results.map((result,indexValue)=><button key={`${result.kind}-${result.route}-${indexValue}`} className={selected===indexValue?'active':''} onMouseEnter={()=>setSelected(indexValue)} onClick={()=>{navigate(result.route);onClose()}}><ResultIcon kind={result.kind}/><div><strong>{result.title}</strong><span>{result.subtitle}</span></div><em>{label(result.kind)}</em></button>)}{results.length===0&&<p>Nenhum resultado encontrado.</p>}</div>
    <footer><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></footer>
  </section></div>;
}

function ResultIcon({kind}:{kind:ResultKind}){if(kind==='guide')return<BookOpen/>;if(kind==='script')return<Braces/>;if(kind==='entity')return<Link2/>;if(kind==='issue')return<AlertTriangle/>;if(kind==='test')return<FlaskConical/>;return<ClipboardCheck/>}
function label(kind:ResultKind){return kind==='mission'?'Missão':kind==='task'?'Tarefa':kind==='step'?'Step':kind==='guide'?'Guia':kind==='script'?'Script':kind==='entity'?'Entidade':kind==='issue'?'Problema':'Teste'}
function normalise(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ').trim()}
function score(haystack:string,query:string){
  if(!query)return 1;
  if(haystack===query)return 1000;
  const position=haystack.indexOf(query);
  if(position>=0)return 800-Math.min(position,300);
  const tokens=query.split(' ').filter(Boolean);
  let value=0;
  for(const token of tokens){const direct=haystack.indexOf(token);if(direct>=0){value+=120-Math.min(direct,80);continue}let cursor=0;for(const char of haystack){if(char===token[cursor])cursor+=1;if(cursor===token.length)break}if(cursor===token.length)value+=25;else return 0;}
  return value;
}
