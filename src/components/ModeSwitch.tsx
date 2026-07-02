import { Link } from 'react-router-dom';
import { PawPrint, Workflow } from 'lucide-react';

// Seletor de modo compartilhado pelas duas moldas (Planejador e Executor),
// fixo no topo da barra lateral. Dá a sensação de um app só com dois modos.
export function ModeSwitch({ mode, collapsed }: { mode: 'planner' | 'executor'; collapsed: boolean }){
  return <div className={`mode-switch ${collapsed ? 'collapsed' : ''}`} role="tablist" aria-label="Modo do aplicativo">
    <Link to="/" role="tab" aria-selected={mode === 'planner'} className={mode === 'planner' ? 'active' : ''} title="Planejar"><PawPrint size={17}/>{!collapsed && <span>Planejar</span>}</Link>
    <Link to="/executor" role="tab" aria-selected={mode === 'executor'} className={mode === 'executor' ? 'active' : ''} title="Executar"><Workflow size={17}/>{!collapsed && <span>Executar</span>}</Link>
  </div>;
}
