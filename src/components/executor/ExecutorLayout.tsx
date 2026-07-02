import { useEffect, useState } from 'react';
import { BookOpen, Braces, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Database, Download, FlaskConical, History, Home, Link2, Moon, PawPrint, RefreshCw, Save, ScrollText, Search, Settings, ShieldCheck, Sun, Workflow, Wrench } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { APP_VERSION } from '../../config/suiteManifest';
import { useExecutorStore } from '../../store/useExecutorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { ExecutorCommandPalette } from './ExecutorCommandPalette';
import { ExecutorMusicPlayer } from './ExecutorMusicPlayer';
import { ModeSwitch } from '../ModeSwitch';

const executorNav = [
  ['/executor', Home, 'Início'],
  ['/executor/roadmap', ClipboardCheck, 'Roteiro'],
  ['/executor/production', Wrench, 'Produção'],
  ['/executor/activity', History, 'Favoritos'],
  ['/executor/export', Download, 'Exportar'],
  ['/executor/integration', Link2, 'Integração'],
  ['/executor/tests', FlaskConical, 'Testes'],
  ['/executor/guides', BookOpen, 'Guias'],
  ['/executor/scripts', Braces, 'Scripts'],
  ['/executor/issues', ScrollText, 'Problemas'],
  ['/executor/validation', ShieldCheck, 'Validação'],
  ['/executor/foundation', Database, 'Arquitetura'],
  ['/executor/updates', RefreshCw, 'Atualizações'],
  ['/executor/settings', Settings, 'Configurações'],
] as const;

export function ExecutorLayout(){
  const [collapsed,setCollapsed]=useState(false);
  const [paletteOpen,setPaletteOpen]=useState(false);
  const location=useLocation();
  const executor=useExecutorStore(state=>state.executor);
  const saveState=useExecutorStore(state=>state.saveState);
  const flushSave=useExecutorStore(state=>state.flushSave);
  const rememberLocation=useExecutorStore(state=>state.rememberLocation);
  const theme=useProjectStore(state=>state.project.settings.theme);
  const mutateProject=useProjectStore(state=>state.mutate);
  const toggleTheme=()=>mutateProject(draft=>{draft.settings.theme=draft.settings.theme==='dark'?'light':'dark'});

  useEffect(()=>{
    if(location.pathname.includes('/roadmap/build-mission-'))return;
    rememberLocation({route:`${location.pathname}${location.search}`,visitedAt:new Date().toISOString()});
  },[location.pathname,location.search,rememberLocation]);

  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLocaleLowerCase()==='k'){
        event.preventDefault();setPaletteOpen(value=>!value);
      }
    };
    window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
  },[]);

  const lastMissionLocation=[executor.currentLocation,...executor.recentLocations].find(item=>item?.missionId);
  const currentMissionLabel=lastMissionLocation?.missionId
    ? `${lastMissionLocation.missionId.replace('build-mission-','Missão ')}${lastMissionLocation.stepId?' · Step atual':''}`
    : '';

  return <div className={`app-shell executor-shell ${executor.settings.reducedMotion?'reduce-motion':''}`}>
    <aside className={`sidebar executor-sidebar ${collapsed?'collapsed':''}`}>
      <div className="sidebar-brand"><span className="brand-rune">✦</span>{!collapsed&&<div><strong>Animals</strong><small>Executor</small></div>}</div>
      <ModeSwitch mode="executor" collapsed={collapsed}/>
      <nav>{executorNav.map(([to,Icon,label])=><NavLink key={to} to={to} end={to==='/executor'} className={({isActive})=>isActive?'active':''}><Icon size={19}/>{!collapsed&&<span className="nav-label">{label}{to==='/executor/roadmap'&&currentMissionLabel&&<small>{currentMissionLabel}</small>}</span>}</NavLink>)}</nav>
      <button className="sidebar-collapse" onClick={()=>setCollapsed(value=>!value)}>{collapsed?<ChevronRight/>:<ChevronLeft/>}</button>
    </aside>

    <div className="app-main">
      <header className="topbar executor-topbar">
        <div className="topbar-left"><div className="executor-route-title"><Workflow/><div><strong>Animals — Executor</strong><span>{routeLabel(location.pathname)}</span></div></div></div>
        <button className="executor-search-placeholder" onClick={()=>setPaletteOpen(true)} title="Pesquisa global"><Search/><span>Buscar missões, guias ou scripts</span><kbd>Ctrl K</kbd></button>
        <div className="top-actions"><span className="suite-version">v{APP_VERSION}</span><button className="save-indicator" onClick={()=>void flushSave()}><Save size={16}/><span>{saveState==='saving'?'Salvando…':saveState==='error'?'Falha no save':executor.saveVerificationOk?'Executor salvo':'Não verificado'}</span></button><button className="icon-button" onClick={toggleTheme} title="Alternar tema">{theme==='dark'?<Sun/>:<Moon/>}</button><Link className="icon-button" to="/executor/guides" title="Guias e ajuda"><CircleHelp/></Link></div>
      </header>
      <ExecutorMusicPlayer/>
      <main className="content executor-content"><Outlet/></main>
      <footer className="statusbar"><span>Desktop · Conteúdo técnico offline integrado.</span><span>{executor.lastSavedAt?`Último salvamento: ${new Date(executor.lastSavedAt).toLocaleString('pt-BR')}`:'Estado do Executor preparado'}</span></footer>
    </div>
    <ExecutorCommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}/>
  </div>;
}

function routeLabel(path:string):string{
  if(path.includes('/roadmap/'))return'Missão de Produção';
  if(path.includes('/guides/'))return'Leitura de Guia';
  if(path.includes('/scripts/'))return'Detalhes do Script';
  const exact=executorNav.find(([route])=>route===path);
  return exact?.[2]??'Executor';
}
