import { useEffect, useRef, useState } from 'react';
import { useNav } from '../App';
import { db, getConfig, saveConfig } from '../db';
import { banco, contexto, registrarResposta, novoIdSessao } from '../store';
import { BLOCOS, DATAS, TOPICO_PARA_BLOCO, BLOCO_POR_ID } from '../data/edital';
import { embaralhar } from '../engine/selector';
import { hojeISO } from '../engine/scoring';
import { PONTOS } from '../engine/gamification';
import { useAsync, num, dataBR } from '../lib/hooks';
import type { Questao, Simulado } from '../types';

const DURACAO_MS = 4 * 60 * 60 * 1000;
const LETRAS = ['A', 'B', 'C', 'D', 'E'];

interface EmAndamento {
  inicio: number;
  numero: number;
  ids: string[];
  respostas: Record<string, number>;
  flags: string[];
  tempos: Record<string, number>;
}

/** Nota pelo edital, generalizada para bancos menores: cada prova vale 0–10 pela proporção de acertos. */
function notaDe(aG: number, nG: number, aE: number, nE: number) {
  const cg = nG ? (10 * aG) / nG : 0;
  const ce = nE ? (10 * aE) / nE : 0;
  return (cg + 2 * ce) / 3;
}

export async function montarSimulado(): Promise<string[]> {
  const ctx = await contexto();
  const bq = await banco();
  const qb = ((await db.kv.get('questoesBloco'))?.v as Record<string, number> | undefined) ?? {};
  const usados = new Set<string>();
  const ids: string[] = [];
  const pegar = (blocoId: string, n: number) => {
    const pool = bq.filter((q) => TOPICO_PARA_BLOCO[q.topico] === blocoId && !usados.has(q.id));
    // prefere inéditas; depois as menos vistas
    const ord = embaralhar(pool).sort((a, b) => (ctx.qstate.get(a.id)?.vistas ?? 0) - (ctx.qstate.get(b.id)?.vistas ?? 0));
    const out = ord.slice(0, n);
    out.forEach((q) => { usados.add(q.id); ids.push(q.id); });
    return n - out.length;
  };
  for (const b of BLOCOS.filter((x) => x.prova === 'G')) pegar(b.id, b.questoes);
  let faltaE = 0;
  for (const b of BLOCOS.filter((x) => x.prova === 'E')) faltaE += pegar(b.id, qb[b.id] ?? b.questoes);
  // completa os Específicos que faltaram com outros blocos de TI, pelos de maior peso
  const ordemE = BLOCOS.filter((x) => x.prova === 'E').sort((a, b) => b.questoes - a.questoes);
  let progresso = true;
  while (faltaE > 0 && progresso) {
    progresso = false;
    for (const b of ordemE) {
      if (faltaE <= 0) break;
      if (pegar(b.id, 1) === 0) { faltaE--; progresso = true; }
    }
  }
  return ids;
}

export function SimuladoTela() {
  const [atual, setAtual] = useState<EmAndamento | null | undefined>(undefined);
  const [modo, setModo] = useState<'menu' | 'respirar' | 'papel' | 'resultado'>('menu');
  const [ultimo, setUltimo] = useState<Simulado | null>(null);

  useEffect(() => {
    db.kv.get('simulado-atual').then((x) => setAtual((x?.v as EmAndamento) ?? null));
  }, []);

  if (atual === undefined) return null;
  if (atual) return <Execucao estado={atual} onFim={(s) => { setAtual(null); setUltimo(s); setModo('resultado'); }} />;
  if (modo === 'respirar') return <Respirar onPronto={async (numero) => {
    const ids = await montarSimulado();
    const e: EmAndamento = { inicio: Date.now(), numero, ids, respostas: {}, flags: [], tempos: {} };
    await db.kv.put({ k: 'simulado-atual', v: e });
    setAtual(e);
  }} />;
  if (modo === 'papel') return <LancarPapel onFim={(s) => { setUltimo(s); setModo('resultado'); }} />;
  if (modo === 'resultado' && ultimo) return <Resultado s={ultimo} onVoltar={() => setModo('menu')} />;
  return <Menu onIniciar={() => setModo('respirar')} onPapel={() => setModo('papel')} />;
}

function Menu({ onIniciar, onPapel }: { onIniciar: () => void; onPapel: () => void }) {
  const [lista] = useAsync(() => db.simulados.orderBy('data').toArray());
  const [n] = useAsync(async () => (await banco()).length);
  const hoje = hojeISO();
  const prox = DATAS.simulados.find((s) => s.data >= hoje);
  return (
    <div>
      <div className="card">
        <h2>Simulado completo</h2>
        <p className="small">80 questões no formato do edital: 10 Português, 10 RLM, 5 Atualidades, 5 Ética e 50 de TI (proporção da matriz do pilar 4). 4 horas cronometradas. Nota pela fórmula do edital, (CG + 2 × CE) ÷ 3.</p>
        {prox && <p className="small"><b>Próximo marco:</b> {prox.nome} em {dataBR(prox.data)}.</p>}
        <p className="tiny">Banco atual: {n ?? '…'} questões. Para o diagnóstico de 28/11, o plano recomenda provas FCC reais em PDF (veja Provas oficiais) e lançar o resultado aqui. O simulado no app usa o banco de autoria própria no estilo FCC.</p>
        <div className="row">
          <button className="btn primary" onClick={onIniciar}>Fazer simulado no app</button>
          <button className="btn" onClick={onPapel}>Lançar simulado feito no papel</button>
        </div>
      </div>
      <div className="card">
        <h2>Histórico</h2>
        {!lista?.length ? <p className="small muted">Nenhum simulado ainda.</p> : (
          <table className="t">
            <thead><tr><th>Data</th><th>Marco</th><th className="n">G (30)</th><th className="n">E (50)</th><th className="n">Nota</th></tr></thead>
            <tbody>{lista.map((s) => (
              <tr key={s.id}><td>{dataBR(s.data)}</td><td>{s.numero === 0 ? 'Diagnóstico' : `Sim. ${s.numero}`} <span className="tiny">{s.origem}</span></td><td className="n">{s.pt + s.rlm + s.atu + s.eti}</td><td className="n">{s.esp}</td><td className="n"><b>{num(s.nota)}</b></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function proximoNumero(): number {
  const hoje = hojeISO();
  const s = DATAS.simulados.find((x) => x.data >= hoje);
  return s?.n ?? 6;
}

function Respirar({ onPronto }: { onPronto: (numero: number) => void }) {
  const [numero, setNumero] = useState(proximoNumero());
  const [frase, setFrase] = useState('');
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h2>Antes de começar: 2 minutos</h2>
      <p className="small muted">Respire acompanhando o círculo: 4 segundos inspirando, 2 segurando, 4 soltando. Isso reduz a ansiedade de prova.</p>
      <div className="breath" aria-hidden="true" />
      <label style={{ textAlign: 'left' }}>Uma frase sobre o que você vai fazer bem hoje</label>
      <input type="text" value={frase} onChange={(e) => setFrase(e.target.value)} placeholder="Ex.: vou ler cada EXCETO com calma" />
      <label style={{ textAlign: 'left' }}>Este simulado conta como</label>
      <select value={numero} onChange={(e) => setNumero(Number(e.target.value))}>
        {DATAS.simulados.map((s) => <option key={s.n} value={s.n}>{s.nome} ({dataBR(s.data)})</option>)}
        <option value={99}>Treino extra (fora do cronograma)</option>
      </select>
      <p className="tiny" style={{ textAlign: 'left' }}>Regras de prova real: celular longe, 4 horas, ordem de ataque treinada (Específicos primeiro, depois Português). O cronômetro continua mesmo se a tela bloquear.</p>
      <button className="btn primary big" onClick={() => onPronto(numero)}>Começar o simulado</button>
    </div>
  );
}

function Execucao({ estado, onFim }: { estado: EmAndamento; onFim: (s: Simulado) => void }) {
  const [e, setE] = useState(estado);
  const [qs, setQs] = useState<Questao[]>([]);
  const [i, setI] = useState(0);
  const [agora, setAgora] = useState(Date.now());
  const [confirmando, setConfirmando] = useState(false);
  const tq = useRef(Date.now());

  useEffect(() => {
    banco().then((b) => {
      const m = new Map(b.map((q) => [q.id, q]));
      setQs(e.ids.map((id) => m.get(id)!).filter(Boolean));
    });
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { db.kv.put({ k: 'simulado-atual', v: e }); }, [e]);

  const restante = Math.max(0, e.inicio + DURACAO_MS - agora);
  useEffect(() => { if (restante === 0 && qs.length) entregar(); /* tempo esgotado */ }, [restante === 0]); // eslint-disable-line

  if (!qs.length) return <p className="muted">Montando o caderno…</p>;
  const q = qs[i];

  function ir(k: number) {
    const gasto = Date.now() - tq.current;
    tq.current = Date.now();
    setE((x) => ({ ...x, tempos: { ...x.tempos, [q.id]: (x.tempos[q.id] ?? 0) + gasto } }));
    setI(Math.max(0, Math.min(qs.length - 1, k)));
  }

  async function entregar() {
    const sessao = novoIdSessao();
    let aG = 0, nG = 0, aE = 0, nE = 0;
    const porDisc = { pt: 0, rlm: 0, atu: 0, eti: 0 } as Record<string, number>;
    const porBloco: Record<string, { q: number; a: number }> = {};
    let pos = 0;
    for (const x of qs) {
      const b = TOPICO_PARA_BLOCO[x.topico];
      const prova = BLOCO_POR_ID[b].prova;
      const r = e.respostas[x.id];
      const certo = r === x.correta;
      porBloco[b] = porBloco[b] ?? { q: 0, a: 0 };
      porBloco[b].q++;
      if (certo) porBloco[b].a++;
      if (prova === 'G') { nG++; if (certo) { aG++; porDisc[b]++; } } else { nE++; if (certo) aE++; }
      if (r !== undefined) {
        pos++;
        await registrarResposta({ q: x, escolha: r, chute: false, ms: e.tempos[x.id] ?? 60000, sessao, pos, minutoSessao: 0, modo: 'simulado' });
      }
    }
    const minutos = Math.round((Date.now() - e.inicio) / 60000);
    const s: Simulado = {
      data: hojeISO(), numero: e.numero, origem: 'app', pt: porDisc.pt, rlm: porDisc.rlm, atu: porDisc.atu, eti: porDisc.eti, esp: aE,
      minutos, porBloco, nota: notaDe(aG, nG, aE, nE)
    };
    s.id = await db.simulados.add(s);
    await db.eventos.add({ ts: Date.now(), tipo: 'simulado', pontos: PONTOS.simulado });
    await db.sessoes.put({ id: sessao, inicio: e.inicio, fim: Date.now(), tipo: 'simulado', concluida: true, minutos });
    if (e.numero === 0) await saveConfig({ diagnostico: Math.round(s.nota * 100) / 100 });
    await db.kv.delete('simulado-atual');
    onFim(s);
  }

  const h = Math.floor(restante / 3600000), m = Math.floor((restante % 3600000) / 60000), sg = Math.floor((restante % 60000) / 1000);
  const respondidas = Object.keys(e.respostas).length;
  const bloco = BLOCO_POR_ID[TOPICO_PARA_BLOCO[q.topico]];

  return (
    <div>
      <div className="card spread" style={{ position: 'sticky', top: 60, zIndex: 4 }}>
        <span className="timer" aria-live="off">{h}:{String(m).padStart(2, '0')}:{String(sg).padStart(2, '0')}</span>
        <span className="small">{respondidas}/{qs.length} respondidas</span>
        <button className="btn sm primary" onClick={() => setConfirmando(true)}>Entregar</button>
      </div>
      {confirmando && (
        <div className="card" style={{ background: 'var(--warn-soft)' }}>
          <p><b>Entregar o simulado?</b> {qs.length - respondidas > 0 ? `Há ${qs.length - respondidas} em branco. Na prova, questão em branco vale zero: nunca deixe em branco.` : 'Todas respondidas.'}</p>
          <div className="row"><button className="btn primary" onClick={entregar}>Sim, entregar</button><button className="btn" onClick={() => setConfirmando(false)}>Continuar</button></div>
        </div>
      )}
      <div className="card">
        <div className="spread small muted"><span>Questão {i + 1} · {bloco.prova === 'G' ? 'Gerais' : 'Específicos'} · {bloco.curto}</span>
          <button className="btn sm ghost" onClick={() => setE((x) => ({ ...x, flags: x.flags.includes(q.id) ? x.flags.filter((f) => f !== q.id) : [...x.flags, q.id] }))}>{e.flags.includes(q.id) ? '★ marcada' : '☆ marcar para voltar'}</button>
        </div>
        <div className="enun">{q.enunciado}</div>
        {q.codigo && <pre className="code">{q.codigo}</pre>}
        {q.alternativas.map((a, k) => (
          <button key={k} className={'alt ' + (e.respostas[q.id] === k ? 'sel' : '')} onClick={() => setE((x) => ({ ...x, respostas: { ...x.respostas, [q.id]: k } }))}>
            <span className="l">{LETRAS[k]}</span><span>{a}</span>
          </button>
        ))}
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
          <button className="btn" disabled={i === 0} onClick={() => ir(i - 1)}>‹ Anterior</button>
          <button className="btn primary" disabled={i === qs.length - 1} onClick={() => ir(i + 1)}>Próxima ›</button>
        </div>
      </div>
      <div className="card">
        <div className="tiny" style={{ marginBottom: 6 }}>Ir para a questão (azul = respondida, contorno amarelo = marcada)</div>
        <div className="qnav">
          {qs.map((x, k) => (
            <button key={x.id} className={(e.respostas[x.id] !== undefined ? 'resp ' : '') + (e.flags.includes(x.id) ? 'flag ' : '') + (k === i ? 'cur' : '')} onClick={() => ir(k)}>{k + 1}</button>
          ))}
        </div>
        <p className="tiny">Regra dos 4 minutos: passou disso sem chegar a duas alternativas, marque e siga. Treine também passar o gabarito para a folha nos últimos 25 minutos.</p>
      </div>
    </div>
  );
}

function LancarPapel({ onFim }: { onFim: (s: Simulado) => void }) {
  const [f, setF] = useState({ data: hojeISO(), numero: proximoNumero(), pt: 0, rlm: 0, atu: 0, eti: 0, esp: 0, minutos: 240, rasura: false });
  const set = (k: string, v: number | string | boolean) => setF((x) => ({ ...x, [k]: v }));
  const cap = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v || 0)));
  const g = f.pt + f.rlm + f.atu + f.eti;
  const nota = notaDe(g, 30, f.esp, 50);
  async function salvar() {
    const s: Simulado = { ...f, origem: 'papel', nota };
    s.id = await db.simulados.add(s);
    await db.eventos.add({ ts: Date.now(), tipo: 'simulado', pontos: PONTOS.simulado });
    await db.sessoes.put({ id: novoIdSessao(), inicio: Date.now() - f.minutos * 60000, fim: Date.now(), tipo: 'simulado', concluida: true, minutos: f.minutos });
    if (f.numero === 0) await saveConfig({ diagnostico: Math.round(nota * 100) / 100 });
    onFim(s);
  }
  const campo = (k: 'pt' | 'rlm' | 'atu' | 'eti' | 'esp', rot: string, max: number) => (
    <div><label>{rot} (de {max})</label><input type="number" inputMode="numeric" min={0} max={max} value={f[k]} onChange={(e) => set(k, cap(Number(e.target.value), max))} /></div>
  );
  return (
    <div className="card">
      <h2>Lançar simulado feito no papel</h2>
      <p className="small muted">Use para provas FCC reais em PDF. Depois, lance cada erro em Mais &gt; Importar (opção “registrar erro de prova”), para o algoritmo aprender com eles.</p>
      <div className="grid2">
        <div><label>Data</label><input type="date" value={f.data} onChange={(e) => set('data', e.target.value)} /></div>
        <div><label>Marco</label><select value={f.numero} onChange={(e) => set('numero', Number(e.target.value))}>{DATAS.simulados.map((s) => <option key={s.n} value={s.n}>{s.nome}</option>)}<option value={99}>Treino extra</option></select></div>
        {campo('pt', 'Português', 10)}{campo('rlm', 'Raciocínio Lógico e Estatística', 10)}{campo('atu', 'Atualidades', 5)}{campo('eti', 'Ética, Compliance e ESG', 5)}{campo('esp', 'Específicos de TI', 50)}
        <div><label>Minutos até terminar de responder</label><input type="number" value={f.minutos} onChange={(e) => set('minutos', cap(Number(e.target.value), 600))} /></div>
      </div>
      <label className="check"><input type="checkbox" checked={f.rasura} onChange={(e) => set('rasura', e.target.checked)} /> Houve rasura ou dupla marcação na folha</label>
      <p>Nota ponderada: <b>{num(nota)}</b> <span className="tiny">CG = {num(g / 3)} · CE = {num(f.esp / 5)}</span></p>
      <button className="btn primary big" onClick={salvar}>Salvar</button>
    </div>
  );
}

function Resultado({ s, onVoltar }: { s: Simulado; onVoltar: () => void }) {
  const nav = useNav();
  const [cfg] = useAsync(() => getConfig());
  const g = s.pt + s.rlm + s.atu + s.eti;
  return (
    <div>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="tiny">Primeiro o processo: você fez o simulado inteiro. Isso já é a meta.</div>
        <h2 style={{ fontSize: 30, margin: '8px 0' }}>Nota {num(s.nota)}</h2>
        <p className="small">Gerais {g} · Específicos {s.esp} · {s.minutos ?? '—'} min ({num((s.minutos ?? 0) / 80, 1)} min por questão)</p>
        {s.numero === 0 && <p className="small">Esta é a sua linha de base D. A rampa de metas até {num(cfg?.metaFinal ?? 7.5, 1)} foi calculada a partir dela.</p>}
        {s.nota >= 6 ? <span className="pill ok">acima do piso de 6,00 do edital</span> : <span className="pill">bloco ainda em construção: o piso do edital é 6,00</span>}
        {s.rasura && <p className="small" style={{ color: 'var(--warn)' }}>Houve rasura: no próximo simulado, reserve 25 min para passar o gabarito com calma.</p>}
      </div>
      {s.porBloco && (
        <div className="card">
          <h2>Acerto por bloco</h2>
          <table className="t"><tbody>
            {Object.entries(s.porBloco).map(([b, v]) => (
              <tr key={b}><td>{BLOCO_POR_ID[b]?.curto}</td><td className="n">{v.a}/{v.q}</td><td style={{ width: '40%' }}><div className="bar"><i style={{ width: `${Math.round((100 * v.a) / v.q)}%` }} /></div></td></tr>
            ))}
          </tbody></table>
        </div>
      )}
      <div className="card">
        <h2>Agora, 30 minutos de análise</h2>
        <ol className="small">
          <li>Refaça os erros e marque a causa de cada um (não sabia, confundi, pegadinha, atenção, tempo).</li>
          <li>Confira se o tempo por questão passou de 3 minutos.</li>
          <li>Escreva uma frase: o que eu faria diferente no dia da prova.</li>
        </ol>
        <div className="row">
          <button className="btn primary" onClick={() => nav.ir({ r: 'pratica', modo: 'erros', titulo: 'Erros do simulado', n: 30 })}>Classificar os erros agora</button>
          <button className="btn" onClick={onVoltar}>Voltar</button>
        </div>
      </div>
    </div>
  );
}

