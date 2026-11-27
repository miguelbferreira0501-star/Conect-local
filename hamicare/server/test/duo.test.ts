import { afterEach, describe, expect, it } from "vitest";
import { setPushSender } from "../src/push";
import { befriend, call, setupDatabase, withProfile } from "./helpers";

setupDatabase();

const today = () => new Date().toISOString().slice(0, 10);
afterEach(() => setPushSender(null));
const tick = () => new Promise((r) => setTimeout(r, 120));

function noonTz(): string {
  let off = (((12 - new Date().getUTCHours()) % 24) + 24) % 24;
  if (off > 12) off -= 24;
  return off === 0 ? "UTC" : `Etc/GMT${off > 0 ? "-" : "+"}${Math.abs(off)}`;
}
async function withPush(u: { cookie: string }, name: string) {
  await call(
    "PUT",
    "/push/prefs",
    { enabled: true, time: "19:00", tz: noonTz() },
    u.cookie,
  );
  await call(
    "POST",
    "/push/subscribe",
    {
      endpoint: `https://push.exemplo.com/${name}`,
      keys: { p256dh: "x", auth: "y" },
    },
    u.cookie,
  );
}

describe("ofensiva em dupla", () => {
  it("só com amigos, uma dupla por pessoa e só quem recebeu aceita", async () => {
    const ana = await withProfile("Ana Duo");
    const bia = await withProfile("Bia Duo");
    const cid = await withProfile("Cid Duo");
    const estranho = await withProfile("Estranho Duo");
    await befriend(ana, bia);
    await befriend(cid, bia);

    expect(
      (await call("POST", "/social/duo", { userId: estranho.id }, ana.cookie))
        .status,
    ).toBe(403);
    const r = await call("POST", "/social/duo", { userId: bia.id }, ana.cookie);
    expect(r.status).toBe(201);
    expect(r.body.duo).toMatchObject({
      status: "convite",
      invitedByMe: true,
      streak: 0,
    });
    expect(r.body.duo.partner.name).toBe("Bia Duo");

    // Bia já tem convite: o Cid não consegue chamar.
    expect(
      (await call("POST", "/social/duo", { userId: bia.id }, cid.cookie))
        .status,
    ).toBe(409);
    // Quem convidou não aceita o próprio convite; marcar dia antes de aceitar não vale.
    expect(
      (await call("POST", "/social/duo/accept", {}, ana.cookie)).status,
    ).toBe(404);
    expect(
      (await call("POST", "/social/duo/checkin", { day: today() }, ana.cookie))
        .status,
    ).toBe(404);
    // O estranho não vê nada.
    expect(
      (await call("GET", "/social/duo", undefined, estranho.cookie)).body.duo,
    ).toBeNull();

    const ok = await call("POST", "/social/duo/accept", {}, bia.cookie);
    expect(ok.body.duo).toMatchObject({ status: "ativa", invitedByMe: false });
    expect(ok.body.duo.partner.name).toBe("Ana Duo");

    // Desfazer: qualquer um dos dois.
    await call("DELETE", "/social/duo", undefined, bia.cookie);
    expect(
      (await call("GET", "/social/duo", undefined, ana.cookie)).body.duo,
    ).toBeNull();
    expect(
      (await call("POST", "/social/duo", { userId: bia.id }, cid.cookie))
        .status,
    ).toBe(201);
  });

  it("o dia só conta quando os dois fazem; avisa quem falta e a cutucada é uma por dia", async () => {
    const ana = await withProfile("Gabi Duo");
    const bia = await withProfile("Hugo Duo");
    await befriend(ana, bia);
    await withPush(ana, "gabi-duo");
    await withPush(bia, "hugo-duo");
    const box: string[] = [];
    setPushSender(async (_s, p) => void box.push(JSON.parse(p).body));

    await call("POST", "/social/duo", { userId: bia.id }, ana.cookie);
    await tick();
    expect(box.at(-1)).toMatch(/ofensiva em dupla/);
    await call("POST", "/social/duo/accept", {}, bia.cookie);
    await tick();
    expect(box.at(-1)).toMatch(/topou/);

    // Cutucar antes: avisa o Hugo; a segunda vez no mesmo dia não manda de novo.
    expect(
      (await call("POST", "/social/duo/nudge", { day: today() }, ana.cookie))
        .body.result,
    ).toBe("ok");
    await tick();
    expect(box.at(-1)).toMatch(/precisa de você hoje/);
    expect(
      (await call("POST", "/social/duo/nudge", { day: today() }, ana.cookie))
        .body.result,
    ).toBe("limite");

    let r = await call(
      "POST",
      "/social/duo/checkin",
      { day: today() },
      ana.cookie,
    );
    expect(r.body.duo.today).toMatchObject({ me: true, partner: false });
    expect(r.body.duo.streak).toBe(0);
    await tick();
    expect(box.at(-1)).toMatch(/Só falta você/);

    r = await call("POST", "/social/duo/checkin", { day: today() }, bia.cookie);
    expect(r.body.duo.today).toMatchObject({ me: true, partner: true });
    expect(r.body.duo.streak).toBe(1);
    expect(r.body.duo.best).toBe(1);
    expect(r.body.duo.week).toHaveLength(7);
    await tick();
    expect(box.at(-1)).toMatch(/Vocês dois cuidaram de vocês hoje/);
    // Hugo já fez: cutucar não manda nada.
    expect(
      (await call("POST", "/social/duo/nudge", { day: today() }, bia.cookie))
        .body.result,
    ).toBe("ja-fez");

    // Desfazer a tarefa tira o dia de novo.
    r = await call(
      "POST",
      "/social/duo/checkin",
      { day: today(), done: false },
      bia.cookie,
    );
    expect(r.body.duo.streak).toBe(0);
  });

  it("desfazer a amizade acaba com a dupla", async () => {
    const a = await withProfile("Iara Duo");
    const b = await withProfile("João Duo");
    await befriend(a, b);
    await call("POST", "/social/duo", { userId: b.id }, a.cookie);
    await call("POST", "/social/duo/accept", {}, b.cookie);
    await call("DELETE", `/social/friends/${b.id}`, undefined, a.cookie);
    expect(
      (await call("GET", "/social/duo", undefined, a.cookie)).body.duo,
    ).toBeNull();
  });
});
