import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getConfig } from './db';
import { Hoje } from './screens/Hoje';
import { Pilula } from './screens/Pilula';
import { Pratica } from './screens/Pratica';
import { Revisar } from './screens/Revisar';
import { Trilhas, TopicoDetalhe } from './screens/Trilhas';
import { SimuladoTela } from './screens/Simulado';
import { Painel } from './screens/Painel';
import { Mais } from './screens/Mais';
import { Onboarding } from './screens/Onboarding';
import { Caderno } from './screens/Caderno';
import { Importar } from './screens/Importar';
import { Provas } from './screens/Provas';
import { IAGerar } from './screens/IA';
import { Configuracoes } from './screens/Configuracoes';
import { Sobre } from './screens/Sobre';
import { Icon } from './components/Icon';

export type Rota =
  | { r: 'hoje' }
  | { r: 'pilula'; topico?: string; tipo?: 'pilula' | 'minima' | 'esgotado' }
  | { r: 'pratica'; topicos?: string[]; modo?: 'livre' | 'erros' | 'bloco'; titulo?: string; n?: number }
  | { r: 'revisar' }
  | { r: 'trilhas' }
  | { r: 'topico'; id: string }
  | { r: 'simulado' }
  | { r: 'painel' }
  | { r: 'mais' }
  | { r: 'caderno' }
  | { r: 'importar' }
  | { r: 'provas' }
  | { r: 'ia' }
  | { r: 'config' }
  | { r: 'sobre' };

interface Nav {
  ir: (r: Rota) => void;
  voltar: () => void;
  toast: (t: string) => void;
}
const NavCtx = createContext<Nav>({ ir: () => {}, voltar: () => {}, toast: () => {} });
export const useNav = () => useContext(NavCtx);

const ABAS: { r: Rota['r']; rotulo: string; icone: string }[] = [
  { r: 'hoje', rotulo: 'Hoje', icone: 'home' },
  { r: 'trilhas', rotulo: 'Trilhas', icone: 'map' },
  { r: 'revisar', rotulo: 'Revisar', icone: 'cards' },
  { r: 'simulado', rotulo: 'Simulado', icone: 'clock' },
  { r: 'painel', rotulo: 'Painel', icone: 'chart' },
  { r: 'mais', rotulo: 'Mais', icone: 'more' }
];

const TITULOS: Partial<Record<Rota['r'], string>> = {
  hoje: 'Painel PROVA', trilhas: 'Trilhas do edital', revisar: 'Revisão espaçada', simulado: 'Simulados', painel: 'Painel de metas',
  mais: 'Mais', caderno: 'Caderno de erros', importar: 'Importar questões', provas: 'Provas oficiais', ia: 'Gerar com IA',
  config: 'Configurações e backup', sobre: 'Como o app funciona', pilula: 'Missão', pratica: 'Questões', topico: 'Tópico'
};

export function App() {
  const [pilha, setPilha] = useState<Rota[]>([{ r: 'hoje' }]);
  const [pronto, setPronto] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const rota = pilha[pilha.length - 1];

  const [versao, setVersao] = useState(0);
  useEffect(() => {
    getConfig().then((c) => setPronto(c.onboarding));
    // dados chegaram de outro aparelho: recarrega a tela atual (nunca no meio de missão ou simulado)
    const f = () => {
      getConfig().then((c) => c.onboarding && setPronto(true));
      setVersao((v) => v + 1);
    };
    window.addEventListener('painel-dados-mudaram', f);
    return () => window.removeEventListener('painel-dados-mudaram', f);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [rota]);

  const nav: Nav = {
    ir: (r) => setPilha((p) => (ABAS.some((a) => a.r === r.r) ? [r] : [...p, r])),
    voltar: () => setPilha((p) => (p.length > 1 ? p.slice(0, -1) : p)),
    toast: (t) => {
      setMsg(t);
      setTimeout(() => setMsg(null), 3200);
    }
  };

  if (pronto === null) return null;
  if (!pronto) return <NavCtx.Provider value={nav}><Onboarding onFim={() => setPronto(true)} /></NavCtx.Provider>;

  const imersiva = rota.r === 'pilula' || rota.r === 'pratica';
  const abaAtiva = ABAS.find((a) => a.r === rota.r)?.r ?? (rota.r === 'topico' ? 'trilhas' : ['caderno', 'importar', 'provas', 'ia', 'config', 'sobre'].includes(rota.r) ? 'mais' : undefined);

  let tela: ReactNode;
  switch (rota.r) {
    case 'hoje': tela = <Hoje />; break;
    case 'pilula': tela = <Pilula topico={rota.topico} tipo={rota.tipo ?? 'pilula'} />; break;
    case 'pratica': tela = <Pratica topicos={rota.topicos} modo={rota.modo ?? 'livre'} titulo={rota.titulo} n={rota.n} />; break;
    case 'revisar': tela = <Revisar />; break;
    case 'trilhas': tela = <Trilhas />; break;
    case 'topico': tela = <TopicoDetalhe id={rota.id} />; break;
    case 'simulado': tela = <SimuladoTela />; break;
    case 'painel': tela = <Painel />; break;
    case 'mais': tela = <Mais />; break;
    case 'caderno': tela = <Caderno />; break;
    case 'importar': tela = <Importar />; break;
    case 'provas': tela = <Provas />; break;
    case 'ia': tela = <IAGerar />; break;
    case 'config': tela = <Configuracoes />; break;
    case 'sobre': tela = <Sobre />; break;
  }

  return (
    <NavCtx.Provider value={nav}>
      <div className="app">
        <header className="topbar">
          {pilha.length > 1 && (
            <button className="back" aria-label="Voltar" onClick={nav.voltar}>‹</button>
          )}
          <h1>{TITULOS[rota.r]}</h1>
        </header>
        <main key={pilha.length + rota.r + (imersiva || rota.r === 'simulado' ? '' : ':' + versao)}>{tela}</main>
        {!imersiva && (
          <nav className="nav" aria-label="Navegação principal">
            {ABAS.map((a) => (
              <button key={a.r} className={abaAtiva === a.r ? 'on' : ''} onClick={() => nav.ir({ r: a.r } as Rota)} aria-current={abaAtiva === a.r ? 'page' : undefined}>
                <Icon nome={a.icone} />
                {a.rotulo}
              </button>
            ))}
          </nav>
        )}
        {msg && <div className="toast" role="status">{msg}</div>}
      </div>
    </NavCtx.Provider>
  );
}
