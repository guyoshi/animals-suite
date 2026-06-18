import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CircleDashed, Filter, Link2Off, MapPinOff, Search, Wrench } from 'lucide-react';
import { Card, PageHeader, SectionTitle, StatusBadge } from '../components/Ui';
import { buildMetricDetails, buildProductionRows, buildWarnings, type ProductionKind } from '../lib/planning';
import { useProjectStore } from '../store/useProjectStore';

const typeOrder: ProductionKind[] = ['area','animal','npc','mission','enemy','item','mechanic','challenge','boss','rumor','whisper','music','areaResource'];

export function ProductionPage() {
  const project = useProjectStore(s => s.project);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const rows = useMemo(()=>buildProductionRows(project),[project]);
  const metrics = useMemo(()=>buildMetricDetails(project,rows),[project,rows]);
  const warnings = useMemo(()=>buildWarnings(project),[project]);
  const type = params.get('type') as ProductionKind | null;
  const filter = params.get('filter') ?? 'all';
  const worldId = params.get('world') ?? '';
  const status = params.get('status') ?? '';
  const filtered = rows.filter(row => {
    if (row.archived) return false;
    if (type && row.type !== type) return false;
    if (worldId && row.worldId !== worldId) return false;
    if (status && row.status !== status) return false;
    if (filter === 'unplaced' && row.placed) return false;
    if (filter === 'placed' && !row.placed) return false;
    if (filter === 'no-relations' && row.relationCount > 0) return false;
    if (filter === 'errors' && row.status !== 'erro') return false;
    if (filter === 'unity' && row.status !== 'unity') return false;
    if (filter === 'planned' && row.status !== 'planejado') return false;
    if (filter === 'runes' && !(row.type==='areaResource' && project.areaResources.find(r=>r.id===row.id)?.kind==='rune')) return false;
    if (filter === 'chests' && !(row.type==='areaResource' && project.areaResources.find(r=>r.id===row.id)?.kind==='chest')) return false;
    if (filter === 'fragments' && !(row.type==='areaResource' && project.areaResources.find(r=>r.id===row.id)?.kind==='fragment')) return false;
    if (search && !`${row.name} ${row.id} ${row.notes}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const set = (key:string,value:string) => { const next=new URLSearchParams(params); if(value)next.set(key,value);else next.delete(key);setParams(next); };

  return <div>
    <PageHeader title="Produção" subtitle="Estado real de todo o conteúdo: planejado, configurado no Unity, com erro, colocado no mapa e sem relações."/>
    <div className="production-metric-grid">{metrics.map(metric=><button key={metric.key} className="production-metric" onClick={()=>navigate(metric.route)}>
      <div className="production-metric-head"><strong>{metric.label}</strong><span>{metric.created}/{metric.planned || metric.created}</span></div>
      <div className="production-bars"><i style={{width:`${percent(metric.created,metric.planned||metric.created)}%`}}/><b style={{width:`${percent(metric.placed,metric.planned||metric.created)}%`}}/></div>
      <small>{metric.placed} no mapa · {metric.unity} Unity · {metric.errors} erros · {metric.withoutRelations} sem relações</small>
    </button>)}</div>

    <div className="production-summary-grid">
      <Card><SectionTitle>Continuar trabalhando</SectionTitle><div className="work-queue">{warnings.slice(0,8).map(w=><button key={w.id} onClick={()=>navigate(w.route)} className={`work-item severity-${w.severity}`}><AlertTriangle/><span>{w.text}</span></button>)}{warnings.length===0&&<p className="muted">Nenhuma pendência estrutural detectada.</p>}</div></Card>
      <Card><SectionTitle>Resumo do projeto</SectionTitle><div className="production-kpis"><div><CircleDashed/><strong>{rows.filter(r=>!r.archived).length}</strong><span>Elementos ativos</span></div><div><CheckCircle2/><strong>{rows.filter(r=>!r.archived&&r.status==='unity').length}</strong><span>No Unity</span></div><div><MapPinOff/><strong>{rows.filter(r=>!r.archived&&!r.placed).length}</strong><span>Fora do mapa</span></div><div><Link2Off/><strong>{rows.filter(r=>!r.archived&&r.relationCount===0).length}</strong><span>Sem relações</span></div></div></Card>
    </div>

    <Card className="production-list-card">
      <div className="production-filterbar">
        <div className="production-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome, ID ou nota"/></div>
        <label><Filter/> Tipo<select value={type??''} onChange={e=>set('type',e.target.value)}><option value="">Todos</option>{typeOrder.map(value=><option key={value} value={value}>{rows.find(r=>r.type===value)?.typeLabel??value}</option>)}</select></label>
        <label>Mundo<select value={worldId} onChange={e=>set('world',e.target.value)}><option value="">Todos</option>{project.worlds.map(world=><option key={world.id} value={world.id}>{world.name}</option>)}</select></label>
        <label>Estado<select value={status} onChange={e=>set('status',e.target.value)}><option value="">Todos</option><option value="planejado">Planejado</option><option value="unity">Unity</option><option value="erro">Erro</option></select></label>
        <label>Filtro<select value={filter} onChange={e=>set('filter',e.target.value)}><option value="all">Todos</option><option value="unplaced">Ainda não colocados</option><option value="placed">Colocados no mapa</option><option value="no-relations">Sem relações</option><option value="errors">Com erro</option><option value="unity">Configurados no Unity</option><option value="planned">Planejados</option><option value="runes">Runas</option><option value="chests">Baús</option><option value="fragments">Fragmentos</option></select></label>
      </div>
      <div className="production-table-wrap"><table className="production-table"><thead><tr><th>Elemento</th><th>Tipo</th><th>Mundo/área</th><th>Estado</th><th>Mapa</th><th>Relações</th><th></th></tr></thead><tbody>{filtered.map(row=>{
        const world=project.worlds.find(w=>w.id===row.worldId);const area=project.areas.find(a=>a.id===row.areaId);
        return <tr key={row.key} onDoubleClick={()=>navigate(row.route)}><td><strong>{row.name}</strong><small>{row.id}</small></td><td>{row.typeLabel}</td><td>{world?.name??'—'}<small>{area?.name}</small></td><td><StatusBadge status={row.status}/></td><td><span className={row.placed?'placed-chip':'unplaced-chip'}>{row.placed?'Colocado':'Fora do mapa'}</span></td><td>{row.relationCount}</td><td><button className="icon-button" onClick={()=>navigate(row.route)} title="Abrir"><Wrench/></button></td></tr>
      })}</tbody></table>{filtered.length===0&&<div className="empty-state">Nenhum elemento corresponde aos filtros.</div>}</div>
    </Card>
  </div>;
}

function percent(value:number,total:number){return total>0?Math.min(100,Math.round(value/total*100)):0}
