import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicKey = process.env.ANIMALS_UPDATE_PUBKEY?.trim();
const endpoint = process.env.ANIMALS_UPDATE_ENDPOINT?.trim();

if (!publicKey) {
  throw new Error(
    'O secret TAURI_UPDATER_PUBLIC_KEY está vazio. Configure-o em Settings > Secrets and variables > Actions.'
  );
}

if (!endpoint) {
  throw new Error('ANIMALS_UPDATE_ENDPOINT está vazio.');
}

let parsedEndpoint;
try {
  parsedEndpoint = new URL(endpoint);
} catch {
  throw new Error(`ANIMALS_UPDATE_ENDPOINT não é uma URL válida: ${endpoint}`);
}

if (parsedEndpoint.protocol !== 'https:') {
  throw new Error('O endpoint do atualizador precisa usar HTTPS.');
}

const config = {
  $schema: 'https://schema.tauri.app/config/2',
  bundle: {
    createUpdaterArtifacts: true,
  },
  plugins: {
    updater: {
      pubkey: publicKey,
      endpoints: [endpoint],
      windows: {
        installMode: 'passive',
      },
    },
  },
};

const outputPath = path.join(
  root,
  'src-tauri',
  'tauri.updater.generated.conf.json'
);

fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`Configuração do atualizador criada em ${outputPath}`);
