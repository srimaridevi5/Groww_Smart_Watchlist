import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        lastVisitAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Default last visit 1 day ago
      },
    });

    // Create default watchlist for new user
    const defaultWatchlist = await this.prisma.watchlist.create({
      data: {
        userId: user.id,
        name: 'My First Watchlist',
        isDefault: true,
      },
    });

    // Seed default stocks into initial watchlist
    const defaultSymbols = ['NVDA', 'RELIANCE', 'TCS', 'AAPL'];
    for (let i = 0; i < defaultSymbols.length; i++) {
      await this.prisma.watchlistItem.create({
        data: {
          watchlistId: defaultWatchlist.id,
          stockSymbol: defaultSymbols[i],
          displayOrder: i,
        },
      });
    }

    const token = this.generateToken(user.id, user.email, user.name);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    let user: any = null;

    try {
      user = await this.prisma.user.findUnique({ where: { email } });
    } catch {
      // Fallback for serverless environments where DB file is non-persistent
    }

    if (user) {
      const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
      if (validPassword) {
        const token = this.generateToken(user.id, user.email, user.name);
        return {
          user: { id: user.id, email: user.email, name: user.name, lastVisitAt: user.lastVisitAt },
          token,
        };
      }
    }

    // Demo user fallback for Vercel / serverless deployments (demo@groww.in)
    if (email === 'demo@groww.in' && (dto.password === 'password123' || dto.password === 'password')) {
      const demoId = 'demo-user-id-12345';
      const token = this.generateToken(demoId, 'demo@groww.in', 'Demo Investor');
      return {
        user: {
          id: demoId,
          email: 'demo@groww.in',
          name: 'Demo Investor',
          lastVisitAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        token,
      };
    }

    throw new UnauthorizedException('Invalid email or password');
  }

  async getCurrentUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        return { id: user.id, email: user.email, name: user.name, lastVisitAt: user.lastVisitAt };
      }
    } catch {
      // Fallback
    }

    if (userId === 'demo-user-id-12345') {
      return {
        id: 'demo-user-id-12345',
        email: 'demo@groww.in',
        name: 'Demo Investor',
        lastVisitAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    throw new UnauthorizedException('User not found');
  }

  private generateToken(userId: string, email: string, name: string): string {
    return this.jwtService.sign({ sub: userId, email, name });
  }

}
