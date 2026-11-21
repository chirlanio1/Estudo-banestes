import { useEffect, useRef, useState } from 'react';
import type { CausaErro, Questao } from '../types';
import { CAUSAS, classificarErro, registrarResposta, type Remedio } from '../store';
import { NOME_TOPICO, TOPICO_PARA_BLOCO, BLOCO_POR_ID } from '../data/edital';

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

export function SeloVerificacao({ q }: { q: Questao }) {
  const map: Record<string, [string, string]> = {
    executado: ['ok', 'código executado'],
    calculado: ['ok', 'conta conferida'],
    gramatica: ['ok', 'conferida na gramática'],
    fonte: ['ok', 'conferida na fonte'],
    conferir: ['warn', 'não verificada: confira na fonte']
  };
  const [cls, txt] = map[q.verificacao] ?? ['', q.verificacao];
  const orig = q.origem === 'fcc' ? 'FCC real' : q.origem === 'outra' ? 'outra banca' : q.origem === 'ia' ? 'gerada por IA no app' : 'estilo FCC (autoria IA, revisada)';
  return (
    <span className="row" style={{ gap: 6 }}>
      <span className="pill">{orig}</span>
      <span className={'pill ' + cls}>{txt}</span>
    </span>
  );
}

export interface ResultadoQuestao {
  correta: boolean;
  chute: boolean;
  causa?: CausaErro;
}

interface Props {
  q: Questao;
  sessao: string;
  pos: number;
  inicioSessao: number;
  modo: 'pre' | 'pilula' | 'pratica' | 'erros';
  onProxima: (r: ResultadoQuestao) => void;
  rotuloProxima?: string;
}

/** Uma questão no estilo FCC: responder, ver o gabarito comentado e, se errou, classificar a causa (que aciona o remédio). */
export function QuestaoCard({ q, sessao, pos, inicioSessao, modo, onProxima, rotuloProxima = 'Próxima' }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const [chute, setChute] = useState(false);
  const [resp, setResp] = useState<{ correta: boolean; attemptId: number } | null>(null);
  const [causa, setCausa] = useState<CausaErro | undefined>();
  const [remedio, setRemedio] = useState<Remedio | null>(null);
  const t0 = useRef(Date.now());

  useEffect(() => {
    t0.current = Date.now();
    setSel(null); setChute(false); setResp(null); setCausa(undefined); setRemedio(null);
  }, [q.id]);

  async function confirmar() {
    if (sel === null) return;
    const ms = Date.now() - t0.current;
    const r = await registrarResposta({
      q, escolha: sel, chute, ms, sessao, pos, minutoSessao: (Date.now() - inicioSessao) / 60000, modo
    });
    setResp(r);
    if (r.correta && chute) setCausa('chute');
  }

  async function escolherCausa(c: CausaErro) {
    if (!resp) return;
    setCausa(c);
    setRemedio(await classificarErro(resp.attemptId, c, q));
  }

  const bloco = BLOCO_POR_ID[TOPICO_PARA_BLOCO[q.topico]];
  const errou = resp && (!resp.correta || chute);
  const podeSeguir = resp && (!errou || causa);

  return (
    <div className="card">
      <div className="spread small muted" style={{ marginBottom: 8 }}>
        <span>{bloco?.curto} · {NOME_TOPICO[q.topico] ?? q.topico}</span>
        {modo === 'pre' && <span className="pill info">pré-teste: errar aqui é esperado</span>}
      </div>
      <div className="enun">{q.enunciado}</div>
      {q.codigo && <pre className="code">{q.codigo}</pre>}
      <div role="radiogroup" aria-label="Alternativas">
        {q.alternativas.map((a, i) => {
          let cls = 'alt';
          if (resp) {
            if (i === q.correta) cls += ' certa';
            else if (i === sel) cls += ' errada';
          } else if (i === sel) cls += ' sel';
          return (
            <button key={i} className={cls} disabled={!!resp} onClick={() => setSel(i)} role="radio" aria-checked={sel === i}>
              <span className="l">{LETRAS[i]}</span>
              <span>{a}</span>
            </button>
          );
        })}
      </div>

      {!resp && (
        <>
          <label className="check">
            <input type="checkbox" checked={chute} onChange={(e) => setChute(e.target.checked)} />
            Estou chutando (chute certo conta como erro no painel)
          </label>
          <button className="btn primary big" disabled={sel === null} onClick={confirmar}>Confirmar resposta</button>
        </>
      )}

      {resp && (
        <div className="stack" style={{ marginTop: 10 }}>
          <div className={'pill ' + (resp.correta && !chute ? 'ok' : resp.correta ? 'warn' : 'bad')} style={{ fontSize: 15 }}>
            {resp.correta && !chute ? 'Acertou' : resp.correta ? 'Acertou no chute: vamos tratar como lacuna' : `Gabarito: ${LETRAS[q.correta]}`}
          </div>
          <div className="explic">{q.explicacao}</div>
          <div className="row">
            <SeloVerificacao q={q} />
            {q.fonte && <span className="tiny">Fonte: {q.fonte}</span>}
          </div>

          {errou && !resp.correta && !remedio && (
            <div>
              <h3 style={{ margin: '8px 0' }}>Por que você errou?</h3>
              <p className="small muted" style={{ marginTop: 0 }}>A causa define o remédio. Seja honesto: isso não vale nota, vale aprendizado.</p>
              <div className="causas">
                {CAUSAS.map((c) => (
                  <button key={c.id} onClick={() => escolherCausa(c.id)} className={causa === c.id ? 'sel' : ''}>
                    <b>{c.rotulo}</b>
                    <span>{c.dica}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {errou && resp.correta && !remedio && (
            <button className="btn" onClick={() => escolherCausa('nao-sabia')}>Criar cartão com a regra certa</button>
          )}
          {remedio && (
            <div className="card" style={{ background: 'var(--primary-soft)', borderColor: 'transparent', boxShadow: 'none', margin: 0 }}>
              <b>{remedio.titulo}</b>
              <div className="small">{remedio.texto}</div>
              <div className="tiny">+1 ponto: erro capturado vira aprendizado.</div>
            </div>
          )}
          <button className="btn primary big" disabled={!podeSeguir && !(errou && resp.correta)} onClick={() => onProxima({ correta: resp.correta && !chute, chute, causa })}>
            {rotuloProxima}
          </button>
        </div>
      )}
    </div>
  );
}
