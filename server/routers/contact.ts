import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { submitContact } from "../db";

export const contactRouter = router({
  submit: publicProcedure
    .input(z.object({
      firstName: z.string().min(1).max(60),
      lastName: z.string().min(1).max(60),
      email: z.string().email(),
      subject: z.string().min(2).max(120),
      message: z.string().min(10).max(2000),
    }))
    .mutation(async ({ input }) => {
      await submitContact(input);
      return { success: true };
    }),
});
