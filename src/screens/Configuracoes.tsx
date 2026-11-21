import { useState } from 'react';
import { useNav } from '../App';
import { db, exportarTudo, getConfig, importarTudo, saveConfig } from '../db';
import { BLOCOS } from '../data/edital';
import { useAsync, baixarArquivo, num } from '../lib/hooks';
import { baixarBackup, enviarBackup } from '../lib/github';
import { invalidarBanco } from '../store';
import type { Config } from '../types';

export function Configuracoes() {
  const nav = useNav();
  const [cfg, reload] = useAsync(() => getConfig());
  const [qb, reloadQb] = useAsync(async () => ((await db.kv.get('questoesBloco'))?.v as Record<string, number>) ?? {});
  const [gh, setGh] = useState({ token: '', repo: '' });
  const [msg, setMsg] = useState('');
  if (!cfg || !qb) return null;

  async function set(p: Partial<Config>) {
    await saveConfig(p);
    reload();
  }

  async function exportar() {
    const b = await exportarTudo();
    baixarArquivo(`painel-prova-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(b));
    await saveConfig({ ultimoBackup: Date.now() });
    reload();
  }

  async function importar(file: File) {
    try {
      const txt = await file.text();
      await importarTudo(JSON.parse(txt));
      invalidarBanco();
      nav.toast('Backup restaurado.');
      reload();
    } catch (e) {
      setMsg('Não consegui restaurar: ' + (e as Error).message);
    }
  }

  async function syncEnviar() {
    try {
      setMsg('Enviando…');
      const b = await exportarTudo();
      await enviarBackup(cfg!.ghToken!, cfg!.ghRepo!, JSON.stringify(b));
      await saveConfig({ ultimoSyncGitHub: Date.now(), ultimoBackup: Date.now() });
      setMsg('Backup enviado ao GitHub.');
      reload();
    } catch (e) { setMsg((e as Error).message); }
  }
  async function syncBaixar() {
    if (!confirmar('Isto substitui os dados deste aparelho pelos do GitHub. Continuar?')) return;
    try {
      setMsg('Baixando…');
      await importarTudo(JSON.parse(await baixarBackup(cfg!.ghToken!, cfg!.ghRepo!)));
      invalidarBanco();
      setMsg('Dados restaurados do GitHub.');
      reload();
    } catch (e) { setMsg((e as Error).message); }
  }

  const Q = Math.round((8 * cfg.horasSemana) / 10) * 10;
  const somaE = BLOCOS.filter((b) => b.prova === 'E').reduce((a, b) => a + (qb[b.id] ?? b.questoes), 0);

  return (
    <div>
      <div className="card">
        <h2>Metas</h2>
        <label>Horas reais de estudo por semana (do registro de 7 dias)</label>
        <input type="number" min={2} max={40} value={cfg.horasSemana} onChange={(e) => set({ horasSemana: Math.max(2, Number(e.target.value) || 2) })} />
        <p className="tiny">Cota semanal Q = 8 × horas = <b>{Q} questões</b> (pilar 5).</p>
        <label>Nota do diagnóstico (D) — preenchida sozinha ao lançar o diagnóstico</label>
        <input type="number" step="0.01" min={0} max={10} value={cfg.diagnostico ?? ''} onChange={(e) => set({ diagnostico: e.target.value === '' ? undefined : Number(e.target.value) })} />
        <label>Meta final de nota ponderada</label>
        <input type="number" step="0.1" min={6} max={10} value={cfg.metaFinal} onChange={(e) => set({ metaFinal: Number(e.target.value) || 7.5 })} />
        <p className="tiny">Padrão 7,5 (cerca de 60 acertos). Se D vier acima de 6,5, a rampa mira 8,0 automaticamente.</p>
      </div>

      <div className="card">
        <h2>Revisão espaçada</h2>
        <label>Cartões novos por dia (teto anti-bola-de-neve)</label>
        <input type="number" min={0} max={40} value={cfg.novosPorDia} onChange={(e) => set({ novosPorDia: Math.max(0, Number(e.target.value) || 0) })} />
        <label>Retenção desejada do FSRS</label>
        <select value={cfg.retencao} onChange={(e) => set({ retencao: Number(e.target.value) })}>
          <option value={0.85}>Automática: 0,85 até dezembro e 0,90 a partir de janeiro</option>
          <option value={0.8}>0,80 (menos revisões)</option>
          <option value={0.9}>0,90</option>
          <option value={0.92}>0,92 (mais revisões)</option>
        </select>
        <label>Velocidade padrão da voz</label>
        <select value={cfg.vozRate} onChange={(e) => set({ vozRate: Number(e.target.value) })}>{[0.9, 1, 1.05, 1.15, 1.25, 1.4].map((r) => <option key={r} value={r}>{num(r, 2)}×</option>)}</select>
      </div>

      <div className="card">
        <h2>Autoavaliação inicial por bloco (0 a 3)</h2>
        <p className="tiny" style={{ marginTop: 0 }}>Só afeta o ponto de partida do modelo; as respostas corrigem o resto.</p>
        <div className="grid2">
          {BLOCOS.map((b) => (
            <div key={b.id}>
              <label>{b.curto}</label>
              <select value={cfg.autoavaliacao[b.id] ?? 0} onChange={(e) => set({ autoavaliacao: { ...cfg.autoavaliacao, [b.id]: Number(e.target.value) } })}>
                {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Questões por bloco de TI (matriz de incidência)</h2>
        <p className="tiny" style={{ marginTop: 0 }}>Estimativa do pilar 4 até você contar as questões das provas FCC de 2024–2025 na semana 1. Ajuste aqui: muda a prioridade e a montagem dos simulados. Soma atual: <b>{somaE}</b> de 50.</p>
        <div className="grid2">
          {BLOCOS.filter((b) => b.prova === 'E').map((b) => (
            <div key={b.id}>
              <label>{b.curto} (estimativa {b.questoes})</label>
              <input type="number" min={0} max={20} value={qb[b.id] ?? b.questoes} onChange={async (e) => { await db.kv.put({ k: 'questoesBloco', v: { ...qb, [b.id]: Math.max(0, Number(e.target.value) || 0) } }); reloadQb(); }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Backup</h2>
        <p className="small">Os dados ficam só neste aparelho. Faça backup todo domingo: se o navegador for limpo, o progresso se perde.</p>
        <p className="tiny">Último backup: {cfg.ultimoBackup ? new Date(cfg.ultimoBackup).toLocaleString('pt-BR') : 'nunca'}</p>
        <div className="row">
          <button className="btn primary" onClick={exportar}>Exportar backup (arquivo)</button>
          <label className="btn" style={{ margin: 0, color: 'var(--ink)' }}>
            Restaurar de arquivo
            <input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="card">
        <h2>Sincronizar com o GitHub (opcional)</h2>
        <p className="small muted">Guarda o backup num repositório <b>privado</b> seu, para passar os dados entre tablet e celular. Crie um repositório privado (ex.: <code>estudo-dados</code>) e um token “fine-grained” com permissão <i>Contents: Read and write</i> só nele.</p>
        {cfg.ghToken && cfg.ghRepo ? (
          <>
            <p className="small">Conectado a <b>{cfg.ghRepo}</b>. Último envio: {cfg.ultimoSyncGitHub ? new Date(cfg.ultimoSyncGitHub).toLocaleString('pt-BR') : 'nunca'}.</p>
            <div className="row">
              <button className="btn primary" onClick={syncEnviar}>Enviar agora</button>
              <button className="btn" onClick={syncBaixar}>Baixar do GitHub</button>
              <button className="btn ghost danger" onClick={() => set({ ghToken: undefined, ghRepo: undefined })}>Desconectar</button>
            </div>
          </>
        ) : (
          <>
            <label>Repositório (usuario/nome)</label>
            <input type="text" value={gh.repo} placeholder="chirlanio1/estudo-dados" onChange={(e) => setGh({ ...gh, repo: e.target.value.trim() })} />
            <label>Token</label>
            <input type="password" value={gh.token} placeholder="github_pat_..." onChange={(e) => setGh({ ...gh, token: e.target.value.trim() })} autoComplete="off" />
            <button className="btn" style={{ marginTop: 8 }} disabled={!gh.repo.includes('/') || !gh.token} onClick={() => set({ ghRepo: gh.repo, ghToken: gh.token })}>Salvar</button>
          </>
        )}
        {msg && <p className="small">{msg}</p>}
      </div>

      <div className="card">
        <h2>Zerar tudo</h2>
        <p className="tiny">Apaga respostas, cartões, simulados e configurações deste aparelho. Faça backup antes.</p>
        <button className="btn danger" onClick={async () => { if (confirmar('Apagar todos os dados deste aparelho?')) { await db.delete(); location.reload(); } }}>Apagar todos os dados</button>
      </div>
    </div>
  );
}

function confirmar(t: string) {
  // eslint-disable-next-line no-alert
  return window.confirm(t);
}
