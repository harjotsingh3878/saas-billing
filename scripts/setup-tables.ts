import { 
  DynamoDBClient, 
  CreateTableCommand, 
  ListTablesCommand,
  CreateTableCommandInput 
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

async function setupTables() {
  console.log('🔧 Setting up DynamoDB tables...\n');

  const tables: Array<{ name: string; schema: CreateTableCommandInput }> = [
    {
      name: 'Tenants',
      schema: {
        TableName: 'Tenants',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
      },
    },
    {
      name: 'Subscriptions',
      schema: {
        TableName: 'Subscriptions',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'tenantId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TenantIdIndex',
            KeySchema: [{ AttributeName: 'tenantId', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      },
    },
    {
      name: 'Invoices',
      schema: {
        TableName: 'Invoices',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'tenantId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TenantIdIndex',
            KeySchema: [{ AttributeName: 'tenantId', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      },
    },
    {
      name: 'UsageMetrics',
      schema: {
        TableName: 'UsageMetrics',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'tenantId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TenantIdIndex',
            KeySchema: [{ AttributeName: 'tenantId', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      },
    },
  ];

  // Check existing tables
  const listResult = await client.send(new ListTablesCommand({}));
  const existingTables = listResult.TableNames || [];

  for (const table of tables) {
    if (existingTables.includes(table.name)) {
      console.log(`✓ Table "${table.name}" already exists`);
    } else {
      try {
        await client.send(new CreateTableCommand(table.schema));
        console.log(`✅ Created table: ${table.name}`);
      } catch (error: any) {
        console.error(`❌ Error creating table ${table.name}:`, error.message);
      }
    }
  }

  console.log('\n✅ Table setup complete!');
}

setupTables().catch(console.error);
