import type { Bloco } from '../types';

/**
 * Estrutura da prova — Edital nº 01/2027 Banestes (FCC), cargo 04, Analista de TI – Desenvolvimento de Sistemas.
 * Gerais: número de questões é DADO do edital (quadro do item 9.1).
 * Específicos: divisão das 50 questões é ESTIMATIVA (matriz 4.2 do pilar 4), a recalibrar com a contagem
 * das provas FCC de TI 2024–2025. Pode ser ajustada em Mais > Configurações.
 */
export const BLOCOS: Bloco[] = [
  {
    id: 'pt', nome: 'Língua Portuguesa', curto: 'Português', prova: 'G', questoes: 10, estimativa: false, trilha: 'B',
    subtopicos: [
      { id: 'pt-crase', nome: 'Crase' },
      { id: 'pt-concordancia', nome: 'Concordância verbal e nominal' },
      { id: 'pt-regencia', nome: 'Regência' },
      { id: 'pt-pontuacao', nome: 'Pontuação' },
      { id: 'pt-pronomes', nome: 'Pronomes e colocação' },
      { id: 'pt-reescrita', nome: 'Reescrita e equivalência' },
      { id: 'pt-conectivos', nome: 'Conectivos, coordenação e subordinação' },
      { id: 'pt-verbos', nome: 'Vozes verbais e tempos' },
      { id: 'pt-ortografia', nome: 'Ortografia e acentuação' }
    ]
  },
  {
    id: 'rlm', nome: 'Raciocínio Lógico e Estatística', curto: 'RLM', prova: 'G', questoes: 10, estimativa: false, trilha: 'C',
    subtopicos: [
      { id: 'rlm-logica', nome: 'Lógica de argumentação' },
      { id: 'rlm-porcentagem', nome: 'Porcentagem e proporção' },
      { id: 'rlm-estatistica', nome: 'Média, moda, mediana e dispersão' },
      { id: 'rlm-contagem', nome: 'Contagem e probabilidade' },
      { id: 'rlm-juros', nome: 'Juros simples e compostos, taxas' },
      { id: 'rlm-amortizacao', nome: 'Price, SAC, VPL e TIR' },
      { id: 'rlm-sequencias', nome: 'Sequências e problemas' }
    ]
  },
  {
    id: 'atu', nome: 'Atualidades do Mercado Financeiro e Digital', curto: 'Atualidades', prova: 'G', questoes: 5, estimativa: false, trilha: 'D',
    subtopicos: [
      { id: 'atu-sfn', nome: 'Sistema Financeiro Nacional' },
      { id: 'atu-copom', nome: 'Copom, Selic e inflação' },
      { id: 'atu-pix', nome: 'Pix e meios de pagamento' },
      { id: 'atu-openfinance', nome: 'Open Finance, fintechs e moedas digitais' },
      { id: 'atu-consumidor', nome: 'Educação financeira e proteção do consumidor' }
    ]
  },
  {
    id: 'eti', nome: 'Ética, Compliance e ESG', curto: 'Ética', prova: 'G', questoes: 5, estimativa: false, trilha: 'D',
    subtopicos: [
      { id: 'eti-etica', nome: 'Ética, moral e conduta' },
      { id: 'eti-compliance', nome: 'Compliance, governança e controles internos' },
      { id: 'eti-pld', nome: 'Prevenção à lavagem de dinheiro e corrupção' },
      { id: 'eti-lgpd', nome: 'LGPD (noções)' },
      { id: 'eti-esg', nome: 'ESG, Agenda 2030 e ODS' }
    ]
  },
  {
    id: 'prog', nome: 'Programação', curto: 'Programação', prova: 'E', questoes: 7, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'prog-oo', nome: 'Orientação a objetos' },
      { id: 'prog-java', nome: 'Java' },
      { id: 'prog-python', nome: 'Python' },
      { id: 'prog-csharp', nome: 'C# e .NET' },
      { id: 'prog-c-php', nome: 'C e PHP' },
      { id: 'prog-solid', nome: 'SOLID, TDD e BDD' },
      { id: 'prog-git', nome: 'Git, GitFlow e pull requests' }
    ]
  },
  {
    id: 'es', nome: 'Processo e Engenharia de Software', curto: 'Eng. Software', prova: 'E', questoes: 7, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'es-scrum', nome: 'Scrum' },
      { id: 'es-ageis', nome: 'Kanban e XP' },
      { id: 'es-testes', nome: 'Tipos de teste' },
      { id: 'es-uml', nome: 'UML 2.5 e BPMN' },
      { id: 'es-requisitos', nome: 'Requisitos' },
      { id: 'es-qualidade', nome: 'ISO 25010, CMMI, MPS.BR, 12207' },
      { id: 'es-config', nome: 'Gestão de configuração, SemVer, code review' }
    ]
  },
  {
    id: 'bd', nome: 'Banco de Dados', curto: 'Banco de Dados', prova: 'E', questoes: 6, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'bd-sql', nome: 'SQL: consultas, junções, agregação' },
      { id: 'bd-sqlavancado', nome: 'Subconsultas, CTEs e window functions' },
      { id: 'bd-normalizacao', nome: 'Normalização' },
      { id: 'bd-mer', nome: 'Modelo entidade-relacionamento' },
      { id: 'bd-transacoes', nome: 'Transações, DDL, DCL, PL/SQL' },
      { id: 'bd-dw', nome: 'DW, OLAP, NoSQL e governança de dados' }
    ]
  },
  {
    id: 'gov', nome: 'Gestão e Governança de TI', curto: 'Governança', prova: 'E', questoes: 5, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'gov-itil', nome: 'ITIL' },
      { id: 'gov-cobit', nome: 'COBIT 2019' },
      { id: 'gov-pmbok', nome: 'PMBOK 8ª ed.' },
      { id: 'gov-contratacoes', nome: 'Lei 14.133/2021 em TIC, PDTIC' },
      { id: 'gov-financas', nome: 'SLA/OLA, TCO, ROI, CAPEX/OPEX, FinOps, ISO 31000' }
    ]
  },
  {
    id: 'seg', nome: 'Segurança da Informação', curto: 'Segurança', prova: 'E', questoes: 5, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'seg-cripto', nome: 'Criptografia e certificados' },
      { id: 'seg-owasp', nome: 'OWASP Top 10:2021' },
      { id: 'seg-normas', nome: 'ISO 27001/27002, NIST, incidentes' },
      { id: 'seg-lgpd', nome: 'LGPD completa' },
      { id: 'seg-defesa', nome: 'Firewall, WAF, IDS/IPS, Zero Trust' },
      { id: 'seg-iam', nome: 'OAuth 2.0 e OIDC' }
    ]
  },
  {
    id: 'web', nome: 'Web, Mobile e APIs', curto: 'Web e APIs', prova: 'E', questoes: 5, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'web-html', nome: 'HTML5, CSS3 e Bootstrap' },
      { id: 'web-js', nome: 'JavaScript e TypeScript' },
      { id: 'web-frameworks', nome: 'React, Angular, Vue, Node.js' },
      { id: 'web-rest', nome: 'REST, OpenAPI e idempotência' },
      { id: 'web-acess', nome: 'Acessibilidade (WCAG) e UX' }
    ]
  },
  {
    id: 'arq', nome: 'Arquitetura de Sistemas', curto: 'Arquitetura', prova: 'E', questoes: 3, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'arq-padroes', nome: 'MVC, camadas, DDD, hexagonal' },
      { id: 'arq-distribuida', nome: 'SOA, microsserviços, mensageria' }
    ]
  },
  {
    id: 'devops', nome: 'DevOps e DevSecOps', curto: 'DevOps', prova: 'E', questoes: 3, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'devops-cicd', nome: 'CI/CD e implantação' },
      { id: 'devops-containers', nome: 'Docker, Kubernetes e IaC' }
    ]
  },
  {
    id: 'redes', nome: 'Redes e Serviços de Rede', curto: 'Redes', prova: 'E', questoes: 3, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'redes-tcpip', nome: 'TCP/IP, IPv4 e IPv6' },
      { id: 'redes-protocolos', nome: 'Protocolos e serviços' }
    ]
  },
  {
    id: 'so', nome: 'Sistemas Operacionais', curto: 'Sist. Operacionais', prova: 'E', questoes: 2, estimativa: true, trilha: 'A',
    subtopicos: [
      { id: 'so-processos', nome: 'Processos, threads e escalonamento' },
      { id: 'so-memoria', nome: 'Memória, Linux e Windows' }
    ]
  },
  {
    id: 'nuvem', nome: 'Computação em Nuvem', curto: 'Nuvem', prova: 'E', questoes: 2, estimativa: true, trilha: 'A',
    subtopicos: [{ id: 'nuvem-modelos', nome: 'IaaS, PaaS, SaaS e modelos de implantação' }]
  },
  {
    id: 'ing', nome: 'Inglês Técnico', curto: 'Inglês', prova: 'E', questoes: 2, estimativa: true, trilha: 'A',
    subtopicos: [{ id: 'ing-leitura', nome: 'Leitura de textos técnicos' }]
  }
];

export const BLOCO_POR_ID: Record<string, Bloco> = Object.fromEntries(BLOCOS.map((b) => [b.id, b]));

export const TOPICO_PARA_BLOCO: Record<string, string> = Object.fromEntries(
  BLOCOS.flatMap((b) => b.subtopicos.map((s) => [s.id, b.id]))
);

export const NOME_TOPICO: Record<string, string> = Object.fromEntries(
  BLOCOS.flatMap((b) => b.subtopicos.map((s) => [s.id, s.nome]))
);

/** Valor de cada questão na nota final (cálculo do pilar 4): Gerais 1/9 ≈ 0,111; Específicos 2/15 ≈ 0,133. */
export function valorQuestao(prova: 'G' | 'E'): number {
  return prova === 'G' ? 1 / 9 : 2 / 15;
}

/** Datas-chave (fatos do edital e do pilar 5). */
export const DATAS = {
  inicio: '2026-11-23',
  inscricaoFim: '2026-12-11',
  boletoFim: '2026-12-14',
  convocacao: '2027-02-01',
  prova: '2027-02-21',
  simulados: [
    { n: 0, data: '2026-11-28', nome: 'Diagnóstico' },
    { n: 1, data: '2026-12-19', nome: 'Simulado 1' },
    { n: 2, data: '2027-01-02', nome: 'Simulado 2' },
    { n: 3, data: '2027-01-16', nome: 'Simulado 3' },
    { n: 4, data: '2027-01-30', nome: 'Simulado 4' },
    { n: 5, data: '2027-02-06', nome: 'Simulado 5' },
    { n: 6, data: '2027-02-14', nome: 'Simulado 6 (ensaio geral)' }
  ]
};

/** Foco por semana — cronograma do pilar 4 (sugestão, ajustável pelo diagnóstico). */
export const FOCO_SEMANA: Record<number, { foco: string; blocos: string[]; fator: number }> = {
  1: { foco: 'Largada: diagnóstico e Português', blocos: ['pt', 'bd'], fator: 0.7 },
  2: { foco: 'Português + SQL', blocos: ['pt', 'bd'], fator: 0.7 },
  3: { foco: 'Banco de dados e Português', blocos: ['bd', 'pt'], fator: 1 },
  4: { foco: 'Programação OO e Python', blocos: ['prog'], fator: 1 },
  5: { foco: 'Eng. de software, UML, Scrum, testes', blocos: ['es'], fator: 0.7 },
  6: { foco: 'Matemática financeira e estatística', blocos: ['rlm'], fator: 0.7 },
  7: { foco: 'Governança: PMBOK, ITIL, COBIT, 14.133', blocos: ['gov'], fator: 1 },
  8: { foco: 'Segurança, LGPD, Ética e ESG', blocos: ['seg', 'eti'], fator: 1 },
  9: { foco: 'Web, APIs, arquitetura e Atualidades', blocos: ['web', 'arq', 'atu'], fator: 1 },
  10: { foco: 'DevOps, nuvem, SO, redes e RLM', blocos: ['devops', 'nuvem', 'so', 'redes', 'rlm'], fator: 1 },
  11: { foco: 'Blocos com mais pontos a recuperar', blocos: [], fator: 1 },
  12: { foco: 'Revisão e banco de erros', blocos: [], fator: 0.8 },
  13: { foco: 'Só revisão leve', blocos: [], fator: 0.4 }
};
