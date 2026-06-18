import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Coins, GitBranch, Route, ShieldAlert } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '../components/Ui';
import { validateGaiaMap } from '../lib/planning';
import { useProjectStore } from '../store/useProjectStore';

export function GaiaAnalysisPage(){
  const project=useProjectStore(s=>s.project);
  const analysis=useMemo(()=>validateGaiaMap(project),[project]);
  const [worldId,setWorldId]=useState('');
  const warnings=analysis.warnings.filter(w=>!worldId||w.worldId===worldId);
  return <div>
    <PageHeader title="Análise da Terra de Gaia" subtitle="Validação estrutural, economia de rotas, profundidade, retorno e cobertura por ramo." actions={<Link className="secondary-button" to="/world-map"><ArrowLeft/> Voltar ao editor</Link>}/>
    <div className="stats-grid"><div className="stat-card static"><ShieldAlert/><div><strong>{analysis.warnings.filter(w=>w.severity==='error').length}</strong><span>Erros estruturais</span></div></div><div className="stat-card static"><AlertTriangle/><div><strong>{analysis.warnings.filter(w=>w.severity==='warning').length}</strong><span>Avisos</span></div></div><div className="stat-card static"><Route/><div><strong>{analysis.routeBudgets.filter(r=>r.affordable).length}/{analysis.routeBudgets.length}</strong><span>Rotas viáveis</span></div></div><div className="stat-card static"><GitBranch/><div><strong>{Math.max(0,...Object.values(analysis.depths))}</strong><span>Profundidade máxima</span></div></div></div>
    <div className="gaia-analysis-grid">
      <Card><SectionTitle>Validadores</SectionTitle><label className="field"><span>Mundo</span><select value={worldId} onChange={e=>setWorldId(e.target.value)}><option value="">Todos</option>{project.worlds.filter(w=>w.id!=='w0').map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label><div className="analysis-warning-list">{warnings.map(w=><Link key={w.id} to={w.route} className={`analysis-warning severity-${w.severity}`}>{w.severity==='error'?<ShieldAlert/>:w.severity==='warning'?<AlertTriangle/>:<CheckCircle2/>}<span>{w.text}</span></Link>)}{warnings.length===0&&<div className="empty-state"><CheckCircle2/><strong>Nenhum problema neste filtro.</strong></div>}</div></Card>
      <Card><SectionTitle>Simulação: qualquer mundo primeiro</SectionTitle><div className="world-simulation-list">{analysis.worldSimulations.map(row=><div key={row.worldId} className={row.viableAsFirst?'viable':'blocked'}><span>{row.viableAsFirst?<CheckCircle2/>:<AlertTriangle/>}</span><div><strong>{row.worldName}</strong><small>Entrada: {row.entryCost} · Runas estimadas após o mundo: {row.runesAfterEstimate}</small></div><b>{row.issueCount} avisos</b></div>)}</div><p className="muted">A simulação usa os custos e recompensas planejados. Ela não altera o projeto.</p></Card>
    </div>
    <Card><SectionTitle>Economia por nó</SectionTitle><div className="route-budget-table"><div className="route-budget-head"><span>Área</span><span>Profundidade</span><span>Custo acumulado</span><span>Disponível antes</span><span>Resultado</span></div>{analysis.routeBudgets.sort((a,b)=>a.depth-b.depth).map(row=>{const area=project.areas.find(a=>a.id===row.areaId);return <Link to={`/area/${row.areaId}`} key={row.areaId} className={!row.affordable?'bad':''}><strong>{area?.name??row.areaId}</strong><span>{row.depth}</span><span>{row.minimumCost}</span><span>{row.availableBefore}</span><span>{row.affordable?<><CheckCircle2/> Viável</>:<><AlertTriangle/> Bloqueio</>}</span></Link>})}</div></Card>
    <Card><SectionTitle>Cobertura por ramo</SectionTitle><div className="branch-coverage-grid">{analysis.branchCoverage.map(row=><div key={row.worldId}><h3>{row.worldName}</h3><p><strong>Profundidade:</strong> {row.depth}</p><p><strong>Categorias usadas:</strong> {row.categories.join(', ')||'Nenhuma declarada'}</p><p><strong>Animais citados:</strong> {row.animalsUsed.join(', ')||'Nenhum'}</p>{row.weakCategories.length>0?<p className="warning-text"><Coins/> Categorias locais ausentes: {row.weakCategories.join(', ')}</p>:<p className="success-text"><CheckCircle2/> Categorias locais representadas.</p>}</div>)}</div></Card>
  </div>;
}
