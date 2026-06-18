# Relatório — Etapa 3 da Animals Suite

Versão produzida: **0.12.0**  
Data: **18/06/2026**  
Plataforma: **desktop somente**

## Objetivo

Integrar de forma real o Animals — Planejador e o Animals — Executor, sem duplicar entidades, mantendo o conteúdo técnico da Etapa 2 e criando uma camada comum para implementação, documentação, testes, problemas e validação.

## Resultado geral

A Etapa 3 foi implementada no código-fonte da Animals Suite.

O Planejador continua sendo a autoridade sobre o design e as entidades do jogo. O Executor passa a acompanhar como essas entidades são configuradas, implementadas e testadas no Unity.

## 1. Integração bidirecional

Foi criada uma página central chamada **Planejador ↔ Executor**.

Ela acompanha as principais entidades:

- Mundos;
- Áreas;
- Animais;
- NPCs;
- Missões do jogo;
- Inimigos;
- Bosses;
- Itens;
- Mecânicas;
- Desafios;
- Músicas;
- Sussurros;
- Rumores.

Cada ficha integrada pode mostrar:

- Estado de implementação;
- Missões de Produção relacionadas;
- Guias e tutoriais;
- Scripts;
- Receitas de teste;
- Problemas e limitações.

As páginas principais do Planejador receberam uma ponte para abrir a ficha correspondente no Executor. A ficha do Executor possui também um botão de retorno ao elemento original do Planejador.

## 2. Relações automáticas e manuais

O sistema tenta encontrar relações automáticas por nomes e IDs normalizados. Essas relações funcionam como sugestões e não alteram os dados originais.

A ficha técnica permite editar relações manuais com:

- Missões de Produção;
- Guias;
- Scripts.

Os IDs permanecem estáveis. Alterar o título de uma entidade não apaga as relações manuais já registradas.

## 3. Estado técnico compartilhado

Foram criados cinco estados próprios do Executor:

| Estado | Significado |
|---|---|
| Não iniciado | A implementação ainda não começou. |
| Configurando | A montagem ou configuração no Unity está em andamento. |
| Implementado | O sistema está montado, mas ainda pode precisar de validação. |
| Testado | O fluxo passou no teste registrado. |
| Bloqueado | Existe erro, dependência ou impedimento. |

Quando a opção de sincronização está ativa, estados compatíveis podem atualizar o estado técnico do elemento no Planejador. O sistema preserva a diferença entre design aprovado e implementação real.

## 4. Receitas de teste

Foram implementadas **12 receitas de teste** cobrindo os sistemas centrais do projeto.

Cada receita oferece:

- Pré-requisitos;
- Passos com o Animals Debug Panel;
- Resultado esperado;
- Testes negativos;
- Guias relacionados;
- Scripts relacionados;
- Estado do teste;
- Campo de notas.

O resultado pode ser registrado como:

- Não testado;
- Passou;
- Falhou;
- Bloqueado.

Quando um teste ligado a uma entidade passa pela ficha integrada, o estado técnico da entidade pode ser marcado como Testado.

## 5. Problemas e limitações conhecidos

Foi criada uma área própria para registrar:

- Bugs;
- Riscos;
- Limitações técnicas;
- Bloqueios;
- Soluções temporárias;
- Sistemas afetados;
- IDs e entidades relacionadas.

O painel permite criar, editar, resolver e excluir registros, além de filtrar por severidade e estado.

Foram incluídos três registros iniciais vindos das auditorias vigentes:

1. Validar preservação do NG+ no fluxo real de autosave;
2. Validar o fluxo completo de Íris Base e adoção do Cavalo;
3. Evitar duplicação de entradas por configuração repetida do Jukebox.

## 6. Validação da Suite

Foi adicionada uma tela de validação cruzada entre:

- Estado do Planejador;
- Estado do Executor;
- Conteúdo do roteiro;
- Índice de guias;
- Biblioteca de scripts;
- Relações manuais;
- Problemas registrados.

A tela diferencia erros, avisos e informações e oferece atalhos para o conteúdo afetado.

Também foi criado `scripts/validate-stage3.mjs`, usado na validação do pacote.

## 7. Pesquisa global

O `Ctrl+K` do Executor foi ampliado. Além do conteúdo técnico da Etapa 2, agora pesquisa:

- Entidades do Planejador;
- Problemas e limitações;
- Receitas de teste.

Os resultados continuam categorizados e abrem diretamente na página correspondente.

## 8. Persistência

O estado do Executor passou para o schema 3 e recebeu:

- `entityLinks`;
- `entityStates`;
- `testRuns`.

O SQLite foi preparado com:

```text
executor_entity_links
executor_entity_states
executor_test_runs
```

Os dados antigos do Planejador e o estado da Etapa 2 são preservados pela migração.

## 9. Conteúdo técnico preservado

| Conteúdo | Quantidade |
|---|---:|
| Etapas | 8 |
| Missões de Produção | 96 |
| Tarefas | 277 |
| Steps | 1.099 |
| Guias, tutoriais e referências | 26 |
| Scripts | 278 |
| Receitas de teste | 12 |

Os scripts, guias e tutoriais continuam disponíveis offline no Executor.

## 10. Desktop-only

A decisão de não produzir versão mobile foi mantida. A interface continua priorizando:

- Janela ampla;
- Sidebar permanente;
- Mouse e teclado;
- Código-fonte;
- Tabelas técnicas;
- Trabalho simultâneo com o Unity.

## 11. Validações executadas

Foram executados com sucesso:

- Sincronização do manifesto;
- Validador estrutural da Etapa 3;
- ESLint;
- TypeScript;
- Build de produção Vite;
- Verificação HTTP do aplicativo compilado;
- Verificação HTTP do manifesto do Executor;
- Contagem do conteúdo preservado;
- Verificação das novas rotas;
- Verificação das tabelas SQLite declaradas.

O Vite apresentou apenas o aviso não bloqueante de que o bundle principal ultrapassa 500 kB.

## 12. Limitação do ambiente

A compilação Rust/Tauri e o instalador NSIS não foram executados porque Rust/Cargo não estão instalados neste ambiente.

No Windows, o build nativo deve ser realizado com:

```text
ATUALIZAR_E_COMPILAR.bat
```

## 13. Próxima etapa recomendada

A próxima etapa pode concentrar-se na qualidade de uso diário:

- Modo Foco completo;
- Favoritos e histórico recente;
- Atalhos e feedback visual finais;
- Notas e exportação seletiva;
- Filtros avançados de produção;
- Melhorias de desempenho e divisão do bundle;
- Comparação automática entre backups.

O mapa gamificado continua recomendado apenas depois dessas funções práticas estarem consolidadas.
