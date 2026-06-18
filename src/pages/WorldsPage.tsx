import { useNavigate } from 'react-router-dom';
import { Crown, Gem, Home, MapPinned, PawPrint } from 'lucide-react';
import { PageHeader } from '../components/Ui';
import { useProjectStore } from '../store/useProjectStore';

export function WorldsPage(){
  const project=useProjectStore(s=>s.project); const navigate=useNavigate();
  return <div><PageHeader title="Mundos" subtitle="Todos os mundos e suas áreas já estão criados. Nomes podem ser alterados; mundos e fases fixas não podem ser excluídos."/>
  <div className="worlds-grid">{project.worlds.map(w=>{
    const areas=project.areas.filter(a=>a.worldId===w.id); const animals=project.animals.filter(a=>a.worldId===w.id);
    return <button key={w.id} className="world-card" style={{'--world':w.theme.primary,'--world-soft':w.theme.soft} as React.CSSProperties} onClick={()=>navigate(`/world/${w.id}`)}>
      <div className="world-card-banner"><span>{w.theme.pattern}</span></div><div className="world-card-body"><h2>{w.name}</h2><p>{w.lesson}</p><div className="world-card-metrics"><span><MapPinned/> {areas.filter(a=>a.type==='fase').length} fases</span><span><PawPrint/> {animals.length} animais</span><span><Gem/> {areas.reduce((s,a)=>s+a.runeTarget,0)} Runas</span><span><Home/> {areas.some(a=>a.type==='vila')?'Vila':'Hub'}</span><span><Crown/> {areas.some(a=>a.type==='boss')?'Boss':'Final'}</span></div></div>
    </button>})}</div></div>
}
