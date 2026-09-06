#!/bin/bash
echo "🚀 Setting up Groww Smart Market Watchlist MVP..."

echo "📦 Installing Backend Dependencies..."
cd backend
npm install

echo "🗄️ Setting up Database Schema (Prisma)..."
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:./dev.db"
fi
npx prisma generate
npx prisma db push --skip-generate
npx ts-node prisma/seed.ts

cd ../frontend
echo "📦 Installing Frontend Dependencies..."
npm install

cd ..
echo "✅ Setup Complete! To start local development:"
echo "   Run: npm run dev"
echo "   Backend: http://localhost:4000/api/v1"
echo "   Frontend: http://localhost:3000"
