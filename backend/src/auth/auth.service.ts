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
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email, user.name);

    return {
      user: { id: user.id, email: user.email, name: user.name, lastVisitAt: user.lastVisitAt },
      token,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return { id: user.id, email: user.email, name: user.name, lastVisitAt: user.lastVisitAt };
  }

  private generateToken(userId: string, email: string, name: string): string {
    return this.jwtService.sign({ sub: userId, email, name });
  }
}
