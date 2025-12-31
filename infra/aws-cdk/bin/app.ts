#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ComputeStack } from '../lib/compute-stack';
import { EventStack } from '../lib/event-stack';
import { StorageStack } from '../lib/storage-stack';
import { AuthStack } from '../lib/auth-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Database tables
const databaseStack = new DatabaseStack(app, 'SaasBillingDatabaseStack', { env });

// Storage (S3 buckets)
const storageStack = new StorageStack(app, 'SaasBillingStorageStack', { env });

// Authentication
const authStack = new AuthStack(app, 'SaasBillingAuthStack', { env });

// Event bus
const eventStack = new EventStack(app, 'SaasBillingEventStack', { env });

// Lambda functions
const computeStack = new ComputeStack(app, 'SaasBillingComputeStack', {
  env,
  tenantsTable: databaseStack.tenantsTable,
  subscriptionsTable: databaseStack.subscriptionsTable,
  usageTable: databaseStack.usageTable,
  invoicesTable: databaseStack.invoicesTable,
  invoicesBucket: storageStack.invoicesBucket,
  eventBus: eventStack.eventBus,
  userPool: authStack.userPool,
});
