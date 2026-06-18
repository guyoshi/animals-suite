# Animals — Planejador v0.9.1

## Correcção de compilação do Tauri

- Corrigido o erro Rust `E0597: stmt does not live long enough` em `src-tauri/src/lib.rs`.
- A verificação da coluna `name` da tabela `snapshots` agora encerra o iterador antes de `stmt` sair do escopo.
- Nenhuma estrutura de dados, migração, projecto guardado ou comportamento funcional foi alterado.
- A versão web continua equivalente à 0.9.0; esta versão é um hotfix para permitir gerar o instalador Windows.
