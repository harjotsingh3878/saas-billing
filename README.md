# Multi-Tenant SaaS Subscription Billing Platform

A production-grade subscription billing platform built with GraphQL Federation and Event-Driven Architecture.

## 🏗️ Architecture

- **Frontend**: Next.js with Apollo Client (SSR)
- **API Gateway**: Apollo Gateway (GraphQL Federation)
- **Microservices**: 5 independent GraphQL subgraphs
- **Messaging**: EventBridge (AWS) / Kafka (local)
- **Storage**: DynamoDB, S3
- **Auth**: AWS Cognito (JWT)
- **Infrastructure**: AWS Lambda + CDK

## 📦 Monorepo Structure

```
saas-billing/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── gateway/                # Apollo Gateway
│   ├── tenant-service/         # Tenant management
│   ├── subscription-service/   # Plans & subscriptions
│   ├── usage-service/          # Feature usage tracking
│   ├── billing-service/        # Invoice generation
│   └── notification-service/   # Email notifications
├── packages/
│   ├── shared-types/           # Common TypeScript types
│   ├── auth/                   # JWT/Cognito utilities
│   └── events/                 # Event bus wrapper
├── infra/
│   └── aws-cdk/               # Infrastructure as code
└── docker-compose.yml          # Local development
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- AWS CLI (for deployment)
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
npm install

# Start local infrastructure (Kafka, DynamoDB, LocalStack)
npm run docker:up

# Start all microservices
npm run services:dev

# In another terminal, start the frontend
npm run web:dev
```

### Access Points

- Frontend: http://localhost:3000
- GraphQL Gateway: http://localhost:4000/graphql
- Tenant Service: http://localhost:4001
- Subscription Service: http://localhost:4002
- Usage Service: http://localhost:4003
- Billing Service: http://localhost:4004

## 🧱 Services Overview

### 1. Tenant Service
- Manages organizations/tenants
- User-to-tenant mapping
- Plan metadata
- **Events**: `tenant.created`, `tenant.updated`

### 2. Subscription Service
- Plan management (Basic, Pro, Enterprise)
- Subscription lifecycle
- Trial logic & seat limits
- **Events**: `subscription.created`, `subscription.canceled`

### 3. Usage Service
- Feature usage tracking
- Metering & limits enforcement
- **Events**: `usage.reported`, `usage.exceeded`

### 4. Billing Service
- Charge calculation
- Invoice generation (PDF to S3)
- Payment status tracking
- **Events**: `invoice.generated`, `payment.failed`

### 5. Notification Service
- Email notifications (SES)
- Triggered by billing & usage events
- **Consumes**: `invoice.generated`, `payment.failed`

## 🔁 Event Flow Example

```
User subscribes to Pro plan
    ↓
Subscription Service publishes: subscription.created
    ↓
Usage Service listens & initializes limits
    ↓
User exceeds usage limit
    ↓
Usage Service publishes: usage.exceeded
    ↓
Billing Service generates invoice: invoice.generated
    ↓
Notification Service sends email
```

## 🔐 Authentication

JWT tokens from AWS Cognito are validated at the Gateway level and propagated to all subgraphs via GraphQL context.

```typescript
context: {
  userId: string;
  tenantId: string;
  role: 'admin' | 'member';
}
```

## 🗄️ Data Storage

| Service        | Storage      | Purpose                  |
|----------------|--------------|--------------------------|
| Tenant         | DynamoDB     | Tenant records           |
| Subscription   | DynamoDB     | Plans & subscriptions    |
| Usage          | DynamoDB     | Usage metrics            |
| Billing        | DynamoDB     | Invoice metadata         |
| Billing        | S3           | PDF invoices             |

## 📊 GraphQL Federation

Each service exposes its own GraphQL schema. The Gateway composes them into a unified API.

```graphql
# Query across services
query GetTenantWithSubscription {
  tenant(id: "123") {
    name
    subscription {  # Resolved by subscription-service
      plan
      status
    }
  }
}
```

## 🧪 Development

```bash
# Run tests
npm test

# Lint
npm run lint

# Build all services
npm run build

# Clean build artifacts
npm run clean
```

## 🚢 Deployment

```bash
# Deploy infrastructure
cd infra/aws-cdk
npm run deploy

# Deploy services (via CDK)
npm run deploy:services

# Deploy frontend (Vercel/AWS Amplify)
cd apps/web
npm run build
```

## 📚 Documentation

- [Architecture Decision Records](./docs/adr/)
- [API Documentation](./docs/api/)
- [Deployment Guide](./docs/deployment.md)
- [Event Schema Registry](./packages/events/schemas/)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, Apollo Client, Tailwind CSS
- **Gateway**: Apollo Gateway, Node.js
- **Services**: Node.js, TypeScript, GraphQL
- **Messaging**: AWS EventBridge, Apache Kafka
- **Storage**: DynamoDB, S3
- **Auth**: AWS Cognito
- **Infrastructure**: AWS Lambda, API Gateway, CDK
- **Monitoring**: CloudWatch, X-Ray

## 📝 License

MIT
