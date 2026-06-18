import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Copy, Printer, Search, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadGuideDocument } from '../../lib/executorContent';
import { ExecutorBookmarkButton } from '../../components/executor/ExecutorBookmarkButton';
import { bookmarkKey } from '../../lib/executorBookmarks';

export function ExecutorGuidePage(){
  const {slug}=useParams();
  const {data:guide,error,loading}=useAsyncContent(()=>loadGuideDocument(slug||''),[slug]);
  const [term,setTerm]=useState('');
  const [activeResult,setActiveResult]=useState(0);
  const highlighted=useMemo(()=>guide?highlightHtml(guide.html,term):{html:'',count:0},[guide,term]);

  useEffect(()=>{setActiveResult(0)},[term]);
  useEffect(()=>{if(highlighted.count>0)scrollToResult(activeResult)},[activeResult,highlighted.count,highlighted.html]);

  if(loading)return <div className="executor-loading">Abrindo guia…</div>;
  if(error||!guide)return <EmptyState title="Guia não encontrado" text={error||'O documento solicitado não existe.'}/>;

  const move=(direction:number)=>{
    if(!highlighted.count)return;
    setActiveResult(current=>(current+direction+highlighted.count)%highlighted.count);
  };

  return <div className="executor-guide-page">
    <div className="executor-guide-topbar"><Link className="secondary-button" to="/executor/guides"><ArrowLeft/>Todos os guias</Link><div><span>{guide.category}</span><h1>{guide.title}</h1><code>{guide.source}</code></div><div className="executor-detail-actions"><ExecutorBookmarkButton value={bookmarkKey('guide',guide.slug)}/><button className="secondary-button" onClick={()=>window.print()}><Printer/>Imprimir</button></div></div>
    <div className="executor-guide-search"><Search/><input value={term} onChange={event=>setTerm(event.target.value)} placeholder="Pesquisar dentro deste guia…"/>{term&&<><span>{highlighted.count?`${activeResult+1}/${highlighted.count}`:'0 resultados'}</span><button onClick={()=>move(-1)} title="Resultado anterior"><ArrowUp/></button><button onClick={()=>move(1)} title="Próximo resultado"><ArrowDown/></button><button onClick={()=>setTerm('')} title="Limpar busca"><X/></button></>}</div>
    <div className="executor-guide-layout">
      <aside className="executor-guide-toc"><header><BookOpen/><strong>Neste guia</strong></header><nav>{guide.toc.map(item=><button key={item.id} className={`level-${item.level}`} onClick={()=>document.getElementById(item.id)?.scrollIntoView({behavior:'smooth',block:'start'})}>{item.label}</button>)}</nav></aside>
      <article className="executor-guide-document">
        <button className="executor-copy-source" onClick={()=>void navigator.clipboard.writeText(guide.source)} title="Copiar nome da fonte"><Copy/>Copiar fonte</button>
        <div dangerouslySetInnerHTML={{__html:highlighted.html}}/>
      </article>
    </div>
  </div>;
}

function highlightHtml(html:string,term:string):{html:string;count:number}{
  const query=term.trim();
  if(!query||typeof DOMParser==='undefined')return{html,count:0};
  const documentValue=new DOMParser().parseFromString(`<body>${html}</body>`,'text/html');
  const walker=documentValue.createTreeWalker(documentValue.body,NodeFilter.SHOW_TEXT);
  const nodes:Text[]=[];
  while(walker.nextNode()){
    const node=walker.currentNode as Text;
    const parent=node.parentElement;
    if(parent&&!parent.closest('script,style,pre,code'))nodes.push(node);
  }
  const expression=new RegExp(escapeRegExp(query),'giu');
  let count=0;
  for(const node of nodes){
    const value=node.nodeValue||'';
    if(!expression.test(value)){expression.lastIndex=0;continue;}
    expression.lastIndex=0;
    const fragment=documentValue.createDocumentFragment();
    let cursor=0;
    value.replace(expression,(match,offset:number)=>{
      fragment.append(value.slice(cursor,offset));
      const mark=documentValue.createElement('mark');
      mark.className='guide-search-hit';
      mark.id=`guide-hit-${count++}`;
      mark.textContent=match;
      fragment.append(mark);
      cursor=offset+match.length;
      return match;
    });
    fragment.append(value.slice(cursor));
    node.replaceWith(fragment);
  }
  return{html:documentValue.body.innerHTML,count};
}

function scrollToResult(index:number){
  window.setTimeout(()=>document.getElementById(`guide-hit-${index}`)?.scrollIntoView({behavior:'smooth',block:'center'}),0);
}

function escapeRegExp(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
