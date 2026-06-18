import { useEffect, useMemo, useState } from 'react';
import { ArchiveRestore, Clock3, GitCompare, FolderOpen, HardDrive, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Card, Field, PageHeader, SectionTitle } from '../components/Ui';
import { compareSnapshot, createSnapshot, deleteSnapshot, listSnapshots, loadSnapshot, openBackupsFolder, renameSnapshot } from '../lib/storage';
import { useProjectStore } from '../store/useProjectStore';
import type { SnapshotComparison, SnapshotInfo } from '../types';

const KIND_LABELS: Record<string,string> = { auto:'Automático', manual:'Manual', close:'Ao fechar' };

export function BackupsPage(){
  const project=useProjectStore(s=>s.project);
  const replaceProject=useProjectStore(s=>s.replaceProject);
  const [rows,setRows]=useState<SnapshotInfo[]>([]);
  const [loading,setLoading]=useState(true);
  const [manualName,setManualName]=useState('');
  const [filter,setFilter]=useState('todos');
  const [comparison,setComparison]=useState<{row:SnapshotInfo;data:SnapshotComparison}|null>(null);
  const [editing,setEditing]=useState<number>();
  const [editingName,setEditingName]=useState('');

  const refresh=async()=>{setLoading(true);try{setRows(await listSnapshots())}finally{setLoading(false)}};
  useEffect(()=>{void refresh()},[]);
  const filtered=useMemo(()=>rows.filter(row=>filter==='todos'||row.kind===filter),[rows,filter]);

  const makeManual=async()=>{await createSnapshot(project,'manual',manualName.trim()||undefined);setManualName('');await refresh()};
  const restore=async(row:SnapshotInfo)=>{if(!confirm(`Restaurar o backup “${row.name||KIND_LABELS[row.kind]||row.kind}”?\n\nO projeto atual será substituído, mas um novo backup de segurança será criado antes.`))return;await createSnapshot(project,'manual','Antes de restaurar backup');const snapshot=await loadSnapshot(row.id);replaceProject(snapshot);alert('Backup restaurado. O projeto foi migrado e salvo novamente.');await refresh()};
  const remove=async(row:SnapshotInfo)=>{if(!confirm(`Excluir definitivamente este backup de ${new Date(row.createdAt).toLocaleString('pt-BR')}?`))return;await deleteSnapshot(row.id);await refresh()};
  const compare=async(row:SnapshotInfo)=>setComparison({row,data:await compareSnapshot(row.id,project)});
  const saveName=async(row:SnapshotInfo)=>{await renameSnapshot(row.id,editingName);setEditing(undefined);setEditingName('');await refresh()};

  return <div><PageHeader title="Backups" subtitle="Veja, nomeie, compare, restaure ou exclua snapshots do projeto. Backups automáticos respeitam o limite configurado." actions={<><button className="secondary-button" onClick={()=>void openBackupsFolder()}><FolderOpen/> Abrir pasta</button><button className="secondary-button" onClick={()=>void refresh()}><RefreshCw/> Atualizar</button></>}/>
    <div className="backup-summary-grid"><Card><HardDrive/><strong>{rows.length}</strong><span>backups guardados</span></Card><Card><Clock3/><strong>{rows.filter(r=>r.kind==='auto').length}</strong><span>automáticos</span></Card><Card><ArchiveRestore/><strong>{rows.filter(r=>r.kind==='manual').length}</strong><span>manuais</span></Card></div>
    <Card className="manual-backup-card"><SectionTitle>Criar backup manual nomeado</SectionTitle><div className="inline-create-row"><Field label="Nome opcional"><input value={manualName} onChange={e=>setManualName(e.target.value)} placeholder="Antes de revisar o Trilho do Musgo"/></Field><button className="primary-button" onClick={()=>void makeManual()}><Plus/> Criar backup</button></div></Card>
    <div className="backup-toolbar"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todos os tipos</option><option value="manual">Manuais</option><option value="auto">Automáticos</option><option value="close">Ao fechar</option></select><span>{filtered.length} resultado(s)</span></div>
    {loading?<div className="empty-state">Carregando backups…</div>:<div className="backup-list">{filtered.map(row=><Card key={row.id} className="backup-row"><div className="backup-row-main"><span className={`backup-kind kind-${row.kind}`}>{KIND_LABELS[row.kind]||row.kind}</span><div><strong>{row.name||`Backup ${row.id}`}</strong><small>{new Date(row.createdAt).toLocaleString('pt-BR')} · {formatBytes(row.sizeBytes)}</small></div></div>{editing===row.id?<div className="backup-rename"><input value={editingName} onChange={e=>setEditingName(e.target.value)} autoFocus/><button className="secondary-button" onClick={()=>void saveName(row)}>Salvar</button><button className="text-button" onClick={()=>setEditing(undefined)}>Cancelar</button></div>:<div className="backup-actions"><button className="text-button" onClick={()=>{setEditing(row.id);setEditingName(row.name??'')}}><Pencil/> Renomear</button><button className="text-button" onClick={()=>void compare(row)}><GitCompare/> Comparar</button><button className="secondary-button" onClick={()=>void restore(row)}><ArchiveRestore/> Restaurar</button><button className="icon-button danger" onClick={()=>void remove(row)} title="Excluir backup"><Trash2/></button></div>}</Card>)}{filtered.length===0&&<div className="empty-state">Nenhum backup neste filtro.</div>}</div>}
    {comparison&&<div className="modal-backdrop" onClick={()=>setComparison(null)}><div className="modal-card backup-compare-modal" onClick={e=>e.stopPropagation()}><SectionTitle>Comparação com {comparison.row.name||`Backup ${comparison.row.id}`}</SectionTitle>{comparison.data.equal?<div className="comparison-equal">Este backup é idêntico ao projeto atual.</div>:<><p className="muted">A comparação abaixo mostra diferenças de quantidade. Textos e posições também podem ter mudado mesmo quando a quantidade é igual.</p><div className="comparison-table">{comparison.data.changedCollections.map(row=><div key={row.key}><strong>{labelFor(row.key)}</strong><span>Atual: {row.current}</span><span>Backup: {row.snapshot}</span><b className={row.delta>0?'positive':'negative'}>{row.delta>0?'+':''}{row.delta}</b></div>)}</div></>}<button className="primary-button" onClick={()=>setComparison(null)}>Fechar</button></div></div>}
  </div>;
}

function formatBytes(value:number){if(value<1024)return `${value} B`;if(value<1024*1024)return `${(value/1024).toFixed(1)} KB`;return `${(value/1024/1024).toFixed(1)} MB`}
function labelFor(key:string){return ({worlds:'Mundos',areas:'Áreas',animals:'Animais',enemies:'Inimigos',items:'Itens',mechanics:'Mecânicas',npcs:'NPCs',missions:'Missões',rumors:'Rumores',whispers:'Sussurros',challenges:'Provações de Gaia',bosses:'Bosses',music:'Músicas',ideas:'Ideias',areaResources:'Recursos locais',galleryImages:'Imagens',relations:'Relações',trash:'Lixeira'} as Record<string,string>)[key]??key}
