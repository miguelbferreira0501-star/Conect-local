export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}
export const unauthorized = () => new AppError(401, 'nao_autenticado', 'Entre na sua conta para continuar.');
export const forbidden = (msg = 'Você não tem permissão para isso.') => new AppError(403, 'sem_permissao', msg);
export const notFound = (msg = 'Não encontrado.') => new AppError(404, 'nao_encontrado', msg);
export const invalid = (msg: string) => new AppError(422, 'invalido', msg);
