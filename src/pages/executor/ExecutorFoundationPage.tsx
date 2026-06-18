import { Braces, Database, FolderTree, KeyRound, Layers3 } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '../../components/Ui';
import { SUITE_MANIFEST } from '../../config/suiteManifest';

export function ExecutorFoundationPage(){
  return <div>
    <PageHeader title="Arquitetura da Suite" subtitle="Estrutura criada na Etapa 1 para receber todo o conteúdo do guia sem inflar o estado principal do Planejador."/>
    <div className="executor-foundation-details">
      <Card><SectionTitle><Layers3/> Aplicações</SectionTitle><pre>{`Animals Suite\n├── Animals — Planejador\n└── Animals — Executor`}</pre><p>Dois modos visuais sobre o mesmo núcleo. O executável aceita <code>--mode=planner</code> ou <code>--mode=executor</code>.</p></Card>
      <Card><SectionTitle><Database/> Persistência</SectionTitle><pre>{`project_state       → conteúdo editável do jogo\nexecutor_state      → preferências e metadados\nexecutor_progress   → progresso por ID estável\nexecutor_notes      → notas por entidade\nfocus_sessions      → foco diário\nexecutor_issues     → problemas conhecidos\ncontent_manifest    → versão das fontes`}</pre></Card>
      <Card><SectionTitle><KeyRound/> IDs estáveis</SectionTitle><pre>{`build-stage-01\nbuild-mission-012\nbuild-task-012-03b\nbuild-step-012-03b-004`}</pre><p>Os títulos podem mudar, mas os IDs permanecem iguais para preservar progresso, notas e relações.</p></Card>
      <Card><SectionTitle><FolderTree/> Separação do conteúdo</SectionTitle><pre>{`Conteúdo estático\n├── roteiro\n├── guias\n├── scripts\n└── GDD\n\nDados mutáveis\n├── progresso\n├── notas\n├── foco\n└── problemas`}</pre></Card>
      <Card><SectionTitle><Braces/> Manifesto único</SectionTitle><p><code>suite.manifest.json</code> centraliza versão, schemas, aplicações, fontes e contagens. O script de sincronização atualiza package.json, Cargo.toml e Tauri.</p><div className="manifest-version-grid"><span>Suite<strong>{SUITE_MANIFEST.version}</strong></span><span>Projeto<strong>schema {SUITE_MANIFEST.schemas.project}</strong></span><span>Executor<strong>schema {SUITE_MANIFEST.schemas.executor}</strong></span><span>Banco<strong>schema {SUITE_MANIFEST.schemas.database}</strong></span></div></Card>
    </div>
  </div>;
}
