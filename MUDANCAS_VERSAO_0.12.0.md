# Animals Suite 0.12.0 — Etapa 3

Data: 18/06/2026  
Plataforma: desktop

## Integração Planejador ↔ Executor

- Criada a página **Planejador ↔ Executor** com cobertura das principais entidades do projeto.
- Adicionada uma ficha técnica do Executor para mundos, áreas, animais, NPCs, missões do jogo, inimigos, bosses, itens, mecânicas, desafios, músicas, Sussurros e Rumores.
- As principais fichas do Planejador agora exibem uma ponte para o Executor.
- Mundos também receberam acesso direto à ficha técnica do Executor.
- Cada entidade pode reunir Missões de Produção, guias, scripts, testes e problemas relacionados.
- Relações automáticas usam nomes e IDs estáveis; relações manuais podem ser adicionadas ou corrigidas sem alterar os dados do Planejador.

## Estado técnico compartilhado

Foram adicionados os estados:

- Não iniciado;
- Configurando;
- Implementado;
- Testado;
- Bloqueado.

Quando a sincronização está ativada, o Executor pode refletir o estado técnico compatível no Planejador. Design e implementação continuam sendo dimensões diferentes; o sistema não transforma automaticamente uma decisão de design em implementação concluída.

## Receitas de teste

Foram incluídas 12 receitas de teste para:

1. Save, carregamento e checkpoints;
2. Player, formas e transformações;
3. Água, mergulho e oxigênio;
4. Missões e Diário;
5. NPCs resgatáveis e evolução das vilas;
6. Terra de Gaia e viagens;
7. Jukebox e Melodias Selvagens;
8. Colecionáveis, itens e economia;
9. Desafios e Provações;
10. Inimigos e bosses;
11. Menus e HUD;
12. Fluxo inicial de Íris Base e Cavalo.

Cada receita possui pré-requisitos, passos com o Animals Debug Panel, resultados esperados, testes negativos, guias, scripts e campo de notas.

## Problemas e limitações

- Criado painel próprio para bugs, riscos, bloqueios e limitações.
- Filtros por severidade, estado e pesquisa.
- Estados: Aberto, Investigando, Resolvido e Adiado.
- Severidades: Baixa, Média, Alta e Crítica.
- Problemas podem ser vinculados a entidades do Planejador e IDs técnicos.
- Incluídos alertas iniciais para validação do NG+, fluxo de Íris Base e possível duplicação de configuração do Jukebox.

## Validação cruzada

A nova página **Validação da Suite** verifica:

- integridade das contagens do conteúdo;
- relações manuais com Missões, guias e scripts;
- referências a entidades removidas;
- problemas ligados a IDs inexistentes;
- entidades bloqueadas;
- cobertura técnica e avisos de integração.

## Pesquisa global

O `Ctrl+K` do Executor agora também encontra:

- entidades do Planejador;
- receitas de teste;
- problemas e limitações;
- além das Missões, Tarefas, Steps, guias e scripts já existentes.

## Persistência e banco

O schema do Executor e do SQLite foi atualizado para a versão 3. Foram preparadas as tabelas:

- `executor_entity_links`;
- `executor_entity_states`;
- `executor_test_runs`.

O banco e o identificador da aplicação continuam compatíveis com as versões anteriores.

## Conteúdo preservado

Permanecem disponíveis offline:

- 8 Etapas;
- 96 Missões de Produção;
- 277 Tarefas;
- 1.099 Steps;
- 26 guias, tutoriais e referências;
- 278 scripts com Inspector, métodos, dependências e código-fonte.

## Limitações conhecidas

- As associações automáticas são sugestões baseadas em nome e ID; relações ambíguas devem ser confirmadas manualmente.
- O build nativo Tauri/NSIS não foi executado neste ambiente por ausência de Rust/Cargo.
- Modo Foco avançado, refinamentos visuais finais, comparação automática de backups e mapa gamificado permanecem para etapas posteriores.
