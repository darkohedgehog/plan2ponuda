import { z } from "zod";

const MONEY_INPUT_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;
const MAX_MONEY_CENTS = 99999999;

function normalizeMoneyInput(value: string): string {
  const [wholePart, fractionPart = ""] = value.replace(",", ".").split(".");
  const normalizedWholePart = wholePart.replace(/^0+(?=\d)/, "") || "0";

  return `${normalizedWholePart}.${fractionPart.padEnd(2, "0")}`;
}

function isMoneyInputInRange(value: string): boolean {
  const normalizedValue = normalizeMoneyInput(value);
  const [wholePart, fractionPart = "00"] = normalizedValue.split(".");
  const cents =
    Number(wholePart) * 100 + Number(fractionPart.padEnd(2, "0"));

  return cents <= MAX_MONEY_CENTS;
}

const moneyInputSchema = z
  .string()
  .trim()
  .min(1)
  .regex(MONEY_INPUT_PATTERN)
  .refine(isMoneyInputInRange)
  .transform(normalizeMoneyInput);

export const materialIdSchema = z.object({
  materialId: z.string().min(1),
});

export const updateMaterialSchema = z.object({
  defaultPrice: moneyInputSchema,
});

export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
