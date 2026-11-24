import { useState } from 'react';
import { useNav } from '../App';
import { apagarEspelho, db, exportarTudo, getConfig, importarTudo, saveConfig } from '../db';
import { RITMOS, type Ritmo } from '../lib/ritmo';
import { SyncCard } from '../components/SyncCard';
import { BLOCOS } from '../data/edital';
import { useAsync, baixarArquivo, num } from '../lib/hooks';
import { invalidarBanco } from '../store';
import type { Config } from '../types';

export function Configuracoes() {
  const nav = useNav();
  const [cfg, reload] = useAsync(() => getConfig());
  const [qb, reloadQb] = useAsync(async () => ((await db.kv.get('questoesBloco'))?.v as Record<string, number>) ?? {});
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

  const Q = Math.round((8 * cfg.horasSemana) / 10) * 10;
  const somaE = BLOCOS.filter((b) => b.prova === 'E').reduce((a, b) => a + (qb[b.id] ?? b.questoes), 0);

  return (
    <div>
      <SyncCard />
      <div className="card">
        <h2>Ritmo de estudo</h2>
        <p className="small muted" style={{ marginTop: 0 }}>Muda o tamanho da missão diária e quantos cartões novos entram por dia. Pode trocar quando quiser: o algoritmo continua o mesmo.</p>
        <div className="ritmos">
          {(Object.keys(RITMOS) as Ritmo[]).map((k) => {
            const r = RITMOS[k];
            return (
              <button key={k} className={(cfg.ritmo ?? 'normal') === k ? 'sel' : ''} onClick={() => { set({ ritmo: k, novosPorDia: r.novos }); nav.toast(`Ritmo ${r.rotulo.toLowerCase()} ativado.`); }}>
                <b>{r.rotulo}</b>
                <span>Pílula de ~{r.minutos} min · {r.questoes} questões · {r.novos} cartões novos/dia</span>
                <span>{r.descricao}</span>
              </button>
            );
          })}
        </div>
        <label>Horas reais de estudo por semana</label>
        <div className="row" style={{ alignItems: 'center' }}>
          <button className="btn sm" onClick={() => set({ horasSemana: Math.max(2, cfg.horasSemana - 1) })}>− 1 h</button>
          <b style={{ fontSize: 20, minWidth: 60, textAlign: 'center' }}>{cfg.horasSemana} h</b>
          <button className="btn sm" onClick={() => set({ horasSemana: Math.min(40, cfg.horasSemana + 1) })}>+ 1 h</button>
        </div>
        <p className="tiny">Cota semanal = 8 × horas = <b>{Q} questões</b> (pilar 5). Aparece no Painel de metas.</p>
      </div>

      <div className="card">
        <h2>Metas</h2>
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
        <h2>Seus dados iniciais: quanto sabe de cada bloco (0 a 3)</h2>
        <p className="tiny" style={{ marginTop: 0 }}>São as respostas da configuração inicial. Só afetam o ponto de partida do modelo; as respostas às questões corrigem o resto. 0 = nunca estudei · 3 = resolvo questões com segurança.</p>
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
        <p className="small">Com a conta conectada, os dados também ficam na nuvem. O arquivo de backup continua útil como cópia extra.</p>
        <p className="tiny">Último backup: {cfg.ultimoBackup ? new Date(cfg.ultimoBackup).toLocaleString('pt-BR') : 'nunca'}</p>
        <div className="row">
          <button className="btn primary" onClick={exportar}>Exportar backup (arquivo)</button>
          <label className="btn" style={{ margin: 0, color: 'var(--ink)' }}>
            Restaurar de arquivo
            <input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} />
          </label>
        </div>
        {msg && <p className="small">{msg}</p>}
      </div>

      <div className="card">
        <h2>Zerar tudo</h2>
        <p className="tiny">Apaga respostas, cartões, simulados e configurações deste aparelho. Se você estiver conectado à conta, tudo volta da nuvem na próxima abertura.</p>
        <button className="btn danger" onClick={async () => { if (confirmar('Apagar todos os dados deste aparelho?')) { apagarEspelho(); Object.keys(localStorage).filter((k) => k.startsWith('painel-prova-sync-')).forEach((k) => localStorage.removeItem(k)); await db.delete(); location.reload(); } }}>Apagar todos os dados</button>
      </div>
    </div>
  );
}

function confirmar(t: string) {
  // eslint-disable-next-line no-alert
  return window.confirm(t);
}
