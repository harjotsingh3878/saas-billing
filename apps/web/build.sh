#!/bin/bash
set -e

echo "📦 Building SaaS Billing Web App in Monorepo..."

# Go to monorepo root
cd ../..

# Install all dependencies at root
echo "Installing monorepo dependencies..."
npm install

# Build TypeScript packages
echo "Building TypeScript packages..."
npx tsc --build tsconfig.build.json --force || echo "⚠️ TypeScript build had errors, continuing..."

# Build web app
echo "Building Next.js app..."
npm run build --workspace=@saas-billing/web

echo "✅ Build complete!"
