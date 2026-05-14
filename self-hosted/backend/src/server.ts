import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './auth/routes.js';
import { filesRoutes } from './modules/files/routes.js';
import { applicationsRoutes } from './modules/applications/routes.js';

const app = Fastify({ logger: true, trustProxy: true });

await app.register(cors, {
  origin: process.env.FRONTEND_URL?.split(',') ?? true,
  credentials: true,
});
await app.register(cookie);
await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });

app.get('/health', async () => ({ ok: true, ts: Date.now() }));

await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(filesRoutes, { prefix: '/api/files' });
await app.register(applicationsRoutes, { prefix: '/api/applications' });

const port = Number(process.env.PORT ?? 3000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});