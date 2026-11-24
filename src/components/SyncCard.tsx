import { useEffect, useState } from 'react';
import { entrar, ouvirStatus, sair, sincronizarAgora, statusAtual, type StatusSync } from '../sync/servico';
import { credenciaisEmbutidas, salvarCredenciais } from '../sync/supabase';
import { iniciarSync } from '../sync/servico';

export function useStatusSync() {
  const [s, setS] = useState<StatusSync>(statusAtual());
  useEffect(() => {
    const off = ouvirStatus(setS);
    return () => { off(); };
  }, []);
  return s;
}

export function quandoTexto(t?: number) {
  if (!t) return 'ainda não';
  const d = new Date(t);
  const hoje = new Date().toDateString() === d.toDateString();
  return hoje ? 'hoje às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** Cartão de conta e sincronização: o mesmo histórico no celular, no tablet e no computador. */
export function SyncCard({ aoEntrar }: { aoEntrar?: () => void }) {
  const s = useStatusSync();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [url, setUrl] = useState('');
  const [chave, setChave] = useState('');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function acao(criar: boolean) {
    setOcupado(true);
    setMsg('');
    const r = await entrar(email.trim(), senha, criar);
    setOcupado(false);
    if (r) setMsg(r);
    else aoEntrar?.();
  }

  if (s.tipo === 'sem-nuvem') {
    return (
      <div className="card">
        <h2>Mesmo histórico em todos os aparelhos</h2>
        <p className="small muted" style={{ marginTop: 0 }}>Falta ligar a nuvem gratuita (Supabase). Siga o passo a passo enviado no chat. {credenciaisEmbutidas() ? '' : 'Se já tem o projeto, cole aqui o endereço e a chave pública:'}</p>
        <label>Project URL</label>
        <input type="url" value={url} placeholder="https://xxxx.supabase.co" onChange={(e) => setUrl(e.target.value)} />
        <label>Chave pública (anon / publishable)</label>
        <input type="text" value={chave} placeholder="eyJ... ou sb_publishable_..." onChange={(e) => setChave(e.target.value)} autoComplete="off" />
        <button className="btn primary" style={{ marginTop: 10 }} disabled={!url.startsWith('https://') || chave.length < 20} onClick={async () => { salvarCredenciais(url, chave); await iniciarSync(); }}>Salvar</button>
      </div>
    );
  }

  if (s.tipo === 'sem-conta') {
    return (
      <div className="card">
        <h2>Entre para unir seus aparelhos</h2>
        <p className="small muted" style={{ marginTop: 0 }}>Use o mesmo e-mail e senha no celular, no tablet e no computador. Na primeira entrada, o que já existe neste aparelho é somado ao histórico da conta (nada se perde).</p>
        <label>E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <label>Senha (mínimo 6 caracteres)</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" disabled={ocupado || !email.includes('@') || senha.length < 6} onClick={() => acao(false)}>Entrar</button>
          <button className="btn" disabled={ocupado || !email.includes('@') || senha.length < 6} onClick={() => acao(true)}>Criar conta (1ª vez)</button>
        </div>
        {msg && <p className="small">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Sincronização entre aparelhos</h2>
      <p className="small" style={{ marginTop: 0 }}>Conectado como <b>{s.email}</b>. {s.sincronizando ? 'Sincronizando…' : `Última sincronização: ${quandoTexto(s.ultima)}.`}</p>
      <p className="tiny muted">Sincroniza sozinho ao abrir o app, a cada poucos minutos e ao sair. Sem internet, guarda aqui e envia depois.</p>
      {s.erro && <p className="small" style={{ color: 'var(--bad)' }}>{s.erro}</p>}
      <div className="row">
        <button className="btn primary" disabled={s.sincronizando} onClick={() => sincronizarAgora()}>Sincronizar agora</button>
        <button className="btn ghost" onClick={() => sair()}>Sair desta conta</button>
      </div>
    </div>
  );
}
