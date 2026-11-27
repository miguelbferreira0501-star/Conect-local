import { describe, expect, it } from "vitest";
import { duoBest, duoBoth, duoStreak, duoWeek } from "./duo";

describe("ofensiva em dupla", () => {
  const me = [
    "2026-11-01",
    "2026-11-02",
    "2026-11-03",
    "2026-11-05",
    "2026-11-06",
  ];
  const them = [
    "2026-11-01",
    "2026-11-02",
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
    "2026-11-06",
  ];
  const both = duoBoth(me, them);
  it("só conta os dias em que os dois fizeram", () => {
    expect([...both].sort()).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-05",
      "2026-11-06",
    ]);
  });
  it("sequência até hoje, ou até ontem se hoje ainda falta alguém", () => {
    expect(duoStreak(both, "2026-11-06")).toBe(2);
    expect(duoStreak(both, "2026-11-07")).toBe(2);
    expect(duoStreak(both, "2026-11-08")).toBe(0);
  });
  it("recorde e semana", () => {
    expect(duoBest(both)).toBe(3);
    const w = duoWeek(new Set(me), new Set(them), "2026-11-06");
    expect(w).toHaveLength(7);
    expect(w[w.length - 1]).toEqual({
      date: "2026-11-06",
      me: true,
      partner: true,
    });
    expect(w.find((d) => d.date === "2026-11-04")).toEqual({
      date: "2026-11-04",
      me: false,
      partner: true,
    });
  });
});
