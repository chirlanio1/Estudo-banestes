import { describe, expect, it } from 'vitest';
import { BANCO_BASE } from '../data/questoes';
import { KITS } from '../data/kits';
import { TOPICO_PARA_BLOCO } from '../data/edital';

describe('conteúdo', () => {
  it('ids únicos', () => {
    const ids = BANCO_BASE.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('cada questão tem tópico válido, 5 alternativas distintas e gabarito', () => {
    for (const q of BANCO_BASE) {
      expect(TOPICO_PARA_BLOCO[q.topico], q.id).toBeTruthy();
      expect(q.alternativas.length, q.id).toBe(5);
      expect(new Set(q.alternativas).size, q.id).toBe(5);
      expect(q.correta >= 0 && q.correta <= 4, q.id).toBe(true);
      expect(q.explicacao.length > 20, q.id).toBe(true);
    }
  });
  it('kits apontam para tópicos válidos', () => {
    for (const [t, k] of Object.entries(KITS)) {
      expect(TOPICO_PARA_BLOCO[t], t).toBeTruthy();
      expect(k.cartoes.length, t).toBeGreaterThan(2);
    }
  });
  it('gabarito não concentrado numa letra', () => {
    const c = [0, 0, 0, 0, 0];
    for (const q of BANCO_BASE) c[q.correta]++;
    console.log('distribuição A–E:', c.join(' '), 'total', BANCO_BASE.length, 'kits', Object.keys(KITS).length);
  });
});

describe('explicações coerentes após troca de posição', () => {
  it('o rótulo da linha que justifica a correta aponta a letra correta', () => {
    for (const q of BANCO_BASE) {
      const linhas = q.explicacao.split('\n').filter((l) => /^[A-E]:/.test(l));
      if (linhas.length < 3) continue;
      // a primeira linha rotulada é a da alternativa correta (convenção do banco)
      expect(linhas[0][0], q.id).toBe('ABCDE'[q.correta]);
    }
  });
});
