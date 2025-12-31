# Architecture Deep Dive

## System Overview

The SaaS Billing Platform is built as a distributed microservices architecture using GraphQL Federation and event-driven patterns.

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  Next.js App (SSR) + Apollo Client + Cognito Auth          │
└──────────────────────┬──────────────────────────────────────┘
                       │ GraphQL over HTTP
┌──────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY                             │
│              Apollo Gateway (Federation)                     │
│              JWT Verification + Context Propagation          │
└─────┬────────┬────────┬────────┬─────────────────────────────┘
      │        │        │        │
      │        │        │        │  GraphQL Subgraphs
┌─────▼────┐ ┌▼────┐ ┌▼─────┐ ┌▼────────┐
│ Tenant   │ │Sub  │ │Usage │ │Billing  │
│ Service  │ │Svc  │ │Svc   │ │Service  │
└────┬─────┘ └┬────┘ └┬─────┘ └┬────────┘
     │        │       │        │
     └────────┴───────┴────────┘
              │
              │ Publish Events
┌─────────────▼───────────────────────────────────────────────┐
│                   EVENT BUS (Kafka/EventBridge)              │
│  Topics: tenant.*, subscription.*, usage.*, invoice.*        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                   ┌────▼────┐
                   │  Notif  │
                   │ Service │
                   └─────────┘
                        │
                        ▼
                   AWS SES (Email)
```

## Service Communication Patterns

### 1. Synchronous (GraphQL)

**Client → Gateway → Services**

- Client makes GraphQL query
- Gateway routes to appropriate subgraph(s)
- Services resolve their portion of the schema
- Gateway composes the response

**Example:**

```graphql
query {
  tenant(id: "123") {
    name                    # Resolved by tenant-service
    subscription {          # Resolved by subscription-service
      plan {
        name
        price
      }
    }
    invoices {              # Resolved by billing-service
      amount
      status
    }
  }
}
```

The gateway automatically:
1. Queries tenant-service for tenant data
2. Passes tenantId to subscription-service
3. Passes tenantId to billing-service
4. Merges all responses into one

### 2. Asynchronous (Events)

**Service → Event Bus → Consumer(s)**

Services publish domain events when state changes occur:

```typescript
// In subscription-service
const subscription = await repository.create(input);

// Publish event
await eventPublisher.publish({
  eventType: 'subscription.created',
  data: {
    subscriptionId: subscription.id,
    tenantId: subscription.tenantId,
    planId: subscription.planId,
  }
});
```

Multiple consumers can react:
- Usage service initializes limits
- Billing service schedules first invoice
- Notification service sends welcome email

## Data Storage Strategy

### Multi-Tenancy Isolation

Each service uses tenant-scoped queries:

```typescript
// DynamoDB query with tenant isolation
const result = await docClient.query({
  TableName: 'Subscriptions',
  IndexName: 'TenantIdIndex',
  KeyConditionExpression: 'tenantId = :tenantId',
  ExpressionAttributeValues: {
    ':tenantId': context.tenantId  // From auth context
  }
});
```

### Data Consistency

**Within Service (Strong Consistency)**
- Single DynamoDB table per service
- ACID transactions within service boundary

**Cross-Service (Eventual Consistency)**
- Events propagate asynchronously
- Services maintain their own read models
- Idempotency ensures exactly-once processing

### Schema Design

**Tenants Table:**
```
PK: id (tenant-123)
SK: -
Attributes: name, plan, status, createdAt, updatedAt
GSI: ownerId → id (for user-to-tenant lookup)
```

**Subscriptions Table:**
```
PK: id (sub-456)
SK: -
Attributes: tenantId, planId, status, seats, ...
GSI: tenantId → id (for tenant's subscription)
```

**Usage Table:**
```
PK: compositeKey (tenant-123#apiCalls#2024-01)
SK: -
Attributes: id, tenantId, feature, count, limit, period
GSI1: id → compositeKey (lookup by ID)
GSI2: tenantId + period (tenant's usage for period)
```

**Invoices Table:**
```
PK: id (inv-789)
SK: -
Attributes: tenantId, subscriptionId, amount, status, ...
GSI: tenantId → id (tenant's invoices)
```

## Authentication Flow

```
1. User signs up/in with Cognito
2. Cognito returns JWT tokens
3. Client includes JWT in Authorization header
4. Gateway validates JWT using Cognito public keys
5. Gateway extracts claims (userId, tenantId, role)
6. Gateway passes claims to subgraphs via headers
7. Each service validates tenant isolation
```

**Context Propagation:**

```typescript
// Gateway
context: {
  userId: 'user-123',
  tenantId: 'tenant-456',
  role: 'ADMIN'
}

// Propagated as HTTP headers
x-user-id: user-123
x-tenant-id: tenant-456
x-user-role: ADMIN
```

## Event Flow Examples

### Example 1: User Subscribes to Pro Plan

```
1. Client → Gateway → Subscription Service
   mutation { createSubscription(input: { planId: "plan_pro" }) }

2. Subscription Service
   - Creates subscription in DynamoDB
   - Publishes 'subscription.created' event

3. Usage Service (consumes event)
   - Initializes usage limits for tenant
   - Creates usage records for all features

4. Billing Service (consumes event)
   - Generates first invoice
   - Publishes 'invoice.generated' event

5. Notification Service (consumes event)
   - Sends welcome email with invoice details
```

### Example 2: Usage Exceeds Limit

```
1. API calls reportUsage mutation
   mutation { reportUsage(input: { feature: "apiCalls", count: 100 }) }

2. Usage Service
   - Updates usage count
   - Checks if limit exceeded
   - Publishes 'usage.exceeded' event

3. Notification Service
   - Sends warning email to tenant admin

4. (Optional) Billing Service
   - Calculates overage charges
   - Generates additional invoice
```

## Scaling Strategies

### Horizontal Scaling

Each service can scale independently:

```
                    ┌─ Tenant Service Pod 1
                    ├─ Tenant Service Pod 2
Load Balancer ──────├─ Tenant Service Pod 3
                    └─ ...
```

### Database Scaling

- DynamoDB auto-scales read/write capacity
- Use on-demand billing for variable workloads
- Implement caching layer (Redis/ElastiCache) for hot data

### Event Bus Scaling

**Kafka:**
- Add more partitions for parallelism
- Add more consumer instances

**EventBridge:**
- Automatically scales to handle millions of events
- No manual configuration needed

## Error Handling & Resilience

### Retry Logic

```typescript
// Exponential backoff for event publishing
async function publishWithRetry(event: DomainEvent, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await eventPublisher.publish(event);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }
}
```

### Dead Letter Queues

Failed events go to DLQ for manual inspection:

```typescript
try {
  await handleEvent(event);
} catch (error) {
  await sendToDLQ(event, error);
  // Alert ops team
}
```

### Circuit Breaker

Prevent cascade failures:

```typescript
class ServiceClient {
  private failureCount = 0;
  private circuitOpen = false;

  async call() {
    if (this.circuitOpen) {
      throw new Error('Circuit breaker open');
    }

    try {
      const result = await this.makeRequest();
      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;
      if (this.failureCount > 5) {
        this.circuitOpen = true;
        setTimeout(() => this.circuitOpen = false, 60000); // Reset after 1min
      }
      throw error;
    }
  }
}
```

## Monitoring & Observability

### Key Metrics

**Service Level:**
- Request rate (requests/sec)
- Error rate (%)
- Latency (p50, p99)
- Active connections

**Business Level:**
- Subscriptions created/canceled
- Usage trends
- Invoice generation rate
- Payment success rate

### Distributed Tracing

Use AWS X-Ray or OpenTelemetry:

```typescript
import { trace } from '@opentelemetry/api';

const span = trace.getTracer('subscription-service').startSpan('createSubscription');
try {
  const result = await repository.create(input);
  span.setStatus({ code: SpanStatusCode.OK });
  return result;
} catch (error) {
  span.recordException(error);
  throw error;
} finally {
  span.end();
}
```

### Structured Logging

```typescript
logger.info('subscription.created', {
  subscriptionId: subscription.id,
  tenantId: subscription.tenantId,
  planId: subscription.planId,
  timestamp: new Date().toISOString(),
});
```

## Security Considerations

### Defense in Depth

1. **Network Layer**: VPC, Security Groups, NACLs
2. **Application Layer**: JWT validation, RBAC
3. **Data Layer**: Encryption at rest, tenant isolation
4. **Monitoring**: CloudTrail, GuardDuty, Security Hub

### Tenant Isolation

Every query validates tenant ownership:

```typescript
async function getInvoice(id: string, context: AuthContext) {
  const invoice = await repository.findById(id);
  
  if (!invoice) throw new Error('Not found');
  
  // Critical: verify tenant ownership
  if (invoice.tenantId !== context.tenantId && context.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  
  return invoice;
}
```

### Rate Limiting

Implement per-tenant rate limits:

```typescript
const rateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => req.headers['x-tenant-id']
});
```

## Future Enhancements

1. **Caching Layer**: Redis for hot data
2. **Read Replicas**: For analytics queries
3. **CQRS**: Separate read/write models
4. **Saga Pattern**: For complex multi-service transactions
5. **GraphQL Subscriptions**: Real-time updates
6. **Webhooks**: Allow tenants to subscribe to events
7. **Multi-Region**: Deploy to multiple AWS regions
8. **CDN**: CloudFront for frontend assets

## References

- [GraphQL Federation Docs](https://www.apollographql.com/docs/federation/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Event-Driven Architecture](https://aws.amazon.com/event-driven-architecture/)
- [Multi-Tenancy on AWS](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html)
