// Site do Lumbi (/site): página de apresentação no estilo dos apps de pet de autocuidado (céu azul, morrinhos,
// o cachorrinho, botão da Google Play) e a parte dos Guardiões (quem pode pagar dá Lumbi+ para quem não pode).
// Os valores dos Guardiões vêm do mesmo arquivo que o app e o servidor usam para cobrar.
import { Hono } from 'hono';
import { LEGAL_INFO } from '../../../web/src/shared/legal';
import { SEAT_CENTS, TIERS, brl } from '../../../web/src/shared/guardian';
import { esc } from './legal';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.hamicare.app';

/** Morrinhos com sol e flores (SVG próprio, sem imagens externas). */
const hills = `<svg class="hills" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs><radialGradient id="sun"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".55" stop-color="#FFD27A" stop-opacity=".7"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient></defs>
  <circle cx="600" cy="210" r="210" fill="url(#sun)"/>
  <circle cx="600" cy="220" r="110" fill="#F7C46A"/>
  <path d="M0 230 Q200 150 420 210 Q600 260 780 190 Q980 120 1200 200 V360 H0Z" fill="#8FD18A"/>
  <path d="M0 270 Q260 210 520 250 Q760 290 1000 236 Q1110 214 1200 240 V360 H0Z" fill="#6FBF6E"/>
  <path d="M0 300 Q300 270 600 292 Q900 314 1200 284 V360 H0Z" fill="#5AAE60"/>
  ${[
    [80, 300, '#FF8FB8'], [180, 318, '#FFFFFF'], [320, 296, '#FFD34D'], [880, 306, '#FF8FB8'], [1010, 290, '#FFFFFF'], [1120, 312, '#FFD34D'],
  ]
    .map(
      ([x, y, c]) =>
        `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos((a * Math.PI) / 180) * 7).toFixed(1)}" cy="${(Math.sin((a * Math.PI) / 180) * 7).toFixed(1)}" r="5.5" fill="${c}"/>`).join('')}<circle r="4" fill="#FFB347"/></g>`,
    )
    .join('')}
</svg>`;

const playButton = (label = 'Baixar na Google Play') => `<a class="play" href="${PLAY_URL}" rel="noopener">
  <svg viewBox="0 0 40 44" width="30" height="33" aria-hidden="true"><path d="M3 2 L24 22 L3 42 Q1 41 1 38 V6 Q1 3 3 2Z" fill="#34D399"/><path d="M3 2 L30 17 L24 22Z" fill="#60A5FA"/><path d="M3 42 L30 27 L24 22Z" fill="#F87171"/><path d="M30 17 L38 21.5 Q40 22.6 38 23.8 L30 27 L24 22Z" fill="#FBBF24"/></svg>
  <span><small>Disponível na</small>Google Play</span>
</a>`;

function tierCard(id: 'aliado' | 'protetor' | 'heroi', color: string, ring: string, img: string) {
  const t = TIERS[id];
  const price = t.seats ? brl(t.seats * SEAT_CENTS.mes) : 'Você escolhe';
  const who = t.seats ? `${t.seats} ${t.seats === 1 ? 'PESSOA' : 'PESSOAS'}` : 'QUANTAS QUISER';
  const perks = id === 'aliado'
    ? ['1 mês de Lumbi+ para alguém que não pode pagar', 'Seu nome no mural dos Guardiões', 'Sementes de agradecimento no app']
    : id === 'protetor'
      ? ['1 mês de Lumbi+ para 3 pessoas', 'Seu nome em destaque no mural', 'Mais sementes de agradecimento']
      : ['Você define o valor', 'Cada R$ 9,90 vira 1 mês de Lumbi+ para alguém', 'Mural com selo de Super-herói'];
  return `<article class="tier">
    <div class="tier-pic" style="--ring:${ring}"><img src="/site/${img}.webp" alt="" loading="lazy"></div>
    <div class="tier-card">
      <p class="tier-top">Presenteie</p>
      <p class="tier-who" style="color:${color}">${who}</p>
      <p class="tier-sub">com 1 mês de Lumbi+</p>
      <hr>
      <p class="tier-price">${esc(price)}${t.seats ? '<span> uma vez</span>' : ''}</p>
      <a class="tier-btn" style="--c:${color}" href="/#guardiao">Ser ${esc(t.name)}</a>
      <ul>${perks.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    </div>
  </article>`;
}

export function siteHtml(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lumbi: seu novo melhor amigo de autocuidado</title>
<meta name="description" content="Cuide de você com o Lumbi, um cachorrinho que cresce junto com cada pequeno cuidado: hábitos, calma e gentileza.">
<meta property="og:title" content="Lumbi: Self-Care">
<meta property="og:description" content="Cuide de você, ele cresce junto.">
<meta property="og:image" content="/hami-icon-512.png">
<link rel="icon" href="/hami-icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; font-family: Nunito, system-ui, sans-serif; color: #2b3240; background: #4FAA67; }
  a { color: inherit; }
  .brand { position: absolute; left: 20px; top: 18px; display: flex; align-items: center; gap: 10px; text-decoration: none; z-index: 3; }
  .brand img { width: 52px; height: 52px; border-radius: 50%; border: 4px solid #fff; box-shadow: 0 3px 0 rgba(0,0,0,.12); background: #FDE0AD; }
  .brand b { font-family: 'Baloo 2', sans-serif; font-size: 32px; font-weight: 800; color: #fff; -webkit-text-stroke: 2px #3F5A6E; paint-order: stroke fill; text-shadow: 0 3px 0 #3F5A6E; }
  .hero { position: relative; min-height: 100vh; min-height: 100svh; padding: 120px 20px 0; text-align: center; overflow: hidden; background: linear-gradient(180deg, #7CC2F2 0%, #A9D8F5 45%, #DDEFF2 75%, #F6E7C6 100%); }
  .hero h1 { position: relative; z-index: 2; margin: 40px auto 0; max-width: 760px; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: clamp(40px, 9vw, 72px); line-height: 1.02; color: #fff; -webkit-text-stroke: 6px #43617A; paint-order: stroke fill; text-shadow: 0 6px 0 #43617A; letter-spacing: -0.5px; }
  .hero .lead { position: relative; z-index: 2; margin: 18px auto 0; max-width: 520px; font-size: 19px; font-weight: 800; color: #2f4b5f; }
  .play { position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 14px; margin-top: 28px; padding: 12px 26px 12px 18px; border-radius: 16px; background: #111; color: #fff; text-decoration: none; border: 2px solid #9aa0a6; box-shadow: 0 6px 0 rgba(0,0,0,.18); transition: transform .12s; }
  .play:active { transform: translateY(3px); }
  .play span { display: grid; text-align: left; font-size: 30px; font-weight: 700; line-height: 1; letter-spacing: -0.5px; }
  .play small { font-size: 13px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
  .chips { position: relative; z-index: 2; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 22px; }
  .chips span { padding: 7px 14px; border-radius: 999px; background: rgba(255,255,255,.75); font-weight: 800; font-size: 14px; color: #33536a; }
  .hills { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 46vh; }
  .pets { position: absolute; left: 0; right: 0; bottom: 4vh; display: flex; justify-content: center; align-items: flex-end; gap: 0; z-index: 2; pointer-events: none; }
  .pets img { width: min(30vw, 230px); height: auto; filter: drop-shadow(0 8px 0 rgba(0,0,0,.08)); }
  .pets img:nth-child(1) { transform: rotate(-6deg) translateY(10px); }
  .pets img:nth-child(2) { width: min(38vw, 300px); z-index: 1; animation: bob 2.6s ease-in-out infinite; }
  .pets img:nth-child(3) { transform: rotate(6deg) translateY(14px); }
  @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  section { padding: 64px 20px; }
  .how { background: #F6E7C6; }
  .wrap { max-width: 1040px; margin: 0 auto; }
  h2 { margin: 0 0 8px; text-align: center; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: clamp(32px, 6vw, 48px); line-height: 1.05; color: #fff; -webkit-text-stroke: 5px #43617A; paint-order: stroke fill; text-shadow: 0 5px 0 #43617A; }
  .sub { margin: 0 auto 28px; max-width: 560px; text-align: center; font-size: 18px; font-weight: 800; color: #4a5866; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
  .feat { padding: 18px; border-radius: 28px; background: #fff; text-align: center; box-shadow: 0 6px 0 rgba(0,0,0,.08); }
  .feat img { width: 140px; height: auto; }
  .feat b { display: block; margin-top: 6px; font-family: 'Baloo 2', sans-serif; font-size: 23px; font-weight: 800; }
  .feat p { margin: 4px 0 0; font-weight: 700; color: #5b6573; }
  .sign-wrap { position: relative; padding-top: 110px; background: linear-gradient(180deg, #F6E7C6 0, #F6E7C6 110px, #4FAA67 110px); }
  .sign-pet { position: absolute; left: 50%; top: 0; width: 210px; transform: translateX(-50%); z-index: 1; }
  .sign { position: relative; z-index: 2; max-width: 620px; margin: 0 auto; padding: 26px 20px 30px; border-radius: 18px; background: #D2AF82; text-align: center; box-shadow: 0 8px 0 #A47B4C; }
  .sign h3 { margin: 0 0 14px; font-family: 'Baloo 2', sans-serif; font-size: clamp(28px, 6vw, 40px); font-weight: 800; color: #6B4A2B; line-height: 1.05; }
  .sign a { display: inline-block; padding: 14px 40px; border-radius: 999px; background: #fff; color: #B07A3E; font-weight: 800; font-size: 20px; text-decoration: none; box-shadow: 0 5px 0 #E0D2BF; }
  .guard { background: #4FAA67; padding-top: 40px; }
  .guard h2 { -webkit-text-stroke-color: #2E6B45; text-shadow: 0 5px 0 #2E6B45; }
  .guard .sub { color: #EAF8EE; }
  .tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 26px; margin-top: 10px; }
  .tier { display: grid; justify-items: center; }
  .tier-pic { width: 200px; height: 200px; margin-bottom: -60px; border-radius: 50%; background: radial-gradient(circle, #fff 0%, var(--ring) 75%); display: grid; place-items: end center; overflow: hidden; }
  .tier-pic img { width: 150px; height: auto; margin-bottom: 4px; }
  .tier-card { position: relative; width: 100%; padding: 22px 22px 18px; border-radius: 30px; background: #fff; text-align: center; box-shadow: 0 8px 0 rgba(0,0,0,.1); }
  .tier-top, .tier-sub { margin: 0; font-size: 18px; font-weight: 700; color: #5b6573; }
  .tier-who { margin: 2px 0; font-family: 'Baloo 2', sans-serif; font-size: 34px; font-weight: 800; font-style: italic; }
  .tier-card hr { width: 60%; margin: 14px auto; border: 0; border-top: 2px solid #E3E6EC; }
  .tier-price { margin: 0 0 14px; font-family: 'Baloo 2', sans-serif; font-size: 34px; font-weight: 800; font-style: italic; color: #5b6573; }
  .tier-price span { font-size: 20px; font-style: normal; color: #98a0ab; }
  .tier-btn { display: block; padding: 15px; border-radius: 16px; background: var(--c); color: #fff; font-size: 22px; font-weight: 800; text-decoration: none; box-shadow: 0 5px 0 rgba(0,0,0,.18); }
  .tier-card ul { margin: 16px -22px -18px; padding: 16px 26px 18px 42px; border-radius: 0 0 30px 30px; background: #F5F6F8; text-align: left; font-weight: 700; color: #4a5462; }
  .tier-card li { margin: 4px 0; }
  .note { margin: 26px auto 0; max-width: 640px; text-align: center; color: #EAF8EE; font-weight: 700; }
  .cta { background: #F6E7C6; text-align: center; }
  footer { padding: 36px 20px 48px; background: #3F8F55; color: #fff; text-align: center; font-weight: 800; }
  footer nav { display: grid; gap: 14px; margin-bottom: 18px; font-size: 20px; }
  footer a { text-decoration: none; }
  footer p { margin: 0; opacity: .85; }
  @media (prefers-reduced-motion: reduce) { .pets img:nth-child(2) { animation: none; } html { scroll-behavior: auto; } }
</style>
</head>
<body>
<header>
  <a class="brand" href="/site"><img src="/hami-icon-192.png" alt=""><b>Lumbi</b></a>
</header>
<main>
  <div class="hero">
    <h1>Seu novo melhor amigo de autocuidado.</h1>
    <p class="lead">Um cachorrinho que cresce junto com cada pequeno cuidado seu: beber água, respirar, descansar e ser gentil com você.</p>
    ${playButton()}
    <div class="chips"><span>Grátis para começar</span><span>Sem anúncios</span><span>Feito no Brasil</span></div>
    ${hills}
    <div class="pets" aria-hidden="true"><img src="/site/dog-calm.webp" alt=""><img src="/site/dog-wave.webp" alt=""><img src="/site/dog-love.webp" alt=""></div>
  </div>

  <section class="how">
    <div class="wrap">
      <h2>Como o Lumbi ajuda</h2>
      <p class="sub">Pequenas missões do seu jeito. Cada uma que você cumpre vira energia para o Lumbi sair em aventuras.</p>
      <div class="grid">
        <div class="feat"><img src="/site/st-rotina.webp" alt=""><b>Rotina leve</b><p>Missões curtas de autocuidado, sem cobrança.</p></div>
        <div class="feat"><img src="/site/st-sono.webp" alt=""><b>Calma</b><p>Respiração, pausas e um cantinho para dias difíceis.</p></div>
        <div class="feat"><img src="/site/st-amor.webp" alt=""><b>Gentileza</b><p>Amigos, presentes e um feed só de coisas boas.</p></div>
        <div class="feat"><img src="/site/st-treino.webp" alt=""><b>Aventuras</b><p>Casinhas, roupinhas e lugares novos para explorar.</p></div>
      </div>
    </div>
  </section>

  <div class="sign-wrap">
    <img class="sign-pet" src="/site/dog-happy.webp" alt="">
    <div class="sign">
      <h3>Seja um Guardião do Lumbi!</h3>
      <a href="#guardioes">Saiba mais</a>
    </div>
  </div>

  <section class="guard" id="guardioes">
    <div class="wrap">
      <h2>Seja um Guardião</h2>
      <p class="sub">Presenteie com Lumbi+ quem não pode pagar agora. Cada contribuição vira meses de Lumbi+ para pessoas da fila de pedidos.</p>
      <div class="tiers">
        ${tierCard('aliado', '#3B8FE0', '#9BCBFA', 'dog-calm')}
        ${tierCard('protetor', '#F0962E', '#FFD38A', 'dog-love')}
        ${tierCard('heroi', '#9B3DB8', '#D7A6F0', 'dog-happy')}
      </div>
      <p class="note">O pagamento é único, pelo Mercado Pago (Pix ou cartão), e não renova sozinho. Ser Guardião fica no site do Lumbi; no app você pode pedir um Lumbi+ de presente.</p>
    </div>
  </section>

  <section class="cta">
    <div class="wrap">
      <h2>Bora começar?</h2>
      <p class="sub">O Lumbi está esperando você.</p>
      ${playButton()}
    </div>
  </section>
</main>
<footer>
  <nav>
    <a href="#guardioes">Guardiões</a>
    <a href="/privacidade">Privacidade</a>
    <a href="/termos">Termos de uso</a>
    <a href="/excluir-conta">Excluir conta</a>
    <a href="mailto:${esc(LEGAL_INFO.email)}">Contato</a>
  </nav>
  <p>© ${new Date().getFullYear()} Lumbi</p>
</footer>
</body>
</html>`;
}

export const site = new Hono();
site.get('/site', (c) => {
  c.header('cache-control', 'public, max-age=600');
  return c.html(siteHtml());
});
