import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { and, desc, eq, sql } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import { transactions, users, wallets } from "../drizzle/schema";

// Commission % per referrer XP tier (matches TIERS in client/src/lib/tiers.ts)
const COMMISSION_RATES: Record<string, number> = {
  Starter:  0,
  Bronze:   0.05,
  Silver:   0.10,
  Gold:     0.12,
  Platinum: 0.15,
  Diamond:  0.18,
  Dambler:  0.20,
};

function getXpTierName(xp: number): string {
  if (xp >= 200_000) return "Dambler";
  if (xp >= 50_000)  return "Diamond";
  if (xp >= 10_000)  return "Platinum";
  if (xp >= 2_000)   return "Gold";
  if (xp >= 500)     return "Silver";
  if (xp >= 100)     return "Bronze";
  return "Starter";
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase(); // e.g. "A3F9C2B1"
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../../dambler.db");

const client = process.env.DATABASE_URL
  ? createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
  : createClient({ url: `file:${DB_PATH}` });
export const db = drizzle(client);

/** Creates all tables on first run. Safe to call every startup — uses IF NOT EXISTS. */
export async function initDb() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch()),
      lastSignedIn INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      balance REAL NOT NULL DEFAULT 0.0,
      currency TEXT NOT NULL DEFAULT 'DMB',
      totalWagered REAL NOT NULL DEFAULT 0.0,
      totalWon REAL NOT NULL DEFAULT 0.0,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balanceBefore REAL NOT NULL,
      balanceAfter REAL NOT NULL,
      game TEXT,
      description TEXT,
      referenceId TEXT,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_tx_userId ON transactions(userId);
    CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(createdAt DESC);
  `);
  // Safe column additions for existing databases
  for (const stmt of [
    `ALTER TABLE wallets ADD COLUMN xp INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE wallets ADD COLUMN lastXpAt INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE wallets ADD COLUMN pendingCommissionXp REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN referralCode TEXT`,
    `ALTER TABLE users ADD COLUMN referredBy INTEGER`,
    `ALTER TABLE users ADD COLUMN referralBonusAwarded INTEGER NOT NULL DEFAULT 0`,
  ]) {
    try { await client.execute(stmt); } catch { /* column already exists */ }
  }
  // Unique index for referralCode (can't be done via ALTER TABLE in SQLite)
  try {
    await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referralCode ON users(referralCode)`);
  } catch { /* already exists */ }
  console.log("[Database] ready →", process.env.DATABASE_URL ? "Turso (cloud)" : DB_PATH);
}

// ---------------------------------------------------------------------------
// User queries
// ---------------------------------------------------------------------------

export async function createUser(data: {
  username: string;
  email: string;
  passwordHash: string;
  role?: "user" | "admin";
  referredBy?: number;
}) {
  // Generate a unique referral code — retry on collision (extremely rare)
  let referralCode: string;
  while (true) {
    referralCode = generateReferralCode();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, referralCode)).limit(1);
    if (existing.length === 0) break;
  }

  const result = await db.insert(users).values({
    username: data.username,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    role: data.role ?? "user",
    referralCode,
    referredBy: data.referredBy ?? null,
  });
  return Number(result.lastInsertRowid);
}

export async function getUserByReferralCode(code: string) {
  const rows = await db.select().from(users).where(eq(users.referralCode, code.toUpperCase())).limit(1);
  return rows[0] ?? null;
}

export async function getUserById(id: number) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function getUserByUsername(username: string) {
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] ?? null;
}

export async function touchLastSignedIn(userId: number) {
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// ---------------------------------------------------------------------------
// Wallet queries
// ---------------------------------------------------------------------------

export async function createWallet(userId: number) {
  const WELCOME = 1000;
  await db.insert(wallets).values({ userId, balance: WELCOME, currency: "DMB" });
  await db.insert(transactions).values({
    userId,
    type: "bonus",
    amount: WELCOME,
    balanceBefore: 0,
    balanceAfter: WELCOME,
    description: "Welcome bonus — 1,000 DMB on signup",
  });
}

export async function getWallet(userId: number) {
  const rows = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  return rows[0] ?? null;
}

/**
 * Atomically adjusts a user's balance and logs the transaction.
 * Positive amount = credit (win/bonus/deposit). Negative = debit (bet/withdrawal).
 */
export async function adjustBalance(
  userId: number,
  amount: number,
  type: "deposit" | "withdrawal" | "bet" | "win" | "bonus" | "refund",
  description: string,
  game?: string,
  referenceId?: string,
) {
  const wallet = await getWallet(userId);
  if (!wallet) throw new Error("Wallet not found");

  const before = wallet.balance;
  const after = Math.round((before + amount) * 100) / 100;
  if (after < 0) throw new Error("Insufficient balance");

  await db.update(wallets).set({
    balance: after,
    totalWagered: type === "bet" ? Math.round((wallet.totalWagered + Math.abs(amount)) * 100) / 100 : wallet.totalWagered,
    totalWon:     type === "win" ? Math.round((wallet.totalWon + amount) * 100) / 100 : wallet.totalWon,
  }).where(eq(wallets.userId, userId));

  await db.insert(transactions).values({
    userId,
    type,
    amount: Math.abs(amount),
    balanceBefore: before,
    balanceAfter: after,
    game: game ?? null,
    description,
    referenceId: referenceId ?? null,
  });

  return { before, after, currency: wallet.currency };
}

export async function getTransactionHistory(userId: number, limit = 20, cursor?: number) {
  const where = cursor
    ? and(eq(transactions.userId, userId), sql`${transactions.id} < ${cursor}`)
    : eq(transactions.userId, userId);

  const rows = await db.select().from(transactions)
    .where(where)
    .orderBy(desc(transactions.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// ---------------------------------------------------------------------------
// Leaderboard & public queries
// ---------------------------------------------------------------------------

export async function getLeaderboard(limit = 50) {
  return db.select({
    id: users.id,
    username: users.username,
    balance: wallets.balance,
    totalWagered: wallets.totalWagered,
    totalWon: wallets.totalWon,
  })
    .from(wallets)
    .innerJoin(users, eq(wallets.userId, users.id))
    .orderBy(desc(wallets.balance))
    .limit(limit);
}

export async function getRecentWins(limit = 30) {
  return db.select({
    id: transactions.id,
    username: users.username,
    amount: transactions.amount,
    game: transactions.game,
    createdAt: transactions.createdAt,
  })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .where(eq(transactions.type, "win"))
    .orderBy(desc(transactions.id))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// User stats (dashboard)
// ---------------------------------------------------------------------------

export async function getUserStats(userId: number) {
  const wallet = await getWallet(userId);

  const [biggestWinRows, favGameRows, betCountRows, winCountRows, rankRows] = await Promise.all([
    db.select({ amount: transactions.amount, game: transactions.game })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, "win")))
      .orderBy(desc(transactions.amount))
      .limit(1),

    db.select({ game: transactions.game, count: sql<number>`COUNT(*)` })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, "bet"), sql`${transactions.game} IS NOT NULL`))
      .groupBy(transactions.game)
      .orderBy(desc(sql<number>`COUNT(*)`))
      .limit(1),

    db.select({ count: sql<number>`COUNT(*)` })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, "bet"))),

    db.select({ count: sql<number>`COUNT(*)` })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, "win"))),

    db.select({ count: sql<number>`COUNT(*)` })
      .from(wallets)
      .where(sql`${wallets.xp} > ${wallet?.xp ?? 0}`),
  ]);

  const totalBets = Number(betCountRows[0]?.count ?? 0);
  const totalWins = Number(winCountRows[0]?.count ?? 0);

  return {
    balance: wallet?.balance ?? 0,
    totalWagered: wallet?.totalWagered ?? 0,
    totalWon: wallet?.totalWon ?? 0,
    xp: wallet?.xp ?? 0,
    currency: wallet?.currency ?? "DMB",
    createdAt: wallet?.createdAt ?? 0,
    biggestWin: biggestWinRows[0]?.amount ?? 0,
    biggestWinGame: biggestWinRows[0]?.game ?? null,
    favouriteGame: favGameRows[0]?.game ?? null,
    totalBets,
    totalWins,
    winRate: totalBets > 0 ? Math.round((totalWins / totalBets) * 100) : 0,
    xpRank: Number(rankRows[0]?.count ?? 0) + 1,
  };
}

// ---------------------------------------------------------------------------
// XP system
// ---------------------------------------------------------------------------

const XP_PER_ROUND = 1;
const XP_COOLDOWN_SECS = 10;
const BRONZE_THRESHOLD = 100;

/**
 * Awards XP for completing a round. Rate-limited to prevent spam.
 * Also accrues referral commissions to the referrer if one exists.
 */
export async function awardRoundXp(userId: number): Promise<number> {
  const wallet = await getWallet(userId);
  if (!wallet) return 0;

  const nowSecs = Math.floor(Date.now() / 1000);
  if (nowSecs - (wallet.lastXpAt ?? 0) < XP_COOLDOWN_SECS) {
    return wallet.xp ?? 0;
  }

  const oldXp = wallet.xp ?? 0;
  const newXp = oldXp + XP_PER_ROUND;
  await db.update(wallets)
    .set({ xp: newXp, lastXpAt: nowSecs })
    .where(eq(wallets.userId, userId));

  // ── Referral commission ──────────────────────────────────────────────────
  const user = await getUserById(userId);
  if (user?.referredBy) {
    const referrerId = user.referredBy;
    const referrerWallet = await getWallet(referrerId);
    if (referrerWallet) {
      const referrerXp = referrerWallet.xp ?? 0;
      const rate = COMMISSION_RATES[getXpTierName(referrerXp)] ?? 0;

      let commissionGain = 0;

      // 1) Signup bonus: fires once when referred user first crosses Bronze
      if (oldXp < BRONZE_THRESHOLD && newXp >= BRONZE_THRESHOLD && !user.referralBonusAwarded) {
        // Count how many of this referrer's referrals have already qualified
        const qualifiedRows = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(users)
          .where(
            and(
              eq(users.referredBy, referrerId),
              eq(users.referralBonusAwarded, 1),
            ),
          );
        const qualifiedCount = Number(qualifiedRows[0]?.count ?? 0);
        const signupBonus = qualifiedCount < 3 ? 100 : 50;
        commissionGain += signupBonus;

        // Mark bonus as awarded on the referred user
        await db.update(users)
          .set({ referralBonusAwarded: 1 })
          .where(eq(users.id, userId));
      }

      // 2) Ongoing % commission on every XP awarded (only if referred user is Bronze+)
      if (newXp >= BRONZE_THRESHOLD && rate > 0) {
        commissionGain += XP_PER_ROUND * rate;
      }

      if (commissionGain > 0) {
        await db.update(wallets)
          .set({ pendingCommissionXp: (referrerWallet.pendingCommissionXp ?? 0) + commissionGain })
          .where(eq(wallets.userId, referrerId));
      }
    }
  }

  return newXp;
}

// ---------------------------------------------------------------------------
// Affiliate queries
// ---------------------------------------------------------------------------

export async function getAffiliateStats(userId: number) {
  let user = await getUserById(userId);

  // Backfill referral code for accounts created before this system existed
  if (user && !user.referralCode) {
    let code: string;
    while (true) {
      code = generateReferralCode();
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code)).limit(1);
      if (existing.length === 0) break;
    }
    await db.update(users).set({ referralCode: code! }).where(eq(users.id, userId));
    user = await getUserById(userId);
  }

  const wallet = await getWallet(userId);

  // All users referred by this user
  const referrals = await db
    .select({
      id: users.id,
      username: users.username,
      referralBonusAwarded: users.referralBonusAwarded,
      createdAt: users.createdAt,
      xp: wallets.xp,
    })
    .from(users)
    .leftJoin(wallets, eq(wallets.userId, users.id))
    .where(eq(users.referredBy, userId));

  const totalReferred = referrals.length;
  const qualifiedReferrals = referrals.filter(r => (r.xp ?? 0) >= BRONZE_THRESHOLD);

  return {
    referralCode: user?.referralCode ?? null,
    totalReferred,
    qualifiedCount: qualifiedReferrals.length,
    pendingCommissionXp: wallet?.pendingCommissionXp ?? 0,
    referrals: referrals.map(r => ({
      username: r.username,
      xp: r.xp ?? 0,
      qualified: (r.xp ?? 0) >= BRONZE_THRESHOLD,
      joinedAt: r.createdAt,
    })),
  };
}

export async function collectCommission(userId: number): Promise<number> {
  const wallet = await getWallet(userId);
  if (!wallet) return 0;

  const pending = wallet.pendingCommissionXp ?? 0;
  const toCollect = Math.floor(pending);
  if (toCollect <= 0) return 0;

  const newXp = (wallet.xp ?? 0) + toCollect;
  const remainder = pending - toCollect;
  await db.update(wallets)
    .set({ xp: newXp, pendingCommissionXp: remainder })
    .where(eq(wallets.userId, userId));

  return toCollect;
}

export async function getXpLeaderboard(limit = 50) {
  return db.select({
    rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${wallets.xp} DESC)`,
    id: users.id,
    username: users.username,
    xp: wallets.xp,
    totalWagered: wallets.totalWagered,
  })
    .from(wallets)
    .innerJoin(users, eq(wallets.userId, users.id))
    .orderBy(desc(wallets.xp))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Jackpot, race & live stats
// ---------------------------------------------------------------------------

export async function getJackpotAmount() {
  const rows = await db.select({ total: sql<number>`COALESCE(SUM(totalWagered), 0)` }).from(wallets);
  const SEED = 1_000;
  const RATE = 0.001; // 0.1% of all-time wagered feeds the jackpot
  return parseFloat((SEED + Number(rows[0]?.total ?? 0) * RATE).toFixed(2));
}

/**
 * Top wagerers from `since` unix-seconds onward (undefined = all time).
 * Returns username + wagered amount for the period.
 */
export async function getTopWagerersSince(since: number | undefined, limit = 20) {
  const condition = since
    ? and(eq(transactions.type, "bet"), sql`${transactions.createdAt} >= ${since}`)
    : eq(transactions.type, "bet");

  return db.select({
    username: users.username,
    wagered: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
  })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .where(condition)
    .groupBy(transactions.userId)
    .orderBy(desc(sql<number>`SUM(${transactions.amount})`))
    .limit(limit);
}

export async function getLiveStats() {
  const oneHourAgo  = Math.floor(Date.now() / 1000) - 3600;
  const todayStart  = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
  const todayTs     = Math.floor(todayStart.getTime() / 1000);

  const [activeRows, todayRows] = await Promise.all([
    db.select({ count: sql<number>`COUNT(DISTINCT ${transactions.userId})` })
      .from(transactions)
      .where(and(eq(transactions.type, "bet"), sql`${transactions.createdAt} >= ${oneHourAgo}`)),
    db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(eq(transactions.type, "bet"), sql`${transactions.createdAt} >= ${todayTs}`)),
  ]);

  return {
    activeUsers:  Number(activeRows[0]?.count ?? 0),
    wageredToday: Number(todayRows[0]?.total  ?? 0),
  };
}

export async function getLiveFeed(limit = 20) {
  // Fetch recent bet + win transactions together
  const rows = await db.select({
    id: transactions.id,
    userId: transactions.userId,
    username: users.username,
    type: transactions.type,
    amount: transactions.amount,
    balanceBefore: transactions.balanceBefore,
    balanceAfter: transactions.balanceAfter,
    game: transactions.game,
    createdAt: transactions.createdAt,
  })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .where(sql`${transactions.type} IN ('bet', 'win')`)
    .orderBy(desc(transactions.id))
    .limit(limit * 5);

  const result: Array<{
    id: number; username: string; game: string;
    bet: number; payout: number; mult: number | null;
    won: boolean; createdAt: Date;
  }> = [];
  const usedIds = new Set<number>();

  // First pass: match wins to their preceding bets via balance continuity
  for (const row of rows) {
    if (row.type !== "win" || usedIds.has(row.id)) continue;

    const matchBet = rows.find(r =>
      r.type === "bet" &&
      !usedIds.has(r.id) &&
      r.userId === row.userId &&
      r.game === row.game &&
      r.id < row.id &&
      Math.abs(r.balanceAfter - row.balanceBefore) < 0.005,
    );

    usedIds.add(row.id);
    if (matchBet) usedIds.add(matchBet.id);

    result.push({
      id: row.id,
      username: row.username,
      game: row.game ?? "Unknown",
      bet: matchBet?.amount ?? row.amount,
      payout: row.amount,
      mult: matchBet ? parseFloat((row.amount / matchBet.amount).toFixed(2)) : null,
      won: true,
      createdAt: row.createdAt,
    });
  }

  // Second pass: unmatched bets are losses
  for (const row of rows) {
    if (row.type !== "bet" || usedIds.has(row.id)) continue;
    usedIds.add(row.id);
    result.push({
      id: row.id,
      username: row.username,
      game: row.game ?? "Unknown",
      bet: row.amount,
      payout: 0,
      mult: null,
      won: false,
      createdAt: row.createdAt,
    });
  }

  return result.sort((a, b) => b.id - a.id).slice(0, limit);
}
