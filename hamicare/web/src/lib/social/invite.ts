// Convite por link (#amigo=HAMI-XXXXXX): quem abre o link cai em Amigos com o código já procurado.
// Fica guardado até a pessoa terminar o começo do app e entrar na conta.
import { copyText } from '../util';

const KEY = 'hamicare:convite';
const WEEK = 7 * 24 * 3600 * 1000;

/** Lê o convite do endereço (se tiver) e troca o endereço por #amigos. */
export function captureInvite(): boolean {
  const m = location.hash.match(/^#amigo=([\w-]{4,20})$/i);
  if (!m) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ code: decodeURIComponent(m[1]), at: Date.now() }));
    history.replaceState(null, '', '#amigos');
  } catch {
    /* sem armazenamento: o convite só não fica guardado */
  }
  return true;
}

export function pendingInvite(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { code: string; at: number } | null;
    return v && Date.now() - v.at < WEEK ? v.code : null;
  } catch {
    return null;
  }
}

export function clearInvite() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada a limpar */
  }
}

export const inviteLink = (code: string) => `${location.origin}/#amigo=${code}`;

/** Manda o convite pelo menu de compartilhar do celular; sem ele, copia. Devolve o aviso para mostrar ('' = nenhum). */
export async function shareInvite(code: string, withLink: boolean): Promise<string> {
  const text = `Vem cuidar do seu Hami comigo no HamiCare! Meu código de amigo é ${code}`;
  const url = withLink ? inviteLink(code) : undefined;
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'HamiCare', text, url });
      return '';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return '';
    }
  }
  return (await copyText(url ? `${text}\n${url}` : text)) ? 'Convite copiado. É só colar na conversa.' : `Seu código é ${code}`;
}
