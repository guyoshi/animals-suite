import type { ProjectState } from '../types';
import { ENTITY_LABELS, type EntityInfo, listEntityInfos } from './entities';

export interface SearchResult extends EntityInfo {
  score: number;
  matchedIn: string;
}

export function searchProject(project: ProjectState, query: string, limit = 60): SearchResult[] {
  const q = normal(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  return listEntityInfos(project,false)
    .map(info=>scoreInfo(info,terms))
    .filter((x):x is SearchResult=>x!==undefined)
    .sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'pt-BR'))
    .slice(0,limit);
}

function scoreInfo(info:EntityInfo,terms:string[]):SearchResult|undefined {
  const title=normal(info.title), subtitle=normal(info.subtitle), id=normal(info.ref.id);
  const keywordText=normal(info.keywords.join(' '));
  let score=0; const hits:string[]=[];
  for(const term of terms){
    if(title===term){score+=120;hits.push('nome exacto');continue}
    if(title.startsWith(term)){score+=70;hits.push('nome');continue}
    if(title.includes(term)){score+=45;hits.push('nome');continue}
    if(id===term||id.includes(term)){score+=35;hits.push('ID');continue}
    if(subtitle.includes(term)){score+=22;hits.push('resumo');continue}
    if(keywordText.includes(term)){score+=8;hits.push('conteúdo');continue}
    return undefined;
  }
  if(info.status==='erro')score+=2;
  return {...info,score,matchedIn:[...new Set(hits)].join(', ')||ENTITY_LABELS[info.ref.type]};
}
function normal(value:string):string{return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
