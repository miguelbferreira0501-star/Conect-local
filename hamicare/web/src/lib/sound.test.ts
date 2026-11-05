import { describe, expect, it } from 'vitest';
import { configureSound, renderAt, SOUND_IDS, soundForClick, startLoop, useContextForRendering } from './sound';
import { soundForChange } from './appSounds';
import { fresh } from './store';

// Contexto de áudio falso: confere que cada som monta nós válidos (rampas exponenciais nunca chegam a zero,
// tempos finitos) sem precisar de navegador.
function fakeAudio() {
  const problems: string[] = [];
  let started = 0;
  const param = (v = 0) => ({
    value: v,
    setValueAtTime: (x: number, t: number) => (!Number.isFinite(x) || !Number.isFinite(t) || t < 0) && problems.push(`setValueAtTime(${x}, ${t})`),
    exponentialRampToValueAtTime: (x: number, t: number) => (!(x > 0) || !Number.isFinite(t)) && problems.push(`exponentialRamp(${x}, ${t})`),
    linearRampToValueAtTime: () => {},
    setTargetAtTime: (x: number, t: number, k: number) => (!Number.isFinite(t) || !(k > 0)) && problems.push(`setTarget(${x}, ${t}, ${k})`),
    cancelScheduledValues: () => {},
  });
  const node = () => ({ connect: () => {}, disconnect: () => {} });
  const source = () => ({
    ...node(),
    start: (t = 0) => {
      if (!Number.isFinite(t) || t < 0) problems.push(`start(${t})`);
      started++;
    },
    stop: (t = 0) => !Number.isFinite(t) && problems.push(`stop(${t})`),
    onended: null as null | (() => void),
  });
  const ctx = {
    currentTime: 0,
    sampleRate: 8000,
    destination: node(),
    createGain: () => ({ ...node(), gain: param(1) }),
    createOscillator: () => ({ ...source(), type: 'sine', frequency: param(440) }),
    createBufferSource: () => ({ ...source(), buffer: null, loop: false }),
    createBiquadFilter: () => ({ ...node(), type: 'lowpass', frequency: param(350), Q: param(1) }),
    createConvolver: () => ({ ...node(), buffer: null }),
    createDynamicsCompressor: () => ({ ...node(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }),
    createStereoPanner: () => ({ ...node(), pan: param() }),
    createBuffer: (ch: number, len: number) => ({ getChannelData: () => new Float32Array(len), numberOfChannels: ch }),
  };
  return { ctx: ctx as unknown as BaseAudioContext, problems, started: () => started };
}

describe('efeitos sonoros', () => {
  it('cada som monta nós válidos', () => {
    const f = fakeAudio();
    configureSound({ enabled: () => true, volume: () => 1 });
    useContextForRendering(f.ctx);
    for (const id of SOUND_IDS) {
      const before = f.started();
      renderAt(1, id, { step: 3, rarity: 'lendario', ms: 4000 });
      expect(f.started(), id).toBeGreaterThan(before);
    }
    for (const id of ['chuveiro', 'secador'] as const) startLoop(id)();
    expect(f.problems).toEqual([]);
  });

  it('desligado nos Ajustes, nenhum som contínuo começa', () => {
    const f = fakeAudio();
    useContextForRendering(f.ctx);
    configureSound({ enabled: () => false, volume: () => 1 });
    startLoop('secador')();
    expect(f.started()).toBe(0);
    configureSound({ enabled: () => true, volume: () => 1 });
  });

  it('som de cada clique', () => {
    const el = (attrs: Record<string, string>, text = '', cls = '') =>
      ({ getAttribute: (k: string) => attrs[k] ?? null, textContent: text, classList: { contains: (c: string) => cls.split(' ').includes(c) }, closest: (sel: string) => (sel === '[data-sound]' && attrs['data-sound'] ? { getAttribute: () => attrs['data-sound'] } : null) }) as unknown as Element;
    expect(soundForClick(el({}, 'Salvar'))).toBe('toque');
    expect(soundForClick(el({ role: 'tab' }, 'Feed'))).toBe('aba');
    expect(soundForClick(el({}, 'Início', 'tab'))).toBe('aba');
    expect(soundForClick(el({ 'data-sound': 'none' }, 'Shampoo'))).toBeNull();
    expect(soundForClick(el({ 'data-sound': 'conquista' }, 'Abrir'))).toBe('conquista');
    expect(soundForClick(el({}, 'Enviar presente'))).toBe('enviar');
    expect(soundForClick(el({}, 'Fiz!'))).toBe('tarefa');
    expect(soundForClick(el({ 'aria-pressed': 'true' }, 'Fiz'))).toBe('desfazer');
  });

  it('som das mudanças do app: missão, compra, roupa, sementes', () => {
    const day = '2026-11-05';
    const a = { ...fresh(), onboarded: true, coins: 50 };
    const withDone = (s: typeof a, ids: string[]) => ({ ...s, days: { ...s.days, [day]: { ...(s.days[day] ?? {}), done: Object.fromEntries(ids.map((i) => [i, 'habitos'])) } } }) as typeof a;
    expect(soundForChange(withDone({ ...a, coins: 55 }, ['agua']), a, day)).toBe('tarefa');
    expect(soundForChange(a, withDone(a, ['agua']), day)).toBe('desfazer');
    expect(soundForChange({ ...a, coins: 20 }, a, day)).toBe('compra');
    expect(soundForChange({ ...a, coins: 60 }, a, day)).toBe('semente');
    expect(soundForChange({ ...a, pet: { ...a.pet, outfit: { ...a.pet.outfit, chapeu: 'laco' } } }, a, day)).toBe('vestir');
    expect(soundForChange({ ...a, onboarded: true }, { ...a, onboarded: false }, day)).toBe('magia');
    expect(soundForChange({ ...a }, a, day)).toBeNull();
  });
});
