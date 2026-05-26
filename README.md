# Dambler — Crypto Gambling Platform

A full-stack TypeScript web app built with React (Vite), tRPC, Drizzle ORM, and Express.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS v4   |
| Routing    | Wouter                            |
| UI         | shadcn/ui (Radix UI primitives)   |
| API        | tRPC v11                          |
| Server     | Express + Node.js                 |
| Database   | MySQL via Drizzle ORM             |
| Animations | Framer Motion                     |
| Package manager | pnpm                         |

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=mysql://user:password@localhost:3306/dambler
VITE_OAUTH_PORTAL_URL=https://your-oauth-provider.com
VITE_APP_ID=your-app-id
PORT=3000
```

### 3. Push the database schema

```bash
pnpm db:push
```

### 4. Start the dev server

```bash
pnpm dev
```

The app will be available at **http://localhost:3000**.

---

## Project Structure

```
dambler/
├── client/                  # Frontend (React + Vite)
│   ├── public/              # Static assets
│   └── src/
│       ├── _core/hooks/     # Core hooks (useAuth, etc.)
│       ├── components/      # Shared UI components
│       │   └── ui/          # shadcn/ui primitives (auto-generated)
│       ├── contexts/        # React context providers
│       ├── hooks/           # Custom hooks
│       ├── lib/             # Utilities (cn, trpc client)
│       ├── pages/           # One file per route/page
│       ├── App.tsx          # Route definitions
│       ├── main.tsx         # React entry point
│       └── index.css        # Global styles & design tokens
│
├── server/                  # Backend (Express + tRPC)
│   ├── _core/               # tRPC setup, auth, cookies, DB context
│   ├── index.ts             # Express server entry point
│   ├── routers.ts           # tRPC router definitions
│   ├── db.ts                # Drizzle DB connection
│   └── storage.ts           # File/asset storage helpers
│
├── shared/                  # Code shared between client and server
│   ├── _core/errors.ts      # Shared error types
│   ├── const.ts             # Shared constants
│   └── types.ts             # Shared TypeScript types
│
├── drizzle/                 # Database schema & migrations
│   ├── schema.ts            # Table definitions
│   ├── relations.ts         # Drizzle relation helpers
│   └── migrations/          # Auto-generated SQL migrations
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── drizzle.config.ts
```

---

## Adding a New Page

1. Create `client/src/pages/MyPage.tsx`
2. Register the route in `client/src/App.tsx`

## Adding a New API Route

1. Add a new router in `server/routers.ts`
2. The type is automatically shared with the client via `AppRouter`

## Adding a New Game

1. Create `client/src/pages/MyGame.tsx`
2. Add `mygame: "/my-game"` to `GAME_ROUTES` in `GameCard.tsx`
3. Register the route in `App.tsx`
