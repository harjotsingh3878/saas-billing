# Free Tier AWS Deployment - Quick Start

This guide helps you deploy the SaaS billing platform **completely FREE** using AWS Free Tier.

## 🆓 Free Tier Resources Used

- **Lambda**: 1M requests/month + 400K GB-seconds compute
- **DynamoDB**: 25GB storage + 25 RCU/WCU
- **S3**: 5GB storage + 20K GET, 2K PUT requests
- **Cognito**: 50K Monthly Active Users
- **EventBridge**: 14M events/month
- **API Gateway**: 1M requests/month (first 12 months)

**Expected Cost**: $0/month for demos with <1000 users

---

## Prerequisites

1. **AWS Account** - [Sign up here](https://aws.amazon.com/free/)
2. **GitHub Account** - For automated deployments
3. **Vercel Account** (optional) - For frontend hosting

---

## Step 1: Configure AWS Credentials

### Create IAM User

```bash
# In AWS Console:
# 1. Go to IAM → Users → Create User
# 2. User name: github-actions-deploy
# 3. Attach policies directly (ADD ALL OF THESE):
#    - AWSCloudFormationFullAccess
#    - AmazonDynamoDBFullAccess
#    - AWSLambda_FullAccess
#    - IAMFullAccess
#    - AmazonS3FullAccess
#    - AmazonCognitoPowerUser
#    - AmazonEventBridgeFullAccess
#    - AmazonEC2ContainerRegistryFullAccess  ← REQUIRED for CDK
#    - AmazonSSMFullAccess                    ← REQUIRED for CDK
#    - AmazonAPIGatewayAdministrator          ← REQUIRED for API Gateway
# 4. Click "Create user"
```

### Missing Permissions Fix

If you already created the user and getting permission errors:

```bash
# In AWS Console:
# 1. IAM → Users → github-actions-deploy
# 2. Permissions tab → Add permissions → Attach policies
# 3. Search and add:
#    - AmazonEC2ContainerRegistryFullAccess
#    - AmazonSSMFullAccess
#    - AmazonAPIGatewayAdministrator
# 4. Click "Add permissions"
```

### Create Access Key

After creating the user:

```bash
# 1. Click on the user → Security credentials tab
# 2. Click "Create access key"
# 3. Select use case: "Third-party service" or "Application running outside AWS"
#    (GitHub Actions runs outside AWS)
# 4. Check "I understand..." acknowledgment
# 5. Add description tag (optional): "GitHub Actions CI/CD"
# 6. Click "Create access key"
# 7. ⚠️ IMPORTANT: Download .csv or copy both keys NOW
#    - You won't be able to see the secret key again!
```

### Get Your AWS Account ID

```bash
# First, install AWS CLI if not already installed
brew install awscli  # macOS

# Configure AWS CLI with your credentials
aws configure
# AWS Access Key ID: (paste your access key)
# AWS Secret Access Key: (paste your secret key)
# Default region name: us-east-1
# Default output format: json

# Get your account ID
aws sts get-caller-identity --query Account --output text
```

---

## Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these **Repository Secrets** (NOT Environment secrets):

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `AWS_ACCESS_KEY_ID` | Your IAM access key | From IAM user creation step |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret key | From IAM user creation step |
| `AWS_ACCOUNT_ID` | Your 12-digit account ID | Run: `aws sts get-caller-identity --query Account --output text` |
| `VERCEL_TOKEN` | Vercel deployment token | See instructions below (optional) |

### How to Get Vercel Token (Optional - for frontend deployment)

```bash
# 1. Go to: https://vercel.com/signup (sign up with GitHub)
# 2. Go to: https://vercel.com/account/tokens
# 3. Click "Create Token"
# 4. Token Name: "GitHub Actions - SaaS Billing"
# 5. Scope: "Full Account"
# 6. Click "Create"
# 7. ⚠️ Copy the token immediately - you won't see it again!
# 8. Add to GitHub Secrets as VERCEL_TOKEN

# OR skip Vercel and run frontend locally only
```

---

## Step 3: Bootstrap AWS CDK (One-Time Setup)

```bash
# Install CDK globally
npm install -g aws-cdk

# Verify AWS credentials are configured
aws sts get-caller-identity
# Should return your user details

# Bootstrap CDK in your account (use YOUR actual account ID)
cd infra/aws-cdk
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1

# If bootstrap succeeds, you'll see:
# ✅ Environment aws://YOUR_ACCOUNT_ID/us-east-1 bootstrapped
```

### Troubleshooting Bootstrap

If bootstrap fails with permission errors:

```bash
# 1. Verify your IAM user has all 10 required policies (see Step 1)
# 2. Check your AWS credentials are configured
aws configure list

# 3. Try bootstrap again with verbose output
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1 --verbose
```

---

## Step 4: Deploy via GitHub Actions

### Option A: Automatic Deployment

```bash
# Simply push to main branch
git add .
git commit -m "Deploy to AWS"
git push origin main

# GitHub Actions will automatically:
# 1. Deploy CDK infrastructure
# 2. Package and deploy Lambda functions
# 3. Deploy frontend to Vercel
```

### Option B: Manual Deployment

```bash
# In GitHub:
# 1. Go to Actions tab
# 2. Click "Deploy to AWS" workflow
# 3. Click "Run workflow" → Run on main branch
```

---

## Step 5: Get Your API Gateway URL

After first deployment:

```bash
# Get the API Gateway URL
aws cloudformation describe-stacks \
  --stack-name SaasBillingComputeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text
```

Add this URL to GitHub Secrets as `API_GATEWAY_URL`

---

## Step 6: Seed Demo Data

```bash
# Install AWS CLI locally
brew install awscli  # macOS
# or
sudo apt install awscli  # Linux

# Configure with your credentials
aws configure

# Create tables and seed data
npm run db:setup
npm run seed:demo
```

---

## Step 7: Test Your Deployment

```bash
# Test GraphQL endpoint
curl https://YOUR_API_URL/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ plans { name price } }"}'

# Should return: Pro, Business, Enterprise plans
```

Visit your Vercel URL to see the live app!

---

## Architecture Deployed

```
┌─────────────────┐
│   Vercel        │  ← Next.js Frontend (FREE)
│   (Frontend)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  API Gateway    │  ← GraphQL Endpoint (FREE tier)
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│         Lambda Functions                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │  ← FREE (1M requests/mo)
│  │Tenant│ │ Sub  │ │Usage │ │Bill  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
└────────┬────────────────────┬──────────┘
         │                    │
    ┌────▼────┐          ┌────▼────┐
    │DynamoDB │          │   S3    │  ← FREE (25GB + 5GB)
    └─────────┘          └─────────┘
         │
    ┌────▼────────┐
    │  Cognito    │  ← FREE (50K users)
    └─────────────┘
```

---

## Cost Monitoring

### Set Up Billing Alerts

```bash
# 1. Go to AWS Console → Billing Dashboard
# 2. Click "Budgets" → Create budget
# 3. Set budget amount: $1
# 4. Add email alert when 80% threshold reached
```

### Stay Within Free Tier

- **Lambda invocations**: < 1M/month
- **DynamoDB reads/writes**: < 25 RCU/WCU
- **S3 storage**: < 5GB
- **Active users**: < 50K/month

For a demo, you'll use <1% of these limits!

---

## Troubleshooting

### CDK Bootstrap Fails - Permission Errors

**Error**: "User is not authorized to perform: ecr:CreateRepository" or SSM errors

**Fix**:
```bash
# Add missing IAM policies to your user:
# 1. Go to IAM → Users → github-actions-deploy
# 2. Permissions tab → Add permissions → Attach policies
# 3. Add these three policies:
#    - AmazonEC2ContainerRegistryFullAccess
#    - AmazonSSMFullAccess
#    - AmazonAPIGatewayAdministrator
# 4. Click "Add permissions"
# 5. Run bootstrap again
cd infra/aws-cdk
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

### CDK Bootstrap Already Exists

**Error**: "Stack already exists"

**Solution**: Bootstrap already completed, skip to deployment
```bash
cdk deploy --all
```

### CDK Deploy Fails

```bash
# Check your credentials
aws sts get-caller-identity

# Check you have all required policies
aws iam list-attached-user-policies --user-name github-actions-deploy
```

### Lambda Function Not Found

```bash
# Check Lambda deployment
aws lambda list-functions --query 'Functions[?contains(FunctionName, `saas-billing`)].FunctionName'

# Re-run deployment script
chmod +x scripts/deploy-lambdas.sh
./scripts/deploy-lambdas.sh
```

### GitHub Actions Fails

- Verify all 4 secrets are set correctly in GitHub (Repository Secrets, not Environment)
- Check AWS credentials have ALL necessary permissions (10 policies total)
- View detailed logs in GitHub Actions tab
- Try manual deployment first to isolate issues

---

## Manual Deployment (Without GitHub Actions)

If you prefer manual deployment:

```bash
# 1. Deploy infrastructure
cd infra/aws-cdk
npm install
cdk deploy --all

# 2. Deploy Lambda functions
cd ../..
chmod +x scripts/deploy-lambdas.sh
./scripts/deploy-lambdas.sh

# 3. Deploy frontend
cd apps/web
vercel --prod
```

---

## Cleanup (Delete Everything)

```bash
# Delete all AWS resources
cd infra/aws-cdk
cdk destroy --all

# Delete Lambda functions
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `saas-billing`)].FunctionName' \
  --output text | \
  xargs -I {} aws lambda delete-function --function-name {}
```

---

## Required IAM Policies Checklist

Your `github-actions-deploy` user needs these 10 policies:

- ✅ AWSCloudFormationFullAccess
- ✅ AmazonDynamoDBFullAccess
- ✅ AWSLambda_FullAccess
- ✅ IAMFullAccess
- ✅ AmazonS3FullAccess
- ✅ AmazonCognitoPowerUser
- ✅ AmazonEventBridgeFullAccess
- ✅ AmazonEC2ContainerRegistryFullAccess ← Required for CDK
- ✅ AmazonSSMFullAccess ← Required for CDK
- ✅ AmazonAPIGatewayAdministrator ← Required for API Gateway

---

## Next Steps

1. ✅ Add all 10 IAM policies to your user
2. ✅ Run CDK bootstrap
3. ✅ Deploy via GitHub Actions or manually
4. ✅ Test API endpoints
5. ✅ Configure custom domain (optional)

---

## Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
- **Issues**: Open GitHub issue
- **AWS Support**: [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/)
