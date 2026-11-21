import { fsrs, generatorParameters, createEmptyCard, Rating, type Card, type Grade } from 'ts-fsrs';
import type { SerializedCard } from '../types';

/**
 * Revisão espaçada com FSRS (biblioteca ts-fsrs).
 * Retenção desejada: 0,85 nas primeiras semanas e 0,90 a partir de janeiro (pilar "desenho do produto").
 */
export function retencaoPara(data: Date, configurada?: number): number {
  if (configurada && configurada !== 0.85) return configurada;
  return data >= new Date('2027-01-01T00:00:00') ? 0.9 : 0.85;
}

function scheduler(ret: number) {
  return fsrs(generatorParameters({ request_retention: ret, enable_fuzz: true, maximum_interval: 120 }));
}

export function serialize(c: Card): SerializedCard {
  return {
    due: new Date(c.due).getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? new Date(c.last_review).getTime() : undefined
  };
}

export function deserialize(s: SerializedCard): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: 0,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps ?? 0,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    last_review: s.last_review ? new Date(s.last_review) : undefined
  } as Card;
}

export function novoCartao(agora = new Date()): SerializedCard {
  return serialize(createEmptyCard(agora));
}

export type Nota = 1 | 2 | 3 | 4; // Errei | Difícil | Bom | Fácil

export function revisar(s: SerializedCard, nota: Nota, agora = new Date(), retConfig?: number): SerializedCard {
  const f = scheduler(retencaoPara(agora, retConfig));
  const r = f.next(deserialize(s), agora, nota as unknown as Grade);
  return serialize(r.card);
}

/** Prévia dos intervalos para cada botão (para mostrar "10 min", "2 d"...). */
export function previa(s: SerializedCard, agora = new Date(), retConfig?: number): Record<Nota, number> {
  const f = scheduler(retencaoPara(agora, retConfig));
  const c = deserialize(s);
  const out = {} as Record<Nota, number>;
  for (const n of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
    out[n as Nota] = new Date(f.next(c, agora, n as Grade).card.due).getTime() - agora.getTime();
  }
  return out;
}

export function formatarIntervalo(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} d`;
  return `${Math.round(d / 30)} m`;
}

/**
 * Converte o resultado de uma questão em nota FSRS:
 * erro ou chute → Errei; acerto lento → Difícil; acerto no tempo → Bom; acerto rápido de questão já acertada → Fácil.
 */
export function notaDaQuestao(correta: boolean, chute: boolean, ms: number, acertosAntes: number): Nota {
  if (!correta || chute) return 1;
  if (ms > 4 * 60000) return 2;
  if (ms < 60000 && acertosAntes >= 1) return 4;
  return 3;
}
