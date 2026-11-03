// Tela que abre pelo link do e-mail "Trocar a senha do HamiCare" (…/#redefinir=TOKEN).
import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Modal, toast } from '../components/ui';
import { Hamster } from '../components/Hamster';
import { checkReset, finishReset } from '../lib/account';
import { ApiError } from '../lib/social/api';
import { useApp } from '../lib/store';
import { SyncChoiceModal } from './Account';

/** Pega o código do link uma vez e tira da barra de endereço (não fica no histórico nem em capturas de tela). */
function takeToken(): string | null {
  const m = location.hash.match(/^#redefinir=([\w-]{32,128})$/);
  if (!m) return null;
  try {
    history.replaceState(null, '', location.pathname + location.search);
  } catch {
    /* alguns visualizadores bloqueiam: segue do mesmo jeito */
  }
  return m[1];
}
/** Fica guardado fora do componente: se a tela troca (ex.: o progresso volta da nuvem), não pede o link de novo. */
let pending = takeToken();

type Stage = 'checando' | 'form' | 'vencido' | 'pronto';

export function ResetPassword() {
  const s = useApp();
  const [token, setToken] = useState(() => pending);
  const [stage, setStage] = useState<Stage>('checando');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);

  function verify(t: string) {
    setStage('checando');
    checkReset(t)
      .then((ok) => setStage(ok ? 'form' : 'vencido'))
      .catch(() => setStage('vencido'));
  }

  // Link colado com o app já aberto: a página não recarrega, só o endereço muda.
  useEffect(() => {
    const onHash = () => {
      const t = takeToken();
      if (!t) return;
      pending = t;
      setToken(t);
      setPassword('');
      setAgain('');
      verify(t);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (pending) verify(pending);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!token) return null;
  const close = () => {
    pending = null;
    setStage('pronto');
  };
  const mismatch = again.length > 0 && again !== password;

  return (
    <>
      <SyncChoiceModal />
      <Modal open={stage !== 'pronto'} onClose={stage === 'form' ? () => {} : close} label="Criar senha nova">
        <div className="grid gap-3 p-5">
          <div className="flex items-center gap-3">
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={64} idle={false} mood={stage === 'vencido' ? 'surpreso' : 'feliz'} />
            <h2 className="font-display text-[22px] font-bold leading-tight">{stage === 'vencido' ? 'Esse link não vale mais' : 'Criar senha nova'}</h2>
          </div>
          {stage === 'checando' && <p className="text-[14px] text-muted">Conferindo o link…</p>}
          {stage === 'vencido' && (
            <>
              <p className="text-[14px] text-muted">O link de troca de senha vale por 1 hora e funciona uma vez só. Peça outro em Ajustes → Conta e nuvem → Já tenho conta → Esqueci minha senha.</p>
              <button className="btn btn-primary" onClick={close}>
                Entendi
              </button>
            </>
          )}
          {stage === 'form' && (
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                pending = null;
                try {
                  const r = await finishReset(token, password);
                  close();
                  toast(r === 'nuvem' ? 'Senha nova salva! Seu progresso voltou da nuvem.' : 'Senha nova salva! Você já entrou na conta.');
                } catch (err) {
                  if (err instanceof ApiError && err.status === 410) setStage('vencido');
                  else toast(err instanceof ApiError ? err.message : 'Não deu certo agora.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <p className="text-[14px] text-muted">Escolha uma senha com pelo menos 8 caracteres. Ao salvar, sua conta sai dos outros aparelhos por segurança.</p>
              <label className="grid gap-1" htmlFor="reset-pass">
                <span className="text-[14px] font-extrabold">Senha nova</span>
                <input id="reset-pass" type="password" autoComplete="new-password" minLength={8} className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label className="grid gap-1" htmlFor="reset-again">
                <span className="text-[14px] font-extrabold">Repita a senha</span>
                <input id="reset-again" type="password" autoComplete="new-password" className="field" value={again} onChange={(e) => setAgain(e.target.value)} aria-invalid={mismatch} />
              </label>
              {mismatch && <p className="text-[13px] font-bold text-accent">As duas senhas estão diferentes.</p>}
              <button className="btn btn-primary" type="submit" disabled={busy || password.length < 8 || again !== password}>
                <KeyRound size={18} /> {busy ? 'Salvando…' : 'Salvar senha nova'}
              </button>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
