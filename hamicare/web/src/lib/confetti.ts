// Confete que explode em cima do botão (ao concluir uma missão, como no Finch e nos jogos).
// Pedacinhos coloridos saem do botão, sobem um pouco e caem girando. Respeita "reduzir movimento".
import { prefersReducedMotion } from './util';

const COLORS = ['#FF6F91', '#FFD34D', '#7BD389', '#6AAEF5', '#A98BF2', '#FF9F4D'];

export function burstConfetti(el: HTMLElement | null, pieces = 26) {
  if (!el || typeof document === 'undefined' || prefersReducedMotion()) return;
  const r = el.getBoundingClientRect();
  const box = document.createElement('div');
  box.className = 'burst';
  box.setAttribute('aria-hidden', 'true');
  box.style.left = `${r.left + r.width / 2}px`;
  box.style.top = `${r.top + r.height / 2}px`;
  for (let i = 0; i < pieces; i++) {
    const p = document.createElement('span');
    const a = (Math.PI * 2 * i) / pieces + (Math.random() - 0.5) * 0.5;
    const dist = 50 + Math.random() * 70;
    p.className = `burst-piece ${i % 3 === 0 ? 'is-round' : ''}`;
    p.style.background = COLORS[i % COLORS.length];
    p.style.setProperty('--dx', `${Math.cos(a) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(a) * dist - 40}px`);
    p.style.setProperty('--r', `${Math.round(Math.random() * 720 - 360)}deg`);
    p.style.animationDelay = `${Math.random() * 60}ms`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  window.setTimeout(() => box.remove(), 1500);
}
