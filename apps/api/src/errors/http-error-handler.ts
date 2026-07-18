import type { ApiErrorResponse } from '@mesachef/shared';
import type { FastifyInstance } from 'fastify';

function statusForError(error: unknown): number {
  const statusCode =
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
      ? error.statusCode
      : 500;
  return statusCode >= 400 && statusCode < 500 ? statusCode : 500;
}

function publicErrorForStatus(
  statusCode: number,
  correlationId: string,
): ApiErrorResponse {
  if (statusCode === 404) {
    return {
      error: {
        code: 'ROUTE_NOT_FOUND',
        correlationId,
        message: 'Rota não encontrada.',
      },
    };
  }

  if (statusCode < 500) {
    return {
      error: {
        code: 'INVALID_REQUEST',
        correlationId,
        message: 'A requisição não pôde ser processada.',
      },
    };
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      correlationId,
      message: 'Ocorreu um erro inesperado.',
    },
  };
}

export function registerHttpErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    void reply
      .status(404)
      .send(publicErrorForStatus(404, request.id));
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = statusForError(error);

    request.log.error(
      { err: error, statusCode },
      'Request failed',
    );

    void reply
      .status(statusCode)
      .send(publicErrorForStatus(statusCode, request.id));
  });
}
