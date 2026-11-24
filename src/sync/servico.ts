import { db, rastreio } from '../db';
import { invalidarBanco } from '../store';
import { sincronizar, type EstadoSync } from './motor';
import { credenciais, remotoSupabase, supabase, traduzir } from './supabase';

export type StatusSync =
  | { tipo: 'sem-nuvem' } // projeto Supabase ainda não configurado
  | { tipo: 'sem-conta' } // configurado, mas ninguém entrou neste aparelho
  | { tipo: 'ok'; email: string; ultima?: number; sincronizando: boolean; erro?: string };

let status: StatusSync = { tipo: 'sem-nuvem' };
const ouvintes = new Set<(s: StatusSync) => void>();
let usuario: { id: string; email: string } | null = null;
let rodando: Promise<void> | null = null;
let pendente = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let ligado = false;

function emitir(s: StatusSync) {
  status = s;
  ouvintes.forEach((f) => f(s));
}
export function statusAtual() {
  return status;
}
export function ouvirStatus(f: (s: StatusSync) => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

const chaveEstado = (uid: string) => 'painel-prova-sync-' + uid;
function lerEstado(uid: string): EstadoSync {
  try {
    return JSON.parse(localStorage.getItem(chaveEstado(uid)) ?? 'null') ?? { cursor: null, enviadoAte: 0 };
  } catch {
    return { cursor: null, enviadoAte: 0 };
  }
}
function ultimaSync(uid: string): number | undefined {
  return Number(localStorage.getItem(chaveEstado(uid) + '-quando')) || undefined;
}

/** Chamado na abertura do app: recupera a sessão e sincroniza. */
export async function iniciarSync() {
  if (!credenciais()) return emitir({ tipo: 'sem-nuvem' });
  const sb = await supabase();
  if (!sb) return emitir({ tipo: 'sem-nuvem' });
  const { data } = await sb.auth.getSession();
  const u = data.session?.user;
  if (!u) return emitir({ tipo: 'sem-conta' });
  usuario = { id: u.id, email: u.email ?? '' };
  emitir({ tipo: 'ok', email: usuario.email, ultima: ultimaSync(u.id), sincronizando: false });
  rastreio.aoMudar = () => agendar(15000);
  if (!ligado) {
    ligado = true;
    window.addEventListener('online', () => sincronizarAgora());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sincronizarAgora();
      else agendar(1000);
    });
    setInterval(() => document.visibilityState === 'visible' && sincronizarAgora(), 3 * 60 * 1000);
  }
  await sincronizarAgora();
}

function agendar(ms: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => sincronizarAgora(), ms);
}

export async function sincronizarAgora(): Promise<void> {
  if (!usuario) return;
  if (rodando) {
    pendente = true;
    return rodando;
  }
  const u = usuario;
  rodando = (async () => {
    emitir({ tipo: 'ok', email: u.email, ultima: ultimaSync(u.id), sincronizando: true });
    try {
      const sb = (await supabase())!;
      const r = await sincronizar(db, remotoSupabase(sb, u.id), lerEstado(u.id));
      localStorage.setItem(chaveEstado(u.id), JSON.stringify(r.estado));
      localStorage.setItem(chaveEstado(u.id) + '-quando', String(Date.now()));
      emitir({ tipo: 'ok', email: u.email, ultima: Date.now(), sincronizando: false });
      if (r.recebidos > 0) {
        invalidarBanco();
        window.dispatchEvent(new CustomEvent('painel-dados-mudaram'));
      }
    } catch (e) {
      emitir({ tipo: 'ok', email: u.email, ultima: ultimaSync(u.id), sincronizando: false, erro: traduzir((e as Error).message) });
    }
  })();
  try {
    await rodando;
  } finally {
    rodando = null;
    if (pendente) {
      pendente = false;
      agendar(500);
    }
  }
}

/** Entrar ou criar conta com e-mail e senha. Devolve mensagem para mostrar (ou null se deu certo). */
export async function entrar(email: string, senha: string, criar: boolean): Promise<string | null> {
  const sb = await supabase();
  if (!sb) return 'Configure primeiro o endereço e a chave do Supabase.';
  const r = criar ? await sb.auth.signUp({ email, password: senha }) : await sb.auth.signInWithPassword({ email, password: senha });
  if (r.error) return traduzir(r.error.message);
  if (!r.data.session) return 'Conta criada. Abra o e-mail de confirmação do Supabase, clique no link e depois toque em "Entrar".';
  await iniciarSync();
  return null;
}

export async function sair() {
  const sb = await supabase();
  await sb?.auth.signOut();
  usuario = null;
  rastreio.aoMudar = null;
  emitir({ tipo: 'sem-conta' });
}
