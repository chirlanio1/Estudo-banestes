import { db, getConfig } from './db';
import { BANCO_BASE } from './data/questoes';
import { KITS } from './data/kits';
import { TOPICO_PARA_BLOCO, BLOCO_POR_ID } from './data/edital';
import type { Attempt, CausaErro, Config, Flashcard, Mastery, QState, Questao, Sessao } from './types';
import { atualizar, bInicial, thetaEfetivo, thetaInicial } from './engine/mastery';
import { novoCartao, notaDaQuestao, revisar, type Nota } from './engine/srs';
import { calcularPrioridades, type PrioridadeTopico } from './engine/priority';
import { PONTOS } from './engine/gamification';
import { semanaDe, hojeISO } from './engine/scoring';
import { diasEstudados } from './engine/behavior';

// ---------- Banco de questões ----------

let cacheBanco: Questao[] | null = null;

export async function banco(): Promise<Questao[]> {
  if (cacheBanco) return cacheBanco;
  const extra = await db.questoesExtra.toArray();
  cacheBanco = [...BANCO_BASE, ...extra];
  return cacheBanco;
}

export function invalidarBanco() {
  cacheBanco = null;
}

export async function questaoPorId(id: string): Promise<Questao | undefined> {
  return (await banco()).find((q) => q.id === id);
}

// ---------- Contexto do modelo ----------

export interface Contexto {
  cfg: Config;
  mastery: Map<string, Mastery>;
  qstate: Map<string, QState>;
  prios: PrioridadeTopico[];
  thetaDe: (t: string) => number;
  banco: Questao[];
}

export async function contexto(): Promise<Contexto> {
  const [cfg, ms, qs, bq] = await Promise.all([getConfig(), db.mastery.toArray(), db.qstate.toArray(), banco()]);
  const mastery = new Map(ms.map((m) => [m.topico, m]));
  const qstate = new Map(qs.map((q) => [q.qid, q]));
  const agora = Date.now();
  const ultimaPraticaBloco = new Map<string, number>();
  for (const m of ms) {
    const b = TOPICO_PARA_BLOCO[m.topico];
    if (b && m.last > (ultimaPraticaBloco.get(b) ?? 0)) ultimaPraticaBloco.set(b, m.last);
  }
  const questoesDisponiveis = new Map<string, number>();
  for (const q of bq) questoesDisponiveis.set(q.topico, (questoesDisponiveis.get(q.topico) ?? 0) + 1);
  const qb = (await db.kv.get('questoesBloco'))?.v as Record<string, number> | undefined;
  const prios = calcularPrioridades({
    mastery, autoavaliacao: cfg.autoavaliacao, agora, semana: Math.max(1, semanaDe(new Date())), ultimaPraticaBloco, questoesDisponiveis, questoesBloco: qb
  });
  const thetaDe = (t: string) => {
    const b = TOPICO_PARA_BLOCO[t];
    const t0 = thetaInicial(cfg.autoavaliacao[b]);
    const m = mastery.get(t);
    return m ? thetaEfetivo(m.theta, t0, m.last, agora) : t0;
  };
  return { cfg, mastery, qstate, prios, thetaDe, banco: bq };
}

// ---------- Respostas ----------

export interface RespostaInput {
  q: Questao;
  escolha: number;
  chute: boolean;
  ms: number;
  sessao: string;
  pos: number;
  minutoSessao: number;
  modo: Attempt['modo'];
}

export async function registrarResposta(r: RespostaInput): Promise<{ attemptId: number; correta: boolean; pAntes: number }> {
  const cfg = await getConfig();
  const correta = r.escolha === r.q.correta;
  const y: 0 | 1 = correta && !r.chute ? 1 : 0;
  const agora = Date.now();
  const bloco = TOPICO_PARA_BLOCO[r.q.topico] ?? 'outros';
  const t0 = thetaInicial(cfg.autoavaliacao[bloco]);
  let pAntes = 0;
  await db.transaction('rw', db.attempts, db.qstate, db.mastery, async () => {
    const m = (await db.mastery.get(r.q.topico)) ?? { topico: r.q.topico, theta: t0, n: 0, acertos: 0, last: 0 };
    const st = (await db.qstate.get(r.q.id)) ?? { qid: r.q.id, b: bInicial(r.q.dif), vistas: 0, acertos: 0, card: novoCartao(new Date(agora)) };
    const th = thetaEfetivo(m.theta, t0, m.last, agora);
    const up = atualizar(th, m.n, st.b, st.vistas, y);
    pAntes = up.p;
    const nota: Nota = notaDaQuestao(correta, r.chute, r.ms, st.acertos);
    const card = revisar(st.card, nota, new Date(agora), cfg.retencao);
    await db.qstate.put({ ...st, b: up.b, vistas: st.vistas + 1, acertos: st.acertos + y, card });
    await db.mastery.put({ ...m, theta: up.theta, n: m.n + 1, acertos: m.acertos + y, last: agora });
  });
  const attemptId = await db.attempts.add({
    qid: r.q.id, topico: r.q.topico, bloco, ts: agora, correta, chute: r.chute, escolha: r.escolha, ms: r.ms,
    sessao: r.sessao, pos: r.pos, minutoSessao: r.minutoSessao, modo: r.modo, origem: r.q.origem,
    causa: r.chute && correta ? 'chute' : undefined
  });
  return { attemptId, correta, pAntes };
}

export interface Remedio {
  titulo: string;
  texto: string;
  acao?: 'teoria' | 'cartao' | 'similar' | 'leitura';
}

export const CAUSAS: { id: CausaErro; rotulo: string; dica: string }[] = [
  { id: 'nao-sabia', rotulo: 'Não sabia', dica: 'O conteúdo era novo para mim' },
  { id: 'confundi', rotulo: 'Confundi', dica: 'Sabia, mas troquei conceitos parecidos' },
  { id: 'pegadinha', rotulo: 'Caí na pegadinha', dica: 'Palavra trocada, exceção, versão da norma' },
  { id: 'atencao', rotulo: 'Falta de atenção', dica: 'Li errado, pulei o EXCETO, marquei rápido' },
  { id: 'tempo', rotulo: 'Faltou tempo', dica: 'Chutei porque o tempo acabou' }
];

/** Liga a causa do erro a um remédio concreto (desenho do produto: "Depois do simulado"). */
export async function classificarErro(attemptId: number, causa: CausaErro, q: Questao): Promise<Remedio> {
  await db.attempts.update(attemptId, { causa });
  const agora = Date.now();
  await db.eventos.add({ ts: agora, tipo: 'erro-capturado', pontos: PONTOS.erroCapturado, detalhe: q.id });
  switch (causa) {
    case 'nao-sabia': {
      const m = await db.mastery.get(q.topico);
      if (m) await db.mastery.update(q.topico, { precisaTeoria: true });
      await criarCartaoDeErro(q);
      return { titulo: 'Remédio: teoria mínima', texto: 'O tópico volta para a teoria na próxima missão, e um cartão com a regra certa entrou na revisão.', acao: 'teoria' };
    }
    case 'confundi':
      await criarCartaoDeErro(q);
      return { titulo: 'Remédio: cartão de contraste', texto: 'Criei um cartão com a diferença entre o que você marcou e o certo. Ele entra hoje na revisão espaçada.', acao: 'cartao' };
    case 'pegadinha':
      await db.pegadinhas.add({ qid: q.id, topico: q.topico, texto: q.explicacao, ts: agora });
      await adiantarTopico(q.topico);
      return { titulo: 'Remédio: caderno de pegadinhas', texto: 'A questão foi para o caderno de pegadinhas FCC (releia na véspera dos simulados), e uma questão parecida vem logo.', acao: 'similar' };
    case 'atencao':
      return { titulo: 'Remédio: regra de leitura', texto: 'Antes de marcar: circule EXCETO, INCORRETO, APENAS e SEMPRE no enunciado e leia todas as alternativas. A questão volta amanhã.', acao: 'leitura' };
    case 'tempo':
      return { titulo: 'Remédio: ordem de ataque', texto: 'Use a regra dos 4 minutos: passou disso sem chegar a duas alternativas, marque e siga. Treine os blocos de sábado a 2,5 min por questão.', acao: 'leitura' };
    default:
      return { titulo: 'Registrado', texto: 'Erro registrado.' };
  }
}

async function adiantarTopico(topico: string) {
  // faz uma questão inédita do tópico ficar "vencida" para aparecer logo
  const bq = await banco();
  const cands = bq.filter((x) => x.topico === topico);
  for (const c of cands) {
    const st = await db.qstate.get(c.id);
    if (!st) {
      await db.qstate.put({ qid: c.id, b: bInicial(c.dif), vistas: 0, acertos: 0, card: novoCartao(new Date(Date.now() - 1000)) });
      break;
    }
  }
}

async function criarCartaoDeErro(q: Questao) {
  const existe = await db.cards.where('qid').equals(q.id).count();
  if (existe) return;
  const enun = q.enunciado.length > 260 ? q.enunciado.slice(0, 257) + '…' : q.enunciado;
  await db.cards.add({
    frente: enun + (q.codigo ? '\n\n' + q.codigo : '') + '\n\nQual é a resposta e por quê?',
    verso: '✔ ' + q.alternativas[q.correta] + '\n\n' + q.explicacao,
    topico: q.topico, fonte: 'erro', criado: Date.now(), introduzido: true, card: novoCartao(), qid: q.id
  });
}

// ---------- Cartões (flashcards) ----------

export async function semearCartoesDoKit(topico: string) {
  const kit = KITS[topico];
  if (!kit) return 0;
  const ja = await db.cards.where('topico').equals(topico).filter((c) => c.fonte === 'kit').count();
  if (ja) return 0;
  const agora = Date.now();
  await db.cards.bulkAdd(
    kit.cartoes.map((c) => ({ frente: c.f, verso: c.v, topico, fonte: 'kit' as const, criado: agora, introduzido: false, card: novoCartao() }))
  );
  return kit.cartoes.length;
}

export async function filaDeCartoes(): Promise<Flashcard[]> {
  const cfg = await getConfig();
  const agora = Date.now();
  const vencidos = await db.cards.filter((c) => c.introduzido && c.card.due <= agora).toArray();
  const hoje = hojeISO();
  const novosHoje = ((await db.kv.get('novos-' + hoje))?.v as number) ?? 0;
  // regra anti-bola-de-neve: se a fila vencida passar de 60 cartões, nenhum cartão novo hoje
  const limite = vencidos.length > 60 ? 0 : Math.max(0, cfg.novosPorDia - novosHoje);
  const novos = limite ? await db.cards.filter((c) => !c.introduzido).limit(limite).toArray() : [];
  return [...vencidos.sort((a, b) => a.card.due - b.card.due), ...novos];
}

export async function contarCartoesHoje(): Promise<{ vencidos: number; novos: number }> {
  const fila = await filaDeCartoes();
  return { vencidos: fila.filter((c) => c.introduzido).length, novos: fila.filter((c) => !c.introduzido).length };
}

export async function revisarCartao(c: Flashcard, nota: Nota, ms: number) {
  const cfg = await getConfig();
  const card = revisar(c.card, nota, new Date(), cfg.retencao);
  if (!c.introduzido) {
    const k = 'novos-' + hojeISO();
    const v = ((await db.kv.get(k))?.v as number) ?? 0;
    await db.kv.put({ k, v: v + 1 });
  }
  await db.cards.update(c.id!, { card, introduzido: true });
  await db.revisoes.add({ cardId: c.id!, ts: Date.now(), nota, ms });
}

// ---------- Sessões e pontos ----------

export function novoIdSessao() {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function iniciarSessao(tipo: Sessao['tipo'], topico?: string): Promise<Sessao> {
  const s: Sessao = { id: novoIdSessao(), inicio: Date.now(), tipo, topico, concluida: false };
  await db.sessoes.put(s);
  return s;
}

export async function concluirSessao(id: string, pontosTipo?: keyof typeof PONTOS) {
  const s = await db.sessoes.get(id);
  if (!s) return;
  const fim = Date.now();
  await db.sessoes.put({ ...s, fim, concluida: true, minutos: Math.round((fim - s.inicio) / 60000) });
  if (pontosTipo) await db.eventos.add({ ts: fim, tipo: pontosTipo, pontos: PONTOS[pontosTipo], detalhe: s.topico });
}

export async function pontosTotais(): Promise<number> {
  const evs = await db.eventos.toArray();
  return evs.reduce((a, e) => a + e.pontos, 0);
}

/** Dias cumpridos: sessão concluída (inclui a missão mínima e o "hoje estou esgotado"). */
export async function diasCumpridos(): Promise<Set<string>> {
  const ss = await db.sessoes.filter((s) => s.concluida).toArray();
  return diasEstudados(ss.map((s) => s.inicio));
}

export async function marcarTeoriaVista(topico: string) {
  const m = await db.mastery.get(topico);
  const cfg = await getConfig();
  const b = TOPICO_PARA_BLOCO[topico];
  const base: Mastery = m ?? { topico, theta: thetaInicial(cfg.autoavaliacao[b]), n: 0, acertos: 0, last: 0 };
  await db.mastery.put({ ...base, precisaTeoria: false, teoriaVista: Date.now() });
  await semearCartoesDoKit(topico);
}

export function nomeBloco(id: string) {
  return BLOCO_POR_ID[id]?.curto ?? id;
}
