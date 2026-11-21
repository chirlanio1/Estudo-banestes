import { db } from '../db';
import { contexto, contarCartoesHoje, diasCumpridos } from '../store';
import { KITS } from '../data/kits';
import { DATAS, FOCO_SEMANA, NOME_TOPICO } from '../data/edital';
import { analisar } from './behavior';
import { diasAte, hojeISO, semanaDe } from './scoring';
import type { PrioridadeTopico } from './priority';

export interface Missao {
  tipo: 'pilula' | 'minima' | 'esgotado' | 'simulado';
  topico?: string;
  nomeTopico?: string;
  motivo: string[];
  minutos: number;
  cartoes: { vencidos: number; novos: number };
  extraQuestoes: number; // bateria extra sugerida após a pílula (quando o seu rendimento aguenta)
  avisos: string[];
  ajustes: string[];
  semana: number;
  foco?: string;
}

function isoMenos(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return hojeISO(d);
}

export async function missaoDoDia(): Promise<Missao> {
  const ctx = await contexto();
  const hoje = hojeISO();
  const semana = Math.max(1, semanaDe(new Date()));
  const dia = await db.dias.get(hoje);
  const cumpridos = await diasCumpridos();
  const cartoes = await contarCartoesHoje();
  const attempts = await db.attempts.where('ts').above(Date.now() - 60 * 86400000).toArray();
  const comp = analisar(attempts);
  const avisos: string[] = [];
  const ajustes: string[] = [];

  // Gestão de risco do concurso: prazos do edital
  const dInsc = diasAte(DATAS.inscricaoFim);
  const dBol = diasAte(DATAS.boletoFim);
  const inscrito = (await db.kv.get('inscrito'))?.v === true;
  if (!inscrito && dInsc >= 0) avisos.push(`Inscrição no site da FCC até 11/12/2026 (faltam ${dInsc} dias).`);
  if (!inscrito && dInsc < 0 && dBol >= 0) avisos.push(`Boleto da inscrição vence em 14/12/2026 (faltam ${dBol} dias).`);
  const simHoje = DATAS.simulados.find((s) => s.data === hoje);
  const simAmanha = DATAS.simulados.find((s) => s.data === isoMenos(-1));
  if (simAmanha) avisos.push(`Amanhã: ${simAmanha.nome}. Releia o caderno de pegadinhas hoje e durma cedo.`);

  // Ajustes automáticos (regras se-então do desenho do produto)
  const teveHistorico = cumpridos.size > 0;
  const doisDiasSem = teveHistorico && !cumpridos.has(isoMenos(1)) && !cumpridos.has(isoMenos(2)) && !cumpridos.has(hoje);
  if (comp.quedaFadiga) {
    ajustes.push(`Seu acerto cai cerca de ${Math.round(comp.quedaFadiga.queda * 100)} pontos depois de ${comp.quedaFadiga.aposMin} min de sessão. As missões ficaram mais curtas.`);
  }
  if (comp.melhorPeriodo) ajustes.push(`Seu melhor horário até agora: ${comp.melhorPeriodo.toLowerCase()}.`);

  const fase = FOCO_SEMANA[semana];
  const base = {
    cartoes, avisos, ajustes, semana, foco: fase?.foco,
    extraQuestoes: comp.minutosIdeais >= 45 ? 8 : 0
  };

  if (simHoje) {
    return { ...base, tipo: 'simulado', motivo: [`Hoje é dia de ${simHoje.nome}: 80 questões, 4 horas, à caneta se for no papel.`], minutos: 240 };
  }
  if (dia?.esgotado) {
    return { ...base, tipo: 'esgotado', motivo: ['Você marcou que está esgotado. 10 minutos de áudio ou cartões contam como dia cumprido.'], minutos: 10, extraQuestoes: 0 };
  }
  const escolhido = escolherTopicoPilula(ctx.prios);
  if (doisDiasSem) {
    return {
      ...base, tipo: 'minima', topico: escolhido?.topico, nomeTopico: escolhido ? NOME_TOPICO[escolhido.topico] : undefined,
      motivo: ['Dois dias sem estudar: hoje vale a missão mínima de 15 minutos. Recomeçar pequeno é o que mantém a sequência.'],
      minutos: 15, extraQuestoes: 0
    };
  }
  return {
    ...base, tipo: 'pilula', topico: escolhido?.topico, nomeTopico: escolhido ? NOME_TOPICO[escolhido.topico] : undefined,
    motivo: escolhido ? escolhido.motivo : ['Comece pelo diagnóstico do tópico.'],
    minutos: Math.min(25, comp.minutosIdeais) >= 20 ? 25 : 15
  };
}

/** Pílula pede kit de teoria e questões suficientes; a prioridade vem do modelo. */
export function escolherTopicoPilula(prios: PrioridadeTopico[], excluir: string[] = []): PrioridadeTopico | undefined {
  return (
    prios.find((p) => KITS[p.topico] && !excluir.includes(p.topico) && p.prioridade > 0.0005) ??
    prios.find((p) => !excluir.includes(p.topico))
  );
}
