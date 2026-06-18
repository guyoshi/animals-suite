import { useRef, useState } from 'react';
import { Download, FileJson, Gamepad2, Monitor, Music2, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader, Card, SectionTitle } from '../../components/Ui';
import { useAsyncContent } from '../../hooks/useAsyncContent';
import { loadBuildMissions, loadExecutorContentManifest } from '../../lib/executorContent';
import { importLegacyGuideData, type LegacyImportResult } from '../../lib/legacyGuideImport';
import { useExecutorStore } from '../../store/useExecutorStore';

export function ExecutorSettingsPage(){
  const executor=useExecutorStore(state=>state.executor);
  const mutate=useExecutorStore(state=>state.mutate);
  const flushSave=useExecutorStore(state=>state.flushSave);
  const {data:missions}=useAsyncContent(loadBuildMissions,[]);
  const {data:contentManifest}=useAsyncContent(loadExecutorContentManifest,[]);
  const fileRef=useRef<HTMLInputElement>(null);
  const [result,setResult]=useState<LegacyImportResult>();
  const [currentImported,setCurrentImported]=useState('');
  const [error,setError]=useState('');

  const importFile=async(file?:File)=>{
    if(!file||!missions)return;
    setError('');setResult(undefined);setCurrentImported('');
    try{
      const parsed=JSON.parse(await file.text()) as {format?:string;executor?:typeof executor};
      if(parsed.format==='animals-suite-executor'&&parsed.executor){
        if(!window.confirm('Substituir o estado atual do Executor por este backup?'))return;
        mutate(draft=>{
          const incoming=parsed.executor!;
          draft.progress=incoming.progress||{};
          draft.notes=incoming.notes||[];
          draft.focusItems=incoming.focusItems||[];
          draft.bookmarks=incoming.bookmarks||[];
          draft.issues=incoming.issues||[];
          draft.entityLinks=incoming.entityLinks||[];
          draft.entityStates=incoming.entityStates||{};
          draft.testRuns=incoming.testRuns||{};
          draft.recentLocations=incoming.recentLocations||[];
          draft.currentLocation=incoming.currentLocation;
          draft.settings={...draft.settings,...(incoming.settings||{})};
        });
        setCurrentImported('Backup atual do Executor restaurado com sucesso.');
      }else{
        let importResult:LegacyImportResult|undefined;
        mutate(draft=>{importResult=importLegacyGuideData(parsed,draft,missions)});
        setResult(importResult);
      }
      await flushSave();
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason));}
    if(fileRef.current)fileRef.current.value='';
  };

  const exportData=()=>{
    const payload={format:'animals-suite-executor',version:executor.contentVersion,exportedAt:new Date().toISOString(),executor};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`Animals_Executor_Backup_${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(link.href);
  };

  return <div>
    <PageHeader title="Configurações do Executor" subtitle="Preferências de uso, segurança do progresso e migração do guia antigo. Esta aplicação é exclusivamente desktop."/>
    <div className="executor-settings-grid">
      <Card><SectionTitle>Experiência desktop</SectionTitle><div className="executor-desktop-notice"><Monitor/><div><strong>Modo desktop confirmado</strong><p>O Executor não terá versão mobile. A interface prioriza janela ampla, teclado, mouse, tabelas técnicas, código-fonte e navegação lateral.</p></div></div>
        <label className="executor-setting-row"><div><strong>Bloqueio sequencial</strong><span>Permite consultar missões futuras, mas bloqueia a conclusão até terminar a missão detalhada anterior.</span></div><input type="checkbox" checked={executor.settings.sequentialLock} onChange={event=>mutate(draft=>{draft.settings.sequentialLock=event.target.checked})}/></label>
        <label className="executor-setting-row"><div><strong>Sincronizar estado com o Planejador</strong><span>Ao alterar o estado de uma entidade no Executor, atualiza Planejado, Unity ou Erro na ficha correspondente quando esse campo existir.</span></div><input type="checkbox" checked={executor.settings.syncPlannerStatus} onChange={event=>mutate(draft=>{draft.settings.syncPlannerStatus=event.target.checked})}/></label>
        <label className="executor-setting-row"><div><strong>Reduzir animações</strong><span>Desativa transições e microanimações quando estiverem disponíveis.</span></div><input type="checkbox" checked={executor.settings.reducedMotion} onChange={event=>mutate(draft=>{draft.settings.reducedMotion=event.target.checked})}/></label>
        <label className="executor-setting-row"><div><strong><Gamepad2/> Ativar Jornada gamificada</strong><span>Mostra o mapa místico com regiões, névoa, nós de missão e navegação por WASD/setas.</span></div><input type="checkbox" checked={executor.settings.gamifiedModeEnabled} onChange={event=>mutate(draft=>{draft.settings.gamifiedModeEnabled=event.target.checked})}/></label>
        <label className="executor-setting-row"><div><strong><Music2/> Player musical no Executor</strong><span>Usa os arquivos cadastrados na Base de Músicas do Planejador enquanto trabalhas.</span></div><input type="checkbox" checked={executor.settings.musicPlayerEnabled} onChange={event=>mutate(draft=>{draft.settings.musicPlayerEnabled=event.target.checked})}/></label>
        <label className="executor-setting-row"><div><strong>Verificar atualizações ao abrir</strong><span>Consulta o GitHub Releases quando o atualizador estiver ativado no build.</span></div><input type="checkbox" checked={executor.settings.autoCheckUpdates} onChange={event=>mutate(draft=>{draft.settings.autoCheckUpdates=event.target.checked})}/></label>
        <label className="executor-setting-row"><div><strong>Abrir por padrão no Executor</strong><span>O atalho específico continuará abrindo aqui mesmo que esta opção esteja desligada.</span></div><input type="checkbox" checked={executor.settings.preferredLaunchMode==='executor'} onChange={event=>mutate(draft=>{draft.settings.preferredLaunchMode=event.target.checked?'executor':'planner'})}/></label>
      </Card>

      <Card><SectionTitle><RefreshCw/> Atualizações</SectionTitle><p className="muted">A Animals Suite 1.0.1 inclui o centro de atualizações preparado para GitHub Releases. A ativação final depende do repositório e das chaves de assinatura.</p><Link className="secondary-button" to="/executor/updates">Abrir centro de atualizações</Link></Card>

      <Card><SectionTitle>Conteúdo integrado</SectionTitle>{contentManifest&&<div className="executor-content-validation"><ShieldCheck/><div><strong>Conteúdo validado</strong><p>{contentManifest.counts.missions} missões · {contentManifest.counts.tasks} tarefas · {contentManifest.counts.steps.toLocaleString('pt-BR')} Steps · {contentManifest.counts.guides} guias · {contentManifest.counts.scripts} scripts</p><small>Fonte técnica: {contentManifest.sourceVersion}</small></div></div>}</Card>

      <Card><SectionTitle>Migrar progresso do guia antigo</SectionTitle><p className="muted">Aceita os arquivos JSON exportados pelo guia 15/06, 16/06, 18/06 e 18/06 att, além dos backups da própria Animals Suite. Steps e notas são convertidos para os IDs estáveis da Animals Suite.</p><div className="executor-import-actions"><label className="primary-button file-button"><Upload/>Selecionar progresso antigo<input ref={fileRef} type="file" accept="application/json,.json" onChange={event=>void importFile(event.target.files?.[0])}/></label></div>{currentImported&&<div className="executor-import-result success"><strong>Restauração concluída</strong><span>{currentImported}</span></div>}{result&&<div className="executor-import-result success"><strong>Importação concluída</strong><span>{result.steps} Steps · {result.notes} notas · {result.ignored} entradas ignoradas</span><small>Origem: {result.sourceVersion}{result.exportedAt?` · ${new Date(result.exportedAt).toLocaleString('pt-BR')}`:''}</small></div>}{error&&<div className="executor-import-result error"><strong>Não foi possível importar</strong><span>{error}</span></div>}</Card>

      <Card><SectionTitle>Cópia de segurança do Executor</SectionTitle><p className="muted">Exporta progresso, notas, favoritos, problemas, relações com o Planejador, testes e posição atual. O conteúdo estático dos guias e scripts já acompanha a aplicação e não precisa ser duplicado.</p><button className="secondary-button" onClick={exportData}><Download/>Exportar estado do Executor</button><div className="executor-backup-info"><FileJson/><span>{executor.lastSavedAt?`Último salvamento interno: ${new Date(executor.lastSavedAt).toLocaleString('pt-BR')}`:'Ainda não houve salvamento nesta instalação.'}</span></div></Card>
    </div>
  </div>;
}
