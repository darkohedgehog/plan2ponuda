import { z } from "zod";

const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value.length > 0 ? value : null));

const optionalEmailSchema = z
  .string()
  .trim()
  .max(120)
  .refine(
    (value) => value.length === 0 || z.string().email().safeParse(value).success,
    {
      message: "Enter a valid email address.",
    },
  )
  .transform((value) => (value.length > 0 ? value : null));

export const updateSettingsSchema = z.object({
  companyAddress: optionalTextSchema(240),
  companyCity: optionalTextSchema(120),
  companyCountry: optionalTextSchema(120),
  companyEmail: optionalEmailSchema,
  companyName: optionalTextSchema(120),
  companyPhone: optionalTextSchema(60),
  companyTaxId: optionalTextSchema(80),
  currency: z.string().trim().min(1).max(12),
  fullName: optionalTextSchema(120),
  laborFactor: z.number().finite().positive().max(9999),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
