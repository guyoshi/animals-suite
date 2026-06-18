import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.resolve(process.argv[2] || path.join(root, '..', 'animals_guide', 'Animals - Guia'));
const assetsRoot = path.join(sourceRoot, 'assets');
const outRoot = path.join(root, 'public', 'executor-content');

if (!fs.existsSync(path.join(assetsRoot, 'missions-data.js'))) {
  throw new Error(`Guia não encontrado em: ${sourceRoot}`);
}

fs.rmSync(outRoot, { recursive: true, force: true });
for (const dir of ['roadmap', 'guides', 'scripts', 'reference']) fs.mkdirSync(path.join(outRoot, dir), { recursive: true });

function loadGlobal(file, key) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(assetsRoot, file), 'utf8'), sandbox, { filename: file });
  return sandbox.window[key];
}

function writeJson(relative, value) {
  const target = path.join(outRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function slug(value) {
  return String(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function normaliseGuide(value) {
  if (!value) return '';
  return value === 'provações' ? 'desafios' : value;
}

function preserveCase(match, replacement) {
  if (match === match.toUpperCase()) return replacement.toUpperCase();
  if (match[0] === match[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

const ptBrReplacements = [
  [/\bactualmente\b/giu, 'atualmente'],
  [/\bactualizações\b/giu, 'atualizações'],
  [/\bactualização\b/giu, 'atualização'],
  [/\bactualizado\b/giu, 'atualizado'],
  [/\bactualizada\b/giu, 'atualizada'],
  [/\bactualizados\b/giu, 'atualizados'],
  [/\bactualizadas\b/giu, 'atualizadas'],
  [/\bactualizar\b/giu, 'atualizar'],
  [/\bactual\b/giu, 'atual'],
  [/\bacções\b/giu, 'ações'],
  [/\bacção\b/giu, 'ação'],
  [/\bactivação\b/giu, 'ativação'],
  [/\bactivações\b/giu, 'ativações'],
  [/\bactividade\b/giu, 'atividade'],
  [/\bactividades\b/giu, 'atividades'],
  [/\bactivar\b/giu, 'ativar'],
  [/\bdesactivar\b/giu, 'desativar'],
  [/\breactivar\b/giu, 'reativar'],
  [/\bactivado\b/giu, 'ativado'],
  [/\bactivada\b/giu, 'ativada'],
  [/\bactivados\b/giu, 'ativados'],
  [/\bactivadas\b/giu, 'ativadas'],
  [/\bdesactivado\b/giu, 'desativado'],
  [/\bdesactivada\b/giu, 'desativada'],
  [/\bactivo\b/giu, 'ativo'],
  [/\bactiva\b/giu, 'ativa'],
  [/\bactivos\b/giu, 'ativos'],
  [/\bactivas\b/giu, 'ativas'],
  [/\binteracções\b/giu, 'interações'],
  [/\binteracção\b/giu, 'interação'],
  [/\binteractivo\b/giu, 'interativo'],
  [/\binteractiva\b/giu, 'interativa'],
  [/\bobjectos\b/giu, 'objetos'],
  [/\bobjecto\b/giu, 'objeto'],
  [/\bprojectos\b/giu, 'projetos'],
  [/\bprojecto\b/giu, 'projeto'],
  [/\bficheiros\b/giu, 'arquivos'],
  [/\bficheiro\b/giu, 'arquivo'],
  [/\becrãs\b/giu, 'telas'],
  [/\becrã\b/giu, 'tela'],
  [/\butilizadores\b/giu, 'usuários'],
  [/\butilizador\b/giu, 'usuário'],
  [/\bdirectamente\b/giu, 'diretamente'],
  [/\bdirectos\b/giu, 'diretos'],
  [/\bdirectas\b/giu, 'diretas'],
  [/\bdirecto\b/giu, 'direto'],
  [/\bdirecta\b/giu, 'direta'],
  [/\bdirecções\b/giu, 'direções'],
  [/\bdirecção\b/giu, 'direção'],
  [/\bexactamente\b/giu, 'exatamente'],
  [/\bexactos\b/giu, 'exatos'],
  [/\bexactas\b/giu, 'exatas'],
  [/\bexacto\b/giu, 'exato'],
  [/\bexacta\b/giu, 'exata'],
  [/\bsecções\b/giu, 'seções'],
  [/\bsecção\b/giu, 'seção'],
  [/\bselecções\b/giu, 'seleções'],
  [/\bselecção\b/giu, 'seleção'],
  [/\bseleccionado\b/giu, 'selecionado'],
  [/\bseleccionada\b/giu, 'selecionada'],
  [/\bseleccionar\b/giu, 'selecionar'],
  [/\bcoleccionáveis\b/giu, 'colecionáveis'],
  [/\bcoleccionável\b/giu, 'colecionável'],
  [/\bcolecções\b/giu, 'coleções'],
  [/\bcolecção\b/giu, 'coleção'],
  [/\bprotecções\b/giu, 'proteções'],
  [/\bprotecção\b/giu, 'proteção'],
  [/\bcontactos\b/giu, 'contatos'],
  [/\bcontacto\b/giu, 'contato'],
  [/\bfactos\b/giu, 'fatos'],
  [/\bfacto\b/giu, 'fato'],
  [/\bóptimo\b/giu, 'ótimo'],
  [/\bóptima\b/giu, 'ótima'],
  [/\bprimeiro arranque\b/giu, 'primeira inicialização'],
  [/\bno arranque\b/giu, 'na inicialização'],
  [/\bjogo arranque\b/giu, 'jogo inicie'],
  [/\barranque que\b/giu, 'impulso que'],
  [/\bdirectores\b/giu, 'diretores'],
  [/\bdirector\b/giu, 'diretor'],
  [/\bcâmaras\b/giu, 'câmeras'],
  [/\bcâmara\b/giu, 'câmera'],
  [/\boptimizações\b/giu, 'otimizações'],
  [/\boptimização\b/giu, 'otimização'],
  [/\boptimizar\b/giu, 'otimizar'],
  [/\boptimizado\b/giu, 'otimizado'],
  [/\bregistos\b/giu, 'registros'],
  [/\bregisto\b/giu, 'registro'],
  [/\bregistar\b/giu, 'registrar'],
  [/\bsítios\b/giu, 'locais'],
  [/\bsítio\b/giu, 'local'],
  [/\bconsoante\b/giu, 'conforme'],
  [/\bautoguardar\b/giu, 'salvamento automático'],
  [/\brecolhidos\b/giu, 'coletados'],
  [/\brecolhidas\b/giu, 'coletadas'],
  [/\brecolhido\b/giu, 'coletado'],
  [/\brecolhida\b/giu, 'coletada'],
  [/\brecolher\b/giu, 'coletar'],
  [/\brecolha\b/giu, 'coleta'],
  [/\brecolhe\b/giu, 'coleta'],
  [/\bapanhar\b/giu, 'coletar'],
  [/\bapanha\b/giu, 'coleta'],
  [/\bcolectados\b/giu, 'coletados'],
  [/\bcolectadas\b/giu, 'coletadas'],
  [/\bcolectado\b/giu, 'coletado'],
  [/\bcolectada\b/giu, 'coletada'],
  [/\bcolectar\b/giu, 'coletar'],
  [/\bcolecta\b/giu, 'coleta'],
  [/\bobjectivos\b/giu, 'objetivos'],
  [/\bobjectivo\b/giu, 'objetivo'],
  [/\breacções\b/giu, 'reações'],
  [/\breacção\b/giu, 'reação'],
  [/\bsubtracções\b/giu, 'subtrações'],
  [/\bsubtracção\b/giu, 'subtração'],
  [/\bfracções\b/giu, 'frações'],
  [/\bfracção\b/giu, 'fração'],
  [/actualiz/giu, 'atualiz'],
  [/ecrãs/giu, 'telas'],
  [/ecrã/giu, 'tela'],
  [/direcções/giu, 'direções'],
  [/direcção/giu, 'direção'],
  [/coleccionáveis/giu, 'colecionáveis'],
  [/coleccionável/giu, 'colecionável'],
  [/coleccionaveis/giu, 'colecionaveis'],
  [/coleccionavel/giu, 'colecionavel'],
  [/\bpremir\b/giu, 'pressionar'],
  [/\bteus\b/giu, 'seus'],
  [/\btuas\b/giu, 'suas'],
  [/\bteu\b/giu, 'seu'],
  [/\btua\b/giu, 'sua'],
  [/\btens\b/giu, 'você tem'],
  [/\bpodes\b/giu, 'você pode'],
  [/\bprecisas\b/giu, 'você precisa'],
  [/\bvais\b/giu, 'você vai'],
  [/\bbotão do rato\b/giu, 'botão do mouse'],
  [/\broda do rato\b/giu, 'roda do mouse'],
];

function toPtBrText(value) {
  if (typeof value !== 'string' || !value) return value || '';
  return ptBrReplacements.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, match => preserveCase(match, replacement)),
    value,
  );
}

function toPtBrHtml(html) {
  const parts = String(html || '').split(/(<[^>]+>)/g);
  let technicalDepth = 0;
  return parts.map(part => {
    if (!part.startsWith('<')) return technicalDepth > 0 ? part : toPtBrText(part);
    if (/^<\/(code|pre)\b/i.test(part)) technicalDepth = Math.max(0, technicalDepth - 1);
    const result = part;
    if (/^<(code|pre)\b/i.test(part) && !/\/\s*>$/.test(part)) technicalDepth += 1;
    return result;
  }).join('');
}

function translateStringArray(values) {
  return (values || []).map(value => toPtBrText(value));
}

function sanitizeHtml(html) {
  return String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
}

function textFromHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function tocFromHtml(html) {
  const toc = [];
  const used = new Set();
  const transformed = html.replace(/<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, body) => {
    const existing = attrs.match(/\sid=(['"])(.*?)\1/i)?.[2];
    const label = textFromHtml(body);
    let id = existing || slug(label) || `secao-${toc.length + 1}`;
    let unique = id;
    let suffix = 2;
    while (used.has(unique)) unique = `${id}-${suffix++}`;
    used.add(unique);
    toc.push({ id: unique, level: Number(level), label });
    const cleanAttrs = attrs.replace(/\sid=(['"])(.*?)\1/i, '');
    return `<h${level}${cleanAttrs} id="${unique}">${body}</h${level}>`;
  });
  return { html: transformed, toc };
}

const rawMissions = loadGlobal('missions-data.js', 'ANIMALS_MISSIONS');
const phaseNames = [...new Set(rawMissions.map(item => item.phase))];
const stages = phaseNames.map((title, index) => ({
  id: `build-stage-${String(index + 1).padStart(2, '0')}`,
  number: index + 1,
  title: toPtBrText(title),
  missionIds: rawMissions.filter(item => item.phase === title).map(item => `build-mission-${String(item.id).padStart(3, '0')}`),
}));

let taskCount = 0;
let stepCount = 0;
const missions = rawMissions.map((mission) => {
  const missionId = `build-mission-${String(mission.id).padStart(3, '0')}`;
  const stageId = stages.find(stage => stage.title === mission.phase)?.id;
  const tasks = (mission.tasks || []).map((task, taskIndex) => {
    taskCount += 1;
    const codeSlug = slug(task.code) || String(taskIndex + 1).padStart(2, '0');
    const taskId = `${missionId}-task-${codeSlug}`;
    const steps = (task.steps || []).map((step, stepIndex) => {
      stepCount += 1;
      return {
        id: `${taskId}-step-${String(stepIndex + 1).padStart(3, '0')}`,
        index: stepIndex,
        title: toPtBrText(step.title || `Step ${stepIndex + 1}`),
        actions: translateStringArray(step.actions),
        expected: toPtBrText(step.expected || ''),
        trouble: toPtBrText(step.trouble || ''),
        why: toPtBrText(step.why || ''),
        guide: normaliseGuide(step.guide || task.guide || mission.guide),
        art: toPtBrText(step.art || ''),
        preset: toPtBrText(step.preset || ''),
      };
    });
    return {
      id: taskId,
      index: taskIndex,
      code: task.code,
      title: toPtBrText(task.title),
      purpose: toPtBrText(task.purpose || ''),
      result: toPtBrText(task.result || ''),
      guide: normaliseGuide(task.guide || mission.guide),
      scripts: task.scripts || [],
      art: toPtBrText(task.art || ''),
      preset: toPtBrText(task.preset || ''),
      steps,
    };
  });
  return {
    id: missionId,
    legacyId: mission.id,
    number: mission.id,
    stageId,
    phase: toPtBrText(mission.phase),
    title: toPtBrText(mission.title),
    summary: toPtBrText(mission.summary || ''),
    objective: toPtBrText(mission.objective || ''),
    result: toPtBrText(mission.result || ''),
    sourceStatus: toPtBrText(mission.status || ''),
    detailed: tasks.length > 0,
    roadmap: Boolean(mission.roadmap),
    guide: normaliseGuide(mission.guide),
    scripts: mission.scripts || [],
    warnings: translateStringArray(mission.warnings),
    prerequisites: translateStringArray(mission.prerequisites),
    art: toPtBrText(mission.art || ''),
    preset: toPtBrText(mission.preset || ''),
    tasks,
  };
});
writeJson('roadmap/stages.json', stages);
writeJson('roadmap/missions.json', missions);
writeJson('roadmap/index.json', missions.map(mission => ({
  id: mission.id,
  legacyId: mission.legacyId,
  number: mission.number,
  stageId: mission.stageId,
  phase: toPtBrText(mission.phase),
  title: toPtBrText(mission.title),
  summary: mission.summary,
  detailed: mission.detailed,
  roadmap: mission.roadmap,
  taskCount: mission.tasks.length,
  stepCount: mission.tasks.reduce((sum, task) => sum + task.steps.length, 0),
  scripts: mission.scripts,
  guide: mission.guide,
})));

const guideIndex = loadGlobal('guides-index.js', 'ANIMALS_GUIDES');
const guideMeta = new Map(guideIndex.map(item => [item.slug, item]));
const additions = {
  debug: { slug: 'debug', title: 'Animals Debug Panel', category: 'Ferramentas', source: 'LEIA-ME_AnimalsDebugPanel.txt', summary: 'Tutorial de utilização do painel de desenvolvimento e das ferramentas de teste.' },
  'gdd-final': { slug: 'gdd-final', title: 'GDD vigente — 18/06/2026', category: 'GDD', source: 'Animals-GDD-18-06.docx', summary: 'Game Design Document consolidado e vigente do projeto Animals.' },
  menus16: { slug: 'menus16', title: 'Menus, Emblemas e Pós-game — referência 16/06', category: 'Histórico técnico', source: 'Guia_Menus_Emblemas_PosGame_16-06.md', summary: 'Referência histórica preservada para ligações antigas do roteiro.' },
  sistemas17: { slug: 'sistemas17', title: 'Sistemas e decisões — 17/06', category: 'Histórico técnico', source: 'ALTERACOES_17-06_REV2.txt', summary: 'Registo histórico da atualização de 17/06.' },
};
for (const [key, value] of Object.entries(additions)) if (!guideMeta.has(key)) guideMeta.set(key, value);

const guideFiles = fs.readdirSync(path.join(assetsRoot, 'guides')).filter(file => file.endsWith('.js')).sort();
const guides = [];
for (const file of guideFiles) {
  const guideSlug = file.slice(0, -3);
  const raw = loadGlobal(path.join('guides', file), 'ANIMALS_GUIDE_CONTENT');
  const meta = guideMeta.get(guideSlug) || { slug: guideSlug, title: raw?.title || guideSlug, category: 'Referência', source: file, summary: raw?.summary || '' };
  const sanitized = toPtBrHtml(sanitizeHtml(raw?.html || ''));
  const withToc = tocFromHtml(sanitized);
  const guide = {
    slug: guideSlug,
    title: toPtBrText(meta.title || raw?.title || guideSlug),
    category: toPtBrText(meta.category || 'Referência'),
    source: meta.source || file,
    summary: toPtBrText(meta.summary || raw?.summary || ''),
    html: withToc.html,
    toc: withToc.toc,
    searchText: textFromHtml(withToc.html),
    historical: /histórico|auditoria/i.test(meta.category || ''),
  };
  guides.push({ ...guide, html: undefined });
  writeJson(`guides/${guideSlug}.json`, guide);
}
writeJson('guides/index.json', guides);

const scriptData = loadGlobal('scripts-data.js', 'ANIMALS_SCRIPT_DATA');
const primaryToId = new Map();
const pathToId = new Map();
for (const [index, file] of scriptData.files.entries()) {
  let id = `script-${slug(file.path)}`;
  if (pathToId.has(id)) id = `${id}-${index + 1}`;
  pathToId.set(file.path, id);
  if (file.primary) primaryToId.set(file.primary, id);
  primaryToId.set(file.filename?.replace(/\.cs$/i, ''), id);
}
const scriptIndex = [];
for (const file of scriptData.files) {
  const id = pathToId.get(file.path);
  const dependencyIds = (file.dependencies || []).map(name => primaryToId.get(name)).filter(Boolean);
  const usedByIds = (file.used_by || []).map(name => primaryToId.get(name)).filter(Boolean);
  const detail = {
    ...file,
    id,
    summary: toPtBrText(file.summary || ''),
    attach: toPtBrText(file.attach || ''),
    fields: (file.fields || []).map(field => ({ ...field, description: toPtBrText(field.description || '') })),
    methods: (file.methods || []).map(method => ({ ...method, description: toPtBrText(method.description || '') })),
    dependencyIds,
    usedByIds,
  };
  const item = {
    id,
    path: file.path,
    filename: file.filename,
    category: file.category,
    primary: file.primary,
    kind: file.kind,
    summary: toPtBrText(file.summary || ''),
    attach: toPtBrText(file.attach || ''),
    types: file.types || [],
    dependencies: file.dependencies || [],
    dependencyIds,
    usedBy: file.used_by || [],
    usedByIds,
    fieldNames: (file.fields || []).map(field => `${field.name} ${field.type} ${field.section || ''}`),
    methodNames: (file.methods || []).map(method => `${method.name} ${method.return_type || method.returnType || ''}`),
  };
  scriptIndex.push(item);
  writeJson(`scripts/${id}.json`, detail);
}
writeJson('scripts/index.json', {
  version: scriptData.version,
  count: scriptData.count,
  categories: scriptData.categories,
  files: scriptIndex,
});

const systems = loadGlobal('systems-data.js', 'ANIMALS_SYSTEMS');
const sprites = loadGlobal('sprites-data.js', 'ANIMALS_SPRITES');
writeJson('reference/systems.json', systems);
writeJson('reference/sprites.json', sprites);

const refs = new Set();
for (const mission of missions) {
  if (mission.guide) refs.add(mission.guide);
  for (const task of mission.tasks) {
    if (task.guide) refs.add(task.guide);
    for (const step of task.steps) if (step.guide) refs.add(step.guide);
  }
}
for (const item of systems.completedSystems || []) if (item.guide) refs.add(normaliseGuide(item.guide));
const guideSlugs = new Set(guides.map(item => item.slug));
const missingGuideRefs = [...refs].filter(ref => !guideSlugs.has(ref));
const duplicateScriptIds = scriptIndex.filter((item, index) => scriptIndex.findIndex(other => other.id === item.id) !== index).map(item => item.id);

const manifest = {
  version: '2026.06.18-stage2',
  generatedAt: new Date().toISOString(),
  sourceVersion: scriptData.version,
  desktopOnly: true,
  counts: {
    stages: stages.length,
    missions: missions.length,
    detailedMissions: missions.filter(item => item.detailed).length,
    plannedMissions: missions.filter(item => !item.detailed).length,
    tasks: taskCount,
    steps: stepCount,
    guides: guides.length,
    scripts: scriptIndex.length,
  },
  validation: {
    missingGuideRefs,
    duplicateScriptIds,
    missionIdsUnique: new Set(missions.map(item => item.id)).size === missions.length,
    stepIdsUnique: new Set(missions.flatMap(m => m.tasks.flatMap(t => t.steps.map(s => s.id)))).size === stepCount,
  },
};
writeJson('manifest.json', manifest);

if (missingGuideRefs.length || duplicateScriptIds.length || taskCount !== 277 || stepCount !== 1099 || missions.length !== 96 || scriptIndex.length !== 278) {
  console.error(JSON.stringify(manifest, null, 2));
  process.exit(1);
}
console.log(`Conteúdo migrado: ${missions.length} missões, ${taskCount} tarefas, ${stepCount} steps, ${guides.length} guias e ${scriptIndex.length} scripts.`);
