import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';

@Injectable()
export class QuoteSyncProcessor implements OnModuleInit {
  private readonly logger = new Logger(QuoteSyncProcessor.name);

  constructor(
    private prisma: PrismaService,
    private marketDataService: MarketDataService,
  ) {}

  onModuleInit() {
    this.logger.log('⏱️ Background Quote Sync Job Processor initialized.');
    // Run initial sync check
    setTimeout(() => this.syncWatchlistQuotes(), 3000);
  }

  async syncWatchlistQuotes() {
    try {
      const items = await this.prisma.watchlistItem.findMany({
        select: { stockSymbol: true },
        distinct: ['stockSymbol'],
      });

      if (items.length === 0) return;

      const symbols = items.map((i) => i.stockSymbol);
      const quotes = await this.marketDataService.getQuotes(symbols);
      
      this.logger.log(`⚡ Background Sync refreshed ${Object.keys(quotes).length} stock quotes.`);
    } catch (err: any) {
      this.logger.error(`Quote sync background job failed: ${err.message}`);
    }
  }
}
