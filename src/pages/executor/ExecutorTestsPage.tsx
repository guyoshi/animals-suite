import { BookOpen, Braces, CheckCircle2, Filter, FlaskConical, Search, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EXECUTOR_TEST_RECIPES } from '../../data/executorTests';
import { PageHeader, EmptyState } from '../../components/Ui';
import { testRunKey } from '../../lib/executorTestMatching';
import { useExecutorStore } from '../../store/useExecutorStore';
import type { TestRunStatus } from '../../types/executor';

const labels:Record<TestRunStatus,string>={nao_testado:'Não testado',passou:'Passou',falhou:'Falhou',bloqueado:'Bloqueado'};

export function ExecutorTestsPage(){
  const [params]=useSearchParams();
  const executor=useExecutorStore(state=>state.executor);
  const mutate=useExecutorStore(state=>state.mutate);
  const [term,setTerm]=useState(params.get('q')??'');
  const [category,setCategory]=useState('');
  const [state,setState]=useState('');
  const categories=[...new Set(EXECUTOR_TEST_RECIPES.map(item=>item.category))];
  const filtered=useMemo(()=>{const q=term.trim().toLocaleLowerCase('pt-BR');return EXECUTOR_TEST_RECIPES.filter(recipe=>(!q||`${recipe.title} ${recipe.description} ${recipe.category} ${recipe.scriptNames.join(' ')}`.toLocaleLowerCase('pt-BR').includes(q))&&(!category||recipe.category===category)&&(!state||(executor.testRuns[testRunKey(recipe.id)]?.status??'nao_testado')===state));},[category,executor.testRuns,state,term]);
  const passed=EXECUTOR_TEST_RECIPES.filter(recipe=>executor.testRuns[testRunKey(recipe.id)]?.status==='passou').length;
  const failed=EXECUTOR_TEST_RECIPES.filter(recipe=>executor.testRuns[testRunKey(recipe.id)]?.status==='falhou').length;
  return <div>
    <PageHeader title="Receitas de Teste" subtitle="Testes rápidos, negativos e de persistência usando o Animals Debug Panel e o fluxo real do jogo."/>
    <section className="executor-test-stats"><div><FlaskConical/><strong>{EXECUTOR_TEST_RECIPES.length}</strong><span>receitas</span></div><div><CheckCircle2/><strong>{passed}</strong><span>passaram</span></div><div><ShieldAlert/><strong>{failed}</strong><span>falharam</span></div></section>
    <div className="executor-toolbar"><label><Search/><input value={term} onChange={event=>setTerm(event.target.value)} placeholder="Buscar teste, sistema ou script…"/></label><label><Filter/><select value={category} onChange={event=>setCategory(event.target.value)}><option value="">Todas as categorias</option>{categories.map(value=><option key={value}>{value}</option>)}</select></label><select value={state} onChange={event=>setState(event.target.value)}><option value="">Todos os estados</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
    <div className="executor-test-catalog">{filtered.map(recipe=>{const key=testRunKey(recipe.id);const run=executor.testRuns[key];const status=run?.status??'nao_testado';return <article key={recipe.id} className={`test-state-${status}`}><header><div><span>{recipe.category}</span><h2>{recipe.title}</h2></div><select value={status} onChange={event=>mutate(draft=>{draft.testRuns[key]={recipeId:recipe.id,status:event.target.value as TestRunStatus,notes:draft.testRuns[key]?.notes,updatedAt:new Date().toISOString()}})}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></header><p>{recipe.description}</p><div className="executor-test-columns"><section><h3>Antes de começar</h3><ul>{recipe.prerequisites.map(item=><li key={item}>{item}</li>)}</ul><h3>Passos com o Debug Panel</h3><ol>{recipe.debugSteps.map(item=><li key={item}>{item}</li>)}</ol></section><section><h3>Resultado esperado</h3><ul>{recipe.expected.map(item=><li key={item}>{item}</li>)}</ul><h3>Testes negativos</h3><ul>{recipe.negativeTests.map(item=><li key={item}>{item}</li>)}</ul></section></div><div className="executor-related-links">{recipe.guideIds.map(slug=><Link key={slug} className="secondary-button" to={`/executor/guides/${slug}`}><BookOpen/>Guia</Link>)}{recipe.scriptNames.slice(0,6).map(script=><Link key={script} className="executor-script-chip" to={`/executor/scripts?q=${encodeURIComponent(script)}`}><Braces/>{script}</Link>)}</div><label className="executor-test-notes"><span>Notas do teste</span><textarea value={run?.notes??''} onChange={event=>mutate(draft=>{draft.testRuns[key]={recipeId:recipe.id,status:draft.testRuns[key]?.status??'nao_testado',notes:event.target.value,updatedAt:new Date().toISOString()}})} placeholder="Build testada, erro encontrado, valores usados…"/></label></article>})}</div>
    {filtered.length===0&&<EmptyState title="Nenhum teste encontrado" text="Altere os filtros ou o termo pesquisado."/>}
  </div>;
}
