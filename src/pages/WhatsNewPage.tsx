import { CheckCircle2, History, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, PageHeader } from '../components/Ui';
import { useProjectStore } from '../store/useProjectStore';

import { APP_VERSION } from '../config/suiteManifest';

export function WhatsNewPage(){
  const changelog=useProjectStore(s=>s.project.changelog);
  return <div className="whats-new-page">
    <PageHeader title="O que há de novo" subtitle="Histórico de versões da Animals Suite, sem dividir as atualizações por etapas."/>
    <div className="release-timeline">{changelog.map((release,index)=><Card key={release.version} className={`release-card ${index===0?'latest':''}`}>
      <div className="release-head"><div className="release-icon">{index===0?<Sparkles/>:<History/>}</div><div><div className="release-version">Versão {release.version}{index===0&&<span>Atual</span>}</div><h2>{release.title}</h2><small>{release.date}</small></div></div>
      <p className="release-summary">{release.summary}</p>
      <div className="release-sections">{release.sections.map(section=><section key={section.title}><h3>{section.title}</h3><ul>{section.items.map(item=><li key={item}><CheckCircle2/>{item}</li>)}</ul></section>)}</div>
    </Card>)}</div>
  </div>;
}

export function WhatsNewModal({onClose}:{onClose:()=>void}){
  const release=useProjectStore(s=>s.project.changelog.find(item=>item.version===APP_VERSION));
  if(!release)return null;
  return <div className="modal-backdrop whats-new-modal"><div className="modal-card wide">
    <div className="modal-title"><div className="release-icon"><Sparkles/></div><div><span className="eyebrow">Animals — Planejador {release.version}</span><h2>{release.title}</h2><p>{release.summary}</p></div></div>
    <div className="release-sections compact">{release.sections.map(section=><section key={section.title}><h3>{section.title}</h3><ul>{section.items.map(item=><li key={item}><CheckCircle2/>{item}</li>)}</ul></section>)}</div>
    <div className="modal-actions"><Link className="secondary-button" to="/whats-new" onClick={onClose}>Ver histórico completo</Link><button className="primary-button" onClick={onClose}>Começar a usar</button></div>
  </div></div>;
}
