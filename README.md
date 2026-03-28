# IPL 2026 Picks Engine

A full-stack fantasy prediction app for IPL 2026 where a private group of friends predict match winners, track scores on a live leaderboard, and compete across the season.

---

## System Design

```
                         +---------------------+
                         |    Railway (Host)    |
                         |                     |
+------------+           |  +---------------+  |           +----------------+
|            |  HTTPS    |  |   Next.js 16  |  |  TCP/SSL  |                |
|  Browser / +----------->  |   App Router  +------------>  |  Neon.tech     |
|  Mobile    |           |  |               |  |           |  PostgreSQL    |
|  (PWA)     <-----------+  | - API Routes  |  <----------+  (Serverless)  |
|            |  JSON     |  | - SSR Pages   |  |  Prisma   |                |
+------------+           |  | - Middleware  |  |           +----------------+
                         |  +-------+-------+  |
                         |          |          |
                         |  +-------v-------+  |
                         |  |   NextAuth    |  |
                         |  |   JWT Auth    |  |
                         |  +---------------+  |
                         +---------------------+
```

### Architecture Blocks

| Block | Technology | Role |
|-------|-----------|------|
| **Frontend** | Next.js 16 + React 19 + Tailwind CSS | Server-rendered pages, client-side interactivity |
| **UI Components** | shadcn/ui + Radix UI | Accessible, themed component library |
| **Authentication** | NextAuth v5 (Credentials) | Username/password login, JWT sessions, no OAuth |
| **API Layer** | Next.js API Routes | RESTful endpoints for picks, matches, leaderboard |
| **ORM** | Prisma 5 | Type-safe database queries, schema migrations |
| **Database** | PostgreSQL on Neon.tech | Serverless Postgres with connection pooling |
| **Hosting** | Railway | Auto-deploy from GitHub, environment management |
| **Middleware** | Next.js Edge Middleware | Route protection, auth gating, admin checks |

---

## How It Works

```
Register --> Admin Approves --> Browse Matches --> Make Picks --> Results Update --> Leaderboard
```

1. **User registers** with username + password (no OAuth, no email verification)
2. **Admin approves** the user from the Admin panel
3. **User browses** the full 70-match IPL schedule grouped by date
4. **User picks** a winner for each match before it starts (lock at match time, server-enforced)
5. **Admin sets results** (or future CricAPI auto-sync) after matches complete
6. **Leaderboard updates** with rankings visible to all approved users

---

## Data Model

```
+------------------+       +------------------+       +------------------+
|      User        |       |      Pick        |       |   MatchResult    |
+------------------+       +------------------+       +------------------+
| id (cuid)        |<---+  | id (cuid)        |       | matchId (int) PK |
| username (unique)|    |  | userId      FK --+-------| winner           |
| password (bcrypt)|    +--| matchId          |       | status           |
| displayName      |       | teamPick         |       | updatedAt        |
| approved         |       | isCorrect        |       +------------------+
| isAdmin          |       | createdAt        |
| createdAt        |       | updatedAt        |
+------------------+       +------------------+
                           (unique: userId+matchId)
```

---

## Key Features

- **Simple Auth** -- Username/password with persistent JWT sessions. No Google OAuth, no re-login hassle.
- **Admin-Controlled Access** -- Users register and wait for admin approval before accessing matches.
- **Per-Match Lock** -- Picks lock at match start time (server-side enforced via UTC comparison).
- **Live Leaderboard** -- Ranked by correct picks with accuracy bars, podium for top 3, auto-refresh.
- **Dashboard View** -- Matches accumulate as the season progresses with running stats (correct, accuracy, streak).
- **Admin Panel** -- Approve/reject users, set match results, override winners.
- **Mobile-First** -- Responsive design with bottom tab nav on mobile, top nav on desktop.
- **Team Colors** -- All 10 IPL teams with brand colors throughout the UI.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Auth | NextAuth v5 (beta) -- JWT strategy, Credentials provider |
| ORM | Prisma 5 |
| Database | PostgreSQL via [Neon.tech](https://neon.tech/) (serverless) |
| Hosting | [Railway](https://railway.app/) (auto-deploy from GitHub) |
| Password Hashing | bcryptjs |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Login page
│   ├── register/page.tsx           # Registration
│   ├── pending/page.tsx            # Awaiting approval
│   ├── (protected)/                # Auth-gated routes
│   │   ├── matches/page.tsx        # Match schedule + pick UI
│   │   ├── leaderboard/page.tsx    # Rankings
│   │   ├── stats/page.tsx          # Personal stats
│   │   └── admin/page.tsx          # User & result management
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handler
│       ├── auth/register/          # User registration
│       ├── matches/                # Match data (schedule + results + picks)
│       ├── picks/                  # Submit/update picks
│       ├── leaderboard/            # Ranked standings
│       ├── stats/                  # Personal statistics
│       └── admin/                  # Approve users, override results
├── components/                     # UI components (match-card, nav-bar, etc.)
├── data/schedule.ts                # 70 IPL matches hardcoded from official PDF
├── lib/
│   ├── auth.ts                     # NextAuth config
│   ├── db.ts                       # Prisma client singleton
│   └── utils.ts                    # Date formatting, helpers
└── middleware.ts                   # Route protection (Edge-compatible)
```

---

## Infrastructure

### Neon.tech (Database)

- **Serverless PostgreSQL** -- scales to zero when idle, no fixed monthly cost
- **Connection pooling** built-in for serverless environments
- Connection string format: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`
- Prisma connects via the pooled connection URL

### Railway (Hosting)

- **Auto-deploys** on every push to `main` branch via GitHub integration
- Environment variables managed in Railway's Variables tab
- Build command: `prisma generate && next build` (no DB access needed at build time)
- Start command: `prisma db push && next start` (schema sync happens at runtime when DATABASE_URL is available)
- Handles HTTPS/SSL termination automatically

### Why This Stack?

| Decision | Reason |
|----------|--------|
| Neon over Railway Postgres | Free tier, serverless scaling, no always-on cost |
| JWT over DB sessions | Works in Edge Runtime (middleware), no Prisma calls on every request |
| `getToken()` in middleware | Prisma can't run in Edge Runtime -- `getToken` reads JWT directly from cookie |
| `prisma db push` in start script | DATABASE_URL isn't available during Railway's build phase |
| No OAuth | Simple private app for friends -- username/password with admin approval is enough |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon.tech PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for signing JWTs |
| `NEXTAUTH_URL` | Public URL of the deployed app |
| `ADMIN_USERNAMES` | Comma-separated admin usernames (e.g. `saimanish,balaram`) |

---

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and secrets

# Generate Prisma client + push schema
npx prisma generate
npx prisma db push

# Start dev server
npm run dev
```

---

## Deployment (Railway + Neon)

1. **Create a Neon.tech project** -- get the PostgreSQL connection string
2. **Create a Railway project** -- connect your GitHub repo
3. **Add environment variables** in Railway's Variables tab:
   - `DATABASE_URL` = Neon connection string (with `?sslmode=require`)
   - `NEXTAUTH_SECRET` = any random string
   - `NEXTAUTH_URL` = your Railway public domain (e.g. `https://app-production-xxxx.up.railway.app`)
   - `ADMIN_USERNAMES` = `saimanish,balaram`
4. **Generate a domain** in Railway: Settings > Networking > Generate Domain
5. **Push to main** -- Railway auto-builds and deploys

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| GET | `/api/matches` | All matches with results and user picks |
| GET/POST | `/api/picks` | Get or submit a pick |
| GET | `/api/picks/all` | All users' picks for completed matches |
| GET | `/api/leaderboard` | Ranked leaderboard |
| GET | `/api/stats` | Personal statistics |
| GET | `/api/admin/users` | List all users (admin) |
| POST | `/api/admin/approve` | Toggle user approval (admin) |
| POST | `/api/admin/results/override` | Set match winner (admin) |

---

Built for IPL 2026 season -- 70 league matches + 4 playoffs.
