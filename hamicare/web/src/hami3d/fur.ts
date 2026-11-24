// Pelo de pelúcia em 3D: a técnica de "camadas" (shells) dos jogos. Cada parte peluda do Hami é desenhada várias
// vezes, cada camada um pouquinho mais para fora; os fiozinhos são um ruído 3D que vai ficando mais ralo nas pontas.
// Assim a borda fica fofinha de verdade e o pelo tem volume, luz e sombra.
import * as THREE from 'three';

export type FurPattern = 'head' | 'body' | 'plain' | 'ear';

export interface FurColors {
  /** Pelo colorido (caramelo, por padrão). */
  main: THREE.Color;
  /** Pelo branquinho (rosto, barriga, patinhas). */
  white: THREE.Color;
  /** Bochechas e partes rosadas. */
  pink: THREE.Color;
}

const PATTERN: Record<FurPattern, number> = { head: 0, body: 1, plain: 2, ear: 3 };

const NOISE = /* glsl */ `
float h3(vec3 p) { p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`;

const vert = /* glsl */ `
uniform float uLayer;
uniform float uLen;
uniform float uFaceShort;
uniform vec3 uGravity;
varying vec3 vLocal;
varying vec3 vWN;
varying vec3 vView;
varying float vShort;
void main() {
  vec3 n = normalize(normal);
  // no rosto o pelo é mais curtinho (para os olhos e a boca ficarem bonitos)
  float face = uFaceShort * max(smoothstep(0.35, 0.8, n.z) * smoothstep(0.7, 0.1, n.y), smoothstep(-0.35, -0.75, n.y));
  vShort = face;
  float len = uLen * (1.0 - 0.6 * face);
  vec3 p = position + n * len * uLayer;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  // pontinhas caem um pouquinho com o peso (pelo assentado)
  wp.xyz += uGravity * len * uLayer * uLayer;
  vLocal = position;
  vWN = normalize(mat3(modelMatrix) * n);
  vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const frag = /* glsl */ `
uniform float uLayer;
uniform float uDensity;
uniform int uPattern;
uniform vec3 uMain;
uniform vec3 uWhite;
uniform vec3 uPink;
uniform vec3 uLight;
uniform float uWet;
varying vec3 vLocal;
varying vec3 vWN;
varying vec3 vView;
varying float vShort;
${NOISE}
vec3 pattern() {
  vec3 n = normalize(vLocal);
  float jag = (vn(vLocal * 7.0) - 0.5) * 0.4 + (vn(vLocal * 19.0) - 0.5) * 0.2;
  if (uPattern == 0) {
    // cabeça: caramelo no alto e dos lados, carinha branca grande (dos olhos para baixo), faixinha fina subindo
    // na testa e queixo branco
    float front = smoothstep(0.1, 0.48, n.z) * smoothstep(0.66, 0.3, n.y + 0.5 * abs(n.x));
    float blaze = smoothstep(0.12, 0.04, abs(n.x + 0.03 * n.y)) * smoothstep(0.35, 0.75, n.z);
    float chin = smoothstep(-0.25, -0.65, n.y);
    float w = smoothstep(0.32, 0.68, max(max(front, blaze), chin) + jag * 1.4);
    vec3 c = mix(uMain, uWhite, w);
    // bochechas rosadas (bem redondinhas)
    vec3 cl = normalize(vec3(-0.62, -0.24, 0.75));
    vec3 cr = normalize(vec3(0.62, -0.24, 0.75));
    float b = max(smoothstep(0.2, 0.12, distance(n, cl)), smoothstep(0.2, 0.12, distance(n, cr)));
    return mix(c, uPink, b * 0.9);
  }
  if (uPattern == 1) {
    // corpo: barriga branca na frente, caramelo nas costas e nos lados
    float front = smoothstep(-0.05, 0.45, n.z) * smoothstep(0.9, 0.45, abs(n.x));
    float under = smoothstep(-0.3, -0.75, n.y);
    float w = smoothstep(0.38, 0.62, max(front, under) + jag);
    vec3 c = mix(uMain, uWhite, w);
    // sombrinha macia embaixo da cabeça
    return c * (1.0 - 0.16 * smoothstep(0.45, 0.85, n.y) * smoothstep(-0.2, 0.5, n.z));
  }
  if (uPattern == 3) {
    // orelha: caramelo por fora com a beirada mais clarinha
    return mix(uMain, uWhite, smoothstep(0.6, 0.95, abs(n.x)) * 0.35);
  }
  return uWhite;
}
void main() {
  // fiozinhos: um ruído macio que vai rareando para as pontas (as camadas de dentro cobrem quase tudo)
  float s = vn(vLocal * uDensity) * 0.6 + vn(vLocal * uDensity * 2.3 + 3.1) * 0.3 + vn(vLocal * uDensity * 5.1 + 7.7) * 0.1;
  float cut = uLayer * 0.8 + 0.12;
  float a = uLayer <= 0.0 ? 1.0 : smoothstep(cut - 0.2, cut + 0.05, s) * (1.0 - uLayer * 0.45);
  if (a < 0.01) discard;
  vec3 base = pattern();
  vec3 N = normalize(vWN);
  vec3 L = normalize(uLight);
  // luz macia (enrolada), céu claro em cima e chão quentinho embaixo, contraluz na borda
  float wrap = max(0.0, (dot(N, L) + 0.55) / 1.55);
  vec3 amb = mix(vec3(0.7, 0.62, 0.62), vec3(0.98, 0.98, 1.0), N.y * 0.5 + 0.5) * 0.6;
  float rim = pow(1.0 - max(dot(N, normalize(vView)), 0.0), 2.2);
  float occ = mix(0.62, 1.0, pow(uLayer, 0.55));
  vec3 col = base * (amb + wrap * vec3(1.0, 0.97, 0.93) * 0.58) * occ;
  col += rim * 0.2 * vec3(1.0, 0.97, 0.94) * (0.5 + uLayer);
  col = mix(col, col * vec3(0.82, 0.88, 0.97), uWet);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;

/** Cria as camadas de pelo de uma parte (a primeira é a "pele", as outras os fiozinhos). */
/** Esconde (ou mostra) os fiozinhos de uma parte (a pele continua), por exemplo embaixo da roupa. */
export function setShellsVisible(group: THREE.Group, on: boolean) {
  group.children.forEach((c, i) => i > 0 && (c.visible = on));
}

export function furShells(
  geo: THREE.BufferGeometry,
  opts: { pattern: FurPattern; colors: FurColors; len: number; density?: number; layers?: number; faceShort?: number; gravity?: number },
): { group: THREE.Group; materials: THREE.ShaderMaterial[] } {
  const group = new THREE.Group();
  const layers = opts.layers ?? 24;
  const materials: THREE.ShaderMaterial[] = [];
  for (let i = 0; i < layers; i++) {
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uLayer: { value: i / (layers - 1) },
        uLen: { value: opts.len },
        uDensity: { value: opts.density ?? 34 },
        uFaceShort: { value: opts.faceShort ?? 0 },
        uGravity: { value: new THREE.Vector3(0, -(opts.gravity ?? 0.5), 0) },
        uPattern: { value: PATTERN[opts.pattern] },
        uMain: { value: opts.colors.main },
        uWhite: { value: opts.colors.white },
        uPink: { value: opts.colors.pink },
        uLight: { value: new THREE.Vector3(-0.55, 0.85, 0.75) },
        uWet: { value: 0 },
      },
      transparent: i > 0,
      depthWrite: i === 0,
    });
    const mesh = new THREE.Mesh(geo, m);
    mesh.renderOrder = i;
    group.add(mesh);
    materials.push(m);
  }
  return { group, materials };
}
