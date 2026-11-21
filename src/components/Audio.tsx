import { useEffect, useState } from 'react';
import { getConfig } from '../db';
import { Icon } from './Icon';

/** Áudio-resumo com a síntese de voz do próprio aparelho (funciona offline quando há voz pt-BR instalada). */
export function AudioResumo({ texto, rotulo = 'Ouvir resumo' }: { texto: string; rotulo?: string }) {
  const [tocando, setTocando] = useState(false);
  const [rate, setRate] = useState(1.05);
  const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    getConfig().then((c) => setRate(c.vozRate));
    return () => { if (suportado) window.speechSynthesis.cancel(); };
  }, [suportado]);

  if (!suportado) return <p className="tiny">Este navegador não tem síntese de voz. No Android, use o Chrome; no iPad, o Safari.</p>;

  function tocar() {
    const s = window.speechSynthesis;
    s.cancel();
    const vozes = s.getVoices();
    const voz = vozes.find((v) => v.lang === 'pt-BR') ?? vozes.find((v) => v.lang.startsWith('pt'));
    // divide em frases para não travar em textos longos (limite de alguns navegadores)
    const partes = texto.replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]?/g) ?? [texto];
    partes.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p.trim());
      u.lang = 'pt-BR';
      if (voz) u.voice = voz;
      u.rate = rate;
      if (i === partes.length - 1) u.onend = () => setTocando(false);
      s.speak(u);
    });
    setTocando(true);
  }

  function parar() {
    window.speechSynthesis.cancel();
    setTocando(false);
  }

  return (
    <div className="row">
      {!tocando ? (
        <button className="btn" onClick={tocar}><Icon nome="audio" size={20} /> {rotulo}</button>
      ) : (
        <button className="btn" onClick={parar}><Icon nome="stop" size={20} /> Parar</button>
      )}
      <select aria-label="Velocidade" value={rate} onChange={(e) => setRate(Number(e.target.value))} style={{ width: 'auto' }}>
        {[0.9, 1, 1.05, 1.15, 1.25, 1.4].map((r) => <option key={r} value={r}>{r.toString().replace('.', ',')}×</option>)}
      </select>
    </div>
  );
}
