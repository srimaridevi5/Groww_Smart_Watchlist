# Groww Smart Market Watchlist MVP

A full-stack, production-quality Smart Market Watchlist application built for Groww. The system detects and surfaces **meaningful stock changes since a user's last visit**, comparing live market quotes against historical visit snapshots, calculating a normalized 0–1 change severity score, and providing human-readable technical reasoning.

---

## Key Architecture & Product Decisions

### 1. Change Detection Engine (Normalized 0.00 – 1.00 Score)
To avoid combining signals with disparate scales (percentage movement, volume ratios, Z-scores), each indicator is normalized into a $[0.00, 1.00]$ range before calculating the weighted score:

$$\text{ChangeScore} = 0.40 \cdot S_{\text{Price}} + 0.25 \cdot S_{\text{Volume}} + 0.20 \cdot S_{\text{Volatility}} + 0.15 \cdot S_{\text{Technical}}$$

#### Sub-Score Normalization Rules:
- **Price Score ($S_{\text{Price}}$)**: $\min(1.0, |\Delta P_{\text{visit}}\%| / 10.0)$ (10% move yields max score 1.0).
- **Volume Score ($S_{\text{Volume}}$)**: $\min(1.0, \max(0.0, ((V / V_{\text{20avg}}) - 1.0) / 3.0))$.
- **Volatility Score ($S_{\text{Volatility}}$)**: $\min(1.0, \max(0.0, Z_{\text{volatility}} / 3.0))$.
- **Technical Score ($S_{\text{Technical}}$)**: Breakout (`1.0`), Near Threshold (`0.6`), Neutral (`0.0`).

#### Severity Tiers:
- **`0.80 – 1.00` (High Attention)**: High-priority glowing purple/pink banner (e.g. `Surge +8.4% on 2.4x Vol`).
- **`0.60 – 0.80` (Significant)**: Highlighted active movement card (`Significant`).
- **`0.30 – 0.60` (Noteworthy)**: Mild attention indicator.
- **`0.00 – 0.30` (Normal)**: Standard baseline tick.

---

### 2. 4-Tier 52-Week Technical Signals
Distinguishes near-threshold proximity from actual price breakouts:
- `NEW_52W_HIGH`: Breakout above 52-Week High.
- `NEW_52W_LOW`: Breakdown below 52-Week Low.
- `NEAR_52W_HIGH`: Within 2.0% of 52-Week High.
- `NEAR_52W_LOW`: Within 2.0% of 52-Week Low.

---

### 3. Quote Resolver & Data Confidence Modeling
Every market quote carries explicit confidence and freshness metadata:
- **`0.98` Live**: Real-time streaming API quote.
- **`0.72` Delayed**: 15-minute delayed market feed.
- **`0.35` Stale**: Quote older than 1 hour.
- **`0.10` Mock**: Synthetic fallback tick.

#### Multi-Provider Conflict Resolution:
The `QuoteResolverService` aggregates candidates across providers (`TwelveData`, `AlphaVantage`, `Mock`). It prefers fresher timestamps and higher-priority providers. If price divergence between sources exceeds **3.0%**, the system reduces quote confidence and flags a warning badge.

---

### 4. Historical `UserVisitSnapshot` Model
Answers *"Why did this stock change since THIS user last visited?"*:
The system captures full snapshot context (`price`, `volume`, `volatility`, `fiftyTwoWeekHigh`, `fiftyTwoWeekLow`, `capturedAt`, `dataProvider`, `dataConfidence`) per user visit.

---

### 5. Architectural Trade-offs & Scalability
- **Redis 5s TTL Cache**: Live quotes are cached in Redis (with in-memory map fallback) to handle 1,000+ concurrent users without hitting third-party rate limits.
- **Batch Quote Fetching**: Watchlist items are fetched via batch requests rather than N individual calls.
- **Kubernetes Deferred Intentionally**: Docker Compose is provided for reproducible local development and containerization. Kubernetes orchestration is deferred until traffic scale and multi-region deployment justify cluster complexity.

---

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, TanStack Query v5, Recharts, Lucide Icons, Groww visual design system.
- **Backend**: Node.js, NestJS, TypeScript, Passport JWT Authentication, class-validator DTOs, Vitest.
- **Database**: PostgreSQL with Prisma ORM (includes zero-config SQLite fallback).
- **Cache & Jobs**: Redis with in-memory fallback, BullMQ background processors.
- **Containers**: Docker Compose.

---

##  Quick Start Guide (VS Code Local Execution)

### Prerequisites
- Node.js v18.0+ or v20.0+
- npm v9+ or pnpm

### Step 1: Install Dependencies
From the workspace root, run:
```bash
# Powershell / Terminal
npm run setup
```
Or manually install:
```bash
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### Step 2: Set Environment Variables
The repository includes pre-configured `.env` and `.env.example` files in both the root directory and `backend/`.

### Step 3: Initialize Database & Seed Demo Data

#### Option A: Zero-Dependency Local SQLite Mode (No Postgres required)
```bash
npm run setup:sqlite
```
This automatically generates the Prisma Client, creates a local `dev.db` SQLite database file, and seeds all initial stock metadata, demo watchlists, and demo user (`demo@groww.in`).

#### Option B: PostgreSQL Mode (via Docker Compose or Local Postgres)
Start PostgreSQL via Docker Compose:
```bash
docker compose up -d postgres redis
```
Then run Prisma setup for PostgreSQL:
```bash
npm run prisma:setup
```

Both options seed the database with:
- **Demo Email**: `demo@groww.in`
- **Demo Password**: `Password123!`

### Step 4: Run Development Servers
```bash
npm run dev
```
This starts both servers concurrently:
- **Backend REST API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Frontend App**: [http://localhost:3000](http://localhost:3000)

---

## Option B: Run via Docker Compose

To spin up PostgreSQL, Redis, Backend, and Frontend in containers:
```bash
docker compose up --build
```

---

## Running Tests

Run backend unit tests for Change Detection scoring and Quote Resolver:
```bash
npm run test
```

---

## Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user & get JWT token |
| `POST` | `/api/v1/auth/register` | Register user & initialize default watchlist |
| `GET` | `/api/v1/watchlists` | Get user watchlists |
| `GET` | `/api/v1/watchlists/:id` | Get watchlist with live quotes attached |
| `POST` | `/api/v1/watchlists/:id/stocks` | Add stock to watchlist (enforces duplicate check) |
| `DELETE` | `/api/v1/watchlists/:id/stocks/:sym` | Remove stock from watchlist |
| `GET` | `/api/v1/change-detection/watchlist/:id` | **Compute normalized change signals since last visit** |
| `POST` | `/api/v1/change-detection/snapshot/:id` | **Record user visit baseline snapshot** |
| `GET` | `/api/v1/market-data/quote/:symbol` | Fetch live market quote |
| `GET` | `/api/v1/market-data/history/:symbol` | Fetch 30-day historical chart candles |
