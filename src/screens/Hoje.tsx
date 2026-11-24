import { useNav } from '../App';
import { db, getConfig } from '../db';
import { ritmoDe } from '../lib/ritmo';
import { quandoTexto, useStatusSync } from '../components/SyncCard';
import { missaoDoDia } from '../engine/missions';
import { nivelDe, semanaAtual, sequencia } from '../engine/gamification';
import { diasAte, hojeISO } from '../engine/scoring';
import { diasCumpridos, pontosTotais } from '../store';
import { useAsync } from '../lib/hooks';
import { DATAS } from '../data/edital';

export function Hoje() {
  const nav = useNav();
  const sync = useStatusSync();
  const [dados, reload] = useAsync(async () => {
    const [m, pts, dias, hojeLog, cfg] = await Promise.all([missaoDoDia(), pontosTotais(), diasCumpridos(), db.dias.get(hojeISO()), getConfig()]);
    return { m, pts, dias, hojeLog, cfg };
  });
  if (!dados) return <p className="muted">Carregando…</p>;
  const { m, pts, dias, hojeLog, cfg } = dados;
  const rt = ritmoDe(cfg);
  const nivel = nivelDe(pts);
  const seq = sequencia(dias);
  const semana = semanaAtual(dias);
  const feitoHoje = dias.has(hojeISO());
  const faltam = diasAte(DATAS.prova);

  async function esgotado() {
    await db.dias.put({ ...(hojeLog ?? { data: hojeISO() }), esgotado: true });
    reload();
  }
  async function sono(h: number) {
    await db.dias.put({ ...(hojeLog ?? { data: hojeISO() }), sono: h });
    nav.toast('Sono registrado.');
    reload();
  }

  const minutosCartoes = Math.ceil((m.cartoes.vencidos * 8 + m.cartoes.novos * 20) / 60);

  return (
    <div>
      <div className="card hero">
        <div className="spread tiny">
          <span>Semana {Math.max(1, m.semana)} · {m.foco ?? 'revisão final'}</span>
          <span>{faltam > 0 ? `${faltam} dias para a prova` : faltam === 0 ? 'Hoje é a prova' : 'Prova realizada'}</span>
        </div>
        <h2 style={{ fontSize: 22, margin: '8px 0 4px' }}>
          {feitoHoje ? 'Missão de hoje cumprida' : m.tipo === 'simulado' ? 'Hoje é dia de simulado' : m.tipo === 'esgotado' ? 'Missão leve: 10 minutos' : m.tipo === 'minima' ? 'Missão mínima: 15 minutos' : `Pílula de ${rt.minutos} min: ${m.nomeTopico ?? ''}`}
        </h2>
        <p className="muted small" style={{ margin: '0 0 12px' }}>{m.motivo.join(' · ')}</p>
        {m.tipo === 'simulado' ? (
          <button className="btn primary big" onClick={() => nav.ir({ r: 'simulado' })}>Ir para o simulado</button>
        ) : (
          <button className="btn primary big" onClick={() => nav.ir({ r: 'pilula', topico: m.topico, tipo: m.tipo === 'simulado' ? 'pilula' : m.tipo })}>
            {feitoHoje ? 'Fazer mais uma pílula' : 'Começar'}
          </button>
        )}
        {(m.cartoes.vencidos + m.cartoes.novos > 0) && (
          <button className="btn big" style={{ marginTop: 8, background: 'transparent', color: 'inherit', borderColor: 'rgba(255,255,255,.4)' }} onClick={() => nav.ir({ r: 'revisar' })}>
            Revisar {m.cartoes.vencidos + m.cartoes.novos} cartões (~{minutosCartoes} min)
          </button>
        )}
        <button className="linkbtn tiny" onClick={() => nav.ir({ r: 'config' })}>
          Ritmo de estudo: <b>{rt.rotulo}</b> ({rt.questoes} questões por pílula) · ajustar
        </button>
        <button className="linkbtn tiny" style={{ marginTop: 0 }} onClick={() => nav.ir({ r: 'config' })}>
          {sync.tipo === 'ok'
            ? sync.erro ? 'Sincronização pendente (sem conexão) · ver' : sync.sincronizando ? 'Sincronizando com seus aparelhos…' : `Sincronizado ${quandoTexto(sync.ultima)}`
            : 'Dados só neste aparelho · conectar conta'}
        </button>
      </div>

      {m.avisos.map((a) => (
        <div key={a} className="card" style={{ background: 'var(--warn-soft)', borderColor: 'transparent' }}>
          <b>Atenção ao prazo</b>
          <div className="small">{a}</div>
          {a.includes('Inscrição') || a.includes('Boleto') ? (
            <div className="row" style={{ marginTop: 8 }}>
              <a className="btn sm" href="https://www.concursosfcc.com.br" target="_blank" rel="noreferrer">Site da FCC</a>
              <button className="btn sm" onClick={async () => { await db.kv.put({ k: 'inscrito', v: true }); reload(); }}>Já fiz inscrição e paguei</button>
            </div>
          ) : null}
        </div>
      ))}

      <div className="card">
        <div className="spread">
          <h2>Sua semana</h2>
          <span className="pill info">{seq} {seq === 1 ? 'dia' : 'dias'} seguidos</span>
        </div>
        <div className="week" aria-label="Dias cumpridos na semana">
          {semana.map((d) => (
            <div key={d.data}>{d.rotulo}<b className={(d.feito ? 'on ' : '') + (d.hoje ? 'today' : '')} title={d.data} /></div>
          ))}
        </div>
        <p className="tiny" style={{ marginBottom: 0 }}>A sequência aceita 1 dia de folga por semana sem zerar. Missão mínima e “hoje estou esgotado” contam como dia cumprido.</p>
      </div>

      <div className="card">
        <div className="spread">
          <div>
            <div className="tiny">Nível</div>
            <b style={{ fontSize: 18 }}>{nivel.nome}</b>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tiny">Pontos</div>
            <b style={{ fontSize: 18 }}>{pts}</b>
          </div>
        </div>
        {nivel.proximo && (
          <>
            <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${Math.round(nivel.progresso * 100)}%` }} /></div>
            <div className="tiny">Faltam {nivel.faltam} pontos para {nivel.proximo}. Pontos vêm de constância e de erros capturados, nunca de nota.</div>
          </>
        )}
      </div>

      {m.ajustes.length > 0 && (
        <div className="card">
          <h2>O que o app aprendeu sobre você</h2>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{m.ajustes.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <h2>Registro rápido de sono</h2>
          <p className="tiny" style={{ marginTop: 0 }}>Quantas horas dormiu esta noite?</p>
          <div className="row">
            {[5, 6, 7, 8, 9].map((h) => (
              <button key={h} className={'btn sm ' + (hojeLog?.sono === h ? 'primary' : '')} onClick={() => sono(h)}>{h === 5 ? '≤5' : h === 9 ? '9+' : h} h</button>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Dia difícil?</h2>
          <p className="tiny" style={{ marginTop: 0 }}>Troca a missão por 10 minutos de áudio ou cartões. O dia conta como cumprido.</p>
          <button className="btn" disabled={!!hojeLog?.esgotado} onClick={esgotado}>{hojeLog?.esgotado ? 'Modo leve ativado' : 'Hoje estou esgotado'}</button>
        </div>
      </div>

      <div className="card">
        <h2>Outras formas de estudar agora</h2>
        <div className="row">
          <button className="btn" onClick={() => nav.ir({ r: 'pratica', modo: 'livre', titulo: 'Questões inteligentes', n: 10 })}>10 questões inteligentes</button>
          <button className="btn" onClick={() => nav.ir({ r: 'pratica', modo: 'erros', titulo: 'Refazer meus erros', n: 20 })}>Refazer meus erros</button>
          <button className="btn" onClick={() => nav.ir({ r: 'trilhas' })}>Escolher um tópico</button>
        </div>
      </div>
    </div>
  );
}
