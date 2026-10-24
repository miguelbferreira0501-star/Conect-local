/** Cliente HTTP da API. Toda regra de negócio fica no servidor; aqui só transporte e erros. */
import type { ApiErrorBody } from '@conecta/shared';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

/** Na prévia sem servidor (VITE_PREVIEW=1), as chamadas são respondidas no próprio navegador. */
const IS_PREVIEW = import.meta.env.VITE_PREVIEW === '1';

async function previewRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { handle, MockError } = await import('../preview/mockServer');
  await new Promise((r) => setTimeout(r, 120)); // simula a latência de rede
  try {
    return (await handle(method, path, body === undefined ? undefined : JSON.parse(JSON.stringify(body)))) as T;
  } catch (e) {
    if (e instanceof MockError) throw new ApiError(e.status, e.code, e.message, e.fields);
    throw e;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (IS_PREVIEW) return previewRequest<T>(method, path, body);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'conecta',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network', 'Sem conexão com a internet. Verifique sua rede e tente novamente.');
  }
  if (!res.ok) {
    let data: ApiErrorBody | null = null;
    try {
      data = await res.json();
    } catch {
      /* resposta sem corpo */
    }
    throw new ApiError(res.status, data?.error.code ?? 'error', data?.error.message ?? 'Algo deu errado. Tente novamente.', data?.error.fields);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown = {}) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
};

export function qs(params: Record<string, string | number | boolean | undefined | null | string[] | number[]>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(','));
    } else sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
