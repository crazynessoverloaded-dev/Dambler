import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { walletRouter } from "./routers/wallet";
import { systemRouter } from "./_core/systemRouter";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  wallet: walletRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
