import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private memoryStore = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`⚡ Connected to Redis at ${host}:${port}`);
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          this.logger.warn(`Redis connection error: ${err.message}. Falling back to memory store.`);
        }
        this.isConnected = false;
      });

      await this.client.connect().catch(() => {
        this.logger.warn('⚠️ Redis connection failed. Operating with in-memory cache fallback.');
        this.isConnected = false;
      });
    } catch {
      this.logger.warn('⚠️ Redis not available. Operating with in-memory cache fallback.');
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        this.isConnected = false;
      }
    }

    // Memory Store Fallback
    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        this.isConnected = false;
      }
    }

    // Memory Store Fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch {
        // ignore
      }
    }
    this.memoryStore.delete(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
