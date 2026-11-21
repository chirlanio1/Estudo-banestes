import { useNav } from '../App';

const ITENS = [
  { r: 'caderno', t: 'Caderno de erros e pegadinhas', d: 'Seus erros por causa, e as pegadinhas FCC para reler na véspera dos simulados.' },
  { r: 'provas', t: 'Provas oficiais e edital', d: 'Links das provas FCC em PDF, do edital e do Guia de Conduta do Banestes.' },
  { r: 'importar', t: 'Importar questões', d: 'Cadastre questões das provas reais por formulário, ou em lote (JSON/CSV).' },
  { r: 'ia', t: 'Gerar questões com IA', d: 'Opcional, só online: questões novas a partir dos seus erros, com a sua chave de API.' },
  { r: 'config', t: 'Configurações e backup', d: 'Horas por semana, autoavaliação, exportar e importar dados, sincronizar com o GitHub.' },
  { r: 'sobre', t: 'Como o app funciona', d: 'O algoritmo, as fontes, o que foi verificado e o que você deve conferir.' }
] as const;

export function Mais() {
  const nav = useNav();
  return (
    <div>
      {ITENS.map((i) => (
        <button key={i.r} className="card" style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => nav.ir({ r: i.r } as any)}>
          <b>{i.t}</b>
          <div className="small muted">{i.d}</div>
        </button>
      ))}
    </div>
  );
}
