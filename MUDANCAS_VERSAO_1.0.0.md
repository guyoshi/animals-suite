# Animals Suite 1.0.0 — Etapa final

## Jornada gamificada

- Mapa orgânico e místico das oito Etapas.
- Névoa para regiões ainda não concluídas.
- Nós luminosos com estado e progresso.
- Orbe controlado por WASD ou setas.
- Enter abre a janela da região.
- Acesso direto às Missões de Produção.
- Seis conquistas derivadas do progresso e dos testes.
- Modo opcional: o Roteiro tradicional permanece disponível.

## Player musical do Executor

- Usa a base de Músicas existente no Planejador.
- Continua tocando enquanto o usuário navega pelo Executor.
- Controles exclusivamente por ícones:
  - anterior;
  - pausa;
  - stop;
  - play;
  - próxima;
  - repetir uma;
  - aleatório;
  - aleatório por missão.
- Lista interna de faixas e volume próprio.
- Respeita o mudo global do Planejador.
- Modo por missão associa uma faixa aleatória persistente a cada Missão de Produção.
- Evita repetir imediatamente a faixa anterior quando existem alternativas.

## GitHub e atualizações

- Guia completo para primeira configuração e futuras versões.
- Assistente para ligar a pasta ao repositório.
- Assistente para gerar as chaves do atualizador.
- Assistente para alterar versão, validar, criar commit, tag e publicar.
- Workflow final usa `validate:final`.
- Tauri Action compila NSIS, assina artefatos, cria Release e publica `latest.json`.
- Verificação automática e manual já integrada ao aplicativo.

## Segurança e compatibilidade

- Chaves privadas ignoradas pelo Git.
- Banco e identificador Tauri mantidos.
- Configurações musicais migradas sem apagar o estado anterior.
- Conteúdo técnico das etapas anteriores preservado.
