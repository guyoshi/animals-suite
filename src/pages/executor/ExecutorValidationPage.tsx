import { AlertTriangle, CheckCircle2, CircleHelp, ExternalLink, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadBuildMissions, loadExecutorContentManifest, loadGuideIndex, loadScriptCatalog } from '../../lib/executorContent';
import { validateSuite } from '../../lib/executorValidation';
import { useExecutorStore } from '../../store/useExecutorStore';
import { useProjectStore } from '../../store/useProjectStore';

export function ExecutorValidationPage(){
  const project=useProjectStore(state=>state.project);const executor=useExecutorStore(state=>state.executor);
  const {data:manifest}=useAsyncContent(loadExecutorContentManifest,[]);const {data:missions}=useAsyncContent(loadBuildMissions,[]);const {data:guides}=useAsyncContent(loadGuideIndex,[]);const {data:scripts}=useAsyncContent(loadScriptCatalog,[]);
  if(!manifest||!missions||!guides||!scripts)return <div className="executor-loading">Executando validação…</div>;
  const findings=validateSuite(project,executor,manifest,missions,guides,scripts);const errors=findings.filter(item=>item.severity==='error').length;const warnings=findings.filter(item=>item.severity==='warning').length;
  return <div><PageHeader title="Validação da Suite" subtitle="Verificação cruzada entre Planejador, Executor, roteiro, guias, scripts, relações e problemas."/><section className={`executor-validation-hero ${errors?'has-errors':'valid'}`}>{errors?<XCircle/>:<ShieldCheck/>}<div><strong>{errors?`${errors} erro(s) estrutural(is)`:'Estrutura consistente'}</strong><span>{warnings} aviso(s) · {findings.length} resultado(s)</span></div></section><div className="executor-validation-list-page">{findings.map(item=><article key={item.id} className={`validation-${item.severity}`}>{item.severity==='error'?<XCircle/>:item.severity==='warning'?<AlertTriangle/>:item.id==='integrity-ok'?<CheckCircle2/>:<CircleHelp/>}<div><span>{item.category}</span><strong>{item.title}</strong><p>{item.detail}</p></div>{item.route&&<Link to={item.route}><ExternalLink/>Abrir</Link>}</article>)}</div>{findings.length===0&&<EmptyState title="Nenhum resultado" text="Não foi possível produzir o relatório de validação."/>}</div>;
}
