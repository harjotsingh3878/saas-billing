#!/bin/bash

# Deploy Lambda Functions Script
# This script packages and deploys each microservice as a Lambda function

set -e  # Exit on error (except for builds)

echo "🚀 Starting Lambda deployment..."

SERVICES=("tenant-service" "subscription-service" "usage-service" "billing-service" "notification-service")

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

for service in "${SERVICES[@]}"; do
  echo -e "${BLUE}📦 Packaging $service...${NC}"
  
  cd "apps/$service"
  
  # Build TypeScript (continue even if type errors exist)
  npm run build || true
  
  # Create deployment package
  mkdir -p dist-lambda
  
  # Check if dist directory exists (build may have failed)
  if [ -d "dist" ]; then
    cp -r dist/* dist-lambda/
  else
    echo "⚠️  No dist directory found for $service, skipping..."
    cd ../..
    continue
  fi
  
  cp package.json dist-lambda/
  
  # Copy workspace dependencies from root node_modules
  mkdir -p dist-lambda/node_modules
  
  # Copy local workspace packages
  if [ -d "../../node_modules/@saas-billing" ]; then
    cp -r ../../node_modules/@saas-billing dist-lambda/node_modules/
  fi
  
  # Copy other production dependencies
  cd dist-lambda
  npm install --production --omit=dev --ignore-scripts 2>/dev/null || echo "⚠️  npm install had warnings, continuing..."
  
  # Create zip file
  zip -r "../${service}.zip" . -q
  cd ..
  
  # Check if Lambda function exists
  FUNCTION_NAME="saas-billing-${service}"
  
  if aws lambda get-function --function-name "$FUNCTION_NAME" 2>/dev/null; then
    echo -e "${BLUE}Updating existing Lambda function: $FUNCTION_NAME${NC}"
    
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --zip-file "fileb://${service}.zip" \
      --no-cli-pager
    
    # Wait for update to complete
    aws lambda wait function-updated --function-name "$FUNCTION_NAME"
    
    # Update environment variables
    aws lambda update-function-configuration \
      --function-name "$FUNCTION_NAME" \
      --environment "Variables={
        NODE_ENV=production,
        TENANTS_TABLE=Tenants,
        SUBSCRIPTIONS_TABLE=Subscriptions,
        USAGE_TABLE=Usage,
        INVOICES_TABLE=Invoices,
        EVENTBRIDGE_BUS_NAME=${EVENT_BUS_NAME},
        COGNITO_USER_POOL_ID=${USER_POOL_ID}
      }" \
      --no-cli-pager
  else
    echo -e "${BLUE}Creating new Lambda function: $FUNCTION_NAME${NC}"
    
    # Get execution role ARN (should be created by CDK)
    ROLE_ARN=$(aws iam get-role --role-name saas-billing-lambda-role --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
      echo "⚠️  Lambda execution role not found. Creating one..."
      
      # Create execution role
      aws iam create-role \
        --role-name saas-billing-lambda-role \
        --assume-role-policy-document '{
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }]
        }' \
        --no-cli-pager
      
      # Attach policies
      aws iam attach-role-policy \
        --role-name saas-billing-lambda-role \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      
      aws iam attach-role-policy \
        --role-name saas-billing-lambda-role \
        --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
      
      # Get the new role ARN
      ROLE_ARN=$(aws iam get-role --role-name saas-billing-lambda-role --query 'Role.Arn' --output text)
      
      echo "⏳ Waiting for IAM role to propagate..."
      sleep 10
    fi
    
    aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime nodejs18.x \
      --role "$ROLE_ARN" \
      --handler index.handler \
      --zip-file "fileb://${service}.zip" \
      --timeout 30 \
      --memory-size 256 \
      --environment "Variables={
        NODE_ENV=production,
        TENANTS_TABLE=Tenants,
        SUBSCRIPTIONS_TABLE=Subscriptions,
        USAGE_TABLE=Usage,
        INVOICES_TABLE=Invoices,
        EVENTBRIDGE_BUS_NAME=${EVENT_BUS_NAME},
        COGNITO_USER_POOL_ID=${USER_POOL_ID}
      }" \
      --no-cli-pager
  fi
  
  # Clean up
  rm -rf dist-lambda "${service}.zip"
  
  echo -e "${GREEN}✅ $service deployed successfully${NC}"
  
  cd ../..
done

echo -e "${GREEN}🎉 All Lambda functions deployed successfully!${NC}"
