import { PROVAS } from '../data/provas';

export function Provas() {
  return (
    <div>
      <div className="card">
        <p className="small" style={{ margin: 0 }}>
          A FCC não permite cópia automática das provas, então o app traz os links. Para usar uma prova real: baixe o PDF com internet, resolva no papel e
          lance o resultado em Simulado &gt; “Lançar simulado feito no papel”. As questões que você errar podem ser cadastradas em Mais &gt; Importar.
        </p>
        <p className="tiny">Status (do pilar 4): <b>aberta</b> = PDF aberto e conferido; <b>na listagem</b> = visto numa lista, prova não aberta; <b>só na busca</b> = página recusou leitura automática.</p>
      </div>
      {PROVAS.map((g) => (
        <div className="card" key={g.grupo}>
          <h2>{g.grupo}</h2>
          {g.nota && <p className="tiny" style={{ marginTop: 0 }}>{g.nota}</p>}
          <ul className="list small">
            {g.itens.map((p) => (
              <li key={p.url}>
                <a href={p.url} target="_blank" rel="noreferrer">{p.titulo}</a>
                <div className="tiny">{p.status ? `Status: ${p.status}` : ''}{p.obs ? ` · ${p.obs}` : ''}</div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
