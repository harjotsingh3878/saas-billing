import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly tenantsTable: dynamodb.Table;
  public readonly subscriptionsTable: dynamodb.Table;
  public readonly usageTable: dynamodb.Table;
  public readonly invoicesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tenants Table
    this.tenantsTable = new dynamodb.Table(this, 'TenantsTable', {
      tableName: 'Tenants',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev - use RETAIN in prod
      pointInTimeRecovery: true,
    });

    this.tenantsTable.addGlobalSecondaryIndex({
      indexName: 'OwnerIdIndex',
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING },
    });

    // Subscriptions Table
    this.subscriptionsTable = new dynamodb.Table(this, 'SubscriptionsTable', {
      tableName: 'Subscriptions',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    this.subscriptionsTable.addGlobalSecondaryIndex({
      indexName: 'TenantIdIndex',
      partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
    });

    // Usage Table
    this.usageTable = new dynamodb.Table(this, 'UsageTable', {
      tableName: 'Usage',
      partitionKey: { name: 'compositeKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    this.usageTable.addGlobalSecondaryIndex({
      indexName: 'IdIndex',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    this.usageTable.addGlobalSecondaryIndex({
      indexName: 'TenantIdPeriodIndex',
      partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'period', type: dynamodb.AttributeType.STRING },
    });

    // Invoices Table
    this.invoicesTable = new dynamodb.Table(this, 'InvoicesTable', {
      tableName: 'Invoices',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    this.invoicesTable.addGlobalSecondaryIndex({
      indexName: 'TenantIdIndex',
      partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
    });

    // Outputs
    new cdk.CfnOutput(this, 'TenantsTableName', {
      value: this.tenantsTable.tableName,
      exportName: 'TenantsTableName',
    });

    new cdk.CfnOutput(this, 'SubscriptionsTableName', {
      value: this.subscriptionsTable.tableName,
      exportName: 'SubscriptionsTableName',
    });

    new cdk.CfnOutput(this, 'UsageTableName', {
      value: this.usageTable.tableName,
      exportName: 'UsageTableName',
    });

    new cdk.CfnOutput(this, 'InvoicesTableName', {
      value: this.invoicesTable.tableName,
      exportName: 'InvoicesTableName',
    });
  }
}
