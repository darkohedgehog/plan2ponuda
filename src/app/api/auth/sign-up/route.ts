import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { getPrismaClient } from "@/lib/db/prisma";
import { signUpSchema } from "@/lib/validations/auth.schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const input = signUpSchema.parse(body);
    const email = normalizeEmail(input.email);
    const prisma = getPrismaClient();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email,
        name: input.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid sign up payload." },
        { status: 400 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 },
    );
  }
}
