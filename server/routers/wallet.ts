import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adjustBalance, awardRoundXp, collectCommission, getAffiliateStats, getJackpotAmount, getLeaderboard, getLiveFeed, getLiveStats, getPublicStats, getRecentWins, getTopWagerersSince, getTransactionHistory, getUserStats, getWallet, getXpLeaderboard } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const walletRouter = router({
  balance: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await getWallet(ctx.user.id);
    return { balance: wallet?.balance ?? 0, currency: wallet?.currency ?? "DMB" };
  }),

  transactions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20), cursor: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return getTransactionHistory(ctx.user.id, input.limit, input.cursor);
    }),

  deposit: protectedProcedure
    .input(z.object({ amount: z.number().positive().max(1_000_000) }))
    .mutation(async ({ ctx, input }) => {
      const result = await adjustBalance(ctx.user.id, input.amount, "deposit", `Deposit of ${input.amount} DMB`);
      return { balance: result.after, currency: result.currency };
    }),

  withdraw: protectedProcedure
    .input(z.object({ amount: z.number().positive().max(500_000) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await adjustBalance(ctx.user.id, -input.amount, "withdrawal", `Withdrawal of ${input.amount} DMB`);
        return { balance: result.after, currency: result.currency };
      } catch (err: any) {
        if (err.message === "Insufficient balance") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
        }
        throw err;
      }
    }),

  placeBet: protectedProcedure
    .input(z.object({ amount: z.number().positive(), game: z.string(), referenceId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await adjustBalance(ctx.user.id, -input.amount, "bet", `Bet on ${input.game}`, input.game, input.referenceId);
        // Award XP for completing a round — rate-limited server-side to prevent spam
        const xp = await awardRoundXp(ctx.user.id);
        return { balance: result.after, currency: result.currency, xp };
      } catch (err: any) {
        if (err.message === "Insufficient balance") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance to place bet" });
        }
        throw err;
      }
    }),

  creditWin: protectedProcedure
    .input(z.object({ amount: z.number().positive(), game: z.string(), referenceId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const result = await adjustBalance(ctx.user.id, input.amount, "win", `Win on ${input.game}`, input.game, input.referenceId);
      return { balance: result.after, currency: result.currency };
    }),

  leaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      return getLeaderboard(input?.limit ?? 20);
    }),

  recentWins: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      return getRecentWins(input?.limit ?? 20);
    }),

  liveFeed: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      return getLiveFeed(input?.limit ?? 20);
    }),

  jackpot: publicProcedure.query(async () => {
    return { amount: await getJackpotAmount() };
  }),

  topWagerers: publicProcedure
    .input(z.object({ since: z.number().optional(), limit: z.number().min(1).max(20).default(20) }).optional())
    .query(async ({ input }) => {
      return getTopWagerersSince(input?.since, input?.limit ?? 20);
    }),

  liveStats: publicProcedure.query(async () => {
    return getLiveStats();
  }),

  publicStats: publicProcedure.query(async () => {
    return getPublicStats();
  }),

  xpLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ input }) => {
      return getXpLeaderboard(input?.limit ?? 50);
    }),

  myXp: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await getWallet(ctx.user.id);
    return { xp: wallet?.xp ?? 0 };
  }),

  myStats: protectedProcedure.query(async ({ ctx }) => {
    return getUserStats(ctx.user.id);
  }),

  affiliateStats: protectedProcedure.query(async ({ ctx }) => {
    return getAffiliateStats(ctx.user.id);
  }),

  collectCommission: protectedProcedure.mutation(async ({ ctx }) => {
    const collected = await collectCommission(ctx.user.id);
    return { collected };
  }),
});
