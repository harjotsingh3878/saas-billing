# SaaS Billing Platform - Quick Start Guide

This guide will help you get the entire platform running locally in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- Docker Desktop running
- AWS CLI configured (for production deployment)
- 8GB RAM minimum

## Step 1: Install Dependencies

```bash
cd saas-billing
npm install
```

This will install all dependencies for the monorepo including all apps and packages.

## Step 2: Start Local Infrastructure

```bash
# Start Kafka, DynamoDB Local, and LocalStack
npm run docker:up
```

Wait ~30 seconds for all services to be healthy. You can verify with:

```bash
docker ps
```

You should see:
- Kafka
- Zookeeper
- DynamoDB Local
- LocalStack

## Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set:
USE_KAFKA=true
DYNAMODB_ENDPOINT=http://localhost:8000
KAFKA_BROKERS=localhost:9092
```

## Step 4: Build Shared Packages

```bash
# Build shared packages first
npm run build --workspace=packages/shared-types
npm run build --workspace=packages/auth
npm run build --workspace=packages/events
```

## Step 5: Start Backend Services

Open 5 terminal windows and run:

**Terminal 1 - Gateway:**
```bash
cd apps/gateway
npm install
npm run dev
```

**Terminal 2 - Tenant Service:**
```bash
cd apps/tenant-service
npm install
npm run dev
```

**Terminal 3 - Subscription Service:**
```bash
cd apps/subscription-service
npm install
npm run dev
```

**Terminal 4 - Usage Service:**
```bash
cd apps/usage-service
npm install
npm run dev
```

**Terminal 5 - Billing Service:**
```bash
cd apps/billing-service
npm install
npm run dev
```

**Terminal 6 - Notification Service:**
```bash
cd apps/notification-service
npm install
npm run dev
```

Or use the convenience script:
```bash
npm run services:dev
```

## Step 6: Start Frontend

In a new terminal:

```bash
cd apps/web
npm install
npm run dev
```

## Step 7: Verify Everything Works

### Check Services Health

```bash
# Gateway
curl http://localhost:4000/health

# Tenant Service
curl http://localhost:4001/health

# Subscription Service
curl http://localhost:4002/health

# Usage Service
curl http://localhost:4003/health

# Billing Service
curl http://localhost:4004/health
```

### Open GraphQL Playground

Navigate to: http://localhost:4000/graphql

Try this query:

```graphql
query {
  plans {
    id
    name
    price
    features {
      name
      description
    }
  }
}
```

### View the Frontend

Open: http://localhost:3000

You should see:
- Landing page
- Pricing page at `/pricing`
- Login page at `/login`
- Dashboard at `/dashboard`

## Step 8: Test Event Flow

### Create a Tenant

```graphql
mutation {
  createTenant(input: {
    name: "Acme Corp"
    plan: PRO
  }) {
    id
    name
    plan
  }
}
```

### Create a Subscription

```graphql
mutation {
  createSubscription(input: {
    tenantId: "YOUR_TENANT_ID"
    planId: "plan_pro"
    seats: 10
  }) {
    id
    status
    plan {
      name
      price
    }
  }
}
```

### Report Usage

```graphql
mutation {
  reportUsage(input: {
    tenantId: "YOUR_TENANT_ID"
    feature: "apiCalls"
    count: 100
  }) {
    id
    count
    limit
  }
}
```

### Generate Invoice

```graphql
mutation {
  generateInvoice(input: {
    tenantId: "YOUR_TENANT_ID"
    subscriptionId: "YOUR_SUBSCRIPTION_ID"
    lineItems: [
      {
        description: "Pro Plan - Monthly"
        quantity: 1
        unitPrice: 99
      }
    ]
  }) {
    id
    amount
    status
    pdfUrl
  }
}
```

Check the notification service logs - you should see an email notification being sent!

## Common Issues

### Port Already in Use

If ports 4000-4004 are in use, edit each service's `src/index.ts` to change the PORT variable.

### Kafka Connection Failed

Make sure Docker is running:
```bash
docker ps | grep kafka
```

Restart Kafka if needed:
```bash
npm run docker:down
npm run docker:up
```

### Cannot Connect to DynamoDB

Check that DynamoDB Local is running:
```bash
docker ps | grep dynamodb
```

Test connection:
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

### GraphQL Federation Error

Make sure all subgraph services are running before starting the gateway. The gateway needs to introspect their schemas.

## Next Steps

1. **Add Authentication**: Integrate AWS Cognito for real auth
2. **Add Logging**: Set up structured logging with Winston or Pino
3. **Add Monitoring**: Integrate Datadog, New Relic, or CloudWatch
4. **Add Tests**: Write unit and integration tests
5. **Deploy to AWS**: Use the CDK infrastructure in `infra/aws-cdk`

## Shutdown

```bash
# Stop all services (Ctrl+C in each terminal)

# Stop Docker infrastructure
npm run docker:down
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for AWS deployment instructions.
