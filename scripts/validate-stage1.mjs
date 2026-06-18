import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('suite.manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tauri = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
const rust = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');
const projectTypes = fs.readFileSync('src/types.ts', 'utf8');

const checks = [
  ['package version', pkg.version === manifest.version],
  ['tauri version', tauri.version === manifest.version],
  ['cargo version', new RegExp(`^version = "${manifest.version.replaceAll('.', '\\.') }"$`, 'm').test(cargo)],
  ['identifier preserved', tauri.identifier === 'com.gui.animals.planejador'],
  ['executor state table', rust.includes('CREATE TABLE IF NOT EXISTS executor_state')],
  ['executor progress table', rust.includes('CREATE TABLE IF NOT EXISTS executor_progress')],
  ['content manifest table', rust.includes('CREATE TABLE IF NOT EXISTS content_manifest')],
  ['launch mode command', rust.includes('fn get_launch_mode()')],
  ['game mission alias', projectTypes.includes('export type GameMissionDef = MissionDef')],
  ['two applications', manifest.applications.length === 2],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK' : 'ERRO'}  ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log(`\nEtapa 1 validada: Animals Suite ${manifest.version}.`);
