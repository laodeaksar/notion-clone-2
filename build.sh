#!/bin/bash
set -e

echo "📦 Installing root dependencies..."
bun install

echo "📦 Installing client dependencies..."
cd client && bun install && cd ..

echo "🏗️  Building client..."
bun run build:client

echo "🗄️  Running database migrations..."
bun run db:migrate

echo "✅ Build complete."
