import { useState } from 'react';
import { useNav } from '../App';
import { db } from '../db';
import { BLOCOS, TOPICO_PARA_BLOCO } from '../data/edital';
import { invalidarBanco, registrarResposta, classificarErro, novoIdSessao, CAUSAS } from '../store';
import type { CausaErro, Origem, Questao } from '../types';
import { useAsync } from '../lib/hooks';

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

function vazio() {
  return { topico: 'bd-sql', enunciado: '', codigo: '', alts: ['', '', '', '', ''], correta: 0, explicacao: '', fonte: '', origem: 'fcc' as Origem, errei: false, minha: 0, causa: 'nao-sabia' as CausaErro };
}

/** Normaliza um objeto de importação em lote (JSON) para Questao. */
export function normalizarQuestao(x: any, i: number): Questao | null {
  const alts = x.alternativas ?? [x.A ?? x.a, x.B ?? x.b, x.C ?? x.c, x.D ?? x.d, x.E ?? x.e];
  if (!x.enunciado || !Array.isArray(alts) || alts.length !== 5 || alts.some((a: unknown) => !a)) return null;
  let correta = x.correta;
  if (typeof correta === 'string') correta = LETRAS.indexOf(correta.trim().toUpperCase());
  if (typeof correta !== 'number' || correta < 0 || correta > 4) return null;
  const topico = TOPICO_PARA_BLOCO[x.topico] ? x.topico : null;
  if (!topico) return null;
  return {
    id: x.id ?? `imp-${Date.now().toString(36)}-${i}`,
    topico, dif: [1, 2, 3].includes(x.dif) ? x.dif : 2,
    enunciado: String(x.enunciado), codigo: x.codigo || undefined,
    alternativas: alts.map(String) as Questao['alternativas'],
    correta: correta as Questao['correta'], explicacao: x.explicacao ? String(x.explicacao) : 'Sem comentário. Confira o gabarito oficial.',
    fonte: x.fonte ? String(x.fonte) : undefined,
    verificacao: x.origem === 'fcc' ? 'fonte' : 'conferir',
    origem: (['fcc', 'outra', 'ia', 'app'].includes(x.origem) ? x.origem : 'fcc') as Origem
  };
}

function parseCSV(txt: string): any[] {
  // separador ; (padrão do Excel/Planilhas em pt-BR). Colunas: topico;enunciado;A;B;C;D;E;correta;explicacao;fonte;origem
  const linhas = txt.split(/\r?\n/).filter((l) => l.trim());
  const out: any[] = [];
  for (const [k, l] of linhas.entries()) {
    const c = splitCSV(l);
    if (k === 0 && c[0]?.toLowerCase() === 'topico') continue;
    out.push({ topico: c[0], enunciado: c[1], alternativas: c.slice(2, 7), correta: c[7], explicacao: c[8], fonte: c[9], origem: c[10] || 'fcc' });
  }
  return out;
}

function splitCSV(l: string): string[] {
  const out: string[] = [];
  let cur = '', q = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === ';' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function Importar() {
  const nav = useNav();
  const [f, setF] = useState(vazio());
  const [lote, setLote] = useState('');
  const [msg, setMsg] = useState('');
  const [extras, reload] = useAsync(() => db.questoesExtra.toArray());

  async function salvar() {
    const q = normalizarQuestao({ ...f, alternativas: f.alts, codigo: f.codigo }, 0);
    if (!q) return setMsg('Preencha enunciado, as 5 alternativas e o tópico.');
    await db.questoesExtra.put(q);
    invalidarBanco();
    if (f.errei) {
      const r = await registrarResposta({ q, escolha: f.minha, chute: false, ms: 120000, sessao: novoIdSessao(), pos: 1, minutoSessao: 0, modo: 'pratica' });
      if (!r.correta) await classificarErro(r.attemptId, f.causa, q);
    }
    nav.toast('Questão salva no banco.' + (f.errei ? ' O erro já entrou no modelo.' : ''));
    setF({ ...vazio(), topico: f.topico, origem: f.origem, fonte: f.fonte });
    reload();
  }

  async function importarLote() {
    try {
      const t = lote.trim();
      const brutos = t.startsWith('[') || t.startsWith('{') ? [].concat(JSON.parse(t)) : parseCSV(t);
      const qs = brutos.map(normalizarQuestao).filter(Boolean) as Questao[];
      await db.questoesExtra.bulkPut(qs);
      invalidarBanco();
      setMsg(`${qs.length} de ${brutos.length} questões importadas.${qs.length < brutos.length ? ' As outras tinham campos faltando ou tópico inválido.' : ''}`);
      setLote('');
      reload();
    } catch (e) {
      setMsg('Não consegui ler: ' + (e as Error).message);
    }
  }

  return (
    <div>
      <div className="card">
        <h2>Cadastrar uma questão</h2>
        <p className="tiny" style={{ marginTop: 0 }}>Copie do PDF da prova (ou do QConcursos/TEC). Leva cerca de 1 minuto. Questões FCC reais contam no indicador de acerto FCC do painel.</p>
        <label>Tópico do edital</label>
        <select value={f.topico} onChange={(e) => setF({ ...f, topico: e.target.value })}>
          {BLOCOS.map((b) => <optgroup key={b.id} label={b.nome}>{b.subtopicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</optgroup>)}
        </select>
        <label>Enunciado</label>
        <textarea value={f.enunciado} onChange={(e) => setF({ ...f, enunciado: e.target.value })} />
        <label>Código (opcional)</label>
        <textarea value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} style={{ fontFamily: 'monospace', minHeight: 70 }} />
        {f.alts.map((a, i) => (
          <div key={i}>
            <label className="check"><input type="radio" name="correta" checked={f.correta === i} onChange={() => setF({ ...f, correta: i })} /> Alternativa {LETRAS[i]} {f.correta === i ? '(correta)' : ''}</label>
            <input type="text" value={a} onChange={(e) => { const alts = f.alts.slice(); alts[i] = e.target.value; setF({ ...f, alts }); }} />
          </div>
        ))}
        <label>Comentário / por que a correta está certa (opcional)</label>
        <textarea value={f.explicacao} onChange={(e) => setF({ ...f, explicacao: e.target.value })} style={{ minHeight: 70 }} />
        <div className="grid2">
          <div><label>Fonte</label><input type="text" value={f.fonte} placeholder="Ex.: FCC 2024 TRT 20, questão 37" onChange={(e) => setF({ ...f, fonte: e.target.value })} /></div>
          <div><label>Origem</label><select value={f.origem} onChange={(e) => setF({ ...f, origem: e.target.value as Origem })}><option value="fcc">FCC real</option><option value="outra">Outra banca</option></select></div>
        </div>
        <label className="check"><input type="checkbox" checked={f.errei} onChange={(e) => setF({ ...f, errei: e.target.checked })} /> Errei esta questão numa prova ou simulado no papel</label>
        {f.errei && (
          <div className="grid2">
            <div><label>Minha resposta</label><select value={f.minha} onChange={(e) => setF({ ...f, minha: Number(e.target.value) })}>{LETRAS.map((l, i) => <option key={l} value={i}>{l}</option>)}</select></div>
            <div><label>Causa do erro</label><select value={f.causa} onChange={(e) => setF({ ...f, causa: e.target.value as CausaErro })}>{CAUSAS.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}</select></div>
          </div>
        )}
        <button className="btn primary big" style={{ marginTop: 12 }} onClick={salvar}>Salvar questão</button>
        {msg && <p className="small">{msg}</p>}
      </div>

      <div className="card">
        <h2>Importar em lote</h2>
        <p className="small muted">Cole um JSON (lista de questões) ou CSV com <code>;</code> nas colunas: <code>topico;enunciado;A;B;C;D;E;correta;explicacao;fonte;origem</code>. A correta pode ser letra (A–E). Os tópicos válidos estão em Trilhas (ex.: <code>bd-sql</code>, <code>pt-crase</code>).</p>
        <textarea value={lote} onChange={(e) => setLote(e.target.value)} placeholder='[{"topico":"bd-sql","enunciado":"...","alternativas":["...","...","...","...","..."],"correta":"C","fonte":"FCC 2024"}]' />
        <button className="btn" style={{ marginTop: 8 }} onClick={importarLote} disabled={!lote.trim()}>Importar</button>
      </div>

      <div className="card">
        <div className="spread"><h2>Questões adicionadas</h2><span className="pill">{extras?.length ?? 0}</span></div>
        <ul className="list small">
          {(extras ?? []).slice(-30).reverse().map((q) => (
            <li key={q.id} className="spread">
              <span>{q.enunciado.slice(0, 90)}… <span className="tiny">({q.origem})</span></span>
              <button className="btn sm ghost danger" onClick={async () => { await db.questoesExtra.delete(q.id); invalidarBanco(); reload(); }}>Excluir</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
