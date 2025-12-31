import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Subscription, SubscriptionStatus } from '@saas-billing/shared-types';
import { addMonths, addYears } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getPlanById } from './plans';
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
const TABLE_NAME = process.env.SUBSCRIPTIONS_TABLE || 'Subscriptions';

export interface CreateSubscriptionInput {
  tenantId: string;
  planId: string;
  seats: number;
}

export class SubscriptionRepository {
  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    const plan = getPlanById(input.planId);
    if (!plan) {
      throw new Error(`Plan ${input.planId} not found`);
    }

    const now = new Date();
    const trialEnd = addMonths(now, 1);
    const currentPeriodEnd = addMonths(now, 1);

    const subscription: Subscription = {
      id: uuidv4(),
      tenantId: input.tenantId,
      planId: input.planId,
      status: SubscriptionStatus.TRIAL,
      currentPeriodStart: now,
      currentPeriodEnd,
      trialEnd,
      seats: input.seats,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...subscription,
          currentPeriodStart: subscription.currentPeriodStart.toISOString(),
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          trialEnd: subscription.trialEnd?.toISOString(),
          createdAt: subscription.createdAt.toISOString(),
          updatedAt: subscription.updatedAt.toISOString(),
        },
      })
    );

    return subscription;
  }

  async findById(id: string): Promise<Subscription | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

    if (!result.Item) return null;
    return this.mapToSubscription(result.Item);
  }

  async findByTenantId(tenantId: string): Promise<Subscription | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'TenantIdIndex',
        KeyConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': tenantId,
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) return null;
    return this.mapToSubscription(result.Items[0]);
  }

  async update(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const updateExpression: string[] = [];
    const expressionAttributeValues: any = {
      ':updatedAt': new Date().toISOString(),
    };
    const expressionAttributeNames: any = {};

    // DynamoDB reserved keywords that need aliasing
    const reservedKeywords = ['status', 'name', 'type', 'plan'];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (reservedKeywords.includes(key)) {
          const placeholder = `#${key}`;
          expressionAttributeNames[placeholder] = key;
          updateExpression.push(`${placeholder} = :${key}`);
        } else {
          updateExpression.push(`${key} = :${key}`);
        }
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    updateExpression.push('updatedAt = :updatedAt');

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
        ReturnValues: 'ALL_NEW',
      })
    );

    return this.mapToSubscription(result.Attributes!);
  }

  private mapToSubscription(item: any): Subscription {
    return {
      id: item.id,
      tenantId: item.tenantId,
      planId: item.planId,
      status: item.status,
      currentPeriodStart: new Date(item.currentPeriodStart),
      currentPeriodEnd: new Date(item.currentPeriodEnd),
      trialEnd: item.trialEnd ? new Date(item.trialEnd) : undefined,
      seats: item.seats,
      cancelAtPeriodEnd: item.cancelAtPeriodEnd,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }
}
