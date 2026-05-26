import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { walletRouter } from "./routers/wallet";
import { systemRouter } from "./_core/systemRouter";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  wallet: walletRouter,
});

export type AppRouter = typeof appRouter;
