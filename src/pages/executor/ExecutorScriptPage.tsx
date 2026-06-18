import { useMemo, useState } from 'react';
import { ArrowLeft, Braces, ChevronDown, ChevronUp, Clipboard, Code2, Link2, Printer } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ExecutorNotesPanel } from '../../components/executor/ExecutorNotesPanel';
import { EmptyState } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadScriptCatalog, loadScriptDocument } from '../../lib/executorContent';
import { ExecutorBookmarkButton } from '../../components/executor/ExecutorBookmarkButton';
import { bookmarkKey } from '../../lib/executorBookmarks';

export function ExecutorScriptPage(){
  const {scriptId}=useParams();
  const {data:script,error,loading}=useAsyncContent(()=>loadScriptDocument(scriptId||''),[scriptId]);
  const {data:catalog}=useAsyncContent(loadScriptCatalog,[]);
  const [showSource,setShowSource]=useState(false);
  const [copied,setCopied]=useState('');
  const idByName=useMemo(()=>{
    const map=new Map<string,string>();
    for(const item of catalog?.files||[]){map.set(item.primary,item.id);map.set(item.filename.replace(/\.cs$/i,''),item.id)}
    return map;
  },[catalog]);

  if(loading)return <div className="executor-loading">Abrindo script…</div>;
  if(error||!script)return <EmptyState title="Script não encontrado" text={error||'O arquivo solicitado não existe no catálogo.'}/>;

  const copy=async(value:string,label:string)=>{await navigator.clipboard.writeText(value);setCopied(label);window.setTimeout(()=>setCopied(''),1400)};

  return <div className="executor-script-page">
    <div className="executor-script-page-top"><Link className="secondary-button" to="/executor/scripts"><ArrowLeft/>Biblioteca</Link><div><span>{script.category} · {script.kind}</span><h1>{script.filename}</h1><code>{script.path}</code></div><div className="executor-detail-actions"><ExecutorBookmarkButton value={bookmarkKey('script',script.id)}/><button className="secondary-button" onClick={()=>window.print()}><Printer/>Imprimir</button><button className="secondary-button" onClick={()=>void copy(script.path,'path')}><Clipboard/>{copied==='path'?'Copiado':'Copiar caminho'}</button></div></div>
    <section className="executor-script-summary"><div className="executor-script-large-icon"><Braces/></div><div><h2>{script.primary||script.filename}</h2><p>{script.summary}</p><strong>Onde usar</strong><span>{script.attach}</span></div></section>

    <div className="executor-script-detail-grid">
      <section><h2>Tipos declarados</h2>{script.types.length?<div className="executor-type-list">{script.types.map(type=><article key={`${type.kind}-${type.name}`}><span>{type.kind}</span><strong>{type.name}</strong>{type.bases&&<code>{type.bases}</code>}{type.attrs&&<small>{type.attrs}</small>}</article>)}</div>:<p className="muted">Nenhum tipo identificado.</p>}</section>
      <section><h2>Relações</h2><RelationGroup title="Dependências" names={script.dependencies} ids={script.dependencyIds} idByName={idByName}/><RelationGroup title="Usado por" names={script.usedBy||script.used_by||[]} ids={script.usedByIds} idByName={idByName}/></section>
    </div>

    <section className="executor-script-table-section"><h2>Campos do Inspector e variáveis</h2>{script.fields.length?<div className="executor-table-wrap"><table><thead><tr><th>Campo</th><th>Tipo</th><th>Seção</th><th>Padrão</th><th>Inspector</th><th>Descrição</th></tr></thead><tbody>{script.fields.map(field=><tr key={`${field.section}-${field.name}`}><td><button onClick={()=>void copy(field.name,field.name)}><code>{field.name}</code>{copied===field.name&&<span>Copiado</span>}</button></td><td><code>{field.type}</code></td><td>{field.section||'—'}</td><td><code>{field.default||'—'}</code></td><td>{field.inspector?'Sim':'Não'}</td><td>{field.description||'—'}</td></tr>)}</tbody></table></div>:<p className="muted">Este script não possui campos catalogados.</p>}</section>

    <section className="executor-script-table-section"><h2>Métodos</h2>{script.methods.length?<div className="executor-method-grid">{script.methods.map((method,index)=><article key={`${method.name}-${index}`}><header><code>{method.name}</code><span>{method.return_type||method.returnType||'void'}</span></header>{method.params&&<small>{method.params}</small>}{method.summary&&<p>{method.summary}</p>}<button onClick={()=>void copy(method.name,`method-${index}`)}><Clipboard/>{copied===`method-${index}`?'Copiado':'Copiar nome'}</button></article>)}</div>:<p className="muted">Nenhum método público/documentado foi identificado.</p>}</section>

    <section className="executor-source-section"><button className="executor-source-toggle" onClick={()=>setShowSource(value=>!value)}><Code2/><span><strong>Código-fonte completo</strong><small>Carregado apenas nesta página</small></span>{showSource?<ChevronUp/>:<ChevronDown/>}</button>{showSource&&<div className="executor-source-code"><button onClick={()=>void copy(script.source,'source')}><Clipboard/>{copied==='source'?'Código copiado':'Copiar código'}</button><pre><code>{script.source}</code></pre></div>}</section>
    <ExecutorNotesPanel ownerType="script" ownerId={script.id}/>
  </div>;
}

function RelationGroup({title,names,ids,idByName}:{title:string;names:string[];ids:string[];idByName:Map<string,string>}){
  return <div className="executor-relation-group"><strong>{title}</strong>{names.length?<div>{names.map((name,index)=>{const id=idByName.get(name)||ids[index];return id?<Link key={`${name}-${index}`} to={`/executor/scripts/${id}`}><Link2/>{name}</Link>:<span key={`${name}-${index}`}>{name}</span>})}</div>:<p>Nenhuma relação catalogada.</p>}</div>;
}
