import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { BillingRepository } from './repository';
import { createKafkaEventBus, createEventBridgePublisher } from '@saas-billing/events';

dotenv.config();

const PORT = process.env.PORT || 4004;
const USE_KAFKA = process.env.USE_KAFKA === 'true';

const eventPublisher = USE_KAFKA
  ? createKafkaEventBus(
      process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      'billing-service'
    ).createPublisher()
  : createEventBridgePublisher(
      process.env.EVENTBRIDGE_BUS_NAME || 'saas-billing-events',
      process.env.AWS_REGION
    );

const repository = new BillingRepository();

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
      context: async ({ req }) => ({
        userId: req.headers['x-user-id'] as string || '',
        tenantId: req.headers['x-tenant-id'] as string || '',
        repository,
        eventPublisher,
      }),
    })
  );

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'billing-service' });
  });

  app.listen(PORT, () => {
    console.log(`💰 Billing Service ready at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start billing service:', error);
  process.exit(1);
});
