import { z } from "zod";

export const deleteAccountRequestSchema = z.object({
  confirmationEmail: z.string().min(1).max(254).email(),
  confirmPermanentDeletion: z.literal(true),
});

export type DeleteAccountRequestInput = z.infer<
  typeof deleteAccountRequestSchema
>;
