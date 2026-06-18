import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const suite = JSON.parse(fs.readFileSync(path.join(root, 'suite.manifest.json'), 'utf8'));
const contentRoot = path.join(root, 'public', 'executor-content');
const content = JSON.parse(fs.readFileSync(path.join(contentRoot, 'manifest.json'), 'utf8'));
const missions = JSON.parse(fs.readFileSync(path.join(contentRoot, 'roadmap', 'missions.json'), 'utf8'));
const guides = JSON.parse(fs.readFileSync(path.join(contentRoot, 'guides', 'index.json'), 'utf8'));
const scripts = JSON.parse(fs.readFileSync(path.join(contentRoot, 'scripts', 'index.json'), 'utf8'));
const app = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');
const layout = fs.readFileSync(path.join(root, 'src', 'components', 'executor', 'ExecutorLayout.tsx'), 'utf8');

const taskCount = missions.reduce((sum, mission) => sum + mission.tasks.length, 0);
const stepCount = missions.reduce((sum, mission) => sum + mission.tasks.reduce((inner, task) => inner + task.steps.length, 0), 0);
const guideFiles = fs.readdirSync(path.join(contentRoot, 'guides')).filter(file => file.endsWith('.json') && file !== 'index.json');
const scriptFiles = fs.readdirSync(path.join(contentRoot, 'scripts')).filter(file => file.endsWith('.json') && file !== 'index.json');
const checks = [
  ['versão da suite 0.11.0', suite.version === '0.11.0'],
  ['aplicação desktop-only', content.desktopOnly === true],
  ['96 missões importadas', missions.length === 96 && content.counts.missions === 96],
  ['277 tarefas importadas', taskCount === 277 && content.counts.tasks === 277],
  ['1099 Steps importados', stepCount === 1099 && content.counts.steps === 1099],
  ['26 guias internos', guides.length === 26 && guideFiles.length === 26],
  ['278 scripts internos', scripts.files.length === 278 && scriptFiles.length === 278],
  ['sem referências de guia quebradas', content.validation.missingGuideRefs.length === 0],
  ['IDs de missão únicos', content.validation.missionIdsUnique === true],
  ['IDs de Step únicos', content.validation.stepIdsUnique === true],
  ['rota do roteiro implementada', app.includes('<ExecutorRoadmapPage/>') && app.includes('<ExecutorMissionPage/>')],
  ['rotas de guias implementadas', app.includes('<ExecutorGuidesPage/>') && app.includes('<ExecutorGuidePage/>')],
  ['rotas de scripts implementadas', app.includes('<ExecutorScriptsPage/>') && app.includes('<ExecutorScriptPage/>')],
  ['pesquisa global Ctrl+K', layout.includes('ExecutorCommandPalette') && layout.includes("event.key.toLocaleLowerCase()==='k'")],
  ['manifesto da Etapa 2 atualizado', suite.executorContent.importedSteps === 1099 && suite.executorContent.importedGuides === 26 && suite.executorContent.importedScripts === 278],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK' : 'ERRO'}  ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log(`\nEtapa 2 validada: ${missions.length} missões, ${taskCount} tarefas, ${stepCount} Steps, ${guides.length} guias e ${scripts.files.length} scripts.`);
