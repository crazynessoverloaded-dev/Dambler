import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";
import { createUser, createWallet, getUserByEmail, getUserByReferralCode, getUserByUsername, touchLastSignedIn } from "../db";
import { getJwtSecret } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

async function signJwt(userId: number) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(getJwtSecret());
}

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    return {
      id: ctx.user.id,
      username: ctx.user.username,
      email: ctx.user.email,
      role: ctx.user.role,
    };
  }),

  register: publicProcedure
    .input(z.object({
      username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      referralCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (await getUserByEmail(input.email)) {
        throw new TRPCError({ code: "CONFLICT", message: "That email is already registered" });
      }
      if (await getUserByUsername(input.username)) {
        throw new TRPCError({ code: "CONFLICT", message: "That username is already taken" });
      }

      // Resolve referral code → referrer userId
      let referredBy: number | undefined;
      if (input.referralCode) {
        const referrer = await getUserByReferralCode(input.referralCode);
        if (referrer) referredBy = referrer.id;
        // silently ignore invalid codes — don't block registration
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const userId = await createUser({ username: input.username, email: input.email, passwordHash, referredBy });
      await createWallet(userId);

      const jwt = await signJwt(userId);
      const opts = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, jwt, { ...opts, maxAge: ONE_YEAR_MS });

      return { success: true as const, username: input.username };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      await touchLastSignedIn(user.id);

      const jwt = await signJwt(user.id);
      const opts = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, jwt, { ...opts, maxAge: ONE_YEAR_MS });

      return { success: true as const, username: user.username };
    }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...opts, maxAge: -1 });
    return { success: true as const };
  }),
});
