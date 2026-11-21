/**
 * Modelo de domínio por tópico — aprende com cada resposta (aprendizado de máquina online).
 *
 * É um modelo de Teoria de Resposta ao Item (TRI) de 1 parâmetro com acerto ao acaso, ajustado online
 * por gradiente (estilo Elo):
 *   P(acerto) = c + (1 − c) · σ(θ_tópico − b_questão),  com c = 0,2 (1 em 5 alternativas).
 * A cada resposta: θ += K·(y − P) e b −= K_b·(y − P). Ou seja, o app aprende ao mesmo tempo
 * o quanto você domina o tópico (θ) e o quanto cada questão é difícil PARA VOCÊ (b).
 * Esquecimento: sem prática, θ volta devagar para o valor inicial (meia-vida de ~6 semanas).
 */

export const ACASO = 0.2;
const MEIA_VIDA_DIAS = 42;

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function logit(p: number): number {
  return Math.log(p / (1 - p));
}

export function pAcerto(theta: number, b: number): number {
  return ACASO + (1 - ACASO) * sigmoid(theta - b);
}

/** θ inicial a partir da autoavaliação 0–3 (0 nunca estudei … 3 resolvo questões com segurança). */
export function thetaInicial(auto?: number): number {
  // probabilidade esperada numa questão média: 0 → 30%, 1 → 40%, 2 → 55%, 3 → 72%
  const alvo = [0.3, 0.4, 0.55, 0.72][Math.max(0, Math.min(3, auto ?? 0))];
  return logit((alvo - ACASO) / (1 - ACASO));
}

export function bInicial(dif: 1 | 2 | 3): number {
  return dif === 1 ? -0.7 : dif === 2 ? 0 : 0.8;
}

/** θ efetivo hoje, com esquecimento em direção ao valor inicial. */
export function thetaEfetivo(theta: number, theta0: number, ultimo: number, agora: number): number {
  if (!ultimo) return theta;
  const dias = Math.max(0, (agora - ultimo) / 86400000);
  const fator = Math.pow(0.5, dias / MEIA_VIDA_DIAS);
  return theta0 + (theta - theta0) * fator;
}

export interface UpdateResult {
  theta: number;
  b: number;
  p: number;
}

/** Atualiza θ e b após uma resposta. y = 1 acerto real; chute certo conta como 0 (regra do pilar 4). */
export function atualizar(theta: number, n: number, b: number, vistasQ: number, y: 0 | 1): UpdateResult {
  const p = pAcerto(theta, b);
  const k = Math.max(0.15, 0.6 / Math.sqrt(1 + n / 4)); // aprende rápido no início e estabiliza
  const kb = Math.max(0.05, 0.25 / Math.sqrt(1 + vistasQ));
  const erro = y - p;
  return { theta: clamp(theta + k * erro, -4, 4), b: clamp(b - kb * erro, -3, 3), p };
}

/** Domínio exibido: chance de acertar uma questão de dificuldade média (b = 0). */
export function dominio(theta: number): number {
  return pAcerto(theta, 0);
}

/** Incerteza: quanto menos dados, maior (de 1 a ~0). Usada para explorar tópicos pouco vistos. */
export function incerteza(n: number): number {
  return 1 / Math.sqrt(1 + n / 3);
}

function clamp(x: number, a: number, b: number) {
  return Math.min(b, Math.max(a, x));
}
