import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { convertFileSrc } from '@tauri-apps/api/core';
import {
  Archive, ArrowLeft, Award, Bot, Boxes, ChevronLeft, ChevronRight, CircleHelp, Crown, Database, GraduationCap,
  Globe2, Home, Layers3, PawPrint, Lightbulb, Menu, MessageCircleQuestion, Moon, Music, Network, Pause, Play,
  Redo2, Repeat2, RotateCcw, Save, Search, Settings, Sun, Trash2, Undo2, UsersRound, Volume2, VolumeX, Wrench, Activity, HardDrive, Pin, PinOff, Workflow,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { createSnapshot, exportProject } from '../lib/storage';
import { CommandPalette } from './CommandPalette';
import { WhatsNewModal } from '../pages/WhatsNewPage';
import { APP_VERSION } from '../config/suiteManifest';
import { attachmentStorageValue, hasPlannerMusicAttachment } from '../lib/musicAttachments';

const nav = [
  ['/', Home, 'Início'], ['/worlds', Globe2, 'Mundos'], ['/animals', PawPrint, 'Animais'], ['/world-map', Network, 'Terra de Gaia'],
  ['/missions', Archive, 'Missões do jogo'], ['/bosses', Crown, 'Bosses'], ['/npcs', UsersRound, 'NPCs'], ['/lore', MessageCircleQuestion, 'Lore'], ['/enemies', Bot, 'Inimigos'], ['/items', Boxes, 'Itens'],
  ['/mechanics', Layers3, 'Mecânicas'], ['/ideas', Lightbulb, 'Ideias'], ['/music', Music, 'Músicas'], ['/production', Wrench, 'Produção'], ['/coverage', Activity, 'Cobertura'], ['/progress', Award, 'Progresso'],
  ['/school', GraduationCap, 'Escola'], ['/systems', Wrench, 'Sistemas 18/06'], ['/backups', HardDrive, 'Backups'], ['/trash', Trash2, 'Lixeira'], ['/help', CircleHelp, 'Ajuda'], ['/settings', Settings, 'Configurações'],
] as const;

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [trackId, setTrackId] = useState<string | undefined>();
  const [playing, setPlaying] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const project = useProjectStore((s) => s.project);
  const saveState = useProjectStore((s) => s.saveState);
  const mutate = useProjectStore((s) => s.mutate);
  const flushSave = useProjectStore((s) => s.flushSave);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const pastCount = useProjectStore((s) => s.past.length);
  const futureCount = useProjectStore((s) => s.future.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const showWhatsNew = project.settings.lastSeenVersion !== APP_VERSION;

  const currentTrack = useMemo(() => project.music.find((m) => !m.archived && hasPlannerMusicAttachment(m) && m.id === (project.settings.persistentTrackId ?? trackId)), [project.music, project.settings.persistentTrackId, trackId]);


  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      const localEditor = location.pathname.endsWith('/map') || location.pathname === '/world-map';
      if (editing || localEditor || !(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) { event.preventDefault(); undo(); }
      if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) { event.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location.pathname, undo, redo]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = project.settings.muted ? 0 : project.settings.volume;
  }, [project.settings.volume, project.settings.muted]);

  useEffect(() => {
    if (project.settings.persistentTrackId || !project.settings.musicEnabled || !project.settings.musicAutoplay) return;
    const match = location.pathname.match(/\/area\/([^/]+)/);
    if (!match) return;
    const area = project.areas.find((a) => a.id === match[1]);
    if (!area) return;
    const belongs=(m:{areaIds?:string[];areaId?:string})=>(m.areaIds?.includes(area.id)??false)||m.areaId===area.id;
    const preferred = project.music.find((m) => hasPlannerMusicAttachment(m) && belongs(m) && (area.type === 'vila' ? m.role === 'vila_vazia' : m.role === 'area'))
      ?? project.music.find((m) => hasPlannerMusicAttachment(m) && belongs(m));
    if (preferred) {
      window.setTimeout(() => { setTrackId(preferred.id); setPlaying(true); }, 0);
    }
  }, [location.pathname, project.settings.persistentTrackId, project.settings.musicEnabled, project.settings.musicAutoplay, project.areas, project.music]);

  useEffect(() => {
    const closeHandler = () => { void createSnapshot(useProjectStore.getState().project, 'close'); };
    window.addEventListener('beforeunload', closeHandler);
    return () => window.removeEventListener('beforeunload', closeHandler);
  }, []);

  useEffect(() => {
    if (!currentTrack || !project.settings.musicEnabled || !audioRef.current) return;
    const storageValue = attachmentStorageValue(currentTrack);
    const src = storageValue?.startsWith('data:') ? storageValue : storageValue ? convertFileSrc(storageValue) : undefined;
    if (!src) return;
    if (audioRef.current.src !== src) audioRef.current.src = src;
    audioRef.current.loop = project.settings.loopPlayback ?? true;
    if (playing) void audioRef.current.play().catch(() => setPlaying(false));
  }, [currentTrack, playing, project.settings.musicEnabled, project.settings.loopPlayback]);

  const toggleTheme = () => mutate((draft) => { draft.settings.theme = draft.settings.theme === 'dark' ? 'light' : 'dark'; });
  const togglePlay = () => {
    if (!project.settings.musicEnabled || !project.settings.musicAutoplay) mutate((draft) => { draft.settings.musicEnabled = true; draft.settings.musicAutoplay = true; });
    if (!currentTrack) {
      const first = project.music.find((m) => hasPlannerMusicAttachment(m));
      if (first) setTrackId(first.id);
    }
    setPlaying((v) => !v);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand"><span className="brand-rune">🐾</span>{!collapsed && <div><strong>Animals</strong><small>Planejador</small></div>}</div>
        <nav>{nav.map(([to, Icon, label]) => <NavLink key={to} to={to} end={to === '/'} className={({isActive})=>isActive?'active':''}><Icon size={19}/>{!collapsed && <span>{label}</span>}</NavLink>)}</nav>
        <div className="suite-switch-area"><Link to="/executor" title="Abrir Animals — Executor"><Workflow/>{!collapsed && <span>Executor</span>}</Link></div>
        <button className="sidebar-collapse" onClick={()=>setCollapsed(v=>!v)}>{collapsed?<ChevronRight/>:<ChevronLeft/>}</button>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu"><Menu/></button><button className="icon-button back-button" onClick={()=>navigate(-1)} title="Voltar à última página"><ArrowLeft/></button><Breadcrumbs path={location.pathname} project={project}/></div>
          <div className="global-search" onClick={()=>setSearchOpen(true)}><Search size={17}/><input value={search} onFocus={()=>setSearchOpen(true)} onChange={(e)=>{setSearch(e.target.value);setSearchOpen(true)}} placeholder="Buscar no projeto"/><kbd>Ctrl K</kbd></div>
          <div className="top-actions"><Link className="version-whats-new" to="/whats-new"><span>Animals Suite · Planejador</span><strong>v{APP_VERSION}</strong><small>O que há de novo</small></Link>
            <button className="icon-button" disabled={pastCount===0} onClick={undo} title="Desfazer alteração (Ctrl+Z)"><Undo2/></button>
            <button className="icon-button" disabled={futureCount===0} onClick={redo} title="Refazer alteração (Ctrl+Y)"><Redo2/></button>
            <button className="save-indicator" onClick={()=>void flushSave()} title="Salvar e verificar agora"><Save size={16}/><span>{saveState === 'saving' ? 'Salvando…' : saveState === 'error' ? 'Falha no save' : project.settings.saveVerificationOk ? 'Salvo e verificado' : 'Não verificado'}</span></button>
            <button className="icon-button" onClick={toggleTheme} title="Alternar tema">{project.settings.theme==='dark'?<Sun/>:<Moon/>}</button>
          </div>
        </header>

        <div className="music-bar">
          <button className="icon-button" onClick={togglePlay}>{playing?<Pause/>:<Play/>}</button>
          <div className="track-marquee"><span>{currentTrack?.title ?? 'Nenhuma música adicionada'}</span></div>
          <button className="icon-button" onClick={()=>mutate(d=>{d.settings.muted=!d.settings.muted},false,'music:mute')} title={project.settings.muted?'Ativar som':'Silenciar sem parar'}>{project.settings.muted?<VolumeX/>:<Volume2/>}</button>
          <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={project.settings.volume} onChange={(e)=>mutate((d)=>{d.settings.volume=Number(e.target.value);})}/>
          <button className="icon-button" onClick={()=>{setPlaying(false); mutate((d)=>{d.settings.musicAutoplay=false;}); if(audioRef.current){audioRef.current.pause();audioRef.current.currentTime=0;}}} title="Parar e impedir reprodução automática"><RotateCcw/></button>
          <button className={`icon-button ${project.settings.loopPlayback?'active':''}`} title={project.settings.loopPlayback?'Desativar repetição':'Repetir faixa'} onClick={()=>mutate(d=>{d.settings.loopPlayback=!d.settings.loopPlayback},false,'music:loop')}><Repeat2/></button>
          <button className={`icon-button ${project.settings.persistentTrackId?'active':''}`} title={project.settings.persistentTrackId?'Desafixar faixa':'Fixar faixa ao navegar'} onClick={()=>mutate((d)=>{d.settings.persistentTrackId=d.settings.persistentTrackId?undefined:currentTrack?.id},false,'music:persistent')}>{project.settings.persistentTrackId?<Pin/>:<PinOff/>}</button>
          <NavLink className="text-button" to="/backups"><Database size={15}/> Backups</NavLink>
          <button className="text-button" onClick={()=>void exportProject(project)}><Archive size={15}/> Exportar</button>
          <audio ref={audioRef} onEnded={()=>setPlaying(false)}/>
        </div>

        <main className="content"><Outlet context={{ search }} /></main>
        <CommandPalette open={searchOpen} query={search} onQuery={setSearch} onClose={()=>setSearchOpen(false)}/>
        <footer className="statusbar"><span><CircleHelp size={14}/> Logs de erros são registrados automaticamente.</span><span>{project.settings.lastSavedAt ? `Último salvamento: ${new Date(project.settings.lastSavedAt).toLocaleString('pt-BR')}` : 'Projeto novo'}</span></footer>
      </div>
      {showWhatsNew && <WhatsNewModal onClose={()=>mutate(d=>{d.settings.lastSeenVersion=APP_VERSION;},false,'settings:last-seen-version')}/>}
    </div>
  );
}

function Breadcrumbs({path,project}:{path:string;project:ReturnType<typeof useProjectStore.getState>['project']}){
  const parts:Array<{label:string;to?:string}>=[];
  if(path==='/')parts.push({label:'Status geral'});
  else if(path==='/world-map/analysis')parts.push({label:'Terra de Gaia',to:'/world-map'},{label:'Análise'});
  else {
    const village=path.match(/\/village\/([^/]+)/);
    const areaMatch=path.match(/\/area\/([^/]+)/);
    const worldMatch=path.match(/\/world\/([^/]+)/);
    if(village){const area=project.areas.find(a=>a.id===village[1]);const world=area&&project.worlds.find(w=>w.id===area.worldId);if(world)parts.push({label:world.name,to:`/world/${world.id}`});parts.push({label:area?.name??'Vila'});}
    else if(areaMatch){const area=project.areas.find(a=>a.id===areaMatch[1]);const world=area&&project.worlds.find(w=>w.id===area.worldId);if(world)parts.push({label:world.name,to:`/world/${world.id}`});if(area)parts.push({label:area.name,to:path.endsWith('/map')?`/area/${area.id}`:undefined});if(path.endsWith('/map'))parts.push({label:'Mapa'});}
    else if(worldMatch){const world=project.worlds.find(w=>w.id===worldMatch[1]);parts.push({label:world?.name??'Mundo',to:path.endsWith('/visual')?`/world/${worldMatch[1]}`:undefined});if(path.endsWith('/visual'))parts.push({label:'Editor visual'});}
    else {const item=nav.find(([to])=>to===path);parts.push({label:item?.[2]??'Animals — Planejador'});}
  }
  return <div className="breadcrumb">{parts.map((part,index)=><span key={`${part.label}-${index}`}>{index>0&&<b>›</b>}{part.to?<Link to={part.to}>{part.label}</Link>:<em>{part.label}</em>}</span>)}</div>;
}
