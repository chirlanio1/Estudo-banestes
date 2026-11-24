import Dexie, { type Table } from 'dexie';
import type {
  Attempt, QState, Mastery, Flashcard, Revisao, Sessao, Simulado, Evento, DiaLog, Pegadinha, Config, Questao
} from './types';

export class EstudoDB extends Dexie {
  attempts!: Table<Attempt, number>;
  qstate!: Table<QState, string>;
  mastery!: Table<Mastery, string>;
  cards!: Table<Flashcard, number>;
  revisoes!: Table<Revisao, number>;
  sessoes!: Table<Sessao, string>;
  simulados!: Table<Simulado, number>;
  eventos!: Table<Evento, number>;
  dias!: Table<DiaLog, string>;
  pegadinhas!: Table<Pegadinha, number>;
  config!: Table<Config, string>;
  questoesExtra!: Table<Questao, string>;
  kv!: Table<{ k: string; v: unknown }, string>;

  constructor(nome = 'painel-prova') {
    super(nome);
    this.version(1).stores({
      attempts: '++id, qid, topico, bloco, ts, sessao, modo',
      qstate: 'qid',
      mastery: 'topico',
      cards: '++id, topico, fonte, card.due, introduzido, qid',
      revisoes: '++id, cardId, ts',
      sessoes: 'id, inicio, tipo',
      simulados: '++id, data, numero',
      eventos: '++id, ts, tipo',
      dias: 'data',
      pegadinhas: '++id, qid, ts',
      config: 'id',
      questoesExtra: 'id, topico, origem',
      kv: 'k'
    });
    // v2: identificador universal (uid) nas tabelas de id automático, para sincronizar entre aparelhos
    this.version(2)
      .stores({
        attempts: '++id, qid, topico, bloco, ts, sessao, modo, uid',
        cards: '++id, topico, fonte, card.due, introduzido, qid, uid',
        revisoes: '++id, cardId, ts, uid',
        simulados: '++id, data, numero, uid',
        eventos: '++id, ts, tipo, uid',
        pegadinhas: '++id, qid, ts, uid'
      })
      .upgrade(async (tx) => {
        for (const t of TABELAS_AUTO) {
          await tx.table(t).toCollection().modify((o: any) => {
            if (!o.uid) o.uid = novoUid();
          });
        }
        const cards = await tx.table('cards').toArray();
        const uidDe = new Map(cards.map((c: any) => [c.id, c.uid]));
        await tx.table('revisoes').toCollection().modify((r: any) => {
          if (!r.cardUid) r.cardUid = uidDe.get(r.cardId);
        });
      });
    instalarRastreio(this);
  }
}

/** Tabelas com id numérico automático: entre aparelhos, o registro é identificado pelo uid. */
export const TABELAS_AUTO = ['attempts', 'cards', 'revisoes', 'simulados', 'eventos', 'pegadinhas'] as const;
/** Tabelas com chave própria (texto). */
export const TABELAS_CHAVE: Record<string, string> = { qstate: 'qid', mastery: 'topico', sessoes: 'id', dias: 'data', config: 'id', questoesExtra: 'id', kv: 'k' };
/** Chaves do kv que só fazem sentido neste aparelho. */
export const KV_LOCAL = new Set(['simulado-atual']);

export function novoUid(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

/** Estado compartilhado do rastreio de mudanças (usado pelo motor de sincronização). */
export const rastreio = {
  aplicandoRemoto: false,
  aoMudar: null as null | (() => void),
  apagados(): { tabela: string; chave: string; at: number }[] {
    try { return JSON.parse(localStorage.getItem('painel-prova-apagados') ?? '[]'); } catch { return []; }
  },
  registrarApagado(tabela: string, chave: string) {
    try {
      const l = rastreio.apagados();
      l.push({ tabela, chave, at: Date.now() });
      localStorage.setItem('painel-prova-apagados', JSON.stringify(l.slice(-500)));
    } catch { /* sem localStorage */ }
  },
  limparApagados(ate: number) {
    try { localStorage.setItem('painel-prova-apagados', JSON.stringify(rastreio.apagados().filter((a) => a.at > ate))); } catch { /* ignora */ }
  }
};

export function chaveDe(tabela: string, o: any): string | undefined {
  if ((TABELAS_AUTO as readonly string[]).includes(tabela)) return o?.uid;
  const k = TABELAS_CHAVE[tabela];
  return k && o?.[k] != null ? String(o[k]) : undefined;
}

/** Carimba cada criação/alteração com _at (hora local) e uid; registra exclusões. */
function instalarRastreio(d: Dexie) {
  const todas = [...TABELAS_AUTO, ...Object.keys(TABELAS_CHAVE)];
  for (const t of todas) {
    const tab = d.table(t);
    const auto = (TABELAS_AUTO as readonly string[]).includes(t);
    tab.hook('creating', (_pk, obj: any) => {
      if (auto && !obj.uid) obj.uid = novoUid();
      if (rastreio.aplicandoRemoto) return;
      obj._at = Date.now();
      rastreio.aoMudar?.();
    });
    tab.hook('updating', () => {
      if (rastreio.aplicandoRemoto) return undefined;
      rastreio.aoMudar?.();
      return { _at: Date.now() };
    });
    tab.hook('deleting', (_pk, obj: any) => {
      if (rastreio.aplicandoRemoto) return;
      const k = chaveDe(t, obj);
      if (k) rastreio.registrarApagado(t, k);
      rastreio.aoMudar?.();
    });
  }
}

export const db = new EstudoDB();

export const DEFAULT_CONFIG: Config = {
  id: 'cfg',
  horasSemana: 10,
  dataProva: '2027-02-21',
  metaFinal: 7.5,
  autoavaliacao: {},
  onboarding: false,
  novosPorDia: 10,
  retencao: 0.85,
  vozRate: 1.05
};

const CHAVE_ESPELHO = 'painel-prova-config';

/** Cópia da configuração (sem segredos) no localStorage: se o IndexedDB vier vazio ou falhar, nada se perde. */
function lerEspelho(): Partial<Config> | undefined {
  try {
    const t = localStorage.getItem(CHAVE_ESPELHO);
    return t ? (JSON.parse(t) as Partial<Config>) : undefined;
  } catch {
    return undefined;
  }
}
function gravarEspelho(c: Config) {
  try {
    localStorage.setItem(CHAVE_ESPELHO, JSON.stringify({ ...c, apiKey: undefined, ghToken: undefined }));
  } catch {
    /* armazenamento indisponível: segue só com o IndexedDB */
  }
}

export function apagarEspelho() {
  try { localStorage.removeItem(CHAVE_ESPELHO); } catch { /* ignora */ }
}

export async function getConfig(): Promise<Config> {
  let c: Config | undefined;
  try {
    c = await db.config.get('cfg');
  } catch {
    c = undefined;
  }
  if (!c) {
    const esp = lerEspelho();
    if (esp?.onboarding) {
      const restaurada = { ...DEFAULT_CONFIG, ...esp, id: 'cfg' as const };
      try { await db.config.put(restaurada); } catch { /* ignora */ }
      return restaurada;
    }
  } else if (c.onboarding && !lerEspelho()?.onboarding) {
    gravarEspelho({ ...DEFAULT_CONFIG, ...c });
  }
  return { ...DEFAULT_CONFIG, ...(c ?? {}) };
}

export async function saveConfig(patch: Partial<Config>): Promise<Config> {
  const atual = await getConfig();
  const novo = { ...atual, ...patch, id: 'cfg' as const };
  gravarEspelho(novo);
  try {
    await db.config.put(novo);
  } catch {
    /* sem IndexedDB: a configuração fica no espelho */
  }
  return novo;
}

const TABELAS = [
  'attempts', 'qstate', 'mastery', 'cards', 'revisoes', 'sessoes', 'simulados', 'eventos', 'dias', 'pegadinhas', 'config', 'questoesExtra', 'kv'
] as const;

export interface Backup {
  app: 'painel-prova';
  versao: 1;
  criado: string;
  dados: Record<string, unknown[]>;
}

export async function exportarTudo(incluirSegredos = false): Promise<Backup> {
  const dados: Record<string, unknown[]> = {};
  for (const t of TABELAS) {
    let linhas = await (db as any)[t].toArray();
    if (t === 'config' && !incluirSegredos) {
      linhas = linhas.map((c: Config) => ({ ...c, apiKey: undefined, ghToken: undefined }));
    }
    dados[t] = linhas;
  }
  return { app: 'painel-prova', versao: 1, criado: new Date().toISOString(), dados };
}

export async function importarTudo(b: Backup): Promise<void> {
  if (b?.app !== 'painel-prova') throw new Error('Arquivo não é um backup do Painel PROVA.');
  const cfgAtual = await getConfig();
  await db.transaction('rw', TABELAS.map((t) => (db as any)[t]), async () => {
    for (const t of TABELAS) {
      const linhas = b.dados[t] ?? [];
      await (db as any)[t].clear();
      if (linhas.length) await (db as any)[t].bulkPut(linhas);
    }
  });
  // preserva segredos locais que não vão no backup
  const cfg = await getConfig();
  await saveConfig({ apiKey: cfg.apiKey ?? cfgAtual.apiKey, ghToken: cfg.ghToken ?? cfgAtual.ghToken });
}
