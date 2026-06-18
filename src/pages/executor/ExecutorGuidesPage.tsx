import { useMemo, useState } from 'react';
import { BookOpen, FileClock, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadGuideIndex } from '../../lib/executorContent';

export function ExecutorGuidesPage(){
  const {data:guides,error,loading}=useAsyncContent(loadGuideIndex,[]);
  const [term,setTerm]=useState('');
  const [category,setCategory]=useState('');
  const [includeHistorical,setIncludeHistorical]=useState(true);
  const categories=useMemo(()=>[...new Set((guides||[]).map(item=>item.category))].sort((a,b)=>a.localeCompare(b,'pt-BR')),[guides]);
  const filtered=useMemo(()=>{
    const query=term.trim().toLocaleLowerCase('pt-BR');
    return (guides||[]).filter(guide=>(includeHistorical||!guide.historical)&&(!category||guide.category===category)&&(!query||`${guide.title} ${guide.category} ${guide.source} ${guide.summary} ${guide.searchText}`.toLocaleLowerCase('pt-BR').includes(query)));
  },[category,guides,includeHistorical,term]);

  if(loading)return <div className="executor-loading">Carregando guias e tutoriais…</div>;
  if(error||!guides)return <EmptyState title="Não foi possível abrir os guias" text={error||'Índice ausente.'}/>;

  return <div>
    <PageHeader title="Guias e Tutoriais" subtitle={`${guides.length} documentos internos disponíveis offline, incluindo configuração, tutoriais para iniciantes, auditorias, GDD e referências históricas.`}/>
    <div className="executor-toolbar">
      <label><Search/><input value={term} onChange={event=>setTerm(event.target.value)} placeholder="Buscar no título e no conteúdo dos guias…"/></label>
      <select value={category} onChange={event=>setCategory(event.target.value)}><option value="">Todas as categorias</option>{categories.map(item=><option key={item}>{item}</option>)}</select>
      <label className="executor-inline-check"><input type="checkbox" checked={includeHistorical} onChange={event=>setIncludeHistorical(event.target.checked)}/>Mostrar históricos</label>
    </div>
    <div className="executor-guide-grid">{filtered.map(guide=><Link key={guide.slug} to={`/executor/guides/${guide.slug}`} className={`executor-guide-card ${guide.historical?'historical':''}`}>
      <div><span>{guide.category}</span>{guide.historical?<FileClock/>:<BookOpen/>}</div><h2>{guide.title}</h2><p>{guide.summary}</p><footer><code>{guide.source}</code><strong>Abrir guia</strong></footer>
    </Link>)}</div>
    {filtered.length===0&&<EmptyState title="Nenhum guia encontrado" text="Tente outro termo ou categoria."/>}
  </div>;
}
