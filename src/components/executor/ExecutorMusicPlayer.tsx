import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ListMusic, Pause, Play, Repeat1, Shuffle, SkipBack, SkipForward, Square, Target, Volume1, Volume2, VolumeX, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { mediaDisplayUrl } from '../../lib/storage';
import { attachmentStorageValue, hasPlannerMusicAttachment } from '../../lib/musicAttachments';
import { useExecutorStore } from '../../store/useExecutorStore';
import { useProjectStore } from '../../store/useProjectStore';
import type { MusicTrack } from '../../types';
import type { ExecutorMusicMode } from '../../types/executor';

const missionRoutePattern=/\/executor\/roadmap\/(build-mission-\d+)/;

export function ExecutorMusicPlayer(){
  const project=useProjectStore(state=>state.project);
  const executor=useExecutorStore(state=>state.executor);
  const mutate=useExecutorStore(state=>state.mutate);
  const location=useLocation();
  const audioRef=useRef<HTMLAudioElement>(null);
  const shouldAutoplay=useRef(false);
  const [playing,setPlaying]=useState(false);
  const [playlistOpen,setPlaylistOpen]=useState(false);
  const [error,setError]=useState('');

  const tracks=useMemo(()=>project.music.filter(track=>!track.archived&&hasPlannerMusicAttachment(track)),[project.music]);
  const currentTrack=tracks.find(track=>track.id===executor.settings.musicCurrentTrackId)??tracks[0];
  const currentIndex=currentTrack?tracks.findIndex(track=>track.id===currentTrack.id):-1;
  const missionId=location.pathname.match(missionRoutePattern)?.[1];
  const enabled=executor.settings.musicPlayerEnabled;
  const mode=executor.settings.musicMode;

  useEffect(()=>{
    const selectedId=executor.settings.musicCurrentTrackId;
    if(!tracks.length||(selectedId&&tracks.some(track=>track.id===selectedId)))return;
    mutate(draft=>{draft.settings.musicCurrentTrackId=tracks[0].id});
  },[executor.settings.musicCurrentTrackId,mutate,tracks]);

  useEffect(()=>{
    const audio=audioRef.current;
    if(!audio)return;
    audio.volume=Math.max(0,Math.min(1,executor.settings.musicVolume));
    audio.muted=project.settings.muted;
    audio.loop=mode==='repetir_uma';
  },[executor.settings.musicVolume,mode,project.settings.muted]);

  useEffect(()=>{
    const audio=audioRef.current;
    if(!audio||!currentTrack)return;
    audio.load();
    if(shouldAutoplay.current){
      shouldAutoplay.current=false;
      void audio.play().then(()=>{setPlaying(true);setError('')}).catch(()=>{setPlaying(false);setError('Não foi possível iniciar esta faixa.')});
    }
  },[currentTrack]);

  useEffect(()=>{
    if(mode!=='por_missao'||!missionId||tracks.length===0)return;
    const assigned=executor.settings.missionTrackAssignments[missionId];
    const valid=tracks.some(track=>track.id===assigned);
    const nextId=valid?assigned:pickRandomTrack(tracks,currentTrack?.id);
    if(!valid){
      shouldAutoplay.current=playing;
      mutate(draft=>{draft.settings.missionTrackAssignments[missionId]=nextId;draft.settings.musicCurrentTrackId=nextId});
    }else if(currentTrack?.id!==nextId){
      shouldAutoplay.current=playing;
      mutate(draft=>{draft.settings.musicCurrentTrackId=nextId});
    }
  },[currentTrack?.id,executor.settings.missionTrackAssignments,missionId,mode,mutate,playing,tracks]);

  if(!enabled)return null;

  const selectTrack=(trackId:string,autoplay=playing)=>{
    shouldAutoplay.current=autoplay;
    mutate(draft=>{draft.settings.musicCurrentTrackId=trackId});
    setPlaylistOpen(false);
  };
  const play=()=>{const audio=audioRef.current;if(!audio||!currentTrack)return;void audio.play().then(()=>{setPlaying(true);setError('')}).catch(()=>setError('Não foi possível reproduzir esta faixa. Verifique o arquivo.'))};
  const pause=()=>{audioRef.current?.pause();setPlaying(false)};
  const stop=()=>{const audio=audioRef.current;if(!audio)return;audio.pause();audio.currentTime=0;setPlaying(false)};
  const move=(direction:1|-1)=>{
    if(!tracks.length)return;
    let index=currentIndex;
    if(mode==='aleatorio'||mode==='por_missao'){
      const id=pickRandomTrack(tracks,currentTrack?.id);
      selectTrack(id,true);
      return;
    }
    index=(index+direction+tracks.length)%tracks.length;
    selectTrack(tracks[index].id,true);
  };
  const changeMode=(next:ExecutorMusicMode)=>{
    mutate(draft=>{draft.settings.musicMode=next});
    if(next==='por_missao'&&missionId&&tracks.length){
      const assigned=executor.settings.missionTrackAssignments[missionId];
      const id=tracks.some(track=>track.id===assigned)?assigned:pickRandomTrack(tracks,currentTrack?.id);
      shouldAutoplay.current=playing;
      mutate(draft=>{draft.settings.musicMode=next;draft.settings.missionTrackAssignments[missionId]=id;draft.settings.musicCurrentTrackId=id});
    }
  };
  const ended=()=>{
    if(mode==='repetir_uma'){void play();return;}
    move(1);
  };
  const setVolume=(value:number)=>mutate(draft=>{draft.settings.musicVolume=value});

  return <div className="executor-music-player" aria-label="Player musical do Executor">
    <audio ref={audioRef} src={mediaDisplayUrl(attachmentStorageValue(currentTrack))} onEnded={ended} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>setError('Arquivo de áudio indisponível.')}/>
    <div className="executor-music-track">
      <button className="music-track-button" onClick={()=>setPlaylistOpen(value=>!value)} title="Abrir biblioteca de músicas" aria-label="Abrir biblioteca de músicas"><ListMusic/></button>
      <div><small>{modeLabel(mode)}{missionId&&mode==='por_missao'?' · faixa desta missão':''}</small><strong>{currentTrack?.title??'Nenhuma música com arquivo'}</strong></div>
      {playlistOpen&&<div className="executor-music-playlist"><header><strong>Base de músicas</strong><button onClick={()=>setPlaylistOpen(false)} aria-label="Fechar lista" title="Fechar"><X/></button></header>{tracks.length?tracks.map(track=><button key={track.id} className={track.id===currentTrack?.id?'active':''} onClick={()=>selectTrack(track.id,true)}><span>{track.title}</span><small>{track.role} · {track.jukeboxVisibility==='base'?'faixa base':track.jukeboxVisibility==='melodia'?'Melodia Selvagem':'biblioteca'}</small></button>):<div className="music-empty"><span>Anexe arquivos de áudio às fichas de Música no Planejador.</span><Link to="/music">Abrir Músicas</Link></div>}</div>}
    </div>
    <div className="executor-music-controls" role="group" aria-label="Controles de reprodução">
      <IconButton label="Música anterior" onClick={()=>move(-1)} disabled={!tracks.length}><SkipBack/></IconButton>
      <IconButton label="Pausar" onClick={pause} disabled={!playing}><Pause/></IconButton>
      <IconButton label="Parar" onClick={stop} disabled={!currentTrack}><Square/></IconButton>
      <IconButton label="Reproduzir" onClick={play} disabled={!currentTrack||playing}><Play/></IconButton>
      <IconButton label="Próxima música" onClick={()=>move(1)} disabled={!tracks.length}><SkipForward/></IconButton>
      <IconButton label="Repetir a mesma música" active={mode==='repetir_uma'} onClick={()=>changeMode(mode==='repetir_uma'?'sequencial':'repetir_uma')}><Repeat1/></IconButton>
      <IconButton label="Ordem aleatória" active={mode==='aleatorio'} onClick={()=>changeMode(mode==='aleatorio'?'sequencial':'aleatorio')}><Shuffle/></IconButton>
      <IconButton label="Música aleatória por missão" active={mode==='por_missao'} onClick={()=>changeMode(mode==='por_missao'?'sequencial':'por_missao')}><Target/></IconButton>
    </div>
    <div className="executor-music-volume"><button title={project.settings.muted?'Som silenciado no Planejador':'Volume'} aria-label="Volume">{project.settings.muted?<VolumeX/>:executor.settings.musicVolume<.5?<Volume1/>:<Volume2/>}</button><input aria-label="Volume da música" type="range" min="0" max="1" step="0.05" value={executor.settings.musicVolume} onChange={event=>setVolume(Number(event.target.value))}/></div>
    {error&&<span className="executor-music-error" title={error}>!</span>}
  </div>;
}

function IconButton({label,onClick,disabled=false,active=false,children}:{label:string;onClick:()=>void;disabled?:boolean;active?:boolean;children:ReactNode}){
  return <button className={active?'active':''} title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</button>;
}
function pickRandomTrack(tracks:MusicTrack[],exclude?:string):string{
  const candidates=tracks.length>1?tracks.filter(track=>track.id!==exclude):tracks;
  return candidates[Math.floor(Math.random()*candidates.length)]?.id??tracks[0]?.id??'';
}
function modeLabel(mode:ExecutorMusicMode):string{
  if(mode==='repetir_uma')return'Repetindo uma faixa';
  if(mode==='aleatorio')return'Modo aleatório';
  if(mode==='por_missao')return'Modo por missão';
  return'Reprodução sequencial';
}
