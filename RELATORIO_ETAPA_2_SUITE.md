# Relatório — Etapa 2 da Animals Suite

Versão produzida: **0.11.0**  
Data: **18/06/2026**  
Plataforma definida: **desktop somente**

## Objetivo

Migrar o conteúdo do guia técnico para o Animals — Executor sem transportar a arquitetura monolítica do antigo `app.js`, preservando o acesso aos scripts, guias, tutoriais e ao roteiro de construção.

## Resultado

A Etapa 2 foi implementada no código-fonte da Animals Suite.

### Conteúdo migrado

| Conteúdo | Quantidade |
|---|---:|
| Etapas | 8 |
| Missões de Produção | 96 |
| Missões detalhadas | 49 |
| Missões planejadas | 47 |
| Tarefas | 277 |
| Steps | 1.099 |
| Guias, tutoriais e referências | 26 |
| Scripts | 278 |

## Confirmação sobre scripts, guias e tutoriais

O Executor **continua dando acesso ao conteúdo técnico** e amplia esse acesso.

### Scripts

A página de Scripts possui catálogo, pesquisa, filtros e paginação. Ao abrir um script, o Executor mostra:

- nome e classe;
- caminho;
- resumo;
- campos do Inspector;
- métodos;
- dependências;
- scripts que o utilizam;
- código-fonte;
- notas.

Os 278 códigos não são montados simultaneamente no DOM. O índice leve é carregado primeiro e cada documento completo é solicitado quando aberto.

### Guias e tutoriais

Os 26 documentos ficam armazenados dentro do pacote e funcionam offline. Cada guia pode oferecer:

- índice lateral automático;
- links para títulos;
- pesquisa no texto;
- destaque do resultado;
- navegação entre ocorrências;
- identificação de categoria e origem.

Foram incluídos os guias principais de configuração, criação e sistemas, os materiais de desafios e os documentos históricos/auditorias relevantes.

## Arquitetura criada

### Importador de conteúdo

Foi criado `scripts/import-guide-content.mjs`, responsável por ler os dados estruturados do guia antigo e gerar JSONs normalizados para o Executor.

O script não reutiliza o `app.js` antigo. Ele importa somente as fontes de conteúdo e gera:

```text
public/executor-content/
├── manifest.json
├── roadmap/
├── guides/
├── scripts/
└── reference/
```

### Carregamento

- Roteiro e índices usam JSON estático incluído no aplicativo.
- Guias completos são carregados quando abertos.
- Scripts completos são carregados quando abertos.
- Todo o conteúdo permanece disponível offline.

### Módulos do Executor

Foram criados módulos separados para:

- dashboard;
- roteiro;
- missão;
- guias;
- leitura de guia;
- scripts;
- detalhe de script;
- notas;
- pesquisa global;
- progresso;
- importação de progresso antigo;
- configurações.

## Funcionalidades implementadas

### Dashboard

- progresso geral;
- progresso por Etapa;
- missões concluídas e em andamento;
- quantidade de guias e scripts;
- continuar do último local;
- próximo Step incompleto.

### Missões

- agrupamento por Etapa;
- estados visuais distintos;
- bloqueio sequencial configurável;
- breadcrumb;
- seleção de tarefa e Step;
- anterior/próximo;
- concluir e avançar;
- atalhos de teclado;
- notas em três níveis;
- botão **Estou com erro**;
- ligações para guias e scripts relacionados.

### Pesquisa

- `Ctrl+K` abre a pesquisa global;
- pesquisa em Missões, Tarefas, Steps, guias e scripts;
- navegação e seleção pelo teclado.

### Migração de progresso

O importador reconhece exportações das versões antigas do guia e converte:

- Steps concluídos;
- notas de missão;
- versão de origem;
- data de exportação quando disponível.

Também foi adicionada exportação e restauração do estado atual do Executor.

## Desktop-only

A versão mobile foi retirada do escopo. Não foram criados drawers ou fluxos próprios para telefone. O CSS e a interface priorizam:

- sidebar fixa;
- largura de trabalho ampla;
- painéis técnicos;
- tabelas;
- código-fonte;
- mouse e teclado.

## Validação realizada

- Importação estrutural do conteúdo.
- Contagem de Missões, Tarefas, Steps, guias e scripts.
- Verificação de IDs únicos.
- Verificação de referências de guias.
- ESLint.
- TypeScript.
- Build de produção Vite.
- Teste de carregamento HTTP do manifesto, de um guia e de um script completo.

## Limitação do ambiente

A compilação nativa Tauri/NSIS não foi executada neste ambiente porque `cargo`/Rust não está instalado. O frontend e o conteúdo foram compilados e validados, mas o `.exe` final deve ser gerado no Windows por:

```text
ATUALIZAR_E_COMPILAR.bat
```

## Próximas etapas sugeridas

1. Integração bidirecional entre entidades do Planejador e tarefas do Executor.
2. Modo Foco funcional.
3. Painel de problemas e limitações.
4. Testes rápidos ligados ao Debug Panel.
5. Validador de pré-requisitos e conclusão.
6. Instalador com atalhos independentes para Planejador e Executor.
7. Mapa gamificado opcional, após a camada funcional estar consolidada.
