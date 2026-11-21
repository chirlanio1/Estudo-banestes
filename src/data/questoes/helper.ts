import type { Questao, Verificacao } from '../../types';

const LETRA: Record<string, 0 | 1 | 2 | 3 | 4> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

/** Atalho para declarar questões do banco do app (autoria IA no estilo FCC, revisadas). */
export function Q(
  id: string,
  topico: string,
  dif: 1 | 2 | 3,
  verificacao: Verificacao,
  enunciado: string,
  alternativas: [string, string, string, string, string],
  correta: 'A' | 'B' | 'C' | 'D' | 'E',
  explicacao: string,
  extra: { codigo?: string; fonte?: string } = {}
): Questao {
  const orig = LETRA[correta];
  const alvo = hash(id) % 5;
  const alts = [...alternativas] as typeof alternativas;
  let exp = explicacao;
  if (alvo !== orig) {
    // Troca a correta de posição para equilibrar o gabarito (A–E) e ajusta os rótulos "X:" do início das linhas da explicação.
    [alts[orig], alts[alvo]] = [alts[alvo], alts[orig]];
    const lo = 'ABCDE'[orig], la = 'ABCDE'[alvo];
    exp = explicacao.replace(/(^|\n)([A-E]):/g, (m, ini: string, l: string) => (l === lo ? ini + la + ':' : l === la ? ini + lo + ':' : m));
  }
  return { id, topico, dif, verificacao, enunciado, alternativas: alts, correta: alvo as 0 | 1 | 2 | 3 | 4, explicacao: exp, origem: 'app', ...extra };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
