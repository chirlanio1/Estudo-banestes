/** Sincronização opcional do backup com um repositório GitHub (API de conteúdos). */

function b64(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function unb64(s: string) {
  const bin = atob(s.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const CAMINHO = 'backup/painel-prova.json';

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
}

export async function enviarBackup(token: string, repo: string, conteudo: string): Promise<void> {
  const url = `https://api.github.com/repos/${repo}/contents/${CAMINHO}`;
  let sha: string | undefined;
  const atual = await fetch(url, { headers: headers(token) });
  if (atual.ok) sha = (await atual.json()).sha;
  else if (atual.status !== 404) throw new Error(`GitHub respondeu ${atual.status}. Confira o token e o nome do repositório.`);
  const r = await fetch(url, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `Backup do Painel PROVA ${new Date().toISOString()}`, content: b64(conteudo), sha })
  });
  if (!r.ok) throw new Error(`Falha ao enviar (${r.status}): ${(await r.json().catch(() => ({}))).message ?? ''}`);
}

export async function baixarBackup(token: string, repo: string): Promise<string> {
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${CAMINHO}`, { headers: headers(token) });
  if (!r.ok) throw new Error(r.status === 404 ? 'Ainda não há backup no repositório.' : `GitHub respondeu ${r.status}.`);
  const j = await r.json();
  if (j.content) return unb64(j.content);
  // arquivos grandes (> 1 MB) vêm sem conteúdo: baixa pelo blob
  const blob = await fetch(j.git_url, { headers: headers(token) });
  return unb64((await blob.json()).content);
}
