import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(...parts)=>fs.readFileSync(path.join(root,...parts),'utf8');
const suite=JSON.parse(read('suite.manifest.json'));
const content=JSON.parse(read('public','executor-content','manifest.json'));
const missions=JSON.parse(read('public','executor-content','roadmap','missions.json'));
const guides=JSON.parse(read('public','executor-content','guides','index.json'));
const scripts=JSON.parse(read('public','executor-content','scripts','index.json'));
const app=read('src','App.tsx');
const layout=read('src','components','executor','ExecutorLayout.tsx');
const entityTools=read('src','components','EntityTools.tsx');
const worldPage=read('src','pages','WorldPage.tsx');
const html=read('index.html');
const executorTypes=read('src','types','executor.ts');
const rust=read('src-tauri','src','lib.rs');
const recipes=read('src','data','executorTests.ts');
const recipeCount=(recipes.match(/id:'test-/g)||[]).length;
const taskCount=missions.reduce((sum,m)=>sum+m.tasks.length,0);
const stepCount=missions.reduce((sum,m)=>sum+m.tasks.reduce((inner,t)=>inner+t.steps.length,0),0);
const checks=[
 ['versão da suite 0.12.0',suite.version==='0.12.0'],
 ['schemas da Etapa 3',suite.schemas.executor===3&&suite.schemas.database===3],
 ['conteúdo técnico preservado',missions.length===96&&taskCount===277&&stepCount===1099&&guides.length===26&&scripts.files.length===278],
 ['desktop-only preservado',content.desktopOnly===true],
 ['rota de integração',app.includes('<ExecutorIntegrationPage/>')&&app.includes('<ExecutorEntityPage/>')],
 ['rota de problemas',app.includes('<ExecutorIssuesPage/>')],
 ['rota de testes',app.includes('<ExecutorTestsPage/>')],
 ['rota de validação',app.includes('<ExecutorValidationPage/>')],
 ['navegação da Etapa 3',layout.includes("'/executor/integration'")&&layout.includes("'/executor/tests'")&&layout.includes("'/executor/validation'")],
 ['ponte em fichas do Planejador',entityTools.includes('<ExecutorEntityBridge')],
 ['ponte na ficha de Mundo',worldPage.includes('<ExecutorEntityBridge')],
 ['HTML em PT-BR',html.includes('<html lang="pt-BR">')&&html.includes('<title>Animals Suite</title>')],
 ['estado integrado tipado',executorTypes.includes('ExecutorEntityLink')&&executorTypes.includes('ExecutorEntityState')&&executorTypes.includes('ExecutorTestRun')],
 ['ao menos 10 receitas de teste',recipeCount>=10],
 ['tabelas técnicas da Etapa 3',rust.includes('executor_entity_links')&&rust.includes('executor_entity_states')&&rust.includes('executor_test_runs')],
 ['schema SQLite atualizado',rust.includes("VALUES('database_schema','3'")],
 ['manifesto marca integração',suite.executorContent.migrationStatus==='planner-executor-integrated'],
];
let failed=false;
for(const [label,ok] of checks){console.log(`${ok?'OK':'ERRO'}  ${label}`);if(!ok)failed=true;}
if(failed)process.exit(1);
console.log(`\nEtapa 3 validada: integração, ${recipeCount} receitas de teste, problemas e validação cruzada.`);
