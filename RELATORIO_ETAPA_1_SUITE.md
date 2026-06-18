# Relatório — Etapa 1 da Animals Suite

## Objectivo

Preparar a base segura para unificar Planejador e Guia sem copiar todo o conteúdo técnico para dentro do estado principal do projecto.

## Concluído

- [x] Nome e identidade Animals Suite.
- [x] Dois modos visuais integrados.
- [x] Manifesto central.
- [x] Schema do projecto actualizado de 9 para 10.
- [x] Schema inicial do Executor.
- [x] Estado mutável do Executor separado.
- [x] Tabelas SQLite preparadas.
- [x] IDs estáveis definidos.
- [x] Missões do jogo separadas semanticamente de Missões de Produção.
- [x] Rotas reservadas para Roteiro, Guias, Scripts, Foco e Problemas.
- [x] Build React/TypeScript validado.
- [x] ESLint validado.

## Não incluído ainda

- Migração das 96 missões de produção.
- Migração dos 1.099 Steps.
- Importação dos guias Markdown.
- Biblioteca real dos scripts dentro do Executor.
- Pesquisa global entre Planejador e Executor.
- Instalador com dois atalhos do Windows.
- Mapa gamificado.

## Limitação da validação neste ambiente

O frontend foi compilado com sucesso e passou no ESLint. O ambiente usado para preparar o pacote não possui o comando `cargo`, portanto o backend Rust não pôde ser validado por `cargo check` aqui. A estrutura Rust foi revista manualmente e será compilada pelo script Windows no computador com Rust instalado.
