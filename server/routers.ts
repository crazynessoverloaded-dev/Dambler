import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { walletRouter } from "./routers/wallet";
import { systemRouter } from "./_core/systemRouter";
import { adminRouter } from "./routers/admin";
import { bugReportRouter } from "./routers/bugReport";
import { chatRouter } from "./routers/chat";
import { contactRouter } from "./routers/contact";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  wallet: walletRouter,
  admin: adminRouter,
  bugReport: bugReportRouter,
  chat: chatRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
