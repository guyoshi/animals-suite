import { hasPlannerMusicAttachment } from './musicAttachments';
import type {
  AreaDef, EntityRef, EntityStatus, ProjectState,
} from '../types';
import { collectRelations } from './relations';

export type ProductionKind =
  | 'area' | 'animal' | 'npc' | 'mission' | 'enemy' | 'item' | 'mechanic'
  | 'challenge' | 'boss' | 'rumor' | 'whisper' | 'music' | 'areaResource';

export interface ProductionRow {
  key: string;
  type: ProductionKind;
  typeLabel: string;
  id: string;
  parentId?: string;
  name: string;
  worldId?: string;
  areaId?: string;
  status: EntityStatus;
  placed: boolean;
  relationCount: number;
  archived: boolean;
  route: string;
  notes: string;
}

export interface MetricDetail {
  key: string;
  label: string;
  planned: number;
  created: number;
  placed: number;
  unity: number;
  errors: number;
  withoutRelations: number;
  route: string;
  type?: ProductionKind;
}

export interface PlanningWarning {
  id: string;
  severity: 'info' | 'warning' | 'error';
  category: 'produção' | 'mapa' | 'relações' | 'habilidades' | 'economia';
  text: string;
  route: string;
  worldId?: string;
  areaId?: string;
}

export interface AbilityCoverage {
  key: string;
  animalId: string;
  animalName: string;
  worldId: string;
  ability: string;
  teachingAreaId?: string;
  reinforcementAreaIds: string[];
  secretAreaIds: string[];
  challengeIds: string[];
  bossIds: string[];
  explicitUses: number;
  score: number;
  state: 'insuficiente' | 'equilibrada' | 'excessiva';
  notes: string[];
}

export interface CategoryCoverage {
  category: string;
  areaIds: string[];
  mechanicIds: string[];
  challengeIds: string[];
  bossIds: string[];
  score: number;
}

export interface AreaSuggestion {
  id: string;
  priority: 'alta' | 'média' | 'baixa';
  title: string;
  text: string;
  reason: string;
  relatedAnimalIds?: string[];
  relatedAbility?: string;
}

export interface GaiaValidation {
  warnings: PlanningWarning[];
  depths: Record<string, number>;
  routeBudgets: Array<{
    areaId: string;
    depth: number;
    minimumCost: number;
    availableBefore: number;
    affordable: boolean;
  }>;
  worldSimulations: Array<{
    worldId: string;
    worldName: string;
    entryCost: number;
    runesBefore: number;
    runesAfterEstimate: number;
    viableAsFirst: boolean;
    issueCount: number;
  }>;
  branchCoverage: Array<{
    worldId: string;
    worldName: string;
    depth: number;
    categories: string[];
    animalsUsed: string[];
    weakCategories: string[];
  }>;
}

const TYPE_LABEL: Record<ProductionKind, string> = {
  area: 'Áreas', animal: 'Animais', npc: 'NPCs', mission: 'Missões', enemy: 'Inimigos',
  item: 'Itens', mechanic: 'Mecânicas', challenge: 'Desafios', boss: 'Bosses', rumor: 'Rumores',
  whisper: 'Sussurros', music: 'Músicas', areaResource: 'Recursos locais',
};

export function buildProductionRows(project: ProjectState): ProductionRow[] {
  const relationCounts = new Map<string, number>();
  for (const relation of collectRelations(project)) {
    increment(relationCounts, refKey(relation.from));
    increment(relationCounts, refKey(relation.to));
  }
  const mapObjects = project.maps.flatMap(map => map.objects.map(object => ({ areaId: map.areaId, object })));
  const hasPlaced = (id: string) => mapObjects.some(row => !row.object.archived && (row.object.resourceId === id || row.object.id === id));
  const rows: ProductionRow[] = [];
  const add = (row: Omit<ProductionRow, 'key' | 'typeLabel' | 'relationCount'>, ref: EntityRef) => rows.push({
    ...row,
    key: `${row.type}:${row.parentId ?? ''}:${row.id}`,
    typeLabel: TYPE_LABEL[row.type],
    relationCount: relationCounts.get(refKey(ref)) ?? 0,
  });

  for (const area of project.areas) add({
    type: 'area', id: area.id, name: area.name, worldId: area.worldId, areaId: area.id,
    status: inferAreaStatus(project, area), placed: project.worldMap.nodes.some(node => node.areaId === area.id),
    archived: false, route: `/area/${area.id}`, notes: area.notes,
  }, { type: 'area', id: area.id });
  for (const animal of project.animals) add({
    type: 'animal', id: animal.id, name: animal.name, worldId: animal.worldId, areaId: animal.unlockAreaId,
    status: animal.primaryAbility ? 'planejado' : 'erro', placed: hasPlaced(animal.id), archived: false,
    route: `/animals?entity=${encodeURIComponent(animal.id)}`, notes: animal.primaryAbility ?? animal.abilities.join(', '),
  }, { type: 'animal', id: animal.id });
  for (const npc of project.npcs) add({
    type: 'npc', id: npc.id, name: npc.name, worldId: npc.worldId, areaId: npc.rescueAreaId ?? npc.villageAreaId,
    status: npc.status, placed: hasPlaced(npc.id) || project.villages.some(v => v.npcPlacements.some(p => p.npcId === npc.id)),
    archived: npc.archived, route: `/npcs?entity=${encodeURIComponent(npc.id)}`, notes: npc.notes,
  }, { type: 'npc', id: npc.id });
  for (const mission of project.missions) add({
    type: 'mission', id: mission.id, name: mission.name, worldId: mission.worldId, areaId: mission.suggestedAreaId ?? mission.areaIds[0],
    status: mission.status, placed: mission.tasks.some(task => task.completionLinks.some(link => Boolean(link.mapPointId))),
    archived: mission.archived, route: `/missions?entity=${encodeURIComponent(mission.id)}`, notes: mission.notes ?? '',
  }, { type: 'mission', id: mission.id });
  for (const enemy of project.enemies) add({
    type: 'enemy', id: enemy.id, name: enemy.name, status: enemy.status, placed: hasPlaced(enemy.id), archived: enemy.archived,
    route: `/enemies?entity=${encodeURIComponent(enemy.id)}`, notes: enemy.notes,
  }, { type: 'enemy', id: enemy.id });
  for (const item of project.items) add({
    type: 'item', id: item.id, name: item.name, worldId: item.worldId, status: item.status, placed: hasPlaced(item.id), archived: item.archived,
    route: `/items?entity=${encodeURIComponent(item.id)}`, notes: item.notes,
  }, { type: 'item', id: item.id });
  for (const mechanic of project.mechanics) add({
    type: 'mechanic', id: mechanic.id, name: mechanic.name, areaId: mechanic.firstSuggestedAreaId,
    status: mechanic.source === 'Script' ? 'unity' : 'planejado', placed: hasPlaced(mechanic.id), archived: mechanic.archived,
    route: `/mechanics?entity=${encodeURIComponent(mechanic.id)}`, notes: mechanic.description,
  }, { type: 'mechanic', id: mechanic.id });
  for (const challenge of project.challenges) add({
    type: 'challenge', id: challenge.id, name: challenge.name, areaId: challenge.areaId,
    worldId: project.areas.find(a => a.id === challenge.areaId)?.worldId, status: challenge.status,
    placed: Boolean(challenge.portalMapObjectId && hasPlaced(challenge.portalMapObjectId)), archived: challenge.archived,
    route: `/area/${challenge.areaId}?tab=resources&entity=${encodeURIComponent(challenge.id)}`, notes: challenge.objective,
  }, { type: 'challenge', id: challenge.id });
  for (const boss of project.bosses) add({
    type: 'boss', id: boss.id, name: boss.name, worldId: boss.worldId, areaId: boss.areaId,
    status: boss.status, placed: project.worldMap.nodes.some(node => node.areaId === boss.areaId), archived: boss.archived ?? false,
    route: `/bosses?entity=${encodeURIComponent(boss.id)}`, notes: boss.notes,
  }, { type: 'boss', id: boss.id });
  for (const rumor of project.rumors) add({
    type: 'rumor', id: rumor.id, name: rumor.title, worldId: rumor.worldId, areaId: rumor.targetAreaIds[0],
    status: rumor.status, placed: false, archived: rumor.archived, route: `/lore?entity=${encodeURIComponent(rumor.id)}`, notes: rumor.text,
  }, { type: 'rumor', id: rumor.id });
  for (const whisper of project.whispers) add({
    type: 'whisper', id: whisper.id, name: whisper.phrase || whisper.id, areaId: whisper.areaId,
    worldId: project.areas.find(a => a.id === whisper.areaId)?.worldId, status: whisper.status, placed: hasPlaced(whisper.id),
    archived: whisper.archived, route: `/area/${whisper.areaId}?tab=resources&entity=${encodeURIComponent(whisper.id)}`, notes: whisper.rewardNote,
  }, { type: 'whisper', id: whisper.id });
  for (const track of project.music) add({
    type: 'music', id: track.id, name: track.title, worldId: track.worldId, areaId: track.areaIds?.[0]??track.areaId,
    status: hasPlannerMusicAttachment(track) ? 'unity' : 'planejado', placed: Boolean(track.areaIds?.length || track.areaId || track.worldId), archived: track.archived ?? false,
    route: `/music?entity=${encodeURIComponent(track.id)}`, notes: track.notes,
  }, { type: 'music', id: track.id });
  for (const resource of project.areaResources) add({
    type: 'areaResource', id: resource.id, parentId: resource.areaId, name: resource.name, areaId: resource.areaId,
    worldId: project.areas.find(a => a.id === resource.areaId)?.worldId, status: resource.status,
    placed: Boolean(resource.mapObjectId && hasPlaced(resource.mapObjectId)), archived: resource.archived,
    route: `/area/${resource.areaId}?tab=resources&entity=${encodeURIComponent(resource.id)}`, notes: resource.notes,
  }, { type: 'areaResource', id: resource.id, parentId: resource.areaId });
  return rows;
}

export function buildMetricDetails(project: ProjectState, rows = buildProductionRows(project)): MetricDetail[] {
  const active = rows.filter(row => !row.archived);
  const metric = (key: string, label: string, type: ProductionKind, planned: number, route = `/production?type=${type}`): MetricDetail => {
    const list = active.filter(row => row.type === type);
    return {
      key, label, type, planned, created: list.length, placed: list.filter(row => row.placed).length,
      unity: list.filter(row => row.status === 'unity').length, errors: list.filter(row => row.status === 'erro').length,
      withoutRelations: list.filter(row => row.relationCount === 0).length, route,
    };
  };
  const runeRows = active.filter(row => row.type === 'areaResource' && project.areaResources.find(r => r.id === row.id)?.kind === 'rune');
  const chestRows = active.filter(row => row.type === 'areaResource' && project.areaResources.find(r => r.id === row.id)?.kind === 'chest');
  const fragmentRows = active.filter(row => row.type === 'areaResource' && project.areaResources.find(r => r.id === row.id)?.kind === 'fragment');
  const customMetric = (key: string, label: string, list: ProductionRow[], planned: number, filter: string): MetricDetail => ({
    key, label, planned, created: list.length, placed: list.filter(row => row.placed).length,
    unity: list.filter(row => row.status === 'unity').length, errors: list.filter(row => row.status === 'erro').length,
    withoutRelations: list.filter(row => row.relationCount === 0).length, route: `/production?filter=${filter}`,
  });
  return [
    metric('areas', 'Áreas', 'area', project.areas.length),
    metric('animals', 'Animais', 'animal', 34),
    metric('npcs', 'NPCs', 'npc', project.areas.reduce((sum, area) => sum + area.npcTarget, 0)),
    metric('missions', 'Missões', 'mission', project.missions.length),
    metric('enemies', 'Inimigos', 'enemy', project.enemies.length),
    metric('mechanics', 'Mecânicas', 'mechanic', project.mechanics.length),
    metric('challenges', 'Desafios', 'challenge', project.challenges.length),
    metric('bosses', 'Bosses', 'boss', 8),
    customMetric('runes', 'Runas', runeRows, 361, 'runes'),
    customMetric('chests', 'Baús', chestRows, project.areas.reduce((sum, area) => sum + area.chestTarget, 0), 'chests'),
    customMetric('fragments', 'Fragmentos', fragmentRows, project.areas.reduce((sum, area) => sum + area.fragmentTarget, 0), 'fragments'),
  ];
}

export function buildWarnings(project: ProjectState): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];
  const add = (warning: PlanningWarning) => warnings.push(warning);
  for (const area of project.areas) {
    const map = project.maps.find(m => m.areaId === area.id);
    if (area.type !== 'boss' && area.type !== 'vila' && map && !map.objects.some(o => o.type === 'entry' && !o.archived)) add({ id:`entry-${area.id}`, severity:'error', category:'mapa', text:`${area.name} não possui entrada obrigatória no mapa.`, route:`/area/${area.id}/map`, worldId:area.worldId, areaId:area.id });
    const placedRunes = map?.objects.filter(o => !o.archived && o.resourceType === 'rune').length ?? 0;
    if (placedRunes < area.runeTarget) add({ id:`runes-${area.id}`, severity:'warning', category:'produção', text:`${area.name}: faltam ${area.runeTarget - placedRunes} Runas no mapa.`, route:`/area/${area.id}/map`, worldId:area.worldId, areaId:area.id });
    if ((area.centralMechanicIds?.length ?? 0) === 0 && area.type === 'fase') add({ id:`mechanic-${area.id}`, severity:'warning', category:'habilidades', text:`${area.name} não possui mecânica central selecionada.`, route:`/area/${area.id}?tab=level`, worldId:area.worldId, areaId:area.id });
  }
  for (const mission of project.missions.filter(m => !m.archived)) {
    const ids = new Set<string>();
    for (const task of mission.tasks.filter(t => !t.archived)) {
      const duplicate = ids.has(task.id); ids.add(task.id);
      const noCompletion = task.completionLinks.length === 0 && task.autoCompleteConditions.length === 0;
      const missingDependency = task.dependsOnTaskIds.some(id => !mission.tasks.some(other => other.id === id && !other.archived));
      if (!task.id || duplicate || noCompletion || missingDependency) add({ id:`mission-${mission.id}-${task.id}`, severity:'error', category:'produção', text:`${mission.name}: a tarefa “${task.title}” possui ID, conclusão ou dependência inválida.`, route:`/missions?entity=${encodeURIComponent(mission.id)}`, worldId:mission.worldId });
    }
  }
  for (const challenge of project.challenges.filter(c => !c.archived)) {
    if (!challenge.portalMapObjectId) add({ id:`challenge-map-${challenge.id}`, severity:'warning', category:'mapa', text:`O desafio “${challenge.name}” ainda não possui portal no mapa.`, route:`/area/${challenge.areaId}/map`, areaId:challenge.areaId });
    if (!(challenge.primaryReward ?? challenge.reward)) add({ id:`challenge-reward-${challenge.id}`, severity:'warning', category:'produção', text:`O desafio “${challenge.name}” não possui recompensa principal.`, route:`/area/${challenge.areaId}?tab=resources`, areaId:challenge.areaId });
  }
  const rows = buildProductionRows(project);
  for (const row of rows.filter(row => !row.archived && row.status === 'erro')) add({ id:`status-${row.key}`, severity:'error', category:'produção', text:`${row.typeLabel}: “${row.name}” está marcado com erro no Unity.`, route:row.route, worldId:row.worldId, areaId:row.areaId });
  for (const row of rows.filter(row => !row.archived && row.relationCount === 0 && ['npc','mission','enemy','item','challenge','mechanic'].includes(row.type))) add({ id:`relation-${row.key}`, severity:'info', category:'relações', text:`${row.typeLabel}: “${row.name}” ainda não possui relações.`, route:row.route, worldId:row.worldId, areaId:row.areaId });
  const coverage = buildAbilityCoverage(project);
  for (const ability of coverage.filter(row => row.state === 'insuficiente')) add({ id:`ability-${ability.key}`, severity:'warning', category:'habilidades', text:`${ability.ability} de ${ability.animalName} está subutilizada.`, route:`/coverage?animal=${encodeURIComponent(ability.animalId)}`, worldId:ability.worldId });
  return [...warnings, ...validateGaiaMap(project).warnings].filter((warning, index, list) => list.findIndex(other => other.id === warning.id) === index);
}

export function buildAbilityCoverage(project: ProjectState): AbilityCoverage[] {
  const areasByWorld = new Map<string, AreaDef[]>();
  for (const world of project.worlds) areasByWorld.set(world.id, project.areas.filter(area => area.worldId === world.id));
  const result: AbilityCoverage[] = [];
  for (const animal of project.animals) {
    const abilities = unique([animal.primaryAbility, ...(animal.contextualInteractions ?? []), ...animal.abilities].filter(Boolean) as string[]);
    for (const ability of abilities) {
      const abilityTerms = terms(ability);
      const animalTerms = terms(animal.name);
      const worldAreas = areasByWorld.get(animal.worldId) ?? [];
      const reinforcementAreaIds = worldAreas.filter(area => area.id !== animal.unlockAreaId && textIncludes(areaText(project, area), [...abilityTerms, ...animalTerms])).map(area => area.id);
      const secretAreaIds = worldAreas.filter(area => textIncludes(normal(`${area.secretsPlan ?? ''} ${area.shortcutsPlan ?? ''}`), [...abilityTerms, ...animalTerms])).map(area => area.id);
      const challengeIds = project.challenges.filter(challenge => !challenge.archived && (
        challenge.recommendedAnimalIds.includes(animal.id) || challenge.recommendedAbilities.some(value => textIncludes(normal(value), abilityTerms))
      )).map(challenge => challenge.id);
      const bossIds = project.bosses.filter(boss => !boss.archived && boss.phases.some(phase => phase.recommendedAnimalIds.includes(animal.id) || phase.recommendedAbilities.some(value => textIncludes(normal(value), abilityTerms)))).map(boss => boss.id);
      const explicitUses = reinforcementAreaIds.length + secretAreaIds.length + challengeIds.length + bossIds.length;
      const teaching = animal.unlockAreaId && project.areas.some(area => area.id === animal.unlockAreaId) ? 1 : 0;
      const score = teaching + Math.min(3, reinforcementAreaIds.length) + Math.min(2, secretAreaIds.length) + Math.min(2, challengeIds.length) + Math.min(2, bossIds.length);
      const state: AbilityCoverage['state'] = score < 3 ? 'insuficiente' : score > 8 ? 'excessiva' : 'equilibrada';
      const notes: string[] = [];
      if (!teaching) notes.push('Sem área de ensino definida.');
      if (reinforcementAreaIds.length === 0) notes.push('Sem reforço explícito noutra área do mundo.');
      if (secretAreaIds.length === 0) notes.push('Sem uso claro em segredo ou rota alternativa.');
      if (bossIds.length === 0) notes.push('Não aparece nas fases do boss local.');
      if (challengeIds.length === 0) notes.push('Não aparece em desafios.');
      if (state === 'excessiva') notes.push('A habilidade aparece muitas vezes; considere variar as soluções.');
      result.push({
        key:`${animal.id}:${slug(ability)}`, animalId:animal.id, animalName:animal.name, worldId:animal.worldId,
        ability, teachingAreaId:animal.unlockAreaId || undefined, reinforcementAreaIds:unique(reinforcementAreaIds),
        secretAreaIds:unique(secretAreaIds), challengeIds:unique(challengeIds), bossIds:unique(bossIds), explicitUses,
        score, state, notes,
      });
    }
  }
  return result.sort((a,b) => a.score - b.score || a.animalName.localeCompare(b.animalName,'pt'));
}

export function buildCategoryCoverage(project: ProjectState): CategoryCoverage[] {
  const categories = unique(project.animals.flatMap(animal => animal.categories));
  return categories.map(category => {
    const animalIds = project.animals.filter(animal => animal.categories.includes(category)).map(animal => animal.id);
    const mechanicIds = project.mechanics.filter(mechanic => mechanic.goodForCategories.includes(category) || mechanic.goodForAnimals.some(id => animalIds.includes(id))).map(mechanic => mechanic.id);
    const areaIds = project.areas.filter(area => (area.testedCategories ?? []).includes(category) || area.centralMechanicIds.some(id => mechanicIds.includes(id))).map(area => area.id);
    const challengeIds = project.challenges.filter(challenge => challenge.recommendedAnimalIds.some(id => animalIds.includes(id)) || challenge.recommendedAbilities.some(ability => normal(ability).includes(normal(category)))).map(challenge => challenge.id);
    const bossIds = project.bosses.filter(boss => boss.phases.some(phase => phase.recommendedAnimalIds.some(id => animalIds.includes(id)))).map(boss => boss.id);
    return { category, areaIds:unique(areaIds), mechanicIds:unique(mechanicIds), challengeIds:unique(challengeIds), bossIds:unique(bossIds), score:areaIds.length + challengeIds.length + bossIds.length };
  }).sort((a,b) => a.score - b.score);
}

export function getAreaSuggestions(project: ProjectState, areaId: string): AreaSuggestion[] {
  const area = project.areas.find(item => item.id === areaId);
  if (!area) return [];
  const analysis = validateGaiaMap(project);
  const depth = analysis.depths[area.id] ?? estimateDepth(project, area);
  const worldAnimals = project.animals.filter(animal => animal.worldId === area.worldId && !animal.isSecret);
  const coverage = buildAbilityCoverage(project).filter(row => row.worldId === area.worldId);
  const suggestions: AreaSuggestion[] = [];
  const add = (suggestion: AreaSuggestion) => { if (!suggestions.some(row => row.id === suggestion.id)) suggestions.push(suggestion); };
  if (area.centralMechanicIds.length === 0) add({ id:'central-mechanic', priority:'alta', title:'Escolha uma mecânica central', text:'A área ainda não possui uma peça principal de level design. Selecione uma mecânica que comunique a identidade da fase antes de combinar hazards.', reason:'Sem mecânica central, as sugestões e a cobertura ficam genéricas.' });
  const tested = area.testedCategories ?? [];
  if (tested.length === 0) add({ id:'categories-empty', priority:'alta', title:'Defina as categorias testadas', text:'Escolha pelo menos uma categoria principal e uma alternativa possível.', reason:'O GDD pede gates flexíveis e progressão livre entre mundos.' });
  if (depth >= 3 && tested.length < 2) add({ id:'deep-combination', priority:'alta', title:'Combine duas categorias', text:`Esta área está na profundidade ${depth}. Combine a categoria principal com uma solução alternativa, em vez de depender de uma única forma.`, reason:'Áreas profundas devem recombinar conhecimentos anteriores.' });
  if (tested.length === 1) {
    const alternatives = buildCategoryCoverage(project).filter(row => row.category !== tested[0]).slice(0,3).map(row => row.category);
    add({ id:'alternative-route', priority:'média', title:'Crie uma rota alternativa', text:`${tested[0]} já está representada. Considere uma rota opcional usando ${alternatives.join(' ou ') || 'outra categoria local'}.`, reason:'Evita que a área dependa de uma única solução.' });
  }
  const weak = coverage.filter(row => row.state === 'insuficiente' && row.teachingAreaId !== area.id).slice(0,3);
  for (const row of weak) add({ id:`weak-${row.key}`, priority:'média', title:`Reforce ${row.ability}`, text:`${row.animalName} ainda tem pouca cobertura. Use ${row.ability} num segredo, atalho ou combinação opcional nesta área.`, reason:`Cobertura atual: ${row.score}/10.`, relatedAnimalIds:[row.animalId], relatedAbility:row.ability });
  const localUnlocked = worldAnimals.filter(animal => animal.unlockAreaId === area.id);
  for (const animal of localUnlocked) {
    const hasTutorialMention = textIncludes(areaText(project, area), [...terms(animal.name), ...terms(animal.primaryAbility ?? '')]);
    if (!hasTutorialMention) add({ id:`tutorial-${animal.id}`, priority:'alta', title:`Ensine ${animal.primaryAbility ?? animal.name}`, text:`A área liberta ${animal.name}, mas o plano ainda não descreve um momento claro de ensino da habilidade.`, reason:'Toda transformação deve ter um tutorial curto e legível.', relatedAnimalIds:[animal.id], relatedAbility:animal.primaryAbility });
  }
  if (!area.secretsPlan?.trim()) add({ id:'secret-plan', priority:'média', title:'Planeje um segredo memorável', text:'Adicione ao menos um segredo que recompense voltar com outra categoria ou usar uma habilidade de forma não obrigatória.', reason:'Cada área deve alimentar descoberta e backtracking.' });
  if (!area.shortcutsPlan?.trim() && depth >= 2) add({ id:'return-route', priority:'média', title:'Planeje o retorno', text:'Inclua um atalho, saída unidirecional ou rota de regresso para evitar repetir toda a área.', reason:'Áreas metroidvania compactas precisam de retorno confortável.' });
  if (!area.frustrationRisk?.trim() || !area.uxSolution?.trim()) add({ id:'ux-risk', priority:'baixa', title:'Registre risco e solução de UX', text:'Identifique o erro mais provável do jogador e a pista visual, sonora ou espacial que o corrige.', reason:'Ajuda a transformar o plano em greybox testável.' });
  return suggestions.sort((a,b) => priorityValue(a.priority) - priorityValue(b.priority)).slice(0,8);
}

export function validateGaiaMap(project: ProjectState): GaiaValidation {
  const nodes = project.worldMap.nodes;
  const edges = project.worldMap.edges;
  const hub = nodes.find(node => node.areaId === (project.worldMap.hubAreaId ?? 'coracao-gaia'));
  const nodeById = new Map(nodes.map(node => [node.id,node]));
  const adjacency = new Map<string,string[]>();
  const directed = new Map<string,string[]>();
  for (const node of nodes) { adjacency.set(node.id,[]); directed.set(node.id,[]); }
  const warnings: PlanningWarning[] = [];
  for (const edge of edges) {
    if (edge.source === edge.target) warnings.push({ id:`self-${edge.id}`, severity:'error', category:'mapa', text:'Existe uma ligação que começa e termina no mesmo nó.', route:'/world-map' });
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) { warnings.push({ id:`broken-${edge.id}`, severity:'error', category:'mapa', text:'Existe uma ligação apontando para um nó ausente.', route:'/world-map' }); continue; }
    adjacency.get(edge.source)?.push(edge.target); adjacency.get(edge.target)?.push(edge.source);
    directed.get(edge.source)?.push(edge.target); if (edge.bidirectional) directed.get(edge.target)?.push(edge.source);
  }
  const depths: Record<string,number> = {};
  if (hub) {
    const queue: Array<[string,number]> = [[hub.id,0]]; const visited = new Set<string>();
    while (queue.length) { const [id,depth] = queue.shift()!; if (visited.has(id)) continue; visited.add(id); const node=nodeById.get(id); if (node) depths[node.areaId]=depth; for (const next of adjacency.get(id) ?? []) queue.push([next,depth+1]); }
    for (const node of nodes.filter(node => !visited.has(node.id))) { const area=project.areas.find(a=>a.id===node.areaId); warnings.push({ id:`disconnect-${node.id}`, severity:'error', category:'mapa', text:`${area?.name ?? node.areaId} está desconectada do Coração de Gaia.`, route:'/world-map', worldId:area?.worldId, areaId:area?.id }); }
    for (const node of nodes.filter(node => node.id !== hub.id && visited.has(node.id))) if (!canReach(node.id,hub.id,directed)) { const area=project.areas.find(a=>a.id===node.areaId); warnings.push({ id:`return-${node.id}`, severity:'warning', category:'mapa', text:`${area?.name ?? node.areaId} não possui caminho de retorno dirigido até o Coração de Gaia.`, route:'/world-map', worldId:area?.worldId, areaId:area?.id }); }
  } else warnings.push({ id:'missing-hub', severity:'error', category:'mapa', text:'O nó do Coração de Gaia não está colocado.', route:'/world-map' });
  for (const node of nodes) {
    const area=project.areas.find(item => item.id === node.areaId); if (!area) continue;
    const mode=node.unlockMode??area.unlockMode;
    if (area.type==='vila' && (area.accessCost>0 || mode==='runes')) warnings.push({ id:`village-cost-${area.id}`, severity:'error', category:'economia', text:`${area.name} é vila, mas está cobrando Runas.`, route:`/area/${area.id}`, worldId:area.worldId, areaId:area.id });
    if (area.type==='boss') {
      if (area.accessCost>0 || mode==='runes') warnings.push({ id:`boss-cost-${area.id}`, severity:'error', category:'economia', text:`${area.name} é área de boss e deve custar 0 Runas.`, route:`/area/${area.id}`, worldId:area.worldId, areaId:area.id });
      if (mode!=='missao_principal' || !(node.unlockMissionId??area.unlockMissionId)) warnings.push({ id:`boss-mission-${area.id}`, severity:'error', category:'mapa', text:`${area.name} precisa ser desbloqueada pela missão principal.`, route:`/area/${area.id}`, worldId:area.worldId, areaId:area.id });
    }
  }
  const duplicatePairs = new Set<string>();
  for (const edge of edges) { const pair=[edge.source,edge.target].sort().join('|'); if (duplicatePairs.has(pair)) warnings.push({ id:`duplicate-${edge.id}`, severity:'warning', category:'mapa', text:'Há duas ligações entre o mesmo par de nós.', route:'/world-map' }); duplicatePairs.add(pair); }
  const routeBudgets = calculateRouteBudgets(project,hub?.id,nodeById,directed,depths);
  for (const row of routeBudgets.filter(row => !row.affordable)) { const area=project.areas.find(a=>a.id===row.areaId); warnings.push({ id:`budget-${row.areaId}`, severity:'error', category:'economia', text:`${area?.name ?? row.areaId} pode exigir ${row.minimumCost} Runas quando a rota estima apenas ${row.availableBefore} disponíveis.`, route:'/world-map/analysis', worldId:area?.worldId, areaId:row.areaId }); }
  const worldSimulations = project.worlds.filter(world => world.id !== 'w0').map(world => {
    const worldNodes=nodes.filter(node=>project.areas.find(area=>area.id===node.areaId)?.worldId===world.id);
    const entry=worldNodes.sort((a,b)=>(depths[a.areaId]??99)-(depths[b.areaId]??99))[0];
    const entryArea=project.areas.find(area=>area.id===entry?.areaId);
    const issueCount=warnings.filter(warning=>warning.worldId===world.id).length;
    const totalRunes=project.areas.filter(area=>area.worldId===world.id).reduce((sum,area)=>sum+area.runeTarget,0)+5;
    return { worldId:world.id, worldName:world.name, entryCost:entryArea?.accessCost??0, runesBefore:1, runesAfterEstimate:1+totalRunes-(entryArea?.accessCost??0), viableAsFirst:(entryArea?.accessCost??0)<=1, issueCount };
  });
  const branchCoverage=project.worlds.filter(world=>world.id!=='w0').map(world=>{
    const worldAreas=project.areas.filter(area=>area.worldId===world.id&&nodes.some(node=>node.areaId===area.id));
    const categories=unique(worldAreas.flatMap(area=>area.testedCategories??[]));
    const animalsUsed=unique(project.animals.filter(animal=>animal.worldId===world.id&&worldAreas.some(area=>textIncludes(areaText(project,area),terms(animal.name))||area.animalUnlockIds?.includes(animal.id))).map(animal=>animal.name));
    const localCategories=unique(project.animals.filter(animal=>animal.worldId===world.id).flatMap(animal=>animal.categories));
    return {worldId:world.id,worldName:world.name,depth:Math.max(0,...worldAreas.map(area=>depths[area.id]??0)),categories,animalsUsed,weakCategories:localCategories.filter(category=>!categories.includes(category))};
  });
  return {warnings,depths,routeBudgets,worldSimulations,branchCoverage};
}

function calculateRouteBudgets(project:ProjectState,hubId:string|undefined,nodeById:Map<string,ProjectState['worldMap']['nodes'][number]>,directed:Map<string,string[]>,depths:Record<string,number>):GaiaValidation['routeBudgets'] {
  if(!hubId)return[];
  const rows:GaiaValidation['routeBudgets']=[];
  const best=new Map<string,{cost:number,available:number}>();
  best.set(hubId,{cost:0,available:1});
  const ordered=[...nodeById.values()].sort((a,b)=>(depths[a.areaId]??999)-(depths[b.areaId]??999));
  for(const node of ordered){const state=best.get(node.id);if(!state)continue;const area=project.areas.find(a=>a.id===node.areaId);const reward=area?.runeTarget??0;const availableAfter=state.available+reward;for(const nextId of directed.get(node.id)??[]){const nextNode=nodeById.get(nextId);const nextArea=nextNode&&project.areas.find(a=>a.id===nextNode.areaId);if(!nextNode||!nextArea)continue;const cost=(nextNode.unlockMode??nextArea.unlockMode)==='runes'?nextArea.accessCost:0;const candidate={cost:state.cost+cost,available:availableAfter-cost};const current=best.get(nextId);if(!current||candidate.available>current.available)best.set(nextId,candidate)}}
  for(const node of nodeById.values()){if(node.id===hubId)continue;const area=project.areas.find(a=>a.id===node.areaId);if(!area)continue;const state=best.get(node.id);const cost=(node.unlockMode??area.unlockMode)==='runes'?area.accessCost:0;rows.push({areaId:area.id,depth:depths[area.id]??-1,minimumCost:state?.cost??cost,availableBefore:(state?.available??0)+cost,affordable:Boolean(state)&&((state?.available??0)+cost>=cost)})}
  return rows;
}

function inferAreaStatus(project:ProjectState,area:AreaDef):EntityStatus {
  if (!area.sceneName.trim()) return 'planejado';
  const map=project.maps.find(item=>item.areaId===area.id);
  if (map && area.type==='fase' && !map.objects.some(object=>object.type==='entry'&&!object.archived)) return 'erro';
  return 'unity';
}
function areaText(project:ProjectState,area:AreaDef):string {
  const mechanics=project.mechanics.filter(m=>area.centralMechanicIds.includes(m.id)).map(m=>`${m.name} ${m.description} ${m.goodForCategories.join(' ')} ${m.goodForAnimals.join(' ')}`).join(' ');
  return normal([area.name,area.description,area.designType,area.setting,area.mainMechanicSummary,area.secondaryMechanicSummary,area.regionalItemUse,(area.testedCategories??[]).join(' '),area.hazardNotes,area.enemyNotes,area.puzzlePlan,area.secretsPlan,area.shortcutsPlan,area.narrativeMoment,area.designGoal,area.notes,mechanics].filter(Boolean).join(' '));
}
function estimateDepth(project:ProjectState,area:AreaDef):number {const siblings=project.areas.filter(a=>a.worldId===area.worldId&&a.type==='fase').sort((a,b)=>a.accessCost-b.accessCost);return Math.max(0,siblings.findIndex(a=>a.id===area.id));}
function canReach(start:string,target:string,graph:Map<string,string[]>):boolean {const queue=[start],seen=new Set<string>();while(queue.length){const id=queue.shift()!;if(id===target)return true;if(seen.has(id))continue;seen.add(id);queue.push(...(graph.get(id)??[]))}return false;}
function refKey(ref:EntityRef):string{return`${ref.type}:${ref.parentId??''}:${ref.id}`}
function increment(map:Map<string,number>,key:string){map.set(key,(map.get(key)??0)+1)}
function unique<T>(values:T[]):T[]{return[...new Set(values)]}
function normal(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function slug(value:string):string{return normal(value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function terms(value:string):string[]{return unique(normal(value).split(/[^a-z0-9]+/).filter(term=>term.length>=4))}
function textIncludes(text:string,needles:string[]):boolean {return needles.some(needle=>needle.length>=4&&text.includes(needle))}
function priorityValue(value:AreaSuggestion['priority']){return value==='alta'?0:value==='média'?1:2}
