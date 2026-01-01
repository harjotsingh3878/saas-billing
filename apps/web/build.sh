#!/bin/bash
set -e

echo "📦 Building SaaS Billing Web App in Monorepo..."

# Go to monorepo root
cd ../..

# Install all dependencies at root (skip if already done by Vercel)
if [ "$VERCEL" != "1" ]; then
  echo "Installing monorepo dependencies..."
  npm install
else
  echo "Skipping npm install (handled by Vercel)..."
fi

# Build TypeScript packages
echo "Building TypeScript packages..."
npx tsc --build tsconfig.build.json --force || echo "⚠️ TypeScript build had errors, continuing..."

# Build web app
echo "Building Next.js app..."
npm run build --workspace=@saas-billing/web

echo "✅ Build complete!"
