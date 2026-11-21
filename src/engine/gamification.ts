/** Gamificação de baixa ansiedade: premia constância e esforço, nunca a nota (desenho do produto). */

export const PONTOS = {
  minima: 5,
  pilula: 10,
  erroCapturado: 1,
  revisaoZerada: 5,
  simulado: 50,
  esgotado: 5
};

export const NIVEIS = [
  { nome: 'Recruta', min: 0 },
  { nome: 'Analista Júnior', min: 150 },
  { nome: 'Analista Pleno', min: 450 },
  { nome: 'Analista Sênior', min: 900 },
  { nome: 'Aprovado', min: 1500 }
];

export function nivelDe(pontos: number) {
  let i = 0;
  for (let k = 0; k < NIVEIS.length; k++) if (pontos >= NIVEIS[k].min) i = k;
  const prox = NIVEIS[i + 1];
  return {
    nome: NIVEIS[i].nome,
    indice: i,
    proximo: prox?.nome,
    faltam: prox ? prox.min - pontos : 0,
    progresso: prox ? (pontos - NIVEIS[i].min) / (prox.min - NIVEIS[i].min) : 1
  };
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Sequência com folga: aceita 1 dia sem estudo por semana (seg–dom) sem zerar.
 * Conta para trás a partir de hoje (hoje ainda não estudado não quebra a sequência).
 */
export function sequencia(dias: Set<string>, hoje = new Date()): number {
  let seq = 0;
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (!dias.has(iso(d))) d.setDate(d.getDate() - 1);
  const folgas = new Map<string, number>();
  for (let i = 0; i < 400; i++) {
    const semana = semanaKey(d);
    if (dias.has(iso(d))) {
      seq++;
    } else {
      const usadas = folgas.get(semana) ?? 0;
      if (usadas >= 1) break;
      folgas.set(semana, usadas + 1);
    }
    d.setDate(d.getDate() - 1);
  }
  return seq;
}

function semanaKey(d: Date) {
  const x = new Date(d);
  const dia = (x.getDay() + 6) % 7; // segunda = 0
  x.setDate(x.getDate() - dia);
  return iso(x);
}

/** Os 7 dias da semana atual (segunda a domingo) e se houve estudo. */
export function semanaAtual(dias: Set<string>, hoje = new Date()) {
  const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  seg.setDate(seg.getDate() - ((seg.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(seg);
    d.setDate(seg.getDate() + i);
    return { data: iso(d), feito: dias.has(iso(d)), hoje: iso(d) === iso(hoje), rotulo: 'STQQSSD'[i] };
  });
}
