import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ChangeDetectionService } from './change-detection.service';

@Controller('change-detection')
export class ChangeDetectionController {
  constructor(private readonly changeDetectionService: ChangeDetectionService) {}

  @UseGuards(JwtAuthGuard)
  @Get('watchlist/:watchlistId')
  async getWatchlistChanges(@Request() req: any, @Param('watchlistId') watchlistId: string) {
    return this.changeDetectionService.getWatchlistChanges(req.user.userId, watchlistId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('snapshot/:watchlistId')
  async recordSnapshot(@Request() req: any, @Param('watchlistId') watchlistId: string) {
    await this.changeDetectionService.recordUserVisitSnapshot(req.user.userId, watchlistId);
    return { success: true, message: 'User visit snapshot recorded' };
  }
}
