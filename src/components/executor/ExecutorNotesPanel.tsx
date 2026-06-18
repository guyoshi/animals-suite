import { useMemo, useState } from 'react';
import { Clock3, Plus, StickyNote, Trash2 } from 'lucide-react';
import { useExecutorStore } from '../../store/useExecutorStore';
import type { ExecutorOwnerType } from '../../types/executor';

export function ExecutorNotesPanel({ ownerType, ownerId, compact = false }: { ownerType: ExecutorOwnerType; ownerId: string; compact?: boolean }) {
  const notes = useExecutorStore(state => state.executor.notes);
  const mutate = useExecutorStore(state => state.mutate);
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const ownerNotes = useMemo(() => notes.filter(note => note.ownerType === ownerType && note.ownerId === ownerId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)), [notes, ownerId, ownerType]);

  const add = () => {
    const value = text.trim();
    if (!value) return;
    const now = new Date().toISOString();
    mutate(draft => {
      draft.notes.push({
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        ownerType,
        ownerId,
        text: value,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        createdAt: now,
        updatedAt: now,
      });
    });
    setText('');
    setTags('');
  };

  return <section className={`executor-notes-panel ${compact ? 'compact' : ''}`}>
    <div className="executor-notes-heading"><div><StickyNote/><strong>Notas</strong><span>{ownerNotes.length}</span></div></div>
    <textarea value={text} onChange={event=>setText(event.target.value)} placeholder="Registre valores usados, erros, decisões ou algo para revisar…"/>
    <div className="executor-note-compose"><input value={tags} onChange={event=>setTags(event.target.value)} placeholder="Tags separadas por vírgula"/><button className="secondary-button" onClick={add}><Plus/>Adicionar nota</button></div>
    {ownerNotes.length>0&&<div className="executor-note-list">{ownerNotes.map(note=><article key={note.id}>
      <div><span><Clock3/>{new Date(note.updatedAt).toLocaleString('pt-BR')}</span><button title="Excluir nota" onClick={()=>mutate(draft=>{draft.notes=draft.notes.filter(item=>item.id!==note.id)})}><Trash2/></button></div>
      <p>{note.text}</p>
      {note.tags.length>0&&<footer>{note.tags.map(tag=><span key={tag}>{tag}</span>)}</footer>}
    </article>)}</div>}
  </section>;
}
