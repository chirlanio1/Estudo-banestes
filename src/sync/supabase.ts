import type { SupabaseClient } from '@supabase/supabase-js';
import type { RegistroRemoto, Remoto } from './motor';
import { SUPABASE_CHAVE, SUPABASE_URL } from './config';

const CHAVE_LOCAL = 'painel-prova-nuvem';

export function credenciais(): { url: string; chave: string } | null {
  if (SUPABASE_URL && SUPABASE_CHAVE) return { url: SUPABASE_URL, chave: SUPABASE_CHAVE };
  try {
    const c = JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? 'null');
    return c?.url && c?.chave ? c : null;
  } catch {
    return null;
  }
}

export function credenciaisEmbutidas() {
  return !!(SUPABASE_URL && SUPABASE_CHAVE);
}

export function salvarCredenciais(url: string, chave: string) {
  localStorage.setItem(CHAVE_LOCAL, JSON.stringify({ url: url.trim().replace(/\/+$/, ''), chave: chave.trim() }));
  cliente = null;
}

let cliente: SupabaseClient | null = null;

export async function supabase(): Promise<SupabaseClient | null> {
  const c = credenciais();
  if (!c) return null;
  if (!cliente) {
    const { createClient } = await import('@supabase/supabase-js');
    cliente = createClient(c.url, c.chave, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'painel-prova-auth' } });
  }
  return cliente;
}

export function remotoSupabase(sb: SupabaseClient, userId: string): Remoto {
  return {
    async baixar(desde) {
      const out: RegistroRemoto[] = [];
      const passo = 1000;
      for (let i = 0; ; i += passo) {
        let q = sb.from('registros').select('tabela,chave,dados,atualizado,apagado,alterado').order('alterado', { ascending: true }).range(i, i + passo - 1);
        if (desde) q = q.gt('alterado', desde);
        const { data, error } = await q;
        if (error) throw new Error(traduzir(error.message));
        out.push(...((data ?? []) as RegistroRemoto[]));
        if (!data || data.length < passo) break;
      }
      return out;
    },
    async enviar(regs) {
      if (!regs.length) return;
      const linhas = regs.map((r) => ({ user_id: userId, tabela: r.tabela, chave: r.chave, dados: r.dados, atualizado: r.atualizado, apagado: r.apagado }));
      const { error } = await sb.from('registros').upsert(linhas, { onConflict: 'user_id,tabela,chave' });
      if (error) throw new Error(traduzir(error.message));
    }
  };
}

export function traduzir(m: string): string {
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(m)) return 'Falta confirmar o e-mail: abra a mensagem do Supabase e clique no link (ou desligue a confirmação no painel do Supabase).';
  if (/User already registered/i.test(m)) return 'Este e-mail já tem conta. Use "Entrar".';
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/relation .*registros.* does not exist|Could not find the table/i.test(m)) return 'A tabela "registros" não existe no Supabase. Rode o SQL do passo 3 no SQL Editor.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sem conexão com a nuvem agora. Os dados ficam guardados aqui e sincronizam quando a internet voltar.';
  if (/Invalid API key|No API key/i.test(m)) return 'Chave do Supabase inválida. Confira a chave "anon" / "publishable" copiada.';
  return m;
}
