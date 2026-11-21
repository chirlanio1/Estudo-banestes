import type { MapaNo } from '../types';

interface NoPos { t: string; x: number; y: number; nivel: number; pai?: NoPos }

const LARG = [170, 190, 220];
const ALT = 44;

/** Mapa mental desenhado em SVG (da esquerda para a direita), no máximo 12 nós por tópico. */
export function MapaMental({ mapa }: { mapa: MapaNo }) {
  const nos: NoPos[] = [];
  let linha = 0;
  function layout(n: MapaNo, nivel: number, pai?: NoPos): NoPos {
    const filhos = n.c ?? [];
    const me: NoPos = { t: n.t, x: nivel === 0 ? 10 : nivel === 1 ? 200 : 420, y: 0, nivel, pai };
    if (!filhos.length) {
      me.y = linha * ALT + 30;
      linha++;
    } else {
      const ps = filhos.map((f) => layout(f, nivel + 1, me));
      me.y = (ps[0].y + ps[ps.length - 1].y) / 2;
    }
    nos.push(me);
    return me;
  }
  layout(mapa, 0);
  const h = linha * ALT + 20;
  const w = 660;
  return (
    <div className="mapa-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={'Mapa mental: ' + mapa.t} style={{ display: 'block', minWidth: w }}>
        {nos.filter((n) => n.pai).map((n, i) => {
          const p = n.pai!;
          const x1 = p.x + LARG[p.nivel];
          const x2 = n.x;
          return <path key={'l' + i} d={`M${x1},${p.y} C${(x1 + x2) / 2},${p.y} ${(x1 + x2) / 2},${n.y} ${x2},${n.y}`} fill="none" stroke="var(--line)" strokeWidth={2} />;
        })}
        {nos.map((n, i) => (
          <g key={i}>
            <rect x={n.x} y={n.y - 17} width={LARG[n.nivel]} height={34} rx={10}
              fill={n.nivel === 0 ? 'var(--primary)' : n.nivel === 1 ? 'var(--primary-soft)' : 'var(--surface-2)'} />
            <foreignObject x={n.x + 6} y={n.y - 16} width={LARG[n.nivel] - 12} height={32}>
              <div style={{ fontSize: 12, lineHeight: '14px', height: 32, display: 'flex', alignItems: 'center', color: n.nivel === 0 ? 'var(--primary-ink)' : 'var(--ink)', fontWeight: n.nivel < 2 ? 650 : 400, overflow: 'hidden' }}>
                {n.t}
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
}
