import { describe, expect, it } from 'vitest';
import { addLifeArea, addTask, fresh, getState, isDue, replaceState, starterPlan, tasksOn, todayKey, updateTask } from './store';
import { petStateOf } from './petState';
import { plannedNotifications } from './nativeReminders';
import { addDays } from './util';
import { LIFE_AREAS, libById } from '../data/tasks';

const base = () => {
  const s = fresh();
  replaceState({ ...s, onboarded: true, tasks: [] });
};

describe('calendário de tarefas', () => {
  it('respeita dias da semana, data de início e de fim', () => {
    base();
    const today = todayKey();
    addTask({ title: 'Curso', emoji: '📚', cat: 'habitos', freq: { kind: 'diaria' }, energy: 2, start: addDays(today, 2), end: addDays(today, 4) });
    const t = getState().tasks[0];
    expect(isDue(t, today)).toBe(false);
    expect(isDue(t, addDays(today, 3))).toBe(true);
    expect(isDue(t, addDays(today, 5))).toBe(false);
    expect(tasksOn(getState(), addDays(today, 2)).map((x) => x.title)).toEqual(['Curso']);
  });

  it('horário define a parte do dia, lembrete só com horário, e editar pode tirar o horário', () => {
    base();
    addTask({ title: 'Remédio', emoji: '💊', cat: 'autocuidado', freq: { kind: 'diaria' }, energy: 1, at: '20:30', remind: true });
    addTask({ title: 'Sem hora', emoji: '⭐', cat: 'autocuidado', freq: { kind: 'diaria' }, energy: 1, remind: true });
    const [a, b] = getState().tasks;
    expect(a.part).toBe('noite');
    expect(a.remind).toBe(true);
    expect(b.remind).toBeUndefined();
    updateTask(a.id, { at: undefined });
    expect(getState().tasks[0].at).toBeUndefined();
    expect(getState().tasks[0].remind).toBeUndefined();
  });

  it('lembrete no horário entra na agenda do celular, mesmo com os lembretes gerais desligados', () => {
    base();
    addTask({ title: 'Alongar', emoji: '🙆', cat: 'fitness', freq: { kind: 'diaria' }, energy: 1, at: '23:59', remind: true });
    const s = getState();
    const list = plannedNotifications({ ...s, settings: { ...s.settings, notif: { ...s.settings.notif, enabled: false } } }, new Date(`${todayKey()}T08:00:00`));
    expect(list.some((n) => n.body === 'Hora de: Alongar')).toBe(true);
  });
});

describe('áreas da vida', () => {
  it('o plano inicial mistura as áreas escolhidas e sempre tem água', () => {
    const plan = starterPlan({ goal: 'habitos', focus: [], minutes: 15, likes: [], ageGroup: '18mais', lifeAreas: ['estudo', 'casa'] });
    expect(plan[0]).toBe('agua');
    expect(plan).toContain('planejar');
    expect(plan).toContain('cama-arrumar');
    expect(plan.every((id) => libById(id))).toBe(true);
  });
  it('adicionar uma área depois traz as missões dela sem repetir', () => {
    base();
    const n = addLifeArea('calma');
    expect(n).toBe(LIFE_AREAS.calma.tasks.length);
    expect(addLifeArea('calma')).toBe(0);
    expect(getState().profile.lifeAreas).toEqual(['calma']);
  });
});

describe('estados do Lumbi pelo contexto', () => {
  it('dormindo, com fome, dia difícil e comemorando', () => {
    base();
    const s = getState();
    expect(petStateOf({ ...s, pet: { ...s.pet, sleeping: true } })).toBe('dormindo');
    expect(petStateOf({ ...s, pet: { ...s.pet, stats: { ...s.pet.stats, saciedade: 10 } } })).toBe('com-fome');
    expect(petStateOf(s, { hardDay: true, done: 0, total: 3 })).toBe('dia-dificil');
    expect(petStateOf(s, { celebrating: true })).toBe('comemorando');
  });
});
