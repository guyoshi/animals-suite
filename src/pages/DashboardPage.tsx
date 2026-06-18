import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDashed, Filter, Link2Off, MapPin, MapPinOff, Wrench } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '../components/Ui';
import { buildMetricDetails, buildProductionRows, buildWarnings } from '../lib/planning';
import { useProjectStore } from '../store/useProjectStore';

export function DashboardPage() {
  const project = useProjectStore(s=>s.project);
  const navigate = useNavigate();
  const [warningFilter,setWarningFilter]=useState<'all'|'error'|'warning'|'info'>('all');
  const [showAll,setShowAll]=useState(false);
  const rows=useMemo(()=>buildProductionRows(project),[project]);
  const metrics=useMemo(()=>buildMetricDetails(project,rows),[project,rows]);
  const warnings=useMemo(()=>buildWarnings(project),[project]);
  const visibleWarnings=warnings.filter(w=>warningFilter==='all'||w.severity===warningFilter).slice(0,showAll?undefined:10);
  const active=rows.filter(row=>!row.archived);

  return <div>
    <PageHeader title="Status geral" subtitle="Produção, cobertura, mapas e próximos passos do projeto." actions={<button className="primary-button" onClick={()=>navigate('/production')}><Wrench/> Abrir Produção</button>}/>
    <div className="dashboard-primary-kpis">
      <button onClick={()=>navigate('/production')}><CircleDashed/><div><strong>{active.length}</strong><span>Elementos ativos</span></div></button>
      <button onClick={()=>navigate('/production?filter=unity')}><CheckCircle2/><div><strong>{active.filter(r=>r.status==='unity').length}</strong><span>Configurados no Unity</span></div></button>
      <button onClick={()=>navigate('/production?filter=unplaced')}><MapPinOff/><div><strong>{active.filter(r=>!r.placed).length}</strong><span>Ainda fora do mapa</span></div></button>
      <button onClick={()=>navigate('/production?filter=no-relations')}><Link2Off/><div><strong>{active.filter(r=>r.relationCount===0).length}</strong><span>Sem relações</span></div></button>
      <button onClick={()=>navigate('/production?filter=errors')} className="danger-kpi"><AlertTriangle/><div><strong>{active.filter(r=>r.status==='erro').length}</strong><span>Com erro no Unity</span></div></button>
    </div>

    <Card><SectionTitle>Metas e colocação</SectionTitle><div className="dashboard-metrics">{metrics.map(metric=><button key={metric.key} onClick={()=>navigate(metric.route)}><div><strong>{metric.label}</strong><span>{metric.created} criados de {metric.planned || metric.created}</span></div><div className="metric-numbers"><b>{metric.placed}</b><small>no mapa</small></div><div className="metric-progress"><i style={{width:`${pct(metric.created,metric.planned||metric.created)}%`}}/><b style={{width:`${pct(metric.placed,metric.planned||metric.created)}%`}}/></div><ArrowRight/></button>)}</div></Card>

    <div className="dashboard-grid">
      <Card><SectionTitle>Continuar trabalhando</SectionTitle><div className="continue-list">{warnings.slice(0,7).map(w=><button key={w.id} onClick={()=>navigate(w.route)} className={`severity-${w.severity}`}><span>{w.severity==='error'?<AlertTriangle/>:w.severity==='warning'?<Filter/>:<MapPin/>}</span><div><strong>{w.category}</strong><p>{w.text}</p></div><ArrowRight/></button>)}{warnings.length===0&&<div className="empty-state"><CheckCircle2/><strong>Projeto sem pendências detectadas.</strong></div>}</div></Card>
      <Card><SectionTitle>Mundos</SectionTitle><div className="world-card-grid">{project.worlds.map(world=>{const areas=project.areas.filter(a=>a.worldId===world.id);const worldRows=active.filter(r=>r.worldId===world.id);const placed=worldRows.filter(r=>r.placed).length;const errors=worldRows.filter(r=>r.status==='erro').length;return <button className="world-mini-card" style={{'--world':world.theme.primary} as React.CSSProperties} key={world.id} onClick={()=>navigate(`/production?world=${world.id}`)}><span className="world-swatch"/><div><strong>{world.name}</strong><small>{areas.length} áreas · {placed}/{worldRows.length} elementos no mapa · {errors} erros</small></div></button>})}</div></Card>
    </div>

    <Card><SectionTitle action={<div className="warning-filter-buttons"><button className={warningFilter==='all'?'active':''} onClick={()=>setWarningFilter('all')}>Todos</button><button className={warningFilter==='error'?'active':''} onClick={()=>setWarningFilter('error')}>Erros</button><button className={warningFilter==='warning'?'active':''} onClick={()=>setWarningFilter('warning')}>Avisos</button><button className={warningFilter==='info'?'active':''} onClick={()=>setWarningFilter('info')}>Informações</button></div>}>Todos os avisos <span className="count-pill">{warnings.length}</span></SectionTitle><div className="warning-list expanded">{visibleWarnings.map(w=><button key={w.id} className={`severity-${w.severity}`} onClick={()=>navigate(w.route)}><AlertTriangle/><span>{w.text}</span><small>{w.category}</small></button>)}</div>{warnings.filter(w=>warningFilter==='all'||w.severity===warningFilter).length>10&&<button className="secondary-button" onClick={()=>setShowAll(v=>!v)}>{showAll?'Mostrar menos':'Ver todos os avisos'}</button>}</Card>
  </div>;
}
function pct(value:number,total:number){return total>0?Math.min(100,Math.round(value/total*100)):0}
