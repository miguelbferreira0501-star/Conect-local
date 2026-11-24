// O palco do Hami 3D: luz de estúdio macia (luz principal de cima, luz de preenchimento, contraluz e um ambiente
// suave para o brilho dos olhinhos) e uma câmera de retrato. Um único renderizador WebGL é dividido entre todos os
// Hamis da tela: cada um é desenhado nele e copiado para o seu próprio quadrinho.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HamiRig, type Hami3DLook } from './rig';

let renderer: THREE.WebGLRenderer | null = null;
let envTex: THREE.Texture | null = null;
const MAX = 768;

/** O renderizador compartilhado (criado na primeira vez). null se o aparelho não tiver WebGL. */
export function sharedRenderer(): THREE.WebGLRenderer | null {
  if (renderer) return renderer;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = MAX;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    renderer.setSize(MAX, MAX, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    const pm = new THREE.PMREMGenerator(renderer);
    envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return renderer;
  } catch {
    renderer = null;
    return null;
  }
}

export const MAX_SIZE = MAX;

/** Uma cena com um Hami dentro, pronta para desenhar. */
export class HamiScene {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
  rig: HamiRig;

  constructor(look: Hami3DLook) {
    sharedRenderer();
    if (envTex) this.scene.environment = envTex;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xe8d6cc, 0.9));
    const key = new THREE.DirectionalLight(0xfff4ea, 2.0);
    key.position.set(-3, 5, 4);
    const fill = new THREE.DirectionalLight(0xe6eeff, 0.6);
    fill.position.set(4, 2, 3);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(1, 3, -4);
    this.scene.add(key, fill, rim);
    this.rig = new HamiRig(look);
    this.scene.add(this.rig.root);
    this.frame(1);
  }

  /** Enquadra o Hami inteiro (de pé, ou deitado quando está dormindo). */
  frame(aspect: number, lying = false) {
    this.camera.aspect = aspect;
    const target = new THREE.Vector3(0, lying ? 0.85 : 1.15, 0);
    const dist = lying ? 10 : 11.2;
    this.camera.position.set(0, target.y + 1.4, dist);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
  }

  /** Desenha no renderizador compartilhado (w×h em pixels) e devolve o canvas dele. */
  draw(w: number, h: number, t: number) {
    const r = sharedRenderer();
    if (!r) return null;
    this.rig.update(t);
    const ww = Math.min(MAX, Math.round(w));
    const hh = Math.min(MAX, Math.round(h));
    r.setViewport(0, MAX - hh, ww, hh);
    r.setScissor(0, MAX - hh, ww, hh);
    r.setScissorTest(true);
    r.clear();
    r.render(this.scene, this.camera);
    return { canvas: r.domElement, sx: 0, sy: 0, sw: ww, sh: hh };
  }
}
