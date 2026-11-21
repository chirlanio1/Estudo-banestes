import { banco } from '../store';
import { KITS } from '../data/kits';
import { BLOCOS } from '../data/edital';
import { useAsync } from '../lib/hooks';

export function Sobre() {
  const [bq] = useAsync(() => banco());
  const ver = new Map<string, number>();
  for (const q of bq ?? []) ver.set(q.verificacao, (ver.get(q.verificacao) ?? 0) + 1);
  const porBloco = BLOCOS.map((b) => ({ b, n: (bq ?? []).filter((q) => b.subtopicos.some((s) => s.id === q.topico)).length }));
  return (
    <div>
      <div className="card">
        <h2>O algoritmo, em 4 camadas</h2>
        <ol className="small">
          <li><b>Domínio por tópico (aprende com você).</b> Um modelo de Teoria de Resposta ao Item ajustado a cada resposta: estima o quanto você domina cada um dos {BLOCOS.reduce((a, b) => a + b.subtopicos.length, 0)} subtópicos do edital e o quanto cada questão é difícil para você. Desconta o acerto ao acaso (1 em 5) e o esquecimento quando você fica semanas sem ver o assunto. É modelagem estatística online, não rede neural: com os dados de um único aluno, é o método mais preciso.</li>
          <li><b>Prioridade (o que estudar).</b> Peso da questão na nota × questões do tópico × o quanto falta dominar × urgência × foco da semana × tempo sem prática. A missão do dia pega o topo da fila.</li>
          <li><b>Revisão espaçada (quando rever).</b> FSRS (biblioteca ts-fsrs) para cartões e também para as questões: o que você erra volta antes de você esquecer.</li>
          <li><b>Comportamento (como estudar).</b> Horário, tempo por questão e queda de acerto ao longo da sessão. Se o acerto cai depois de X minutos, as missões encurtam. Dois dias sem estudo viram missão mínima de 15 min.</li>
        </ol>
        <p className="small">Cada erro pede a causa. Não sabia → volta à teoria e cartão. Confundi → cartão de contraste. Pegadinha → caderno de pegadinhas e questão parecida logo. Atenção → regra de leitura e a questão volta amanhã. Tempo → ordem de ataque.</p>
      </div>
      <div className="card">
        <h2>De onde vem o conteúdo e o que conferir</h2>
        <p className="small">As questões do banco inicial são de <b>autoria própria no estilo FCC</b> (escritas por IA e revisadas), não são questões da FCC. Por isso o painel separa o acerto em “FCC real”: importe questões das provas oficiais para treinar com o estilo verdadeiro da banca (regra do pilar 4: cerca de 70% reais, 30% geradas).</p>
        <ul className="small">
          <li>Código executado e saída conferida: {ver.get('executado') ?? 0}</li>
          <li>Conta refeita e conferida: {ver.get('calculado') ?? 0}</li>
          <li>Conferidas pela gramática normativa: {ver.get('gramatica') ?? 0}</li>
          <li>Conferidas com o texto da fonte citada: {ver.get('fonte') ?? 0}</li>
          <li><b>Não verificadas (confira na fonte oficial):</b> {ver.get('conferir') ?? 0}</li>
        </ul>
        <p className="small">Resumos de teoria prontos: {Object.keys(KITS).length} tópicos, priorizados pelo peso no edital. O restante entra semana a semana, à frente do cronograma.</p>
        <table className="t small"><tbody>{porBloco.map(({ b, n }) => <tr key={b.id}><td>{b.nome}</td><td className="n">{n} questões</td></tr>)}</tbody></table>
        <p className="tiny">Atenção às normas: o edital fixa versões (PMBOK 8ª ed., ITIL Version 5, ISO 27001, ISO 25010:2024, OWASP 2021, WCAG 2.2). Onde o conteúdo depende do texto exato de uma versão nova, ele está marcado como “conferir na fonte”.</p>
      </div>
      <div className="card">
        <h2>Privacidade</h2>
        <p className="small">Nada sai do aparelho, exceto quando você usa a geração com IA (envia as questões erradas para a API da Anthropic com a sua chave) ou a sincronização com o GitHub (envia o backup para o seu repositório).</p>
        <p className="tiny">Painel PROVA · versão {__APP_VERSION__} · construído para o concurso Banestes 2027 (FCC).</p>
      </div>
    </div>
  );
}

declare const __APP_VERSION__: string;
