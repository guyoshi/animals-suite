import { Award, CheckCircle2, Circle, Crown, Sparkles } from 'lucide-react';
import { Card, PageHeader, SectionTitle, StatusBadge } from '../components/Ui';
import { useProjectStore } from '../store/useProjectStore';

export function ProgressPage() {
  const project = useProjectStore(s => s.project);
  const mutate = useProjectStore(s => s.mutate);
  const content = {
    runes: project.maps.flatMap(m=>m.objects).filter(o=>o.resourceType==='rune').length,
    runeTarget: project.areas.reduce((sum,a)=>sum+a.runeTarget,0),
    npcs: project.npcs.filter(n=>!n.archived&&n.countsFor100!==false).length,
    whispers: project.whispers.filter(w=>!w.archived).length,
    ecos: project.areas.filter(a=>a.type==='fase').reduce((sum,a)=>sum+(a.ecoTarget??15),0),
    melodies: project.areas.filter(a=>a.type==='fase').reduce((sum,a)=>sum+(a.melodyTarget??1),0),
    apolo: project.apoloTrials.length,
    missions: project.missions.filter(m=>!m.archived&&m.countsFor100!==false).length,
    animals: project.animals.filter(a=>!a.isSecret).length,
    challenges: project.challenges.filter(c=>!c.archived).length,
  };
  return <div>
    <PageHeader title="Progresso e Emblemas" subtitle="Planejamento do conteúdo que alimenta 100%, Provação de Apolo e o resultado especial de 101%."/>
    <div className="stats-grid">
      <div className="stat-card static"><Sparkles/><div><strong>{content.runes}/{content.runeTarget}</strong><span>Runas criadas / planejadas</span></div></div>
      <div className="stat-card static"><Circle/><div><strong>{content.animals}</strong><span>Animais não-secretos</span></div></div>
      <div className="stat-card static"><CheckCircle2/><div><strong>{content.missions}</strong><span>Missões que contam</span></div></div>
      <div className="stat-card static"><Award/><div><strong>{content.npcs}</strong><span>NPCs que contam</span></div></div>
      <div className="stat-card static"><Sparkles/><div><strong>{content.whispers}</strong><span>Sussurros criados</span></div></div>
      <div className="stat-card static"><Crown/><div><strong>{content.challenges}</strong><span>Provações de Gaia criadas</span></div></div>
    </div>

    <Card><SectionTitle>Regras consolidadas do backup 18/06 att</SectionTitle><div className="completion-rules"><div><strong>100% de cada mundo</strong><p>Resgatar todos os NPCs que contam, recolher as Runas, adquirir todos os Sussurros, concluir missões e desafios opcionais que contam, encontrar as Melodias Selvagens, desbloquear todos os animais não-secretos e derrotar o boss. Ecos Perdidos e Sementes não entram directamente na percentagem.</p><small>Metas de exploração: {content.ecos} Ecos alimentam a compra dos Sussurros, mas não contam directamente; {content.melodies} Melodias entram na conclusão.</small></div><div><strong>Provações de Apolo</strong><p>Uma área extra por mundo, liberada somente após o 100% daquele mundo. Não aumenta o percentual base. Cada área possui seções hardcore e concede uma Runa de Apolo.</p><small>{content.apolo} áreas de Apolo planejadas.</small></div><div><strong>101% — Zeus</strong><p>As seis Runas de Apolo formam o Emblema de Apolo e liberam a aura de fogo. Gaia + Apolo concedem Zeus e 101%. A opção de aura só aparece depois de adquirida e pode ser desativada.</p></div></div></Card>

    <div className="emblem-grid">{project.emblems.map(emblem=>{
      const world=emblem.worldId?project.worlds.find(w=>w.id===emblem.worldId):undefined;
      return <Card key={emblem.id} className="emblem-card"><div className="emblem-title" style={{borderColor:world?.theme.primary}}><Award/><div><strong>{emblem.name}</strong><small>{world?.name??emblem.kind.toUpperCase()}</small></div><StatusBadge status={emblem.status}/></div><p>{emblem.condition}</p><p className="muted"><strong>Recompensa:</strong> {emblem.reward}</p><label className="field"><span>Estado</span><select value={emblem.status} onChange={e=>mutate(d=>{const target=d.emblems.find(x=>x.id===emblem.id);if(target)target.status=e.target.value as typeof emblem.status})}><option value="planejado">Planejado</option><option value="unity">Configurado no Unity</option><option value="erro">Erro no Unity</option></select></label><label className="field"><span>Notas</span><textarea value={emblem.notes} onChange={e=>mutate(d=>{const target=d.emblems.find(x=>x.id===emblem.id);if(target)target.notes=e.target.value})}/></label></Card>})}</div>
  </div>;
}
