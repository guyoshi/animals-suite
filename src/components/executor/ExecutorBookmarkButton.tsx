import { Star } from 'lucide-react';
import { toggleBookmark } from '../../lib/executorBookmarks';
import { useExecutorStore } from '../../store/useExecutorStore';

export function ExecutorBookmarkButton({value,label='Adicionar aos favoritos'}:{value:string;label?:string}){
  const active=useExecutorStore(state=>state.executor.bookmarks.includes(value));
  const mutate=useExecutorStore(state=>state.mutate);
  return <button className={`executor-bookmark-button ${active?'active':''}`} title={active?'Remover dos favoritos':label} aria-pressed={active} onClick={()=>mutate(draft=>{draft.bookmarks=toggleBookmark(draft.bookmarks,value)})}><Star fill={active?'currentColor':'none'}/><span>{active?'Favorito':'Favoritar'}</span></button>;
}
