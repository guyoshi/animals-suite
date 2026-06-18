# Relatório de ajuste — Animals Suite 1.0.1

## Decisão aplicada

O player musical do Planejador e do Executor usa exclusivamente arquivos de áudio anexados às fichas da página **Planejador → Músicas**.

## Comportamento

- O botão **Anexar áudio ao Planejador** copia o arquivo para o armazenamento gerenciado da Animals Suite.
- A ficha registra metadados do anexo: nome original, tipo, tamanho e data.
- Somente fichas com anexo reconhecido entram na playlist.
- Uma ficha sem anexo continua existindo, com suas relações, Jukebox, melodyId e notas, mas não é reproduzida.
- Remover o anexo retira a faixa da playlist sem apagar a ficha.
- O modo aleatório por missão também escolhe apenas entre anexos do Planejador.
- A validação das três músicas de vila exige que cada faixa tenha um anexo.

## Compatibilidade

Arquivos adicionados pelas versões anteriores são migrados automaticamente como anexos reconhecidos. Não é necessário anexá-los novamente.

Os anexos pertencem aos dados do projeto e ficam fora do repositório de código. O identificador Tauri e a pasta de dados permanecem os mesmos, portanto uma atualização normal preserva banco, progresso e arquivos de áudio.

## Validação realizada

- Validador estrutural da Etapa final: aprovado.
- ESLint sobre `src`: aprovado.
- TypeScript `tsc -b`: aprovado.
- Build Vite de produção: aprovado.
- Versões sincronizadas em manifesto, package, package-lock, Cargo e Tauri: 1.0.1.

A compilação nativa do instalador ainda deve ser executada pelo GitHub Actions ou num computador com Rust/Cargo.
