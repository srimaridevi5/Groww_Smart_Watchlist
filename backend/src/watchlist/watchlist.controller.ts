import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { WatchlistService } from './watchlist.service';
import { AddStockDto, CreateWatchlistDto, RenameWatchlistDto } from './dto/watchlist.dto';

@UseGuards(JwtAuthGuard)
@Controller('watchlists')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  async getUserWatchlists(@Request() req: any) {
    return this.watchlistService.getUserWatchlists(req.user.userId);
  }

  @Get('search/stocks')
  async searchStocks(@Query('q') q: string) {
    return this.watchlistService.searchStocks(q);
  }

  @Get(':id')
  async getWatchlistById(@Request() req: any, @Param('id') id: string) {
    return this.watchlistService.getWatchlistById(req.user.userId, id);
  }

  @Post()
  async createWatchlist(@Request() req: any, @Body() dto: CreateWatchlistDto) {
    return this.watchlistService.createWatchlist(req.user.userId, dto);
  }

  @Patch(':id')
  async renameWatchlist(@Request() req: any, @Param('id') id: string, @Body() dto: RenameWatchlistDto) {
    return this.watchlistService.renameWatchlist(req.user.userId, id, dto);
  }

  @Delete(':id')
  async deleteWatchlist(@Request() req: any, @Param('id') id: string) {
    return this.watchlistService.deleteWatchlist(req.user.userId, id);
  }

  @Post(':id/stocks')
  async addStock(@Request() req: any, @Param('id') id: string, @Body() dto: AddStockDto) {
    return this.watchlistService.addStockToWatchlist(req.user.userId, id, dto.symbol);
  }

  @Delete(':id/stocks/:symbol')
  async removeStock(@Request() req: any, @Param('id') id: string, @Param('symbol') symbol: string) {
    return this.watchlistService.removeStockFromWatchlist(req.user.userId, id, symbol);
  }
}
