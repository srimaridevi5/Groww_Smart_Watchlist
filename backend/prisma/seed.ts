import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Groww Smart Watchlist Database...');

  // 1. Seed Stock Master Data
  const stocks = [
    {
      symbol: 'NIFTY',
      name: 'NIFTY 50 Index (Benchmark)',
      exchange: 'NSE',
      sector: 'Benchmark Index',
      fiftyTwoWeekHigh: 25000.00,
      fiftyTwoWeekLow: 21000.00,
      avgVolume20d: 500000000,
      volatility30d: 0.012,
      beta: 1.0,
    },
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      exchange: 'NSE',
      sector: 'Energy & Conglomerate',
      fiftyTwoWeekHigh: 3024.90,
      fiftyTwoWeekLow: 2220.30,
      avgVolume20d: 6500000,
      volatility30d: 0.018,
      beta: 1.10,
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      exchange: 'NSE',
      sector: 'Information Technology',
      fiftyTwoWeekHigh: 4254.75,
      fiftyTwoWeekLow: 3310.00,
      avgVolume20d: 2800000,
      volatility30d: 0.015,
      beta: 0.85,
    },
    {
      symbol: 'INFY',
      name: 'Infosys Limited',
      exchange: 'NSE',
      sector: 'Information Technology',
      fiftyTwoWeekHigh: 1940.00,
      fiftyTwoWeekLow: 1355.00,
      avgVolume20d: 4500000,
      volatility30d: 0.021,
      beta: 0.90,
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Limited',
      exchange: 'NSE',
      sector: 'Banking & Financials',
      fiftyTwoWeekHigh: 1794.00,
      fiftyTwoWeekLow: 1363.55,
      avgVolume20d: 9200000,
      volatility30d: 0.016,
      beta: 1.05,
    },
    {
      symbol: 'TATAMOTORS',
      name: 'Tata Motors Limited',
      exchange: 'NSE',
      sector: 'Automobile',
      fiftyTwoWeekHigh: 1179.00,
      fiftyTwoWeekLow: 610.00,
      avgVolume20d: 11000000,
      volatility30d: 0.028,
      beta: 1.40,
    },
    {
      symbol: 'ICICIBANK',
      name: 'ICICI Bank Limited',
      exchange: 'NSE',
      sector: 'Banking & Financials',
      fiftyTwoWeekHigh: 1257.50,
      fiftyTwoWeekLow: 898.00,
      avgVolume20d: 7800000,
      volatility30d: 0.017,
      beta: 1.15,
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
      sector: 'Semiconductors',
      fiftyTwoWeekHigh: 140.76,
      fiftyTwoWeekLow: 45.00,
      avgVolume20d: 45000000,
      volatility30d: 0.035,
      beta: 1.75,
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      sector: 'Consumer Electronics',
      fiftyTwoWeekHigh: 237.23,
      fiftyTwoWeekLow: 164.08,
      avgVolume20d: 32000000,
      volatility30d: 0.019,
      beta: 1.0,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      exchange: 'NASDAQ',
      sector: 'Automotive & Clean Energy',
      fiftyTwoWeekHigh: 271.00,
      fiftyTwoWeekLow: 138.80,
      avgVolume20d: 55000000,
      volatility30d: 0.042,
      beta: 2.10,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      exchange: 'NASDAQ',
      sector: 'Software & Cloud',
      fiftyTwoWeekHigh: 468.35,
      fiftyTwoWeekLow: 309.45,
      avgVolume20d: 21000000,
      volatility30d: 0.016,
      beta: 0.95,
    },
  ];

  for (const stock of stocks) {
    await prisma.stockMaster.upsert({
      where: { symbol: stock.symbol },
      update: stock,
      create: stock,
    });
  }

  // 2. Seed Demo User
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@groww.in' },
    update: {
      name: 'Demo Investor',
      passwordHash,
    },
    create: {
      email: 'demo@groww.in',
      name: 'Demo Investor',
      passwordHash,
      // Simulate last visit was 2 days ago to demonstrate change detection out-of-the-box!
      lastVisitAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // 3. Seed Watchlists for Demo User
  const defaultWatchlist = await prisma.watchlist.upsert({
    where: { id: 'demo-watchlist-1' },
    update: { name: 'Tech & High Growth', isDefault: true },
    create: {
      id: 'demo-watchlist-1',
      userId: user.id,
      name: 'Tech & High Growth',
      isDefault: true,
    },
  });

  const secondaryWatchlist = await prisma.watchlist.upsert({
    where: { id: 'demo-watchlist-2' },
    update: { name: 'Bluechip Leaders' },
    create: {
      id: 'demo-watchlist-2',
      userId: user.id,
      name: 'Bluechip Leaders',
      isDefault: false,
    },
  });

  // 4. Add items to Watchlists
  const techSymbols = ['NVDA', 'TCS', 'INFY', 'TSLA', 'AAPL'];
  for (let i = 0; i < techSymbols.length; i++) {
    await prisma.watchlistItem.upsert({
      where: {
        watchlistId_stockSymbol: {
          watchlistId: defaultWatchlist.id,
          stockSymbol: techSymbols[i],
        },
      },
      update: { displayOrder: i },
      create: {
        watchlistId: defaultWatchlist.id,
        stockSymbol: techSymbols[i],
        displayOrder: i,
      },
    });
  }

  const bluechipSymbols = ['RELIANCE', 'HDFCBANK', 'ICICIBANK', 'TATAMOTORS', 'MSFT'];
  for (let i = 0; i < bluechipSymbols.length; i++) {
    await prisma.watchlistItem.upsert({
      where: {
        watchlistId_stockSymbol: {
          watchlistId: secondaryWatchlist.id,
          stockSymbol: bluechipSymbols[i],
        },
      },
      update: { displayOrder: i },
      create: {
        watchlistId: secondaryWatchlist.id,
        stockSymbol: bluechipSymbols[i],
        displayOrder: i,
      },
    });
  }

  // 5. Seed Historical Visit Snapshots (Simulate baseline prices 2 days ago)
  const baselinePrices: Record<string, { price: number; volume: number }> = {
    NIFTY: { price: 24200.00, volume: 500000000 }, // NIFTY baseline price
    NVDA: { price: 122.50, volume: 38000000 },  // NVDA today will be ~132.80 (+8.4% SURGE!)
    TCS: { price: 4210.00, volume: 2900000 },    // TCS today will be near 52w High
    INFY: { price: 1820.00, volume: 4100000 },
    TSLA: { price: 210.00, volume: 72000000 },   // TSLA high volume spike
    AAPL: { price: 224.00, volume: 30000000 },
    RELIANCE: { price: 2980.00, volume: 5800000 },
    HDFCBANK: { price: 1610.00, volume: 8900000 },
    ICICIBANK: { price: 1210.00, volume: 7500000 },
    TATAMOTORS: { price: 980.00, volume: 15000000 }, // Tata Motors jump
    MSFT: { price: 445.00, volume: 20000000 },
  };

  const visitTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  for (const [symbol, data] of Object.entries(baselinePrices)) {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) continue;

    await prisma.userVisitSnapshot.create({
      data: {
        userId: user.id,
        watchlistId: defaultWatchlist.id,
        stockSymbol: symbol,
        price: data.price,
        volume: data.volume,
        volatility: stock.volatility30d,
        fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
        capturedAt: visitTime,
        dataTimestamp: visitTime,
        dataProvider: 'HistoricalBaseline',
        dataConfidence: 1.0,
      },
    });
  }

  console.log('✅ Groww Smart Watchlist Seeded Successfully!');
  console.log('   Demo Email: demo@groww.in');
  console.log('   Demo Password: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
