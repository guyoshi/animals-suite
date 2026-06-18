import { AlertTriangle, ArrowRight, FlaskConical, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { ENTITY_LABELS, refKey } from '../../lib/entities';
import { loadBuildMissions, loadScriptCatalog } from '../../lib/executorContent';
import { getAllEntityIntegrations } from '../../lib/executorIntegration';
import { testsForMission } from '../../lib/executorTestMatching';
import { useExecutorStore } from '../../store/useExecutorStore';
import { useProjectStore } from '../../store/useProjectStore';
import type { ImportedBuildMission } from '../../types/executorContent';

export function ExecutorMissionIntegration({mission}:{mission:ImportedBuildMission}){
  const project=useProjectStore(state=>state.project);const executor=useExecutorStore(state=>state.executor);
  const {data:missions}=useAsyncContent(loadBuildMissions,[]);const {data:scripts}=useAsyncContent(loadScriptCatalog,[]);
  if(!missions)return null;
  const entities=getAllEntityIntegrations(project,executor,missions,scripts).filter(item=>item.missionIds.includes(mission.id)).slice(0,18);
  const issues=executor.issues.filter(issue=>issue.relatedIds.includes(mission.id)&&issue.status!=='resolvido');
  const tests=testsForMission(mission);
  if(entities.length===0&&issues.length===0&&tests.length===0)return null;
  return <section className="executor-mission-integration"><header><div><Link2/><strong>Integração desta missão</strong></div><Link to="/executor/integration">Central de integração <ArrowRight/></Link></header>{entities.length>0&&<div className="executor-mission-entities">{entities.map(item=>{const ref=item.entity.ref;return <Link key={refKey(ref)} to={`/executor/entity/${ref.type}/${encodeURIComponent(ref.id)}${ref.parentId?`?parent=${encodeURIComponent(ref.parentId)}`:''}`}><small>{ENTITY_LABELS[ref.type]}</small><strong>{item.entity.title}</strong><span>{item.status.replace('_',' ')}</span></Link>})}</div>}<div className="executor-mission-support-grid">{tests.length>0&&<div><h4><FlaskConical/>Testes recomendados</h4>{tests.map(test=><Link key={test.id} to={`/executor/tests?q=${encodeURIComponent(test.title)}`}>{test.title}</Link>)}</div>}{issues.length>0&&<div><h4><AlertTriangle/>Problemas abertos</h4>{issues.map(issue=><Link key={issue.id} to={`/executor/issues?issue=${issue.id}`} className={`severity-${issue.severity}`}>{issue.title}</Link>)}</div>}</div></section>;
}
