import { useEffect, useState } from 'react';
import { useNav } from '../App';
import { db } from '../db';
import { contexto, concluirSessao, iniciarSessao } from '../store';
import { escolherQuestoes, embaralhar } from '../engine/selector';
import { sortearTopicos } from '../engine/priority';
import type { Questao, Sessao } from '../types';
import { QuestaoCard } from '../components/QuestaoCard';

export function Pratica({ topicos, modo, titulo, n = 10 }: { topicos?: string[]; modo: 'livre' | 'erros' | 'bloco'; titulo?: string; n?: number }) {
  const nav = useNav();
  const [lista, setLista] = useState<Questao[] | null>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [i, setI] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);

  useEffect(() => {
    (async () => {
      const ctx = await contexto();
      const sel = { qstate: ctx.qstate, thetaDe: ctx.thetaDe, agora: Date.now() };
      let qs: Questao[];
      if (modo === 'erros') {
        const errados = await db.attempts.filter((a) => !a.correta || a.chute).toArray();
        const ids = new Set(errados.map((a) => a.qid));
        // só as que ainda não foram reacertadas depois do último erro
        const ultimo = new Map<string, boolean>();
        const todos = await db.attempts.orderBy('ts').toArray();
        for (const a of todos) if (ids.has(a.qid)) ultimo.set(a.qid, a.correta && !a.chute);
        const pend = ctx.banco.filter((q) => ids.has(q.id) && ultimo.get(q.id) === false);
        qs = embaralhar(pend).slice(0, n);
      } else if (modo === 'bloco' && topicos?.length) {
        qs = escolherQuestoes(ctx.banco, topicos, n, sel);
      } else {
        const tops = sortearTopicos(ctx.prios, 4);
        qs = escolherQuestoes(ctx.banco, tops, n, sel);
      }
      setLista(qs);
      setSessao(await iniciarSessao(modo === 'erros' ? 'erros' : 'pratica'));
    })();
  }, [modo, topicos, n]);

  if (!lista || !sessao) return <p className="muted">Escolhendo as questões pelo seu ponto mais fraco…</p>;
  if (!lista.length) {
    return (
      <div className="card">
        <h2>{modo === 'erros' ? 'Nenhum erro pendente' : 'Sem questões disponíveis'}</h2>
        <p className="small muted">{modo === 'erros' ? 'Todos os erros já foram refeitos e acertados. Ótimo sinal.' : 'Importe questões ou gere com IA para este tópico.'}</p>
        <button className="btn primary" onClick={() => nav.voltar()}>Voltar</button>
      </div>
    );
  }
  if (fim) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>{titulo ?? 'Bateria'} concluída</h2>
        <p>{acertos} de {lista.length} acertos.</p>
        <p className="small muted">O modelo já atualizou o seu domínio em cada tópico e reagendou as questões erradas.</p>
        <button className="btn primary" onClick={() => nav.ir({ r: 'hoje' })}>Voltar ao início</button>
      </div>
    );
  }
  return (
    <div>
      <div className="spread small muted" style={{ marginBottom: 8 }}>
        <b>{titulo ?? 'Questões'}</b>
        <span>{i + 1} de {lista.length}</span>
      </div>
      <QuestaoCard
        q={lista[i]}
        sessao={sessao.id}
        pos={i + 1}
        inicioSessao={sessao.inicio}
        modo={modo === 'erros' ? 'erros' : 'pratica'}
        rotuloProxima={i + 1 < lista.length ? 'Próxima' : 'Ver resultado'}
        onProxima={async (r) => {
          if (r.correta) setAcertos((a) => a + 1);
          if (i + 1 < lista.length) setI(i + 1);
          else {
            await concluirSessao(sessao.id);
            setFim(true);
          }
        }}
      />
      <button className="btn ghost" onClick={async () => { await concluirSessao(sessao.id); setFim(true); }}>Encerrar agora</button>
    </div>
  );
}
