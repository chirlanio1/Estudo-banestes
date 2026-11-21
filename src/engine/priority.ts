import { BLOCOS, valorQuestao, FOCO_SEMANA } from '../data/edital';
import type { Mastery } from '../types';
import { dominio, incerteza, thetaEfetivo, thetaInicial } from './mastery';

export interface PrioridadeTopico {
  topico: string;
  bloco: string;
  dominio: number; // chance estimada de acerto hoje
  n: number;
  prioridade: number;
  pontosRecuperar: number; // questões × (1 − domínio) × valor na nota
  motivo: string[];
  manutencao: boolean;
}

export interface ContextoPrioridade {
  mastery: Map<string, Mastery>;
  autoavaliacao: Record<string, number>;
  agora: number;
  semana: number;
  ultimaPraticaBloco: Map<string, number>;
  questoesDisponiveis: Map<string, number>;
  /** Override do número estimado de questões por bloco (após contagem real). */
  questoesBloco?: Record<string, number>;
}

/**
 * Camada 1 do algoritmo (lacunas): prioridade = valor da questão × questões do tópico × (1 − domínio)
 * × urgência × (1 + exploração) × foco da semana × rotação × teoria pendente.
 * Reproduz a fórmula Peso × Frequência × (1 − Acerto) × Urgência do desenho do produto,
 * com o acerto substituído pelo domínio estimado pelo modelo (que já desconta o acaso e o esquecimento).
 */
export function calcularPrioridades(ctx: ContextoPrioridade): PrioridadeTopico[] {
  const out: PrioridadeTopico[] = [];
  const semanasRestantes = Math.max(0, 13 - ctx.semana);
  const foco = FOCO_SEMANA[ctx.semana]?.blocos ?? [];
  for (const b of BLOCOS) {
    const qBloco = ctx.questoesBloco?.[b.id] ?? b.questoes;
    // Questões esperadas por subtópico, amortecidas pela raiz: blocos com poucos subtópicos (Nuvem, Inglês)
    // não passam à frente de blocos grandes e pesados (Programação, Banco de Dados) só por terem a cota concentrada.
    const share = qBloco / Math.sqrt(b.subtopicos.length);
    const valor = valorQuestao(b.prova);
    const theta0 = thetaInicial(ctx.autoavaliacao[b.id]);
    for (const s of b.subtopicos) {
      const m = ctx.mastery.get(s.id);
      const n = m?.n ?? 0;
      const th = m ? thetaEfetivo(m.theta, theta0, m.last, ctx.agora) : theta0;
      const dom = dominio(th);
      const motivo: string[] = [];
      let urg = 1;
      if (n === 0 && semanasRestantes < 6) {
        urg = 1.5;
        motivo.push('ainda não visto e a prova está perto');
      }
      const explorar = 1 + 0.5 * incerteza(n);
      let focoF = 1;
      if (foco.includes(b.id)) {
        focoF = 1.35;
        motivo.push('foco da semana');
      }
      let rot = 1;
      const ult = ctx.ultimaPraticaBloco.get(b.id);
      if (ult && ctx.agora - ult > 7 * 86400000) {
        rot = 1.3;
        motivo.push('bloco há mais de 7 dias sem prática');
      }
      const teoria = m?.precisaTeoria ? 1.2 : 1;
      if (m?.precisaTeoria) motivo.push('erros por "não sabia": volta à teoria');
      const manutencao = n >= 20 && dom >= 0.8;
      const manut = manutencao ? 0.4 : 1;
      if (manutencao) motivo.push('domínio alto: só manutenção');
      const disponiveis = ctx.questoesDisponiveis.get(s.id) ?? 0;
      const semQuestoes = disponiveis === 0 ? 0.05 : 1;
      const pontos = share * (1 - dom) * valor;
      const prioridade = pontos * urg * explorar * focoF * rot * teoria * manut * semQuestoes;
      if (!motivo.length) motivo.push(dom < 0.5 ? 'domínio ainda baixo' : 'peso na prova');
      out.push({ topico: s.id, bloco: b.id, dominio: dom, n, prioridade, pontosRecuperar: pontos, motivo, manutencao });
    }
  }
  return out.sort((a, b) => b.prioridade - a.prioridade);
}

/** Domínio agregado por bloco (média ponderada pelos subtópicos). */
export function dominioPorBloco(prios: PrioridadeTopico[]) {
  const map = new Map<string, { soma: number; k: number; n: number; pontos: number }>();
  for (const p of prios) {
    const x = map.get(p.bloco) ?? { soma: 0, k: 0, n: 0, pontos: 0 };
    x.soma += p.dominio;
    x.k += 1;
    x.n += p.n;
    x.pontos += p.pontosRecuperar;
    map.set(p.bloco, x);
  }
  return BLOCOS.map((b) => {
    const x = map.get(b.id)!;
    return { bloco: b.id, dominio: x.soma / x.k, respostas: x.n, pontosRecuperar: x.pontos };
  });
}

/** Sorteio ponderado (softmax sobre a prioridade) — gera intercalação sem perder o foco nos pontos fracos. */
export function sortearTopicos(prios: PrioridadeTopico[], k: number, temperatura = 0.6, rnd = Math.random): string[] {
  const pool = prios.filter((p) => p.prioridade > 0).slice(0, 25);
  const escolhidos: string[] = [];
  const max = Math.max(...pool.map((p) => p.prioridade), 1e-9);
  while (escolhidos.length < k && pool.length) {
    const pesos = pool.map((p) => Math.exp(Math.log(p.prioridade / max + 1e-9) / temperatura));
    const total = pesos.reduce((a, b) => a + b, 0);
    let r = rnd() * total;
    let i = 0;
    for (; i < pesos.length - 1; i++) {
      r -= pesos[i];
      if (r <= 0) break;
    }
    escolhidos.push(pool[i].topico);
    pool.splice(i, 1);
  }
  return escolhidos;
}
