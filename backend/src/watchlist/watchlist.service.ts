import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { CreateWatchlistDto, RenameWatchlistDto } from './dto/watchlist.dto';

@Injectable()
export class WatchlistService {
  constructor(
    private prisma: PrismaService,
    private marketDataService: MarketDataService,
  ) {}

  async getUserWatchlists(userId: string) {
    let watchlists = await this.prisma.watchlist.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Auto-create a default watchlist if the user has none
    if (watchlists.length === 0) {
      const defaultWatchlist = await this.prisma.watchlist.create({
        data: {
          userId,
          name: 'My Watchlist',
          isDefault: true,
          items: {
            create: [
              { stockSymbol: 'RELIANCE', displayOrder: 0 },
              { stockSymbol: 'TCS', displayOrder: 1 },
              { stockSymbol: 'HDFCBANK', displayOrder: 2 },
            ],
          },
        },
        include: {
          items: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
      watchlists = [defaultWatchlist];
    }

    return watchlists;
  }

  async getWatchlistById(userId: string, watchlistId: string) {
    let watchlist = await this.prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!watchlist) {
      // Fallback to first watchlist for this user
      watchlist = await this.prisma.watchlist.findFirst({
        where: { userId },
        include: {
          items: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    }

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    // Attach latest live quote to each item
    const symbols = watchlist.items.map((i) => i.stockSymbol);
    const quotes = await this.marketDataService.getQuotes(symbols);

    const itemsWithQuotes = watchlist.items.map((item) => ({
      ...item,
      quote: quotes[item.stockSymbol] || null,
    }));

    return {
      ...watchlist,
      items: itemsWithQuotes,
    };
  }

  async createWatchlist(userId: string, dto: CreateWatchlistDto) {
    const existing = await this.prisma.watchlist.findFirst({
      where: { userId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Watchlist with name "${dto.name}" already exists`);
    }

    const count = await this.prisma.watchlist.count({ where: { userId } });

    return this.prisma.watchlist.create({
      data: {
        userId,
        name: dto.name,
        isDefault: count === 0,
      },
    });
  }

  async renameWatchlist(userId: string, watchlistId: string, dto: RenameWatchlistDto) {
    const watchlist = await this.prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
    });

    if (!watchlist) throw new NotFoundException('Watchlist not found');

    return this.prisma.watchlist.update({
      where: { id: watchlistId },
      data: { name: dto.name },
    });
  }

  async deleteWatchlist(userId: string, watchlistId: string) {
    const watchlist = await this.prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
    });

    if (!watchlist) throw new NotFoundException('Watchlist not found');

    await this.prisma.watchlist.delete({ where: { id: watchlistId } });
    return { success: true, message: 'Watchlist deleted successfully' };
  }

  async addStockToWatchlist(userId: string, watchlistId: string, symbol: string) {
    let watchlist = await this.prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
    });

    if (!watchlist) {
      watchlist = await this.prisma.watchlist.findFirst({
        where: { userId },
      });
    }

    if (!watchlist) {
      watchlist = await this.prisma.watchlist.create({
        data: {
          userId,
          name: 'My Watchlist',
          isDefault: true,
        },
      });
    }

    const targetWatchlistId = watchlist.id;
    const formattedSymbol = symbol.trim().toUpperCase();

    // 1. Check for Duplicate Additions explicitly
    const existingItem = await this.prisma.watchlistItem.findUnique({
      where: {
        watchlistId_stockSymbol: {
          watchlistId: targetWatchlistId,
          stockSymbol: formattedSymbol,
        },
      },
    });

    if (existingItem) {
      throw new ConflictException(`Stock ${formattedSymbol} is already in this watchlist`);
    }

    // 2. Fetch or create StockMaster
    let stockMaster = await this.prisma.stockMaster.findUnique({
      where: { symbol: formattedSymbol },
    });

    if (!stockMaster) {
      const quote = await this.marketDataService.getQuote(formattedSymbol);
      stockMaster = await this.prisma.stockMaster.create({
        data: {
          symbol: formattedSymbol,
          name: quote.name || `${formattedSymbol} Stock`,
          exchange: 'NSE',
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
          avgVolume20d: quote.avgVolume20d,
        },
      });
    }

    const maxOrder = await this.prisma.watchlistItem.aggregate({
      where: { watchlistId: targetWatchlistId },
      _max: { displayOrder: true },
    });

    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    return this.prisma.watchlistItem.create({
      data: {
        watchlistId: targetWatchlistId,
        stockSymbol: formattedSymbol,
        displayOrder: nextOrder,
      },
    });
  }

  async removeStockFromWatchlist(userId: string, watchlistId: string, symbol: string) {
    let watchlist = await this.prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
    });

    if (!watchlist) {
      watchlist = await this.prisma.watchlist.findFirst({
        where: { userId },
      });
    }

    if (!watchlist) throw new NotFoundException('Watchlist not found');

    const formattedSymbol = symbol.trim().toUpperCase();

    await this.prisma.watchlistItem.deleteMany({
      where: {
        watchlistId: watchlist.id,
        stockSymbol: formattedSymbol,
      },
    });

    return { success: true, message: `Removed ${formattedSymbol} from watchlist` };
  }

  async searchStocks(query: string) {
    if (!query || query.trim().length === 0) {
      return this.prisma.stockMaster.findMany({ take: 10 });
    }

    const q = query.trim().toUpperCase();
    return this.prisma.stockMaster.findMany({
      where: {
        OR: [
          { symbol: { contains: q } },
          { name: { contains: query } },
        ],
      },
      take: 15,
    });
  }
}
