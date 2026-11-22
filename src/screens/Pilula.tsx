import { useEffect, useMemo, useState } from 'react';
import { useNav } from '../App';
import { contexto, concluirSessao, iniciarSessao, marcarTeoriaVista } from '../store';
import { escolherTopicoPilula } from '../engine/missions';
import { escolherQuestoes, embaralhar } from '../engine/selector';
import { faseDe, semanaDe } from '../engine/scoring';
import { sortearTopicos } from '../engine/priority';
import { KITS } from '../data/kits';
import { ritmoDe } from '../lib/ritmo';
import { getConfig } from '../db';
import { NOME_TOPICO, TOPICO_PARA_BLOCO } from '../data/edital';
import type { Questao, Sessao } from '../types';
import { QuestaoCard, type ResultadoQuestao } from '../components/QuestaoCard';
import { KitView } from './Trilhas';
import { Revisar } from './Revisar';
import { AudioResumo } from '../components/Audio';
import { PONTOS } from '../engine/gamification';

type Etapa = 'carregando' | 'pre' | 'teoria' | 'recordacao' | 'questoes' | 'cartoes' | 'audio' | 'captura' | 'fim';

interface Plano {
  topico: string;
  pre: Questao[];
  questoes: Questao[];
  etapas: Etapa[];
}

const ROTULO: Record<Etapa, string> = {
  carregando: '', pre: 'Pré-teste (3 min)', teoria: 'Teoria mínima (8 min)', recordacao: 'Recordação ativa (4 min)',
  questoes: 'Questões (8 min)', cartoes: 'Cartões vencidos', audio: 'Áudio-resumo', captura: 'Captura (2 min)', fim: 'Concluído'
};

export function Pilula({ topico, tipo }: { topico?: string; tipo: 'pilula' | 'minima' | 'esgotado' }) {
  const nav = useNav();
  const [plano, setPlano] = useState<Plano | null>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [etapa, setEtapa] = useState<Etapa>('carregando');
  const [i, setI] = useState(0);
  const [resultados, setResultados] = useState<(ResultadoQuestao & { q: Questao })[]>([]);
  const [lembrei, setLembrei] = useState('');
  const [mostrarComparar, setMostrarComparar] = useState(false);
  const [vazio, setVazio] = useState(false);

  useEffect(() => {
    (async () => {
      const ctx = await contexto();
      const rt = ritmoDe(await getConfig());
      let t = topico;
      if (!t || (tipo === 'esgotado' && !KITS[t])) t = escolherTopicoPilula(ctx.prios)?.topico;
      if (!t) return setVazio(true);
      const semana = semanaDe(new Date());
      const sel = { qstate: ctx.qstate, thetaDe: ctx.thetaDe, agora: Date.now() };
      let pre: Questao[] = [];
      let questoes: Questao[] = [];
      let etapas: Etapa[];
      if (tipo === 'pilula') {
        // pré-teste só com questões inéditas do tópico
        const ineditas = ctx.banco.filter((q) => q.topico === t && !ctx.qstate.get(q.id)?.vistas);
        pre = embaralhar(ineditas).slice(0, rt.pre);
        const excl = new Set(pre.map((q) => q.id));
        questoes = escolherQuestoes(ctx.banco, [t], rt.questoes, { ...sel, excluir: excl });
        // banco ainda curto no tópico: completa com subtópicos do mesmo bloco (mais próximos do assunto)
        if (questoes.length < Math.min(5, rt.questoes)) {
          const bloco = TOPICO_PARA_BLOCO[t];
          const irmaos = ctx.prios.filter((p) => p.bloco === bloco && p.topico !== t).map((p) => p.topico);
          const ja = new Set([...excl, ...questoes.map((q) => q.id)]);
          questoes = [...questoes, ...escolherQuestoes(ctx.banco, irmaos, rt.questoes - questoes.length, { ...sel, excluir: ja })];
        }
        // intercalação a partir da fase de consolidação: 2 questões de tópicos já vistos
        if (faseDe(semana).intercalar) {
          const vistos = ctx.prios.filter((p) => p.n > 0 && p.topico !== t);
          const outros = sortearTopicos(vistos, 2);
          questoes = embaralhar([...questoes, ...escolherQuestoes(ctx.banco, outros, 2, { ...sel, excluir: new Set([...excl, ...questoes.map((q) => q.id)]) })]);
        }
        etapas = [...(pre.length ? (['pre'] as Etapa[]) : []), 'teoria', 'recordacao', 'questoes', 'captura', 'fim'];
      } else if (tipo === 'minima') {
        const tops = [t, ...sortearTopicos(ctx.prios.filter((p) => p.topico !== t), 2)];
        questoes = escolherQuestoes(ctx.banco, tops, rt.minima, sel);
        etapas = ['cartoes', 'questoes', 'captura', 'fim'];
      } else {
        etapas = ['audio', 'cartoes', 'fim'];
      }
      const s = await iniciarSessao(tipo, t);
      setSessao(s);
      setPlano({ topico: t, pre, questoes, etapas });
      setEtapa(etapas[0]);
    })();
  }, [topico, tipo]);

  const kit = plano ? KITS[plano.topico] : undefined;
  const textoAudio = useMemo(() => (kit ? [kit.titulo, ...kit.resumo, 'Como a FCC cobra: ' + kit.comoCobra, 'Pegadinhas: ' + kit.pegadinhas.join(' ')].join(' ') : ''), [kit]);

  if (vazio) return <div className="card">Ainda não há questões para montar a missão. Importe questões em Mais &gt; Importar.</div>;
  if (!plano || !sessao) return <p className="muted">Montando a sua missão…</p>;

  const idx = plano.etapas.indexOf(etapa);
  function avancar() {
    const prox = plano!.etapas[idx + 1];
    setI(0);
    if (prox === 'fim') finalizar();
    setEtapa(prox);
  }
  async function finalizar() {
    await concluirSessao(sessao!.id, tipo === 'pilula' ? 'pilula' : tipo === 'minima' ? 'minima' : 'esgotado');
  }

  const lista = etapa === 'pre' ? plano.pre : plano.questoes;
  const erros = resultados.filter((r) => !r.correta);

  return (
    <div>
      <div className="steps" aria-hidden="true">
        {plano.etapas.slice(0, -1).map((e, k) => <i key={e} className={k < idx ? 'done' : k === idx ? 'on' : ''} />)}
      </div>
      <div className="spread small muted" style={{ marginBottom: 10 }}>
        <span><b>{ROTULO[etapa]}</b>{(etapa === 'pre' || etapa === 'questoes') && lista.length ? ` · ${i + 1} de ${lista.length}` : ''}</span>
        <span>{NOME_TOPICO[plano.topico]}</span>
      </div>

      {(etapa === 'pre' || etapa === 'questoes') && (
        lista.length === 0 ? (
          <div className="card">
            <p>Não há mais questões inéditas aqui. Importe questões FCC deste tópico ou gere novas com IA.</p>
            <button className="btn primary" onClick={avancar}>Continuar</button>
          </div>
        ) : (
          <QuestaoCard
            key={etapa + i}
            q={lista[i]}
            sessao={sessao.id}
            pos={resultados.length + 1}
            inicioSessao={sessao.inicio}
            modo={etapa === 'pre' ? 'pre' : 'pilula'}
            rotuloProxima={i + 1 < lista.length ? 'Próxima' : 'Continuar'}
            onProxima={(r) => {
              setResultados((rs) => [...rs, { ...r, q: lista[i] }]);
              if (i + 1 < lista.length) setI(i + 1);
              else avancar();
            }}
          />
        )
      )}

      {etapa === 'teoria' && (
        <div>
          {kit ? <KitView kit={kit} compacto /> : (
            <div className="card">
              <p>Este tópico ainda não tem resumo no app. Leia a fonte oficial por 8 minutos (veja Mais &gt; Provas oficiais) ou gere um resumo com IA quando estiver online.</p>
            </div>
          )}
          <button className="btn primary big" onClick={async () => { await marcarTeoriaVista(plano.topico); avancar(); }}>Li a teoria, seguir</button>
        </div>
      )}

      {etapa === 'recordacao' && (
        <div className="card">
          <h2>Feche o material e escreva o que lembra</h2>
          <p className="small muted">Em 3 frases, como se explicasse a um aluno da 2ª série (técnica Feynman). Recordar dá mais trabalho que reler, e é por isso que fixa.</p>
          <textarea value={lembrei} onChange={(e) => setLembrei(e.target.value)} placeholder="Escreva aqui…" aria-label="O que você lembrou" />
          {!mostrarComparar ? (
            <button className="btn" style={{ marginTop: 10 }} onClick={() => setMostrarComparar(true)}>Comparar com o resumo</button>
          ) : (
            kit && (
              <div className="explic" style={{ marginTop: 10 }}>
                <b>Pontos-chave:</b>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{kit.cartoes.slice(0, 4).map((c) => <li key={c.f}>{c.f} <b>{c.v}</b></li>)}</ul>
              </div>
            )
          )}
          <button className="btn primary big" style={{ marginTop: 10 }} onClick={avancar}>Ir para as questões</button>
        </div>
      )}

      {etapa === 'cartoes' && (
        <div>
          <Revisar embutido limite={tipo === 'esgotado' ? 15 : 20} onFim={avancar} />
        </div>
      )}

      {etapa === 'audio' && (
        <div className="card">
          <h2>Ouça o resumo de {NOME_TOPICO[plano.topico]}</h2>
          <p className="small muted">Pode ouvir de olhos fechados. Depois, se quiser, passe pelos cartões.</p>
          {kit && <AudioResumo texto={textoAudio} />}
          <button className="btn primary big" style={{ marginTop: 12 }} onClick={avancar}>Seguir para os cartões</button>
        </div>
      )}

      {etapa === 'captura' && (
        <div className="card">
          <h2>Captura</h2>
          <p>Você fez <b>{resultados.length}</b> questões e acertou <b>{resultados.filter((r) => r.correta).length}</b>.</p>
          {erros.length ? (
            <>
              <p className="small">Cada erro já virou ação: cartão, volta à teoria ou caderno de pegadinhas. Confira:</p>
              <ul className="small">{erros.map((r) => <li key={r.q.id}>{NOME_TOPICO[r.q.topico]}: {r.causa ? causaTexto(r.causa) : 'sem causa marcada'}</li>)}</ul>
            </>
          ) : <p className="small">Nenhum erro nesta rodada. O app vai subir a dificuldade aos poucos.</p>}
          <button className="btn primary big" onClick={avancar}>Concluir missão</button>
        </div>
      )}

      {etapa === 'fim' && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22 }}>Missão cumprida</h2>
          <p>+{tipo === 'pilula' ? PONTOS.pilula : PONTOS.minima} pontos. Um quadrado a mais na sua semana.</p>
          <p className="small muted">Pausa de 20 segundos olhando para longe (regra 20-20-20) faz bem aos olhos.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn primary" onClick={() => nav.ir({ r: 'hoje' })}>Voltar ao início</button>
            {tipo === 'pilula' && <button className="btn" onClick={() => nav.ir({ r: 'pratica', modo: 'livre', titulo: 'Bateria extra', n: 8 })}>Bateria extra de 8 questões</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function causaTexto(c: string) {
  return ({ 'nao-sabia': 'não sabia → teoria + cartão', confundi: 'confundiu → cartão de contraste', pegadinha: 'pegadinha → caderno', atencao: 'atenção → regra de leitura', tempo: 'tempo → ordem de ataque', chute: 'chute → tratado como lacuna' } as Record<string, string>)[c] ?? c;
}
