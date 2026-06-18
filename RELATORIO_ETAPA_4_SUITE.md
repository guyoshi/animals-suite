# Relatório da Etapa 4 — Animals Suite 0.13.0

## Entregas

1. Modo Foco diário funcional.
2. Favoritos e histórico recente.
3. Exportação seletiva e impressão.
4. Filtros de produção no roteiro.
5. Refinamentos de interface e feedback.
6. Divisão de código por rota.
7. Atualizador Tauri preparado para GitHub Releases.
8. Workflow de Release para Windows/NSIS.

## Atualizador

O código fica desativado de forma segura em builds sem `ANIMALS_UPDATE_ENDPOINT` e `ANIMALS_UPDATE_PUBKEY`. O workflow oficial injeta ambos durante a compilação e usa os Secrets de assinatura. Consulte `GUIA_ATUALIZACOES_GITHUB.md`.
