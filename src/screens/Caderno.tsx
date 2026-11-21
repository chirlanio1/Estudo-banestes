import { useNav } from '../App';
import { db } from '../db';
import { banco } from '../store';
import { NOME_TOPICO } from '../data/edital';
import { useAsync } from '../lib/hooks';

export function Caderno() {
  const nav = useNav();
  const [d, reload] = useAsync(async () => {
    const [pegs, atts, bq] = await Promise.all([db.pegadinhas.orderBy('ts').reverse().toArray(), db.attempts.toArray(), banco()]);
    const m = new Map(bq.map((q) => [q.id, q]));
    const erros = atts.filter((a) => !a.correta || a.chute).sort((a, b) => b.ts - a.ts);
    return { pegs, erros, m };
  });
  if (!d) return null;
  const vistos = new Set<string>();
  const unicos = d.erros.filter((e) => (vistos.has(e.qid) ? false : (vistos.add(e.qid), true)));
  return (
    <div>
      <div className="card">
        <div className="spread"><h2>Caderno de pegadinhas FCC</h2><span className="pill">{d.pegs.length}</span></div>
        <p className="tiny" style={{ marginTop: 0 }}>Releia na véspera de cada simulado. A FCC repete padrões: palavra trocada, exceção, versão antiga da norma, alternativas quase iguais.</p>
        {!d.pegs.length ? <p className="small muted">Vazio por enquanto. Quando marcar “caí na pegadinha” num erro, ela vem para cá.</p> : (
          <ul className="list small">
            {d.pegs.map((p) => (
              <li key={p.id}>
                <div className="tiny">{NOME_TOPICO[p.topico]}</div>
                <div>{d.m.get(p.qid)?.enunciado.slice(0, 160)}…</div>
                <div className="explic" style={{ marginTop: 6 }}>{p.texto}</div>
                <button className="btn sm ghost danger" onClick={async () => { await db.pegadinhas.delete(p.id!); reload(); }}>Já domino, remover</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card">
        <div className="spread"><h2>Erros registrados</h2><button className="btn sm primary" onClick={() => nav.ir({ r: 'pratica', modo: 'erros', titulo: 'Refazer meus erros', n: 20 })}>Refazer 20</button></div>
        {!unicos.length ? <p className="small muted">Nenhum erro ainda.</p> : (
          <table className="t">
            <thead><tr><th>Data</th><th>Tópico</th><th>Causa</th></tr></thead>
            <tbody>{unicos.slice(0, 80).map((e) => (
              <tr key={e.id}><td className="tiny">{new Date(e.ts).toLocaleDateString('pt-BR')}</td><td>{NOME_TOPICO[e.topico]}</td><td className="small">{e.causa ?? (e.chute ? 'chute' : '—')}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
