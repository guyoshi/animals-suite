# Guia resumido — sistemas do backup 18/06 att

## Actions de NPC

Disponíveis para planeamento:

- Mostrar Sementes.
- Adicionar ou retirar Sementes, com ou sem animação da HUD.
- Guardar, restaurar ou descartar um snapshot narrativo por chave.
- Bloquear e desbloquear formas temporariamente.
- Resgatar NPC por `npcId` único, evitando contagem duplicada.
- Adicionar habitantes não resgatáveis, como lojistas e visitantes.
- Definir ou sincronizar a população de uma vila.
- Mostrar mensagens de tutorial.

Snapshots que continuam activos são persistidos no save. Íris Base permanece protegida contra bloqueio ou remoção.

## Vilas

- `rescuedCount` guarda os NPCs resgatados que participam da restauração.
- `additionalPopulation` guarda lojistas, visitantes e outros habitantes extras.
- A sincronização preserva a população adicional.
- `VillageEvolutionController` aplica cinco níveis: Vazia, Primeiros Resgates, Viva, Restaurada e Pós-boss.
- Música, lojas, decoração e objectos podem ser configurados por nível no Inspector.

## Jukebox e Melodias

- O Jukebox é uma compra única, não uma recompensa exclusiva do pós-game.
- Faixas base aparecem depois da compra do Jukebox.
- Cada faixa de área normal pode possuir um `melodyId`.
- `SyncAllEntries` consulta `HasCollectedMelody` e só mostra a Melodia já recolhida.
- Favoritos são persistidos por variáveis `jukebox_fav_<id>`.
- A lista actualiza quando uma nova Melodia Selvagem é obtida.

## SaveData versão 1

Persistem, entre outros dados:

- Ecos disponíveis e total histórico;
- Ecos encontrados por área;
- Melodias recolhidas;
- população das vilas;
- snapshots narrativos activos.

Ecos Perdidos servem para comprar Sussurros, mas não entram directamente na percentagem de conclusão.

## Provações de Gaia

Tipos de objectivo:

- Tempo.
- Derrotar todos os inimigos.
- Derrotar quantidade específica.
- Recolher todas as Sementes.
- Recolher item, Runa ou objecto específico.
- Sobreviver sem dano.
- Regra combinada.

O portal pode exigir uma forma, mostrar o ícone, acender apenas quando válido, bloquear a troca e indicar conclusão.

## Provações de Apolo

- Uma área por mundo.
- Libertada no 100% do mundo.
- Não entra no cálculo do 100% base.
- Dividida em secções reordenáveis.
- Cada secção define animal, categoria, tempo, inimigos ou recolha.
- Cada mundo entrega uma Runa de Apolo.
- Seis Runas concedem o Emblema de Apolo e a aura correspondente.

## Hazards

### Espinho cadente

Configurar raio de detecção, aviso, velocidade, dano, retorno e respawn.

### Plataforma cadente

Configurar atraso, tremor, velocidade, distância e tempo de retorno.

## Tutoriais

- Importante: centro, exige confirmação e pode usar imagem.
- Média: perto do elemento indicado e exige confirmação.
- Não importante: popup superior, não exige confirmação.
- Textos longos podem ser divididos em páginas.

## Idiomas

O Planejador regista English, Português, Español, Français e 日本語. Apenas Português está habilitado no conteúdo actual; os restantes permanecem preparados para configuração futura.
