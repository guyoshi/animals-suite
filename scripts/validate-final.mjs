import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));
const suite = JSON.parse(read('suite.manifest.json'));
const pkg = JSON.parse(read('package.json'));
const tauri = JSON.parse(read('src-tauri', 'tauri.conf.json'));
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
const gitignore = read('.gitignore');
const semver = /^\d+\.\d+\.\d+$/;

const checks = [
  ['versão semântica no manifesto', semver.test(suite.version)],
  ['versões sincronizadas', pkg.version === suite.version && tauri.version === suite.version],
  ['conteúdo final importado', suite.executorContent.importedBuildMissions === 96 && suite.executorContent.importedTasks === 277 && suite.executorContent.importedSteps === 1099 && suite.executorContent.importedGuides === 26 && suite.executorContent.importedScripts === 278],
  ['Jornada gamificada', app.includes('ExecutorJourneyPage') && layout.includes("'/executor/journey'") && journey.includes('journey-orb') && journey.includes('WASD')],
  ['player musical global', layout.includes('ExecutorMusicPlayer') && music.includes('executor-music-player')],
  ['controles musicais por ícones', ['SkipBack','Pause','Square','Play','SkipForward','Repeat1','Shuffle','Target'].every(icon => music.includes(icon))],
  ['modo aleatório por missão', music.includes("mode==='por_missao'") && music.includes('missionTrackAssignments') && types.includes("'por_missao'")],
  ['músicas somente por anexo do Planejador', music.includes('hasPlannerMusicAttachment') && musicPage.includes('Anexar áudio ao Planejador') && musicAttachments.includes("source: 'planner_upload'") && migration.includes('migrateLegacyMusicAttachment')],
  ['preferências musicais migráveis', types.includes('musicPlayerEnabled') && types.includes('musicVolume') && seed.includes("musicMode: 'sequencial'")],
  ['atualizador GitHub', workflow.includes('tauri-apps/tauri-action@v1') && workflow.includes('uploadUpdaterJson: true') && workflow.includes('latest.json')],
  ['validação final no workflow', workflow.includes('npm run validate:final')],
  ['guia GitHub passo a passo', exists('GUIA_GITHUB_ATUALIZACOES_PASSO_A_PASSO.md')],
  ['assistentes de primeira configuração', exists('CONFIGURAR_GITHUB_PRIMEIRA_VEZ.bat') && exists('scripts', 'Configurar-GitHub-Primeira-Vez.ps1')],
  ['assistente de publicação', exists('PUBLICAR_ATUALIZACAO_GITHUB.bat') && exists('scripts', 'Publicar-Atualizacao-GitHub.ps1')],
  ['chaves privadas ignoradas', gitignore.includes('*.key') && gitignore.includes('*.pem')],
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'ERRO'}  ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log(`\nVersão final ${suite.version} validada: Jornada, música, atualização pelo GitHub e conteúdo técnico íntegros.`);
