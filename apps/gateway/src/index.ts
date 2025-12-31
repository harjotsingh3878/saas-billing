import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { AuthService, createAuthContext } from '@saas-billing/auth';
import { AuthContext } from '@saas-billing/shared-types';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Subgraph endpoints
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:4001/graphql';
const SUBSCRIPTION_SERVICE_URL =
  process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:4002/graphql';
const USAGE_SERVICE_URL = process.env.USAGE_SERVICE_URL || 'http://localhost:4003/graphql';
const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:4004/graphql';

// Auth configuration
const authService = new AuthService(
  process.env.COGNITO_USER_POOL_ID || 'us-east-1_example',
  process.env.COGNITO_CLIENT_ID || 'example-client-id',
  process.env.COGNITO_REGION || 'us-east-1'
);

interface GatewayContext {
  auth: AuthContext | null;
}

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: any) {
    // Propagate auth context to subgraphs
    if (context.auth) {
      request.http.headers.set('x-user-id', context.auth.userId);
      request.http.headers.set('x-tenant-id', context.auth.tenantId);
      request.http.headers.set('x-user-role', context.auth.role);
      request.http.headers.set('x-user-email', context.auth.email);
    }
  }
}

async function startServer() {
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        { name: 'tenant', url: TENANT_SERVICE_URL },
        { name: 'subscription', url: SUBSCRIPTION_SERVICE_URL },
        { name: 'usage', url: USAGE_SERVICE_URL },
        { name: 'billing', url: BILLING_SERVICE_URL },
      ],
    }),
    buildService({ url }) {
      return new AuthenticatedDataSource({ url });
    },
  });

  const server = new ApolloServer<GatewayContext>({
    gateway,
    introspection: true,
  });

  await server.start();

  const app = express();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<GatewayContext> => {
        const authHeader = req.headers.authorization;
        const auth = await createAuthContext(authHeader, authService);

        return { auth };
      },
    })
  );

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Gateway ready at http://localhost:${PORT}/graphql`);
    console.log(`📊 Subgraphs:`);
    console.log(`   - Tenant: ${TENANT_SERVICE_URL}`);
    console.log(`   - Subscription: ${SUBSCRIPTION_SERVICE_URL}`);
    console.log(`   - Usage: ${USAGE_SERVICE_URL}`);
    console.log(`   - Billing: ${BILLING_SERVICE_URL}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start gateway:', error);
  process.exit(1);
});
