import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  referralCode: text("referralCode").unique(),
  referredBy: integer("referredBy"),         // userId of whoever referred this user
  referralBonusAwarded: integer("referralBonusAwarded").notNull().default(0), // 1 once signup bonus fires
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;

export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  balance: real("balance").notNull().default(0),
  currency: text("currency").notNull().default("DMB"),
  totalWagered: real("totalWagered").notNull().default(0),
  totalWon: real("totalWon").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  lastXpAt: integer("lastXpAt").notNull().default(0),
  pendingCommissionXp: real("pendingCommissionXp").notNull().default(0), // float; collected as integer
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Wallet = typeof wallets.$inferSelect;

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  type: text("type", { enum: ["deposit", "withdrawal", "bet", "win", "bonus", "refund"] }).notNull(),
  amount: real("amount").notNull(),
  balanceBefore: real("balanceBefore").notNull(),
  balanceAfter: real("balanceAfter").notNull(),
  game: text("game"),
  description: text("description"),
  referenceId: text("referenceId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Transaction = typeof transactions.$inferSelect;
