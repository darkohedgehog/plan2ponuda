import { Prisma } from "../../../generated/prisma/client";

import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import type { SignUpInput } from "@/lib/validations/auth.schema";
import type { SignUpResponse } from "@/types/auth";

export async function createUserWithPassword(
  input: SignUpInput,
): Promise<SignUpResponse> {
  const email = normalizeEmail(input.email);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      ok: false,
      error: {
        code: "email_already_exists",
        message: "An account with this email already exists.",
      },
    };
  }

  try {
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email,
        fullName: input.fullName,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    return {
      ok: true,
      user,
    };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: {
          code: "email_already_exists",
          message: "An account with this email already exists.",
        },
      };
    }

    throw error;
  }
}
