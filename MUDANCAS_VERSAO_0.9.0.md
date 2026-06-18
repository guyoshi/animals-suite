# Mudanças — versão 0.9.0

## Terra de Gaia

- A ligação entre nós não substitui mais o estado do mapa.
- Nós, ligações, imagens, desenhos e grelha são tratados como camadas independentes.
- A ligação termina procurando o nó que está realmente sob o ponteiro.
- Ligações inválidas ou que apontem para nós ausentes deixam de ser renderizadas.
- A biblioteca de áreas fica à esquerda; camadas e Inspector ficam à direita.
- Apenas as áreas arrastadas para o mapa são renderizadas.
- **Resetar mapa original** restaura a topologia consolidada, preservando imagens e desenhos.
- Linhas podem ser selecionadas, apagadas com `Delete` ou pelo clique direito.

## Editor de mapas de área

- Recursos ficam à esquerda.
- Inspector e camadas ficam à direita.
- A ferramenta Água possui os formatos **Retangular** e **Circular**.

## Navegação e identidade

- Versão 0.9.0 no título da janela.
- Animação inicial com logotipo, nome e versão.
- Botão Voltar retorna ao histórico real de navegação.
- Breadcrumbs clicáveis permitem voltar ao mundo ou à área anterior.
- Pequeno botão no topo abre **O que há de novo**.
- O menu lateral agora possui **Ajuda**.

## Ajuda

- Página central de ajuda por assunto.
- Botões `?` nas ferramentas principais.
- Explicações de Terra de Gaia, mapas, água, animais, Actions de NPC, itens, música, mecânicas, Provações e idiomas.
- Links de ajuda abrem diretamente a seção correspondente.

## Banco de ideias e mecânicas

Conteúdo novo:

- 20 ideias de NPCs.
- 20 ideias de Provações de Gaia.
- 20 ideias de mecânicas.
- 20 ideias de missões.
- 20 ideias de puzzles.
- Mecânicas actualizadas directamente com base no backup 18/06 att.

A categoria **Missão** foi adicionada ao banco de ideias. Ao adotar uma ideia de missão, o aplicativo cria uma missão editável com uma tarefa inicial.

## Importação e exportação para IA

- **Exportar base para IA** cria um JSON com regras do jogo, mundos, áreas, animais, itens, inimigos, Actions de NPC, mecânicas, ideias e Provações.
- **Importar mecânicas** aceita uma lista JSON ou `{ "mechanics": [...] }`.
- Conflitos mostram a mecânica nova à esquerda e a existente à direita.
- Por segurança, a decisão padrão é **Manter a existente**.
- Também é possível substituir ou importar uma cópia renomeada.

## Música e Jukebox

- Fichas pré-criadas para todas as áreas.
- Três fichas para cada vila.
- Duas fichas para cada boss: aproximação e combate.
- Uma ficha para cada Provação de Apolo.
- Ficha global da Terra de Gaia.
- Repetir e Fixar ficam na barra musical superior.
- O ícone de Fixar alterna corretamente entre alfinete normal e alfinete riscado.
- Jukebox marcada como compra única e global.
- Melodia Selvagem planejada por fase normal e incluída no 100%.

## Conteúdo atualizado para 18/06

### Sussurros e Ecos

- Sussurros da Terra são as mensagens compradas no Contador de Histórias.
- Ecos Perdidos são os colecionáveis escondidos.
- Cada fase normal recebe cinco Sussurros, custando 1, 2, 3, 4 e 5 Ecos.
- Meta total: 15 Ecos por fase normal.
- Vilas, bosses e Provações de Apolo não recebem Ecos.

### Cura

- Broto de Vida: cura imediatamente no cenário.
- Seiva Vital: comprada, guardada no inventário e usada manualmente.

### Actions de NPC

- Mostrar Sementes.
- Ganhar ou gastar Sementes com animação de até um segundo.
- Alterar Sementes silenciosamente.
- Guardar e restaurar partes do status.
- Bloquear e desbloquear formas sem removê-las.
- Íris Base não pode ser bloqueada nem removida.
- Resgate de NPC por `npcId`, impedindo contagem duplicada.
- Habitantes adicionais separados dos NPCs resgatados.
- Actions para adicionar, definir e sincronizar a população da vila.
- Cinco níveis de evolução configuráveis por `VillageEvolutionController`.
- Snapshots narrativos activos persistidos no save.

### Animais e água

- Nado de superfície configurável.
- Mergulho de forma terrestre com oxigênio limitado.
- Forma que não sabe nadar pode afundar e morrer.
- Mini-HUD de oxigênio planejada.
- Bolha de Ar restaura oxigênio.
- Estilo de curva subaquática configurável por animal.
- Aviso obrigatório no tutorial quando uma forma afunda.
- Íris Base funciona como fallback quando todas as formas animais estão bloqueadas.

### Provações

- Desafios passam a chamar-se **Provações de Gaia**.
- Objetivos incluem tempo, inimigos, todas as Sementes e objeto específico.
- Portais podem exigir animal, mostrar seu ícone, bloquear troca e indicar conclusão.
- Provações de Apolo são seis áreas independentes, uma por mundo.
- Apolo não entra no 100% base.
- Seis Runas de Apolo concedem Emblema de Apolo e aura de fogo.
- Gaia + Apolo concedem Zeus e 101%.

### Tutorial e localização

- Tutoriais importantes, médios e pop-ups.
- Confirmação, som, imagem, âncora e paginação configuráveis.
- English, Português, Español, Français e 日本語 previstos.
- Apenas Português habilitado nesta fase.
- Detecção de idioma do sistema/Switch e persistência planejadas.
- Fallback final para English quando as traduções estiverem prontas.
