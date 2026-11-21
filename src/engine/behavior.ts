import type { Attempt } from '../types';

/**
 * Análise de comportamento: horário, tempo por questão e queda por cansaço.
 * Tudo calculado com os seus próprios registros; os resultados ajustam o tamanho e o horário das missões.
 */

export interface PerfilComportamento {
  totalRespostas: number;
  porPeriodo: { periodo: string; n: number; acerto: number }[];
  melhorPeriodo?: string;
  porMinuto: { faixa: string; n: number; acerto: number }[];
  minutosIdeais: number; // tamanho de sessão sugerido
  quedaFadiga?: { aposMin: number; queda: number };
  medianaSegundos?: number;
  rapidasErradas: number; // respostas < 25 s erradas (sinal de pressa/atenção)
}

const PERIODOS: { nome: string; de: number; ate: number }[] = [
  { nome: 'Madrugada (0h–6h)', de: 0, ate: 6 },
  { nome: 'Manhã (6h–12h)', de: 6, ate: 12 },
  { nome: 'Tarde (12h–18h)', de: 12, ate: 18 },
  { nome: 'Noite (18h–21h)', de: 18, ate: 21 },
  { nome: 'Fim da noite (21h–24h)', de: 21, ate: 24 }
];

const FAIXAS_MIN = [
  { nome: '0–10 min', de: 0, ate: 10 },
  { nome: '10–20 min', de: 10, ate: 20 },
  { nome: '20–30 min', de: 20, ate: 30 },
  { nome: '30–45 min', de: 30, ate: 45 },
  { nome: '45+ min', de: 45, ate: 999 }
];

function acerto(xs: Attempt[]) {
  if (!xs.length) return 0;
  return xs.filter((a) => a.correta && !a.chute).length / xs.length;
}

export function analisar(attempts: Attempt[], minPorFaixa = 15): PerfilComportamento {
  const validos = attempts.filter((a) => a.modo !== 'simulado');
  const porPeriodo = PERIODOS.map((p) => {
    const xs = validos.filter((a) => {
      const h = new Date(a.ts).getHours();
      return h >= p.de && h < p.ate;
    });
    return { periodo: p.nome, n: xs.length, acerto: acerto(xs) };
  });
  const candidatos = porPeriodo.filter((p) => p.n >= minPorFaixa);
  const melhor = candidatos.sort((a, b) => b.acerto - a.acerto)[0];

  const porMinuto = FAIXAS_MIN.map((f) => {
    const xs = validos.filter((a) => a.minutoSessao >= f.de && a.minutoSessao < f.ate);
    return { faixa: f.nome, n: xs.length, acerto: acerto(xs) };
  });

  // Fadiga: primeira faixa (com dados suficientes) em que o acerto cai ≥ 15 pontos em relação aos primeiros 20 minutos.
  const base = validos.filter((a) => a.minutoSessao < 20);
  let quedaFadiga: PerfilComportamento['quedaFadiga'];
  let minutosIdeais = 25;
  if (base.length >= minPorFaixa * 2) {
    const accBase = acerto(base);
    for (const f of FAIXAS_MIN.slice(2)) {
      const xs = validos.filter((a) => a.minutoSessao >= f.de && a.minutoSessao < f.ate);
      if (xs.length >= minPorFaixa && accBase - acerto(xs) >= 0.15) {
        quedaFadiga = { aposMin: f.de, queda: accBase - acerto(xs) };
        break;
      }
    }
    // sem queda: sessões podem ir até 45 min (teto do pilar de saúde)
    minutosIdeais = quedaFadiga ? Math.max(15, Math.min(25, quedaFadiga.aposMin)) : 45;
  }

  const tempos = validos.map((a) => a.ms).sort((a, b) => a - b);
  const mediana = tempos.length ? tempos[Math.floor(tempos.length / 2)] / 1000 : undefined;
  const rapidasErradas = validos.filter((a) => a.ms < 25000 && !a.correta).length;

  return {
    totalRespostas: validos.length,
    porPeriodo,
    melhorPeriodo: melhor?.periodo,
    porMinuto,
    minutosIdeais,
    quedaFadiga,
    medianaSegundos: mediana,
    rapidasErradas
  };
}

/** Dias distintos com estudo (yyyy-mm-dd) a partir de timestamps. */
export function diasEstudados(tss: number[]): Set<string> {
  const s = new Set<string>();
  for (const t of tss) {
    const d = new Date(t);
    s.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return s;
}
