import { randomUUID } from 'node:crypto';

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import type { DatabaseHealthProbe } from '@mesachef/database';
import Fastify, { type FastifyInstance } from 'fastify';

import type { ApplicationConfig } from './config/environment.js';
import { registerHttpErrorHandlers } from './errors/http-error-handler.js';
import { registerHealthRoutes } from './health/health-routes.js';

export type BuildApiOptions = Readonly<{
  config: ApplicationConfig;
  databaseProbe: DatabaseHealthProbe;
  logger?: boolean;
  serviceVersion?: string;
}>;

export async function buildApi({
  config,
  databaseProbe,
  logger = true,
  serviceVersion = '0.1.0',
}: BuildApiOptions): Promise<FastifyInstance> {
  const app = Fastify({
    bodyLimit: 1_048_576,
    genReqId: (_request) => randomUUID(),
    logger:
      logger ? {
        level: config.logLevel,
        redact: {
          censor: '[REDACTED]',
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers.set-cookie',
          ],
        },
      } : false,
    trustProxy: false,
  });

  await app.register(helmet);
  await app.register(cors, {
    origin(origin, callback) {
      const isAllowed =
        origin === undefined || config.cors.allowedOrigins.has(origin);
      callback(null, isAllowed);
    },
  });

  if (config.openApiEnabled) {
    await app.register(swagger, {
      openapi: {
        info: {
          description: 'Contratos técnicos iniciais do MesaChef Platform.',
          title: 'MesaChef Platform API',
          version: serviceVersion,
        },
        openapi: '3.1.0',
      },
    });
  }

  app.addHook('onSend', async (request, reply) => {
    void reply.header('x-correlation-id', request.id);
  });

  app.addHook('onClose', async () => {
    await databaseProbe.close();
  });

  registerHttpErrorHandlers(app);
  registerHealthRoutes(app, { databaseProbe, serviceVersion });

  if (config.openApiEnabled) {
    app.get(
      '/documentation/json',
      { schema: { hide: true } },
      async () => app.swagger(),
    );
  }

  return app;
}
