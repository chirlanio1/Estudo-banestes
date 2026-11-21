// Tipos centrais do Painel PROVA

export type ProvaTipo = 'G' | 'E'; // Conhecimentos Gerais (peso 1) | Específicos (peso 2)

export interface Subtopico {
  id: string;
  nome: string;
}

export interface Bloco {
  id: string;
  nome: string;
  curto: string;
  prova: ProvaTipo;
  /** Questões na prova: dado do edital (Gerais) ou estimativa (Específicos, matriz 4.2 do pilar 4). */
  questoes: number;
  estimativa: boolean;
  trilha: 'A' | 'B' | 'C' | 'D';
  subtopicos: Subtopico[];
}

/** Origem da questão: autoria do app (IA, estilo FCC), FCC real importada, outra banca, IA gerada no app. */
export type Origem = 'app' | 'fcc' | 'outra' | 'ia';

/** Como a questão foi conferida antes de entrar no banco. */
export type Verificacao =
  | 'executado' // código executado e saída conferida
  | 'calculado' // conta refeita e conferida
  | 'gramatica' // conferida pela gramática normativa
  | 'fonte' // conferida com o texto da fonte citada
  | 'conferir'; // não verificada: conferir na fonte oficial antes de confiar

export interface Questao {
  id: string;
  topico: string; // id do subtópico
  dif: 1 | 2 | 3;
  enunciado: string;
  codigo?: string;
  alternativas: [string, string, string, string, string];
  correta: 0 | 1 | 2 | 3 | 4;
  explicacao: string;
  fonte?: string;
  verificacao: Verificacao;
  origem: Origem;
}

export type CausaErro = 'nao-sabia' | 'confundi' | 'pegadinha' | 'atencao' | 'chute' | 'tempo';

export interface Attempt {
  id?: number;
  qid: string;
  topico: string;
  bloco: string;
  ts: number;
  correta: boolean;
  chute: boolean;
  escolha: number;
  ms: number;
  sessao: string;
  pos: number; // posição na sessão (1..n)
  minutoSessao: number; // minutos desde o início da sessão
  modo: 'pre' | 'pilula' | 'pratica' | 'simulado' | 'erros';
  origem: Origem;
  causa?: CausaErro;
}

export interface QState {
  qid: string;
  b: number; // dificuldade aprendida (escala logit)
  vistas: number;
  acertos: number;
  card: SerializedCard;
}

export interface SerializedCard {
  due: number;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: number;
}

export interface Mastery {
  topico: string;
  theta: number;
  n: number;
  acertos: number;
  last: number;
  precisaTeoria?: boolean;
  teoriaVista?: number;
}

export interface Flashcard {
  id?: number;
  frente: string;
  verso: string;
  topico: string;
  fonte: 'kit' | 'erro' | 'ia' | 'manual';
  criado: number;
  introduzido: boolean;
  card: SerializedCard;
  qid?: string;
}

export interface Revisao {
  id?: number;
  cardId: number;
  ts: number;
  nota: 1 | 2 | 3 | 4;
  ms: number;
}

export interface Sessao {
  id: string;
  inicio: number;
  fim?: number;
  tipo: 'pilula' | 'minima' | 'esgotado' | 'pratica' | 'revisao' | 'simulado' | 'erros';
  topico?: string;
  concluida: boolean;
  minutos?: number;
}

export interface Simulado {
  id?: number;
  data: string; // yyyy-mm-dd
  numero: number; // 0 = diagnóstico
  origem: 'app' | 'papel';
  pt: number;
  rlm: number;
  atu: number;
  eti: number;
  esp: number;
  minutos?: number;
  rasura?: boolean;
  porBloco?: Record<string, { q: number; a: number }>;
  nota: number;
}

export interface Evento {
  id?: number;
  ts: number;
  tipo: string;
  pontos: number;
  detalhe?: string;
}

export interface DiaLog {
  data: string;
  sono?: number;
  esgotado?: boolean;
  nota?: string;
}

export interface Pegadinha {
  id?: number;
  qid: string;
  topico: string;
  texto: string;
  ts: number;
}

export interface Config {
  id: 'cfg';
  nome?: string;
  horasSemana: number;
  dataProva: string;
  metaFinal: number;
  diagnostico?: number; // NP do diagnóstico (D)
  autoavaliacao: Record<string, number>; // bloco -> 0..3
  onboarding: boolean;
  novosPorDia: number;
  retencao: number;
  vozRate: number;
  apiKey?: string;
  ghToken?: string;
  ghRepo?: string;
  ultimoBackup?: number;
  ultimoSyncGitHub?: number;
}

export interface Kit {
  topico: string;
  titulo: string;
  resumo: string[]; // parágrafos curtos / tópicos
  comoCobra: string;
  pegadinhas: string[];
  mapa: MapaNo;
  cartoes: { f: string; v: string }[];
  fontes: string[];
  verificacao: Verificacao;
}

export interface MapaNo {
  t: string;
  c?: MapaNo[];
}
