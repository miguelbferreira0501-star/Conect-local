/** Chama o assistente de IA do painel e entrega o texto em tempo real (Server-Sent Events via fetch). */
import type { AiTask } from '@conecta/shared';
import { ApiError } from './api';

export async function streamAssistant(
  businessId: string,
  body: { task: AiTask; message?: string; reviewId?: string },
  onText: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`/api/panel/businesses/${businessId}/ai`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'conecta', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError(0, 'network', 'Sem conexão com a internet.');
  }
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data?.error?.code ?? 'error', data?.error?.message ?? 'O assistente está indisponível.');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const event = /^event: (.+)$/m.exec(chunk)?.[1];
      const data = /^data: (.+)$/m.exec(chunk)?.[1];
      if (!event || !data) continue;
      const parsed = JSON.parse(data);
      if (event === 'text') onText(parsed);
      else if (event === 'error') throw new ApiError(400, parsed.code, parsed.message);
    }
  }
}
