import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { and, desc, eq, ne, sql, gt, lt, or } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import { adminLogs, bugReports, chatMessages, contactSubmissions, gameToggles, siteConfig, suspiciousActivity, transactions, userNotes, users, wallets } from "../drizzle/schema";

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

if (process.env.DATABASE_URL) {
  console.log(`[DB] Connecting to Turso: ${process.env.DATABASE_URL.slice(0, 40)}...`);
} else {
  console.log(`[DB] No DATABASE_URL set — using local SQLite file: ${DB_PATH}`);
}

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
    `ALTER TABLE users ADD COLUMN bannedAt INTEGER`,
    `ALTER TABLE users ADD COLUMN banReason TEXT`,
    `ALTER TABLE users ADD COLUMN lastIp TEXT`,
  ]) {
    try { await client.execute(stmt); } catch { /* column already exists */ }
  }
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS suspicious_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      details TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      dismissed INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_sus_userId ON suspicious_activity(userId);
    CREATE INDEX IF NOT EXISTS idx_sus_dismissed ON suspicious_activity(dismissed);
    CREATE TABLE IF NOT EXISTS bug_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'bug',
      description TEXT NOT NULL,
      attachments TEXT NOT NULL DEFAULT '[]',
      videoUrl TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      adminNote TEXT,
      xpAwarded INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_bug_userId ON bug_reports(userId);
    CREATE INDEX IF NOT EXISTS idx_bug_status ON bug_reports(status);
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      createdAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adminId INTEGER NOT NULL,
      adminUsername TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      targetUserId INTEGER,
      targetUsername TEXT,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(createdAt DESC);
    CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS game_toggles (
      gameId TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS user_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      adminId INTEGER NOT NULL,
      adminUsername TEXT NOT NULL,
      note TEXT NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_user_notes_userId ON user_notes(userId);
  `);
  for (const stmt of [
    `ALTER TABLE users ADD COLUMN chatMuted INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN chatMutedUntil INTEGER`,
    `ALTER TABLE chat_messages ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0`,
  ]) {
    try { await client.execute(stmt); } catch { /* already exists */ }
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

export async function getPublicStats() {
  const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
  const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
  const todayTs    = Math.floor(todayStart.getTime() / 1000);

  const [totalUsersRows, activeRows, todayRows, allTimeRows] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users).where(ne(users.role, 'admin')),
    db.select({ count: sql<number>`COUNT(DISTINCT ${transactions.userId})` })
      .from(transactions)
      .where(and(eq(transactions.type, "bet"), sql`${transactions.createdAt} >= ${oneHourAgo}`)),
    db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(eq(transactions.type, "bet"), sql`${transactions.createdAt} >= ${todayTs}`)),
    db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(eq(transactions.type, "bet")),
  ]);

  return {
    totalUsers:    Number(totalUsersRows[0]?.count ?? 0),
    activeUsers:   Number(activeRows[0]?.count ?? 0),
    wageredToday:  Number(todayRows[0]?.total ?? 0),
    wageredAllTime: Number(allTimeRows[0]?.total ?? 0),
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

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export async function adminGetAllUsers(opts: { search?: string; page?: number; limit?: number; onlyBanned?: boolean }) {
  const { search, page = 1, limit = 50, onlyBanned = false } = opts;
  const offset = (page - 1) * limit;

  const rows = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    bannedAt: users.bannedAt,
    banReason: users.banReason,
    lastIp: users.lastIp,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
    balance: wallets.balance,
    totalWagered: wallets.totalWagered,
    totalWon: wallets.totalWon,
    xp: wallets.xp,
  })
    .from(users)
    .leftJoin(wallets, eq(wallets.userId, users.id))
    .where(
      and(
        onlyBanned ? sql`${users.bannedAt} IS NOT NULL` : undefined,
        search
          ? or(
              sql`${users.username} LIKE ${'%' + search + '%'}`,
              sql`${users.email} LIKE ${'%' + search + '%'}`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const countRows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(
      and(
        onlyBanned ? sql`${users.bannedAt} IS NOT NULL` : undefined,
        search
          ? or(
              sql`${users.username} LIKE ${'%' + search + '%'}`,
              sql`${users.email} LIKE ${'%' + search + '%'}`,
            )
          : undefined,
      ),
    );

  return { rows, total: Number(countRows[0]?.count ?? 0) };
}

export async function adminBanUser(userId: number, reason: string) {
  await db.update(users)
    .set({ bannedAt: new Date(), banReason: reason })
    .where(eq(users.id, userId));
}

export async function adminUnbanUser(userId: number) {
  await db.update(users)
    .set({ bannedAt: null, banReason: null })
    .where(eq(users.id, userId));
}

export async function adminSetPassword(userId: number, newPasswordHash: string) {
  await db.update(users)
    .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function adminAwardXp(userId: number, amount: number) {
  const wallet = await getWallet(userId);
  if (!wallet) throw new Error("Wallet not found");
  const newXp = Math.max(0, (wallet.xp ?? 0) + amount);
  await db.update(wallets)
    .set({ xp: newXp })
    .where(eq(wallets.userId, userId));
}

export async function adminAdjustBalance(userId: number, amount: number, note: string) {
  const type = amount >= 0 ? "bonus" as const : "withdrawal" as const;
  return adjustBalance(userId, amount, type, note ?? (amount >= 0 ? "Admin credit" : "Admin deduction"));
}

export async function adminGetAllTransactions(opts: {
  search?: string;
  game?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  const { search, game, type, page = 1, limit = 50 } = opts;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (game) conditions.push(eq(transactions.game, game));
  if (type) conditions.push(eq(transactions.type, type as "bet" | "win" | "bonus" | "deposit" | "withdrawal" | "refund"));
  if (search) conditions.push(sql`${users.username} LIKE ${'%' + search + '%'}`);

  const rows = await db.select({
    id: transactions.id,
    userId: transactions.userId,
    username: users.username,
    type: transactions.type,
    amount: transactions.amount,
    balanceBefore: transactions.balanceBefore,
    balanceAfter: transactions.balanceAfter,
    game: transactions.game,
    description: transactions.description,
    createdAt: transactions.createdAt,
  })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.id))
    .limit(limit)
    .offset(offset);

  const countRows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return { rows, total: Number(countRows[0]?.count ?? 0) };
}

export async function adminGetDashboardStats() {
  const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
  const todayTs = Math.floor(todayStart.getTime() / 1000);
  const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;

  const [
    totalUsersRows,
    activeUsersRows,
    wageredTodayRows,
    wageredAllTimeRows,
    wonAllTimeRows,
    recentRows,
    bannedRows,
    flagsRows,
  ] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users).where(ne(users.role, 'admin')),
    db.select({ count: sql<number>`COUNT(DISTINCT ${transactions.userId})` })
      .from(transactions)
      .where(and(eq(transactions.type, "bet"), sql`${transactions.createdAt} >= ${oneHourAgo}`)),
    db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(eq(transactions.type, "bet"), sql`${transactions.createdAt} >= ${todayTs}`)),
    db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions).where(eq(transactions.type, "bet")),
    db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions).where(eq(transactions.type, "win")),
    db.select({
      id: transactions.id,
      username: users.username,
      type: transactions.type,
      amount: transactions.amount,
      game: transactions.game,
      createdAt: transactions.createdAt,
    })
      .from(transactions)
      .innerJoin(users, eq(transactions.userId, users.id))
      .where(sql`${transactions.type} IN ('bet','win')`)
      .orderBy(desc(transactions.id))
      .limit(20),
    db.select({ count: sql<number>`COUNT(*)` }).from(users).where(sql`${users.bannedAt} IS NOT NULL`),
    db.select({ count: sql<number>`COUNT(*)` }).from(suspiciousActivity).where(eq(suspiciousActivity.dismissed, 0)),
  ]);

  const totalWagered = Number(wageredAllTimeRows[0]?.total ?? 0);
  const totalWon = Number(wonAllTimeRows[0]?.total ?? 0);

  return {
    totalUsers: Number(totalUsersRows[0]?.count ?? 0),
    activeUsers: Number(activeUsersRows[0]?.count ?? 0),
    wageredToday: Number(wageredTodayRows[0]?.total ?? 0),
    totalWagered,
    totalWon,
    houseProfit: parseFloat((totalWagered - totalWon).toFixed(2)),
    bannedUsers: Number(bannedRows[0]?.count ?? 0),
    openFlags: Number(flagsRows[0]?.count ?? 0),
    recentActivity: recentRows,
  };
}

export async function adminGetGameStats() {
  const rows = await db.select({
    game: transactions.game,
    totalBets: sql<number>`COUNT(CASE WHEN ${transactions.type} = 'bet' THEN 1 END)`,
    totalWagered: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'bet' THEN ${transactions.amount} ELSE 0 END), 0)`,
    totalWon: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'win' THEN ${transactions.amount} ELSE 0 END), 0)`,
  })
    .from(transactions)
    .where(sql`${transactions.game} IS NOT NULL`)
    .groupBy(transactions.game)
    .orderBy(desc(sql<number>`SUM(CASE WHEN ${transactions.type} = 'bet' THEN ${transactions.amount} ELSE 0 END)`));

  return rows.map(r => ({
    game: r.game ?? "Unknown",
    totalBets: Number(r.totalBets),
    totalWagered: parseFloat(Number(r.totalWagered).toFixed(2)),
    totalWon: parseFloat(Number(r.totalWon).toFixed(2)),
    houseProfit: parseFloat((Number(r.totalWagered) - Number(r.totalWon)).toFixed(2)),
    houseEdge: Number(r.totalWagered) > 0
      ? parseFloat(((1 - Number(r.totalWon) / Number(r.totalWagered)) * 100).toFixed(1))
      : 0,
  }));
}

export async function adminGetSuspiciousActivity(opts: { page?: number; limit?: number; onlyOpen?: boolean }) {
  const { page = 1, limit = 50, onlyOpen = false } = opts;
  const offset = (page - 1) * limit;

  const rows = await db.select({
    id: suspiciousActivity.id,
    userId: suspiciousActivity.userId,
    username: users.username,
    type: suspiciousActivity.type,
    details: suspiciousActivity.details,
    severity: suspiciousActivity.severity,
    dismissed: suspiciousActivity.dismissed,
    createdAt: suspiciousActivity.createdAt,
  })
    .from(suspiciousActivity)
    .innerJoin(users, eq(suspiciousActivity.userId, users.id))
    .where(onlyOpen ? eq(suspiciousActivity.dismissed, 0) : undefined)
    .orderBy(desc(suspiciousActivity.id))
    .limit(limit)
    .offset(offset);

  const countRows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(suspiciousActivity)
    .where(onlyOpen ? eq(suspiciousActivity.dismissed, 0) : undefined);

  return { rows, total: Number(countRows[0]?.count ?? 0) };
}

export async function adminDismissFlag(id: number) {
  await db.update(suspiciousActivity).set({ dismissed: 1 }).where(eq(suspiciousActivity.id, id));
}

export async function logSuspiciousActivity(
  userId: number,
  type: string,
  details: Record<string, unknown>,
  severity: "low" | "medium" | "high" = "medium",
) {
  // Avoid duplicate flags of same type for same user in last hour
  const oneHourAgo = new Date(Date.now() - 3600_000);
  const existing = await db.select({ id: suspiciousActivity.id })
    .from(suspiciousActivity)
    .where(
      and(
        eq(suspiciousActivity.userId, userId),
        eq(suspiciousActivity.type, type),
        gt(suspiciousActivity.createdAt, oneHourAgo),
        eq(suspiciousActivity.dismissed, 0),
      ),
    )
    .limit(1);
  if (existing.length > 0) return;

  await db.insert(suspiciousActivity).values({
    userId,
    type,
    details: JSON.stringify(details),
    severity,
  });
}

export async function checkSuspiciousWins(userId: number, gameName: string) {
  // Check last 10 transactions for consecutive wins
  const recent = await db.select({ type: transactions.type })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), sql`${transactions.type} IN ('bet','win')`))
    .orderBy(desc(transactions.id))
    .limit(20);

  let consecutiveWins = 0;
  for (const tx of recent) {
    if (tx.type === "win") consecutiveWins++;
    else if (tx.type === "bet") break;
  }

  // Count pairs (bet+win) for consecutive wins
  let pairs = 0; let lastWasWin = false;
  for (const tx of recent) {
    if (tx.type === "win") { lastWasWin = true; }
    else if (tx.type === "bet" && lastWasWin) { pairs++; lastWasWin = false; }
    else { lastWasWin = false; }
  }

  if (pairs >= 10) {
    await logSuspiciousActivity(userId, "consecutive_wins", { game: gameName, consecutiveWins: pairs }, "high");
  }
}

export async function checkFastBetting(userId: number) {
  const thirtySecsAgo = new Date(Date.now() - 30_000);
  const recentBets = await db.select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, "bet"),
      gt(transactions.createdAt, thirtySecsAgo),
    ));

  const count = Number(recentBets[0]?.count ?? 0);
  if (count >= 15) {
    await logSuspiciousActivity(userId, "fast_betting", { betsIn30Secs: count }, "high");
  }
}

export async function checkLargeBalanceJump(userId: number, before: number, after: number) {
  const jump = after - before;
  if (jump > 500) {
    await logSuspiciousActivity(userId, "large_balance_jump", { before, after, jump }, "medium");
  }
}

export async function checkMultiAccount(ip: string, userId: number) {
  if (!ip) return;
  const rows = await db.select({ id: users.id })
    .from(users)
    .where(and(eq(users.lastIp, ip), ne(users.id, userId)))
    .limit(5);
  if (rows.length >= 2) {
    await logSuspiciousActivity(userId, "multi_account", { ip, otherAccountCount: rows.length }, "high");
  }
}

export async function setUserLastIp(userId: number, ip: string) {
  await db.update(users).set({ lastIp: ip }).where(eq(users.id, userId));
}

export async function submitBugReport(data: {
  userId: number; username: string; email: string;
  title: string; category: string; description: string;
  attachments: string[]; videoUrl?: string;
}) {
  const result = await db.insert(bugReports).values({
    userId: data.userId,
    username: data.username,
    email: data.email,
    title: data.title,
    category: data.category,
    description: data.description,
    attachments: JSON.stringify(data.attachments),
    videoUrl: data.videoUrl ?? null,
  }).returning({ id: bugReports.id });
  return result[0].id;
}

export async function adminGetBugReports(opts: { page?: number; limit?: number; status?: string }) {
  const { page = 1, limit = 50, status } = opts;
  const offset = (page - 1) * limit;

  const where = status && status !== "all" ? eq(bugReports.status, status as any) : undefined;

  const rows = await db.select().from(bugReports)
    .where(where)
    .orderBy(desc(bugReports.createdAt))
    .limit(limit).offset(offset);

  const countRows = await db.select({ count: sql<number>`COUNT(*)` }).from(bugReports).where(where);

  return {
    rows: rows.map(r => ({ ...r, attachments: JSON.parse(r.attachments ?? "[]") as string[] })),
    total: Number(countRows[0]?.count ?? 0),
  };
}

export async function adminResolveBugReport(id: number, status: string, adminNote?: string) {
  await db.update(bugReports)
    .set({ status: status as any, adminNote: adminNote ?? null })
    .where(eq(bugReports.id, id));
}

// ── Chat ────────────────────────────────────────────────────────────────────

export async function getChatMessages(limit = 60) {
  const rows = await db.select().from(chatMessages)
    .orderBy(desc(chatMessages.id)).limit(limit);
  return rows.reverse();
}

export async function sendChatMessage(userId: number, username: string, text: string) {
  const muted = await isUserChatMuted(userId);
  if (muted) throw new Error("You are muted from chat.");
  const twoSecsAgo = new Date(Date.now() - 2000);
  const recent = await db.select({ id: chatMessages.id }).from(chatMessages)
    .where(and(eq(chatMessages.userId, userId), gt(chatMessages.createdAt, twoSecsAgo)))
    .limit(1);
  if (recent.length > 0) throw new Error("Slow down — 1 message every 2 seconds.");
  await db.insert(chatMessages).values({ userId, username, text });
}

// ── Contact submissions ──────────────────────────────────────────────────────

export async function submitContact(data: {
  firstName: string; lastName: string; email: string; subject: string; message: string;
}) {
  await db.insert(contactSubmissions).values(data);
}

export async function adminGetContactSubmissions(opts: { page?: number; limit?: number; status?: string }) {
  const { page = 1, limit = 50, status } = opts;
  const offset = (page - 1) * limit;
  const where = status && status !== "all" ? eq(contactSubmissions.status, status as any) : undefined;
  const rows = await db.select().from(contactSubmissions).where(where)
    .orderBy(desc(contactSubmissions.createdAt)).limit(limit).offset(offset);
  const countRows = await db.select({ count: sql<number>`COUNT(*)` }).from(contactSubmissions).where(where);
  return { rows, total: Number(countRows[0]?.count ?? 0) };
}

export async function adminUpdateContactStatus(id: number, status: string) {
  await db.update(contactSubmissions).set({ status: status as any }).where(eq(contactSubmissions.id, id));
}

export async function adminBugAwardXp(id: number, xpAmount: number) {
  const report = await db.select().from(bugReports).where(eq(bugReports.id, id)).limit(1);
  if (!report[0]) throw new Error("Report not found");
  if (report[0].xpAwarded > 0) throw new Error("XP already awarded for this report");
  await adminAwardXp(report[0].userId, xpAmount);
  await db.update(bugReports).set({ xpAwarded: xpAmount }).where(eq(bugReports.id, id));
}

// ── Audit Log ────────────────────────────────────────────────────────────────

export async function adminLog(adminId: number, adminUsername: string, action: string, details: string, targetUserId?: number, targetUsername?: string) {
  await db.insert(adminLogs).values({ adminId, adminUsername, action, details, targetUserId: targetUserId ?? null, targetUsername: targetUsername ?? null });
}

export async function adminGetLogs(opts: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = opts;
  const offset = (page - 1) * limit;
  const rows = await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(limit).offset(offset);
  const countRows = await db.select({ count: sql<number>`COUNT(*)` }).from(adminLogs);
  return { rows, total: Number(countRows[0]?.count ?? 0) };
}

// ── Site Config ──────────────────────────────────────────────────────────────

export async function getSiteConfig(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteConfig);
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function setSiteConfig(key: string, value: string) {
  await db.insert(siteConfig).values({ key, value })
    .onConflictDoUpdate({ target: siteConfig.key, set: { value, updatedAt: new Date() } });
}

// ── Game Toggles ─────────────────────────────────────────────────────────────

export async function getGameToggles(): Promise<Record<string, boolean>> {
  const rows = await db.select().from(gameToggles);
  return Object.fromEntries(rows.map(r => [r.gameId, r.enabled === 1]));
}

export async function setGameToggle(gameId: string, enabled: boolean) {
  await db.insert(gameToggles).values({ gameId, enabled: enabled ? 1 : 0 })
    .onConflictDoUpdate({ target: gameToggles.gameId, set: { enabled: enabled ? 1 : 0, updatedAt: new Date() } });
}

// ── User Notes ───────────────────────────────────────────────────────────────

export async function adminAddUserNote(userId: number, adminId: number, adminUsername: string, note: string) {
  await db.insert(userNotes).values({ userId, adminId, adminUsername, note });
}

export async function adminGetUserNotes(userId: number) {
  return db.select().from(userNotes).where(eq(userNotes.userId, userId)).orderBy(desc(userNotes.createdAt));
}

export async function adminDeleteUserNote(id: number) {
  await db.delete(userNotes).where(eq(userNotes.id, id));
}

// ── Chat Moderation ──────────────────────────────────────────────────────────

export async function adminGetAllChatMessages(opts: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = opts;
  const offset = (page - 1) * limit;
  const rows = await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).limit(limit).offset(offset);
  const countRows = await db.select({ count: sql<number>`COUNT(*)` }).from(chatMessages);
  return { rows, total: Number(countRows[0]?.count ?? 0) };
}

export async function adminDeleteChatMessage(id: number) {
  await db.delete(chatMessages).where(eq(chatMessages.id, id));
}

export async function adminMuteUser(userId: number, hours: number) {
  const until = hours > 0 ? Math.floor(Date.now() / 1000) + hours * 3600 : null;
  await db.update(users).set({ chatMuted: 1, chatMutedUntil: until } as any).where(eq(users.id, userId));
}

export async function adminUnmuteUser(userId: number) {
  await db.update(users).set({ chatMuted: 0, chatMutedUntil: null } as any).where(eq(users.id, userId));
}

export async function isUserChatMuted(userId: number): Promise<boolean> {
  const row = await db.select({ chatMuted: sql<number>`chatMuted`, chatMutedUntil: sql<number>`chatMutedUntil` })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!row[0]) return false;
  const { chatMuted, chatMutedUntil } = row[0];
  if (!chatMuted) return false;
  if (chatMutedUntil && chatMutedUntil < Math.floor(Date.now() / 1000)) {
    await adminUnmuteUser(userId);
    return false;
  }
  return true;
}

// ── Financial Stats ──────────────────────────────────────────────────────────

export async function adminGetFinancialStats() {
  // Per-game profit breakdown
  const gameRows = await db.select({
    game: transactions.game,
    wagered: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type}='bet' THEN ${transactions.amount} ELSE 0 END),0)`,
    won: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type}='win' THEN ${transactions.amount} ELSE 0 END),0)`,
    bets: sql<number>`COUNT(CASE WHEN ${transactions.type}='bet' THEN 1 END)`,
  }).from(transactions)
    .where(sql`${transactions.game} IS NOT NULL`)
    .groupBy(transactions.game)
    .orderBy(sql`wagered DESC`)
    .limit(50);

  const games = gameRows.map(r => ({
    game: r.game ?? "unknown",
    wagered: parseFloat(Number(r.wagered).toFixed(2)),
    won: parseFloat(Number(r.won).toFixed(2)),
    profit: parseFloat((Number(r.wagered) - Number(r.won)).toFixed(2)),
    bets: Number(r.bets),
    edge: Number(r.wagered) > 0 ? parseFloat(((1 - Number(r.won) / Number(r.wagered)) * 100).toFixed(1)) : 0,
  }));

  // Daily profit for last 30 days
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
  const dailyRows = await db.select({
    day: sql<string>`date(datetime(${transactions.createdAt}, 'unixepoch'))`,
    wagered: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type}='bet' THEN ${transactions.amount} ELSE 0 END),0)`,
    won: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type}='win' THEN ${transactions.amount} ELSE 0 END),0)`,
  }).from(transactions)
    .where(sql`${transactions.createdAt} >= ${thirtyDaysAgo}`)
    .groupBy(sql`day`)
    .orderBy(sql`day ASC`);

  const daily = dailyRows.map(r => ({
    day: r.day,
    wagered: parseFloat(Number(r.wagered).toFixed(2)),
    won: parseFloat(Number(r.won).toFixed(2)),
    profit: parseFloat((Number(r.wagered) - Number(r.won)).toFixed(2)),
  }));

  return { games, daily };
}
