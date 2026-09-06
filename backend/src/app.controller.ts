import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'online',
      service: 'Groww Smart Watchlist Backend API',
      version: 'v1',
      timestamp: new Date().toISOString(),
      frontendUrl: 'http://localhost:3000',
      availableEndpoints: [
        'POST /api/v1/auth/login',
        'POST /api/v1/auth/register',
        'GET /api/v1/watchlists',
        'GET /api/v1/market-data/quote/:symbol',
        'GET /api/v1/change-detection/watchlist/:id',
      ],
    };
  }
}
