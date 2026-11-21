import { useEffect, useRef, useState } from 'react';
import { filaDeCartoes, revisarCartao, concluirSessao, iniciarSessao } from '../store';
import { previa, formatarIntervalo, type Nota } from '../engine/srs';
import { NOME_TOPICO } from '../data/edital';
import type { Flashcard } from '../types';
import { db, getConfig } from '../db';
import { PONTOS } from '../engine/gamification';
import { hojeISO } from '../engine/scoring';

/** Revisão de cartões com FSRS. Teto de carga: os novos por dia vêm das configurações (padrão 10). */
export function Revisar({ embutido, limite, onFim }: { embutido?: boolean; limite?: number; onFim?: () => void }) {
  const [fila, setFila] = useState<Flashcard[] | null>(null);
  const [virado, setVirado] = useState(false);
  const [feitos, setFeitos] = useState(0);
  const [ret, setRet] = useState(0.85);
  const t0 = useRef(Date.now());
  const sessao = useRef<string | null>(null);

  useEffect(() => {
    filaDeCartoes().then((f) => setFila(limite ? f.slice(0, limite) : f));
    getConfig().then((c) => setRet(c.retencao));
  }, [limite]);

  useEffect(() => {
    t0.current = Date.now();
  }, [fila?.[0]?.id, virado]);

  if (!fila) return <p className="muted">Carregando cartões…</p>;

  async function nota(n: Nota) {
    const c = fila![0];
    if (!sessao.current && !embutido) sessao.current = (await iniciarSessao('revisao')).id;
    await revisarCartao(c, n, Date.now() - t0.current);
    let resto = fila!.slice(1);
    // "Errei" volta para o fim da fila da sessão
    if (n === 1) resto = [...resto, { ...c, introduzido: true, card: (await db.cards.get(c.id!))!.card }];
    setFila(resto);
    setVirado(false);
    setFeitos((x) => x + 1);
    if (!resto.length) terminou();
  }

  async function terminou() {
    const k = 'revisao-zerada-' + hojeISO();
    if (!(await db.kv.get(k))) {
      await db.kv.put({ k, v: true });
      await db.eventos.add({ ts: Date.now(), tipo: 'revisaoZerada', pontos: PONTOS.revisaoZerada });
    }
    if (sessao.current) await concluirSessao(sessao.current);
  }

  if (!fila.length) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>{feitos ? 'Revisão do dia zerada' : 'Nenhum cartão para hoje'}</h2>
        <p className="small muted">{feitos ? `${feitos} revisões feitas. +${PONTOS.revisaoZerada} pontos.` : 'Os cartões nascem dos seus erros e da teoria das pílulas. Eles voltam no dia certo, antes de você esquecer.'}</p>
        {onFim && <button className="btn primary big" onClick={onFim}>Continuar</button>}
      </div>
    );
  }

  const c = fila[0];
  const pv = previa(c.card, new Date(), ret);
  return (
    <div>
      <div className="spread small muted" style={{ marginBottom: 8 }}>
        <span>{fila.length} na fila{!c.introduzido ? ' · cartão novo' : ''}</span>
        <span>{NOME_TOPICO[c.topico] ?? c.topico}</span>
      </div>
      <div className="card flash">
        <div>{c.frente}</div>
        {virado && <hr style={{ border: 0, borderTop: '1px solid var(--line)', width: '100%', margin: '16px 0' }} />}
        {virado && <div>{c.verso}</div>}
      </div>
      {!virado ? (
        <button className="btn primary big" onClick={() => setVirado(true)}>Mostrar resposta</button>
      ) : (
        <div className="rates">
          <button className="r1" onClick={() => nota(1)}>Errei<small>{formatarIntervalo(pv[1])}</small></button>
          <button className="r2" onClick={() => nota(2)}>Difícil<small>{formatarIntervalo(pv[2])}</small></button>
          <button className="r3" onClick={() => nota(3)}>Bom<small>{formatarIntervalo(pv[3])}</small></button>
          <button className="r4" onClick={() => nota(4)}>Fácil<small>{formatarIntervalo(pv[4])}</small></button>
        </div>
      )}
      <p className="tiny" style={{ marginTop: 10 }}>Antes de virar, tente responder em voz alta. O intervalo embaixo de cada botão é quando o cartão volta (algoritmo FSRS).</p>
      {onFim && <button className="btn ghost" onClick={onFim}>Pular cartões por hoje</button>}
    </div>
  );
}
