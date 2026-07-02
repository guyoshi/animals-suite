# Animals Suite 1.1.0

Aplicação desktop integrada para desenvolver o projeto **Animals**.

- **Animals — Planejador:** mundos, áreas, animais, missões do jogo, mapas, produção, música e demais entidades.
- **Animals — Executor:** roteiro de produção, Steps, guias, tutoriais, scripts, testes, problemas, Modo Foco e Jornada gamificada.

## Compatibilidade

O identificador Tauri continua sendo `com.gui.animals.planejador` e o banco continua em `animals-planner.db`. Isso permite que instalações anteriores encontrem os dados existentes. Antes da primeira atualização real, exporte o projeto e crie um snapshot manual.

## Conteúdo integrado

- 8 Etapas;
- 97 Missões de Produção;
- 283 Tarefas;
- 1.123 Steps;
- 27 guias, tutoriais e documentos;
- 282 scripts com Inspector, métodos, dependências e código-fonte;
- 12 receitas de teste;
- integração entre entidades do Planejador e conteúdo do Executor.

## Versão 1.1.0 — backup técnico 02/07

### Jornada gamificada

A Jornada transforma as Etapas num mapa orgânico e místico com névoa, nós luminosos e um orbe controlado por WASD ou setas. Cada região abre uma janela com progresso e Missões. O roteiro tradicional continua disponível.

A página também mostra conquistas derivadas do progresso, dos Steps e das receitas de teste.

### Música durante a produção

O Executor usa exclusivamente os arquivos de áudio anexados às fichas da página **Músicas** do Planejador. O botão de anexo cria uma cópia gerenciada pela Animals Suite; fichas sem anexo não entram na playlist. O player permanece visível durante a navegação e oferece controles por ícones:

- anterior;
- pausa;
- stop;
- play;
- próxima;
- repetir a mesma;
- aleatório;
- aleatório por missão.

No modo por missão, cada Missão de Produção recebe uma faixa aleatória persistente e a música troca ao abrir outra missão.

### Atualizações pelo GitHub

A suite inclui:

- verificação automática ao abrir;
- verificação manual;
- download e instalação dentro do aplicativo;
- validação obrigatória de assinatura;
- workflow GitHub Actions para compilar Windows/NSIS;
- geração de `latest.json`;
- assistentes para primeira configuração e publicação.

Leia `GUIA_GITHUB_ATUALIZACOES_PASSO_A_PASSO.md` antes de publicar a primeira versão.

## Primeira publicação

1. Crie um repositório público vazio no GitHub.
2. Execute `CONFIGURAR_GITHUB_PRIMEIRA_VEZ.bat`.
3. Execute `GERAR_CHAVES_ATUALIZADOR.bat`.
4. Cadastre os Secrets indicados no guia.
5. Execute `PUBLICAR_ATUALIZACAO_GITHUB.bat` com a versão `1.1.0`.
6. Baixe o instalador criado em **Releases**.

## Atualizações futuras

Trabalhe sempre na mesma pasta e execute `PUBLICAR_ATUALIZACAO_GITHUB.bat` com uma versão superior, por exemplo `1.0.2`. O GitHub valida, compila, assina e publica a nova Release.

## Validação local

```text
npm ci
npm run validate:final
```

Para compilar localmente também é necessário Rust:

```text
npm run tauri:build
```

## Fontes vigentes do projeto

1. Decisões mais recentes confirmadas pelo diretor do projeto.
2. `Scripts backup 02-07.rar`.
3. `Animals GDD.docx` de 18/06/2026.
4. Dados estruturados do Planejador.
5. Conteúdo do guia interativo.


## Atualização 02/07

A versão 1.1.0 integra PlayerLocator, recuperação de saves por `.bak`, compatibilidade ampliada de saves antigos, atualização imediata do Jukebox, limpeza de eventos estáticos e validação automática dos dados antes da build. Consulte `MUDANCAS_VERSAO_1.1.0.md`.
