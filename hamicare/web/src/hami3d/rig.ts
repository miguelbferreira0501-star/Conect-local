// O Hami em 3D: um boneco de verdade montado em partes (cabeça, corpo, orelhas, bracinhos, pezinhos e rabinho),
// cada uma com o seu pivô, pelo de pelúcia e o rostinho (olhos, bochechas, narizinho e boca) em 3D. As poses e as
// animações (respirar, piscar, acenar, festa, andar, dormir) mexem nessas partes, como um boneco articulado.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { furShells, setShellsVisible, type FurColors } from './fur';

export type Hami3DMood = 'feliz' | 'risada' | 'calmo' | 'sono' | 'dormindo' | 'surpreso' | 'triste';
export type Hami3DAction = 'parado' | 'tchau' | 'festa' | 'andar' | 'dormir';

export interface Hami3DLook {
  fur: { body: string; belly: string; ear: string };
  /** Roupa (cor principal e de detalhe) e o formato dela. */
  cloth?: { c1: string; c2: string; shape: 'top' | 'dress' | 'costume' } | null;
}

/** Esfera com bastante detalhe (o pelo precisa de normais macias). */
const sphere = (seg = 48) => new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));

function mat(color: string, rough = 0.6, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: rough, ...extra });
}

/** Um ponto na superfície do elipsoide (raio rx, ry, rz) na direção (x, y, z), e a normal ali. */
function onSurface(r: THREE.Vector3, dir: THREE.Vector3, lift = 0) {
  const d = dir.clone().normalize();
  const p = new THREE.Vector3(d.x * r.x, d.y * r.y, d.z * r.z);
  const n = new THREE.Vector3(d.x / r.x, d.y / r.y, d.z / r.z).normalize();
  return { p: p.addScaledVector(n, lift), n };
}

/** Arquinho de olho fechado (^ ou ‿) feito de tubo. */
function arcEye(w: number, h: number, up: boolean) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = (t - 0.5) * w;
    const y = (up ? 1 : -1) * Math.sin(t * Math.PI) * h;
    pts.push(new THREE.Vector3(x, y, 0));
  }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, w * 0.075, 8, false);
  return new THREE.Mesh(g, mat('#3A1F17', 0.45));
}

export class HamiRig {
  root = new THREE.Group();
  /** Tudo que mexe junto com a respiração e os pulinhos. */
  bodyPivot = new THREE.Group();
  headPivot = new THREE.Group();
  armL = new THREE.Group();
  armR = new THREE.Group();
  legL = new THREE.Group();
  legR = new THREE.Group();
  earL = new THREE.Group();
  earR = new THREE.Group();
  eyesOpen = new THREE.Group();
  eyesHappy = new THREE.Group();
  eyesSleep = new THREE.Group();
  mouthOpen = new THREE.Group();
  mouthSmall = new THREE.Group();
  cloth = new THREE.Group();
  backpack = new THREE.Group();
  private headDeco = new THREE.Group();
  private headDecoBack = new THREE.Group();
  private bodyDeco = new THREE.Group();
  private bodyFur: THREE.Group | null = null;
  private clothMap: THREE.Texture | null = null;
  private shirt: THREE.Mesh | null = null;
  private armFur: THREE.Group[] = [];
  shadow: THREE.Mesh;
  private furMats: THREE.ShaderMaterial[] = [];
  private colors: FurColors;
  mood: Hami3DMood = 'feliz';
  action: Hami3DAction = 'parado';
  /** Meio de lado (radianos). */
  turn = -0.42;
  private blinkAt = 2;
  private actionStart = 0;

  static HEAD_R = new THREE.Vector3(1.3, 1.0, 1.02);
  static BODY_R = new THREE.Vector3(0.86, 0.78, 0.78);

  constructor(look: Hami3DLook) {
    this.colors = { main: new THREE.Color(look.fur.body), white: new THREE.Color(look.fur.belly), pink: new THREE.Color('#F5A3B5') };
    const add = (parent: THREE.Object3D, ...kids: THREE.Object3D[]) => kids.forEach((k) => parent.add(k));
    const fur = (geo: THREE.BufferGeometry, pattern: Parameters<typeof furShells>[1]['pattern'], len: number, extra: Partial<Parameters<typeof furShells>[1]> = {}) => {
      const f = furShells(geo, { pattern, colors: this.colors, len, ...extra });
      this.furMats.push(...f.materials);
      return f.group;
    };

    this.root.add(this.bodyPivot);
    // ---- corpo (pera fofinha) ----
    const BR = HamiRig.BODY_R;
    const bodyGeo = sphere(56);
    // formato de pera: mais largo embaixo
    const bp = bodyGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const y = bp.getY(i);
      const k = 1 + 0.16 * Math.max(0, -y) - 0.06 * Math.max(0, y);
      bp.setXYZ(i, bp.getX(i) * BR.x * k, y * BR.y, bp.getZ(i) * BR.z * k);
    }
    bodyGeo.computeVertexNormals();
    const body = fur(bodyGeo, 'body', 0.08);
    body.position.set(0, 0.8, 0);
    this.bodyFur = body;
    add(this.bodyPivot, body);

    // ---- pezinhos (pivô no quadril) ----
    for (const [g, sd] of [
      [this.legL, -1],
      [this.legR, 1],
    ] as const) {
      g.position.set(sd * 0.4, 0.42, 0.18);
      const footGeo = sphere(32);
      footGeo.scale(0.27, 0.19, 0.36);
      footGeo.computeVertexNormals();
      const foot = fur(footGeo, 'plain', 0.045, { density: 44, layers: 14 });
      foot.position.set(0, -0.26, 0.12);
      const pad = new THREE.Mesh(sphere(24), mat('#F4A7B6', 0.55));
      pad.scale.set(0.2, 0.06, 0.24);
      pad.position.set(0, -0.43, 0.14);
      add(g, foot, pad);
      this.root.add(g);
    }

    // ---- rabinho ----
    const tailGeo = sphere(20);
    tailGeo.scale(0.16, 0.14, 0.14);
    tailGeo.computeVertexNormals();
    const tail = fur(tailGeo, 'plain', 0.06, { layers: 14, density: 40 });
    tail.position.set(0, 0.55, -0.78);
    add(this.bodyPivot, tail);

    // ---- bracinhos (pivô no ombro) ----
    for (const [g, sd] of [
      [this.armL, -1],
      [this.armR, 1],
    ] as const) {
      g.position.set(sd * 0.6, 1.08, 0.36);
      const armGeo = sphere(28);
      armGeo.scale(0.21, 0.28, 0.21);
      armGeo.computeVertexNormals();
      const arm = fur(armGeo, 'plain', 0.045, { density: 44, layers: 14 });
      this.armFur.push(arm);
      arm.position.set(sd * 0.04, -0.24, 0.06);
      arm.rotation.z = sd * 0.25;
      add(g, arm);
      this.bodyPivot.add(g);
    }

    // ---- cabeça (pivô no pescoço) ----
    this.headPivot.position.set(0, 1.28, 0.02);
    this.bodyPivot.add(this.headPivot);
    const HR = HamiRig.HEAD_R;
    const headGeo = sphere(64);
    headGeo.scale(HR.x, HR.y, HR.z);
    headGeo.computeVertexNormals();
    const head = new THREE.Group();
    head.position.set(0, 0.62, 0);
    head.add(fur(headGeo, 'head', 0.09, { density: 30, faceShort: 1, layers: 26 }));
    this.headPivot.add(head);

    // orelhas: discos redondinhos com o rosinha por dentro
    for (const [g, sd] of [
      [this.earL, -1],
      [this.earR, 1],
    ] as const) {
      g.position.set(sd * 0.8, 0.62 + 0.7, -0.14);
      g.rotation.set(-0.08, sd * -0.2, sd * -0.5);
      const earGeo = sphere(32);
      earGeo.scale(0.4, 0.42, 0.12);
      earGeo.computeVertexNormals();
      const ear = fur(earGeo, 'ear', 0.05, { layers: 16, density: 36, faceShort: 1 });
      const inner = new THREE.Mesh(sphere(28), mat('#F493AB', 0.75, { sheen: 1, sheenColor: new THREE.Color('#FFD0DC'), sheenRoughness: 0.5 }));
      inner.scale.set(0.28, 0.3, 0.05);
      inner.position.set(0, -0.03, 0.1);
      add(g, ear, inner);
      this.headPivot.add(g);
    }

    // ---- rostinho ----
    const face = new THREE.Group();
    face.position.copy(head.position);
    this.headPivot.add(face);
    const place = (obj: THREE.Object3D, dir: [number, number, number], lift: number) => {
      const { p, n } = onSurface(HR, new THREE.Vector3(...dir), lift);
      obj.position.copy(p);
      obj.lookAt(p.clone().add(n));
      face.add(obj);
      return obj;
    };
    // olhos abertos: castanho escuro brilhante com dois pontinhos de luz
    for (const sd of [-1, 1]) {
      const eye = new THREE.Group();
      const ball = new THREE.Mesh(sphere(32), mat('#2A140C', 0.12, { clearcoat: 1, clearcoatRoughness: 0.05 }));
      ball.scale.set(0.17, 0.2, 0.08);
      const iris = new THREE.Mesh(sphere(24), mat('#7A4326', 0.3, { clearcoat: 1, clearcoatRoughness: 0.08 }));
      iris.scale.set(0.1, 0.1, 0.04);
      iris.position.set(0, -0.05, 0.045);
      const hi = new THREE.Mesh(sphere(16), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }));
      hi.scale.set(0.058, 0.062, 0.02);
      hi.position.set(0.045, 0.07, 0.078);
      const hi2 = new THREE.Mesh(sphere(12), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }));
      hi2.scale.set(0.022, 0.022, 0.01);
      hi2.position.set(-0.05, -0.07, 0.068);
      eye.add(ball, iris, hi, hi2);
      place(eye, [sd * 0.4, 0.02, 0.92], 0.03);
      this.eyesOpen.add(eye);
    }
    face.add(this.eyesOpen);
    // olhinhos de alegria (^ ^) e de sono (‿ ‿)
    for (const sd of [-1, 1]) {
      const happy = arcEye(0.34, 0.1, true);
      place(happy, [sd * 0.4, 0.02, 0.92], 0.055);
      this.eyesHappy.add(happy);
      const sleep = arcEye(0.32, 0.07, false);
      place(sleep, [sd * 0.4, 0.0, 0.92], 0.055);
      this.eyesSleep.add(sleep);
    }
    face.add(this.eyesHappy, this.eyesSleep);
    // narizinho rosa
    const nose = new THREE.Mesh(sphere(20), mat('#F58FA6', 0.35, { clearcoat: 0.6 }));
    nose.scale.set(0.075, 0.055, 0.05);
    place(nose, [0, -0.17, 1], 0.045);
    // boquinha aberta sorrindo (em D, com a linguinha) com o "ω" do focinho em cima; e a fechadinha (só o ω)
    const mw = 0.17;
    const mh = 0.17;
    const dShape = new THREE.Shape();
    dShape.moveTo(-mw, 0);
    dShape.lineTo(mw, 0);
    dShape.absellipse(0, 0, mw, mh, 0, Math.PI, true);
    const mouth = new THREE.Mesh(new THREE.ShapeGeometry(dShape, 24), new THREE.MeshStandardMaterial({ color: '#6E2432', roughness: 0.6, side: THREE.DoubleSide }));
    const tShape = new THREE.Shape();
    tShape.absellipse(0, -mh * 0.62, mw * 0.62, mh * 0.36, 0, Math.PI * 2, false);
    const tongue = new THREE.Mesh(new THREE.ShapeGeometry(tShape, 24), new THREE.MeshStandardMaterial({ color: '#F27D95', roughness: 0.5, side: THREE.DoubleSide }));
    tongue.position.z = 0.003;
    this.mouthOpen.add(mouth, tongue);
    place(this.mouthOpen, [0, -0.33, 0.95], 0.05);
    const w = new THREE.Group();
    for (const sd of [-1, 1]) {
      const a = arcEye(0.12, 0.045, false);
      a.position.x = sd * 0.06;
      w.add(a);
    }
    this.mouthSmall.add(w);
    place(this.mouthSmall, [0, -0.25, 0.97], 0.05);
    // risquinhos brancos de brilho nas bochechas
    for (const sd of [-1, 1]) {
      const g = new THREE.Group();
      for (const dx of [-0.04, 0.04]) {
        const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 8), new THREE.MeshBasicMaterial({ color: '#FFF4F6' }));
        s.position.set(dx, 0, 0);
        s.rotation.z = 0.35;
        g.add(s);
      }
      place(g, [sd * 0.62, -0.2, 0.78], 0.06);
    }

    // ---- mochilinha do passeio (rosa, com patinha) ----
    const bagMat = mat('#F7A6C2', 0.55, { clearcoat: 0.4, clearcoatRoughness: 0.4 });
    const bag = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.95, 0.42, 4, 0.16), bagMat);
    const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.5, 0.14, 3, 0.1), mat('#F9B9CF', 0.55));
    pocket.position.set(0, -0.14, -0.24);
    const flap = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.3, 0.46, 3, 0.12), mat('#F391B3', 0.55));
    flap.position.set(0, 0.36, -0.02);
    const paw = new THREE.Group();
    const pawMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.5 });
    const padBig = new THREE.Mesh(sphere(16), pawMat);
    padBig.scale.set(0.11, 0.09, 0.03);
    padBig.position.set(0, -0.04, 0);
    paw.add(padBig);
    for (const [x, y] of [
      [-0.11, 0.07],
      [-0.04, 0.12],
      [0.04, 0.12],
      [0.11, 0.07],
    ]) {
      const toe = new THREE.Mesh(sphere(12), pawMat);
      toe.scale.set(0.035, 0.04, 0.02);
      toe.position.set(x, y, 0);
      paw.add(toe);
    }
    paw.position.set(0, -0.12, -0.32);
    paw.rotation.y = Math.PI;
    this.backpack.add(bag, pocket, flap, paw);
    // alças passando pelos ombros
    for (const sd of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 40, Math.PI * 1.1), mat('#F391B3', 0.55));
      strap.rotation.set(0, Math.PI / 2, Math.PI * 0.2);
      strap.position.set(sd * 0.42, 0.02, 0.6);
      this.backpack.add(strap);
    }
    this.backpack.position.set(0, 1.0, -0.86);
    this.backpack.rotation.x = 0.12;
    this.backpack.visible = false;
    this.bodyPivot.add(this.backpack);

    // ---- enfeites desenhados (chapéu, óculos, colar…) presos na cabeça e no pescoço ----
    head.add(this.headDeco, this.headDecoBack);
    this.bodyPivot.add(this.bodyDeco);

    // ---- roupa ----
    this.bodyPivot.add(this.cloth);
    this.setCloth(look.cloth ?? null);

    // ---- sombra no chão ----
    const sh = document.createElement('canvas');
    sh.width = sh.height = 64;
    const c = sh.getContext('2d')!;
    const grad = c.createRadialGradient(32, 32, 2, 32, 32, 32);
    grad.addColorStop(0, 'rgba(40,25,40,0.38)');
    grad.addColorStop(1, 'rgba(40,25,40,0)');
    c.fillStyle = grad;
    c.fillRect(0, 0, 64, 64);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.005;
    this.root.add(this.shadow);
    this.setMood('feliz');
  }

  /** Troca a cor do pelo (sem refazer o boneco). */
  setFur(f: Hami3DLook['fur']) {
    this.colors.main.set(f.body);
    this.colors.white.set(f.belly);
  }

  /** Veste a roupa: um "casaquinho" de tecido por cima do corpo (e o pelo do corpo some embaixo dele). */
  setCloth(cloth: Hami3DLook['cloth']) {
    this.cloth.clear();
    for (const arm of [this.armL, this.armR]) arm.children.filter((c) => c.userData.sleeve).forEach((c) => arm.remove(c));
    if (this.bodyFur) setShellsVisible(this.bodyFur, !cloth);
    this.shirt = null;
    if (!cloth) return;
    const BR = HamiRig.BODY_R;
    const tint = new THREE.Color(cloth.c1).lerp(new THREE.Color('#FFFFFF'), 0.35);
    const fabric = (color: string) => mat(color, 0.86, { sheen: 0.35, sheenColor: tint, sheenRoughness: 0.7 });
    const dress = cloth.shape === 'dress';
    // casaquinho/vestido: o mesmo formato de pera do corpo, um pouco maior (cobre o pelo)
    const g = new THREE.SphereGeometry(1, 56, 40, 0, Math.PI * 2, Math.PI * 0.16, Math.PI * (dress ? 0.66 : 0.6));
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const pear = 1 + 0.16 * Math.max(0, -y) - 0.06 * Math.max(0, y);
      const flare = dress ? 1 + 0.32 * Math.max(0, -y - 0.1) : 1;
      pos.setXYZ(i, pos.getX(i) * (BR.x + 0.07) * pear * flare, y * (BR.y + 0.06), pos.getZ(i) * (BR.z + 0.07) * pear * flare);
    }
    g.computeVertexNormals();
    // estampa da roupa projetada de frente (a mesma da Loja)
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 1.05) / 2.1, (0.8 + pos.getY(i) - 0.17) / 1.38);
    uv.needsUpdate = true;
    const shirt = new THREE.Mesh(g, fabric(cloth.c1));
    shirt.position.set(0, 0.8, 0);
    this.shirt = shirt;
    this.applyClothMap();
    // barrado na cor de detalhe
    const hemY = Math.cos(Math.PI * (0.16 + (dress ? 0.66 : 0.6)));
    const hemPear = 1 + 0.16 * Math.max(0, -hemY);
    const hemFlare = dress ? 1 + 0.32 * Math.max(0, -hemY - 0.1) : 1;
    const hemR = Math.sqrt(1 - hemY * hemY);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 10, 64), fabric(cloth.c2));
    hem.rotation.x = Math.PI / 2;
    hem.scale.set(hemR * (BR.x + 0.07) * hemPear * hemFlare, hemR * (BR.z + 0.07) * hemPear * hemFlare, 1);
    hem.position.set(0, 0.8 + hemY * (BR.y + 0.06), 0);
    this.cloth.add(shirt, hem);
    // mangas curtinhas nos bracinhos (a patinha fica de fora)
    for (const arm of [this.armL, this.armR]) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), fabric(cloth.c1));
      s.scale.set(0.27, 0.26, 0.27);
      s.position.set(0, -0.02, 0.03);
      s.userData.sleeve = true;
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 8, 32), fabric(cloth.c2));
      cuff.rotation.x = Math.PI / 2;
      cuff.position.set(0, -0.03, 0.03);
      cuff.userData.sleeve = true;
      arm.add(s, cuff);
    }
  }

  /**
   * Os enfeites desenhados (no quadro do rosto, 200×200, com os olhos em (75,80) e (125,80)): chapéu, óculos e a
   * frente das fantasias vão na frente da cabeça; o capuz das fantasias atrás dela; colares e efeitos no pescoço.
   */
  setDecor(front: THREE.Texture | null, back: THREE.Texture | null, neck: THREE.Texture | null) {
    const plane = (tex: THREE.Texture, w: number, h: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, alphaTest: 0.02 }));
      m.renderOrder = 60;
      return m;
    };
    const kx = 0.0208;
    const ky = 0.0255;
    for (const g of [this.headDeco, this.headDecoBack, this.bodyDeco]) g.clear();
    if (front) {
      const m = plane(front, 200 * kx, 200 * ky);
      m.position.set(0, 0.02 - 20 * ky, 1.1);
      this.headDeco.add(m);
    }
    if (back) {
      const m = plane(back, 200 * kx, 200 * ky);
      m.position.set(0, 0.02 - 20 * ky, -0.25);
      (m.material as THREE.MeshBasicMaterial).depthTest = true;
      m.renderOrder = -1;
      this.headDecoBack.add(m);
    }
    if (neck) {
      const k = 0.0172;
      const m = plane(neck, 200 * k, 200 * k);
      m.position.set(0, 1.22 + 23 * k, 0.92);
      this.bodyDeco.add(m);
    }
  }

  /** A estampa da roupa (desenho da peça) no tecido do boneco. */
  setClothMap(tex: THREE.Texture | null) {
    this.clothMap = tex;
    this.applyClothMap();
  }

  private applyClothMap() {
    if (!this.shirt) return;
    const m = this.shirt.material as THREE.MeshPhysicalMaterial;
    if (this.clothMap) {
      m.map = this.clothMap;
      m.color.set('#FFFFFF');
    }
    m.needsUpdate = true;
  }

  /** Molhadinho (no banho): o pelo fica um tiquinho mais escuro e azulado. */
  setWet(on: boolean) {
    for (const m of this.furMats) m.uniforms.uWet.value = on ? 0.6 : 0;
  }

  setMood(m: Hami3DMood) {
    this.mood = m;
    const happy = m === 'risada';
    const sleep = m === 'sono' || m === 'dormindo';
    this.eyesOpen.visible = !happy && !sleep;
    this.eyesHappy.visible = happy;
    this.eyesSleep.visible = sleep;
    this.mouthOpen.visible = m === 'feliz' || m === 'risada' || m === 'surpreso';
    // o "ω" do focinho fica sempre; com a boca aberta ele fica logo em cima dela
    this.mouthSmall.visible = true;
  }

  setAction(a: Hami3DAction, t: number) {
    if (a === this.action) return;
    this.action = a;
    this.actionStart = t;
  }

  /** Atualiza a pose no tempo t (segundos). */
  update(t: number) {
    const a = this.action;
    const lt = t - this.actionStart;
    // começa do zero a cada quadro
    for (const g of [this.bodyPivot, this.headPivot, this.armL, this.armR, this.legL, this.legR, this.earL, this.earR])
      g.userData.base ??= { p: g.position.clone(), r: g.rotation.clone(), s: g.scale.clone() };
    const reset = (g: THREE.Object3D) => {
      const b = g.userData.base;
      g.position.copy(b.p);
      g.rotation.copy(b.r);
      g.scale.copy(b.s);
    };
    [this.bodyPivot, this.headPivot, this.armL, this.armR, this.legL, this.legR, this.earL, this.earR].forEach(reset);
    const turn = a === 'andar' ? 0.95 : this.turn;
    this.root.rotation.set(0, turn, 0);
    this.root.position.set(0, 0, 0);
    this.backpack.visible = a === 'andar';
    // os enfeites desenhados ficam virados para a câmera (como adesivos bem colados)
    this.headDeco.rotation.y = -turn * 0.75;
    this.bodyDeco.rotation.y = -turn * 0.6;

    const breathe = Math.sin(t * 2.2);
    this.bodyPivot.scale.set(1 - breathe * 0.008, 1 + breathe * 0.014, 1 - breathe * 0.008);
    this.headPivot.rotation.z = Math.sin(t * 0.9) * 0.03;
    this.headPivot.rotation.x = Math.sin(t * 0.7) * 0.02;
    // orelhinhas mexem de vez em quando
    const twitch = Math.max(0, Math.sin(t * 1.3) - 0.92) * 4;
    this.earL.rotation.z += twitch * 0.25;
    this.earR.rotation.z -= Math.max(0, Math.sin(t * 1.3 + 2) - 0.92) * 1;
    this.armL.rotation.z = -0.12 + Math.sin(t * 1.6) * 0.04;
    this.armR.rotation.z = 0.12 - Math.sin(t * 1.6 + 1) * 0.04;

    if (a === 'tchau') {
      this.armR.rotation.z = 2.3 + Math.sin(lt * 9) * 0.35;
      this.headPivot.rotation.z = -0.08;
    } else if (a === 'festa') {
      const k = Math.min(1, lt / 0.2);
      const hop = Math.max(0, Math.sin(lt * 9)) * 0.18 * Math.exp(-lt * 1.6);
      this.bodyPivot.position.y += hop;
      this.legL.position.y += hop;
      this.legR.position.y += hop;
      this.bodyPivot.scale.y *= 1 - 0.06 * Math.cos(lt * 18) * Math.exp(-lt * 3) * k;
      this.armL.rotation.z = -0.6 - Math.abs(Math.sin(lt * 14)) * 0.7;
      this.armR.rotation.z = 0.6 + Math.abs(Math.sin(lt * 14)) * 0.7;
      this.headPivot.rotation.z = Math.sin(lt * 7) * 0.1;
    } else if (a === 'andar') {
      const w = t * 7.5;
      this.legL.rotation.x = Math.sin(w) * 0.55;
      this.legR.rotation.x = -Math.sin(w) * 0.55;
      this.legL.position.y += Math.max(0, -Math.cos(w)) * 0.06;
      this.legR.position.y += Math.max(0, Math.cos(w)) * 0.06;
      const bob = Math.abs(Math.sin(w)) * 0.07;
      this.bodyPivot.position.y += bob;
      this.bodyPivot.rotation.z = Math.sin(w) * 0.05;
      this.armL.rotation.x = -Math.sin(w) * 0.6;
      this.armR.rotation.x = Math.sin(w) * 0.6;
      this.headPivot.rotation.z = Math.sin(w) * 0.04;
      this.earL.rotation.z -= Math.abs(Math.sin(w)) * 0.12;
      this.earR.rotation.z += Math.abs(Math.sin(w)) * 0.12;
    } else if (a === 'dormir') {
      // dormindo enroladinho como um pãozinho: corpo baixinho e largo, cabeça apoiada para a frente,
      // patinhas embaixo do queixo e os pezinhos escondidos; respira devagar
      const sb = Math.sin(t * 1.4);
      this.root.rotation.y = -0.6;
      const sx = 1.14 - sb * 0.008;
      const sy = 0.74 + sb * 0.02;
      const sz = 1.18;
      this.bodyPivot.scale.set(sx, sy, sz);
      this.headPivot.scale.set(1 / sx, 1 / sy, 1 / sz);
      this.headPivot.position.set(0, 1.12, 0.22);
      this.headPivot.rotation.x = 0.2;
      this.headPivot.rotation.z = 0.12;
      this.armL.rotation.set(-1.15, 0, -0.1);
      this.armR.rotation.set(-1.15, 0, 0.1);
      this.legL.position.set(-0.42, 0.3, -0.1);
      this.legR.position.set(0.42, 0.3, -0.1);
      this.legL.rotation.x = -0.4;
      this.legR.rotation.x = -0.4;
    }

    // piscar
    if (this.eyesOpen.visible && a !== 'dormir') {
      if (t > this.blinkAt + 0.14) this.blinkAt = t + 2.5 + ((t * 7.3) % 2.5);
      const closing = t > this.blinkAt && t < this.blinkAt + 0.14;
      this.eyesOpen.scale.y = closing ? 0.15 : 1;
    } else this.eyesOpen.scale.y = 1;
  }
}
