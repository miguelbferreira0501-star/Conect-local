// O Hami dormindo de barriguinha para baixo (o da foto de referência), deitado direto no chão ou em cima do
// colchão da cama, com sombrinha de contato embaixo (para ficar "pousado" na cena, sem caminha por baixo).
// Ele respira devagar (só as costas sobem e descem) e solta os "z".
import { HamiPhoto, photoRatio, Zzz } from './HamiPhoto';

export function SleepingHami({ fur, size = 150, place = 'cama' }: { fur: string; size?: number; place?: 'cama' | 'chao' }) {
  const ph = size * photoRatio('dormindo');
  return (
    <span
      className={`sleep-hami sleep-photo is-${place}`}
      style={{ width: size, height: ph }}
      role="img"
      aria-label={place === 'cama' ? 'Hami dormindo na caminha' : 'Hami tirando uma soneca no chão'}
    >
      <span className="sleep-contact" aria-hidden="true" />
      {place === 'chao' && <span className="sleep-floor" aria-hidden="true" />}
      <HamiPhoto kind="dormindo" fur={fur} width={size} breathe />
      <span className="sleep-zzz">
        <Zzz size={Math.max(26, size * 0.22)} />
      </span>
    </span>
  );
}
