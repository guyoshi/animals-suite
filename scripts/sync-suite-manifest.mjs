import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'suite.manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = String(manifest.version);

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.name = 'animals-suite';
pkg.version = version;
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

const packageLockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  const lock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
  lock.name = 'animals-suite';
  lock.version = version;
  if (lock.packages?.['']) {
    lock.packages[''].name = 'animals-suite';
    lock.packages[''].version = version;
  }
  fs.writeFileSync(packageLockPath, `${JSON.stringify(lock, null, 2)}
`);
}

const tauriPath = path.join(root, 'src-tauri', 'tauri.conf.json');
const tauri = JSON.parse(fs.readFileSync(tauriPath, 'utf8'));
tauri.productName = `${manifest.suiteName} ${version}`;
tauri.version = version;
tauri.app.windows[0].title = `${manifest.suiteName} ${version}`;
tauri.bundle.shortDescription = 'Planejador e executor de produção do projeto Animals';
tauri.bundle.longDescription = 'Suite integrada para planejar o jogo Animals, executar o roteiro de produção, consultar documentação técnica e acompanhar testes no Unity.';
fs.writeFileSync(tauriPath, `${JSON.stringify(tauri, null, 2)}\n`);

const cargoPath = path.join(root, 'src-tauri', 'Cargo.toml');
let cargo = fs.readFileSync(cargoPath, 'utf8');
cargo = cargo.replace(/^(version\s*=\s*)"[^"]+"/m, `$1"${version}"`);
cargo = cargo.replace(/^(description\s*=\s*)"[^"]+"/m, '$1"Suite integrada de planejamento e execução do projeto Animals"');
fs.writeFileSync(cargoPath, cargo);

console.log(`Animals Suite: versões sincronizadas para ${version}.`);
