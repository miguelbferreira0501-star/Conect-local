import type { ZodError, ZodTypeAny, infer as Infer } from 'zod';

export class AppError extends Error {
  constructor(
    public status: 400 | 401 | 402 | 403 | 404 | 409 | 422 | 429 | 500 | 503,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = (msg = 'Não encontramos o que você procurou.') => new AppError(404, 'not_found', msg);
export const forbidden = (msg = 'Você não tem permissão para fazer isso.') => new AppError(403, 'forbidden', msg);
export const unauthorized = () => new AppError(401, 'unauthorized', 'Entre na sua conta para continuar.');

export function zodFields(err: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

/** Valida dados no servidor; erros viram mensagens por campo, em português. */
export function parse<S extends ZodTypeAny>(schema: S, data: unknown): Infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = zodFields(result.error);
    throw new AppError(422, 'validation_error', Object.values(fields)[0] ?? 'Dados inválidos.', fields);
  }
  return result.data;
}
