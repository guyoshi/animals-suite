import type {
  AnimalDef, ApoloTrialPlan, AreaDef, BossDef, ChallengeSectionPlan, IdeaDef, ItemDef,
  LocalizationPlan, MechanicDef, MusicTrack, TutorialMessagePlan, WhisperDef, WorldDef,
} from '../types';

export const apoloAreas: AreaDef[] = [
  ['w1','apolo-bosque','Provação de Apolo — Bosque de Bruma'],
  ['w2','apolo-savana','Provação de Apolo — Planícies do Sol Alto'],
  ['w3','apolo-verde','Provação de Apolo — Verde Infinito'],
  ['w4','apolo-aurora','Provação de Apolo — Terras da Aurora'],
  ['w5','apolo-coral','Provação de Apolo — Eucalipto e Coral'],
  ['w6','apolo-lanternas','Provação de Apolo — Bambu e Lanternas'],
].map(([worldId,id,name])=>({
  id, worldId, name, type:'apolo', accessCost:0, runeTarget:0, whisperTarget:0, chestTarget:0,
  npcTarget:0, fragmentTarget:0, ecoTarget:0, melodyTarget:0, countsForBaseCompletion:false,
  apoloTrialId:`trial-${worldId}`, sceneName:'', description:'Área hardcore desbloqueada após concluir 100% do mundo. Não entra no cálculo do 100% base.',
  centralMechanicIds:['mec-apolo-secoes','mec-portal-forma-fixa'], animalUnlockIds:[], unlockMode:'automatico',
  designType:'provação hardcore por secções', durationEstimate:'15–30 min', setting:'Versão extrema das mecânicas do mundo.',
  mainMechanicSummary:'Secções com regras próprias, restrições de forma/categoria, tempo, combate e coleta.',
  secondaryMechanicSummary:'Sem checkpoints internos persistentes; recompensa uma Runa de Apolo.', regionalItemUse:'', testedCategories:[],
  hazardNotes:'Usar hazards avançados e telegráficos.', enemyNotes:'Combinações exigentes, nunca injustas.', puzzlePlan:'Secções curtas com regras explícitas.',
  secretsPlan:'Não precisa conter segredos para 100%.', shortcutsPlan:'Atalhos apenas quando preservam a prova.', checkpointPlan:'Definir regras por secção.',
  narrativeMoment:'Apolo reconhece domínio total daquele mundo.', designGoal:'Desafio opcional para jogadores hardcore.',
  frustrationRisk:'Dificuldade sem leitura clara.', uxSolution:'Mostrar regra, forma exigida, recompensa e estado concluído antes da entrada.',
  musicTrackIds:[], gallery:[], notes:'Desbloqueia como novo nó da Terra de Gaia quando o mundo chega a 100%.',
} as AreaDef));

export const irisBase: AnimalDef = {
  id:'iris-base', worldId:'w0', unlockAreaId:'coracao-gaia', name:'Íris — Forma Espiritual', categories:['Espírito'],
  abilities:['Andar','Pular'], primaryAbility:'Pulo espiritual suave', contextualInteractions:['Movimento básico'], secondaryTags:[],
  isSecret:false, canAttack:false, attackTags:[], weaknesses:['Sem ataque','Movimento lento','Pouca mobilidade especial'],
  puzzleUses:['Introdução do jogo','Fallback quando todas as outras formas estão temporariamente bloqueadas'],
  isIrisBase:true, protectedFromRemoval:true, surfaceSwim:false, canDiveAsLand:false, oxygenSeconds:0,
  sinksIfCannotSwim:true, underwaterTurnStyle:'direto', swimNotes:'Não sabe nadar. Ao cair em água profunda, afunda e retorna ao último checkpoint.',
  tutorialWarnCannotSwim:true,
};

export const backup18Items: ItemDef[] = [
  {id:'item-seiva-vital',name:'Seiva Vital',kind:'consumivel',description:'Cura guardada no inventário e usada manualmente quando o jogador precisar.',technicalDefaults:'Substitui a antiga versão comprável do Broto de Vida. Cura configurável; padrão sugerido: 1 coração.',defaultPrice:35,notes:'Vendida em lojas. Não aparece no chão como cura imediata.',status:'planejado',archived:false,pickupBehavior:'inventario'},
  {id:'item-eco-perdido',name:'Eco Perdido',kind:'global',description:'Colecionável escondido usado para comprar Sussurros da Terra no Contador de Histórias.',technicalDefaults:'15 em cada área normal; nenhum em vilas, bosses ou Provações de Apolo.',defaultPrice:0,notes:'Geralmente exige exploração ou puzzle.',status:'planejado',archived:false,pickupBehavior:'colecionavel',countsFor100:false},
  {id:'item-melodia-selvagem',name:'Melodia Selvagem',kind:'global',description:'Desbloqueia no Jukebox a música da área correspondente.',technicalDefaults:'Uma por área normal; pode ser encontrada ou recebida em missão/Provação de Gaia. Conta para 100%.',defaultPrice:0,notes:'Relacionar à faixa e à área.',status:'planejado',archived:false,pickupBehavior:'colecionavel',countsFor100:true},
  {id:'item-bolha-ar',name:'Bolha de Ar',kind:'consumivel',description:'Restaura imediatamente o oxigénio de uma forma terrestre capaz de mergulhar.',technicalDefaults:'Pickup de cenário; chama BolhaDeArOxygenPickup/OxygenSystem.',defaultPrice:0,notes:'Usar em rotas subaquáticas com formas de oxigénio limitado.',status:'planejado',archived:false,pickupBehavior:'imediato'},
  {id:'item-jukebox',name:'Jukebox',kind:'upgrade',description:'Revela o menu de músicas e permite ouvir Melodias Selvagens já encontradas.',technicalDefaults:'Compra única, disponível em lojas de todos os mundos. Depois de comprada fica bloqueada/cinzenta e vai ao fim da lista.',defaultPrice:300,notes:'Na primeira compra abre o menu, mostra tutorial, fecha o menu e continua o evento da loja.',status:'planejado',archived:false,onlyBuyOnce:true,globallyAvailableInShops:true,pickupBehavior:'upgrade'},
];

const mech=(id:string,name:string,kind:MechanicDef['kind'],description:string,configuration:string,scriptRefs:string[],worldIds:string[]=[],status:MechanicDef['implementationStatus']='implementado'):MechanicDef=>({
  id,name,kind,description,goodForCategories:[],goodForAnimals:[],icon:'✦',source:'Script',archived:false,worldIds,scriptRefs,configuration,implementationStatus:status,
});

export const backup18Mechanics: MechanicDef[] = [
  mech('mec-ecos-sussurros','Ecos Perdidos e compra de Sussurros','puzzle','Exploração rende Ecos; o Contador de Histórias vende cinco mensagens por área pelos custos 1, 2, 3, 4 e 5.','15 Ecos por área normal; 0 em vila/boss/Apolo.',['EcoPerdidoPickup.cs','AreaData.cs'],['w1','w2','w3','w4','w5','w6']),
  mech('mec-oxigenio-limitado','Oxigénio limitado','hazard','Formas terrestres configuradas para mergulhar possuem HUD de oxigénio e morrem quando ele termina.','Configurar oxygenSeconds por animal; a mini-HUD só aparece submersa.',['OxygenSystem.cs','AnimalFormData.cs','WaterMotor2D.cs']),
  mech('mec-bolha-ar','Bolha de Ar','objeto','Pickup subaquático que restaura o oxigénio atual.','Definir quantidade ou restauração total no prefab.',['BolhaDeArOxygenPickup.cs','OxygenSystem.cs']),
  mech('mec-nado-superficie','Nado de superfície por animal','plataforma','Formas terrestres podem nadar apenas na superfície, mergulhar com oxigénio ou afundar, conforme configuração.','surfaceSwim, canDiveAsLand, sinksIfCannotSwim e underwaterTurnStyle.',['AnimalFormData.cs','WaterDetector.cs','WaterMotor2D.cs']),
  mech('mec-portal-forma-fixa','Portal com forma exigida','gate','Portal acende e mostra o ícone apenas quando o jogador possui/usa o animal requerido; dentro da prova a troca pode ficar bloqueada.','requiredAnimalId, lockFormDuringTrial, portalShowAnimalIcon.',['ChallengeTrigger.cs','ChallengeDefinition.cs','FormSwitcher.cs']),
  mech('mec-portal-concluido','Portal concluído e recompensa visível','gate','Portal muda visualmente após conclusão e mostra tipo de prova e recompensa antes da entrada.','Configurar completedIndicator e rewardPreview.',['ChallengeTrigger.cs','ChallengeDefinition.cs']),
  mech('mec-apolo-secoes','Provação de Apolo por secções','puzzle','Uma área hardcore por mundo, desbloqueada no 100%, com secções e regras independentes.','Regras: animal, categoria, tempo, derrotar, coletar, sobreviver e combinações.',['ChallengeDefinition.cs','ChallengeManager.cs','WorldMapController.cs'],['w1','w2','w3','w4','w5','w6']),
  mech('mec-espinho-cadente','Espinho que cai do céu','hazard','Detecta o jogador, avisa, cai e pode permanecer cravado ou voltar após um tempo.','Configurar detectRadius, warningDelay, fallSpeed, dano, respawnDelay; 0 = só volta ao recarregar/chamar Respawn.',['FallingSpike.cs']),
  mech('mec-plataforma-cadente-config','Plataforma cadente configurável','plataforma','Começa a cair depois do tempo configurado e pode retornar automaticamente ou apenas ao recarregar.','fallDelay, shakeDuration, fallSpeed, fallDistance e respawnDelay; 0 = sem retorno automático.',['FallingPlatform.cs']),
  mech('mec-sementes-hud','Mostrar e animar Sementes','objeto','Eventos de NPC podem mostrar o saldo e animar ganhos ou perdas em até um segundo.','displayDuration; amount positivo/negativo; maxDuration <= 1; mudanças grandes animam mais rápido.',['SeedsNpcActions.cs','PlayerProgress.cs']),
  mech('mec-sementes-silenciosas','Alteração silenciosa de Sementes','objeto','Muda o saldo sem animação nem atualização imediata da HUD.','Usar Give/TakeSementesSilent quando o jogador não deve perceber a alteração naquele momento.',['SeedsNpcActions.cs']),
  mech('mec-snapshot-status','Guardar e restaurar status','puzzle','Evento guarda recursos, vida, inventário, formas e outros estados para devolver depois. Snapshots activos são incluídos no SaveData e restaurados ao carregar.','Usar snapshotKey único, seleccionar apenas os campos necessários e descartar depois de restaurar quando a sequência terminar.',['StatusSnapshotActions.cs','PlayerProgress.cs','SaveData.cs']),
  mech('mec-bloqueio-formas','Bloqueio temporário de formas','gate','Animais continuam na roda, mas ficam cinzentos e indisponíveis até a restauração.','Bloquear lista, todas menos inicial ou restaurar snapshot; Íris Base nunca é removida.',['FormLockActions.cs','FormSwitcher.cs']),
  mech('mec-tutorial-contextual','Mensagens de tutorial contextuais','objeto','Mensagens importantes, médias e pop-ups não importantes, com som, fade, imagem e paginação.','Importante: centro+confirmação; Média: perto da UI+confirmação; Toast: topo sem confirmação.',['TutorialMessageManager.cs','TutorialMessageUI.cs']),
  mech('mec-jukebox-compra','Compra única do Jukebox','objeto','Compra revela o menu, mostra tutorial, fecha e continua a sequência; lojas globais bloqueiam recompra.','Item one-time global; owned fica cinzento e no fim da lista.',['JukeboxShopHandler.cs','ShopUI.cs','JukeboxSectionUI.cs']),
  mech('mec-melodia-selvagem','Melodia Selvagem por área','puzzle','Pickup ou recompensa regista um melodyId persistente. O Jukebox consulta HasCollectedMelody e só cria a entrada individual depois da recolha.','Relacionar WildMelodyData à área e clip; usar melodyId único e estável.',['WildMelodyPickup.cs','WildMelodyData.cs','PlayerProgress.cs','JukeboxSectionUI.cs']),
  mech('mec-localizacao','Infraestrutura de idiomas','objeto','Textos planejados por chave, deteção automática e seleção persistente.','Idiomas: English, Português, Español, Français, 日本語; apenas Português habilitado atualmente.',['LocalizationManager.cs','GameSettings.cs','MainMenuOptionsUI.cs','OptionsSectionUI.cs']),
  mech('mec-populacao-vila-sync','Sincronização oficial da população da vila','objeto','Resgates com npcId actualizam PlayerProgress, criam NpcResgatado_<id>, sincronizam rescuedCount e preservam habitantes adicionais.','Usar Action_RescueNpc com npcId único e AreaData; visitantes/lojistas usam Action_AddVillagePopulation.',['VillageActions.cs','PlayerProgress.cs','WorldState.cs'],['w1','w2','w3','w4','w5','w6'],'implementado'),
  mech('mec-evolucao-vila-cinco-niveis','Evolução da vila em cinco níveis','objeto','VillageEvolutionController reage ao evento de população e aplica Vazia, Primeiros Resgates, Viva, Restaurada e Pós-boss.','Configurar villageId, cinco níveis, firstRescueThreshold, worldForBossCheck, objectos e UnityEvents.',['VillageEvolutionController.cs','WorldState.cs'],['w1','w2','w3','w4','w5','w6'],'implementado'),
  mech('mec-save-v1','SaveData versão 1 e migração','objeto','Persiste Ecos, total histórico, IDs de NPCs resgatados, população adicional, Melodias Selvagens e snapshots activos.','Manter saveVersion=1 e validar migração de saves antigos sem rescuedNpcIds.',['SaveData.cs','SaveManager.cs','PlayerProgress.cs','WorldState.cs'],[],'implementado'),
  mech('mec-jukebox-favoritos','Jukebox com favoritos persistentes','objeto','A lista agrupa faixas por mundo, possui abas Normal/Favoritos e guarda favoritos em GameVariables.','Faixas base deixam melodyId vazio; faixas desbloqueáveis usam melodyId. Favoritos usam jukebox_fav_<id>.',['JukeboxSectionUI.cs','GameVariables.cs'],[],'implementado'),
];

const npcIdeaData=[
 ['Cartógrafa das Pegadas','Marca rotas por pistas verbais, sem criar mapa local.'],['Guardião das Bolhas','Ensina oxigénio e repõe Bolhas de Ar perto de uma rota difícil.'],['Mercadora Itinerante','Aparece em todas as vilas e vende apenas itens globais de compra única.'],['Contador Aprendiz','Dá pistas de Ecos Perdidos ainda não encontrados.'],['Músico das Raízes','Reage às Melodias Selvagens e comenta diferenças entre regiões.'],['Cuidadora de Formas','Explica por que certas formas não nadam e evita frustração.'],['Mecânico Arrependido','Transforma sucata de armadilhas em plataformas temporárias.'],['Mensageiro Furtivo','Muda de vila após cada missão e deixa Rumores contraditórios.'],['Curadora da Seiva','Introduz Seiva Vital sem confundi-la com Broto de Vida.'],['Vigia da Provação','Mostra animal exigido, recompensa e recorde do portal.'],['Cronista de Apolo','Explica as seis Runas de Apolo sem contar para o 100% base.'],['Anciã das Correntes','Ensina nado de superfície, mergulho e animais que afundam.'],['Lojista das Seis Vilas','Vende Jukebox em qualquer mundo, mas reconhece a compra global.'],['Escultor de Emblemas','Mostra progresso de Gaia, Apolo e Zeus por metáforas visuais.'],['Criança das Sementes','Cria uma cena de pagamento com contagem animada lenta.'],['Ladra Redimida','Rouba recursos usando snapshot e devolve-os ao fim da missão.'],['Treinador de Íris','Força temporariamente a forma espiritual para uma sequência simples.'],['Resgatada Decoradora','Ao chegar à vila, planeia uma mudança visual específica.'],['Observador do Céu','Dá pistas sobre espinhos cadentes antes da primeira zona.'],['Bibliotecário de Idiomas','Personagem-teste para validar chaves de localização e fallback.'],
];
const challengeIdeaData=[
 ['Corrida sem transformação','Chegar ao fim com a forma inicial exigida e troca bloqueada.'],['Todas as Sementes','Coletar todas as Sementes da arena antes do tempo terminar.'],['Relíquia específica','Encontrar e recolher um objeto marcado sem derrotar todos os inimigos.'],['Oxigénio contado','Mergulhar com forma terrestre e usar Bolhas de Ar na ordem certa.'],['Silêncio absoluto','Atravessar sem ativar nenhum cone de deteção.'],['Uma única vida','Concluir uma sequência de hazards sem receber dano.'],['Peso em movimento','Transportar um bloco por plataformas cadentes.'],['Espinhos do céu','Cruzar uma sala lendo sombras de espinhos cadentes.'],['Caça precisa','Derrotar apenas os inimigos-alvo; outros anulam a prova.'],['Rota de superfície','Nadar sem mergulhar e evitar redemoinhos.'],['Categoria Forte','Usar qualquer animal Forte, sem exigir espécie específica.'],['Forma secreta proibida','Concluir com animais normais para preservar o balanceamento.'],['Resgate cronometrado','Salvar um NPC antes que a rota feche.'],['Portas em cadeia','Ativar três alavancas temporizadas numa rota livre.'],['Melodia protegida','Alcançar uma Melodia Selvagem enquanto inimigos tentam levá-la.'],['Sementes em queda','Coletar Sementes sobre plataformas que caem em tempos diferentes.'],['Sem itens','Concluir sem usar consumíveis, mas com qualquer forma permitida.'],['Predador controlado','Derrotar o mínimo de inimigos e evitar dano colateral.'],['Circuito de categorias','Cada secção exige uma categoria diferente.'],['Provação combinada','Tempo + coleta + combate, com recompensa maior na primeira conclusão.'],
];
const mechanicIdeaData=[
 ['Raiz que memoriza peso','A raiz guarda por alguns segundos o último peso colocado.'],['Bolha transportável','Bolha de Ar pode ser empurrada pela água até outra câmara.'],['Luz ligada ao som','Plataformas aparecem apenas enquanto um sino está silencioso.'],['Tronco encharcado','Muda de peso conforme fica dentro ou fora da água.'],['Sombra acumulada','Passar por áreas escuras carrega camuflagem temporária.'],['Corrente bifurcada','Alavanca divide uma corrente de água entre dois canais.'],['Pegadas persistentes','NPC segue as pegadas deixadas pela forma atual.'],['Portal de categoria dupla','Aceita qualquer animal que tenha pelo menos uma de duas categorias.'],['Pedra que rola com atraso','Só começa a mover depois de receber dois impactos.'],['Vento que gira','A direção muda em intervalos indicados por partículas.'],['Plataforma que copia','Repete o último movimento feito por outra plataforma.'],['Eco de alavanca','Ativação se repete uma vez após um atraso configurado.'],['Rede com tensão','Pode ser cortada apenas quando esticada por peso ou corrente.'],['Lama que guarda trilha','Afunda onde o jogador passou e cria uma rota nova.'],['Gelo sonoro','Racha conforme a intensidade do ruído próximo.'],['Sementes como sequência','Coletar numa ordem acende um caminho; ordem errada reinicia.'],['NPC contrapeso','NPC resgatado ajuda a manter uma placa enquanto segue o jogador.'],['Lanterna de cor','Muda quais plataformas são sólidas sem depender de puzzle de cor complexo.'],['Água em bolsões','Pequenas zonas circulares de água alteram movimento localmente.'],['Checkpoint condicional','Só ativa depois que um objetivo opcional da sala é concluído.'],
];
const missionIdeaData=[
 ['O preço de uma história','Encontrar Ecos suficientes para comprar um Sussurro específico.'],['A canção que faltava','Recuperar a Melodia Selvagem de uma área e ouvi-la no Jukebox.'],['O roubo das formas','Um NPC bloqueia animais; recuperar três chaves e restaurar o snapshot.'],['Sementes contadas','Pagar uma dívida vendo a animação do saldo e escolher outra solução se faltar.'],['Respirar outra vez','Levar Bolhas de Ar a uma rota para resgatar um NPC submerso.'],['O visitante da vila','Concluir uma missão que adiciona um lojista como população adicional sem alterar o total de NPCs resgatáveis.'],['Primeira Provação de Gaia','Concluir uma prova com animal fixo e receber recompensa exclusiva.'],['Ritmo da plataforma','Ajustar três plataformas cadentes para criar uma travessia segura.'],['Sombras antes do espinho','Marcar zonas de impacto de um hazard que cai do céu.'],['O Jukebox errante','Encontrar o comerciante em qualquer vila e realizar a compra única.'],['Cinco vozes da área','Comprar os cinco Sussurros de uma fase na ordem de custos.'],['A forma esquecida','Voltar temporariamente à Íris Base e completar uma rota simples.'],['Nadar ou afundar','Testar três animais e registrar quais nadam, mergulham ou afundam.'],['A porta que reconhece','Levar o animal correto ao portal sem poder trocar dentro da prova.'],['Seiva para a viagem','Comprar Seiva Vital e usá-la apenas após um encontro perigoso.'],['O emblema em seis partes','Concluir a última Provação de Apolo e assistir à união das Runas.'],['A música da vila','Restaurar população suficiente para mudar faixa e decoração.'],['Mensagem que não interrompe','Criar três tutoriais de prioridades diferentes numa sequência.'],['O nome em outras línguas','Validar uma chave de localização no menu inicial e no menu +.'],['Rota sem mapa','Seguir pistas de NPCs e objetos narrativos até um segredo.'],
];
const extraPuzzleData=[
 ['Bolhas em dominó','Empurrar Bolhas de Ar por correntes para criar pontos de reabastecimento.'],['Forma confiscada','Resolver a sala apenas com as formas que não foram bloqueadas.'],['Sementes visíveis','O contador da HUD indica a quantidade exata necessária para abrir uma alternativa.'],['Espinho como botão','Fazer o espinho cadente atingir uma placa ou quebrar uma barreira.'],['Plataformas desencontradas','Configurar delays diferentes para criar uma escada que cai em sequência.'],['Música como pista','Notas ambientais indicam a ordem correta de alavancas.'],['Eco escondido pela rota','Cinco custos crescentes levam a segredos progressivamente mais difíceis.'],['Nado em arco','Animal de curva longa precisa antecipar mudanças de direção numa caverna.'],['Superfície segura','Forma terrestre atravessa água pela superfície enquanto hazards agem abaixo.'],['Peso da bolha','Bolha presa sob plataforma altera sua flutuação quando libertada.'],['Portal reconhecedor','Ícone do animal funciona como pista; a luz confirma a forma correta.'],['Snapshot reverso','Perder recursos abre uma passagem; restaurá-los fecha uma rota e abre outra.'],['Tutorial integrado','A mensagem média aponta para a interface sem cobrir o elemento indicado.'],['Compra global','Seis lojas compartilham o mesmo item único e reordenam o stock após compra.'],['Melodia por missão','A recompensa musical altera o estado do Jukebox sem pickup físico.'],['População em cadeia','Cada NPC resgatado planeia música, loja e decoração diferentes.'],['Runa de Apolo final','As seis runas aparecem e convergem em uma animação planejada.'],['Gelo, queda e retorno','Plataforma cai sobre gelo quebradiço e retorna apenas depois da sala reiniciar.'],['Forma de emergência','Ao bloquear todas as formas animais, Íris Base surge automaticamente.'],['Idioma de segurança','Texto sem tradução usa fallback e nunca deixa botão vazio.'],
];

function ideasFrom(data:string[][],category:IdeaDef['category'],prefix:string,areas:AreaDef[]):IdeaDef[]{
  const normal=areas.filter(a=>a.type==='fase');
  return data.map(([title,description],i)=>({id:`ideia-${prefix}-${i+1}`,category,title,description,suggestedAreaIds:normal.slice(i%Math.max(1,normal.length),i%Math.max(1,normal.length)+3).map(a=>a.id),suggestedAnimalIds:[],suggestedAbilities:[],areaReasons:{},notes:'',tags:['backup 18/06 att',category],discarded:false,archived:false}));
}
export function buildBackup18Ideas(areas:AreaDef[]):IdeaDef[]{return [
  ...ideasFrom(npcIdeaData,'npc','npc18',areas),...ideasFrom(challengeIdeaData,'desafio','provacao18',areas),
  ...ideasFrom(mechanicIdeaData,'mecanica','mecanica18',areas),...ideasFrom(missionIdeaData,'missao','missao18',areas),
  ...ideasFrom(extraPuzzleData,'puzzle','puzzle18',areas),
];}

export function buildWhispers(areas:AreaDef[]):WhisperDef[]{
  return areas.filter(a=>a.type==='fase').flatMap(area=>[1,2,3,4,5].map(order=>({
    id:`sussurro-${area.id}-${order}`,areaId:area.id,title:`${area.name} — Sussurro ${order}`,
    phrase:'Mensagem curta e poética a escrever.',storyTellerNpcId:undefined,ecoCost:order,purchaseOrder:order,
    rewardNote:'Comprado no Contador de Histórias usando Ecos Perdidos.',foundState:'nao_encontrado',deliveredState:'nao_entregue',
    notes:'Sussurro é a mensagem comprada; o colecionável escondido é o Eco Perdido.',status:'planejado',archived:false,
  })));
}

export function buildCompleteMusic(worlds:WorldDef[],areas:AreaDef[],bosses:BossDef[]):MusicTrack[]{
  const tracks:MusicTrack[]=[{id:'music-terra-gaia',title:'Terra de Gaia',role:'terra_gaia',areaIds:[],loop:true,jukeboxVisibility:'base',notes:'Faixa global do mapa. Adicione o arquivo de áudio quando estiver pronto.'}];
  for(const area of areas){
    const world=worlds.find(w=>w.id===area.worldId);
    if(area.type==='vila'){
      tracks.push(
        {id:`music-${area.id}-vazia`,title:`${area.name} — Vila Vazia`,role:'vila_vazia',worldId:area.worldId,areaId:area.id,areaIds:[area.id],loop:true,jukeboxVisibility:'base',notes:''},
        {id:`music-${area.id}-viva`,title:`${area.name} — Vila Viva/Restaurada`,role:'vila_viva',worldId:area.worldId,areaId:area.id,areaIds:[area.id],loop:true,jukeboxVisibility:'base',notes:''},
        {id:`music-${area.id}-pos`,title:`${area.name} — Vila Pós-boss`,role:'vila_pos_boss',worldId:area.worldId,areaId:area.id,areaIds:[area.id],loop:true,jukeboxVisibility:'base',notes:''},
      );
    } else if(area.type==='fase') {
      tracks.push({id:`music-area-${area.id}`,title:`${world?.name??'Mundo'} — ${area.name}`,role:'area',worldId:area.worldId,areaId:area.id,areaIds:[area.id],loop:true,notes:'Faixa da área normal; exige a Melodia Selvagem correspondente para aparecer no Jukebox.',jukeboxVisibility:'melodia',melodyId:`melodia-${area.id}`});
    } else if(area.type!=='boss') {
      tracks.push({id:`music-area-${area.id}`,title:`${world?.name??'Mundo'} — ${area.name}`,role:area.type==='apolo'?'apolo':'area',worldId:area.worldId,areaId:area.id,areaIds:[area.id],loop:true,notes:area.type==='apolo'?'Faixa da Provação de Apolo; por padrão faz parte da trilha base do Jukebox.':'Faixa estrutural do Coração de Gaia ou do Caminho do Ferimento; por padrão faz parte da trilha base.',jukeboxVisibility:'base'});
    }
  }
  for(const boss of bosses){
    tracks.push(
      {id:`music-${boss.id}-aproximacao`,title:`${boss.name} — Aproximação`,role:'boss_aproximacao',worldId:boss.worldId,areaId:boss.areaId,areaIds:[boss.areaId],loop:true,jukeboxVisibility:'base',notes:''},
      {id:`music-${boss.id}-combate`,title:`${boss.name} — Combate`,role:'boss_combate',worldId:boss.worldId,areaId:boss.areaId,areaIds:[boss.areaId],loop:true,jukeboxVisibility:'base',notes:''},
    );
  }
  return tracks;
}

const section=(id:string,name:string,ruleType:ChallengeSectionPlan['ruleType'],description:string):ChallengeSectionPlan=>({id,name,ruleType,description});
export function buildApoloTrials():ApoloTrialPlan[]{
  const definitions:Array<[string,string,string,string[]]> = [
    ['w1','apolo-bosque','Bosque de Bruma',['Furtivo','Escalador']],
    ['w2','apolo-savana','Planícies do Sol Alto',['Rápido','Forte']],
    ['w3','apolo-verde','Verde Infinito',['Voador','Manipulador']],
    ['w4','apolo-aurora','Terras da Aurora',['Resistente','Aquático']],
    ['w5','apolo-coral','Eucalipto e Coral',['Aquático','Saltador']],
    ['w6','apolo-lanternas','Bambu e Lanternas',['Precisão','Escalador']],
  ];
  return definitions.map(([worldId,areaId,label,cats])=>({
    id:`trial-${worldId}`,worldId,areaId,name:`Provação de Apolo — ${label}`,
    description:'Área opcional extremamente desafiante, dividida em secções configuráveis.',
    unlockedAtWorld100:true,countsForBaseCompletion:false,rewardApoloRunes:1,
    auraReward:'Após reunir as seis Runas de Apolo: Emblema de Apolo e aura de fogo.',
    status:'planejado',notes:'A ordem em que as seis runas são obtidas não importa.',sections:[
      {...section(`trial-${worldId}-1`,'Domínio da forma','animal','Concluir com um animal específico e troca bloqueada.'),requiredAnimalId:undefined},
      {...section(`trial-${worldId}-2`,'Domínio da categoria','categoria','Usar apenas animais das categorias locais.'),requiredCategories:cats},
      {...section(`trial-${worldId}-3`,'Ritmo de Apolo','tempo','Atravessar a secção antes do limite.'),timeLimitSeconds:60},
      {...section(`trial-${worldId}-4`,'Limpeza da arena','derrotar','Derrotar todos ou uma quantidade configurada de inimigos.'),enemyCount:8},
      {...section(`trial-${worldId}-5`,'Colheita perfeita','coletar','Coletar todas as Sementes ou um objeto específico.'),collectTarget:'Todas as Sementes'},
    ],
  }));
}

export const tutorialMessages:TutorialMessagePlan[]=[
  {id:'tutorial-jukebox',title:'Jukebox desbloqueado',priority:'importante',text:'O menu Jukebox foi revelado. Encontre Melodias Selvagens para ouvir as músicas das áreas.',requireConfirmation:true,allowPagination:true,triggerContext:'Primeira compra do Jukebox',relatedItemId:'item-jukebox',status:'planejado',archived:false,notes:'Abrir menu, mostrar tutorial, fechar e continuar compra.'},
  {id:'tutorial-oxigenio',title:'Oxigénio limitado',priority:'media',text:'Esta forma consegue mergulhar, mas precisa voltar à superfície ou tocar numa Bolha de Ar.',requireConfirmation:true,allowPagination:false,triggerContext:'Primeiro mergulho de forma terrestre',status:'planejado',archived:false,notes:'Ancorar perto da mini-HUD de oxigénio.'},
  {id:'tutorial-nao-nada',title:'Esta forma não sabe nadar',priority:'importante',text:'Ao cair em água profunda, esta forma afunda. Use outra transformação antes de entrar.',requireConfirmation:true,allowPagination:true,triggerContext:'Tutorial individual do animal',status:'planejado',archived:false,notes:'Obrigatório quando tutorialWarnCannotSwim estiver ativo.'},
  {id:'tutorial-prova-concluida',title:'Provação de Gaia concluída',priority:'nao_importante',text:'A recompensa foi recebida. O portal agora mostra o estado concluído.',requireConfirmation:false,allowPagination:false,triggerContext:'Saída de uma Provação de Gaia',status:'planejado',archived:false,notes:'Toast no topo sem sobrepor HUD.'},
];

export const localizationPlan:LocalizationPlan={
  defaultConfiguredLanguage:'portugues',fallbackLanguage:'english',detectSystemLanguage:true,persistSelection:true,
  languages:[
    {id:'english',label:'English',enabled:false,configured:false},
    {id:'portugues',label:'Português',enabled:true,configured:true},
    {id:'espanhol',label:'Español',enabled:false,configured:false},
    {id:'frances',label:'Français',enabled:false,configured:false},
    {id:'japones',label:'日本語',enabled:false,configured:false},
  ],
  notes:'Enquanto apenas Português estiver configurado, projetos novos iniciam em Português. Quando o Inglês estiver pronto, sistemas não suportados devem usar English como fallback. A escolha do jogador é persistida e existe no menu inicial e no menu +.',
};
