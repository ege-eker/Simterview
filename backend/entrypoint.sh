#!/bin/sh
set -e

echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🚀 Starting Node.js server..."
npm run dev