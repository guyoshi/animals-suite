import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Castle, CheckCircle2, Home, Lightbulb, Map, Music, Plus, Trash2 } from 'lucide-react';
import { Card, Field, HelpTip, PageHeader, SectionTitle, WarningDot } from '../components/Ui';
import { EntityTools } from '../components/EntityTools';
import { useProjectStore } from '../store/useProjectStore';
import type { AreaDef, ChallengeDef } from '../types';
import { AreaResourcesPanel } from '../components/AreaResourcesPanel';
import { GalleryManager } from '../components/GalleryManager';
import { getAreaSuggestions } from '../lib/planning';

type Tab = 'summary' | 'level' | 'resources' | 'missions' | 'gallery' | 'music';

export function AreaPage() {
  const { areaId } = useParams();
  const project = useProjectStore(s => s.project);
  const updateArea = useProjectStore(s => s.updateArea);
  const mutate = useProjectStore(s => s.mutate);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'summary');
  useEffect(()=>{const requested=searchParams.get('tab') as Tab|null;if(requested)setTab(requested)},[searchParams]);
  const area = project.areas.find(a => a.id === areaId);
  const world = area && project.worlds.find(w => w.id === area.worldId);
  const map = project.maps.find(m => m.areaId === areaId);
  const unlockIds = area ? (area.animalUnlockIds?.length ? area.animalUnlockIds : area.animalUnlockId ? [area.animalUnlockId] : []) : [];
  const unlockedAnimals = project.animals.filter(a => unlockIds.includes(a.id));
  const suggestions = area ? getAreaSuggestions(project, area.id) : [];
  const counts = useMemo(() => ({
    runes: map?.objects.filter(o => o.resourceType === 'rune').length ?? 0,
    npcs: map?.objects.filter(o => o.resourceType === 'npc').length ?? 0,
    enemies: map?.objects.filter(o => o.resourceType === 'enemy').length ?? 0,
    mechanics: map?.objects.filter(o => o.resourceType === 'mechanic').length ?? 0,
  }), [map]);

  if (!area || !world) return <div>Área não encontrada.</div>;
  const update = (patch: Partial<AreaDef>) => updateArea(area.id, patch);

  return <div style={{ '--world': world.theme.primary } as React.CSSProperties}>
    <PageHeader title={area.name} subtitle={`${world.name} · ${area.type}`} actions={<>{area.type==='vila'&&<Link className="secondary-button" to={`/village/${area.id}`}><Home/> Editor da vila</Link>}{area.type==='boss'&&world.bossId&&<Link className="secondary-button" to={`/bosses?entity=${world.bossId}`}><Castle/> Editor do boss</Link>}<Link className="primary-button" to={`/area/${area.id}/map`}><Map/> Abrir editor do mapa</Link></>} />
    <div className="area-kpis">
      <span>Desbloqueio <strong>{unlockLabel(area)}</strong></span>
      <span>Runas <strong>{counts.runes}/{area.runeTarget}</strong></span>
      <span>NPCs no mapa <strong>{counts.npcs}</strong></span>
      <span>Inimigos <strong>{counts.enemies}</strong></span>
      <span>Mecânicas <strong>{counts.mechanics}</strong></span>
      {!map?.objects.some(o => o.type === 'entry') && <span className="warning-kpi"><WarningDot title="Entrada obrigatória ausente"/> Entrada ausente</span>}
    </div>

    {unlockedAnimals.length > 0 && <Card className="animal-unlock">
      <SectionTitle>{unlockedAnimals.length > 1 ? 'Animais desbloqueados nesta área' : 'Animal desbloqueado nesta área'}</SectionTitle>
      <div className="animal-unlock-stack">{unlockedAnimals.map(animal => <div className="animal-unlock-grid" key={animal.id}>
        <div><h3>{animal.name}</h3><div className="chips">{animal.categories.map(c => <span key={c}>{c}</span>)}</div></div>
        <div><strong>Habilidade principal</strong><p>{animal.primaryAbility ?? animal.abilities[0] ?? 'A definir'}</p><strong>Interações contextuais</strong><ul>{(animal.contextualInteractions ?? animal.abilities.slice(1)).map(x => <li key={x}>{x}</li>)}</ul></div>
        <div><strong>Use no level design</strong><p>{animal.puzzleUses.join(', ')}</p></div>
      </div>)}</div>
    </Card>}

    <div className="tabs">
      <button className={tab === 'summary' ? 'active' : ''} onClick={() => setTab('summary')}>Resumo</button>
      <button className={tab === 'level' ? 'active' : ''} onClick={() => setTab('level')}>Level design</button>
      <button className={tab === 'resources' ? 'active' : ''} onClick={() => setTab('resources')}>Recursos</button>
      <button className={tab === 'missions' ? 'active' : ''} onClick={() => setTab('missions')}>Missões</button>
      <button className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>Galeria</button>
      <button className={tab === 'music' ? 'active' : ''} onClick={() => setTab('music')}>Música</button>
    </div>

    {tab === 'summary' && <div className="two-column">
      <Card><SectionTitle>Identidade</SectionTitle>
        <Field label="Nome"><input value={area.name} onChange={e => update({ name: e.target.value })}/></Field>
        <Field label="Descrição"><textarea value={area.description} onChange={e => update({ description: e.target.value })}/></Field>
        <div className="form-grid">
          <Field label="Tipo de área"><input value={area.designType ?? ''} onChange={e => update({ designType: e.target.value })}/></Field>
          <Field label="Duração estimada"><input value={area.durationEstimate ?? ''} onChange={e => update({ durationEstimate: e.target.value })}/></Field>
        </div>
        <Field label="Cenário"><textarea value={area.setting ?? ''} onChange={e => update({ setting: e.target.value })}/></Field>
        <Field label="Cena no Unity"><input value={area.sceneName} onChange={e => update({ sceneName: e.target.value })}/></Field>
        <Field label="Notas"><textarea value={area.notes} onChange={e => update({ notes: e.target.value })}/></Field>
        <EntityTools entityRef={{type:'area',id:area.id}} showDelete={false}/>
      </Card>
      <Card><SectionTitle>Progressão e metas</SectionTitle>
        <div className="form-grid">
          <Field label="Regra de desbloqueio"><select value={area.unlockMode ?? 'runes'} onChange={e => update({ unlockMode: e.target.value as AreaDef['unlockMode'] })}><option value="runes">Pagar Runas</option><option value="automatico">Automático / gratuito</option><option value="missao_principal">Após missão principal</option><option value="inicio">Disponível no início</option><option value="portao_final">Portão final</option></select></Field>
          <Field label="Missão que desbloqueia"><select value={area.unlockMissionId ?? ''} onChange={e => update({ unlockMissionId: e.target.value || undefined })}><option value="">Nenhuma</option>{project.missions.filter(m => m.worldId === area.worldId).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          {[['Custo de acesso','accessCost'],['Runas','runeTarget'],['Sussurros compráveis','whisperTarget'],['Ecos Perdidos','ecoTarget'],['Melodias Selvagens','melodyTarget'],['Baús','chestTarget'],['NPCs resgatáveis','npcTarget'],['Fragmentos','fragmentTarget']].map(([label,key]) => <Field key={key} label={label}><input type="number" min="0" value={Number(area[key as keyof AreaDef] ?? 0)} onChange={e => update({ [key]: Number(e.target.value) } as Partial<AreaDef>)}/></Field>)}
        </div><Field label="Conta para o 100% base"><select value={area.countsForBaseCompletion===false?'nao':'sim'} onChange={e=>update({countsForBaseCompletion:e.target.value==='sim'})}><option value="sim">Sim</option><option value="nao">Não, conteúdo extra</option></select></Field>{area.type==='fase'&&<p className="info-callout">Fases normais usam 15 Ecos Perdidos para comprar 5 Sussurros com custos 1, 2, 3, 4 e 5. Vilas, bosses e Provações de Apolo não possuem Ecos.</p>}
        <SectionTitle>Animais libertados</SectionTitle>
        <div className="chips selectable">{project.animals.filter(a => a.worldId === area.worldId || a.id === 'cavalo').map(animal => <button key={animal.id} className={unlockIds.includes(animal.id) ? 'selected' : ''} onClick={() => update({ animalUnlockIds: unlockIds.includes(animal.id) ? unlockIds.filter(id => id !== animal.id) : [...unlockIds, animal.id] })}>{animal.name}</button>)}</div>
      </Card>
    </div>}

    {tab === 'level' && <div className="level-design-layout">
      <div className="two-column">
      <Card><SectionTitle>Mecânica e leitura da área</SectionTitle>
        <Field label="Mecânica principal"><textarea value={area.mainMechanicSummary ?? ''} onChange={e => update({ mainMechanicSummary: e.target.value })}/></Field>
        <Field label="Mecânica secundária"><textarea value={area.secondaryMechanicSummary ?? ''} onChange={e => update({ secondaryMechanicSummary: e.target.value })}/></Field>
        <Field label="Uso do item regional"><textarea value={area.regionalItemUse ?? ''} onChange={e => update({ regionalItemUse: e.target.value })}/></Field>
        <Field label="Categorias ensinadas ou testadas"><input value={(area.testedCategories ?? []).join(', ')} onChange={e => update({ testedCategories: splitList(e.target.value) })}/></Field>
        <SectionTitle>Mecânicas centrais pré-criadas</SectionTitle>
        <div className="chips selectable">{project.mechanics.map(m => <button key={m.id} className={area.centralMechanicIds.includes(m.id) ? 'selected' : ''} onClick={() => update({ centralMechanicIds: area.centralMechanicIds.includes(m.id) ? area.centralMechanicIds.filter(x => x !== m.id) : [...area.centralMechanicIds, m.id] })}>{m.icon} {m.name}</button>)}</div>
      </Card>
      <Card><SectionTitle>Plano de construção</SectionTitle>
        <Field label="Hazards"><textarea value={area.hazardNotes ?? ''} onChange={e => update({ hazardNotes: e.target.value })}/></Field>
        <Field label="Inimigos"><textarea value={area.enemyNotes ?? ''} onChange={e => update({ enemyNotes: e.target.value })}/></Field>
        <Field label="Puzzles"><textarea value={area.puzzlePlan ?? ''} onChange={e => update({ puzzlePlan: e.target.value })}/></Field>
        <Field label="Segredos"><textarea value={area.secretsPlan ?? ''} onChange={e => update({ secretsPlan: e.target.value })}/></Field>
        <Field label="Atalhos e retorno"><textarea value={area.shortcutsPlan ?? ''} onChange={e => update({ shortcutsPlan: e.target.value })}/></Field>
        <Field label="Checkpoints"><textarea value={area.checkpointPlan ?? ''} onChange={e => update({ checkpointPlan: e.target.value })}/></Field>
        <Field label="Momento narrativo"><textarea value={area.narrativeMoment ?? ''} onChange={e => update({ narrativeMoment: e.target.value })}/></Field>
        <Field label="Objetivo de design"><textarea value={area.designGoal ?? ''} onChange={e => update({ designGoal: e.target.value })}/></Field>
        <Field label="Risco de frustração"><textarea value={area.frustrationRisk ?? ''} onChange={e => update({ frustrationRisk: e.target.value })}/></Field>
        <Field label="Solução de UX"><textarea value={area.uxSolution ?? ''} onChange={e => update({ uxSolution: e.target.value })}/></Field>
      </Card>
      </div>
      <Card className="area-suggestions-card"><SectionTitle action={<Link className="text-button" to="/coverage"><Lightbulb/> Abrir cobertura completa</Link>}>Sugestões automáticas</SectionTitle><p className="muted">Geradas a partir do mundo, profundidade, animais locais, categorias, mecânicas e habilidades pouco utilizadas. Nada é alterado automaticamente.</p><div className="area-suggestion-list">{suggestions.map(suggestion=><article key={suggestion.id} className={`suggestion-priority-${suggestion.priority}`}><span>{suggestion.priority==='alta'?<AlertTriangle/>:<CheckCircle2/>}</span><div><strong>{suggestion.title}</strong><p>{suggestion.text}</p><small>{suggestion.reason}</small></div><button className="text-button" onClick={()=>update({notes:[area.notes,`[Sugestão de level design] ${suggestion.title}: ${suggestion.text}`].filter(Boolean).join('\n')})}>Adicionar às notas</button></article>)}{suggestions.length===0&&<div className="empty-state"><CheckCircle2/><strong>A área está bem coberta pelas regras atuais.</strong></div>}</div></Card>
    </div>}

    {tab === 'resources' && <div className="resources-page">
      <AreaResourcesPanel areaId={area.id}/>
      <div className="resource-columns">
        <ResourceColumn title="Sussurros da Terra" count={project.whispers.filter(w => w.areaId === area.id && !w.archived).length} target={area.whisperTarget} action="Criar Sussurro" onAdd={() => mutate(d => { d.whispers.push({ id:`sussurro-${crypto.randomUUID()}`, areaId:area.id, phrase:'', rewardNote:'', status:'planejado', archived:false }); })}/>
        <ResourceColumn title="Provações de Gaia" count={project.challenges.filter(c => c.areaId === area.id && !c.archived).length} target={0} action="Criar Provação" onAdd={() => mutate(d => { d.challenges.push({ id:`desafio-${crypto.randomUUID()}`, areaId:area.id, name:'Nova Provação de Gaia', type:'corrida', objective:'', recommendedAnimalIds:[], recommendedAbilities:[], reward:'', repeatable:true, primaryReward:'', repeatReward:'', npcEventRewards:[], isApoloTrial:false,requiredAnimalId:undefined,lockFormDuringTrial:false,allowedCategoryIds:[],portalShowAnimalIcon:true,portalCompletedIndicator:true,portalRewardPreview:true,objectiveTypes:[],countsFor100:true,status:'planejado', archived:false }); })}/>
      </div>
      <ChallengeList areaId={area.id} worldId={area.worldId}/>
    </div>}

    {tab === 'missions' && <Card><SectionTitle action={<Link className="text-button" to="/missions"><Plus/> Abrir criador</Link>}>Missões relacionadas</SectionTitle><div className="simple-list">{project.missions.filter(m => m.areaIds.includes(area.id) && !m.archived).map(m => <div key={m.id}><strong>{m.name}</strong><span>{m.tasks.length} tarefas com dependências</span></div>)}</div></Card>}
    {tab === 'gallery' && <Card><SectionTitle>Galeria da área</SectionTitle><GalleryManager ownerType="area" ownerId={area.id}/></Card>}
    {tab === 'music' && <Card><SectionTitle><Music/> Música da área</SectionTitle><p className="muted">Áreas comuns usam uma faixa. Vilas mantêm três: Vazia, Viva/Restaurada e Pós-boss.</p><Link className="primary-button" to="/music">Abrir biblioteca de músicas</Link></Card>}
  </div>;
}

function ResourceColumn({ title, count, target, action, onAdd }: { title:string; count:number; target:number; action:string; onAdd:()=>void }) {
  return <Card><SectionTitle>{title}</SectionTitle><div className="big-count">{count}{target > 0 && <small> / {target}</small>}</div><button className="secondary-button" onClick={onAdd}><Plus/> {action}</button></Card>;
}

function ChallengeList({ areaId, worldId }: { areaId:string; worldId:string }) {
  const project = useProjectStore(s => s.project);
  const mutate = useProjectStore(s => s.mutate);
  const challenges = project.challenges.filter(c => c.areaId === areaId && !c.archived);
  const animals = project.animals.filter(a => a.worldId === worldId || a.id === 'cavalo');
  if (challenges.length === 0) return null;
  const patch = (id:string, data:Partial<ChallengeDef>) => mutate(d => { const c = d.challenges.find(x => x.id === id); if (c) Object.assign(c, data); });
  return <Card><SectionTitle action={<HelpTip topic="provacoes"/>}>Provações de Gaia</SectionTitle><div className="challenge-list">{challenges.map(ch => <div className="challenge-card" key={ch.id}>
    <div className="challenge-card-head"><input value={ch.name} onChange={e => patch(ch.id,{ name:e.target.value })}/><span className={ch.portalMapObjectId ? 'portal-ok' : 'portal-missing'}>{ch.portalMapObjectId ? 'Porta colocada' : 'Porta não colocada'}</span></div>
    <div className="form-grid three">
      <Field label="Tipo mostrado no portal"><select value={ch.type} onChange={e => patch(ch.id,{ type:e.target.value as ChallengeDef['type'], isApoloTrial:false })}><option value="corrida">Tempo</option><option value="coleta">Coleta</option><option value="puzzle_cronometrado">Puzzle cronometrado</option><option value="combate">Derrotar inimigos</option><option value="sobrevivencia">Sobrevivência</option><option value="defesa_npc">Defesa de NPC</option><option value="combinado">Combinada</option></select></Field>
      <Field label="Repetição"><select value={ch.repeatable === false ? 'unico' : 'repetivel'} onChange={e => patch(ch.id,{ repeatable:e.target.value === 'repetivel' })}><option value="repetivel">Pode repetir</option><option value="unico">Uma vez</option></select></Field>
      <Field label="Estado"><select value={ch.status} onChange={e => patch(ch.id,{ status:e.target.value as ChallengeDef['status'] })}><option value="planejado">Planejado</option><option value="unity">Configurado no Unity</option><option value="erro">Erro no Unity</option></select></Field>
    </div>
    <Field label="Objetivo"><textarea value={ch.objective} onChange={e => patch(ch.id,{ objective:e.target.value })}/></Field>
    <Field label="Tipos de objetivo"><div className="chips selectable">{[['tempo','Tempo'],['derrotar_todos','Derrotar todos'],['derrotar_quantidade','Derrotar quantidade'],['coletar_todas_sementes','Coletar todas as Sementes'],['coletar_objeto','Coletar item/Runa/objeto'],['puzzle','Resolver puzzle'],['sobreviver','Sobreviver']].map(([id,label])=><button key={id} className={(ch.objectiveTypes??[]).includes(id)?'selected':''} onClick={()=>patch(ch.id,{objectiveTypes:(ch.objectiveTypes??[]).includes(id)?(ch.objectiveTypes??[]).filter(x=>x!==id):[...(ch.objectiveTypes??[]),id]})}>{label}</button>)}</div></Field>
    <div className="form-grid three"><Field label="Animal obrigatório"><select value={ch.requiredAnimalId??''} onChange={e=>patch(ch.id,{requiredAnimalId:e.target.value||undefined,portalShowAnimalIcon:Boolean(e.target.value)})}><option value="">Nenhum específico</option>{animals.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label="Troca de forma dentro da Provação"><select value={ch.lockFormDuringTrial?'bloqueada':'livre'} onChange={e=>patch(ch.id,{lockFormDuringTrial:e.target.value==='bloqueada'})}><option value="livre">Livre</option><option value="bloqueada">Bloqueada na forma de entrada</option></select></Field><Field label="Conta para 100%"><select value={ch.countsFor100===false?'nao':'sim'} onChange={e=>patch(ch.id,{countsFor100:e.target.value==='sim'})}><option value="sim">Sim</option><option value="nao">Não</option></select></Field></div>
    <Field label="Categorias permitidas"><div className="chips selectable">{['Rápido','Saltador','Escalador','Forte','Predador','Voador','Aquático','Furtivo','Resistente'].map(category=><button key={category} className={(ch.allowedCategoryIds??[]).includes(category)?'selected':''} onClick={()=>patch(ch.id,{allowedCategoryIds:(ch.allowedCategoryIds??[]).includes(category)?(ch.allowedCategoryIds??[]).filter(x=>x!==category):[...(ch.allowedCategoryIds??[]),category]})}>{category}</button>)}</div></Field>
    <div className="form-grid three"><label className="check-row"><input type="checkbox" checked={ch.portalShowAnimalIcon??Boolean(ch.requiredAnimalId)} onChange={e=>patch(ch.id,{portalShowAnimalIcon:e.target.checked})}/> Mostrar ícone do animal</label><label className="check-row"><input type="checkbox" checked={ch.portalCompletedIndicator!==false} onChange={e=>patch(ch.id,{portalCompletedIndicator:e.target.checked})}/> Indicador de concluída</label><label className="check-row"><input type="checkbox" checked={ch.portalRewardPreview!==false} onChange={e=>patch(ch.id,{portalRewardPreview:e.target.checked})}/> Mostrar recompensa e tipo</label></div>
    {ch.requiredAnimalId&&<p className="info-callout">O portal só acende quando Íris está com o animal exigido, mostra o ícone acima e bloqueia a entrada quando o animal não foi desbloqueado.</p>}
    <div className="form-grid"><Field label="Recompensa principal"><input value={ch.primaryReward ?? ch.reward} onChange={e => patch(ch.id,{ primaryReward:e.target.value, reward:e.target.value })}/></Field><Field label="Recompensa de repetição"><input value={ch.repeatReward ?? ''} onChange={e => patch(ch.id,{ repeatReward:e.target.value })}/></Field></div>
    <Field label="Animais e habilidades recomendados"><div className="challenge-animal-grid">{animals.map(a => <button key={a.id} className={ch.recommendedAnimalIds.includes(a.id) ? 'selected' : ''} onClick={() => patch(ch.id,{ recommendedAnimalIds:ch.recommendedAnimalIds.includes(a.id) ? ch.recommendedAnimalIds.filter(x => x !== a.id) : [...ch.recommendedAnimalIds,a.id] })}><strong>{a.name}</strong><small>{[a.primaryAbility ?? a.abilities[0], ...(a.contextualInteractions ?? a.abilities.slice(1))].filter(Boolean).join(' · ')}</small></button>)}</div></Field>
    <Field label="Habilidades recomendadas adicionais"><input value={ch.recommendedAbilities.join(', ')} onChange={e => patch(ch.id,{ recommendedAbilities:splitList(e.target.value) })}/></Field>
    <SectionTitle action={<button className="text-button" onClick={() => patch(ch.id,{ npcEventRewards:[...(ch.npcEventRewards ?? []),{npcId:'',eventId:'',notes:''}] })}><Plus/> Evento de NPC</button>}>Eventos de NPC após recompensa</SectionTitle>
    {(ch.npcEventRewards ?? []).map((reward,index) => <div className="inline-edit-row" key={`${ch.id}-npc-${index}`}><select value={reward.npcId} onChange={e => mutate(d => { const c=d.challenges.find(x=>x.id===ch.id); if(c?.npcEventRewards)c.npcEventRewards[index].npcId=e.target.value; })}><option value="">Selecionar NPC</option>{project.npcs.filter(n=>!n.archived).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select><input placeholder="ID do evento" value={reward.eventId} onChange={e => mutate(d => { const c=d.challenges.find(x=>x.id===ch.id); if(c?.npcEventRewards)c.npcEventRewards[index].eventId=e.target.value; })}/><button className="icon-button danger" onClick={() => patch(ch.id,{ npcEventRewards:(ch.npcEventRewards ?? []).filter((_,i)=>i!==index) })}><Trash2/></button></div>)}
    <EntityTools entityRef={{type:'challenge',id:ch.id}}/>
  </div>)}</div></Card>;
}

function splitList(value:string) { return value.split(',').map(x => x.trim()).filter(Boolean); }
function unlockLabel(area:AreaDef) {
  if (area.unlockMode === 'inicio') return 'Inicial';
  if (area.unlockMode === 'automatico') return 'Automático';
  if (area.unlockMode === 'missao_principal') return 'Missão principal';
  if (area.unlockMode === 'portao_final') return `${area.accessCost} Runa · portão`;
  return `${area.accessCost} Runas`;
}
