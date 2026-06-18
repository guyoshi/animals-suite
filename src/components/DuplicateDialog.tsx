import { Copy, X } from 'lucide-react';
import { useState } from 'react';
import { SectionTitle } from './Ui';

export interface DuplicateOptions {
  basic: boolean;
  tasks: boolean;
  relations: boolean;
  placements: boolean;
  images: boolean;
}

export function DuplicateDialog({title,allowTasks=false,onClose,onConfirm}:{title:string;allowTasks?:boolean;onClose:()=>void;onConfirm:(options:DuplicateOptions)=>void}){
  const [options,setOptions]=useState<DuplicateOptions>({basic:true,tasks:false,relations:false,placements:false,images:false});
  const toggle=(key:keyof DuplicateOptions)=>setOptions(current=>({...current,[key]:!current[key]}));
  return <div className="modal-backdrop" onClick={onClose}><div className="modal-card duplicate-modal" onClick={e=>e.stopPropagation()}><div className="modal-title-row"><SectionTitle>Duplicar {title}</SectionTitle><button className="icon-button" onClick={onClose}><X/></button></div><p className="muted">Escolha exatamente o que será copiado. Relações e colocações ficam desligadas por padrão para evitar duplicações acidentais.</p><div className="duplicate-options"><label><input type="checkbox" checked={options.basic} disabled/><span><strong>Dados básicos</strong><small>Nome, descrição, estado e planejamento principal.</small></span></label>{allowTasks&&<label><input type="checkbox" checked={options.tasks} onChange={()=>toggle('tasks')}/><span><strong>Tarefas</strong><small>Copia tarefas, dependências e condições da missão.</small></span></label>}<label><input type="checkbox" checked={options.relations} onChange={()=>toggle('relations')}/><span><strong>Relações</strong><small>Copia relações explícitas, recomendações e vínculos.</small></span></label><label><input type="checkbox" checked={options.placements} onChange={()=>toggle('placements')}/><span><strong>Colocações no mapa</strong><small>Duplica objetos e posições vinculados ao elemento.</small></span></label><label><input type="checkbox" checked={options.images} onChange={()=>toggle('images')}/><span><strong>Imagens</strong><small>Reutiliza as referências de arte e galeria.</small></span></label></div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={()=>onConfirm(options)}><Copy/> Criar cópia</button></div></div></div>;
}
