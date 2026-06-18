import { AlertTriangle, ArrowRight, BookOpen, Braces, CheckCircle2, CircleDashed, ClipboardCheck, Clock3, FlaskConical, Layers3, Link2, Map, Route, ShieldCheck, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, PageHeader, SectionTitle } from '../../components/Ui';
import { SUITE_MANIFEST } from '../../config/suiteManifest';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadBuildMissions, loadBuildStages, loadExecutorContentManifest } from '../../lib/executorContent';
import { findNextIncompleteLocation, getMissionStats } from '../../lib/executorProgress';
import { useExecutorStore } from '../../store/useExecutorStore';

export function ExecutorDashboardPage() {
  const executor = useExecutorStore(state => state.executor);
  const {data:manifest}=useAsyncContent(loadExecutorContentManifest,[]);
  const {data:missions}=useAsyncContent(loadBuildMissions,[]);
  const {data:stages}=useAsyncContent(loadBuildStages,[]);
  const detailed=(missions||[]).filter(item=>item.detailed);
  const completed=detailed.filter(item=>getMissionStats(executor,item).status==='concluido').length;
  const inProgress=detailed.filter(item=>getMissionStats(executor,item).status==='em_andamento').length;
  const totalSteps=detailed.reduce((sum,item)=>sum+getMissionStats(executor,item).total,0);
  const doneSteps=detailed.reduce((sum,item)=>sum+getMissionStats(executor,item).done,0);
  const percent=totalSteps?Math.round(doneSteps/totalSteps*100):0;
  const next=missions?findNextIncompleteLocation(executor,missions):undefined;
  const current=[executor.currentLocation,...executor.recentLocations].find(item=>item?.missionId);

  return <div className="executor-dashboard">
    <PageHeader title="Animals — Executor" subtitle="Planejamento, execução, documentação, testes e problemas conectados numa aplicação desktop." actions={<Link className="secondary-button" to="/"><Workflow/>Abrir Planejador</Link>}/>

    <div className="executor-hero stage3">
      <div><span className="eyebrow">Animals Suite · Versão final 1.0</span><h2>Planeje, execute e avance pelo mundo de produção.</h2><p>Use o roteiro tradicional ou a Jornada gamificada, ouça a Base de Músicas enquanto trabalha e publique atualizações automáticas pelo GitHub.</p>
        <div className="executor-hero-actions">{current&&<Link className="primary-button" to={current.route}><Route/>Continuar de onde parei</Link>}{next&&<Link className="secondary-button" to={`/executor/roadmap/${next.mission.id}?task=${next.task.index}&step=${next.step.index}`}><ArrowRight/>Próximo Step incompleto</Link>}</div>
      </div>
      <div className="executor-progress-orb"><strong>{percent}%</strong><span>{doneSteps}/{totalSteps} Steps</span><i><b style={{width:`${percent}%`}}/></i></div>
    </div>

    <div className="executor-dashboard-stats">
      <Link to="/executor/focus"><ClipboardCheck/><div><strong>{executor.focusItems.filter(item=>(item.sessionDate||item.addedAt.slice(0,10))===new Date().toISOString().slice(0,10)).length}</strong><span>Itens no foco de hoje</span></div></Link>
      <Link to="/executor/roadmap"><Layers3/><div><strong>{completed}</strong><span>Missões concluídas</span></div></Link>
      <Link to="/executor/roadmap"><Clock3/><div><strong>{inProgress}</strong><span>Em andamento</span></div></Link>
      <Link to="/executor/guides"><BookOpen/><div><strong>{manifest?.counts.guides||26}</strong><span>Guias e tutoriais</span></div></Link>
      <Link to="/executor/integration"><Link2/><div><strong>{Object.keys(executor.entityStates).length}</strong><span>Entidades acompanhadas</span></div></Link>
    </div>

    <div className="executor-grid-two">
      <Card><SectionTitle>Progresso por etapa</SectionTitle><div className="executor-phase-progress">{stages?.map(stage=>{
        const stageMissions=detailed.filter(item=>item.stageId===stage.id);
        const steps=stageMissions.reduce((sum,item)=>sum+getMissionStats(executor,item).total,0);
        const done=stageMissions.reduce((sum,item)=>sum+getMissionStats(executor,item).done,0);
        const stagePercent=steps?Math.round(done/steps*100):0;
        return <Link key={stage.id} to={`/executor/roadmap`}><div><span>Etapa {stage.number}</span><strong>{stage.title.replace(/^Fase \d+\s*[—-]\s*/,'')}</strong><small>{done}/{steps} Steps</small></div><i><b style={{width:`${stagePercent}%`}}/></i><em>{stagePercent}%</em></Link>;
      })}</div></Card>

      <Card><SectionTitle>Integração e qualidade</SectionTitle><div className="executor-migration-status"><ShieldCheck/><div><strong>Fontes conectadas</strong><p>O Planejador continua responsável pelo design; o Executor acompanha implementação, testes, documentação e bloqueios sem duplicar as entidades.</p></div></div><div className="executor-validation-list"><span><CheckCircle2/>IDs compartilhados</span><span><CheckCircle2/>Estado técnico sincronizável</span><span><FlaskConical/>Receitas de teste</span><span><AlertTriangle/>{executor.issues.filter(item=>item.status!=='resolvido').length} problemas abertos</span></div></Card>
    </div>

    <Card><SectionTitle>Acesso rápido</SectionTitle><div className="executor-quick-links"><Link to="/executor/journey"><Map/><strong>Jornada</strong><span>Mapa místico, névoa e nós de produção</span><ArrowRight/></Link><Link to="/executor/roadmap"><ClipboardCheck/><strong>Roteiro</strong><span>Executar as missões detalhadas</span><ArrowRight/></Link><Link to="/executor/guides"><BookOpen/><strong>Guias e tutoriais</strong><span>Consultar configuração e documentação</span><ArrowRight/></Link><Link to="/executor/scripts"><Braces/><strong>Biblioteca de scripts</strong><span>Campos, métodos, dependências e código</span><ArrowRight/></Link><Link to="/executor/integration"><Link2/><strong>Integração</strong><span>Entidades, missões, guias e scripts</span><ArrowRight/></Link><Link to="/executor/tests"><FlaskConical/><strong>Receitas de teste</strong><span>Debug Panel, resultados e negativos</span><ArrowRight/></Link><Link to="/executor/issues"><AlertTriangle/><strong>Problemas</strong><span>Riscos, bugs e soluções temporárias</span><ArrowRight/></Link><Link to="/executor/validation"><ShieldCheck/><strong>Validação</strong><span>Integridade de toda a Suite</span><ArrowRight/></Link><Link to="/executor/focus"><CircleDashed/><strong>Modo Foco</strong><span>Executar somente o trabalho de hoje</span><ArrowRight/></Link><Link to="/executor/activity"><Clock3/><strong>Favoritos e recentes</strong><span>Retomar consultas frequentes</span><ArrowRight/></Link><Link to="/executor/export"><Route/><strong>Exportação seletiva</strong><span>Relatórios por conteúdo ou estado</span><ArrowRight/></Link><Link to="/executor/settings"><CircleDashed/><strong>Configurações</strong><span>Backups, migração e sincronização</span><ArrowRight/></Link></div></Card>

    <div className="executor-content-version">Conteúdo {manifest?.version||SUITE_MANIFEST.contentVersion} · Fonte {manifest?.sourceVersion||'18-06-att'} · Aplicação somente desktop</div>
  </div>;
}
