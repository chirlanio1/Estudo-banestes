import type { Config } from '../types';

export type Ritmo = NonNullable<Config['ritmo']>;

/** Carga de cada missão conforme o ritmo escolhido em Configurações. */
export const RITMOS: Record<Ritmo, { rotulo: string; descricao: string; minutos: number; questoes: number; pre: number; minima: number; novos: number; extra: number }> = {
  leve: { rotulo: 'Leve', descricao: 'Semana puxada no trabalho: missão curta, menos cartões novos.', minutos: 15, questoes: 4, pre: 2, minima: 3, novos: 6, extra: 5 },
  normal: { rotulo: 'Normal', descricao: 'O plano padrão: pílula de 25 minutos.', minutos: 25, questoes: 7, pre: 3, minima: 5, novos: 10, extra: 8 },
  intenso: { rotulo: 'Intenso', descricao: 'Tenho mais tempo: missão maior e mais cartões novos por dia.', minutos: 40, questoes: 12, pre: 3, minima: 7, novos: 15, extra: 12 }
};

export function ritmoDe(cfg: Pick<Config, 'ritmo'>) {
  return RITMOS[cfg.ritmo ?? 'normal'];
}
