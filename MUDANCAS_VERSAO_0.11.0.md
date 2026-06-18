# Mudanças — Animals Suite 0.11.0

Data: 18/06/2026  
Etapa: 2 — Migração do guia para o Executor

## Resumo

O conteúdo técnico do antigo guia foi migrado para o Animals — Executor. A nova interface usa React, TypeScript, rotas e módulos próprios; o `app.js` monolítico do guia antigo não é usado em execução.

A aplicação foi assumida definitivamente como **desktop-only**.

## Roteiro de produção

- 8 Etapas importadas.
- 96 Missões de Produção importadas.
- 49 missões possuem conteúdo detalhado.
- 47 missões permanecem como itens planejados do roteiro.
- 277 Tarefas importadas.
- 1.099 Steps importados.
- IDs estáveis gerados para Etapas, Missões, Tarefas e Steps.
- Missões agrupadas visualmente por Etapa.
- Cards distinguem não iniciada, em andamento, concluída, bloqueada e planejada.
- Bloqueio sequencial configurável.
- Botões para continuar do último local e localizar o próximo Step incompleto.
- Navegação por breadcrumb, tarefa e Step.
- Atalhos de teclado dentro das missões.
- Notas por missão, tarefa e Step.
- Botão **Estou com erro** com prompt técnico copiável.

## Guias e tutoriais

- 26 documentos internos integrados.
- Todos funcionam offline.
- Catálogo pesquisável e categorizado.
- Filtro para documentos históricos.
- Índice lateral automático baseado em H1–H4.
- Pesquisa interna com destaque, contagem e próximo/anterior.
- Referências antigas quebradas foram normalizadas.
- `provações` foi associado ao guia vigente de desafios.
- Documentos existentes mas ausentes do índice antigo foram incorporados.

## Biblioteca de scripts

- 278 scripts integrados.
- Pesquisa por ficheiro, classe, caminho, campo, método e dependência.
- Filtros por categoria e tipo.
- Paginação da listagem.
- Carregamento sob demanda dos detalhes.
- Campos do Inspector, métodos, dependências, **Usado por** e código-fonte.
- Botões de copiar caminho, nomes técnicos e código.
- Notas próprias por script.

## Pesquisa global

- Command palette acessível por `Ctrl+K`.
- Pesquisa em Missões, Tarefas, Steps, guias e scripts.
- Resultados categorizados.
- Navegação por teclado.
- Abertura direta no conteúdo correspondente.

## Progresso e segurança

- Progresso do Executor continua separado do grande JSON do Planejador.
- Importação dos JSONs das versões 15/06, 16/06, 18/06 e 18/06 att.
- Conversão de progresso e notas para IDs estáveis.
- Exportação do estado atual do Executor.
- Restauração de backups da própria Animals Suite.

## Desktop

- Mensagem explícita de aplicação exclusivamente desktop.
- Layout prioriza janela ampla, sidebar, teclado, mouse e leitura de código.
- Não foi criada nem será mantida uma variante mobile nesta etapa.

## Não incluído nesta versão

- Modo Foco funcional.
- Painel completo de problemas.
- Mapa gamificado.
- Conquistas.
- Comparador automático de backups.
- Integração bidirecional completa com todas as entidades do Planejador.
- Instalador final com dois atalhos independentes.
