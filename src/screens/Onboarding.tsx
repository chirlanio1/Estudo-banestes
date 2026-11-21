import { useState } from 'react';
import { saveConfig } from '../db';
import { BLOCOS } from '../data/edital';

const NIVEIS = ['0 · nunca estudei', '1 · já ouvi falar', '2 · sei explicar o básico', '3 · resolvo questões com segurança'];

/** Primeira abertura: 3 perguntas rápidas que configuram o modelo (base prévia e tempo real). */
export function Onboarding({ onFim }: { onFim: () => void }) {
  const [passo, setPasso] = useState(0);
  const [horas, setHoras] = useState(10);
  const [auto, setAuto] = useState<Record<string, number>>({ redes: 2, web: 2, so: 1 });

  async function concluir() {
    await saveConfig({ horasSemana: horas, autoavaliacao: auto, onboarding: true });
    onFim();
  }

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: 16 }}>
      {passo === 0 && (
        <div className="card hero">
          <h2 style={{ fontSize: 24 }}>Painel PROVA</h2>
          <p>Seu treinador de bolso para o Banestes (FCC), cargo Analista de TI – Desenvolvimento de Sistemas. Prova em 21/02/2027.</p>
          <p className="small">Você só decide uma coisa por dia: começar. O app escolhe o tópico pelo peso na prova e pelo seu ponto fraco, agenda as revisões antes de você esquecer e aprende com cada erro.</p>
          <p className="small">Tudo fica guardado neste aparelho e funciona sem internet. Faça backup semanal em Mais &gt; Configurações.</p>
          <button className="btn primary big" onClick={() => setPasso(1)}>Configurar em 1 minuto</button>
        </div>
      )}
      {passo === 1 && (
        <div className="card">
          <h2>Quantas horas reais por semana você consegue estudar?</h2>
          <p className="small muted">Conte o tempo de verdade, sem as horas sonhadas. A cota semanal de questões será 8 por hora (regra do pilar 5). Você pode ajustar depois do registro de 7 dias.</p>
          <input type="number" min={2} max={40} value={horas} onChange={(e) => setHoras(Math.max(2, Math.min(40, Number(e.target.value) || 2)))} />
          <p className="small">Cota semanal: <b>{Math.round((8 * horas) / 10) * 10} questões</b>.</p>
          <button className="btn primary big" onClick={() => setPasso(2)}>Continuar</button>
        </div>
      )}
      {passo === 2 && (
        <div className="card">
          <h2>Quanto você já sabe de cada bloco?</h2>
          <p className="small muted">É só o ponto de partida do modelo. Ele se corrige sozinho a cada resposta, e o diagnóstico de 28/11 recalibra tudo.</p>
          {BLOCOS.map((b) => (
            <div key={b.id}>
              <label>{b.nome}</label>
              <select value={auto[b.id] ?? 0} onChange={(e) => setAuto((a) => ({ ...a, [b.id]: Number(e.target.value) }))}>
                {NIVEIS.map((n, i) => <option key={i} value={i}>{n}</option>)}
              </select>
            </div>
          ))}
          <button className="btn primary big" style={{ marginTop: 14 }} onClick={concluir}>Começar a estudar</button>
        </div>
      )}
    </main>
  );
}
