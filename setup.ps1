# Groww Smart Market Watchlist - Windows Setup Script
Write-Host "🚀 Setting up Groww Smart Market Watchlist MVP..." -ForegroundColor Green

# Install Backend Dependencies
Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install

# Generate Prisma Client and Push Schema
Write-Host "🗄️ Setting up Database Schema (Prisma)..." -ForegroundColor Cyan
# Set SQLite fallback if no local Postgres is running
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "file:./dev.db"
}
npx prisma generate
npx prisma db push --skip-generate
npx ts-node prisma/seed.ts

# Install Frontend Dependencies
Set-Location ..\frontend
Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Cyan
npm install

Set-Location ..
Write-Host "✅ Setup Complete! To start local development:" -ForegroundColor Green
Write-Host "   Run: npm run dev" -ForegroundColor Yellow
Write-Host "   Backend will run on http://localhost:4000/api/v1" -ForegroundColor Yellow
Write-Host "   Frontend will run on http://localhost:3000" -ForegroundColor Yellow
