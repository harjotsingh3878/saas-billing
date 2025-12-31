import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  tenantsTable: dynamodb.Table;
  subscriptionsTable: dynamodb.Table;
  usageTable: dynamodb.Table;
  invoicesTable: dynamodb.Table;
  invoicesBucket: s3.Bucket;
  eventBus: events.EventBus;
  userPool: cognito.UserPool;
}

export class ComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Common Lambda environment
    const commonEnv = {
      AWS_REGION: this.region,
      EVENTBRIDGE_BUS_NAME: props.eventBus.eventBusName,
      TENANTS_TABLE: props.tenantsTable.tableName,
      SUBSCRIPTIONS_TABLE: props.subscriptionsTable.tableName,
      USAGE_TABLE: props.usageTable.tableName,
      INVOICES_TABLE: props.invoicesTable.tableName,
      S3_INVOICES_BUCKET: props.invoicesBucket.bucketName,
      COGNITO_USER_POOL_ID: props.userPool.userPoolId,
    };

    // Lambda Layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset('../../packages'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared types and utilities',
    });

    // Note: In production, you would build and package each service separately
    // This is a simplified example showing the infrastructure setup

    new cdk.CfnOutput(this, 'SharedLayerArn', {
      value: sharedLayer.layerVersionArn,
      exportName: 'SharedLayerArn',
    });
  }
}
