import 'fake-indexeddb/auto';
import { describe, expect, it, beforeAll } from 'vitest';
import { EstudoDB } from '../db';
import { sincronizar, type Remoto, type RegistroRemoto, type EstadoSync } from '../sync/motor';

beforeAll(() => {
  const m = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v), removeItem: (k: string) => m.delete(k) };
});

/** Nuvem em memória com as mesmas regras do SQL do Supabase (ignora versões mais antigas ou iguais). */
function nuvem(): Remoto & { linhas: Map<string, RegistroRemoto> } {
  const linhas = new Map<string, RegistroRemoto>();
  let relogio = 0;
  const carimbo = () => new Date(Date.UTC(2026, 0, 1) + ++relogio * 1000).toISOString();
  return {
    linhas,
    async baixar(desde) {
      return [...linhas.values()].filter((r) => !desde || r.alterado! > desde).sort((a, b) => a.alterado!.localeCompare(b.alterado!));
    },
    async enviar(regs) {
      for (const r of regs) {
        const k = r.tabela + '|' + r.chave;
        const ant = linhas.get(k);
        if (ant && r.atualizado <= ant.atualizado) continue;
        linhas.set(k, { ...JSON.parse(JSON.stringify(r)), alterado: carimbo() });
      }
    }
  };
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('sincronização entre aparelhos', () => {
  it('junta históricos de dois aparelhos e propaga mudanças e exclusões', async () => {
    const remoto = nuvem();
    const celular = new EstudoDB('celular-' + Math.random());
    const tablet = new EstudoDB('tablet-' + Math.random());
    let ec: EstadoSync = { cursor: null, enviadoAte: 0 };
    let et: EstadoSync = { cursor: null, enviadoAte: 0 };

    // histórico prévio em cada aparelho
    await celular.attempts.add({ qid: 'pt01', topico: 'pt-crase', bloco: 'pt', ts: 1, correta: true } as any);
    await celular.dias.put({ data: '2026-11-23', sono: 7 } as any);
    const cid = await tablet.cards.add({ frente: 'F', verso: 'V', topico: 'bd-sql', fonte: 'kit', criado: 1, introduzido: false, card: {} } as any);
    const card = await tablet.cards.get(cid);
    await tablet.revisoes.add({ cardId: cid, cardUid: (card as any).uid, ts: 2, nota: 3, ms: 1000 });
    await tablet.attempts.add({ qid: 'bd01', topico: 'bd-sql', bloco: 'bd', ts: 2, correta: false } as any);
    await tablet.config.put({ id: 'cfg', horasSemana: 12, onboarding: true, apiKey: 'segredo-tablet' } as any);

    ec = (await sincronizar(celular, remoto, ec)).estado;
    et = (await sincronizar(tablet, remoto, et)).estado;
    ec = (await sincronizar(celular, remoto, ec)).estado;

    for (const d of [celular, tablet]) {
      expect((await d.attempts.toArray()).map((a) => a.qid).sort()).toEqual(['bd01', 'pt01']);
      expect(await d.dias.count()).toBe(1);
      expect(await d.cards.count()).toBe(1);
    }
    // a revisão aponta para o id local do cartão no outro aparelho
    const rc = (await celular.revisoes.toArray())[0];
    const cc = (await celular.cards.toArray())[0];
    expect(rc.cardId).toBe(cc.id);
    // segredo não vai para a nuvem
    expect(JSON.stringify([...remoto.linhas.values()])).not.toContain('segredo-tablet');
    expect((await celular.config.get('cfg'))?.horasSemana).toBe(12);

    // mudança no celular vence a antiga do tablet
    await espera(5);
    await celular.dias.update('2026-11-23', { sono: 5 });
    ec = (await sincronizar(celular, remoto, ec)).estado;
    et = (await sincronizar(tablet, remoto, et)).estado;
    expect((await tablet.dias.get('2026-11-23'))?.sono).toBe(5);

    // exclusão no tablet chega ao celular
    await espera(5);
    const a = (await tablet.attempts.where('qid').equals('pt01').first())!;
    await tablet.attempts.delete(a.id!);
    et = (await sincronizar(tablet, remoto, et)).estado;
    ec = (await sincronizar(celular, remoto, ec)).estado;
    expect((await celular.attempts.toArray()).map((x) => x.qid)).toEqual(['bd01']);

    // rodada sem mudanças não reenvia nada
    const r = await sincronizar(celular, remoto, ec);
    expect(r.recebidos).toBe(0);
  });
});
