import { db, getConfig } from '../db';
import { contexto } from '../store';
import { BLOCOS, FOCO_SEMANA, NOME_TOPICO, BLOCO_POR_ID, DATAS } from '../data/edital';
import { metaRampa, semanaDe, faixaNota, faixaAcerto, hojeISO } from '../engine/scoring';
import { dominioPorBloco } from '../engine/priority';
import { analisar } from '../engine/behavior';
import { useAsync, pct, num, dataBR } from '../lib/hooks';
import type { Attempt } from '../types';

const COR: Record<string, string> = { verde: 'ok', amarelo: 'warn', vermelho: 'bad', neutro: '' };

function inicioSemana(semana: number) {
  const d = new Date(DATAS.inicio + 'T00:00:00');
  d.setDate(d.getDate() + (semana - 1) * 7);
  return d.getTime();
}

export function Painel() {
  const [d] = useAsync(async () => {
    const [cfg, ctx, sims, atts, sessoes, dias, cards, revs] = await Promise.all([
      getConfig(), contexto(), db.simulados.orderBy('data').toArray(), db.attempts.toArray(), db.sessoes.toArray(), db.dias.toArray(), db.cards.toArray(), db.revisoes.toArray()
    ]);
    return { cfg, ctx, sims, atts, sessoes, dias, cards, revs };
  });
  if (!d) return <p className="muted">Calculando…</p>;
  const { cfg, ctx, sims, atts, sessoes, dias, cards, revs } = d;
  const semana = Math.max(1, semanaDe(new Date()));
  const D = cfg.diagnostico;
  const ultimo = sims.filter((s) => s.numero !== 99).slice(-1)[0];
  const metaUlt = ultimo ? metaRampa(semanaDe(ultimo.data), D, cfg.metaFinal) : undefined;

  // KPI 7: cota semanal
  const Q = Math.round((8 * cfg.horasSemana) / 10) * 10;
  const fator = FOCO_SEMANA[semana]?.fator ?? 1;
  const metaSemana = Math.round(Q * fator);
  const ini = inicioSemana(semana);
  const daSemana = atts.filter((a) => a.ts >= ini && a.ts < ini + 7 * 86400000 && a.modo !== 'simulado');
  const cota = metaSemana ? daSemana.length / metaSemana : 0;
  // regra: cota da semana anterior < 60% → reduz 20%
  const anterior = atts.filter((a) => a.ts >= ini - 7 * 86400000 && a.ts < ini && a.modo !== 'simulado').length;
  const metaAnt = Math.round(Q * (FOCO_SEMANA[semana - 1]?.fator ?? 1));
  const reduzir = semana > 1 && metaAnt > 0 && anterior / metaAnt < 0.6;

  // KPI 8: dias cumpridos seg–sáb
  const diasSemana = new Set(sessoes.filter((s) => s.concluida && s.inicio >= ini && s.inicio < ini + 6 * 86400000).map((s) => new Date(s.inicio).toDateString())).size;

  // KPI 2: acerto por bloco (últimas 4 semanas), separado FCC real
  const recentes = atts.filter((a) => a.ts > Date.now() - 28 * 86400000);
  const acertoBloco = (b: string, soFcc: boolean) => {
    const xs = recentes.filter((a) => a.bloco === b && (!soFcc || a.origem === 'fcc'));
    return xs.length ? { p: xs.filter((a) => a.correta && !a.chute).length / xs.length, n: xs.length } : undefined;
  };
  const dom = new Map(dominioPorBloco(ctx.prios).map((x) => [x.bloco, x]));

  // KPI 4: causas dos erros (4 semanas)
  const erros = recentes.filter((a) => !a.correta || a.chute);
  const causas = contar(erros.map((a) => a.causa ?? 'sem causa'));
  const leituraPeg = erros.length ? ((causas.get('atencao') ?? 0) + (causas.get('pegadinha') ?? 0)) / erros.length : undefined;

  // KPI 5: reacerto do banco de erros
  const reacerto = calcReacerto(atts);
  // KPI 6: tempo por questão no último simulado
  const tpq = ultimo?.minutos ? ultimo.minutos / 80 : undefined;
  // KPI 11: cartões em dia
  const atrasados = cards.filter((c) => c.introduzido && c.card.due < Date.now() - 86400000).length;
  const revHoje = revs.filter((r) => new Date(r.ts).toDateString() === new Date().toDateString()).length;
  // KPI 12: sono
  const sonos = dias.filter((x) => x.sono && x.data >= hojeISO(new Date(ini))).map((x) => x.sono!);
  const sono = sonos.length ? sonos.reduce((a, b) => a + b, 0) / sonos.length : undefined;
  const comp = analisar(atts);

  const processoOk = cota >= 0.9 && diasSemana >= 5;
  const resultadoOk = ultimo && metaUlt !== undefined ? ultimo.nota >= metaUlt - 0.5 : undefined;

  return (
    <div>
      <div className="grid3">
        <div className="card kpi"><b>{ultimo ? num(ultimo.nota) : '—'}</b><span>Nota do último simulado{metaUlt !== undefined ? ` (meta ${num(metaUlt)})` : ''}</span>
          {ultimo && <div><span className={'pill ' + COR[faixaNota(ultimo.nota, metaUlt)]}>{faixaNota(ultimo.nota, metaUlt)}</span></div>}</div>
        <div className="card kpi"><b>{pct(cota)}</b><span>Cota da semana: {daSemana.length} de {metaSemana} questões</span>
          <div><span className={'pill ' + (cota >= 0.9 ? 'ok' : cota >= 0.7 ? 'warn' : 'bad')}>{cota >= 0.9 ? 'verde' : cota >= 0.7 ? 'amarelo' : 'vermelho'}</span></div></div>
        <div className="card kpi"><b>{diasSemana}/6</b><span>Dias cumpridos (seg a sáb)</span>
          <div><span className={'pill ' + (diasSemana >= 5 ? 'ok' : diasSemana === 4 ? 'warn' : 'bad')}>{diasSemana >= 5 ? 'verde' : diasSemana === 4 ? 'amarelo' : 'vermelho'}</span></div></div>
      </div>
      {reduzir && <div className="card" style={{ background: 'var(--warn-soft)' }}><b>Ajuste automático:</b> a semana passada ficou abaixo de 60% da cota. A meta desta semana deveria cair 20% (para {Math.round(metaSemana * 0.8)} questões), e não aumentar. Conserte o processo antes do método.</div>}

      <div className="card">
        <h2>Quadrante processo × resultado</h2>
        <p className="small" style={{ margin: 0 }}>
          {resultadoOk === undefined ? 'Sem simulado ainda. Nas primeiras semanas vale o processo: cumprir a cota e os dias.' :
            processoOk && resultadoOk ? 'Processo em dia e resultado no ritmo. Mantenha o plano.' :
              processoOk && !resultadoOk ? 'Processo em dia, mas resultado abaixo da rampa: este é o único caso em que vale trocar a técnica do bloco mais fraco.' :
                !processoOk && resultadoOk ? 'Resultado no ritmo, mas o processo está falhando. Proteja os horários antes que a nota caia.' :
                  'Processo e resultado abaixo: reduza a meta e recupere a constância primeiro (mais comum nas primeiras semanas).'}
        </p>
      </div>

      <div className="card">
        <h2>Nota dos simulados × rampa</h2>
        <GraficoRampa sims={sims.filter((s) => s.numero !== 99).map((s) => ({ semana: semanaDe(s.data), nota: s.nota }))} D={D} metaFinal={cfg.metaFinal} />
        <p className="tiny">{D === undefined ? 'A rampa aparece depois do diagnóstico de 28/11 (lance em Simulados).' : `Rampa de ${num(D)} (diagnóstico) até ${num(D > 6.5 ? Math.max(8, cfg.metaFinal) : cfg.metaFinal, 1)} na semana 12. Linha tracejada: piso de 6,00 do edital.`}</p>
      </div>

      <div className="card">
        <h2>Acerto por bloco</h2>
        <p className="tiny" style={{ marginTop: 0 }}>Últimas 4 semanas. “Domínio” é a estimativa do modelo (já desconta chute e esquecimento). Cores: vermelho abaixo de 50%, amarelo 50–69%, verde a partir de 70%.</p>
        <table className="t">
          <thead><tr><th>Bloco</th><th className="n">Acerto</th><th className="n">FCC real</th><th className="n">Domínio</th><th className="n">Pontos a recuperar</th></tr></thead>
          <tbody>
            {BLOCOS.map((b) => {
              const a = acertoBloco(b.id, false);
              const f = acertoBloco(b.id, true);
              const x = dom.get(b.id)!;
              return (
                <tr key={b.id}>
                  <td>{b.curto}</td>
                  <td className="n"><span className={'pill ' + COR[faixaAcerto(a?.p)]}>{a ? pct(a.p) : '—'}</span> <span className="tiny">{a?.n ?? ''}</span></td>
                  <td className="n">{f ? pct(f.p) : '—'}</td>
                  <td className="n">{pct(x.dominio)}</td>
                  <td className="n">{num(x.pontosRecuperar, 2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Fila da semana</h2>
          <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>{ctx.prios.slice(0, 5).map((p) => <li key={p.topico}>{NOME_TOPICO[p.topico]} <span className="tiny">({BLOCO_POR_ID[p.bloco].curto})</span></li>)}</ol>
        </div>
        <div className="card">
          <h2>Causas dos erros</h2>
          {!erros.length ? <p className="small muted">Sem erros nas últimas 4 semanas.</p> : (
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
              {[...causas.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => <li key={c}>{rotCausa(c)}: {n}</li>)}
            </ul>
          )}
          {leituraPeg !== undefined && <p className="tiny">Leitura + pegadinha: {pct(leituraPeg)} dos erros {leituraPeg > 0.33 ? '(acima de 1/3: o problema é técnica, não conteúdo — duas sessões viram treino de leitura)' : ''}</p>}
        </div>
      </div>

      <div className="card">
        <h2>Saúde do sistema</h2>
        <table className="t"><tbody>
          <tr><td>Revisões de cartões hoje</td><td className="n">{revHoje}</td></tr>
          <tr><td>Cartões atrasados há mais de 1 dia</td><td className="n">{atrasados} {atrasados > 30 ? <span className="pill warn">nenhum cartão novo até zerar</span> : null}</td></tr>
          <tr><td>Reacerto do banco de erros</td><td className="n">{reacerto ? `${pct(reacerto.p)} (${reacerto.n})` : '—'}</td></tr>
          <tr><td>Tempo por questão no último simulado</td><td className="n">{tpq ? `${num(tpq, 1)} min` : '—'} {tpq && tpq > 3 ? <span className="pill bad">acima de 3 min</span> : null}</td></tr>
          <tr><td>Mediana de tempo por questão (treino)</td><td className="n">{comp.medianaSegundos ? `${Math.round(comp.medianaSegundos)} s` : '—'}</td></tr>
          <tr><td>Sono médio da semana</td><td className="n">{sono ? `${num(sono, 1)} h` : '—'} {sono && sono < 6.5 ? <span className="pill warn">cortar 30 min de estudo para dormir</span> : null}</td></tr>
        </tbody></table>
      </div>

      <div className="card">
        <h2>Comportamento (o que o modelo aprendeu)</h2>
        <p className="tiny" style={{ marginTop: 0 }}>{comp.totalRespostas} respostas analisadas. As conclusões só aparecem com pelo menos 15 respostas por faixa.</p>
        <h3>Acerto por horário</h3>
        <table className="t"><tbody>{comp.porPeriodo.filter((p) => p.n).map((p) => <tr key={p.periodo}><td>{p.periodo}</td><td className="n">{pct(p.acerto)}</td><td className="n tiny">{p.n}</td></tr>)}</tbody></table>
        <h3>Acerto por minuto de sessão (cansaço)</h3>
        <table className="t"><tbody>{comp.porMinuto.filter((p) => p.n).map((p) => <tr key={p.faixa}><td>{p.faixa}</td><td className="n">{pct(p.acerto)}</td><td className="n tiny">{p.n}</td></tr>)}</tbody></table>
        <p className="small">{comp.quedaFadiga ? `Queda de ${pct(comp.quedaFadiga.queda)} depois de ${comp.quedaFadiga.aposMin} min: as missões foram limitadas a ${comp.minutosIdeais} min.` : 'Nenhuma queda por cansaço detectada até agora.'}
          {comp.rapidasErradas > 5 ? ` ${comp.rapidasErradas} erros em menos de 25 s: sinal de pressa. Leia o enunciado até o fim.` : ''}</p>
      </div>
      <p className="tiny">Simulados: {sims.length}. Próximo marco: {DATAS.simulados.find((s) => s.data >= hojeISO())?.nome ?? 'prova'} ({dataBR(DATAS.simulados.find((s) => s.data >= hojeISO())?.data ?? DATAS.prova)}).</p>
    </div>
  );
}

function contar(xs: string[]) {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

function rotCausa(c: string) {
  return ({ 'nao-sabia': 'Não sabia', confundi: 'Confundi', pegadinha: 'Pegadinha FCC', atencao: 'Falta de atenção', tempo: 'Faltou tempo', chute: 'Chute', 'sem causa': 'Sem causa marcada' } as Record<string, string>)[c] ?? c;
}

/** Reacerto: questões que já foram erradas e depois refeitas — fração acertada na refação. */
function calcReacerto(atts: Attempt[]) {
  const porQ = new Map<string, Attempt[]>();
  for (const a of [...atts].sort((x, y) => x.ts - y.ts)) {
    const l = porQ.get(a.qid) ?? [];
    l.push(a);
    porQ.set(a.qid, l);
  }
  let n = 0, ok = 0;
  for (const l of porQ.values()) {
    const iErro = l.findIndex((a) => !a.correta || a.chute);
    if (iErro >= 0 && iErro < l.length - 1) {
      for (const a of l.slice(iErro + 1)) { n++; if (a.correta && !a.chute) ok++; }
    }
  }
  return n ? { p: ok / n, n } : undefined;
}

function GraficoRampa({ sims, D, metaFinal }: { sims: { semana: number; nota: number }[]; D?: number; metaFinal: number }) {
  const W = 600, H = 220, padL = 32, padB = 24;
  const x = (s: number) => padL + ((s - 1) / 12) * (W - padL - 10);
  const y = (v: number) => H - padB - (v / 10) * (H - padB - 10);
  const rampa = D !== undefined ? Array.from({ length: 12 }, (_, i) => ({ s: i + 1, v: metaRampa(i + 1, D, metaFinal)! })) : [];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Gráfico da nota dos simulados contra a rampa de metas">
      {[0, 2, 4, 6, 8, 10].map((v) => (
        <g key={v}><line x1={padL} x2={W - 10} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} /><text x={4} y={y(v) + 4} fontSize={11} fill="var(--ink-3)">{v}</text></g>
      ))}
      {Array.from({ length: 13 }, (_, i) => <text key={i} x={x(i + 1) - 4} y={H - 6} fontSize={10} fill="var(--ink-3)">{i + 1}</text>)}
      <line x1={padL} x2={W - 10} y1={y(6)} y2={y(6)} stroke="var(--bad)" strokeDasharray="5 4" strokeWidth={1.5} />
      {rampa.length > 0 && <polyline points={rampa.map((p) => `${x(p.s)},${y(p.v)}`).join(' ')} fill="none" stroke="var(--ink-3)" strokeWidth={2} strokeDasharray="2 3" />}
      {sims.length > 0 && <polyline points={sims.map((p) => `${x(p.semana)},${y(p.nota)}`).join(' ')} fill="none" stroke="var(--primary)" strokeWidth={3} />}
      {sims.map((p, i) => <circle key={i} cx={x(p.semana)} cy={y(p.nota)} r={5} fill="var(--primary)" />)}
    </svg>
  );
}
