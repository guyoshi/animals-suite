# Animals Suite — guia completo para publicar e atualizar pelo GitHub

Este guia foi feito para quem já possui uma conta no GitHub, mas nunca publicou um aplicativo com atualização automática.

Ao final, o fluxo será:

1. Você altera a Animals Suite na pasta do projeto.
2. Executa `PUBLICAR_ATUALIZACAO_GITHUB.bat`.
3. O programa atualiza a versão, valida o código e envia uma tag ao GitHub.
4. O GitHub Actions compila o instalador do Windows.
5. A GitHub Release recebe o instalador, a assinatura e o `latest.json`.
6. Quem já tem o programa instalado recebe um aviso dentro da Animals Suite.
7. Quem não tem baixa o instalador mais recente na página **Releases**.

---

## 1. Entenda o que vai para o GitHub

### Envie a pasta do projeto, não um ZIP

O GitHub deve receber os arquivos-fonte desta pasta, incluindo:

- `src/`;
- `src-tauri/`;
- `scripts/`;
- `.github/workflows/release.yml`;
- `package.json`;
- `package-lock.json`;
- `suite.manifest.json`;
- guias e relatórios.

Não envie manualmente:

- `node_modules/`;
- `dist/`;
- `src-tauri/target/`;
- instaladores já compilados;
- arquivos `.key` ou `.pem`;
- senhas e tokens;
- um ZIP no lugar dos arquivos do projeto.

O arquivo `.gitignore` já impede que os principais arquivos temporários e chaves privadas sejam enviados.

### Preciso apagar e substituir tudo a cada versão?

Não. O Git registra apenas as diferenças.

Na primeira vez, você envia o projeto completo. Nas próximas versões, trabalha na mesma pasta e envia somente as alterações por meio de novos commits. Não apague o repositório, não crie outro repositório e não substitua o projeto por um ZIP.

---

## 2. Programas necessários no Windows

Instale uma vez:

1. **Git for Windows** — necessário para ligar a pasta ao GitHub e enviar versões.
2. **Node.js LTS** — necessário para validar o projeto e usar o Tauri CLI.
3. Um navegador para entrar na conta do GitHub quando o Git pedir autenticação.

Rust não é obrigatório no seu computador para publicar pelo método deste guia, porque o GitHub Actions compila o aplicativo numa máquina online. Rust só é necessário se você quiser compilar o instalador localmente.

Depois de instalar Git ou Node, feche e abra novamente o terminal ou o Explorador de Arquivos.

---

## 3. Crie o repositório no GitHub

1. Entre na sua conta do GitHub.
2. No canto superior direito, clique no botão **+**.
3. Escolha **New repository**.
4. Em **Repository name**, use um nome como:

   `animals-suite`

5. Para o caminho mais simples de atualização automática, escolha **Public**.
6. Não marque **Add a README file**.
7. Não adicione `.gitignore` nem licença nessa tela, porque o projeto já possui os arquivos necessários.
8. Clique em **Create repository**.
9. Copie a URL HTTPS mostrada pelo GitHub. Ela será parecida com:

   `https://github.com/SEU-USUARIO/animals-suite.git`

> Um repositório privado exige autenticação para baixar os arquivos da Release. A configuração desta versão foi preparada para um endpoint público. Se o código precisar ficar privado, use depois um repositório público separado apenas para distribuição ou um servidor próprio de atualizações.

---

## 4. Ligue a pasta da Animals Suite à sua conta

Extraia o ZIP final para uma pasta permanente. Exemplo:

`Documentos\Animals Suite\`

Não trabalhe diretamente dentro do ZIP e não mude de pasta a cada atualização.

### Método automático incluído

1. Abra a pasta do projeto.
2. Dê dois cliques em:

   `CONFIGURAR_GITHUB_PRIMEIRA_VEZ.bat`

3. Cole a URL HTTPS do repositório criada no passo anterior.
4. O assistente irá:
   - iniciar o Git na pasta;
   - usar a branch `main`;
   - registrar o repositório como `origin`;
   - instalar as dependências;
   - validar a versão;
   - criar o primeiro commit;
   - enviar o projeto ao GitHub.
5. Na primeira autenticação, o Git poderá abrir uma janela do navegador. Entre na sua conta e autorize.

Depois disso, a pasta fica permanentemente ligada ao repositório por meio do arquivo interno `.git` e do remote `origin`.

### Como confirmar a ligação

Abra o terminal na pasta e execute:

```powershell
git remote -v
```

Você deve ver a URL do seu repositório nas linhas `fetch` e `push`.

---

## 5. Gere as chaves de assinatura do atualizador

O Tauri não aceita atualizações sem assinatura. A chave privada assina cada nova versão; a chave pública fica dentro do aplicativo e confirma que o arquivo veio de você.

### Método automático incluído

1. Dê dois cliques em:

   `GERAR_CHAVES_ATUALIZADOR.bat`

2. O Tauri poderá pedir uma senha para proteger a chave privada.
3. Use uma senha forte e guarde-a num gestor de senhas.
4. Ao terminar, o terminal exibirá uma **chave pública**. Copie a linha completa.
5. A chave privada será guardada normalmente em:

   `%USERPROFILE%\.tauri\animals-suite.key`

### Regras críticas

- Nunca coloque a chave privada dentro da pasta do projeto.
- Nunca envie a chave privada pelo GitHub, e-mail ou chat.
- Faça pelo menos duas cópias seguras, por exemplo num pen drive guardado e num cofre digital.
- Guarde também a senha da chave.
- Não gere uma nova chave em cada versão.
- Todas as atualizações futuras devem usar a mesma chave privada.

### Copiar o conteúdo da chave privada

Abra PowerShell e execute:

```powershell
Get-Content "$env:USERPROFILE\.tauri\animals-suite.key" -Raw | Set-Clipboard
```

O conteúdo ficará na área de transferência. Use-o apenas para criar o Secret no GitHub.

---

## 6. Cadastre os Secrets no GitHub

No repositório:

1. Clique em **Settings**.
2. Na barra lateral, abra **Secrets and variables**.
3. Clique em **Actions**.
4. Clique em **New repository secret**.

Crie os seguintes Secrets.

### Secret 1 — chave privada

Nome:

`TAURI_SIGNING_PRIVATE_KEY`

Valor:

Cole o conteúdo completo do arquivo `animals-suite.key`.

### Secret 2 — senha da chave

Nome:

`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

Valor:

A senha escolhida ao gerar a chave.

Se você deliberadamente gerou a chave sem senha, este Secret pode ser omitido.

### Secret 3 — chave pública

Nome:

`TAURI_UPDATER_PUBLIC_KEY`

Valor:

Cole a chave pública completa mostrada pelo Tauri ao gerar as chaves.

O `GITHUB_TOKEN` usado no workflow não precisa ser criado manualmente. O próprio GitHub Actions fornece esse token durante a execução.

---

## 7. Confira a permissão do workflow

No repositório:

1. Abra **Settings**.
2. Abra **Actions** → **General**.
3. Procure **Workflow permissions**.
4. Selecione **Read and write permissions**.
5. Salve.

O workflow também declara `contents: write`, mas a configuração do repositório deve permitir a criação da Release.

---

## 8. Publique a primeira versão 1.0.1

Depois de enviar o projeto e cadastrar os Secrets:

1. Na pasta da Animals Suite, abra:

   `PUBLICAR_ATUALIZACAO_GITHUB.bat`

2. Digite:

   `1.0.1`

3. Confirme com `S`.
4. O assistente criará e enviará a tag:

   `app-v1.0.1`

5. No GitHub, abra a aba **Actions**.
6. Clique em **Publicar Animals Suite**.
7. Abra a execução mais recente e acompanhe as etapas.

O workflow irá:

- validar a Animals Suite;
- instalar Rust e Node numa máquina do GitHub;
- compilar o Tauri para Windows;
- gerar o instalador NSIS;
- assinar a atualização;
- criar a Release `Animals Suite v1.0.1`;
- anexar o instalador;
- publicar o arquivo `latest.json`.

### Onde baixar o instalador

1. Abra a página principal do repositório.
2. Clique em **Releases**.
3. Abra `Animals Suite v1.0.1`.
4. Em **Assets**, baixe o arquivo instalador `.exe`.

O código-fonte pode aparecer automaticamente em arquivos ZIP/TAR gerados pelo GitHub, mas esses arquivos não são o instalador. Para instalar, use o `.exe` criado pelo workflow.

---

## 9. Como o programa fica ligado ao seu GitHub

O workflow compila o programa com dois dados:

1. A chave pública armazenada no Secret `TAURI_UPDATER_PUBLIC_KEY`.
2. O endpoint da Release do próprio repositório:

   `https://github.com/SEU-USUARIO/animals-suite/releases/latest/download/latest.json`

O endereço é construído automaticamente a partir de `github.repository`. Portanto, você não precisa escrever seu nome de usuário dentro do código.

A instalação criada por esse repositório continuará procurando atualizações nele. Por isso:

- não renomeie ou apague o repositório sem planejar uma migração;
- não troque a chave privada;
- mantenha as Releases publicadas;
- publique versões novas no mesmo repositório.

---

## 10. Como a verificação automática funciona

Ao abrir a Animals Suite:

1. O aplicativo verifica se a opção **Verificar atualizações automaticamente** está ativa.
2. Consulta o `latest.json` da Release mais recente.
3. Compara a versão publicada com a versão instalada.
4. Se houver uma versão superior, mostra um aviso.
5. Ao confirmar, baixa o pacote da atualização.
6. Confere a assinatura com a chave pública incorporada.
7. Instala a atualização.
8. Reinicia a Animals Suite.

Também é possível verificar manualmente em:

**Executor → Atualizações → Verificar agora**

O GitHub não “entra” no seu computador nem recebe o seu banco do Planejador. O aplicativo apenas consulta publicamente o arquivo de versão e baixa o instalador assinado quando você aceita.

---

## 11. Publicar uma nova atualização no futuro

Exemplo: atualizar de `1.0.1` para `1.0.2`.

### 11.1 Trabalhe sempre na mesma pasta

Faça as alterações no código dentro da pasta já ligada ao GitHub.

Não:

- crie um novo repositório;
- apague a pasta `.git`;
- envie um novo ZIP no lugar dos arquivos;
- substitua manualmente a Release anterior;
- reutilize a mesma versão.

### 11.2 Execute o publicador

1. Dê dois cliques em:

   `PUBLICAR_ATUALIZACAO_GITHUB.bat`

2. Digite:

   `1.0.2`

3. O assistente irá:
   - alterar `suite.manifest.json`;
   - sincronizar `package.json`, `Cargo.toml` e `tauri.conf.json`;
   - executar a validação final;
   - mostrar os arquivos alterados;
   - criar um commit;
   - enviar a branch;
   - criar a tag `app-v1.0.2`;
   - enviar a tag ao GitHub.
4. Confirme a publicação com `S`.
5. Acompanhe em **GitHub → Actions**.
6. Quando terminar, confira **Releases**.

Quem tiver a versão 1.0.1 instalada receberá o aviso da 1.0.2 na próxima verificação.

---

## 12. Como escolher o número da versão

Use sempre `MAIOR.MENOR.CORREÇÃO`.

Exemplos:

- `1.0.2`: correção pequena ou melhoria simples;
- `1.1.0`: conjunto relevante de novas funções;
- `2.0.0`: mudança grande e potencialmente incompatível.

Nunca publique uma nova compilação com o mesmo número de uma versão já lançada. O atualizador precisa de uma versão superior para reconhecer a atualização.

---

## 13. Preciso compilar o instalador toda vez?

Cada versão nova precisa de uma nova compilação, pois o executável precisa conter o código atualizado.

Você não precisa compilar manualmente. Ao enviar a tag, o GitHub Actions faz a compilação automaticamente.

O resultado atende aos dois casos:

- **Usuário já instalou:** atualiza pelo botão interno.
- **Nova instalação ou reinstalação:** baixa o `.exe` mais recente em Releases.

Os instaladores antigos continuam anexados às Releases antigas, a menos que você os apague manualmente.

---

## 14. Não substitua a Release anterior

Para cada versão, crie uma nova Release por meio de uma nova tag:

- `app-v1.0.1`;
- `app-v1.0.2`;
- `app-v1.1.0`.

Não edite a Release 1.0.1 para fingir que ela é 1.0.2. O histórico e o sistema de versões precisam permanecer consistentes.

O link `releases/latest/download/latest.json` passa a apontar para a Release mais recente automaticamente.

---

## 15. Teste recomendado antes de divulgar

Depois da primeira publicação:

1. Baixe e instale a versão 1.0.1 da Release.
2. Abra o programa e confirme que **Executor → Atualizações** está ativo.
3. Faça uma mudança pequena no código ou texto.
4. Publique a versão 1.0.2.
5. Espere o workflow terminar e a Release aparecer.
6. Abra novamente a versão 1.0.1 instalada.
7. Clique em **Verificar agora**.
8. Confirme se a versão 1.0.2 é encontrada.
9. Instale a atualização.
10. Confirme se os dados do Planejador e do Executor continuam intactos.

O banco fica na pasta de dados do aplicativo e não deve ser substituído pelo instalador. Ainda assim, mantenha backups antes de testar as primeiras atualizações reais.

---

## 16. Se o GitHub Actions falhar

Abra:

**Repositório → Actions → Publicar Animals Suite → execução com erro**

Expanda a etapa vermelha.

Problemas comuns:

### Secret ausente ou incorreto

Sintomas:

- erro de assinatura;
- chave pública inválida;
- artefato de atualização não gerado.

Verifique os três Secrets e se não foram adicionados espaços antes ou depois das chaves.

### Senha incorreta

Atualize `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` com a senha exata da chave privada.

### Versão ou tag repetida

Use uma versão superior e uma tag nova.

### Workflow sem permissão

Confirme **Settings → Actions → General → Workflow permissions → Read and write permissions**.

### Validação do projeto falhou

O publicador local executa a mesma validação antes de enviar. Corrija o erro indicado antes de tentar novamente.

---

## 17. Se perder a chave privada

Esse é o risco mais importante do sistema.

As instalações existentes possuem a chave pública antiga. Elas rejeitarão atualizações assinadas com uma chave privada diferente.

Portanto:

- não apague `%USERPROFILE%\.tauri\animals-suite.key`;
- mantenha cópias seguras;
- guarde a senha;
- não gere uma nova chave apenas porque mudou de computador;
- restaure a chave antiga no novo computador.

Uma troca de chave exige uma estratégia de migração planejada antes de perder o acesso à chave anterior.

---

## 18. Resumo operacional

### Primeira vez

1. Criar repositório público vazio.
2. Executar `CONFIGURAR_GITHUB_PRIMEIRA_VEZ.bat`.
3. Executar `GERAR_CHAVES_ATUALIZADOR.bat`.
4. Cadastrar os Secrets.
5. Permitir escrita para Actions.
6. Executar `PUBLICAR_ATUALIZACAO_GITHUB.bat` com `1.0.1`.
7. Baixar o instalador em Releases.

### Atualizações futuras

1. Alterar o projeto na mesma pasta.
2. Executar `PUBLICAR_ATUALIZACAO_GITHUB.bat`.
3. Informar uma versão superior.
4. Confirmar.
5. Acompanhar o workflow.
6. Conferir a Release.

### Regra principal

**Código-fonte vai por commits; instaladores vão automaticamente para Releases; atualizações instaladas consultam o `latest.json`.**

---

## Documentação oficial usada

- [Tauri Updater](https://v2.tauri.app/plugin/updater/)
- [Tauri com GitHub Actions](https://v2.tauri.app/distribute/pipelines/github/)
- [tauri-action](https://github.com/tauri-apps/tauri-action)
- [Criar um repositório no GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [Secrets no GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- [Gerenciar Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
