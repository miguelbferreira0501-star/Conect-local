import { createContext, useContext, useId } from "react";
import { furById } from "../data/fur";
import { itemById } from "../data/items";
import { fluffOf } from "../logic/evolution";
import {
  Accessory,
  AccessoryBack,
  Cape,
  Clothes,
  CostumeBack,
  CostumeFront,
  costumeOf,
  EffectBack,
  EffectFront,
  garmentColor,
  garmentShape,
  Glasses,
  Hat,
  sleeveOf,
} from "./Wear";
import type { Outfit, PetMood } from "../types";

const INK = "#3B2418";

/** Tamanho do Hami da pessoa (cresce com os dias de cuidado). O App informa; o padrão é o tamanho máximo. */
export const GrowthContext = createContext(1);
const NO_OUTFIT: Outfit = {
  chapeu: null,
  oculos: null,
  roupa: null,
  acessorio: null,
};

export interface HamsterProps {
  fur: string;
  grams?: number;
  phase?: number;
  mood?: PetMood;
  outfit?: Outfit;
  size?: number;
  idle?: boolean;
  label?: string;
  /** Hamster de outra pessoa (feed, visitas): sempre no formato padrão, sem comparação de corpo. */
  neutral?: boolean;
  /** Molhado no banho: pelo escurece e pinga. */
  wet?: boolean;
  /** Brilhando depois de escovar ou do banho. */
  shine?: boolean;
  /** Tamanho (0,5 = recém-nascido, 1 = adulto). Sem valor, usa o tamanho atual do Hami da pessoa. */
  growth?: number;
  /** Gesto do bracinho: 'tchau' levanta e acena. */
  pose?: "tchau";
}

/** Tronco gordinho (de pera): ombros escondidos atrás da cabeça, barriga larga e base redonda. */
function torso(w: number, bottom: number, flare = 0) {
  const L = (k: number) => (100 - k).toFixed(1);
  const R = (k: number) => (100 + k).toFixed(1);
  return (
    `M${L(w * 0.6)} 104 C${L(w * 0.94)} 110 ${L(w * 1.06)} 138 ${L(w + flare * 0.5)} 162 ` +
    `C${L(w * 0.98 + flare)} ${bottom - 10} ${L(w * 0.62 + flare)} ${bottom} 100 ${bottom} ` +
    `C${R(w * 0.62 + flare)} ${bottom} ${R(w * 0.98 + flare)} ${bottom - 10} ${R(w + flare * 0.5)} 162 ` +
    `C${R(w * 1.06)} 138 ${R(w * 0.94)} 110 ${R(w * 0.6)} 104 Z`
  );
}

/** Cabeça de pãozinho larga, de topo redondo (as bochechas creme saem por cima dela). */
function headPath(cx: number, cy: number, rx: number, ry: number) {
  const T = cy - ry;
  const B = cy + ry;
  return (
    `M${cx} ${T} C${cx + rx * 0.56} ${T} ${cx + rx * 0.92} ${cy - ry * 0.48} ${cx + rx} ${cy + ry * 0.12} ` +
    `C${cx + rx * 1.02} ${cy + ry * 0.66} ${cx + rx * 0.62} ${B} ${cx} ${B} ` +
    `C${cx - rx * 0.62} ${B} ${cx - rx * 1.02} ${cy + ry * 0.66} ${cx - rx} ${cy + ry * 0.12} ` +
    `C${cx - rx * 0.92} ${cy - ry * 0.48} ${cx - rx * 0.56} ${T} ${cx} ${T} Z`
  );
}

/**
 * Focinho e bochechas creme: sobe num montinho entre os olhos (até o nariz), passa por baixo de cada olho
 * e incha para os lados em duas bochechas bem fofas, que saem um pouco para fora da cabeça.
 */
function muzzlePath(eyeY: number, ex: number, rx: number, puff: number) {
  const pts = (s: 1 | -1): number[][] => {
    const X = (d: number) => 100 + s * d;
    return [
      [X(7), eyeY + 1, X(ex * 0.5), eyeY + 8, X(ex), eyeY + 8],
      [
        X(ex * 1.55),
        eyeY + 8,
        X(rx * 0.84),
        eyeY - 3,
        X(rx * (1.02 + puff)),
        eyeY + 5,
      ],
      [
        X(rx * (1.1 + puff)),
        eyeY + 16,
        X(rx * (1.04 + puff)),
        eyeY + 37,
        X(rx * 0.72),
        eyeY + 47,
      ],
      [X(rx * 0.44), eyeY + 56, X(18), eyeY + 56, 100, eyeY + 56],
    ];
  };
  const fmt = (n: number) => n.toFixed(1);
  const start = [100, eyeY + 1];
  const right = pts(1)
    .map((c) => `C${c.map(fmt).join(" ")}`)
    .join(" ");
  // lado esquerdo percorrido de volta (do queixo ao topo), para fechar o contorno
  const left = pts(-1);
  const ends = [start, ...left.map((c) => [c[4], c[5]])];
  const back = left
    .map(
      (c, i) =>
        `C${fmt(c[2])} ${fmt(c[3])} ${fmt(c[0])} ${fmt(c[1])} ${fmt(ends[i][0])} ${fmt(ends[i][1])}`,
    )
    .reverse()
    .join(" ");
  return `M${start[0]} ${start[1]} ${right} ${back} Z`;
}

function mix(hex: string, to: string, t: number) {
  const a = /^#?([0-9a-f]{6})$/i.exec(hex);
  const b = /^#?([0-9a-f]{6})$/i.exec(to);
  if (!a || !b) return hex;
  const n = parseInt(a[1], 16);
  const m = parseInt(b[1], 16);
  const ch = (sh: number) =>
    Math.round(((n >> sh) & 255) * (1 - t) + ((m >> sh) & 255) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}
const darken = (hex: string, t: number) => mix(hex, "#000000", t);
const lighten = (hex: string, t: number) => mix(hex, "#FFFFFF", t);

/**
 * O Hami: hamster gordinho e macio, de cabeça larga com bochechas creme enormes, olhinhos sorrindo (^ ^),
 * narizinho rosa, bracinhos curtos na barriga e pezões com almofadinhas cor-de-rosa. O volume (meio 3D)
 * vem da luz por cima e da sombra nas bordas, sem contorno escuro. As roupas vestem o mesmo contorno do corpo.
 */
export function Hamster({
  fur: furId,
  grams = 135,
  phase = 0,
  mood = "feliz",
  outfit = NO_OUTFIT,
  size = 180,
  idle = true,
  label,
  neutral,
  wet,
  shine,
  growth,
  pose,
}: HamsterProps) {
  const fur = furById(furId);
  const current = useContext(GrowthContext);
  const k = Math.min(1, Math.max(0.4, neutral ? 1 : (growth ?? current)));
  const young = Math.min(1, Math.max(0, (1 - k) / 0.3));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const f = fluffOf(neutral ? 135 : grams);
  const eating = mood === "comendo";
  const asleep = mood === "dormindo";

  // Cabeça larga e baixinha; os olhos ficam acima do meio (o focinho creme ocupa a metade de baixo).
  const hcx = 100;
  const hcy = 78;
  const hrx = 63 + f * 4;
  const hry = 46;
  const top = hcy - hry;
  const head = headPath(hcx, hcy, hrx, hry);
  const eyeY = 66;
  const ex = 26;
  const noseY = eyeY + 6;
  const muzzle = muzzlePath(eyeY, ex, hrx, eating ? 0.08 : 0);
  const chin = eyeY + 56;
  // inclinação da cabecinha (fica reta dormindo)
  const tilt = asleep ? 0 : 6;
  // Corpo bem redondinho
  const bw = 62 + f * 7;
  const body = torso(bw, 192);
  const geo = { top, w: hrx * 0.86, h: 188 - top, eyeY };

  const costume = costumeOf(outfit.roupa);
  const holding =
    !!outfit.acessorio && itemById(outfit.acessorio)?.base === "segurar";
  const sleeve = costume ? null : sleeveOf(outfit.roupa);
  const shape = costume ? null : garmentShape(outfit.roupa);
  const garment = costume
    ? null
    : shape
      ? garmentColor(outfit.roupa)
      : (sleeve ??
        (outfit.roupa ? (itemById(outfit.roupa)?.c1 ?? null) : null));
  const cloth =
    shape === "dress" ? torso(bw + 1.4, 190, 6) : torso(bw + 1.4, 185);
  const hem = shape === "dress" ? 190 : 185;

  // Cores com volume: luz por cima à esquerda, borda mais funda.
  const furLight = lighten(fur.body, 0.22);
  const furEdge = darken(fur.shade, 0.04);
  const cream = fur.belly;
  const arm = costume ? costume.paw : fur.body;
  const foot = costume ? costume.foot : fur.body;
  const edge = (c: string) => darken(c, 0.16);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={label ?? "Hami"}
      className="block overflow-visible"
    >
      <defs>
        <clipPath id={`b${uid}`}>
          <path d={body} />
          {costume && <path d={head} />}
        </clipPath>
        <clipPath id={`k${uid}`}>
          <path d={cloth} />
        </clipPath>
        <clipPath id={`h${uid}`}>
          <path d={head} />
        </clipPath>
        <radialGradient id={`f${uid}`} cx="38%" cy="24%" r="85%">
          <stop offset="0%" stopColor={furLight} />
          <stop offset="48%" stopColor={fur.body} />
          <stop offset="100%" stopColor={fur.shade} />
        </radialGradient>
        <radialGradient id={`m${uid}`} cx="45%" cy="25%" r="80%">
          <stop offset="0%" stopColor={lighten(cream, 0.4)} />
          <stop offset="60%" stopColor={cream} />
          <stop offset="100%" stopColor={darken(cream, 0.07)} />
        </radialGradient>
        <radialGradient id={`s${uid}`}>
          <stop offset="0%" stopColor="#5A2E14" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#5A2E14" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`l${uid}`}>
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`c${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="0.3" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.68" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFE07A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g
        transform={
          k < 1
            ? `translate(100 190) scale(${k}) translate(-100 -190)`
            : undefined
        }
      >
        {phase >= 3 && (
          <circle cx="100" cy="110" r="94" fill={`url(#g${uid})`} />
        )}
        <EffectBack id={outfit.efeito} geo={geo} uid={uid} />
        <ellipse
          cx="100"
          cy="194"
          rx={bw * 1.12}
          ry="6.5"
          fill="rgba(60,30,40,0.14)"
        />
        <g
          className={
            idle && !asleep ? "pet-idle" : asleep ? "pet-sleep" : undefined
          }
        >
          <Cape id={outfit.roupa} geo={geo} />
          <AccessoryBack id={outfit.acessorio} geo={geo} />

          {/* corpo (com a barriga creme) */}
          <path d={body} fill={costume ? fur.body : `url(#f${uid})`} />
          <g clipPath={`url(#b${uid})`}>
            <ellipse
              cx="100"
              cy="162"
              rx={bw * 0.62}
              ry="36"
              fill={`url(#m${uid})`}
            />
            {fur.pattern === "manchas" && (
              <ellipse
                cx={100 + bw * 0.62}
                cy="146"
                rx="15"
                ry="18"
                fill={fur.patch}
                opacity="0.85"
              />
            )}
            {!shape && <Clothes id={outfit.roupa} geo={geo} />}
            {garment && !shape && (
              <rect
                x="0"
                y={chin - 14}
                width="200"
                height="100"
                fill={`url(#c${uid})`}
              />
            )}
            {/* sombra macia da cabeça no corpo */}
            <ellipse
              cx="100"
              cy={chin + 2}
              rx={hrx * 0.86}
              ry="13"
              fill={`url(#s${uid})`}
            />
          </g>
          <path
            d={body}
            fill="none"
            stroke={
              costume
                ? edge(costume.c1)
                : garment && !shape
                  ? edge(garment)
                  : furEdge
            }
            strokeOpacity={garment || costume ? 0.9 : 0.4}
            strokeWidth="1.3"
          />
          {shape && garment && (
            <g>
              <path d={cloth} fill={garment} />
              <g clipPath={`url(#k${uid})`}>
                <Clothes id={outfit.roupa} geo={geo} />
                <rect
                  x="0"
                  y={chin - 14}
                  width="200"
                  height="100"
                  fill={`url(#c${uid})`}
                />
                <ellipse
                  cx="100"
                  cy={chin + 2}
                  rx={hrx * 0.86}
                  ry="13"
                  fill={`url(#s${uid})`}
                />
                <path
                  d={`M${100 - bw * 0.62} ${hem - 4} Q100 ${hem + 3} ${100 + bw * 0.62} ${hem - 4}`}
                  stroke={darken(garment, 0.3)}
                  strokeWidth="1.1"
                  strokeDasharray="2.6 2.2"
                  fill="none"
                  opacity="0.5"
                />
              </g>
              <path
                d={cloth}
                fill="none"
                stroke={edge(garment)}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* pezões para a frente: sola creme, almofadinha e três dedinhos cor-de-rosa */}
          {[-1, 1].map((s) => {
            const fx = 100 + s * 46;
            const fy = 177;
            const pad = "#F6A9B3";
            return (
              <g key={`pe${s}`} transform={`rotate(${s * 24} ${fx} ${fy})`}>
                <ellipse
                  cx={fx}
                  cy={fy}
                  rx="18"
                  ry="21"
                  fill={costume ? foot : `url(#f${uid})`}
                />
                <ellipse
                  cx={fx}
                  cy={fy}
                  rx="18"
                  ry="21"
                  fill="none"
                  stroke={costume ? edge(foot) : furEdge}
                  strokeOpacity="0.4"
                  strokeWidth="1.2"
                />
                <ellipse
                  cx={fx}
                  cy={fy + 1.5}
                  rx="13.5"
                  ry="16.5"
                  fill={costume ? lighten(foot, 0.55) : `url(#m${uid})`}
                />
                <ellipse cx={fx} cy={fy + 6.5} rx="7.6" ry="7" fill={pad} />
                {[-5.2, 0, 5.2].map((dx) => (
                  <ellipse
                    key={dx}
                    cx={fx + dx}
                    cy={fy - 8 + (dx === 0 ? -1.4 : 0)}
                    rx="2.8"
                    ry="3.2"
                    fill={pad}
                  />
                ))}
              </g>
            );
          })}

          {/* bracinhos curtos: descem do ombro e as patinhas creme se encontram na barriga */}
          {[-1, 1].map((s) => {
            if (s === 1 && holding) return null;
            const fill = sleeve ?? arm;
            const line = sleeve
              ? darken(sleeve, 0.22)
              : costume
                ? edge(costume.c1)
                : furEdge;
            const d = `M${100 + s * (bw - 16)} 122 C${100 + s * (bw - 9)} 134 ${100 + s * (bw - 20)} 146 ${100 + s * 24} 146`;
            return (
              <g
                key={s}
                className={
                  s === -1
                    ? pose === "tchau"
                      ? "pet-wave"
                      : "pet-arm"
                    : undefined
                }
                style={{ transformOrigin: `${100 + s * (bw - 16)}px 124px` }}
              >
                <path
                  d={d}
                  stroke={line}
                  strokeOpacity={sleeve || costume ? 0.8 : 0.3}
                  strokeWidth="18"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d={d}
                  stroke={sleeve ? fill : costume ? fill : `url(#f${uid})`}
                  strokeWidth="16.2"
                  strokeLinecap="round"
                  fill="none"
                />
                {sleeve && (
                  <ellipse
                    cx={100 + s * 26}
                    cy="146"
                    rx="5.5"
                    ry="8"
                    fill={darken(sleeve, 0.1)}
                  />
                )}
                <ellipse
                  cx={100 + s * 17}
                  cy="147"
                  rx="9.2"
                  ry="8.4"
                  fill={costume ? costume.paw : `url(#m${uid})`}
                />
                <path
                  d={`M${100 + s * 13} 151.4 v-2.4 M${100 + s * 17.5} 152.4 v-2.6`}
                  stroke={darken(cream, 0.28)}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </g>
            );
          })}

          {/* cabeça um pouquinho inclinada (como na ilustração), com as orelhas */}
          <g transform={`rotate(${tilt} 100 ${chin})`}>
            {/* orelhinhas redondas (atrás da cabeça), ou as do capuz da fantasia */}
            <CostumeBack id={outfit.roupa} geo={geo} />
            {!costume &&
              [-1, 1].map((s) => {
                const cx = hcx + s * hrx * 0.7;
                const cy = top + 10;
                return (
                  <g
                    key={s}
                    className={s === 1 ? "pet-ear" : undefined}
                    style={{ transformOrigin: `${cx}px ${cy + 14}px` }}
                  >
                    <circle cx={cx} cy={cy} r="17" fill={`url(#f${uid})`} />
                    <circle
                      cx={cx}
                      cy={cy}
                      r="17"
                      fill="none"
                      stroke={furEdge}
                      strokeOpacity="0.35"
                      strokeWidth="1.2"
                    />
                    <ellipse
                      cx={cx - s * 1.5}
                      cy={cy + 1.5}
                      rx="10.5"
                      ry="10"
                      fill={
                        fur.pattern === "panda"
                          ? fur.patch
                          : lighten(fur.ear, 0.35)
                      }
                    />
                    <ellipse
                      cx={cx - s * 2.5}
                      cy={cy - 3}
                      rx="4"
                      ry="2.6"
                      fill="#FFFFFF"
                      opacity="0.3"
                    />
                  </g>
                );
              })}

            {/* cabeça */}
            <path d={head} fill={costume ? fur.body : `url(#f${uid})`} />
            <g clipPath={`url(#h${uid})`}>
              {fur.pattern === "manchas" && (
                <ellipse
                  cx={hcx - hrx * 0.45}
                  cy={top + 16}
                  rx="20"
                  ry="14"
                  fill={fur.patch}
                  opacity="0.85"
                />
              )}
              {phase === 2 && !outfit.chapeu && (
                <rect
                  x="0"
                  y={top + 10}
                  width="200"
                  height="8"
                  fill="#FF6F91"
                />
              )}
              {costume && <path d={muzzle} fill={`url(#m${uid})`} />}
              {/* luz no alto da cabeça */}
              <ellipse
                cx={hcx - hrx * 0.25}
                cy={top + 14}
                rx={hrx * 0.42}
                ry="13"
                fill={`url(#l${uid})`}
              />
            </g>
            <path
              d={head}
              fill="none"
              stroke={costume ? edge(costume.c1) : furEdge}
              strokeOpacity={costume ? 0.9 : 0.4}
              strokeWidth="1.3"
            />
            {costume && (
              <g clipPath={`url(#h${uid})`}>
                <Clothes id={outfit.roupa} geo={geo} />
              </g>
            )}
            {/* bochechas creme bem fofas */}
            {!costume && (
              <g>
                <path d={muzzle} fill={`url(#m${uid})`} />
                <path
                  d={muzzle}
                  fill="none"
                  stroke={darken(cream, 0.14)}
                  strokeOpacity="0.25"
                  strokeWidth="1"
                />
                {[-1, 1].map((s) => (
                  <ellipse
                    key={s}
                    cx={100 + s * hrx * 0.74}
                    cy={eyeY + 16}
                    rx="9"
                    ry="6"
                    fill="#FFFFFF"
                    opacity="0.35"
                  />
                ))}
              </g>
            )}
            {fur.pattern === "panda" &&
              [-1, 1].map((s) => (
                <ellipse
                  key={s}
                  cx={hcx + s * ex}
                  cy={eyeY - 1}
                  rx="14"
                  ry="11"
                  fill={fur.patch}
                  opacity="0.9"
                />
              ))}
            <Face
              mood={mood}
              eyeY={eyeY}
              noseY={noseY}
              ex={ex}
              blush={fur.ear}
              eyeK={1 + young * 0.12}
            />
            {wet && (
              <g>
                <path d={head} fill="#5B8FD6" opacity="0.16" />
                <path d={body} fill="#5B8FD6" opacity="0.16" />
                {[
                  [-0.5, 0.1],
                  [0.35, 0.05],
                  [0.62, 0.42],
                  [-0.7, 0.5],
                  [0.1, 0.0],
                ].map(([dx, dy], i) => (
                  <path
                    key={i}
                    className="drip"
                    style={{ animationDelay: `${i * 0.3}s` }}
                    d={`M${100 + dx * hrx} ${top + 10 + dy * 90} q-3.5 6 0 9 q3.5 -3 0 -9 Z`}
                    fill="#8FD0FF"
                    stroke="#5BA9E8"
                    strokeWidth="0.8"
                  />
                ))}
              </g>
            )}
            {shine && (
              <g fill="#FFFFFF">
                <ellipse
                  cx={hcx + hrx * 0.42}
                  cy={hcy - hry * 0.5}
                  rx="8"
                  ry="4"
                  opacity="0.55"
                  transform={`rotate(30 ${hcx + hrx * 0.42} ${hcy - hry * 0.5})`}
                />
                <path
                  className="sparkle"
                  d={`M${100 - hrx - 2} ${top + 30} l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z`}
                  fill="#FFF3A6"
                />
                <path
                  className="sparkle"
                  style={{ animationDelay: "0.5s" }}
                  d={`M${100 + hrx + 4} ${top + 70} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z`}
                  fill="#FFF3A6"
                />
              </g>
            )}
            <CostumeFront id={outfit.roupa} geo={geo} />
            <Glasses id={outfit.oculos} eyeY={eyeY} ex={ex} />
            <Hat id={outfit.chapeu} geo={geo} />
          </g>
          <Accessory
            id={outfit.acessorio}
            geo={{ ...geo, top: chin - 36, h: 64, w: bw - 8 }}
            paw={arm}
            head={{ cx: hcx, cy: hcy, rx: hrx, ry: hry }}
          />
          {phase >= 3 && <Sparkles top={top} w={hrx} />}
          <EffectFront id={outfit.efeito} geo={geo} />
        </g>
      </g>
      {asleep && (
        <text
          x={100 + hrx * 0.8}
          y={top}
          className="zzz"
          fontSize="18"
          fontWeight="800"
          fill={INK}
          opacity="0.6"
        >
          z z
        </text>
      )}
    </svg>
  );
}

function Face({
  mood,
  eyeY,
  noseY,
  ex,
  blush,
  eyeK = 1,
}: {
  mood: PetMood;
  eyeY: number;
  noseY: number;
  ex: number;
  blush: string;
  eyeK?: number;
}) {
  // Como a referência: olhinhos sorrindo (^ ^) grossos e escuros, narizinho rosa e a boquinha ":3".
  const sleepy = mood === "sono" || mood === "dormindo";
  const open = mood === "surpreso" || mood === "boca";
  const laugh = mood === "animado" || mood === "risada";
  const n = noseY;
  return (
    <g>
      <g
        transform={
          eyeK !== 1
            ? `translate(100 ${eyeY}) scale(${eyeK}) translate(-100 ${-eyeY})`
            : undefined
        }
      >
        {open ? (
          <g className="pet-eyes">
            {[-1, 1].map((s) => (
              <g key={s}>
                <ellipse
                  cx={100 + s * ex}
                  cy={eyeY}
                  rx="5.8"
                  ry="6.8"
                  fill={INK}
                />
                <circle
                  cx={100 + s * ex + 1.9}
                  cy={eyeY - 2.4}
                  r="2.1"
                  fill="#FFFFFF"
                />
              </g>
            ))}
          </g>
        ) : (
          <g stroke={INK} strokeWidth="4.3" strokeLinecap="round" fill="none">
            {[-1, 1].map((s) => {
              const x = 100 + s * ex;
              return sleepy ? (
                <path
                  key={s}
                  d={`M${x - 9} ${eyeY - 1} Q${x} ${eyeY + 5.5} ${x + 9} ${eyeY - 1}`}
                />
              ) : (
                <path
                  key={s}
                  d={`M${x - 9.5} ${eyeY + 3.4} Q${x} ${eyeY - 8.5} ${x + 9.5} ${eyeY + 3.4}`}
                />
              );
            })}
          </g>
        )}
      </g>
      {/* rubor bem de leve */}
      {[-1, 1].map((s) => (
        <ellipse
          key={s}
          cx={100 + s * (ex + 14)}
          cy={eyeY + 12}
          rx="8"
          ry="4.6"
          fill={blush}
          opacity={laugh ? 0.35 : 0.16}
        />
      ))}
      {/* narizinho rosa arredondado */}
      <path
        d={`M94.4 ${n - 3.4} Q100 ${n - 5} 105.6 ${n - 3.4} Q105 ${n + 0.6} 100 ${n + 2.2} Q95 ${n + 0.6} 94.4 ${n - 3.4} Z`}
        fill="#F4A3AE"
      />
      <ellipse
        cx="98.6"
        cy={n - 2.6}
        rx="1.6"
        ry="0.9"
        fill="#FFFFFF"
        opacity="0.6"
      />
      {laugh ? (
        <g>
          <path
            d={`M100 ${n + 1.6} V${n + 3.6}`}
            stroke={INK}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={`M93.4 ${n + 3.8} Q100 ${n + 3.2} 106.6 ${n + 3.8} Q105.6 ${n + 12} 100 ${n + 12} Q94.4 ${n + 12} 93.4 ${n + 3.8} Z`}
            fill="#A8424E"
          />
          <path
            d={`M96 ${n + 9.2} Q100 ${n + 7} 104 ${n + 9.2} Q102.8 ${n + 11.4} 100 ${n + 11.4} Q97.2 ${n + 11.4} 96 ${n + 9.2} Z`}
            fill="#FF8FA0"
          />
        </g>
      ) : open ? (
        <g>
          <path
            d={`M100 ${n + 1.6} V${n + 3.6}`}
            stroke={INK}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse
            cx="100"
            cy={n + 8}
            rx={mood === "boca" ? 4.4 : 3.2}
            ry={mood === "boca" ? 4.8 : 3.8}
            fill="#A8424E"
          />
        </g>
      ) : (
        <path
          d={`M100 ${n + 1.6} V${n + 3.4} M93.2 ${n + 3} Q96.6 ${n + 7.6} 100 ${n + 3.6} Q103.4 ${n + 7.6} 106.8 ${n + 3}`}
          stroke={INK}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </g>
  );
}

function Sparkles({ top, w }: { top: number; w: number }) {
  const star = (x: number, y: number, r: number) =>
    `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
  return (
    <g fill="#F6C445" className="sparkle">
      <path d={star(100 - w - 8, top + 30, 7)} />
      <path d={star(100 + w + 6, top + 50, 6)} />
      <path d={star(100 + w * 0.5, top - 8, 5)} />
    </g>
  );
}
