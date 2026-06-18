import type { AreaDef, AnimalDef, BossDef, ChangeLogEntry, EmblemDef, GaiaMapEdge, GaiaMapNode, IdeaDef, ItemDef, MechanicDef, ProjectState, WorldDef } from '../types';
import { PROJECT_SCHEMA_VERSION } from '../config/suiteManifest';
import { apoloAreas, backup18Items, backup18Mechanics, buildApoloTrials, buildBackup18Ideas, buildCompleteMusic, buildWhispers, irisBase, localizationPlan, tutorialMessages } from './backup18';

const themes = {
  gaia: { primary: '#4fae8a', secondary: '#d6b15b', soft: '#18362f', textOnPrimary: '#08130f', pattern: 'runa' },
  bosque: { primary: '#6ba86e', secondary: '#c6a86a', soft: '#203a2b', textOnPrimary: '#071109', pattern: 'folhas' },
  savana: { primary: '#d6a94d', secondary: '#a76035', soft: '#44341f', textOnPrimary: '#1c1205', pattern: 'capim' },
  amazonia: { primary: '#30a66b', secondary: '#55c6b0', soft: '#173b2b', textOnPrimary: '#04120a', pattern: 'cipos' },
  artico: { primary: '#7dc9e8', secondary: '#a9a0e8', soft: '#203744', textOnPrimary: '#061015', pattern: 'aurora' },
  coral: { primary: '#e77b72', secondary: '#56c5c0', soft: '#3f2a34', textOnPrimary: '#180607', pattern: 'coral' },
  asia: { primary: '#d45f55', secondary: '#e0b24c', soft: '#402326', textOnPrimary: '#160706', pattern: 'lanternas' },
};

export const worlds: WorldDef[] = [
  { id: 'w0', name: 'Coração de Gaia', lesson: 'Origem, escolha e a ferida do mundo.', bossId: 'boss-mao', theme: themes.gaia, backgroundImages: [], notes: '' },
  { id: 'w1', name: 'Bosque de Bruma', lesson: 'A natureza regenera, mas as marcas humanas persistem.', villageId: 'vila-clareira', regionalItemId: 'item-resina', bossId: 'boss-ferro', theme: themes.bosque, backgroundImages: [], notes: '' },
  { id: 'w2', name: 'Planícies do Sol Alto', lesson: 'A vida corre em grupo — e o lixo corre junto se for deixado.', villageId: 'vila-oasis', regionalItemId: 'item-po', bossId: 'boss-sol', theme: themes.savana, backgroundImages: [], notes: '' },
  { id: 'w3', name: 'Verde Infinito', lesson: 'Biodiversidade é riqueza — e fogo é silêncio acelerado.', villageId: 'vila-copas', regionalItemId: 'item-nectar', bossId: 'boss-fogo', theme: themes.amazonia, backgroundImages: [], notes: '' },
  { id: 'w4', name: 'Terras da Aurora', lesson: 'Quando o gelo cede, o mundo muda sem pedir licença.', villageId: 'vila-pinheiro', regionalItemId: 'item-cristal', bossId: 'boss-degelo', theme: themes.artico, backgroundImages: [], notes: '' },
  { id: 'w5', name: 'Reino do Eucalipto e Coral', lesson: 'O oceano é vasto, mas não consegue digerir o que não é vida.', villageId: 'vila-baia', regionalItemId: 'item-bolha', bossId: 'boss-rede', theme: themes.coral, backgroundImages: [], notes: '' },
  { id: 'w6', name: 'Montanhas do Bambu e Lanternas', lesson: 'Luz e ruído desorientam a vida — e a pressa apaga o sagrado.', villageId: 'vila-lanternas', regionalItemId: 'item-incenso', bossId: 'boss-sino', theme: themes.asia, backgroundImages: [], notes: '' },
];

const area = (id: string, worldId: string, name: string, accessCost: number, runeTarget: number, description: string, animalUnlockId?: string): AreaDef => ({
  id, worldId, name, type: 'fase', accessCost, runeTarget, whisperTarget: 5, chestTarget: 2, npcTarget: 2, fragmentTarget: 1, ecoTarget:15, melodyTarget:1, countsForBaseCompletion:true,
  sceneName: '', description, centralMechanicIds: [], animalUnlockId, musicTrackIds: [], gallery: [], notes: '',
});
const village = (id: string, worldId: string, name: string): AreaDef => ({
  id, worldId, name, type: 'vila', accessCost: 0, runeTarget: 0, whisperTarget: 0, chestTarget: 0, npcTarget: 0, fragmentTarget: 0, ecoTarget:0, melodyTarget:0, countsForBaseCompletion:true,
  sceneName: '', description: 'Vila evolutiva com estados Vazia, Viva/Restaurada e Pós-boss.', centralMechanicIds: [], musicTrackIds: [], gallery: [], notes: '',
});
const bossArea = (id: string, worldId: string, name: string, description: string): AreaDef => ({
  id, worldId, name, type: 'boss', accessCost: 0, runeTarget: 5, whisperTarget: 0, chestTarget: 0, npcTarget: 0, fragmentTarget: 0, ecoTarget:0, melodyTarget:0, countsForBaseCompletion:true,
  sceneName: '', description, centralMechanicIds: [], musicTrackIds: [], gallery: [], notes: '',
});

export const areas: AreaDef[] = [
  { id: 'coracao-gaia', worldId: 'w0', name: 'Coração de Gaia', type: 'hub', accessCost: 0, runeTarget: 1, whisperTarget: 0, chestTarget: 0, npcTarget: 0, fragmentTarget: 0, ecoTarget:0, melodyTarget:0, countsForBaseCompletion:true, sceneName: '', description: 'Primeira cena jogável, Cavalo preso, Terra de Gaia e entrada do caminho final.', centralMechanicIds: [], animalUnlockId: 'cavalo', musicTrackIds: [], gallery: [], notes: '' },
  { id: 'caminho-ferimento', worldId: 'w0', name: 'O Caminho do Ferimento', type: 'final', accessCost: 1, runeTarget: 0, whisperTarget: 0, chestTarget: 0, npcTarget: 0, fragmentTarget: 0, ecoTarget:0, melodyTarget:0, countsForBaseCompletion:true, sceneName: '', description: 'Dungeon final linear com seis secções temáticas.', centralMechanicIds: [], musicTrackIds: [], gallery: [], notes: '', sections: ['Secção da Bruma', 'Secção do Sol', 'Secção do Rio Verde', 'Secção da Aurora', 'Secção do Coral', 'Secção das Lanternas'] },
  village('vila-clareira', 'w1', 'Clareira dos Contos'),
  area('trilho-musgo', 'w1', 'Trilho do Musgo', 1, 7, 'Tutorial de exploração, baús fáceis e primeiras pistas humanas.', 'raposa'),
  area('ruinas-heranca', 'w1', 'Ruínas da Herança', 3, 8, 'Plataformas que desabam, portas por alavanca e inimigos simples.'),
  area('riacho-castores', 'w1', 'Riacho dos Castores', 5, 9, 'Correnteza baixa, troncos móveis, rotas alternativas e madeira.', 'castor'),
  area('copas-nebulosas', 'w1', 'Copas Nebulosas', 8, 7, 'Precisão aérea, correntes de vento e verticalidade.', 'coruja'),
  area('fendas-texugo', 'w1', 'Fendas do Texugo', 10, 8, 'Escavação, túneis e passagens apertadas.', 'texugo'),
  area('pedreira-antiga', 'w1', 'Pedreira Antiga', 13, 9, 'Blocos pesados, quedas controladas e estruturas humanas.'),
  area('pantano-arame', 'w1', 'Pântano do Arame', 15, 7, 'Lama, arame, resistência, furtividade e timing.', 'cervo'),
  bossArea('coroa-arame', 'w1', 'Coroa do Arame', 'Arena do Guardião do Ferro Enraizado.'),

  village('vila-oasis', 'w2', 'Oásis do Tambor'),
  area('capim-primeiro-vento', 'w2', 'Capim do Primeiro Vento', 1, 8, 'Planície aberta, velocidade e trilhas de colecionáveis.', 'guepardo'),
  area('pedras-suricata', 'w2', 'Pedras do Suricata', 2, 7, 'Passagens baixas, tocas e stealth.', 'suricata'),
  area('ravina-baoba', 'w2', 'Ravina do Baobá', 6, 8, 'Escalada, balanços e manipulação.', 'babuino'),
  area('rota-sombras', 'w2', 'Rota das Sombras', 8, 7, 'Noite, detecção e rotas furtivas.'),
  area('rio-passagem-lenta', 'w2', 'Rio da Passagem Lenta', 11, 9, 'Timing, empurrões e inimigos levados para a água.', 'elefante'),
  area('tempestade-poeira', 'w2', 'Tempestade de Poeira', 12, 8, 'Vento lateral, aderência e saltos longos.', 'avestruz'),
  area('circulo-cacada', 'w2', 'Círculo da Caçada', 15, 8, 'Perseguição e libertação do animal secreto.', 'leao'),
  bossArea('zenite-quebrado', 'w2', 'Zénite Quebrado', 'Arena do Sol de Plástico.'),

  village('vila-copas', 'w3', 'Aldeia das Copas'),
  area('varzea-sussurro', 'w3', 'Várzea do Sussurro', 1, 8, 'Lama, raízes, água rasa e perigos no chão.', 'sapo'),
  area('pontes-copas', 'w3', 'Pontes das Copas', 4, 8, 'Passarelas altas, vento leve e travessia aérea.', 'arara'),
  area('caverna-biolume', 'w3', 'Caverna Biolume', 6, 7, 'Escuro, luz e plataformas falsas.'),
  area('queda-aguas', 'w3', 'Queda das Águas', 7, 8, 'Cascatas, vapor e caminhos verticais.', 'cobra'),
  area('labirinto-cipos', 'w3', 'Labirinto de Cipós', 11, 7, 'Puxar, balançar e rotas por categorias.', 'preguica'),
  area('ninho-arara', 'w3', 'Ninho da Arara', 12, 9, 'Sequência aérea e portais de desafio.'),
  area('trilha-armadilhas', 'w3', 'Trilha das Armadilhas', 14, 8, 'Jaulas, redes e múltiplas soluções de resgate.', 'onca'),
  bossArea('boca-cinza', 'w3', 'Boca da Cinza', 'Arena da Garganta do Fogo.'),

  village('vila-pinheiro', 'w4', 'Refúgio do Pinheiro Branco'),
  area('margem-aurora', 'w4', 'Margem da Aurora', 1, 7, 'Introdução a gelo e vento suave.', 'urso-polar'),
  area('lago-espelho', 'w4', 'Lago do Espelho', 4, 9, 'Puzzles de deslize e controlo no gelo.', 'pinguim'),
  area('bosque-boreal', 'w4', 'Bosque Boreal', 5, 8, 'Galhos móveis, neve e emboscadas.'),
  area('caverna-geada', 'w4', 'Caverna de Geada', 9, 7, 'Estalactites, timing e camuflagem.', 'raposa-artica'),
  area('mar-banquisas', 'w4', 'Mar de Banquisas', 11, 8, 'Placas móveis, correntes e transição aquática.', 'orca'),
  area('cordilheira-alce', 'w4', 'Cordilheira do Alce', 12, 8, 'Subida, vento forte e saltos pesados.', 'alce'),
  area('poco-oleo', 'w4', 'Poço de Óleo', 13, 8, 'Gelo manchado, óleo, stealth e inimigos agressivos.'),
  bossArea('fenda-degelo', 'w4', 'Fenda do Degelo', 'Arena do Gigante do Degelo.'),

  village('vila-baia', 'w5', 'Baía do Eucalipto'),
  area('trilha-eucalipto', 'w5', 'Trilha do Eucalipto', 1, 9, 'Escalada simples e segredos em troncos.', 'coala'),
  area('rochedos-vermelhos', 'w5', 'Rochedos Vermelhos', 6, 9, 'Falésias, saltos longos, vento e risco.', 'canguru'),
  area('toca-wombat', 'w5', 'Toca do Wombat', 8, 8, 'Túneis, rochas e força subterrânea.', 'wombat'),
  area('noite-diabo', 'w5', 'Noite do Diabo', 10, 10, 'Escuridão, combate e stealth opcional.', 'diabo-tasmania'),
  area('lagoa-correntes', 'w5', 'Lagoa das Correntes', 14, 9, 'Água, correntes e resistência aquática.', 'tartaruga'),
  area('jardim-coral', 'w5', 'Jardim do Coral Vivo', 16, 10, 'Correntes, puxar objetos e alavancas múltiplas.', 'polvo'),
  bossArea('anzol-abissal', 'w5', 'Anzol Abissal', 'Arena da Maré de Rede.'),

  village('vila-lanternas', 'w6', 'Pátio das Lanternas'),
  area('bambu-alvorecer', 'w6', 'Bambu do Alvorecer', 1, 9, 'Saltos rítmicos, bambus e stealth leve.', 'urso-panda'),
  area('arrozais-vidro', 'w6', 'Arrozais de Vidro', 5, 8, 'Água rasa, reflexos e pisos escorregadios.'),
  area('telhados-santuario', 'w6', 'Telhados do Santuário', 9, 9, 'Precisão aérea e pousos delicados.', 'garca'),
  area('escadarias-dragao', 'w6', 'Escadarias do Dragão', 11, 10, 'Rampas, rolagem e impulso vertical.', 'pangolim'),
  area('mercado-abandonado', 'w6', 'Mercado Abandonado', 13, 9, 'Lasers, armadilhas humanas e rotas furtivas.', 'panda-vermelho'),
  area('vale-eco', 'w6', 'Vale do Eco', 16, 10, 'Ondas sonoras, plataformas falsas e animal secreto.', 'tigre'),
  bossArea('torre-eco', 'w6', 'Torre do Eco', 'Arena do Sino do Ruído.'),
];
areas.push(...apoloAreas);

const animal = (id: string, worldId: string, unlockAreaId: string, name: string, categories: string[], abilities: string[], canAttack: boolean, attackTags: string[], puzzleUses: string[], weaknesses: string[] = []): AnimalDef => ({
  id, worldId, unlockAreaId, name, categories, abilities, canAttack, attackTags, puzzleUses, weaknesses,
});

export const animals: AnimalDef[] = [
  animal('cavalo','w0','coracao-gaia','Cavalo',['Rápido','Predador'],['Sprint controlado','Coice/Investida'],true,['impacto','investida'],['corridas','placas largas','empurrar blocos médios']),
  animal('raposa','w1','trilho-musgo','Raposa',['Rápido','Furtivo'],['Dash curto','Passos silenciosos'],true,['impacto leve'],['portas temporizadas','fendas médias','detecção']),
  animal('coruja','w1','copas-nebulosas','Coruja',['Voador','Percepção'],['Planar','Visão no escuro'],false,[],['abismos','correntes de ar','plataformas ocultas']),
  animal('texugo','w1','fendas-texugo','Texugo',['Forte','Escavador'],['Escavar','Empurrar blocos'],true,['impacto','escavação'],['solo macio','túneis','placas de peso']),
  animal('castor','w1','riacho-castores','Castor',['Forte','Escalador'],['Roer madeira','Escalar/puxar troncos'],true,['mordida','impacto'],['troncos','pontes','barragens']),
  animal('cervo','w1','pantano-arame','Cervo',['Saltador','Resistente'],['Salto alto','Investida de empurrão'],true,['impacto','investida'],['plataformas altas','pântanos','empurrões']),
  animal('guepardo','w2','capim-primeiro-vento','Guepardo',['Rápido'],['Sprint extremo','Arranque'],true,['impacto rápido'],['corridas','trilhas','portas temporizadas']),
  animal('suricata','w2','pedras-suricata','Suricata',['Furtivo'],['Entrar em tocas','Camuflagem curta'],false,[],['tocas','patrulhas','fendas baixas']),
  animal('babuino','w2','ravina-baoba','Babuíno',['Escalador','Manipulador'],['Cipós','Puxar/arremessar'],false,[],['alavancas distantes','objetos pendurados','reposicionamento']),
  animal('elefante','w2','rio-passagem-lenta','Elefante',['Forte','Resistente'],['Empurrar muito pesado','Quebrar barreiras'],true,['impacto pesado'],['placas de peso','paredes rachadas','vento forte']),
  animal('avestruz','w2','tempestade-poeira','Avestruz',['Rápido','Saltador'],['Corrida estável','Salto longo'],true,['coice'],['buracos largos','vento lateral','terreno irregular']),
  animal('leao','w2','circulo-cacada','Leão',['Predador','Secreto'],['Golpe pesado','Rugido atordoador'],true,['garra','rugido','impacto'],['inimigos robustos','atalhos de combate']),
  animal('sapo','w3','varzea-sussurro','Sapo',['Saltador','Manipulador'],['Salto alto','Língua para puxar'],false,[],['alvos distantes','lama','folhas móveis']),
  animal('arara','w3','pontes-copas','Arara',['Voador'],['Planar','Subir em correntes quentes'],false,[],['correntes ascendentes','copas','travessias aéreas']),
  animal('cobra','w3','queda-aguas','Cobra',['Furtivo','Escalador'],['Fendas muito baixas','Subir postes'],true,['mordida'],['labirintos baixos','postes','stealth']),
  animal('onca','w3','trilha-armadilhas','Onça-pintada',['Predador','Rápido'],['Corrida curta','Salto ofensivo'],true,['garra','impacto'],['armadilhas','inimigos móveis','saltos ofensivos']),
  animal('preguica','w3','labirinto-cipos','Preguiça',['Resistente','Escalador'],['Agarre prolongado','Resistência a knockback'],false,[],['paredes longas','hazards lentos','rotas de paciência']),
  animal('urso-polar','w4','margem-aurora','Urso Polar',['Forte','Predador'],['Quebrar gelo','Golpe pesado'],true,['garras','impacto pesado'],['gelo quebradiço','blocos de neve','inimigos robustos']),
  animal('pinguim','w4','lago-espelho','Pinguim',['Rápido','Resistente'],['Deslize controlado','Travagem'],true,['impacto deslizando'],['gelo','rampas','pistas temporizadas']),
  animal('raposa-artica','w4','caverna-geada','Raposa-do-ártico',['Furtivo'],['Camuflagem na neve','Passos silenciosos'],false,[],['patrulhas','luz fria','rotas baixas']),
  animal('orca','w4','mar-banquisas','Orca',['Aquático','Rápido'],['Nado rápido','Investida subaquática'],true,['impacto aquático'],['correntes geladas','cavernas submersas']),
  animal('alce','w4','cordilheira-alce','Alce',['Forte','Saltador'],['Salto pesado','Empurrão com chifres'],true,['impacto','chifres'],['subidas','vento forte','placas altas']),
  animal('coala','w5','trilha-eucalipto','Coala',['Resistente','Escalador'],['Agarrar troncos','Reduzir knockback'],false,[],['troncos altos','rotas seguras','hazards lentos']),
  animal('canguru','w5','rochedos-vermelhos','Canguru',['Saltador'],['Salto carregado','Pancada de empurrão'],true,['chute','impacto'],['falésias','trampolins','plataformas largas']),
  animal('wombat','w5','toca-wombat','Wombat',['Forte','Secreto'],['Empurrar rochas','Abrir túneis'],true,['impacto','escavação'],['túneis','placas de peso','baús secretos']),
  animal('diabo-tasmania','w5','noite-diabo','Diabo-da-tasmânia',['Predador'],['Ataques rápidos','Rodopio'],true,['corte','rodopio'],['barreiras fracas','arenas pequenas']),
  animal('tartaruga','w5','lagoa-correntes','Tartaruga Marinha',['Aquático','Resistente'],['Escudo/empurrão','Resistir correntes'],true,['impacto','escudo'],['correntes','ganchos','hazards aquáticos']),
  animal('polvo','w5','jardim-coral','Polvo',['Aquático','Escalador'],['Agarrar/puxar','Ativar alavancas rapidamente'],false,[],['alavancas duplas','portas aquáticas','objetos puxáveis']),
  animal('urso-panda','w6','bambu-alvorecer','Urso Panda',['Forte','Furtivo'],['Empurrar bambu/caixas','Camuflagem no bambu'],true,['impacto'],['bambuzais','placas','sombras']),
  animal('gibao','w6','bambu-alvorecer','Gibão',['Escalador','Rápido'],['Balançar em cipós','Puxar objetos'],false,[],['sinos','alavancas penduradas','rotas rápidas']),
  animal('garca','w6','telhados-santuario','Garça',['Voador','Precisão'],['Planar preciso','Pouso suave'],false,[],['telhados','plataformas estreitas','lanternas']),
  animal('pangolim','w6','escadarias-dragao','Pangolim',['Resistente','Forte'],['Enrolar','Rolar e empurrar'],true,['impacto rolando'],['rampas','ruído','objetos roláveis']),
  animal('panda-vermelho','w6','mercado-abandonado','Panda-vermelho',['Furtivo','Escalador'],['Subir bambu','Passos silenciosos'],false,[],['lasers','mercados','rotas discretas']),
  animal('tigre','w6','vale-eco','Tigre',['Predador','Secreto'],['Golpe pesado','Investida/Rugido'],true,['garra','impacto','rugido'],['inimigos fortes','bosses']),
];
animals.unshift(irisBase);

export const items: ItemDef[] = [
  { id:'item-casca', name:'Casca Serenna', kind:'global', description:'Bloqueia o próximo golpe normal; mortes especiais/IgnoreDefense podem atravessar.', technicalDefaults:'Até 30 s ou até bloquear 1 golpe.', defaultPrice:60, notes:'', status:'planejado', archived:false },
  { id:'item-orvalho', name:'Orvalho Veloz', kind:'global', description:'Aumenta temporariamente a velocidade de Íris.', technicalDefaults:'1,3x por 10 s.', defaultPrice:45, notes:'', status:'planejado', archived:false },
  { id:'item-flor', name:'Flor do Silêncio', kind:'global', description:'Adormece inimigos numa área; bosses são sempre imunes.', technicalDefaults:'Duração padrão: 4 s.', defaultPrice:70, notes:'', status:'planejado', archived:false },
  { id:'item-raiz', name:'Raiz de Aderência', kind:'global', description:'Reduz knockback e melhora o controlo contra derrapagem.', technicalDefaults:'Duração padrão: 20 s; multiplicadores configuráveis.', defaultPrice:55, notes:'', status:'planejado', archived:false },
  { id:'item-luz', name:'Luz de Gaia', kind:'global', description:'Destaca colecionáveis próximos.', technicalDefaults:'Raio 8; duração 6 s.', defaultPrice:80, notes:'', status:'planejado', archived:false },
  { id:'item-resina', name:'Resina Antiga', kind:'regional', worldId:'w1', description:'Imobiliza inimigos; pode puxar voadores para baixo e afundar aquáticos.', technicalDefaults:'Duração padrão: 3 s.', defaultPrice:50, notes:'', status:'planejado', archived:false },
  { id:'item-po', name:'Pó Dourado', kind:'regional', worldId:'w2', description:'Torna Íris invisível, faz inimigos perderem o alvo e bloqueia dano ofensivo durante o efeito.', technicalDefaults:'Duração padrão: 3 s.', defaultPrice:50, notes:'', status:'planejado', archived:false },
  { id:'item-nectar', name:'Néctar Verde', kind:'regional', worldId:'w3', description:'Regenera vida rapidamente.', technicalDefaults:'2 corações em 4 s.', defaultPrice:50, notes:'', status:'planejado', archived:false },
  { id:'item-cristal', name:'Cristal de Gelo', kind:'regional', worldId:'w4', description:'Congela inimigos numa área; não congela projéteis no sistema atual.', technicalDefaults:'Duração padrão: 3 s.', defaultPrice:50, notes:'', status:'planejado', archived:false },
  { id:'item-bolha', name:'Bolha de Coral', kind:'regional', worldId:'w5', description:'Concede imunidade temporária a correntes de água.', technicalDefaults:'Duração padrão: 12 s.', defaultPrice:50, notes:'', status:'planejado', archived:false },
  { id:'item-incenso', name:'Incenso do Vento', kind:'regional', worldId:'w6', description:'Aplica um impulso vertical instantâneo.', technicalDefaults:'Força 14; referência aproximada de 5 unidades.', defaultPrice:50, notes:'', status:'planejado', archived:false },
  { id:'upgrade-ima', name:'Íman de Sementes', kind:'upgrade', description:'Ativa a atração de colecionáveis próximos.', technicalDefaults:'ID técnico: iman_de_sementes.', toggleable:true, defaultPrice:220, notes:'', status:'planejado', archived:false },
  { id:'upgrade-ritmo', name:'Ritmo Instintivo', kind:'upgrade', description:'Reduz o cooldown base de transformação.', technicalDefaults:'ID técnico: ritmo_instintivo.', toggleable:true, defaultPrice:260, notes:'', status:'planejado', archived:false },
  { id:'upgrade-pele', name:'Pele Serena', kind:'upgrade', description:'Reduz em 50% o dano recebido.', technicalDefaults:'ID técnico: pele_serena.', toggleable:true, defaultPrice:300, notes:'', status:'planejado', archived:false },
    { id:'upgrade-visao', name:'Visão da Terra de Gaia', kind:'upgrade', description:'Revela nomes, custos e totais do mundo atual sem desbloquear ou viajar.', technicalDefaults:'A observação não atravessa para outros mundos.', toggleable:true, defaultPrice:400, notes:'', status:'planejado', archived:false },
  { id:'upgrade-dificil', name:'Juramento Difícil', kind:'upgrade', description:'Dano recebido x2 e regeneração automática desativada.', technicalDefaults:'ID técnico: juramento_dificil.', toggleable:true, defaultPrice:0, notes:'Brotos e itens de cura continuam válidos.', status:'planejado', archived:false },
  { id:'item-broto', name:'Broto de Vida', kind:'consumivel', description:'Pickup encontrado no chão que recupera vida imediatamente ao ser recolhido.', technicalDefaults:'Cura imediata; não entra no inventário e não é a versão comprável.', defaultPrice:0, notes:'A cura comprada chama-se Seiva Vital.', status:'planejado', archived:false, pickupBehavior:'imediato' },
];
items.push(...backup18Items);

const mechanic = (id:string,name:string,kind:MechanicDef['kind'],description:string,categories:string[],animals:string[],icon:string,source:MechanicDef['source']='GDD',firstSuggestedAreaId?:string):MechanicDef => ({ id,name,kind,description,goodForCategories:categories,goodForAnimals:animals,firstSuggestedAreaId,icon,source,archived:false });
export const mechanics: MechanicDef[] = [
  mechanic('mec-placa','Botão de peso','objeto','Placa acionada por peso.',['Forte','Resistente'],['Elefante','Urso Polar','Alce','Wombat','Pangolim','Cavalo'],'⬇','GDD','ruinas-heranca'),
  mechanic('mec-alavanca','Alavanca','objeto','Alterna porta, plataforma ou estado de puzzle.',['Escalador','Manipulador'],['Babuíno','Polvo','Sapo','Castor'],'↕','GDD','ruinas-heranca'),
  mechanic('mec-alavanca-dupla','Alavanca dupla','puzzle','Duas ativações dentro de uma janela.',['Rápido','Escalador','Aquático'],['Guepardo','Raposa','Babuíno','Polvo','Gibão'],'⧉'),
  mechanic('mec-bloco-empurravel','Bloco empurrável','objeto','Bloco deslocável para abrir caminho ou pressionar placas.',['Forte','Resistente'],['Elefante','Texugo','Wombat','Urso Polar','Alce'],'▣','GDD','pedreira-antiga'),
  mechanic('mec-bloco-arrastavel','Bloco arrastável','objeto','Objeto puxado para fora de encaixes.',['Escalador','Manipulador','Forte'],['Babuíno','Polvo','Sapo','Castor','Gibão'],'◫'),
  mechanic('mec-tronco','Tronco roível','gate','Madeira que pode cair como ponte ou abrir rota.',['Forte','Escalador'],['Castor','Wombat','Elefante'],'🪵','GDD','riacho-castores'),
  mechanic('mec-barreira','Barreira quebrável','gate','Parede rachada quebrada por força ou impacto.',['Forte','Predador'],['Elefante','Urso Polar','Leão','Tigre','Wombat'],'◩','GDD','pedreira-antiga'),
  mechanic('mec-fenda','Fenda pequena','gate','Passagem para animais pequenos ou furtivos.',['Furtivo','Escavador'],['Suricata','Raposa','Cobra','Sapo','Wombat'],'⇥','GDD','trilho-musgo'),
  mechanic('mec-corrente-ar','Corrente de ar','hazard','Vento que empurra ou sustenta voo.',['Voador','Saltador','Resistente'],['Coruja','Arara','Garça','Cervo','Alce'],'≈','GDD','copas-nebulosas'),
  mechanic('mec-corrente-agua','Corrente de água','hazard','Fluxo que empurra dentro da água.',['Aquático','Resistente'],['Orca','Tartaruga Marinha','Polvo'],'≋','GDD','lagoa-correntes'),
  mechanic('mec-laser','Laser / luz de detecção','hazard','Cone ou feixe que detecta e ativa perigo.',['Furtivo','Rápido','Resistente'],['Raposa','Suricata','Raposa-do-ártico','Panda-vermelho'],'⌁','GDD','rota-sombras'),
  mechanic('mec-drone','Drone patrulha','hazard','Inimigo móvel com rota e campo de visão.',['Furtivo','Predador','Rápido'],['Raposa','Onça-pintada','Tigre','Guepardo'],'◉','GDD','trilho-musgo'),
  mechanic('mec-porta-tempo','Porta temporizada','gate','Abre por alguns segundos após uma ação.',['Rápido','Saltador','Voador'],['Guepardo','Raposa','Avestruz','Canguru','Coruja'],'⏱','GDD','capim-primeiro-vento'),
  mechanic('mec-plataforma-movel','Plataforma móvel','plataforma','Segue rota automática ou ativada.',['Saltador','Voador'],['Cervo','Canguru','Coruja','Garça'],'▰','GDD','ruinas-heranca'),
  mechanic('mec-plataforma-falsa','Plataforma falsa','plataforma','Desaparece ou precisa ser revelada.',['Voador','Percepção','Furtivo'],['Coruja','Garça','Raposa-do-ártico'],'▧','GDD','caverna-biolume'),
  mechanic('mec-piso-escorregadio','Piso escorregadio','hazard','Gelo, óleo ou superfície de baixa fricção.',['Resistente','Rápido'],['Pinguim','Pangolim','Tartaruga Marinha'],'⇝','GDD','lago-espelho'),
  mechanic('mec-gelo-quebradico','Gelo quebradiço','hazard','Quebra por peso ou impacto.',['Forte','Voador'],['Urso Polar','Elefante','Coruja','Garça'],'❄','GDD','margem-aurora'),
  mechanic('mec-parede-escalavel','Parede escalável','plataforma','Superfície própria para agarrar e subir.',['Escalador'],['Babuíno','Cobra','Preguiça','Coala','Gibão'],'↥','GDD','ravina-baoba'),
  mechanic('mec-tunel','Toca / túnel','gate','Passagem subterrânea ou baixa.',['Furtivo','Escavador'],['Suricata','Texugo','Cobra','Wombat'],'◖','GDD','pedras-suricata'),
  mechanic('mec-rede','Armadilha de rede','hazard','Prende, atrasa ou guarda NPCs.',['Forte','Furtivo','Predador'],['Elefante','Suricata','Onça-pintada','Leão','Tigre'],'#','GDD','trilha-armadilhas'),
  mechanic('mec-puxavel','Objeto puxável','objeto','Alvo distante puxado por língua, tentáculo ou corda.',['Manipulador','Escalador','Aquático'],['Sapo','Polvo','Babuíno','Gibão'],'↤','GDD','varzea-sussurro'),
  mechanic('mec-arremessavel','Objeto arremessável','objeto','Objeto lançado contra alvo, botão ou inimigo.',['Manipulador','Escalador'],['Babuíno','Gibão','Sapo'],'◒','GDD','ravina-baoba'),
  mechanic('mec-ruido','Zona de ruído','hazard','Ondas sonoras empurram ou desorientam.',['Resistente','Furtivo'],['Pangolim','Panda-vermelho','Urso Panda'],')))','GDD','vale-eco'),
  mechanic('mec-oleo-fogo','Óleo / fogo / plástico','hazard','Hazard ambiental causado por interferência humana.',['Resistente','Aquático','Voador'],['Tartaruga Marinha','Orca','Arara','Preguiça'],'♨'),
  mechanic('mec-npc-assustado','NPC assustado / fugitivo','puzzle','NPC foge se o jogador se aproximar de forma ameaçadora.',['Furtivo'],['Suricata','Raposa','Panda-vermelho','Raposa-do-ártico'],'!','GDD','rota-sombras'),
  mechanic('mec-portal','Portal de desafio','gate','Entrada para desafio opcional ou prova especial.',['Variável'],[],'◯','GDD','copas-nebulosas'),
];
mechanics.push(...backup18Mechanics);

const boss = (id:string,worldId:string,areaId:string,name:string,part:string,final:string):BossDef => ({
  id, worldId, areaId, name, rewardRunes:5, conceptArt:undefined, notes:'', status:'planejado', phases:[
    { id:`${id}-f1`, title:'Fase 1 — Leitura', description:`Apresenta o padrão principal e as partes de ${part}.`, recommendedAnimalIds:[], recommendedAbilities:[] },
    { id:`${id}-f2`, title:'Fase 2 — Pressão', description:`Após destruir parte de ${part}, o ritmo aumenta e combina ataques.`, recommendedAnimalIds:[], recommendedAbilities:[] },
    { id:`${id}-f3`, title:'Fase 3 — Núcleo exposto', description:final, recommendedAnimalIds:[], recommendedAbilities:[] },
  ]
});
export const bosses: BossDef[] = [
  boss('boss-ferro','w1','coroa-arame','Guardião do Ferro Enraizado','raízes blindadas','O núcleo de ferro fica vulnerável após as raízes caírem.'),
  boss('boss-sol','w2','zenite-quebrado','Sol de Plástico','raios/fontes de luz','O sol artificial fica exposto quando suas fontes são apagadas.'),
  boss('boss-fogo','w3','boca-cinza','Garganta do Fogo','condutos de fogo','A garganta abre uma janela de vulnerabilidade entre jatos de fogo.'),
  boss('boss-degelo','w4','fenda-degelo','Gigante do Degelo','placas de gelo','O núcleo totalmente exposto pode ser atingido antes de recongelar.'),
  boss('boss-rede','w5','anzol-abissal','Maré de Rede','redes/tentáculos','A rede central fica vulnerável após neutralizar os pontos de tração.'),
  boss('boss-sino','w6','torre-eco','Sino do Ruído','badalos/partes sonoras','O silêncio entre ondas revela a janela final.'),
  boss('boss-mao','w0','caminho-ferimento','A Mão que Fere','dedos/partes mecânicas','A estrutura inteira fica aberta para desmontagem final.'),
  boss('boss-mente','w0','caminho-ferimento','A Mente que Mata','núcleos de controle','Boss alternativo: padrões mais rápidos e janelas menores.'),
];

const enemyIdeaTitles = [
  'Drone que espelha o movimento','Torreta que só dispara ao ouvir passos','Compactador que vira plataforma','Boia com rede retrátil','Drone submarino de corrente','Robô-lanterna que cria sombras','Sino móvel de impulso','Serra que corta cipós e abre rotas','Máquina que congela a própria trilha','Drone que carrega blocos','Torreta de projétil refletível','Robô que empurra inimigos para placas','Armadilha que pode prender outros inimigos','Drone de patrulha em pares','Máquina aquática que cria redemoinhos','Robô que apaga plataformas de luz','Torreta presa a trilho vertical','Drone que foge com a Runa','Compactador que quebra gelo','Boia que sobe e desce com maré','Drone que ilumina plataformas falsas','Robô-ímã que puxa objetos metálicos','Torreta que alimenta uma porta','Drone-escudo que bloqueia laser','Máquina que espalha óleo','Robô que sopra vento lateral','Drone que projeta ponte holográfica','Armadilha de laço temporizada','Máquina de ruído com zonas seguras','Torreta em plataforma móvel','Drone que dorme com Flor do Silêncio','Robô que pode ser congelado como plataforma','Máquina que perde equilíbrio com impacto','Drone que ativa botões ao ser puxado','Boia que serve como ponto de agarrar','Robô que segue trilha de luz','Torreta com tiro em arco','Drone que chama reforço','Compactador que alterna direção','Máquina que recolhe Sementes','Drone que foge de animais Predadores','Robô que não detecta formas Furtivas','Torreta que quebra barreiras com o próprio tiro','Drone que cai ao ser preso por Resina','Máquina aquática que morre fora d’água','Robô pesado usado como contrapeso','Drone com cone de detecção rotativo','Armadilha que muda a rota do NPC','Máquina que solta fumaça e oculta lasers','Mini-boss modular com três partes'
];
const puzzleIdeas = [
  ['Peso emprestado','Levar um inimigo empurrável até uma placa para manter a porta aberta.'],
  ['Corrente reversa','Alternar alavancas para inverter a corrente de água e alcançar duas rotas.'],
  ['Luz interrompida','Usar um inimigo como escudo para bloquear um laser contínuo.'],
  ['Trilha de vento','Combinar corrente de ar, plataforma móvel e pouso preciso.'],
  ['Gelo com escolha','Usar animal pesado para quebrar o gelo ou leve para atravessar sem romper.'],
  ['Dois caminhos, uma porta','Cumprir duas tarefas em qualquer ordem antes de abrir a terceira.'],
  ['Runa em fuga','A Runa muda de posição quando o jogador escolhe uma forma inadequada.'],
  ['NPC assustado','Criar uma rota silenciosa para chegar ao NPC sem fazê-lo fugir.'],
  ['Rede refletida','Fazer a própria torreta cortar a rede que bloqueia o caminho.'],
  ['Som e silêncio','Avançar apenas nos intervalos entre ondas de ruído.'],
  ['Ponte de troncos','Roer ou empurrar troncos para montar rotas diferentes.'],
  ['Alavanca distante','Puxar um objeto que aciona uma alavanca fora do alcance.'],
  ['Plataforma congelada','Congelar um inimigo em movimento na posição certa.'],
  ['Portal de precisão','Completar uma sequência com uma habilidade recomendada, sem torná-la obrigatória.'],
  ['Rio em camadas','Alternar superfície e profundidade para acionar mecanismos.'],
];
export const ideas: IdeaDef[] = [
  ...enemyIdeaTitles.map((title,i)=>({ id:`ideia-inimigo-${i+1}`, category:'inimigo' as const, title, description:'Conceito de inimigo orientado a puzzle. Ajuste comportamento, função e fraquezas antes de criar.', suggestedAreaIds:[], tags:['puzzle','inimigo'], discarded:false })),
  ...puzzleIdeas.map(([title,description],i)=>({ id:`ideia-puzzle-${i+1}`, category:'puzzle' as const, title, description, suggestedAreaIds: areas.filter(a=>a.type==='fase').slice(i,i+4).map(a=>a.id), tags:['mecânica','múltiplas soluções'], discarded:false })),
];

ideas.push(...buildBackup18Ideas(areas));

const makeMap = (areaId:string) => ({
  areaId, gridSize:32, unitScale:1, backgroundOpacity:0.35, backgroundImages:[], drawings:[], objects:[],
  layers:{ background:{visible:true,locked:false}, terrain:{visible:true,locked:false}, water:{visible:true,locked:false}, zones:{visible:true,locked:false}, flow:{visible:true,locked:false}, enemy:{visible:true,locked:false}, npc:{visible:true,locked:false}, rune:{visible:true,locked:false}, whisper:{visible:true,locked:false}, chest:{visible:true,locked:false}, fragment:{visible:true,locked:false}, challenge:{visible:true,locked:false}, mechanic:{visible:true,locked:false}, mission:{visible:true,locked:false}, notes:{visible:true,locked:false} },
  showStatusOutlines:true, history:[], future:[]
});



// Consolidação final: decisões do GDD 16/06 + comportamento relevante dos scripts 16/06.
const areaFinalData: Record<string, Partial<AreaDef>> = {
  'coracao-gaia': { unlockMode:'inicio', designType:'santuário central / hub', durationEstimate:'Introdução', setting:'Círculo orgânico, raízes luminosas, bruma e Runas flutuantes.', mainMechanicSummary:'Adotar o Cavalo, aprender movimento, receber a primeira Runa e abrir a Terra de Gaia.', checkpointPlan:'Local de save e retorno seguro.', narrativeMoment:'Íris começa na forma base; o Cavalo oferece voluntariamente a essência.' },
  'caminho-ferimento': { unlockMode:'portao_final', designType:'dungeon final linear', durationEstimate:'6 secções', setting:'Travessia final com uma secção temática por mundo.', mainMechanicSummary:'Combinar o máximo de habilidades possível sem bloquear a rota mínima.', checkpointPlan:'Checkpoints de Espíritos Finais são temporários na tentativa e nunca persistem ao sair/carregar.' },
  'trilho-musgo': { designType:'tutorial / exploração inicial', durationEstimate:'8–12 min', setting:'Floresta macia, folhas e troncos caídos.', mainMechanicSummary:'Tutorial de exploração, baús fáceis e primeiras pistas humanas.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'ruinas-heranca': { designType:'puzzle leve / ruínas', durationEstimate:'8–12 min', setting:'Ruínas de pedra cobertas de musgo.', mainMechanicSummary:'Plataformas que desabam, portas por alavanca e inimigos simples.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'riacho-castores': { designType:'água rasa / madeira', durationEstimate:'10–15 min', setting:'Correnteza baixa e troncos móveis.', mainMechanicSummary:'Empurrar e roer troncos; rotas alternativas por Forte.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'copas-nebulosas': { designType:'verticalidade / voo', durationEstimate:'10–15 min', setting:'Copas com neblina e vento.', mainMechanicSummary:'Precisão aérea e correntes de vento.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'fendas-texugo': { designType:'subterrâneo / escavação', durationEstimate:'10–15 min', setting:'Túneis, raízes e passagens apertadas.', mainMechanicSummary:'Escavar, labirintos curtos e baús escondidos.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'pedreira-antiga': { designType:'força / estruturas humanas', durationEstimate:'12–18 min', setting:'Pedras, desníveis e estruturas abandonadas.', mainMechanicSummary:'Blocos pesados, quedas controladas e inimigos mais agressivos.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'pantano-arame': { designType:'hazard / resistência', durationEstimate:'12–18 min', setting:'Lama e arame farpado parcialmente enterrado.', mainMechanicSummary:'Furtivo/Resistente e puzzles de timing.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'capim-primeiro-vento': { designType:'velocidade / introdução', durationEstimate:'8–12 min', setting:'Planície aberta.', mainMechanicSummary:'Desafios de tempo e colecionáveis em trilhas longas.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'pedras-suricata': { designType:'furtivo / tocas', durationEstimate:'8–12 min', setting:'Pedras e buracos.', mainMechanicSummary:'Passagens baixas, stealth e puzzles de entrar/sair.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'ravina-baoba': { designType:'escalada / cipós', durationEstimate:'10–15 min', setting:'Ravina vertical com raízes.', mainMechanicSummary:'Escalada, balanços e atalhos por Escalador.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'rota-sombras': { designType:'stealth / noite', durationEstimate:'10–15 min', setting:'Noite quente e silhuetas.', mainMechanicSummary:'Evitar confronto; Pó Dourado é especialmente útil.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'rio-passagem-lenta': { designType:'força / rio', durationEstimate:'12–18 min', setting:'Rio com pontos estreitos.', mainMechanicSummary:'Timing, empurrões e inimigos empurráveis para a água.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'tempestade-poeira': { designType:'vento / salto longo', durationEstimate:'12–18 min', setting:'Poeira e vento lateral.', mainMechanicSummary:'Aderência, estabilidade e saltos precisos.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'circulo-cacada': { designType:'secreto / perseguição', durationEstimate:'12–18 min', setting:'Arena natural com trilhas.', mainMechanicSummary:'Captura de espírito que foge e segredo do Leão.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'varzea-sussurro': { designType:'saltador / pântano', durationEstimate:'8–12 min', setting:'Lama, raízes e água rasa.', mainMechanicSummary:'Saltos com precisão e perigos no chão.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'pontes-copas': { designType:'voo / copas', durationEstimate:'10–15 min', setting:'Passarelas altas.', mainMechanicSummary:'Quedas longas, vento leve e domínio aéreo.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'caverna-biolume': { designType:'escuro / percepção', durationEstimate:'10–15 min', setting:'Escuridão e cogumelos brilhantes.', mainMechanicSummary:'Plataformas reveladas pela luz e timing.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'queda-aguas': { designType:'água / verticalidade', durationEstimate:'10–15 min', setting:'Cascatas e vapor.', mainMechanicSummary:'Correntes ascendentes e segredos por Voador.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'labirinto-cipos': { designType:'cipós / resistência', durationEstimate:'12–18 min', setting:'Selva fechada.', mainMechanicSummary:'Puxar, balançar e soluções por categorias.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'ninho-arara': { designType:'voo avançado / desafio', durationEstimate:'12–18 min', setting:'Vertical alto e céu aberto.', mainMechanicSummary:'Sequência aérea e portais de desafio.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'trilha-armadilhas': { designType:'armadilhas / predador', durationEstimate:'12–18 min', setting:'Cordas, jaulas, metal e marcas humanas.', mainMechanicSummary:'Libertar espíritos de armadilhas com múltiplas soluções.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'margem-aurora': { designType:'neve / introdução', durationEstimate:'8–12 min', setting:'Neve calma.', mainMechanicSummary:'Introdução a gelo e vento suave.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'lago-espelho': { designType:'gelo / deslize', durationEstimate:'10–15 min', setting:'Gelo liso.', mainMechanicSummary:'Puzzles de deslize e controlo no gelo.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'bosque-boreal': { designType:'floresta gelada', durationEstimate:'10–15 min', setting:'Pinheiros e neve a cair.', mainMechanicSummary:'Plataformas que balançam e emboscadas.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'caverna-geada': { designType:'caverna / stealth', durationEstimate:'10–15 min', setting:'Estalactites de gelo.', mainMechanicSummary:'Quedas de gelo, timing e camuflagem.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'mar-banquisas': { designType:'aquático gelado', durationEstimate:'12–18 min', setting:'Placas flutuantes.', mainMechanicSummary:'Rotas móveis, correntes e transição para Orca.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'cordilheira-alce': { designType:'montanha / vento', durationEstimate:'12–18 min', setting:'Subida com vento forte.', mainMechanicSummary:'Saltos pesados, resistência e aderência.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'poco-oleo': { designType:'impacto humano / óleo', durationEstimate:'12–18 min', setting:'Gelo manchado e escuro.', mainMechanicSummary:'Superfícies escorregadias, inimigos agressivos e stealth.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'trilha-eucalipto': { designType:'introdução / escalada', durationEstimate:'8–12 min', setting:'Bosque quente.', mainMechanicSummary:'Escalada simples e segredos por Coala.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'rochedos-vermelhos': { designType:'salto / falésia', durationEstimate:'10–15 min', setting:'Falésias e outback.', mainMechanicSummary:'Saltos longos, vento e rotas de risco.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'toca-wombat': { designType:'secreto / túneis', durationEstimate:'10–15 min', setting:'Túneis e pedra.', mainMechanicSummary:'Empurrar, arrastar e segredos profundos.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'noite-diabo': { designType:'combate / noite', durationEstimate:'10–15 min', setting:'Escuridão e luz da lua.', mainMechanicSummary:'Combate mais forte com stealth opcional.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'lagoa-correntes': { designType:'aquático / correntes', durationEstimate:'12–18 min', setting:'Água com correntes perigosas.', mainMechanicSummary:'Introdução da Bolha de Coral e resistência aquática.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'jardim-coral': { designType:'aquático avançado', durationEstimate:'12–18 min', setting:'Recife colorido.', mainMechanicSummary:'Correntes e puzzles de puxar/alavancas com Polvo.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'bambu-alvorecer': { designType:'introdução / bambu', durationEstimate:'8–12 min', setting:'Bambu alto e luz suave.', mainMechanicSummary:'Saltos rítmicos, paredes finas e stealth leve.', puzzlePlan:'2 obrigatórios + 1 opcional', animalUnlockIds:['urso-panda','gibao'] },
  'arrozais-vidro': { designType:'puzzle de água rasa', durationEstimate:'10–15 min', setting:'Água rasa e reflexos.', mainMechanicSummary:'Pisos escorregadios, patrulhas e rotas baixas.', puzzlePlan:'2 obrigatórios + 1 opcional' },
  'telhados-santuario': { designType:'aéreo / precisão', durationEstimate:'10–15 min', setting:'Templos e telhados.', mainMechanicSummary:'Precisão aérea e pouso em plataformas pequenas.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'escadarias-dragao': { designType:'rolagem / montanha', durationEstimate:'12–18 min', setting:'Montanha com degraus antigos.', mainMechanicSummary:'Incenso do Vento e rolagem do Pangolim.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'mercado-abandonado': { designType:'impacto humano / stealth', durationEstimate:'12–18 min', setting:'Restos urbanos e luz artificial quebrada.', mainMechanicSummary:'Armadilhas humanas, lasers e rotas furtivas.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
  'vale-eco': { designType:'secreto / ruído', durationEstimate:'12–18 min', setting:'Vale com sinos, vento e ruído.', mainMechanicSummary:'Ondas que empurram, plataformas falsas e captura do Tigre.', puzzlePlan:'3 obrigatórios + 1–2 opcionais' },
};

for (const currentArea of areas) {
  const defaultUnlockIds = currentArea.animalUnlockId ? [currentArea.animalUnlockId] : [];
  Object.assign(currentArea, {
    animalUnlockIds: defaultUnlockIds,
    ecoTarget: currentArea.type === 'fase' ? 15 : 0,
    melodyTarget: currentArea.type === 'fase' ? 1 : 0,
    whisperTarget: currentArea.type === 'fase' ? 5 : currentArea.whisperTarget,
    countsForBaseCompletion: currentArea.type !== 'apolo',
    unlockMode: currentArea.type === 'boss' ? 'missao_principal' : currentArea.type === 'vila' || currentArea.type === 'apolo' ? 'automatico' : currentArea.type === 'hub' ? 'inicio' : currentArea.type === 'final' ? 'portao_final' : 'runes',
    unlockMissionId: currentArea.type === 'boss' ? `missao-principal-${currentArea.worldId}` : undefined,
    testedCategories: [], secondaryMechanicSummary:'', regionalItemUse:'', hazardNotes:'', enemyNotes:'', secretsPlan:'', shortcutsPlan:'', checkpointPlan:'', narrativeMoment:'', designGoal:'', frustrationRisk:'', uxSolution:'',
    ...(areaFinalData[currentArea.id] ?? {}),
  });
}

const secondaryTagSet = new Set(['Percepção','Manipulador','Escavador','Precisão','Secreto']);
for (const currentAnimal of animals) {
  currentAnimal.primaryAbility = currentAnimal.abilities[0] ?? '';
  currentAnimal.contextualInteractions = currentAnimal.abilities.slice(1);
  currentAnimal.secondaryTags = currentAnimal.categories.filter(category => secondaryTagSet.has(category));
  currentAnimal.isSecret = currentAnimal.categories.includes('Secreto');
  currentAnimal.protectedFromRemoval = currentAnimal.protectedFromRemoval ?? currentAnimal.id === 'iris-base';
  currentAnimal.surfaceSwim = currentAnimal.surfaceSwim ?? currentAnimal.categories.includes('Aquático');
  currentAnimal.canDiveAsLand = currentAnimal.canDiveAsLand ?? currentAnimal.categories.includes('Aquático');
  currentAnimal.oxygenSeconds = currentAnimal.oxygenSeconds ?? (currentAnimal.categories.includes('Aquático') ? 0 : 20);
  currentAnimal.sinksIfCannotSwim = currentAnimal.sinksIfCannotSwim ?? false;
  currentAnimal.underwaterTurnStyle = currentAnimal.underwaterTurnStyle ?? (currentAnimal.categories.includes('Aquático') ? 'arco_curto' : 'direto');
  currentAnimal.swimNotes = currentAnimal.swimNotes ?? '';
  currentAnimal.tutorialWarnCannotSwim = currentAnimal.tutorialWarnCannotSwim ?? currentAnimal.sinksIfCannotSwim;
}

export const emblems: EmblemDef[] = [
  { id:'emblema-bosque', name:'Emblema do Bosque', kind:'mundo', worldId:'w1', condition:'Derrotar Guardião do Ferro Enraizado.', reward:'Conta para liberar A Mente que Mata.', countsInBaseCompletion:true, status:'planejado', notes:'' },
  { id:'emblema-savana', name:'Emblema da Savana', kind:'mundo', worldId:'w2', condition:'Derrotar Sol de Plástico.', reward:'Conta para liberar A Mente que Mata.', countsInBaseCompletion:true, status:'planejado', notes:'' },
  { id:'emblema-floresta', name:'Emblema da Floresta Tropical', kind:'mundo', worldId:'w3', condition:'Derrotar Garganta do Fogo.', reward:'Conta para liberar A Mente que Mata.', countsInBaseCompletion:true, status:'planejado', notes:'' },
  { id:'emblema-aurora', name:'Emblema da Aurora', kind:'mundo', worldId:'w4', condition:'Derrotar Gigante do Degelo.', reward:'Conta para liberar A Mente que Mata.', countsInBaseCompletion:true, status:'planejado', notes:'' },
  { id:'emblema-coral', name:'Emblema do Coral', kind:'mundo', worldId:'w5', condition:'Derrotar Maré de Rede.', reward:'Conta para liberar A Mente que Mata.', countsInBaseCompletion:true, status:'planejado', notes:'' },
  { id:'emblema-lanternas', name:'Emblema das Lanternas', kind:'mundo', worldId:'w6', condition:'Derrotar Sino do Ruído.', reward:'Conta para liberar A Mente que Mata.', countsInBaseCompletion:true, status:'planejado', notes:'' },
  { id:'emblema-gaia', name:'Emblema de Gaia', kind:'gaia', condition:'Atingir 100% do conteúdo principal.', reward:'Aura de Gaia.', countsInBaseCompletion:false, aura:'Gaia', status:'planejado', notes:'Concedido pelo EmblemManager; não entra no próprio cálculo.' },
  { id:'emblema-apolo', name:'Emblema de Apolo', kind:'apolo', condition:'Reunir as seis Runas de Apolo, uma por mundo.', reward:'Aura de fogo.', countsInBaseCompletion:false, aura:'Apolo', status:'planejado', notes:'' },
  { id:'emblema-zeus', name:'Emblema de Zeus', kind:'zeus', condition:'Obter Gaia + Apolo; conclusão exibida como 101%.', reward:'Aura máxima, com prioridade visual.', countsInBaseCompletion:false, aura:'Zeus', status:'planejado', notes:'Substitui visualmente as outras auras.' },
];

function buildGaiaPlan(): { nodes: GaiaMapNode[]; edges: GaiaMapEdge[] } {
  const nodes: GaiaMapNode[] = [];
  const edges: GaiaMapEdge[] = [];
  const addNode = (areaId:string,x:number,y:number,worldIntro=false) => {
    const currentArea=areas.find(a=>a.id===areaId);
    nodes.push({id:`node-${areaId}`,areaId,x,y,unlockMode:currentArea?.unlockMode,unlockMissionId:currentArea?.unlockMissionId,worldIntro,notes:''});
  };
  const addEdge = (sourceArea:string,targetArea:string,kind:'principal'|'alternativa'|'convergencia'='principal',label='') => edges.push({id:`edge-${sourceArea}-${targetArea}`,source:`node-${sourceArea}`,target:`node-${targetArea}`,label,kind,bidirectional:false,notes:''});
  addNode('coracao-gaia',0,0); addNode('caminho-ferimento',0,180); addEdge('coracao-gaia','caminho-ferimento','principal','1 Runa · portão final');
  const sequences: Array<{worldId:string; start:[number,number]; step:[number,number]; order:string[]}> = [
    {worldId:'w1',start:[-920,-260],step:[-190,-100],order:['trilho-musgo','vila-clareira','ruinas-heranca','copas-nebulosas','pantano-arame','coroa-arame']},
    {worldId:'w2',start:[-260,-720],step:[0,-150],order:['capim-primeiro-vento','vila-oasis','pedras-suricata','ravina-baoba','rota-sombras','rio-passagem-lenta','tempestade-poeira','circulo-cacada','zenite-quebrado']},
    {worldId:'w3',start:[720,-480],step:[170,-80],order:['varzea-sussurro','vila-copas','pontes-copas','caverna-biolume','queda-aguas','labirinto-cipos','ninho-arara','trilha-armadilhas','boca-cinza']},
    {worldId:'w4',start:[-900,360],step:[-175,95],order:['margem-aurora','vila-pinheiro','lago-espelho','bosque-boreal','caverna-geada','mar-banquisas','cordilheira-alce','poco-oleo','fenda-degelo']},
    {worldId:'w5',start:[-250,680],step:[0,145],order:['trilha-eucalipto','vila-baia','rochedos-vermelhos','toca-wombat','noite-diabo','lagoa-correntes','jardim-coral','anzol-abissal']},
    {worldId:'w6',start:[720,430],step:[175,90],order:['bambu-alvorecer','vila-lanternas','arrozais-vidro','telhados-santuario','escadarias-dragao','mercado-abandonado','vale-eco','torre-eco']},
  ];
  for (const branch of sequences) {
    branch.order.forEach((areaId,index)=>addNode(areaId,branch.start[0]+branch.step[0]*index,branch.start[1]+branch.step[1]*index,index===0));
    addEdge('coracao-gaia',branch.order[0],'principal','Entrada do mundo');
    for(let i=1;i<branch.order.length;i+=1)addEdge(branch.order[i-1],branch.order[i]);
  }
  const apoloByBoss:Record<string,string>={
    'coroa-arame':'apolo-bosque','zenite-quebrado':'apolo-savana','boca-cinza':'apolo-verde',
    'fenda-degelo':'apolo-aurora','anzol-abissal':'apolo-coral','torre-eco':'apolo-lanternas',
  };
  for(const [bossAreaId,apoloAreaId] of Object.entries(apoloByBoss)){
    const bossNode=nodes.find(node=>node.areaId===bossAreaId);
    if(!bossNode)continue;
    addNode(apoloAreaId,bossNode.x+230,bossNode.y+130);
    addEdge(bossAreaId,apoloAreaId,'alternativa','Desbloqueia no 100% do mundo');
  }
  // Topologia aprovada do Bosque de Bruma: bifurcação real e convergência opcional.
  addNode('riacho-castores',-1300,-40); addNode('fendas-texugo',-1500,80); addNode('pedreira-antiga',-1510,-70);
  addEdge('vila-clareira','riacho-castores','alternativa','Ramo do riacho');
  addEdge('riacho-castores','fendas-texugo','alternativa','Ramo lateral');
  addEdge('riacho-castores','pedreira-antiga','principal','');
  addEdge('pedreira-antiga','pantano-arame','principal','');
  addEdge('copas-nebulosas','pantano-arame','convergencia','Convergência opcional');
  return {nodes,edges};
}
const gaiaPlan = buildGaiaPlan();
export const originalWorldMapPlan = { nodes:structuredClone(gaiaPlan.nodes), edges:structuredClone(gaiaPlan.edges), backgroundImages:[], drawings:[], gridSize:24, snapToGrid:true, accessZoneRequired:true, hubAreaId:'coracao-gaia', overviewNotes:'Mapa original do projeto. O botão Resetar restaura esta topologia.', cameraNotes:'Planejar CameraShots e atmosfera por trecho: luz, neblina, chuva, neve e partículas.' };

export const changelog: ChangeLogEntry[] = [
  { version:'1.0.1', date:'18/06/2026', title:'Músicas anexadas ao Planejador', summary:'O player passa a usar exclusivamente os arquivos de áudio anexados às fichas de Música no Planejador.', sections:[
    {title:'Fonte das músicas',items:['Somente anexos reconhecidos do Planejador entram na playlist do Executor.','O upload registra nome, tipo, tamanho e data do anexo.','Fichas sem anexo continuam preservadas, mas não são reproduzidas.']},
    {title:'Compatibilidade',items:['Arquivos já adicionados em versões anteriores são migrados como anexos.','A validação das músicas de vila exige áudio anexado.','O player do Planejador segue a mesma regra do Executor.']},
  ]},
  { version:'1.0.0', date:'18/06/2026', title:'Animals Suite — Jornada final e música de produção', summary:'A suite fecha o ciclo de integração com Jornada gamificada, player musical global, conquistas e publicação automática pelo GitHub.', sections:[
    {title:'Jornada gamificada',items:['Mapa orgânico das oito Etapas com névoa, nós e orbe controlado por WASD ou setas.','Janela de progresso por região e acesso direto às Missões de Produção.','Conquistas derivadas do progresso e dos testes, sem alterar o roteiro tradicional.']},
    {title:'Música durante a produção',items:['Player global usando os arquivos cadastrados na base de Músicas do Planejador.','Controles por ícones: anterior, pausa, stop, play, próxima, repetir, aleatório e música por missão.','Modo por missão associa uma faixa aleatória persistente a cada Missão de Produção.']},
    {title:'Distribuição',items:['Workflow GitHub Actions valida, compila, assina e publica o instalador NSIS.','Atualizador interno consulta latest.json e valida a assinatura antes de instalar.','Assistentes e guia completo para ligar a pasta ao GitHub e publicar novas versões.']},
  ]},
  { version:'0.13.0', date:'18/06/2026', title:'Animals Suite — Produtividade e atualizações', summary:'Modo Foco, favoritos, exportação seletiva, filtros, chunks e base do atualizador GitHub.', sections:[
    {title:'Uso diário',items:['Modo Foco por data com tarefas e Steps.','Favoritos, recentes, filtros de produção e exportação seletiva.','Refinamentos visuais, impressão e microanimações.']},
    {title:'Distribuição',items:['Centro de atualizações preparado para GitHub Releases.','Workflow Windows/NSIS e latest.json.','Rotas pesadas carregadas sob demanda.']},
  ]},
  { version:'0.12.0', date:'18/06/2026', title:'Animals Suite — Integração Planejador e Executor', summary:'Entidades, estados técnicos, testes, problemas e validador passam a trabalhar de forma integrada.', sections:[
    {title:'Integração',items:['Ponte bidirecional entre fichas do Planejador e conteúdo técnico do Executor.','Estados compartilhados sem duplicar a fonte de verdade.','Relações automáticas e manuais por IDs estáveis.']},
    {title:'Qualidade',items:['12 receitas de teste.','Painel de problemas e limitações.','Validador estrutural da suite.']},
  ]},
  { version:'0.11.0', date:'18/06/2026', title:'Animals Suite — Guia integrado ao Executor', summary:'O roteiro técnico, os guias, os tutoriais e a biblioteca de scripts passam a funcionar dentro do Executor desktop.', sections:[
    {title:'Roteiro de produção',items:['96 missões organizadas em 8 etapas, com 277 tarefas e 1.099 Steps.','Progresso por etapa, estados visuais, bloqueio sequencial e retorno ao Step exacto.','Missões detalhadas e missões de planeamento distinguidas sem perder a visão completa do roteiro.']},
    {title:'Guias, tutoriais e scripts',items:['26 documentos internos disponíveis offline, com índice automático, pesquisa e destaque de resultados.','Biblioteca com 278 scripts, campos do Inspector, métodos, dependências, usado por e código-fonte.','Conteúdo técnico carregado sob demanda para evitar renderizar todos os scripts ao mesmo tempo.']},
    {title:'Produtividade desktop',items:['Pesquisa global Ctrl+K em missões, tarefas, Steps, guias e scripts.','Atalhos de teclado, notas por missão/tarefa/Step e botão Estou com erro com contexto copiável.','Importação de progresso das versões antigas do guia e exportação do estado actual do Executor.']},
  ]},
  { version:'0.10.0', date:'18/06/2026', title:'Animals Suite — Fundação do Executor', summary:'Planejador e Executor passam a partilhar um núcleo, manifesto e banco preparado para a migração do guia.', sections:[
    {title:'Suite integrada',items:['Novo modo Animals — Executor com navegação e dashboard próprios.','O mesmo executável aceita --mode=planner e --mode=executor.','Alternância direta entre Planejador e Executor sem duplicar o projeto.']},
    {title:'Dados e segurança',items:['Estado do Executor separado do grande JSON do Planejador.','SQLite ampliado com tabelas para progresso, notas, foco, problemas e manifesto.','Identificador Tauri preservado para manter compatibilidade com os dados da 0.9.1.']},
    {title:'Arquitetura',items:['suite.manifest.json centraliza versões, schemas e fontes oficiais.','IDs estáveis definidos para etapas, missões de produção, tarefas e steps.','Missões do jogo distinguidas das futuras missões de produção.']},
  ]},
  { version:'0.9.1', date:'18/06/2026', title:'Hotfix do instalador Windows', summary:'Correcção da compilação Rust do Tauri sem alterar os dados ou funcionalidades da versão 0.9.0.', sections:[
    {title:'Compilação',items:['Corrigido o erro Rust E0597 em src-tauri/src/lib.rs.','A verificação da coluna name encerra o iterador antes de libertar o statement SQLite.','Projectos, banco de dados e migrações permanecem compatíveis com a versão 0.9.0.']},
  ]},
  { version:'0.9.0', date:'18/06/2026', title:'Actualização 18/06 — Save, vilas e Jukebox verificados', summary:'Planejador alinhado ao backup 18-06 att e ao GDD vigente, com migração segura dos dados existentes.', sections:[
    {title:'Vilas e NPCs',items:['Resgate com npcId único e idempotente.','População resgatada e adicional separadas.','Editor preparado para os cinco níveis do VillageEvolutionController.']},
    {title:'Save e progresso',items:['Ecos Perdidos, Melodias Selvagens e snapshots activos marcados como persistentes.','Ecos corrigidos para não contar directamente nos 100%.','Migração do Planejador preserva projectos da versão 0.8.0.']},
    {title:'Música e Jukebox',items:['Faixas base e Melodias desbloqueáveis diferenciadas.','Campo melodyId adicionado às fichas musicais.','Favoritos, agrupamento por mundo e filtragem individual documentados como implementados.']},
  ]},
  { version:'0.8.0', date:'17/06/2026', title:'Atualização 17/06 — Sistemas, ajuda e fluxo de edição', summary:'Correções de mapas, navegação, Ajuda, importação de mecânicas e adaptação completa ao backup 17/06.', sections:[
    {title:'Editores e navegação',items:['Terra de Gaia com ligação robusta e reset do mapa original.','Breadcrumbs clicáveis, botão Voltar e versão visível no software.','Água circular integrada como forma da ferramenta Água.']},
    {title:'Conteúdo 17/06',items:['Ecos Perdidos, Sussurros por compra, Seiva Vital, Melodias Selvagens e Jukebox global.','Provações de Gaia e seis Provações de Apolo como áreas.','Oxigénio, natação por animal, Bolha de Ar, tutoriais e ações de NPC.']},
    {title:'Gestão e futuro',items:['Ajuda contextual e histórico de versões sem rótulo de etapa.','Importação de mecânicas com resolução segura de conflitos e exportação de base para IA.','Plano de localização preparado para cinco idiomas.']},
  ]},
  { version:'0.7.0', date:'17/06/2026', title:'Bibliotecas e gestão do projeto', summary:'Música aprimorada, backups restauráveis, projeto portátil, ideias completas, duplicação inteligente, lore final, Escola expandida e galerias completas.', sections:[
    {title:'Gestão do projeto',items:['Tela de backups com restaurar, comparar, renomear, excluir e abrir pasta.','Pacote portátil .animalsplan inclui projeto e mídias.','Limite de backups automáticos respeita a configuração.']},
    {title:'Bibliotecas',items:['Músicas com mudo real, persistência alternável, arquivos perdidos e relações clicáveis.','Banco de ideias cria inimigos, mecânicas, desafios e NPCs no local escolhido.','Rumores, Sussurros e galerias recebem fichas completas.']},
    {title:'Aprendizado e produtividade',items:['Escola de Level Design expandida com exemplos, erros, exercícios e aplicação nas áreas.','Duplicação inteligente para missões, NPCs, inimigos, áreas, desafios e mecânicas.']},
  ]},
  { version:'0.6.0', date:'17/06/2026', title:'Planejamento inteligente', summary:'Dashboard completo, produção, cobertura de habilidades, sugestões automáticas e análise da Terra de Gaia.', sections:[
    {title:'Produção',items:['Dashboard clicável com planejados, criados, Unity, erros, colocação e relações.','Página de Produção com filtros por tipo, mundo, estado e mapa.','Fila Continuar trabalhando e lista completa de avisos.']},
    {title:'Cobertura',items:['Analisador cruza animais, habilidades, categorias, áreas, desafios e bosses.','Alertas de habilidade subutilizada ou excessiva.','Cobertura por categoria e mundo.']},
    {title:'Level design e Terra de Gaia',items:['Sugestões automáticas dentro de cada área.','Validador de nós desconectados, retorno, vilas, bosses e custos.','Cálculo de profundidade, economia por rota e simulação de qualquer mundo primeiro.']},
  ]},
  { version:'0.5.0', date:'16/06/2026', title:'Editores principais', summary:'Novos editores de bosses e vilas, recursos locais completos, mapas integrados e Terra de Gaia redesenhada.', sections:[
    {title:'Terra de Gaia',items:['Áreas disponíveis ficam na lateral direita e são arrastadas para o mapa.','Ligações são criadas puxando um conector de um nó até outro.','Seleção e exclusão de linhas por Delete ou clique direito.','Renderização otimizada: apenas nós colocados aparecem no canvas.']},
    {title:'Conteúdo',items:['Editor completo dos oito bosses.','Página própria para as seis vilas, com estados, população, músicas e mapa de NPCs.','Fichas de Runas, baús, Fragmentos, objetos de missão, pontos, checkpoints, saídas e Refúgios.']},
    {title:'Mapas',items:['Pontos de missão ligados a missão e tarefa.','Múltiplas imagens de fundo, anotações e desenho livre nos mapas de área.','Editor visual próprio de cada mundo e galeria gerenciável.']},
  ]},
  { version:'0.4.0', date:'16/06/2026', title:'Base estrutural', summary:'Relações universais, exclusão segura, Lixeira restaurável, busca global e histórico.', sections:[
    {title:'Segurança',items:['Central universal de relações.','Arquivamento preserva relações.','Exclusão definitiva limpa referências somente após confirmação.']},
    {title:'Produtividade',items:['Busca global com Ctrl + K.','Desfazer e refazer global.','Detalhes técnicos recolhíveis.']},
  ]},
  { version:'0.3.0', date:'16/06/2026', title:'Consolidação do GDD final', summary:'Dados e regras atualizados para o backup 16/06 e o GDD final.', sections:[{title:'Projeto',items:['34 animais e relações consolidadas.','Terra de Gaia e economia atualizadas.','Itens, Emblemas, bosses e regras de save revisados.']}]},
  { version:'0.2.0', date:'15/06/2026', title:'Terra de Gaia e missões 2.0', summary:'Nova estrutura de tarefas paralelas e primeiro editor visual da Terra de Gaia.', sections:[{title:'Atualização',items:['Missões com dependências e condições automáticas.','Relações de animais ampliadas.','Editor inicial da Terra de Gaia.']}]},
  { version:'0.1.1', date:'15/06/2026', title:'Correção de instalação', summary:'Dependências passaram a usar o registro público do npm.', sections:[{title:'Instalação',items:['Lockfile corrigido.','Scripts de compilação mais claros.']}]},
  { version:'0.1.0', date:'15/06/2026', title:'Primeira versão', summary:'Base do Animals — Planejador.', sections:[{title:'Início',items:['Dashboard, mundos, áreas, animais, missões, mapas, música e ideias.']}]},
];

export const initialProjectState: ProjectState = {
  version: PROJECT_SCHEMA_VERSION,
  name: 'Animals — Planejador',
  worlds,
  areas,
  animals,
  enemies: [],
  items,
  mechanics,
  npcs: [],
  missions: worlds.filter(w=>w.id!=='w0').map((w)=>({ id:`missao-principal-${w.id}`, name:`Missão principal — ${w.name}`, type:'principal', worldId:w.id, areaIds:areas.filter(a=>a.worldId===w.id).map(a=>a.id), description:'Missão principal editável do mundo.', clearObjective:'', vagueHint:'', extraHint:'', reward:'Desbloqueia gratuitamente a área do boss.', journalText:'', completionText:'', countsFor100:true, tasks:[], rumorIds:[], status:'planejado', archived:false, notes:'' })),
  rumors: [], whispers: buildWhispers(areas), challenges: [], bosses, emblems,
  music: buildCompleteMusic(worlds,areas,bosses),
  ideas,
  areaResources: [],
  villages: areas.filter(a=>a.type==='vila').map(a=>({areaId:a.id,plannedPopulation:a.npcTarget||0,currentPopulation:0,rescuedPopulation:0,additionalPopulation:0,firstRescueThreshold:2,bossDefeated:false,state:'vazia' as const,visualEvolution:{vazia:'',primeiros_resgates:'',viva:'',restaurada:'',pos_boss:''},npcPlacements:[],backgroundImages:[],notes:''})),
  galleryImages: [],
  worldVisuals: worlds.map(w=>({worldId:w.id,backgroundImages:[],drawings:[],labels:[],layers:{images:{visible:true,locked:false},drawings:{visible:true,locked:false},labels:{visible:true,locked:false}},notes:''})),
  changelog,
  schoolProgress:{},
  apoloTrials:buildApoloTrials(),
  tutorialMessages:structuredClone(tutorialMessages),
  localization:structuredClone(localizationPlan),
  maps: areas.map(a=>makeMap(a.id)),
  worldMap:{ nodes:gaiaPlan.nodes.filter(node=>node.areaId==='coracao-gaia'), edges:[], backgroundImages:[], drawings:[], gridSize:24, snapToGrid:true, accessZoneRequired:true, hubAreaId:'coracao-gaia', overviewNotes:'Arraste as áreas da biblioteca para o mapa. A Terra de Gaia abre apenas em WorldMapAccessZone.', cameraNotes:'Planejar CameraShots e atmosfera por trecho: luz, neblina, chuva, neve e partículas.' },
  settings:{ theme:'dark', musicEnabled:true, musicAutoplay:true, volume:0.65, muted:false, loopPlayback:true, saveVerificationOk:true, backupMinutes:10, maxAutoBackups:30, lastSeenVersion:undefined },
  relations:[],
  trash:[],
};
