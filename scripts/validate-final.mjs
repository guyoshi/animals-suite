import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8').replace(/^\uFEFF/, '');
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));
const json = (...parts) => JSON.parse(read(...parts));

const suite = json('suite.manifest.json');
const pkg = json('package.json');
const tauri = json('src-tauri', 'tauri.conf.json');
const manifest = json('public', 'executor-content', 'manifest.json');
const missions = json('public', 'executor-content', 'roadmap', 'missions.json');
const guideIndex = json('public', 'executor-content', 'guides', 'index.json');
const scriptCatalog = json('public', 'executor-content', 'scripts', 'index.json');
const app = read('src', 'App.tsx');
const layout = read('src', 'components', 'executor', 'ExecutorLayout.tsx');
const music = read('src', 'components', 'executor', 'ExecutorMusicPlayer.tsx');
const musicPage = read('src', 'pages', 'MusicPage.tsx');
const musicAttachments = read('src', 'lib', 'musicAttachments.ts');
const migration = read('src', 'data', 'migrate.ts');
const journey = read('src', 'pages', 'executor', 'ExecutorJourneyPage.tsx');
const types = read('src', 'types', 'executor.ts');
const seed = read('src', 'data', 'executorSeed.ts');
const workflow = read('.github', 'workflows', 'release.yml');
const updaterConfigGenerator = read('scripts', 'generate-updater-config.mjs');
const gitignore = read('.gitignore');
const semver = /^\d+\.\d+\.\d+$/;

const taskCount = missions.reduce((sum, mission) => sum + (mission.tasks?.length ?? 0), 0);
const stepIds = missions.flatMap(mission => (mission.tasks ?? []).flatMap(task => (task.steps ?? []).map(step => step.id)));
const stepCount = stepIds.length;
const scriptFilesExist = scriptCatalog.files.every(item => exists('public', 'executor-content', 'scripts', `${item.id}.json`));
const guideFilesExist = guideIndex.every(item => exists('public', 'executor-content', 'guides', `${item.slug}.json`));
const expected = suite.executorContent;

const checks = [
  ['versão semântica no manifesto', semver.test(suite.version)],
  ['versões sincronizadas', pkg.version === suite.version && tauri.version === suite.version],
  ['fonte técnica 02/07', suite.sources.technicalBackup === 'Scripts backup 02-07.rar' && manifest.sourceVersion === '02-07'],
  ['conteúdo final importado', expected.importedBuildMissions === missions.length && expected.importedTasks === taskCount && expected.importedSteps === stepCount && expected.importedGuides === guideIndex.length && expected.importedScripts === scriptCatalog.files.length],
  ['totais da versão 1.1.0', missions.length === 97 && taskCount === 283 && stepCount === 1123 && guideIndex.length === 27 && scriptCatalog.files.length === 282],
  ['manifesto de conteúdo coerente', manifest.counts.missions === 97 && manifest.counts.tasks === 283 && manifest.counts.steps === 1123 && manifest.counts.guides === 27 && manifest.counts.scripts === 282],
  ['IDs de missão únicos', new Set(missions.map(item => item.id)).size === missions.length],
  ['IDs de Steps únicos', new Set(stepIds).size === stepIds.length],
  ['documentos de scripts presentes', scriptFilesExist],
  ['documentos de guias presentes', guideFilesExist],
  ['novos scripts 02/07', ['script-data-editor-gamedatavalidatorbuildpreprocess-cs','script-data-playerprogress-areaprogress-cs','script-data-playerprogress-worldprogress-cs','script-player-playerlocator-cs'].every(id => scriptCatalog.files.some(item => item.id === id))],
  ['missão 97 presente', missions.some(item => item.id === 'build-mission-097' && item.tasks?.length === 6)],
  ['guia 02/07 presente', guideIndex.some(item => item.slug === 'atualizacao-02-07')],
  ['Jornada gamificada', app.includes('ExecutorJourneyPage') && layout.includes("'/executor/journey'") && journey.includes('journey-orb') && journey.includes('WASD')],
  ['player musical global', layout.includes('ExecutorMusicPlayer') && music.includes('executor-music-player')],
  ['controles musicais por ícones', ['SkipBack','Pause','Square','Play','SkipForward','Repeat1','Shuffle','Target'].every(icon => music.includes(icon))],
  ['modo aleatório por missão', music.includes("mode==='por_missao'") && music.includes('missionTrackAssignments') && types.includes("'por_missao'")],
  ['músicas somente por anexo do Planejador', music.includes('hasPlannerMusicAttachment') && musicPage.includes('Anexar áudio ao Planejador') && musicAttachments.includes("source: 'planner_upload'") && migration.includes('migrateLegacyMusicAttachment')],
  ['preferências musicais migráveis', types.includes('musicPlayerEnabled') && types.includes('musicVolume') && seed.includes("musicMode: 'sequencial'")],
  ['atualizador GitHub', workflow.includes('tauri-apps/tauri-action@v0.6.2') && workflow.includes('includeUpdaterJson: true') && workflow.includes('latest.json') && workflow.includes('generate-updater-config.mjs') && workflow.includes('tauri.updater.generated.conf.json')],
  ['configuração segura do updater', updaterConfigGenerator.includes('plugins') && updaterConfigGenerator.includes('updater') && updaterConfigGenerator.includes('TAURI_UPDATER_PUBLIC_KEY') && updaterConfigGenerator.includes('createUpdaterArtifacts')],
  ['validação final no workflow', workflow.includes('npm run validate:final')],
  ['guia GitHub passo a passo', exists('GUIA_GITHUB_ATUALIZACOES_PASSO_A_PASSO.md')],
  ['assistentes de primeira configuração', exists('CONFIGURAR_GITHUB_PRIMEIRA_VEZ.bat') && exists('scripts', 'Configurar-GitHub-Primeira-Vez.ps1')],
  ['assistente de publicação', exists('PUBLICAR_ATUALIZACAO_GITHUB.bat') && exists('scripts', 'Publicar-Atualizacao-GitHub.ps1')],
  ['chaves privadas ignoradas', gitignore.includes('*.key') && gitignore.includes('*.pem') && gitignore.includes('tauri.updater.generated.conf.json')],
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'ERRO'}  ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log(`\nVersão final ${suite.version} validada: ${missions.length} missões, ${taskCount} tarefas, ${stepCount} Steps, ${guideIndex.length} guias e ${scriptCatalog.files.length} scripts.`);
