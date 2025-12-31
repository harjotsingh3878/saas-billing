import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000', // DynamoDB Local
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TENANT_ID = 'tenant_demo_123';
const USER_ID = 'user_demo_456';
const SUBSCRIPTION_ID = 'sub_demo_789';

async function seedTenants() {
  console.log('Seeding Tenants...');
  
  const tenant = {
    id: TENANT_ID,
    name: 'Acme Corporation',
    plan: 'PRO',
    status: 'ACTIVE',
    ownerId: USER_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: 'Tenants',
        Item: tenant,
      })
    );
    console.log('✅ Tenant created:', tenant.name);
  } catch (error) {
    console.error('❌ Error creating tenant:', error);
  }
}

async function seedSubscriptions() {
  console.log('\nSeeding Subscriptions...');
  
  const subscription = {
    id: SUBSCRIPTION_ID,
    tenantId: TENANT_ID,
    planId: 'plan_pro',
    status: 'ACTIVE',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    cancelAtPeriodEnd: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: 'Subscriptions',
        Item: subscription,
      })
    );
    console.log('✅ Subscription created: Pro Plan');
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
  }
}

async function seedInvoices() {
  console.log('\nSeeding Invoices...');
  
  const invoices = [
    {
      id: `INV-${Date.now()}-1`,
      tenantId: TENANT_ID,
      subscriptionId: SUBSCRIPTION_ID,
      amount: 99.00,
      currency: 'USD',
      status: 'PAID',
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      lineItems: [
        {
          description: 'Pro Plan - Monthly Subscription',
          quantity: 1,
          unitPrice: 99.00,
          amount: 99.00,
        },
      ],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `INV-${Date.now()}-2`,
      tenantId: TENANT_ID,
      subscriptionId: SUBSCRIPTION_ID,
      amount: 99.00,
      currency: 'USD',
      status: 'PAID',
      dueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
      paidAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString(),
      lineItems: [
        {
          description: 'Pro Plan - Monthly Subscription',
          quantity: 1,
          unitPrice: 99.00,
          amount: 99.00,
        },
      ],
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `INV-${Date.now()}-3`,
      tenantId: TENANT_ID,
      subscriptionId: SUBSCRIPTION_ID,
      amount: 99.00,
      currency: 'USD',
      status: 'PAID',
      dueDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(), // 75 days ago
      paidAt: new Date(Date.now() - 74 * 24 * 60 * 60 * 1000).toISOString(),
      lineItems: [
        {
          description: 'Pro Plan - Monthly Subscription',
          quantity: 1,
          unitPrice: 99.00,
          amount: 99.00,
        },
      ],
      createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `INV-${Date.now()}-4`,
      tenantId: TENANT_ID,
      subscriptionId: SUBSCRIPTION_ID,
      amount: 29.00,
      currency: 'USD',
      status: 'PAID',
      dueDate: new Date(Date.now() - 105 * 24 * 60 * 60 * 1000).toISOString(), // 105 days ago
      paidAt: new Date(Date.now() - 104 * 24 * 60 * 60 * 1000).toISOString(),
      lineItems: [
        {
          description: 'Basic Plan - Monthly Subscription',
          quantity: 1,
          unitPrice: 29.00,
          amount: 29.00,
        },
      ],
      createdAt: new Date(Date.now() - 105 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `INV-${Date.now()}-5`,
      tenantId: TENANT_ID,
      subscriptionId: SUBSCRIPTION_ID,
      amount: 29.00,
      currency: 'USD',
      status: 'PAID',
      dueDate: new Date(Date.now() - 135 * 24 * 60 * 60 * 1000).toISOString(), // 135 days ago
      paidAt: new Date(Date.now() - 134 * 24 * 60 * 60 * 1000).toISOString(),
      lineItems: [
        {
          description: 'Basic Plan - Monthly Subscription',
          quantity: 1,
          unitPrice: 29.00,
          amount: 29.00,
        },
      ],
      createdAt: new Date(Date.now() - 135 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const invoice of invoices) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: 'Invoices',
          Item: invoice,
        })
      );
      console.log(`✅ Invoice created: ${invoice.id} - $${invoice.amount}`);
    } catch (error) {
      console.error(`❌ Error creating invoice ${invoice.id}:`, error);
    }
  }
}

async function seedUsageMetrics() {
  console.log('\nSeeding Usage Metrics...');
  
  const usageMetrics = [
    {
      id: uuidv4(),
      tenantId: TENANT_ID,
      featureId: 'api_calls',
      featureName: 'API Calls',
      count: 8542,
      period: new Date().toISOString().substring(0, 7), // Current month YYYY-MM
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      tenantId: TENANT_ID,
      featureId: 'storage',
      featureName: 'Storage',
      count: 45, // GB
      period: new Date().toISOString().substring(0, 7),
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      tenantId: TENANT_ID,
      featureId: 'users',
      featureName: 'Active Users',
      count: 2,
      period: new Date().toISOString().substring(0, 7),
      createdAt: new Date().toISOString(),
    },
  ];

  for (const metric of usageMetrics) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: 'UsageMetrics',
          Item: metric,
        })
      );
      console.log(`✅ Usage metric created: ${metric.featureName} - ${metric.count}`);
    } catch (error) {
      console.error(`❌ Error creating usage metric ${metric.featureName}:`, error);
    }
  }
}

async function main() {
  console.log('🌱 Starting database seeding...\n');
  console.log('Using tenant ID:', TENANT_ID);
  console.log('Using user ID:', USER_ID);
  console.log('Using subscription ID:', SUBSCRIPTION_ID);
  console.log('='.repeat(50));

  await seedTenants();
  await seedSubscriptions();
  await seedInvoices();
  await seedUsageMetrics();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Database seeding completed!');
  console.log('\nYou can now use these IDs in your app:');
  console.log(`  Tenant ID: ${TENANT_ID}`);
  console.log(`  User ID: ${USER_ID}`);
  console.log(`  Subscription ID: ${SUBSCRIPTION_ID}`);
}

main().catch(console.error);
