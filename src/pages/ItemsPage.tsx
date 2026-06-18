import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card, EmptyState, Field, HelpTip, PageHeader, SectionTitle, StatusBadge } from '../components/Ui';
import { EntityTools } from '../components/EntityTools';
import { useProjectStore } from '../store/useProjectStore';
import type { EntityStatus, ItemDef } from '../types';

export function ItemsPage(){
  const project=useProjectStore(s=>s.project);
  const mutate=useProjectStore(s=>s.mutate);
  const [params]=useSearchParams();
  const [selectedId,setSelectedId]=useState(project.items.find(i=>!i.archived)?.id);
  useEffect(()=>{const id=params.get('entity');if(id)setSelectedId(id)},[params]);
  const item=project.items.find(i=>i.id===selectedId&&!i.archived);
  const update=(fn:(i:ItemDef)=>void)=>mutate(d=>{const target=d.items.find(x=>x.id===selectedId);if(target)fn(target)},false,`item:${selectedId}`);
  const add=()=>{const id=`item-${Date.now()}`;mutate(d=>d.items.push({id,name:'Novo item',kind:'global',description:'',technicalDefaults:'',defaultPrice:0,notes:'',status:'planejado',archived:false}),false,'item:create');setSelectedId(id)};
  return <div><PageHeader title="Itens, colecionáveis e Instintos" subtitle="Regras consolidadas do backup 18/06 att: Broto imediato, Seiva no inventário, Ecos Perdidos, Melodias Selvagens e compras únicas." actions={<button className="primary-button" onClick={add}><Plus/> Novo item</button>}/>
    <div className="split-editor"><aside className="entity-list">{project.items.filter(i=>!i.archived).map(i=><button key={i.id} className={selectedId===i.id?'active':''} onClick={()=>setSelectedId(i.id)}><div><strong>{i.name}</strong><small>{i.kind} · {i.defaultPrice} Sementes</small></div><StatusBadge status={i.status}/></button>)}</aside>
      <section className="editor-pane">{!item?<EmptyState title="Selecione um item" text="Itens globais são criados aqui e relacionados a vendedores, missões e áreas."/>:<>
        <div className="editor-heading"><input className="title-input" value={item.name} onChange={e=>update(i=>{i.name=e.target.value})}/></div>
        <div className="form-grid three"><Field label="Tipo"><select value={item.kind} onChange={e=>update(i=>{i.kind=e.target.value as ItemDef['kind']})}><option value="global">Global</option><option value="regional">Regional</option><option value="missao">Missão</option><option value="consumivel">Consumível</option><option value="upgrade">Upgrade / Instinto</option></select></Field><Field label="Mundo"><select value={item.worldId??''} onChange={e=>update(i=>{i.worldId=e.target.value||undefined})}><option value="">Todos</option>{project.worlds.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></Field><Field label="Estado"><select value={item.status} onChange={e=>update(i=>{i.status=e.target.value as EntityStatus})}><option value="planejado">Planejado</option><option value="unity">Configurado no Unity</option><option value="erro">Erro no Unity</option></select></Field></div>
        <Field label="Descrição de design"><textarea value={item.description} onChange={e=>update(i=>{i.description=e.target.value})}/></Field>
        <Field label="Padrão técnico atual" hint="Referência do backup 18/06 att; pode ser afinada nos assets do Unity."><textarea value={item.technicalDefaults??''} onChange={e=>update(i=>{i.technicalDefaults=e.target.value})}/></Field>
        {item.kind==='upgrade'&&<Field label="Pode ser ligado/desligado"><select value={item.toggleable===false?'nao':'sim'} onChange={e=>update(i=>{i.toggleable=e.target.value==='sim'})}><option value="sim">Sim</option><option value="nao">Não / estado permanente</option></select></Field>}
        <Card><SectionTitle action={<HelpTip topic="itens-lojas"/>}>Comportamento e progressão</SectionTitle><div className="form-grid three"><Field label="Ao obter"><select value={item.pickupBehavior??'inventario'} onChange={e=>update(i=>{i.pickupBehavior=e.target.value as NonNullable<ItemDef['pickupBehavior']>})}><option value="imediato">Efeito imediato no cenário</option><option value="inventario">Guardado no inventário</option><option value="colecionavel">Colecionável de progresso</option><option value="upgrade">Desbloqueio / upgrade</option></select></Field><Field label="Compra única"><select value={item.onlyBuyOnce?'sim':'nao'} onChange={e=>update(i=>{i.onlyBuyOnce=e.target.value==='sim'})}><option value="nao">Pode comprar várias vezes</option><option value="sim">Só uma vez; depois fica bloqueado no fim da loja</option></select></Field><Field label="Disponível em todos os mundos"><select value={item.globallyAvailableInShops?'sim':'nao'} onChange={e=>update(i=>{i.globallyAvailableInShops=e.target.value==='sim'})}><option value="nao">Somente lojas relacionadas</option><option value="sim">Pode aparecer em todas as lojas</option></select></Field></div><Field label="Conta para 100%"><select value={item.countsFor100?'sim':'nao'} onChange={e=>update(i=>{i.countsFor100=e.target.value==='sim'})}><option value="nao">Não</option><option value="sim">Sim</option></select></Field>{item.id.includes('jukebox')&&<p className="info-callout">Ao comprar a Jukebox pela primeira vez, o menu é revelado, abre sozinho, mostra o tutorial e fecha antes de continuar o evento. Não exige pós-game. A lista mostra faixas base e apenas as Melodias Selvagens cujo melodyId já foi recolhido.</p>}</Card>
        <Field label="Preço padrão em Sementes"><input type="number" min="0" value={item.defaultPrice} onChange={e=>update(i=>{i.defaultPrice=Number(e.target.value)})}/></Field>
        <Field label="Notas"><textarea value={item.notes} onChange={e=>update(i=>{i.notes=e.target.value})}/></Field>
        <div className="relation-box"><strong>Vendido por</strong><div className="chips">{project.npcs.filter(n=>n.shopItems.some(x=>x.itemId===item.id)).map(n=>{const row=n.shopItems.find(x=>x.itemId===item.id);return <span key={n.id}>{n.name}: {row?.customPrice??item.defaultPrice}</span>})}</div></div>
        <EntityTools entityRef={{type:'item',id:item.id}} onArchived={()=>setSelectedId(undefined)}/>
      </>}</section></div>
  </div>;
}
