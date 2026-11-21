import { DATAS } from '../data/edital';

/** Nota ponderada pela fórmula do edital (item 11.2): CG = acertos G ÷ 3; CE = acertos E ÷ 5; NP = (CG + 2·CE) ÷ 3. */
export function notaPonderada(acertosGerais: number, acertosEspecificos: number): number {
  const cg = acertosGerais / 3;
  const ce = acertosEspecificos / 5;
  return (cg + 2 * ce) / 3;
}

export function hojeISO(d = new Date()): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function parseISO(s: string): Date {
  return new Date(s + 'T00:00:00');
}

/** Semana do cronograma: 1 = 23/11 a 29/11/2026 (fórmula do pilar 5). */
export function semanaDe(d: Date | string): number {
  const dt = typeof d === 'string' ? parseISO(d) : d;
  const ini = parseISO(DATAS.inicio);
  return Math.floor((dt.getTime() - ini.getTime()) / (7 * 86400000)) + 1;
}

export function diasAte(iso: string, agora = new Date()): number {
  const alvo = parseISO(iso).getTime();
  const hoje = parseISO(hojeISO(agora)).getTime();
  return Math.round((alvo - hoje) / 86400000);
}

/** Rampa do pilar 5: sobe em linha reta de D (semana 1) até a meta final na semana 12. */
export function metaRampa(semana: number, D: number | undefined, metaFinal: number): number | undefined {
  if (D === undefined || D === null || Number.isNaN(D)) return undefined;
  const final = D > 6.5 ? Math.max(metaFinal, 8) : metaFinal;
  const s = Math.min(12, Math.max(1, semana));
  return D + ((final - D) * (s - 1)) / 11;
}

export type Faixa = 'verde' | 'amarelo' | 'vermelho' | 'neutro';

export function faixaNota(np: number, meta?: number): Faixa {
  if (meta === undefined) return 'neutro';
  if (np >= meta) return 'verde';
  if (np >= meta - 0.5) return 'amarelo';
  return 'vermelho';
}

/** Cortes do painel (sugestão): vermelho < 50%, amarelo 50–69%, verde ≥ 70%. */
export function faixaAcerto(p: number | undefined): Faixa {
  if (p === undefined) return 'neutro';
  if (p >= 0.7) return 'verde';
  if (p >= 0.5) return 'amarelo';
  return 'vermelho';
}

/** Fase da jornada (desenho do produto). */
export function faseDe(semana: number): { n: number; nome: string; intercalar: boolean } {
  if (semana <= 1) return { n: 0, nome: 'Largada', intercalar: false };
  if (semana <= 5) return { n: 1, nome: 'Base', intercalar: false };
  if (semana <= 10) return { n: 2, nome: 'Consolidação', intercalar: true };
  return { n: 3, nome: 'Afiação', intercalar: true };
}
