import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { TenantRepository } from './repository';
import { createKafkaEventBus, createEventBridgePublisher } from '@saas-billing/events';

dotenv.config();

const PORT = process.env.PORT || 4001;
const USE_KAFKA = process.env.USE_KAFKA === 'true';

// Initialize event publisher
const eventPublisher = USE_KAFKA
  ? createKafkaEventBus(
      process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      'tenant-service'
    ).createPublisher()
  : createEventBridgePublisher(
      process.env.EVENTBRIDGE_BUS_NAME || 'saas-billing-events',
      process.env.AWS_REGION
    );

const repository = new TenantRepository();

interface Context {
  userId: string;
  tenantId: string;
  userRole: string;
  repository: TenantRepository;
  eventPublisher: typeof eventPublisher;
}

async function startServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    introspection: true,
  });

  await server.start();

  const app = express();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        // Extract auth context from headers (set by gateway)
        const userId = req.headers['x-user-id'] as string || '';
        const tenantId = req.headers['x-tenant-id'] as string || '';
        const userRole = req.headers['x-user-role'] as string || 'MEMBER';

        return {
          userId,
          tenantId,
          userRole,
          repository,
          eventPublisher,
        };
      },
    })
  );

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'tenant-service', timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    console.log(`🏢 Tenant Service ready at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start tenant service:', error);
  process.exit(1);
});
