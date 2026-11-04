import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME, chestPool, validateGameConfig, type GameConfig } from './index';
import { itemById } from '../../data/items';

const pool = chestPool();
const check = (cfg: GameConfig) => validateGameConfig(cfg, pool, (id) => !!itemById(id));
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe('conferência da configuração do jogo', () => {
  it('a configuração padrão está certa', () => {
    expect(check(DEFAULT_GAME)).toEqual([]);
  });

  it('acha os erros comuns antes de salvar', () => {
    const c = clone(DEFAULT_GAME);
    c.chests.ouro.odds.raro = 50; // soma passa de 100
    c.arenas[3].level = 2; // fora de ordem
    c.collections[0].items.push('nao-existe');
    c.season.tiers[9].days = 31; // nem todo mês tem 31 dias
    c.rarities.raro.craft = 10; // fabricar mais barato que um repetido rende
    c.pity.softFrom = 20; // depois da garantia
    const errs = check(c).join('\n');
    expect(errs).toMatch(/Baú de Ouro: as chances somam 112%/);
    expect(errs).toMatch(/Arena 4: precisa abrir num nível maior/);
    expect(errs).toMatch(/"nao-existe" não existe/);
    expect(errs).toMatch(/degrau 10: de 1 a 28 dias/);
    expect(errs).toMatch(/Raridade raro: fabricar precisa custar mais/);
    expect(errs).toMatch(/Proteção: a chance começa a subir antes/);
  });
});
