// Envio de e-mail pelo Resend (https://resend.com). Sem RESEND_API_KEY nada sai:
// em teste o e-mail fica na caixa `outbox`; no computador, aparece no terminal.
import { env } from '../env';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const outbox: Mail[] = [];
let queue: Promise<unknown> = Promise.resolve();

export async function sendMail(m: Mail): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === 'production') {
      console.error(`E-mail não enviado (falta RESEND_API_KEY): ${m.subject}`);
      return false;
    }
    outbox.push(m);
    if (env.NODE_ENV === 'development') console.log(`\n✉️  Para ${m.to}: ${m.subject}\n${m.text}\n`);
    return true;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [m.to], subject: m.subject, text: m.text, html: m.html }),
    });
    if (!res.ok) console.error(`Falha ao enviar e-mail (${res.status}): ${(await res.text().catch(() => '')).slice(0, 300)}`);
    return res.ok;
  } catch (e) {
    console.error('Falha ao enviar e-mail:', (e as Error).message);
    return false;
  }
}

/** Envia sem fazer a requisição esperar: a resposta leva o mesmo tempo exista a conta ou não. */
export function sendLater(m: Mail) {
  queue = queue.then(() => sendMail(m)).catch(() => {});
}

/** Para os testes: espera os e-mails da fila saírem. */
export const mailIdle = () => queue;

const esc = (t: string) => t.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

export function resetMail(to: string, name: string, link: string, minutes: number): Mail {
  const first = name.split(' ')[0] || 'Oi';
  const text = [
    `${first}, recebemos um pedido para trocar a senha da sua conta no HamiCare.`,
    '',
    `Para criar uma senha nova, abra este link (ele vale por ${minutes} minutos e funciona uma vez só):`,
    link,
    '',
    'Se não foi você, é só ignorar este e-mail: sua senha continua a mesma.',
    '',
    'Com carinho,',
    'Hami 🐹',
  ].join('\n');
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#E9F6F1;font-family:Arial,Helvetica,sans-serif;color:#24323A">
<div style="max-width:480px;margin:0 auto;padding:28px 18px">
  <div style="background:#ffffff;border-radius:24px;padding:26px 22px;border:2px solid #CBE9DF">
    <p style="font-size:34px;margin:0 0 6px">🐹</p>
    <h1 style="font-size:22px;margin:0 0 12px">Trocar a senha do HamiCare</h1>
    <p style="font-size:16px;line-height:1.5;margin:0 0 18px">${esc(first)}, recebemos um pedido para trocar a senha da sua conta. Toque no botão para criar uma senha nova.</p>
    <p style="margin:0 0 18px"><a href="${esc(link)}" style="display:inline-block;background:#2F9E83;color:#ffffff;text-decoration:none;font-weight:bold;font-size:17px;padding:14px 22px;border-radius:16px;border-bottom:4px solid #1F7461">Criar senha nova</a></p>
    <p style="font-size:14px;line-height:1.5;color:#55656E;margin:0 0 10px">O link vale por ${minutes} minutos e funciona uma vez só. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>
    <p style="font-size:12px;line-height:1.5;color:#7A8A92;margin:0;word-break:break-all">Se o botão não abrir, copie este endereço: ${esc(link)}</p>
  </div>
</div></body></html>`;
  return { to, subject: 'Trocar a senha do HamiCare', text, html };
}
