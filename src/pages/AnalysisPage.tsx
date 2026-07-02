import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ProgressPage } from './ProgressPage';
import { CoveragePage } from './CoveragePage';

// Página unificada de Análise: junta "Progresso e Emblemas" e "Cobertura" em abas.
// As rotas antigas /progress e /coverage continuam válidas (deep links) e caem na aba certa.
export function AnalysisPage(){
  const location=useLocation();
  const [tab,setTab]=useState<'progresso'|'cobertura'>(location.pathname.includes('coverage')?'cobertura':'progresso');
  return <div>
    <div className="tabs"><button className={tab==='progresso'?'active':''} onClick={()=>setTab('progresso')}>Progresso e Emblemas</button><button className={tab==='cobertura'?'active':''} onClick={()=>setTab('cobertura')}>Cobertura de habilidades</button></div>
    {tab==='progresso'?<ProgressPage/>:<CoveragePage/>}
  </div>;
}
