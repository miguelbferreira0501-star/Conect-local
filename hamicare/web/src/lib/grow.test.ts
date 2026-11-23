import { describe, expect, it } from 'vitest';
import { addRoutine, buyDestination, chooseDestination, createPlan, destinationOwned, fresh, getState, homePlaceOf, removePlan, replaceState, todayKey, trekPlaceOf, PLAN_MAX } from './store';
import { DESTINATIONS, souvenirPieces, SOUVENIR_GOAL } from '../data/destinations';
import { ROUTINES, ROUTINE_CATS, routinesFor } from '../data/routines';
import { SELF_TESTS, isHeavy, testResult } from '../data/selftests';
import { libById } from '../data/tasks';
import type { Task } from '../types';

const T = (id: string): Task => ({ id, title: id, emoji: '⭐', cat: 'habitos', freq: { kind: 'diaria' }, reward: 3, energy: 1, createdAt: todayKey() });
function start(extra: Partial<ReturnType<typeof fresh>> = {}) {
  const base = fresh();
  replaceState({ ...base, onboarded: true, missionsV: 1, xpV: 2, coins: 0, tasks: [T('a')], profile: { ...base.profile, goal: 'habitos', ageGroup: '18mais' }, ...extra });
}

describe('destinos de viagem', () => {
  it('a casinha é de todo mundo; destino pago só depois de comprar', () => {
    start();
    expect(destinationOwned(getState(), 'casinha')).toBe(true);
    expect(destinationOwned(getState(), 'jardim')).toBe(false);
    expect(buyDestination('jardim')).toBe('sem-sementes');
    replaceState({ ...getState(), coins: 1000 });
    expect(buyDestination('jardim')).toBe('ok');
    expect(getState().coins).toBe(600);
    expect(destinationOwned(getState(), 'jardim')).toBe(true);
    // comprou e já vira o próximo destino
    expect(trekPlaceOf(getState())).toBe('jardim');
  });
  it('destino do Plus pede o Plus; a Lua só para quem chegou lá', () => {
    start({ coins: 99999 });
    expect(buyDestination('castelo')).toBe('plus');
    expect(destinationOwned(getState(), 'lua')).toBe(false);
  });
  it('escolher um destino que não tem volta para a casa', () => {
    start();
    chooseDestination('mar');
    expect(trekPlaceOf(getState())).toBe(homePlaceOf(getState()));
  });
  it('a lembrança junta uma peça a cada três cartões, até completar', () => {
    expect(souvenirPieces(0)).toBe(0);
    expect(souvenirPieces(3)).toBe(1);
    expect(souvenirPieces(999)).toBe(SOUVENIR_GOAL);
    expect(new Set(DESTINATIONS.map((d) => d.id)).size).toBe(DESTINATIONS.length);
  });
});

describe('rotinas e missões planejadas', () => {
  it('toda rotina usa tarefas que existem e nenhuma fala de comida', () => {
    for (const r of ROUTINES) {
      expect(r.tasks.length).toBeGreaterThan(0);
      for (const id of r.tasks) {
        const t = libById(id);
        expect(t, `${r.id}: ${id}`).toBeTruthy();
        expect(t!.title.toLowerCase()).not.toMatch(/comer|comida|refei|lanche|doce/);
      }
    }
  });
  it('adicionar uma rotina não duplica o que a pessoa já tem', () => {
    start({ tasks: [T('agua-acordar')] });
    const n = addRoutine(ROUTINES.find((r) => r.id === 'boost-manha')!.tasks);
    expect(n).toBe(3);
    expect(addRoutine(ROUTINES.find((r) => r.id === 'boost-manha')!.tasks)).toBe(0);
    expect(getState().tasks.filter((t) => t.id === 'agua-acordar')).toHaveLength(1);
  });
  it('uma missão planejada junta tarefas da biblioteca e escritas pela pessoa', () => {
    start();
    expect(createPlan('', 'calma', [{ lib: 'respirar' }])).toBeNull();
    expect(createPlan('Semana calma', 'calma', [])).toBeNull();
    const plan = createPlan('Semana calma', 'calma', [{ lib: 'respirar' }, { title: 'Ligar para a vó' }])!;
    expect(plan.tasks).toHaveLength(2);
    expect(plan.tasks).toContain('respirar');
    expect(getState().tasks.some((t) => t.title === 'Ligar para a vó')).toBe(true);
    expect(getState().plans?.[0].name).toBe('Semana calma');
    removePlan(plan.id);
    expect(getState().plans).toHaveLength(0);
    // as tarefas ficam
    expect(getState().tasks.some((t) => t.id === 'respirar')).toBe(true);
  });
  it('o plano aceita no máximo 50 tarefas', () => {
    start();
    const many = Array.from({ length: 70 }, (_, i) => ({ title: `Tarefa ${i}` }));
    expect(createPlan('Grande', 'estudo', many)!.tasks).toHaveLength(PLAN_MAX);
  });
});

describe('seções do Crescer (iguais ao vídeo)', () => {
  it('nove seções, cada rotina numa seção que existe, sem ids repetidos', () => {
    expect(ROUTINE_CATS.map((c) => c.label)).toEqual(['Novidades e tendências', 'Cuidados pessoais', 'TDAH e ansiedade', 'Treinos', 'Relaxamento', 'Plano de limpeza', 'Trabalho e estudos', 'Começo fácil', 'Estilo de vida saudável']);
    for (const r of ROUTINES) expect(ROUTINE_CATS.some((c) => c.id === r.cat)).toBe(true);
    expect(new Set(ROUTINES.map((r) => r.id)).size).toBe(ROUTINES.length);
    for (const c of ROUTINE_CATS) expect(ROUTINES.filter((r) => r.cat === c.id).length).toBeGreaterThanOrEqual(2);
  });
  it('criança não vê Plus; rotinas de peso só para maiores de 18', () => {
    expect(routinesFor('ate12').some((r) => r.plus || r.adult)).toBe(false);
    expect(routinesFor('13a17').some((r) => r.adult)).toBe(false);
    expect(routinesFor('18mais').length).toBe(ROUTINES.length);
  });
});

describe('testes do Crescer', () => {
  it('cada resultado cobre todas as somas possíveis e o mais pesado lembra de buscar ajuda', () => {
    for (const t of SELF_TESTS) {
      const max = t.questions.length * 3;
      expect(t.bands[t.bands.length - 1].max).toBeGreaterThanOrEqual(max);
      expect(testResult(t, 0)).toBe(t.bands[0]);
      expect(isHeavy(t, max)).toBe(true);
      expect(isHeavy(t, 0)).toBe(false);
      for (const b of t.bands) expect(ROUTINES.some((r) => r.id === b.routine)).toBe(true);
    }
  });
});
