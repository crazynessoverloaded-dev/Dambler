import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { submitBugReport } from "../db";

export const bugReportRouter = router({
  submit: protectedProcedure
    .input(z.object({
      title: z.string().min(5).max(120),
      category: z.enum(["bug", "payment", "account", "game", "other"]),
      description: z.string().min(20).max(2000),
      attachments: z.array(z.string()).max(3),
      videoUrl: z.string().url().optional().or(z.literal("")),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await submitBugReport({
        userId: ctx.user.id,
        username: ctx.user.username,
        email: ctx.user.email,
        title: input.title,
        category: input.category,
        description: input.description,
        attachments: input.attachments,
        videoUrl: input.videoUrl || undefined,
      });
      return { success: true, id };
    }),
});
