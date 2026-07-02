import { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { checkForSuiteUpdate, installSuiteUpdate, type SuiteUpdateResult } from '../../lib/updater';
import { useExecutorStore } from '../../store/useExecutorStore';

export function SuiteUpdatePrompt(){
  const checked=useRef(false);
  const executor=useExecutorStore(s=>s.executor);
  const mutate=useExecutorStore(s=>s.mutate);
  const [update,setUpdate]=useState<SuiteUpdateResult>();
  const [installing,setInstalling]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    if(checked.current||!executor.settings.autoCheckUpdates)return;
    checked.current=true;let active=true;
    void checkForSuiteUpdate().then(result=>{
      mutate(d=>{d.settings.lastUpdateCheckAt=new Date().toISOString()});
      if(active&&result.available&&result.version!==executor.settings.dismissedUpdateVersion)setUpdate(result);
    }).catch(()=>undefined);
    return()=>{active=false};
  },[executor.settings.autoCheckUpdates,executor.settings.dismissedUpdateVersion,mutate]);

  const install=()=>{setError('');setInstalling(true);void installSuiteUpdate().catch(reason=>{setError(reason instanceof Error?reason.message:String(reason));setInstalling(false)});};

  if(installing)return <div className="update-blocker" role="alertdialog" aria-label="Instalando atualização"><div className="update-blocker-card">{error?<RefreshCw/>:<RefreshCw className="spin"/>}<strong>{error?'Falha na atualização':'Instalando atualização…'}</strong><span>{error?'Feche e tente novamente pelas Configurações.':'O programa vai reiniciar sozinho quando terminar. Não feche a janela.'}</span>{error&&<p className="update-blocker-error">{error}</p>}{error&&<button className="secondary-button" onClick={()=>{setInstalling(false);setError('')}}>Fechar</button>}</div></div>;
  if(!update)return null;
  return <div className="modal-backdrop"><div className="modal update-modal" role="dialog" aria-modal="true"><div className="update-modal-head"><RefreshCw/><h2>Atualização disponível</h2></div><p>A versão <strong>Animals Suite {update.version}</strong> pode ser baixada e instalada pelo próprio aplicativo. Deseja atualizar agora?</p><div className="modal-actions"><Link className="secondary-button" to="/executor/updates" onClick={()=>setUpdate(undefined)}>Ver detalhes</Link><button className="secondary-button" onClick={()=>setUpdate(undefined)}>Depois</button><button className="primary-button" onClick={install}><Download/> Atualizar agora</button></div></div></div>;
}
