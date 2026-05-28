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
  adminGetBugReports,
  adminResolveBugReport,
  adminBugAwardXp,
  adminGetContactSubmissions,
  adminUpdateContactStatus,
  adminLog,
  adminGetLogs,
  getSiteConfig,
  setSiteConfig,
  getGameToggles,
  setGameToggle,
  adminAddUserNote,
  adminGetUserNotes,
  adminDeleteUserNote,
  adminGetAllChatMessages,
  adminDeleteChatMessage,
  adminMuteUser,
  adminUnmuteUser,
  adminGetFinancialStats,
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
    .input(z.object({ userId: z.number().int(), username: z.string().default(""), reason: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      await adminBanUser(input.userId, input.reason);
      await adminLog(ctx.user.id, ctx.user.username, "BAN_USER", input.reason, input.userId, input.username);
      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.number().int(), username: z.string().default("") }))
    .mutation(async ({ input, ctx }) => {
      await adminUnbanUser(input.userId);
      await adminLog(ctx.user.id, ctx.user.username, "UNBAN_USER", "", input.userId, input.username);
      return { success: true };
    }),

  resetPassword: adminProcedure
    .input(z.object({ userId: z.number().int(), username: z.string().default(""), newPassword: z.string().min(6) }))
    .mutation(async ({ input, ctx }) => {
      const hash = await bcrypt.hash(input.newPassword, 10);
      await adminSetPassword(input.userId, hash);
      await adminLog(ctx.user.id, ctx.user.username, "RESET_PASSWORD", "", input.userId, input.username);
      return { success: true };
    }),

  awardXp: adminProcedure
    .input(z.object({ userId: z.number().int(), username: z.string().default(""), amount: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      await adminAwardXp(input.userId, input.amount);
      await adminLog(ctx.user.id, ctx.user.username, "ADJUST_XP", `${input.amount > 0 ? "+" : ""}${input.amount}`, input.userId, input.username);
      return { success: true };
    }),

  adjustBalance: adminProcedure
    .input(z.object({ userId: z.number().int(), username: z.string().default(""), amount: z.number(), note: z.string().default("Admin adjustment") }))
    .mutation(async ({ input, ctx }) => {
      await adminAdjustBalance(input.userId, input.amount, input.note);
      await adminLog(ctx.user.id, ctx.user.username, "ADJUST_BALANCE", `${input.amount > 0 ? "+" : ""}${input.amount} DMB — ${input.note}`, input.userId, input.username);
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

  getBugReports: adminProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return adminGetBugReports(input);
    }),

  resolveBugReport: adminProcedure
    .input(z.object({
      id: z.number().int(),
      status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
      adminNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await adminResolveBugReport(input.id, input.status, input.adminNote);
      return { success: true };
    }),

  awardBugXp: adminProcedure
    .input(z.object({ id: z.number().int(), xpAmount: z.number().int().min(1) }))
    .mutation(async ({ input }) => {
      await adminBugAwardXp(input.id, input.xpAmount);
      return { success: true };
    }),

  getContactSubmissions: adminProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return adminGetContactSubmissions(input);
    }),

  updateContactStatus: adminProcedure
    .input(z.object({
      id: z.number().int(),
      status: z.enum(["new", "read", "resolved"]),
    }))
    .mutation(async ({ input }) => {
      await adminUpdateContactStatus(input.id, input.status);
      return { success: true };
    }),

  // ── Audit Log ──────────────────────────────────────────────────────────────
  getAuditLog: adminProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ input }) => adminGetLogs(input)),

  // ── Site Config ────────────────────────────────────────────────────────────
  getSiteConfig: adminProcedure.query(async () => getSiteConfig()),

  setSiteConfig: adminProcedure
    .input(z.object({ key: z.string().min(1), value: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await setSiteConfig(input.key, input.value);
      await adminLog(ctx.user.id, ctx.user.username, "SET_CONFIG", `${input.key} = ${input.value}`);
      return { success: true };
    }),

  // ── Game Toggles ───────────────────────────────────────────────────────────
  getGameToggles: adminProcedure.query(async () => getGameToggles()),

  setGameToggle: adminProcedure
    .input(z.object({ gameId: z.string().min(1), enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await setGameToggle(input.gameId, input.enabled);
      await adminLog(ctx.user.id, ctx.user.username, "GAME_TOGGLE", `${input.gameId} → ${input.enabled ? "ON" : "OFF"}`);
      return { success: true };
    }),

  // ── User Notes ─────────────────────────────────────────────────────────────
  getUserNotes: adminProcedure
    .input(z.object({ userId: z.number().int() }))
    .query(async ({ input }) => adminGetUserNotes(input.userId)),

  addUserNote: adminProcedure
    .input(z.object({ userId: z.number().int(), targetUsername: z.string(), note: z.string().min(1).max(500) }))
    .mutation(async ({ input, ctx }) => {
      await adminAddUserNote(input.userId, ctx.user.id, ctx.user.username, input.note);
      await adminLog(ctx.user.id, ctx.user.username, "ADD_NOTE", input.note, input.userId, input.targetUsername);
      return { success: true };
    }),

  deleteUserNote: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      await adminDeleteUserNote(input.id);
      await adminLog(ctx.user.id, ctx.user.username, "DELETE_NOTE", `Note #${input.id}`);
      return { success: true };
    }),

  // ── Chat Moderation ────────────────────────────────────────────────────────
  getChatMessages: adminProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ input }) => adminGetAllChatMessages(input)),

  deleteChatMessage: adminProcedure
    .input(z.object({ id: z.number().int(), username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await adminDeleteChatMessage(input.id);
      await adminLog(ctx.user.id, ctx.user.username, "DELETE_MSG", `Message #${input.id} from ${input.username}`);
      return { success: true };
    }),

  muteUser: adminProcedure
    .input(z.object({ userId: z.number().int(), username: z.string(), hours: z.number().int().min(0).max(720) }))
    .mutation(async ({ input, ctx }) => {
      await adminMuteUser(input.userId, input.hours);
      await adminLog(ctx.user.id, ctx.user.username, "MUTE_USER", `${input.hours}h`, input.userId, input.username);
      return { success: true };
    }),

  unmuteUser: adminProcedure
    .input(z.object({ userId: z.number().int(), username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await adminUnmuteUser(input.userId);
      await adminLog(ctx.user.id, ctx.user.username, "UNMUTE_USER", "", input.userId, input.username);
      return { success: true };
    }),

  // ── Financial Stats ────────────────────────────────────────────────────────
  getFinancialStats: adminProcedure.query(async () => adminGetFinancialStats()),
});
