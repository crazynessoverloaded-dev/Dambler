import { z } from "zod";
import bcrypt from "bcryptjs";
import { adminProcedure, router } from "../_core/trpc";
import {
  adminGetAllUsers,
  adminGetAllTransactions,
  adminGetDashboardStats,
  adminGetGameStats,
  adminGetSuspiciousActivity,
  adminDismissFlag,
  adminBanUser,
  adminUnbanUser,
  adminSetPassword,
  adminAwardXp,
  adminAdjustBalance,
  getUserById,
  createUser,
  db,
} from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const adminRouter = router({

  getDashboard: adminProcedure.query(async () => {
    return adminGetDashboardStats();
  }),

  getUsers: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return adminGetAllUsers({ ...input, onlyBanned: false });
    }),

  getBannedUsers: adminProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const result = await adminGetAllUsers({ ...input, onlyBanned: true });
      const frozenTotal = result.rows.reduce((s, r) => s + (r.balance ?? 0), 0);
      return { ...result, frozenTotal: parseFloat(frozenTotal.toFixed(2)) };
    }),

  getUserDetail: adminProcedure
    .input(z.object({ userId: z.number().int() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new Error("User not found");
      const walletRows = await db.select().from(wallets).where(eq(wallets.userId, input.userId)).limit(1);
      const wallet = walletRows[0] ?? null;
      const { rows: txRows } = await adminGetAllTransactions({ page: 1, limit: 30,
        search: undefined, game: undefined, type: undefined });
      const userTxs = txRows.filter(r => r.userId === input.userId);
      return { user, wallet, transactions: userTxs };
    }),

  banUser: adminProcedure
    .input(z.object({ userId: z.number().int(), reason: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await adminBanUser(input.userId, input.reason);
      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.number().int() }))
    .mutation(async ({ input }) => {
      await adminUnbanUser(input.userId);
      return { success: true };
    }),

  resetPassword: adminProcedure
    .input(z.object({ userId: z.number().int(), newPassword: z.string().min(6) }))
    .mutation(async ({ input }) => {
      const hash = await bcrypt.hash(input.newPassword, 10);
      await adminSetPassword(input.userId, hash);
      return { success: true };
    }),

  awardXp: adminProcedure
    .input(z.object({ userId: z.number().int(), amount: z.number().int().min(1) }))
    .mutation(async ({ input }) => {
      await adminAwardXp(input.userId, input.amount);
      return { success: true };
    }),

  adjustBalance: adminProcedure
    .input(z.object({ userId: z.number().int(), amount: z.number(), note: z.string().default("Admin adjustment") }))
    .mutation(async ({ input }) => {
      await adminAdjustBalance(input.userId, input.amount, input.note);
      return { success: true };
    }),

  getTransactions: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      game: z.string().optional(),
      type: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return adminGetAllTransactions(input);
    }),

  getSuspiciousActivity: adminProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
      onlyOpen: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      return adminGetSuspiciousActivity(input);
    }),

  dismissFlag: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await adminDismissFlag(input.id);
      return { success: true };
    }),

  getGameStats: adminProcedure.query(async () => {
    return adminGetGameStats();
  }),

  getAdmins: adminProcedure.query(async () => {
    return db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    }).from(users).where(eq(users.role, "admin"));
  }),

  createAdmin: adminProcedure
    .input(z.object({
      username: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const hash = await bcrypt.hash(input.password, 10);
      const id = await createUser({ username: input.username, email: input.email, passwordHash: hash, role: "admin" });
      return { success: true, id };
    }),

  removeAdmin: adminProcedure
    .input(z.object({ userId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.id === input.userId) throw new Error("Cannot remove yourself");
      await db.update(users).set({ role: "user" }).where(eq(users.id, input.userId));
      return { success: true };
    }),
});
