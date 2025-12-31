import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Tenant, TenantStatus, PlanType } from '@saas-billing/shared-types';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT }),
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TENANTS_TABLE || 'Tenants';

export interface CreateTenantInput {
  name: string;
  plan: PlanType;
  ownerId: string;
}

export interface UpdateTenantInput {
  name?: string;
  plan?: PlanType;
  status?: TenantStatus;
}

export class TenantRepository {
  async create(input: CreateTenantInput): Promise<Tenant> {
    const tenant: Tenant = {
      id: uuidv4(),
      name: input.name,
      plan: input.plan,
      status: TenantStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...tenant,
          ownerId: input.ownerId,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
        },
      })
    );

    return tenant;
  }

  async findById(id: string): Promise<Tenant | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

    if (!result.Item) return null;

    return this.mapToTenant(result.Item);
  }

  async findByOwnerId(ownerId: string): Promise<Tenant[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'OwnerIdIndex',
        KeyConditionExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: {
          ':ownerId': ownerId,
        },
      })
    );

    return (result.Items || []).map(this.mapToTenant);
  }

  async update(id: string, input: UpdateTenantInput): Promise<Tenant> {
    const updateExpression: string[] = [];
    const expressionAttributeValues: any = {
      ':updatedAt': new Date().toISOString(),
    };
    const expressionAttributeNames: any = {};

    if (input.name) {
      updateExpression.push('#name = :name');
      expressionAttributeValues[':name'] = input.name;
      expressionAttributeNames['#name'] = 'name';
    }

    if (input.plan) {
      updateExpression.push('plan = :plan');
      expressionAttributeValues[':plan'] = input.plan;
    }

    if (input.status) {
      updateExpression.push('#status = :status');
      expressionAttributeValues[':status'] = input.status;
      expressionAttributeNames['#status'] = 'status';
    }

    updateExpression.push('updatedAt = :updatedAt');

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ReturnValues: 'ALL_NEW',
      })
    );

    return this.mapToTenant(result.Attributes!);
  }

  async delete(id: string): Promise<void> {
    await this.update(id, { status: TenantStatus.DELETED });
  }

  private mapToTenant(item: any): Tenant {
    return {
      id: item.id,
      name: item.name,
      plan: item.plan,
      status: item.status,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }
}
