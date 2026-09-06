import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateWatchlistDto {
  @IsString()
  @IsNotEmpty({ message: 'Watchlist name is required' })
  name: string;
}

export class RenameWatchlistDto {
  @IsString()
  @IsNotEmpty({ message: 'Watchlist name is required' })
  name: string;
}

export class AddStockDto {
  @IsString()
  @IsNotEmpty({ message: 'Stock symbol is required' })
  symbol: string;
}

export class ReorderStocksDto {
  @IsArray()
  @IsString({ each: true })
  symbols: string[];
}
