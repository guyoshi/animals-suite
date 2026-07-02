# Animals Suite 1.1.0

Desktop suite for planning and producing the **Animals** game.

- **Animals — Planner:** game design entities, worlds, areas, maps and production data.
- **Animals — Executor:** production roadmap, guides, tutorials, source scripts, tests, issues, focus mode and the gamified Journey.

Version 1.0.1 includes the organic Journey map, progress achievements, a global production music player powered exclusively by audio files attached to Planner music records, and a GitHub/Tauri signed updater workflow.

For repository setup and automatic releases, follow `GUIA_GITHUB_ATUALIZACOES_PASSO_A_PASSO.md`.

Validation:

```text
npm ci
npm run validate:final
```


## Atualização 02/07

A versão 1.1.0 integra PlayerLocator, recuperação de saves por `.bak`, compatibilidade ampliada de saves antigos, atualização imediata do Jukebox, limpeza de eventos estáticos e validação automática dos dados antes da build. Consulte `MUDANCAS_VERSAO_1.1.0.md`.
