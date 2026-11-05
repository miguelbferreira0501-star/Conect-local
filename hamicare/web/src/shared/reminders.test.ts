import { describe, expect, it } from 'vitest';
import { DAILY_MAX, dueReminder, isQuiet, localNow, type LocalNow, type ReminderPrefs, type SentLog } from './reminders';

const prefs = (p: Partial<ReminderPrefs> = {}): ReminderPrefs => ({ enabled: true, time: '19:00', kinds: {}, water: 'normal', bedtime: '22:00', ...p });
const base = Date.UTC(2026, 10, 4, 12, 0); // uma quarta-feira
const at = (hm: string, weekday = 3, date = '2026-11-04'): LocalNow => {
  const [h, m] = hm.split(':').map(Number);
  return { date, hm, weekday, ms: base + (h * 60 + m) * 60_000 };
};
const happy = { pet: { name: 'Bolota', stats: { saciedade: 90, felicidade: 90 }, statsAt: base + 23 * 3_600_000 }, tasks: [{ id: 'agua' }, { id: 'cama' }], days: {} };

function run(hm: string, sent: SentLog = {}, p = prefs(), state: any = happy, minor = false) {
  return dueReminder({ prefs: p, state, sent, now: at(hm), minor });
}

describe('lembretes ao longo do dia', () => {
  it('água nos horários do plano, uma vez cada, com o nome do Hami', () => {
    const r = run('10:05');
    expect(r.reminder?.kind).toBe('agua');
    expect(r.reminder?.body).toMatch(/Bolota/);
    expect(r.reminder?.url).toBe('/#atividades');
    // Mesmo horário de novo: não repete.
    expect(dueReminder({ prefs: prefs(), state: happy, sent: { ...r.sent, _last: 0 }, now: at('10:30'), minor: false }).reminder).toBeNull();
    // Horário seguinte: sai.
    expect(dueReminder({ prefs: prefs(), state: happy, sent: { ...r.sent, _last: 0 }, now: at('13:10'), minor: false }).reminder?.key).toBe('agua:13:00');
  });

  it('não manda atrasado: horário perdido há mais de 2 horas fica para trás', () => {
    const r = run('12:30');
    expect(r.reminder).toBeNull();
    expect(r.sent['agua:10:00']).toBe('2026-11-04');
  });

  it('nunca de madrugada; para menores o silêncio começa mais cedo', () => {
    expect(isQuiet('23:00', false)).toBe(true);
    expect(isQuiet('07:59', false)).toBe(true);
    expect(isQuiet('21:45', false)).toBe(false);
    expect(isQuiet('21:45', true)).toBe(true);
    expect(run('23:10', {}, prefs({ kinds: { dormir: true }, bedtime: '23:00' })).reminder).toBeNull();
  });

  it('no máximo 5 por dia e pelo menos 1 hora entre um e outro', () => {
    expect(run('13:05', { _day: '2026-11-04', _count: DAILY_MAX }).reminder).toBeNull();
    expect(run('13:05', { _day: '2026-11-04', _count: 1, _last: at('12:30').ms }).reminder).toBeNull();
    // Dia novo zera a conta.
    expect(run('10:05', { _day: '2026-11-03', _count: DAILY_MAX }).reminder?.kind).toBe('agua');
  });

  it('o Hami com fome chama depois do meio-dia, uma vez por dia', () => {
    const hungry = { ...happy, pet: { ...happy.pet, stats: { saciedade: 40, felicidade: 80 }, statsAt: at('06:00').ms } };
    expect(run('11:00', {}, prefs({ kinds: { agua: false } }), hungry).reminder).toBeNull();
    const r = run('12:10', {}, prefs({ kinds: { agua: false } }), hungry);
    expect(r.reminder?.kind).toBe('hami');
    expect(r.reminder?.url).toBe('/#cuidar');
  });

  it('missões só no horário escolhido e só se faltar alguma', () => {
    const off = prefs({ kinds: { agua: false } });
    expect(run('19:10', {}, off).reminder?.kind).toBe('tarefas');
    const allDone = { ...happy, days: { '2026-11-04': { done: { agua: 'habitos', cama: 'habitos' } } } };
    expect(run('19:10', {}, off, allDone).reminder).toBeNull();
  });

  it('pausa e hora de dormir só se a pessoa ligar; desafios da semana na segunda', () => {
    const off = prefs({ kinds: { agua: false } });
    expect(run('15:35', {}, off).reminder).toBeNull();
    expect(run('15:35', {}, prefs({ kinds: { agua: false, pausa: true } })).reminder?.kind).toBe('pausa');
    expect(run('22:05', {}, prefs({ kinds: { agua: false, tarefas: false, dormir: true } })).reminder?.kind).toBe('dormir');
    expect(dueReminder({ prefs: off, state: happy, sent: {}, now: at('09:40', 1, '2026-11-02'), minor: false }).reminder?.kind).toBe('missoes');
  });

  it('a volta do passeio avisa uma vez por passeio', () => {
    const st = { ...happy, adventure: { endsAt: at('14:00').ms } };
    const r = run('14:20', {}, prefs({ kinds: { agua: false } }), st);
    expect(r.reminder?.kind).toBe('aventura');
    expect(dueReminder({ prefs: prefs({ kinds: { agua: false } }), state: st, sent: { ...r.sent, _last: 0 }, now: at('16:00'), minor: false }).reminder).toBeNull();
  });

  it('tudo desligado: nada sai', () => {
    expect(run('10:05', {}, prefs({ enabled: false })).reminder).toBeNull();
  });

  it('calcula a hora local pelo fuso da pessoa', () => {
    const l = localNow(new Date('2026-11-04T13:05:00Z'), 'America/Sao_Paulo');
    expect(l).toMatchObject({ date: '2026-11-04', hm: '10:05', weekday: 3 });
  });
});
