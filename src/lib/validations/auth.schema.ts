import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const signUpSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(1).max(120).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
  token: z.string().trim().min(32).max(256),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
