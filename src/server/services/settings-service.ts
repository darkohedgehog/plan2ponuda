import "server-only";

import type {
  User as DbUser,
  UserSettings as DbUserSettings,
} from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { UpdateSettingsInput } from "@/lib/validations/settings.schema";
import type { UserSettingsProfile } from "@/types/settings";

export const DEFAULT_LABOR_FACTOR = 12;
export const DEFAULT_CURRENCY = "EUR";

type DbUserWithSettings = Pick<
  DbUser,
  "companyName" | "email" | "fullName"
> & {
  settings: Pick<
    DbUserSettings,
    | "companyAddress"
    | "companyCity"
    | "companyCountry"
    | "companyEmail"
    | "companyPhone"
    | "companyTaxId"
    | "currency"
    | "laborFactor"
  > | null;
};

type UserSettingsReadClient = Pick<typeof prisma, "userSettings">;

function mapSettingsProfile(user: DbUserWithSettings): UserSettingsProfile {
  return {
    companyAddress: user.settings?.companyAddress ?? undefined,
    companyCity: user.settings?.companyCity ?? undefined,
    companyCountry: user.settings?.companyCountry ?? undefined,
    companyEmail: user.settings?.companyEmail ?? undefined,
    companyName: user.companyName ?? undefined,
    companyPhone: user.settings?.companyPhone ?? undefined,
    companyTaxId: user.settings?.companyTaxId ?? undefined,
    currency: user.settings?.currency ?? DEFAULT_CURRENCY,
    email: user.email,
    fullName: user.fullName ?? undefined,
    laborFactor: (
      user.settings?.laborFactor ?? new Prisma.Decimal(DEFAULT_LABOR_FACTOR)
    ).toString(),
  };
}

export async function getUserSettings(
  userId: string,
): Promise<UserSettingsProfile | null> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      companyName: true,
      email: true,
      fullName: true,
      settings: {
        select: {
          companyAddress: true,
          companyCity: true,
          companyCountry: true,
          companyEmail: true,
          companyPhone: true,
          companyTaxId: true,
          currency: true,
          laborFactor: true,
        },
      },
    },
  });

  return user ? mapSettingsProfile(user) : null;
}

export async function getUserLaborFactor(
  userId: string,
  db: UserSettingsReadClient = prisma,
): Promise<Prisma.Decimal> {
  const settings = await db.userSettings.findUnique({
    where: {
      userId,
    },
    select: {
      laborFactor: true,
    },
  });

  return settings?.laborFactor ?? new Prisma.Decimal(DEFAULT_LABOR_FACTOR);
}

export async function updateUserSettings(
  userId: string,
  input: UpdateSettingsInput,
): Promise<UserSettingsProfile | null> {
  const user = await prisma.$transaction(async (transaction) => {
    const existingUser = await transaction.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      return null;
    }

    await transaction.user.update({
      where: {
        id: userId,
      },
      data: {
        companyName: input.companyName,
        fullName: input.fullName,
      },
    });

    await transaction.userSettings.upsert({
      where: {
        userId,
      },
      update: {
        companyAddress: input.companyAddress,
        companyCity: input.companyCity,
        companyCountry: input.companyCountry,
        companyEmail: input.companyEmail,
        companyPhone: input.companyPhone,
        companyTaxId: input.companyTaxId,
        currency: input.currency,
        laborFactor: new Prisma.Decimal(input.laborFactor).toDecimalPlaces(2),
      },
      create: {
        companyAddress: input.companyAddress,
        companyCity: input.companyCity,
        companyCountry: input.companyCountry,
        companyEmail: input.companyEmail,
        companyPhone: input.companyPhone,
        companyTaxId: input.companyTaxId,
        currency: input.currency,
        laborFactor: new Prisma.Decimal(input.laborFactor).toDecimalPlaces(2),
        userId,
      },
    });

    return transaction.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        companyName: true,
        email: true,
        fullName: true,
        settings: {
          select: {
            companyAddress: true,
            companyCity: true,
            companyCountry: true,
            companyEmail: true,
            companyPhone: true,
            companyTaxId: true,
            currency: true,
            laborFactor: true,
          },
        },
      },
    });
  });

  return user ? mapSettingsProfile(user) : null;
}
