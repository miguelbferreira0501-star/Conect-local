import { describe, expect, it } from "vitest";
import { memoriesFor, memoryOf } from "./memory";
import { fresh } from "./store";
import type { State } from "../types";

const today = "2026-11-20";
function base(patch: Partial<State> = {}): State {
  const s = fresh();
  return {
    ...s,
    onboarded: true,
    createdAt: "2026-10-01",
    pet: { ...s.pet, name: "Pudim" },
    ...patch,
  };
}
const day = (patch: object) => ({
  done: { agua: "habitos" as const },
  care: [],
  ...patch,
});

describe("o Lumbi que lembra de você", () => {
  it("pergunta como foi o que a pessoa contou no diário", () => {
    const s = base({
      days: { "2026-11-19": day({}) },
      journal: [
        {
          id: "j1",
          date: "2026-11-18",
          text: "Amanhã tenho prova de matemática, estou nervosa",
        },
      ],
    });
    const m = memoryOf(s, today);
    expect(m?.text).toMatch(
      /Há 2 dias você me contou sobre a prova\. Como foi\?/,
    );
    expect(m?.replies).toHaveLength(2);
  });

  it("lembra que ontem foi difícil e pergunta se hoje está melhor", () => {
    const s = base({
      days: { "2026-11-19": day({ mood: 2, emotions: ["Ansioso"] }) },
    });
    expect(memoryOf(s, today)?.text).toBe(
      "Ontem você sentiu muita ansiedade. Hoje está um pouquinho melhor?",
    );
  });

  it("sente falta quando a pessoa some alguns dias", () => {
    const s = base({ days: { "2026-11-15": day({}) } });
    expect(memoryOf(s, today)?.text).toMatch(
      /Faz 5 dias que a gente não se via/,
    );
  });

  it("percebe pouca água e noites sem a missão de sono", () => {
    const tasks = fresh().tasks.length ? fresh().tasks : [];
    const s = base({
      tasks: [
        ...tasks.filter((t) => t.id !== "sono"),
        {
          id: "sono",
          title: "Dormir",
          emoji: "🌙",
          cat: "habitos",
          freq: "diaria",
          energy: 2,
          reward: 10,
          createdAt: "2026-10-01",
        } as unknown as State["tasks"][number],
      ],
      days: {
        "2026-11-10": day({ water: 8, done: { sono: "habitos" } }),
        "2026-11-17": day({ water: 1 }),
        "2026-11-18": day({ water: 2 }),
        "2026-11-19": day({ water: 1 }),
      },
    });
    const ids = memoriesFor(s, today).map((m) => m.id.split(":")[0]);
    expect(ids).toEqual(expect.arrayContaining(["agua", "sono"]));
  });

  it("uma por dia e nunca a mesma de ontem", () => {
    const s = base({ days: { "2026-11-19": day({ mood: 1 }) } });
    const m = memoryOf(s, today)!;
    expect(
      memoryOf({ ...s, memo: { day: today, id: m.id } }, today),
    ).toBeNull();
    expect(
      memoryOf({ ...s, memo: { day: "2026-11-19", id: m.id } }, today)?.id,
    ).not.toBe(m.id);
  });

  it("não inventa nada para quem acabou de chegar", () => {
    expect(memoryOf(base({ createdAt: today }), today)).toBeNull();
  });
});
