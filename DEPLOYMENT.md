# SaaS Billing Platform - Deployment Guide

This guide covers deploying the platform to AWS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- CDK CLI installed: `npm install -g aws-cdk`
- Docker installed (for Lambda packaging)

## Architecture Overview

The platform deploys to AWS with:

- **Compute**: AWS Lambda functions for each service
- **API Gateway**: For HTTP endpoints
- **DynamoDB**: For all data storage
- **EventBridge**: For event-driven communication
- **S3**: For invoice PDF storage
- **Cognito**: For authentication
- **CloudWatch**: For logs and metrics
- **SES**: For email notifications

## Step 1: Bootstrap CDK

```bash
cd infra/aws-cdk

# Bootstrap CDK in your AWS account (one-time setup)
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

## Step 2: Configure Environment

Create `infra/aws-cdk/.env`:

```bash
CDK_DEFAULT_ACCOUNT=your-account-id
CDK_DEFAULT_REGION=us-east-1
```

## Step 3: Build Services

```bash
# Build all services
cd ../..
npm run build
```

## Step 4: Deploy Infrastructure

```bash
cd infra/aws-cdk

# Review what will be deployed
cdk diff

# Deploy all stacks
cdk deploy --all

# Or deploy individually:
cdk deploy SaasBillingDatabaseStack
cdk deploy SaasBillingStorageStack
cdk deploy SaasBillingAuthStack
cdk deploy SaasBillingEventStack
cdk deploy SaasBillingComputeStack
```

This will create:
- 4 DynamoDB tables (Tenants, Subscriptions, Usage, Invoices)
- 1 S3 bucket (for invoices)
- 1 EventBridge event bus
- 1 Cognito User Pool
- Lambda functions for each service (when fully implemented)

## Step 5: Get Stack Outputs

After deployment, CDK will output important values:

```bash
# Get all outputs
aws cloudformation describe-stacks --stack-name SaasBillingDatabaseStack --query 'Stacks[0].Outputs'
```

Note the following values:
- `UserPoolId`
- `UserPoolClientId`
- `EventBusName`
- `InvoicesBucketName`
- Table names

## Step 6: Configure Services

Update your service environment variables:

```bash
export DYNAMODB_ENDPOINT="" # Use actual DynamoDB
export AWS_REGION=us-east-1
export EVENTBRIDGE_BUS_NAME=saas-billing-events
export COGNITO_USER_POOL_ID=<your-pool-id>
export COGNITO_CLIENT_ID=<your-client-id>
export S3_INVOICES_BUCKET=<your-bucket-name>
```

## Step 7: Package Lambda Functions

For production, package each service as a Lambda function:

```bash
# Example for tenant-service
cd apps/tenant-service
npm run build
zip -r tenant-service.zip dist/ node_modules/ package.json

# Upload to Lambda or use CDK to deploy
aws lambda update-function-code \
  --function-name tenant-service \
  --zip-file fileb://tenant-service.zip
```

## Step 8: Deploy Frontend

### Option A: Deploy to Vercel

```bash
cd apps/web

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_COGNITO_USER_POOL_ID
# - NEXT_PUBLIC_COGNITO_CLIENT_ID
```

### Option B: Deploy to AWS Amplify

```bash
# Push code to GitHub
git push origin main

# In AWS Console:
# 1. Go to AWS Amplify
# 2. Connect repository
# 3. Configure build settings
# 4. Deploy
```

## Step 9: Configure SES

```bash
# Verify sender email
aws ses verify-email-identity --email-address billing@yourdomain.com

# Move out of SES sandbox for production
# Apply through AWS Console or support ticket
```

## Step 10: Test Deployment

```bash
# Test GraphQL endpoint
curl https://your-api-gateway-url/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ plans { name price } }"}'

# Test authentication
# Sign up via Cognito or frontend
```

## Monitoring & Observability

### CloudWatch Dashboards

Create dashboards in CloudWatch for:
- Lambda invocation counts
- DynamoDB read/write capacity
- EventBridge rule invocations
- Error rates

### X-Ray Tracing

Enable X-Ray on all Lambda functions:

```typescript
// In CDK
const fn = new lambda.Function(this, 'Function', {
  // ... other props
  tracing: lambda.Tracing.ACTIVE,
});
```

### Alarms

Set up CloudWatch Alarms for:
- Lambda errors
- DynamoDB throttling
- High latency
- EventBridge failed invocations

## Cost Optimization

### Free Tier Estimates

- **Lambda**: 1M requests/month free
- **DynamoDB**: 25 GB storage free, 25 RCU/WCU
- **EventBridge**: 14M events/month
- **S3**: 5 GB storage, 20K GET requests
- **Cognito**: 50K MAUs free

### Expected Monthly Costs (after free tier)

- **Low traffic** (<10K users): $20-50/month
- **Medium traffic** (10K-100K users): $100-500/month
- **High traffic** (>100K users): $500+/month

## Security Checklist

- [ ] Enable MFA for AWS root account
- [ ] Use IAM roles with least privilege
- [ ] Enable CloudTrail logging
- [ ] Enable VPC endpoints for DynamoDB
- [ ] Use AWS Secrets Manager for secrets
- [ ] Enable DynamoDB encryption at rest
- [ ] Configure S3 bucket policies
- [ ] Enable API Gateway throttling
- [ ] Set up WAF rules
- [ ] Enable Cognito advanced security

## Rollback

If deployment fails:

```bash
# Rollback specific stack
cdk rollback SaasBillingComputeStack

# Destroy all (WARNING: deletes data)
cdk destroy --all
```

## CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy CDK
        run: |
          cd infra/aws-cdk
          npm run deploy -- --require-approval never
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Support

For issues, contact: support@yourdomain.com
