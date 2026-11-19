import z from "zod";

export const CountNewFeedbackSchema = z.object({
  projectId: z.string(),
});

export type CountNewFeedbackInput = z.infer<typeof CountNewFeedbackSchema>;
