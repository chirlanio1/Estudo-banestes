import { useCallback, useEffect, useState } from 'react';

/** Carrega dados assíncronos (IndexedDB) e permite recarregar. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): [T | undefined, () => void] {
  const [v, setV] = useState<T>();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let vivo = true;
    fn().then((x) => vivo && setV(x));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return [v, reload];
}

export function pct(x: number | undefined, casas = 0) {
  if (x === undefined || Number.isNaN(x)) return '—';
  return (x * 100).toFixed(casas).replace('.', ',') + '%';
}

export function num(x: number | undefined, casas = 2) {
  if (x === undefined || Number.isNaN(x)) return '—';
  return x.toFixed(casas).replace('.', ',');
}

export function dataBR(iso: string) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function baixarArquivo(nome: string, conteudo: string, tipo = 'application/json') {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
