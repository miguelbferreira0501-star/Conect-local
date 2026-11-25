// Parque de jogos do Hami: grade de jogos, prêmios do dia e jogos exclusivos do Lumbi+.
import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Glyph } from '../art';
import { showPlusOffers } from '../PlusCard';
import { gameCoins, gameLocked, gamePrizesLeft, JOGO, PLUS_GAMES, useApp, type GameId } from '../../lib/store';
import { openUi } from '../../lib/bus';
import { play } from '../../lib/sound';
import { GameFrame, Me, type GameMeta } from './kit';
import { Kart, Keepy, Memory, Penalty } from './free';
import { Clouds, Skate, Volley } from './plus';

export const ARCADE: GameMeta[] = [
  { id: 'volei', name: 'Vôlei na praia', hint: 'Partida contra um rival', how: 'Use as setas para andar e o botão do meio para pular. Rebata a bola por cima da rede: quem fizer 5 pontos vence.', icon: '🏐', stars: [0, 8, 12], unit: 'pontos', tone: 'beach' },
  { id: 'skate', name: 'Skate radical', hint: 'Pule os obstáculos da cidade', how: 'O Hami anda de skate sozinho. Toque para pular os cones e caixas (dois toques fazem um pulo duplo) e pegue as sementes no ar.', icon: '🛹', stars: [0, 60, 140], unit: 'pontos', tone: 'city' },
  { id: 'nuvens', name: 'Pula nuvens', hint: 'Suba o mais alto que der', how: 'O Hami quica sozinho nas nuvens. Arraste o dedo para os lados para guiar. Nuvens com estrela dão um superpulo!', icon: '☁️', stars: [0, 60, 150], unit: 'pontos', tone: 'sky' },
  { id: 'embaixadinha', name: 'Embaixadinha', hint: 'Não deixe a bola cair', how: 'Toque na bola para chutar para cima. Toque do lado para mandar ela para o outro lado. Quantas embaixadinhas você consegue?', icon: '⚽', stars: [0, 12, 25], unit: 'embaixadinhas', tone: 'grass' },
  { id: 'carrinho', name: 'Corrida de carrinho', hint: 'Desvie dos cones', how: 'Toque à esquerda ou à direita para trocar de pista. Desvie dos cones e pedras e pegue sementes e estrelas.', icon: '🚗', stars: [0, 25, 55], unit: 'pontos', tone: 'road' },
  { id: 'penalti', name: 'Pênalti', hint: '5 chutes contra o goleiro', how: 'Toque no canto do gol para chutar. O goleiro se mexe: escolha bem o canto!', icon: '🥅', stars: [0, 3, 5], unit: 'gols', tone: 'pitch' },
  { id: 'memoria', name: 'Memória do Hami', hint: 'Ache os pares', how: 'Vire duas cartas por vez e ache os pares iguais com o menor número de jogadas.', icon: '🃏', stars: [0, 10, 14], unit: 'pontos', tone: 'cards' },
  { id: 'chuva', name: 'Chuva de sementes', hint: 'Pegue o que cai do céu', how: '', icon: '🌻', stars: [0, 30, 50], unit: 'pontos', tone: 'rain' },
  { id: 'bolinha', name: 'Busca a bolinha', hint: 'Jogue e ele traz de volta', how: '', icon: '🎾', stars: [0, 99, 99], unit: '', tone: 'grass' },
];
export const metaOf = (id: GameId) => ARCADE.find((g) => g.id === id)!;

const GAME_VIEW: Partial<Record<GameId, (p: { end: (score: number) => void }) => ReactNode>> = {
  volei: Volley,
  skate: Skate,
  nuvens: Clouds,
  embaixadinha: Keepy,
  carrinho: Kart,
  penalti: Penalty,
  memoria: Memory,
};

/** As duas brincadeiras antigas continuam com a tela própria (vêm do Cuidar). */
export function ArcadeHub({ onClose, legacy }: { onClose: () => void; legacy: Partial<Record<GameId, (back: () => void) => ReactNode>> }) {
  const s = useApp();
  const [game, setGame] = useState<GameId | null>(null);
  const kid = s.profile.ageGroup === 'ate12';
  const left = gamePrizesLeft(s);
  if (game) {
    const back = () => setGame(null);
    const old = legacy[game];
    if (old) return <>{old(back)}</>;
    const View = GAME_VIEW[game]!;
    return (
      <GameFrame meta={metaOf(game)} onExit={back} onClose={onClose}>
        {(end) => <View end={end} />}
      </GameFrame>
    );
  }
  // Para crianças de até 12 anos, nada de oferta do Plus: os jogos exclusivos nem aparecem.
  const list = ARCADE.filter((g) => !(kid && gameLocked(s, g.id)));
  const pick = (g: GameMeta) => {
    if (gameLocked(s, g.id)) {
      if (showPlusOffers(s)) {
        onClose();
        openUi('plus');
      }
      return;
    }
    play('pulo');
    setGame(g.id);
  };
  return (
    <div className="fullscreen arc-hub" role="dialog" aria-modal="true" aria-label="Parque de jogos">
      <div className="arc-hub-in">
        <div className="arc-top">
          <div className="min-w-0">
            <h2 className="arc-hub-title">Parque de jogos</h2>
            <p className="arc-hub-sub">Brinque com o {s.pet.name} e ganhe sementes</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Sair">
            <X size={20} />
          </button>
        </div>
        <div className="arc-daily">
          <span className="arc-daily-pet">
            <Me size={64} mood="animado" />
          </span>
          <span className="min-w-0">
            <b>
              {left} de {JOGO.perDay} partidas premiadas hoje
            </b>
            <span className="arc-daily-bar">
              <span style={{ width: `${(left / JOGO.perDay) * 100}%` }} />
            </span>
            <small>Cada partida vale de 1 a 3 estrelas. Mais estrelas, mais sementes!</small>
          </span>
        </div>
        <div className="arc-tiles">
          {list.map((g) => {
            const locked = gameLocked(s, g.id);
            const plus = PLUS_GAMES.includes(g.id);
            return (
              <button key={g.id} className={`arc-tile arc-${g.tone} ${plus ? 'is-plus' : ''} ${locked ? 'is-locked' : ''}`} onClick={() => pick(g)}>
                {plus && <span className="arc-tile-plus">{locked ? '🔒 ' : ''}PLUS</span>}
                <span className="arc-tile-art icon-still" aria-hidden="true">
                  <Glyph e={g.icon} size={58} />
                </span>
                <span className="arc-tile-name">{g.name}</span>
                <span className="arc-tile-hint">{g.hint}</span>
                <span className="arc-tile-prize">
                  <Glyph e="🌻" size={16} /> até {gameCoins(g.id, 3)}
                </span>
              </button>
            );
          })}
        </div>
        {showPlusOffers(s) && (
          <button className="arc-plus-cta" onClick={() => (onClose(), openUi('plus'))}>
            <Glyph e="👑" size={26} /> Com o Lumbi+ você libera vôlei, skate e pula nuvens, e eles valem mais sementes
          </button>
        )}
      </div>
    </div>
  );
}
