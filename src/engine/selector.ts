import type { Questao, QState } from '../types';
import { bInicial, pAcerto } from './mastery';

export interface CandidatoCtx {
  qstate: Map<string, QState>;
  thetaDe: (topico: string) => number;
  agora: number;
  excluir?: Set<string>;
  rnd?: () => number;
}

/**
 * Escolhe questões de um conjunto de tópicos:
 * 1) questões vencidas na revisão espaçada (erradas voltam antes de serem esquecidas);
 * 2) inéditas com dificuldade próxima do seu nível (alvo ≈ 70% de chance de acerto — "dificuldade desejável");
 * 3) já vistas e não vencidas, só se faltar questão.
 */
export function escolherQuestoes(banco: Questao[], topicos: string[], n: number, ctx: CandidatoCtx): Questao[] {
  const rnd = ctx.rnd ?? Math.random;
  const set = new Set(topicos);
  const cands = banco.filter((q) => set.has(q.topico) && !ctx.excluir?.has(q.id));
  const pontuadas = cands.map((q) => {
    const st = ctx.qstate.get(q.id);
    const b = st?.b ?? bInicial(q.dif);
    const p = pAcerto(ctx.thetaDe(q.topico), b);
    let score: number;
    if (st && st.vistas > 0) {
      const vencida = st.card.due <= ctx.agora;
      score = vencida ? 3 + Math.min(1, (ctx.agora - st.card.due) / (7 * 86400000)) : 0.2 - st.vistas * 0.05;
    } else {
      score = 2 - Math.abs(p - 0.7) * 2;
    }
    return { q, score: score + rnd() * 0.35 };
  });
  pontuadas.sort((a, b) => b.score - a.score);
  // distribui entre os tópicos (round-robin) para intercalar
  const porTopico = new Map<string, Questao[]>();
  for (const { q } of pontuadas) {
    const l = porTopico.get(q.topico) ?? [];
    l.push(q);
    porTopico.set(q.topico, l);
  }
  const ordem = topicos.filter((t) => porTopico.has(t));
  const out: Questao[] = [];
  let i = 0;
  while (out.length < n && ordem.some((t) => (porTopico.get(t)?.length ?? 0) > 0)) {
    const t = ordem[i % ordem.length];
    const l = porTopico.get(t)!;
    if (l.length) out.push(l.shift()!);
    i++;
  }
  return out;
}

export function embaralhar<T>(xs: T[], rnd = Math.random): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
