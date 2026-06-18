import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bot, Crown, Gem, ImagePlus, MapPinned, PawPrint, Puzzle, Search,
  ShieldOff, Sparkles, Target, UsersRound,
} from 'lucide-react';
import { Card, EmptyState, Field, HelpTip, PageHeader, SectionTitle } from '../components/Ui';
import { EntityTools } from '../components/EntityTools';
import { mediaDisplayUrl, persistMediaFile } from '../lib/storage';
import { useProjectStore } from '../store/useProjectStore';
import type { AnimalDef, EnemyDef } from '../types';

export function AnimalsPage() {
  const project = useProjectStore(s => s.project);
  const [searchParams] = useSearchParams();
  const mutate = useProjectStore(s => s.mutate);
  const [selectedId, setSelectedId] = useState(project.animals[0]?.id);
  const [search, setSearch] = useState('');
  const [worldId, setWorldId] = useState('todos');
  const [category, setCategory] = useState('todas');
  useEffect(()=>{const entity=searchParams.get('entity');if(entity)setSelectedId(entity)},[searchParams]);

  const categories = useMemo(() => [...new Set(project.animals.flatMap(a => a.categories))].sort(), [project.animals]);
  const animals = useMemo(() => project.animals.filter(animal => {
    const text = `${animal.name} ${animal.categories.join(' ')} ${allAbilities(animal).join(' ')}`.toLowerCase();
    return (worldId === 'todos' || animal.worldId === worldId)
      && (category === 'todas' || animal.categories.includes(category))
      && (!search.trim() || text.includes(search.trim().toLowerCase()));
  }), [project.animals, worldId, category, search]);
  const animal = project.animals.find(a => a.id === selectedId) ?? animals[0];

  return <div>
    <PageHeader title="Animais" subtitle="Transformações, habilidades, natação, oxigênio e relações automáticas com o projeto." actions={<HelpTip topic="animais-agua"/>}/>
    <div className="animals-layout">
      <aside className="animals-sidebar">
        <div className="animal-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar animal ou habilidade"/></div>
        <div className="animal-filters">
          <select value={worldId} onChange={e => setWorldId(e.target.value)}><option value="todos">Todos os mundos</option>{project.worlds.map(world => <option value={world.id} key={world.id}>{world.name}</option>)}</select>
          <select value={category} onChange={e => setCategory(e.target.value)}><option value="todas">Todas as categorias</option>{categories.map(value => <option key={value}>{value}</option>)}</select>
        </div>
        <div className="animals-list">{animals.map(item => {
          const world = project.worlds.find(w => w.id === item.worldId);
          return <button key={item.id} className={item.id === animal?.id ? 'active' : ''} onClick={() => setSelectedId(item.id)} style={{'--animal-world': world?.theme.primary} as React.CSSProperties}>
            <span className="animal-avatar">{item.conceptArt ? <img src={mediaDisplayUrl(item.conceptArt)} alt=""/> : <PawPrint/>}</span>
            <div><strong>{item.name}</strong><small>{item.categories.join(' · ')}</small></div>
          </button>;
        })}</div>
      </aside>
      <section className="animal-detail">{!animal ? <EmptyState title="Nenhum animal encontrado" text="Ajuste os filtros para visualizar as transformações."/> : <AnimalDetail animal={animal} />}</section>
    </div>
  </div>;

  function AnimalDetail({ animal: current }: { animal: AnimalDef }) {
    const world = project.worlds.find(w => w.id === current.worldId);
    const unlockArea = project.areas.find(a => a.id === current.unlockAreaId);
    const relevantMechanics = project.mechanics.filter(mechanic => !mechanic.archived && (
      mechanic.goodForAnimals.some(name => same(name, current.name))
      || mechanic.goodForCategories.some(cat => current.categories.some(animalCat => same(cat, animalCat)))
    ));
    const mechanicIds = new Set(relevantMechanics.map(m => m.id));
    const relatedAreas = project.areas.filter(area => area.centralMechanicIds.some(id => mechanicIds.has(id)));
    const challenges = project.challenges.filter(challenge => !challenge.archived && (
      challenge.recommendedAnimalIds.includes(current.id)
      || challenge.recommendedAbilities.some(ability => allAbilities(current).some(a => fuzzy(a, ability)))
    ));
    const bossPhases = project.bosses.flatMap(boss => boss.phases
      .filter(phase => phase.recommendedAnimalIds.includes(current.id) || phase.recommendedAbilities.some(ability => allAbilities(current).some(a => fuzzy(a, ability))))
      .map(phase => ({ boss, phase })));
    const missions = project.missions.filter(mission => !mission.archived && (mission.worldId === current.worldId || mission.areaIds.includes(current.unlockAreaId)));
    const npcs = project.npcs.filter(npc => !npc.archived && npc.rescueAreaId === current.unlockAreaId);
    const regionalItems = project.items.filter(item => !item.archived && (item.worldId === current.worldId || item.id === world?.regionalItemId));
    const liveEnemies = project.enemies.filter(e => !e.archived);
    const vulnerable = current.canAttack ? liveEnemies.filter(e => matchesAny(current.attackTags, e.weaknesses)) : [];
    const unaffected = current.canAttack ? liveEnemies.filter(e => matchesAny(current.attackTags, e.immunities)) : [];
    const normalEnemies = current.canAttack ? liveEnemies.filter(e => !vulnerable.includes(e) && !unaffected.includes(e) && e.weaknesses.length === 0 && e.immunities.length === 0) : [];
    const patchAnimal=(data:Partial<AnimalDef>)=>mutate(d=>{const target=d.animals.find(a=>a.id===current.id);if(target)Object.assign(target,data)},false,`animal:${current.id}`);

    return <div style={{'--world': world?.theme.primary ?? 'var(--accent)'} as React.CSSProperties}>
      <div className="animal-profile-head">
        <div className="animal-profile-art">
          {current.conceptArt ? <img src={mediaDisplayUrl(current.conceptArt)} alt={`Arte de ${current.name}`}/> : <PawPrint/>}
          <label className="animal-art-upload" title="Adicionar ou trocar arte conceitual"><ImagePlus/><input type="file" accept="image/*" onChange={async e => {const file=e.target.files?.[0];if(!file)return;const saved=await persistMediaFile(file,`animals/${current.id}`);mutate(d=>{const target=d.animals.find(a=>a.id===current.id);if(target)target.conceptArt=saved;});}}/></label>
        </div>
        <div><p className="eyebrow">{world?.name}</p><h1>{current.name}</h1><div className="chips">{current.categories.map(cat => <span key={cat}>{cat}</span>)}</div><p className="muted">Desbloqueado em <Link to={`/area/${unlockArea?.id}`}>{unlockArea?.name ?? 'área não definida'}</Link>.</p></div>
      </div>

      <div className="animal-overview-grid">
        <Card><SectionTitle>Habilidade e interações</SectionTitle><p><strong>Principal:</strong> {current.primaryAbility ?? current.abilities[0] ?? 'A definir'}</p><ul className="clean-list">{(current.contextualInteractions ?? current.abilities.slice(1)).map(ability => <li key={ability}><Sparkles/>{ability}</li>)}</ul>{current.secondaryTags?.length ? <div className="chips">{current.secondaryTags.map(tag=><span key={tag}>{tag}</span>)}</div> : null}</Card>
        <Card><SectionTitle>Uso no level design</SectionTitle><ul>{current.puzzleUses.map(use => <li key={use}>{use}</li>)}</ul>{current.weaknesses.length > 0 && <p className="muted"><strong>Limitações:</strong> {current.weaknesses.join(', ')}</p>}</Card>
      </div>

      <Card className="animal-water-card"><SectionTitle action={<HelpTip topic="animais-agua"/>}>Movimento na água e segurança</SectionTitle>
        <div className="form-grid three"><Field label="Natação na superfície"><select value={current.surfaceSwim?'sim':'nao'} onChange={e=>patchAnimal({surfaceSwim:e.target.value==='sim'})}><option value="sim">Sabe nadar na superfície</option><option value="nao">Não sabe nadar</option></select></Field><Field label="Mergulho para animal terrestre"><select value={current.canDiveAsLand?'sim':'nao'} onChange={e=>patchAnimal({canDiveAsLand:e.target.value==='sim'})}><option value="sim">Pode mergulhar com oxigênio</option><option value="nao">Só superfície / não mergulha</option></select></Field><Field label="Comportamento sem natação"><select value={current.sinksIfCannotSwim?'afunda':'flutua'} onChange={e=>patchAnimal({sinksIfCannotSwim:e.target.value==='afunda'})}><option value="flutua">Flutua na superfície</option><option value="afunda">Afunda e retorna ao checkpoint</option></select></Field></div>
        <div className="form-grid three"><Field label="Oxigênio submerso (segundos)" hint="Usado por animais terrestres que podem mergulhar. Zero ou vazio significa sem mergulho limitado configurado."><input type="number" min="0" step="0.5" value={current.oxygenSeconds??0} onChange={e=>patchAnimal({oxygenSeconds:Number(e.target.value)})}/></Field><Field label="Curva ao mudar direção"><select value={current.underwaterTurnStyle??'direto'} onChange={e=>patchAnimal({underwaterTurnStyle:e.target.value as NonNullable<AnimalDef['underwaterTurnStyle']>})}><option value="direto">Direta</option><option value="arco_curto">Arco curto</option><option value="arco_longo">Arco longo</option></select></Field><Field label="Avisar no tutorial que não sabe nadar"><select value={current.tutorialWarnCannotSwim?'sim':'nao'} onChange={e=>patchAnimal({tutorialWarnCannotSwim:e.target.value==='sim'})}><option value="sim">Sim</option><option value="nao">Não</option></select></Field></div>
        <Field label="Notas de movimento aquático"><textarea value={current.swimNotes??''} onChange={e=>patchAnimal({swimNotes:e.target.value})}/></Field>
        {!current.surfaceSwim&&current.sinksIfCannotSwim&&!current.tutorialWarnCannotSwim&&<p className="warning-callout">Este animal afunda, mas o tutorial ainda não avisa o jogador. Configure a mensagem para evitar frustração.</p>}
        {current.isIrisBase&&<p className="info-callout"><strong>Íris Base é protegida.</strong> Ela só anda e pula de forma lenta e suave, não pode ser removida do projeto e torna-se a forma de emergência quando nenhuma transformação animal está disponível.</p>}
      </Card>

      <SectionTitle>Relações no projeto</SectionTitle>
      <div className="relation-grid">
        <RelationCard icon={<Puzzle/>} title="Mecânicas e hazards" empty="Nenhuma relação calculada.">{relevantMechanics.map(mechanic => <Link to="/mechanics" key={mechanic.id}><span>{mechanic.icon}</span><div><strong>{mechanic.name}</strong><small>{mechanic.kind} · {mechanic.source}</small></div></Link>)}</RelationCard>
        <RelationCard icon={<MapPinned/>} title="Áreas que aproveitam essas habilidades" empty="Nenhuma área usa essas mecânicas como centrais.">{relatedAreas.map(area => <Link to={`/area/${area.id}`} key={area.id} style={{borderLeftColor: project.worlds.find(w=>w.id===area.worldId)?.theme.primary}}><MapPinned/><div><strong>{area.name}</strong><small>{project.worlds.find(w=>w.id===area.worldId)?.name}</small></div></Link>)}</RelationCard>
        <RelationCard icon={<Target/>} title="Provações de Gaia" empty="Ainda não foi recomendado em Provações de Gaia.">{challenges.map(challenge => <Link to={`/area/${challenge.areaId}`} key={challenge.id}><Target/><div><strong>{challenge.name}</strong><small>{project.areas.find(a=>a.id===challenge.areaId)?.name}</small></div></Link>)}</RelationCard>
        <RelationCard icon={<Crown/>} title="Fases de bosses" empty="Ainda não foi recomendado em nenhuma fase.">{bossPhases.map(({boss,phase}) => <Link to={`/world/${boss.worldId}`} key={phase.id}><Crown/><div><strong>{boss.name}</strong><small>{phase.title}</small></div></Link>)}</RelationCard>
        <RelationCard icon={<Gem/>} title="Itens e recursos do mundo" empty="Nenhum item relacionado.">{regionalItems.map(item => <Link to="/items" key={item.id}><Gem/><div><strong>{item.name}</strong><small>{item.description}</small></div></Link>)}</RelationCard>
        <RelationCard icon={<UsersRound/>} title="NPCs resgatados na área de desbloqueio" empty="Nenhum NPC relacionado por enquanto.">{npcs.map(npc => <Link to="/npcs" key={npc.id}><UsersRound/><div><strong>{npc.name}</strong><small>{npc.npcType}</small></div></Link>)}</RelationCard>
        <RelationCard icon={<Sparkles/>} title="Missões do mundo ou da área" empty="Nenhuma missão relacionada.">{missions.slice(0,12).map(mission => <Link to="/missions" key={mission.id}><Sparkles/><div><strong>{mission.name}</strong><small>{mission.type} · {mission.tasks.length} tarefas</small></div></Link>)}</RelationCard>
      </div>

      <EntityTools entityRef={{type:'animal',id:current.id}} showDelete={false}/>

      {current.canAttack ? <>
        <SectionTitle>Relações com inimigos</SectionTitle>
        <div className="enemy-relation-grid">
          <EnemyRelation icon={<Target/>} title="Vulneráveis às habilidades deste animal" enemies={vulnerable}/>
          <EnemyRelation icon={<ShieldOff/>} title="Não são afetados" enemies={unaffected}/>
          <EnemyRelation icon={<Bot/>} title="Dano normal" enemies={normalEnemies}/>
        </div>
      </> : <Card className="non-combat-note"><PawPrint/><div><strong>Animal sem ataque</strong><p>As relações de dano não aparecem porque esta transformação foi planejada para exploração, mobilidade ou puzzle.</p></div></Card>}
    </div>;
  }
}

function RelationCard({icon,title,empty,children}:{icon:React.ReactNode;title:string;empty:string;children:React.ReactNode}) {
  const count = Array.isArray(children) ? children.length : 1;
  return <Card className="relation-card"><SectionTitle action={icon}>{title}</SectionTitle><div className="relation-list">{count ? children : <p className="muted">{empty}</p>}</div></Card>;
}

function EnemyRelation({icon,title,enemies}:{icon:React.ReactNode;title:string;enemies:EnemyDef[]}) {
  return <Card><SectionTitle action={icon}>{title}</SectionTitle>{enemies.length ? <div className="enemy-chip-grid">{enemies.map(enemy => <Link to="/enemies" key={enemy.id}><span>{enemy.icon}</span>{enemy.name}</Link>)}</div> : <p className="muted">Nenhum inimigo relacionado.</p>}</Card>;
}

function matchesAny(attacks:string[], values:string[]) { return attacks.some(a => values.some(v => fuzzy(a,v))); }
function fuzzy(a:string,b:string) { const x=normal(a),y=normal(b); return x.includes(y)||y.includes(x); }
function same(a:string,b:string) { return normal(a)===normal(b); }
function normal(value:string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }

function allAbilities(animal: AnimalDef): string[] { return [animal.primaryAbility ?? animal.abilities[0] ?? '', ...(animal.contextualInteractions ?? animal.abilities.slice(1))].filter(Boolean); }
