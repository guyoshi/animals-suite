import { useEffect, useMemo, useState } from 'react';
import { Braces, ChevronLeft, ChevronRight, FileCode2, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadScriptCatalog } from '../../lib/executorContent';

const PAGE_SIZE=30;

export function ExecutorScriptsPage(){
  const {data:catalog,error,loading}=useAsyncContent(loadScriptCatalog,[]);
  const [params,setParams]=useSearchParams();
  const [term,setTerm]=useState(params.get('q')||'');
  const [category,setCategory]=useState('');
  const [kind,setKind]=useState('');
  const [page,setPage]=useState(1);

  useEffect(()=>{const q=params.get('q')||'';setTerm(q)},[params]);
  const kinds=useMemo(()=>[...new Set((catalog?.files||[]).map(item=>item.kind))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR')),[catalog]);
  const filtered=useMemo(()=>{
    const query=normalise(term);
    return (catalog?.files||[]).filter(script=>{
      const haystack=normalise(`${script.filename} ${script.primary} ${script.path} ${script.category} ${script.kind} ${script.summary} ${script.dependencies.join(' ')} ${script.usedBy.join(' ')} ${script.fieldNames.join(' ')} ${script.methodNames.join(' ')}`);
      return(!query||fuzzyIncludes(haystack,query))&&(!category||script.category===category)&&(!kind||script.kind===kind);
    });
  },[catalog,category,kind,term]);
  useEffect(()=>setPage(1),[term,category,kind]);
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const visible=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  if(loading)return <div className="executor-loading">Carregando índice dos 278 scripts…</div>;
  if(error||!catalog)return <EmptyState title="Não foi possível abrir a biblioteca" text={error||'Catálogo ausente.'}/>;

  return <div>
    <PageHeader title="Biblioteca de Scripts" subtitle={`${catalog.count} scripts do backup ${catalog.version}. A lista carrega apenas metadados; campos, métodos e código-fonte são abertos sob demanda.`}/>
    <div className="executor-toolbar script-toolbar">
      <label><Search/><input value={term} onChange={event=>{setTerm(event.target.value);setParams(event.target.value?{q:event.target.value}:{},{replace:true})}} placeholder="Buscar script, campo, método ou dependência…"/></label>
      <select value={category} onChange={event=>setCategory(event.target.value)}><option value="">Todas as categorias</option>{catalog.categories.map(item=><option key={item}>{item}</option>)}</select>
      <select value={kind} onChange={event=>setKind(event.target.value)}><option value="">Todos os tipos</option>{kinds.map(item=><option key={item}>{item}</option>)}</select>
    </div>
    <div className="executor-script-result-head"><span>{filtered.length} resultados</span><span>Página {page} de {pages}</span></div>
    <div className="executor-script-list">{visible.map(script=><Link key={script.id} to={`/executor/scripts/${script.id}`} className="executor-script-card">
      <div className="executor-script-icon"><FileCode2/></div><div><header><span>{script.category}</span><em>{script.kind}</em></header><h2>{script.filename}</h2><code>{script.path}</code><p>{script.summary}</p><footer>{script.dependencies.length>0&&<span>Depende de {script.dependencies.length}</span>}{script.usedBy.length>0&&<span>Usado por {script.usedBy.length}</span>}<strong><Braces/>Abrir detalhes</strong></footer></div>
    </Link>)}</div>
    {visible.length===0&&<EmptyState title="Nenhum script encontrado" text="Tente remover filtros ou pesquisar por outro nome."/>}
    {pages>1&&<div className="executor-pagination"><button className="secondary-button" disabled={page<=1} onClick={()=>setPage(value=>Math.max(1,value-1))}><ChevronLeft/>Anterior</button><span>{page}/{pages}</span><button className="secondary-button" disabled={page>=pages} onClick={()=>setPage(value=>Math.min(pages,value+1))}>Próxima<ChevronRight/></button></div>}
  </div>;
}

function normalise(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ').trim();}
function fuzzyIncludes(haystack:string,needle:string){
  if(haystack.includes(needle))return true;
  const tokens=needle.split(' ').filter(Boolean);
  return tokens.every(token=>{
    if(haystack.includes(token))return true;
    let cursor=0;
    for(const char of haystack){if(char===token[cursor])cursor+=1;if(cursor===token.length)return true;}
    return false;
  });
}
