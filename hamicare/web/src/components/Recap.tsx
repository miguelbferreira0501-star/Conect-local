// Retrospectiva do mês (estilo stories): telas que passam sozinhas (toque na direita avança, na esquerda
// volta) com os números bonitos do mês e, no fim, um cartão para compartilhar nos stories.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, X } from "lucide-react";
import { Hamster } from "./Hamster";
import { svgToImage } from "./PoseSnap";
import { toast } from "./ui";
import { play } from "../lib/sound";
import { recapOf, type Recap } from "../lib/recap";
import { seeRecap, todayKey, useApp } from "../lib/store";
import type { PetMood } from "../types";

interface Slide {
  id: string;
  bg: string;
  ink: string;
  eyebrow: string;
  big?: string;
  title: string;
  text: string;
  mood: PetMood;
}

function slidesOf(r: Recap, pet: string, current: boolean): Slide[] {
  const out: Slide[] = [
    {
      id: "oi",
      bg: "linear-gradient(165deg, #8f7bf2, #ff8fb4)",
      ink: "#fff",
      eyebrow: "Sua retrospectiva",
      title: `O seu ${r.monthName}`,
      text: `${pet} guardou tudo o que vocês viveram juntos neste mês. Vem ver!`,
      mood: "risada",
    },
    {
      id: "dias",
      bg: "linear-gradient(165deg, #ffb547, #ff7a59)",
      ink: "#fff",
      eyebrow: "Constância",
      big: String(r.daysCared),
      title:
        r.daysCared === 1 ? "dia cuidando de você" : "dias cuidando de você",
      text: `${current ? `Neste mês, até agora, você apareceu em ${r.daysCared} ${r.daysCared === 1 ? 'dia' : 'dias'}` : `De ${r.daysInMonth} dias do mês, você apareceu em ${r.daysCared}`}. Foram ${r.tasks} ${r.tasks === 1 ? "tarefa feita" : "tarefas feitas"}!`,
      mood: "amor",
    },
  ];
  if (r.bestRun >= 2)
    out.push({
      id: "run",
      bg: "linear-gradient(165deg, #ff8a3c, #ff5d73)",
      ink: "#fff",
      eyebrow: "Sequência",
      big: `${r.bestRun} 🔥`,
      title: "dias seguidos, o seu recorde do mês",
      text: "Um dia de cada vez, e olha só onde você chegou.",
      mood: "risada",
    });
  if (r.waterCups > 0)
    out.push({
      id: "agua",
      bg: "linear-gradient(165deg, #6fc3f2, #4c8df0)",
      ink: "#fff",
      eyebrow: "Água",
      big: `${r.waterCups}`,
      title: r.waterCups === 1 ? "copo de água" : "copos de água",
      text: `Isso dá uns ${String(r.waterL).replace(".", ",")} litros! ${pet} bebeu um golinho junto em cada um.`,
      mood: "feliz",
    });
  if (r.mood)
    out.push({
      id: "humor",
      bg: "linear-gradient(165deg, #ffd6e4, #ffb3cc)",
      ink: "#5a2440",
      eyebrow: "Seu humor",
      big: r.mood.emoji,
      title: `"${r.mood.label}"`,
      text: `Foi o que você mais marcou: ${r.mood.days} ${r.mood.days === 1 ? "vez" : "vezes"}.${r.emotion ? ` E a emoção que mais apareceu foi ${EMO[r.emotion.name] ?? r.emotion.name.toLowerCase()}.` : ""}`,
      mood: "amor",
    });
  if (r.topTask)
    out.push({
      id: "habito",
      bg: "linear-gradient(165deg, #7bd36b, #3fae8a)",
      ink: "#fff",
      eyebrow: "Hábito favorito",
      big: `${r.topTask.times}x`,
      title: r.topTask.title,
      text: "Foi o cuidado que mais apareceu no seu mês. Que hábito bonito!",
      mood: "risada",
    });
  if (r.trips > 0)
    out.push({
      id: "viagem",
      bg: "linear-gradient(165deg, #6b5fd8, #3b3f9c)",
      ink: "#fff",
      eyebrow: "Viagens",
      big: String(r.trips),
      title: r.trips === 1 ? `viagem do ${pet}` : `viagens do ${pet}`,
      text: r.place
        ? `O lugar favorito foi ${r.place}. Cada viagem foi graças a você!`
        : "Cada viagem foi graças às suas tarefas!",
      mood: "feliz",
    });
  if (r.journal > 0)
    out.push({
      id: "diario",
      bg: "linear-gradient(165deg, #f6c177, #e58f65)",
      ink: "#fff",
      eyebrow: "Diário",
      big: String(r.journal),
      title: r.journal === 1 ? "página no diário" : "páginas no diário",
      text: "Escrever sobre o que a gente sente é um jeito lindo de se cuidar.",
      mood: "amor",
    });
  out.push({
    id: "fim",
    bg: "linear-gradient(165deg, #8f7bf2, #ff8fb4)",
    ink: "#fff",
    eyebrow: `Seu ${r.monthName} em um cartão`,
    title: "Obrigado por cuidar de você",
    text: "Compartilhe nos stories e chame alguém para se cuidar junto!",
    mood: "risada",
  });
  return out;
}

const MS = 5500;
const EMO: Record<string, string> = { Ansioso: 'ansiedade', Cansado: 'cansaço', Triste: 'tristeza', Irritado: 'irritação', Sozinho: 'solidão', Calmo: 'calma', Grato: 'gratidão', Animado: 'animação', Orgulhoso: 'orgulho', Esperançoso: 'esperança' };

/** Desenha o cartão do mês (1080×1920) para os stories. */
async function drawCard(
  r: Recap,
  pet: string,
  user: string,
  svg: SVGSVGElement | null,
): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1920;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0, "#8f7bf2");
  grad.addColorStop(1, "#ff8fb4");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1080, 1920);
  g.textAlign = "center";
  g.fillStyle = "#fff";
  g.font = "800 46px Nunito, sans-serif";
  g.fillText("MINHA RETROSPECTIVA", 540, 170);
  g.font = "900 104px Nunito, sans-serif";
  g.fillText(r.monthName[0].toUpperCase() + r.monthName.slice(1), 540, 290);
  if (svg) {
    try {
      const img = await svgToImage(svg);
      g.drawImage(img, 290, 330, 500, 500);
    } catch {
      /* sem o desenho: o cartão sai mesmo assim */
    }
  }
  const rows: [string, string][] = (
    [
      [
        `${r.daysCared}`,
        r.daysCared === 1 ? "dia cuidando de mim" : "dias cuidando de mim",
      ],
      [`${r.tasks}`, r.tasks === 1 ? "tarefa feita" : "tarefas feitas"],
      ...(r.bestRun >= 2
        ? [[`${r.bestRun}`, "dias seguidos (recorde)"] as [string, string]]
        : []),
      ...(r.waterCups
        ? [[`${r.waterCups}`, "copos de água"] as [string, string]]
        : []),
      ...(r.trips
        ? [
            [
              `${r.trips}`,
              r.trips === 1 ? `viagem do ${pet}` : `viagens do ${pet}`,
            ] as [string, string],
          ]
        : []),
    ] as [string, string][]
  ).slice(0, 4);
  rows.forEach(([n, label], i) => {
    const x = i % 2 === 0 ? 70 : 560;
    const y = 880 + Math.floor(i / 2) * 300;
    g.fillStyle = "rgba(255,255,255,0.22)";
    if (g.roundRect) {
      g.beginPath();
      g.roundRect(x, y, 450, 260, 48);
      g.fill();
    } else g.fillRect(x, y, 450, 260);
    g.fillStyle = "#fff";
    g.font = "900 120px Nunito, sans-serif";
    g.fillText(n, x + 225, y + 140);
    g.font = "800 38px Nunito, sans-serif";
    g.fillText(label, x + 225, y + 210);
  });
  const fy = 880 + Math.ceil(rows.length / 2) * 300 + 40;
  if (r.mood) {
    g.font = "800 44px Nunito, sans-serif";
    g.fillText(`Humor do mês: ${r.mood.emoji} ${r.mood.label}`, 540, fy + 20);
  }
  g.font = "800 40px Nunito, sans-serif";
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.fillText(
    `${user ? `${user} e ${pet}` : pet} · Lumbi: Self-Care`,
    540,
    1830,
  );
  return new Promise((ok) => c.toBlob(ok, "image/png"));
}

export function RecapScreen({
  month,
  onClose,
}: {
  month: string;
  onClose: () => void;
}) {
  const s = useApp();
  const r = useMemo(() => recapOf(s, month), [s, month]);
  const pet = s.pet.name.trim() || "Lumbi";
  const slides = useMemo(() => slidesOf(r, pet, month === todayKey().slice(0, 7)), [r, pet, month]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const petRef = useRef<HTMLDivElement>(null);
  const sl = slides[Math.min(i, slides.length - 1)];
  const last = i >= slides.length - 1;

  useEffect(() => {
    // Só o mês que já acabou conta como visto (ver o mês de agora pelo menu não esconde a do mês que vem).
    if (month < todayKey().slice(0, 7)) seeRecap(month);
    play("festa");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [month]);
  useEffect(() => {
    if (last || paused) return;
    const t = setTimeout(() => setI((x) => x + 1), MS);
    return () => clearTimeout(t);
  }, [i, last, paused]);

  const share = async () => {
    const blob = await drawCard(
      r,
      pet,
      s.profile.name,
      petRef.current?.querySelector("svg") ?? null,
    );
    if (!blob) return toast("Não deu para criar a imagem agora.");
    const file = new File([blob], `retrospectiva-${month}.png`, {
      type: "image/png",
    });
    const nav = navigator as Navigator & {
      canShare?: (d: { files: File[] }) => boolean;
    };
    if (nav.canShare?.({ files: [file] })) {
      await navigator
        .share({ files: [file], title: `Meu ${r.monthName} no Lumbi` })
        .catch(() => {});
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    toast("Imagem guardada! Agora é só postar nos stories.");
  };

  return createPortal(
    <div
      className="rc"
      role="dialog"
      aria-modal="true"
      aria-label={`Retrospectiva de ${r.monthName}`}
      style={{ background: sl.bg, color: sl.ink }}
    >
      <div className="rc-bars" aria-hidden="true">
        {slides.map((x, k) => (
          <span key={x.id}>
            <i
              className={
                k < i
                  ? "is-done"
                  : k === i
                    ? paused || last
                      ? "is-hold"
                      : "is-now"
                    : ""
              }
              style={k === i ? { animationDuration: `${MS}ms` } : undefined}
              key={k === i ? `${i}` : undefined}
            />
          </span>
        ))}
      </div>
      <button
        className="rc-x"
        onClick={onClose}
        aria-label="Fechar a retrospectiva"
      >
        <X size={22} />
      </button>
      <div
        className="rc-tap"
        onPointerDown={() => setPaused(true)}
        onPointerUp={(e) => {
          setPaused(false);
          const left = e.clientX < window.innerWidth * 0.33;
          if (left) setI((x) => Math.max(0, x - 1));
          else if (!last) setI((x) => x + 1);
        }}
        onPointerLeave={() => setPaused(false)}
      >
        <div className="rc-in" key={sl.id}>
          <p className="rc-eyebrow">{sl.eyebrow}</p>
          {sl.id === "fim" ? (
            <div className="rc-card">
              <div className="rc-card-pet" ref={petRef}>
                <Hamster
                  fur={s.pet.fur}
                  phase={s.pet.phase}
                  outfit={s.pet.outfit}
                  mood="risada"
                  size={150}
                  idle={false}
                  neutral
                  label=""
                />
              </div>
              <div className="rc-grid">
                <span>
                  <b>{r.daysCared}</b>dias
                </span>
                <span>
                  <b>{r.tasks}</b>tarefas
                </span>
                <span>
                  <b>{r.bestRun}</b>seguidos
                </span>
                <span>
                  <b>{r.waterCups}</b>copos
                </span>
              </div>
              {r.mood && (
                <p className="rc-card-mood">
                  {r.mood.emoji} {r.mood.label}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="rc-pet">
                <Hamster
                  fur={s.pet.fur}
                  phase={s.pet.phase}
                  outfit={s.pet.outfit}
                  mood={sl.mood}
                  size={sl.big ? 150 : 210}
                  idle={false}
                  neutral
                  label=""
                />
              </div>
              {sl.big && <p className="rc-big">{sl.big}</p>}
            </>
          )}
          <h2 className="rc-title">{sl.title}</h2>
          <p className="rc-text">{sl.text}</p>
        </div>
      </div>
      {last && (
        <div className="rc-foot">
          <button className="rc-btn" onClick={share}>
            <Share2 size={20} /> Compartilhar nos stories
          </button>
          <button className="rc-btn is-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
