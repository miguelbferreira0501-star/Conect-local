// Configuração do jogo em uso no app (a padrão, ou a que o servidor mandar).
import { DEFAULT_GAME, type GameConfig } from '../shared/game';

let cfg: GameConfig = DEFAULT_GAME;
export const gameCfg = () => cfg;
export function setGameCfg(next: GameConfig) {
  cfg = next;
}
