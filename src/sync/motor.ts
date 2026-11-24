import type { EstudoDB } from '../db';
import { TABELAS_AUTO, TABELAS_CHAVE, KV_LOCAL, chaveDe, rastreio } from '../db';

/** Um registro como fica guardado na nuvem. */
export interface RegistroRemoto {
  tabela: string;
  chave: string;
  dados: Record<string, unknown> | null;
  atualizado: number; // _at do aparelho que fez a mudança (ms)
  apagado: boolean;
  alterado?: string; // carimbo do servidor (ISO), usado como cursor de leitura
}

/** O que o motor precisa da nuvem (Supabase em produção; memória nos testes). */
export interface Remoto {
  /** Registros alterados no servidor depois do cursor (ordem crescente). */
  baixar(desde: string | null): Promise<RegistroRemoto[]>;
  /** Grava; o servidor ignora versões mais antigas que a que já tem. */
  enviar(regs: RegistroRemoto[]): Promise<void>;
}

export interface EstadoSync {
  cursor: string | null; // último "alterado" lido do servidor
  enviadoAte: number; // _at local até onde já foi enviado
}

const TODAS = [...TABELAS_AUTO, ...Object.keys(TABELAS_CHAVE)];
const CAMPOS_LOCAIS = ['id', '_at', 'apiKey', 'ghToken', 'ultimoSyncGitHub'];
const SOBREPOSICAO_MS = 2 * 60 * 1000; // relê 2 min antes do cursor: transações concorrentes no servidor

function paraRemoto(tabela: string, o: any): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (CAMPOS_LOCAIS.includes(k) && !(k === 'id' && tabela in TABELAS_CHAVE)) continue;
    d[k] = v;
  }
  if (tabela === 'revisoes') delete d.cardId; // o vínculo entre aparelhos é o cardUid
  return d;
}

function deveSincronizar(tabela: string, o: any) {
  return !(tabela === 'kv' && KV_LOCAL.has(o?.k));
}

/** Uma rodada completa: baixa o que mudou na nuvem, aplica, e envia o que mudou aqui. */
export async function sincronizar(db: EstudoDB, remoto: Remoto, estado: EstadoSync): Promise<{ estado: EstadoSync; recebidos: number; enviados: number }> {
  // 1) baixar e aplicar
  const desde = estado.cursor ? new Date(new Date(estado.cursor).getTime() - SOBREPOSICAO_MS).toISOString() : null;
  const chegaram = await remoto.baixar(desde);
  let recebidos = 0;
  let cursor = estado.cursor;
  if (chegaram.length) {
    recebidos = await aplicar(db, chegaram);
    for (const r of chegaram) if (r.alterado && (!cursor || r.alterado > cursor)) cursor = r.alterado;
  }

  // 2) enviar o que mudou localmente
  const inicio = Date.now();
  const saida: RegistroRemoto[] = [];
  for (const t of TODAS) {
    const linhas = await (db as any)[t].toArray();
    for (const o of linhas) {
      if (!deveSincronizar(t, o)) continue;
      const at = o._at ?? 0;
      if (estado.enviadoAte && at <= estado.enviadoAte) continue; // 1ª rodada envia tudo, depois só o que mudou
      const chave = chaveDe(t, o);
      if (!chave) continue;
      saida.push({ tabela: t, chave, dados: paraRemoto(t, o), atualizado: at, apagado: false });
    }
  }
  const apagados = rastreio.apagados().filter((a) => a.at > estado.enviadoAte);
  for (const a of apagados) saida.push({ tabela: a.tabela, chave: a.chave, dados: null, atualizado: a.at, apagado: true });
  for (let i = 0; i < saida.length; i += 500) await remoto.enviar(saida.slice(i, i + 500));
  rastreio.limparApagados(inicio);

  return { estado: { cursor, enviadoAte: inicio - 1 }, recebidos, enviados: saida.length };
}

/** Aplica registros da nuvem: vence a versão mais recente (por _at). Devolve quantos mudaram aqui. */
export async function aplicar(db: EstudoDB, regs: RegistroRemoto[]): Promise<number> {
  let mudou = 0;
  const tabelas = TODAS.map((t) => (db as any)[t]);
  rastreio.aplicandoRemoto = true;
  try {
    await db.transaction('rw', tabelas, async () => {
      // cartões primeiro: as revisões apontam para eles
      const ordenados = [...regs].sort((a, b) => (a.tabela === 'cards' ? -1 : 0) - (b.tabela === 'cards' ? -1 : 0));
      for (const r of ordenados) {
        if (!TODAS.includes(r.tabela)) continue;
        const tab = (db as any)[r.tabela];
        const auto = (TABELAS_AUTO as readonly string[]).includes(r.tabela);
        const local = auto ? await tab.where('uid').equals(r.chave).first() : await tab.get(r.chave);
        const atLocal = local?._at ?? 0;
        if (local && atLocal >= r.atualizado) continue; // a versão daqui é igual ou mais nova
        if (r.apagado) {
          if (local) {
            await tab.delete(auto ? local.id : r.chave);
            mudou++;
          }
          continue;
        }
        if (!r.dados || (r.tabela === 'kv' && KV_LOCAL.has(r.chave))) continue;
        const novo: any = { ...r.dados, _at: r.atualizado };
        if (auto) {
          if (local) novo.id = local.id;
          else delete novo.id;
          novo.uid = r.chave;
        }
        if (r.tabela === 'revisoes' && novo.cardUid) {
          const c = await (db as any).cards.where('uid').equals(novo.cardUid).first();
          novo.cardId = c?.id ?? -1;
        }
        if (r.tabela === 'config' && local) {
          // segredos ficam só no aparelho
          novo.apiKey = local.apiKey;
          novo.ghToken = local.ghToken;
        }
        await tab.put(novo);
        mudou++;
      }
    });
  } finally {
    rastreio.aplicandoRemoto = false;
  }
  return mudou;
}
