import { useNav } from '../App';
import { BLOCOS, NOME_TOPICO, TOPICO_PARA_BLOCO, BLOCO_POR_ID } from '../data/edital';
import { KITS } from '../data/kits';
import { contexto } from '../store';
import { dominioPorBloco } from '../engine/priority';
import { faixaAcerto } from '../engine/scoring';
import { useAsync, pct } from '../lib/hooks';
import type { Kit } from '../types';
import { MapaMental } from '../components/MapaMental';
import { AudioResumo } from '../components/Audio';

const COR: Record<string, string> = { verde: 'ok', amarelo: 'warn', vermelho: 'bad', neutro: '' };

export function Trilhas() {
  const nav = useNav();
  const [ctx] = useAsync(() => contexto());
  if (!ctx) return <p className="muted">Carregando…</p>;
  const porBloco = new Map(dominioPorBloco(ctx.prios).map((b) => [b.bloco, b]));
  const porTopico = new Map(ctx.prios.map((p) => [p.topico, p]));
  const qtd = new Map<string, number>();
  for (const q of ctx.banco) qtd.set(q.topico, (qtd.get(q.topico) ?? 0) + 1);
  const top5 = ctx.prios.slice(0, 5);

  return (
    <div>
      <div className="card">
        <h2>Prioridades desta semana</h2>
        <p className="tiny" style={{ marginTop: 0 }}>Calculadas pelo modelo: peso na prova × o quanto falta dominar × foco da semana × tempo sem prática.</p>
        <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
          {top5.map((p) => (
            <li key={p.topico}>
              <button className="btn ghost sm" style={{ padding: '2px 4px', minHeight: 0 }} onClick={() => nav.ir({ r: 'topico', id: p.topico })}>{NOME_TOPICO[p.topico]}</button>
              <span className="tiny"> {BLOCO_POR_ID[p.bloco].curto} · domínio {pct(p.dominio)} · {p.motivo[0]}</span>
            </li>
          ))}
        </ol>
      </div>
      {(['E', 'G'] as const).map((prova) => (
        <div key={prova}>
          <h3 style={{ margin: '18px 4px 8px' }}>{prova === 'E' ? 'Conhecimentos Específicos (peso 2)' : 'Conhecimentos Gerais (peso 1)'}</h3>
          {BLOCOS.filter((b) => b.prova === prova).map((b) => {
            const d = porBloco.get(b.id)!;
            const f = d.respostas ? faixaAcerto(d.dominio) : 'neutro';
            return (
              <details key={b.id} className="card">
                <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
                  <div className="spread">
                    <b>{b.nome}</b>
                    <span className="tiny">{b.questoes} {b.estimativa ? 'questões (estim.)' : 'questões'}</span>
                  </div>
                  <div className={'bar ' + COR[f]} style={{ marginTop: 6 }}><i style={{ width: `${Math.round(d.dominio * 100)}%` }} /></div>
                  <div className="tiny">Domínio estimado {pct(d.dominio)} · {d.respostas} respostas{d.respostas === 0 ? ' · bloco ainda em construção' : ''}</div>
                </summary>
                <ul className="list" style={{ marginTop: 8 }}>
                  {b.subtopicos.map((s) => {
                    const p = porTopico.get(s.id)!;
                    return (
                      <li key={s.id}>
                        <button className="linkish" onClick={() => nav.ir({ r: 'topico', id: s.id })}>
                          <div className="spread">
                            <span>{s.nome}</span>
                            <span className="tiny">{KITS[s.id] ? 'resumo · ' : ''}{qtd.get(s.id) ?? 0} questões</span>
                          </div>
                          <div className="tiny">domínio {pct(p.dominio)} · {p.n} respostas</div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button className="btn sm" onClick={() => nav.ir({ r: 'pratica', modo: 'bloco', topicos: b.subtopicos.map((s) => s.id), titulo: b.curto, n: 10 })}>Praticar o bloco</button>
              </details>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function TopicoDetalhe({ id }: { id: string }) {
  const nav = useNav();
  const [ctx] = useAsync(() => contexto(), [id]);
  const kit = KITS[id];
  const bloco = BLOCO_POR_ID[TOPICO_PARA_BLOCO[id]];
  if (!ctx) return <p className="muted">Carregando…</p>;
  const p = ctx.prios.find((x) => x.topico === id);
  const n = ctx.banco.filter((q) => q.topico === id).length;
  return (
    <div>
      <div className="card">
        <div className="tiny">{bloco?.nome}</div>
        <h2 style={{ fontSize: 21 }}>{NOME_TOPICO[id]}</h2>
        <p className="small muted" style={{ margin: 0 }}>Domínio estimado {pct(p?.dominio)} · {p?.n ?? 0} respostas · {n} questões no banco</p>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => nav.ir({ r: 'pilula', topico: id, tipo: 'pilula' })}>Fazer uma pílula deste tópico</button>
          <button className="btn" disabled={!n} onClick={() => nav.ir({ r: 'pratica', modo: 'bloco', topicos: [id], titulo: NOME_TOPICO[id], n: 8 })}>Só questões</button>
        </div>
      </div>
      {kit ? <KitView kit={kit} /> : (
        <div className="card">
          <p>Resumo deste tópico ainda não foi produzido. Ele entra nas próximas atualizações, sempre à frente do cronograma.</p>
          <button className="btn" onClick={() => nav.ir({ r: 'ia' })}>Gerar questões com IA (online)</button>
        </div>
      )}
    </div>
  );
}

export function KitView({ kit, compacto }: { kit: Kit; compacto?: boolean }) {
  const texto = [kit.titulo, ...kit.resumo, 'Como a FCC cobra: ' + kit.comoCobra, 'Pegadinhas: ' + kit.pegadinhas.join(' ')].join(' ');
  return (
    <div>
      <div className="card">
        <div className="spread">
          <h2>Resumo FCC</h2>
          <span className={'pill ' + (kit.verificacao === 'conferir' ? 'warn' : 'ok')}>{kit.verificacao === 'conferir' ? 'conferir na fonte' : 'revisado'}</span>
        </div>
        <AudioResumo texto={texto} />
        <ul style={{ paddingLeft: 18 }}>{kit.resumo.map((r) => <li key={r} style={{ marginBottom: 6 }}>{r}</li>)}</ul>
        <h3>Como a FCC cobra</h3>
        <p className="small">{kit.comoCobra}</p>
        <h3>3 pegadinhas</h3>
        <ul className="small" style={{ paddingLeft: 18 }}>{kit.pegadinhas.map((r) => <li key={r}>{r}</li>)}</ul>
      </div>
      <div className="card">
        <h2>Mapa mental</h2>
        <MapaMental mapa={kit.mapa} />
        <p className="tiny">Dica: antes de olhar, tente desenhar o mapa de memória numa folha. Depois compare.</p>
      </div>
      {!compacto && (
        <div className="card">
          <h2>Cartões deste tópico</h2>
          <p className="tiny" style={{ marginTop: 0 }}>Entram na sua revisão espaçada depois que você faz a pílula do tópico.</p>
          <ul className="list small">{kit.cartoes.map((c) => <li key={c.f}><b>{c.f}</b><br />{c.v}</li>)}</ul>
          <p className="tiny">Fontes: {kit.fontes.join('; ')}</p>
        </div>
      )}
    </div>
  );
}
