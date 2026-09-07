import { Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ChangeDetectionService } from './change-detection.service';

@Controller('change-detection')
export class ChangeDetectionController {
  constructor(private readonly changeDetectionService: ChangeDetectionService) {}

  @UseGuards(JwtAuthGuard)
  @Get('snapshots/:watchlistId')
  async getWatchlistSnapshots(@Request() req: any, @Param('watchlistId') watchlistId: string) {
    return this.changeDetectionService.getWatchlistSnapshots(req.user.userId, watchlistId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('watchlist/:watchlistId')
  async getWatchlistChanges(
    @Request() req: any,
    @Param('watchlistId') watchlistId: string,
    @Query('asOfTimestamp') asOfTimestamp?: string
  ) {
    return this.changeDetectionService.getWatchlistChanges(req.user.userId, watchlistId, asOfTimestamp);
  }

  @UseGuards(JwtAuthGuard)
  @Get('compare/:watchlistId')
  async compareWatchlistTimePoints(
    @Request() req: any,
    @Param('watchlistId') watchlistId: string,
    @Query('timeA') timeA: string,
    @Query('timeB') timeB: string
  ) {
    return this.changeDetectionService.compareWatchlistTimePoints(req.user.userId, watchlistId, timeA, timeB);
  }

  @UseGuards(JwtAuthGuard)
  @Post('snapshot/:watchlistId')
  async recordSnapshot(@Request() req: any, @Param('watchlistId') watchlistId: string) {
    await this.changeDetectionService.recordUserVisitSnapshot(req.user.userId, watchlistId);
    return { success: true, message: 'User visit snapshot recorded' };
  }
}
