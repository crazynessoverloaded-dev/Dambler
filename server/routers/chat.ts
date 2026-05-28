import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getChatMessages, sendChatMessage } from "../db";

export const chatRouter = router({
  getMessages: publicProcedure.query(async () => {
    return getChatMessages(60);
  }),

  send: protectedProcedure
    .input(z.object({ text: z.string().min(1).max(200) }))
    .mutation(async ({ input, ctx }) => {
      await sendChatMessage(ctx.user.id, ctx.user.username, input.text.trim());
      return { success: true };
    }),
});
