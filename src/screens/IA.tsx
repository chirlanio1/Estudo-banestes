import { useState } from 'react';
import { db, getConfig, saveConfig } from '../db';
import { banco, invalidarBanco } from '../store';
import { BLOCOS, NOME_TOPICO, TOPICO_PARA_BLOCO } from '../data/edital';
import { normalizarQuestao } from './Importar';
import { useAsync } from '../lib/hooks';
import type { Questao } from '../types';

const MODELO = 'claude-opus-5-5';
const TOPICOS = BLOCOS.flatMap((b) => b.subtopicos.map((s) => s.id));

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['questoes'],
  properties: {
    questoes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['topico', 'dif', 'enunciado', 'codigo', 'alternativas', 'correta', 'explicacao', 'fonte'],
        properties: {
          topico: { type: 'string', enum: TOPICOS },
          dif: { type: 'integer', enum: [1, 2, 3] },
          enunciado: { type: 'string' },
          codigo: { type: 'string', description: 'Trecho de código, ou string vazia' },
          alternativas: { type: 'array', items: { type: 'string' } },
          correta: { type: 'integer', enum: [0, 1, 2, 3, 4] },
          explicacao: { type: 'string' },
          fonte: { type: 'string' }
        }
      }
    }
  }
};

function prompt(alvos: { topico: string; exemplos: Questao[] }[], n: number) {
  const blocos = alvos.map((a) => `Tópico ${a.topico} (${NOME_TOPICO[a.topico]}). Questões que o aluno errou:\n` +
    a.exemplos.map((q) => `- ${q.enunciado.slice(0, 400)}\n  Correta: ${q.alternativas[q.correta]}\n  Comentário: ${q.explicacao.slice(0, 300)}`).join('\n')).join('\n\n');
  return `Aja como elaborador da Fundação Carlos Chagas (FCC). Crie ${n} questões inéditas de múltipla escolha para o cargo Analista de TI – Desenvolvimento de Sistemas do Banestes (edital 2027), em português do Brasil.

Objetivo: treinar exatamente os conceitos que o aluno errou abaixo, por outro ângulo (não repita as questões).

Regras:
- 5 alternativas, apenas uma correta; o campo "correta" é o índice 0–4.
- Varie a posição da correta e o formato: afirmação direta, itens I-II-III ("Está correto o que consta APENAS em"), lacunas, situação-problema e leitura de código quando couber.
- Distratores no estilo FCC: troca de uma palavra-chave, definição certa com nome errado, versão antiga da norma, termos parecidos.
- Normas na versão do edital: PMBOK 8ª ed., ITIL Version 5, COBIT 2019, ISO/IEC 27001:2022 e 27002:2022, ISO/IEC 25010, OWASP Top 10:2021, WCAG 2.2, Lei 14.133/2021, LGPD (Lei 13.709/2018).
- Uma questão não pode entregar a resposta de outra.
- Em "explicacao": por que a correta está certa e por que cada errada está errada, em linguagem simples.
- Em "fonte": a norma, lei, documentação ou livro de referência em que a resposta se apoia (ex.: "Scrum Guide 2020", "LGPD, art. 7º"). Não invente número de artigo: se não tiver certeza, cite só a norma.
- Código: só se você tiver certeza da saída; "codigo" vazio quando não houver.

${blocos}`;
}

export function IAGerar() {
  const [cfg, reload] = useAsync(() => getConfig());
  const [chave, setChave] = useState('');
  const [n, setN] = useState(5);
  const [topicoManual, setTopicoManual] = useState('');
  const [estado, setEstado] = useState<'pronto' | 'gerando' | 'ok' | 'erro'>('pronto');
  const [msg, setMsg] = useState('');
  const online = navigator.onLine;

  async function salvarChave() {
    await saveConfig({ apiKey: chave.trim() || undefined });
    setChave('');
    reload();
  }

  async function gerar() {
    if (!cfg?.apiKey) return;
    setEstado('gerando');
    setMsg('');
    try {
      const bq = await banco();
      const m = new Map(bq.map((q) => [q.id, q]));
      let alvos: { topico: string; exemplos: Questao[] }[] = [];
      if (topicoManual) {
        alvos = [{ topico: topicoManual, exemplos: bq.filter((q) => q.topico === topicoManual).slice(0, 2) }];
      } else {
        const erros = await db.attempts.filter((a) => !a.correta || a.chute).reverse().limit(40).toArray();
        const porTopico = new Map<string, Questao[]>();
        for (const e of erros) {
          const q = m.get(e.qid);
          if (!q) continue;
          const l = porTopico.get(q.topico) ?? [];
          if (l.length < 3 && !l.includes(q)) l.push(q);
          porTopico.set(q.topico, l);
        }
        alvos = [...porTopico.entries()].slice(0, 4).map(([topico, exemplos]) => ({ topico, exemplos }));
      }
      if (!alvos.length) {
        setEstado('erro');
        return setMsg('Ainda não há erros registrados. Escolha um tópico na lista ou resolva algumas questões antes.');
      }
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: cfg.apiKey, dangerouslyAllowBrowser: true });
      const resp = await client.beta.messages.create({
        model: MODELO,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{ role: 'user', content: prompt(alvos, n) }]
      });
      if (resp.stop_reason === 'refusal') throw new Error('O modelo recusou o pedido. Tente outro tópico.');
      if (resp.stop_reason === 'max_tokens') throw new Error('A resposta ficou longa demais. Peça menos questões.');
      const txt = resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
      const dados = JSON.parse(txt) as { questoes: any[] };
      const qs = dados.questoes
        .map((x, i) => normalizarQuestao({ ...x, origem: 'ia', id: `ia-${Date.now().toString(36)}-${i}`, codigo: x.codigo || undefined }, i))
        .filter((q): q is Questao => !!q && !!TOPICO_PARA_BLOCO[q.topico])
        .map((q) => ({ ...q, verificacao: 'conferir' as const, origem: 'ia' as const }));
      await db.questoesExtra.bulkPut(qs);
      invalidarBanco();
      setEstado('ok');
      setMsg(`${qs.length} questões novas entraram no banco, marcadas como “gerada por IA no app” e “não verificada”. Elas não contam no acerto FCC do painel.`);
    } catch (e) {
      setEstado('erro');
      const err = e as any;
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      if (err instanceof Anthropic.AuthenticationError) setMsg('Chave de API inválida. Confira em console.anthropic.com.');
      else if (err instanceof Anthropic.RateLimitError) setMsg('Limite de uso atingido. Tente de novo em alguns minutos.');
      else if (err instanceof Anthropic.APIConnectionError) setMsg('Sem conexão com a API. Verifique a internet.');
      else if (err instanceof Anthropic.APIError) setMsg(`Erro da API (${err.status ?? ''}): ${err.message}`);
      else setMsg('Falhou: ' + (err?.message ?? String(err)));
    }
  }

  if (!cfg) return null;
  return (
    <div>
      <div className="card">
        <h2>Questões novas a partir dos seus erros</h2>
        <p className="small">Opcional e só com internet. O app manda para a IA as questões que você errou e recebe questões inéditas sobre os mesmos conceitos, no estilo FCC. O resto do app funciona 100% offline sem isso.</p>
        <p className="tiny">Custo: cada geração de 5 questões costuma ficar em centavos de dólar, cobrados na sua conta da Anthropic. Modelo: {MODELO}.</p>
      </div>
      {!cfg.apiKey ? (
        <div className="card">
          <h2>1. Cole a sua chave de API</h2>
          <ol className="small">
            <li>Crie uma conta em <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a> e adicione um pequeno crédito.</li>
            <li>Em “API Keys”, crie uma chave e cole aqui.</li>
          </ol>
          <input type="password" value={chave} onChange={(e) => setChave(e.target.value)} placeholder="sk-ant-..." autoComplete="off" />
          <p className="tiny">A chave fica só neste aparelho e não vai no backup. Use uma chave exclusiva para este app, com limite de gasto definido no console.</p>
          <button className="btn primary" onClick={salvarChave} disabled={!chave.trim()}>Salvar chave</button>
        </div>
      ) : (
        <div className="card">
          <h2>Gerar</h2>
          <label>Tópico</label>
          <select value={topicoManual} onChange={(e) => setTopicoManual(e.target.value)}>
            <option value="">Automático: os tópicos dos meus últimos erros</option>
            {BLOCOS.map((b) => <optgroup key={b.id} label={b.nome}>{b.subtopicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</optgroup>)}
          </select>
          <label>Quantidade</label>
          <select value={n} onChange={(e) => setN(Number(e.target.value))}>{[3, 5, 8, 10].map((x) => <option key={x} value={x}>{x} questões</option>)}</select>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" disabled={!online || estado === 'gerando'} onClick={gerar}>{estado === 'gerando' ? 'Gerando… (até 1 minuto)' : 'Gerar questões'}</button>
            <button className="btn ghost danger" onClick={async () => { await saveConfig({ apiKey: undefined }); reload(); }}>Remover chave</button>
          </div>
          {!online && <p className="small" style={{ color: 'var(--warn)' }}>Você está offline. Conecte-se para gerar.</p>}
          {msg && <p className="small" style={{ color: estado === 'erro' ? 'var(--bad)' : 'var(--ok)' }}>{msg}</p>}
          <p className="tiny">Antes de confiar: confira a alternativa correta na fonte citada (checklist do pilar 4). IA erra com segurança, principalmente em artigo de lei e número de norma.</p>
        </div>
      )}
    </div>
  );
}
