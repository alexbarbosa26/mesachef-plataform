import type { DatabaseHealthProbe } from '@mesachef/database';
import type {
  LiveHealthResponse,
  ReadyHealthResponse,
} from '@mesachef/shared';
import type { FastifyInstance } from 'fastify';

const databaseCheckSchema = {
  additionalProperties: false,
  properties: {
    provider: { enum: ['postgres', 'sqlite'], type: 'string' },
    status: { enum: ['down', 'up'], type: 'string' },
  },
  required: ['provider', 'status'],
  type: 'object',
} as const;

const liveResponseSchema = {
  additionalProperties: false,
  properties: {
    service: { const: 'mesachef-api', type: 'string' },
    status: { const: 'ok', type: 'string' },
    timestamp: { format: 'date-time', type: 'string' },
    version: { type: 'string' },
  },
  required: ['service', 'status', 'timestamp', 'version'],
  type: 'object',
} as const;

const readyResponseSchema = {
  additionalProperties: false,
  properties: {
    checks: {
      additionalProperties: false,
      properties: { database: databaseCheckSchema },
      required: ['database'],
      type: 'object',
    },
    status: { enum: ['not_ready', 'ok'], type: 'string' },
    timestamp: { format: 'date-time', type: 'string' },
  },
  required: ['checks', 'status', 'timestamp'],
  type: 'object',
} as const;

export type HealthRoutesOptions = Readonly<{
  databaseProbe: DatabaseHealthProbe;
  serviceVersion: string;
}>;

export function registerHealthRoutes(
  app: FastifyInstance,
  { databaseProbe, serviceVersion }: HealthRoutesOptions,
): void {
  app.get(
    '/health/live',
    {
      schema: {
        description: 'Confirma que o processo HTTP está ativo.',
        response: { 200: liveResponseSchema },
        tags: ['health'],
      },
    },
    async (): Promise<LiveHealthResponse> => ({
      service: 'mesachef-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: serviceVersion,
    }),
  );

  app.get(
    '/health/ready',
    {
      schema: {
        description: 'Confirma que as dependências configuradas estão prontas.',
        response: {
          200: readyResponseSchema,
          503: readyResponseSchema,
        },
        tags: ['health'],
      },
    },
    async (request, reply): Promise<ReadyHealthResponse> => {
      const databaseCheck = await databaseProbe.check();
      const timestamp = new Date().toISOString();

      if (databaseCheck.status === 'down') {
        request.log.error(
          { dependency: 'database', err: databaseCheck.error },
          'Readiness dependency is unavailable',
        );

        return reply.status(503).send({
          checks: {
            database: {
              provider: databaseProbe.provider,
              status: 'down',
            },
          },
          status: 'not_ready',
          timestamp,
        });
      }

      return {
        checks: {
          database: {
            provider: databaseProbe.provider,
            status: 'up',
          },
        },
        status: 'ok',
        timestamp,
      };
    },
  );
}
