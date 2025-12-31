import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Usage } from '@saas-billing/shared-types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import dotenv from 'dotenv';
import path from 'path';

// Load .env before creating clients
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && { 
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  }),
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.USAGE_TABLE || 'Usage';

export interface ReportUsageInput {
  tenantId: string;
  feature: string;
  count: number;
}

export class UsageRepository {
  async report(input: ReportUsageInput, limit: number): Promise<Usage> {
    const period = format(new Date(), 'yyyy-MM');
    const compositeKey = `${input.tenantId}#${input.feature}#${period}`;

    // Try to get existing usage for this period
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { compositeKey },
      })
    );

    if (existing.Item) {
      const newCount = existing.Item.count + input.count;

      const updated = await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { compositeKey },
          UpdateExpression: 'SET #count = :count, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#count': 'count',
          },
          ExpressionAttributeValues: {
            ':count': newCount,
            ':updatedAt': new Date().toISOString(),
          },
          ReturnValues: 'ALL_NEW',
        })
      );

      return this.mapToUsage(updated.Attributes!);
    }

    // Create new usage record
    const usage: Usage = {
      id: uuidv4(),
      tenantId: input.tenantId,
      feature: input.feature,
      count: input.count,
      limit,
      period,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          compositeKey,
          ...usage,
          createdAt: usage.createdAt.toISOString(),
          updatedAt: usage.updatedAt.toISOString(),
        },
      })
    );

    return usage;
  }

  async findById(id: string): Promise<Usage | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'IdIndex',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id,
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) return null;
    return this.mapToUsage(result.Items[0]);
  }

  async findByTenant(tenantId: string, period?: string): Promise<Usage[]> {
    const periodToUse = period || format(new Date(), 'yyyy-MM');

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'TenantIdPeriodIndex',
        KeyConditionExpression: 'tenantId = :tenantId AND begins_with(compositeKey, :prefix)',
        ExpressionAttributeValues: {
          ':tenantId': tenantId,
          ':prefix': `${tenantId}#`,
        },
      })
    );

    return (result.Items || []).filter((item) => item.period === periodToUse).map(this.mapToUsage);
  }

  private mapToUsage(item: any): Usage {
    return {
      id: item.id,
      tenantId: item.tenantId,
      feature: item.feature,
      count: item.count,
      limit: item.limit,
      period: item.period,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }
}
