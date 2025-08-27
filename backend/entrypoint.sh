#!/bin/bash
set -e

echo "📦 Running Prisma migrations (dev mode)..."
npx prisma migrate dev --name init --skip-seed

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🚀 Starting Node.js server..."
npm run dev