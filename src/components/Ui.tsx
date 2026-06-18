import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import type { EntityStatus } from '../types';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{actions&&<div className="page-actions">{actions}</div>}</div>;
}

export function Card({ children, className='' }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) { return <div className="section-title"><h2>{children}</h2>{action}</div>; }
export function StatusBadge({ status }: { status: EntityStatus }) { return <span className={`status-badge status-${status}`}>{status==='planejado'?'Planejado':status==='unity'?'Configurado no Unity':'Erro no Unity'}</span>; }
export function WarningDot({ title='Sem relações ou configuração incompleta' }: { title?: string }) { return <span className="warning-dot" title={title}>!</span>; }
export function EmptyState({ title, text }: { title: string; text: string }) { return <div className="empty-state"><strong>{title}</strong><p>{text}</p></div>; }
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>; }

export function HelpTip({topic,title='Abrir ajuda'}:{topic:string;title?:string}){return <Link className="help-tip" to={`/help#${topic}`} title={title}><CircleHelp size={16}/></Link>}
