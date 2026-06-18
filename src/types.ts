export type EntityStatus = 'planejado' | 'unity' | 'erro';
export type AreaType = 'hub' | 'fase' | 'vila' | 'boss' | 'final' | 'apolo';
export type MusicRole = 'area' | 'vila_vazia' | 'vila_viva' | 'vila_pos_boss' | 'boss_aproximacao' | 'boss_combate' | 'terra_gaia' | 'apolo' | 'global';
export type UnlockMode = 'runes' | 'automatico' | 'missao_principal' | 'inicio' | 'portao_final';
export type RescueType = 'interacao' | 'presa_fisica' | 'presa_ambiental' | 'assustada_fugitiva';

export type EntityType =
  | 'world' | 'area' | 'animal' | 'enemy' | 'item' | 'mechanic' | 'npc' | 'mission'
  | 'task' | 'rumor' | 'whisper' | 'challenge' | 'boss' | 'emblem' | 'music'
  | 'idea' | 'mapObject' | 'areaResource' | 'galleryImage';

export interface EntityRef {
  type: EntityType;
  id: string;
  parentId?: string;
}

export interface EntityRelation {
  id: string;
  from: EntityRef;
  to: EntityRef;
  kind: string;
  notes?: string;
  createdAt: string;
  manual: boolean;
}

export interface TrashEntry {
  entityType: EntityType;
  entityId: string;
  parentId?: string;
  deletedAt: string;
  snapshot: unknown;
  relationSnapshot: EntityRelation[];
  displayName: string;
}


export interface WorldTheme {
  primary: string;
  secondary: string;
  soft: string;
  textOnPrimary: string;
  pattern?: string;
}

export interface WorldDef {
  id: string;
  name: string;
  lesson: string;
  villageId?: string;
  regionalItemId?: string;
  bossId?: string;
  theme: WorldTheme;
  backgroundImages: string[];
  notes: string;
}

export interface AreaDef {
  id: string;
  worldId: string;
  name: string;
  type: AreaType;
  accessCost: number;
  runeTarget: number;
  whisperTarget: number;
  chestTarget: number;
  npcTarget: number;
  fragmentTarget: number;
  ecoTarget?: number;
  melodyTarget?: number;
  countsForBaseCompletion?: boolean;
  apoloTrialId?: string;
  sceneName: string;
  description: string;
  centralMechanicIds: string[];
  /** Compatibilidade com projetos 0.1/0.2. */
  animalUnlockId?: string;
  animalUnlockIds?: string[];
  unlockMode?: UnlockMode;
  unlockMissionId?: string;
  designType?: string;
  durationEstimate?: string;
  setting?: string;
  mainMechanicSummary?: string;
  secondaryMechanicSummary?: string;
  regionalItemUse?: string;
  testedCategories?: string[];
  hazardNotes?: string;
  enemyNotes?: string;
  puzzlePlan?: string;
  secretsPlan?: string;
  shortcutsPlan?: string;
  checkpointPlan?: string;
  narrativeMoment?: string;
  designGoal?: string;
  frustrationRisk?: string;
  uxSolution?: string;
  musicTrackIds: string[];
  gallery: string[];
  backgroundImage?: string;
  notes: string;
  sections?: string[];
}

export interface AnimalDef {
  id: string;
  worldId: string;
  unlockAreaId: string;
  name: string;
  categories: string[];
  /** Campo legado. O backup 16/06 usa uma habilidade principal e efeitos contextuais. */
  abilities: string[];
  primaryAbility?: string;
  contextualInteractions?: string[];
  secondaryTags?: string[];
  isSecret?: boolean;
  canAttack: boolean;
  attackTags: string[];
  weaknesses: string[];
  puzzleUses: string[];
  conceptArt?: string;
  isIrisBase?: boolean;
  protectedFromRemoval?: boolean;
  surfaceSwim?: boolean;
  canDiveAsLand?: boolean;
  oxygenSeconds?: number;
  sinksIfCannotSwim?: boolean;
  underwaterTurnStyle?: 'direto' | 'arco_curto' | 'arco_longo';
  swimNotes?: string;
  tutorialWarnCannotSwim?: boolean;
}

export interface EnemyDef {
  id: string;
  name: string;
  category: string;
  movement: string;
  attackStyle: string[];
  isFlying: boolean;
  canSwim: boolean;
  canDive: boolean;
  defeatMethods: string[];
  weaknesses: string[];
  resistances: string[];
  immunities: string[];
  puzzleTraits: string[];
  icon: string;
  image?: string;
  notes: string;
  status: EntityStatus;
  archived: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  kind: 'global' | 'regional' | 'missao' | 'consumivel' | 'upgrade';
  worldId?: string;
  description: string;
  technicalDefaults?: string;
  toggleable?: boolean;
  defaultPrice: number;
  image?: string;
  notes: string;
  status: EntityStatus;
  archived: boolean;
  onlyBuyOnce?: boolean;
  globallyAvailableInShops?: boolean;
  countsFor100?: boolean;
  pickupBehavior?: 'imediato' | 'inventario' | 'colecionavel' | 'upgrade';
}

export interface MechanicDef {
  id: string;
  name: string;
  kind: 'objeto' | 'hazard' | 'plataforma' | 'gate' | 'puzzle';
  description: string;
  goodForCategories: string[];
  goodForAnimals: string[];
  firstSuggestedAreaId?: string;
  icon: string;
  source: 'GDD' | 'Script' | 'Criado' | 'Importado';
  archived: boolean;
  worldIds?: string[];
  scriptRefs?: string[];
  configuration?: string;
  implementationStatus?: 'implementado' | 'configuravel' | 'pendente';
  importedFrom?: string;
}

export interface NpcDef {
  id: string;
  name: string;
  animal: string;
  worldId: string;
  villageAreaId: string;
  rescueAreaId?: string;
  rescueRequirement: string;
  rescueType?: RescueType;
  villageLocation?: string;
  preBossLine?: string;
  postBossLine?: string;
  hint?: string;
  countsFor100?: boolean;
  countsForVillageRestoration?: boolean;
  populationRole?: 'resgatado' | 'adicional' | 'nenhum';
  npcType: 'comum' | 'comerciante' | 'contador' | 'cartografo' | 'missao' | 'outro';
  notes: string;
  missionIds: string[];
  shopItems: Array<{ itemId: string; customPrice?: number }>;
  status: EntityStatus;
  archived: boolean;
  eventActions?: NpcActionPlan[];
}

export type NpcActionKind = 'mostrar_sementes' | 'alterar_sementes' | 'guardar_status' | 'restaurar_status' | 'descartar_status' | 'bloquear_animais' | 'desbloquear_animais' | 'resgatar_npc' | 'adicionar_populacao_vila' | 'definir_populacao_vila' | 'sincronizar_populacao_vila' | 'tutorial' | 'variavel' | 'outro';
export interface NpcActionPlan {
  id:string; kind:NpcActionKind; label:string; amount?:number; showHud?:boolean; animateHud?:boolean;
  snapshotKey?:string; fields?:string[]; discardAfterRestore?:boolean; animalIds?:string[];
  npcId?:string; areaId?:string; worldId?:string; villageId?:string; countsForVillageRestoration?:boolean; currentPopulation?:number; maxPopulation?:number;
  notes?:string; implementationStatus?:'implementado'|'pendente';
}

export type TaskTriggerType =
  | 'npc_interacao'
  | 'objeto_interacao'
  | 'ponto_mapa'
  | 'entrar_area'
  | 'possuir_item'
  | 'quantidade_item'
  | 'coletar_runa'
  | 'runa_especifica'
  | 'derrotar_inimigo'
  | 'quantidade_inimigos'
  | 'resgatar_npc'
  | 'concluir_desafio'
  | 'coletar_todas_sementes'
  | 'coletar_objeto_especifico'
  | 'descobrir_rumor'
  | 'variavel'
  | 'missao_concluida';

/**
 * Uma origem explícita que chama Action_CompleteMissionTask no Unity.
 * Várias origens podem apontar para a mesma tarefa (por exemplo, dois NPCs
 * diferentes ou duas entradas alternativas). Qualquer uma marca a mesma tarefa.
 */
export interface MissionCompletionLink {
  id: string;
  triggerType: TaskTriggerType;
  targetId?: string;
  quantity?: number;
  expectedValue?: string;
  mapPointId?: string;
  notes?: string;
}

/**
 * Condição verificada automaticamente pelo MissionManager enquanto a tarefa
 * estiver activa. A lista usa TODAS ou QUALQUER conforme autoCompleteRequireAll.
 */
export interface MissionAutoCondition {
  id: string;
  triggerType: TaskTriggerType;
  targetId?: string;
  quantity?: number;
  expectedValue?: string;
  notes?: string;
}

export interface MissionTask {
  /** Equivale a MissionTask.taskId no Unity. */
  id: string;
  title: string;
  description: string;
  /** O backup 16/06 exige TODAS as dependências. */
  dependsOnTaskIds: string[];
  completionLinks: MissionCompletionLink[];
  autoCompleteConditions: MissionAutoCondition[];
  autoCompleteRequireAll: boolean;
  notes?: string;
  archived?: boolean;

  /** Campos legados da versão 0.1.x, mantidos apenas para migração. */
  triggerType?: TaskTriggerType;
  targetId?: string;
  quantity?: number;
  expectedValue?: string;
  dependencyMode?: 'todas' | 'qualquer';
  mapPointId?: string;
}

/** Estrutura legada da versão 0.1.x. Não é mais usada pelo editor. */
export interface MissionStage {
  id: string;
  title: string;
  taskIds: string[];
  completionMode: 'todas' | 'qualquer';
  ordered: boolean;
}

export interface MissionDef {
  id: string;
  name: string;
  type: 'principal' | 'secundaria' | 'quest';
  worldId: string;
  areaIds: string[];
  starterNpcId?: string;
  description: string;
  suggestedAreaId?: string;
  clearObjective?: string;
  vagueHint?: string;
  extraHint?: string;
  reward?: string;
  journalText?: string;
  completionText?: string;
  countsFor100?: boolean;
  tasks: MissionTask[];
  rumorIds: string[];
  status: EntityStatus;
  archived: boolean;
  notes?: string;

  /** Campos legados da versão 0.1.x, mantidos para importação sem perda. */
  stages?: MissionStage[];
  autoCompleteOnLastTask?: boolean;
}

/**
 * Missão que existe dentro do jogo Animals. O alias explícito evita confusão
 * com BuildMissionDefinition, usada pelo roteiro de produção do Executor.
 */
export type GameMissionDef = MissionDef;
export type GameMissionTask = MissionTask;

export interface RumorDef {
  id: string;
  title: string;
  text: string;
  image?: string;
  imageCaption?: string;
  notes?: string;
  worldId: string;
  npcIds: string[];
  missionIds: string[];
  targetAreaIds: string[];
  status: EntityStatus;
  archived: boolean;
}

export interface WhisperDef {
  id: string;
  areaId: string;
  title?: string;
  phrase: string;
  sourceNpcId?: string;
  storyTellerNpcId?: string;
  ecoCost?: number;
  purchaseOrder?: number;
  rewardNote: string;
  foundState?: 'nao_encontrado' | 'encontrado';
  deliveredState?: 'nao_entregue' | 'entregue';
  notes?: string;
  status: EntityStatus;
  archived: boolean;
}

export interface ChallengeDef {
  id: string;
  areaId: string;
  name: string;
  type: 'corrida' | 'coleta' | 'puzzle_cronometrado' | 'combate' | 'sobrevivencia' | 'defesa_npc' | 'apolo' | 'combinado';
  objective: string;
  recommendedAnimalIds: string[];
  recommendedAbilities: string[];
  portalMapObjectId?: string;
  /** Campo legado. */
  reward: string;
  repeatable?: boolean;
  primaryReward?: string;
  repeatReward?: string;
  npcEventRewards?: Array<{ npcId: string; eventId: string; notes?: string }>;
  isApoloTrial?: boolean;
  requiredAnimalId?: string;
  lockFormDuringTrial?: boolean;
  allowedCategoryIds?: string[];
  portalShowAnimalIcon?: boolean;
  portalCompletedIndicator?: boolean;
  portalRewardPreview?: boolean;
  objectiveTypes?: string[];
  sections?: ChallengeSectionPlan[];
  countsFor100?: boolean;
  status: EntityStatus;
  archived: boolean;
}

export interface ChallengeSectionPlan { id:string; name:string; ruleType:'animal'|'categoria'|'tempo'|'derrotar'|'coletar'|'sobreviver'|'combinado'; requiredAnimalId?:string; requiredCategories?:string[]; timeLimitSeconds?:number; enemyCount?:number; collectTarget?:string; description:string; }

export interface BossDef {
  id: string;
  worldId: string;
  areaId: string;
  name: string;
  phases: Array<{ id: string; title: string; description: string; recommendedAnimalIds: string[]; recommendedAbilities: string[] }>;
  rewardRunes: number;
  conceptArt?: string;
  notes: string;
  status: EntityStatus;
  archived?: boolean;
}


export interface EmblemDef {
  id: string;
  name: string;
  kind: 'mundo' | 'gaia' | 'apolo' | 'zeus' | 'bonus';
  worldId?: string;
  condition: string;
  reward: string;
  countsInBaseCompletion: boolean;
  aura?: string;
  status: EntityStatus;
  notes: string;
  archived?: boolean;
}

export interface MusicAttachment {
  source: 'planner_upload';
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  attachedAt: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  role: MusicRole;
  worldId?: string;
  areaId?: string;
  areaIds?: string[];
  filePath?: string;
  dataUrl?: string;
  attachment?: MusicAttachment;
  loop: boolean;
  jukeboxVisibility?: 'base' | 'melodia' | 'fora_jukebox';
  melodyId?: string;
  notes: string;
  archived?: boolean;
}

export interface IdeaDef {
  id: string;
  category: 'inimigo' | 'puzzle' | 'mecanica' | 'desafio' | 'npc' | 'missao';
  title: string;
  description: string;
  suggestedAreaIds: string[];
  suggestedAnimalIds?: string[];
  suggestedAbilities?: string[];
  areaReasons?: Record<string, string>;
  notes?: string;
  tags: string[];
  discarded: boolean;
  archived?: boolean;
}

export type MapTool = 'select' | 'hand' | 'ground' | 'waterRect' | 'waterCircle' | 'zone' | 'arrow' | 'resource' | 'entry' | 'missionPoint' | 'text' | 'draw' | 'eraseGround' | 'eraseResource';
export type MapObjectType = 'ground' | 'waterRect' | 'waterCircle' | 'zone' | 'arrow' | 'resource' | 'entry' | 'note' | 'missionPoint' | 'drawing' | 'background';

export interface MapObject {
  id: string;
  type: MapObjectType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  fill?: string;
  opacity?: number;
  label?: string;
  resourceType?: 'enemy' | 'npc' | 'rune' | 'whisper' | 'chest' | 'fragment' | 'challenge' | 'mechanic' | 'mission';
  resourceId?: string;
  icon?: string;
  status?: EntityStatus;
  zoneId?: string;
  categoryColor?: string;
  relationIds?: string[];
  placed?: boolean;
  archived?: boolean;
  rotation?: number;
  locked?: boolean;
  groupId?: string;
  zIndex?: number;
}

export interface MapBackgroundImage {
  id: string;
  filePath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  locked: boolean;
  name: string;
}

export interface MapDrawing {
  id: string;
  points: number[];
  color: string;
  width: number;
  locked?: boolean;
}

export interface MapDocument {
  areaId: string;
  gridSize: number;
  unitScale: number;
  backgroundImage?: string;
  backgroundOpacity: number;
  backgroundImages?: MapBackgroundImage[];
  drawings?: MapDrawing[];
  objects: MapObject[];
  layers: Record<string, { visible: boolean; locked: boolean }>;
  showStatusOutlines: boolean;
  history: MapObject[][];
  future: MapObject[][];
}

export interface GaiaMapNode {
  id: string;
  areaId: string;
  x: number;
  y: number;
  unlockMode?: UnlockMode;
  unlockMissionId?: string;
  notes?: string;
  worldIntro?: boolean;
}

export interface GaiaMapEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  kind?: 'principal' | 'alternativa' | 'convergencia';
  bidirectional?: boolean;
  notes?: string;
  controlPoints?: number[];
}

export interface GaiaMapBackgroundImage {
  id: string;
  filePath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  locked: boolean;
  name: string;
}

export interface GaiaMapDrawing {
  id: string;
  points: number[];
  color: string;
  width: number;
}

export interface WorldMapPlan {
  nodes: GaiaMapNode[];
  edges: GaiaMapEdge[];
  backgroundImages: GaiaMapBackgroundImage[];
  drawings: GaiaMapDrawing[];
  gridSize: number;
  snapToGrid: boolean;
  accessZoneRequired?: boolean;
  hubAreaId?: string;
  overviewNotes?: string;
  cameraNotes?: string;
  /** Campo legado da versão 0.1.x. */
  backgroundImage?: string;
}

export type AreaResourceKind = 'rune' | 'chest' | 'fragment' | 'missionObject' | 'missionPoint' | 'checkpoint' | 'exit' | 'safeHaven' | 'levelNote' | 'narrativeObject';

export interface AreaResourceDef {
  id: string;
  areaId: string;
  kind: AreaResourceKind;
  name: string;
  description: string;
  status: EntityStatus;
  zoneId?: string;
  mapObjectId?: string;
  missionId?: string;
  taskId?: string;
  targetAreaId?: string;
  notes: string;
  archived: boolean;
}

export interface VillageNpcPlacement { npcId: string; x: number; y: number; note?: string; }
export interface VillagePlan {
  areaId: string;
  plannedPopulation: number;
  currentPopulation: number;
  rescuedPopulation?: number;
  additionalPopulation?: number;
  firstRescueThreshold?: number;
  bossDefeated?: boolean;
  state: 'vazia' | 'primeiros_resgates' | 'viva' | 'restaurada' | 'pos_boss';
  storyTellerNpcId?: string;
  ecoCost?: number;
  purchaseOrder?: number;
  visualEvolution: Record<string,string>;
  npcPlacements: VillageNpcPlacement[];
  backgroundImages: MapBackgroundImage[];
  notes: string;
}

export interface GalleryImage {
  id: string;
  ownerType: 'area' | 'world' | 'boss';
  ownerId: string;
  filePath: string;
  caption: string;
  kind: 'puzzle' | 'conceito' | 'referencia' | 'tileset' | 'fluxo';
  primary: boolean;
  mechanicId?: string;
  zoneId?: string;
  order: number;
  archived: boolean;
}

export interface WorldVisualPlan {
  worldId: string;
  backgroundImages: MapBackgroundImage[];
  drawings: MapDrawing[];
  labels: Array<{id:string;x:number;y:number;text:string;color:string;fontSize:number;locked?:boolean}>;
  layers: Record<string,{visible:boolean;locked:boolean}>;
  notes: string;
}

export interface ChangeLogEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  sections: Array<{title:string;items:string[]}>;
}


export interface SchoolProgressEntry {
  completed: boolean;
  notes: string;
  appliedAreaIds: string[];
}

export interface SnapshotInfo {
  id: number;
  kind: string;
  name?: string;
  hash: string;
  createdAt: string;
  sizeBytes: number;
}

export interface SnapshotComparison {
  equal: boolean;
  currentHash: string;
  snapshotHash: string;
  changedCollections: Array<{ key: string; current: number; snapshot: number; delta: number }>;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  musicEnabled: boolean;
  musicAutoplay: boolean;
  volume: number;
  muted: boolean;
  persistentTrackId?: string;
  loopPlayback?: boolean;
  lastSavedAt?: string;
  lastSaveHash?: string;
  saveVerificationOk: boolean;
  backupMinutes: number;
  maxAutoBackups: number;
  lastSeenVersion?: string;
}


export interface ApoloTrialPlan {
  id:string; worldId:string; areaId:string; name:string; description:string; unlockedAtWorld100:boolean; countsForBaseCompletion:false; sections:ChallengeSectionPlan[]; rewardApoloRunes:number; auraReward?:string; status:EntityStatus; notes:string;
}

export interface TutorialMessagePlan {
  id:string; title:string; priority:'importante'|'media'|'nao_importante'; text:string; imagePath?:string; soundId?:string; anchorHint?:string; requireConfirmation:boolean; allowPagination:boolean; triggerContext:string; relatedAnimalId?:string; relatedItemId?:string; status:EntityStatus; archived:boolean; notes:string;
}

export interface LocalizationPlan {
  defaultConfiguredLanguage:'portugues'|'english';
  fallbackLanguage:'english';
  detectSystemLanguage:boolean;
  persistSelection:boolean;
  languages:Array<{id:'english'|'portugues'|'espanhol'|'frances'|'japones';label:string;enabled:boolean;configured:boolean}>;
  notes:string;
}

export interface ProjectState {
  version: number;
  name: string;
  worlds: WorldDef[];
  areas: AreaDef[];
  animals: AnimalDef[];
  enemies: EnemyDef[];
  items: ItemDef[];
  mechanics: MechanicDef[];
  npcs: NpcDef[];
  missions: GameMissionDef[];
  rumors: RumorDef[];
  whispers: WhisperDef[];
  challenges: ChallengeDef[];
  bosses: BossDef[];
  emblems: EmblemDef[];
  music: MusicTrack[];
  ideas: IdeaDef[];
  areaResources: AreaResourceDef[];
  villages: VillagePlan[];
  galleryImages: GalleryImage[];
  worldVisuals: WorldVisualPlan[];
  changelog: ChangeLogEntry[];
  schoolProgress: Record<string, SchoolProgressEntry>;
  apoloTrials: ApoloTrialPlan[];
  tutorialMessages: TutorialMessagePlan[];
  localization: LocalizationPlan;
  maps: MapDocument[];
  worldMap: WorldMapPlan;
  settings: AppSettings;
  relations: EntityRelation[];
  trash: TrashEntry[];
}
