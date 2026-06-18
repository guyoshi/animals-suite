# Animals Suite v0.10.0 — Etapa 1

## Suite integrada

- O Planejador permanece funcional e preserva as rotas existentes.
- O Executor ganhou layout, dashboard, rotas e estado próprios.
- A interface permite alternar entre as duas ferramentas.
- O executável reconhece `--mode=planner` e `--mode=executor`.

## Manifesto único

O ficheiro `suite.manifest.json` centraliza:

- versão da suite;
- versões dos schemas;
- nomes e rotas das aplicações;
- fontes técnicas vigentes;
- ordem de autoridade;
- quantidade esperada de missões de produção e Steps.

`scripts/sync-suite-manifest.mjs` sincroniza os ficheiros de build.

## Banco de dados

O banco anterior é preservado e ampliado com:

- `executor_state`;
- `content_manifest`;
- `executor_progress`;
- `executor_notes`;
- `focus_sessions`;
- `focus_items`;
- `executor_issues`;
- `executor_bookmarks`;
- `recent_locations`;
- `suite_meta`.

## Tipos e IDs

Foram criados tipos específicos do Executor e a convenção:

```text
build-stage-01
build-mission-012
build-task-012-03b
build-step-012-03b-004
```

As missões internas do jogo continuam no Planejador e agora são apresentadas como **Missões do jogo**.
